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

function normalizeStatus(status) {
  const value = String(status || "").trim();

  if (!value) {
    return "received";
  }

  if (/paid|completed|complete|confirmed|success/i.test(value)) {
    return "paid";
  }

  if (/pending|awaiting|processing|created|received/i.test(value)) {
    return "pending";
  }

  if (/cancel|canceled|cancelled|failed|expired|void|invalid/i.test(value)) {
    return "failed";
  }

  return value;
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
  const gatewayStatus = extractStatus(payload);
  const status = normalizeStatus(gatewayStatus);

  console.log("=== ArionPay Webhook Extraction ===");
  console.log("Extracted reference:", reference);
  console.log("Extracted invoiceId:", invoiceId);
  console.log("Extracted status:", status);
  console.log("Extracted gatewayStatus:", gatewayStatus);

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
    gatewayStatus,
    payloadKeys: Object.keys(payload)
  });

  const previousStatus = order ? order.status : null;
  const nextOrder = order
    ? {
        ...order,
        status,
        gatewayStatus,
        invoiceId: order.invoiceId || invoiceId,
        gatewayPayload: payload,
        lastWebhookAt: new Date().toISOString()
      }
    : {
        reference: reference || `arion-${invoiceId}`,
        createdAt: new Date().toISOString(),
        status,
        gatewayStatus,
        customer: {},
        items: [],
        invoiceId: invoiceId || "",
        gatewayPayload: payload,
        lastWebhookAt: new Date().toISOString()
      };

  saveOrder(nextOrder);

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
    matched: true,
    reference: nextOrder.reference,
    status: nextOrder.status
  });
};
