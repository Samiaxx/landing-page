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
  console.log("readOrder: Looking for reference:", reference);
  console.log("readOrder: Expected file path:", file);
  console.log("readOrder: File exists:", fs.existsSync(file));
  
  if (!fs.existsSync(file)) {
    console.log("readOrder: File not found at", file);
    return null;
  }

  try {
    const order = JSON.parse(fs.readFileSync(file, "utf8"));
    console.log("readOrder: Successfully loaded order from", file);
    return order;
  } catch (e) {
    console.log("readOrder: Error parsing file:", e.message);
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
    console.log("findOrderByInvoiceId: No invoiceId provided");
    return null;
  }

  console.log("findOrderByInvoiceId: Searching for invoiceId:", invoiceId);
  ensureDataRoot();
  const files = fs.readdirSync(ordersDir());
  
  console.log("findOrderByInvoiceId: Found order files:", files);

  for (const file of files) {
    const fullPath = path.join(ordersDir(), file);

    try {
      const order = JSON.parse(fs.readFileSync(fullPath, "utf8"));
      console.log(`findOrderByInvoiceId: Checking ${file}`, {
        fileInvoiceId: order.invoiceId,
        targetInvoiceId: invoiceId,
        match: order.invoiceId === invoiceId
      });
      
      if (order.invoiceId === invoiceId) {
        console.log("findOrderByInvoiceId: Match found in", file);
        return order;
      }
    } catch (e) {
      console.log(`findOrderByInvoiceId: Error reading ${file}:`, e.message);
      // Ignore unreadable files and keep scanning.
    }
  }

  console.log("findOrderByInvoiceId: No matching order found for invoiceId:", invoiceId);
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
