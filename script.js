const CART_KEY = "primus-cart-v2";
const CHECKOUT_DRAFT_KEY = "primus-checkout-draft-v1";
const COOKIE_KEY = "primus-cookie-consent";
const LANG_KEY = "primus-language";
const LAST_ORDER_KEY = "primus-last-order-v1";
const FREE_SHIPPING_THRESHOLD = 200;
const SITE_EMAIL = "contact@peptidos-primus.com";
const SITE_DOMAIN = "peptidos-primus.com";
const BRAND_LOGO_SRC = "assets/store-logo.png";
const HERO_VISUAL_SRC = "assets/lab-hand-vial.webp";
const PACKSHOT_ROOT = "assets/packshots";
const PAYMENT_METHODS = ["USDT"];
const WINDOW_NAME_STORE_PREFIX = "__primus-store__:";

const IMAGE_SET = [
  "assets/vial-cobalt.svg",
  "assets/vial-azure.svg",
  "assets/vial-cyan.svg",
  "assets/vial-slate.svg",
  "assets/vial-azure.svg",
  "assets/vial-cobalt.svg",
  "assets/vial-cyan.svg",
  "assets/vial-slate.svg"
];

const KPV_IMAGE_SET = [
  "assets/kpv-label.jpg",
  "assets/kpv-vial-1.jpg",
  "assets/kpv-vial-2.jpg",
  "assets/brand-caps.webp"
];

const SUPPORT_IMAGE_SET = [
  "assets/lab-hand-vial.webp",
  "assets/brand-caps.webp"
];

const SUPPORT_IMAGE_GROUPS = {
  metabolic: [
    "assets/lab-vial-closeup.webp",
    "assets/lab-tube-tray.webp",
    "assets/brand-caps.webp"
  ],
  recovery: [
    "assets/lab-hand-vial.webp",
    "assets/lab-vial-closeup.webp",
    "assets/brand-caps.webp"
  ],
  neuro: [
    "assets/lab-tube-tray.webp",
    "assets/lab-hand-vial.webp",
    "assets/brand-caps.webp"
  ],
  specialty: [
    "assets/lab-vial-closeup.webp",
    "assets/lab-hand-vial.webp",
    "assets/brand-caps.webp"
  ]
};

const PRODUCT_SUPPORT_GROUP = {
  "tirzepatide-30mg": "metabolic",
  "retatrutide-30mg": "metabolic",
  "mots-c-40mg": "metabolic",
  "nad-1000mg": "metabolic",
  "tb-500-20mg": "recovery",
  "bpc-157-10mg": "recovery",
  "ghk-cu-50mg": "recovery",
  "ss-31-50mg": "recovery",
  "semax-30mg": "neuro",
  "selank-10mg": "neuro",
  "dsip-10mg": "neuro",
  "epithalon-40mg": "neuro",
  "ipamorelin-10mg": "specialty",
  "melanotan-mt2-10mg": "specialty",
  "pt141-10mg": "specialty",
  "oxytocin-10mg": "specialty"
};

const NAV_ITEMS = [
  { key: "home", href: "index.html" },
  { key: "shop", href: "shop.html" },
  { key: "coa", href: "coa.html" },
  { key: "faq", href: "faq.html" },
  { key: "contact", href: "contact.html" }
];

const PRODUCTS = [
  {
    slug: "tirzepatide-30mg",
    name: { en: "Tirzepatide", es: "Tirzepatide" },
    dosage: "30mg",
    price: 55,
    status: "available",
    featured: true,
    image: IMAGE_SET[0],
    gallery: [IMAGE_SET[0], IMAGE_SET[4], IMAGE_SET[5]],
    short: {
      en: "Tirzepatide is a dual GLP-1/GIP receptor agonist used in metabolic research.",
      es: "Tirzepatide es un agonista dual de receptores GLP-1/GIP utilizado en investigación metabólica."
    },
    batch: "PP-TZP-0426",
    coaDate: "2026-03-28"
  },
  {
    slug: "retatrutide-30mg",
    name: { en: "Retatrutide", es: "Retatrutide" },
    dosage: "30mg",
    price: 60,
    status: "available",
    featured: true,
    image: IMAGE_SET[3],
    gallery: [IMAGE_SET[3], IMAGE_SET[0], IMAGE_SET[6]],
    short: {
      en: "Retatrutide is a triple agonist targeting GLP-1, GIP, and glucagon receptors.",
      es: "Retatrutide es un agonista triple que apunta a receptores GLP-1, GIP y glucagón."
    },
    batch: "PP-RET-0426",
    coaDate: "2026-03-25"
  },
  {
    slug: "tb-500-20mg",
    name: { en: "TB-500", es: "TB-500" },
    dosage: "20mg",
    price: 40,
    status: "available",
    featured: true,
    image: IMAGE_SET[2],
    gallery: [IMAGE_SET[2], IMAGE_SET[1], IMAGE_SET[4]],
    short: {
      en: "TB-500 is a synthetic peptide fragment of Thymosin Beta-4 for tissue repair studies.",
      es: "TB-500 es un fragmento de péptido sintético de Timosina Beta-4 para estudios de reparación tisular."
    },
    batch: "PP-TB5-0426",
    coaDate: "2026-03-24"
  },
  {
    slug: "bpc-157-10mg",
    name: { en: "BPC-157", es: "BPC-157" },
    dosage: "10mg",
    price: 14,
    status: "available",
    featured: true,
    image: IMAGE_SET[1],
    gallery: [IMAGE_SET[1], IMAGE_SET[5], IMAGE_SET[6]],
    short: {
      en: "BPC-157 is a synthetic peptide known for its regenerative properties in research.",
      es: "BPC-157 es un péptido sintético conocido por sus propiedades regenerativas en investigación."
    },
    batch: "PP-BPC-0426",
    coaDate: "2026-03-21"
  },
  {
    slug: "ghk-cu-50mg",
    name: { en: "GHK-CU", es: "GHK-CU" },
    dosage: "50mg",
    price: 13,
    status: "available",
    image: IMAGE_SET[4],
    gallery: [IMAGE_SET[4], IMAGE_SET[2], IMAGE_SET[7]],
    short: {
      en: "GHK-Cu is a copper tripeptide complex used in skin and tissue research.",
      es: "GHK-Cu es un complejo tripeptídico de cobre utilizado en investigación de piel y tejidos."
    },
    batch: "PP-GHK-0426",
    coaDate: "2026-03-19"
  },
  {
    slug: "mots-c-40mg",
    name: { en: "MOTS-C", es: "MOTS-C" },
    dosage: "40mg",
    price: 35,
    status: "available",
    image: IMAGE_SET[6],
    gallery: [IMAGE_SET[6], IMAGE_SET[0], IMAGE_SET[3]],
    short: {
      en: "MOTS-c is a mitochondrial peptide for metabolic and anti-aging research.",
      es: "MOTS-c es un péptido mitocondrial para investigación metabólica y antienvejecimiento."
    },
    batch: "PP-MOT-0426",
    coaDate: "2026-03-18"
  },
  {
    slug: "melanotan-mt2-10mg",
    name: { en: "Melanotan MT2", es: "Melanotan MT2" },
    dosage: "10mg",
    price: 14,
    status: "available",
    image: IMAGE_SET[7],
    gallery: [IMAGE_SET[7], IMAGE_SET[1], IMAGE_SET[2]],
    short: {
      en: "Melanotan II is a synthetic peptide for tanning and pigmentation studies.",
      es: "Melanotan II es un péptido sintético para estudios de bronceado y pigmentación."
    },
    batch: "PP-MT2-0426",
    coaDate: "2026-03-17"
  },
  {
    slug: "ss-31-50mg",
    name: { en: "SS-31", es: "SS-31" },
    dosage: "50mg",
    price: 50,
    status: "available",
    image: IMAGE_SET[5],
    gallery: [IMAGE_SET[5], IMAGE_SET[3], IMAGE_SET[0]],
    short: {
      en: "SS-31 is a mitochondrial-targeted peptide for cardiovascular and metabolic research.",
      es: "SS-31 es un péptido dirigido a mitocondrias para investigación cardiovascular y metabólica."
    },
    batch: "PP-SS31-0426",
    coaDate: "2026-03-15"
  },
  {
    slug: "nad-1000mg",
    name: { en: "NAD+", es: "NAD+" },
    dosage: "1000mg",
    price: 30,
    status: "available",
    image: IMAGE_SET[0],
    gallery: [IMAGE_SET[0], IMAGE_SET[5], IMAGE_SET[7]],
    short: {
      en: "NAD+ precursor for cellular energy and anti-aging research.",
      es: "Precursor de NAD+ para energía celular e investigación antienvejecimiento."
    },
    batch: "PP-NAD-0426",
    coaDate: "2026-03-14"
  },
  {
    slug: "semax-30mg",
    name: { en: "Semax", es: "Semax" },
    dosage: "30mg",
    price: 20,
    status: "available",
    image: IMAGE_SET[3],
    gallery: [IMAGE_SET[3], IMAGE_SET[4], IMAGE_SET[1]],
    short: {
      en: "Semax is a nootropic peptide for cognitive and neuroprotective research.",
      es: "Semax es un péptido nootrópico para investigación cognitiva y neuroprotectora."
    },
    batch: "PP-SEM-0426",
    coaDate: "2026-03-12"
  },
  {
    slug: "selank-10mg",
    name: { en: "Selank", es: "Selank" },
    dosage: "10mg",
    price: 18,
    status: "available",
    image: IMAGE_SET[4],
    gallery: [IMAGE_SET[4], IMAGE_SET[6], IMAGE_SET[2]],
    short: {
      en: "Selank is an anxiolytic peptide for stress and cognitive research.",
      es: "Selank es un péptido ansiolítico para investigación de estrés y cognitivo."
    },
    batch: "PP-SEL-0426",
    coaDate: "2026-03-10"
  },
  {
    slug: "dsip-10mg",
    name: { en: "DSIP", es: "DSIP" },
    dosage: "10mg",
    price: null,
    status: "coming",
    image: IMAGE_SET[1],
    gallery: [IMAGE_SET[1], IMAGE_SET[2], IMAGE_SET[3]],
    short: {
      en: "DSIP dosing protocols support deeper delta sleep and healthier stress response in research settings.",
      es: "Los protocolos de dosificación de DSIP pueden ayudar a promover un sueño profundo y reparador (ondas delta) y apoyar una respuesta saludable al estrés."
    },
    batch: "PP-DSIP-PRE",
    coaDate: null
  },
  {
    slug: "epithalon-40mg",
    name: { en: "Epithalon", es: "Epithalon" },
    dosage: "40mg",
    price: null,
    status: "coming",
    image: IMAGE_SET[2],
    gallery: [IMAGE_SET[2], IMAGE_SET[6], IMAGE_SET[7]],
    short: {
      en: "Epitalon is a synthetic tetrapeptide developed from pineal research for geroprotective and longevity models.",
      es: "Epitalon (Epithalon) es un tetrapéptido sintético desarrollado a partir de investigaciones sobre la glándula pineal por su potencial geroprotector."
    },
    batch: "PP-EPI-PRE",
    coaDate: null
  },
  {
    slug: "ipamorelin-10mg",
    name: { en: "Ipamorelin", es: "Ipamorelin" },
    dosage: "10mg",
    price: null,
    status: "coming",
    image: IMAGE_SET[5],
    gallery: [IMAGE_SET[5], IMAGE_SET[0], IMAGE_SET[4]],
    short: {
      en: "Ipamorelin is a selective GH secretagogue that mimics ghrelin signaling with low cortisol and ACTH effects.",
      es: "Ipamorelin es un pentapéptido sintético que actúa como secretagogo selectivo de la hormona del crecimiento al imitar la grelina en su receptor."
    },
    batch: "PP-IPA-PRE",
    coaDate: null
  },
  {
    slug: "kpv-10mg",
    name: { en: "KPV", es: "KPV" },
    dosage: "10mg",
    price: null,
    status: "coming",
    image: KPV_IMAGE_SET[0],
    gallery: [KPV_IMAGE_SET[0], KPV_IMAGE_SET[1], KPV_IMAGE_SET[2], KPV_IMAGE_SET[3]],
    short: {
      en: "KPV is presented as a low-volume anti-inflammatory peptide for barrier support and localized tissue response research.",
      es: "KPV se presenta como un péptido antiinflamatorio de bajo volumen para soporte de barrera y respuesta tisular localizada en investigación."
    },
    batch: "PP-KPV-PRE",
    coaDate: null
  },
  {
    slug: "pt141-10mg",
    name: { en: "PT141", es: "PT141" },
    dosage: "10mg",
    price: null,
    status: "coming",
    image: IMAGE_SET[7],
    gallery: [IMAGE_SET[7], IMAGE_SET[4], IMAGE_SET[2]],
    short: {
      en: "PT-141 is a synthetic cyclic heptapeptide melanocortin agonist derived from Melanotan II for sexual desire research.",
      es: "PT-141 (bremelanotida) es un heptapéptido cíclico sintético y agonista no selectivo de los receptores melanocortina (MC3R/MC4R), derivado como metabolito activo de Melanotan II."
    },
    batch: "PP-PT1-PRE",
    coaDate: null
  },
  {
    slug: "oxytocin-10mg",
    name: { en: "Oxytocin", es: "Oxitocina" },
    dosage: "10mg",
    price: null,
    status: "coming",
    image: IMAGE_SET[3],
    gallery: [IMAGE_SET[3], IMAGE_SET[2], IMAGE_SET[5]],
    short: {
      en: "Oxytocin is a nonapeptide hormone used in research on social bonding, stress, anxiety, and partner behavior.",
      es: "La oxitocina es una hormona peptídica (nonapéptido) conocida por su papel en el vínculo social y el comportamiento."
    },
    batch: "PP-OXY-PRE",
    coaDate: null
  }
];

