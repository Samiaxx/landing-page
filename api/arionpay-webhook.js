const { isEmailConfigured, sendOrderStatusEmails } = require("./_email");
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

function paidEmailProcessingRecently(order) {
  const processingAt = order
    && order.notifications
    && order.notifications.paid
    && order.notifications.paid.processingAt;
  const timestamp = Date.parse(processingAt || "");

  return Number.isFinite(timestamp) && (Date.now() - timestamp) < 2 * 60 * 1000;
}

function markPaidEmailProcessing(order) {
  return {
    ...order,
    notifications: {
      ...(order.notifications || {}),
      paid: {
        ...((order.notifications && order.notifications.paid) || {}),
        processingAt: new Date().toISOString()
      }
    }
  };
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
  let nextOrder = shouldPersistGatewayUpdate
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

  if (nextOrder && shouldPersistGatewayUpdate && isPaidStatus(nextOrder.status)) {
    if (isEmailConfigured()) {
      try {
        if (paidEmailProcessingRecently(nextOrder)) {
          console.log("Paid order email already processing; skipping duplicate webhook attempt.");
        } else {
          nextOrder = markPaidEmailProcessing(nextOrder);
          await saveOrder(nextOrder);

          const notifications = await sendOrderStatusEmails(nextOrder, previousStatus);
          if (notifications) {
            nextOrder = {
              ...nextOrder,
              notifications
            };
            await saveOrder(nextOrder);
          }
        }
      } catch (e) {
        console.warn("Failed to send paid order emails:", e && e.message);
      }
    } else {
      console.log("Email sending disabled; skipping paid order notification.");
    }
  }

  return res.status(200).json({
    success: true,
    received: true,
    matched: Boolean(order),
    reference: (nextOrder && nextOrder.reference) || reference || "",
    status: (nextOrder && nextOrder.status) || previousStatus || "received",
    webhookOnly: true
  });
};
