const https = require("https");
const { URL } = require("url");

const API_HOST = "api.nowpayments.io";
const API_BASE_PATH = "/v1";
const PRICE_CURRENCY = (process.env.NOWPAYMENTS_PRICE_CURRENCY || "eur").toLowerCase();

const CURRENCY_TO_NOWPAYMENTS = {
  USDT_TRC20: "usdttrc20",
  BTC: "btc",
  ETH: "eth"
};

const NOWPAYMENTS_TO_INTERNAL = {
  usdttrc20: "USDT_TRC20",
  btc: "BTC",
  eth: "ETH"
};

function sendJson(res, statusCode, payload) {
  if (typeof res.status === "function" && typeof res.json === "function") {
    res.status(statusCode).json(payload);
    return;
  }

  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

function readJsonBody(req) {
  if (req.body && typeof req.body === "object") {
    return Promise.resolve(req.body);
  }

  if (typeof req.body === "string") {
    return Promise.resolve(req.body ? JSON.parse(req.body) : {});
  }

  return new Promise((resolve, reject) => {
    let raw = "";

    req.on("data", (chunk) => {
      raw += chunk;
    });

    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(new Error("Invalid JSON body."));
      }
    });

    req.on("error", (error) => {
      reject(error);
    });
  });
}

function getQuery(req) {
  if (req.query && typeof req.query === "object") {
    return req.query;
  }

  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  return Object.fromEntries(url.searchParams.entries());
}

function nowPaymentsApiKey() {
  const apiKey = process.env.NOWPAYMENTS_API_KEY;

  if (!apiKey) {
    throw new Error("NOWPayments API key is not configured.");
  }

  return apiKey;
}

function internalCurrencyId(value) {
  const normalized = String(value || "").trim().toUpperCase();
  return CURRENCY_TO_NOWPAYMENTS[normalized] ? normalized : "USDT_TRC20";
}

function nowPaymentsCurrency(value) {
  return CURRENCY_TO_NOWPAYMENTS[internalCurrencyId(value)];
}

function orderDescription(reference, items) {
  const parts = Array.isArray(items)
    ? items
      .map((item) => {
        const name = item && item.name ? String(item.name) : "";
        const quantity = Number(item && item.quantity ? item.quantity : 0);
        if (!name) {
          return "";
        }
        return quantity > 0 ? `${name} x${quantity}` : name;
      })
      .filter(Boolean)
    : [];

  return [`Primus Peptides order ${reference}`, parts.join(", ")].filter(Boolean).join(" - ").slice(0, 490);
}

function requestNowPayments(pathname, { method = "GET", body } = {}) {
  const apiKey = nowPaymentsApiKey();
  const payload = body ? JSON.stringify(body) : "";

  return new Promise((resolve, reject) => {
    const request = https.request({
      hostname: API_HOST,
      path: `${API_BASE_PATH}${pathname}`,
      method,
      headers: {
        "x-api-key": apiKey,
        ...(payload ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } : {})
      }
    }, (response) => {
      let raw = "";

      response.on("data", (chunk) => {
        raw += chunk;
      });

      response.on("end", () => {
        let parsed = {};

        try {
          parsed = raw ? JSON.parse(raw) : {};
        } catch (error) {
          parsed = {};
        }

        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(parsed);
          return;
        }

        const detail = parsed.message || parsed.error || parsed.reason || raw || `NOWPayments request failed (${response.statusCode}).`;
        reject(new Error(detail));
      });
    });

    request.on("error", (error) => {
      reject(error);
    });

    if (payload) {
      request.write(payload);
    }

    request.end();
  });
}

function normalizePayment(data) {
  const payCurrencyCode = String(data.pay_currency || data.payCurrency || "").toLowerCase();
  const internalCurrency = NOWPAYMENTS_TO_INTERNAL[payCurrencyCode] || internalCurrencyId(payCurrencyCode);
  const payAmount = Number(data.pay_amount || data.payAmount || 0);

  return {
    paymentId: String(data.payment_id || data.paymentId || data.id || ""),
    paymentStatus: String(data.payment_status || data.paymentStatus || data.status || "waiting").toLowerCase(),
    payAddress: String(data.pay_address || data.payAddress || data.payin_address || ""),
    payAmount: Number.isFinite(payAmount) ? payAmount : 0,
    payCurrency: internalCurrency,
    payCurrencyCode: payCurrencyCode || nowPaymentsCurrency(internalCurrency),
    priceAmount: Number(data.price_amount || data.priceAmount || 0) || 0,
    priceCurrency: String(data.price_currency || data.priceCurrency || PRICE_CURRENCY).toUpperCase(),
    expirationEstimateDate: String(data.expiration_estimate_date || data.expirationEstimateDate || ""),
    orderId: String(data.order_id || data.orderId || "")
  };
}

async function createPayment({ reference, total, selectedCurrency, items }) {
  const priceAmount = Number(total || 0);

  if (!Number.isFinite(priceAmount) || priceAmount <= 0) {
    throw new Error("Invalid order total for NOWPayments.");
  }

  const payCurrency = nowPaymentsCurrency(selectedCurrency);
  const createResponse = await requestNowPayments("/payment", {
    method: "POST",
    body: {
      price_amount: priceAmount.toFixed(2),
      price_currency: PRICE_CURRENCY,
      pay_currency: payCurrency,
      order_id: reference,
      order_description: orderDescription(reference, items),
      is_fixed_rate: true
    }
  });

  const paymentId = String(createResponse.payment_id || createResponse.id || "");

  if (!paymentId) {
    throw new Error("NOWPayments did not return a payment id.");
  }

  let estimateResponse = {};
  try {
    estimateResponse = await requestNowPayments(`/payment/${paymentId}/update-merchant-estimate`, {
      method: "POST",
      body: {}
    });
  } catch (error) {
    estimateResponse = {};
  }

  let statusResponse = {};
  try {
    statusResponse = await requestNowPayments(`/payment/${paymentId}`);
  } catch (error) {
    statusResponse = {};
  }

  return normalizePayment({
    ...createResponse,
    ...estimateResponse,
    ...statusResponse,
    pay_currency: statusResponse.pay_currency || createResponse.pay_currency || payCurrency,
    payment_id: paymentId,
    price_amount: priceAmount.toFixed(2),
    price_currency: PRICE_CURRENCY,
    expiration_estimate_date: estimateResponse.expiration_estimate_date || statusResponse.expiration_estimate_date || ""
  });
}

async function getPayment(paymentId) {
  if (!paymentId) {
    throw new Error("Missing payment id.");
  }

  const statusResponse = await requestNowPayments(`/payment/${paymentId}`);

  return normalizePayment(statusResponse);
}

async function refreshPaymentEstimate(paymentId) {
  if (!paymentId) {
    throw new Error("Missing payment id.");
  }

  let estimateResponse = {};
  try {
    estimateResponse = await requestNowPayments(`/payment/${paymentId}/update-merchant-estimate`, {
      method: "POST",
      body: {}
    });
  } catch (error) {
    estimateResponse = {};
  }

  const statusResponse = await requestNowPayments(`/payment/${paymentId}`);

  return normalizePayment({
    ...statusResponse,
    ...estimateResponse,
    payment_id: paymentId,
    expiration_estimate_date: estimateResponse.expiration_estimate_date || statusResponse.expiration_estimate_date || ""
  });
}

module.exports = {
  PRICE_CURRENCY,
  createPayment,
  getPayment,
  getQuery,
  internalCurrencyId,
  nowPaymentsCurrency,
  refreshPaymentEstimate,
  readJsonBody,
  sendJson
};