function productPackshot(slug) {
  return `${PACKSHOT_ROOT}/${slug}.svg`;
}

function standardProductGallery(product) {
  const group = PRODUCT_SUPPORT_GROUP[product.slug];
  const supportSet = group && SUPPORT_IMAGE_GROUPS[group]
    ? SUPPORT_IMAGE_GROUPS[group]
    : SUPPORT_IMAGE_SET;
  return [productPackshot(product.slug)].concat(supportSet);
}

PRODUCTS.forEach((product) => {
  const packshot = productPackshot(product.slug);
  product.image = packshot;

  if (product.slug === "kpv-10mg") {
    product.gallery = [packshot].concat(KPV_IMAGE_SET);
    return;
  }

  product.gallery = standardProductGallery(product);
});

const COPY = {
  shell: {
    topbar: {
      en: "COA-backed batches, HPLC‑verified purity, and secure ArionPay crypto checkout.",
      es: "Lotes con COA, pureza verificada por HPLC y checkout seguro ArionPay (crypto)."
    },
    brandTag: {
      en: "Primus Peptides — Research‑grade peptides",
      es: "Primus Peptides — Péptidos grado investigación"
    },
    footerTagline: {
      en: "Secure ecommerce experience built for modern customers.",
      es: "Experiencia de ecommerce segura diseñada para clientes modernos."
    },
    footerLegal: {
      en: "For laboratory research use only.",
      es: "Solo para uso de investigacion de laboratorio."
    },
    linkColumn: { en: "Links", es: "Enlaces" },
    contactColumn: { en: "Contact", es: "Contacto" },
    shippingLine: { en: "EU dispatch target: 24h", es: "Objetivo de despacho UE: 24h" },
    paymentsLine: { en: "Payments: ArionPay / USDT (TRC20)", es: "Pagos: ArionPay / USDT (TRC20)" },
    cookieTitle: { en: "Cookie notice", es: "Aviso de cookies" },
    cookieBody: {
      en: "This storefront uses cookies to remember language preference, cart contents, and consent choices.",
      es: "Esta tienda usa cookies para recordar idioma, carrito y preferencias de consentimiento."
    },
    cookieAccept: { en: "Accept", es: "Aceptar" },
    cookieEssential: { en: "Only essential", es: "Solo esenciales" },
    toastAdded: { en: "Added to cart.", es: "Añadido al carrito." },
    toastContact: { en: "Message captured successfully.", es: "Mensaje capturado correctamente." },
    toastLanguage: { en: "Language updated.", es: "Idioma actualizado." },
    cartLabel: { en: "Cart", es: "Carrito" }
  },
  nav: {
    home: { en: "Home", es: "Inicio" },
    shop: { en: "Shop", es: "Tienda" },
    coa: { en: "COA", es: "COA" },
    faq: { en: "FAQ", es: "FAQ" },
    contact: { en: "Contact", es: "Contacto" }
  },
  labels: {
    available: { en: "Available", es: "Disponible" },
    comingMay: { en: "Coming May", es: "Llega en mayo" },
    comingSoon: { en: "Coming Soon", es: "Próximamente" },
    priceOnRelease: { en: "Price on release", es: "Precio al lanzamiento" },
    addToCart: { en: "Add to Cart", es: "Añadir al carrito" },
    viewProduct: { en: "View Product", es: "Ver producto" },
    viewCatalog: { en: "View Products", es: "Ver productos" },
    browseShop: { en: "Browse the full catalogue", es: "Ver el catálogo completo" },
    seeCoa: { en: "See COA archive", es: "Ver archivo COA" },
    hplc: { en: "HPLC tested", es: "HPLC verificado" },
    shipped: { en: "Shipped 24h", es: "Enviado en 24h" },
    freeShipping: { en: "Free Shipping", es: "Envío gratis" },
    allProducts: { en: "All Products", es: "Todos" },
    inStock: { en: "In Stock", es: "En stock" },
    upcoming: { en: "Coming May", es: "Llega en mayo" },
    batchReady: { en: "COA ready", es: "COA listo" },
    batchPending: { en: "Awaiting release", es: "Pendiente de lanzamiento" },
    checkout: { en: "Secure Checkout", es: "Pago seguro" },
    keepBrowsing: { en: "Continue shopping", es: "Seguir comprando" },
    guestCheckout: { en: "Guest checkout ready", es: "Checkout como invitado" },
    searchPlaceholder: { en: "Search peptide, dosage, or status", es: "Buscar péptido, dosis o estado" },
    qty: { en: "Quantity", es: "Cantidad" },
    subtotal: { en: "Subtotal", es: "Subtotal" },
    items: { en: "Items", es: "Artículos" },
    shipping: { en: "Shipping", es: "Envío" },
    calculatedLater: { en: "Calculated later", es: "Se calcula después" },
    sendMessage: { en: "Send Message", es: "Enviar mensaje" }
    ,shopNow: { en: "Shop Now", es: "Comprar ahora" }
    ,browseProducts: { en: "Browse Products", es: "Ver productos" }
    ,secureCheckout: { en: "Secure Checkout", es: "Pago seguro" }
    ,createAccount: { en: "Create Account", es: "Crear cuenta" }
    ,completeOrder: { en: "Complete Order", es: "Completar pedido" }
  },
  home: {
    heroKicker: { en: "COA‑backed research peptides", es: "Péptidos de investigación con COA" },
    heroTitle: {
      en: "Research‑grade peptides — verified, documented, and EU‑shipped.",
      es: "Péptidos de grado investigación — verificados, documentados y enviados desde la UE."
    },
    heroBody: {
      en: "COA access, third‑party HPLC verification, discreet lab‑grade packaging, and secure ArionPay checkout — optimized for research workflows.",
      es: "Acceso a COA, verificación HPLC de terceros, embalaje discreto de grado laboratorio y checkout seguro ArionPay — optimizado para flujos de investigación."
    },
    heroNote: {
      en: "Mobile-first browsing with clear trust placement and fast, reliable checkout.",
      es: "Diseñado para móvil con colocación clara de confianza y checkout rápido y fiable."
    },
    trustTitle: { en: "Trust signals above the fold", es: "Señales de confianza sobre el pliegue" },
    trustBody: { en: "Structured to look credible to biohacking shoppers and athlete-focused buyers.", es: "Estructurado para resultar creíble a compradores de biohacking y público deportista." },
    featuredKicker: { en: "Featured Products", es: "Productos destacados" },
    featuredTitle: { en: "Four hero SKUs with quick actions and clean pricing hierarchy.", es: "Cuatro SKUs principales con acciones rápidas y jerarquía de precio clara." },
    featuredBody: { en: "Cards are tuned for quick mobile scanning while keeping dosage, price, and trust details readable.", es: "Las tarjetas están ajustadas para una lectura rápida en móvil manteniendo visibles dosis, precio y confianza." },
    servicesKicker: { en: "Professional Services", es: "Servicios profesionales" },
    servicesTitle: { en: "Expert team, safety protocols, GMP manufacturing, and quality assurance.", es: "Equipo experto, protocolos de seguridad, fabricación GMP y aseguramiento de calidad." },
    servicesBody: { en: "Short proof points covering team expertise, safety, manufacturing standards, and lab verification.", es: "Puntos breves sobre experiencia del equipo, seguridad, estándares de fabricación y verificación de laboratorio." },
    shippingKicker: { en: "Shipping Info", es: "Información de envío" },
    shippingTitle: { en: "A visual rate table keeps logistics transparent.", es: "Una tabla visual hace que la logística sea transparente." },
    shippingBody: { en: "Shipping options and delivery costs are presented clearly before payment.", es: "Las opciones de envio y los costes de entrega se muestran con claridad antes del pago." },
    benefitsKicker: { en: "Why Choose Us", es: "Por qué elegirnos" },
    benefitsTitle: { en: "Short icon-led proof points reinforce trust mid-page and near the footer.", es: "Puntos de prueba con iconos refuerzan la confianza a mitad de página y cerca del footer." },
    benefitsBody: { en: "This section is deliberately compact so it reads quickly on mobile traffic.", es: "Esta sección es compacta a propósito para una lectura rápida en tráfico móvil." },
    ctaKicker: { en: "Ready to explore the catalogue?", es: "¿Listo para explorar el catálogo?" },
    ctaTitle: { en: "Explore the catalogue, view COAs, or proceed to secure checkout.", es: "Explora el catálogo, consulta COAs o procede al checkout seguro." },
    ctaBody: { en: "Clear, repeated CTAs guide researchers from discovery to COA access and fast, secure payment.", es: "CTAs claros y repetidos guían desde el descubrimiento hasta acceso a COA y pago rápido y seguro." }
  },  shop: {
    kicker: { en: "Shop", es: "Tienda" },
    title: { en: "Searchable catalogue with live stock states and conversion-ready product cards.", es: "Catálogo con búsqueda, estados de stock y tarjetas listas para convertir." },
    body: { en: "The shop view keeps the hero simple, surfaces search immediately, and separates available products from upcoming May launches.", es: "La vista de tienda mantiene un hero simple, muestra la búsqueda de inmediato y separa productos disponibles de lanzamientos de mayo." },
    statAvailable: { en: "available now", es: "disponibles ahora" },
    statUpcoming: { en: "coming in May", es: "llegan en mayo" },
    statBilingual: { en: "language-ready UI", es: "UI bilingüe lista" },
    resultsLabel: { en: "results", es: "resultados" },
    emptyTitle: { en: "No products match this search.", es: "No hay productos para esta búsqueda." },
    emptyBody: { en: "Try a product name, dosage, or switch back to All Products.", es: "Prueba con un nombre, dosis o vuelve a Todos." }
  },
  product: {
    relatedKicker: { en: "Related Products", es: "Productos relacionados" },
    relatedTitle: { en: "Keep the product page conversion-led with nearby alternatives.", es: "Mantén la página de producto orientada a conversión con alternativas cercanas." },
    relatedBody: { en: "A small related-products rail helps reduce dead ends in the shopping journey.", es: "Una pequeña franja de productos relacionados reduce callejones sin salida en la compra." },
    tabDescription: { en: "Description", es: "Descripción" },
    tabAdditional: { en: "Additional Info", es: "Información adicional" },
    descriptionLead: { en: "Same structure as the brief: technical specifications first, then the protocol/info tab below.", es: "Misma estructura del brief: primero especificaciones técnicas y luego la pestaña de información." },
    protocolLead: { en: "The five-section framework is in place, while precise dosing and reconstitution values should be legally and medically reviewed before publication.", es: "El esquema de cinco secciones está listo, mientras que dosis y reconstitución concretas deben revisarse legal y médicamente antes de publicarse." },
    material: { en: "Material", es: "Material" },
    form: { en: "Form", es: "Forma" },
    manufacturing: { en: "Manufacturing", es: "Fabricación" },
    storage: { en: "Storage", es: "Conservación" },
    descriptionMaterialSuffix: { en: "synthetic peptide reference", es: "referencia de péptido sintético" },
    descriptionFormValue: { en: "lyophilized powder", es: "polvo liofilizado" },
    descriptionManufacturingValue: { en: "synthetic peptide production", es: "producción sintética de péptidos" },
    descriptionStorageValue: { en: "cool, dry, protected from light", es: "lugar fresco, seco y protegido de la luz" },
    howWorks: { en: "How This Works", es: "Cómo funciona" },
    benefitsSide: { en: "Potential Benefits & Side Effects", es: "Beneficios y efectos secundarios potenciales" },
    protocolOverview: { en: "Protocol Overview", es: "Resumen del protocolo" },
    dosingProtocol: { en: "Dosing Protocol", es: "Protocolo de dosificación" },
    reconstitution: { en: "Dosing & Reconstitution Guide", es: "Guía de dosificación y reconstitución" },
    protocolHow: {
      en: "This section reserves space for a reviewed mechanism-of-action summary describing receptor targets, pathway context, and how the peptide is framed in research literature.",
      es: "Esta sección reserva espacio para un resumen revisado del mecanismo de acción, con objetivos receptores, contexto de vías y cómo se describe el péptido en la literatura de investigación."
    },
    protocolBenefits: {
      en: "Use this block for a concise evidence-led summary of research interest, known tolerability notes, and any copy restrictions required for your market.",
      es: "Usa este bloque para un resumen conciso y basado en evidencia sobre el interés de investigación, notas de tolerabilidad conocidas y restricciones de copy según tu mercado."
    },
    protocolOverviewCopy: {
      en: "Designed as a short research protocol summary area that can explain study framing, observation windows, and practical handling notes without crowding the buy box.",
      es: "Pensado como un área breve para resumir el protocolo de investigación, explicar el contexto del estudio, ventanas de observación y notas prácticas sin saturar el cuadro de compra."
    },
    protocolDoseCopy: {
      en: "This build intentionally avoids publishing precise dose ranges, frequency, and cycle length. Insert final reviewed values only after medical, legal, and compliance approval.",
      es: "Esta versión evita publicar rangos exactos, frecuencia y duración de ciclo. Inserta valores finales solo tras aprobación médica, legal y de cumplimiento."
    },
    protocolReconCopy: {
      en: "The layout is ready for bacteriostatic water volume, concentration math, syringe measurements, and storage instructions once your reviewed SOP is approved.",
      es: "La maquetación está lista para volumen de agua bacteriostática, cálculos de concentración, medidas de jeringa y conservación una vez aprobado el SOP revisado."
    },
    spendMore: { en: "Spend", es: "Añade" },
    toUnlock: { en: "more to unlock free shipping.", es: "más para desbloquear el envío gratis." },
    thresholdReached: { en: "Free shipping threshold reached.", es: "Umbral de envío gratis alcanzado." },
    comingBadge: { en: "Launching in May", es: "Lanzamiento en mayo" },
    unavailableCopy: { en: "This product is listed with a Coming Soon state and cannot be added to cart yet.", es: "Este producto aparece como Próximamente y todavía no se puede añadir al carrito." }
  },
  coa: {
    kicker: { en: "COA Archive", es: "Archivo COA" },
    title: { en: "Batch visibility and COA status presented as a trust-building archive.", es: "Visibilidad por lote y estado COA presentados como archivo de confianza." },
    body: { en: "Each card gives shoppers a fast signal on batch readiness, latest test date, and whether the product is already available or still pending release.", es: "Cada tarjeta da una señal rápida sobre el lote, la fecha de análisis y si el producto está disponible o pendiente de lanzamiento." },
    noteTitle: { en: "Archive structure", es: "Estructura del archivo" },
    noteBody: { en: "Upload final PDFs and batch-lab details here once the documentation pack is ready. The page is already styled to surface that trust content prominently.", es: "Sube aquí los PDFs finales y los datos de laboratorio del lote cuando el paquete documental esté listo. La página ya está pensada para destacar esa confianza." },
    batchLabel: { en: "Batch", es: "Lote" },
    testedLabel: { en: "Tested", es: "Analizado" },
    pendingLabel: { en: "Pending release", es: "Pendiente de lanzamiento" }
  },
  faq: {
    kicker: { en: "FAQ", es: "FAQ" },
    title: { en: "Answers for shipping, COA access, payments, and bilingual storefront behavior.", es: "Respuestas sobre envíos, acceso a COA, pagos y comportamiento bilingüe de la tienda." },
    body: { en: "The accordion pattern keeps long answers tidy while preserving mobile readability and trust-heavy information design.", es: "El formato acordeón mantiene respuestas largas ordenadas y conserva una lectura móvil limpia y orientada a confianza." },
    items: [
      {
        question: { en: "How is the bilingual experience handled in this storefront?", es: "¿Cómo se gestiona la experiencia bilingüe en esta tienda?" },
        answer: { en: "The EN / ES toggle updates navigation, page copy, catalogue cards, and product details instantly while keeping the same storefront structure.", es: "El selector EN / ES actualiza navegación, copy, catálogo y detalles de producto al instante manteniendo la misma estructura de tienda." }
      },
      {
        question: { en: "Where are the COAs shown?", es: "¿Dónde se muestran los COA?" },
        answer: { en: "The dedicated COA page presents batch cards for every product so shoppers can scan release status without leaving the storefront flow.", es: "La página COA presenta tarjetas por lote para cada producto, de forma que el cliente pueda revisar el estado sin salir del flujo de compra." }
      },
      {
        question: { en: "Can shoppers pay with crypto?", es: "¿Se puede pagar con crypto?" },
        answer: { en: "Shoppers can complete checkout through ArionPay using the live USDT (TRC20) payment flow.", es: "Los compradores pueden completar el checkout mediante ArionPay usando el flujo activo de pago con USDT (TRC20)." }
      },
      {
        question: { en: "Why are some products marked Coming May?", es: "¿Por qué algunos productos aparecen como Llega en mayo?" },
        answer: { en: "The catalogue uses launch-state styling for DSIP, Epithalon, Ipamorelin, KPV, PT141, and Oxytocin so urgency is visible without creating a broken checkout path.", es: "El catálogo usa un estilo de pre-lanzamiento para DSIP, Epithalon, Ipamorelin, KPV, PT141 y Oxitocina, de modo que la urgencia sea visible sin romper el checkout." }
      },
      {
        question: { en: "What has priority on mobile?", es: "¿Qué tiene prioridad en móvil?" },
        answer: { en: "Sticky navigation, search, trust cues, clean product cards, and short CTA paths are all positioned to support mobile-first conversion behavior.", es: "La navegación sticky, la búsqueda, las señales de confianza, las tarjetas limpias y los CTAs cortos están colocados para apoyar la conversión mobile-first." }
      }
    ]
  },
  contact: {
    kicker: { en: "Need Help? Contact Support", es: "¿Necesitas ayuda? Contacta con soporte" },
    title: { en: "Support, shipping, and payment questions presented in a clean trust-first contact layout.", es: "Soporte, envíos y pagos presentados en una página de contacto limpia y centrada en confianza." },
    body: { en: "The brief called for a dedicated Contact page. This version combines direct support information with a simple form and visible crypto-payment guidance.", es: "El brief pedía una página Contact. Esta versión combina información directa, un formulario simple y guía visible sobre pagos crypto." },
    emailTitle: { en: "Email", es: "Email" },
    shippingTitle: { en: "Shipping coverage", es: "Cobertura de envío" },
    shippingBody: { en: "EU-first fulfilment, tracked dispatch, and international options from the shipping table.", es: "Cumplimiento UE primero, envío con tracking y opciones internacionales según la tabla de envíos." },
    paymentTitle: { en: "Payment", es: "Pago" },
    paymentBody: { en: "USDT is available through secure cryptocurrency checkout.", es: "USDT está disponible mediante checkout seguro con criptomonedas." },
    formTitle: { en: "Send a message", es: "Enviar un mensaje" },
    formBody: { en: "Use this form for shipping, COA, and order support requests.", es: "Usa este formulario para solicitudes de envio, COA y soporte de pedidos." },
    nameLabel: { en: "Name", es: "Nombre" },
    emailLabel: { en: "Email", es: "Email" },
    subjectLabel: { en: "Subject", es: "Asunto" },
    messageLabel: { en: "Message", es: "Mensaje" },
    placeholderSubject: { en: "Shipping, COA, or product question", es: "Consulta sobre envío, COA o producto" },
    placeholderMessage: { en: "Tell us what you need help with.", es: "Cuéntanos en qué necesitas ayuda." }
  },
  cart: {
    kicker: { en: "Cart", es: "Carrito" },
    title: { en: "Minimal-step cart flow with free shipping progress and guest checkout messaging.", es: "Flujo de carrito con pocos pasos, progreso de envío gratis y mensaje de checkout invitado." },
    body: { en: "The cart keeps the same trust-heavy design language while surfacing subtotal, payment options, and a direct path to checkout.", es: "El carrito mantiene el mismo lenguaje visual centrado en confianza y muestra subtotal, pagos y una vía directa al checkout." },
    emptyTitle: { en: "Your cart is ready for your next order. Browse premium products to get started.", es: "Tu carrito está listo para tu próximo pedido. Explora productos premium para comenzar." },
    emptyBody: { en: "Add a product from the catalogue or product page to test the conversion flow.", es: "Añade un producto desde el catálogo o desde la ficha para probar el flujo de conversión." },
    paymentTitle: { en: "Payment options", es: "Opciones de pago" },
    paymentBody: { en: "Use hosted USDT checkout to complete your order.", es: "Usa el checkout USDT alojado para completar tu pedido." },
    thresholdPrefix: { en: "Add", es: "Añade" },
    thresholdSuffix: { en: "more for free shipping.", es: "más para envío gratis." },
    thresholdDone: { en: "Free shipping unlocked.", es: "Envío gratis desbloqueado." }
  }
};

