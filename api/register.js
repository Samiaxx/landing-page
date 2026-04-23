const {
  claimOrdersForUser,
  createUserAccount,
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
    const user = await createUserAccount({
      fullName: req.body && req.body.fullName,
      email: req.body && req.body.email,
      password: req.body && req.body.password,
      confirmPassword: req.body && req.body.confirmPassword
    });

    const session = await startUserSession(req, res, user);
    const linkedOrders = await claimOrdersForUser(user);

    return res.status(201).json({
      ok: true,
      user: publicUser(user),
      session,
      linkedOrders: linkedOrders.linked
    });
  } catch (error) {
    const statusCode = error && error.statusCode ? error.statusCode : 500;

    return res.status(statusCode).json({
      error: error instanceof Error ? error.message : "Unable to create account.",
      code: error && error.code ? error.code : "register_failed"
    });
  }
};
