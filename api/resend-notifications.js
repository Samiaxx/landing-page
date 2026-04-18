const { readOrder, findOrderByInvoiceId, saveOrder } = require("./_orders");
const { sendOrderCreatedEmails, sendOrderStatusEmails, isPaidStatus } = require("./_email");

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body || {};
  const reference = text(body.reference || req.query?.reference);
  const invoiceId = text(body.invoiceId || req.query?.invoiceId);

  if (!reference && !invoiceId) {
    return res.status(400).json({ error: "reference or invoiceId is required" });
  }

  const order = (reference && readOrder(reference)) || (invoiceId && findOrderByInvoiceId(invoiceId));

  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  // Don't attempt resends when email sending isn't configured.
  const emailConfigured = Boolean(process.env.RESEND_API_KEY && (process.env.EMAIL_FROM || process.env.RESEND_FROM));
  if (!emailConfigured) {
    return res.status(400).json({ error: "email_sending_disabled", hint: "Set RESEND_API_KEY and EMAIL_FROM (or RESEND_FROM) to enable resending" });
  }

  try {
    const paid = isPaidStatus(order.status);
    let notifications = null;

    if (paid) {
      notifications = await sendOrderStatusEmails(order, order.status || null);
    } else {
      notifications = await sendOrderCreatedEmails(order);
    }

    const next = { ...order, notifications: notifications || order.notifications };
    saveOrder(next);

    return res.status(200).json({ ok: true, notifications });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
};
