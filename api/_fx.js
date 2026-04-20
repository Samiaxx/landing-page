const ECB_DAILY_RATES_URL = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";
const FX_CACHE_TTL_MS = 60 * 60 * 1000;

let fxCache = null;

function text(value) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function parseEcbRates(xml) {
  const source = typeof xml === "string" ? xml : "";
  const rates = { EUR: 1 };
  const dateMatch = source.match(/time=['"](\d{4}-\d{2}-\d{2})['"]/i);
  const matches = source.matchAll(/currency=['"]([A-Z]{3})['"]\s+rate=['"]([0-9.]+)['"]/gi);

  for (const match of matches) {
    const currency = text(match[1]);
    const rate = number(match[2]);

    if (currency && Number.isFinite(rate) && rate > 0) {
      rates[currency] = rate;
    }
  }

  return {
    base: "EUR",
    date: dateMatch ? dateMatch[1] : "",
    rates
  };
}

async function loadEcbRates() {
  const now = Date.now();
  if (fxCache && now - fxCache.fetchedAt < FX_CACHE_TTL_MS) {
    return fxCache;
  }

  const response = await fetch(ECB_DAILY_RATES_URL, {
    method: "GET",
    headers: {
      Accept: "application/xml, text/xml;q=0.9, */*;q=0.1"
    }
  });

  if (!response.ok) {
    throw new Error(`ECB FX feed request failed with status ${response.status}.`);
  }

  const xml = await response.text();
  const parsed = parseEcbRates(xml);

  if (!parsed.rates.USD) {
    throw new Error("ECB FX feed did not contain a USD reference rate.");
  }

  fxCache = {
    ...parsed,
    fetchedAt: now
  };

  return fxCache;
}

async function getExchangeRate(fromCurrency, toCurrency) {
  const from = text(fromCurrency);
  const to = text(toCurrency);

  if (!from || !to) {
    throw new Error("Both source and target currencies are required.");
  }

  if (from === to) {
    return {
      rate: 1,
      source: "identity",
      effectiveDate: "",
      fetchedAt: ""
    };
  }

  const fx = await loadEcbRates();
  const fromRate = fx.rates[from];
  const toRate = fx.rates[to];

  if (!fromRate) {
    throw new Error(`ECB FX feed does not provide a rate for ${from}.`);
  }

  if (!toRate) {
    throw new Error(`ECB FX feed does not provide a rate for ${to}.`);
  }

  return {
    rate: toRate / fromRate,
    source: "ECB",
    effectiveDate: fx.date,
    fetchedAt: new Date(fx.fetchedAt).toISOString()
  };
}

async function convertAmount(amount, fromCurrency, toCurrency) {
  const normalizedAmount = Number(amount);
  if (!Number.isFinite(normalizedAmount) || normalizedAmount < 0) {
    throw new Error("A valid amount is required for FX conversion.");
  }

  const exchange = await getExchangeRate(fromCurrency, toCurrency);

  return {
    amount: Number((normalizedAmount * exchange.rate).toFixed(2)),
    rate: exchange.rate,
    source: exchange.source,
    effectiveDate: exchange.effectiveDate,
    fetchedAt: exchange.fetchedAt,
    fromCurrency: text(fromCurrency),
    toCurrency: text(toCurrency)
  };
}

module.exports = {
  convertAmount,
  getExchangeRate
};
