const PRODUCT_CATALOG = {
  "tirzepatide-30mg": { name: "Tirzepatide", dosage: "30mg", price: 55 },
  "retatrutide-30mg": { name: "Retatrutide", dosage: "30mg", price: 60 },
  "tb-500-20mg": { name: "TB-500", dosage: "20mg", price: 40 },
  "bpc-157-10mg": { name: "BPC-157", dosage: "10mg", price: 14 },
  "ghk-cu-50mg": { name: "GHK-CU", dosage: "50mg", price: 13 },
  "mots-c-40mg": { name: "MOTS-C", dosage: "40mg", price: 35 },
  "melanotan-mt2-10mg": { name: "Melanotan MT2", dosage: "10mg", price: 14 },
  "ss-31-50mg": { name: "SS-31", dosage: "50mg", price: 50 },
  "nad-1000mg": { name: "NAD+", dosage: "1000mg", price: 30 },
  "semax-30mg": { name: "Semax", dosage: "30mg", price: 20 },
  "selank-10mg": { name: "Selank", dosage: "10mg", price: 18 }
};

const SHIPPING_OPTIONS = {
  "eu-standard": {
    id: "eu-standard",
    label: "EU Standard",
    eta: "1-3 business days",
    note: "Tracked delivery for most European orders.",
    price: 12,
    freeEligible: true
  },
  "eu-express": {
    id: "eu-express",
    label: "EU Express",
    eta: "24-48 hours",
    note: "Priority preparation and faster courier routing.",
    price: 18,
    freeEligible: true
  },
  international: {
    id: "international",
    label: "International",
    eta: "4-8 business days",
    note: "Transit time depends on destination and customs.",
    price: 24,
    freeEligible: false
  }
};

const PAYMENT_OPTIONS = {
  USDT_TRC20: {
    id: "USDT_TRC20",
    label: "USDT (TRC20)",
    note: "Secure ArionPay invoice sent immediately after checkout."
  },
  BTC: {
    id: "BTC",
    label: "Bitcoin (BTC)",
    note: "Secure ArionPay invoice sent immediately after checkout."
  },
  ETH: {
    id: "ETH",
    label: "Ethereum (ETH)",
    note: "Secure ArionPay invoice sent immediately after checkout."
  }
};

const FREE_SHIPPING_THRESHOLD = 200;

function sanitizeReference(value) {
  if (typeof value !== "string") {
    return `PP-${Date.now()}`;
  }

  const trimmed = value.trim().replace(/[^A-Za-z0-9_-]/g, "");
  return trimmed || `PP-${Date.now()}`;
}

function normalizeItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => {
      if (!item || typeof item.slug !== "string") {
        return null;
      }

      const product = PRODUCT_CATALOG[item.slug];
      if (!product || typeof product.price !== "number") {
        return null;
      }

      const quantity = Math.max(1, Math.min(99, Number(item.quantity) || 1));

      return {
        slug: item.slug,
        quantity,
        product
      };
    })
    .filter(Boolean);
}

function cartRequiresShipping(items) {
  return Array.isArray(items) && items.length > 0;
}

function calculateTotals(items, shippingMethod) {
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shipping = SHIPPING_OPTIONS[shippingMethod] || SHIPPING_OPTIONS["eu-standard"];
  const shippingCost = (shipping.freeEligible && subtotal >= FREE_SHIPPING_THRESHOLD)
    ? 0
    : shipping.price;

  return {
    subtotal,
    shipping: shippingCost,
    total: subtotal + shippingCost
  };
}

function serializeItems(items) {
  return items.map((item) => ({
    slug: item.slug,
    quantity: item.quantity,
    name: item.product.name,
    dosage: item.product.dosage,
    unitPrice: item.product.price,
    lineTotal: Number((item.product.price * item.quantity).toFixed(2))
  }));
}

function normalizeCustomer(customer) {
  const source = customer && typeof customer === "object" ? customer : {};
  const text = (value) => (typeof value === "string" ? value.trim() : "");

  return {
    firstName: text(source.firstName),
    lastName: text(source.lastName),
    email: text(source.email).toLowerCase(),
    phone: text(source.phone),
    company: text(source.company),
    country: text(source.country),
    state: text(source.state),
    city: text(source.city),
    postalCode: text(source.postalCode),
    address: text(source.address),
    addressLine2: text(source.addressLine2),
    notes: text(source.notes),
    marketingOptIn: Boolean(source.marketingOptIn),
    alternateShipping: Boolean(source.alternateShipping),
    ageConfirmed: Boolean(source.ageConfirmed)
  };
}

function customerName(customer) {
  return [customer.firstName, customer.lastName].filter(Boolean).join(" ").trim();
}

function validateCustomer(customer, options = {}) {
  const requiresShipping = options.requiresShipping !== false;
  const missing = [];

  if (!customer.firstName) {
    missing.push("firstName");
  }
  if (!customer.lastName) {
    missing.push("lastName");
  }
  if (!customer.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
    missing.push("email");
  }
  if (requiresShipping && !customer.country) {
    missing.push("country");
  }
  if (requiresShipping && !customer.state) {
    missing.push("state");
  }
  if (requiresShipping && !customer.city) {
    missing.push("city");
  }
  if (requiresShipping && !customer.postalCode) {
    missing.push("postalCode");
  }
  if (requiresShipping && !customer.address) {
    missing.push("address");
  }
  if (!customer.ageConfirmed) {
    missing.push("ageConfirmed");
  }

  return missing;
}

module.exports = {
  cartRequiresShipping,
  FREE_SHIPPING_THRESHOLD,
  PAYMENT_OPTIONS,
  PRODUCT_CATALOG,
  SHIPPING_OPTIONS,
  calculateTotals,
  customerName,
  normalizeCustomer,
  normalizeItems,
  sanitizeReference,
  serializeItems,
  validateCustomer
};
