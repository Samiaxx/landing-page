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

module.exports = async function handler(req, res) {
  applyNoStore(res);

  if (req.method === "HEAD" || req.method === "OPTIONS") {
    res.setHeader("Allow", "HEAD, OPTIONS, POST");
    return res.status(200).json({ received: true, verified: true });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "HEAD, OPTIONS, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const payload = mergeRequestPayload(req);
  const reference = extractReference(payload);
  const invoiceId = extractInvoiceId(payload);
  const gatewayStatus = extractGatewayStatus(payload) || "received";
  const incomingStatus = normalizeStatus(gatewayStatus);
  let order = null;

  if (reference) {
    order = await readOrder(reference);
  }

  if (!order && invoiceId) {
    order = await findOrderByInvoiceId(invoiceId);
  }

  const previousStatus = order ? normalizeStatus(order.status) : "";
  const nextStatus = isPaidStatus(previousStatus) && !isPaidStatus(incomingStatus)
    ? previousStatus
    : incomingStatus;
  const nextOrder = order
    ? {
        ...order,
        status: nextStatus,
        gatewayStatus: gatewayStatus || order.gatewayStatus || nextStatus,
        invoiceId: order.invoiceId || invoiceId,
        gatewayPayload: payload,
        lastWebhookAt: new Date().toISOString()
      }
    : {
        reference: reference || `arion-${invoiceId}`,
        createdAt: new Date().toISOString(),
        status: nextStatus,
        gatewayStatus,
        customer: {},
        items: [],
        invoiceId: invoiceId || "",
        gatewayPayload: payload,
        lastWebhookAt: new Date().toISOString()
      };

  await saveOrder(nextOrder);

  if (previousStatus !== nextOrder.status) {
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

  return res.status(200).json({
    received: true,
    matched: Boolean(order),
    reference: nextOrder.reference,
    status: nextOrder.status
  });
};