const HOME_TRUST = [
  {
    icon: "LT",
    title: { en: "Lab tested", es: "Analizado en laboratorio" },
    body: { en: "HPLC-tested cues are repeated through hero, product, and COA surfaces.", es: "Las señales HPLC se repiten en hero, producto y COA." }
  },
  {
    icon: "EU",
    title: { en: "EU shipping", es: "Envío UE" },
    body: { en: "Shipping clarity is built into the homepage and cart flow.", es: "La claridad de envío está integrada en la home y en el carrito." }
  },
  {
    icon: "COA",
    title: { en: "COA per product", es: "COA por producto" },
    body: { en: "Every product can surface a COA-ready batch card from the archive.", es: "Cada producto puede mostrar una tarjeta COA desde el archivo." }
  }
];

const SERVICE_BLOCKS = [
  {
    icon: "TM",
    title: { en: "Team", es: "Equipo" },
    body: {
      en: "Positioned as an EU-based research supplier that understands performance-focused buyers and values clean, direct communication.",
      es: "Planteado como un proveedor europeo de investigación que entiende al comprador centrado en rendimiento y valora una comunicación clara."
    }
  },
  {
    icon: "HL",
    title: { en: "Health", es: "Salud" },
    body: {
      en: "Presented with a tighter emphasis on controlled manufacturing, handling standards, and documentation rather than over-claiming outcomes.",
      es: "Presentado con énfasis en fabricación controlada, estándares de manejo y documentación, sin exagerar resultados."
    }
  },
  {
    icon: "GMP",
    title: { en: "GMP Certificate", es: "Certificado GMP" },
    body: {
      en: "The copy structure leaves room to highlight GMP-aligned processes, storage discipline, and lot consistency in a trust-first tone.",
      es: "La estructura deja espacio para destacar procesos alineados con GMP, conservación y consistencia de lotes con un tono de confianza."
    }
  },
  {
    icon: "QA",
    title: { en: "Quality & Analysis", es: "Calidad y análisis" },
    body: {
      en: "Batch release, purity references, and optional third-party verification are surfaced as evidence-led buying signals.",
      es: "La liberación por lote, referencias de pureza y verificación externa opcional aparecen como señales de compra basadas en evidencia."
    }
  }
];

