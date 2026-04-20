const crypto = require("crypto");

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function safeJsonParse(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function parseFormEncoded(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || !/[=&]/.test(trimmed)) {
    return null;
  }

  const params = new URLSearchParams(trimmed);
  const entries = Array.from(params.entries());
  if (!entries.length) {
    return null;
  }

  const payload = {};

  entries.forEach(([key, rawValue]) => {
    const parsedValue = parsePayloadSource(rawValue);

    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      const current = payload[key];
      payload[key] = Array.isArray(current)
        ? current.concat(parsedValue)
        : [current, parsedValue];
      return;
    }

    payload[key] = parsedValue;
  });

  return payload;
}

function normalizePayload(payload) {
  if (!isObject(payload)) {
    return {};
  }

  const next = { ...payload };
  ["payload", "data", "invoice", "payment", "metadata"].forEach((key) => {
    const value = next[key];
    const parsed = parsePayloadSource(value);

    if (isObject(parsed)) {
      next[key] = parsed;
    }
  });

  if (isObject(next.payload)) {
    const payloadFields = next.payload;
    delete next.payload;
    return {
      ...payloadFields,
      ...next
    };
  }

  return next;
}

function parsePayloadSource(value) {
  if (isObject(value)) {
    return normalizePayload(value);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => parsePayloadSource(entry));
  }

  if (typeof value !== "string") {
    return value;
  }

  const parsedJson = safeJsonParse(value);
  if (isObject(parsedJson) || Array.isArray(parsedJson)) {
    return parsePayloadSource(parsedJson);
  }

  const parsedForm = parseFormEncoded(value);
  if (isObject(parsedForm)) {
    return normalizePayload(parsedForm);
  }

  return value;
}

function mergeRequestPayload(req) {
  const merged = {};

  [req && req.rawBody, req && req.body].forEach((source) => {
    const parsed = parsePayloadSource(source);
    if (isObject(parsed)) {
      Object.assign(merged, parsed);
    }
  });

  return normalizePayload(merged);
}

function firstText(values) {
  for (const value of values) {
    if (Array.isArray(value)) {
      const nested = firstText(value);
      if (nested) {
        return nested;
      }
      continue;
    }

    const normalized = text(value);
    if (normalized) {
      return normalized;
    }
  }

  return "";
}

function extractGatewayStatus(payload) {
  const data = isObject(payload && payload.data) ? payload.data : null;
  const wrappedStatus = firstText([
    data && data.invoice && data.invoice.status,
    data && data.payment && data.payment.status,
    data && data.paymentStatus,
    data && data.payment_status,
    data && data.state,
    data && data.status
  ]);

  if (wrappedStatus) {
    return wrappedStatus;
  }

  const rootStatus = firstText([
    payload && payload.invoice && payload.invoice.status,
    payload && payload.payment && payload.payment.status,
    payload && payload.invoiceStatus,
    payload && payload.paymentStatus,
    payload && payload.payment_status,
    payload && payload.state
  ]);

  if (rootStatus) {
    return rootStatus;
  }

  const fallbackStatus = text(payload && payload.status);
  if (!fallbackStatus) {
    return "";
  }

  if (data && /^(success|ok)$/i.test(fallbackStatus)) {
    return "";
  }

  return fallbackStatus;
}

function extractReference(payload) {
  return firstText([
    payload && payload.orderId,
    payload && payload.order_id,
    payload && payload.reference,
    payload && payload.merchantOrderId,
    payload && payload.metadata && payload.metadata.orderId,
    payload && payload.metadata && payload.metadata.reference,
    payload && payload.data && payload.data.orderId,
    payload && payload.data && payload.data.order_id,
    payload && payload.data && payload.data.reference,
    payload && payload.data && payload.data.metadata && payload.data.metadata.orderId,
    payload && payload.data && payload.data.metadata && payload.data.metadata.reference,
    payload && payload.invoice && payload.invoice.orderId,
    payload && payload.invoice && payload.invoice.order_id
  ]);
}

function extractInvoiceId(payload) {
  return firstText([
    payload && payload.id,
    payload && payload._id,
    payload && payload.invoiceId,
    payload && payload.invoice_id,
    payload && payload.invoice && payload.invoice.id,
    payload && payload.invoice && payload.invoice._id,
    payload && payload.data && payload.data.id,
    payload && payload.data && payload.data._id,
    payload && payload.data && payload.data.invoiceId,
    payload && payload.data && payload.data.invoice_id,
    payload && payload.data && payload.data.invoice && payload.data.invoice.id,
    payload && payload.data && payload.data.invoice && payload.data.invoice._id
  ]);
}

function extractCreatedAt(payload) {
  return firstText([
    payload && payload.createdAt,
    payload && payload.created_at,
    payload && payload.data && payload.data.createdAt,
    payload && payload.data && payload.data.created_at
  ]);
}

function normalizeStatus(status) {
  const value = text(status);

  if (!value) {
    return "received";
  }

  if (/paid|completed|complete|confirmed|success|settled|overpaid/i.test(value)) {
    return "paid";
  }

  if (/pending|awaiting|processing|created|received|confirming|confirmation|partial|underpaid|new/i.test(value)) {
    return "pending";
  }

  if (/cancel|canceled|cancelled|failed|expired|void|invalid|refunded|refund/i.test(value)) {
    return "failed";
  }

  return value;
}

function isPaidStatus(status) {
  return normalizeStatus(status) === "paid";
}

async function fetchArionPayInvoice(invoiceId) {
  const normalizedInvoiceId = text(invoiceId);
  if (!normalizedInvoiceId || typeof fetch !== "function") {
    return null;
  }

  const url = `https://api.arionpay.com/api/v1/invoices/${encodeURIComponent(normalizedInvoiceId)}`;
  const headers = {
    Accept: "application/json"
  };

  const apiKey = text(process.env.ARIONPAY_API_KEY);
  const apiSecret = text(process.env.ARIONPAY_API_SECRET);

  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }

  if (apiSecret) {
    headers["x-signature"] = crypto
      .createHmac("sha256", apiSecret)
      .update("")
      .digest("hex");
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers
    });
    const rawText = await response.text();
    const parsedPayload = safeJsonParse(rawText);
    const payload = isObject(parsedPayload) ? parsedPayload : {};

    if (!response.ok) {
      return {
        ok: false,
        statusCode: response.status,
        payload,
        rawText
      };
    }

    const gatewayStatus = extractGatewayStatus(payload);

    return {
      ok: true,
      statusCode: response.status,
      payload,
      rawText,
      reference: extractReference(payload),
      invoiceId: extractInvoiceId(payload) || normalizedInvoiceId,
      gatewayStatus,
      status: normalizeStatus(gatewayStatus),
      createdAt: extractCreatedAt(payload)
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to reach ArionPay."
    };
  }
}

module.exports = {
  extractGatewayStatus,
  extractInvoiceId,
  extractReference,
  fetchArionPayInvoice,
  isPaidStatus,
  mergeRequestPayload,
  normalizeStatus,
  text
};
