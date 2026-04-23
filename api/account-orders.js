const { claimOrdersForUser, getAuthenticatedSession } = require("./_auth");
const { listOrdersByCustomerEmail } = require("./_orders");

function applyNoStore(res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
}

function serializeOrder(order) {
  return {
    reference: order.reference,
    createdAt: order.createdAt || "",
    status: order.status || "received",
    gatewayStatus: order.gatewayStatus || "",
    invoiceId: order.invoiceId || "",
    lastWebhookAt: order.lastWebhookAt || "",
    shippingMethod: order.shippingMethod || "",
    paymentMethod: order.paymentMethod || "",
    subtotal: Number(order.subtotal || 0),
    shippingCost: Number(order.shippingCost || 0),
    total: Number(order.total || 0),
    items: Array.isArray(order.items) ? order.items : []
  };
}

module.exports = async function handler(req, res) {
  applyNoStore(res);

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = await getAuthenticatedSession(req);
  if (!auth) {
    return res.status(401).json({ error: "Authentication required." });
  }

  await claimOrdersForUser(auth.user);
  const orders = await listOrdersByCustomerEmail(auth.user.email, 50);

  return res.status(200).json({
    user: auth.publicUser,
    orders: orders.map(serializeOrder)
  });
};
