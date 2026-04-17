const fs = require("fs");
const path = require("path");

const DATA_ROOT = path.join(__dirname, "..", ".primus-data");
const ORDERS_DIR = path.join(DATA_ROOT, "orders");
const EMAIL_LOG_PATH = path.join(DATA_ROOT, "email-outbox.ndjson");
const CONTACT_LOG_PATH = path.join(DATA_ROOT, "contact.ndjson");

function ensureDataRoot() {
  fs.mkdirSync(ORDERS_DIR, { recursive: true });
}

function safeReference(reference) {
  return String(reference || "")
    .replace(/[^A-Za-z0-9_-]/g, "")
    .slice(0, 80);
}

function orderFile(reference) {
  return path.join(ORDERS_DIR, `${safeReference(reference) || "order"}.json`);
}

function saveOrder(order) {
  ensureDataRoot();
  fs.writeFileSync(orderFile(order.reference), JSON.stringify(order, null, 2));
  return order;
}

function readOrder(reference) {
  const file = orderFile(reference);
  if (!fs.existsSync(file)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function updateOrder(reference, updater) {
  const current = readOrder(reference);
  if (!current) {
    return null;
  }

  const next = typeof updater === "function" ? updater(current) : current;
  if (!next) {
    return null;
  }

  return saveOrder(next);
}

function findOrderByInvoiceId(invoiceId) {
  if (!invoiceId) {
    return null;
  }

  ensureDataRoot();
  const files = fs.readdirSync(ORDERS_DIR);

  for (const file of files) {
    const fullPath = path.join(ORDERS_DIR, file);

    try {
      const order = JSON.parse(fs.readFileSync(fullPath, "utf8"));
      if (order.invoiceId === invoiceId) {
        return order;
      }
    } catch {
      // Ignore unreadable files and keep scanning.
    }
  }

  return null;
}

function appendNdjson(filepath, payload) {
  ensureDataRoot();
  fs.appendFileSync(filepath, `${JSON.stringify(payload)}\n`);
}

function appendEmailLog(payload) {
  appendNdjson(EMAIL_LOG_PATH, payload);
}

function appendContactLog(payload) {
  appendNdjson(CONTACT_LOG_PATH, payload);
}

module.exports = {
  appendContactLog,
  appendEmailLog,
  findOrderByInvoiceId,
  readOrder,
  saveOrder,
  updateOrder
};
