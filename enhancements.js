(function () {
  if (typeof PRODUCTS === "undefined" || typeof readCart !== "function") {
    return;
  }

  const CHECKOUT_DRAFT_STORE = typeof CHECKOUT_DRAFT_KEY === "string"
    ? CHECKOUT_DRAFT_KEY
    : "primus-checkout-draft-v1";
  const LAST_ORDER_STORE = typeof LAST_ORDER_KEY === "string"
    ? LAST_ORDER_KEY
    : "primus-last-order-v1";
  const CHECKOUT_SESSION_ORDER_STORE = "primus-checkout-session-order-v1";
  const CART_STORE = typeof CART_KEY === "string"
    ? CART_KEY
    : "primus-cart-v2";
  const ARIONPAY_INVOICE_ENDPOINT = "/api/create-arionpay-invoice";
  const ORDER_STATUS_ENDPOINT = "/api/order-status";
  const REGISTER_ENDPOINT = "/api/register";
  const LOGIN_ENDPOINT = "/api/login";
  const LOGOUT_ENDPOINT = "/api/logout";
  const SESSION_ENDPOINT = "/api/session";
  const ACCOUNT_ORDERS_ENDPOINT = "/api/account-orders";
  const PUBLIC_PAGE_PATHS = new Set([
    "/index.html",
    "/shop.html",
    "/product.html",
    "/coa.html",
    "/faq.html",
    "/contact.html",
    "/cart.html",
    "/checkout.html",
    "/login.html",
    "/register.html",
    "/account.html",
    "/privacy.html",
    "/terms.html",
    "/shipping.html",
    "/refunds.html"
  ]);
  let shopGoal = "all";
  let shopSort = "featured";
  let activeProductGalleryImage = 0;
  let activeProductGallerySlug = "";
  let arionPayStatusPollTimer = 0;
  let arionPayStatusPollCount = 0;
  let paidOrderRedirectTimer = 0;
  let authNavigationTimer = 0;
  let checkoutAgreementState = {
    ageConfirmed: false,
    exactAmountConfirmed: false
  };
  let authSessionState = {
    status: "idle",
    user: null,
    session: null,
    error: ""
  };
  let authSessionRequest = null;
  let accountOrdersState = {
    status: "idle",
    orders: [],
    error: ""
  };
  let accountOrdersRequest = null;

  const ARIONPAY_STATUS_POLL_DELAY_MS = 2500;
  const ARIONPAY_STATUS_POLL_LIMIT = 48;
  const PAID_ORDER_REDIRECT_DELAY_MS = 3500;
  const HOMEPAGE_URL = "index.html";

  const GOAL_COLLECTIONS = [
    {
      id: "all",
      label: { en: "All research lanes", es: "Todas las lineas de investigacion" },
      summary: {
        en: "Full catalogue view across metabolic, repair, cognitive, and specialist peptide lanes.",
        es: "Vista completa del catalogo para lineas metabolicas, reparacion, cognitivas y especializadas."
      }
    },
    {
      id: "metabolic",
      label: { en: "Metabolic", es: "Metabolico" },
      summary: {
        en: "Appetite-regulation, body-composition, nutrient-use, and energy-pathway products.",
        es: "Productos orientados a regulacion del apetito, composicion corporal, uso de nutrientes y vias energeticas."
      }
    },
    {
      id: "recovery",
      label: { en: "Recovery", es: "Recuperacion" },
      summary: {
        en: "Tissue-support, regenerative, and recovery-facing products with faster operational clarity.",
        es: "Productos de soporte tisular, regeneracion y recuperacion con una lectura operativa mas clara."
      }
    },
    {
      id: "cognitive",
      label: { en: "Cognitive", es: "Cognitivo" },
      summary: {
        en: "Focus, calm, sleep, and nervous-system oriented products grouped into one buyer lane.",
        es: "Productos de foco, calma, sueno y sistema nervioso agrupados en una sola linea de compra."
      }
    },
    {
      id: "longevity",
      label: { en: "Longevity", es: "Longevidad" },
      summary: {
        en: "Mitochondrial, healthy-ageing, and resilience-focused products for more specialist research intent.",
        es: "Productos mitocondriales, de envejecimiento saludable y resiliencia para una intencion de compra mas especialista."
      }
    },
    {
      id: "specialty",
      label: { en: "Specialty", es: "Especialidad" },
      summary: {
        en: "Appearance, pigmentation, and specialist category products that need clearer product separation.",
        es: "Productos de apariencia, pigmentacion y categorias especialistas que necesitan una separacion mas clara."
      }
    }
  ];

  const SHOP_SORT_OPTIONS = [
    { id: "featured", label: { en: "Featured first", es: "Destacados primero" } },
    { id: "price-asc", label: { en: "Price: low to high", es: "Precio: de menor a mayor" } },
    { id: "price-desc", label: { en: "Price: high to low", es: "Precio: de mayor a menor" } },
    { id: "name", label: { en: "Name", es: "Nombre" } }
  ];

  const PRODUCT_GOAL_MAP = {
    "tirzepatide-30mg": ["metabolic"],
    "retatrutide-30mg": ["metabolic"],
    "tb-500-20mg": ["recovery"],
    "bpc-157-10mg": ["recovery"],
    "ghk-cu-50mg": ["recovery", "specialty"],
    "mots-c-40mg": ["metabolic", "longevity"],
    "melanotan-mt2-10mg": ["specialty"],
    "ss-31-50mg": ["longevity", "metabolic"],
    "nad-1000mg": ["longevity", "metabolic"],
    "semax-30mg": ["cognitive"],
    "selank-10mg": ["cognitive"],
    "dsip-10mg": ["cognitive"],
    "epithalon-40mg": ["longevity"],
    "ipamorelin-10mg": ["recovery"],
    "kpv-10mg": ["recovery"],
    "pt141-10mg": ["specialty"],
    "oxytocin-10mg": ["specialty", "cognitive"]
  };

  const BEST_SELLER_SLUGS = [
    "tirzepatide-30mg",
    "retatrutide-30mg",
    "tb-500-20mg",
    "bpc-157-10mg"
  ];

  const POLICY_LINKS = [
    { href: "privacy.html", key: "privacy", label: { en: "Privacy Policy", es: "Política de privacidad" } },
    { href: "terms.html", key: "terms", label: { en: "Terms & Conditions", es: "Términos y condiciones" } },
    { href: "shipping.html", key: "shipping", label: { en: "Shipping Policy", es: "Política de envíos" } },
    { href: "refunds.html", key: "refunds", label: { en: "Returns & Refunds", es: "Devoluciones y reembolsos" } }
  ];

  const DELIVERY_OPTIONS = [
    {
      id: "eu-standard",
      label: { en: "EU Standard", es: "UE estándar" },
      eta: { en: "1-3 business days", es: "1-3 días laborables" },
      note: {
        en: "Best for most European orders with tracking and dispatch confirmation.",
        es: "Ideal para la mayoría de los pedidos europeos con seguimiento y confirmación de salida."
      },
      price: 12,
      freeEligible: true
    },
    {
      id: "eu-express",
      label: { en: "EU Express", es: "UE express" },
      eta: { en: "24-48 hours", es: "24-48 horas" },
      note: {
        en: "Priority preparation and faster courier routing for urgent orders.",
        es: "Preparación prioritaria y tránsito más rápido para pedidos urgentes."
      },
      price: 18,
      freeEligible: true
    },
    {
      id: "international",
      label: { en: "International", es: "Internacional" },
      eta: { en: "4-8 business days", es: "4-8 días laborables" },
      note: {
        en: "Pricing and final courier route depend on destination and customs requirements.",
        es: "El precio final y la ruta dependen del destino y de los requisitos aduaneros."
      },
      price: 24,
      freeEligible: false
    }
  ];
  const PAYMENT_OPTIONS = [
    {
      id: "USDT_TRC20",
      label: { en: "Cryptocurrency", es: "Criptomoneda" },
      chip: "CRYPTO",
      note: {
        en: "Complete your order through secure ArionPay cryptocurrency checkout once your details are confirmed.",
        es: "Completa tu pedido mediante el checkout seguro de criptomonedas de ArionPay una vez confirmados los datos."
      }
    }
  ];

  const ACTIVE_PAYMENT_OPTIONS = PAYMENT_OPTIONS.filter((item) => item.enabled !== false);
  PAYMENT_OPTIONS[0].note.es = "Completa tu pedido mediante el checkout seguro de criptomonedas de ArionPay una vez confirmados los datos.";
  const CRYPTO_CURRENCY_OPTIONS = [
    {
      id: "USDT_TRC20",
      label: { en: "Tether (USDT - TRC20)", es: "Tether (USDT - TRC20)" },
      shortLabel: "USDT",
      live: true
    }
  ];
  const CHECKOUT_COUNTRIES = [
    { code: "NG", label: { en: "Nigeria", es: "Nigeria" }, regions: ["Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"] },
    { code: "DE", label: { en: "Germany", es: "Alemania" }, regions: ["Baden-Wuerttemberg", "Bavaria", "Berlin", "Brandenburg", "Bremen", "Hamburg", "Hesse", "Lower Saxony", "Mecklenburg-Vorpommern", "North Rhine-Westphalia", "Rhineland-Palatinate", "Saarland", "Saxony", "Saxony-Anhalt", "Schleswig-Holstein", "Thuringia"] },
    { code: "ES", label: { en: "Spain", es: "Espana" }, regions: ["Andalusia", "Aragon", "Asturias", "Balearic Islands", "Basque Country", "Canary Islands", "Cantabria", "Castile and Leon", "Castilla-La Mancha", "Catalonia", "Extremadura", "Galicia", "La Rioja", "Madrid", "Murcia", "Navarre", "Valencian Community"] },
    { code: "FR", label: { en: "France", es: "Francia" }, regions: ["Auvergne-Rhone-Alpes", "Bourgogne-Franche-Comte", "Brittany", "Centre-Val de Loire", "Corsica", "Grand Est", "Hauts-de-France", "Ile-de-France", "Normandy", "Nouvelle-Aquitaine", "Occitanie", "Pays de la Loire", "Provence-Alpes-Cote d Azur"] },
    { code: "IT", label: { en: "Italy", es: "Italia" }, regions: ["Abruzzo", "Aosta Valley", "Apulia", "Basilicata", "Calabria", "Campania", "Emilia-Romagna", "Friuli Venezia Giulia", "Lazio", "Liguria", "Lombardy", "Marche", "Molise", "Piedmont", "Sardinia", "Sicily", "Trentino-South Tyrol", "Tuscany", "Umbria", "Veneto"] },
    { code: "NL", label: { en: "Netherlands", es: "Paises Bajos" }, regions: ["Drenthe", "Flevoland", "Friesland", "Gelderland", "Groningen", "Limburg", "North Brabant", "North Holland", "Overijssel", "South Holland", "Utrecht", "Zeeland"] },
    { code: "LT", label: { en: "Lithuania", es: "Lituania" }, regions: ["Alytus", "Kaunas", "Klaipeda", "Marijampole", "Panevezys", "Siauliai", "Taurage", "Telsiai", "Utena", "Vilnius"] },
    { code: "PT", label: { en: "Portugal", es: "Portugal" }, regions: ["Aveiro", "Beja", "Braga", "Braganca", "Castelo Branco", "Coimbra", "Evora", "Faro", "Guarda", "Leiria", "Lisbon", "Madeira", "Portalegre", "Porto", "Santarem", "Setubal", "Viana do Castelo", "Vila Real", "Viseu", "Azores"] },
    { code: "GB", label: { en: "United Kingdom", es: "Reino Unido" }, regions: ["England", "Scotland", "Wales", "Northern Ireland"] },
    { code: "IE", label: { en: "Ireland", es: "Irlanda" }, regions: ["Connacht", "Leinster", "Munster", "Ulster"] },
    { code: "BE", label: { en: "Belgium", es: "Belgica" }, regions: ["Brussels-Capital Region", "Flanders", "Wallonia"] },
    { code: "AT", label: { en: "Austria", es: "Austria" }, regions: ["Burgenland", "Carinthia", "Lower Austria", "Upper Austria", "Salzburg", "Styria", "Tyrol", "Vorarlberg", "Vienna"] },
    { code: "CH", label: { en: "Switzerland", es: "Suiza" }, regions: ["Aargau", "Appenzell Ausserrhoden", "Appenzell Innerrhoden", "Basel-Landschaft", "Basel-Stadt", "Bern", "Fribourg", "Geneva", "Glarus", "Graubuenden", "Jura", "Lucerne", "Neuchatel", "Nidwalden", "Obwalden", "Schaffhausen", "Schwyz", "Solothurn", "St Gallen", "Thurgau", "Ticino", "Uri", "Valais", "Vaud", "Zug", "Zurich"] },
    { code: "US", label: { en: "United States", es: "Estados Unidos" }, regions: ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "District of Columbia", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"] },
    { code: "CA", label: { en: "Canada", es: "Canada" }, regions: ["Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", "Nova Scotia", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", "Northwest Territories", "Nunavut", "Yukon"] }
  ];
  const PRODUCT_PROFILES = {
    "tirzepatide-30mg": {
      short: {
        en: "Flagship catalogue entry positioned with a premium clinical presentation and strong trust cues.",
        es: "Entrada principal del catálogo con presentación clínica premium y señales claras de confianza."
      },
      focus: {
        en: "Positioned around incretin-pathway research, appetite-regulation review, and metabolic model analysis.",
        es: "Planteado para investigación sobre vías incretinas, revisión de regulación del apetito y análisis metabólico."
      }
    },
    "retatrutide-30mg": {
      short: {
        en: "High-ticket product page designed to feel evidence-led, premium, and easy to compare at a glance.",
        es: "Página premium de alto ticket, pensada para leerse con claridad y confianza a primera vista."
      },
      focus: {
        en: "Framed for tri-agonist research discussions and broader pathway comparison across metabolic studies.",
        es: "Enfocado en discusiones de investigación triagonista y comparación de vías en estudios metabólicos."
      }
    },
    "tb-500-20mg": {
      short: {
        en: "Clean technical listing for buyers who expect fast scanning, documentation cues, and low-friction ordering.",
        es: "Ficha técnica limpia para compradores que buscan lectura rápida, documentación y pedido sin fricción."
      },
      focus: {
        en: "Presented for tissue-repair modeling, peptide-fragment handling, and recovery-oriented research workflows.",
        es: "Presentado para modelado de reparación tisular, manejo de fragmentos peptídicos y flujos de investigación."
      }
    },
    "bpc-157-10mg": {
      short: {
        en: "Compact product page with a minimal white-lab visual direction and a fast add-to-cart journey.",
        es: "Página compacta con visual médico minimalista y recorrido de compra rápido."
      },
      focus: {
        en: "Positioned around barrier-function, tissue-response, and formulation-handling research conversations.",
        es: "Orientado a conversaciones de investigación sobre función barrera, respuesta tisular y manejo de formulaciones."
      }
    },
    "ghk-cu-50mg": {
      short: {
        en: "Documentation-led listing with a more cosmetic-science and copper-peptide oriented technical feel.",
        es: "Listado orientado a documentación con un tono técnico de ciencia cosmética y péptido de cobre."
      },
      focus: {
        en: "Framed for copper-peptide reference work, topical formulation review, and peptide-complex handling.",
        es: "Enfocado en referencia de péptidos de cobre, revisión de formulaciones tópicas y manejo de complejos."
      }
    },
    "mots-c-40mg": {
      short: {
        en: "Balanced premium card for mitochondrial-signaling research with a stronger scientific storefront tone.",
        es: "Ficha premium equilibrada para investigación de señalización mitocondrial con tono científico."
      },
      focus: {
        en: "Presented for mitochondrial signaling review, cellular stress models, and metabolic-efficiency research.",
        es: "Presentado para revisión de señalización mitocondrial, modelos de estrés celular e investigación metabólica."
      }
    },
    "melanotan-mt2-10mg": {
      short: {
        en: "Trust-first listing that keeps the medical presentation clean while preserving product-specific identity.",
        es: "Listado centrado en confianza que conserva identidad propia con una presentación médica limpia."
      },
      focus: {
        en: "Positioned for melanocortin-pathway review, pigmentation research, and receptor-focused laboratory work.",
        es: "Planteado para revisión de vías melanocortinas, investigación de pigmentación y trabajo sobre receptores."
      }
    },
    "ss-31-50mg": {
      short: {
        en: "Premium long-form page for a specialist entry where trust, clarity, and handling discipline matter most.",
        es: "Página premium de formato largo para una referencia especialista donde importan claridad y manejo."
      },
      focus: {
        en: "Framed around mitochondrial membrane studies, oxidative-stress models, and energy-pathway analysis.",
        es: "Enfocado en estudios de membrana mitocondrial, modelos de estrés oxidativo y análisis energético."
      }
    },
    "nad-1000mg": {
      short: {
        en: "Clear dosage-led page layout that helps mobile buyers understand strength, handling, and trust fast.",
        es: "Diseño claro orientado a la dosificación para entender potencia, manejo y confianza desde móvil."
      },
      focus: {
        en: "Presented for coenzyme support research, cellular-energy review, and metabolic pathway documentation.",
        es: "Presentado para investigación sobre coenzimas, energía celular y documentación de vías metabólicas."
      }
    },
    "semax-30mg": {
      short: {
        en: "Sharper neuropeptide listing with a premium white-background medical retail direction.",
        es: "Listado de neuropéptido más pulido con una dirección médica premium sobre fondo blanco."
      },
      focus: {
        en: "Positioned for neuropeptide analogue review, cognitive-pathway research, and protocol documentation.",
        es: "Enfocado en revisión de análogos neuropéptidos, investigación cognitiva y documentación de protocolos."
      }
    },
    "selank-10mg": {
      short: {
        en: "Small-format listing refined to feel clinical, credible, and easy to convert on mobile.",
        es: "Listado compacto refinado para sentirse clínico, creíble y fácil de convertir en móvil."
      },
      focus: {
        en: "Framed for peptide analogue review, behavioral-model discussion, and lab-handling documentation.",
        es: "Planteado para revisión de análogos peptídicos, discusión de modelos conductuales y manejo de laboratorio."
      }
    }
  };

  PRODUCT_PROFILES["kpv-10mg"] = {
    short: {
      en: "Upcoming inflammation-support listing upgraded with real Primus packaging visuals and a more specialist catalogue position.",
      es: "Ficha proxima orientada a soporte inflamatorio, mejorada con visuales reales de Primus y una posicion mas especialista en el catalogo."
    },
    focus: {
      en: "Positioned around gut-barrier, local tissue-response, and anti-inflammatory pathway review for lower-volume recovery workflows.",
      es: "Posicionado alrededor de la barrera intestinal, la respuesta tisular local y la revision de vias antiinflamatorias para flujos de recuperacion de bajo volumen."
    }
  };

  const STACK_SERIES = {
    regenerative: {
      title: { en: "Regenerative support stack", es: "Stack regenerativo" },
      summary: {
        en: "Pairs tissue support, barrier repair, and copper-peptide positioning into one cleaner recovery story.",
        es: "Une soporte tisular, reparacion de barrera y posicionamiento de peptidos de cobre en una historia de recuperacion mas clara."
      },
      products: ["tb-500-20mg", "bpc-157-10mg", "ghk-cu-50mg", "kpv-10mg"]
    },
    inflammation: {
      title: { en: "Inflammation and barrier stack", es: "Stack de inflamacion y barrera" },
      summary: {
        en: "Built around BPC-157 and KPV for anti-inflammatory positioning, gut-barrier context, and a clearer specialist lane inside the Primus guide library.",
        es: "Construido alrededor de BPC-157 y KPV para posicionamiento antiinflamatorio, contexto de barrera intestinal y una linea especialista mas clara dentro de la biblioteca de Primus."
      },
      products: ["bpc-157-10mg", "kpv-10mg"]
    },
    metabolic: {
      title: { en: "Metabolic research stack", es: "Stack metabolico" },
      summary: {
        en: "Built around incretin signalling, weekly handling, and mitochondrial support for body-composition research.",
        es: "Construido alrededor de senalizacion incretinica, manejo semanal y soporte mitocondrial para investigacion de composicion corporal."
      },
      products: ["tirzepatide-30mg", "retatrutide-30mg", "mots-c-40mg", "nad-1000mg"]
    },
    nervousSystem: {
      title: { en: "Mental performance stack", es: "Stack de rendimiento mental" },
      summary: {
        en: "Frames focus, calm, and overnight recovery as one connected system instead of separate product pages.",
        es: "Enfoca concentracion, calma y recuperacion nocturna como un sistema conectado y no como paginas separadas."
      },
      products: ["semax-30mg", "selank-10mg", "dsip-10mg"]
    },
    energy: {
      title: { en: "Mitochondrial energy stack", es: "Stack de energia mitocondrial" },
      summary: {
        en: "Positions cellular energy, mitochondrial stability, and recovery efficiency in one premium performance lane.",
        es: "Posiciona energia celular, estabilidad mitocondrial y eficiencia de recuperacion en una sola linea premium."
      },
      products: ["mots-c-40mg", "ss-31-50mg", "nad-1000mg"]
    },
    libido: {
      title: { en: "Connection and libido stack", es: "Stack de conexion y libido" },
      summary: {
        en: "Combines central-arousal research with social-bonding context for a more complete desire-focused story.",
        es: "Combina investigacion sobre activacion central con contexto de vinculo social para una historia de deseo mas completa."
      },
      products: ["pt141-10mg", "oxytocin-10mg", "melanotan-mt2-10mg"]
    },
    longevity: {
      title: { en: "Longevity and recovery stack", es: "Stack de longevidad y recuperacion" },
      summary: {
        en: "Brings together circadian support, GH-secretagogue positioning, and deeper sleep recovery in one series.",
        es: "Reune soporte circadiano, enfoque secretagogo de GH y recuperacion profunda del sueno en una sola serie."
      },
      products: ["epithalon-40mg", "ipamorelin-10mg", "dsip-10mg"]
    }
  };

  const PRODUCT_GUIDES = {};

  Object.assign(PRODUCT_GUIDES, {
    "retatrutide-30mg": {
      summary: {
        en: "Retatrutide is a triple GLP-1/GIP/glucagon receptor agonist studied for substantial weight loss and metabolic improvement in obesity and type 2 diabetes. With an extended half-life of approximately 6 days, this peptide allows convenient once-weekly subcutaneous dosing with a gradual escalation protocol to optimize tolerability. Clinical trials have demonstrated significant weight loss (up to 24% at 48 weeks with 12 mg weekly) while minimizing gastrointestinal adverse events through gradual titration.",
        es: "Retatrutide es un nuevo agonista triple dirigido a GLP-1, GIP y receptores de glucagón, estudiado para la pérdida de peso sustancial y la mejora metabólica en la obesidad y la diabetes tipo 2. Con una vida media prolongada de aproximadamente 6 días, este péptido permite una dosificación subcutánea conveniente una vez por semana con un protocolo de aumento gradual para optimizar la tolerabilidad."
      },
      howItWorks: {
        en: "Retatrutide activates GLP-1, GIP, and glucagon receptors simultaneously, creating a synergistic metabolic effect. This triple mechanism enhances insulin secretion, reduces glucagon release, slows gastric emptying, and increases energy expenditure. The molecule's extended half-life allows for once-weekly dosing, making it suitable for chronic metabolic studies. Research suggests it modulates appetite centers while improving peripheral glucose utilization and fat metabolism.",
        es: "Retatrutide activa simultáneamente receptores GLP-1, GIP y glucagón, creando un efecto metabólico sinérgico. Este mecanismo triple mejora la secreción de insulina, reduce la liberación de glucagón, ralentiza el vaciamiento gástrico y aumenta el gasto energético. La vida media extendida de la molécula permite una dosificación semanal, haciéndola adecuada para estudios metabólicos crónicos. La investigación sugiere que modula centros de apetito mientras mejora la utilización periférica de glucosa y el metabolismo de grasas."
      },
      benefits: {
        en: "May support advanced metabolic research through enhanced appetite regulation, increased energy expenditure, and improved glycemic control. Studied for significant weight management and metabolic health improvements with structured titration. Common effects include reduced appetite, mild gastrointestinal discomfort, and gradual metabolic improvements. Effects are dose-dependent; titration helps optimize response. No significant endocrine disruption observed in research protocols.",
        es: "Puede apoyar la investigación metabólica avanzada a través de regulación del apetito mejorada, aumento del gasto energético y control glucémico mejorado. Estudiado para manejo significativo del peso y mejoras en la salud metabólica con titulación estructurada. Los efectos comunes incluyen reducción del apetito, malestar gastrointestinal leve y mejoras metabólicas graduales. Los efectos dependen de la dosis; la titulación ayuda a optimizar la respuesta. No se ha observado disrupción endocrina significativa en protocolos de investigación."
      },
      protocolOverview: {
        en: "Weekly subcutaneous injections over 12-16 weeks with gradual dose escalation. Dosage range: 2-12 mg weekly. Reconstitution: 3.0 mL per vial (~10 mg/mL). Storage: Lyophilized refrigerated; reconstituted refrigerated; use within 28 days.",
        es: "Inyecciones subcutáneas semanales durante 12-16 semanas con escalada gradual de dosis. Rango de dosis: 2-12 mg semanales. Reconstitución: 3,0 mL por vial (~10 mg/mL). Almacenamiento: Liofilizado refrigerado; reconstituido refrigerado; usar en 28 días."
      },
      dosing: {
        en: "Start: 2 mg weekly; increase every 4 weeks according to tolerance and response. Weeks 1-4: 2 mg, Weeks 5-8: 4 mg, Weeks 9-12: 8 mg, Weeks 13-16: 12 mg. Frequency: Once weekly (subcutaneous). Cycle duration: 12-16 weeks with assessment breaks. Schedule: Same day each week; rotate injection zones.",
        es: "Inicio: 2 mg semanales; aumentar cada 4 semanas según tolerancia y respuesta. Semanas 1-4: 2 mg, Semanas 5-8: 4 mg, Semanas 9-12: 8 mg, Semanas 13-16: 12 mg. Frecuencia: Una vez por semana (subcutáneo). Duración del ciclo: 12-16 semanas con pausas de evaluación. Horario: El mismo día cada semana; rotar zonas de inyección."
      },
      reconstitution: {
        en: "Add 3.0 mL bacteriostatic water (maximum vial capacity) → approximate concentration 10 mg/mL. Easy measurement: At 10 mg/mL, 1 mg = 0.1 mL. Steps: Extract 3.0 mL bacteriostatic water with sterile syringe. Inject slowly by vial wall; avoid foaming. Gently swirl vial until dissolved. Label and refrigerate at 2-8°C, protected from light.",
        es: "Añadir 3,0 mL de agua bacteriostática (capacidad máxima del vial) → concentración aproximada 10 mg/mL. Medición fácil: A 10 mg/mL, 1 mg = 0,1 mL. Pasos: Extraer 3,0 mL de agua bacteriostática con jeringa estéril. Inyectar lentamente por la pared del vial; evitar formar espuma. Agitar suavemente el vial hasta disolver. Etiquetar y refrigerar a 2-8°C, protegido de la luz."
      },
      storage: {
        en: "Lyophilized: Refrigerate at 2-8°C; after reconstitution, refrigerate at 2-8°C; avoid freeze-thaw cycles. Let vial reach room temperature before opening to avoid condensation. Protect from light (wrap in aluminum or use opaque container).",
        es: "Liofilizado: Refrigerar a 2-8°C; tras reconstitución, refrigerar a 2-8°C; evitar ciclos de congelación-descongelación. Dejar el vial a temperatura ambiente antes de abrir para evitar condensación. Proteger de la luz (envolver en aluminio o usar recipiente opaco)."
      },
      materials: {
        en: "Peptide vials (Retatrutide, 30 mg each): 16 weeks ≈ 3 vials. Insulin syringes (U-100) or 1 mL syringes: Per week: 1 syringe. 16 weeks: 16 syringes. Bacteriostatic water (10 mL vials): Use ~3.0 mL per vial. 16 weeks: 9 mL → 1 vial. Alcohol wipes: One per vial + one per injection zone weekly. Per week: 2. 16 weeks: 32 → recommend 1 box of 100.",
        es: "Viales de péptido (Retatrutide, 30 mg cada uno): 16 semanas ≈ 3 viales. Jeringas de insulina (U-100) o jeringas de 1 mL: Por semana: 1 jeringa. 16 semanas: 16 jeringas. Agua bacteriostática (frascos de 10 mL): Usar ~3,0 mL por vial. 16 semanas: 9 mL → 1 frasco. Toallitas de alcohol: Una por vial + una por zona de inyección semanal. Por semana: 2. 16 semanas: 32 → recomendar 1 caja de 100."
      },
      injectionTechnique: {
        en: "Clean vial and zone with alcohol and let dry. Pinch 2-5 cm skin; insert needle at 45-90°. Do not aspirate; inject slowly. Remove needle at same angle; apply gentle pressure without rubbing. Rotate zones (abdomen, thighs, arms) separating at least 2-5 cm. Use new sterile syringes each injection; dispose in appropriate container. Record weekly dose, date and zone for consistency.",
        es: "Limpiar el vial y la zona con alcohol y dejar secar. Pellizcar 2-5 cm de piel; insertar la aguja a 45-90°. No aspirar; inyectar lentamente. Retirar la aguja en el mismo ángulo; aplicar presión suave sin frotar. Rotar zonas (abdomen, muslos, brazos) separando al menos 2-5 cm. Usar jeringas nuevas estériles en cada inyección; desechar en contenedor adecuado. Registrar dosis semanal, fecha y zona para mantener consistencia."
      },
      lifestyleFactors: {
        en: "Maintain consistent meal timing and composition. Regular moderate exercise (walking, light resistance). Monitor body composition changes weekly. Adequate protein intake. Stay hydrated. Regular sleep schedule.",
        es: "Mantener horario y composición de comidas consistente. Ejercicio moderado regular (caminar, resistencia ligera). Monitorear cambios en composición corporal semanalmente. Ingesta adecuada de proteínas. Mantenerse hidratado. Horario regular de sueño."
      },
      stackKeys: ["metabolic"]
    },
    "tb-500-20mg": {
      summary: {
        en: "TB-500 is a synthetic peptide fragment derived from Thymosin Beta-4, developed for tissue repair and recovery research. This daily injection protocol provides a structured approach for studying cellular migration, angiogenesis, and regenerative processes. The guide presents a gradual escalation method suitable for chronic recovery studies.",
        es: "TB-500 es un fragmento peptídico sintético correspondiente a la región activa de la timosina beta-4 (Tβ4), una proteína de 43 aminoácidos de origen natural implicada en la reparación y regeneración de tejidos. Este protocolo educativo presenta un enfoque subcutáneo una vez al día utilizando una dilución práctica para mediciones precisas con jeringa de insulina en entornos de investigación."
      },
      howItWorks: {
        en: "TB-500 is the active fragment of Thymosin Beta-4, promoting cellular migration, differentiation, and angiogenesis. It modulates actin cytoskeleton dynamics, enhancing cell motility and tissue repair processes. Research suggests it accelerates wound healing, reduces inflammation, and supports muscle recovery through improved blood vessel formation and cellular regeneration pathways.",
        es: "TB-500 es el fragmento activo de Timosina Beta-4, promoviendo migración celular, diferenciación y angiogénesis. Modula la dinámica del citoesqueleto de actina, mejorando la motilidad celular y procesos de reparación tisular. La investigación sugiere que acelera la cicatrización de heridas, reduce la inflamación y apoya la recuperación muscular a través de una mejor formación de vasos sanguíneos y vías de regeneración celular."
      },
      benefits: {
        en: "May support tissue repair research through enhanced cellular migration, angiogenesis, and recovery processes. Studied for wound healing, muscle recovery, and injury rehabilitation with generally good tolerability. Common effects include improved tissue healing, reduced recovery time, and enhanced cellular repair. Effects are dose-dependent; gradual escalation helps optimize response. No significant systemic side effects observed in research protocols.",
        es: "Puede apoyar la investigación de reparación tisular a través de migración celular mejorada, angiogénesis y procesos de recuperación. Estudiado para cicatrización de heridas, recuperación muscular y rehabilitación de lesiones con tolerabilidad generalmente buena. Los efectos comunes incluyen mejor cicatrización tisular, tiempo de recuperación reducido y reparación celular mejorada. Los efectos dependen de la dosis; la escalada gradual ayuda a optimizar la respuesta. No se han observado efectos secundarios sistémicos significativos en protocolos de investigación."
      },
      protocolOverview: {
        en: "Daily subcutaneous injections over 8-12 weeks with gradual dose escalation. Dosage range: 500-1000 mcg daily. Reconstitution: 3.0 mL per vial (~6.67 mg/mL). Storage: Lyophilized frozen; reconstituted refrigerated; use within 30 days.",
        es: "Inyecciones subcutáneas diarias durante 8-12 semanas con escalada gradual de dosis. Rango de dosis: 500-1000 mcg diarios. Reconstitución: 3,0 mL por vial (~6,67 mg/mL). Almacenamiento: Liofilizado congelado; reconstituido refrigerado; usar en 30 días."
      },
      dosing: {
        en: "Start: 500 mcg daily; increase every 2 weeks according to tolerance. Weeks 1-2: 500 mcg, Weeks 3-4: 750 mcg, Weeks 5-8: 1000 mcg. Frequency: Once daily (subcutaneous). Cycle duration: 8-12 weeks with optional maintenance. Schedule: Same time daily; rotate injection zones.",
        es: "Inicio: 500 mcg diarios; aumentar cada 2 semanas según tolerancia. Semanas 1-2: 500 mcg, Semanas 3-4: 750 mcg, Semanas 5-8: 1000 mcg. Frecuencia: Una vez al día (subcutáneo). Duración del ciclo: 8-12 semanas con mantenimiento opcional. Horario: La misma hora diaria; rotar zonas de inyección."
      },
      reconstitution: {
        en: "Add 3.0 mL bacteriostatic water (maximum vial capacity) → approximate concentration 6.67 mg/mL. Easy measurement: At 6.67 mg/mL, 1 mg = 0.15 mL. Steps: Extract 3.0 mL bacteriostatic water with sterile syringe. Inject slowly by vial wall; avoid foaming. Gently move or roll vial until dissolved (do not shake vigorously). Label and refrigerate at 2-8°C, protected from light.",
        es: "Añadir 3,0 mL de agua bacteriostática (capacidad máxima del vial) → concentración aproximada 6,67 mg/mL. Medición fácil: A 6,67 mg/mL, 1 mg = 0,15 mL. Pasos: Extraer 3,0 mL de agua bacteriostática con jeringa estéril. Inyectar lentamente por la pared del vial; evitar formar espuma. Mover suavemente o rodar el vial hasta disolver (no agitar con fuerza). Etiquetar y refrigerar a 2-8°C, protegido de la luz."
      },
      storage: {
        en: "Lyophilized: Freeze at -20°C; after reconstitution, refrigerate at 2-8°C; avoid freeze-thaw cycles. Let vial reach room temperature before opening to avoid condensation. Protect from light (wrap in aluminum or use opaque container).",
        es: "Liofilizado: Congelar a -20°C; tras reconstitución, refrigerar a 2-8°C; evitar ciclos de congelación-descongelación. Dejar el vial a temperatura ambiente antes de abrir para evitar condensación. Proteger de la luz (envolver en aluminio o usar recipiente opaco)."
      },
      materials: {
        en: "Peptide vials (TB-500, 20 mg each): 8 weeks ≈ 3 vials, 12 weeks ≈ 4 vials. Insulin syringes (U-100): Per day: 1 syringe. 8 weeks: 56 syringes, 12 weeks: 84 syringes. Bacteriostatic water (10 mL vials): Use ~3.0 mL per vial. 8 weeks: 9 mL → 1 vial, 12 weeks: 12 mL → 2 vials. Alcohol wipes: One per vial + one per injection zone daily. Per day: 2. 8 weeks: 112 → recommend 2 boxes of 100, 12 weeks: 168 → recommend 2 boxes of 100.",
        es: "Viales de péptido (TB-500, 20 mg cada uno): 8 semanas ≈ 3 viales, 12 semanas ≈ 4 viales. Jeringas de insulina (U-100): Por día: 1 jeringa. 8 semanas: 56 jeringas, 12 semanas: 84 jeringas. Agua bacteriostática (frascos de 10 mL): Usar ~3,0 mL por vial. 8 semanas: 9 mL → 1 frasco, 12 semanas: 12 mL → 2 frascos. Toallitas de alcohol: Una por vial + una por zona de inyección al día. Por día: 2. 8 semanas: 112 → recomendar 2 cajas de 100, 12 semanas: 168 → recomendar 2 cajas de 100."
      },
      injectionTechnique: {
        en: "Clean vial and zone with alcohol and let dry. Pinch 2-5 cm skin; insert needle at 45-90°. Do not aspirate; inject slowly. Remove needle at same angle; apply gentle pressure without rubbing. Rotate zones (abdomen, thighs, arms) separating at least 2-5 cm. Use new sterile syringes each injection; dispose in appropriate container. Rotate zones to avoid irritation or lipohypertrophy. Record daily dose, time and zone for consistency.",
        es: "Limpiar el vial y la zona con alcohol y dejar secar. Pellizcar 2-5 cm de piel; insertar la aguja a 45-90°. No aspirar; inyectar lentamente. Retirar la aguja en el mismo ángulo; aplicar presión suave sin frotar. Rotar zonas (abdomen, muslos, brazos) separando al menos 2-5 cm. Usar jeringas nuevas estériles en cada inyección; desechar en contenedor adecuado. Rotar zonas para evitar irritación o lipohipertrofia. Registrar dosis diaria, hora y zona para mantener consistencia."
      },
      lifestyleFactors: {
        en: "Support tissue repair with adequate protein intake (1.6-2.2g/kg body weight). Include collagen-supporting nutrients (vitamin C, zinc). Regular light exercise to promote circulation. Adequate sleep for recovery. Stay hydrated. Avoid anti-inflammatory medications that may interfere with natural repair processes.",
        es: "Apoyar la reparación tisular con ingesta adecuada de proteínas (1,6-2,2g/kg de peso corporal). Incluir nutrientes que apoyen el colágeno (vitamina C, zinc). Ejercicio ligero regular para promover la circulación. Sueño adecuado para la recuperación. Mantenerse hidratado. Evitar medicamentos antiinflamatorios que puedan interferir con procesos de reparación naturales."
      },
      stackKeys: ["regenerative"]
    },
    "bpc-157-10mg": {
      summary: {
        en: "BPC-157 is a synthetic peptide derived from Body Protection Compound, developed for tissue repair and gastrointestinal research. This daily injection protocol provides a structured approach for studying angiogenesis, tendon healing, and gastrointestinal barrier function. The guide presents a gradual escalation method suitable for chronic recovery studies.",
        es: "BPC-157 (Compuesto de Protección Corporal-157) es un péptido sintético de 15 aminoácidos derivado de una secuencia de proteína gástrica estudiada para la curación de tejidos y propiedades citoprotectoras. Los modelos preclínicos demuestran la reparación acelerada de heridas y la actividad antiinflamatoria, aunque los datos clínicos en humanos siguen limitados a los ensayos de seguridad de fase temprana y los informes de casos pequeños. Este protocolo educativo presenta un enfoque subcutáneo una vez al día utilizando una dilución práctica para mediciones claras de la insulina-jeringa."
      },
      howItWorks: {
        en: "BPC-157 is a 15-amino acid peptide fragment that promotes angiogenesis, fibroblast proliferation, and tissue regeneration. It modulates growth factors and inflammatory pathways, supporting tendon, ligament, and gastrointestinal healing. Research suggests it accelerates wound healing, reduces inflammation, and supports muscle recovery through improved blood vessel formation and cellular repair mechanisms.",
        es: "BPC-157 es un fragmento de péptido de 15 aminoácidos que promueve angiogénesis, proliferación de fibroblastos y regeneración tisular. Modula factores de crecimiento y vías inflamatorias, apoyando la cicatrización de tendones, ligamentos y gastrointestinal. La investigación sugiere que acelera la cicatrización de heridas, reduce la inflamación y apoya la recuperación muscular a través de una mejor formación de vasos sanguíneos y mecanismos de reparación celular."
      },
      benefits: {
        en: "May support tissue repair research through enhanced angiogenesis, fibroblast activity, and recovery processes. Studied for tendon healing, gastrointestinal protection, and injury rehabilitation with generally good tolerability. Common effects include improved tissue healing, reduced recovery time, and enhanced cellular repair. Effects are dose-dependent; gradual escalation helps optimize response. No significant systemic side effects observed in research protocols.",
        es: "Puede apoyar la investigación de reparación tisular a través de angiogénesis mejorada, actividad de fibroblastos y procesos de recuperación. Estudiado para cicatrización de tendones, protección gastrointestinal y rehabilitación de lesiones con tolerabilidad generalmente buena. Los efectos comunes incluyen mejor cicatrización tisular, tiempo de recuperación reducido y reparación celular mejorada. Los efectos dependen de la dosis; la escalada gradual ayuda a optimizar la respuesta. No se han observado efectos secundarios sistémicos significativos en protocolos de investigación."
      },
      protocolOverview: {
        en: "Daily subcutaneous injections over 8-12 weeks with gradual dose escalation. Dosage range: 200-600 mcg daily. Reconstitution: 3.0 mL per vial (~3.33 mg/mL). Storage: Lyophilized refrigerated; reconstituted refrigerated; use within 30 days.",
        es: "Inyecciones subcutáneas diarias durante 8-12 semanas con escalada gradual de dosis. Rango de dosis: 200-600 mcg diarios. Reconstitución: 3,0 mL por vial (~3,33 mg/mL). Almacenamiento: Liofilizado refrigerado; reconstituido refrigerado; usar en 30 días."
      },
      dosing: {
        en: "Start: 200 mcg daily; increase every 2 weeks according to tolerance. Weeks 1-2: 200 mcg, Weeks 3-4: 400 mcg, Weeks 5-8: 600 mcg. Frequency: Once daily (subcutaneous). Cycle duration: 8-12 weeks with optional maintenance. Schedule: Same time daily; rotate injection zones.",
        es: "Inicio: 200 mcg diarios; aumentar cada 2 semanas según tolerancia. Semanas 1-2: 200 mcg, Semanas 3-4: 400 mcg, Semanas 5-8: 600 mcg. Frecuencia: Una vez al día (subcutáneo). Duración del ciclo: 8-12 semanas con mantenimiento opcional. Horario: La misma hora diaria; rotar zonas de inyección."
      },
      reconstitution: {
        en: "Add 3.0 mL bacteriostatic water (maximum vial capacity) → approximate concentration 3.33 mg/mL. Easy measurement: At 3.33 mg/mL, 1 mg = 0.3 mL. Steps: Extract 3.0 mL bacteriostatic water with sterile syringe. Inject slowly by vial wall; avoid foaming. Gently swirl vial until dissolved. Label and refrigerate at 2-8°C, protected from light.",
        es: "Añadir 3,0 mL de agua bacteriostática (capacidad máxima del vial) → concentración aproximada 3,33 mg/mL. Medición fácil: A 3,33 mg/mL, 1 mg = 0,3 mL. Pasos: Extraer 3,0 mL de agua bacteriostática con jeringa estéril. Inyectar lentamente por la pared del vial; evitar formar espuma. Agitar suavemente el vial hasta disolver. Etiquetar y refrigerar a 2-8°C, protegido de la luz."
      },
      storage: {
        en: "Lyophilized: Refrigerate at 2-8°C; after reconstitution, refrigerate at 2-8°C; avoid freeze-thaw cycles. Let vial reach room temperature before opening to avoid condensation. Protect from light (wrap in aluminum or use opaque container).",
        es: "Liofilizado: Refrigerar a 2-8°C; tras reconstitución, refrigerar a 2-8°C; evitar ciclos de congelación-descongelación. Dejar el vial a temperatura ambiente antes de abrir para evitar condensación. Proteger de la luz (envolver en aluminio o usar recipiente opaco)."
      },
      materials: {
        en: "Peptide vials (BPC-157, 10 mg each): 8 weeks ≈ 2 vials, 12 weeks ≈ 3 vials. Insulin syringes (U-100): Per day: 1 syringe. 8 weeks: 56 syringes, 12 weeks: 84 syringes. Bacteriostatic water (10 mL vials): Use ~3.0 mL per vial. 8 weeks: 6 mL → 1 vial, 12 weeks: 9 mL → 1 vial. Alcohol wipes: One per vial + one per injection zone daily. Per day: 2. 8 weeks: 112 → recommend 2 boxes of 100, 12 weeks: 168 → recommend 2 boxes of 100.",
        es: "Viales de péptido (BPC-157, 10 mg cada uno): 8 semanas ≈ 2 viales, 12 semanas ≈ 3 viales. Jeringas de insulina (U-100): Por día: 1 jeringa. 8 semanas: 56 jeringas, 12 semanas: 84 jeringas. Agua bacteriostática (frascos de 10 mL): Usar ~3,0 mL por vial. 8 semanas: 6 mL → 1 frasco, 12 semanas: 9 mL → 1 frasco. Toallitas de alcohol: Una por vial + una por zona de inyección al día. Por día: 2. 8 semanas: 112 → recomendar 2 cajas de 100, 12 semanas: 168 → recomendar 2 cajas de 100."
      },
      injectionTechnique: {
        en: "Clean vial and zone with alcohol and let dry. Pinch 2-5 cm skin; insert needle at 45-90°. Do not aspirate; inject slowly. Remove needle at same angle; apply gentle pressure without rubbing. Rotate zones (abdomen, thighs, arms) separating at least 2-5 cm. Use new sterile syringes each injection; dispose in appropriate container. Rotate zones to avoid irritation or lipohypertrophy. Record daily dose, time and zone for consistency.",
        es: "Limpiar el vial y la zona con alcohol y dejar secar. Pellizcar 2-5 cm de piel; insertar la aguja a 45-90°. No aspirar; inyectar lentamente. Retirar la aguja en el mismo ángulo; aplicar presión suave sin frotar. Rotar zonas (abdomen, muslos, brazos) separando al menos 2-5 cm. Usar jeringas nuevas estériles en cada inyección; desechar en contenedor adecuado. Rotar zonas para evitar irritación o lipohipertrofia. Registrar dosis diaria, hora y zona para mantener consistencia."
      },
      lifestyleFactors: {
        en: "Support tissue repair with adequate protein intake (1.6-2.2g/kg body weight). Include collagen-supporting nutrients (vitamin C, zinc). Regular light exercise to promote circulation. Adequate sleep for recovery. Stay hydrated. Avoid anti-inflammatory medications that may interfere with natural repair processes.",
        es: "Apoyar la reparación tisular con ingesta adecuada de proteínas (1,6-2,2g/kg de peso corporal). Incluir nutrientes que apoyen el colágeno (vitamina C, zinc). Ejercicio ligero regular para promover la circulación. Sueño adecuado para la recuperación. Mantenerse hidratado. Evitar medicamentos antiinflamatorios que puedan interferir con procesos de reparación naturales."
      },
      stackKeys: ["regenerative", "inflammation"]
    },
    "ghk-cu-50mg": {
      summary: {
        en: "GHK-Cu (glycyl-L-histidyl-L-lysine:copper complex) is a naturally occurring copper peptide with documented functions in wound healing, tissue remodeling, and skin regeneration. Research demonstrates activity in gene regulation related to collagen synthesis, antioxidant defense, and anti-inflammatory pathways. This educational protocol presents practical subcutaneous administration approaches based on clinical practice patterns.",
        es: "GHK-Cu (complejo glicil-L-histidil-L-lisina:cobre) es un péptido de cobre presente de forma natural con funciones documentadas en la cicatrización de heridas, remodelación tisular y regeneración de la piel. La investigación demuestra actividad en la regulación génica relacionada con la síntesis de colágeno, la defensa antioxidante y las vías antiinflamatorias. Este protocolo educativo presenta enfoques prácticos de administración subcutánea basados en patrones de práctica clínica."
      },
      howItWorks: {
        en: "GHK-Cu is a natural tripeptide that forms complexes with copper ions to modulate multiple biological processes. It has been shown to participate in healing by increasing gene expression of collagen and decorin, activating tissue remodeling pathways, and regulating genes associated with antioxidant defense and anti-inflammatory response. Preclinical studies show activity at very low doses in animal models, while in clinical practice, doses in the milligram range are used for systemic effects. The peptide exhibits multifunctional activity in skin, nervous system, and vascular tissue, with regulatory effects beyond simple healing.",
        es: "GHK-Cu se posiciona alrededor de expresion genetica relacionada con colageno, defensa antioxidante, soporte de heridas y vias de remodelacion tisular ligadas a un complejo natural de cobre."
      },
      benefits: {
        en: "Supports healing and tissue repair through collagen synthesis and remodeling. Positive regulatory effects on genes related to antioxidant enzymes, growth factors, and anti-inflammatory signaling. Observed activity in nervous system function in preclinical models. Generally well tolerated; the most common side effects are mild reactions at the injection site. No official dosing guidelines in humans; not FDA approved.",
        es: "El texto de la guia enfatiza calidad de piel, senalizacion reparadora y casos de uso orientados a recuperacion, manteniendo la pagina anclada en investigacion de vias y no en exageracion cosmetica."
      },
      protocolOverview: {
        en: "The Primus guide frames GHK-Cu around 5-day-per-week or 3-times-per-week injection patterns, which helps it read differently from the daily neuro and metabolic entries.",
        es: "La guia de Primus presenta GHK-Cu alrededor de patrones de inyeccion de 5 dias por semana o 3 veces por semana, ayudando a diferenciarlo de las entradas neuro y metabolicas diarias."
      },
      dosing: {
        en: "The current guide places GHK-Cu in a practical 1.0 mg to 2.0 mg per-injection range, with a conservative starting phase before moving higher.",
        es: "La guia actual coloca GHK-Cu en un rango practico de 1,0 mg a 2,0 mg por inyeccion, con una fase conservadora antes de subir."
      },
      reconstitution: {
        en: "Guide handling uses 3.0 mL of sterile water for an approximate 16.67 mg/mL concentration, allowing low-volume injections and clean measuring math.",
        es: "La guia usa 3,0 mL de agua esteril para una concentracion aproximada de 16,67 mg/mL, permitiendo inyecciones de bajo volumen y mediciones limpias."
      },
      storage: {
        en: "Store the lyophilized vial frozen or away from thermal stress. After mixing, refrigerate and use within roughly 30 days.",
        es: "Guardar el vial liofilizado congelado o lejos de estres termico. Tras la mezcla, refrigerar y usar dentro de un plazo aproximado de 30 dias."
      },
      stackKeys: ["regenerative"]
    }
  });

  Object.assign(PRODUCT_GUIDES, {
    "mots-c-40mg": {
      summary: {
        en: "MOTS-c is a 16-amino acid mitochondrial-derived peptide (MDP) that acts as a metabolic regulator, primarily through AMPK activation. Preclinical studies show it improves insulin sensitivity, promotes fat oxidation, enhances exercise capacity, and counters age-related metabolic decline. To date, no human clinical trials have been completed. This educational protocol presents a once-daily subcutaneous administration approach with gradual titration.",
        es: "MOTS-c es un péptido derivado de la mitocondria (MDP) de 16 aminoácidos que actúa como regulador metabólico, principalmente a través de la activación de AMPK. Los estudios preclínicos muestran que mejora la sensibilidad a la insulina, promueve la oxidación de grasas, mejora la capacidad de ejercicio y contrarresta el deterioro metabólico relacionado con la edad. Hasta la fecha, no se han completado ensayos clínicos en humanos. Este protocolo educativo presenta un enfoque de administración subcutánea una vez al día con titulación gradual."
      },
      howItWorks: {
        en: "MOTS-c acts as a 'metabolic stress' signal that optimizes energy use during exercise or caloric restriction. It activates AMPK, making cells function more efficiently: increasing glucose use, fat burning, and mitochondrial function, while reducing fat storage. It may also act at the nuclear level, activating antioxidant and stress response genes. This helps protect cells from oxidative damage and could influence pathways related to longevity and inflammation. Its effects resemble those of exercise or metformin at the cellular level.",
        es: "MOTS-c es un peptido derivado de la mitocondria posicionado alrededor de activacion de AMPK, seleccion de combustible y comunicacion entre mitocondria y nucleo durante estres metabolico."
      },
      benefits: {
        en: "Based on preclinical studies, not humans: Improved insulin sensitivity, reduced body fat in animal models, enhanced physical performance, organ protection (liver, heart), possible effects on bone and immunity. Safety: no adverse effects in animals; unknown in humans. Important: these effects are not confirmed in humans.",
        es: "La guia destaca sensibilidad a la insulina, oxidacion de grasa, soporte de capacidad de ejercicio y resiliencia metabolica asociada a la edad, recordando que los datos clinicos en humanos siguen siendo limitados."
      },
      protocolOverview: {
        en: "This entry uses a once-daily subcutaneous structure over a roughly 10-week progression, which fits naturally into the site's premium energy category.",
        es: "Esta referencia usa una estructura subcutanea diaria a lo largo de una progresion aproximada de 10 semanas, encajando de forma natural en la categoria premium de energia del sitio."
      },
      dosing: {
        en: "The uploaded guide places MOTS-c in a 200 mcg to 1000 mcg daily range, typically spending about two weeks at each step before moving upward.",
        es: "La guia cargada situa MOTS-c en un rango diario de 200 mcg a 1000 mcg, permaneciendo normalmente unas dos semanas en cada nivel antes de subir."
      },
      reconstitution: {
        en: "Guide handling uses 3.0 mL of bacteriostatic water for an approximate 13.33 mg/mL concentration, keeping the draw volume very small on a U-100 syringe.",
        es: "La guia usa 3,0 mL de agua bacteriostatica para una concentracion aproximada de 13,33 mg/mL, manteniendo el volumen de carga muy pequeno en jeringa U-100."
      },
      storage: {
        en: "Store lyophilized material frozen or very cold. After reconstitution, refrigerate and aim to use the mixed vial within seven days.",
        es: "Guardar el material liofilizado congelado o muy frio. Tras la reconstitucion, refrigerar y procurar usar el vial mezclado dentro de siete dias."
      },
      stackKeys: ["energy", "metabolic"]
    },
    "melanotan-mt2-10mg": {
      summary: {
        en: "Updated as a pigmentation-oriented guide page that keeps the clinical look clean while acknowledging the different behaviour of this category.",
        es: "Melanotan II es un análogo sintético de la hormona estimulante de melanocitos alfa, estudiado por su capacidad para aumentar la pigmentación de la piel y conocido por inducir actividad eréctil como efecto secundario. Los primeros ensayos en humanos identificaron dosis efectivas en el rango de 1–2 mg diarios para bronceado, con protocolos conservadores que comienzan más bajos para minimizar efectos secundarios como náuseas y enrojecimiento. Este protocolo educativo presenta un enfoque de titulación subcutánea diaria con una dilución práctica para facilitar la medición con jeringa de insulina."
      },
      howItWorks: {
        en: "Melanotan II is framed as an alpha-MSH analogue studied for pigmentation signalling, with guide language also noting its known downstream arousal effects in some settings.",
        es: "Melanotan II se presenta como un analogo de alfa-MSH estudiado para senalizacion de pigmentacion, y la guia tambien recuerda sus efectos posteriores sobre activacion en algunos contextos."
      },
      benefits: {
        en: "Guide-style positioning centers on tanning and melanocortin-pathway work. The most common caution notes are nausea, flushing, and the need to begin conservatively.",
        es: "El posicionamiento de la guia se centra en trabajo sobre bronceado y vias melanocortinas. Las notas de cautela mas comunes son nauseas, enrojecimiento y la necesidad de empezar de forma conservadora."
      },
      protocolOverview: {
        en: "The current guide uses an initial daily titration phase followed by a lighter maintenance rhythm, which makes the product read clearly in both launch and long-tail catalogue contexts.",
        es: "La guia actual usa una fase inicial de titulacion diaria seguida de un ritmo de mantenimiento mas ligero, haciendo que el producto se lea con claridad tanto en lanzamiento como a largo plazo."
      },
      dosing: {
        en: "The uploaded guide positions Melanotan II in a 250 mcg to 1000 mcg daily range during the opening phase, then a 500 mcg to 1000 mcg maintenance rhythm once or twice weekly.",
        es: "La guia cargada posiciona Melanotan II en un rango diario de 250 mcg a 1000 mcg durante la fase inicial, seguido de un mantenimiento de 500 mcg a 1000 mcg una o dos veces por semana."
      },
      reconstitution: {
        en: "Guide handling uses 3.0 mL of bacteriostatic water for an approximate 3.33 mg/mL concentration, which keeps syringe math easy for small-step titration.",
        es: "La guia usa 3,0 mL de agua bacteriostatica para una concentracion aproximada de 3,33 mg/mL, dejando una titulacion por pequenos pasos facil de medir."
      },
      storage: {
        en: "Keep lyophilized material frozen or below room temperature. After reconstitution, refrigerate and use the mixed vial within roughly one to two weeks.",
        es: "Mantener el material liofilizado congelado o por debajo de temperatura ambiente. Tras la reconstitucion, refrigerar y usar el vial mezclado en una o dos semanas aproximadamente."
      },
      stackKeys: ["libido"]
    },
    "ss-31-50mg": {
      summary: {
        en: "Positioned as a flagship mitochondrial-protection page with stronger specialist language, higher-ticket trust, and a more clinical daily-use narrative.",
        es: "SS-31 (elamipretida) es un tetrapéptido dirigido a las mitocondrias que se une selectivamente a la cardiolipina en la membrana mitocondrial interna, estabilizando los complejos de la cadena de transporte de electrones y reduciendo la producción de especies reactivas de oxígeno, al mismo tiempo que mejora la síntesis de ATP. Este péptido ha demostrado efectos protectores en modelos preclínicos de insuficiencia cardíaca, enfermedades neurodegenerativas y atrofia muscular relacionada con la edad, y recibió aprobación acelerada de la FDA en 2025 como el primer tratamiento para el síndrome de Barth. Este protocolo educativo presenta un enfoque de administración subcutánea diaria utilizando viales de 50 mg con una reconstitución práctica para facilitar la medición con jeringa de insulina."
      },
      howItWorks: {
        en: "SS-31 is framed around cardiolipin binding inside the mitochondrial membrane, where it helps stabilize electron transport, reduce oxidative stress, and support ATP production.",
        es: "SS-31 se enmarca alrededor de la union a cardiolipina dentro de la membrana mitocondrial, donde ayuda a estabilizar el transporte de electrones, reducir estres oxidativo y apoyar la produccion de ATP."
      },
      benefits: {
        en: "The guide emphasizes mitochondrial resilience, energy maintenance, and recovery-oriented research across stress-heavy models. Advanced daily ranges are kept as higher-review territory.",
        es: "La guia enfatiza resiliencia mitocondrial, mantenimiento energetico e investigacion orientada a recuperacion en modelos exigentes. Los rangos diarios avanzados se mantienen como territorio de revision mas alta."
      },
      protocolOverview: {
        en: "This entry uses a daily subcutaneous structure with a short loading phase and a longer mid-cycle phase, which fits well inside a premium energy-support sequence.",
        es: "Esta referencia usa una estructura subcutanea diaria con una fase corta de inicio y una fase media mas larga, encajando bien en una secuencia premium de soporte energetico."
      },
      dosing: {
        en: "The uploaded guide positions SS-31 in a 5 mg to 10 mg daily range, while noting that more advanced protocols may extend beyond that only with tighter review.",
        es: "La guia cargada posiciona SS-31 en un rango diario de 5 mg a 10 mg, indicando que los protocolos mas avanzados solo deberian ir mas arriba con una revision mas estricta."
      },
      reconstitution: {
        en: "Guide handling uses 3.0 mL of bacteriostatic water for an approximate 16.67 mg/mL concentration, keeping larger daily draws workable without excessive volume.",
        es: "La guia usa 3,0 mL de agua bacteriostatica para una concentracion aproximada de 16,67 mg/mL, manteniendo manejables las cargas diarias mas altas sin volumen excesivo."
      },
      storage: {
        en: "Store the lyophilized vial frozen or very cold. Once reconstituted, keep refrigerated and work within a practical four-week handling window.",
        es: "Guardar el vial liofilizado congelado o muy frio. Una vez reconstituido, mantener refrigerado y trabajar dentro de una ventana practica de cuatro semanas."
      },
      stackKeys: ["energy"]
    },
    "nad-1000mg": {
      summary: {
        en: "Refined as a coenzyme and mitochondrial-support page with stronger dosage clarity, cleaner energy language, and better daily-tolerance framing.",
        es: "NAD+ (nicotinamida adenina dinucleótido) es una coenzima clave implicada en el metabolismo energético celular, la reparación del ADN y la función mitocondrial. La investigación clínica ha utilizado principalmente infusiones intravenosas a dosis altas, aunque la administración subcutánea a dosis más bajas está emergiendo como una alternativa práctica de mantenimiento. Este protocolo educativo presenta un enfoque subcutáneo diario con titulación gradual para mejorar la tolerancia."
      },
      howItWorks: {
        en: "NAD+ is positioned around cellular energy transfer, DNA-repair support, and mitochondrial function, which is why the guide treats it as a foundational energy compound.",
        es: "NAD+ se posiciona alrededor de transferencia de energia celular, soporte de reparacion de ADN y funcion mitocondrial, por eso la guia lo trata como un compuesto base de energia."
      },
      benefits: {
        en: "Guide material emphasizes energy support, cellular maintenance, and recovery-facing use cases. The main caution note is starting too high, which can affect sleep, anxiety, or fatigue tolerance.",
        es: "El material de guia enfatiza soporte energetico, mantenimiento celular y casos de uso orientados a recuperacion. La principal cautela es empezar demasiado alto, lo que puede afectar sueno, ansiedad o tolerancia a la fatiga."
      },
      protocolOverview: {
        en: "The guide uses a daily subcutaneous titration structure that starts lower, reviews response, and then moves into a steadier maintenance phase.",
        es: "La guia usa una estructura diaria de titulacion subcutanea que empieza mas baja, revisa respuesta y despues entra en una fase de mantenimiento mas estable."
      },
      dosing: {
        en: "The uploaded guide places NAD+ in a 50 mg to 100 mg daily range, beginning at the lower end before holding a steadier 100 mg phase.",
        es: "La guia cargada situa NAD+ en un rango diario de 50 mg a 100 mg, empezando por el extremo bajo antes de sostener una fase mas estable de 100 mg."
      },
      reconstitution: {
        en: "Guide handling uses 3.0 mL of bacteriostatic water for an approximate 333.3 mg/mL concentration, creating a practical daily draw for maintenance research.",
        es: "La guia usa 3,0 mL de agua bacteriostatica para una concentracion aproximada de 333,3 mg/mL, creando una carga diaria practica para investigacion de mantenimiento."
      },
      storage: {
        en: "Store lyophilized material frozen or very cold. After reconstitution, refrigerate, protect from light, and aim to use the mixed vial within roughly 14 days.",
        es: "Guardar el material liofilizado congelado o muy frio. Tras la reconstitucion, refrigerar, proteger de la luz y procurar usar el vial mezclado dentro de unos 14 dias."
      },
      stackKeys: ["energy", "metabolic"]
    }
  });

  Object.assign(PRODUCT_GUIDES, {
    "semax-30mg": {
      summary: {
        en: "Semax is a heptapeptide synthetic analog of ACTH(4–10) developed in Russia and studied mainly for its cognitive enhancement and neuroprotective effects. Although intranasal administration is the most common in clinical literature, subcutaneous injection offers a convenient once-daily alternative for research purposes. This educational protocol presents a practical subcutaneous approach using simple reconstitution for precise measurements with insulin syringe.",
        es: "Semax es un heptapéptido sintético análogo de ACTH(4–10) desarrollado en Rusia y estudiado principalmente por sus efectos en la mejora cognitiva y la neuroprotección. Aunque la administración intranasal es la más común en la literatura clínica, la inyección subcutánea ofrece una alternativa conveniente de una vez al día para fines de investigación. Este protocolo educativo presenta un enfoque práctico subcutáneo utilizando una reconstitución sencilla para mediciones precisas con jeringa de insulina."
      },
      howItWorks: {
        en: "Semax is a synthetic analog of the fragment ACTH(4-10) with a tripeptide extension Pro-Gly-Pro that enhances its metabolic stability. Literature suggests it modulates BDNF expression, improves cholinergic and dopaminergic neurotransmission, and presents neuroprotective properties. In human studies in Russia, it has been used for cognitive support in conditions like mild cognitive impairment and recovery after stroke, usually via intranasal route. The subcutaneous route offers a more sustained systemic absorption.",
        es: "Semax es un análogo sintético del fragmento ACTH(4-10) con una extensión tripeptídica Pro-Gly-Pro que mejora su estabilidad metabólica. La literatura sugiere que modula la expresión de BDNF, mejora la neurotransmisión colinérgica y dopaminérgica, y presenta propiedades neuroprotectoras. En estudios en humanos en Rusia, se ha utilizado para apoyo cognitivo en condiciones como deterioro cognitivo leve y recuperación tras ictus, normalmente por vía intranasal. La vía subcutánea ofrece una absorción sistémica más sostenida."
      },
      benefits: {
        en: "May improve attention, memory, and learning in populations with cognitive deficits. Studied in stroke, traumatic brain injury, and optic neuropathy with good safety profile in one-month studies. Generally well tolerated; intranasal route may cause mild irritation; subcutaneous may cause local redness or itching. Effects depend on dose; titration helps find minimum effective dose. No significant cortisol increases or relevant endocrine adverse effects observed.",
        es: "Puede mejorar atención, memoria y aprendizaje en poblaciones con déficit cognitivo. Estudiado en ictus, lesión cerebral traumática y neuropatía óptica con buen perfil de seguridad en estudios de un mes. Generalmente bien tolerado; la vía intranasal puede causar irritación leve; la subcutánea puede causar enrojecimiento o picor local. Los efectos dependen de la dosis; la titulación ayuda a encontrar la dosis mínima efectiva. No se han observado aumentos significativos de cortisol ni efectos endocrinos adversos relevantes."
      },
      protocolOverview: {
        en: "Injections subcutaneous daily during 8 weeks (optional extend to 12-16 weeks with rests). Dosage range: 300-800 mcg daily. Reconstitution: 3.0 mL per vial (~3.33 mg/mL). Storage: Lyophilized frozen; reconstituted refrigerated; use within 30 days.",
        es: "Inyecciones subcutáneas diarias durante 8 semanas (opcional extender a 12-16 semanas con descansos). Rango de dosis: 300-800 mcg diarios. Reconstitución: 3,0 mL por vial (~3,33 mg/mL). Almacenamiento: Liofilizado congelado; reconstituido refrigerado; usar en 30 días."
      },
      dosing: {
        en: "Start: 300 mcg daily; increase ~100-200 mcg every 1-2 weeks according to tolerance. Goal: 600-800 mcg daily in weeks 5-8; adjust according to individual response. Frequency: Once daily (subcutaneous). Cycle duration: 8 weeks continuous; optional extend to 12-16 weeks with rests (example: 6 weeks on, 2 off). Schedule: Any constant time; rotate injection zones.",
        es: "Inicio: 300 mcg diarios; aumentar ~100-200 mcg cada 1-2 semanas según tolerancia. Objetivo: 600-800 mcg diarios en semanas 5-8; ajustar según respuesta individual. Frecuencia: Una vez al día (subcutáneo). Duración del ciclo: 8 semanas continuas; opcional extender a 12-16 semanas con descansos (ejemplo: 6 semanas on, 2 off). Horario: Cualquier hora constante; rotar zonas de inyección."
      },
      reconstitution: {
        en: "Add 3.0 mL bacteriostatic water (maximum vial capacity) → approximate concentration 3.33 mg/mL. Easy measurement: At 3.33 mg/mL, 1 unit = 0.01 mL ≈ 33.3 mcg on insulin syringe U-100. Steps: Extract 3.0 mL bacteriostatic water with sterile syringe. Inject slowly by vial wall; avoid foaming. Gently move or roll vial until dissolved (do not shake vigorously). Label and refrigerate at 2-8°C, protected from light.",
        es: "Añadir 3,0 mL de agua bacteriostática (capacidad máxima del vial) → concentración aproximada de 3,33 mg/mL. Medición fácil: A 3,33 mg/mL, 1 unidad = 0,01 mL ≈ 33,3 mcg en jeringa de insulina U-100. Pasos: Extraer 3,0 mL de agua bacteriostática con jeringa estéril. Inyectar lentamente por la pared del vial; evitar formar espuma. Mover suavemente o rodar el vial hasta disolver (no agitar con fuerza). Etiquetar y refrigerar a 2-8°C, protegido de la luz."
      },
      storage: {
        en: "Lyophilized: Freeze at -20°C; after reconstitution, refrigerate at 2-8°C; avoid freeze-thaw cycles. Let vial reach room temperature before opening to avoid condensation. Protect from light (wrap in aluminum or use opaque container).",
        es: "Liofilizado: Congelar a -20°C; tras reconstitución, refrigerar a 2-8°C; evitar ciclos de congelación-descongelación. Dejar el vial a temperatura ambiente antes de abrir para evitar condensación. Proteger de la luz (envolver en aluminio o usar recipiente opaco)."
      },
      materials: {
        en: "Peptide vials (Semax, 10 mg each): 8 weeks ≈ 4 vials, 12 weeks ≈ 6 vials, 16 weeks ≈ 8 vials. Insulin syringes (U-100): Per week: 7 syringes. 8 weeks: 56 syringes, 12 weeks: 84 syringes, 16 weeks: 112 syringes. Bacteriostatic water (10 mL vials): Use ~3.0 mL per vial. 8 weeks: 12 mL → 2 vials, 12 weeks: 18 mL → 2 vials, 16 weeks: 24 mL → 3 vials. Alcohol wipes: One per vial + one per injection zone daily. Per week: 14. 8 weeks: 112 → recommend 2 boxes of 100, 12 weeks: 168 → recommend 2 boxes of 100, 16 weeks: 224 → recommend 3 boxes of 100.",
        es: "Viales de péptido (Semax, 10 mg cada uno): 8 semanas ≈ 4 viales, 12 semanas ≈ 6 viales, 16 semanas ≈ 8 viales. Jeringas de insulina (U-100): Por semana: 7 jeringas. 8 semanas: 56 jeringas, 12 semanas: 84 jeringas, 16 semanas: 112 jeringas. Agua bacteriostática (frascos de 10 mL): Usar ~3,0 mL por vial. 8 semanas: 12 mL → 2 frascos, 12 semanas: 18 mL → 2 frascos, 16 semanas: 24 mL → 3 frascos. Toallitas de alcohol: Una por vial + una por zona de inyección al día. Por semana: 14. 8 semanas: 112 → recomendar 2 cajas de 100, 12 semanas: 168 → recomendar 2 cajas de 100, 16 semanas: 224 → recomendar 3 cajas de 100."
      },
      injectionTechnique: {
        en: "Clean vial and zone with alcohol and let dry. Pinch 2-5 cm skin; insert needle at 45-90°. Do not aspirate; inject slowly. Remove needle at same angle; apply gentle pressure without rubbing. Rotate zones (abdomen, thighs, arms) separating at least 2-5 cm. Use new sterile syringes each injection; dispose in appropriate container. Rotate zones to avoid irritation or lipohypertrophy. Record daily dose, time and zone for consistency. Most data in humans is 4-8 weeks; longer protocols should include rests.",
        es: "Limpiar el vial y la zona con alcohol y dejar secar. Pellizcar 2-5 cm de piel; insertar la aguja a 45-90°. No aspirar; inyectar lentamente. Retirar la aguja en el mismo ángulo; aplicar presión suave sin frotar. Rotar zonas (abdomen, muslos, brazos) separando al menos 2-5 cm. Usar jeringas nuevas estériles en cada inyección; desechar en contenedor adecuado. Rotar zonas para evitar irritación o lipohipertrofia. Registrar dosis diaria, hora y zona para mantener consistencia. La mayoría de datos en humanos son de 4-8 semanas; protocolos más largos deben incluir descansos."
      },
      lifestyleFactors: {
        en: "Sleep 7-9 hours quality. Regular aerobic exercise and cognitive training. Balanced diet rich in omega-3, antioxidants and micronutrients. Stress management (meditation, mindfulness, etc.). Maintain mental and social activity.",
        es: "Dormir 7-9 horas de calidad. Ejercicio aeróbico regular y entrenamiento cognitivo. Dieta equilibrada rica en omega-3, antioxidantes y micronutrientes. Gestión del estrés (meditación, mindfulness, etc.). Mantener actividad mental y social."
      },
      stackKeys: ["nervousSystem"]
    },
    "selank-10mg": {
      summary: {
        en: "Refined from the new guide as a calm-performance neuropeptide page that balances anti-anxiety positioning with a cleaner premium storefront tone.",
        es: "Selank es un heptapéptido sintético análogo de tuftsin con propiedades ansiolíticas y antiasténicas (aumento de energía) demostradas en ensayos clínicos en humanos. En estudios rusos, el Selank intranasal produjo efectos ansiolíticos comparables a las benzodiacepinas sin sedación ni riesgo de dependencia. Este protocolo educativo presenta un enfoque subcutáneo de una vez al día utilizando una dilución práctica para mediciones precisas con jeringa de insulina."
      },
      howItWorks: {
        en: "Selank is framed as a tuftsin analogue studied for anxiolytic and anti-asthenic effects, with guide positioning centered on calm focus rather than sedative suppression.",
        es: "Selank se enmarca como un analogo de tuftsin estudiado por efectos ansioliticos y antiastenicos, con una posicion centrada en foco tranquilo y no en sedacion."
      },
      benefits: {
        en: "Guide material highlights reduced anxiety, steadier mental energy, and the absence of typical benzodiazepine-style sedation in older study language. The page should still keep outcomes tied to research context.",
        es: "El material de guia destaca reduccion de ansiedad, energia mental mas estable y ausencia de sedacion tipo benzodiacepina en el lenguaje de estudios antiguos. Aun asi, la pagina debe mantener los resultados dentro del contexto de investigacion."
      },
      protocolOverview: {
        en: "The uploaded guide uses a once-daily subcutaneous structure, with optional cycling patterns such as four weeks on and four weeks off or five days on and two off.",
        es: "La guia cargada usa una estructura subcutanea diaria, con patrones opcionales de ciclos como cuatro semanas on y cuatro off o cinco dias on y dos off."
      },
      dosing: {
        en: "The guide places Selank in a 300 mcg to 500 mcg daily range, using a small-volume step-up rather than a wide multi-phase escalation.",
        es: "La guia coloca Selank en un rango diario de 300 mcg a 500 mcg, usando una subida de pequeno volumen en lugar de una escalada mas amplia."
      },
      reconstitution: {
        en: "Guide handling uses 3.0 mL of bacteriostatic water for an approximate 3.33 mg/mL concentration, making short daily measurements easy to track.",
        es: "La guia usa 3,0 mL de agua bacteriostatica para una concentracion aproximada de 3,33 mg/mL, dejando mediciones diarias cortas y faciles de seguir."
      },
      storage: {
        en: "Store the lyophilized vial frozen or very cold. After reconstitution, keep refrigerated at 2 to 8 C and protect the mixed vial from unnecessary temperature swings.",
        es: "Guardar el vial liofilizado congelado o muy frio. Tras la reconstitucion, mantener refrigerado entre 2 y 8 C y proteger el vial mezclado de cambios innecesarios de temperatura."
      },
      stackKeys: ["nervousSystem"]
    },
    "dsip-10mg": {
      summary: {
        en: "Presented from the new guide as a sleep-recovery reference that completes the day-to-night nervous-system series with a stronger research-first tone.",
        es: "Los protocolos de dosificación de DSIP pueden ayudar a promover un sueño profundo y reparador (ondas delta) y apoyar una respuesta saludable al estrés. El péptido inductor del sueño delta (DSIP) es un nonapéptido natural (9 aminoácidos) aislado inicialmente del cerebro de conejo por su capacidad para mejorar el sueño de ondas lentas. La investigación indica que DSIP puede mejorar la calidad del sueño, normalizar la arquitectura del sueño, reducir patrones de cortisol relacionados con el estrés y favorecer la estabilidad del estado de ánimo sin somnolencia al día siguiente. Este protocolo educativo presenta un enfoque subcutáneo nocturno de una vez al día utilizando una dilución práctica para mediciones claras con jeringa de insulina."
      },
      howItWorks: {
        en: "DSIP is framed as a delta-sleep-inducing nonapeptide studied for slow-wave sleep support, stress-pattern regulation, and more stable overnight recovery.",
        es: "DSIP se enmarca como un nonapeptido inductor del sueno delta estudiado para soporte del sueno profundo, regulacion de patrones de estres y recuperacion nocturna mas estable."
      },
      benefits: {
        en: "The guide emphasizes sleep quality, sleep-architecture support, cortisol-pattern review, and mood stability. The page should keep those points tied to study language rather than broad promises.",
        es: "La guia enfatiza calidad del sueno, soporte de arquitectura del sueno, revision de patrones de cortisol y estabilidad del estado de animo. La pagina debe mantener estos puntos ligados al lenguaje de estudio."
      },
      protocolOverview: {
        en: "This guide uses a nightly subcutaneous structure taken roughly 30 to 60 minutes before sleep, with a gradual build through the first weeks and a steadier block after that.",
        es: "Esta guia utiliza una estructura subcutanea nocturna tomada unos 30 a 60 minutos antes de dormir, con una subida gradual en las primeras semanas y un bloque mas estable despues."
      },
      dosing: {
        en: "The uploaded guide places DSIP in a 100 mcg to 300 mcg nightly range, with higher steps held only after early tolerance is established.",
        es: "La guia cargada situa DSIP en un rango nocturno de 100 mcg a 300 mcg, manteniendo los escalones mas altos solo despues de establecer tolerancia inicial."
      },
      reconstitution: {
        en: "Guide handling uses 3.0 mL of bacteriostatic water for an approximate 3.33 mg/mL concentration, giving very small nightly draw volumes on a U-100 syringe.",
        es: "La guia usa 3,0 mL de agua bacteriostatica para una concentracion aproximada de 3,33 mg/mL, dejando volumenes nocturnos muy pequenos en jeringa U-100."
      },
      storage: {
        en: "Store the lyophilized vial frozen or very cold. After reconstitution, refrigerate at 2 to 8 C and avoid repeated freeze-thaw exposure.",
        es: "Guardar el vial liofilizado congelado o muy frio. Tras la reconstitucion, refrigerar entre 2 y 8 C y evitar exposicion repetida a ciclos de congelacion y descongelacion."
      },
      stackKeys: ["nervousSystem", "longevity"]
    },
    "epithalon-40mg": {
      summary: {
        en: "Structured as a pineal and longevity-oriented page that feels more specialist, more orderly, and better aligned with premium research positioning.",
        es: "Epitalon (Epithalon) es un tetrapéptido sintético (Ala-Glu-Asp-Gly) desarrollado a partir de investigaciones sobre la glándula pineal por su potencial geroprotector. Epitalon activa la telomerasa para favorecer el alargamiento de los telómeros, apoya la producción saludable de melatonina para mejorar el sueño y la regulación del ritmo circadiano, y ha demostrado aumentar la longevidad en modelos animales. Estudios en humanos sugieren beneficios potenciales para la longevidad, la salud cardiovascular y la función fisiológica en adultos mayores. Este protocolo educativo presenta un enfoque subcutáneo de una vez al día con una dilución práctica para mediciones claras con jeringa de insulina."
      },
      howItWorks: {
        en: "Epithalon is framed around telomerase-related research, melatonin support, circadian regulation, and broader healthy-ageing models linked to pineal signalling.",
        es: "Epithalon se enmarca alrededor de investigacion relacionada con telomerasa, soporte de melatonina, regulacion circadiana y modelos mas amplios de envejecimiento saludable ligados a la pineal."
      },
      benefits: {
        en: "Guide language highlights sleep-rhythm support, cardiovascular and longevity interest, and systemic recovery positioning. The page keeps this framed as guide-level scientific context.",
        es: "El lenguaje de la guia destaca soporte del ritmo de sueno, interes cardiovascular y de longevidad, y posicionamiento de recuperacion sistemica. La pagina lo mantiene como contexto cientifico de guia."
      },
      protocolOverview: {
        en: "The uploaded guide uses a very specific cycle structure rather than open-ended daily use: a short active block followed by a long rest window before another cycle.",
        es: "La guia cargada usa una estructura de ciclo muy concreta en lugar de un uso diario indefinido: un bloque activo corto seguido de una ventana larga de descanso antes del siguiente ciclo."
      },
      dosing: {
        en: "The guide positions Epithalon at 5 mg once daily for 20 consecutive days, then a four-to-six-month break before repeating.",
        es: "La guia posiciona Epithalon en 5 mg una vez al dia durante 20 dias consecutivos y despues un descanso de cuatro a seis meses antes de repetir."
      },
      reconstitution: {
        en: "Guide handling uses 2.0 mL of bacteriostatic water for an approximate 5 mg/mL concentration, which makes the daily draw simple during the short active phase.",
        es: "La guia usa 2,0 mL de agua bacteriostatica para una concentracion aproximada de 5 mg/mL, lo que hace simple la carga diaria durante la fase activa corta."
      },
      storage: {
        en: "Store lyophilized material frozen or very cold. After reconstitution, refrigerate at 2 to 8 C and avoid repeated freeze-thaw handling.",
        es: "Guardar el material liofilizado congelado o muy frio. Tras la reconstitucion, refrigerar entre 2 y 8 C y evitar manejo repetido con congelacion y descongelacion."
      },
      stackKeys: ["longevity"]
    }
  });

  Object.assign(PRODUCT_GUIDES, {
    "tirzepatide-30mg": {
      summary: {
        en: "Tirzepatide is a dual GLP-1/GIP receptor agonist developed for metabolic research, combining the benefits of GLP-1 and GIP pathways in a single molecule. This weekly injection protocol provides a convenient research approach for studying appetite regulation, body composition, and metabolic markers. The guide presents a structured escalation method for optimal tolerance and response assessment.",
        es: "Tirzepatide es un agonista del receptor de incretina dual de 39 aminoácidos que activa los receptores GLP-1 y GIP, mejorando la secreción de insulina dependiente de la glucosa, suprimiendo el glucagón, ralentizando el vaciamiento gástrico y reduciendo el apetito. Su ~5-día de semi-vida permite la dosificación subcutánea conveniente una vez por semana."
      },
      howItWorks: {
        en: "Tirzepatide activates both GLP-1 and GIP receptors, leading to enhanced insulin secretion, reduced glucagon release, and slowed gastric emptying. This dual mechanism provides superior metabolic effects compared to single-pathway agonists. The molecule's long half-life allows for once-weekly dosing, making it suitable for chronic metabolic studies. Research suggests it modulates appetite centers in the brain while improving peripheral glucose utilization.",
        es: "Tirzepatide activa tanto receptores GLP-1 como GIP, lo que lleva a una mayor secreción de insulina, reducción de la liberación de glucagón y enlentecimiento del vaciamiento gástrico. Este mecanismo dual proporciona efectos metabólicos superiores en comparación con agonistas de vía única. La larga vida media de la molécula permite una dosificación semanal, haciéndola adecuada para estudios metabólicos crónicos. La investigación sugiere que modula centros de apetito en el cerebro mientras mejora la utilización periférica de glucosa."
      },
      benefits: {
        en: "May support metabolic research through appetite regulation, body composition changes, and improved glycemic control. Studied for weight management and metabolic health with generally good tolerability. Common effects include reduced appetite, mild gastrointestinal discomfort, and gradual metabolic improvements. Effects are dose-dependent; titration helps optimize response. No significant endocrine disruption observed in research protocols.",
        es: "Puede apoyar la investigación metabólica a través de la regulación del apetito, cambios en la composición corporal y control glucémico mejorado. Estudiado para el manejo del peso y la salud metabólica con tolerabilidad generalmente buena. Los efectos comunes incluyen reducción del apetito, malestar gastrointestinal leve y mejoras metabólicas graduales. Los efectos dependen de la dosis; la titulación ayuda a optimizar la respuesta. No se ha observado disrupción endocrina significativa en protocolos de investigación."
      },
      protocolOverview: {
        en: "Weekly subcutaneous injections over 12-16 weeks with gradual dose escalation. Dosage range: 2.5-15 mg weekly. Reconstitution: 2.0 mL per vial (~15 mg/mL). Storage: Lyophilized refrigerated; reconstituted refrigerated; use within 28 days.",
        es: "Inyecciones subcutáneas semanales durante 12-16 semanas con escalada gradual de dosis. Rango de dosis: 2,5-15 mg semanales. Reconstitución: 2,0 mL por vial (~15 mg/mL). Almacenamiento: Liofilizado refrigerado; reconstituido refrigerado; usar en 28 días."
      },
      dosing: {
        en: "Start: 2.5 mg weekly; increase every 4 weeks according to tolerance and response. Weeks 1-4: 2.5 mg, Weeks 5-8: 5 mg, Weeks 9-12: 10 mg, Weeks 13-16: 15 mg. Frequency: Once weekly (subcutaneous). Cycle duration: 12-16 weeks with assessment breaks. Schedule: Same day each week; rotate injection zones.",
        es: "Inicio: 2,5 mg semanales; aumentar cada 4 semanas según tolerancia y respuesta. Semanas 1-4: 2,5 mg, Semanas 5-8: 5 mg, Semanas 9-12: 10 mg, Semanas 13-16: 15 mg. Frecuencia: Una vez por semana (subcutáneo). Duración del ciclo: 12-16 semanas con pausas de evaluación. Horario: El mismo día cada semana; rotar zonas de inyección."
      },
      reconstitution: {
        en: "Add 2.0 mL bacteriostatic water (maximum vial capacity) → concentration 15 mg/mL. Easy measurement: At 15 mg/mL, 1 mg = 0.067 mL. Steps: Extract 2.0 mL bacteriostatic water with sterile syringe. Inject slowly by vial wall; avoid foaming. Gently swirl vial until dissolved. Label and refrigerate at 2-8°C, protected from light.",
        es: "Añadir 2,0 mL de agua bacteriostática (capacidad máxima del vial) → concentración 15 mg/mL. Medición fácil: A 15 mg/mL, 1 mg = 0,067 mL. Pasos: Extraer 2,0 mL de agua bacteriostática con jeringa estéril. Inyectar lentamente por la pared del vial; evitar formar espuma. Agitar suavemente el vial hasta disolver. Etiquetar y refrigerar a 2-8°C, protegido de la luz."
      },
      storage: {
        en: "Lyophilized: Refrigerate at 2-8°C; after reconstitution, refrigerate at 2-8°C; avoid freeze-thaw cycles. Let vial reach room temperature before opening to avoid condensation. Protect from light (wrap in aluminum or use opaque container).",
        es: "Liofilizado: Refrigerar a 2-8°C; tras reconstitución, refrigerar a 2-8°C; evitar ciclos de congelación-descongelación. Dejar el vial a temperatura ambiente antes de abrir para evitar condensación. Proteger de la luz (envolver en aluminio o usar recipiente opaco)."
      },
      materials: {
        en: "Peptide vials (Tirzepatide, 30 mg each): 16 weeks ≈ 2 vials. Insulin syringes (U-100) or 1 mL syringes: Per week: 1 syringe. 16 weeks: 16 syringes. Bacteriostatic water (10 mL vials): Use ~2.0 mL per vial. 16 weeks: 4 mL → 1 vial. Alcohol wipes: One per vial + one per injection zone weekly. Per week: 2. 16 weeks: 32 → recommend 1 box of 100.",
        es: "Viales de péptido (Tirzepatide, 30 mg cada uno): 16 semanas ≈ 2 viales. Jeringas de insulina (U-100) o jeringas de 1 mL: Por semana: 1 jeringa. 16 semanas: 16 jeringas. Agua bacteriostática (frascos de 10 mL): Usar ~2,0 mL por vial. 16 semanas: 4 mL → 1 frasco. Toallitas de alcohol: Una por vial + una por zona de inyección semanal. Por semana: 2. 16 semanas: 32 → recomendar 1 caja de 100."
      },
      injectionTechnique: {
        en: "Clean vial and zone with alcohol and let dry. Pinch 2-5 cm skin; insert needle at 45-90°. Do not aspirate; inject slowly. Remove needle at same angle; apply gentle pressure without rubbing. Rotate zones (abdomen, thighs, arms) separating at least 2-5 cm. Use new sterile syringes each injection; dispose in appropriate container. Record weekly dose, date and zone for consistency.",
        es: "Limpiar el vial y la zona con alcohol y dejar secar. Pellizcar 2-5 cm de piel; insertar la aguja a 45-90°. No aspirar; inyectar lentamente. Retirar la aguja en el mismo ángulo; aplicar presión suave sin frotar. Rotar zonas (abdomen, muslos, brazos) separando al menos 2-5 cm. Usar jeringas nuevas estériles en cada inyección; desechar en contenedor adecuado. Registrar dosis semanal, fecha y zona para mantener consistencia."
      },
      lifestyleFactors: {
        en: "Maintain consistent meal timing and composition. Regular moderate exercise (walking, light resistance). Monitor body composition changes weekly. Adequate protein intake. Stay hydrated. Regular sleep schedule.",
        es: "Mantener horario y composición de comidas consistente. Ejercicio moderado regular (caminar, resistencia ligera). Monitorear cambios en composición corporal semanalmente. Ingesta adecuada de proteínas. Mantenerse hidratado. Horario regular de sueño."
      },
      stackKeys: ["metabolic"]
    },
    "ipamorelin-10mg": {
      summary: {
        en: "Refined as a cleaner GH-secretagogue page with stronger sleep-timing context and lower-friction copy for buyers comparing nightly-use products.",
        es: "Ipamorelin es un pentapéptido sintético que actúa como secretagogo selectivo de la hormona del crecimiento al imitar la grelina en su receptor. Su principal ventaja es su alta especificidad para estimular la liberación de GH sin provocar aumentos de ACTH o cortisol, lo que lo convierte en uno de los secretagogos más seguros con mínimos efectos hormonales no deseados. Este protocolo educativo presenta un enfoque subcutáneo de una vez al día utilizando una dilución práctica para mediciones precisas con jeringa de insulina."
      },
      howItWorks: {
        en: "Ipamorelin is positioned as a selective ghrelin-receptor agonist used to stimulate growth-hormone release while keeping ACTH and cortisol spillover lower than broader secretagogues.",
        es: "Ipamorelin se posiciona como un agonista selectivo del receptor de grelina utilizado para estimular la liberacion de hormona de crecimiento manteniendo mas bajo el arrastre sobre ACTH y cortisol que otros secretagogos."
      },
      benefits: {
        en: "Guide language focuses on cleaner GH release, lower hormonal noise, and overnight recovery positioning. The site keeps those points grounded in protocol context rather than promising guaranteed outcomes.",
        es: "El lenguaje de la guia se centra en liberacion de GH mas limpia, menor ruido hormonal y posicionamiento de recuperacion nocturna. El sitio mantiene esos puntos dentro del contexto de protocolo y no como resultados garantizados."
      },
      protocolOverview: {
        en: "The uploaded guide uses a once-daily subcutaneous structure, ideally in a fasting window before sleep, and builds more gradually across the first 8 to 12 weeks.",
        es: "La guia cargada usa una estructura subcutanea diaria, idealmente en ayunas antes de dormir, y construye de forma mas gradual a lo largo de las primeras 8 a 12 semanas."
      },
      dosing: {
        en: "The guide places Ipamorelin in a 100 mcg to 300 mcg daily range, with an orderly step-up that keeps the early phase conservative.",
        es: "La guia coloca Ipamorelin en un rango diario de 100 mcg a 300 mcg, con una subida ordenada que mantiene conservadora la fase inicial."
      },
      reconstitution: {
        en: "Guide handling uses 3.0 mL of bacteriostatic water for an approximate 3.33 mg/mL concentration, which leaves a very manageable daily volume.",
        es: "La guia usa 3,0 mL de agua bacteriostatica para una concentracion aproximada de 3,33 mg/mL, dejando un volumen diario muy manejable."
      },
      storage: {
        en: "Store lyophilized material at 2 to 8 C or frozen at lower temperatures. After reconstitution, refrigerate and use within roughly four weeks.",
        es: "Guardar el material liofilizado entre 2 y 8 C o congelado a menor temperatura. Tras la reconstitucion, refrigerar y usar en unas cuatro semanas."
      },
      stackKeys: ["longevity"]
    },
    "pt141-10mg": {
      summary: {
        en: "Built as a premium libido-focused page that keeps the tone scientific while still acknowledging the use-case buyers associate with the compound.",
        es: "PT-141 (bremelanotida) es un heptapéptido cíclico sintético y agonista no selectivo de los receptores melanocortina (MC3R/MC4R), derivado como metabolito activo de Melanotan II. Fue aprobado en 2019 para el trastorno de deseo sexual hipoactivo en mujeres premenopáusicas. La bremelanotida aumenta el deseo sexual activando el receptor MC4R en las vías cerebrales de recompensa y excitación, incrementando la liberación de dopamina en áreas clave del cerebro. Este protocolo educativo presenta un enfoque subcutáneo diario con titulación gradual y una dilución práctica para mediciones precisas con jeringa de insulina."
      },
      howItWorks: {
        en: "PT-141, or bremelanotide, is framed as a melanocortin-receptor agonist linked to central arousal signalling and dopaminergic reward pathways rather than local vascular action alone.",
        es: "PT-141, o bremelanotida, se presenta como un agonista de receptores melanocortina ligado a senalizacion central de excitacion y vias dopaminergicas de recompensa, no solo a accion vascular local."
      },
      benefits: {
        en: "Guide material highlights desire and arousal research. The main caution notes are nausea, flushing, and the need for careful expectation-setting when translating protocol language onto a storefront.",
        es: "El material de guia destaca investigacion sobre deseo y excitacion. Las principales cautelas son nauseas, enrojecimiento y la necesidad de ajustar muy bien las expectativas al trasladar lenguaje de protocolo a una tienda."
      },
      protocolOverview: {
        en: "The uploaded guide uses a daily progressive structure for educational purposes, while also noting that on-demand use appears in formal literature.",
        es: "La guia cargada usa una estructura diaria progresiva con fines educativos, al tiempo que recuerda que en la literatura formal aparece un uso a demanda."
      },
      dosing: {
        en: "The guide places PT-141 in a 500 mcg to 1500 mcg daily range across a staged 16-week progression, starting conservatively before moving to stronger steps.",
        es: "La guia posiciona PT-141 en un rango diario de 500 mcg a 1500 mcg a lo largo de una progresion por fases de 16 semanas, empezando de forma conservadora antes de pasar a escalones mas altos."
      },
      reconstitution: {
        en: "Guide handling uses 3.0 mL of bacteriostatic water for an approximate 3.33 mg/mL concentration, which keeps measurement simple for a stepped programme.",
        es: "La guia usa 3,0 mL de agua bacteriostatica para una concentracion aproximada de 3,33 mg/mL, lo que deja una medicion simple para un programa por etapas."
      },
      storage: {
        en: "Store lyophilized material frozen or very cold. After reconstitution, refrigerate at 2 to 8 C and avoid repeated freeze-thaw exposure.",
        es: "Guardar el material liofilizado congelado o muy frio. Tras la reconstitucion, refrigerar entre 2 y 8 C y evitar exposicion repetida a congelacion y descongelacion."
      },
      stackKeys: ["libido"]
    },
    "oxytocin-10mg": {
      summary: {
        en: "Reworked as a social-bonding and stress-context page that complements the libido category without making the storefront feel generic or exaggerated.",
        es: "La oxitocina es una hormona peptídica (nonapéptido) conocida por su papel en el vínculo social y el comportamiento. En entornos de investigación, la oxitocina sintética se utiliza para estudiar efectos sobre las relaciones de pareja, el estrés, la ansiedad y la cognición social. La oxitocina en formato de 10 mg se presenta como polvo liofilizado para investigación, por lo que requiere reconstitución antes de su uso. Este protocolo recopila pautas sobre dosificación, administración y almacenamiento."
      },
      howItWorks: {
        en: "Oxytocin is framed around social connection, pair bonding, stress modulation, and social-cognition research, which gives it a distinctly different role from PT-141 even when they are discussed together.",
        es: "La oxitocina se presenta alrededor de conexion social, vinculo de pareja, modulacion del estres e investigacion sobre cognicion social, lo que le da un papel distinto al de PT-141 incluso cuando se comentan juntos."
      },
      benefits: {
        en: "Guide language emphasizes relationship context, social ease, and calmer stress response. The page keeps that messaging tied to research context and away from broad emotional claims.",
        es: "El lenguaje de guia enfatiza contexto relacional, mayor facilidad social y respuesta al estres mas calmada. La pagina mantiene ese mensaje dentro del contexto de investigacion y lejos de afirmaciones emocionales amplias."
      },
      protocolOverview: {
        en: "The uploaded guide uses a daily subcutaneous structure with progressive increases, which makes the page fit cleanly inside a guided libido-and-connection series.",
        es: "La guia cargada usa una estructura subcutanea diaria con subidas progresivas, lo que hace que la pagina encaje de forma limpia dentro de una serie guiada de libido y conexion."
      },
      dosing: {
        en: "The guide positions Oxytocin in a 100 mcg to 500 mcg daily range, using a step-up approach across the first weeks before a steadier mid-cycle phase.",
        es: "La guia posiciona Oxitocina en un rango diario de 100 mcg a 500 mcg, usando una subida por etapas durante las primeras semanas antes de una fase media mas estable."
      },
      reconstitution: {
        en: "Guide handling uses 3.0 mL of bacteriostatic water for an approximate 3.33 mg/mL concentration, which keeps small daily measurements clean on a U-100 syringe.",
        es: "La guia usa 3,0 mL de agua bacteriostatica para una concentracion aproximada de 3,33 mg/mL, lo que mantiene limpias las mediciones pequenas en jeringa U-100."
      },
      storage: {
        en: "Store lyophilized material frozen or refrigerated. After reconstitution, keep at 2 to 8 C and work within a roughly 28-to-30-day refrigerated window.",
        es: "Guardar el material liofilizado congelado o refrigerado. Tras la reconstitucion, mantener entre 2 y 8 C y trabajar dentro de una ventana refrigerada de aproximadamente 28 a 30 dias."
      },
      stackKeys: ["libido"]
    },
    "kpv-10mg": {
      summary: {
        en: "Added as a lighter anti-inflammatory and barrier-support reference so the upcoming catalogue does not rely only on heavier regeneration products.",
        es: "Anadido como referencia mas ligera de soporte antiinflamatorio y de barrera para que el catalogo futuro no dependa solo de productos regenerativos mas pesados."
      },
      howItWorks: {
        en: "KPV is typically framed as a short alpha-MSH fragment studied for anti-inflammatory signalling, gut-barrier support, and calmer local tissue response in gastrointestinal and skin-focused models.",
        es: "KPV suele presentarse como un fragmento corto de alfa-MSH estudiado por su senalizacion antiinflamatoria, soporte de barrera intestinal y respuesta tisular local mas calmada en modelos gastrointestinales y de piel."
      },
      benefits: {
        en: "This lane is positioned around inflammatory moderation, digestive-barrier support, and calmer local tissue response, giving Primus a clearer specialist option beside the heavier regenerative pages.",
        es: "Esta linea se posiciona alrededor de la moderacion inflamatoria, el soporte de barrera digestiva y una respuesta tisular local mas calmada, dando a Primus una opcion mas especialista junto a las paginas regenerativas mas intensas."
      },
      protocolOverview: {
        en: "KPV is framed as a lower-volume daily workflow with conservative escalation, tighter handling discipline, and a shorter path from barrier-support interest to checkout.",
        es: "KPV se presenta como un flujo diario de menor volumen con escalada conservadora, disciplina de manejo mas estricta y un recorrido mas corto desde el interes por soporte de barrera hasta el checkout."
      },
      dosing: {
        en: "The Primus positioning keeps KPV in a conservative microgram-range workflow, favouring consistency, low-volume handling, and staged progression rather than aggressive front-loading.",
        es: "El posicionamiento de Primus mantiene KPV en un flujo conservador de microgramos, priorizando consistencia, manejo de bajo volumen y progresion por etapas en lugar de una carga agresiva al inicio."
      },
      reconstitution: {
        en: "Guide handling uses bacteriostatic-water reconstitution, gentle vial-wall mixing, clear labelling, and refrigerated storage so repeated low-volume draws stay easier to measure.",
        es: "La guia utiliza reconstitucion con agua bacteriostatica, mezcla suave por la pared del vial, etiquetado claro y almacenamiento refrigerado para que las cargas repetidas de bajo volumen sean mas faciles de medir."
      },
      storage: {
        en: "Store lyophilized material cold, dry, and protected from light. After reconstitution, keep refrigerated and avoid unnecessary temperature cycling.",
        es: "Guardar el material liofilizado en frio, seco y protegido de la luz. Tras la reconstitucion, mantener refrigerado y evitar cambios innecesarios de temperatura."
      },
      stackKeys: ["regenerative", "inflammation"]
    }
  });

  const LEGAL_PAGES = {};

  Object.assign(LEGAL_PAGES, {
    privacy: {
      kicker: { en: "Privacy", es: "Privacidad" },
      title: { en: "Privacy Policy", es: "Política de privacidad" },
      lead: {
        en: "This page explains what Primus Peptides collects, why it is collected, and how customer requests are handled across the storefront.",
        es: "Esta pagina explica que recopila Primus Peptides, por que se recopila y como se gestionan las solicitudes de clientes en la tienda."
      },
      sections: [
        {
          title: { en: "Who controls the data", es: "Quién controla los datos" },
          body: [
            {
              en: "Primus Peptides acts as the data controller for enquiries, orders, and account-related communication submitted through peptidos-primus.com.",
              es: "Primus Peptides actúa como responsable del tratamiento para consultas, pedidos y comunicaciones relacionadas con la cuenta enviadas a través de peptidos-primus.com."
            },
            {
              en: "Contact requests can be directed to contact@peptidos-primus.com until a dedicated compliance address is published.",
              es: "Las solicitudes pueden dirigirse a contact@peptidos-primus.com hasta que se publique una dirección específica de cumplimiento."
            }
          ]
        },
        {
          title: { en: "What we collect", es: "Qué recopilamos" },
          body: [
            {
              en: "The storefront may collect name, email address, company details, shipping data, billing information, cart selections, and customer support messages.",
              es: "La tienda puede recopilar nombre, correo electrónico, datos de empresa, dirección de envío, información de facturación, contenido del carrito y mensajes de soporte."
            },
            {
              en: "Technical information such as browser type, language preference, cookie consent status, and basic analytics may also be processed to operate the site.",
              es: "También puede procesarse información técnica como tipo de navegador, preferencia de idioma, estado del consentimiento de cookies y analítica básica para operar el sitio."
            }
          ]
        },
        {
          title: { en: "How the information is used", es: "Cómo se utiliza la información" },
          body: [
            {
              en: "Information is used to respond to enquiries, prepare orders, provide shipment updates, prevent abuse, and improve the storefront experience.",
              es: "La información se utiliza para responder consultas, preparar pedidos, facilitar actualizaciones de envío, prevenir abusos y mejorar la experiencia de la tienda."
            },
            {
              en: "Promotional communications should only be sent where a lawful basis exists and unsubscribe options are available.",
              es: "Las comunicaciones promocionales solo deben enviarse cuando exista una base legal y opciones claras de baja."
            }
          ]
        },
        {
          title: { en: "Retention and sharing", es: "Conservación y cesión" },
          body: [
            {
              en: "Order and support records should be kept only for as long as operational, accounting, fraud-prevention, or legal obligations require.",
              es: "Los registros de pedidos y soporte deben conservarse solo durante el tiempo necesario por motivos operativos, contables, de prevención de fraude o legales."
            },
            {
              en: "Data may be shared with payment, hosting, logistics, analytics, and compliance providers only where required to run the business.",
              es: "Los datos podrán compartirse con proveedores de pagos, hosting, logística, analítica y cumplimiento solo cuando sea necesario para operar el negocio."
            }
          ]
        },
        {
          title: { en: "Customer rights", es: "Derechos del cliente" },
          body: [
            {
              en: "Customers may request access, correction, deletion, portability, objection, or restriction of processing, subject to applicable law.",
              es: "Los clientes pueden solicitar acceso, rectificación, supresión, portabilidad, oposición o limitación del tratamiento, según la legislación aplicable."
            },
            {
              en: "Identity may need to be verified before a request is completed.",
              es: "Puede ser necesario verificar la identidad antes de completar una solicitud."
            }
          ]
        }
      ]
    },
    terms: {
      kicker: { en: "Terms", es: "Términos" },
      title: { en: "Terms & Conditions", es: "Términos y condiciones" },
      lead: {
        en: "These terms outline how Primus Peptides presents products, accepts orders, and manages use of the site.",
        es: "Estos terminos describen como Primus Peptides presenta productos, acepta pedidos y gestiona el uso del sitio."
      },
      sections: [
        {
          title: { en: "Research-use positioning", es: "Posicionamiento para investigación" },
          body: [
            {
              en: "Products are presented for laboratory and analytical contexts only. Human-use, therapeutic, or medical claims should not be implied unless separately reviewed and approved.",
              es: "Los productos se presentan únicamente para contextos de laboratorio y análisis. No deben implicarse usos humanos, terapéuticos o médicos sin revisión y aprobación específica."
            }
          ]
        },
        {
          title: { en: "Orders and acceptance", es: "Pedidos y aceptación" },
          body: [
            {
              en: "Placing an order request does not guarantee acceptance. Primus Peptides may review orders for availability, delivery constraints, payment verification, or compliance concerns before dispatch.",
              es: "Realizar una solicitud de pedido no garantiza su aceptación. Primus Peptides puede revisar disponibilidad, limitaciones de entrega, verificación de pago o cuestiones de cumplimiento antes del envío."
            }
          ]
        },
        {
          title: { en: "Pricing and payments", es: "Precios y pagos" },
          body: [
            {
              en: "All listed prices are presented in EUR unless otherwise stated. Exchange rate movements and network fees may affect the final value of crypto payments.",
              es: "Todos los precios se muestran en EUR salvo indicación en contrario. Las variaciones del tipo de cambio y las comisiones de red pueden afectar al valor final de los pagos en crypto."
            },
            {
              en: "Cryptocurrency checkout is live now with USDT payments through ArionPay.",
              es: "El checkout con criptomonedas está activo ahora con pagos USDT a través de ArionPay."
            }
          ]
        },
        {
          title: { en: "Content, batch data, and availability", es: "Contenido, lotes y disponibilidad" },
          body: [
            {
              en: "Product visuals, COA references, batch numbers, and availability indicators are provided for information and may change as stock rotates or documentation is updated.",
              es: "Las imágenes, referencias COA, números de lote y estados de disponibilidad se facilitan con carácter informativo y pueden cambiar con la rotación de stock o la actualización de documentación."
            }
          ]
        },
        {
          title: { en: "Liability and site use", es: "Responsabilidad y uso del sitio" },
          body: [
            {
              en: "Users must not misuse the site, attempt unauthorized access, or rely on storefront copy as a substitute for legal, technical, or laboratory review.",
              es: "Los usuarios no deben hacer un uso indebido del sitio, intentar accesos no autorizados ni confiar en el contenido de la tienda como sustituto de una revisión legal, técnica o de laboratorio."
            }
          ]
        }
      ]
    },
    shipping: {
      kicker: { en: "Shipping", es: "Envíos" },
      title: { en: "Shipping Policy", es: "Política de envíos" },
      lead: {
        en: "This page sets expectations around dispatch timing, courier selection, and destination handling so the checkout flow remains clear and conversion-friendly.",
        es: "Esta página fija expectativas sobre tiempos de salida, selección de transportista y gestión del destino para que el checkout sea claro y orientado a la conversión."
      },
      sections: [
        {
          title: { en: "Dispatch timing", es: "Tiempo de salida" },
          body: [
            {
              en: "Orders are intended to move to dispatch within 24 business hours where payment, stock, and address checks are complete.",
              es: "Los pedidos están previstos para salir en un plazo de 24 horas laborables cuando el pago, el stock y la verificación de dirección estén completos."
            }
          ]
        },
        {
          title: { en: "Delivery estimates", es: "Plazos estimados" },
          body: [
            {
              en: "EU Standard is typically presented as 1-3 business days, EU Express as 24-48 hours, and international delivery as 4-8 business days.",
              es: "UE estándar se presenta normalmente como 1-3 días laborables, UE express como 24-48 horas e internacional como 4-8 días laborables."
            },
            {
              en: "These estimates are not guarantees and may vary because of customs, weather, public holidays, or courier delays.",
              es: "Estos plazos no son garantías y pueden variar por aduanas, clima, festivos o retrasos del transportista."
            }
          ]
        },
        {
          title: { en: "Tracking and failed delivery", es: "Seguimiento y entrega fallida" },
          body: [
            {
              en: "Tracking details should be shared as soon as the shipment is collected by the courier. Customers are responsible for providing an accurate and deliverable address.",
              es: "Los datos de seguimiento deben compartirse en cuanto el envío sea recogido por el transportista. El cliente es responsable de facilitar una dirección correcta y entregable."
            },
            {
              en: "Where a parcel is returned because of failed delivery attempts or address issues, reshipment costs may apply.",
              es: "Si un paquete es devuelto por intentos fallidos o incidencias de dirección, podrán aplicarse costes de reenvío."
            }
          ]
        },
        {
          title: { en: "Customs and destination restrictions", es: "Aduanas y restricciones de destino" },
          body: [
            {
              en: "The buyer is responsible for checking destination restrictions, import rules, and local handling requirements before completing an order.",
              es: "El comprador es responsable de revisar restricciones del destino, normas de importación y requisitos locales de manejo antes de completar un pedido."
            }
          ]
        }
      ]
    },
    refunds: {
      kicker: { en: "Returns", es: "Devoluciones" },
      title: { en: "Returns & Refunds", es: "Devoluciones y reembolsos" },
      lead: {
        en: "This page sets out a clean customer-support framework for damaged parcels, incorrect items, and order issues while keeping expectations realistic for a specialist research catalogue.",
        es: "Esta página establece un marco claro de soporte para paquetes dañados, artículos incorrectos e incidencias de pedido manteniendo expectativas realistas para un catálogo especializado."
      },
      sections: [
        {
          title: { en: "Report window", es: "Plazo de notificación" },
          body: [
            {
              en: "Customers should report delivery issues, visible damage, or incorrect products promptly after receiving the parcel and include clear supporting photos where possible.",
              es: "Los clientes deben comunicar incidencias de entrega, daños visibles o productos incorrectos lo antes posible tras recibir el paquete e incluir fotos claras cuando sea posible."
            }
          ]
        },
        {
          title: { en: "Eligible resolutions", es: "Resoluciones posibles" },
          body: [
            {
              en: "Depending on the issue, Primus Peptides may offer replacement, store credit, partial refund, or a full refund where the claim is validated.",
              es: "Según la incidencia, Primus Peptides podrá ofrecer reposición, crédito en tienda, reembolso parcial o reembolso total cuando la reclamación sea validada."
            }
          ]
        },
        {
          title: { en: "Non-returnable cases", es: "Casos no retornables" },
          body: [
            {
              en: "Opened, misused, or improperly stored products are generally not suitable for return unless a legal obligation requires another outcome.",
              es: "Los productos abiertos, mal utilizados o almacenados de forma incorrecta no suelen ser aptos para devolución salvo obligación legal en contrario."
            }
          ]
        },
        {
          title: { en: "Order changes and cancellations", es: "Cambios y cancelaciones" },
          body: [
            {
              en: "Cancellation requests should be made before dispatch. Once an order has shipped, interception or return options depend on courier status and destination.",
              es: "Las solicitudes de cancelación deben realizarse antes del envío. Una vez expedido el pedido, las opciones dependen del estado del transportista y del destino."
            }
          ]
        }
      ]
    }
  });

  function tx(en, es) {
    return currentLanguage === "es" ? es : en;
  }

  function localize(value) {
    return pick(value);
  }

  function text(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function readStoredValue(key) {
    if (typeof readPersistedValue === "function") {
      return readPersistedValue(key);
    }

    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function writeStoredValue(key, value) {
    if (typeof writePersistedValue === "function") {
      writePersistedValue(key, value);
      return;
    }

    try {
      localStorage.setItem(key, String(value));
    } catch {
      // Ignore fallback write failure.
    }
  }

  function accountStatusTone(order) {
    const summary = `${text(order && order.status)} ${text(order && order.gatewayStatus)}`.toLowerCase();

    if (isPaidOrderStatus(summary)) {
      return "paid";
    }

    if (/cancel|failed|expired|closed|void|refund/.test(summary)) {
      return "closed";
    }

    return "pending";
  }

  function accountStatusLabel(order) {
    const status = text(order && order.status) || text(order && order.gatewayStatus) || "received";
    return status.replace(/[_-]+/g, " ").replace(/\b\w/g, (match) => match.toUpperCase());
  }

  function accountOrderSummary(order) {
    const parts = [];

    if (text(order && order.shippingMethod)) {
      parts.push(text(order.shippingMethod).replace(/[_-]+/g, " "));
    }

    if (text(order && order.paymentMethod)) {
      parts.push(text(order.paymentMethod).replace(/[_-]+/g, " "));
    }

    if (text(order && order.gatewayStatus) && text(order.gatewayStatus).toLowerCase() !== text(order && order.status).toLowerCase()) {
      parts.push(`${tx("Gateway", "Pasarela")}: ${accountStatusLabel({ status: order.gatewayStatus })}`);
    }

    return parts.join(" | ");
  }

  function safeNextPath(value, fallback = "account.html") {
    const candidate = text(value);
    if (!candidate || typeof window === "undefined" || !window.location) {
      return fallback;
    }

    try {
      const target = new URL(candidate, window.location.origin);
      const pathname = target.pathname || "";

      if (target.origin !== window.location.origin || !PUBLIC_PAGE_PATHS.has(pathname) || pathname.startsWith("/api/")) {
        return fallback;
      }

      const normalizedPath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");

      if (["login.html", "register.html"].includes(normalizedPath)) {
        return fallback;
      }

      return `${normalizedPath}${target.search}${target.hash}`;
    } catch {
      return fallback;
    }
  }

  function authNextUrl(fallback = "account.html") {
    if (typeof window === "undefined") {
      return fallback;
    }

    const params = new URLSearchParams(window.location.search);
    return safeNextPath(params.get("next"), fallback);
  }

  function loginPageHref(nextPath = "account.html") {
    return `login.html?next=${encodeURIComponent(safeNextPath(nextPath, "account.html"))}`;
  }

  function registerPageHref(nextPath = "account.html") {
    return `register.html?next=${encodeURIComponent(safeNextPath(nextPath, "account.html"))}`;
  }

  function updateAuthSessionState(nextState) {
    authSessionState = {
      ...authSessionState,
      ...nextState
    };
    return authSessionState;
  }

  function resetAccountOrdersState() {
    accountOrdersState = {
      status: "idle",
      orders: [],
      error: ""
    };
    accountOrdersRequest = null;
  }

  async function requestJson(url, options = {}) {
    const headers = {
      Accept: "application/json",
      ...(options.headers || {})
    };
    const requestOptions = {
      method: options.method || "GET",
      cache: "no-store",
      credentials: "same-origin",
      ...options,
      headers
    };

    if (requestOptions.body && typeof requestOptions.body !== "string") {
      requestOptions.body = JSON.stringify(requestOptions.body);
      requestOptions.headers = {
        "Content-Type": "application/json",
        ...headers
      };
    }

    const response = await fetch(url, requestOptions);
    const payload = await response.json().catch(() => ({}));

    return { response, payload };
  }

  async function loadAuthSession(options = {}) {
    const { force = false, rerender = true } = options;

    if (authSessionRequest && !force) {
      return authSessionRequest;
    }

    if (!force && ["authenticated", "guest"].includes(authSessionState.status)) {
      return authSessionState;
    }

    updateAuthSessionState({
      status: "loading",
      error: ""
    });

    authSessionRequest = requestJson(SESSION_ENDPOINT)
      .then(({ response, payload }) => {
        if (!response.ok) {
          throw new Error(payload.error || tx("Unable to verify your session right now.", "No hemos podido verificar tu sesion ahora mismo."));
        }

        if (payload && payload.authenticated && payload.user) {
          updateAuthSessionState({
            status: "authenticated",
            user: payload.user,
            session: payload.session || null,
            error: ""
          });
        } else {
          updateAuthSessionState({
            status: "guest",
            user: null,
            session: null,
            error: ""
          });
          resetAccountOrdersState();
        }

        return authSessionState;
      })
      .catch((error) => {
        updateAuthSessionState({
          status: "error",
          user: null,
          session: null,
          error: error instanceof Error && error.message
            ? error.message
            : tx("Unable to verify your session right now.", "No hemos podido verificar tu sesion ahora mismo.")
        });
        resetAccountOrdersState();
        return authSessionState;
      })
      .finally(() => {
        authSessionRequest = null;

        if (rerender) {
          renderHeader();
          renderPage();
          if (typeof updateCartBadges === "function") {
            updateCartBadges();
          }
        }
      });

    return authSessionRequest;
  }

  async function loadAccountOrders(options = {}) {
    const { force = false, rerender = true } = options;

    if (authSessionState.status !== "authenticated") {
      resetAccountOrdersState();
      return accountOrdersState;
    }

    if (accountOrdersRequest && !force) {
      return accountOrdersRequest;
    }

    if (!force && accountOrdersState.status === "loaded") {
      return accountOrdersState;
    }

    accountOrdersState = {
      ...accountOrdersState,
      status: "loading",
      error: ""
    };

    accountOrdersRequest = requestJson(ACCOUNT_ORDERS_ENDPOINT)
      .then(({ response, payload }) => {
        if (response.status === 401) {
          updateAuthSessionState({
            status: "guest",
            user: null,
            session: null,
            error: ""
          });
          resetAccountOrdersState();
          return authSessionState;
        }

        if (!response.ok) {
          throw new Error(payload.error || tx("Unable to load your order history.", "No hemos podido cargar tu historial de pedidos."));
        }

        accountOrdersState = {
          status: "loaded",
          orders: Array.isArray(payload.orders) ? payload.orders : [],
          error: ""
        };
        return accountOrdersState;
      })
      .catch((error) => {
        accountOrdersState = {
          status: "error",
          orders: [],
          error: error instanceof Error && error.message
            ? error.message
            : tx("Unable to load your order history.", "No hemos podido cargar tu historial de pedidos.")
        };
        return accountOrdersState;
      })
      .finally(() => {
        accountOrdersRequest = null;
        if (rerender) {
          renderHeader();
          if (getCurrentPage() === "account") {
            renderPage();
          }
        }
      });

    return accountOrdersRequest;
  }

  async function submitAuthRequest(endpoint, payload, fallbackMessage) {
    const { response, payload: result } = await requestJson(endpoint, {
      method: "POST",
      body: payload
    });

    if (!response.ok || !result.ok || !result.user) {
      throw new Error(result.error || fallbackMessage);
    }

    updateAuthSessionState({
      status: "authenticated",
      user: result.user,
      session: result.session || null,
      error: ""
    });
    resetAccountOrdersState();

    return result;
  }

  async function handleLogoutFlow(options = {}) {
    const { redirectTo = "", silent = false } = options;

    try {
      await requestJson(LOGOUT_ENDPOINT, { method: "POST" });
    } catch {
      // Always clear the client-side view even if the server session is already gone.
    }

    updateAuthSessionState({
      status: "guest",
      user: null,
      session: null,
      error: ""
    });
    resetAccountOrdersState();
    renderHeader();

    const page = getCurrentPage();
    if (!silent) {
      showToast(tx("You have been signed out.", "Has cerrado la sesion."));
    }

    if (page === "account") {
      window.location.replace(loginPageHref("account.html"));
      return;
    }

    if (["login", "register"].includes(page)) {
      renderPage();
      return;
    }

    if (redirectTo) {
      window.location.replace(redirectTo);
    }
  }

  function clearAuthNavigation() {
    if (authNavigationTimer) {
      window.clearTimeout(authNavigationTimer);
      authNavigationTimer = 0;
    }
  }

  function scheduleAuthNavigation(url, delay = 120) {
    if (typeof window === "undefined" || !url) {
      return;
    }

    clearAuthNavigation();
    authNavigationTimer = window.setTimeout(() => {
      authNavigationTimer = 0;
      window.location.replace(url);
    }, delay);
  }

  function selectedDelivery(total) {
    const saved = readCheckoutDraft();
    return DELIVERY_OPTIONS.find((item) => item.id === saved.shippingMethod)
      || DELIVERY_OPTIONS.find((item) => item.id === "eu-standard")
      || DELIVERY_OPTIONS[0];
  }

  function selectedPayment() {
    return ACTIVE_PAYMENT_OPTIONS[0];
  }

  function selectedCryptoCurrency() {
    const saved = readCheckoutDraft();
    return CRYPTO_CURRENCY_OPTIONS.find((item) => item.id === saved.paymentCurrency && item.live)
      || CRYPTO_CURRENCY_OPTIONS.find((item) => item.live)
      || CRYPTO_CURRENCY_OPTIONS[0];
  }

  function countryConfig(countryValue) {
    const normalized = String(countryValue || "").trim().toUpperCase();
    return CHECKOUT_COUNTRIES.find((item) => item.code === normalized)
      || CHECKOUT_COUNTRIES.find((item) => String(item.label.en).toLowerCase() === String(countryValue || "").trim().toLowerCase())
      || CHECKOUT_COUNTRIES[0];
  }

  function regionOptions(countryValue) {
    return countryConfig(countryValue).regions || [];
  }

  function normalizeRegion(countryValue, regionValue) {
    const regions = regionOptions(countryValue);
    return regions.includes(regionValue) ? regionValue : (regions[0] || "");
  }

  function paymentDisplayLabel(payment, cryptoCurrency) {
    return `ArionPay - ${localize((cryptoCurrency || selectedCryptoCurrency()).label)}`;
  }

  function deliveryPrice(option, total) {
    if (!option) {
      return 0;
    }
    if (option.freeEligible && total >= FREE_SHIPPING_THRESHOLD) {
      return 0;
    }
    return option.price;
  }

  function cartShippingCost(cart, option, total) {
    return deliveryPrice(option, total);
  }

  function productProfile(product) {
    return PRODUCT_PROFILES[product.slug] || {
      short: {
        en: "This product is reserved for an upcoming batch release and will be available soon with full documentation.",
        es: "Este producto está reservado para un próximo lote y estará disponible pronto con documentación completa."
      },
      focus: {
        en: "Pricing, availability, and batch certification will be confirmed as the release date approaches.",
        es: "El precio, la disponibilidad y la certificación por lote se confirmarán a medida que se acerque la fecha de lanzamiento."
      }
    };
  }

  function patchSharedCopy() {
    COPY.shell.brandTag = {
      en: "Research-grade peptide store",
      es: "Tienda de péptidos para investigación"
    };
    COPY.shell.topbar = {
      en: "COA-backed batches, HPLC-tested listings, and secure cryptocurrency checkout with live USDT.",
      es: "Lotes respaldados por COA, fichas analizadas por HPLC y checkout seguro con USDT en vivo."
    };
    COPY.shell.toastContact = {
      en: "Message composer opened.",
      es: "Composición de correo abierta."
    };
    COPY.labels.checkout = {
      en: "Secure Checkout",
      es: "Pago seguro"
    };
  }

  function enrichProducts() {
    PRODUCTS.forEach((product) => {
      const profile = productProfile(product);
      product.short = profile.short;
      product.focus = profile.focus;
    });
  }

  function normalizeCheckoutDraft(draft) {
    const next = draft && typeof draft === "object" ? { ...draft } : {};
    next.paymentMethod = "USDT_TRC20";
    next.paymentCurrency = "USDT_TRC20";
    next.createAccount = false;
    next.alternateShipping = false;
    delete next.ageConfirmed;
    delete next.exactAmountConfirmed;
    return next;
  }

  function readCheckoutAgreements() {
    return {
      ageConfirmed: checkoutAgreementState.ageConfirmed === true,
      exactAmountConfirmed: checkoutAgreementState.exactAmountConfirmed === true
    };
  }

  function resetCheckoutAgreements() {
    checkoutAgreementState = {
      ageConfirmed: false,
      exactAmountConfirmed: false
    };
  }

  function syncCheckoutAgreementsFromForm(form) {
    const data = new FormData(form);
    checkoutAgreementState = {
      ageConfirmed: data.get("ageConfirmed") === "on",
      exactAmountConfirmed: data.get("exactAmountConfirmed") === "on"
    };
    return readCheckoutAgreements();
  }

  function readCheckoutDraft() {
    try {
      const stored = readStoredValue(CHECKOUT_DRAFT_STORE);
      return normalizeCheckoutDraft(stored ? JSON.parse(stored) : {});
    } catch {
      return normalizeCheckoutDraft({});
    }
  }

  function saveCheckoutDraft(draft) {
    writeStoredValue(CHECKOUT_DRAFT_STORE, JSON.stringify(normalizeCheckoutDraft(draft)));
  }

  function readLastOrder() {
    try {
      const stored = readStoredValue(LAST_ORDER_STORE);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  function saveLastOrder(order) {
    writeStoredValue(LAST_ORDER_STORE, JSON.stringify(order));
  }

  function readCheckoutSessionOrderReference() {
    const stored = readStoredValue(CHECKOUT_SESSION_ORDER_STORE);
    return typeof stored === "string"
      ? stored.trim().replace(/[^A-Za-z0-9_-]/g, "").slice(0, 80)
      : "";
  }

  function saveCheckoutSessionOrderReference(reference) {
    const nextReference = typeof reference === "string"
      ? reference.trim().replace(/[^A-Za-z0-9_-]/g, "").slice(0, 80)
      : "";

    writeStoredValue(CHECKOUT_SESSION_ORDER_STORE, nextReference);
  }

  function clearCheckoutSessionOrderReference() {
    writeStoredValue(CHECKOUT_SESSION_ORDER_STORE, "");
  }

  function clearStoredCart() {
    if (typeof saveCart === "function") {
      saveCart([]);
      return;
    }

    writeStoredValue(CART_STORE, JSON.stringify([]));
  }

  function isPaidOrderStatus(status) {
    return /paid|completed|confirmed|success/i.test(String(status || ""));
  }

  function activeSessionOrder(order) {
    const sessionOrderReference = readCheckoutSessionOrderReference();
    if (!sessionOrderReference || !order || order.reference !== sessionOrderReference) {
      return null;
    }

    return order;
  }

  function buildOrderSuccessUrl(reference) {
    return `checkout.html?reference=${encodeURIComponent(reference)}&status=success`;
  }

  function logPaidCheckoutFlow(event, detail = {}) {
    if (typeof console === "undefined" || typeof console.info !== "function") {
      return;
    }

    try {
      console.info("[paid-checkout-flow]", event, detail);
    } catch {
      // Ignore console serialization failures.
    }
  }

  function matchingOrderReference(order, reference) {
    const normalizedReference = typeof reference === "string"
      ? reference.trim().replace(/[^A-Za-z0-9_-]/g, "").slice(0, 80)
      : "";

    return Boolean(order && order.reference && normalizedReference && order.reference === normalizedReference)
      ? order
      : null;
  }

  function resolveReturnedOrder(success, reference, cachedOrder) {
    if (reference) {
      return matchingOrderReference(cachedOrder, reference);
    }

    if (success) {
      return activeSessionOrder(cachedOrder);
    }

    return null;
  }

  function ensurePaidCheckoutSuccessUrl(order) {
    if (!order || !order.reference || getCurrentPage() !== "checkout" || typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const currentStatus = params.get("status") || "";
    const currentReference = params.get("reference") || "";
    const nextUrl = buildOrderSuccessUrl(order.reference);

    if (currentStatus === "success" && currentReference === order.reference) {
      return;
    }

    try {
      window.history.replaceState({}, document.title, nextUrl);
      logPaidCheckoutFlow("normalize-success-url", {
        reference: order.reference,
        previousStatus: currentStatus,
        previousReference: currentReference
      });
    } catch {
      // Ignore history update failures.
    }
  }

  function currentCheckoutSuccessState() {
    const node = document.querySelector("[data-checkout-state]");
    return node ? String(node.getAttribute("data-checkout-state") || "").trim() : "";
  }

  function ensureCompletedCheckoutScreen(order) {
    if (!order || !isPaidOrderStatus(order.status) || getCurrentPage() !== "checkout") {
      return;
    }

    const currentState = currentCheckoutSuccessState();
    if (currentState === "completed") {
      return;
    }

    logPaidCheckoutFlow("rerender-completed-screen", {
      reference: order.reference,
      currentState
    });
    renderPage();
  }

  function clearArionPayStatusPoll() {
    if (arionPayStatusPollTimer) {
      window.clearTimeout(arionPayStatusPollTimer);
      arionPayStatusPollTimer = 0;
    }
  }

  function clearPaidOrderRedirect() {
    if (paidOrderRedirectTimer) {
      window.clearTimeout(paidOrderRedirectTimer);
      paidOrderRedirectTimer = 0;
    }
  }

  function resetArionPayStatusPoll() {
    clearArionPayStatusPoll();
    arionPayStatusPollCount = 0;
  }

  function scheduleArionPayStatusPoll() {
    if (arionPayStatusPollCount >= ARIONPAY_STATUS_POLL_LIMIT) {
      return;
    }

    clearArionPayStatusPoll();
    arionPayStatusPollCount += 1;
    arionPayStatusPollTimer = window.setTimeout(() => {
      arionPayStatusPollTimer = 0;
      refreshArionPayOrderStatus();
    }, ARIONPAY_STATUS_POLL_DELAY_MS);
  }

  function schedulePaidOrderRedirect() {
    if (paidOrderRedirectTimer || getCurrentPage() !== "checkout") {
      return;
    }

    paidOrderRedirectTimer = window.setTimeout(() => {
      paidOrderRedirectTimer = 0;
      window.location.replace(HOMEPAGE_URL);
    }, PAID_ORDER_REDIRECT_DELAY_MS);
  }

  function deliveryOptionById(id, fallbackId) {
    return DELIVERY_OPTIONS.find((item) => item.id === id)
      || DELIVERY_OPTIONS.find((item) => item.id === fallbackId)
      || DELIVERY_OPTIONS[0];
  }

  function paymentOptionById(id, fallbackId) {
    return ACTIVE_PAYMENT_OPTIONS.find((item) => item.id === id)
      || ACTIVE_PAYMENT_OPTIONS.find((item) => item.id === fallbackId)
      || ACTIVE_PAYMENT_OPTIONS[0];
  }

  function cryptoCurrencyById(id, fallbackId) {
    return CRYPTO_CURRENCY_OPTIONS.find((item) => item.id === id)
      || CRYPTO_CURRENCY_OPTIONS.find((item) => item.id === fallbackId)
      || selectedCryptoCurrency();
  }

  function mergeSyncedOrder(orderPayload, fallbackOrder) {
    if (!orderPayload || typeof orderPayload !== "object") {
      return fallbackOrder || null;
    }

    const fallback = fallbackOrder && typeof fallbackOrder === "object" ? fallbackOrder : {};
    const fallbackShippingId = fallback.shippingMethod || (fallback.shipping && fallback.shipping.id) || "eu-standard";
    const fallbackPaymentId = fallback.paymentMethod || (fallback.payment && fallback.payment.id) || ACTIVE_PAYMENT_OPTIONS[0].id;
    const shippingMethod = orderPayload.shippingMethod || fallbackShippingId;
    const paymentMethod = orderPayload.paymentMethod || fallbackPaymentId;
    const shipping = deliveryOptionById(shippingMethod, fallbackShippingId);
    const payment = paymentOptionById(paymentMethod, fallbackPaymentId);
    const paymentCurrency = cryptoCurrencyById(paymentMethod, fallback.paymentCurrency && fallback.paymentCurrency.id);
    const subtotal = typeof orderPayload.subtotal === "number"
      ? orderPayload.subtotal
      : (typeof fallback.subtotal === "number" ? fallback.subtotal : 0);
    const shippingCost = typeof orderPayload.shippingCost === "number"
      ? orderPayload.shippingCost
      : (typeof fallback.shippingCost === "number" ? fallback.shippingCost : deliveryPrice(shipping, subtotal));
    const total = typeof orderPayload.total === "number"
      ? orderPayload.total
      : (typeof fallback.total === "number" ? fallback.total : subtotal + shippingCost);

    return {
      ...fallback,
      reference: orderPayload.reference || fallback.reference || "",
      createdAt: orderPayload.createdAt || fallback.createdAt || new Date().toISOString(),
      status: orderPayload.status || fallback.status || "received",
      gatewayStatus: orderPayload.gatewayStatus || fallback.gatewayStatus || "",
      invoiceId: orderPayload.invoiceId || fallback.invoiceId || "",
      invoiceUrl: orderPayload.invoiceUrl || fallback.invoiceUrl || "",
      lastWebhookAt: orderPayload.lastWebhookAt || fallback.lastWebhookAt || "",
      shippingMethod,
      paymentMethod,
      shipping,
      payment,
      paymentCurrency,
      subtotal,
      shippingCost,
      total,
      items: Array.isArray(orderPayload.items) && orderPayload.items.length
        ? orderPayload.items
        : (Array.isArray(fallback.items) ? fallback.items : [])
    };
  }

  function finalizePaidCheckoutUi(order, statusNode, options = {}) {
    if (!order || !isPaidOrderStatus(order.status)) {
      clearPaidOrderRedirect();
      return;
    }

    const allowRedirect = options.allowRedirect !== false;
    ensurePaidCheckoutSuccessUrl(order);
    logPaidCheckoutFlow("finalize-paid-ui", {
      reference: order.reference,
      status: order.status,
      allowRedirect
    });

    clearStoredCart();
    saveCheckoutDraft({});
    resetCheckoutAgreements();
    clearCheckoutSessionOrderReference();

    if (typeof updateCartBadges === "function") {
      updateCartBadges();
    }

    if (statusNode) {
      statusNode.textContent = tx(
        "Payment confirmed. Your cart has been cleared and you will be redirected to the homepage shortly.",
        "Pago confirmado. Tu carrito ya se ha vaciado y seras redirigido a la pagina principal en breve."
      );
    }

    ensureCompletedCheckoutScreen(order);

    if (allowRedirect && getCurrentPage() === "checkout") {
      schedulePaidOrderRedirect();
    } else {
      clearPaidOrderRedirect();
    }
  }

  function syncPaidCheckoutUi() {
    if (getCurrentPage() !== "checkout") {
      clearPaidOrderRedirect();
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const success = params.get("status") === "success";
    const reference = params.get("reference") || "";
    const order = readLastOrder();
    const returnedOrder = resolveReturnedOrder(success, reference, order);
    const paidSessionOrder = !success && activeSessionOrder(order) && isPaidOrderStatus(order.status)
      ? order
      : null;
    const successOrder = success && returnedOrder && isPaidOrderStatus(returnedOrder.status)
      ? returnedOrder
      : null;
    const completedOrder = successOrder && isPaidOrderStatus(successOrder.status)
      ? successOrder
      : paidSessionOrder;

    if (!completedOrder) {
      clearPaidOrderRedirect();
      return;
    }

    logPaidCheckoutFlow("sync-paid-order", {
      success,
      reference,
      completedReference: completedOrder.reference,
      completedStatus: completedOrder.status
    });
    finalizePaidCheckoutUi(completedOrder, document.querySelector("[data-order-sync-status]"), {
      allowRedirect: success || Boolean(paidSessionOrder)
    });
  }

  async function refreshArionPayOrderStatus() {
    if (getCurrentPage() !== "checkout") {
      resetArionPayStatusPoll();
      clearPaidOrderRedirect();
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const success = params.get("status") === "success";
    const reference = params.get("reference") || "";
    const lastOrder = readLastOrder();
    const sessionOrderReference = readCheckoutSessionOrderReference();
    const sessionOrder = activeSessionOrder(lastOrder);
    const returnedOrder = resolveReturnedOrder(success, reference, lastOrder);
    const cachedOrder = returnedOrder || sessionOrder;
    const shouldMonitorSession = Boolean(sessionOrder && sessionOrder.invoiceId);

    if (!success && !reference && !shouldMonitorSession) {
      resetArionPayStatusPoll();
      clearPaidOrderRedirect();
      return;
    }
    const orderReference = reference || sessionOrderReference || (cachedOrder && cachedOrder.reference) || "";

    if (!orderReference) {
      logPaidCheckoutFlow("missing-order-reference", {
        success,
        reference,
        sessionOrderReference,
        cachedReference: cachedOrder && cachedOrder.reference
      });
      resetArionPayStatusPoll();
      clearPaidOrderRedirect();
      return;
    }

    const statusNode = document.querySelector("[data-order-sync-status]");
    if (statusNode) {
      statusNode.textContent = tx(
        "Payment received. Confirming your order with ArionPay now...",
        "Pago recibido. Confirmando tu pedido con ArionPay ahora..."
      );
    }

    const query = new URLSearchParams({ reference: orderReference });
    if (cachedOrder && cachedOrder.invoiceId) {
      query.set("invoiceId", cachedOrder.invoiceId);
    }
    query.set("_sync", `${Date.now()}`);

    try {
      const response = await fetch(`${ORDER_STATUS_ENDPOINT}?${query.toString()}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store"
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.order) {
        logPaidCheckoutFlow("status-check-pending", {
          orderReference,
          httpStatus: response.status,
          hasOrder: Boolean(payload && payload.order)
        });
        if (statusNode) {
          statusNode.textContent = tx(
            "Payment received. We are still waiting for ArionPay confirmation. Please do not pay again.",
            "Pago recibido. Seguimos esperando la confirmacion de ArionPay. Por favor, no pagues de nuevo."
          );
        }
        if (success || shouldMonitorSession) {
          scheduleArionPayStatusPoll();
        }
        return;
      }

      const nextOrder = mergeSyncedOrder(payload.order, cachedOrder);
      if (!nextOrder || !nextOrder.reference) {
        if (success || shouldMonitorSession) {
          scheduleArionPayStatusPoll();
        }
        return;
      }

      const changed =
        !cachedOrder
        || nextOrder.status !== cachedOrder.status
        || nextOrder.invoiceId !== cachedOrder.invoiceId
        || nextOrder.invoiceUrl !== cachedOrder.invoiceUrl
        || nextOrder.lastWebhookAt !== cachedOrder.lastWebhookAt;

      saveLastOrder(nextOrder);

      if (isPaidOrderStatus(nextOrder.status)) {
        logPaidCheckoutFlow("status-check-paid", {
          orderReference,
          resolvedReference: nextOrder.reference,
          cachedStatus: cachedOrder && cachedOrder.status,
          changed
        });
        ensurePaidCheckoutSuccessUrl(nextOrder);
        finalizePaidCheckoutUi(nextOrder, statusNode, { allowRedirect: true });
      } else {
        clearPaidOrderRedirect();
      }

      if (!changed) {
        if (statusNode) {
          statusNode.textContent = isPaidOrderStatus(nextOrder.status)
            ? tx(
              "Payment confirmed. Your cart has been cleared and you will be redirected to the homepage shortly.",
              "Pago confirmado. Tu carrito ya se ha vaciado y seras redirigido a la pagina principal en breve."
            )
            : tx(
              "Payment received. We are still confirming your order with ArionPay. Please do not pay again.",
              "Pago recibido. Seguimos confirmando tu pedido con ArionPay. Por favor, no pagues de nuevo."
            );
        }
        if (isPaidOrderStatus(nextOrder.status)) {
          resetArionPayStatusPoll();
        } else if (success || shouldMonitorSession) {
          scheduleArionPayStatusPoll();
        }
        return;
      }

      if (isPaidOrderStatus(nextOrder.status)) {
        resetArionPayStatusPoll();
      } else if (success || shouldMonitorSession) {
        scheduleArionPayStatusPoll();
      }

      renderPage();
    } catch {
      if (statusNode) {
        statusNode.textContent = tx(
          "Payment received. We could not confirm the status just yet, but we are still checking it automatically.",
          "Pago recibido. Aun no hemos podido confirmar el estado, pero seguimos comprobando automaticamente."
        );
      }
      if (success || shouldMonitorSession) {
        scheduleArionPayStatusPoll();
      }
    }
  }

  function orderReference() {
    const seed = `${Date.now()}`.slice(-6);
    return `PP-${seed}`;
  }

  function shippingProgressCopy(total) {
    const remaining = Math.max(FREE_SHIPPING_THRESHOLD - total, 0);
    if (!total) {
      return tx(
        `Add products worth ${formatPrice(FREE_SHIPPING_THRESHOLD)} to unlock free EU shipping.`,
        `Añade productos por valor de ${formatPrice(FREE_SHIPPING_THRESHOLD)} para activar el envío UE gratuito.`
      );
    }
    if (remaining > 0) {
      return tx(
        `Add ${formatPrice(remaining)} more to unlock free EU shipping.`,
        `Añade ${formatPrice(remaining)} más para activar el envío UE gratuito.`
      );
    }
    return tx("Free EU shipping unlocked.", "Envío UE gratuito activado.");
  }

  function renderPolicyLinkList(currentPage) {
    return POLICY_LINKS.map((item) => `
      <a class="${currentPage === item.key ? "is-current" : ""}" href="${item.href}">
        <span>${localize(item.label)}</span>
        <span aria-hidden="true">›</span>
      </a>
    `).join("");
  }

  function renderOrderLineItems(items) {
    return items.map((item) => {
      const product = item.slug ? getProduct(item.slug) : item.product;
      const lineTotal = typeof item.lineTotal === "number"
        ? item.lineTotal
        : (product.price || 0) * item.quantity;

      return `
        <div class="order-line-item">
          <div>
            <strong>${localize(product.name)} ${product.dosage}</strong>
            <p>${tx("Qty", "Cant.")}: ${item.quantity}</p>
          </div>
          <strong>${typeof lineTotal === "number" && lineTotal > 0 ? formatPrice(lineTotal) : tx("Pending", "Pendiente")}</strong>
        </div>
      `;
    }).join("");
  }

  function productCode(product) {
    return localize(product.name)
      .replace(/[^A-Za-z0-9]/g, "")
      .slice(0, 6)
      .toUpperCase();
  }

  function productTone(product) {
    const palette = [
      { primary: "#1a6fd6", soft: "#dfeeff", shadow: "rgba(26, 111, 214, 0.24)" },
      { primary: "#0d4f9e", soft: "#e4efff", shadow: "rgba(13, 79, 158, 0.22)" },
      { primary: "#3f7fc7", soft: "#eef5ff", shadow: "rgba(63, 127, 199, 0.2)" },
      { primary: "#245aa8", soft: "#e6f0ff", shadow: "rgba(36, 90, 168, 0.22)" }
    ];
    const seed = product.slug.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return palette[seed % palette.length];
  }

  function goalConfig(goalId) {
    return GOAL_COLLECTIONS.find((item) => item.id === goalId) || GOAL_COLLECTIONS[0];
  }

  function validGoal(goalId) {
    return goalConfig(goalId).id;
  }

  function validSort(sortId) {
    return SHOP_SORT_OPTIONS.some((item) => item.id === sortId) ? sortId : "featured";
  }

  function productGoals(product) {
    return PRODUCT_GOAL_MAP[product.slug] || ["specialty"];
  }

  function primaryGoal(product) {
    return productGoals(product)[0] || "specialty";
  }

  function productMatchesGoal(product, goalId) {
    return goalId === "all" || productGoals(product).includes(goalId);
  }

  function allGalleryImages(product) {
    return Array.from(new Set([product.image].concat(Array.isArray(product.gallery) ? product.gallery : []).filter(Boolean)));
  }

  function galleryImageLabel(image, index) {
    const src = String(image || "").toLowerCase();
    if (index === 0 || src.includes("/packshots/")) {
      return tx("Packshot", "Packshot");
    }
    if (src.includes("lab-vial-closeup")) {
      return tx("Vial close-up", "Primer plano del vial");
    }
    if (src.includes("lab-tube-tray")) {
      return tx("Lab tray", "Bandeja de laboratorio");
    }
    if (src.includes("lab-hand")) {
      return tx("Lab handling", "Manipulacion en laboratorio");
    }
    if (src.includes("brand-caps")) {
      return tx("Packaging detail", "Detalle de empaque");
    }
    if (src.includes("kpv-label")) {
      return tx("Label close-up", "Detalle de etiqueta");
    }
    if (src.includes("kpv-vial")) {
      return tx("Vial detail", "Detalle del vial");
    }
    return `${tx("View", "Vista")} ${index + 1}`;
  }

  function imagePresentationKind(image) {
    const src = String(image || "").toLowerCase();
    if (src.includes("/packshots/") || src.endsWith(".svg")) {
      return "packshot";
    }
    return "photo";
  }

  function availableProducts() {
    return PRODUCTS.filter((product) => product.status === "available");
  }

  function comingSoonProducts() {
    return PRODUCTS.filter((product) => product.status === "coming");
  }

  function bestSellerProducts() {
    return BEST_SELLER_SLUGS
      .map((slug) => PRODUCTS.find((product) => product.slug === slug))
      .filter((product) => product && product.status === "available");
  }

  function laneProducts(goalId, status = "all") {
    return PRODUCTS.filter((product) => {
      if (!productMatchesGoal(product, goalId)) {
        return false;
      }

      if (status === "all") {
        return true;
      }

      return product.status === status;
    });
  }

  function sortShopProducts(products) {
    const list = [...products];

    if (shopSort === "price-asc") {
      return list.sort((a, b) => (a.price || 0) - (b.price || 0));
    }

    if (shopSort === "price-desc") {
      return list.sort((a, b) => (b.price || 0) - (a.price || 0));
    }

    if (shopSort === "name") {
      return list.sort((a, b) => localize(a.name).localeCompare(localize(b.name), "en", { sensitivity: "base" }));
    }

    return list.sort((a, b) => {
      const availabilityDelta = Number(b.status === "available") - Number(a.status === "available");
      if (availabilityDelta !== 0) {
        return availabilityDelta;
      }

      const featuredDelta = Number(b.featured === true) - Number(a.featured === true);
      if (featuredDelta !== 0) {
        return featuredDelta;
      }

      return (b.price || 0) - (a.price || 0);
    });
  }

  function filteredShopProducts() {
    const term = shopQuery.trim().toLowerCase();

    return sortShopProducts(PRODUCTS.filter((product) => {
      const matchesAvailability = shopFilter === "all"
        || (shopFilter === "available" && product.status === "available")
        || (shopFilter === "coming" && product.status === "coming");
      const matchesGoal = productMatchesGoal(product, shopGoal);
      const haystack = `${localize(product.name)} ${product.dosage} ${product.status} ${productGoals(product).join(" ")}`.toLowerCase();
      return matchesAvailability && matchesGoal && (!term || haystack.includes(term));
    }));
  }

  function syncShopStateFromLocation() {
    if (getCurrentPage() !== "shop") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    shopGoal = validGoal(params.get("goal") || shopGoal);
    shopSort = validSort(params.get("sort") || shopSort);
    shopFilter = ["all", "available", "coming"].includes(params.get("availability"))
      ? params.get("availability")
      : shopFilter;

    if (params.has("q")) {
      shopQuery = params.get("q") || "";
    }
  }

  function writeShopStateToLocation() {
    if (getCurrentPage() !== "shop" || typeof history.replaceState !== "function") {
      return;
    }

    const params = new URLSearchParams();

    if (shopGoal !== "all") {
      params.set("goal", shopGoal);
    }

    if (shopSort !== "featured") {
      params.set("sort", shopSort);
    }

    if (shopFilter !== "all") {
      params.set("availability", shopFilter);
    }

    if (shopQuery.trim()) {
      params.set("q", shopQuery.trim());
    }

    const query = params.toString();
    history.replaceState({}, "", `shop.html${query ? `?${query}` : ""}`);
  }

  function shopGoalHref(goalId) {
    const goal = validGoal(goalId);
    return goal === "all" ? "shop.html" : `shop.html?goal=${goal}`;
  }

  function relatedProductsFor(product) {
    const goal = primaryGoal(product);
    const sameLane = PRODUCTS.filter((item) => item.slug !== product.slug && productMatchesGoal(item, goal));
    const remaining = PRODUCTS.filter((item) => item.slug !== product.slug && !productMatchesGoal(item, goal));

    return sortShopProducts(sameLane)
      .concat(sortShopProducts(remaining))
      .slice(0, 3);
  }

  function renderGoalCards() {
    return GOAL_COLLECTIONS
      .filter((goal) => goal.id !== "all")
      .map((goal, index) => {
        const available = laneProducts(goal.id, "available").length;
        const upcoming = laneProducts(goal.id, "coming").length;

        return `
          <a class="objective-card reveal${index % 2 ? " reveal-delay" : ""}" href="${shopGoalHref(goal.id)}">
            <span class="detail-label">${tx("Research lane", "Linea de investigacion")}</span>
            <strong>${localize(goal.label)}</strong>
            <p>${localize(goal.summary)}</p>
            <div class="objective-meta">
              <span>${available} ${tx("available", "disponibles")}</span>
              <span>${upcoming} ${tx("coming soon", "proximamente")}</span>
            </div>
          </a>
        `;
      })
      .join("");
  }

  function renderCompactProductRows(products) {
    return products.map((product) => `
      <a class="merch-row" href="product.html?slug=${product.slug}">
        <span class="merch-row-media">
          <img class="product-visual-image product-visual-image-${imagePresentationKind(product.image)}" src="${product.image}" alt="${localize(product.name)} ${product.dosage}">
        </span>
        <span class="merch-row-copy">
          <strong>${localize(product.name)} ${product.dosage}</strong>
          <small>${localize(goalConfig(primaryGoal(product)).label)}</small>
        </span>
        <span class="merch-row-meta">
          <strong>${productPriceLabel(product)}</strong>
          <small>${product.status === "available" ? tx("Ready now", "Listo ahora") : tx("Coming soon", "Proximamente")}</small>
        </span>
      </a>
    `).join("");
  }

  function renderShopGoalButtons() {
    return GOAL_COLLECTIONS.map((goal) => `
      <button
        type="button"
        class="goal-chip ${shopGoal === goal.id ? "is-active" : ""}"
        data-goal-filter="${goal.id}"
      >${localize(goal.label)}</button>
    `).join("");
  }

  function renderShopSortOptions() {
    return SHOP_SORT_OPTIONS.map((option) => `
      <option value="${option.id}" ${shopSort === option.id ? "selected" : ""}>${localize(option.label)}</option>
    `).join("");
  }

  function renderShopMeta(products) {
    const goal = goalConfig(shopGoal);
    const summary = shopGoal === "all"
      ? tx("Catalogue view across every active research lane.", "Vista del catalogo en todas las lineas activas de investigacion.")
      : localize(goal.summary);

    return `
      <div class="catalog-meta-copy">
        <strong class="catalog-meta-title">${products.length} ${tx("results", "resultados")}</strong>
        <span class="catalog-meta-subtitle">${summary}</span>
      </div>
      <div class="catalog-pills">
        <span class="catalog-pill">${tx("Availability", "Disponibilidad")}: ${shopFilter === "all" ? tx("All", "Todo") : shopFilter === "available" ? tx("Available", "Disponible") : tx("Coming soon", "Proximamente")}</span>
        <span class="catalog-pill">${tx("Lane", "Linea")}: ${localize(goal.label)}</span>
      </div>
    `;
  }

  function renderPurchaseFacts(product) {
    return `
      <div class="purchase-fact-grid">
        <div class="purchase-fact">
          <span>${tx("Batch linked", "Lote vinculado")}</span>
          <strong>${product.batch}</strong>
        </div>
        <div class="purchase-fact">
          <span>${tx("Latest analysis", "Ultimo analisis")}</span>
          <strong>${formatDate(product.coaDate)}</strong>
        </div>
        <div class="purchase-fact">
          <span>${tx("Dispatch target", "Objetivo de salida")}</span>
          <strong>${tx("24h target", "Objetivo 24h")}</strong>
        </div>
        <div class="purchase-fact">
          <span>${tx("Payment route", "Ruta de pago")}</span>
          <strong>${tx("ArionPay / USDT", "ArionPay / USDT")}</strong>
        </div>
      </div>
    `;
  }

  function renderHomePromiseCards() {
    const cards = [
      {
        label: tx("Why Customers Choose Primus", "Por que los clientes eligen Primus"),
        title: tx("Secure Cryptocurrency Payments", "Pagos seguros con criptomonedas"),
        copy: tx(
          "Customers stay on the store until order details are confirmed, then move into secure hosted payment with the exact payable amount shown clearly before funds are sent.",
          "Los clientes permanecen en la tienda hasta confirmar los detalles del pedido y despues pasan a un pago alojado seguro con el importe exacto visible antes de enviar fondos."
        )
      },
      {
        label: tx("Why Customers Choose Primus", "Por que los clientes eligen Primus"),
        title: tx("Fast Order Processing", "Procesamiento rapido del pedido"),
        copy: tx(
          "Delivery options, order totals, and post-payment routing are made visible early so serious buyers can move from product page to checkout with less hesitation.",
          "Las opciones de envio, los totales del pedido y el flujo tras el pago se muestran pronto para que compradores serios avancen con menos dudas."
        )
      },
      {
        label: tx("Why Customers Choose Primus", "Por que los clientes eligen Primus"),
        title: tx("Premium Product Standards", "Estandares premium de producto"),
        copy: tx(
          "Batch references, latest analysis dates, and cleaner product presentation keep quality assurance visible where customers make their buying decision.",
          "Las referencias de lote, las fechas del ultimo analisis y una presentacion mas limpia mantienen visible la garantia de calidad donde el cliente decide comprar."
        )
      },
      {
        label: tx("Why Customers Choose Primus", "Por que los clientes eligen Primus"),
        title: tx("Professional Customer Support", "Soporte profesional al cliente"),
        copy: tx(
          "Contact, shipping, and policy guidance stay visible across the store so buyers can resolve questions without breaking the checkout journey.",
          "El contacto, el envio y las politicas permanecen visibles en toda la tienda para resolver dudas sin romper el recorrido de compra."
        )
      },
      {
        label: tx("Why Customers Choose Primus", "Por que los clientes eligen Primus"),
        title: tx("Privacy-Focused Checkout", "Checkout centrado en la privacidad"),
        copy: tx(
          "From protected accounts to transparent payment steps, the store is structured to feel discreet, modern, and reliable for real customer use.",
          "Desde cuentas protegidas hasta pasos de pago transparentes, la tienda esta pensada para sentirse discreta, moderna y fiable para uso real."
        )
      }
    ];

    return cards.map((card, index) => `
      <article class="detail-card commerce-promise-card reveal${index % 2 ? " reveal-delay" : ""}">
        <span class="detail-label">${card.label}</span>
        <strong>${card.title}</strong>
        <p>${card.copy}</p>
      </article>
    `).join("");
  }

  function renderOrderJourneyCards() {
    const cards = [
      {
        step: tx("Step 1", "Paso 1"),
        title: tx("Choose the right product", "Elige el producto adecuado"),
        copy: tx(
          "Browse by research lane, compare dosage and batch context, and move into the cart only when the fit feels clear.",
          "Explora por linea de investigacion, compara dosificacion y contexto de lote, y pasa al carrito solo cuando la eleccion este clara."
        )
      },
      {
        step: tx("Step 2", "Paso 2"),
        title: tx("Review shipping and checkout details", "Revisa envio y detalles de checkout"),
        copy: tx(
          "Shipping options, order totals, and payment guidance stay visible before the secure handoff, reducing hesitation right before payment.",
          "Las opciones de envio, los totales del pedido y la guia de pago permanecen visibles antes de la entrega segura, reduciendo la duda justo antes del pago."
        )
      },
      {
        step: tx("Step 3", "Paso 3"),
        title: tx("Pay the exact amount on the hosted page", "Paga la cantidad exacta en la pagina alojada"),
        copy: tx(
          "ArionPay shows the exact USDT amount and network on the secure hosted payment page, then returns the customer to the store after confirmation.",
          "ArionPay muestra la cantidad exacta de USDT y la red en la pagina de pago segura alojada, y despues devuelve al cliente a la tienda tras la confirmacion."
        )
      }
    ];

    return cards.map((card, index) => `
      <article class="detail-card journey-card reveal${index % 2 ? " reveal-delay" : ""}">
        <span class="detail-label">${card.step}</span>
        <strong>${card.title}</strong>
        <p>${card.copy}</p>
      </article>
    `).join("");
  }

  function renderProductFaq(product) {
    const items = [
      {
        question: tx("Is this listing connected to a batch reference?", "Esta ficha esta conectada a una referencia de lote?"),
        answer: tx(
          `Yes. This product is presented with batch ${product.batch} and the latest analysis date of ${formatDate(product.coaDate)} so quality context stays visible before checkout.`,
          `Si. Este producto se presenta con el lote ${product.batch} y la fecha del ultimo analisis ${formatDate(product.coaDate)} para que el contexto de calidad permanezca visible antes del checkout.`
        )
      },
      {
        question: tx("How does payment work?", "Como funciona el pago?"),
        answer: tx(
          "The store keeps shipping and total review on-site first. ArionPay then opens a secure hosted payment page showing the exact USDT amount and network before the customer sends funds.",
          "La tienda mantiene primero la revision del envio y del total dentro del sitio. Despues ArionPay abre una pagina de pago segura alojada que muestra la cantidad exacta de USDT y la red antes de que el cliente envie fondos."
        )
      },
      {
        question: tx("When is dispatch handled?", "Cuando se gestiona el envio?"),
        answer: tx(
          "Available products are presented with a 24-hour dispatch target, and delivery options are shown before the customer reaches the payment handoff.",
          "Los productos disponibles se presentan con un objetivo de salida de 24 horas, y las opciones de entrega se muestran antes de que el cliente llegue a la entrega del pago."
        )
      },
      {
        question: tx("Can I contact support before ordering?", "Puedo contactar soporte antes de pedir?"),
        answer: tx(
          `Yes. Email ${SITE_EMAIL} for help with batch questions, shipping routes, or checkout concerns before you place the order.`,
          `Si. Escribe a ${SITE_EMAIL} para ayuda con dudas sobre lotes, rutas de envio o inquietudes del checkout antes de realizar el pedido.`
        )
      }
    ];

    return items.map((item) => `
      <article class="faq-item">
        <button class="faq-question" type="button" data-faq-button aria-expanded="false">${item.question}</button>
        <div class="faq-answer" hidden>
          <p>${item.answer}</p>
        </div>
      </article>
    `).join("");
  }

  function renderProductVisual(product, variant = "card") {
    const tone = productTone(product);
    const note = product.status === "available"
      ? tx("HPLC-tested batch presentation", "Presentación de lote analizado por HPLC")
      : tx("Launch batch arriving soon", "Lote de lanzamiento próximamente");
    const trust = product.status === "available"
      ? tx("COA ready", "COA listo")
      : tx("Coming May", "Llega en mayo");
    const imageKind = imagePresentationKind(product.image);

    return `
      <figure class="product-visual product-visual-${variant} product-visual-${imageKind}" style="--visual-primary:${tone.primary}; --visual-soft:${tone.soft}; --visual-shadow:${tone.shadow};">
        <div class="product-visual-stage product-visual-stage-${imageKind}">
          <span class="product-visual-glow" aria-hidden="true"></span>
          <span class="product-visual-badge">${product.dosage}</span>
          <div class="product-visual-info">
            <span class="product-visual-code">${productCode(product)}</span>
            <strong>${localize(product.name)}</strong>
            <small>${tx("Research series", "Serie investigación")}</small>
          </div>
          <div class="product-visual-label-card">
            <span>${tx("Batch", "Lote")}</span>
            <strong>${product.batch}</strong>
            <small>${tx("Peptide line", "Línea peptídica")}</small>
          </div>
          <img class="product-visual-image product-visual-image-${imageKind}" src="${product.image}" alt="${localize(product.name)} ${product.dosage}">
        </div>
        <figcaption class="product-visual-caption">
          <strong>${trust}</strong>
          <span>${note}</span>
        </figcaption>
      </figure>
    `;
  }

  function checkoutDraftFromForm(form) {
    const data = new FormData(form);
    const country = countryConfig(data.get("country")).code;
    return {
      firstName: String(data.get("firstName") || "").trim(),
      lastName: String(data.get("lastName") || "").trim(),
      email: String(data.get("email") || "").trim(),
      phone: String(data.get("phone") || "").trim(),
      company: String(data.get("company") || "").trim(),
      country,
      state: normalizeRegion(country, String(data.get("state") || "").trim()),
      city: String(data.get("city") || "").trim(),
      postalCode: String(data.get("postalCode") || "").trim(),
      address: String(data.get("address") || "").trim(),
      addressLine2: String(data.get("addressLine2") || "").trim(),
      notes: String(data.get("notes") || "").trim(),
      shippingMethod: String(data.get("shippingMethod") || "eu-standard"),
      paymentMethod: String(data.get("paymentMethod") || "USDT_TRC20"),
      paymentCurrency: String(data.get("paymentCurrency") || "USDT_TRC20"),
      marketingOptIn: data.get("marketingOptIn") === "on",
      createAccount: data.get("createAccount") === "on",
      alternateShipping: data.get("alternateShipping") === "on",
      ageConfirmed: data.get("ageConfirmed") === "on",
      exactAmountConfirmed: data.get("exactAmountConfirmed") === "on"
    };
  }

  function renderCountryOptions(currentValue) {
    const currentCode = countryConfig(currentValue).code;
    return CHECKOUT_COUNTRIES.map((item) => `
      <option value="${item.code}" ${item.code === currentCode ? "selected" : ""}>${localize(item.label)}</option>
    `).join("");
  }

  function renderStateOptions(countryValue, currentState) {
    return regionOptions(countryValue).map((region) => `
      <option value="${region}" ${region === normalizeRegion(countryValue, currentState) ? "selected" : ""}>${region}</option>
    `).join("");
  }

  function renderCheckoutToggle(name, label, checked) {
    return `
      <label class="checkout-toggle">
        <input type="checkbox" name="${name}" ${checked ? "checked" : ""}>
        <span>${label}</span>
      </label>
    `;
  }

  function renderDeliveryOption(option, currentId, total) {
    const price = deliveryPrice(option, total);
    return `
      <label class="checkout-option ${currentId === option.id ? "is-selected" : ""}">
        <div class="checkout-option-head">
          <div>
            <div class="checkout-option-title">${localize(option.label)}</div>
            <div class="checkout-option-copy">${localize(option.note)}</div>
          </div>
          <input type="radio" name="shippingMethod" value="${option.id}" ${currentId === option.id ? "checked" : ""}>
        </div>
        <p class="checkout-note">${localize(option.eta)} · ${price === 0 ? tx("Free", "Gratis") : formatPrice(price)}</p>
      </label>
    `;
  }

  function renderPaymentOption(option, currentId) {
    return `
      <label class="checkout-option ${currentId === option.id ? "is-selected" : ""}">
        <div class="checkout-option-head">
          <div>
            <div class="checkout-option-title">${localize(option.label)}</div>
            <div class="checkout-option-copy">${localize(option.note)}</div>
          </div>
          <input type="radio" name="paymentMethod" value="${option.id}" ${currentId === option.id ? "checked" : ""}>
        </div>
      </label>
    `;
  }

  function renderSidebarDeliveryChoice(option, currentId, total) {
    const price = deliveryPrice(option, total);
    return `
      <label class="checkout-choice ${currentId === option.id ? "is-selected" : ""}" data-choice-card data-choice-name="shippingMethod" data-choice-value="${option.id}">
        <input type="radio" name="shippingMethod" value="${option.id}" form="checkout-form" ${currentId === option.id ? "checked" : ""}>
        <div class="checkout-choice-copy">
          <strong>${localize(option.label)}</strong>
          <span>${localize(option.note)}</span>
          <small>${localize(option.eta)} · ${price === 0 ? tx("Free", "Gratis") : formatPrice(price)}</small>
        </div>
      </label>
    `;
  }

  function renderSidebarPaymentChoice(option, currentId) {
    const activeCurrency = selectedCryptoCurrency();

    return `
      <div class="checkout-choice checkout-choice-payment ${currentId === option.id ? "is-selected" : ""}">
        <div class="checkout-choice-copy">
          <strong>ArionPay</strong>
          <span>${localize(option.note)}</span>
          <div class="checkout-payment-icons">
            <span>${activeCurrency.shortLabel}</span>
            <span>TRC20</span>
          </div>
        </div>
      </div>
    `;
  }

  function checkoutSubmitLabel(payment) {
    return tx("Continue to Secure Crypto Payment", "Continuar al pago seguro con criptomonedas");
  }

  function checkoutPendingStatus(payment) {
    return tx("Creating your secure ArionPay invoice in this tab...", "Creando tu factura segura de ArionPay en esta pestana...");
  }

  function checkoutHelperCopy(payment, cart = []) {
    return tx(
      "You will continue to the secure ArionPay page in this tab. The order stays in EUR here, and the next page will show the exact USDT amount to send for automatic confirmation.",
      "Continuaras a la pagina segura de ArionPay en esta pestana. El pedido se mantiene en EUR aqui y la siguiente pagina mostrara la cantidad exacta de USDT que debes enviar para la confirmacion automatica."
    );
  }

  function exactAmountConfirmationPrompt() {
    return tx(
      "Please confirm that you will pay the exact USDT amount shown on the next page before continuing.",
      "Confirma que pagaras la cantidad exacta de USDT mostrada en la pagina siguiente antes de continuar."
    );
  }

  function legalAgeConfirmationPrompt() {
    return tx(
      "Please confirm the research-use, legal-age, and policy agreement before continuing.",
      "Confirma el uso de investigacion, la mayoria de edad y la aceptacion de politicas antes de continuar."
    );
  }

  function renderExactAmountGuidance() {
    return `
      <div class="checkout-side-section">
        <p class="checkout-eyebrow">${tx("Before secure payment", "Antes del pago seguro")}</p>
        <div class="checkout-precision-card">
          <strong>${tx("Please send the exact USDT amount shown on the next page. Do not round the number.", "Por favor, envia la cantidad exacta de USDT mostrada en la pagina siguiente. No redondees el numero.")}</strong>
          <p>${tx("Your order review stays in EUR on the store for clarity. ArionPay will display the precise USDT amount and network to use before you pay.", "El resumen del pedido se mantiene en EUR dentro de la tienda para mayor claridad. ArionPay mostrara la cantidad exacta de USDT y la red que debes usar antes de pagar.")}</p>
        </div>
        <div class="checkout-tip-card">
          <span class="checkout-tip-title">${tx("Payment tip", "Consejo de pago")}</span>
          <ul class="checkout-tip-list">
            <li>${tx("Copy the exact amount from the ArionPay page.", "Copia la cantidad exacta desde la pagina de ArionPay.")}</li>
            <li>${tx("Include the decimals exactly as shown.", "Incluye los decimales exactamente como se muestran.")}</li>
            <li>${tx("Use the correct network: USDT on TRC20.", "Usa la red correcta: USDT en TRC20.")}</li>
            <li>${tx("Underpayment can delay automatic confirmation.", "Un pago incompleto puede retrasar la confirmacion automatica.")}</li>
          </ul>
        </div>
      </div>
    `;
  }

  function renderExactAmountReturnNotice() {
    return `
      <div class="checkout-note-panel checkout-note-panel-precision">
        <strong>${tx("Automatic confirmation", "Confirmacion automatica")}</strong>
        <p>${tx("Exact payment amounts are confirmed automatically for a smooth order process.", "Los importes exactos se confirman automaticamente para un proceso de pedido mas fluido.")}</p>
      </div>
    `;
  }

  function singleItemCartEntry(cart) {
    if (!Array.isArray(cart) || cart.length !== 1) {
      return null;
    }

    const [entry] = cart;
    if (!entry || !entry.slug || Number(entry.quantity) !== 1) {
      return null;
    }

    return entry;
  }

  function hostedCryptoCheckoutState(payment, cart, shipping, paymentCurrencyId) {
    if (!Array.isArray(cart) || !cart.length) {
      return {
        ready: false,
        url: "",
        reason: tx(
          "Add at least one product before starting cryptocurrency checkout.",
          "Agrega al menos un producto antes de iniciar el checkout con criptomonedas."
        )
      };
    }

    const selectedCurrency = CRYPTO_CURRENCY_OPTIONS.find((item) => item.id === paymentCurrencyId) || CRYPTO_CURRENCY_OPTIONS[0];

    if (!selectedCurrency.live) {
      return {
        ready: false,
        url: "",
        reason: tx(
          "This cryptocurrency option is not active yet. Choose USDT when available.",
          "Esta opcion de criptomoneda aun no esta activa. Elige USDT cuando este disponible."
        )
      };
    }

    return { ready: true, url: "", reason: "" };
  }

  function syncCheckoutUi() {
    const submitButton = document.querySelector("[data-checkout-submit]");
    const statusNode = document.querySelector("[data-checkout-status]");
    const cart = readCart();
    const shipping = selectedDelivery(subtotal(cart));

    const payment = selectedPayment();
    const cryptoCurrency = selectedCryptoCurrency();
    const cryptoState = hostedCryptoCheckoutState(payment, cart, shipping, cryptoCurrency.id);
    const exactAmountCheckbox = document.querySelector('[data-exact-amount-confirmation]');
    const ageConfirmationCheckbox = document.querySelector('[name="ageConfirmed"][form="checkout-form"]');
    const exactAmountConfirmed = !exactAmountCheckbox || exactAmountCheckbox.checked;
    const ageConfirmed = !ageConfirmationCheckbox || ageConfirmationCheckbox.checked;

    if (submitButton) {
      submitButton.textContent = checkoutSubmitLabel(payment);
      submitButton.disabled = !cryptoState.ready || !exactAmountConfirmed || !ageConfirmed;
    }

    if (statusNode) {
      statusNode.textContent = !cryptoState.ready
        ? cryptoState.reason
        : (!exactAmountConfirmed
          ? exactAmountConfirmationPrompt()
          : (!ageConfirmed ? legalAgeConfirmationPrompt() : checkoutHelperCopy(payment, cart)));
    }
  }

  function authFormStatus(message, tone = "muted") {
    return `<p class="auth-form-status auth-form-status-${tone}${message ? "" : " is-empty"}" data-auth-form-status>${message || ""}</p>`;
  }

  function setAuthFormStatus(node, message, tone = "muted") {
    if (!node) {
      return;
    }

    node.textContent = message || "";
    node.className = `auth-form-status auth-form-status-${tone}${message ? "" : " is-empty"}`;
  }

  function authField(label, inputMarkup, hint = "") {
    return `
      <label class="auth-field">
        <span>${label}</span>
        ${inputMarkup}
        ${hint ? `<small>${hint}</small>` : ""}
      </label>
    `;
  }

  function renderAuthPanel(config) {
    return `
      <article class="panel panel-dark auth-panel">
        <p class="panel-kicker">${config.kicker}</p>
        <h1>${config.title}</h1>
        <p class="lead">${config.body}</p>
        <div class="auth-panel-points">
          ${config.points.map((point) => `
            <div class="auth-panel-point">
              <strong>${point.title}</strong>
              <span>${point.body}</span>
            </div>
          `).join("")}
        </div>
      </article>
    `;
  }

  function renderLoginPage() {
    if (authSessionState.status === "authenticated" && authSessionState.user) {
      const nextUrl = authNextUrl("account.html");
      scheduleAuthNavigation(nextUrl);

      return `
        <section class="page-hero page-hero-auth">
          <div class="container">
            <div class="auth-redirect-card empty-state">
              <h1>${tx("You are already signed in.", "Ya has iniciado sesion.")}</h1>
              <p>${tx("Opening your customer account now.", "Abriendo tu cuenta de cliente ahora.")}</p>
              <div class="cta-row-inline">
                <a class="btn btn-primary" href="${nextUrl}">${tx("Open account", "Abrir cuenta")}</a>
              </div>
            </div>
          </div>
        </section>
      `;
    }

    clearAuthNavigation();

    return `
      <section class="page-hero page-hero-auth">
        <div class="container auth-grid">
          ${renderAuthPanel({
            kicker: tx("Access Your Account", "Accede a tu cuenta"),
            title: tx("Access Your Account", "Accede a tu cuenta"),
            body: tx(
              "Review your profile, reconnect eligible guest orders by email, and manage your order history from one protected customer area.",
              "Revisa tu perfil, vincula pedidos compatibles por email y gestiona tu historial desde un area protegida."
            ),
            points: [
              {
                title: tx("Secure sessions", "Sesiones seguras"),
                body: tx("Server-side session cookies keep login state out of localStorage.", "Las cookies de sesion del lado del servidor mantienen el acceso fuera de localStorage.")
              },
              {
                title: tx("Order history", "Historial de pedidos"),
                body: tx("Orders placed as a guest are linked automatically when the email matches.", "Los pedidos como invitado se vinculan automaticamente cuando coincide el email.")
              },
              {
                title: tx("Protected account", "Cuenta protegida"),
                body: tx("Only signed-in customers can view the profile and account order feed.", "Solo los clientes autenticados pueden ver el perfil y el historial de pedidos.")
              }
            ]
          })}
          <article class="contact-card auth-card">
            <div class="section-header">
              <p class="section-kicker">${tx("Access Your Account", "Accede a tu cuenta")}</p>
              <h2>${tx("Secure sign-in", "Acceso seguro")}</h2>
            </div>
            <form class="auth-form" data-login-form novalidate>
              ${authField(
                tx("Email address", "Correo electronico"),
                `<input class="search-input auth-input" type="email" name="email" autocomplete="email" required placeholder="name@example.com">`
              )}
              ${authField(
                tx("Password", "Contrasena"),
                `<input class="search-input auth-input" type="password" name="password" autocomplete="current-password" required minlength="8" placeholder="${tx("Enter your password", "Introduce tu contrasena")}">`
              )}
              ${authFormStatus(authSessionState.status === "error" ? authSessionState.error : "")}
              <div class="checkout-action-stack auth-action-stack">
                <button class="btn btn-primary btn-block" type="submit" data-auth-submit>${tx("Access Your Account", "Accede a tu cuenta")}</button>
                <a class="btn btn-secondary btn-block" href="${registerPageHref(authNextUrl("account.html"))}">${tx("Create Account", "Crear cuenta")}</a>
              </div>
              <p class="helper-copy">${tx("Use the same email address you used during checkout to pull eligible guest orders into your account automatically.", "Usa el mismo correo electronico que utilizaste durante el checkout para vincular automaticamente los pedidos de invitado compatibles.")}</p>
            </form>
          </article>
        </div>
      </section>
    `;
  }

  function renderRegisterPage() {
    if (authSessionState.status === "authenticated" && authSessionState.user) {
      const nextUrl = authNextUrl("account.html");
      scheduleAuthNavigation(nextUrl);

      return `
        <section class="page-hero page-hero-auth">
          <div class="container">
            <div class="auth-redirect-card empty-state">
              <h1>${tx("Your account is already active.", "Tu cuenta ya esta activa.")}</h1>
              <p>${tx("Opening your customer account now.", "Abriendo tu cuenta de cliente ahora.")}</p>
              <div class="cta-row-inline">
                <a class="btn btn-primary" href="${nextUrl}">${tx("Open account", "Abrir cuenta")}</a>
              </div>
            </div>
          </div>
        </section>
      `;
    }

    clearAuthNavigation();

    return `
      <section class="page-hero page-hero-auth">
        <div class="container auth-grid">
          ${renderAuthPanel({
            kicker: tx("Create Your Customer Account", "Crea tu cuenta de cliente"),
            title: tx("Create Your Customer Account", "Crea tu cuenta de cliente"),
            body: tx(
              "Create a protected customer account to save your profile, reconnect eligible guest orders, and return to a cleaner order-history view anytime.",
              "Crea una cuenta protegida para guardar tu perfil, vincular pedidos compatibles y volver a un historial mas claro cuando quieras."
            ),
            points: [
              {
                title: tx("Password hashing", "Hashing de contrasena"),
                body: tx("Passwords are stored with one-way hashing on the server, never in plain text.", "Las contrasenas se almacenan con hashing unidireccional en el servidor, nunca en texto plano.")
              },
              {
                title: tx("Durable account records", "Registros duraderos"),
                body: tx("Account and session records use the same durable store pattern as the order system.", "Las cuentas y sesiones usan el mismo patron de almacenamiento duradero que el sistema de pedidos.")
              },
              {
                title: tx("Order linking", "Vinculacion de pedidos"),
                body: tx("Existing guest orders are linked by matching the account email when available.", "Los pedidos de invitado existentes se vinculan cuando coincide el correo de la cuenta.")
              }
            ]
          })}
          <article class="contact-card auth-card">
            <div class="section-header">
              <p class="section-kicker">${tx("Create Your Customer Account", "Crea tu cuenta de cliente")}</p>
              <h2>${tx("Open your secure account", "Abre tu cuenta segura")}</h2>
            </div>
            <form class="auth-form" data-register-form novalidate>
              ${authField(
                tx("Full name", "Nombre completo"),
                `<input class="search-input auth-input" type="text" name="fullName" autocomplete="name" required minlength="3" maxlength="120" placeholder="${tx("Full legal name", "Nombre completo")}">`
              )}
              ${authField(
                tx("Email address", "Correo electronico"),
                `<input class="search-input auth-input" type="email" name="email" autocomplete="email" required placeholder="name@example.com">`
              )}
              <div class="auth-field-grid">
                ${authField(
                  tx("Password", "Contrasena"),
                  `<input class="search-input auth-input" type="password" name="password" autocomplete="new-password" required minlength="8" placeholder="${tx("At least 8 characters", "Minimo 8 caracteres")}">`
                )}
                ${authField(
                  tx("Confirm password", "Confirmar contrasena"),
                  `<input class="search-input auth-input" type="password" name="confirmPassword" autocomplete="new-password" required minlength="8" placeholder="${tx("Repeat your password", "Repite tu contrasena")}">`
                )}
              </div>
              ${authFormStatus("")}
              <div class="checkout-action-stack auth-action-stack">
                <button class="btn btn-primary btn-block" type="submit" data-auth-submit>${tx("Create Account", "Crear cuenta")}</button>
                <a class="btn btn-secondary btn-block" href="${loginPageHref(authNextUrl("account.html"))}">${tx("Already have an account?", "Ya tienes una cuenta?")}</a>
              </div>
              <p class="helper-copy">${tx("Use the same email address you have already used for orders if you want previous guest purchases to appear in your account automatically.", "Utiliza el mismo correo con el que ya hayas hecho pedidos si quieres que las compras anteriores como invitado aparezcan en tu cuenta automaticamente.")}</p>
            </form>
          </article>
        </div>
      </section>
    `;
  }

  function renderAccountOrderItem(item) {
    const product = item && item.slug ? PRODUCTS.find((entry) => entry.slug === item.slug) : null;
    const productName = text(item && item.name) || (product ? `${localize(product.name)} ${product.dosage}` : tx("Product", "Producto"));
    const quantity = Number(item && item.quantity) || 0;
    const lineTotal = Number(item && item.lineTotal);

    return `
      <div class="order-line-item">
        <div>
          <strong>${productName}</strong>
          <p>${tx("Qty", "Cant.")}: ${quantity || 1}</p>
        </div>
        <strong>${Number.isFinite(lineTotal) && lineTotal > 0 ? formatPrice(lineTotal) : tx("Tracked", "Registrado")}</strong>
      </div>
    `;
  }

  function renderAccountOrderCard(order) {
    return `
      <article class="summary-card account-order-card">
        <div class="account-order-head">
          <div>
            <p class="detail-label">${tx("Order reference", "Referencia del pedido")}</p>
            <h3>${text(order.reference)}</h3>
          </div>
          <span class="status-pill ${accountStatusTone(order)}">${accountStatusLabel(order)}</span>
        </div>
        <div class="order-meta-grid">
          <div class="detail-card">
            <span class="detail-label">${tx("Created", "Creado")}</span>
            <strong>${formatDate(order.createdAt)}</strong>
          </div>
          <div class="detail-card">
            <span class="detail-label">${tx("Total", "Total")}</span>
            <strong>${formatPrice(Number(order.total || 0))}</strong>
          </div>
          <div class="detail-card">
            <span class="detail-label">${tx("Current status", "Estado actual")}</span>
            <strong>${accountStatusLabel(order)}</strong>
            <small>${accountOrderSummary(order) || tx("Store status synced from the latest payment and webhook updates.", "Estado de tienda sincronizado con el ultimo pago y las actualizaciones del webhook.")}</small>
          </div>
        </div>
        <div class="summary-divider"></div>
        <div class="order-line-items">
          ${(Array.isArray(order.items) ? order.items : []).map(renderAccountOrderItem).join("")}
        </div>
      </article>
    `;
  }

  function renderAccountPage() {
    if (authSessionState.status === "idle" || authSessionState.status === "loading") {
      return `
        <section class="page-hero page-hero-auth">
          <div class="container">
            <div class="empty-state auth-redirect-card">
              <h1>${tx("Checking your secure session...", "Comprobando tu sesion segura...")}</h1>
              <p>${tx("Loading your customer profile and linked order history.", "Cargando tu perfil de cliente y el historial de pedidos vinculado.")}</p>
            </div>
          </div>
        </section>
      `;
    }

    if (authSessionState.status !== "authenticated" || !authSessionState.user) {
      scheduleAuthNavigation(loginPageHref("account.html"), 700);

      return `
        <section class="page-hero page-hero-auth">
          <div class="container">
            <div class="empty-state auth-redirect-card">
              <h1>${tx("Login required", "Acceso requerido")}</h1>
              <p>${tx("This customer area is protected. Redirecting you to the secure login page now.", "Esta area de cliente esta protegida. Redirigiendo ahora a la pagina segura de acceso.")}</p>
              <div class="cta-row-inline">
                <a class="btn btn-primary" href="${loginPageHref("account.html")}">${tx("Go to login", "Ir al acceso")}</a>
              </div>
            </div>
          </div>
        </section>
      `;
    }

    clearAuthNavigation();

    if (accountOrdersState.status === "idle" && !accountOrdersRequest) {
      void loadAccountOrders({ rerender: true });
    }

    const user = authSessionState.user;
    const orders = Array.isArray(accountOrdersState.orders) ? accountOrdersState.orders : [];
    const latestOrder = orders[0] || null;
    const orderHistoryMarkup = accountOrdersState.status === "loading"
      ? `<div class="empty-state"><h3>${tx("Loading order history...", "Cargando historial...")}</h3><p>${tx("Matching any existing guest orders to your account email.", "Vinculando pedidos existentes de invitado con el correo de tu cuenta.")}</p></div>`
      : accountOrdersState.status === "error"
        ? `<div class="empty-state"><h3>${tx("Unable to load order history", "No se pudo cargar el historial")}</h3><p>${accountOrdersState.error}</p></div>`
        : orders.length
          ? orders.map(renderAccountOrderCard).join("")
          : `<div class="empty-state"><h3>${tx("No orders linked yet", "Aun no hay pedidos vinculados")}</h3><p>${tx("When an order uses the same email address as this account, it will appear here automatically.", "Cuando un pedido utilice el mismo correo que esta cuenta, aparecera aqui automaticamente.")}</p></div>`;

    return `
      <section class="page-hero page-hero-auth">
        <div class="container section-stack">
          <div class="section-header reveal">
            <p class="section-kicker">${tx("Your Customer Dashboard", "Tu panel de cliente")}</p>
            <h1>${tx("Your Customer Dashboard", "Tu panel de cliente")}</h1>
            <p class="lead">${tx("Review profile details, linked orders, and current order status from one protected customer area.", "Revisa el perfil, los pedidos vinculados y el estado actual desde un area protegida.")}</p>
          </div>
          <div class="account-grid">
            <article class="contact-card account-card">
              <div class="section-header">
                <p class="section-kicker">${tx("Profile", "Perfil")}</p>
                <h2>${user.fullName}</h2>
              </div>
              <div class="detail-grid">
                <div class="detail-card">
                  <span class="detail-label">${tx("Email", "Correo")}</span>
                  <strong>${user.email}</strong>
                </div>
                <div class="detail-card">
                  <span class="detail-label">${tx("Member since", "Cliente desde")}</span>
                  <strong>${formatDate(user.createdAt)}</strong>
                </div>
                <div class="detail-card">
                  <span class="detail-label">${tx("Last login", "Ultimo acceso")}</span>
                  <strong>${formatDate(user.lastLoginAt || user.updatedAt || user.createdAt)}</strong>
                </div>
              </div>
              <div class="cta-row-inline">
                <a class="btn btn-secondary" href="shop.html">${tx("Browse Products", "Ver productos")}</a>
                <button class="btn btn-primary" type="button" data-logout-action>${tx("Logout", "Cerrar sesion")}</button>
              </div>
            </article>
            <article class="summary-card account-card">
              <div class="section-header">
                <p class="section-kicker">${tx("Current order status", "Estado actual")}</p>
                <h2>${latestOrder ? latestOrder.reference : tx("No active order", "Sin pedido activo")}</h2>
              </div>
              ${latestOrder ? `
                <div class="detail-grid">
                  <div class="detail-card">
                    <span class="detail-label">${tx("Status", "Estado")}</span>
                    <strong>${accountStatusLabel(latestOrder)}</strong>
                  </div>
                  <div class="detail-card">
                    <span class="detail-label">${tx("Total", "Total")}</span>
                    <strong>${formatPrice(Number(latestOrder.total || 0))}</strong>
                  </div>
                  <div class="detail-card">
                    <span class="detail-label">${tx("Updated", "Actualizado")}</span>
                    <strong>${formatDate(latestOrder.lastWebhookAt || latestOrder.createdAt)}</strong>
                  </div>
                </div>
                <p class="helper-copy">${accountOrderSummary(latestOrder) || tx("Your latest order status is pulled from the stored order record and payment confirmation events.", "El estado del ultimo pedido se obtiene del registro guardado del pedido y de los eventos de confirmacion de pago.")}</p>
              ` : `
                <p class="helper-copy">${tx("Once you place an order with this email address, the latest status will appear here automatically.", "Cuando realices un pedido con este correo electronico, el ultimo estado aparecera aqui automaticamente.")}</p>
              `}
            </article>
          </div>
          <section class="section-stack">
            <div class="section-header">
              <p class="section-kicker">${tx("Order history", "Historial de pedidos")}</p>
              <h2>${tx("Linked orders", "Pedidos vinculados")}</h2>
            </div>
            <div class="stack-sm">
              ${orderHistoryMarkup}
            </div>
          </section>
        </div>
      </section>
    `;
  }

  renderHeader = function () {
    const host = document.querySelector("[data-site-header]");

    if (!host) {
      return;
    }

    const page = getCurrentPage();
    const navLinks = NAV_ITEMS.map((item) => `
      <a class="${page === item.key ? "is-current" : ""}" href="${item.href}">${pick(COPY.nav[item.key])}</a>
    `).join("");
    const chips = PAYMENT_METHODS.map((item) => `<span class="payment-chip">${item}</span>`).join("");
    const isAuthenticated = authSessionState.status === "authenticated" && authSessionState.user;
    const authActions = isAuthenticated
      ? `
        <div class="header-account-actions">
          <a class="header-auth-link ${page === "account" ? "is-current" : ""}" href="account.html">${tx("Account Dashboard", "Panel de cuenta")}</a>
          <button class="header-auth-link header-auth-button" type="button" data-logout-action>${tx("Logout", "Cerrar sesion")}</button>
        </div>
      `
      : `
        <div class="header-account-actions">
          <a class="header-auth-link ${page === "login" ? "is-current" : ""}" href="${loginPageHref("account.html")}">${tx("Access Your Account", "Accede a tu cuenta")}</a>
          <a class="header-auth-link header-auth-link-primary ${page === "register" ? "is-current" : ""}" href="${registerPageHref("account.html")}">${tx("Create Account", "Crear cuenta")}</a>
        </div>
      `;

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
            ${authActions}
            <a class="cart-link" href="cart.html">${pick(COPY.shell.cartLabel)} <span class="cart-badge" data-cart-count>0</span></a>
          </div>
        </header>
      </div>
    `;
  };

  renderFooter = function () {
    const host = document.querySelector("[data-site-footer]");

    if (!host) {
      return;
    }

    const mainLinks = NAV_ITEMS.map((item) => `<a href="${item.href}">${localize(COPY.nav[item.key])}</a>`).join("");
    const payments = ACTIVE_PAYMENT_OPTIONS.map((item) => `<span class="payment-chip">${item.chip || item.label}</span>`).join("");

    host.innerHTML = `
      <footer class="site-footer">
        <div class="container footer-grid footer-grid-enhanced">
          <div class="footer-column">
            <a class="footer-brand" href="index.html" aria-label="Primus Peptides home">
              <img class="brand-logo" src="${BRAND_LOGO_SRC}" alt="Primus Peptides">
            </a>
            <p class="footer-copy">${tx(
              "Built for modern customers seeking secure premium ecommerce.",
              "Pensado para clientes modernos que buscan un ecommerce premium y seguro."
            )}</p>
            <p class="footer-note">${tx(
              "For laboratory research use only.",
              "Solo para uso de investigacion en laboratorio."
            )}</p>
            <div class="footer-assurance">
              <span>${tx("Secure Crypto Payments", "Pagos crypto seguros")}</span>
              <span>${tx("Protected Accounts", "Cuentas protegidas")}</span>
              <span>${tx("24h Dispatch Target", "Objetivo de salida 24h")}</span>
            </div>
          </div>
          <div class="footer-column">
            <div class="footer-title">${tx("Store", "Tienda")}</div>
            <div class="footer-links">${mainLinks}<a href="checkout.html">${localize(COPY.labels.checkout)}</a></div>
          </div>
          <div class="footer-column">
            <div class="footer-title">${tx("Policies", "Políticas")}</div>
            <div class="footer-links footer-policy-links">${renderPolicyLinkList(getCurrentPage())}</div>
          </div>
          <div class="footer-column">
            <div class="footer-title">${tx("Support", "Soporte")}</div>
            <a href="mailto:${SITE_EMAIL}">${SITE_EMAIL}</a>
            <p class="footer-note">${tx("EU dispatch target: 24h", "Objetivo de salida UE: 24h")}</p>
            <p class="footer-note">${tx("Payments: USDT", "Pagos: USDT")}</p>
            <div class="footer-payments">${payments}</div>
          </div>
        </div>
        <p class="footer-meta">Primus Peptides | ${SITE_DOMAIN} | ${new Date().getFullYear()}</p>
      </footer>
    `;
  };

  function renderEnhancedHomePage() {
    const featured = PRODUCTS.filter((product) => product.featured)
      .map((product, index) => renderProductCard(product, { delay: index % 2 === 1 }))
      .join("");

    return `
      <section class="hero-home">
        <div class="container hero-grid">
          <div class="hero-copy reveal">
            <p class="kicker">${tx("Secure Access to High-Quality Research Compounds", "Acceso seguro a compuestos de alta calidad")}</p>
            <h1>${tx(
              "Premium Research Products With Secure Crypto Checkout",
              "Productos premium de investigacion con checkout crypto seguro"
            )}</h1>
            <p class="lead">${tx(
              "Built for buyers who value quality, privacy, and a smoother purchasing experience.",
              "Pensado para compradores que valoran calidad, privacidad y una experiencia de compra mas fluida."
            )}</p>
            <div class="hero-actions">
              <a class="btn btn-primary" href="shop.html">${tx("Shop Now", "Comprar ahora")}</a>
              <a class="btn btn-secondary" href="#featured-products">${tx("Browse Products", "Ver productos")}</a>
            </div>
            <div class="hero-trust">
              <div class="trust-chip"><strong>${localize(COPY.labels.hplc)}</strong></div>
              <div class="trust-chip"><strong>${localize(COPY.labels.shipped)}</strong></div>
              <div class="trust-chip"><strong>${localize(COPY.labels.freeShipping)}</strong></div>
            </div>
          </div>
          <div class="hero-stack reveal reveal-delay">
            <article class="panel panel-dark">
              <p class="panel-kicker">${tx("Built for Customer Confidence", "Pensado para generar confianza")}</p>
              <h2>${tx(
                "From secure payments to protected accounts and transparent checkout flow, every part of the store is designed to create trust.",
                "Desde pagos seguros hasta cuentas protegidas y un checkout transparente, toda la tienda esta pensada para crear confianza."
              )}</h2>
              <div class="metric-grid">
                <div class="metric-card"><strong>11</strong><small>${tx("live products", "productos activos")}</small></div>
                <div class="metric-card"><strong>EN / ES</strong><small>${tx("full bilingual flow", "flujo bilingüe completo")}</small></div>
                <div class="metric-card"><strong>24h</strong><small>${tx("dispatch target", "objetivo de salida")}</small></div>
              </div>
            </article>
            <article class="hero-visual reveal">
              <img src="${IMAGE_SET[0]}" alt="Primus Peptides product visual">
              <div class="overlay-card">${tx(
                "White-background vial visuals, minimal shadows, and shorter decisions between trust, product, and checkout.",
                "Viales sobre fondo blanco, sombras mínimas y menos pasos entre confianza, producto y checkout."
              )}</div>
            </article>
          </div>
        </div>
      </section>
      <section class="section section-tight">
        <div class="container trust-grid hero-signal-strip">${renderTrustCards()}</div>
      </section>
      <section class="section" id="featured-products">
        <div class="container">
          <div class="section-header reveal">
            <p class="section-kicker">${tx("Shop Premium Research Categories", "Compra categorias premium de investigacion")}</p>
            <h2 class="section-title">${tx(
              "Find the right products with a cleaner catalog built for fast browsing.",
              "Encuentra el producto adecuado con un catalogo mas limpio y facil de recorrer."
            )}</h2>
          </div>
          <div class="catalog-grid">${featured}</div>
        </div>
      </section>
      <section class="section section-dark">
        <div class="container section-stack">
          <div class="section-header reveal">
            <p class="section-kicker">${tx("Why Customers Choose Primus", "Por que los clientes eligen Primus")}</p>
            <h2 class="section-title">${tx(
              "Operational confidence is built into the storefront before a buyer ever reaches payment.",
              "La confianza operativa esta integrada en la tienda antes de que el comprador llegue al pago."
            )}</h2>
          </div>
          <div class="service-grid">${renderServiceCards()}</div>
        </div>
      </section>
      <section class="section section-tight">
        <div class="container shipping-layout">
          <article class="shipping-card reveal">
            <div class="section-header">
              <p class="section-kicker">${tx("Shipping clarity", "Claridad de envíos")}</p>
              <h2 class="section-title">${tx("Fast processing and clear order updates after successful payment.", "Procesamiento rapido y actualizaciones claras tras el pago.")}</h2>
            </div>
            <table class="shipping-table">
              <thead>
                <tr>
                  <th>${tx("Region", "Zona")}</th>
                  <th>${tx("Timing", "Tiempo")}</th>
                  <th>${tx("Price", "Precio")}</th>
                </tr>
              </thead>
              <tbody>${renderShippingRows()}</tbody>
            </table>
          </article>
          <article class="info-panel reveal reveal-delay">
            <p class="panel-kicker">${tx("Secure payment confidence", "Confianza en el pago seguro")}</p>
            <h3>${tx("Exact payment amounts are confirmed automatically for a smooth order process.", "Los importes exactos se confirman automaticamente para un proceso de pedido mas fluido.")}</h3>
            <p class="section-copy">${tx(
              "Customers can review delivery, totals, and payment guidance on the store before moving into the hosted ArionPay page for final payment.",
              "Carrito, checkout y soporte ya están estructurados para reducir fricción manteniendo una tienda clara y orientada a confianza."
            )}</p>
          </article>
        </div>
      </section>
      <section class="section section-tight">
        <div class="container section-stack">
          <div class="section-header reveal">
            <p class="section-kicker">${tx("Why Customers Choose Primus", "Por que los clientes eligen Primus")}</p>
            <h2 class="section-title">${tx("Operational trust signals repeated where buying decisions happen.", "Señales operativas de confianza repetidas justo donde ocurre la decisión de compra.")}</h2>
          </div>
          <div class="benefit-grid">${renderBenefitCards()}</div>
        </div>
      </section>
      <section class="section section-tight">
        <div class="container section-stack">
          <div class="section-header reveal">
            <p class="section-kicker">${tx("Built for Customer Confidence", "Pensado para generar confianza")}</p>
            <h2 class="section-title">${tx("From secure payments to protected accounts and transparent checkout flow, every part of the store is designed to create trust.", "Desde pagos seguros hasta cuentas protegidas y un checkout transparente, toda la tienda esta pensada para crear confianza.")}</h2>
          </div>
          <div class="proof-grid">${renderProofCards()}</div>
        </div>
      </section>
      <section class="section section-tight">
        <div class="container section-stack">
          <div class="section-header reveal">
            <p class="section-kicker">${tx("Testimonials", "Testimonios")}</p>
            <h2 class="section-title">${tx("A stronger social-proof layer for cautious, high-intent buyers.", "Una capa más fuerte de prueba social para compradores cautos y de alta intención.")}</h2>
          </div>
          <div class="testimonial-grid">${renderTestimonialCards()}</div>
        </div>
      </section>
    `;
  }

  function buildFallbackGuide(product) {
    return {
      summary: {
        en: `Guide-style content for ${localize(product.name)} ${product.dosage} can be expanded further as the Primus library grows.`,
        es: `El contenido tipo guia para ${localize(product.name)} ${product.dosage} puede ampliarse aun mas a medida que crece la biblioteca de Primus.`
      },
      howItWorks: {
        en: `${localize(product.name)} ${product.dosage} is positioned as a research-grade reference inside the Primus catalogue, with focus placed on documented pathway behaviour and controlled laboratory handling.`,
        es: `${localize(product.name)} ${product.dosage} se posiciona como una referencia grado investigacion dentro del catalogo de Primus, con foco en comportamiento de vias documentadas y manejo controlado de laboratorio.`
      },
      benefits: {
        en: "Use this section for a careful summary of documented pathway interest, expected research context, and the main tolerance or handling notes tied to the product category.",
        es: "Usa esta seccion para un resumen cuidadoso del interes documentado en la via, el contexto esperado de investigacion y las principales notas de tolerancia o manejo ligadas a la categoria del producto."
      },
      protocolOverview: {
        en: "The on-site structure is designed for a short protocol summary, clean reading flow, and a faster transition from product review to checkout.",
        es: "La estructura del sitio esta pensada para un resumen corto de protocolo, una lectura limpia y una transicion mas rapida desde la revision del producto hasta el checkout."
      },
      dosing: {
        en: "Publish the finalized Primus internal schedule here once the peptide-specific guide is approved for launch.",
        es: "Publica aqui la pauta interna final de Primus una vez que la guia especifica del peptido quede aprobada para lanzamiento."
      },
      reconstitution: {
        en: "Standard handling should note solvent choice, careful vial-wall mixing, syringe conversion clarity, and refrigerated storage after reconstitution.",
        es: "El manejo estandar debe indicar tipo de solvente, mezcla cuidadosa por la pared del vial, claridad en conversiones de jeringa y almacenamiento refrigerado tras la reconstitucion."
      },
      storage: {
        en: "Store lyophilized material cold, dry, and protected from light. After reconstitution, keep refrigerated and avoid repeated temperature swings.",
        es: "Guardar el material liofilizado en frio, seco y protegido de la luz. Tras la reconstitucion, mantener refrigerado y evitar cambios repetidos de temperatura."
      },
      stackKeys: []
    };
  }

  function getProductGuide(product) {
    return PRODUCT_GUIDES[product.slug] || buildFallbackGuide(product);
  }

  function renderGuideStackSeries(product) {
    const guide = getProductGuide(product);
    const stackKeys = Array.isArray(guide.stackKeys) ? guide.stackKeys : [];

    if (!stackKeys.length) {
      return "";
    }

    const cards = stackKeys
      .map((key) => {
        const stack = STACK_SERIES[key];

        if (!stack) {
          return "";
        }

        const members = stack.products
          .map((slug) => {
            const item = PRODUCTS.find((entry) => entry.slug === slug);
            return item ? `${localize(item.name)} ${item.dosage}` : "";
          })
          .filter(Boolean)
          .join(" · ");

        return `
          <article class="detail-card">
            <span class="detail-label">${tx("Stack series", "Serie de stacks")}</span>
            <strong>${localize(stack.title)}</strong>
            <p>${localize(stack.summary)}</p>
            <p class="section-copy">${members}</p>
          </article>
        `;
      })
      .join("");

    if (!cards.trim()) {
      return "";
    }

    return `
      <div class="section-stack">
        <div class="section-header">
          <p class="section-kicker">${tx("Stack series", "Serie de stacks")}</p>
          <h3>${tx("How this peptide connects with the wider Primus guide library.", "Como se conecta este peptido con la biblioteca ampliada de Primus.")}</h3>
        </div>
        <div class="detail-grid">${cards}</div>
      </div>
    `;
  }

  function renderProductDescriptionLegacy(product) {
    return `
      <div class="section-stack">
        <p class="section-copy">${tx(
          "This product page keeps the technical presentation clean and buyer-friendly while leaving room for batch documentation, COA references, and future protocol review.",
          "Esta página mantiene una presentación técnica clara y cómoda para el comprador, dejando espacio para documentación por lote, referencias COA y revisión de protocolos."
        )}</p>
        <div class="detail-grid">
          <article class="detail-card">
            <span class="detail-label">${tx("Material", "Material")}</span>
            <strong>${localize(product.name)} ${tx("synthetic peptide reference", "péptido sintético de referencia")}</strong>
            <p>${tx("Prepared for catalogue, batch, and laboratory documentation workflows.", "Preparado para flujos de catálogo, lote y documentación de laboratorio.")}</p>
          </article>
          <article class="detail-card">
            <span class="detail-label">${tx("Form", "Forma")}</span>
            <strong>${tx("Lyophilized powder", "Polvo liofilizado")}</strong>
            <p>${tx("White-background vial imagery reinforces a clinical and controlled visual direction.", "La imaginería de viales sobre fondo blanco refuerza una dirección visual clínica y controlada.")}</p>
          </article>
          <article class="detail-card">
            <span class="detail-label">${tx("Manufacturing", "Fabricación")}</span>
            <strong>${tx("Synthetic peptide production", "Producción sintética de péptidos")}</strong>
            <p>${tx("Positioned with batch visibility, purity-driven presentation, and trust-first copy.", "Posicionado con visibilidad por lote, presentación orientada a pureza y copy centrado en confianza.")}</p>
          </article>
          <article class="detail-card">
            <span class="detail-label">${tx("Storage", "Almacenamiento")}</span>
            <strong>${tx("Cool, dry, protected from light", "Lugar fresco, seco y protegido de la luz")}</strong>
            <p>${tx("Final handling instructions can be expanded once the fulfilment SOP is confirmed.", "Las instrucciones finales de manejo pueden ampliarse cuando el SOP logístico esté confirmado.")}</p>
          </article>
        </div>
        <div class="product-support-grid">
          <article class="assurance-card">
            <span class="detail-label">${tx("Research focus", "Foco de investigación")}</span>
            <strong>${localize(product.name)} ${product.dosage}</strong>
            <p>${localize(product.focus)}</p>
          </article>
          <article class="assurance-card">
            <span class="detail-label">${tx("Batch traceability", "Trazabilidad")}</span>
            <strong>${tx("COA-ready batch reference", "Referencia de lote lista para COA")}</strong>
            <p>${tx("Batch", "Lote")}: ${product.batch} · ${tx("Last analysis", "Último análisis")}: ${formatDate(product.coaDate)}</p>
          </article>
        </div>
      </div>
    `;
  }

  function renderProductAdditionalLegacy(product) {
    return `
      <div class="section-stack">
        <p class="section-copy">${tx(
          "This section mirrors a protocol-style structure while keeping on-site copy responsible and ready for later scientific review.",
          "Esta sección refleja una estructura tipo protocolo manteniendo un contenido responsable y listo para revisión científica posterior."
        )}</p>
        <div class="protocol-grid">
          <article class="protocol-section detail-card">
            <h3>${tx("How This Works", "Cómo funciona")}</h3>
            <p class="protocol-text">${localize(product.focus)}</p>
          </article>
          <article class="protocol-section detail-card">
            <h3>${tx("Potential Benefits & Side Effects", "Beneficios potenciales y efectos")}</h3>
            <p class="protocol-text">${tx(
              "Literature reviews typically focus on pathway behavior, model response, and handling limits. Product pages should avoid overstating outcomes and keep side-effect language tied to documented research context only.",
              "Las revisiones suelen centrarse en el comportamiento de la vía, la respuesta del modelo y los límites de manejo. Las páginas deben evitar exagerar resultados y vincular cualquier efecto únicamente al contexto documentado."
            )}</p>
          </article>
          <article class="protocol-section detail-card">
            <h3>${tx("Protocol Overview", "Resumen del protocolo")}</h3>
            <p class="protocol-text">${tx(
              "Use this area for institution-approved protocol summaries, study framing, and documentation references once the final scientific source is selected.",
              "Usa este bloque para resúmenes de protocolos aprobados, marco del estudio y referencias documentales cuando la fuente científica final esté confirmada."
            )}</p>
          </article>
          <article class="protocol-section detail-card">
            <h3>${tx("Dosing Protocol", "Protocolo de dosificación")}</h3>
            <p class="protocol-text">${tx(
              "Exact dosing ranges are intentionally not published in this build. Connect only reviewed protocol content that matches your legal and scientific standards.",
              "Los rangos exactos no se publican en esta versión. Conecta únicamente contenido revisado que cumpla tus estándares legales y científicos."
            )}</p>
          </article>
          <article class="protocol-section detail-card">
            <h3>${tx("Dosing & Reconstitution Guide", "Guía de dosificación y reconstitución")}</h3>
            <p class="protocol-text">${tx(
              "Reconstitution, solvent volume, labeling, syringe conversion, and post-mix storage instructions should be published only after controlled review and SOP alignment.",
              "La reconstitución, volumen de diluyente, etiquetado, equivalencias y conservación tras mezcla deben publicarse solo tras revisión controlada y alineación con SOP."
            )}</p>
          </article>
        </div>
        <div class="policy-callout">${tx(
          "For launch, connect this tab to compliance-reviewed scientific copy rather than generic public claims.",
          "Para el lanzamiento, conecta esta pestaña con contenido científico revisado en lugar de afirmaciones genéricas."
        )}</div>
      </div>
    `;
  }

  function renderProductDescriptionEnhanced(product) {
    const guide = getProductGuide(product);
    return `
      <div class="section-stack">
        <p class="section-copy">${localize(guide.summary)}</p>
        <div class="detail-grid">
          <article class="detail-card">
            <span class="detail-label">${tx("Material", "Material")}</span>
            <strong>${localize(product.name)} ${tx("synthetic peptide reference", "peptido sintetico de referencia")}</strong>
            <p>${tx("Prepared for catalogue, batch, and laboratory documentation workflows.", "Preparado para flujos de catalogo, lote y documentacion de laboratorio.")}</p>
          </article>
          <article class="detail-card">
            <span class="detail-label">${tx("Form", "Forma")}</span>
            <strong>${tx("Lyophilized powder", "Polvo liofilizado")}</strong>
            <p>${tx("White-background vial imagery reinforces a clinical and controlled visual direction.", "La imagineria de viales sobre fondo blanco refuerza una direccion visual clinica y controlada.")}</p>
          </article>
          <article class="detail-card">
            <span class="detail-label">${tx("Manufacturing", "Fabricacion")}</span>
            <strong>${tx("Synthetic peptide production", "Produccion sintetica de peptidos")}</strong>
            <p>${tx("Positioned with batch visibility, purity-driven presentation, and trust-first copy.", "Posicionado con visibilidad por lote, presentacion orientada a pureza y copy centrado en confianza.")}</p>
          </article>
          <article class="detail-card">
            <span class="detail-label">${tx("Storage", "Almacenamiento")}</span>
            <strong>${tx("Cool, dry, protected from light", "Lugar fresco, seco y protegido de la luz")}</strong>
            <p>${localize(guide.storage)}</p>
          </article>
        </div>
        <div class="product-support-grid">
          <article class="assurance-card">
            <span class="detail-label">${tx("Research focus", "Foco de investigacion")}</span>
            <strong>${localize(product.name)} ${product.dosage}</strong>
            <p>${localize(product.focus)}</p>
          </article>
          <article class="assurance-card">
            <span class="detail-label">${tx("Batch traceability", "Trazabilidad")}</span>
            <strong>${tx("COA-ready batch reference", "Referencia de lote lista para COA")}</strong>
            <p>${tx("Batch", "Lote")}: ${product.batch} · ${tx("Last analysis", "Ultimo analisis")}: ${formatDate(product.coaDate)}</p>
          </article>
        </div>
      </div>
    `;
  }

  function renderProductAdditionalEnhanced(product) {
    const guide = getProductGuide(product);
    const hasMaterials = guide.materials;
    const hasInjection = guide.injectionTechnique;
    const hasLifestyle = guide.lifestyleFactors;

    return `
      <div class="section-stack">
        <div class="protocol-grid">
          <article class="protocol-section detail-card">
            <h3>${tx("How This Works", "Como funciona")}</h3>
            <p class="protocol-text">${localize(guide.howItWorks)}</p>
          </article>
          <article class="protocol-section detail-card">
            <h3>${tx("Potential Benefits & Side Effects", "Beneficios potenciales y efectos")}</h3>
            <p class="protocol-text">${localize(guide.benefits)}</p>
          </article>
          <article class="protocol-section detail-card">
            <h3>${tx("Protocol Overview", "Resumen del protocolo")}</h3>
            <p class="protocol-text">${localize(guide.protocolOverview)}</p>
          </article>
          <article class="protocol-section detail-card">
            <h3>${tx("Dosing Protocol", "Protocolo de dosificacion")}</h3>
            <p class="protocol-text">${localize(guide.dosing)}</p>
          </article>
          <article class="protocol-section detail-card">
            <h3>${tx("Dosing & Reconstitution Guide", "Guia de dosificacion y reconstitucion")}</h3>
            <p class="protocol-text">${localize(guide.reconstitution)}</p>
          </article>
          ${hasMaterials ? `
          <article class="protocol-section detail-card">
            <h3>${tx("Materials Needed", "Materiales necesarios")}</h3>
            <p class="protocol-text">${localize(guide.materials)}</p>
          </article>
          ` : ''}
          ${hasInjection ? `
          <article class="protocol-section detail-card">
            <h3>${tx("Injection Technique", "Tecnica de inyeccion")}</h3>
            <p class="protocol-text">${localize(guide.injectionTechnique)}</p>
          </article>
          ` : ''}
          ${hasLifestyle ? `
          <article class="protocol-section detail-card">
            <h3>${tx("Lifestyle Factors", "Factores de estilo de vida")}</h3>
            <p class="protocol-text">${localize(guide.lifestyleFactors)}</p>
          </article>
          ` : ''}
        </div>
        <div class="policy-callout">${tx(
          "Guide summaries are organized for faster technical review and cleaner comparison across the catalogue.",
          "Los resumenes de guia estan organizados para una revision tecnica mas rapida y una comparacion mas clara en todo el catalogo."
        )}</div>
        ${renderGuideStackSeries(product)}
      </div>
    `;
  }

  function buildMailtoUrl(payload) {
    const lines = [
      `${tx("Name", "Nombre")}: ${payload.name || ""}`,
      `${tx("Email", "Correo")}: ${payload.email || ""}`,
      `${tx("Message", "Mensaje")}:`,
      payload.message || ""
    ];
    const subject = payload.subject || tx("Primus Peptides enquiry", "Consulta Primus Peptides");
    return `mailto:${SITE_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
  }

  renderProductPage = function () {
    const product = currentProduct();
    const cart = readCart();
    const total = subtotal(cart);
    const progress = Math.min((total / FREE_SHIPPING_THRESHOLD) * 100, 100);
    const gallery = product.gallery
      .map((image, index) => `
        <div class="gallery-thumb gallery-thumb-enhanced">
          <span class="gallery-thumb-label">${galleryImageLabel(image, index)}</span>
          <img class="gallery-image gallery-image-${imagePresentationKind(image)}" src="${image}" alt="${localize(product.name)} ${product.dosage}">
        </div>
      `)
      .join("");
    const related = PRODUCTS.filter((item) => item.slug !== product.slug)
      .slice(0, 3)
      .map((item, index) => renderProductCard(item, { delay: index % 2 === 1 }))
      .join("");
    const tabPanel = activeProductTab === "description"
      ? renderProductDescriptionEnhanced(product)
      : renderProductAdditionalEnhanced(product);

    const actionBlock = product.status === "available"
      ? `
        <div class="quantity-row" data-quantity-root>
          <span>${tx("Quantity", "Cantidad")}</span>
          <div class="quantity-controls">
            <button class="qty-btn" type="button" data-qty-action="decrease">-</button>
            <strong data-quantity-value>1</strong>
            <button class="qty-btn" type="button" data-qty-action="increase">+</button>
          </div>
        </div>
        <button class="btn btn-primary btn-block" type="button" data-add-to-cart="${product.slug}">${tx("Add to Cart", "Añadir al carrito")}</button>
      `
      : `
        <div class="stock-pill coming">${tx("Coming May", "Llega en mayo")}</div>
        <p class="product-subtext">${tx("Pricing and release details will appear once the launch batch is ready.", "Los detalles de precio y lanzamiento aparecerán cuando el lote esté listo.")}</p>
        <button class="btn btn-muted btn-block" type="button" disabled>${tx("Coming Soon", "Próximamente")}</button>
      `;

    return `
      <section class="page-hero">
        <div class="container product-main">
          <p class="breadcrumb">${tx("Home", "Inicio")} / ${tx("Shop", "Tienda")} / ${localize(product.name)} ${product.dosage}</p>
          <div class="product-layout">
            <div class="gallery-grid reveal">
              <div class="product-main-image product-main-image-enhanced">
                ${renderProductVisual(product, "detail")}
                <div class="product-visual-meta-strip">
                  <span>${tx("Sterile white-lab visual system", "Sistema visual blanco de laboratorio")}</span>
                  <span>${tx("Minimal shadows", "Sombras mínimas")}</span>
                  <span>${tx("Medical storefront direction", "Dirección médica")}</span>
                </div>
              </div>
              <div class="gallery-thumb-grid">${gallery}</div>
            </div>
            <aside class="panel product-panel reveal reveal-delay">
              <div class="card-meta">
                <span class="status-pill ${product.status === "available" ? "available" : "coming"}">${productStatusLabel(product)}</span>
                <span class="badge">${localize(COPY.labels.hplc)}</span>
              </div>
              <p class="panel-kicker">${tx("Premium product detail", "Detalle premium del producto")}</p>
              <h1>${localize(product.name)} ${product.dosage}</h1>
              <p class="product-subtext">${localize(product.short)}</p>
              <div class="price-row">
                <strong class="price-value">${productPriceLabel(product)}</strong>
                <span>${product.status === "available" ? "EUR" : tx("Release pending", "Lanzamiento pendiente")}</span>
              </div>
              <div class="product-trust">
                <div class="trust-icon">${localize(COPY.labels.shipped)}</div>
                <div class="trust-icon">${localize(COPY.labels.freeShipping)}</div>
                <div class="trust-icon">${localize(COPY.labels.hplc)}</div>
              </div>
              <div class="shipping-progress">
                <div class="shipping-progress-bar" style="width:${progress}%"></div>
                <p>${shippingProgressCopy(total)}</p>
              </div>
              ${actionBlock}
            </aside>
          </div>
        </div>
      </section>
      <section class="section section-tight">
        <div class="container">
          <article class="tabs-card reveal">
            <div class="tab-row">
              <button type="button" class="tab-button ${activeProductTab === "description" ? "is-active" : ""}" data-tab="description">${tx("Description", "Descripción")}</button>
              <button type="button" class="tab-button ${activeProductTab === "additional" ? "is-active" : ""}" data-tab="additional">${tx("Additional Info", "Información adicional")}</button>
            </div>
            <div data-tab-panel>${tabPanel}</div>
          </article>
        </div>
      </section>
      <section class="section section-tight">
        <div class="container section-stack">
          <div class="section-header reveal">
            <p class="section-kicker">${tx("Related products", "Productos relacionados")}</p>
            <h2 class="section-title">${tx("Continue through the catalogue with the same trust-led layout.", "Continúa por el catálogo con el mismo diseño centrado en confianza.")}</h2>
          </div>
          <div class="related-grid">${related}</div>
        </div>
      </section>
    `;
  };

  renderCartPage = function () {
    const cart = readCart();
    const total = subtotal(cart);
    const delivery = selectedDelivery(total);
    const payment = selectedPayment();
    const shippingCost = cart.length ? deliveryPrice(delivery, total) : 0;
    const grandTotal = total + shippingCost;
    const progress = Math.min((total / FREE_SHIPPING_THRESHOLD) * 100, 100);
    const hasItems = cart.length > 0;

    return `
      <section class="page-hero">
        <div class="container cart-layout">
          <section class="contact-card reveal">
            <div class="section-header">
              <p class="section-kicker">${tx("Cart", "Carrito")}</p>
              <h1>${tx("Review your order before secure checkout.", "Revisa tu pedido antes del pago seguro.")}</h1>
              <p class="lead">${tx("Confirm quantities, choose delivery, and continue directly to the secure ArionPay payment flow.", "Confirma cantidades, elige el envio y continua directamente al flujo seguro de pago con ArionPay.")}</p>
            </div>
            ${renderCartItems(cart)}
          </section>
          <aside class="summary-card reveal reveal-delay">
            <div class="section-header">
              <p class="section-kicker">${tx("Order summary", "Resumen del pedido")}</p>
              <h2 class="section-title">${tx("Checkout overview", "Resumen del checkout")}</h2>
            </div>
            <div class="summary-list">
              <div class="summary-row"><span class="summary-label">${tx("Items", "Artículos")}</span><strong>${itemCount(cart)}</strong></div>
              <div class="summary-row"><span class="summary-label">${tx("Subtotal", "Subtotal")}</span><strong>${formatPrice(total)}</strong></div>
              <div class="summary-row"><span class="summary-label">${tx("Shipping", "Envío")}</span><strong>${shippingCost === 0 ? tx("Free", "Gratis") : formatPrice(shippingCost)}</strong></div>
              <div class="summary-row"><span class="summary-label">${tx("Estimated total", "Total estimado")}</span><strong>${formatPrice(grandTotal)}</strong></div>
            </div>
            <div class="shipping-progress">
              <div class="shipping-progress-bar" style="width:${progress}%"></div>
              <p>${shippingProgressCopy(total)}</p>
            </div>
            <div class="support-chip-row">
              <div class="support-chip">${tx("Delivery option")}: ${hasItems ? localize(delivery.label) : tx("Select products first", "Selecciona productos primero")}</div>
              <div class="support-chip">${tx("Payments")}: ArionPay · USDT (TRC20)</div>
            </div>
            <div class="stack-sm" data-cart-preferences>
              <span class="checkout-eyebrow">${tx("Choose delivery before checkout", "Elige envio antes del checkout")}</span>
              <div class="checkout-method-grid">
                ${DELIVERY_OPTIONS.map((item) => renderDeliveryOption(item, delivery.id, total)).join("")}
              </div>
            </div>
            <div class="summary-actions">
              ${hasItems
                ? `<a class="btn btn-primary btn-block" href="checkout.html">${localize(COPY.labels.checkout)}</a>`
                : `<button class="btn btn-primary btn-block" type="button" disabled>${localize(COPY.labels.checkout)}</button>`
              }
              <a class="btn btn-secondary btn-block" href="shop.html">${tx("Keep browsing", "Seguir comprando")}</a>
            </div>
            <p class="helper-copy">${hasItems
              ? tx("Your delivery selection carries into checkout and payment continues through ArionPay.", "Tu seleccion de envio pasa al checkout y el pago continua a traves de ArionPay.")
              : tx("Add at least one product to activate checkout.", "Agrega al menos un producto para activar el checkout.")
            }</p>
          </aside>
        </div>
      </section>
    `;
  };

  renderContactPage = function () {
    return `
      <section class="page-hero">
        <div class="container contact-grid">
          <article class="contact-card reveal">
            <div class="section-header">
              <p class="section-kicker">${tx("Need Help? Contact Support", "Necesitas ayuda? Contacta con soporte")}</p>
              <h1>${tx("Need Help? Contact Support", "Necesitas ayuda? Contacta con soporte")}</h1>
              <p class="lead">${tx("Use this page for product questions, shipping clarity, and pre-checkout guidance from the Primus support team.", "Usa esta pagina para dudas de producto, claridad de envio y ayuda antes del checkout.")}</p>
            </div>
            <div class="contact-points">
              <div class="contact-point"><strong>${tx("Email", "Correo")}</strong><a href="mailto:${SITE_EMAIL}">${SITE_EMAIL}</a></div>
              <div class="contact-point"><strong>${tx("Shipping window", "Ventana de envío")}</strong><p>${tx("EU dispatch target: 24h once payment and order review are complete.", "Objetivo de salida UE: 24h una vez completada la revisión de pago y pedido.")}</p></div>
              <div class="contact-point"><strong>${tx("Accepted payments", "Pagos aceptados")}</strong><p>${tx("USDT is available through secure cryptocurrency checkout.", "USDT está disponible mediante checkout seguro con criptomonedas.")}</p><div class="payment-chips">${["USDT"].map((item) => `<span class="payment-chip">${item}</span>`).join("")}</div></div>
            </div>
          </article>
          <article class="contact-card reveal reveal-delay">
            <div class="section-header">
              <p class="section-kicker">${tx("Need Help? Contact Support", "Necesitas ayuda? Contacta con soporte")}</p>
              <h2 class="section-title">${tx("Send your request directly to support.", "Envia tu solicitud directamente a soporte.")}</h2>
            </div>
            <form class="form-grid" data-contact-form>
              <label class="full-width"><span>${tx("Name", "Nombre")}</span><input class="form-input" name="name" required></label>
              <label class="full-width"><span>${tx("Email", "Correo")}</span><input class="form-input" name="email" type="email" required></label>
              <label class="full-width"><span>${tx("Subject", "Asunto")}</span><input class="form-input" name="subject" placeholder="${tx("Order support, COA request, shipping question...", "Soporte de pedido, solicitud COA, duda de envío...")}"></label>
              <label class="full-width"><span>${tx("Message", "Mensaje")}</span><textarea class="form-textarea" name="message" placeholder="${tx("Tell us what you need and we will route it through the right support flow.", "Indícanos lo que necesitas y lo encaminaremos por el flujo de soporte adecuado.")}"></textarea></label>
              <div class="full-width form-row">
                <p class="form-status" data-contact-status></p>
                <button class="btn btn-primary" type="submit">${tx("Contact Support", "Contactar soporte")}</button>
              </div>
            </form>
          </article>
        </div>
      </section>
    `;
  };

  function legacyRenderCheckoutPage() {
    return renderCheckoutPage();
  }
/*
    const params = new URLSearchParams(window.location.search);
    const success = params.get("status") === "success";
    const order = readLastOrder();
    const cart = readCart();
    const total = subtotal(cart);
    const draft = readCheckoutDraft();
    const agreements = readCheckoutAgreements();
    const country = countryConfig(draft.country || "NG");
    const region = normalizeRegion(country.code, draft.state || "");
    const delivery = DELIVERY_OPTIONS.find((item) => item.id === (draft.shippingMethod || "eu-standard")) || DELIVERY_OPTIONS[0];
    const payment = ACTIVE_PAYMENT_OPTIONS.find((item) => item.id === (draft.paymentMethod || ACTIVE_PAYMENT_OPTIONS[0].id)) || ACTIVE_PAYMENT_OPTIONS[0];
    const cryptoCurrency = selectedCryptoCurrency();
    const shippingCost = deliveryPrice(delivery, total);
    const grandTotal = total + shippingCost;
    const bankTransferOrder = success && order && isBankTransferPayment(order.payment);

    if (success && order) {
      return `
        <section class="page-hero">
          <div class="container section-stack">
            <article class="success-card reveal" data-checkout-state="confirming">
              <p class="section-kicker">${bankTransferOrder ? tx("Manual payment selected", "Pago manual seleccionado") : tx("Order received", "Pedido recibido")}</p>
              <h1 class="success-title">${tx("Your order summary is ready.", "El resumen de tu pedido esta listo.")}</h1>
              <p class="success-copy">${tx("Crypto checkout now uses hosted ArionPay payment links for USDT orders.", "El checkout crypto ahora usa enlaces de pago alojados de ArionPay para pedidos USDT.")}</p>
              <div class="order-meta-grid">
                <article class="detail-card"><span class="detail-label">${tx("Order reference", "Referencia")}</span><strong>${order.reference}</strong><p>${formatDate(order.createdAt)}</p></article>
                <article class="detail-card"><span class="detail-label">${bankTransferOrder ? tx("Amount due", "Importe a pagar") : tx("Payment", "Pago")}</span><strong>${bankTransferOrder ? formatPrice(order.total) : paymentDisplayLabel(order.payment, order.paymentCurrency)}</strong><p>${bankTransferOrder ? tx("Manual payment pending confirmation.", "Pago manual pendiente de confirmacion.") : localize(order.payment.note)}</p></article>
                <article class="detail-card"><span class="detail-label">${tx("Delivery", "Entrega")}</span><strong>${localize(order.shipping.label)}</strong><p>${localize(order.shipping.eta)}</p></article>
              </div>
              <div class="summary-divider"></div>
              <div class="order-line-items">${renderOrderLineItems(order.items)}</div>
              ${bankTransferOrder ? renderBankTransferInstructions(order) : ""}
              <div class="cta-row-inline">
                <a class="btn btn-primary" href="shop.html">${tx("Back to shop", "Volver a la tienda")}</a>
                <a class="btn btn-secondary" href="contact.html">${tx("Need Help? Contact Support", "Necesitas ayuda? Contacta con soporte")}</a>
              </div>
            </article>
          </div>
        </section>
      `;
    }

    if (!cart.length) {
      return `
        <section class="page-hero">
          <div class="container section-stack">
            <div class="empty-state reveal">
              <h1>${tx("Your cart is empty.", "Tu carrito está vacío.")}</h1>
              <p>${tx("Add products before opening the guest checkout flow.", "Añade productos antes de abrir el checkout invitado.")}</p>
              <a class="btn btn-primary" href="shop.html">${tx("Browse products", "Ver productos")}</a>
            </div>
          </div>
        </section>
      `;
    }

    return `
      <section class="page-hero">
        <div class="container checkout-shell">
          <div class="checkout-banner reveal">${tx("Free tracked EU shipping on all orders over 200 EUR.", "Envio UE con seguimiento gratis en todos los pedidos superiores a 200 EUR.")}</div>
          <div class="checkout-grid checkout-grid-pro">
          <section class="checkout-main reveal">
            <div class="section-header">
              <p class="section-kicker">${tx("Checkout", "Checkout")}</p>
              <h1>${tx("Guest checkout with delivery and payment selection.", "Checkout invitado con seleccion de envio y pago.")}</h1>
              <p class="lead">${tx("Choose delivery, then continue with a hosted ArionPay payment link for USDT checkout.", "Elige el envío y continúa con un enlace de pago alojado de ArionPay para checkout USDT.")}</p>
            </div>
            <form class="form-grid" id="checkout-form" data-checkout-form>
              <label><span>${tx("First name", "Nombre")}</span><input class="form-input" name="firstName" required value="${draft.firstName || ""}"></label>
              <label><span>${tx("Last name", "Apellidos")}</span><input class="form-input" name="lastName" required value="${draft.lastName || ""}"></label>
              <label><span>${tx("Email", "Correo")}</span><input class="form-input" name="email" type="email" required value="${draft.email || ""}"></label>
              <label><span>${tx("Phone", "Teléfono")}</span><input class="form-input" name="phone" value="${draft.phone || ""}"></label>
              <label><span>${tx("Company", "Empresa")}</span><input class="form-input" name="company" value="${draft.company || ""}"></label>
              <label><span>${tx("Country", "País")}</span><input class="form-input" name="country" required value="${draft.country || ""}"></label>
              <label><span>${tx("City", "Ciudad")}</span><input class="form-input" name="city" required value="${draft.city || ""}"></label>
              <label><span>${tx("Postal code", "Código postal")}</span><input class="form-input" name="postalCode" required value="${draft.postalCode || ""}"></label>
              <label class="full-width"><span>${tx("Address", "Dirección")}</span><input class="form-input" name="address" required value="${draft.address || ""}"></label>
              <div class="full-width stack-sm">
                <span class="checkout-eyebrow">${tx("Delivery method", "Método de envío")}</span>
                <div class="checkout-method-grid">${DELIVERY_OPTIONS.map((item) => renderDeliveryOption(item, delivery.id, total)).join("")}</div>
              </div>
              <div class="full-width stack-sm">
                <span class="checkout-eyebrow">${tx("Payment method", "Método de pago")}</span>
                <div class="checkout-method-grid">${ACTIVE_PAYMENT_OPTIONS.map((item) => renderPaymentOption(item, payment.id)).join("")}</div>
              </div>
              <label class="full-width"><span>${tx("Order notes", "Notas del pedido")}</span><textarea class="form-textarea" name="notes" placeholder="${tx("Delivery notes, support context, or account instructions.", "Notas de entrega, contexto de soporte o instrucciones de cuenta.")}">${draft.notes || ""}</textarea></label>
            </form>
          </section>
          <aside class="summary-card checkout-side reveal reveal-delay">
            <div class="section-header">
              <p class="section-kicker">${tx("Summary", "Resumen")}</p>
              <h2 class="section-title">${tx("Order overview", "Resumen del pedido")}</h2>
            </div>
            <div class="order-line-items">${renderOrderLineItems(cart)}</div>
            <div class="summary-divider"></div>
            <div class="summary-list">
              <div class="summary-row"><span class="summary-label">${tx("Subtotal", "Subtotal")}</span><strong>${formatPrice(total)}</strong></div>
              <div class="summary-row"><span class="summary-label">${tx("Shipping", "Envío")}</span><strong>${shippingCost === 0 ? tx("Free", "Gratis") : formatPrice(shippingCost)}</strong></div>
              <div class="summary-row"><span class="summary-label">${tx("Estimated total", "Total estimado")}</span><strong>${formatPrice(grandTotal)}</strong></div>
            </div>
            <div class="support-chip-row">
              <div class="support-chip">${tx("Selected delivery", "Envío elegido")}: ${localize(delivery.label)}</div>
              <div class="support-chip">${tx("Selected payment", "Pago elegido")}: ${localize(payment.label)}</div>
            </div>
            <button class="btn btn-primary btn-block" type="submit" form="checkout-form" data-checkout-submit>${checkoutSubmitLabel(payment)}</button>
            <a class="btn btn-secondary btn-block" href="cart.html">${tx("Back to cart", "Volver al carrito")}</a>
            <p class="helper-copy" data-checkout-status>${tx("Select a payment method to continue.", "Selecciona un metodo de pago para continuar.")}</p>
          </aside>
          </div>
        </div>
      </section>
    `;
  }

*/
  function renderCheckoutPage() {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("status") === "success";
    const order = readLastOrder();
    const cart = readCart();
    const total = subtotal(cart);
    const draft = readCheckoutDraft();
    const country = countryConfig(draft.country || "NG");
    const region = normalizeRegion(country.code, draft.state || "");
    const delivery = DELIVERY_OPTIONS.find((item) => item.id === (draft.shippingMethod || "eu-standard")) || DELIVERY_OPTIONS[0];
    const payment = ACTIVE_PAYMENT_OPTIONS.find((item) => item.id === (draft.paymentMethod || ACTIVE_PAYMENT_OPTIONS[0].id)) || ACTIVE_PAYMENT_OPTIONS[0];
    const cryptoCurrency = selectedCryptoCurrency();
    const shippingCost = deliveryPrice(delivery, total);
    const grandTotal = total + shippingCost;
    const paymentLabel = paymentDisplayLabel(payment, cryptoCurrency);
    const orderPaid = success && order && isPaidOrderStatus(order.status);

    if (success && order) {
      return `
        <section class="page-hero">
          <div class="container section-stack">
            <article class="success-card reveal" data-checkout-state="completed">
              <p class="section-kicker">${orderPaid ? tx("Payment confirmed", "Pago confirmado") : tx("Order received", "Pedido recibido")}</p>
              <h1 class="success-title">${orderPaid ? tx("Your order is moving to fulfilment.", "Tu pedido ya pasa a preparacion.") : tx("Your payment page is ready.", "Tu pagina de pago ya esta lista.")}</h1>
              <p class="success-copy">${orderPaid
                ? tx("Payment has been confirmed and the order is now queued for dispatch review.", "El pago ha sido confirmado y el pedido ya queda en cola para revision de envio.")
                : tx("Complete payment through the secure ArionPay page to finalize this order.", "Completa el pago en la pagina segura de ArionPay para finalizar este pedido.")
              }</p>
              <div class="order-meta-grid">
                <article class="detail-card"><span class="detail-label">${tx("Order reference", "Referencia")}</span><strong>${order.reference}</strong><p>${formatDate(order.createdAt)}</p></article>
                <article class="detail-card"><span class="detail-label">${tx("Payment", "Pago")}</span><strong>${paymentDisplayLabel(order.payment, order.paymentCurrency)}</strong><p>${orderPaid ? tx("Payment confirmed by ArionPay.", "Pago confirmado por ArionPay.") : localize(order.payment.note)}</p></article>
                <article class="detail-card"><span class="detail-label">${tx("Delivery", "Entrega")}</span><strong>${localize(order.shipping.label)}</strong><p>${localize(order.shipping.eta)}</p></article>
              </div>
              <div class="summary-divider"></div>
              <div class="order-line-items">${renderOrderLineItems(order.items)}</div>
              <div class="cta-row-inline">
                ${!orderPaid && order.invoiceUrl
                  ? `<a class="btn btn-primary" href="${order.invoiceUrl}">${tx("Open payment page", "Abrir pagina de pago")}</a>`
                  : `<a class="btn btn-primary" href="shop.html">${tx("Back to shop", "Volver a la tienda")}</a>`
                }
                <a class="btn btn-secondary" href="contact.html">${tx("Need Help? Contact Support", "Necesitas ayuda? Contacta con soporte")}</a>
              </div>
              ${!orderPaid
                ? `<p class="helper-copy" data-order-sync-status>${tx("Checking the latest ArionPay payment status...", "Comprobando el estado mas reciente del pago en ArionPay...")}</p>`
                : ""
              }
            </article>
          </div>
        </section>
      `;
    }

    if (!cart.length) {
      return `
        <section class="page-hero">
          <div class="container section-stack">
            <div class="empty-state reveal">
              <h1>${tx("Your cart is ready for your next order.", "Tu carrito esta listo para tu proximo pedido.")}</h1>
              <p>${tx("Browse premium products to get started.", "Explora productos premium para empezar.")}</p>
              <a class="btn btn-primary" href="shop.html">${tx("Browse Products", "Ver productos")}</a>
            </div>
          </div>
        </section>
      `;
    }

    return `
      <section class="page-hero">
        <div class="container checkout-shell">
          <div class="checkout-banner reveal">${tx("Free tracked EU shipping on all orders over 200 EUR.", "Envio UE con seguimiento gratis en todos los pedidos superiores a 200 EUR.")}</div>
          <div class="checkout-grid checkout-grid-pro">
            <section class="checkout-main reveal">
              <article class="checkout-card checkout-card-form">
                <div class="section-header">
                  <p class="section-kicker">${tx("Checkout", "Checkout")}</p>
                  <h1>${tx("Billing details and secure payment.", "Datos de facturacion y pago seguro.")}</h1>
                  <p class="lead">${tx("Confirm your delivery details, review the order total, and continue directly to the secure ArionPay payment page.", "Confirma tus datos de entrega, revisa el total del pedido y continua directamente a la pagina segura de pago de ArionPay.")}</p>
                </div>
                <form class="form-grid checkout-form-pro" id="checkout-form" data-checkout-form>
                  <div class="full-width checkout-field-grid">
                    <label>
                      <span>${tx("First name *", "Nombre *")}</span>
                      <input class="form-input" name="firstName" required value="${draft.firstName || ""}">
                    </label>
                    <label>
                      <span>${tx("Last name *", "Apellidos *")}</span>
                      <input class="form-input" name="lastName" required value="${draft.lastName || ""}">
                    </label>
                  </div>
                  <div class="full-width checkout-field-grid">
                    <label>
                      <span>${tx("Email *", "Correo *")}</span>
                      <input class="form-input" name="email" type="email" required value="${draft.email || ""}">
                    </label>
                    <label>
                      <span>${tx("Phone *", "Telefono *")}</span>
                      <input class="form-input" name="phone" required value="${draft.phone || ""}">
                    </label>
                  </div>
                  <label class="full-width">
                    <span>${tx("Company name (optional)", "Nombre de empresa (opcional)")}</span>
                    <input class="form-input" name="company" value="${draft.company || ""}">
                  </label>
                  <label class="full-width">
                    <span>${tx("Country / Region *", "Pais / Region *")}</span>
                    <select class="form-select" name="country" required>
                      ${renderCountryOptions(country.code)}
                    </select>
                  </label>
                  <div class="full-width checkout-field-grid">
                    <label>
                      <span>${tx("Street address *", "Direccion *")}</span>
                      <input class="form-input" name="address" required value="${draft.address || ""}">
                    </label>
                    <label>
                      <span>${tx("Apartment, suite, unit, etc. (optional)", "Apartamento, suite, unidad, etc. (opcional)")}</span>
                      <input class="form-input" name="addressLine2" value="${draft.addressLine2 || ""}">
                    </label>
                  </div>
                  <label class="full-width">
                    <span>${tx("Town / City *", "Ciudad *")}</span>
                    <input class="form-input" name="city" required value="${draft.city || ""}">
                  </label>
                  <div class="full-width checkout-field-grid">
                    <label>
                      <span>${tx("State *", "Estado *")}</span>
                      <select class="form-select" name="state" required>
                        ${renderStateOptions(country.code, region)}
                      </select>
                    </label>
                    <label>
                      <span>${tx("Postal code *", "Codigo postal *")}</span>
                      <input class="form-input" name="postalCode" required value="${draft.postalCode || ""}">
                    </label>
                  </div>
                  <label class="full-width">
                    <span>${tx("Order notes (optional)", "Notas del pedido (opcional)")}</span>
                    <textarea class="form-textarea" name="notes" placeholder="${tx("Delivery notes, support context, or purchase instructions.", "Notas de entrega, contexto de soporte o instrucciones de compra.")}">${draft.notes || ""}</textarea>
                  </label>
                  <input type="hidden" name="paymentMethod" value="${payment.id}">
                  <input type="hidden" name="paymentCurrency" value="${cryptoCurrency.id}">
                </form>
              </article>
            </section>
            <aside class="summary-card checkout-side reveal reveal-delay">
              <div class="section-header">
                <p class="section-kicker">${tx("Summary", "Resumen")}</p>
                <h2 class="section-title">${tx("Order overview", "Resumen del pedido")}</h2>
              </div>
              <div class="order-line-items">${renderOrderLineItems(cart)}</div>
              <div class="summary-divider"></div>
              <div class="checkout-side-section">
                <p class="checkout-eyebrow">${tx("Delivery method", "Metodo de envio")}</p>
                <div class="checkout-choice-list">
                  ${DELIVERY_OPTIONS.map((item) => renderSidebarDeliveryChoice(item, delivery.id, total)).join("")}
                </div>
              </div>
              <div class="summary-list">
                <div class="summary-row"><span class="summary-label">${tx("Subtotal", "Subtotal")}</span><strong>${formatPrice(total)}</strong></div>
                <div class="summary-row"><span class="summary-label">${tx("Shipping", "Envio")}</span><strong>${shippingCost === 0 ? tx("Free", "Gratis") : formatPrice(shippingCost)}</strong></div>
                <div class="summary-row"><span class="summary-label">${tx("Estimated total", "Total estimado")}</span><strong>${formatPrice(grandTotal)}</strong></div>
              </div>
              <div class="checkout-side-section">
                <p class="checkout-eyebrow">${tx("Payment method", "Metodo de pago")}</p>
                <div class="checkout-choice-list">
                  ${ACTIVE_PAYMENT_OPTIONS.map((item) => renderSidebarPaymentChoice(item, payment.id)).join("")}
                </div>
                <p class="checkout-side-note">${tx("The live checkout asset for this store is USDT (TRC20). You will continue to ArionPay after the order details are confirmed.", "El activo activo para este checkout es USDT (TRC20). Continuaras a ArionPay una vez confirmados los datos del pedido.")}</p>
              </div>
              <div class="support-chip-row">
                <div class="support-chip">${tx("Selected delivery", "Envio elegido")}: ${localize(delivery.label)}</div>
                <div class="support-chip">${tx("Selected payment", "Pago elegido")}: ${paymentLabel}</div>
              </div>
              <label class="checkout-agreement">
                <input type="checkbox" name="ageConfirmed" form="checkout-form" ${agreements.ageConfirmed ? "checked" : ""} required>
                <span>${tx("I confirm that I am purchasing for laboratory research use only, that I am of legal age, and that I have read the terms and privacy policy.", "Confirmo que compro solo para investigacion de laboratorio, que soy mayor de edad y que he leido los terminos y la politica de privacidad.")}</span>
              </label>
              <button class="btn btn-primary btn-block" type="submit" form="checkout-form" data-checkout-submit>${checkoutSubmitLabel(payment)}</button>
              <a class="btn btn-secondary btn-block" href="cart.html">${tx("Back to cart", "Volver al carrito")}</a>
              <p class="helper-copy" data-checkout-status>${checkoutHelperCopy(payment)}</p>
            </aside>
          </div>
        </div>
      </section>
    `;
  }

  function renderLegalPage(pageKey) {
    const page = LEGAL_PAGES[pageKey];

    if (!page) {
      return `
        <section class="page-hero">
          <div class="container empty-state">
            <h1>${tx("Page not found", "Página no encontrada")}</h1>
            <a class="btn btn-primary" href="index.html">${tx("Back home", "Volver al inicio")}</a>
          </div>
        </section>
      `;
    }

    const sections = page.sections.map((section) => `
      <article class="policy-card">
        <h3>${localize(section.title)}</h3>
        ${section.body.map((paragraph) => `<p>${localize(paragraph)}</p>`).join("")}
      </article>
    `).join("");

    return `
      <section class="page-hero">
        <div class="container policy-layout">
          <aside class="policy-sidebar reveal">
            <article class="detail-card">
              <span class="detail-label">${localize(page.kicker)}</span>
              <strong>${localize(page.title)}</strong>
              <p>${localize(page.lead)}</p>
            </article>
            <div class="policy-links">${renderPolicyLinkList(pageKey)}</div>
          </aside>
          <section class="policy-body reveal reveal-delay">
            <div class="section-header">
              <p class="section-kicker">${localize(page.kicker)}</p>
              <h1>${localize(page.title)}</h1>
              <p class="lead">${localize(page.lead)}</p>
            </div>
            <div class="policy-callout">${tx("For privacy, terms, or order questions, contact support directly through the storefront.", "Para consultas sobre privacidad, terminos o pedidos, contacta directamente con soporte desde la tienda.")}</div>
            ${sections}
          </section>
        </div>
      </section>
    `;
  }

  renderProductCard = function (product, options = {}) {
    const cardClass = options.reveal === false
      ? "product-card product-card-enhanced"
      : `product-card product-card-enhanced reveal${options.delay ? " reveal-delay" : ""}`;
    const actionButton = product.status === "available"
      ? `<button class="btn btn-secondary" type="button" data-add-to-cart="${product.slug}">${localize(COPY.labels.addToCart)}</button>`
      : `<span class="badge badge-ready">${localize(COPY.labels.comingMay)}</span>`;

    return `
      <article class="${cardClass}">
        ${renderProductVisual(product, "card")}
        <div class="card-body">
          <div class="card-meta">
            <span class="status-pill ${product.status === "available" ? "available" : "coming"}">${productStatusLabel(product)}</span>
            <strong class="card-price">${productPriceLabel(product)}</strong>
          </div>
          <h3>${localize(product.name)} ${product.dosage}</h3>
          <p class="card-copy">${localize(product.short)}</p>
          <div class="product-action-row">
            <a class="text-link" href="product.html?slug=${product.slug}">${localize(COPY.labels.viewProduct)}</a>
            ${actionButton}
          </div>
        </div>
      </article>
    `;
  };

  function renderEnhancedHomePage() {
    const liveCount = availableProducts().length;
    const featured = bestSellerProducts()
      .map((product, index) => renderProductCard(product, { delay: index % 2 === 1 }))
      .join("");

    return `
      <section class="hero-home">
        <div class="container hero-grid">
          <div class="hero-copy reveal">
            <p class="kicker">${tx("Secure Access to High-Quality Research Compounds", "Acceso seguro a compuestos de alta calidad")}</p>
            <h1>${tx(
              "Trusted Peptide Research Products for Serious Buyers",
              "Productos de investigacion peptidica de confianza para compradores serios"
            )}</h1>
            <p class="lead">${tx(
              "Browse premium-grade products, secure crypto checkout, and a smoother buying experience built for real customers.",
              "Explora productos premium, checkout crypto seguro y una experiencia de compra mas fluida para clientes reales."
            )}</p>
            <div class="hero-actions">
              <a class="btn btn-primary" href="shop.html">${tx("Shop Now", "Comprar ahora")}</a>
              <a class="btn btn-secondary" href="#featured-products">${tx("Browse Products", "Ver productos")}</a>
            </div>
            <div class="hero-trust">
              <div class="trust-chip">
                <strong>${tx("Batch-linked listings", "Listados vinculados a lote")}</strong>
                <span>${tx("Clear product context before checkout.", "Contexto claro del producto antes del checkout.")}</span>
              </div>
              <div class="trust-chip">
                <strong>${tx("Protected customer accounts", "Cuentas protegidas")}</strong>
                <span>${tx("Profile and order history in one secure area.", "Perfil e historial en una sola area segura.")}</span>
              </div>
              <div class="trust-chip">
                <strong>${tx("Fast order processing", "Procesamiento rapido")}</strong>
                <span>${tx("Dispatch targets stay visible before payment.", "Los objetivos de salida siguen visibles antes del pago.")}</span>
              </div>
              <div class="trust-chip">
                <strong>${tx("USDT checkout via ArionPay", "Checkout USDT con ArionPay")}</strong>
                <span>${tx("Exact amount shown on the secure hosted page.", "Cantidad exacta mostrada en la pagina segura alojada.")}</span>
              </div>
            </div>
          </div>
          <div class="hero-stack reveal reveal-delay">
            <article class="panel panel-dark">
              <p class="panel-kicker">${tx("Built for Customer Confidence", "Pensado para generar confianza")}</p>
              <h2>${tx(
                "Secure access to high-quality research compounds, shaped around clear batch context and a calmer route to payment.",
                "Acceso seguro a compuestos de alta calidad, pensado alrededor de un contexto de lote claro y una ruta de pago mas tranquila."
              )}</h2>
              <div class="metric-grid">
                <div class="metric-card"><strong>${liveCount}</strong><small>${tx("live products", "productos activos")}</small></div>
                <div class="metric-card"><strong>24h</strong><small>${tx("dispatch target", "objetivo de salida")}</small></div>
                <div class="metric-card"><strong>USDT</strong><small>${tx("secure hosted checkout", "checkout seguro alojado")}</small></div>
              </div>
            </article>
            <article class="hero-visual hero-visual-photo reveal">
              <img src="${HERO_VISUAL_SRC}" alt="Primus Peptides laboratory handling visual">
              <div class="overlay-card">${tx(
                "Real laboratory-support visuals, branded packshots, and stronger trust placement help the storefront feel more accountable before checkout begins.",
                "Los visuales reales de apoyo de laboratorio, los packshots de marca y una mejor colocacion de confianza hacen que la tienda se sienta mas responsable antes del checkout."
              )}</div>
            </article>
          </div>
        </div>
      </section>
      <section class="section section-tight">
        <div class="container trust-grid">${renderTrustCards()}</div>
      </section>
      <section class="section section-tight">
        <div class="container section-stack">
          <div class="section-header reveal">
            <p class="section-kicker">${tx("Why Customers Choose Primus", "Por que los clientes eligen Primus")}</p>
            <h2 class="section-title">${tx(
              "Secure cryptocurrency payments, fast order processing, premium product standards, and professional customer support.",
              "Pagos seguros con criptomonedas, procesamiento rapido, estandares premium y soporte profesional."
            )}</h2>
          </div>
          <div class="detail-grid commerce-promise-grid">${renderHomePromiseCards()}</div>
        </div>
      </section>
      <section class="section section-tight">
        <div class="container section-stack">
          <div class="section-header reveal">
            <p class="section-kicker">${tx("Shop Premium Research Categories", "Compra categorias premium de investigacion")}</p>
            <h2 class="section-title">${tx(
              "Browse research lanes with cleaner spacing, clearer dosage cues, and stronger catalog storytelling.",
              "Recorre lineas de investigacion con mejor espacio, dosis mas claras y un catalogo con mas narrativa."
            )}</h2>
          </div>
          <div class="objective-grid">${renderGoalCards()}</div>
        </div>
      </section>
      <section class="section" id="featured-products">
        <div class="container section-stack">
          <div class="section-header reveal">
            <p class="section-kicker">${tx("Shop Premium Research Categories", "Compra categorias premium de investigacion")}</p>
            <h2 class="section-title">${tx(
              "Featured products arranged for faster comparison and a more premium first pass.",
              "Productos destacados organizados para comparar mas rapido y con una primera impresion mas premium."
            )}</h2>
          </div>
          <div class="catalog-grid">${featured}</div>
        </div>
      </section>
      <section class="section section-tight">
        <div class="container shipping-layout">
          <article class="shipping-card reveal">
            <div class="section-header">
              <p class="section-kicker">${tx("Shipping clarity", "Claridad de envios")}</p>
              <h2 class="section-title">${tx(
                "Fast processing and clear order updates after successful payment.",
                "Procesamiento rapido y actualizaciones claras tras el pago."
              )}</h2>
            </div>
            <table class="shipping-table">
              <thead>
                <tr>
                  <th>${tx("Region", "Zona")}</th>
                  <th>${tx("Timing", "Tiempo")}</th>
                  <th>${tx("Price", "Precio")}</th>
                </tr>
              </thead>
              <tbody>${renderShippingRows()}</tbody>
            </table>
          </article>
          <article class="info-panel reveal reveal-delay">
            <p class="panel-kicker">${tx("Secure payment confidence", "Confianza en el pago seguro")}</p>
            <h3>${tx(
              "Exact payment amounts are confirmed automatically for a smooth order process.",
              "Los importes exactos se confirman automaticamente para un proceso de pedido mas fluido."
            )}</h3>
            <p class="section-copy">${tx(
              "Customers can review delivery, totals, and payment guidance on the store before moving into the hosted ArionPay page for final payment.",
              "Los clientes pueden revisar envio, total y guia de pago en la tienda antes de pasar a ArionPay para el pago final."
            )}</p>
            <div class="policy-links commerce-inline-links">
              <a href="shipping.html">${tx("Shipping policy", "Politica de envios")}</a>
              <a href="terms.html">${tx("Terms", "Terminos")}</a>
              <a href="contact.html">${tx("Need Help? Contact Support", "Necesitas ayuda? Contacta con soporte")}</a>
            </div>
          </article>
        </div>
      </section>
      <section class="section section-tight">
        <div class="container section-stack">
          <div class="section-header reveal">
            <p class="section-kicker">${tx("How ordering works", "Como funciona el pedido")}</p>
            <h2 class="section-title">${tx(
              "From first click to payment confirmation, the buying path stays clear, calm, and accountable.",
              "Desde el primer clic hasta la confirmacion del pago, el recorrido de compra se mantiene claro, tranquilo y responsable."
            )}</h2>
          </div>
          <div class="detail-grid journey-grid">${renderOrderJourneyCards()}</div>
        </div>
      </section>
      <section class="section section-tight">
        <div class="container section-stack">
          <div class="section-header reveal">
            <p class="section-kicker">${tx("Built for Customer Confidence", "Pensado para generar confianza")}</p>
            <h2 class="section-title">${tx(
              "Protected accounts, secure crypto payments, and transparent order flow designed to earn trust.",
              "Cuentas protegidas, pagos crypto seguros y un flujo de pedido transparente disenado para ganar confianza."
            )}</h2>
          </div>
          <div class="proof-grid">${renderProofCards()}</div>
        </div>
      </section>
      <section class="section section-tight">
        <div class="container section-stack">
          <div class="section-header reveal">
            <p class="section-kicker">${tx("Testimonials", "Testimonios")}</p>
            <h2 class="section-title">${tx(
              "A specialist store should feel accountable before a customer commits to buy.",
              "Una tienda especialista debe sentirse responsable antes de que el cliente se comprometa a comprar."
            )}</h2>
          </div>
          <div class="testimonial-grid">${renderTestimonialCards()}</div>
        </div>
      </section>
    `;
  }

  renderShopGrid = function () {
    const filtered = filteredShopProducts();
    const meta = document.querySelector("[data-shop-meta]");
    const grid = document.querySelector("[data-shop-grid]");

    if (!grid || !meta) {
      return;
    }

    meta.innerHTML = renderShopMeta(filtered);

    if (!filtered.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <h3>${tx("No products matched this view.", "No hay productos para esta vista.")}</h3>
          <p>${tx(
            "Try another research lane, change availability, or clear the search term.",
            "Prueba otra linea de investigacion, cambia la disponibilidad o limpia la busqueda."
          )}</p>
          <button class="btn btn-secondary" type="button" data-shop-reset>${tx("Reset catalogue view", "Reiniciar vista del catalogo")}</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered
      .map((product, index) => renderProductCard(product, { reveal: false, delay: index % 2 === 1 }))
      .join("");
  };

  renderShopPage = function () {
    syncShopStateFromLocation();

    const liveCount = availableProducts().length;
    const launchCount = comingSoonProducts().length;
    const selectedGoal = goalConfig(shopGoal);
    const selectedLaneCount = shopGoal === "all" ? PRODUCTS.length : laneProducts(shopGoal).length;

    return `
      <section class="page-hero">
        <div class="container page-hero-grid">
          <div class="section-header reveal">
            <p class="section-kicker">${tx("Shop Premium Research Categories", "Compra categorias premium de investigacion")}</p>
            <h1>${tx("Shop Premium Research Categories", "Compra categorias premium de investigacion")}</h1>
            <p class="lead">${tx(
              "Find the right products with a cleaner catalog built for fast browsing.",
              "Encuentra el producto adecuado con un catalogo mas limpio y facil de recorrer."
            )}</p>
          </div>
          <aside class="page-stat-card reveal reveal-delay">
            <p class="panel-kicker">${tx("Current view", "Vista actual")}</p>
            <h3>${localize(selectedGoal.label)}</h3>
            <p class="lead">${localize(selectedGoal.summary)}</p>
            <div class="page-stat-list">
              <div class="page-stat-item"><strong>${selectedLaneCount}</strong><span>${tx("products in this view", "productos en esta vista")}</span></div>
              <div class="page-stat-item"><strong>${liveCount}</strong><span>${tx("available now", "disponibles ahora")}</span></div>
              <div class="page-stat-item"><strong>${launchCount}</strong><span>${tx("coming soon", "proximamente")}</span></div>
              <div class="page-stat-item"><strong>USDT</strong><span>${tx("ArionPay checkout", "checkout ArionPay")}</span></div>
            </div>
          </aside>
        </div>
      </section>
      <section class="section section-tight">
        <div class="container section-stack">
          <article class="detail-card reveal">
            <div class="shop-toolbar">
              <div class="shop-toolbar-row">
                <label class="shop-search-field">
                  <span class="detail-label">${tx("Search", "Buscar")}</span>
                  <input class="search-input" type="search" value="${shopQuery}" placeholder="${localize(COPY.labels.searchPlaceholder)}" data-shop-search>
                </label>
                <label class="shop-sort-field">
                  <span class="detail-label">${tx("Sort", "Ordenar")}</span>
                  <select class="form-select" data-shop-sort>
                    ${renderShopSortOptions()}
                  </select>
                </label>
              </div>
              <div class="shop-toolbar-row shop-toolbar-row-wrap">
                <div class="goal-row">
                  ${renderShopGoalButtons()}
                </div>
              </div>
              <div class="shop-toolbar-row shop-toolbar-row-wrap">
                <div class="filter-row">
                  <button type="button" class="filter-chip ${shopFilter === "all" ? "is-active" : ""}" data-stock-filter="all">${tx("All products", "Todos los productos")}</button>
                  <button type="button" class="filter-chip ${shopFilter === "available" ? "is-active" : ""}" data-stock-filter="available">${tx("Available", "Disponible")}</button>
                  <button type="button" class="filter-chip ${shopFilter === "coming" ? "is-active" : ""}" data-stock-filter="coming">${tx("Coming soon", "Proximamente")}</button>
                </div>
                <button class="btn btn-secondary btn-small" type="button" data-shop-reset>${tx("Clear filters", "Limpiar filtros")}</button>
              </div>
            </div>
          </article>
          <div class="catalog-meta reveal" data-shop-meta></div>
          <div class="catalog-grid" data-shop-grid></div>
        </div>
      </section>
    `;
  };

  renderProductPage = function () {
    const product = currentProduct();
    const cart = readCart();
    const total = subtotal(cart);
    const progress = Math.min((total / FREE_SHIPPING_THRESHOLD) * 100, 100);
    const galleryImages = allGalleryImages(product);

    if (activeProductGallerySlug !== product.slug) {
      activeProductGallerySlug = product.slug;
      activeProductGalleryImage = 0;
    }

    const activeImage = galleryImages[activeProductGalleryImage] || galleryImages[0] || product.image;
    const visualProduct = activeImage === product.image ? product : { ...product, image: activeImage };
    const gallery = galleryImages
      .map((image, index) => `
        <button class="gallery-thumb gallery-thumb-enhanced ${index === activeProductGalleryImage ? "is-active" : ""}" type="button" data-gallery-image="${index}">
          <span class="gallery-thumb-label">${galleryImageLabel(image, index)}</span>
          <img class="gallery-image gallery-image-${imagePresentationKind(image)}" src="${image}" alt="${localize(product.name)} ${product.dosage}">
        </button>
      `)
      .join("");
    const laneTags = productGoals(product)
      .map((goal) => `<span class="product-tag">${localize(goalConfig(goal).label)}</span>`)
      .join("");
    const related = relatedProductsFor(product)
      .map((item, index) => renderProductCard(item, { delay: index % 2 === 1 }))
      .join("");
    const tabPanel = activeProductTab === "description"
      ? renderProductDescriptionEnhanced(product)
      : renderProductAdditionalEnhanced(product);

    const actionBlock = product.status === "available"
      ? `
        <div class="quantity-row" data-quantity-root>
          <span>${tx("Quantity", "Cantidad")}</span>
          <div class="quantity-controls">
            <button class="qty-btn" type="button" data-qty-action="decrease">-</button>
            <strong data-quantity-value>1</strong>
            <button class="qty-btn" type="button" data-qty-action="increase">+</button>
          </div>
        </div>
        <button class="btn btn-primary btn-block" type="button" data-add-to-cart="${product.slug}">${tx("Add to Cart", "Anadir al carrito")}</button>
      `
      : `
        <div class="stock-pill coming">${tx("Coming May", "Llega en mayo")}</div>
        <p class="product-subtext">${tx("Pricing and release details will appear once the launch batch is ready.", "Los detalles de precio y lanzamiento apareceran cuando el lote este listo.")}</p>
        <button class="btn btn-muted btn-block" type="button" disabled>${tx("Coming Soon", "Proximamente")}</button>
      `;

    const stickyCta = product.status === "available"
      ? `
        <div class="product-sticky-cta-spacer" aria-hidden="true"></div>
        <div class="product-sticky-cta">
          <div class="product-sticky-cta-copy">
            <strong>${localize(product.name)} ${product.dosage}</strong>
            <span>${productPriceLabel(product)} · ${tx("Batch", "Lote")} ${product.batch}</span>
          </div>
          <button class="btn btn-primary" type="button" data-add-to-cart="${product.slug}">${tx("Add to Cart", "Anadir al carrito")}</button>
        </div>
      `
      : "";

    return `
      <section class="page-hero">
        <div class="container product-main">
          <p class="breadcrumb">${tx("Home", "Inicio")} / ${tx("Shop", "Tienda")} / ${localize(product.name)} ${product.dosage}</p>
          <div class="product-layout">
            <div class="gallery-grid reveal">
              <div class="product-main-image product-main-image-enhanced">
                ${renderProductVisual(visualProduct, "detail")}
                <div class="product-visual-meta-strip">
                  <span>${tx("Batch-linked presentation", "Presentacion vinculada a lote")}</span>
                  <span>${tx("COA-ready listing", "Listado listo para COA")}</span>
                  <span>${tx("ArionPay checkout route", "Ruta de checkout ArionPay")}</span>
                </div>
              </div>
              <div class="gallery-thumb-grid">${gallery}</div>
            </div>
            <aside class="panel product-panel reveal reveal-delay">
              <div class="card-meta">
                <span class="status-pill ${product.status === "available" ? "available" : "coming"}">${productStatusLabel(product)}</span>
                <span class="badge">${localize(COPY.labels.hplc)}</span>
              </div>
              <p class="panel-kicker">${tx("Premium product overview", "Resumen premium del producto")}</p>
              <h1>${localize(product.name)} ${product.dosage}</h1>
              <div class="card-tag-row">
                ${laneTags}
                <span class="product-tag product-tag-muted">${product.batch}</span>
              </div>
              <p class="product-subtext">${localize(product.short)}</p>
              <div class="product-buyer-note">
                <strong>${tx("Built for confident ordering", "Pensado para pedir con confianza")}</strong>
                <p>${tx(
                  "Clear batch context, exact pricing, and secure hosted payment guidance stay visible before the customer leaves the store.",
                  "El contexto de lote, el precio exacto y la guia de pago seguro siguen visibles antes de salir de la tienda."
                )}</p>
              </div>
              <div class="price-row">
                <strong class="price-value">${productPriceLabel(product)}</strong>
                <span>${product.status === "available" ? "EUR" : tx("Release pending", "Lanzamiento pendiente")}</span>
              </div>
              <div class="product-trust">
                <div class="trust-icon trust-icon-detail">
                  <strong>${tx("Batch-linked listing", "Listado vinculado a lote")}</strong>
                  <span>${tx("Latest analysis data remains visible before checkout.", "Los datos del ultimo analisis siguen visibles antes del checkout.")}</span>
                </div>
                <div class="trust-icon trust-icon-detail">
                  <strong>${tx("Secure hosted payment", "Pago seguro alojado")}</strong>
                  <span>${tx("ArionPay shows the exact USDT amount on the final secure page.", "ArionPay muestra la cantidad exacta de USDT en la pagina segura final.")}</span>
                </div>
                <div class="trust-icon trust-icon-detail">
                  <strong>${tx("Responsive order support", "Soporte de pedido accesible")}</strong>
                  <span>${tx("Shipping, policy, and support links stay close to the buying decision.", "Los enlaces de envio, politicas y soporte se mantienen cerca de la decision de compra.")}</span>
                </div>
              </div>
              <div class="shipping-progress">
                <div class="shipping-progress-bar" style="width:${progress}%"></div>
                <p>${shippingProgressCopy(total)}</p>
              </div>
              <div class="support-list product-confidence-panel">
                <strong>${tx("Quality standards and payment confidence", "Estandares de calidad y confianza de pago")}</strong>
                <p>${tx(
                  "Batch context, shipping clarity, and secure hosted payment guidance stay visible before the customer leaves the store.",
                  "El contexto de lote, la claridad de envio y la guia de pago seguro permanecen visibles antes de salir de la tienda."
                )}</p>
                <div class="support-chip-row">
                  <div class="support-chip">${tx("Batch", "Lote")}: ${product.batch}</div>
                  <div class="support-chip">${tx("Last analysis", "Ultimo analisis")}: ${formatDate(product.coaDate)}</div>
                  <div class="support-chip">${tx("Dispatch target", "Objetivo de salida")}: 24h</div>
                  <div class="support-chip">${tx("Support", "Soporte")}: ${SITE_EMAIL}</div>
                </div>
                <div class="product-policy-links">
                  <a href="shipping.html">${tx("Shipping", "Envios")}</a>
                  <a href="terms.html">${tx("Terms", "Terminos")}</a>
                  <a href="contact.html">${tx("Need Help? Contact Support", "Necesitas ayuda? Contacta con soporte")}</a>
                </div>
              </div>
              <div class="product-buy-box">
                <div class="product-buy-box-head">
                  <span class="detail-label">${tx("Secure Checkout", "Checkout seguro")}</span>
                  <strong>${tx("Review the essentials before moving into payment.", "Revisa lo esencial antes de pasar al pago.")}</strong>
                  <p>${tx(
                    "Batch, dispatch, and payment-route details stay visible here so the secure handoff feels clear instead of rushed.",
                    "Los detalles de lote, salida y ruta de pago permanecen visibles aqui para que el paso seguro se sienta claro y no apresurado."
                  )}</p>
                </div>
                ${renderPurchaseFacts(product)}
                <div class="product-buy-actions">
                  ${actionBlock}
                </div>
                <p class="product-buy-note">${tx(
                  "Exact payment amounts are confirmed automatically for a smoother order process once ArionPay shows the final USDT amount.",
                  "Los importes exactos se confirman automaticamente para un proceso mas fluido cuando ArionPay muestra la cantidad final de USDT."
                )}</p>
              </div>
            </aside>
          </div>
        </div>
      </section>
      <section class="section section-tight">
        <div class="container section-stack">
          <div class="detail-grid product-quick-grid reveal">
            <article class="detail-card">
              <span class="detail-label">${tx("Quick summary", "Resumen rapido")}</span>
              <strong>${tx("Product summary", "Resumen del producto")}</strong>
              <p>${localize(product.short)}</p>
            </article>
            <article class="detail-card">
              <span class="detail-label">${tx("Benefits", "Beneficios")}</span>
              <strong>${localize(product.name)} ${product.dosage}</strong>
              <p>${localize(product.focus)}</p>
            </article>
            <article class="detail-card">
              <span class="detail-label">${tx("Payment trust", "Confianza de pago")}</span>
              <strong>${tx("Exact payment amounts are confirmed automatically for a smooth order process.", "Los importes exactos se confirman automaticamente para un proceso mas fluido.")}</strong>
              <p>${tx(
              "Customers review shipping on-site first, then ArionPay shows the exact USDT amount and network on the secure page before payment is sent.",
              "Los clientes revisan primero el envio dentro del sitio y despues ArionPay muestra la cantidad exacta y la red antes del pago."
            )}</p>
            </article>
          </div>
        </div>
      </section>
      <section class="section section-tight">
        <div class="container">
          <article class="tabs-card reveal">
            <div class="tab-row">
              <button type="button" class="tab-button ${activeProductTab === "description" ? "is-active" : ""}" data-tab="description">${tx("Product Overview", "Resumen del producto")}</button>
              <button type="button" class="tab-button ${activeProductTab === "additional" ? "is-active" : ""}" data-tab="additional">${tx("Research Guide", "Guia de investigacion")}</button>
            </div>
            <div data-tab-panel>${tabPanel}</div>
          </article>
        </div>
      </section>
      <section class="section section-tight">
        <div class="container section-stack">
          <div class="section-header reveal">
            <p class="section-kicker">${tx("Buyer FAQ", "FAQ de compra")}</p>
            <h2 class="section-title">${tx(
              "Shipping, payment, and quality questions before secure checkout.",
              "Preguntas sobre envio, pago y calidad antes del checkout seguro."
            )}</h2>
          </div>
          <div class="faq-list product-faq-list reveal">${renderProductFaq(product)}</div>
        </div>
      </section>
      <section class="section section-tight">
        <div class="container section-stack">
          <div class="section-header reveal">
            <p class="section-kicker">${tx("Related products", "Productos relacionados")}</p>
            <h2 class="section-title">${tx("Compare nearby compounds without losing the buying flow.", "Compara compuestos cercanos sin perder el flujo de compra.")}</h2>
          </div>
          <div class="related-grid">${related}</div>
        </div>
      </section>
      ${stickyCta}
    `;
  };

  renderProductCard = function (product, options = {}) {
    const cardClass = options.reveal === false
      ? "product-card product-card-enhanced"
      : `product-card product-card-enhanced reveal${options.delay ? " reveal-delay" : ""}`;
    const actionButton = product.status === "available"
      ? `<button class="btn btn-secondary" type="button" data-add-to-cart="${product.slug}">${localize(COPY.labels.addToCart)}</button>`
      : `<span class="badge badge-ready">${localize(COPY.labels.comingMay)}</span>`;
    const tags = productGoals(product)
      .slice(0, 2)
      .map((goal) => `<span class="product-tag">${localize(goalConfig(goal).label)}</span>`)
      .join("");
    const cardBadge = product.status === "available"
      ? tx("Secure checkout ready", "Listo para checkout seguro")
      : tx("Launch batch", "Lote de lanzamiento");
    const trustBits = product.status === "available"
      ? [
        tx("Batch-linked", "Lote visible"),
        tx("COA-ready", "COA listo"),
        tx("24h target", "Objetivo 24h")
      ]
      : [
        tx("Launch batch", "Lote de lanzamiento"),
        tx("Archive ready", "Archivo listo"),
        tx("Release updates", "Actualizaciones de salida")
      ];

    return `
      <article class="${cardClass}">
        ${renderProductVisual(product, "card")}
        <div class="card-body">
          <div class="card-storyline">
            <span class="card-storyline-label">${tx("Research compound", "Compuesto de investigacion")}</span>
            <span class="card-badge-soft">${cardBadge}</span>
          </div>
          <div class="card-meta">
            <span class="status-pill ${product.status === "available" ? "available" : "coming"}">${productStatusLabel(product)}</span>
            <strong class="card-price">${productPriceLabel(product)}</strong>
          </div>
          <div class="card-tag-row">
            ${tags}
          </div>
          <h3>${localize(product.name)} ${product.dosage}</h3>
          <p class="card-copy">${localize(product.short)}</p>
          <div class="card-confidence-row">
            ${trustBits.map((item) => `<span>${item}</span>`).join("")}
          </div>
          <div class="product-action-row">
            <a class="text-link" href="product.html?slug=${product.slug}">${localize(COPY.labels.viewProduct)}</a>
            ${actionButton}
          </div>
        </div>
      </article>
    `;
  };

  function renderCheckoutStage(activeStep) {
    const steps = [
      {
        id: "cart",
        number: "01",
        label: tx("Cart review", "Revision del carrito"),
        note: tx("Items and delivery", "Articulos y envio")
      },
      {
        id: "checkout",
        number: "02",
        label: tx("Checkout details", "Detalles de checkout"),
        note: tx("Billing and shipping", "Facturacion y envio")
      },
      {
        id: "payment",
        number: "03",
        label: tx("Secure payment", "Pago seguro"),
        note: tx("ArionPay invoice", "Factura ArionPay")
      }
    ];
    const currentIndex = steps.findIndex((step) => step.id === activeStep);

    return `
      <div class="checkout-stage reveal">
        ${steps.map((step, index) => `
          <div class="checkout-stage-item ${index < currentIndex ? "is-complete" : ""} ${index === currentIndex ? "is-active" : ""}">
            <span class="checkout-stage-step">${step.number}</span>
            <div class="checkout-stage-copy">
              <strong class="checkout-stage-label">${step.label}</strong>
              <span class="checkout-stage-note">${step.note}</span>
            </div>
          </div>
        `).join("")}
      </div>
    `;
  }

  function renderOrderReviewSteps(total, cart = []) {
    return `
      <div class="step-list checkout-step-list">
        <div class="detail-card">
          <span class="detail-label">${tx("Step 1", "Paso 1")}</span>
          <strong>${tx("Review the order", "Revisa el pedido")}</strong>
          <p>${tx("Confirm quantities, product mix, and shipping selection before leaving the cart.", "Confirma cantidades, mezcla de productos y envio antes de salir del carrito.")}</p>
        </div>
        <div class="detail-card">
          <span class="detail-label">${tx("Step 2", "Paso 2")}</span>
          <strong>${tx("Complete billing details", "Completa los datos de facturacion")}</strong>
          <p>${tx("Country, address, and contact details carry directly into the live payment handoff.", "Pais, direccion y contacto pasan directamente a la entrega del pago en vivo.")}</p>
        </div>
        <div class="detail-card">
          <span class="detail-label">${tx("Step 3", "Paso 3")}</span>
          <strong>${tx("Continue to Secure Crypto Payment", "Continua al pago seguro con criptomonedas")}</strong>
          <p>${total >= FREE_SHIPPING_THRESHOLD
            ? tx("Free EU shipping is already unlocked before payment opens, and ArionPay shows the exact USDT amount next.", "El envio UE gratuito ya esta activado antes de abrir el pago y ArionPay mostrara despues la cantidad exacta de USDT.")
            : tx("The hosted invoice opens immediately after order confirmation and shows the exact USDT amount next.", "La factura alojada se abre justo despues de confirmar el pedido y muestra despues la cantidad exacta de USDT.")
          }</p>
        </div>
      </div>
    `;
  }

  renderOrderLineItems = function (items) {
    return items.map((item) => {
      const product = item.slug ? getProduct(item.slug) : item.product;

      if (!product) {
        return "";
      }

      const lineTotal = typeof item.lineTotal === "number"
        ? item.lineTotal
        : (product.price || 0) * item.quantity;

      return `
        <div class="order-review-item">
          <span class="order-review-media">
            <img src="${product.image}" alt="${localize(product.name)} ${product.dosage}">
          </span>
          <div class="order-review-copy">
            <strong>${localize(product.name)} ${product.dosage}</strong>
            <p>${tx("Qty", "Cant.")}: ${item.quantity} · ${product.batch}</p>
          </div>
          <strong>${typeof lineTotal === "number" && lineTotal > 0 ? formatPrice(lineTotal) : tx("Pending", "Pendiente")}</strong>
        </div>
      `;
    }).join("");
  };

  renderCartItems = function (cart) {
    if (!cart.length) {
      return `
        <div class="cart-empty">
          <h3>${tx("Your cart is ready for your next order.", "Tu carrito esta listo para tu proximo pedido.")}</h3>
          <p>${tx("Browse premium products to get started.", "Explora productos premium para empezar.")}</p>
          <a class="btn btn-primary" href="shop.html">${tx("Browse Products", "Ver productos")}</a>
        </div>
      `;
    }

    return `
      <div class="cart-items">
        ${cart.map((item) => {
          const product = getProduct(item.slug);
          const lane = localize(goalConfig(primaryGoal(product)).label);
          const lineTotal = typeof product.price === "number"
            ? product.price * item.quantity
            : null;

          return `
            <article class="cart-line-card">
              <a class="cart-line-media" href="product.html?slug=${product.slug}">
                <img src="${product.image}" alt="${localize(product.name)} ${product.dosage}">
              </a>
              <div class="cart-line-copy">
                <div class="card-tag-row">
                  <span class="product-tag">${lane}</span>
                  <span class="product-tag product-tag-muted">${product.batch}</span>
                </div>
                <h3>${localize(product.name)} ${product.dosage}</h3>
                <p class="card-copy">${localize(product.short)}</p>
                <div class="cart-line-meta">
                  <span>${tx("Unit price", "Precio unitario")}: ${product.price ? formatPrice(product.price) : localize(COPY.labels.priceOnRelease)}</span>
                  <span>${tx("Dispatch", "Salida")}: ${tx("24h target", "Objetivo 24h")}</span>
                </div>
                <div class="cart-line-links">
                  <a class="text-link" href="product.html?slug=${product.slug}">${localize(COPY.labels.viewProduct)}</a>
                  <button class="remove-link" type="button" data-cart-action="remove" data-cart-slug="${product.slug}">${tx("Remove", "Eliminar")}</button>
                </div>
              </div>
              <div class="cart-line-controls">
                <div class="quantity-controls">
                  <button class="cart-action" type="button" data-cart-action="decrease" data-cart-slug="${product.slug}">-</button>
                  <strong>${item.quantity}</strong>
                  <button class="cart-action" type="button" data-cart-action="increase" data-cart-slug="${product.slug}">+</button>
                </div>
                <div class="cart-line-total">
                  <span class="summary-label">${tx("Line total", "Total linea")}</span>
                  <strong class="summary-price">${lineTotal !== null ? formatPrice(lineTotal) : localize(COPY.labels.priceOnRelease)}</strong>
                </div>
              </div>
            </article>
          `;
        }).join("")}
      </div>
    `;
  };

  renderSidebarDeliveryChoice = function (option, currentId, total) {
    const price = deliveryPrice(option, total);

    return `
      <label class="checkout-choice ${currentId === option.id ? "is-selected" : ""}" data-choice-card data-choice-name="shippingMethod" data-choice-value="${option.id}">
        <input type="radio" name="shippingMethod" value="${option.id}" form="checkout-form" ${currentId === option.id ? "checked" : ""}>
        <div class="checkout-choice-copy">
          <div class="checkout-choice-headline">
            <strong>${localize(option.label)}</strong>
            <span class="checkout-choice-price">${price === 0 ? tx("Free", "Gratis") : formatPrice(price)}</span>
          </div>
          <span>${localize(option.note)}</span>
          <small>${localize(option.eta)}</small>
        </div>
      </label>
    `;
  };

  renderSidebarPaymentChoice = function (option, currentId) {
    const activeCurrency = selectedCryptoCurrency();

    return `
      <article class="checkout-choice checkout-choice-payment ${currentId === option.id ? "is-selected" : ""}">
        <div class="checkout-choice-copy">
          <div class="checkout-choice-headline">
            <strong>ArionPay</strong>
            <span class="checkout-choice-price">${activeCurrency.shortLabel}</span>
          </div>
          <span>${tx("Secure hosted cryptocurrency checkout opens after the order details are confirmed.", "El checkout seguro alojado de criptomonedas se abre despues de confirmar los datos del pedido.")}</span>
          <div class="checkout-payment-icons">
            <span>${activeCurrency.shortLabel}</span>
            <span>TRC20</span>
            <span>${tx("Hosted", "Alojado")}</span>
          </div>
        </div>
      </article>
    `;
  };

  renderCartPage = function () {
    const cart = readCart();
    const total = subtotal(cart);
    const delivery = selectedDelivery(total);
    const payment = selectedPayment();
    const shippingCost = cart.length ? cartShippingCost(cart, delivery, total) : 0;
    const grandTotal = total + shippingCost;
    const progress = Math.min((total / FREE_SHIPPING_THRESHOLD) * 100, 100);
    const hasItems = cart.length > 0;

    return `
      <section class="page-hero">
        <div class="container section-stack">
          ${renderCheckoutStage("cart")}
          <div class="cart-layout cart-layout-pro">
            <section class="contact-card reveal">
              <div class="section-header">
                <p class="section-kicker">${tx("Cart", "Carrito")}</p>
                <h1>${tx("Secure Checkout", "Pago seguro")}</h1>
                <p class="lead">${tx("Complete your order safely with encrypted payment processing.", "Completa tu pedido con seguridad mediante procesamiento cifrado.")}</p>
              </div>
              <div class="cart-intro-metrics">
                <div class="purchase-fact">
                  <span>${tx("Items", "Articulos")}</span>
                  <strong>${itemCount(cart)}</strong>
                </div>
                <div class="purchase-fact">
                  <span>${tx("Delivery", "Entrega")}</span>
                  <strong>${hasItems ? localize(delivery.label) : tx("Pending", "Pendiente")}</strong>
                </div>
                <div class="purchase-fact">
                  <span>${tx("Payment", "Pago")}</span>
                  <strong>ArionPay / USDT</strong>
                </div>
              </div>
              ${renderCartItems(cart)}
            </section>
            <aside class="summary-card summary-card-sticky cart-summary-card reveal reveal-delay">
              <div class="section-header">
                <p class="section-kicker">${tx("Order summary", "Resumen del pedido")}</p>
                <h2 class="section-title">${tx("Complete Order", "Completar pedido")}</h2>
              </div>
              <div class="order-line-items">${renderOrderLineItems(cart)}</div>
              <div class="summary-divider"></div>
              <div class="summary-list">
                <div class="summary-row"><span class="summary-label">${tx("Subtotal", "Subtotal")}</span><strong>${formatPrice(total)}</strong></div>
                <div class="summary-row"><span class="summary-label">${tx("Shipping", "Envio")}</span><strong>${shippingCost === 0 ? tx("Free", "Gratis") : formatPrice(shippingCost)}</strong></div>
                <div class="summary-row summary-row-total"><span class="summary-label">${tx("Estimated total", "Total estimado")}</span><strong>${formatPrice(grandTotal)}</strong></div>
              </div>
              <div class="shipping-progress">
                <div class="shipping-progress-bar" style="width:${progress}%"></div>
                <p>${shippingProgressCopy(total)}</p>
              </div>
              <div class="stack-sm" data-cart-preferences>
                <span class="checkout-eyebrow">${tx("Choose delivery before checkout", "Elige envio antes del checkout")}</span>
                <div class="checkout-method-grid">
                  ${DELIVERY_OPTIONS.map((item) => renderDeliveryOption(item, delivery.id, total)).join("")}
                </div>
              </div>
              <div class="support-chip-row">
                <div class="support-chip">${tx("Dispatch target")}: 24h</div>
                <div class="support-chip">${tx("Payment route", "Ruta de pago")}: ArionPay / USDT (TRC20)</div>
              </div>
              ${renderOrderReviewSteps(total, cart)}
              <div class="summary-actions">
                ${hasItems
                  ? `<a class="btn btn-primary btn-block" href="checkout.html">${localize(COPY.labels.checkout)}</a>`
                  : `<button class="btn btn-primary btn-block" type="button" disabled>${localize(COPY.labels.checkout)}</button>`
                }
                <a class="btn btn-secondary btn-block" href="shop.html">${tx("Browse Products", "Ver productos")}</a>
              </div>
              <p class="helper-copy">${hasItems
                ? tx("Your delivery choice carries into checkout and the live ArionPay invoice opens immediately after details are confirmed.", "Tu eleccion de envio pasa al checkout y la factura en vivo de ArionPay se abre justo despues de confirmar los datos.")
                : tx("Add at least one product to activate checkout.", "Agrega al menos un producto para activar el checkout.")
              }</p>
            </aside>
          </div>
        </div>
      </section>
    `;
  };

  renderCheckoutPage = function () {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("status") === "success";
    const returnReference = params.get("reference") || "";
    const cachedOrder = readLastOrder();
    const order = resolveReturnedOrder(success, returnReference, cachedOrder);
    const cart = readCart();
    const total = subtotal(cart);
    const draft = readCheckoutDraft();
    const agreements = readCheckoutAgreements();
    const country = countryConfig(draft.country || "NG");
    const region = normalizeRegion(country.code, draft.state || "");
    const delivery = selectedDelivery(total);
    const payment = ACTIVE_PAYMENT_OPTIONS.find((item) => item.id === (draft.paymentMethod || ACTIVE_PAYMENT_OPTIONS[0].id)) || ACTIVE_PAYMENT_OPTIONS[0];
    const cryptoCurrency = selectedCryptoCurrency();
    const shippingCost = cart.length ? cartShippingCost(cart, delivery, total) : 0;
    const grandTotal = total + shippingCost;
    const paymentLabel = paymentDisplayLabel(payment, cryptoCurrency);
    const sessionCompletedOrder = !success && activeSessionOrder(cachedOrder) && isPaidOrderStatus(cachedOrder.status)
      ? cachedOrder
      : null;
    const completedOrder = success && order && isPaidOrderStatus(order.status)
      ? order
      : sessionCompletedOrder;
    const orderPaid = Boolean(completedOrder);

    if (success && returnReference && !order) {
      return `
        <section class="page-hero">
          <div class="container section-stack">
            ${renderCheckoutStage("payment")}
            <article class="success-card reveal" data-checkout-state="confirming">
              <p class="section-kicker">${tx("Payment received", "Pago recibido")}</p>
              <h1 class="success-title">${tx("We are confirming your order.", "Estamos confirmando tu pedido.")}</h1>
              <p class="success-copy">${tx("We received your return from ArionPay and are now confirming the payment status. This page updates automatically, so please do not pay again.", "Hemos recibido tu retorno desde ArionPay y ahora estamos confirmando el estado del pago. Esta pagina se actualiza automaticamente, por favor no pagues de nuevo.")}</p>
              <div class="order-meta-grid">
                <article class="detail-card"><span class="detail-label">${tx("Order reference", "Referencia")}</span><strong>${returnReference}</strong><p>${tx("ArionPay return detected", "Retorno de ArionPay detectado")}</p></article>
                <article class="detail-card"><span class="detail-label">${tx("Payment status", "Estado del pago")}</span><strong>${tx("Confirming", "Confirmando")}</strong><p>${tx("We are waiting for the final ArionPay confirmation.", "Estamos esperando la confirmacion final de ArionPay.")}</p></article>
                <article class="detail-card"><span class="detail-label">${tx("Next step", "Siguiente paso")}</span><strong>${tx("Automatic verification", "Verificacion automatica")}</strong><p>${tx("As soon as ArionPay confirms payment, this order moves to fulfilment review.", "En cuanto ArionPay confirme el pago, este pedido pasa a revision de preparacion.")}</p></article>
              </div>
              <div class="cta-row-inline">
                <a class="btn btn-primary" href="${HOMEPAGE_URL}">${tx("Return home now", "Volver al inicio ahora")}</a>
                <a class="btn btn-secondary" href="contact.html">${tx("Need Help? Contact Support", "Necesitas ayuda? Contacta con soporte")}</a>
              </div>
              <p class="helper-copy" data-order-sync-status>${tx("Payment received. Confirming your order with ArionPay now...", "Pago recibido. Confirmando tu pedido con ArionPay ahora...")}</p>
              ${renderExactAmountReturnNotice()}
            </article>
          </div>
        </section>
      `;
    }

    if (orderPaid && completedOrder) {
      return `
        <section class="page-hero">
          <div class="container section-stack">
            ${renderCheckoutStage("payment")}
            <article class="success-card reveal">
              <p class="section-kicker">${tx("Order completed", "Pedido completado")}</p>
              <h1 class="success-title">${success ? tx("Your order is complete.", "Tu pedido esta completo.") : tx("This order is already completed.", "Este pedido ya esta completado.")}</h1>
              <p class="success-copy">${success
                ? tx("Payment has been confirmed, the cart is now cleared, and your order is moving to fulfilment review. You will be returned to the homepage shortly.", "El pago ha sido confirmado, el carrito ya esta vacio y tu pedido ya pasa a revision de preparacion. Volveras pronto a la pagina principal.")
                : tx("This checkout session already has a paid order. The cart is being cleared and the completed order is loading instead of reopening payment.", "Esta sesion de checkout ya tiene un pedido pagado. El carrito se esta vaciando y se muestra el pedido completado en lugar de reabrir el pago.")
              }</p>
              <div class="order-meta-grid">
                <article class="detail-card"><span class="detail-label">${tx("Order reference", "Referencia")}</span><strong>${completedOrder.reference}</strong><p>${formatDate(completedOrder.createdAt)}</p></article>
                <article class="detail-card"><span class="detail-label">${tx("Payment status", "Estado del pago")}</span><strong>${tx("Paid", "Pagado")}</strong><p>${tx("Confirmed by ArionPay.", "Confirmado por ArionPay.")}</p></article>
                <article class="detail-card"><span class="detail-label">${tx("Next step", "Siguiente paso")}</span><strong>${tx("Fulfilment review", "Revision de preparacion")}</strong><p>${tx("Dispatch updates will be sent by email if anything changes.", "Las actualizaciones de envio se enviaran por correo si algo cambia.")}</p></article>
                <article class="detail-card"><span class="detail-label">${tx("Delivery", "Entrega")}</span><strong>${localize(completedOrder.shipping.label)}</strong><p>${localize(completedOrder.shipping.eta)}</p></article>
              </div>
              <div class="summary-divider"></div>
              <div class="order-line-items">${renderOrderLineItems(completedOrder.items)}</div>
              <div class="cta-row-inline">
                <a class="btn btn-primary" href="${HOMEPAGE_URL}">${tx("Return home now", "Volver al inicio ahora")}</a>
                <a class="btn btn-secondary" href="contact.html">${tx("Need Help? Contact Support", "Necesitas ayuda? Contacta con soporte")}</a>
              </div>
              <p class="helper-copy" data-order-sync-status>${tx("Payment confirmed. Your cart has been cleared and you will be redirected to the homepage shortly.", "Pago confirmado. Tu carrito ya se ha vaciado y seras redirigido a la pagina principal en breve.")}</p>
              ${renderExactAmountReturnNotice()}
            </article>
          </div>
        </section>
      `;
    }

    if (success && order) {
      return `
        <section class="page-hero">
          <div class="container section-stack">
            ${renderCheckoutStage("payment")}
            <article class="success-card reveal">
              <p class="section-kicker">${tx("Payment received", "Pago recibido")}</p>
              <h1 class="success-title">${tx("We are confirming your order.", "Estamos confirmando tu pedido.")}</h1>
              <p class="success-copy">${tx("We received your return from ArionPay and are now confirming the payment status. This page updates automatically, so please do not pay again.", "Hemos recibido tu retorno desde ArionPay y ahora estamos confirmando el estado del pago. Esta pagina se actualiza automaticamente, por favor no pagues de nuevo.")}</p>
              <div class="order-meta-grid">
                <article class="detail-card"><span class="detail-label">${tx("Order reference", "Referencia")}</span><strong>${order.reference}</strong><p>${formatDate(order.createdAt)}</p></article>
                <article class="detail-card"><span class="detail-label">${tx("Payment status", "Estado del pago")}</span><strong>${tx("Confirming", "Confirmando")}</strong><p>${tx("We are waiting for the final ArionPay confirmation.", "Estamos esperando la confirmacion final de ArionPay.")}</p></article>
                <article class="detail-card"><span class="detail-label">${tx("Next step", "Siguiente paso")}</span><strong>${tx("Automatic verification", "Verificacion automatica")}</strong><p>${tx("As soon as ArionPay confirms payment, this order moves to fulfilment review.", "En cuanto ArionPay confirme el pago, este pedido pasa a revision de preparacion.")}</p></article>
                <article class="detail-card"><span class="detail-label">${tx("Delivery", "Entrega")}</span><strong>${localize(order.shipping.label)}</strong><p>${localize(order.shipping.eta)}</p></article>
              </div>
              <div class="summary-divider"></div>
              <div class="order-line-items">${renderOrderLineItems(order.items)}</div>
              <div class="cta-row-inline">
                <a class="btn btn-primary" href="${HOMEPAGE_URL}">${tx("Return home now", "Volver al inicio ahora")}</a>
                <a class="btn btn-secondary" href="contact.html">${tx("Need Help? Contact Support", "Necesitas ayuda? Contacta con soporte")}</a>
              </div>
              <p class="helper-copy" data-order-sync-status>${tx("Payment received. Confirming your order with ArionPay now...", "Pago recibido. Confirmando tu pedido con ArionPay ahora...")}</p>
              ${renderExactAmountReturnNotice()}
            </article>
          </div>
        </section>
      `;
    }

    if (!cart.length) {
      return `
        <section class="page-hero">
          <div class="container section-stack">
            ${renderCheckoutStage("checkout")}
            <div class="empty-state reveal">
              <h1>${tx("Your cart is ready for your next order.", "Tu carrito esta listo para tu proximo pedido.")}</h1>
              <p>${tx("Browse premium products to get started.", "Explora productos premium para empezar.")}</p>
              <a class="btn btn-primary" href="shop.html">${tx("Browse Products", "Ver productos")}</a>
            </div>
          </div>
        </section>
      `;
    }

    return `
      <section class="page-hero">
        <div class="container checkout-shell">
          ${renderCheckoutStage("checkout")}
          <div class="checkout-banner reveal">${tx("Free tracked EU shipping on all orders over 200 EUR.", "Envio UE con seguimiento gratis en todos los pedidos superiores a 200 EUR.")}</div>
          <div class="checkout-grid checkout-grid-pro">
            <section class="checkout-main reveal">
              <article class="checkout-card checkout-card-form">
                <div class="section-header">
                  <p class="section-kicker">${tx("Secure Checkout", "Pago seguro")}</p>
                  <h1>${tx("Secure Checkout", "Pago seguro")}</h1>
                  <p class="lead">${tx("Complete your order safely with encrypted payment processing.", "Completa tu pedido con seguridad mediante procesamiento cifrado.")}</p>
                </div>
                <form class="form-grid checkout-form-pro" id="checkout-form" data-checkout-form>
                  <section class="full-width checkout-form-section">
                    <div class="checkout-form-section-head">
                      <p class="checkout-eyebrow">${tx("Contact details", "Datos de contacto")}</p>
                      <h3>${tx("Who should receive dispatch updates?", "Quien debe recibir actualizaciones de envio?")}</h3>
                    </div>
                    <div class="checkout-field-grid">
                      <label>
                        <span>${tx("First name *", "Nombre *")}</span>
                        <input class="form-input" name="firstName" required value="${draft.firstName || ""}">
                      </label>
                      <label>
                        <span>${tx("Last name *", "Apellidos *")}</span>
                        <input class="form-input" name="lastName" required value="${draft.lastName || ""}">
                      </label>
                    </div>
                    <div class="checkout-field-grid">
                      <label>
                        <span>${tx("Email *", "Correo *")}</span>
                        <input class="form-input" name="email" type="email" required value="${draft.email || ""}">
                      </label>
                      <label>
                        <span>${tx("Phone (optional)", "Telefono (opcional)")}</span>
                        <input class="form-input" name="phone" value="${draft.phone || ""}">
                      </label>
                    </div>
                    <label class="full-width">
                      <span>${tx("Company name (optional)", "Nombre de empresa (opcional)")}</span>
                      <input class="form-input" name="company" value="${draft.company || ""}">
                    </label>
                  </section>
                  <section class="full-width checkout-form-section">
                    <div class="checkout-form-section-head">
                      <p class="checkout-eyebrow">${tx("Shipping address", "Direccion de envio")}</p>
                      <h3>${tx("Where should the order be routed?", "A donde debe dirigirse el pedido?")}</h3>
                    </div>
                    <label class="full-width">
                      <span>${tx("Country / Region *", "Pais / Region *")}</span>
                      <select class="form-select" name="country" required>
                        ${renderCountryOptions(country.code)}
                      </select>
                    </label>
                    <div class="checkout-field-grid">
                      <label>
                        <span>${tx("Street address *", "Direccion *")}</span>
                        <input class="form-input" name="address" required value="${draft.address || ""}">
                      </label>
                      <label>
                        <span>${tx("Apartment, suite, unit, etc. (optional)", "Apartamento, suite, unidad, etc. (opcional)")}</span>
                        <input class="form-input" name="addressLine2" value="${draft.addressLine2 || ""}">
                      </label>
                    </div>
                    <label class="full-width">
                      <span>${tx("Town / City *", "Ciudad *")}</span>
                      <input class="form-input" name="city" required value="${draft.city || ""}">
                    </label>
                    <div class="checkout-field-grid">
                      <label>
                        <span>${tx("State *", "Estado *")}</span>
                        <select class="form-select" name="state" required>
                          ${renderStateOptions(country.code, region)}
                        </select>
                      </label>
                      <label>
                        <span>${tx("Postal code *", "Codigo postal *")}</span>
                        <input class="form-input" name="postalCode" required value="${draft.postalCode || ""}">
                      </label>
                    </div>
                  </section>
                  <section class="full-width checkout-form-section">
                    <div class="checkout-form-section-head">
                      <p class="checkout-eyebrow">${tx("Order notes", "Notas del pedido")}</p>
                      <h3>${tx("Optional handling notes", "Notas opcionales de manejo")}</h3>
                    </div>
                    <label class="full-width">
                      <span>${tx("Order notes (optional)", "Notas del pedido (opcional)")}</span>
                      <textarea class="form-textarea" name="notes" placeholder="${tx("Delivery notes, support context, or purchase instructions.", "Notas de entrega, contexto de soporte o instrucciones de compra.")}">${draft.notes || ""}</textarea>
                    </label>
                    <div class="checkout-note-panel">
                      <strong>${tx("Before payment opens", "Antes de abrir el pago")}</strong>
                      <p>${tx("Review the delivery method and agreement on the right-hand order summary before continuing to ArionPay.", "Revisa el metodo de envio y el acuerdo en el resumen del pedido antes de continuar a ArionPay.")}</p>
                    </div>
                  </section>
                  <input type="hidden" name="shippingMethod" value="${delivery.id}">
                  <input type="hidden" name="paymentMethod" value="${payment.id}">
                  <input type="hidden" name="paymentCurrency" value="${cryptoCurrency.id}">
                </form>
              </article>
            </section>
            <aside class="summary-card summary-card-sticky checkout-side reveal reveal-delay">
              <div class="section-header">
                <p class="section-kicker">${tx("Summary", "Resumen")}</p>
                <h2 class="section-title">${tx("Final order review", "Revision final del pedido")}</h2>
              </div>
              <div class="order-line-items">${renderOrderLineItems(cart)}</div>
              <div class="summary-divider"></div>
              <div class="checkout-side-section">
                <p class="checkout-eyebrow">${tx("Delivery method", "Metodo de envio")}</p>
                <div class="checkout-choice-list">
                  ${DELIVERY_OPTIONS.map((item) => renderSidebarDeliveryChoice(item, delivery.id, total)).join("")}
                </div>
              </div>
              <div class="summary-list">
                <div class="summary-row"><span class="summary-label">${tx("Subtotal", "Subtotal")}</span><strong>${formatPrice(total)}</strong></div>
                <div class="summary-row"><span class="summary-label">${tx("Shipping", "Envio")}</span><strong>${shippingCost === 0 ? tx("Free", "Gratis") : formatPrice(shippingCost)}</strong></div>
                <div class="summary-row summary-row-total"><span class="summary-label">${tx("Estimated total", "Total estimado")}</span><strong>${formatPrice(grandTotal)}</strong></div>
              </div>
              <div class="shipping-progress">
                <div class="shipping-progress-bar" style="width:${Math.min((total / FREE_SHIPPING_THRESHOLD) * 100, 100)}%"></div>
                <p>${shippingProgressCopy(total)}</p>
              </div>
              <div class="checkout-side-section">
                <p class="checkout-eyebrow">${tx("Payment route", "Ruta de pago")}</p>
                <div class="checkout-choice-list">
                  ${ACTIVE_PAYMENT_OPTIONS.map((item) => renderSidebarPaymentChoice(item, payment.id)).join("")}
                </div>
                <p class="checkout-side-note">${tx("Exact payment amounts are confirmed automatically for a smooth order process.", "Los importes exactos se confirman automaticamente para un proceso de pedido mas fluido.")}</p>
                <p class="checkout-side-note">${tx("Fast processing and clear order updates after successful payment.", "Procesamiento rapido y actualizaciones claras tras el pago.")}</p>
              </div>
              ${renderExactAmountGuidance()}
              <div class="support-chip-row">
                <div class="support-chip">${tx("Selected delivery", "Envio elegido")}: ${localize(delivery.label)}</div>
                <div class="support-chip">${tx("Selected payment", "Pago elegido")}: ${paymentLabel}</div>
              </div>
              <label class="checkout-agreement checkout-agreement-emphasis">
                <input type="checkbox" name="exactAmountConfirmed" form="checkout-form" data-exact-amount-confirmation ${agreements.exactAmountConfirmed ? "checked" : ""} required>
                <span>${tx("I understand that I must pay the exact USDT amount shown on the secure ArionPay page for automatic confirmation.", "Entiendo que debo pagar la cantidad exacta de USDT mostrada en la pagina segura de ArionPay para la confirmacion automatica.")}</span>
              </label>
              <label class="checkout-agreement">
                <input type="checkbox" name="ageConfirmed" form="checkout-form" ${agreements.ageConfirmed ? "checked" : ""} required>
                <span>${tx("I confirm that I am purchasing for laboratory research use only, that I am of legal age, and that I have read the terms and privacy policy.", "Confirmo que compro solo para investigacion de laboratorio, que soy mayor de edad y que he leido los terminos y la politica de privacidad.")}</span>
              </label>
              ${renderOrderReviewSteps(total, cart)}
              <div class="checkout-action-stack">
                <button class="btn btn-primary btn-block" type="submit" form="checkout-form" data-checkout-submit>${checkoutSubmitLabel(payment)}</button>
                <a class="btn btn-secondary btn-block" href="cart.html">${tx("Back to cart", "Volver al carrito")}</a>
              </div>
              <p class="helper-copy" data-checkout-status>${checkoutHelperCopy(payment, cart)}</p>
            </aside>
          </div>
        </div>
      </section>
    `;
  };

  renderPage = function () {
    const host = document.querySelector("[data-page-content]");

    if (!host) {
      return;
    }

    const page = getCurrentPage();
    document.documentElement.lang = currentLanguage;

    if (authSessionState.status === "idle" && !authSessionRequest) {
      void loadAuthSession({ rerender: true });
    }

    if (page === "home") {
      host.innerHTML = renderEnhancedHomePage();
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
    } else if (page === "checkout") {
      host.innerHTML = renderCheckoutPage();
    } else if (page === "login") {
      host.innerHTML = renderLoginPage();
    } else if (page === "register") {
      host.innerHTML = renderRegisterPage();
    } else if (page === "account") {
      host.innerHTML = renderAccountPage();
    } else if (["privacy", "terms", "shipping", "refunds"].includes(page)) {
      host.innerHTML = renderLegalPage(page);
    }

    bindPageInteractions();
    initReveal();
    updateTitle();
    syncCheckoutUi();
    syncPaidCheckoutUi();
    refreshArionPayOrderStatus();
  };

  updateTitle = function () {
    const page = getCurrentPage();
    const base = "Primus Peptides";

    if (page === "product") {
      const product = currentProduct();
      document.title = `${base} | ${localize(product.name)} ${product.dosage}`;
      return;
    }

    const titles = {
      home: tx("Home", "Inicio"),
      shop: tx("Shop", "Tienda"),
      coa: "COA",
      faq: "FAQ",
      contact: tx("Contact", "Contacto"),
      cart: tx("Cart", "Carrito"),
      checkout: tx("Secure Checkout", "Pago seguro"),
      login: tx("Access Your Account", "Accede a tu cuenta"),
      register: tx("Create Your Customer Account", "Crea tu cuenta de cliente"),
      account: tx("Your Customer Dashboard", "Tu panel de cliente"),
      privacy: tx("Privacy Policy", "Política de privacidad"),
      terms: tx("Terms & Conditions", "Términos y condiciones"),
      shipping: tx("Shipping Policy", "Política de envíos"),
      refunds: tx("Returns & Refunds", "Devoluciones y reembolsos")
    };

    document.title = `${base} | ${titles[page] || titles.home}`;
  };

  bindPageInteractions = function () {
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
        const payload = {
          name: contactForm.elements.name.value.trim(),
          email: contactForm.elements.email.value.trim(),
          subject: contactForm.elements.subject.value.trim(),
          message: contactForm.elements.message.value.trim()
        };
        window.location.href = buildMailtoUrl(payload);
        const status = document.querySelector("[data-contact-status]");
        if (status) {
          status.textContent = localize(COPY.shell.toastContact);
        }
        showToast(localize(COPY.shell.toastContact));
      });
    }

    const loginForm = document.querySelector("[data-login-form]");

    if (loginForm) {
      loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (typeof loginForm.reportValidity === "function" && !loginForm.reportValidity()) {
          return;
        }

        const submitButton = loginForm.querySelector("[data-auth-submit]");
        const statusNode = loginForm.querySelector("[data-auth-form-status]");
        const formData = new FormData(loginForm);
        const email = text(formData.get("email"));
        const password = String(formData.get("password") || "");

        if (submitButton) {
          submitButton.disabled = true;
          submitButton.textContent = tx("Signing in...", "Accediendo...");
        }

        setAuthFormStatus(statusNode, tx("Verifying your secure session...", "Verificando tu sesion segura..."));

        try {
          await submitAuthRequest(LOGIN_ENDPOINT, { email, password }, tx("Unable to sign in right now.", "No se pudo iniciar sesion ahora mismo."));
          renderHeader();
          showToast(tx("Login successful.", "Acceso completado."));
          window.location.replace(authNextUrl("account.html"));
        } catch (error) {
          const message = error instanceof Error && error.message
            ? error.message
            : tx("Unable to sign in right now.", "No se pudo iniciar sesion ahora mismo.");

          setAuthFormStatus(statusNode, message, "error");
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = tx("Login", "Iniciar sesion");
          }
        }
      });
    }

    const registerForm = document.querySelector("[data-register-form]");

    if (registerForm) {
      registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (typeof registerForm.reportValidity === "function" && !registerForm.reportValidity()) {
          return;
        }

        const submitButton = registerForm.querySelector("[data-auth-submit]");
        const statusNode = registerForm.querySelector("[data-auth-form-status]");
        const formData = new FormData(registerForm);
        const fullName = text(formData.get("fullName"));
        const email = text(formData.get("email"));
        const password = String(formData.get("password") || "");
        const confirmPassword = String(formData.get("confirmPassword") || "");

        if (password !== confirmPassword) {
          setAuthFormStatus(statusNode, tx("Password confirmation does not match.", "La confirmacion de la contrasena no coincide."), "error");
          return;
        }

        if (submitButton) {
          submitButton.disabled = true;
          submitButton.textContent = tx("Creating account...", "Creando cuenta...");
        }

        setAuthFormStatus(statusNode, tx("Creating your secure account...", "Creando tu cuenta segura..."));

        try {
          await submitAuthRequest(
            REGISTER_ENDPOINT,
            { fullName, email, password, confirmPassword },
            tx("Unable to create your account right now.", "No se pudo crear tu cuenta ahora mismo.")
          );
          renderHeader();
          showToast(tx("Account created successfully.", "Cuenta creada correctamente."));
          window.location.replace(authNextUrl("account.html"));
        } catch (error) {
          const message = error instanceof Error && error.message
            ? error.message
            : tx("Unable to create your account right now.", "No se pudo crear tu cuenta ahora mismo.");

          setAuthFormStatus(statusNode, message, "error");
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = tx("Register", "Crear cuenta");
          }
        }
      });
    }

    const checkoutForm = document.querySelector("[data-checkout-form]");
    const cartPreferences = document.querySelectorAll('[data-cart-preferences] input[name="shippingMethod"], [data-cart-preferences] input[name="paymentMethod"]');

    cartPreferences.forEach((input) => {
      input.addEventListener("change", () => {
        const draft = readCheckoutDraft();

        if (input.name === "shippingMethod") {
          draft.shippingMethod = input.value;
        }

        if (input.name === "paymentMethod") {
          draft.paymentMethod = input.value;
        }

        saveCheckoutDraft(draft);
        renderPage();
      });
    });

    if (checkoutForm) {
      const syncCheckoutDraftAndUi = (event) => {
        const draft = checkoutDraftFromForm(checkoutForm);
        syncCheckoutAgreementsFromForm(checkoutForm);
        saveCheckoutDraft(draft);

        if (event && ["country", "shippingMethod"].includes(event.target.name)) {
          renderPage();
          return;
        }

        syncCheckoutUi();
      };

      document.querySelectorAll("[data-choice-card]").forEach((card) => {
        card.addEventListener("click", (event) => {
          if (event.target.closest("input, select, textarea, a")) {
            return;
          }

          const choiceName = card.getAttribute("data-choice-name");
          const choiceValue = card.getAttribute("data-choice-value");
          const targetInput = document.querySelector(`[name="${choiceName}"][value="${choiceValue}"]`);

          if (!targetInput) {
            return;
          }

          targetInput.checked = true;
          targetInput.dispatchEvent(new Event("change", { bubbles: true }));
        });
      });

      checkoutForm.addEventListener("input", () => {
        syncCheckoutDraftAndUi();
      });

      checkoutForm.addEventListener("change", (event) => {
        syncCheckoutDraftAndUi(event);
      });

      document
        .querySelectorAll('input[form="checkout-form"], select[form="checkout-form"], textarea[form="checkout-form"]')
        .forEach((field) => {
          if (field.matches('[type="hidden"], [type="submit"]')) {
            return;
          }

          field.addEventListener("input", syncCheckoutDraftAndUi);
          field.addEventListener("change", syncCheckoutDraftAndUi);
        });

      checkoutForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const submitButton = document.querySelector("[data-checkout-submit]");
        const statusNode = document.querySelector("[data-checkout-status]");
        const draft = checkoutDraftFromForm(checkoutForm);
        const cart = readCart();
        const lastOrder = readLastOrder();
        const sessionOrderReference = readCheckoutSessionOrderReference();
        const duplicatePaidOrder = activeSessionOrder(lastOrder) && isPaidOrderStatus(lastOrder.status)
          ? lastOrder
          : null;
        const total = subtotal(cart);
        const shipping = selectedDelivery(total);
        const payment = ACTIVE_PAYMENT_OPTIONS.find((item) => item.id === draft.paymentMethod) || ACTIVE_PAYMENT_OPTIONS[0];
        const shippingCost = cartShippingCost(cart, shipping, total);
        const paymentCurrency = CRYPTO_CURRENCY_OPTIONS.find((item) => item.id === draft.paymentCurrency) || CRYPTO_CURRENCY_OPTIONS[0];
        const reference = orderReference();

        if (submitButton) {
          submitButton.disabled = true;
          submitButton.textContent = tx("Creating your crypto payment...", "Creando tu pago con criptomonedas...");
        }

        if (statusNode) {
          statusNode.textContent = checkoutPendingStatus(payment);
        }

        saveCheckoutDraft(draft);

        if (!draft.exactAmountConfirmed) {
          const message = exactAmountConfirmationPrompt();

          if (statusNode) {
            statusNode.textContent = message;
          }

          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = checkoutSubmitLabel(payment);
          }

          showToast(message);
          return;
        }

        if (!draft.ageConfirmed) {
          const message = legalAgeConfirmationPrompt();

          if (statusNode) {
            statusNode.textContent = message;
          }

          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = checkoutSubmitLabel(payment);
          }

          showToast(message);
          return;
        }

        if (duplicatePaidOrder) {
          saveLastOrder(duplicatePaidOrder);
          if (statusNode) {
            statusNode.textContent = tx(
              "This checkout session already has a paid order. Loading the completed order now...",
              "Esta sesion de checkout ya tiene un pedido pagado. Cargando ahora el pedido completado..."
            );
          }
          window.location.replace(buildOrderSuccessUrl(duplicatePaidOrder.reference));
          return;
        }

        const cryptoState = hostedCryptoCheckoutState(payment, cart, shipping, paymentCurrency.id);

        if (!cryptoState.ready) {
          const message = cryptoState.reason || tx(
            "Cryptocurrency checkout is not available for this cart.",
            "El checkout con criptomonedas no esta disponible para este carrito."
          );

          if (statusNode) {
            statusNode.textContent = message;
          }

          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = checkoutSubmitLabel(payment);
          }

          showToast(message);
          return;
        }

        fetch(ARIONPAY_INVOICE_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            reference,
            shippingMethod: shipping.id,
            paymentMethod: paymentCurrency.id,
            sessionOrderReference,
            customer: draft,
            items: cart.map((item) => ({
              slug: item.slug,
              quantity: item.quantity
            }))
          })
        })
          .then(async (response) => {
            const result = await response.json().catch(() => ({}));

            if (result.alreadyPaid && result.reference) {
              window.location.replace(buildOrderSuccessUrl(result.reference));
              return;
            }

            if (!response.ok || !result.invoiceUrl) {
              const detail = result.error && result.hint
                ? `${result.error} ${result.hint}`
                : result.hint
                || result.error
                || result.detail?.gatewayMessage
                || result.detail?.error
                || result.detail?.message
                || tx("Unable to create the ArionPay invoice.", "No se pudo crear la factura de ArionPay.");
              throw new Error(detail);
            }

            const order = {
              reference: result.reference || reference,
              createdAt: new Date().toISOString(),
              customer: draft,
              shipping,
              shippingMethod: shipping.id,
              payment,
              paymentMethod: paymentCurrency.id,
              subtotal: Number(result.subtotal || total || 0),
              shippingCost: Number(result.shipping || shippingCost || 0),
              total: Number(result.total || (total + shippingCost) || 0),
              status: "invoice_created",
              paymentCurrency,
              invoiceId: result.invoiceId,
              invoiceUrl: result.invoiceUrl,
              items: cart.map((item) => ({
                slug: item.slug,
                quantity: item.quantity,
                lineTotal: (getProduct(item.slug).price || 0) * item.quantity
              }))
            };

            saveLastOrder(order);
            saveCheckoutSessionOrderReference(order.reference);

            if (statusNode) {
              statusNode.textContent = tx(
                "Secure invoice created. Redirecting to ArionPay...",
                "Factura segura creada. Redirigiendo a ArionPay..."
              );
            }

            // Keep checkout, payment, and the gateway return in the same tab
            // so the customer only has one storefront context to finalize.
            window.location.replace(result.invoiceUrl);
          })
          .catch((error) => {
            const message = error instanceof Error && error.message
              ? error.message
              : tx("Unable to create the ArionPay invoice.", "No se pudo crear la factura de ArionPay.");

            if (statusNode) {
              statusNode.textContent = message;
            }

            if (submitButton) {
              submitButton.disabled = false;
              submitButton.textContent = checkoutSubmitLabel(payment);
            }

            showToast(message);
          });
      });
    }

    document.querySelectorAll("[data-copy-value]").forEach((button) => {
      button.addEventListener("click", async () => {
        const value = button.getAttribute("data-copy-value") || "";
        const label = button.getAttribute("data-copy-label") || tx("Copied.", "Copiado.");

        if (!value) {
          return;
        }

        try {
          await navigator.clipboard.writeText(value);
          showToast(label);
        } catch (error) {
          showToast(tx("Unable to copy automatically.", "No se pudo copiar automaticamente."));
        }
      });
    });

  };

  const bindBaseEnhancedInteractions = bindPageInteractions;

  bindPageInteractions = function () {
    bindBaseEnhancedInteractions();

    const search = document.querySelector("[data-shop-search]");
    if (search) {
      search.addEventListener("input", (event) => {
        shopQuery = event.target.value;
        writeShopStateToLocation();
      });
    }

    const sort = document.querySelector("[data-shop-sort]");
    if (sort) {
      sort.addEventListener("change", (event) => {
        shopSort = validSort(event.target.value);
        writeShopStateToLocation();
        renderPage();
      });
    }

    document.querySelectorAll("[data-stock-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        shopFilter = button.getAttribute("data-stock-filter") || "all";
        writeShopStateToLocation();
        renderPage();
      });
    });

    document.querySelectorAll("[data-goal-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        shopGoal = validGoal(button.getAttribute("data-goal-filter") || "all");
        writeShopStateToLocation();
        renderPage();
      });
    });

    document.querySelectorAll("[data-shop-reset]").forEach((button) => {
      button.addEventListener("click", () => {
        shopQuery = "";
        shopFilter = "all";
        shopGoal = "all";
        shopSort = "featured";
        writeShopStateToLocation();
        renderPage();
      });
    });

    document.querySelectorAll("[data-gallery-image]").forEach((button) => {
      button.addEventListener("click", () => {
        activeProductGalleryImage = Number(button.getAttribute("data-gallery-image") || 0);
        renderPage();
      });
    });
  };

  document.addEventListener("click", (event) => {
    const logoutButton = event.target.closest("[data-logout-action]");

    if (!logoutButton) {
      return;
    }

    event.preventDefault();
    if (logoutButton.disabled) {
      return;
    }

    logoutButton.disabled = true;
    void handleLogoutFlow();
  });

  patchSharedCopy();
  enrichProducts();

  if (document.readyState !== "loading") {
    renderShell();
    renderPage();
    renderCookieBanner();
    updateCartBadges();
  }
})();
