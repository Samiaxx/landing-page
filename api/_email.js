const {
  PAYMENT_OPTIONS,
  SHIPPING_OPTIONS,
  customerName
} = require("./_catalog");
const { appendEmailLog } = require("./_orders");

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function trimValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function splitRecipients(value) {
  return trimValue(value)
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function getEmailConfig() {
  return {
    apiKey: trimValue(process.env.RESEND_API_KEY),
    from: trimValue(process.env.EMAIL_FROM || process.env.RESEND_FROM),
    adminTo: splitRecipients(process.env.ADMIN_EMAIL || process.env.ORDER_ADMIN_EMAIL || ""),
    replyTo: trimValue(process.env.EMAIL_REPLY_TO)
  };
}

function orderItemsMarkup(order) {
  return (order.items || []).map((item) => `
    <tr>
      <td style="padding:8px 0;color:#0d172f;">${escapeHtml(item.name)} ${escapeHtml(item.dosage)}</td>
      <td style="padding:8px 0;color:#61708a;text-align:center;">${escapeHtml(item.quantity)}</td>
      <td style="padding:8px 0;color:#0d172f;text-align:right;">EUR ${Number(item.lineTotal || 0).toFixed(2)}</td>
    </tr>
  `).join("");
}

function orderSummaryMarkup(order) {
  return `
    <table style="width:100%;border-collapse:collapse;margin-top:16px;">
      <thead>
        <tr>
          <th style="padding-bottom:8px;text-align:left;color:#61708a;font-size:12px;">Item</th>
          <th style="padding-bottom:8px;text-align:center;color:#61708a;font-size:12px;">Qty</th>
          <th style="padding-bottom:8px;text-align:right;color:#61708a;font-size:12px;">Total</th>
        </tr>
      </thead>
      <tbody>${orderItemsMarkup(order)}</tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding-top:12px;color:#61708a;">Subtotal</td>
          <td style="padding-top:12px;text-align:right;color:#0d172f;font-weight:700;">EUR ${Number(order.subtotal || 0).toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding-top:8px;color:#61708a;">Shipping</td>
          <td style="padding-top:8px;text-align:right;color:#0d172f;font-weight:700;">EUR ${Number(order.shippingCost || 0).toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding-top:8px;color:#61708a;">Order total</td>
          <td style="padding-top:8px;text-align:right;color:#0d172f;font-weight:700;">EUR ${Number(order.total || 0).toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>
  `;
}

function emailLayout({ eyebrow, title, intro, body, ctaLabel, ctaHref, footer }) {
  const button = ctaLabel && ctaHref
    ? `<p style="margin:24px 0 0;"><a href="${escapeHtml(ctaHref)}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#1463d3;color:#ffffff;text-decoration:none;font-weight:700;">${escapeHtml(ctaLabel)}</a></p>`
    : "";

  return `
    <div style="background:#f3f7fd;padding:32px 16px;font-family:Arial,sans-serif;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:24px;padding:28px;border:1px solid rgba(13,23,47,0.08);">
        <p style="margin:0 0 8px;color:#1463d3;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">${escapeHtml(eyebrow)}</p>
        <h1 style="margin:0 0 12px;color:#0d172f;font-size:28px;line-height:1.2;">${escapeHtml(title)}</h1>
        <p style="margin:0 0 12px;color:#42526b;line-height:1.7;">${escapeHtml(intro)}</p>
        ${body}
        ${button}
        <p style="margin:24px 0 0;color:#61708a;line-height:1.6;font-size:13px;">${escapeHtml(footer)}</p>
      </div>
    </div>
  `;
}

function orderContext(order) {
  const shipping = SHIPPING_OPTIONS[order.shippingMethod] || SHIPPING_OPTIONS["eu-standard"];
  const payment = PAYMENT_OPTIONS[order.paymentMethod] || PAYMENT_OPTIONS.USDT_TRC20;
  const customer = customerName(order.customer) || order.customer.email || "Customer";

  return { customer, payment, shipping };
}

async function sendEmail({ to, subject, html, text, replyTo, tag }) {
  const config = getEmailConfig();
  const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
  const payload = {
    to: recipients,
    subject,
    tag,
    sentAt: new Date().toISOString()
  };

  if (!recipients.length) {
    payload.result = { ok: false, reason: "missing_recipient" };
    appendEmailLog(payload);
    return payload.result;
  }

  if (!config.apiKey || !config.from) {
    payload.result = { ok: false, reason: "missing_email_config" };
    appendEmailLog(payload);
    return payload.result;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: config.from,
        to: recipients,
        subject,
        html,
        text,
        reply_to: replyTo || config.replyTo || undefined
      })
    });

    const result = await response.json().catch(() => ({}));
    payload.result = {
      ok: response.ok,
      status: response.status,
      response: result
    };
    appendEmailLog(payload);
    return payload.result;
  } catch (error) {
    payload.result = {
      ok: false,
      reason: error instanceof Error ? error.message : "unknown_error"
    };
    appendEmailLog(payload);
    return payload.result;
  }
}