const SHIPPING_ROWS = [
  { region: { en: "EU Standard", es: "UE estándar" }, speed: { en: "1-3 business days", es: "1-3 días laborables" }, price: "EUR 12" },
  { region: { en: "EU Express", es: "UE express" }, speed: { en: "24-48 hours", es: "24-48 horas" }, price: "EUR 18" },
  { region: { en: "International", es: "Internacional" }, speed: { en: "4-8 business days", es: "4-8 días laborables" }, price: "From EUR 24" }
];

const BENEFITS = [
  { icon: "HPLC", title: { en: "HPLC-tested lots", es: "Lotes HPLC verificados" }, body: { en: "Trust cue repeated across home, product, and COA pages.", es: "Señal de confianza repetida en home, producto y COA." } },
  { icon: "COA", title: { en: "COA archive", es: "Archivo COA" }, body: { en: "Dedicated page ready to host batch PDFs and release status.", es: "Página dedicada lista para alojar PDFs por lote y estado." } },
  { icon: "BTC", title: { en: "Crypto-first checkout", es: "Checkout crypto" }, body: { en: "Hosted payment-link messaging is built into the footer, cart, and hero flows.", es: "La mensajería de enlaces de pago alojados está integrada en el footer, el carrito y el hero." } },
  { icon: "24H", title: { en: "24h dispatch target", es: "Objetivo 24h" }, body: { en: "Shipping cues appear early, not buried at the bottom of the store.", es: "Las señales de envío aparecen pronto, no escondidas al final." } },
  { icon: "EN", title: { en: "Bilingual EN / ES", es: "Bilingüe EN / ES" }, body: { en: "Language switching is available in the sticky header on every page.", es: "El cambio de idioma está disponible en la cabecera sticky de cada página." } },
  { icon: "GS", title: { en: "Guest checkout", es: "Checkout invitado" }, body: { en: "The cart summary keeps the path to purchase short and visible.", es: "El resumen del carrito mantiene el camino de compra corto y visible." } }
];

let currentLanguage = getStoredLanguage();
let shopQuery = "";
let shopFilter = "all";
let activeProductTab = "description";
let toastTimer = null;

function readWindowNameStore() {
  try {
    if (!window.name || !window.name.startsWith(WINDOW_NAME_STORE_PREFIX)) {
      return {};
    }

    return JSON.parse(window.name.slice(WINDOW_NAME_STORE_PREFIX.length)) || {};
  } catch {
    return {};
  }
}

function writeWindowNameStore(store) {
  try {
    window.name = `${WINDOW_NAME_STORE_PREFIX}${JSON.stringify(store)}`;
  } catch {
    // Ignore fallback write failures.
  }
}

function readCookieValue(key) {
  try {
    const encodedKey = `${encodeURIComponent(key)}=`;
    const segments = document.cookie ? document.cookie.split("; ") : [];

    for (const segment of segments) {
      if (segment.startsWith(encodedKey)) {
        return decodeURIComponent(segment.slice(encodedKey.length));
      }
    }
  } catch {
    // Ignore cookie read failures.
  }

  return null;
}

function writeCookieValue(key, value, maxAgeDays = 30) {
  try {
    const maxAge = Math.max(1, Math.round(maxAgeDays * 24 * 60 * 60));
    document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  } catch {
    // Ignore cookie write failures.
  }
}

function readPersistedValue(key) {
  try {
    const stored = localStorage.getItem(key);

    if (stored !== null) {
      const windowStore = readWindowNameStore();
      if (windowStore[key] !== stored) {
        windowStore[key] = stored;
        writeWindowNameStore(windowStore);
      }
      if (readCookieValue(key) !== stored) {
        writeCookieValue(key, stored);
      }
      return stored;
    }
  } catch {
    // Continue to cookie/window.name fallback.
  }

  const cookieValue = readCookieValue(key);

  if (cookieValue !== null) {
    const windowStore = readWindowNameStore();
    if (windowStore[key] !== cookieValue) {
      windowStore[key] = cookieValue;
      writeWindowNameStore(windowStore);
    }

    try {
      localStorage.setItem(key, cookieValue);
    } catch {
      // Continue to window.name fallback.
    }

    return cookieValue;
  }

  const fallbackStore = readWindowNameStore();
  const fallbackValue = Object.prototype.hasOwnProperty.call(fallbackStore, key) ? fallbackStore[key] : null;

  if (fallbackValue !== null) {
    writeCookieValue(key, fallbackValue);

    try {
      localStorage.setItem(key, fallbackValue);
    } catch {
      // Ignore localStorage sync failures.
    }
  }

  return fallbackValue;
}

function writePersistedValue(key, value) {
  const stringValue = String(value);
  const windowStore = readWindowNameStore();
  windowStore[key] = stringValue;
  writeWindowNameStore(windowStore);
  writeCookieValue(key, stringValue);

  try {
    localStorage.setItem(key, stringValue);
  } catch {
    // The local preview can still keep state through window.name and cookies.
  }
}

function getStoredLanguage() {
  const stored = readPersistedValue(LANG_KEY);
  return stored === "es" ? "es" : "en";
}

function pick(value) {
  if (value && typeof value === "object" && !Array.isArray(value) && ("en" in value || "es" in value)) {
    return value[currentLanguage] ?? value.en ?? "";
  }
  return value ?? "";
}

function formatPrice(value) {
  return new Intl.NumberFormat(currentLanguage === "es" ? "es-ES" : "en-IE", {
    style: "currency",
    currency: "EUR"
  }).format(value);
}

function formatDate(value) {
  if (!value) {
    return currentLanguage === "es" ? "Pendiente" : "Pending";
  }

  return new Intl.DateTimeFormat(currentLanguage === "es" ? "es-ES" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function getCurrentPage() {
  return document.body.dataset.page || "home";
}

function getProduct(slug) {
  return PRODUCTS.find((product) => product.slug === slug) || PRODUCTS[0];
}

function currentProduct() {
  const params = new URLSearchParams(window.location.search);
  return getProduct(params.get("slug") || "tirzepatide-30mg");
}function normaliseCartEntry(entry) {
  if (!entry) {
    return null;
  }

  if (entry.slug && getProduct(entry.slug)) {
    return { slug: entry.slug, quantity: Math.max(1, Number(entry.quantity) || 1) };
  }

  if (entry.name) {
    const match = PRODUCTS.find((product) => {
      const fullName = `${product.name.en} ${product.dosage}`;
      return entry.name === product.name.en || entry.name === fullName;
    });

    if (match) {
      return { slug: match.slug, quantity: Math.max(1, Number(entry.quantity) || 1) };
    }
  }

  return null;
}

function readCart() {
  try {
    const stored = readPersistedValue(CART_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return parsed.map(normaliseCartEntry).filter(Boolean);
  } catch {
    return [];
  }
}

function saveCart(cart) {
  writePersistedValue(CART_KEY, JSON.stringify(cart));
}

function itemCount(cart) {
  return cart.reduce((total, item) => total + item.quantity, 0);
}

function subtotal(cart) {
  return cart.reduce((total, item) => {
    const product = getProduct(item.slug);
    return product.price ? total + product.price * item.quantity : total;
  }, 0);
}

function addToCart(slug, quantity = 1) {
  const cart = readCart();
  const existing = cart.find((item) => item.slug === slug);

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ slug, quantity });
  }

  saveCart(cart);
  updateCartBadges();
}

function updateCart(slug, change) {
  const cart = readCart();
  const item = cart.find((entry) => entry.slug === slug);

  if (!item) {
    return;
  }

  item.quantity = Math.max(1, item.quantity + change);
  saveCart(cart);
  updateCartBadges();
}

function removeFromCart(slug) {
  const cart = readCart().filter((item) => item.slug !== slug);
  saveCart(cart);
  updateCartBadges();
}

function updateCartBadges() {
  const count = itemCount(readCart());
  document.querySelectorAll("[data-cart-count]").forEach((node) => {
    node.textContent = String(count);
  });
}

