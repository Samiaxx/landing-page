const { findOrderByInvoiceId, readOrder } = require("./_orders");

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const reference = text(req.query?.reference);
  const invoiceId = text(req.query?.invoiceId);

  if (!reference && !invoiceId) {
    return res.status(400).json({
      error: "Order reference or invoice ID is required."
    });
  }

  const order = (reference && readOrder(reference)) || (invoiceId && findOrderByInvoiceId(invoiceId));

  if (!order) {
    return res.status(404).json({ error: "Order not found." });
  }

  return res.status(200).json({
    order: {
      reference: order.reference,
      createdAt: order.createdAt || "",
      status: order.status || "received",
      gatewayStatus: order.gatewayStatus || "",
      invoiceId: order.invoiceId || "",
      invoiceUrl: order.invoiceUrl || "",
      lastWebhookAt: order.lastWebhookAt || "",
      shippingMethod: order.shippingMethod || "",
      paymentMethod: order.paymentMethod || "",
      subtotal: Number(order.subtotal || 0),
      shippingCost: Number(order.shippingCost || 0),
      total: Number(order.total || 0),
      items: Array.isArray(order.items) ? order.items : []
    }
  });
};
