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
  const CART_STORE = typeof CART_KEY === "string"
    ? CART_KEY
    : "primus-cart-v2";
  const ARIONPAY_INVOICE_ENDPOINT = "/api/create-arionpay-invoice";
  const ORDER_STATUS_ENDPOINT = "/api/order-status";

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
        en: "Retatrutide is a triple GLP-1/GIP/glucagon receptor agonist developed for advanced metabolic research, combining three incretin pathways in a single molecule. This weekly injection protocol provides a comprehensive approach for studying appetite regulation, energy expenditure, and metabolic markers. The guide presents a structured escalation method for optimal tolerance and response assessment.",
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
        en: "Refined as a copper-peptide specialist page with stronger cosmetic-science and tissue-remodelling language from the updated guide.",
        es: "GHK-Cu (complejo glicil-L-histidil-L-lisina:cobre) es un péptido de cobre presente de forma natural con funciones documentadas en la cicatrización de heridas, remodelación tisular y regeneración de la piel. La investigación demuestra actividad en la regulación génica relacionada con la síntesis de colágeno, la defensa antioxidante y las vías antiinflamatorias. Este protocolo educativo presenta enfoques prácticos de administración subcutánea basados en patrones de práctica clínica."
      },
      howItWorks: {
        en: "GHK-Cu is positioned around collagen-related gene expression, antioxidant defence, wound support, and broader tissue-remodelling pathways linked to a naturally occurring copper complex.",
        es: "GHK-Cu se posiciona alrededor de expresion genetica relacionada con colageno, defensa antioxidante, soporte de heridas y vias de remodelacion tisular ligadas a un complejo natural de cobre."
      },
      benefits: {
        en: "Guide copy emphasizes skin quality, repair signalling, and recovery-facing use cases while keeping the page anchored in pathway research rather than cosmetic overstatement.",
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
        en: "Rebuilt as a mitochondrial-metabolism page anchored in AMPK signalling, nutrient use, and exercise-capacity research for high-intent buyers.",
        es: "MOTS-c es un péptido derivado de la mitocondria (MDP) de 16 aminoácidos que actúa como regulador metabólico, principalmente a través de la activación de AMPK. Los estudios preclínicos muestran que mejora la sensibilidad a la insulina, promueve la oxidación de grasas, mejora la capacidad de ejercicio y contrarresta el deterioro metabólico relacionado con la edad. Hasta la fecha, no se han completado ensayos clínicos en humanos. Este protocolo educativo presenta un enfoque de administración subcutánea una vez al día con titulación gradual."
      },
      howItWorks: {
        en: "MOTS-c is a mitochondrial-derived peptide guide positioned around AMPK activation, fuel selection, and communication between mitochondria and the nucleus during metabolic stress.",
        es: "MOTS-c es un peptido derivado de la mitocondria posicionado alrededor de activacion de AMPK, seleccion de combustible y comunicacion entre mitocondria y nucleo durante estres metabolico."
      },
      benefits: {
        en: "The guide emphasizes insulin sensitivity, fat oxidation, exercise-capacity support, and age-related metabolic resilience, while noting that human clinical data remain limited.",
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

  function normalizeCheckoutDraft(draft) {
    const next = draft && typeof draft === "object" ? { ...draft } : {};
    next.paymentMethod = "USDT_TRC20";
    next.paymentCurrency = "USDT_TRC20";
    next.createAccount = false;
    next.alternateShipping = false;
    return next;
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

  function clearStoredCart() {
    writeStoredValue(CART_STORE, JSON.stringify([]));
  }

  function isPaidOrderStatus(status) {
    return /paid|completed|confirmed|success/i.test(String(status || ""));
  }

  async function refreshArionPayOrderStatus() {
    if (getCurrentPage() !== "checkout") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("status") !== "success") {
      return;
    }

    const lastOrder = readLastOrder();
    if (!lastOrder || !lastOrder.reference) {
      return;
    }

    const statusNode = document.querySelector("[data-order-sync-status]");
    if (statusNode) {
      statusNode.textContent = tx(
        "Checking the latest ArionPay payment status...",
        "Comprobando el estado mas reciente del pago en ArionPay..."
      );
    }

    const query = new URLSearchParams({ reference: lastOrder.reference });
    if (lastOrder.invoiceId) {
      query.set("invoiceId", lastOrder.invoiceId);
    }

    try {
      const response = await fetch(`${ORDER_STATUS_ENDPOINT}?${query.toString()}`, {
        method: "GET",
        headers: { Accept: "application/json" }
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.order) {
        if (statusNode) {
          statusNode.textContent = tx(
            "Payment status is still syncing. You can reopen the ArionPay payment page if needed.",
            "El estado del pago todavia se esta sincronizando. Puedes reabrir la pagina de pago de ArionPay si hace falta."
          );
        }
        return;
      }

      const nextOrder = {
        ...lastOrder,
        status: payload.order.status || lastOrder.status,
        invoiceId: payload.order.invoiceId || lastOrder.invoiceId,
        invoiceUrl: payload.order.invoiceUrl || lastOrder.invoiceUrl,
        lastWebhookAt: payload.order.lastWebhookAt || lastOrder.lastWebhookAt
      };

      const changed =
        nextOrder.status !== lastOrder.status
        || nextOrder.invoiceId !== lastOrder.invoiceId
        || nextOrder.invoiceUrl !== lastOrder.invoiceUrl
        || nextOrder.lastWebhookAt !== lastOrder.lastWebhookAt;

      if (!changed) {
        if (statusNode) {
          statusNode.textContent = isPaidOrderStatus(nextOrder.status)
            ? tx("Payment confirmed by ArionPay.", "Pago confirmado por ArionPay.")
            : tx(
              "Payment is still awaiting confirmation from ArionPay.",
              "El pago sigue pendiente de confirmacion por ArionPay."
            );
        }
        return;
      }

      saveLastOrder(nextOrder);

      if (isPaidOrderStatus(nextOrder.status)) {
        clearStoredCart();
        saveCheckoutDraft({});
      }

      renderPage();
    } catch {
      if (statusNode) {
        statusNode.textContent = tx(
          "We could not refresh the payment status right now. Please reopen the payment page or check again shortly.",
          "No hemos podido actualizar el estado del pago ahora mismo. Reabre la pagina de pago o vuelve a comprobarlo en breve."
        );
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
    return tx("Pay now", "Pagar ahora");
  }

  function checkoutPendingStatus(payment) {
    return tx("Creating your secure ArionPay invoice...", "Creando tu factura segura de ArionPay...");
  }

  function checkoutHelperCopy(payment) {
    return tx(
      "You will continue to the secure ArionPay payment page after your billing details are confirmed.",
      "Continuaras a la pagina de pago segura de ArionPay una vez confirmados tus datos de facturacion."
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

    if (submitButton) {
      submitButton.textContent = checkoutSubmitLabel(payment);
      submitButton.disabled = !cryptoState.ready;
    }

    if (statusNode) {
      statusNode.textContent = cryptoState.ready
        ? tx(
          `You will be redirected to the secure ArionPay payment screen for ${localize(cryptoCurrency.label)}.`,
          `Seras redirigido a la pantalla de pago segura de ArionPay para ${localize(cryptoCurrency.label)}.`
        )
        : cryptoState.reason;
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
              "For laboratory research use only.",
              "Solo para uso de investigacion en laboratorio."
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
            <h3>${tx("Cryptocurrency checkout now fits the storefront without relying on the old custom gateway flow.", "El checkout con criptomonedas ahora encaja en la tienda sin depender del flujo antiguo de pasarela personalizada.")}</h3>
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
              <p class="section-kicker">${tx("Contact", "Contacto")}</p>
              <h1>${tx("Support, shipping, and order questions in one place.", "Soporte, envíos y consultas de pedido en un solo lugar.")}</h1>
              <p class="lead">${tx("Use the contact flow for product questions, batch-document requests, and pre-checkout support.", "Usa este flujo para dudas de producto, solicitudes de documentación por lote y soporte antes del checkout.")}</p>
            </div>
            <div class="contact-points">
              <div class="contact-point"><strong>${tx("Email", "Correo")}</strong><a href="mailto:${SITE_EMAIL}">${SITE_EMAIL}</a></div>
              <div class="contact-point"><strong>${tx("Shipping window", "Ventana de envío")}</strong><p>${tx("EU dispatch target: 24h once payment and order review are complete.", "Objetivo de salida UE: 24h una vez completada la revisión de pago y pedido.")}</p></div>
              <div class="contact-point"><strong>${tx("Accepted payments", "Pagos aceptados")}</strong><p>${tx("USDT is available through secure cryptocurrency checkout.", "USDT está disponible mediante checkout seguro con criptomonedas.")}</p><div class="payment-chips">${["USDT"].map((item) => `<span class="payment-chip">${item}</span>`).join("")}</div></div>
            </div>
          </article>
          <article class="contact-card reveal reveal-delay">
            <div class="section-header">
              <p class="section-kicker">${tx("Send a message", "Enviar mensaje")}</p>
              <h2 class="section-title">${tx("Send your request directly by email through a live support workflow.", "Envía tu solicitud directamente por correo mediante un flujo de soporte activo.")}</h2>
            </div>
            <form class="form-grid" data-contact-form>
              <label class="full-width"><span>${tx("Name", "Nombre")}</span><input class="form-input" name="name" required></label>
              <label class="full-width"><span>${tx("Email", "Correo")}</span><input class="form-input" name="email" type="email" required></label>
              <label class="full-width"><span>${tx("Subject", "Asunto")}</span><input class="form-input" name="subject" placeholder="${tx("Order support, COA request, shipping question...", "Soporte de pedido, solicitud COA, duda de envío...")}"></label>
              <label class="full-width"><span>${tx("Message", "Mensaje")}</span><textarea class="form-textarea" name="message" placeholder="${tx("Tell us what you need and we will route it through the right support flow.", "Indícanos lo que necesitas y lo encaminaremos por el flujo de soporte adecuado.")}"></textarea></label>
              <div class="full-width form-row">
                <p class="form-status" data-contact-status></p>
                <button class="btn btn-primary" type="submit">${tx("Compose email", "Redactar correo")}</button>
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
            <article class="success-card reveal">
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
                  ? `<a class="btn btn-primary" href="${order.invoiceUrl}" target="_blank" rel="noopener">${tx("Open payment page", "Abrir pagina de pago")}</a>`
                  : `<a class="btn btn-primary" href="shop.html">${tx("Back to shop", "Volver a la tienda")}</a>`
                }
                <a class="btn btn-secondary" href="contact.html">${tx("Contact support", "Contactar soporte")}</a>
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

      checkoutForm.addEventListener("input", () => {
        saveCheckoutDraft(checkoutDraftFromForm(checkoutForm));
      });

      checkoutForm.addEventListener("change", (event) => {
        saveCheckoutDraft(checkoutDraftFromForm(checkoutForm));
        if (["country", "shippingMethod"].includes(event.target.name)) {
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
          submitButton.textContent = tx("Creating your crypto payment...", "Creando tu pago con criptomonedas...");
        }

        if (statusNode) {
          statusNode.textContent = checkoutPendingStatus(payment);
        }

        saveCheckoutDraft(draft);

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
            customer: draft,
            items: cart.map((item) => ({
              slug: item.slug,
              quantity: item.quantity
            }))
          })
        })
          .then(async (response) => {
            const result = await response.json().catch(() => ({}));

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
              payment,
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

            if (statusNode) {
              statusNode.textContent = tx(
                "Secure invoice created. Redirecting to ArionPay...",
                "Factura segura creada. Redirigiendo a ArionPay..."
              );
            }

            window.location.href = result.invoiceUrl;
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

  patchSharedCopy();
  enrichProducts();

  if (document.readyState !== "loading") {
    renderShell();
    renderPage();
    renderCookieBanner();
    updateCartBadges();
  }
})();
