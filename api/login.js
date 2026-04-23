const {
  authenticateUserAccount,
  claimOrdersForUser,
  publicUser,
  startUserSession
} = require("./_auth");

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

  try {
    const user = await authenticateUserAccount({
      email: req.body && req.body.email,
      password: req.body && req.body.password
    });

    const session = await startUserSession(req, res, user);
    const linkedOrders = await claimOrdersForUser(user);

    return res.status(200).json({
      ok: true,
      user: publicUser(user),
      session,
      linkedOrders: linkedOrders.linked
    });
  } catch (error) {
    const statusCode = error && error.statusCode ? error.statusCode : 500;

    return res.status(statusCode).json({
      error: error instanceof Error ? error.message : "Unable to sign in.",
      code: error && error.code ? error.code : "login_failed",
      lockedUntil: error && error.lockedUntil ? error.lockedUntil : ""
    });
  }
};
