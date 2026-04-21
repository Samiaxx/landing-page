const { getOrderStoreStatus } = require("./_orders");
const { reconcilePendingOrders } = require("./_reconcile-orders");

function applyNoStore(res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isAuthorized(req) {
  const cronSecret = text(process.env.CRON_SECRET);
  const authorization = text(req.headers && req.headers.authorization);
  return authorization === `Bearer ${cronSecret}`;
}

function parseLimit(value) {
  const nextLimit = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(nextLimit)) {
    return 20;
  }

  return Math.min(Math.max(nextLimit, 1), 100);
}

module.exports = async function handler(req, res) {
  applyNoStore(res);

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!text(process.env.CRON_SECRET)) {
    return res.status(503).json({
      error: "CRON_SECRET is not configured for the reconciliation endpoint.",
      hint: "Add CRON_SECRET in Vercel, then call this endpoint with Authorization: Bearer <CRON_SECRET>."
    });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({
      error: "Unauthorized",
      hint: "Set CRON_SECRET in Vercel and call this endpoint with Authorization: Bearer <CRON_SECRET>."
    });
  }

  const limit = parseLimit(req.query && req.query.limit);
  const store = getOrderStoreStatus();
  const result = await reconcilePendingOrders(limit);

  return res.status(200).json({
    ok: true,
    mode: store.mode,
    durable: store.durable,
    scanned: result.scanned,
    updated: result.updated,
    results: result.results
  });
};
