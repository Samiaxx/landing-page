const {
  PAYMENT_OPTIONS,
  SHIPPING_OPTIONS,
  customerName
} = require("./_catalog");
const { appendEmailLog } = require("./_orders");

let smtpTransporterCache = null;
let smtpTransporterKey = "";
let nodemailerModule = null;

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

function parseBoolean(value, fallback = false) {
  const normalized = trimValue(value).toLowerCase();
  if (!normalized) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(normalized);
}

function normalizeProvider(value) {
  return trimValue(value)
    .toLowerCase()
    .replace(/_/g, "-");
}

function parseSender(value, fallbackName = "Primus Peptides") {
  const raw = trimValue(value);
  const match = raw.match(/^(.*?)<([^>]+)>$/);

  if (match) {
    return {
      name: trimValue(match[1]).replace(/^"|"$/g, "") || fallbackName,
      email: trimValue(match[2])
    };
  }

  return {
    name: fallbackName,
    email: raw
  };
}

function formatFromHeader(sender) {
  if (!sender.email) {
    return "";
  }

  return `${sender.name || "Primus Peptides"} <${sender.email}>`;
}

function siteBaseUrl() {
  const explicit = trimValue(process.env.SITE_BASE_URL || process.env.PUBLIC_SITE_URL);
  if (explicit) {
    return explicit.replace(/\/+$/, "");
  }

  const vercelUrl = trimValue(process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL);
  return vercelUrl ? `https://${vercelUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "")}` : "";
}

function getEmailConfig() {
  const fromName = trimValue(process.env.EMAIL_FROM_NAME) || "Primus Peptides";
  const sender = parseSender(
    process.env.EMAIL_FROM || process.env.RESEND_FROM || process.env.BREVO_FROM || "",
    fromName
  );
  const replyTo = trimValue(process.env.EMAIL_REPLY_TO || process.env.SUPPORT_EMAIL || "");

  return {
    provider: normalizeProvider(process.env.EMAIL_PROVIDER || "auto"),
    sender,
    fromHeader: formatFromHeader(sender),
    replyTo,
    supportEmail: trimValue(process.env.SUPPORT_EMAIL || replyTo || sender.email),
    siteUrl: siteBaseUrl(),
    adminTo: splitRecipients(process.env.ADMIN_EMAIL || process.env.ORDER_ADMIN_EMAIL || process.env.STORE_ADMIN_EMAIL || ""),
    resendApiKey: trimValue(process.env.RESEND_API_KEY),
    brevoApiKey: trimValue(process.env.BREVO_API_KEY),
    smtp: {
      host: trimValue(process.env.BREVO_SMTP_HOST || process.env.SMTP_HOST),
      port: Number(process.env.BREVO_SMTP_PORT || process.env.SMTP_PORT || 587),
      user: trimValue(process.env.BREVO_SMTP_USER || process.env.SMTP_USER),
      pass: trimValue(process.env.BREVO_SMTP_PASS || process.env.SMTP_PASS),
      secure: parseBoolean(process.env.BREVO_SMTP_SECURE || process.env.SMTP_SECURE, false)
    }
  };
}

function providerAvailable(provider, config) {
  if (!config.sender.email) {
    return false;
  }

  if (provider === "resend") {
    return Boolean(config.resendApiKey);
  }

  if (provider === "brevo-api") {
    return Boolean(config.brevoApiKey);
  }

  if (provider === "brevo-smtp" || provider === "smtp") {
    return Boolean(config.smtp.host && config.smtp.port && config.smtp.user && config.smtp.pass);
  }

  return false;
}

function resolveProvider(config) {
  const preferred = config.provider;
  const aliases = {
    brevo: "brevo-smtp",
    "brevo-smtp": "brevo-smtp",
    smtp: "brevo-smtp",
    "brevo-api": "brevo-api",
    resend: "resend"
  };

  if (preferred === "disabled" || preferred === "off" || preferred === "none") {
    return "";
  }

  if (preferred && preferred !== "auto") {
    const provider = aliases[preferred] || preferred;
    return providerAvailable(provider, config) ? provider : "";
  }

  return ["resend", "brevo-api", "brevo-smtp"].find((provider) => providerAvailable(provider, config)) || "";
}

