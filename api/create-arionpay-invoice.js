const crypto = require("crypto");
const {
  PAYMENT_OPTIONS,
  SHIPPING_OPTIONS,
  calculateTotals,
  normalizeCustomer,
  normalizeItems,
  sanitizeReference,
  serializeItems,
  validateCustomer
} = require("./_catalog");
const { sendOrderCreatedEmails } = require("./_email");
const { saveOrder } = require("./_orders");

const PAYMENT_ASSETS = {
  USDT: { currency: "USDT", chain: "USDT_TRC20" },
  USDT_TRC20: { currency: "USDT", chain: "USDT_TRC20" },
  ETH: { currency: "ETH", chain: "ETH" },
  BTC: { currency: "BTC", chain: "BTC" }
};

function safeJsonParse(value) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function normalizeGatewayMessage(result, rawText) {
  if (result && typeof result === "object") {
    const directMessage = result.error || result.message || result.detail;
    if (typeof directMessage === "string" && directMessage.trim()) {
      return directMessage.trim();
    }
  }

  if (typeof rawText === "string" && rawText.trim()) {
    return rawText.trim();
  }

  return "ArionPay invoice creation failed.";
}

function extractInvoiceData(result) {
  if (!result || typeof result !== "object") {
    return {
      invoiceId: "",
      invoiceUrl: "",
      currency: ""
    };
  }

  const container = result.data && typeof result.data === "object"
    ? result.data
    : result;

  return {
    invoiceId: container.id || container.invoice_id || container.invoiceId || "",
    invoiceUrl: container.invoice_url || container.invoiceUrl || result.invoice_url || result.invoiceUrl || "",
    currency: container.currency || result.currency || ""
  };
}

function buildGatewayError(message, paymentMethod) {
  const method = paymentMethod || "selected payment method";
  const normalized = typeof message === "string" ? message.trim() : "";

  if (/just a moment/i.test(normalized) || /cf_chl_opt/i.test(normalized) || /enable javascript and cookies to continue/i.test(normalized)) {
    return {
      error: "ArionPay is still blocking automated invoice creation from the current server.",
      hint: "Their allowlist may not yet cover this environment. Confirm that the live deployment URL was allowlisted and try the invoice again.",
      gatewayMessage: "Cloudflare challenge page returned by api.arionpay.com"
    };
  }

  if (/payment configuration missing/i.test(normalized)) {
    return {
      error: `ArionPay store setup is incomplete for ${method}.`,
      hint: "The invoice request is already using the expected asset/network code. In ArionPay, attach or reactivate the receiving wallet for this asset, save the store payment configuration again, and retry checkout.",
      gatewayMessage: normalized
    };
  }

  if (/not enabled\/available/i.test(normalized)) {
    return {
      error: `${method} is not enabled in your ArionPay store.`,
      hint: "Enable this asset under Store Settings > Accepted Currencies in ArionPay, then retry the checkout.",
      gatewayMessage: normalized
    };
  }

  return {
    error: normalized || "ArionPay invoice creation failed.",
    gatewayMessage: normalized || "ArionPay invoice creation failed."
  };
}

