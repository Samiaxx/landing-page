# Primus Peptides – Milestone 1: Design / Initial Version

Date: 2026-04-07
Owner: Codex (landing page design draft)

## 1) Goals & Constraints
- Conversion-first funnel modeled on BioBoostX; adapt to Primus blue gradient (#1A6FD6 to #0D3B7A), white bases, dark accents.
- Mobile-first (360-390px base); sticky header/cart; fast load (light media, restrained motion).
- Bilingual EN/ES from day one; URLs as /en/ and /es/ (toggle in header).
- Crypto checkout via ArionPay; show accepted coins (USDT / ETH / BTC) near CTAs.
- Platform: Shopify (theme + custom gateway integration planning).
- Trust-heavy: COA surface, HPLC tested, ships in 24h, free-shipping threshold progress bar.

## 2) Information Architecture (Navigation)
- Home
- Shop (catalog grid)
- COA (certificates library)
- FAQ
- Contact
- Language toggle EN / ES
- Cart icon (sticky, shows count)

## 3) Style System (v0)
### Colors
- Primary gradient: #1A6FD6 to #0D3B7A
- Dark surface: #0B1A33
- Light surface: #F7FAFF
- Accent success (free shipping): #3DD598
- Alert/stock-low: #FFB020
- Text primary: #0D213A
- Text inverted: #E8F1FF
- Lines/cards: #E1E8F5

### Typography
- Headings: "Sora" or "Space Grotesk" (semi-tech, clean)
- Body/UI: "Inter" (system-friendly)
- Sizes (mobile first): H1 30/36, H2 24/30, H3 20/26, Body 16/24, Small 14/20, Button 16/18 bold

### Buttons
- Primary: gradient background, white text, 12px radius, padding 14x18, subtle shadow
- Secondary: outline #1A6FD6, text #1A6FD6, white bg

### Spacing Scale
- 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64

### Grid
- Mobile: 4-col, 16px gutter, 16px margin
- Desktop: 12-col, 80px content max 1200px, 24px gutter

## 4) Components (Key Specs)
- Header (sticky): logo left, nav center, language pill, cart icon w/ badge. Mobile collapses nav to icon row (no hamburger), horizontally scrollable if needed.
- Hero block: dark gradient background; headline, subhead, primary CTA "View products", secondary CTA "See COAs"; trust badges row (HPLC tested / Ships in 24h / Free shipping over X); background molecular motif.
- Product card: image 1:1, name, dosage, price, pill for status (Available / Coming Soon), add-to-cart button; trust mini-row.
- Trust badges bar: 3 icons, light cards on dark strip.
- Content 4-up: Team / Health / GMP Certificate / Quality & Analysis; icon + title + 2-line copy.
- Shipping table: card with columns (Region, Speed, Cost); icons per row.
- Benefits icons: 4-6 items grid, small SVG line icons.
- Footer: logo + tagline; Links column; Contact column; payment/crypto icons; cookie consent bar.
- Product page box: right-side box w/ name, dosage, price, qty stepper, add-to-cart, trust icons; under-box: tabs (Description, Additional Info). Free-shipping progress bar above button; stock bar.
- Tabs content templates
  - Description bullets: Material, Form, Manufacturing, Storage.
  - Additional Info sections (H3 + bullets): How This Works; Potential Benefits & Side Effects; Protocol Overview; Dosing Protocol; Dosing & Reconstitution Guide.
- Coming Soon badge: outlined pill #FFB020 text on pale background.
- Language toggle: EN | ES pill, active filled.

## 5) Page Wireframes (Text Outlines)
### Home (Mobile-First Order)
1. Sticky header (logo, nav icons, EN/ES toggle, cart badge).
2. Hero: dark gradient, headline, subhead, primary CTA, secondary CTA, trust badges row.
3. Featured Products: 4 cards horizontally scrollable on mobile, 2x2 on tablet, 4-wide on desktop.
4. Trust bar (repeat) or placed inside hero.
5. Content 4-up (Team/Health/GMP/Quality) on light background.
6. Shipping Info card/table.
7. Key Benefits icons grid.
8. Footer + payment/crypto strip; cookie banner.

### Product Page (Mobile-First)
- Gallery (image swipe) on top.
- Product box (sticky on desktop right): name, dosage, price, qty, add-to-cart, trust icons, free shipping progress.
- Tabs below: Description (spec list), Additional Info (5 sections from peptidedosages.com pattern).
- Stock/urgency pill, Coming Soon where relevant.

### COA Page
- Filter/search; list of products with downloadable COA PDF links; badges for latest date.

### FAQ
- Accordions (keep short answers), EN/ES copies.

### Contact
- Simple form (name, email, message), location/email/Telegram link, WhatsApp CTA if desired.

## 6) Copy Deck Skeleton (EN)
- Hero H1: "Research-grade peptides, trusted by athletes."
- Hero subhead: "COA-backed, HPLC tested, ships in 24h. Pay with crypto via ArionPay."
- CTAs: "View products" / "See COAs".
- Trust badges: "HPLC tested" / "Ships in 24h" / "Free shipping over EUR 200".
- Benefits titles: "Lab-grade purity", "COA per batch", "Crypto-secure checkout", "Fast EU shipping", "Bilingual support".
- Shipping headline: "Fast fulfillment, transparent rates".
- Footer tagline: "Primus Peptides - research-grade quality for human performance.".
- Product Description fields template: Material, Form, Manufacturing, Storage.
- Additional Info section headers fixed as listed above.

## 7) Catalog (For UI Data)
- Available: Tirzepatide 30mg (EUR 55), Retatrutide 30mg (EUR 60), TB-500 20mg (EUR 40), BPC-157 10mg (EUR 14), GHK-CU 50mg (EUR 13), MOTS-C 40mg (EUR 35), Melanotan MT2 10mg (EUR 14), SS-31 50mg (EUR 50), NAD+ 1000mg (EUR 30), Semax 30mg (EUR 20), Selank 10mg (EUR 18).
- Coming May: DSIP 10mg, Epithalon 40mg, Ipamorelin 10mg, KPV 10mg, PT141 10mg, Oxytocin 10mg.

## 8) Microcopy ES (Draft)
- H1: "Peptidos de grado investigacion, confiables para atletas." 
- Subhead: "COA disponible, HPLC probado, envio en 24h. Paga con cripto via ArionPay." 
- CTAs: "Ver productos" / "Ver COAs" 
- Trust badges: "HPLC probado" / "Envio en 24h" / "Envio gratis desde EUR 200" 
- Footer tagline: "Primus Peptides - calidad de investigacion para el rendimiento humano." 
- Tabs labels: "Descripcion" / "Informacion adicional"

## 9) Acceptance Criteria For This Milestone
- Wireframes for Home (mobile/desktop) and Product page (mobile/desktop) documented with section order and component specs.
- Visual system v0: colors, type, buttons, spacing, grid, icon style direction.
- Copy skeleton EN/ES for hero, benefits, trust badges, tabs labels.
- Catalog statuses marked (Available vs Coming Soon) for UI badges.
- ArionPay and crypto acceptance surfaced near primary CTAs.
- Language toggle placement defined (header) and URL pattern decided (/en/, /es/).

## 10) Next Steps (Post-Approval)
- Produce hi-fidelity mockups (Home hero + Product page) using this system.
- Flesh out ES translations for all UI strings and 11 in-stock product descriptions.
- Define free-shipping threshold value for progress bar and badge.
- Confirm shipping table rates and regions; add COA PDFs and dates.
- Proceed with Shopify implementation planning (theme, language setup, ArionPay gateway).