function isEmailConfigured() {
  return Boolean(resolveProvider(getEmailConfig()));
}

function getSmtpTransporter(config) {
  if (!nodemailerModule) {
    nodemailerModule = require("nodemailer");
  }

  const key = [
    config.smtp.host,
    config.smtp.port,
    config.smtp.user,
    config.smtp.secure ? "secure" : "starttls"
  ].join("|");

  if (!smtpTransporterCache || smtpTransporterKey !== key) {
    smtpTransporterCache = nodemailerModule.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass
      }
    });
    smtpTransporterKey = key;
  }

  return smtpTransporterCache;
}

function money(amount, currency = "EUR") {
  return `${currency} ${Number(amount || 0).toFixed(2)}`;
}

function gatewayTotalLine(order) {
  const gatewayAmount = Number(order.gatewayFiatAmount || order.gatewayPayload?.amountFiat || 0);
  const gatewayCurrency = trimValue(order.gatewayFiatCurrency || order.gatewayCurrency || order.gatewayPayload?.asset || "");
  const storeCurrency = trimValue(order.storeCurrency || "EUR");
  const storeTotal = money(order.total, storeCurrency);

  if (gatewayAmount > 0 && gatewayCurrency && gatewayCurrency !== storeCurrency) {
    return `${storeTotal} (ArionPay invoice: ${money(gatewayAmount, gatewayCurrency)})`;
  }

  return storeTotal;
}

