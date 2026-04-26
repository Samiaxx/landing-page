const { appendContactLog } = require("./_orders");
const { sendContactEmails } = require("./_email");

function parseBody(req) {
  if (!req.body) {
    return {};
  }

  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  return req.body;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = parseBody(req);
  const payload = {
    name: typeof body.name === "string" ? body.name.trim() : "",
    email: typeof body.email === "string" ? body.email.trim().toLowerCase() : "",
    subject: typeof body.subject === "string" ? body.subject.trim() : "",
    message: typeof body.message === "string" ? body.message.trim() : "",
    supportReference: `SUP-${Date.now().toString(36).toUpperCase()}`
  };

  const missing = [];

  if (!payload.name) {
    missing.push("name");
  }
  if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    missing.push("email");
  }
  if (!payload.message) {
    missing.push("message");
  }

  if (missing.length) {
    return res.status(400).json({
      error: "Missing or invalid contact fields.",
      missing
    });
  }

  appendContactLog({
    ...payload,
    createdAt: new Date().toISOString()
  });

  const notifications = await sendContactEmails(payload);

  return res.status(200).json({
    ok: true,
    message: "Your message was sent to the Primus support inbox.",
    notifications
  });
};