async function sendOrderCreatedEmails(order) {
  const config = getEmailConfig();
  const { customer, payment, shipping } = orderContext(order);
  const customerIntro = `Hi ${customer}, your order ${order.reference} has been received and your secure payment page is ready.`;
  const customerBody = `
    <div style="padding:18px;border-radius:18px;background:#f7fbff;border:1px solid rgba(20,99,211,0.12);margin-top:16px;">
      <p style="margin:0;color:#42526b;line-height:1.7;">Payment method: <strong style="color:#0d172f;">${escapeHtml(payment.label)}</strong></p>
      <p style="margin:8px 0 0;color:#42526b;line-height:1.7;">Shipping: <strong style="color:#0d172f;">${escapeHtml(shipping.label)}</strong> (${escapeHtml(shipping.eta)})</p>
      <p style="margin:8px 0 0;color:#42526b;line-height:1.7;">Order reference: <strong style="color:#0d172f;">${escapeHtml(order.reference)}</strong></p>
    </div>
    ${orderSummaryMarkup(order)}
    <div style="padding:18px;border-radius:18px;background:#f7fbff;border:1px solid rgba(20,99,211,0.12);margin-top:18px;">
      <p style="margin:0;color:#0d172f;font-weight:700;">Complete payment</p>
      <p style="margin:10px 0 0;color:#42526b;line-height:1.7;">Use the secure ArionPay payment page below to complete checkout. We will email you again as soon as the payment status changes.</p>
    </div>
  `;

  const customerResult = await sendEmail({
    to: order.customer.email,
    subject: `Primus Peptides order ${order.reference}: payment page ready`,
    html: emailLayout({
      eyebrow: "Order received",
      title: "Your payment page is ready",
      intro: customerIntro,
      body: customerBody,
      ctaLabel: "Open secure payment page",
      ctaHref: order.invoiceUrl,
      footer: "Primus Peptides order updates are sent automatically after status changes."
    }),
    text: `${customerIntro}\nOrder reference: ${order.reference}\nOrder total: EUR ${Number(order.total || 0).toFixed(2)}`,
    tag: "crypto-invoice-customer"
  });

  const adminBody = `
    <div style="padding:18px;border-radius:18px;background:#f7fbff;border:1px solid rgba(20,99,211,0.12);margin-top:16px;">
      <p style="margin:0;color:#42526b;line-height:1.7;">Customer: <strong style="color:#0d172f;">${escapeHtml(customer)}</strong></p>
      <p style="margin:8px 0 0;color:#42526b;line-height:1.7;">Email: <strong style="color:#0d172f;">${escapeHtml(order.customer.email)}</strong></p>
      <p style="margin:8px 0 0;color:#42526b;line-height:1.7;">Payment: <strong style="color:#0d172f;">${escapeHtml(payment.label)}</strong></p>
      <p style="margin:8px 0 0;color:#42526b;line-height:1.7;">Reference: <strong style="color:#0d172f;">${escapeHtml(order.reference)}</strong></p>
    </div>
    ${orderSummaryMarkup(order)}
  `;

  const adminResult = await sendEmail({
    to: config.adminTo,
    subject: `New Primus order ${order.reference}`,
    html: emailLayout({
      eyebrow: "Admin notification",
      title: "New order received",
      intro: `A new ArionPay order has been created and stored by the storefront backend.`,
      body: adminBody,
      footer: "Use the stored order reference to coordinate fulfilment, payment review, and support follow-up."
    }),
    text: `New order ${order.reference} from ${customer}. Total EUR ${Number(order.total || 0).toFixed(2)}`,
    tag: "order-admin"
  });

  return {
    customer: customerResult,
    admin: adminResult
  };
}

function isPaidStatus(status) {
  return /paid|completed|confirmed|success/i.test(String(status || ""));
}

