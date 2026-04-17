const { sendOrderStatusEmails } = require("./_email");
const { findOrderByInvoiceId, readOrder, saveOrder } = require("./_orders");

function extractPayload(req) {
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  return req.body || {};
}

function extractStatus(payload) {
  return payload.status
    || payload.payment_status
    || payload.state
    || payload.data?.status
    || "received";
}

function extractReference(payload) {
  return payload.orderId
    || payload.order_id
    || payload.reference
    || payload.data?.orderId
    || "";
}

function extractInvoiceId(payload) {
  return payload.id
    || payload.invoiceId
    || payload.invoice_id
    || payload.data?.id
    || "";
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const payload = extractPayload(req);
  const reference = extractReference(payload);
  const invoiceId = extractInvoiceId(payload);
  const status = extractStatus(payload);
  const order = (reference && readOrder(reference)) || findOrderByInvoiceId(invoiceId);

  console.log("ArionPay webhook received", {
    id: invoiceId,
    reference,
    status,
    chain: payload.chain || payload.data?.chain
  });

  if (!order) {
    return res.status(200).json({ received: true, matched: false });
  }

  const previousStatus = order.status;
  const nextOrder = {
    ...order,
    status,
    invoiceId: order.invoiceId || invoiceId,
    gatewayPayload: payload,
    lastWebhookAt: new Date().toISOString()
  };

  saveOrder(nextOrder);

  if (previousStatus !== nextOrder.status) {
    await sendOrderStatusEmails(nextOrder, previousStatus);
  }

  return res.status(200).json({
    received: true,
    matched: true,
    reference: nextOrder.reference,
    status: nextOrder.status
  });
};