function renderHeader() {
  const host = document.querySelector("[data-site-header]");

  if (!host) {
    return;
  }

  const page = getCurrentPage();
  const navLinks = NAV_ITEMS.map((item) => `
    <a class="${page === item.key ? "is-current" : ""}" href="${item.href}">${pick(COPY.nav[item.key])}</a>
  `).join("");
  const chips = PAYMENT_METHODS.map((item) => `<span class="payment-chip">${item}</span>`).join("");

  host.innerHTML = `
    <div class="topbar">
      <div class="container topbar-inner">
        <p class="topbar-copy">${pick(COPY.shell.topbar)}</p>
        <div class="payment-chips" aria-label="Accepted payment methods">${chips}</div>
      </div>
    </div>
    <div class="site-header-wrap">
      <header class="container header-inner">
        <a class="brand" href="index.html" aria-label="Primus Peptides home">
          <img class="brand-logo" src="${BRAND_LOGO_SRC}" alt="Primus Peptides">
        </a>
        <nav class="site-nav" aria-label="Primary navigation">${navLinks}</nav>
        <div class="header-actions">
          <div class="lang-toggle" role="group" aria-label="Language selector">
            <button type="button" class="lang-btn ${currentLanguage === "en" ? "is-active" : ""}" data-lang-switch="en">EN</button>
            <button type="button" class="lang-btn ${currentLanguage === "es" ? "is-active" : ""}" data-lang-switch="es">ES</button>
          </div>
          <a class="cart-link" href="cart.html">${pick(COPY.shell.cartLabel)} <span class="cart-badge" data-cart-count>0</span></a>
        </div>
      </header>
    </div>
  `;
}

function renderFooter() {
  const host = document.querySelector("[data-site-footer]");

  if (!host) {
    return;
  }

  const links = NAV_ITEMS.map((item) => `<a href="${item.href}">${pick(COPY.nav[item.key])}</a>`).join("");
  const payments = PAYMENT_METHODS.map((item) => `<span class="payment-chip">${item}</span>`).join("");

  host.innerHTML = `
    <footer class="site-footer">
      <div class="container footer-grid">
        <div class="footer-column">
          <a class="footer-brand" href="index.html" aria-label="Primus Peptides home">
            <img class="brand-logo" src="${BRAND_LOGO_SRC}" alt="Primus Peptides">
          </a>
          <p class="footer-copy">${pick(COPY.shell.footerTagline)}</p>
          <p class="footer-note">${pick(COPY.shell.footerLegal)}</p>
        </div>
        <div class="footer-column">
          <div class="footer-title">${pick(COPY.shell.linkColumn)}</div>
          <div class="footer-links">${links}</div>
        </div>
        <div class="footer-column">
          <div class="footer-title">${pick(COPY.shell.contactColumn)}</div>
          <a href="mailto:${SITE_EMAIL}">${SITE_EMAIL}</a>
          <p class="footer-note">${pick(COPY.shell.shippingLine)}</p>
          <p class="footer-note">${pick(COPY.shell.paymentsLine)}</p>
          <div class="footer-payments">${payments}</div>
        </div>
      </div>
      <p class="footer-meta">Primus Peptides | ${SITE_DOMAIN} | ${new Date().getFullYear()}</p>
    </footer>
  `;
}

function renderCookieBanner() {
  const host = document.querySelector("[data-cookie-root]");

  if (!host) {
    return;
  }

  if (readPersistedValue(COOKIE_KEY)) {
    host.innerHTML = "";
    return;
  }

  host.innerHTML = `
    <div class="cookie-banner">
      <div class="cookie-copy">
        <strong>${pick(COPY.shell.cookieTitle)}</strong>
        <span>${pick(COPY.shell.cookieBody)}</span>
      </div>
      <div class="cookie-actions">
        <button class="btn btn-secondary" type="button" data-cookie-action="essential">${pick(COPY.shell.cookieEssential)}</button>
        <button class="btn btn-primary" type="button" data-cookie-action="accept">${pick(COPY.shell.cookieAccept)}</button>
      </div>
    </div>
  `;
}

function showToast(message) {
  const toast = document.querySelector("[data-toast]");

  if (!toast) {
    return;
  }

  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 1800);
}

function productStatusLabel(product) {
  return product.status === "available" ? pick(COPY.labels.available) : pick(COPY.labels.comingMay);
}

function productPriceLabel(product) {
  return typeof product.price === "number" ? formatPrice(product.price) : pick(COPY.labels.priceOnRelease);
}

function renderProductCard(product, options = {}) {
  const cardClass = options.reveal === false ? "product-card" : `product-card reveal${options.delay ? " reveal-delay" : ""}`;
  const actionButton = product.status === "available"
    ? `<button class="btn btn-secondary" type="button" data-add-to-cart="${product.slug}">${pick(COPY.labels.addToCart)}</button>`
    : `<span class="badge badge-ready">${pick(COPY.labels.comingMay)}</span>`;

  return `
    <article class="${cardClass}">
      <img src="${product.image}" alt="${pick(product.name)} ${product.dosage}">
      <div class="card-body">
        <div class="card-meta">
          <span class="status-pill ${product.status === "available" ? "available" : "coming"}">${productStatusLabel(product)}</span>
          <strong class="card-price">${productPriceLabel(product)}</strong>
        </div>
        <h3>${pick(product.name)} ${product.dosage}</h3>
        <p class="card-copy">${pick(product.short)}</p>
        <div class="product-action-row">
          <a class="text-link" href="product.html?slug=${product.slug}">${pick(COPY.labels.viewProduct)}</a>
          ${actionButton}
        </div>
      </div>
    </article>
  `;
}

function renderTrustCards() {
  return HOME_TRUST.map((item, index) => `
    <article class="trust-card reveal${index % 2 ? " reveal-delay" : ""}">
      <span class="icon-chip">${item.icon}</span>
      <h3>${pick(item.title)}</h3>
      <p class="card-copy">${pick(item.body)}</p>
    </article>
  `).join("");
}

function renderServiceCards() {
  return SERVICE_BLOCKS.map((item, index) => `
    <article class="service-card reveal${index % 2 ? " reveal-delay" : ""}">
      <span class="icon-chip">${item.icon}</span>
      <h3>${pick(item.title)}</h3>
      <p>${pick(item.body)}</p>
    </article>
  `).join("");
}

function renderBenefitCards() {
  return BENEFITS.map((item, index) => `
    <article class="benefit-card reveal${index % 2 ? " reveal-delay" : ""}">
      <span class="icon-chip">${item.icon}</span>
      <h3>${pick(item.title)}</h3>
      <p>${pick(item.body)}</p>
    </article>
  `).join("");
}

function renderShippingRows() {
  return SHIPPING_ROWS.map((row) => `
    <tr>
      <td>${pick(row.region)}</td>
      <td>${pick(row.speed)}</td>
      <td>${row.price}</td>
    </tr>
  `).join("");
}

function renderHomePage() {
  const featured = PRODUCTS.filter((product) => product.featured).map((product, index) => renderProductCard(product, { delay: index % 2 === 1 })).join("");

  return `
    <section class="hero-home">
      <div class="container hero-grid">
        <div class="hero-copy reveal">
          <p class="kicker">${pick(COPY.home.heroKicker)}</p>
          <h1>${pick(COPY.home.heroTitle)}</h1>
          <p class="lead">${pick(COPY.home.heroBody)}</p>
          <div class="hero-actions">
            <a class="btn btn-primary" href="shop.html">${pick(COPY.labels.viewCatalog)}</a>
          </div>
          <div class="hero-trust">
            <div class="trust-chip"><strong>${pick(COPY.labels.hplc)}</strong></div>
            <div class="trust-chip"><strong>${pick(COPY.labels.shipped)}</strong></div>
            <div class="trust-chip"><strong>${pick(COPY.labels.freeShipping)}</strong></div>
          </div>
        </div>
        <div class="hero-stack reveal reveal-delay">
          <article class="panel panel-dark">
            <p class="panel-kicker">${pick(COPY.home.trustTitle)}</p>
            <h2>${pick(COPY.home.trustBody)}</h2>
            <div class="metric-grid">
              <div class="metric-card"><strong>11</strong><small>${currentLanguage === "es" ? "productos disponibles" : "live products"}</small></div>
              <div class="metric-card"><strong>6</strong><small>${currentLanguage === "es" ? "beneficios clave" : "trust modules"}</small></div>
              <div class="metric-card"><strong>EN / ES</strong><small>${currentLanguage === "es" ? "experiencia bilingüe" : "bilingual flow"}</small></div>
            </div>
          </article>
          <article class="hero-visual hero-visual-photo reveal">
            <img src="${HERO_VISUAL_SRC}" alt="Primus Peptides laboratory handling visual">
            <div class="overlay-card">${pick(COPY.home.heroNote)}</div>
          </article>
        </div>
      </div>
    </section>
    <section class="section section-tight">
      <div class="container trust-grid">${renderTrustCards()}</div>
    </section>
    <section class="section">
      <div class="container">
        <div class="section-header reveal">
          <p class="section-kicker">${pick(COPY.home.featuredKicker)}</p>
          <h2 class="section-title">${pick(COPY.home.featuredTitle)}</h2>
          <p class="section-copy">${pick(COPY.home.featuredBody)}</p>
        </div>
        <div class="catalog-grid">${featured}</div>
      </div>
    </section>
    <section class="section section-dark">
      <div class="container section-stack">
        <div class="section-header reveal">
          <p class="section-kicker">${pick(COPY.home.servicesKicker)}</p>
          <h2 class="section-title">${pick(COPY.home.servicesTitle)}</h2>
          <p class="section-copy">${pick(COPY.home.servicesBody)}</p>
        </div>
        <div class="service-grid">${renderServiceCards()}</div>
      </div>
    </section>
    <section class="section">
      <div class="container shipping-layout">
        <div class="section-header reveal">
          <p class="section-kicker">${pick(COPY.home.shippingKicker)}</p>
          <h2 class="section-title">${pick(COPY.home.shippingTitle)}</h2>
          <p class="section-copy">${pick(COPY.home.shippingBody)}</p>
        </div>
        <article class="info-panel reveal reveal-delay">
          <table class="shipping-table">
            <thead>
              <tr>
                <th>${currentLanguage === "es" ? "Zona" : "Region"}</th>
                <th>${currentLanguage === "es" ? "Velocidad" : "Speed"}</th>
                <th>${currentLanguage === "es" ? "Precio" : "Cost"}</th>
              </tr>
            </thead>
            <tbody>${renderShippingRows()}</tbody>
          </table>
          <p class="table-note">${pick(COPY.home.shippingBody)}</p>
        </article>
      </div>
    </section>
    <section class="section section-tight">
      <div class="container section-stack">
        <div class="section-header reveal">
          <p class="section-kicker">${pick(COPY.home.benefitsKicker)}</p>
          <h2 class="section-title">${pick(COPY.home.benefitsTitle)}</h2>
          <p class="section-copy">${pick(COPY.home.benefitsBody)}</p>
        </div>
        <div class="benefit-grid">${renderBenefitCards()}</div>
      </div>
    </section>
    <section class="section section-dark">
      <div class="container">
        <article class="cta-panel reveal">
          <p class="section-kicker">${pick(COPY.home.ctaKicker)}</p>
          <h2>${pick(COPY.home.ctaTitle)}</h2>
          <p>${pick(COPY.home.ctaBody)}</p>
          <div class="hero-actions">
            <a class="btn btn-primary" href="shop.html">${pick(COPY.labels.browseShop)}</a>
            <a class="btn btn-ghost" href="coa.html">${pick(COPY.labels.seeCoa)}</a>
          </div>
        </article>
      </div>
    </section>
  `;
}