async function sendOrderStatusEmails(order, previousStatus) {
  const config = getEmailConfig();
  const { customer, payment } = orderContext(order);
  const paid = isPaidStatus(order.status);
  const subject = paid
    ? `Primus Peptides order ${order.reference}: payment confirmed`
    : `Primus Peptides order ${order.reference}: status updated`;
  const intro = paid
    ? `Hi ${customer}, payment for order ${order.reference} has been confirmed.`
    : `Hi ${customer}, the status of order ${order.reference} has changed.`;
  const customerResult = await sendEmail({
    to: order.customer.email,
    subject,
    html: emailLayout({
      eyebrow: paid ? "Payment confirmed" : "Order update",
      title: paid ? "Your order is moving to fulfilment" : "Your order status has changed",
      intro,
      body: `
        <div style="padding:18px;border-radius:18px;background:#f7fbff;border:1px solid rgba(20,99,211,0.12);margin-top:16px;">
          <p style="margin:0;color:#42526b;line-height:1.7;">Previous status: <strong style="color:#0d172f;">${escapeHtml(previousStatus || "unknown")}</strong></p>
          <p style="margin:8px 0 0;color:#42526b;line-height:1.7;">Current status: <strong style="color:#0d172f;">${escapeHtml(order.status)}</strong></p>
          <p style="margin:8px 0 0;color:#42526b;line-height:1.7;">Payment method: <strong style="color:#0d172f;">${escapeHtml(payment.label)}</strong></p>
        </div>
        ${orderSummaryMarkup(order)}
      `,
      footer: paid
        ? "If dispatch details change, another update will be sent automatically."
        : "If you need help with this order, reply to the most recent support email."
    }),
    text: `${intro}\nCurrent status: ${order.status}`,
    tag: "order-status-customer"
  });

  const adminResult = await sendEmail({
    to: config.adminTo,
    subject: `Order ${order.reference} status changed to ${order.status}`,
    html: emailLayout({
      eyebrow: "Admin notification",
      title: "Order status updated",
      intro: `Order ${order.reference} changed from ${previousStatus || "unknown"} to ${order.status}.`,
      body: orderSummaryMarkup(order),
      footer: "Review the webhook payload and fulfilment state if additional action is needed."
    }),
    text: `Order ${order.reference} changed from ${previousStatus || "unknown"} to ${order.status}.`,
    tag: "order-status-admin"
  });

  return {
    customer: customerResult,
    admin: adminResult
  };
}

async function sendContactEmails(message) {
  const config = getEmailConfig();
  const adminResult = await sendEmail({
    to: config.adminTo,
    subject: `Primus contact: ${message.subject || "New enquiry"}`,
    html: emailLayout({
      eyebrow: "Contact request",
      title: "New customer enquiry",
      intro: `${message.name} submitted a support message through the storefront contact form.`,
      body: `
        <div style="padding:18px;border-radius:18px;background:#f7fbff;border:1px solid rgba(20,99,211,0.12);margin-top:16px;">
          <p style="margin:0;color:#42526b;line-height:1.7;">Name: <strong style="color:#0d172f;">${escapeHtml(message.name)}</strong></p>
          <p style="margin:8px 0 0;color:#42526b;line-height:1.7;">Email: <strong style="color:#0d172f;">${escapeHtml(message.email)}</strong></p>
          <p style="margin:8px 0 0;color:#42526b;line-height:1.7;">Subject: <strong style="color:#0d172f;">${escapeHtml(message.subject || "General enquiry")}</strong></p>
          <p style="margin:12px 0 0;color:#42526b;line-height:1.7;white-space:pre-wrap;">${escapeHtml(message.message)}</p>
        </div>
      `,
      footer: "Reply directly to continue the conversation with the customer."
    }),
    text: `${message.name} (${message.email})\n${message.subject}\n\n${message.message}`,
    replyTo: message.email,
    tag: "contact-admin"
  });

  const customerResult = await sendEmail({
    to: message.email,
    subject: "Primus Peptides: we received your message",
    html: emailLayout({
      eyebrow: "Support confirmation",
      title: "Your message is in the queue",
      intro: `Hi ${message.name}, thanks for contacting Primus Peptides.`,
      body: `
        <div style="padding:18px;border-radius:18px;background:#f7fbff;border:1px solid rgba(20,99,211,0.12);margin-top:16px;">
          <p style="margin:0;color:#42526b;line-height:1.7;">We have recorded your enquiry and sent it to the support inbox.</p>
          <p style="margin:8px 0 0;color:#42526b;line-height:1.7;">Subject: <strong style="color:#0d172f;">${escapeHtml(message.subject || "General enquiry")}</strong></p>
        </div>
      `,
      footer: "A team member will reply using the email address you submitted."
    }),
    text: `Hi ${message.name}, we received your message and sent it to the Primus support inbox.`,
    tag: "contact-customer"
  });

  return {
    customer: customerResult,
    admin: adminResult
  };
}

module.exports = {
  isPaidStatus,
  sendContactEmails,
  sendOrderCreatedEmails,
  sendOrderStatusEmails
};
