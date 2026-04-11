const crypto = require("crypto");

const PRODUCT_PRICES = {
  "tirzepatide-30mg": 55,
  "retatrutide-30mg": 60,
  "tb-500-20mg": 40,
  "bpc-157-10mg": 14,
  "ghk-cu-50mg": 13,
  "mots-c-40mg": 35,
  "melanotan-mt2-10mg": 14,
  "ss-31-50mg": 50,
  "nad-1000mg": 30,
  "semax-30mg": 20,
  "selank-10mg": 18
};

const SHIPPING_OPTIONS = {
  "eu-standard": { price: 12, freeEligible: true },
  "eu-express": { price: 18, freeEligible: true },
  international: { price: 24, freeEligible: false }
};

const FREE_SHIPPING_THRESHOLD = 200;
const ASSET_MAP = {
  USDT: "USDT_TRC20",
  USDT_TRC20: "USDT_TRC20",
  ETH: "ETH",
  BTC: "BTC"
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

function buildGatewayError(message, paymentMethod) {
  const method = paymentMethod || "selected payment method";
  const normalized = typeof message === "string" ? message.trim() : "";

  if (/payment configuration missing/i.test(normalized)) {
    return {
      error: `ArionPay store setup is incomplete for ${method}.`,
      hint: "Open your ArionPay store, attach or activate the receiving wallet for this asset, save the payment method configuration, and try checkout again.",
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

function sanitizeReference(value) {
  if (typeof value !== "string") {
    return `PP-${Date.now()}`;
  }

  const trimmed = value.trim().replace(/[^A-Za-z0-9_-]/g, "");
  return trimmed || `PP-${Date.now()}`;
}

function normalizeItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => {
      if (!item || typeof item.slug !== "string") {
        return null;
      }

      const price = PRODUCT_PRICES[item.slug];
      if (typeof price !== "number") {
        return null;
      }

      const quantity = Math.max(1, Math.min(99, Number(item.quantity) || 1));
      return { slug: item.slug, quantity, price };
    })
    .filter(Boolean);
}

function calculateTotals(items, shippingMethod) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const selectedShipping = SHIPPING_OPTIONS[shippingMethod] || SHIPPING_OPTIONS["eu-standard"];
  const shipping = selectedShipping.freeEligible && subtotal >= FREE_SHIPPING_THRESHOLD
    ? 0
    : selectedShipping.price;

  return {
    subtotal,
    shipping,
    total: subtotal + shipping
  };
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
  const chain = ASSET_MAP[body.paymentMethod] || "USDT_TRC20";
  const shippingMethod = typeof body.shippingMethod === "string" ? body.shippingMethod : "eu-standard";

  if (!items.length) {
    return res.status(400).json({ error: "Your cart is empty or contains unavailable products." });
  }

  const totals = calculateTotals(items, shippingMethod);

  if (!(totals.total > 0)) {
    return res.status(400).json({ error: "The order total must be greater than zero." });
  }

  const payload = {
    storeId,
    amount: Number(totals.total.toFixed(2)),
    currency: fiatCurrency,
    orderId: reference,
    chain
  };

  const payloadJson = JSON.stringify(payload);
  const signature = crypto
    .createHmac("sha256", apiSecret)
    .update(payloadJson)
    .digest("hex");

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

    if (!response.ok || result?.status !== "success" || !result?.data?.invoice_url) {
      const gatewayMessage = normalizeGatewayMessage(result, rawText);
      const gatewayError = buildGatewayError(gatewayMessage, chain);
      return res.status(502).json({
        error: gatewayError.error,
        hint: gatewayError.hint,
        detail: {
          statusCode: response.status,
          paymentMethod: chain,
          gatewayMessage: gatewayError.gatewayMessage,
          gatewayResponse: result && Object.keys(result).length ? result : rawText || null
        }
      });
    }

    return res.status(200).json({
      reference,
      invoiceId: result.data.id,
      invoiceUrl: result.data.invoice_url,
      currency: result.data.currency || fiatCurrency,
      subtotal: Number(totals.subtotal.toFixed(2)),
      shipping: Number(totals.shipping.toFixed(2)),
      total: Number(totals.total.toFixed(2)),
      paymentMethod: chain
    });
  } catch (error) {
    return res.status(502).json({
      error: "Unable to reach ArionPay.",
      detail: error instanceof Error ? error.message : "Unknown network error"
    });
  }
};