function renderProofCards() {
  const cards = [
    {
      icon: "COA",
      title: { en: "Certificate archive ready", es: "Archivo de certificados listo" },
      body: {
        en: "Every live SKU is paired with batch visibility so documentation feels central to the storefront.",
        es: "Cada SKU activo se presenta con visibilidad por lote para que la documentacion se sienta central en la tienda."
      }
    },
    {
      icon: "HPLC",
      title: { en: "Purity-first presentation", es: "Presentacion centrada en pureza" },
      body: {
        en: "HPLC-tested trust copy is repeated in the hero, product cards, product page, and archive.",
        es: "El mensaje HPLC se repite en hero, fichas de producto, pagina de producto y archivo para reforzar confianza."
      }
    },
    {
      icon: "GMP",
      title: { en: "Manufacturing confidence", es: "Confianza de fabricacion" },
      body: {
        en: "The layout leaves room for GMP references, lot consistency notes, and release documentation.",
        es: "La estructura deja espacio para referencias GMP, consistencia por lote y documentacion de liberacion."
      }
    }
  ];

  return cards.map((item, index) => `
    <article class="proof-card reveal${index % 2 ? " reveal-delay" : ""}">
      <span class="icon-chip">${item.icon}</span>
      <h3>${pick(item.title)}</h3>
      <p>${pick(item.body)}</p>
    </article>
  `).join("");
}

function renderTestimonialCards() {
  const testimonials = [
    {
      quote: {
        en: "The storefront feels much more trustworthy than most peptide shops. COA access and shipping expectations are clear from the start.",
        es: "La tienda transmite mucha mas confianza que la mayoria de webs de peptidos. El acceso al COA y el envio quedan claros desde el inicio."
      },
      meta: { en: "Marco R. | Repeat buyer", es: "Marco R. | Comprador recurrente" }
    },
    {
      quote: {
        en: "Fast to scan on mobile, clean product layout, and the trust details are exactly where they should be. It feels premium without looking overdesigned.",
        es: "Se entiende muy rapido en movil, el layout es limpio y los detalles de confianza estan donde deben estar. Se siente premium sin verse recargado."
      },
      meta: { en: "Elena T. | Athlete-focused customer", es: "Elena T. | Cliente orientada al rendimiento" }
    },
    {
      quote: {
        en: "The updated visuals look much more clinical and professional. It finally feels like a specialist research supplier.",
        es: "Las visuales actualizadas se ven mucho mas clinicas y profesionales. Por fin parece un proveedor especialista en investigacion."
      },
      meta: { en: "Daniel P. | Biohacking audience", es: "Daniel P. | Audiencia biohacker" }
    }
  ];

  return testimonials.map((item, index) => `
    <article class="testimonial-card reveal${index % 2 ? " reveal-delay" : ""}">
      <p class="testimonial-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</p>
      <p class="testimonial-quote">"${pick(item.quote)}"</p>
      <p class="testimonial-meta">${pick(item.meta)}</p>
    </article>
  `).join("");
}

function renderUpdatedHomePage() {
  const featured = PRODUCTS
    .filter((product) => product.featured)
    .map((product, index) => renderProductCard(product, { delay: index % 2 === 1 }))
    .join("");

  return `
    <section class="hero-home">
      <div class="container hero-grid">
        <div class="hero-copy reveal">
          <p class="kicker">${currentLanguage === "es" ? "Tienda de Peptidos pensada para convertir" : "Conversion-First Peptide Storefront"}</p>
          <h1>${currentLanguage === "es" ? "Peptidos de grado investigacion con una presencia mas limpia y creible desde el primer vistazo." : "Research-grade peptides with a cleaner, more credible storefront from the first screen."}</h1>
          <p class="lead">${currentLanguage === "es" ? "Primus Peptides se presenta con una direccion cientifica mas fuerte: hero premium, CTAs repetidos, navegacion sticky y una lectura movil mucho mas rapida." : "Primus Peptides is presented with the premium scientific feel from your brief: dark trust-led hero, repeated CTA placement, sticky navigation, and a faster mobile reading experience."}</p>
          <div class="hero-actions">
            <a class="btn btn-primary" href="shop.html">${pick(COPY.labels.viewCatalog)}</a>
            <a class="btn btn-secondary" href="coa.html">${pick(COPY.labels.seeCoa)}</a>
          </div>
          <div class="hero-trust">
            <div class="trust-chip"><strong>${pick(COPY.labels.hplc)}</strong></div>
            <div class="trust-chip"><strong>${pick(COPY.labels.shipped)}</strong></div>
            <div class="trust-chip"><strong>${pick(COPY.labels.freeShipping)}</strong></div>
          </div>
        </div>
        <div class="hero-stack reveal reveal-delay">
          <article class="panel panel-dark">
            <p class="panel-kicker">${currentLanguage === "es" ? "Posicionamiento premium de investigacion" : "Premium Research Positioning"}</p>
            <h2>${currentLanguage === "es" ? "Pensado para generar confianza en atletas y compradores biohacker de alta intencion." : "Built to feel trustworthy to athletes and high-intent biohacking buyers."}</h2>
            <div class="metric-grid">
              <div class="metric-card"><strong>11</strong><small>${currentLanguage === "es" ? "productos activos" : "live products"}</small></div>
              <div class="metric-card"><strong>EN / ES</strong><small>${currentLanguage === "es" ? "flujo bilingue" : "bilingual flow"}</small></div>
              <div class="metric-card"><strong>COA</strong><small>${currentLanguage === "es" ? "archivo listo" : "archive-ready trust"}</small></div>
            </div>
          </article>
          <article class="hero-visual hero-visual-photo reveal">
            <img src="${HERO_VISUAL_SRC}" alt="Primus Peptides laboratory handling visual">
            <div class="overlay-card">${currentLanguage === "es" ? "Visuales de vial mas limpias, modulos de confianza repetidos y rutas mas cortas al detalle de producto." : "Clean vial visuals, repeated trust modules, and shorter paths into product detail."}</div>
          </article>
        </div>
      </div>
    </section>
    <section class="section section-tight">
      <div class="container trust-grid">${renderTrustCards()}</div>
    </section>
    <section class="section">
      <div class="container">
        <div class="section-header reveal">
          <p class="section-kicker">${currentLanguage === "es" ? "Productos destacados" : "Featured Products"}</p>
          <h2 class="section-title">${currentLanguage === "es" ? "Imagenes de vial sobre blanco para una lectura mas limpia y medica." : "White-background vial visuals with less clutter and better product scanning."}</h2>
          <p class="section-copy">${currentLanguage === "es" ? "La parrilla destacada ahora se siente mas clinica y minimal, con menos ruido visual." : "The featured grid now leans medical and minimal instead of lifestyle-heavy."}</p>
        </div>
        <div class="catalog-grid">${featured}</div>
      </div>
    </section>
    <section class="section section-dark">
      <div class="container section-stack">
        <div class="section-header reveal">
          <p class="section-kicker">${currentLanguage === "es" ? "Bloques profesionales" : "Professional Services"}</p>
          <h2 class="section-title">${currentLanguage === "es" ? "Los cuatro bloques de apoyo ahora se sienten mas precisos y menos genericos." : "The four support blocks now feel more precise and less generic."}</h2>
          <p class="section-copy">${currentLanguage === "es" ? "Se mantienen la estructura solicitada y una presencia visual mas propia para Primus Peptides." : "Adapted from the requested structure while keeping the new storefront visually distinct."}</p>
        </div>
        <div class="service-grid">${renderServiceCards()}</div>
      </div>
    </section>
    <section class="section">
      <div class="container shipping-layout">
        <div class="section-header reveal">
          <p class="section-kicker">${currentLanguage === "es" ? "Informacion de envio" : "Shipping Info"}</p>
          <h2 class="section-title">${currentLanguage === "es" ? "La logistica sigue visual, simple y facil de comparar." : "Logistics stay visual, simple, and easy to compare."}</h2>
          <p class="section-copy">${currentLanguage === "es" ? "La tabla esta pensada para que el visitante entienda las opciones de entrega de un vistazo." : "This section is intentionally straightforward so mobile visitors can understand delivery options at a glance."}</p>
        </div>
        <article class="info-panel reveal reveal-delay">
          <table class="shipping-table">
            <thead>
              <tr>
                <th>${currentLanguage === "es" ? "Zona" : "Region"}</th>
                <th>${currentLanguage === "es" ? "Velocidad" : "Speed"}</th>
                <th>${currentLanguage === "es" ? "Precio" : "Cost"}</th>
              </tr>
            </thead>
            <tbody>${renderShippingRows()}</tbody>
          </table>
        <p class="table-note">${currentLanguage === "es" ? "Las tarifas y tiempos de entrega se muestran antes del pago para ofrecer una referencia clara del pedido." : "Shipping rates and delivery timings are shown before payment so customers can review the order clearly."}</p>
        </article>
      </div>
    </section>
    <section class="section section-tight">
      <div class="container section-stack">
        <div class="section-header reveal">
          <p class="section-kicker">${currentLanguage === "es" ? "Por que confiar en nosotros" : "Why Trust Us"}</p>
          <h2 class="section-title">${currentLanguage === "es" ? "Una seccion pensada para sentirse como pruebas de laboratorio, no solo beneficios." : "Designed to feel like a lab certificates section, not just another benefits row."}</h2>
          <p class="section-copy">${currentLanguage === "es" ? "Este bloque añade a la home una capa de credibilidad mucho más cercana a un archivo técnico." : "This section gives the homepage a stronger certificate-driven trust layer."}</p>
        </div>
        <div class="proof-grid">${renderProofCards()}</div>
      </div>
    </section>
    <section class="section section-tight">
      <div class="container section-stack">
        <div class="section-header reveal">
          <p class="section-kicker">${currentLanguage === "es" ? "Testimonios" : "Testimonials"}</p>
          <h2 class="section-title">${currentLanguage === "es" ? "Una capa de prueba social que se siente real y tranquilizadora." : "A proof section that reads like real buyer reassurance."}</h2>
          <p class="section-copy">${currentLanguage === "es" ? "Añade una capa de prueba social sólida sin perder el tono científico del proyecto." : "A social-proof block that adds reassurance without losing the scientific tone."}</p>
        </div>
        <div class="testimonial-grid">${renderTestimonialCards()}</div>
      </div>
    </section>
  `;
}

function renderShopGrid() {
  const filtered = PRODUCTS.filter((product) => {
    const matchesFilter = shopFilter === "all"
      || (shopFilter === "available" && product.status === "available")
      || (shopFilter === "coming" && product.status === "coming");
    const term = shopQuery.trim().toLowerCase();
    const haystack = `${product.name.en} ${product.dosage} ${product.status}`.toLowerCase();
    return matchesFilter && (!term || haystack.includes(term));
  });

  const meta = document.querySelector("[data-shop-meta]");
  const grid = document.querySelector("[data-shop-grid]");

  if (!grid || !meta) {
    return;
  }

  meta.textContent = `${filtered.length} ${pick(COPY.shop.resultsLabel)}`;

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <h3>${pick(COPY.shop.emptyTitle)}</h3>
        <p>${pick(COPY.shop.emptyBody)}</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map((product, index) => renderProductCard(product, { reveal: false, delay: index % 2 === 1 })).join("");
}

