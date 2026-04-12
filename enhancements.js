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
  // Replace each empty value with the hosted checkout URL created in ArionPay.
  // Each product can use either:
  // 1. a single string URL if one hosted link covers that product, or
  // 2. per-shipping URLs when the hosted payment link amount is fixed by delivery option.
  const HOSTED_CRYPTO_PAYMENT_LINKS = {
    USDT_TRC20: {
      "tirzepatide-30mg": { "eu-standard": "", "eu-express": "", international: "" },
      "retatrutide-30mg": { "eu-standard": "", "eu-express": "", international: "" },
      "tb-500-20mg": { "eu-standard": "", "eu-express": "", international: "" },
      "bpc-157-10mg": { "eu-standard": "", "eu-express": "", international: "" },
      "ghk-cu-50mg": { "eu-standard": "", "eu-express": "", international: "" },
      "mots-c-40mg": { "eu-standard": "", "eu-express": "", international: "" },
      "melanotan-mt2-10mg": { "eu-standard": "", "eu-express": "", international: "" },
      "ss-31-50mg": { "eu-standard": "", "eu-express": "", international: "" },
      "nad-1000mg": { "eu-standard": "", "eu-express": "", international: "" },
      "semax-30mg": { "eu-standard": "", "eu-express": "", international: "" },
      "selank-10mg": { "eu-standard": "", "eu-express": "", international: "" }
    }
  };

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
      label: { en: "ArionPay", es: "ArionPay" },
      chip: "ARIONPAY",
      note: {
        en: "Continue to the hosted ArionPay crypto checkout once the order details are confirmed.",
        es: "Usa enlaces de pago alojados de ArionPay configurados por producto y opción de envío."
      }
    },
    {
      id: "BANK_TRANSFER",
      label: { en: "Direct bank transfer", es: "Transferencia bancaria directa" },
      chip: "BANK",
      note: {
        en: "Place the order now and complete payment after support confirms the receiving account.",
        es: "Reserva el pedido ahora y completa el pago manualmente por transferencia bancaria tras la revisión."
      }
    },
    {
      id: "ETH",
      label: "ETH",
      chip: "ETH",
      enabled: false,
      note: {
        en: "Enable the ETH asset in ArionPay before offering this method to buyers.",
        es: "Activa el asset ETH en ArionPay antes de ofrecer este método a compradores."
      }
    },
    {
      id: "BTC",
      label: "BTC",
      chip: "BTC",
      enabled: false,
      note: {
        en: "Enable the BTC asset in ArionPay before offering this method to buyers.",
        es: "Activa el asset BTC en ArionPay antes de ofrecer este método a compradores."
      }
    }
  ];

  const ACTIVE_PAYMENT_OPTIONS = PAYMENT_OPTIONS.filter((item) => item.enabled !== false);
  PAYMENT_OPTIONS[0].note.es = "Continua al checkout crypto alojado de ArionPay una vez confirmados los datos del pedido.";
  PAYMENT_OPTIONS[1].note.es = "Realiza el pedido ahora y completa el pago despues de que soporte confirme la cuenta receptora.";
  const CRYPTO_CURRENCY_OPTIONS = [
    {
      id: "USDT_TRC20",
      label: { en: "Tether (USDT - TRC20)", es: "Tether (USDT - TRC20)" },
      shortLabel: "USDT",
      live: true
    },
    {
      id: "BTC",
      label: { en: "Bitcoin (BTC)", es: "Bitcoin (BTC)" },
      shortLabel: "BTC",
      live: false
    },
    {
      id: "ETH",
      label: { en: "Ethereum (ETH)", es: "Ethereum (ETH)" },
      shortLabel: "ETH",
      live: false
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
  const BANK_TRANSFER_DETAILS = {
    beneficiary: "",
    bankName: "",
    iban: "",
    swift: "",
    accountNumber: "",
    sortCode: ""
  };

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

  const LEGAL_PAGES = {};

  Object.assign(LEGAL_PAGES, {
    privacy: {
      kicker: { en: "Privacy", es: "Privacidad" },
      title: { en: "Privacy Policy", es: "Política de privacidad" },
      lead: {
        en: "This page explains what Primus Peptides collects, why it is collected, and how customer requests can be handled before launch. Final legal review should confirm country-specific wording.",
        es: "Esta página explica qué recopila Primus Peptides, por qué se recopila y cómo se gestionan las solicitudes de clientes antes del lanzamiento. La revisión legal final debe validar el texto según el país."
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
        en: "These terms outline how Primus Peptides intends to present products, accept orders, and manage use of the site. Final launch copy should be checked against local legal requirements.",
        es: "Estos términos describen cómo Primus Peptides prevé presentar productos, aceptar pedidos y gestionar el uso del sitio. El texto final debe revisarse según los requisitos legales locales."
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
              en: "Hosted ArionPay payment links and manual bank transfer can both be used during the current launch phase, with a deeper gateway integration added later if needed.",
              es: "Los enlaces de pago alojados de ArionPay y la transferencia bancaria manual pueden usarse durante la fase actual de lanzamiento, con una integración más profunda añadida más adelante si fuera necesario."
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

  function selectedDelivery(total) {
    const saved = readCheckoutDraft();
    return DELIVERY_OPTIONS.find((item) => item.id === saved.shippingMethod)
      || DELIVERY_OPTIONS.find((item) => item.id === "eu-standard")
      || DELIVERY_OPTIONS[0];
  }

  function selectedPayment() {
    const saved = readCheckoutDraft();
    const savedMethod = saved.paymentMethod === "BANK_TRANSFER" ? "BANK_TRANSFER" : "USDT_TRC20";
    return ACTIVE_PAYMENT_OPTIONS.find((item) => item.id === savedMethod)
      || ACTIVE_PAYMENT_OPTIONS[0];
  }

  function selectedCryptoCurrency() {
    const saved = readCheckoutDraft();
    return CRYPTO_CURRENCY_OPTIONS.find((item) => item.id === saved.paymentCurrency)
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
    if (isBankTransferPayment(payment)) {
      return localize(payment.label);
    }

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

  function productProfile(product) {
    return PRODUCT_PROFILES[product.slug] || {
      short: {
        en: "Pre-launch listing prepared inside the same research-grade catalogue system.",
        es: "Listado de prelanzamiento preparado dentro del mismo sistema de catálogo."
      },
      focus: {
        en: "Launch copy, pricing, and supporting documentation can be connected once the batch is released.",
        es: "El copy de lanzamiento, el precio y la documentación podrán conectarse cuando el lote se libere."
      }
    };
  }

  function patchSharedCopy() {
    COPY.shell.brandTag = {
      en: "Research-grade peptide store",
      es: "Tienda de péptidos para investigación"
    };
    COPY.shell.topbar = {
      en: "COA-backed batches, HPLC-tested listings, and hosted crypto payment links with bank transfer fallback.",
      es: "Lotes respaldados por COA, fichas analizadas por HPLC y enlaces de pago crypto alojados con transferencia bancaria como alternativa."
    };
    COPY.shell.toastContact = {
      en: "Email draft ready.",
      es: "Borrador de correo listo."
    };
    COPY.labels.checkout = {
      en: "Checkout",
      es: "Finalizar compra"
    };
  }

  function enrichProducts() {
    PRODUCTS.forEach((product) => {
      const profile = productProfile(product);
      product.short = profile.short;
      product.focus = profile.focus;
    });
  }

  function readCheckoutDraft() {
    try {
      const stored = readStoredValue(CHECKOUT_DRAFT_STORE);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  function saveCheckoutDraft(draft) {
    writeStoredValue(CHECKOUT_DRAFT_STORE, JSON.stringify(draft));
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

  function renderProductVisual(product, variant = "card") {
    const tone = productTone(product);
    const note = product.status === "available"
      ? tx("HPLC-tested batch presentation", "Presentación de lote analizado por HPLC")
      : tx("Launch batch arriving soon", "Lote de lanzamiento próximamente");
    const trust = product.status === "available"
      ? tx("COA ready", "COA listo")
      : tx("Coming May", "Llega en mayo");

    return `
      <figure class="product-visual product-visual-${variant}" style="--visual-primary:${tone.primary}; --visual-soft:${tone.soft}; --visual-shadow:${tone.shadow};">
        <div class="product-visual-stage">
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
          <img src="${product.image}" alt="${localize(product.name)} ${product.dosage}">
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
      ageConfirmed: data.get("ageConfirmed") === "on"
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
    const currentCurrency = selectedCryptoCurrency().id;
    const icons = option.id === "BANK_TRANSFER"
      ? `<div class="checkout-payment-icons"><span>IBAN</span><span>SEPA</span></div>`
      : `<div class="checkout-payment-icons">
          ${CRYPTO_CURRENCY_OPTIONS.map((item) => `
            <button class="checkout-payment-chip ${currentCurrency === item.id ? "is-active" : ""}" type="button" data-payment-currency-switch="${item.id}" aria-pressed="${currentCurrency === item.id ? "true" : "false"}">${item.shortLabel}</button>
          `).join("")}
        </div>`;

    return `
      <label class="checkout-choice checkout-choice-payment ${currentId === option.id ? "is-selected" : ""}" data-choice-card data-choice-name="paymentMethod" data-choice-value="${option.id}">
        <input type="radio" name="paymentMethod" value="${option.id}" form="checkout-form" ${currentId === option.id ? "checked" : ""}>
        <div class="checkout-choice-copy">
          <strong>${localize(option.label)}</strong>
          <span>${localize(option.note)}</span>
          ${icons}
        </div>
      </label>
    `;
  }

  function isBankTransferPayment(payment) {
    return payment && payment.id === "BANK_TRANSFER";
  }

  function bankTransferConfigured() {
    return Boolean(
      BANK_TRANSFER_DETAILS.beneficiary.trim()
      && BANK_TRANSFER_DETAILS.bankName.trim()
      && (BANK_TRANSFER_DETAILS.iban.trim() || BANK_TRANSFER_DETAILS.accountNumber.trim())
    );
  }

  function checkoutSubmitLabel(payment) {
    return isBankTransferPayment(payment)
      ? tx("Place binding order", "Realizar pedido vinculante")
      : "Pay with ARIONPAY";
  }

  function checkoutPendingStatus(payment) {
    return isBankTransferPayment(payment)
      ? tx("Saving your order and opening bank transfer instructions...", "Guardando tu pedido y abriendo las instrucciones de transferencia bancaria...")
      : tx("Preparing ArionPay checkout...", "Preparando el checkout de ArionPay...");
  }

  function checkoutHelperCopy(payment) {
    return isBankTransferPayment(payment)
      ? tx(
        "Your order will be reserved first, then bank transfer instructions will be shown on the confirmation screen.",
        "Primero se reservara tu pedido y despues se mostraran las instrucciones de transferencia bancaria en la pantalla de confirmacion."
      )
      : tx(
        "You will continue to ArionPay to complete the crypto payment for supported single-product checkouts.",
        "Continuaras a ArionPay para completar el pago crypto en checkouts compatibles de un solo producto."
      );
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

  function resolveHostedPaymentLink(paymentId, slug, shippingId) {
    const paymentGroup = HOSTED_CRYPTO_PAYMENT_LINKS[paymentId] || {};
    const productEntry = paymentGroup[slug];

    if (typeof productEntry === "string") {
      return productEntry;
    }

    if (!productEntry || typeof productEntry !== "object") {
      return "";
    }

    return productEntry[shippingId] || productEntry.default || "";
  }

  function hostedCryptoCheckoutState(payment, cart, shipping, paymentCurrencyId) {
    if (isBankTransferPayment(payment)) {
      return { ready: true, url: "", reason: "" };
    }

    const item = singleItemCartEntry(cart);

    if (!item) {
      return {
        ready: false,
        url: "",
        reason: tx(
          "Hosted crypto checkout currently supports one product with quantity 1 per order. Use bank transfer or place separate crypto orders.",
          "El checkout crypto alojado solo admite un producto con cantidad 1 por pedido. Usa transferencia bancaria o realiza pedidos crypto por separado."
        )
      };
    }

    const shippingId = shipping?.id || "eu-standard";
    const url = resolveHostedPaymentLink(paymentCurrencyId || "USDT_TRC20", item.slug, shippingId);

    if (!url) {
      return {
        ready: false,
        url: "",
        reason: tx(
          "This currency, product, and delivery option do not have a hosted payment link configured yet. Use bank transfer for now.",
          "Esta moneda, producto y opcion de envio todavia no tienen configurado un enlace de pago alojado. Usa transferencia bancaria por ahora."
        )
      };
    }

    return { ready: true, url, reason: "" };
  }

  function buildBankTransferMailto(order) {
    const customerName = order?.customer
      ? [order.customer.firstName, order.customer.lastName].filter(Boolean).join(" ").trim()
      : "";
    const subject = `Bank transfer request ${order.reference}`;
    const lines = [
      `Order reference: ${order.reference}`,
      customerName ? `Customer: ${customerName}` : "",
      order?.customer?.email ? `Email: ${order.customer.email}` : "",
      order?.customer?.phone ? `Phone: ${order.customer.phone}` : "",
      `Amount due: ${formatPrice(order.total)}`,
      "",
      "Please send the current bank transfer instructions for this order."
    ].filter(Boolean);

    return `mailto:${SITE_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
  }

  function renderBankTransferInstructions(order) {
    return `
      <div class="policy-callout">
        <strong>${tx("Bank transfer details are shared only after manual review.", "Los datos de transferencia bancaria se comparten solo tras una revision manual.")}</strong>
        <p>${tx(
          `This store is still validating the final receiving account, so bank details are intentionally not shown on the public checkout page. Use the order reference ${order.reference} and request the current transfer instructions from ${SITE_EMAIL}.`,
          `Esta tienda sigue validando la cuenta receptora final, por lo que los datos bancarios no se muestran en la pagina publica de checkout. Usa la referencia ${order.reference} y solicita las instrucciones vigentes a ${SITE_EMAIL}.`
        )}</p>
        <p>${tx(
          "Do not send payment until the support team confirms the active account for this order.",
          "No envies el pago hasta que el equipo de soporte confirme la cuenta activa para este pedido."
        )}</p>
        <div class="cta-row-inline">
          <a class="btn btn-primary" href="${buildBankTransferMailto(order)}">${tx("Request bank details by email", "Solicitar datos bancarios por email")}</a>
          <a class="btn btn-secondary" href="contact.html">${tx("Open support page", "Abrir pagina de soporte")}</a>
        </div>
      </div>
    `;
  }

  function syncCheckoutUi() {
    const submitButton = document.querySelector("[data-checkout-submit]");
    const statusNode = document.querySelector("[data-checkout-status]");
    const params = new URLSearchParams(window.location.search);
    const order = readLastOrder();
    const cart = readCart();
    const shipping = selectedDelivery(subtotal(cart));

    if (!submitButton && !statusNode) {
      if (!(params.get("status") === "success" && order && isBankTransferPayment(order.payment))) {
        return;
      }
    }

    const payment = selectedPayment();
    const cryptoCurrency = selectedCryptoCurrency();
    const cryptoState = hostedCryptoCheckoutState(payment, cart, shipping, cryptoCurrency.id);

    if (submitButton) {
      submitButton.textContent = checkoutSubmitLabel(payment);
      submitButton.disabled = !isBankTransferPayment(payment) && !cryptoState.ready;
    }

    if (statusNode) {
      statusNode.textContent = isBankTransferPayment(payment)
        ? checkoutHelperCopy(payment)
        : cryptoState.ready
          ? tx(
            `You will be redirected to ArionPay for ${localize(cryptoCurrency.label)}.`,
            `Seras redirigido a ArionPay para ${localize(cryptoCurrency.label)}.`
          )
          : cryptoState.reason;
    }

    if (params.get("status") === "success" && order && isBankTransferPayment(order.payment)) {
      const kicker = document.querySelector(".success-card .section-kicker");
      const title = document.querySelector(".success-title");
      const copy = document.querySelector(".success-copy");

      if (kicker) {
        kicker.textContent = tx("Bank transfer selected", "Transferencia bancaria seleccionada");
      }

      if (title) {
        title.textContent = bankTransferConfigured()
          ? tx("Complete your bank transfer to confirm this order.", "Completa tu transferencia bancaria para confirmar este pedido.")
          : tx("Your order is reserved pending bank transfer instructions.", "Tu pedido esta reservado mientras se comparten las instrucciones de transferencia bancaria.");
      }

      if (copy) {
        copy.textContent = bankTransferConfigured()
          ? tx("Use the payment details below and include the order reference so the transfer can be matched to this order.", "Usa los datos de pago de abajo e incluye la referencia del pedido para que la transferencia se asocie correctamente.")
          : tx("The order has been saved with manual-payment status. Share the order reference with support so the transfer details can be sent and the payment can be confirmed.", "El pedido se ha guardado con estado de pago manual. Comparte la referencia del pedido con soporte para recibir los datos de transferencia y confirmar el pago.");
      }
    }
  }

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
              "Research-grade peptide storefront with HPLC-tested product presentation, clear checkout routing, and stronger buyer trust signals.",
              "Tienda de péptidos para investigación con presentación analizada por HPLC, checkout claro y señales de confianza más fuertes."
            )}</p>
            <p class="footer-note">${tx(
              "For laboratory research use only. Review final legal, medical, and compliance copy before launch.",
              "Solo para uso de investigación en laboratorio. Revisa el copy legal, médico y de cumplimiento antes del lanzamiento."
            )}</p>
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
            <p class="footer-note">${tx("Payments: USDT (TRC20) / Bank transfer", "Pagos: USDT (TRC20) / Transferencia bancaria")}</p>
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
            <p class="kicker">${tx("Research-Grade Peptide Storefront", "Storefront de péptidos para investigación")}</p>
            <h1>${tx(
              "A cleaner, higher-trust peptide store built to convert on mobile and desktop.",
              "Una tienda de péptidos más limpia y fiable, pensada para convertir en móvil y escritorio."
            )}</h1>
            <p class="lead">${tx(
              "Primus Peptides combines a premium scientific aesthetic, clearer trust architecture, bilingual navigation, and a shorter path from product discovery to crypto checkout.",
              "Primus Peptides combina una estética científica premium, una arquitectura de confianza más clara, navegación bilingüe y un recorrido más corto desde el catálogo al checkout crypto."
            )}</p>
            <div class="hero-actions">
              <a class="btn btn-primary" href="shop.html">${tx("View Products", "Ver productos")}</a>
              <a class="btn btn-secondary" href="coa.html">${tx("COA Archive", "Archivo COA")}</a>
            </div>
            <div class="hero-trust">
              <div class="trust-chip"><strong>${localize(COPY.labels.hplc)}</strong></div>
              <div class="trust-chip"><strong>${localize(COPY.labels.shipped)}</strong></div>
              <div class="trust-chip"><strong>${localize(COPY.labels.freeShipping)}</strong></div>
            </div>
          </div>
          <div class="hero-stack reveal reveal-delay">
            <article class="panel panel-dark">
              <p class="panel-kicker">${tx("Conversion architecture", "Arquitectura de conversión")}</p>
              <h2>${tx(
                "COA-backed trust, strong product pages, and a cleaner checkout flow from the first screen.",
                "Confianza apoyada en COA, mejores páginas de producto y un checkout más claro desde la primera pantalla."
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
        <div class="container trust-grid">${renderTrustCards()}</div>
      </section>
      <section class="section">
        <div class="container">
          <div class="section-header reveal">
            <p class="section-kicker">${tx("Featured products", "Productos destacados")}</p>
            <h2 class="section-title">${tx(
              "A cleaner white-lab catalogue that keeps pricing, trust, and product intent easy to scan.",
              "Un catálogo limpio de estilo laboratorio donde precio, confianza e intención de compra se leen rápido."
            )}</h2>
          </div>
          <div class="catalog-grid">${featured}</div>
        </div>
      </section>
      <section class="section section-dark">
        <div class="container section-stack">
          <div class="section-header reveal">
            <p class="section-kicker">${tx("Why buyers stay", "Por qué se quedan")}</p>
            <h2 class="section-title">${tx(
              "Scientific positioning, clearer operations copy, and stronger confidence-building content blocks.",
              "Posicionamiento científico, copy operativo más claro y bloques de confianza más sólidos."
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
              <h2 class="section-title">${tx("Dispatch and delivery information that answers objections early.", "Información de salida y entrega que resuelve objeciones desde el principio.")}</h2>
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
            <p class="panel-kicker">${tx("Checkout-ready", "Listo para checkout")}</p>
            <h3>${tx("Hosted ArionPay payment links now fit the storefront without a custom invoice dependency.", "Los enlaces de pago alojados de ArionPay ahora encajan en la tienda sin depender de una factura personalizada.")}</h3>
            <p class="section-copy">${tx(
              "The cart, checkout, and support pages are now structured to reduce friction while still keeping the storefront compliant and trust-led.",
              "Carrito, checkout y soporte ya están estructurados para reducir fricción manteniendo una tienda clara y orientada a confianza."
            )}</p>
          </article>
        </div>
      </section>
      <section class="section section-tight">
        <div class="container section-stack">
          <div class="section-header reveal">
            <p class="section-kicker">${tx("Key benefits", "Beneficios clave")}</p>
            <h2 class="section-title">${tx("Operational trust signals repeated where buying decisions happen.", "Señales operativas de confianza repetidas justo donde ocurre la decisión de compra.")}</h2>
          </div>
          <div class="benefit-grid">${renderBenefitCards()}</div>
        </div>
      </section>
      <section class="section section-tight">
        <div class="container section-stack">
          <div class="section-header reveal">
            <p class="section-kicker">${tx("Why trust us", "Por qué confiar en nosotros")}</p>
            <h2 class="section-title">${tx("A certificate-led layer that feels closer to a specialist supplier than a generic supplement store.", "Una capa de confianza orientada a certificados que se siente más cercana a un proveedor especialista que a una tienda genérica.")}</h2>
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

  function renderProductDescriptionEnhanced(product) {
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

  function renderProductAdditionalEnhanced(product) {
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
          <span class="gallery-thumb-label">${index === 0 ? tx("Primary", "Principal") : `${tx("View", "Vista")} ${index + 1}`}</span>
          <img src="${image}" alt="${localize(product.name)} ${product.dosage}">
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
              <p class="panel-kicker">${tx("Product detail", "Detalle de producto")}</p>
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
              <h1>${tx("Review your order before checkout.", "Revisa tu pedido antes del checkout.")}</h1>
              <p class="lead">${tx("The cart now leads directly into a cleaner guest-checkout flow with delivery selection, hosted crypto payment links, and bank transfer fallback.", "El carrito ahora lleva directamente a un checkout invitado más limpio con selección de envío, enlaces de pago crypto alojados y transferencia bancaria como alternativa.")}</p>
            </div>
            ${renderCartItems(cart)}
          </section>
          <aside class="summary-card reveal reveal-delay">
            <div class="section-header">
              <p class="section-kicker">${tx("Order summary", "Resumen del pedido")}</p>
              <h2 class="section-title">${tx("Minimal-friction guest checkout", "Checkout invitado sin fricción")}</h2>
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
              <div class="support-chip">${tx("Payments")}: ${ACTIVE_PAYMENT_OPTIONS.map((item) => localize(item.label)).join(" / ")}</div>
            </div>
            <div class="stack-sm" data-cart-preferences>
              <span class="checkout-eyebrow">${tx("Choose delivery before checkout", "Elige envio antes del checkout")}</span>
              <div class="checkout-method-grid">
                ${DELIVERY_OPTIONS.map((item) => renderDeliveryOption(item, delivery.id, total)).join("")}
              </div>
            </div>
            <div class="stack-sm" data-cart-preferences>
              <span class="checkout-eyebrow">${tx("Choose payment before checkout", "Elige pago antes del checkout")}</span>
              <div class="checkout-method-grid">
                ${ACTIVE_PAYMENT_OPTIONS.map((item) => renderPaymentOption(item, payment.id)).join("")}
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
              ? tx("Your delivery and payment choices will carry into checkout.", "Tus elecciones de envio y pago se mantendran en el checkout.")
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
              <p class="section-kicker">${tx("Contact", "Contacto")}</p>
              <h1>${tx("Support, shipping, and order questions in one place.", "Soporte, envíos y consultas de pedido en un solo lugar.")}</h1>
              <p class="lead">${tx("Use the contact flow for product questions, batch-document requests, and pre-checkout support.", "Usa este flujo para dudas de producto, solicitudes de documentación por lote y soporte antes del checkout.")}</p>
            </div>
            <div class="contact-points">
              <div class="contact-point"><strong>${tx("Email", "Correo")}</strong><a href="mailto:${SITE_EMAIL}">${SITE_EMAIL}</a></div>
              <div class="contact-point"><strong>${tx("Shipping window", "Ventana de envío")}</strong><p>${tx("EU dispatch target: 24h once payment and order review are complete.", "Objetivo de salida UE: 24h una vez completada la revisión de pago y pedido.")}</p></div>
              <div class="contact-point"><strong>${tx("Accepted payments", "Pagos aceptados")}</strong><p>${tx("USDT (TRC20) now routes through hosted ArionPay payment links for supported single-product checkouts, with bank transfer available as fallback.", "USDT (TRC20) ahora se dirige mediante enlaces de pago alojados de ArionPay para checkouts compatibles de un solo producto, con transferencia bancaria disponible como alternativa.")}</p><div class="payment-chips">${ACTIVE_PAYMENT_OPTIONS.map((item) => `<span class="payment-chip">${item.chip || item.label}</span>`).join("")}</div></div>
            </div>
          </article>
          <article class="contact-card reveal reveal-delay">
            <div class="section-header">
              <p class="section-kicker">${tx("Send a message", "Enviar mensaje")}</p>
              <h2 class="section-title">${tx("Open a ready-made email draft instead of a dead-end placeholder form.", "Abre un borrador de correo real en lugar de un formulario vacío.")}</h2>
            </div>
            <form class="form-grid" data-contact-form>
              <label class="full-width"><span>${tx("Name", "Nombre")}</span><input class="form-input" name="name" required></label>
              <label class="full-width"><span>${tx("Email", "Correo")}</span><input class="form-input" name="email" type="email" required></label>
              <label class="full-width"><span>${tx("Subject", "Asunto")}</span><input class="form-input" name="subject" placeholder="${tx("Order support, COA request, shipping question...", "Soporte de pedido, solicitud COA, duda de envío...")}"></label>
              <label class="full-width"><span>${tx("Message", "Mensaje")}</span><textarea class="form-textarea" name="message" placeholder="${tx("Tell us what you need and we will route it through the right support flow.", "Indícanos lo que necesitas y lo encaminaremos por el flujo de soporte adecuado.")}"></textarea></label>
              <div class="full-width form-row">
                <p class="form-status" data-contact-status></p>
                <button class="btn btn-primary" type="submit">${tx("Open email draft", "Abrir borrador")}</button>
              </div>
            </form>
          </article>
        </div>
      </section>
    `;
  };

  function legacyRenderCheckoutPage() {
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
    const bankTransferOrder = success && order && isBankTransferPayment(order.payment);

    if (success && order) {
      return `
        <section class="page-hero">
          <div class="container section-stack">
            <article class="success-card reveal">
              <p class="section-kicker">${bankTransferOrder ? tx("Bank transfer selected", "Transferencia bancaria seleccionada") : tx("Order received", "Pedido recibido")}</p>
              <h1 class="success-title">${tx("Your order summary is ready.", "El resumen de tu pedido esta listo.")}</h1>
              <p class="success-copy">${tx("Crypto checkout now uses hosted ArionPay payment links, while bank transfer remains available as the manual-payment fallback.", "El checkout crypto ahora usa enlaces de pago alojados de ArionPay, mientras que la transferencia bancaria sigue disponible como alternativa manual.")}</p>
              <div class="order-meta-grid">
                <article class="detail-card"><span class="detail-label">${tx("Order reference", "Referencia")}</span><strong>${order.reference}</strong><p>${formatDate(order.createdAt)}</p></article>
                <article class="detail-card"><span class="detail-label">${bankTransferOrder ? tx("Amount due", "Importe a pagar") : tx("Payment", "Pago")}</span><strong>${bankTransferOrder ? formatPrice(order.total) : paymentDisplayLabel(order.payment, order.paymentCurrency)}</strong><p>${bankTransferOrder ? tx("Manual bank transfer pending confirmation.", "Transferencia bancaria manual pendiente de confirmacion.") : localize(order.payment.note)}</p></article>
                <article class="detail-card"><span class="detail-label">${tx("Delivery", "Entrega")}</span><strong>${localize(order.shipping.label)}</strong><p>${localize(order.shipping.eta)}</p></article>
              </div>
              <div class="summary-divider"></div>
              <div class="order-line-items">${renderOrderLineItems(order.items)}</div>
              ${bankTransferOrder ? renderBankTransferInstructions(order) : ""}
              <div class="cta-row-inline">
                <a class="btn btn-primary" href="shop.html">${tx("Back to shop", "Volver a la tienda")}</a>
                <a class="btn btn-secondary" href="contact.html">${tx("Contact support", "Contactar soporte")}</a>
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
              <p class="lead">${tx("Choose delivery, then continue with a hosted ArionPay payment link or reserve the order for manual bank transfer.", "Elige el envio y luego continua con un enlace de pago alojado de ArionPay o reserva el pedido para transferencia bancaria manual.")}</p>
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
    const bankTransferOrder = success && order && isBankTransferPayment(order.payment);
    const paymentLabel = paymentDisplayLabel(payment, cryptoCurrency);
    const cryptoCurrencyOptions = CRYPTO_CURRENCY_OPTIONS.map((item) => {
      const optionLabel = item.live
        ? localize(item.label)
        : `${localize(item.label)} - ${tx("coming soon", "proximamente")}`;
      return `<option value="${item.id}" ${item.id === cryptoCurrency.id ? "selected" : ""}>${optionLabel}</option>`;
    }).join("");

    if (success && order) {
      return `
        <section class="page-hero">
          <div class="container section-stack">
            <article class="success-card reveal">
              <p class="section-kicker">${bankTransferOrder ? tx("Bank transfer selected", "Transferencia bancaria seleccionada") : tx("Order received", "Pedido recibido")}</p>
              <h1 class="success-title">${tx("Your order summary is ready.", "El resumen de tu pedido esta listo.")}</h1>
              <p class="success-copy">${tx("Crypto checkout now uses hosted ArionPay payment links, while bank transfer remains available as the manual-payment fallback.", "El checkout crypto ahora usa enlaces de pago alojados de ArionPay, mientras que la transferencia bancaria sigue disponible como alternativa manual.")}</p>
              <div class="order-meta-grid">
                <article class="detail-card"><span class="detail-label">${tx("Order reference", "Referencia")}</span><strong>${order.reference}</strong><p>${formatDate(order.createdAt)}</p></article>
                <article class="detail-card"><span class="detail-label">${bankTransferOrder ? tx("Amount due", "Importe a pagar") : tx("Payment", "Pago")}</span><strong>${bankTransferOrder ? formatPrice(order.total) : paymentDisplayLabel(order.payment, order.paymentCurrency)}</strong><p>${bankTransferOrder ? tx("Manual bank transfer pending confirmation.", "Transferencia bancaria manual pendiente de confirmacion.") : localize(order.payment.note)}</p></article>
                <article class="detail-card"><span class="detail-label">${tx("Delivery", "Entrega")}</span><strong>${localize(order.shipping.label)}</strong><p>${localize(order.shipping.eta)}</p></article>
              </div>
              <div class="summary-divider"></div>
              <div class="order-line-items">${renderOrderLineItems(order.items)}</div>
              ${bankTransferOrder ? renderBankTransferInstructions(order) : ""}
              <div class="cta-row-inline">
                <a class="btn btn-primary" href="shop.html">${tx("Back to shop", "Volver a la tienda")}</a>
                <a class="btn btn-secondary" href="contact.html">${tx("Contact support", "Contactar soporte")}</a>
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
              <h1>${tx("Your cart is empty.", "Tu carrito esta vacio.")}</h1>
              <p>${tx("Add products before opening the guest checkout flow.", "Anade productos antes de abrir el checkout invitado.")}</p>
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
              <article class="checkout-card checkout-card-form">
                <div class="section-header">
                  <p class="section-kicker">${tx("Checkout", "Checkout")}</p>
                  <h1>${tx("Billing details and payment selection.", "Datos de facturacion y seleccion de pago.")}</h1>
                  <p class="lead">${tx("This checkout now follows a more standard store layout, making it easier to compare crypto checkout against a future card gateway or another provider.", "Este checkout ahora sigue una estructura mas estandar, facilitando comparar el pago crypto con una futura pasarela de tarjeta u otro proveedor.")}</p>
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
                  <div class="full-width checkout-toggle-group">
                    ${renderCheckoutToggle("marketingOptIn", tx("I would like to receive updates and news via email. (optional)", "Quiero recibir novedades y noticias por email. (opcional)"), draft.marketingOptIn)}
                    ${renderCheckoutToggle("createAccount", tx("Create an account?", "Crear una cuenta?"), draft.createAccount)}
                    ${renderCheckoutToggle("alternateShipping", tx("Ship to a different address?", "Enviar a una direccion diferente?"), draft.alternateShipping)}
                  </div>
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
                ${isBankTransferPayment(payment)
                  ? `<p class="checkout-side-note">${tx("Bank details stay off the public checkout until the client confirms the final receiving account.", "Los datos bancarios se mantienen fuera del checkout publico hasta que el cliente confirme la cuenta receptora final.")}</p>`
                  : `
                    <label class="checkout-inline-select">
                      <span>${tx("Please select a currency *", "Selecciona una moneda *")}</span>
                      <select class="form-select" name="paymentCurrency" form="checkout-form">
                        ${cryptoCurrencyOptions}
                      </select>
                    </label>
                    <p class="checkout-side-note">${tx("Only currencies with a live hosted link can continue immediately. Other currencies remain visible for future gateway planning.", "Solo las monedas con enlace alojado activo pueden continuar de inmediato. Las demas siguen visibles para planificar la futura pasarela.")}</p>
                  `
                }
              </div>
              <div class="support-chip-row">
                <div class="support-chip">${tx("Selected delivery", "Envio elegido")}: ${localize(delivery.label)}</div>
                <div class="support-chip">${tx("Selected payment", "Pago elegido")}: ${paymentLabel}</div>
              </div>
              <label class="checkout-agreement">
                <input type="checkbox" name="ageConfirmed" form="checkout-form" ${draft.ageConfirmed ? "checked" : ""} required>
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
            <div class="policy-callout">${tx("Review this policy with your legal adviser before publishing the live store.", "Revisa esta política con tu asesor legal antes de publicar la tienda.")}</div>
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

  renderPage = function () {
    const host = document.querySelector("[data-page-content]");

    if (!host) {
      return;
    }

    const page = getCurrentPage();
    document.documentElement.lang = currentLanguage;

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
    } else if (["privacy", "terms", "shipping", "refunds"].includes(page)) {
      host.innerHTML = renderLegalPage(page);
    }

    bindPageInteractions();
    initReveal();
    updateTitle();
    syncCheckoutUi();
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
      checkout: tx("Checkout", "Checkout"),
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

      document.querySelectorAll("[data-payment-currency-switch]").forEach((button) => {
        button.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();

          const draft = readCheckoutDraft();
          draft.paymentMethod = "USDT_TRC20";
          draft.paymentCurrency = button.getAttribute("data-payment-currency-switch") || "USDT_TRC20";
          saveCheckoutDraft(draft);
          renderPage();
        });
      });

      checkoutForm.addEventListener("input", () => {
        saveCheckoutDraft(checkoutDraftFromForm(checkoutForm));
      });

      checkoutForm.addEventListener("change", (event) => {
        saveCheckoutDraft(checkoutDraftFromForm(checkoutForm));
        if (["country", "shippingMethod", "paymentMethod", "paymentCurrency"].includes(event.target.name)) {
          renderPage();
        }
      });

      checkoutForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const submitButton = document.querySelector("[data-checkout-submit]");
        const statusNode = document.querySelector("[data-checkout-status]");
        const draft = checkoutDraftFromForm(checkoutForm);
        const cart = readCart();
        const total = subtotal(cart);
        const shipping = DELIVERY_OPTIONS.find((item) => item.id === draft.shippingMethod) || DELIVERY_OPTIONS[0];
        const payment = ACTIVE_PAYMENT_OPTIONS.find((item) => item.id === draft.paymentMethod) || ACTIVE_PAYMENT_OPTIONS[0];
        const shippingCost = deliveryPrice(shipping, total);
        const paymentCurrency = CRYPTO_CURRENCY_OPTIONS.find((item) => item.id === draft.paymentCurrency) || CRYPTO_CURRENCY_OPTIONS[0];
        const reference = orderReference();

        if (submitButton) {
          submitButton.disabled = true;
          submitButton.textContent = isBankTransferPayment(payment)
            ? tx("Preparing bank transfer instructions...", "Preparando instrucciones de transferencia bancaria...")
            : tx("Opening ArionPay...", "Abriendo ArionPay...");
        }

        if (statusNode) {
          statusNode.textContent = checkoutPendingStatus(payment);
        }

        saveCheckoutDraft(draft);

        if (isBankTransferPayment(payment)) {
          const order = {
            reference,
            createdAt: new Date().toISOString(),
            customer: draft,
            shipping,
            payment,
            subtotal: Number(total.toFixed(2)),
            shippingCost: Number(shippingCost.toFixed(2)),
            total: Number((total + shippingCost).toFixed(2)),
            status: "bank_transfer_pending",
            paymentCurrency,
            items: cart.map((item) => ({
              slug: item.slug,
              quantity: item.quantity,
              lineTotal: (getProduct(item.slug).price || 0) * item.quantity
            }))
          };

          saveLastOrder(order);

          if (typeof saveCart === "function") {
            saveCart([]);
          }

          if (typeof updateCartBadges === "function") {
            updateCartBadges();
          }

          window.location.href = "checkout.html?status=success";
          return;
        }

        const cryptoState = hostedCryptoCheckoutState(payment, cart, shipping, paymentCurrency.id);

        if (!cryptoState.ready || !cryptoState.url) {
          const message = cryptoState.reason || tx(
            "Hosted crypto checkout is not available for this cart.",
            "El checkout crypto alojado no esta disponible para este carrito."
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

        const order = {
          reference,
          createdAt: new Date().toISOString(),
          customer: draft,
          shipping,
          payment,
          subtotal: Number(total.toFixed(2)),
          shippingCost: Number(shippingCost.toFixed(2)),
          total: Number((total + shippingCost).toFixed(2)),
          status: "payment_link_redirected",
          paymentCurrency,
          paymentLinkUrl: cryptoState.url,
          items: cart.map((item) => ({
            slug: item.slug,
            quantity: item.quantity,
            lineTotal: (getProduct(item.slug).price || 0) * item.quantity
          }))
        };

        saveLastOrder(order);

        if (statusNode) {
          statusNode.textContent = tx(
            "Opening the hosted ArionPay payment link...",
            "Abriendo el enlace de pago alojado de ArionPay..."
          );
        }

        window.location.href = cryptoState.url;
      });
    }
  };

  patchSharedCopy();
  enrichProducts();

  if (document.readyState !== "loading") {
    renderShell();
    renderPage();
    renderCookieBanner();
    updateCartBadges();
  }
})();
