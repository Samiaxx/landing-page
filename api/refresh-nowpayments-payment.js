const {
  readJsonBody,
  refreshPaymentEstimate,
  sendJson
} = require("./_nowpayments");

module.exports = async function refreshNowPaymentsPaymentHandler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const paymentId = String(body.paymentId || "").trim();

    if (!paymentId) {
      sendJson(res, 400, { error: "Missing payment id." });
      return;
    }

    const payment = await refreshPaymentEstimate(paymentId);
    sendJson(res, 200, payment);
  } catch (error) {
    sendJson(res, 500, {
      error: "Unable to refresh NOWPayments payment.",
      detail: error instanceof Error ? error.message : "Unknown error"
    });
  }
};
