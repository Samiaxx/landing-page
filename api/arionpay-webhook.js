const { sendOrderStatusEmails } = require("./_email");
const { findOrderByInvoiceId, readOrder, saveOrder } = require("./_orders");

function extractPayload(req) {
  console.log("Raw request body type:", typeof req.body);
  console.log("Raw request body:", req.body);
  
  if (typeof req.body === "string") {
    try {
      const parsed = JSON.parse(req.body);
      console.log("Parsed payload from string:", JSON.stringify(parsed, null, 2));
      return parsed;
    } catch (e) {
      console.log("Failed to parse body string:", e.message);
      return {};
    }
  }

  console.log("Payload as object:", JSON.stringify(req.body, null, 2));
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
  if (req.method === "HEAD" || req.method === "OPTIONS") {
    res.setHeader("Allow", "HEAD, OPTIONS, POST");
    return res.status(200).json({ received: true, verified: true });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "HEAD, OPTIONS, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const payload = extractPayload(req);
  const reference = extractReference(payload);
  const invoiceId = extractInvoiceId(payload);
  const status = extractStatus(payload);

  console.log("=== ArionPay Webhook Extraction ===");
  console.log("Extracted reference:", reference);
  console.log("Extracted invoiceId:", invoiceId);
  console.log("Extracted status:", status);

  console.log("=== Attempting Order Lookup ===");
  let order = null;
  
  if (reference) {
    console.log("Trying readOrder with reference:", reference);
    order = readOrder(reference);
    console.log("readOrder result:", order ? "Found" : "Not found");
  }
  
  if (!order && invoiceId) {
    console.log("Trying findOrderByInvoiceId with invoiceId:", invoiceId);
    order = findOrderByInvoiceId(invoiceId);
    console.log("findOrderByInvoiceId result:", order ? "Found" : "Not found");
  }

  console.log("=== Final Results ===");
  console.log("Order found:", order ? "Yes" : "No");
  console.log("Payload summary:", {
    reference,
    invoiceId,
    status,
    payloadKeys: Object.keys(payload)
  });

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
