const { clearUserSession } = require("./_auth");

function applyNoStore(res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
}

module.exports = async function handler(req, res) {
  applyNoStore(res);

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  await clearUserSession(req, res);

  return res.status(200).json({
    ok: true
  });
};