function parseBody(req) {
  if (!req.body) {
    return {};
  }

  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  return req.body;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ARIONPAY_API_KEY;
  const apiSecret = process.env.ARIONPAY_API_SECRET;
  const storeId = process.env.ARIONPAY_STORE_ID;
  const fiatCurrency = process.env.ARIONPAY_FIAT_CURRENCY || "EUR";

  if (!apiKey || !apiSecret || !storeId) {
    return res.status(500).json({
      error: "ArionPay is not configured on the server.",
      missing: [
        !apiKey && "ARIONPAY_API_KEY",
        !apiSecret && "ARIONPAY_API_SECRET",
        !storeId && "ARIONPAY_STORE_ID"
      ].filter(Boolean)
    });
  }

  const body = parseBody(req);
  const items = normalizeItems(body.items);
  const reference = sanitizeReference(body.reference);
  const customer = normalizeCustomer(body.customer);
  const missingCustomerFields = validateCustomer(customer);
  const paymentAsset = PAYMENT_ASSETS[body.paymentMethod] || PAYMENT_ASSETS.USDT_TRC20;
  const shippingMethod = typeof body.shippingMethod === "string" ? body.shippingMethod : "eu-standard";

  if (!items.length) {
    return res.status(400).json({ error: "Your cart is empty or contains unavailable products." });
  }

  if (missingCustomerFields.length) {
    return res.status(400).json({
      error: "Missing or invalid checkout fields.",
      missing: missingCustomerFields
    });
  }

  const totals = calculateTotals(items, shippingMethod);

  if (!(totals.total > 0)) {
    return res.status(400).json({ error: "The order total must be greater than zero." });
  }

  const payload = {
    storeId,
    amount: Number(totals.total.toFixed(2)),
    // ArionPay support confirmed the invoice payload must pair the asset code
    // with the exact receiving network string expected by their API.
    currency: paymentAsset.currency,
    orderId: reference,
    chain: paymentAsset.chain
  };

  // Attempt to provide ArionPay with return/redirect URLs so the hosted
  // payment page can send customers back to the storefront after payment.
  // Prefer an explicit env var, then fall back to request origin or host.
  try {
    const base = (process.env.SITE_BASE_URL || process.env.PUBLIC_SITE_URL || req.headers?.origin || (req.headers && `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`) || "").replace(/\/$/, "");
    if (base) {
      const successUrl = `${base}/?reference=${encodeURIComponent(reference)}`;
      const cancelUrl = `${base}/checkout.html?reference=${encodeURIComponent(reference)}`;

      // Include multiple common key names to increase compatibility with
      // different gateway expectations (snake_case and camelCase).
      payload.success_url = successUrl;
      payload.return_url = successUrl;
      payload.successUrl = successUrl;
      payload.returnUrl = successUrl;
      payload.cancel_url = cancelUrl;
      payload.cancelUrl = cancelUrl;
    }
  } catch (e) {
    // Non-fatal — proceed without return URLs if anything goes wrong here.
    console.warn("Could not compute return URL for ArionPay invoice:", e && e.message);
  }

  const payloadJson = JSON.stringify(payload);
  const signature = crypto
    .createHmac("sha256", apiSecret)
    .update(payloadJson)
    .digest("hex");

  let invoice;

  try {
    const response = await fetch("https://api.arionpay.com/api/v1/invoices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "x-signature": signature
      },
      body: payloadJson
    });

    const rawText = await response.text();
    const result = safeJsonParse(rawText) || {};
    invoice = extractInvoiceData(result);

    if (!response.ok || !invoice.invoiceUrl) {
      const gatewayMessage = normalizeGatewayMessage(result, rawText);
      const gatewayError = buildGatewayError(gatewayMessage, paymentAsset.chain);
      return res.status(502).json({
        error: gatewayError.error,
        hint: gatewayError.hint,
        detail: {
          statusCode: response.status,
          paymentMethod: paymentAsset.chain,
          requestPayload: payload,
          gatewayMessage: gatewayError.gatewayMessage,
          gatewayResponse: result && Object.keys(result).length ? result : rawText || null
        }
      });
    }
  } catch (error) {
    return res.status(502).json({
      error: "Unable to reach ArionPay.",
      detail: error instanceof Error ? error.message : "Unknown network error"
    });
  }

  const order = {
    reference,
    createdAt: new Date().toISOString(),
    status: "invoice_created",
    customer,
    items: serializeItems(items),
    shippingMethod,
    paymentMethod: paymentAsset.chain,
    subtotal: Number(totals.subtotal.toFixed(2)),
    shippingCost: Number(totals.shipping.toFixed(2)),
    total: Number(totals.total.toFixed(2)),
    invoiceId: invoice.invoiceId,
    invoiceUrl: invoice.invoiceUrl,
    storeCurrency: fiatCurrency,
    gatewayCurrency: invoice.currency || paymentAsset.currency
  };

  let notifications = null;

  try {
    saveOrder(order);
    notifications = await sendOrderCreatedEmails(order);

    // Persist notification delivery results on the stored order so webhook
    // handlers or admins can inspect whether customer/admin emails were
    // actually dispatched (useful when external email provider is missing
    // or returning errors).
    try {
      const orderWithNotifications = {
        ...order,
        notifications
      };
      saveOrder(orderWithNotifications);
    } catch (e) {
      console.warn("Failed to save order notifications:", e && e.message);
    }
  } catch (error) {
    console.warn("ArionPay invoice created, but local order post-processing failed.", error);
  }

  return res.status(200).json({
    reference,
    invoiceId: invoice.invoiceId,
    invoiceUrl: invoice.invoiceUrl,
    currency: invoice.currency || paymentAsset.currency,
    storeCurrency: fiatCurrency,
    subtotal: Number(totals.subtotal.toFixed(2)),
    shipping: Number(totals.shipping.toFixed(2)),
    total: Number(totals.total.toFixed(2)),
    paymentMethod: paymentAsset.chain,
    paymentLabel: (PAYMENT_OPTIONS[paymentAsset.chain] || PAYMENT_OPTIONS.USDT_TRC20).label,
    shippingLabel: (SHIPPING_OPTIONS[shippingMethod] || SHIPPING_OPTIONS["eu-standard"]).label,
    notifications
  });
};
