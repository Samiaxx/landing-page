const { listPendingOrders, findOrderByInvoiceId, readOrder, saveOrder } = require("./_orders");
const {
  fetchArionPayInvoice,
  isPaidStatus,
  normalizeStatus,
  text
} = require("./_arionpay");

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
    invoiceUrl: text(baseOrder.invoiceUrl),
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

async function reconcileOrder(reference, invoiceId) {
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
    return syncedOrder;
  }

  return order;
}

async function reconcilePendingOrders(limit = 20) {
  const pendingOrders = await listPendingOrders(limit);
  const results = [];

  for (const order of pendingOrders) {
    const beforeStatus = normalizeStatus(order && order.status);
    const nextOrder = await reconcileOrder(order && order.reference, order && order.invoiceId);
    const afterStatus = normalizeStatus(nextOrder && nextOrder.status);

    results.push({
      reference: text(nextOrder && nextOrder.reference) || text(order && order.reference),
      invoiceId: text(nextOrder && nextOrder.invoiceId) || text(order && order.invoiceId),
      beforeStatus,
      afterStatus,
      changed: beforeStatus !== afterStatus
    });
  }

  return {
    scanned: pendingOrders.length,
    updated: results.filter((result) => result.changed).length,
    results
  };
}

module.exports = {
  reconcileOrder,
  reconcilePendingOrders
};
