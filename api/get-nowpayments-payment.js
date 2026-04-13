const {
  getPayment,
  getQuery,
  sendJson
} = require("./_nowpayments");

module.exports = async function getNowPaymentsPaymentHandler(req, res) {
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const query = getQuery(req);
    const paymentId = String(query.payment_id || query.paymentId || "").trim();

    if (!paymentId) {
      sendJson(res, 400, { error: "Missing payment id." });
      return;
    }

    const payment = await getPayment(paymentId);
    sendJson(res, 200, payment);
  } catch (error) {
    sendJson(res, 500, {
      error: "Unable to fetch NOWPayments payment.",
      detail: error instanceof Error ? error.message : "Unknown error"
    });
  }
};