function orderItemsMarkup(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  if (!items.length) {
    return `
      <tr>
        <td colspan="3" style="padding:14px 0;color:#64748b;">No line items were supplied by the order record.</td>
      </tr>
    `;
  }

  return items.map((item) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #e7eef8;color:#0d172f;">
        <strong>${escapeHtml(item.name || "Product")}</strong>
        <span style="display:block;margin-top:3px;color:#64748b;font-size:13px;">${escapeHtml(item.dosage || item.slug || "")}</span>
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #e7eef8;color:#475569;text-align:center;">${escapeHtml(item.quantity || 1)}</td>
      <td style="padding:12px 0;border-bottom:1px solid #e7eef8;color:#0d172f;text-align:right;font-weight:700;">${money(item.lineTotal || item.unitPrice || 0, order.storeCurrency || "EUR")}</td>
    </tr>
  `).join("");
}

function orderItemsText(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  if (!items.length) {
    return "Items: No line items were supplied.";
  }

  return items
    .map((item) => `- ${item.name || "Product"} ${item.dosage || ""} x ${item.quantity || 1}: ${money(item.lineTotal || item.unitPrice || 0, order.storeCurrency || "EUR")}`)
    .join("\n");
}

function orderSummaryMarkup(order, options = {}) {
  const currency = order.storeCurrency || "EUR";
  const totalLabel = trimValue(options.totalLabel) || "Total Amount";
  return `
    <table role="presentation" style="width:100%;border-collapse:collapse;margin-top:18px;">
      <thead>
        <tr>
          <th style="padding-bottom:10px;text-align:left;color:#64748b;font-size:12px;letter-spacing:.08em;text-transform:uppercase;">Product</th>
          <th style="padding-bottom:10px;text-align:center;color:#64748b;font-size:12px;letter-spacing:.08em;text-transform:uppercase;">Qty</th>
          <th style="padding-bottom:10px;text-align:right;color:#64748b;font-size:12px;letter-spacing:.08em;text-transform:uppercase;">Total</th>
        </tr>
      </thead>
      <tbody>${orderItemsMarkup(order)}</tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding-top:14px;color:#64748b;">Subtotal</td>
          <td style="padding-top:14px;text-align:right;color:#0d172f;font-weight:700;">${money(order.subtotal, currency)}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding-top:8px;color:#64748b;">Shipping</td>
          <td style="padding-top:8px;text-align:right;color:#0d172f;font-weight:700;">${money(order.shippingCost, currency)}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding-top:12px;color:#0d172f;font-size:16px;font-weight:800;">${escapeHtml(totalLabel)}</td>
          <td style="padding-top:12px;text-align:right;color:#0d172f;font-size:16px;font-weight:800;">${money(order.total, currency)}</td>
        </tr>
      </tfoot>
    </table>
  `;
}

function customerDetailsMarkup(order) {
  const customer = order.customer || {};
  const rows = [
    ["Name", customerName(customer) || "Customer"],
    ["Email", customer.email || ""],
    ["Phone", customer.phone || ""],
    ["Country", customer.country || ""],
    ["City", customer.city || ""],
    ["Address", [customer.address, customer.addressLine2, customer.postalCode].filter(Boolean).join(", ")]
  ].filter(([, value]) => trimValue(value));

  return rows.map(([label, value]) => `
    <p style="margin:8px 0;color:#42526b;line-height:1.6;">
      ${escapeHtml(label)}: <strong style="color:#0d172f;">${escapeHtml(value)}</strong>
    </p>
  `).join("");
}

function customerDetailsText(order) {
  const customer = order.customer || {};
  const rows = [
    ["Name", customerName(customer) || "Customer"],
    ["Email", customer.email || ""],
    ["Phone", customer.phone || ""],
    ["Country", customer.country || ""],
    ["City", customer.city || ""],
    ["Address", [customer.address, customer.addressLine2, customer.postalCode].filter(Boolean).join(", ")]
  ].filter(([, value]) => trimValue(value));

  return rows.map(([label, value]) => `${label}: ${value}`).join("\n");
}

function infoCard(title, content) {
  return `
    <div style="padding:18px;border-radius:20px;background:#f7fbff;border:1px solid rgba(20,99,211,0.14);margin-top:16px;">
      <p style="margin:0 0 8px;color:#0d3f88;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;">${escapeHtml(title)}</p>
      ${content}
    </div>
  `;
}

function emailLayout({ preview, eyebrow, title, intro, body, ctaLabel, ctaHref, footer }) {
  const button = ctaLabel && ctaHref
    ? `<p style="margin:26px 0 0;"><a href="${escapeHtml(ctaHref)}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#1463d3;color:#ffffff;text-decoration:none;font-weight:800;box-shadow:0 12px 28px rgba(20,99,211,.24);">${escapeHtml(ctaLabel)}</a></p>`
    : "";

  return `
    <div style="display:none;max-height:0;overflow:hidden;color:transparent;opacity:0;">${escapeHtml(preview || intro || "")}</div>
    <div style="margin:0;padding:34px 16px;background:linear-gradient(135deg,#eef6ff 0%,#f8fbff 48%,#ffffff 100%);font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:660px;margin:0 auto;">
        <div style="padding:22px 26px;border-radius:28px 28px 0 0;background:#0d172f;color:#ffffff;">
          <p style="margin:0;color:#7fc0ff;font-size:12px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;">PRIMUS PEPTIDES</p>
          <p style="margin:8px 0 0;color:#d7e7ff;font-size:13px;">Secure research product ordering and order communication.</p>
        </div>
        <div style="background:#ffffff;border:1px solid rgba(13,23,47,0.08);border-top:0;border-radius:0 0 28px 28px;padding:30px 26px;box-shadow:0 18px 50px rgba(13,23,47,.08);">
          <p style="margin:0 0 10px;color:#1463d3;font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;">${escapeHtml(eyebrow)}</p>
          <h1 style="margin:0 0 14px;color:#07142f;font-size:30px;line-height:1.15;letter-spacing:-.03em;">${escapeHtml(title)}</h1>
          <p style="margin:0 0 14px;color:#42526b;font-size:15px;line-height:1.75;">${escapeHtml(intro)}</p>
          ${body}
          ${button}
          <p style="margin:26px 0 0;color:#64748b;line-height:1.65;font-size:13px;">${escapeHtml(footer)}</p>
        </div>
      </div>
    </div>
  `;
}

function orderViewUrl(order, config) {
  if (!config.siteUrl || !order.reference) {
    return "";
  }

  return `${config.siteUrl}/checkout.html?reference=${encodeURIComponent(order.reference)}&status=success`;
}

function checkoutUrl(config) {
  return config.siteUrl ? `${config.siteUrl}/checkout.html` : "";
}

function orderContext(order) {
  const customer = order.customer || {};
  const shipping = SHIPPING_OPTIONS[order.shippingMethod] || SHIPPING_OPTIONS["eu-standard"];
  const payment = PAYMENT_OPTIONS[order.paymentMethod] || PAYMENT_OPTIONS.USDT_TRC20;
  const fullName = customerName(customer) || customer.email || "Customer";
  const firstName = customer.firstName || fullName.split(/\s+/)[0] || "there";
  const config = getEmailConfig();

  return {
    config,
    customer,
    fullName,
    firstName,
    payment,
    shipping,
    accountUrl: config.siteUrl ? `${config.siteUrl}/account.html` : "",
    supportEmail: config.supportEmail || "support"
  };
}

async function sendWithResend(config, mail) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      "Content-Type": "application/json",
      ...(mail.idempotencyKey ? { "Idempotency-Key": mail.idempotencyKey } : {})
    },
    body: JSON.stringify({
      from: config.fromHeader,
      to: mail.recipients,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      reply_to: mail.replyTo || config.replyTo || undefined
    })
  });

  const result = await response.json().catch(() => ({}));
  return {
    ok: response.ok,
    status: response.status,
    response: result
  };
}

async function sendWithBrevoApi(config, mail) {
  const replySender = parseSender(mail.replyTo || config.replyTo || config.sender.email, config.sender.name);
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": config.brevoApiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      sender: config.sender,
      to: mail.recipients.map((email) => ({ email })),
      subject: mail.subject,
      htmlContent: mail.html,
      textContent: mail.text,
      replyTo: replySender.email ? replySender : undefined
    })
  });

  const result = await response.json().catch(() => ({}));
  return {
    ok: response.ok,
    status: response.status,
    response: result
  };
}

async function sendWithBrevoSmtp(config, mail) {
  const transporter = getSmtpTransporter(config);
  const result = await transporter.sendMail({
    from: config.fromHeader,
    to: mail.recipients.join(", "),
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
    replyTo: mail.replyTo || config.replyTo || undefined,
    headers: mail.idempotencyKey ? { "X-Primus-Idempotency-Key": mail.idempotencyKey } : undefined
  });

  return {
    ok: true,
    status: "sent",
    messageId: result.messageId,
    accepted: result.accepted,
    rejected: result.rejected
  };
}

async function sendEmail({ to, subject, html, text, replyTo, tag, idempotencyKey }) {
  const config = getEmailConfig();
  const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
  const provider = resolveProvider(config);
  const payload = {
    to: recipients,
    subject,
    tag,
    provider: provider || "none",
    idempotencyKey,
    sentAt: new Date().toISOString()
  };

  if (!recipients.length) {
    payload.result = { ok: false, reason: "missing_recipient" };
    appendEmailLog(payload);
    return payload.result;
  }

  if (!provider) {
    payload.result = { ok: false, reason: "missing_email_config" };
    appendEmailLog(payload);
    return payload.result;
  }

  try {
    const mail = { recipients, subject, html, text, replyTo, idempotencyKey };
    if (provider === "resend") {
      payload.result = await sendWithResend(config, mail);
    } else if (provider === "brevo-api") {
      payload.result = await sendWithBrevoApi(config, mail);
    } else {
      payload.result = await sendWithBrevoSmtp(config, mail);
    }

    payload.result.provider = provider;
    appendEmailLog(payload);
    return payload.result;
  } catch (error) {
    payload.result = {
      ok: false,
      provider,
      reason: error instanceof Error ? error.message : "unknown_error"
    };
    appendEmailLog(payload);
    return payload.result;
  }
}

async function sendOrderCreatedEmails(order) {
  const { payment, shipping, config } = orderContext(order);
  const existing = (order.notifications && order.notifications.created) || {};
  const nextCreated = {
    ...existing,
    lastAttemptAt: new Date().toISOString()
  };

  const customerIntro = "Thank you for your order. Your order has been created successfully and is currently awaiting payment confirmation. Once payment is received, we will immediately confirm your order and begin processing.";
  const customerBody = `
    ${infoCard("Order Summary", `
      <p style="margin:0;color:#42526b;line-height:1.7;">Order Reference: <strong style="color:#0d172f;">${escapeHtml(order.reference)}</strong></p>
      <p style="margin:8px 0 0;color:#42526b;line-height:1.7;">Payment Method: <strong style="color:#0d172f;">${escapeHtml(payment.label)}</strong></p>
      <p style="margin:8px 0 0;color:#42526b;line-height:1.7;">Delivery: <strong style="color:#0d172f;">${escapeHtml(shipping.label)}</strong> (${escapeHtml(shipping.eta)})</p>
    `)}
    ${orderSummaryMarkup(order, { totalLabel: "Total Amount" })}
  `;

  if (existing.customer && existing.customer.ok) {
    nextCreated.customer = { ...existing.customer, skipped: true, reason: "already_sent" };
  } else {
    nextCreated.customer = await sendEmail({
      to: order.customer && order.customer.email,
      subject: "Your Order Has Been Created — Awaiting Payment",
      html: emailLayout({
        preview: `Order ${order.reference} is awaiting payment confirmation.`,
        eyebrow: "Order created",
        title: "Your Order Is Ready for Payment",
        intro: customerIntro,
        body: customerBody,
        ctaLabel: "Complete Payment",
        ctaHref: order.invoiceUrl,
        footer: "Need help? Reply to this email for support."
      }),
      text: `Thank you for your order.\n\nYour order has been created successfully and is currently awaiting payment confirmation.\n\nOnce payment is received, we will immediately confirm your order and begin processing.\n\nOrder Reference: ${order.reference}\n${orderItemsText(order)}\nTotal Amount: ${money(order.total, order.storeCurrency || "EUR")}`,
      tag: "order-created-customer",
      idempotencyKey: `order-created-customer-${order.reference}`
    });
  }

  const adminBody = `
    ${infoCard("Customer", customerDetailsMarkup(order))}
    ${infoCard("Order", `
      <p style="margin:0;color:#42526b;line-height:1.7;">Order Reference: <strong style="color:#0d172f;">${escapeHtml(order.reference)}</strong></p>
      <p style="margin:8px 0 0;color:#42526b;line-height:1.7;">Status: <strong style="color:#0d172f;">Awaiting payment confirmation</strong></p>
    `)}
    ${orderSummaryMarkup(order, { totalLabel: "Total" })}
  `;

  if (existing.admin && existing.admin.ok) {
    nextCreated.admin = { ...existing.admin, skipped: true, reason: "already_sent" };
  } else {
    nextCreated.admin = await sendEmail({
      to: config.adminTo,
      subject: "New Order Received",
      html: emailLayout({
        preview: `New order ${order.reference} is awaiting payment confirmation.`,
        eyebrow: "Admin notification",
        title: "A New Customer Order Has Been Created",
        intro: "A new order has been placed and is currently awaiting payment confirmation.",
        body: adminBody,
        footer: "Review the order record and wait for payment confirmation before fulfilment."
      }),
      text: `A new order has been placed and is currently awaiting payment confirmation.\n\n${customerDetailsText(order)}\nOrder Reference: ${order.reference}\n${orderItemsText(order)}\nTotal: ${money(order.total, order.storeCurrency || "EUR")}`,
      tag: "order-created-admin",
      idempotencyKey: `order-created-admin-${order.reference}`
    });
  }

  if ((nextCreated.customer && nextCreated.customer.ok) || (nextCreated.admin && nextCreated.admin.ok)) {
    nextCreated.sentAt = existing.sentAt || nextCreated.lastAttemptAt;
  }

  return {
    ...(order.notifications || {}),
    created: nextCreated,
    customer: nextCreated.customer,
    admin: nextCreated.admin
  };
}

function isPaidStatus(status) {
  return /paid|completed|confirmed|success/i.test(String(status || ""));
}

function isFailedStatus(status) {
  return /failed|expired|unpaid|cancel|canceled|cancelled|void|invalid/i.test(String(status || ""));
}

function statusNotificationKey(status) {
  if (isPaidStatus(status)) {
    return "paid";
  }

  if (isFailedStatus(status)) {
    return "failed";
  }

  return "";
}

function existingStatusNotifications(order, key) {
  return (order && order.notifications && order.notifications[key]) || {};
}

async function sendOrderStatusEmails(order, previousStatus) {
  const statusKey = statusNotificationKey(order.status);
  if (!statusKey) {
    return order.notifications || null;
  }

  const { payment, accountUrl, config } = orderContext(order);
  const existing = existingStatusNotifications(order, statusKey);
  const attemptedAt = new Date().toISOString();
  const nextStatus = {
    ...existing,
    lastAttemptAt: attemptedAt
  };
  delete nextStatus.processingAt;

  if (statusKey === "paid") {
    if (existing.customer && existing.customer.ok) {
      nextStatus.customer = {
        ...existing.customer,
        skipped: true,
        reason: "already_sent"
      };
    } else {
      const intro = "We have received your payment successfully. Your order is now confirmed and has moved into processing. Our team will keep you updated on the next steps.";
      nextStatus.customer = await sendEmail({
        to: order.customer && order.customer.email,
        subject: "Payment Confirmed — Your Order Is Now Processing",
        html: emailLayout({
          preview: `Payment confirmed for order ${order.reference}.`,
          eyebrow: "Payment confirmed",
          title: "Payment Successfully Confirmed",
          intro,
          body: `
            ${infoCard("Order Summary", `
              <p style="margin:0;color:#42526b;line-height:1.7;">Order Reference: <strong style="color:#0d172f;">${escapeHtml(order.reference)}</strong></p>
              <p style="margin:8px 0 0;color:#42526b;line-height:1.7;">Payment Status: <strong style="color:#0d172f;">Confirmed</strong></p>
              <p style="margin:8px 0 0;color:#42526b;line-height:1.7;">Items Ordered: <strong style="color:#0d172f;">${escapeHtml((order.items || []).length || 0)}</strong></p>
              <p style="margin:8px 0 0;color:#42526b;line-height:1.7;">Total Paid: <strong style="color:#0d172f;">${escapeHtml(gatewayTotalLine(order))}</strong></p>
            `)}
            ${orderSummaryMarkup(order, { totalLabel: "Total Paid" })}
          `,
          ctaLabel: "View Order",
          ctaHref: orderViewUrl(order, config) || accountUrl,
          footer: "Thank you for choosing Primus Peptides."
        }),
        text: `We have received your payment successfully.\n\nYour order is now confirmed and has moved into processing.\n\nOur team will keep you updated on the next steps.\n\nOrder Reference: ${order.reference}\nPayment Status: Confirmed\n${orderItemsText(order)}\nTotal Paid: ${gatewayTotalLine(order)}`,
        tag: "paid-order-customer",
        idempotencyKey: `paid-order-customer-${order.reference}`
      });
    }

    if (existing.admin && existing.admin.ok) {
      nextStatus.admin = {
        ...existing.admin,
        skipped: true,
        reason: "already_sent"
      };
    } else {
      nextStatus.admin = await sendEmail({
        to: config.adminTo,
        subject: "Payment Confirmed for New Order",
        html: emailLayout({
          preview: `Payment confirmed for order ${order.reference}.`,
          eyebrow: "Paid order",
          title: "A Customer Payment Has Been Received",
          intro: "A recent order has now been successfully paid and is ready for fulfillment.",
          body: `
            ${infoCard("Customer", customerDetailsMarkup(order))}
            ${infoCard("Payment", `
              <p style="margin:0;color:#42526b;line-height:1.7;">Customer Name: <strong style="color:#0d172f;">${escapeHtml(customerName(order.customer || {}) || "Customer")}</strong></p>
              <p style="margin:8px 0 0;color:#42526b;line-height:1.7;">Order Reference: <strong style="color:#0d172f;">${escapeHtml(order.reference)}</strong></p>
              <p style="margin:8px 0 0;color:#42526b;line-height:1.7;">Total Paid: <strong style="color:#0d172f;">${escapeHtml(gatewayTotalLine(order))}</strong></p>
            `)}
          `,
          footer: "This notification is sent once per paid order. Webhook retries will not duplicate it after a successful send."
        }),
        text: `A recent order has now been successfully paid and is ready for fulfillment.\n\nCustomer Name: ${customerName(order.customer || {}) || "Customer"}\nOrder Reference: ${order.reference}\nTotal Paid: ${gatewayTotalLine(order)}`,
        tag: "paid-order-admin",
        idempotencyKey: `paid-order-admin-${order.reference}`
      });
    }
  }

  if (statusKey === "failed") {
    if (existing.customer && existing.customer.ok) {
      nextStatus.customer = {
        ...existing.customer,
        skipped: true,
        reason: "already_sent"
      };
    } else {
      const intro = "We noticed that payment for your recent order was not completed successfully. If this was accidental, you can return and complete your order anytime. If you need assistance, our support team is ready to help.";
      nextStatus.customer = await sendEmail({
        to: order.customer && order.customer.email,
        subject: "Payment Not Completed — Action Needed",
        html: emailLayout({
          preview: `Payment was not completed for order ${order.reference}.`,
          eyebrow: "Payment not completed",
          title: "Your Payment Was Not Completed",
          intro,
          body: `
            ${infoCard("Order Summary", `
              <p style="margin:0;color:#42526b;line-height:1.7;">Order Reference: <strong style="color:#0d172f;">${escapeHtml(order.reference)}</strong></p>
              <p style="margin:8px 0 0;color:#42526b;line-height:1.7;">Payment Status: <strong style="color:#0d172f;">${escapeHtml(order.status || "Not completed")}</strong></p>
            `)}
            ${orderSummaryMarkup(order, { totalLabel: "Total Amount" })}
          `,
          ctaLabel: "Complete Payment",
          ctaHref: order.invoiceUrl || checkoutUrl(config),
          footer: "Need help? Contact support anytime."
        }),
        text: `We noticed that payment for your recent order was not completed successfully.\n\nIf this was accidental, you can return and complete your order anytime.\n\nIf you need assistance, our support team is ready to help.\n\nOrder Reference: ${order.reference}\n${orderItemsText(order)}\nTotal Amount: ${money(order.total, order.storeCurrency || "EUR")}`,
        tag: "payment-failed-customer",
        idempotencyKey: `payment-failed-customer-${order.reference}`
      });
    }

    if (existing.admin && existing.admin.ok) {
      nextStatus.admin = {
        ...existing.admin,
        skipped: true,
        reason: "already_sent"
      };
    } else {
      nextStatus.admin = await sendEmail({
        to: config.adminTo,
        subject: `Payment Not Completed for Order ${order.reference}`,
        html: emailLayout({
          preview: `Payment was not completed for order ${order.reference}.`,
          eyebrow: "Payment not completed",
          title: "Payment Was Not Completed",
          intro: `Order ${order.reference} moved to ${order.status || "failed"} and may need customer support follow-up.`,
          body: `
            ${infoCard("Customer", customerDetailsMarkup(order))}
            ${infoCard("Order", `
              <p style="margin:0;color:#42526b;line-height:1.7;">Order Reference: <strong style="color:#0d172f;">${escapeHtml(order.reference)}</strong></p>
              <p style="margin:8px 0 0;color:#42526b;line-height:1.7;">Status: <strong style="color:#0d172f;">${escapeHtml(order.status || "failed")}</strong></p>
            `)}
            ${orderSummaryMarkup(order, { totalLabel: "Total Amount" })}
          `,
          footer: "Review the payment state before contacting the customer or reissuing a payment link."
        }),
        text: `Payment was not completed for order ${order.reference}.\n\n${customerDetailsText(order)}\nStatus: ${order.status || "failed"}\n${orderItemsText(order)}\nTotal: ${money(order.total, order.storeCurrency || "EUR")}`,
        tag: "payment-failed-admin",
        idempotencyKey: `payment-failed-admin-${order.reference}`
      });
    }
  }

  if ((nextStatus.customer && nextStatus.customer.ok) || (nextStatus.admin && nextStatus.admin.ok)) {
    nextStatus.sentAt = existing.sentAt || attemptedAt;
  }

  return {
    ...(order.notifications || {}),
    [statusKey]: nextStatus
  };
}

async function sendContactEmails(message) {
  const config = getEmailConfig();
  const supportReference = trimValue(message.supportReference) || `SUP-${Date.now().toString(36).toUpperCase()}`;
  const adminResult = await sendEmail({
    to: config.adminTo,
    subject: "New Customer Support Message",
    html: emailLayout({
      preview: `${message.name} submitted a new support request.`,
      eyebrow: "Support request",
      title: "New Support Request Received",
      intro: "A customer has submitted a new support request.",
      body: infoCard("Message Details", `
        <p style="margin:0;color:#42526b;line-height:1.7;">Name: <strong style="color:#0d172f;">${escapeHtml(message.name)}</strong></p>
        <p style="margin:8px 0 0;color:#42526b;line-height:1.7;">Email: <strong style="color:#0d172f;">${escapeHtml(message.email)}</strong></p>
        <p style="margin:8px 0 0;color:#42526b;line-height:1.7;">Subject: <strong style="color:#0d172f;">${escapeHtml(message.subject || "General enquiry")}</strong></p>
        <p style="margin:8px 0 0;color:#42526b;line-height:1.7;">Support Reference: <strong style="color:#0d172f;">${escapeHtml(supportReference)}</strong></p>
        <p style="margin:12px 0 0;color:#42526b;line-height:1.7;white-space:pre-wrap;">${escapeHtml(message.message)}</p>
      `),
      footer: "Reply directly to continue the conversation with the customer."
    }),
    text: `A customer has submitted a new support request.\n\nName: ${message.name}\nEmail: ${message.email}\nSubject: ${message.subject || "General enquiry"}\nSupport Reference: ${supportReference}\n\n${message.message}`,
    replyTo: message.email,
    tag: "contact-admin",
    idempotencyKey: `support-admin-${supportReference}`
  });

  const customerResult = await sendEmail({
    to: message.email,
    subject: "We Received Your Message",
    html: emailLayout({
      preview: `Support request ${supportReference} has been received.`,
      eyebrow: "Support confirmation",
      title: "Support Request Received",
      intro: "Thank you for contacting us. We have received your message and a member of our support team will respond as soon as possible.",
      body: infoCard("Support Reference", `
        <p style="margin:0;color:#42526b;line-height:1.7;">Support Reference: <strong style="color:#0d172f;">${escapeHtml(supportReference)}</strong></p>
      `),
      footer: "We appreciate your patience."
    }),
    text: `Thank you for contacting us.\n\nWe have received your message and a member of our support team will respond as soon as possible.\n\nSupport Reference: ${supportReference}\n\nWe appreciate your patience.`,
    tag: "contact-customer",
    idempotencyKey: `support-customer-${supportReference}`
  });

  return {
    supportReference,
    customer: customerResult,
    admin: adminResult
  };
}

module.exports = {
  getEmailConfig,
  isEmailConfigured,
  isFailedStatus,
  isPaidStatus,
  sendContactEmails,
  sendOrderCreatedEmails,
  sendOrderStatusEmails
};
