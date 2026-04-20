const { findOrderByInvoiceId, readOrder, saveOrder } = require("./_orders");
const {
  fetchArionPayInvoice,
  isPaidStatus,
  normalizeStatus,
  text
} = require("./_arionpay");

function applyNoStore(res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
}

function hasOrderChanged(currentOrder, nextOrder) {
  if (!currentOrder) {
    return true;
  }

  return [
    "reference",
    "createdAt",
    "status",
    "gatewayStatus",
    "invoiceId",
    "lastWebhookAt",
    "shippingMethod",
    "paymentMethod",
    "subtotal",
    "shippingCost",
    "total"
  ].some((key) => currentOrder[key] !== nextOrder[key]);
}

function buildSyncedOrder(currentOrder, remoteInvoice, requestedReference, requestedInvoiceId) {
  if (!remoteInvoice || !remoteInvoice.ok) {
    return currentOrder || null;
  }

  const baseOrder = currentOrder && typeof currentOrder === "object"
    ? currentOrder
    : {};
  const reference = text(baseOrder.reference) || text(remoteInvoice.reference) || text(requestedReference);
  const invoiceId = text(baseOrder.invoiceId) || text(remoteInvoice.invoiceId) || text(requestedInvoiceId);

  if (!reference && !invoiceId) {
    return currentOrder || null;
  }

  const gatewayStatus = text(remoteInvoice.gatewayStatus) || text(baseOrder.gatewayStatus);
  const remoteStatus = text(remoteInvoice.gatewayStatus) ? remoteInvoice.status : "";
  const status = normalizeStatus(remoteStatus || baseOrder.status || gatewayStatus);

  return {
    ...baseOrder,
    reference: reference || `arion-${invoiceId}`,
    createdAt: text(baseOrder.createdAt) || text(remoteInvoice.createdAt) || new Date().toISOString(),
    status,
    gatewayStatus,
    invoiceId,
    lastWebhookAt: text(baseOrder.lastWebhookAt) || "",
    customer: baseOrder.customer || {},
    items: Array.isArray(baseOrder.items) ? baseOrder.items : [],
    shippingMethod: text(baseOrder.shippingMethod),
    paymentMethod: text(baseOrder.paymentMethod),
    subtotal: Number(baseOrder.subtotal || 0),
    shippingCost: Number(baseOrder.shippingCost || 0),
    total: Number(baseOrder.total || 0)
  };
}

function serializeOrder(order) {
  return {
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
  };
}

async function resolveOrder(reference, invoiceId) {
  let order = (reference && await readOrder(reference)) || (invoiceId && await findOrderByInvoiceId(invoiceId));
  const effectiveInvoiceId = invoiceId || (order && order.invoiceId) || "";

  if (!effectiveInvoiceId || (order && isPaidStatus(order.status))) {
    return order;
  }

  const remoteInvoice = await fetchArionPayInvoice(effectiveInvoiceId);
  if (!remoteInvoice || !remoteInvoice.ok) {
    return order;
  }

  const syncedOrder = buildSyncedOrder(order, remoteInvoice, reference, effectiveInvoiceId);
  if (!syncedOrder) {
    return order;
  }

  if (hasOrderChanged(order, syncedOrder)) {
    await saveOrder(syncedOrder);
  }

  return syncedOrder;
}

module.exports = async function handler(req, res) {
  applyNoStore(res);

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

  const order = await resolveOrder(reference, invoiceId);

  if (!order) {
    return res.status(404).json({ error: "Order not found." });
  }

  return res.status(200).json({
    order: serializeOrder(order)
  });
};