function renderShopPage() {
  const availableCount = PRODUCTS.filter((product) => product.status === "available").length;
  const upcomingCount = PRODUCTS.filter((product) => product.status === "coming").length;

  return `
    <section class="page-hero">
      <div class="container page-hero-grid">
        <div class="section-header reveal">
          <p class="section-kicker">${pick(COPY.shop.kicker)}</p>
          <h1>${pick(COPY.shop.title)}</h1>
          <p class="lead">${pick(COPY.shop.body)}</p>
          <div class="shop-controls">
            <input class="search-input" type="search" value="${shopQuery}" placeholder="${pick(COPY.labels.searchPlaceholder)}" data-shop-search>
            <div class="filter-row">
              <button type="button" class="filter-chip ${shopFilter === "all" ? "is-active" : ""}" data-filter="all">${pick(COPY.labels.allProducts)}</button>
              <button type="button" class="filter-chip ${shopFilter === "available" ? "is-active" : ""}" data-filter="available">${pick(COPY.labels.inStock)}</button>
              <button type="button" class="filter-chip ${shopFilter === "coming" ? "is-active" : ""}" data-filter="coming">${pick(COPY.labels.upcoming)}</button>
            </div>
          </div>
        </div>
        <aside class="page-stat-card reveal reveal-delay">
          <div class="page-stat-list">
            <div class="page-stat-item"><strong>${availableCount}</strong><span>${pick(COPY.shop.statAvailable)}</span></div>
            <div class="page-stat-item"><strong>${upcomingCount}</strong><span>${pick(COPY.shop.statUpcoming)}</span></div>
            <div class="page-stat-item"><strong>USDT / BANK</strong><span>${currentLanguage === "es" ? "pagos alojados" : "hosted payments"}</span></div>
          </div>
        </aside>
      </div>
    </section>
    <section class="section section-tight">
      <div class="container">
        <div class="catalog-meta reveal">
          <p class="section-caption" data-shop-meta></p>
        </div>
        <div class="catalog-grid" data-shop-grid></div>
      </div>
    </section>
  `;
}

function productProtocolSections() {
  return [
    { title: pick(COPY.product.howWorks), body: pick(COPY.product.protocolHow) },
    { title: pick(COPY.product.benefitsSide), body: pick(COPY.product.protocolBenefits) },
    { title: pick(COPY.product.protocolOverview), body: pick(COPY.product.protocolOverviewCopy) },
    { title: pick(COPY.product.dosingProtocol), body: pick(COPY.product.protocolDoseCopy) },
    { title: pick(COPY.product.reconstitution), body: pick(COPY.product.protocolReconCopy) }
  ].map((item) => `
    <article class="protocol-section">
      <h3>${item.title}</h3>
      <p class="protocol-text">${item.body}</p>
    </article>
  `).join("");
}

function productDescription(product) {
  return `
    <div class="section-stack">
      <p class="section-copy">${pick(COPY.product.descriptionLead)}</p>
      <dl class="spec-list">
        <div class="spec-item"><dt>${pick(COPY.product.material)}</dt><dd>${pick(product.name)} ${pick(COPY.product.descriptionMaterialSuffix)}</dd></div>
        <div class="spec-item"><dt>${pick(COPY.product.form)}</dt><dd>${pick(COPY.product.descriptionFormValue)}</dd></div>
        <div class="spec-item"><dt>${pick(COPY.product.manufacturing)}</dt><dd>${pick(COPY.product.descriptionManufacturingValue)}</dd></div>
        <div class="spec-item"><dt>${pick(COPY.product.storage)}</dt><dd>${pick(COPY.product.descriptionStorageValue)}</dd></div>
      </dl>
    </div>
  `;
}

