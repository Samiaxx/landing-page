const fs = require("fs");
const os = require("os");
const path = require("path");

const fsp = fs.promises;

const ORDER_KEY_PREFIX = "primus:order";
const DURABLE_URL_KEYS = ["UPSTASH_REDIS_REST_URL", "KV_REST_API_URL"];
const DURABLE_TOKEN_KEYS = ["UPSTASH_REDIS_REST_TOKEN", "KV_REST_API_TOKEN"];

let dataRootCache = "";
let redisClientCache = null;

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function firstEnv(keys) {
  for (const key of keys) {
    const value = text(process.env[key]);
    if (value) {
      return value;
    }
  }

  return "";
}

function redisConfig() {
  return {
    url: firstEnv(DURABLE_URL_KEYS),
    token: firstEnv(DURABLE_TOKEN_KEYS)
  };
}

function getOrderStoreStatus() {
  const { url, token } = redisConfig();
  const vercelEnv = text(process.env.VERCEL_ENV).toLowerCase();
  const durable = Boolean(url && token);
  const requiresDurableStorage = vercelEnv === "production" || vercelEnv === "preview";

  return {
    mode: durable ? "upstash_redis" : "filesystem",
    durable,
    requiresDurableStorage,
    missing: [
      !url && "UPSTASH_REDIS_REST_URL",
      !token && "UPSTASH_REDIS_REST_TOKEN"
    ].filter(Boolean)
  };
}

function getRedisClient() {
  const { url, token } = redisConfig();
  if (!url || !token) {
    return null;
  }

  if (!redisClientCache) {
    let Redis = null;

    try {
      ({ Redis } = require("@upstash/redis"));
    } catch (error) {
      throw new Error("Durable order storage is configured, but @upstash/redis is not installed.");
    }

    redisClientCache = new Redis({
      url,
      token,
      enableTelemetry: false
    });
  }

  return redisClientCache;
}

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

function safeInvoiceId(invoiceId) {
  return String(invoiceId || "")
    .replace(/[^A-Za-z0-9_-]/g, "")
    .slice(0, 160);
}

function orderFile(reference) {
  return path.join(ordersDir(), `${safeReference(reference) || "order"}.json`);
}

function orderReferenceKey(reference) {
  return `${ORDER_KEY_PREFIX}:reference:${safeReference(reference) || "order"}`;
}

function orderInvoiceKey(invoiceId) {
  return `${ORDER_KEY_PREFIX}:invoice:${safeInvoiceId(invoiceId)}`;
}

async function pathExists(filepath) {
  try {
    await fsp.access(filepath);
    return true;
  } catch {
    return false;
  }
}

function normalizeStoredOrder(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  return typeof value === "object" ? value : null;
}

async function saveOrderToFile(order) {
  ensureDataRoot();
  await fsp.writeFile(orderFile(order.reference), JSON.stringify(order, null, 2));
  return order;
}

async function readOrderFromFile(reference) {
  const file = orderFile(reference);
  if (!(await pathExists(file))) {
    return null;
  }

  try {
    return JSON.parse(await fsp.readFile(file, "utf8"));
  } catch {
    return null;
  }
}

async function findOrderByInvoiceIdFromFile(invoiceId) {
  if (!invoiceId) {
    return null;
  }

  ensureDataRoot();
  const files = await fsp.readdir(ordersDir());

  for (const file of files) {
    const fullPath = path.join(ordersDir(), file);

    try {
      const order = JSON.parse(await fsp.readFile(fullPath, "utf8"));
      if (text(order.invoiceId) === invoiceId) {
        return order;
      }
    } catch {
      // Ignore unreadable files and keep scanning.
    }
  }

  return null;
}

function appendFileLog(filepath, payload) {
  ensureDataRoot();
  fs.appendFileSync(filepath, `${JSON.stringify(payload)}\n`);
}

async function saveOrderToRedis(redis, order) {
  const tasks = [redis.set(orderReferenceKey(order.reference), order)];

  if (order.invoiceId) {
    tasks.push(redis.set(orderInvoiceKey(order.invoiceId), order.reference));
  }

  await Promise.all(tasks);
  return order;
}

async function readOrderFromRedis(redis, reference) {
  return normalizeStoredOrder(await redis.get(orderReferenceKey(reference)));
}

async function findOrderByInvoiceIdFromRedis(redis, invoiceId) {
  if (!invoiceId) {
    return null;
  }

  const reference = text(await redis.get(orderInvoiceKey(invoiceId)));
  if (!reference) {
    return null;
  }

  return readOrderFromRedis(redis, reference);
}

async function saveOrder(order) {
  const reference = safeReference(order && order.reference);
  if (!reference) {
    throw new Error("Order reference is required.");
  }

  const nextOrder = {
    ...order,
    reference
  };

  const redis = getRedisClient();
  if (redis) {
    return saveOrderToRedis(redis, nextOrder);
  }

  return saveOrderToFile(nextOrder);
}

async function readOrder(reference) {
  const normalizedReference = safeReference(reference);
  if (!normalizedReference) {
    return null;
  }

  const redis = getRedisClient();
  if (redis) {
    return readOrderFromRedis(redis, normalizedReference);
  }

  return readOrderFromFile(normalizedReference);
}

async function updateOrder(reference, updater) {
  const current = await readOrder(reference);
  if (!current) {
    return null;
  }

  const next = typeof updater === "function" ? await updater(current) : current;
  if (!next) {
    return null;
  }

  return saveOrder(next);
}

async function findOrderByInvoiceId(invoiceId) {
  const normalizedInvoiceId = safeInvoiceId(invoiceId);
  if (!normalizedInvoiceId) {
    return null;
  }

  const redis = getRedisClient();
  if (redis) {
    return findOrderByInvoiceIdFromRedis(redis, normalizedInvoiceId);
  }

  return findOrderByInvoiceIdFromFile(normalizedInvoiceId);
}

function appendEmailLog(payload) {
  appendFileLog(emailLogPath(), payload);
}

function appendContactLog(payload) {
  appendFileLog(contactLogPath(), payload);
}

module.exports = {
  appendContactLog,
  appendEmailLog,
  findOrderByInvoiceId,
  getOrderStoreStatus,
  readOrder,
  saveOrder,
  updateOrder
};
