const {
  createPayment,
  internalCurrencyId,
  readJsonBody,
  sendJson
} = require("./_nowpayments");

module.exports = async function createNowPaymentsPaymentHandler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const reference = String(body.reference || "").trim();
    const total = Number(body.total || 0);
    const selectedCurrency = internalCurrencyId(body.selectedCurrency || "USDT_TRC20");
    const items = Array.isArray(body.items) ? body.items : [];

    if (!reference) {
      sendJson(res, 400, { error: "Missing order reference." });
      return;
    }

    if (!Number.isFinite(total) || total <= 0) {
      sendJson(res, 400, { error: "Invalid order total." });
      return;
    }

    const payment = await createPayment({
      reference,
      total,
      selectedCurrency,
      items
    });

    sendJson(res, 200, payment);
  } catch (error) {
    sendJson(res, 500, {
      error: "Unable to create NOWPayments payment.",
      detail: error instanceof Error ? error.message : "Unknown error"
    });
  }
};
