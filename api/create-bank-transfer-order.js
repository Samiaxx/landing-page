const {
  PAYMENT_OPTIONS,
  SHIPPING_OPTIONS,
  calculateTotals,
  normalizeCustomer,
  normalizeItems,
  sanitizeReference,
  serializeItems,
  validateCustomer
} = require("./_catalog");
const { getBankTransferDetails, sendOrderCreatedEmails } = require("./_email");
const { saveOrder } = require("./_orders");

function parseBody(req) {
  if (!req.body) {
    return {};
  }

  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  return req.body;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = parseBody(req);
  const reference = sanitizeReference(body.reference);
  const items = normalizeItems(body.items);
  const customer = normalizeCustomer(body.customer);
  const shippingMethod = typeof body.shippingMethod === "string" ? body.shippingMethod : "eu-standard";
  const missingCustomerFields = validateCustomer(customer);

  if (!items.length) {
    return res.status(400).json({ error: "Your cart is empty or contains unavailable products." });
  }

  if (missingCustomerFields.length) {
    return res.status(400).json({
      error: "Missing or invalid checkout fields.",
      missing: missingCustomerFields
    });
  }

  const totals = calculateTotals(items, shippingMethod);
  const order = {
    reference,
    createdAt: new Date().toISOString(),
    status: "bank_transfer_pending",
    customer,
    items: serializeItems(items),
    shippingMethod,
    paymentMethod: "BANK_TRANSFER",
    subtotal: Number(totals.subtotal.toFixed(2)),
    shippingCost: Number(totals.shipping.toFixed(2)),
    total: Number(totals.total.toFixed(2)),
    bankTransferDetails: getBankTransferDetails()
  };

  saveOrder(order);
  const notifications = await sendOrderCreatedEmails(order);

  return res.status(200).json({
    reference: order.reference,
    createdAt: order.createdAt,
    status: order.status,
    subtotal: order.subtotal,
    shipping: order.shippingCost,
    total: order.total,
    paymentMethod: PAYMENT_OPTIONS.BANK_TRANSFER.id,
    paymentLabel: PAYMENT_OPTIONS.BANK_TRANSFER.label,
    shippingLabel: (SHIPPING_OPTIONS[shippingMethod] || SHIPPING_OPTIONS["eu-standard"]).label,
    bankTransferDetails: order.bankTransferDetails,
    notifications
  });
};