function productAdditional() {
  return `
    <div class="section-stack">
      <p class="section-copy">${pick(COPY.product.protocolLead)}</p>
      <div class="protocol-grid">${productProtocolSections()}</div>
    </div>
  `;
}function renderProductPage() {
  const product = currentProduct();
  const cart = readCart();
  const remaining = Math.max(FREE_SHIPPING_THRESHOLD - subtotal(cart), 0);
  const progress = Math.min((subtotal(cart) / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const gallery = product.gallery.map((image) => `<div class="gallery-thumb"><img src="${image}" alt="${pick(product.name)} ${product.dosage}"></div>`).join("");
  const panelAction = product.status === "available"
    ? `
      <div class="quantity-row" data-quantity-root>
        <span>${pick(COPY.labels.qty)}</span>
        <div class="quantity-controls">
          <button class="qty-btn" type="button" data-qty-action="decrease">-</button>
          <strong data-quantity-value>1</strong>
          <button class="qty-btn" type="button" data-qty-action="increase">+</button>
        </div>
      </div>
      <button class="btn btn-primary btn-block" type="button" data-add-to-cart="${product.slug}">${pick(COPY.labels.addToCart)}</button>
    `
    : `
      <div class="stock-pill coming">${pick(COPY.product.comingBadge)}</div>
      <p class="product-subtext">${pick(COPY.product.unavailableCopy)}</p>
      <button class="btn btn-muted btn-block" type="button" disabled>${pick(COPY.labels.comingMay)}</button>
    `;
  const tabPanel = activeProductTab === "description" ? productDescription(product) : productAdditional();
  const related = PRODUCTS.filter((item) => item.slug !== product.slug).slice(0, 3).map((item, index) => renderProductCard(item, { delay: index % 2 === 1 })).join("");
  const progressCopy = remaining > 0
    ? `${pick(COPY.product.spendMore)} ${formatPrice(remaining)} ${pick(COPY.product.toUnlock)}`
    : pick(COPY.product.thresholdReached);

  return `
    <section class="page-hero">
      <div class="container product-main">
        <p class="breadcrumb">${pick(COPY.nav.home)} / ${pick(COPY.nav.shop)} / ${pick(product.name)} ${product.dosage}</p>
        <div class="product-layout">
          <div class="gallery-grid reveal">
            <div class="product-main-image"><img src="${product.image}" alt="${pick(product.name)} ${product.dosage}"></div>
            <div class="gallery-thumb-grid">${gallery}</div>
          </div>
          <aside class="panel product-panel reveal reveal-delay">
            <div class="card-meta">
              <span class="status-pill ${product.status === "available" ? "available" : "coming"}">${productStatusLabel(product)}</span>
              <span class="badge">${pick(COPY.labels.hplc)}</span>
            </div>
            <p class="panel-kicker">${pick(COPY.nav.shop)}</p>
            <h1>${pick(product.name)} ${product.dosage}</h1>
            <p class="product-subtext">${pick(product.short)}</p>
            <div class="price-row">
              <strong class="price-value">${productPriceLabel(product)}</strong>
              <span>${product.status === "available" ? "EUR" : pick(COPY.labels.comingSoon)}</span>
            </div>
            <div class="product-trust">
              <div class="trust-icon">${pick(COPY.labels.shipped)}</div>
              <div class="trust-icon">${pick(COPY.labels.freeShipping)}</div>
              <div class="trust-icon">${pick(COPY.labels.hplc)}</div>
            </div>
            <div class="shipping-progress">
              <div class="shipping-progress-bar" style="width:${progress}%"></div>
              <p>${progressCopy}</p>
            </div>
            ${panelAction}
          </aside>
        </div>
      </div>
    </section>
    <section class="section section-tight">
      <div class="container">
        <article class="tabs-card reveal">
          <div class="tab-row">
            <button type="button" class="tab-button ${activeProductTab === "description" ? "is-active" : ""}" data-tab="description">${pick(COPY.product.tabDescription)}</button>
            <button type="button" class="tab-button ${activeProductTab === "additional" ? "is-active" : ""}" data-tab="additional">${pick(COPY.product.tabAdditional)}</button>
          </div>
          <div data-tab-panel>${tabPanel}</div>
        </article>
      </div>
    </section>
    <section class="section section-tight">
      <div class="container section-stack">
        <div class="section-header reveal">
          <p class="section-kicker">${pick(COPY.product.relatedKicker)}</p>
          <h2 class="section-title">${pick(COPY.product.relatedTitle)}</h2>
          <p class="section-copy">${pick(COPY.product.relatedBody)}</p>
        </div>
        <div class="related-grid">${related}</div>
      </div>
    </section>
  `;
}

function renderCoaCards() {
  return PRODUCTS.map((product, index) => {
    const ready = product.status === "available";
    return `
      <article class="coa-card reveal${index % 2 ? " reveal-delay" : ""}">
        <div class="card-meta">
          <span class="status-pill ${ready ? "coa" : "coming"}">${ready ? pick(COPY.labels.batchReady) : pick(COPY.coa.pendingLabel)}</span>
          <span class="stock-pill ${product.status === "available" ? "available" : "coming"}">${productStatusLabel(product)}</span>
        </div>
        <h3>${pick(product.name)} ${product.dosage}</h3>
        <p class="card-copy">${pick(COPY.coa.batchLabel)}: ${product.batch}</p>
        <p class="card-copy">${pick(COPY.coa.testedLabel)}: ${formatDate(product.coaDate)}</p>
        <a class="text-link" href="product.html?slug=${product.slug}">${pick(COPY.labels.viewProduct)}</a>
      </article>
    `;
  }).join("");
}

function renderCoaPage() {
  return `
    <section class="page-hero">
      <div class="container page-hero-grid">
        <div class="section-header reveal">
          <p class="section-kicker">${pick(COPY.coa.kicker)}</p>
          <h1>${pick(COPY.coa.title)}</h1>
          <p class="lead">${pick(COPY.coa.body)}</p>
        </div>
        <aside class="page-stat-card reveal reveal-delay">
          <p class="panel-kicker">${pick(COPY.coa.noteTitle)}</p>
          <p>${pick(COPY.coa.noteBody)}</p>
        </aside>
      </div>
    </section>
    <section class="section section-tight">
      <div class="container coa-grid">${renderCoaCards()}</div>
    </section>
  `;
}

function renderFaqPage() {
  const items = COPY.faq.items.map((item, index) => `
    <article class="faq-item reveal${index % 2 ? " reveal-delay" : ""}">
      <button class="faq-question" type="button" data-faq-button aria-expanded="false">${pick(item.question)}</button>
      <div class="faq-answer" hidden><p>${pick(item.answer)}</p></div>
    </article>
  `).join("");

  return `
    <section class="page-hero">
      <div class="container section-stack">
        <div class="section-header reveal">
          <p class="section-kicker">${pick(COPY.faq.kicker)}</p>
          <h1>${pick(COPY.faq.title)}</h1>
          <p class="lead">${pick(COPY.faq.body)}</p>
        </div>
        <div class="faq-list">${items}</div>
      </div>
    </section>
  `;
}

function renderContactPage() {
  return `
    <section class="page-hero">
      <div class="container contact-grid">
        <article class="contact-card reveal">
          <div class="section-header">
            <p class="section-kicker">${pick(COPY.contact.kicker)}</p>
            <h1>${pick(COPY.contact.title)}</h1>
            <p class="lead">${pick(COPY.contact.body)}</p>
          </div>
          <div class="contact-points">
            <div class="contact-point"><strong>${pick(COPY.contact.emailTitle)}</strong><a href="mailto:${SITE_EMAIL}">${SITE_EMAIL}</a></div>
            <div class="contact-point"><strong>${pick(COPY.contact.shippingTitle)}</strong><p>${pick(COPY.contact.shippingBody)}</p></div>
            <div class="contact-point"><strong>${pick(COPY.contact.paymentTitle)}</strong><p>${pick(COPY.contact.paymentBody)}</p><div class="payment-chips">${PAYMENT_METHODS.map((item) => `<span class="payment-chip">${item}</span>`).join("")}</div></div>
          </div>
        </article>
        <article class="contact-card reveal reveal-delay">
          <div class="section-header">
            <p class="section-kicker">${pick(COPY.contact.formTitle)}</p>
            <h2 class="section-title">${pick(COPY.contact.formBody)}</h2>
          </div>
          <form class="form-grid" data-contact-form>
            <label class="full-width"><span>${pick(COPY.contact.nameLabel)}</span><input class="form-input" name="name" required></label>
            <label class="full-width"><span>${pick(COPY.contact.emailLabel)}</span><input class="form-input" name="email" type="email" required></label>
            <label class="full-width"><span>${pick(COPY.contact.subjectLabel)}</span><input class="form-input" name="subject" placeholder="${pick(COPY.contact.placeholderSubject)}"></label>
            <label class="full-width"><span>${pick(COPY.contact.messageLabel)}</span><textarea class="form-textarea" name="message" placeholder="${pick(COPY.contact.placeholderMessage)}"></textarea></label>
            <div class="full-width form-row">
              <p class="form-status" data-contact-status></p>
              <button class="btn btn-primary" type="submit">${pick(COPY.labels.sendMessage)}</button>
            </div>
          </form>
        </article>
      </div>
    </section>
  `;
}

function renderCartItems(cart) {
  if (!cart.length) {
    return `
      <div class="cart-empty">
        <h3>${pick(COPY.cart.emptyTitle)}</h3>
        <p>${pick(COPY.cart.emptyBody)}</p>
        <a class="btn btn-primary" href="shop.html">${pick(COPY.labels.browseShop)}</a>
      </div>
    `;
  }

  return `<div class="cart-items">${cart.map((item) => {
    const product = getProduct(item.slug);
    return `
      <article class="cart-item">
        <div>
          <h3>${pick(product.name)} ${product.dosage}</h3>
          <p class="card-copy">${product.price ? formatPrice(product.price) : pick(COPY.labels.priceOnRelease)} ${currentLanguage === "es" ? "cada uno" : "each"}</p>
        </div>
        <div class="cart-item-actions">
          <button class="cart-action" type="button" data-cart-action="decrease" data-cart-slug="${product.slug}">-</button>
          <strong>${item.quantity}</strong>
          <button class="cart-action" type="button" data-cart-action="increase" data-cart-slug="${product.slug}">+</button>
        </div>
        <div class="cart-item-actions">
          <strong class="summary-price">${product.price ? formatPrice(product.price * item.quantity) : pick(COPY.labels.priceOnRelease)}</strong>
          <button class="remove-link" type="button" data-cart-action="remove" data-cart-slug="${product.slug}">${currentLanguage === "es" ? "Eliminar" : "Remove"}</button>
        </div>
      </article>
    `;
  }).join("")}</div>`;
}

function renderCartPage() {
  const cart = readCart();
  const total = subtotal(cart);
  const remaining = Math.max(FREE_SHIPPING_THRESHOLD - total, 0);
  const progress = Math.min((total / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const thresholdCopy = remaining > 0
    ? `${pick(COPY.cart.thresholdPrefix)} ${formatPrice(remaining)} ${pick(COPY.cart.thresholdSuffix)}`
    : pick(COPY.cart.thresholdDone);

  return `
    <section class="page-hero">
      <div class="container cart-layout">
        <section class="contact-card reveal">
          <div class="section-header">
            <p class="section-kicker">${pick(COPY.cart.kicker)}</p>
            <h1>${pick(COPY.cart.title)}</h1>
            <p class="lead">${pick(COPY.cart.body)}</p>
          </div>
          ${renderCartItems(cart)}
        </section>
        <aside class="summary-card reveal reveal-delay">
          <div class="section-header">
            <p class="section-kicker">${pick(COPY.shell.cartLabel)}</p>
            <h2 class="section-title">${pick(COPY.labels.guestCheckout)}</h2>
          </div>
          <div class="summary-list">
            <div class="summary-row"><span class="summary-label">${pick(COPY.labels.items)}</span><strong>${itemCount(cart)}</strong></div>
            <div class="summary-row"><span class="summary-label">${pick(COPY.labels.subtotal)}</span><strong>${formatPrice(total)}</strong></div>
            <div class="summary-row"><span class="summary-label">${pick(COPY.labels.shipping)}</span><strong>${pick(COPY.labels.calculatedLater)}</strong></div>
          </div>
          <div class="shipping-progress">
            <div class="shipping-progress-bar" style="width:${progress}%"></div>
            <p>${thresholdCopy}</p>
          </div>
          <div class="section-stack">
            <div><strong>${pick(COPY.cart.paymentTitle)}</strong><p class="summary-note">${pick(COPY.cart.paymentBody)}</p></div>
            <div class="payment-chips">${PAYMENT_METHODS.map((item) => `<span class="payment-chip">${item}</span>`).join("")}</div>
          </div>
          <div class="summary-actions">
            <button class="btn btn-primary btn-block" type="button">${pick(COPY.labels.checkout)}</button>
            <a class="btn btn-secondary btn-block" href="shop.html">${pick(COPY.labels.keepBrowsing)}</a>
          </div>
        </aside>
      </div>
    </section>
  `;
}

function renderPage() {
  const host = document.querySelector("[data-page-content]");

  if (!host) {
    return;
  }

  const page = getCurrentPage();
  document.documentElement.lang = currentLanguage;

  if (page === "home") {
    host.innerHTML = renderUpdatedHomePage();
  } else if (page === "shop") {
    host.innerHTML = renderShopPage();
    renderShopGrid();
  } else if (page === "product") {
    host.innerHTML = renderProductPage();
  } else if (page === "coa") {
    host.innerHTML = renderCoaPage();
  } else if (page === "faq") {
    host.innerHTML = renderFaqPage();
  } else if (page === "contact") {
    host.innerHTML = renderContactPage();
  } else if (page === "cart") {
    host.innerHTML = renderCartPage();
  }

  bindPageInteractions();
  initReveal();
  updateTitle();
}

function updateTitle() {
  const page = getCurrentPage();
  const base = "Primus Peptides";

  if (page === "product") {
    const product = currentProduct();
    document.title = `${base} | ${pick(product.name)} ${product.dosage}`;
    return;
  }

  const titleMap = {
    home: pick(COPY.nav.home),
    shop: pick(COPY.nav.shop),
    coa: pick(COPY.nav.coa),
    faq: pick(COPY.nav.faq),
    contact: pick(COPY.nav.contact),
    cart: pick(COPY.shell.cartLabel)
  };

  document.title = `${base} | ${titleMap[page] || pick(COPY.nav.home)}`;
}

function bindPageInteractions() {
  const search = document.querySelector("[data-shop-search]");

  if (search) {
    search.addEventListener("input", (event) => {
      shopQuery = event.target.value;
      renderShopGrid();
    });
  }

  const contactForm = document.querySelector("[data-contact-form]");

  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const status = document.querySelector("[data-contact-status]");
      if (status) {
        status.textContent = pick(COPY.shell.toastContact);
      }
      contactForm.reset();
      showToast(pick(COPY.shell.toastContact));
    });
  }
}

function handleLanguageSwitch(language) {
  currentLanguage = language === "es" ? "es" : "en";
  writePersistedValue(LANG_KEY, currentLanguage);
  renderShell();
  renderPage();
  renderCookieBanner();
  updateCartBadges();
  showToast(pick(COPY.shell.toastLanguage));
}

function handleAddToCart(button) {
  const slug = button.getAttribute("data-add-to-cart");
  const quantityRoot = document.querySelector("[data-quantity-root]");
  const quantityNode = quantityRoot ? quantityRoot.querySelector("[data-quantity-value]") : null;
  const quantity = quantityNode ? Number(quantityNode.textContent) || 1 : 1;
  addToCart(slug, quantity);
  showToast(pick(COPY.shell.toastAdded));
  if (getCurrentPage() === "cart") {
    renderPage();
  }
}

function handleQuantityButton(button) {
  const root = button.closest("[data-quantity-root]");
  const valueNode = root ? root.querySelector("[data-quantity-value]") : null;
  if (!valueNode) {
    return;
  }
  const current = Number(valueNode.textContent) || 1;
  const action = button.getAttribute("data-qty-action");
  const next = action === "increase" ? current + 1 : Math.max(1, current - 1);
  valueNode.textContent = String(next);
}

function handleCartButton(button) {
  const slug = button.getAttribute("data-cart-slug");
  const action = button.getAttribute("data-cart-action");
  if (action === "increase") {
    updateCart(slug, 1);
  } else if (action === "decrease") {
    updateCart(slug, -1);
  } else if (action === "remove") {
    removeFromCart(slug);
  }
  renderPage();
}

function handleFaq(button) {
  const expanded = button.getAttribute("aria-expanded") === "true";
  const answer = button.nextElementSibling;
  button.setAttribute("aria-expanded", String(!expanded));
  if (answer) {
    answer.hidden = expanded;
  }
}

function handleGlobalClick(event) {
  const langButton = event.target.closest("[data-lang-switch]");
  const cookieButton = event.target.closest("[data-cookie-action]");
  const addButton = event.target.closest("[data-add-to-cart]");
  const qtyButton = event.target.closest("[data-qty-action]");
  const tabButton = event.target.closest("[data-tab]");
  const filterButton = event.target.closest("[data-filter]");
  const faqButton = event.target.closest("[data-faq-button]");
  const cartButton = event.target.closest("[data-cart-action]");

  if (langButton) {
    handleLanguageSwitch(langButton.getAttribute("data-lang-switch"));
    return;
  }

  if (cookieButton) {
    writePersistedValue(COOKIE_KEY, cookieButton.getAttribute("data-cookie-action"));
    renderCookieBanner();
    return;
  }

  if (addButton) {
    handleAddToCart(addButton);
    return;
  }

  if (qtyButton) {
    handleQuantityButton(qtyButton);
    return;
  }

  if (tabButton) {
    activeProductTab = tabButton.getAttribute("data-tab") === "additional" ? "additional" : "description";
    renderPage();
    return;
  }

  if (filterButton) {
    shopFilter = filterButton.getAttribute("data-filter") || "all";
    renderPage();
    return;
  }

  if (faqButton) {
    handleFaq(faqButton);
    return;
  }

  if (cartButton) {
    handleCartButton(cartButton);
  }
}

function initReveal() {
  const nodes = document.querySelectorAll(".reveal");
  if (!nodes.length) {
    return;
  }
  if (!("IntersectionObserver" in window)) {
    nodes.forEach((node) => node.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.18 });
  nodes.forEach((node) => observer.observe(node));
}

function renderShell() {
  renderHeader();
  renderFooter();
}

document.addEventListener("click", handleGlobalClick);

document.addEventListener("DOMContentLoaded", () => {
  renderShell();
  renderPage();
  renderCookieBanner();
  updateCartBadges();
});
