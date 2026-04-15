module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const payload = typeof req.body === "string"
    ? (() => {
        try {
          return JSON.parse(req.body);
        } catch {
          return {};
        }
      })()
    : (req.body || {});

  console.log("ArionPay webhook received", {
    id: payload.id,
    status: payload.status,
    chain: payload.chain
  });

  return res.status(200).json({ received: true });
};
