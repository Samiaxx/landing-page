const fs = require("fs");
const os = require("os");
const path = require("path");

let dataRootCache = "";

function resolveDataRoot() {
  if (dataRootCache) {
    return dataRootCache;
  }

  const candidates = [
    process.env.PRIMUS_DATA_DIR,
    path.join(os.tmpdir(), "primus-peptides-data"),
    path.join(__dirname, "..", ".primus-data")
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      fs.mkdirSync(candidate, { recursive: true });
      dataRootCache = candidate;
      return dataRootCache;
    } catch {
      // Try the next writable location.
    }
  }

  throw new Error("Unable to initialize a writable data directory for Primus orders.");
}

function ordersDir() {
  return path.join(resolveDataRoot(), "orders");
}

function emailLogPath() {
  return path.join(resolveDataRoot(), "email-outbox.ndjson");
}

function contactLogPath() {
  return path.join(resolveDataRoot(), "contact.ndjson");
}

function ensureDataRoot() {
  fs.mkdirSync(ordersDir(), { recursive: true });
}

function safeReference(reference) {
  return String(reference || "")
    .replace(/[^A-Za-z0-9_-]/g, "")
    .slice(0, 80);
}

function orderFile(reference) {
  return path.join(ordersDir(), `${safeReference(reference) || "order"}.json`);
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
  const files = fs.readdirSync(ordersDir());

  for (const file of files) {
    const fullPath = path.join(ordersDir(), file);

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
  appendNdjson(emailLogPath(), payload);
}

function appendContactLog(payload) {
  appendNdjson(contactLogPath(), payload);
}

module.exports = {
  appendContactLog,
  appendEmailLog,
  findOrderByInvoiceId,
  readOrder,
  saveOrder,
  updateOrder
};
