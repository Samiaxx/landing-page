const { sendOrderStatusEmails } = require("./_email");
const { findOrderByInvoiceId, readOrder, saveOrder } = require("./_orders");
const {
  extractGatewayStatus,
  extractInvoiceId,
  extractReference,
  isPaidStatus,
  mergeRequestPayload,
  normalizeStatus
} = require("./_arionpay");

function applyNoStore(res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function mergeCallbackPayload(req) {
  const query = req && req.query && typeof req.query === "object"
    ? req.query
    : {};
  const body = mergeRequestPayload(req);

  return {
    ...query,
    ...body
  };
}

function hasGatewayEvidence(payload, invoiceId) {
  return Boolean(
    text(invoiceId)
    || text(payload && payload.txHash)
    || text(payload && payload.tx_hash)
    || text(payload && payload.amountCrypto)
    || text(payload && payload.amount_crypto)
    || text(payload && payload.chain)
  );
}

function resolveBaseUrl(req) {
  return (
    process.env.SITE_BASE_URL
    || process.env.PUBLIC_SITE_URL
    || req.headers?.origin
    || (req.headers && `${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host}`)
    || ""
  ).replace(/\/$/, "");
}

function buildCheckoutRedirectUrl(req, reference, requestedStatus, orderStatus) {
  const base = resolveBaseUrl(req);
  const params = new URLSearchParams();
  const normalizedReference = text(reference);
  const normalizedRequestedStatus = text(requestedStatus).toLowerCase();
  const normalizedOrderStatus = normalizeStatus(orderStatus);

  if (normalizedReference) {
    params.set("reference", normalizedReference);
  }

  if (/cancel|failed|expired/i.test(normalizedRequestedStatus || normalizedOrderStatus)) {
    params.set("status", "cancel");
  } else {
    params.set("status", "success");
  }

  const query = params.toString();
  return `${base || ""}/checkout.html${query ? `?${query}` : ""}`;
}

module.exports = async function handler(req, res) {
  applyNoStore(res);

  if (req.method === "HEAD" || req.method === "OPTIONS") {
    res.setHeader("Allow", "HEAD, OPTIONS, GET, POST");
    return res.status(200).json({ received: true, verified: true });
  }

  if (req.method !== "POST" && req.method !== "GET") {
    res.setHeader("Allow", "HEAD, OPTIONS, GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const payload = mergeCallbackPayload(req);
  const reference = extractReference(payload);
  const invoiceId = extractInvoiceId(payload);
  const requestedStatus = text(req.query?.status);
  const shouldPersistGatewayUpdate = req.method === "POST" || hasGatewayEvidence(payload, invoiceId);
  const gatewayStatus = shouldPersistGatewayUpdate
    ? (extractGatewayStatus(payload) || "received")
    : "";
  const incomingStatus = gatewayStatus ? normalizeStatus(gatewayStatus) : "";
  let order = null;

  if (reference) {
    order = await readOrder(reference);
  }

  if (!order && invoiceId) {
    order = await findOrderByInvoiceId(invoiceId);
  }

  const previousStatus = order ? normalizeStatus(order.status) : "";
  const nextStatus = incomingStatus
    ? (isPaidStatus(previousStatus) && !isPaidStatus(incomingStatus)
      ? previousStatus
      : incomingStatus)
    : previousStatus;
  const nextOrder = shouldPersistGatewayUpdate
    ? (order
      ? {
          ...order,
          status: nextStatus || order.status,
          gatewayStatus: gatewayStatus || order.gatewayStatus || nextStatus || order.status,
          invoiceId: order.invoiceId || invoiceId,
          gatewayPayload: payload,
          lastWebhookAt: new Date().toISOString()
        }
      : {
          reference: reference || `arion-${invoiceId}`,
          createdAt: new Date().toISOString(),
          status: nextStatus || "received",
          gatewayStatus: gatewayStatus || nextStatus || "received",
          customer: {},
          items: [],
          invoiceId: invoiceId || "",
          gatewayPayload: payload,
          lastWebhookAt: new Date().toISOString()
        })
    : order;

  if (nextOrder && shouldPersistGatewayUpdate) {
    await saveOrder(nextOrder);
  }

  if (nextOrder && shouldPersistGatewayUpdate && previousStatus !== nextOrder.status) {
    // Only attempt to send status emails if email sending is configured.
    const emailConfigured = Boolean(process.env.RESEND_API_KEY && (process.env.EMAIL_FROM || process.env.RESEND_FROM));
    if (emailConfigured) {
      try {
        await sendOrderStatusEmails(nextOrder, previousStatus);
      } catch (e) {
        console.warn("Failed to send order status emails:", e && e.message);
      }
    } else {
      console.log("Email sending disabled; skipping status notification.");
    }
  }

  if (req.method === "GET") {
    const redirectUrl = buildCheckoutRedirectUrl(
      req,
      reference || (nextOrder && nextOrder.reference) || "",
      requestedStatus,
      (nextOrder && nextOrder.status) || previousStatus
    );
    return res.redirect(302, redirectUrl);
  }

  return res.status(200).json({
    received: true,
    matched: Boolean(order),
    reference: (nextOrder && nextOrder.reference) || reference || "",
    status: (nextOrder && nextOrder.status) || previousStatus || "received"
  });
};
