const { getAuthenticatedSession } = require("./_auth");

function applyNoStore(res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
}

module.exports = async function handler(req, res) {
  applyNoStore(res);

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = await getAuthenticatedSession(req);

  if (!auth) {
    return res.status(200).json({
      authenticated: false,
      user: null,
      session: null
    });
  }

  return res.status(200).json({
    authenticated: true,
    user: auth.publicUser,
    session: {
      expiresAt: auth.session.expiresAt
    }
  });
};
