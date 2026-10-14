// Builds one web page per product, download and free guide, plus sitemap.xml.
//
// Why: until 13 Oct 2026 the whole shop was ONE page. Google knew four URLs for
// froglogic.co.uk (the shop, returns, terms, privacy), so nobody searching for
// "ADHD planner printable" or "free PDA guide" could land on a page about that
// thing — there was no such page. Sam: "lets get this business seen!"
//
// Everything comes from script.js (the same arrays that render the shop), so a
// page can never disagree with the shop. Each page has its own title, meta
// description, Open Graph image, schema.org markup, the product's artwork or
// real photo, a working buy button (basket.js and size-guide.js load as usual),
// a few paragraphs of honest plain-English copy, and links to related pages.
//
//   node build-pages.cjs                writes /p/<slug>/index.html, og.png, /sitemap.xml
//   SKIP_IMAGES=1 node build-pages.cjs  pages + sitemap only (quick local check)
//
// Run from the "Build the product pages" workflow after anything in script.js
// changes; it commits [skip netlify], so the pages go live with the next
// "Publish the shop".
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..", "..");
const SITE = "https://froglogic.co.uk";
const OUT = path.join(ROOT, "p");
const TODAY = new Date().toISOString().slice(0, 10);

// ---- the shop's own data, straight out of script.js
function loadShop() {
  const src = fs.readFileSync(path.join(ROOT, "script.js"), "utf8");
  const ctx = {
    document: { getElementById: () => null, addEventListener() {}, querySelectorAll: () => [], body: { addEventListener() {}, classList: { toggle() {} } } },
    window: {}, fetch: async () => ({ ok: false }), alert() {}, setTimeout, console,
  };
  vm.createContext(ctx);
  vm.runInContext(src + "\n;__shop={PRODUCTS,DIGITAL_PRODUCTS,GUIDES,PROFESSIONAL,ORGANISATION,checkoutId,pageSlug,guideSvg,CREAM,INK,GOLD};", ctx);
  return ctx.__shop;
}

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const attr = esc;
const kindOf = (num) => (num.includes("—") ? num.split("—")[1].trim() : num);
const money = (p) => String(p).replace(/[^0-9.]/g, "");

// ---- the words on each page. Short, true, in the shop's voice.
const BRAND = `Frog Logic is a small shop run by one neurodivergent person in the UK. Everything on it uses the words we actually use for ourselves — never a clinical label printed on your chest — and every piece carries a small frog, because it's still us who made it.`;

const PHYSICAL = {
  "Tee": { noun: "tee", title: (w) => `${w} tee — neurodivergent-affirming t-shirt`, how: "Printed to order in the UK on a heavy-cotton unisex tee, sizes S to 2XL — there's a size guide in UK sizes below. Free UK delivery on tees. Usually with you in about a week." },
  "Mug": { noun: "mug", title: (w) => `${w} mug — neurodivergent-affirming 11oz mug`, how: "An 11oz white ceramic mug, printed to order in the UK. Dishwasher and microwave safe. Free UK delivery on mugs." },
  "Wall print": { noun: "wall print", title: (w) => `${w} wall print — neurodivergent-affirming art print`, how: "A 16 × 16 inch semi-gloss poster, printed to order in the UK and posted flat-packed. Postage is shown before you pay; UK orders over £80 ship free." },
  "Tote": { noun: "tote bag", title: (w) => `${w} tote bag — neurodivergent-affirming cotton tote`, how: "A cotton tote, printed to order in the UK. Postage is shown before you pay; UK orders over £80 ship free." },
  "Notebook": { noun: "notebook", title: (w) => `${w} notebook — A5 wirobound notebook`, how: "An A5 wirobound notebook, printed to order in the UK. Postage is shown before you pay; UK orders over £80 ship free." },
  "Water bottle": { noun: "water bottle", title: (w) => `${w} water bottle — neurodivergent-affirming bottle`, how: "A printed water bottle, made to order in the UK. Postage is shown before you pay; UK orders over £80 ship free." },
  "Sticker": { noun: "sticker", title: (w) => `${w} sticker`, how: "Printed to order." },
};

// Which pieces also have a US twin (made and posted inside the US). Read from
// the checkout catalogue, because that is what decides whether a US address is
// actually offered — the page must never promise more than the till allows.
const CATALOG = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, "../../netlify/functions/catalog.json"), "utf8")); }
  catch { return []; }
})();
let shopRef = null;
function usLine(item, kind) {
  if (!shopRef) return null;
  const entry = CATALOG.find((c) => c.id === shopRef.checkoutId(item.num, item.word));
  if (!entry || !entry.us) return null;
  const ukPrice = Number(money(item.price));
  const usPrice = entry.us.price;
  const noun = (PHYSICAL[kind] && PHYSICAL[kind].noun) || "piece";
  return `<strong>In the US?</strong> This ${esc(noun)} is also made and posted inside the US, so there's no import charge to pay on delivery. Choose the United States under "Deliver to" in the basket and the postage is shown before you pay.` +
    (usPrice && usPrice !== ukPrice ? ` The US price is £${usPrice.toFixed(2).replace(/\.00$/, "")}.` : "");
}

function copyFor(item, group) {
  const kind = kindOf(item.num);
  if (group === "guide") return {
    title: `${item.word} explained — a free, plain-English guide | The Pond Guides`,
    h1: `${item.word}, explained warmly`,
    eyebrow: "Free guide · The Pond Guides",
    paras: [
      `A free guide to ${item.word}, written in plain English for the person it's about and for the people around them — partners, parents, teachers, managers, GPs. What it's like from inside, what people get wrong, and what actually helps.`,
      "It's a PDF. Download it, print it, send it to someone who needs to read it. No email address, no sign-up, no catch — the guides are free so that they travel.",
      `There are twenty-three Pond Guides, one per neurotype. If you work with a lot of different brains, <a href="/p/the-pond-guides/">the complete set</a> is all of them in one file.`,
    ],
    cta: { href: `/digital/Pond-Guide-${item.slug}.pdf`, label: "Download the guide — free", download: true },
  };
  if (group === "bespoke") return {
    title: "The Bespoke Planner — a printable planner built for your brain (ADHD, autism, AuDHD)",
    h1: "The Bespoke Planner",
    eyebrow: "Made to order · £25",
    paras: [
      "Every planner you've ever bought was built for someone else's brain. This one is assembled for yours. You answer fifteen questions — how your day actually runs, how you track energy, what you keep forgetting, what a hard day looks like and what actually helps, who most needs to understand your brain — and a planner of up to eighteen pages is built from your answers and emailed to you as a printable PDF, usually within a couple of hours.",
      "Four of the pages carry your own words: a Hard Day page with a tear-off half to hand to someone, a page addressed to your partner, manager, teacher or parent, your start-of-day and end-of-day as tick-lists, and a don't-forget strip on every daily page. Spoons or battery tracking, your choice. An easy-read option. Undated, so you print the pages you need as often as you need them, forever.",
      "If it doesn't fit, answer the questions again and we'll rebuild it — free. That's what bespoke means.",
    ],
    cta: { href: item.link, label: "Answer the questions — £25", external: true },
  };
  if (group === "set") return {
    title: "The Pond Guides, complete set — 23 plain-English neurodivergence guides in one PDF",
    h1: "The Pond Guides — the complete set",
    eyebrow: `Printable set · ${item.price}`,
    paras: [
      "All twenty-three Pond Guides in one file: autism, ADHD, AuDHD, dyslexia, dyspraxia, PDA, OCD, anxiety and the rest, each explained warmly and in plain English — what it's like from inside, what people get wrong, and what actually helps.",
      "For the people who meet a lot of different brains at work: teachers, GPs, managers, support workers, SENCOs. The individual guides stay free for the people they're about; this is the whole shelf in one download, for when you need all of it rather than one of it.",
      "Instant download after payment. Print it as often as you like for your own use.",
    ],
    cta: { buy: true, label: "Buy the set" },
  };
  if (group === "org") return {
    title: "The Organisation Pack — printable neurodivergence tools with a licence for your team, service or organisation",
    h1: "The Organisation Pack",
    eyebrow: "Digital licence · from £95",
    paras: [
      "Seventeen of the shop's printable tools — communication sheets, planners, scripts, cards — plus all twenty-three Pond Guides, in one 79-page file, with a plain-English licence to print and hand them out to the people you support. Three sizes: Team (up to 10 staff, £95), Service (up to 50 staff, £195) and Organisation (all staff, all sites, intranet included, £395).",
      "The licence never expires, printing for the people you support is unlimited, and updated files come to you free for twelve months when a sheet changes. No reselling, no public posting. Move up a tier later by paying the difference. Invoice or purchase order by email if that's how your organisation buys.",
      "Downloads instantly after payment, like everything else here.",
    ],
    cta: { buy: true, label: "Buy the licence", tiers: true },
  };
  if (group === "digital") return {
    title: `${item.word} — printable PDF for ADHD, autistic and neurodivergent adults`,
    h1: item.word,
    eyebrow: `Printable PDF · ${item.price}`,
    paras: [
      item.line,
      "A printable PDF, A4, delivered to your inbox the moment you pay. Print it as many times as you like, for as long as you like — it's deliberately calmer than the prints, because it's meant to be used on a hard day. High contrast, generous spacing, nothing fiddly.",
      "Personal use. If you'd like to hand it out across a team or a service, <a href=\"/p/the-organisation-pack/\">the Organisation Pack</a> is the licensed version.",
    ],
    cta: { buy: true, label: "Download" },
  };
  // physical
  const k = PHYSICAL[kind] || { noun: kind.toLowerCase(), title: (w) => `${w} ${kind.toLowerCase()}`, how: "Printed to order in the UK." };
  return {
    title: k.title(item.word),
    h1: `${item.word}`,
    sub: `${kind} · ${item.price}`,
    eyebrow: `${item.num}`,
    paras: [
      item.line,
      item.frog ? "One of the Comfort & Chaos frogs — the Frog Logic frog living through it, drawn as a full-body character rather than a face with props." : "The word is the artwork: the letters scatter, spiral, sink or trail off unfinished depending on what the feeling actually does to you. Said by us, not about us.",
      k.how + " Change your mind within 14 days, or report a fault within 30 — see <a href=\"/returns.html\">returns</a>.",
      ...[usLine(item, kind)].filter(Boolean),
    ],
    cta: { buy: true, label: "Get this piece" },
  };
}

// ---- page shell: the shop's own header and footer, links made absolute.
function shell({ title, description, url, image, imageAlt, body, jsonld, sizeGuide }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)} | Frog Logic</title>
<meta name="description" content="${attr(description)}">
<link rel="icon" href="/assets/frog-logic-mark-sm.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500&family=Space+Grotesk:wght@500;700&family=DM+Sans:wght@400;500;700&family=Abril+Fatface&family=Anton&family=Instrument+Serif:ital@0;1&family=Syne:wght@600;800&family=Space+Mono:wght@400;700&family=Caveat:wght@600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/styles.css">
<link rel="canonical" href="${url}">
<meta property="og:type" content="product">
<meta property="og:site_name" content="Frog Logic">
<meta property="og:locale" content="en_GB">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${attr(title)}">
<meta property="og:description" content="${attr(description)}">
<meta property="og:image" content="${image}">
<meta property="og:image:alt" content="${attr(imageAlt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${attr(title)}">
<meta name="twitter:description" content="${attr(description)}">
<meta name="twitter:image" content="${image}">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap header-row">
    <a class="wordmark" href="/"><img src="/assets/frog-logic-mark-sm.png" alt="">Frog Logic</a>
    <nav class="site-nav" aria-label="Primary">
      <a href="/#collection">The words</a>
      <a href="/#frogs">The frogs</a>
      <a href="/#digital">Digital</a>
      <a href="/#guides">Guides</a>
      <a href="/#professionals">Professionals</a>
      <a href="/#organisations">Organisations</a>
      <a href="/#why">Why this exists</a>
      <button id="low-stim-toggle" class="btn btn-ghost btn-small" type="button" aria-pressed="false">Low-stim mode</button>
    </nav>
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="site-footer">
  <div class="wrap footer-row">
    <p>Frog Logic — made with care, printed to order</p>
    <nav aria-label="Policies"><a href="/returns.html">Returns</a><a href="/privacy.html">Privacy</a><a href="/terms.html">Terms</a></nav>
    <nav aria-label="Social"><a href="https://www.facebook.com/profile.php?id=61591258096296" rel="noopener">Facebook</a><a href="https://www.instagram.com/samanthajhall2026/" rel="noopener">Instagram</a></nav>
  </div>
</footer>
<script>
// script.js is deliberately NOT loaded here: it renders the whole catalogue
// into #product-grid, which this page uses as the wrapper size-guide.js looks
// for. The three things a product page needs from it live here instead.
(function(){
  var btn = document.getElementById('low-stim-toggle');
  if(btn) btn.addEventListener('click', function(){
    var on = document.body.classList.toggle('low-stim');
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.textContent = on ? 'Low-stim: on' : 'Low-stim mode';
  });
  function fit(){
    document.querySelectorAll('.stage svg text').forEach(function(t){
      if(t.closest('svg[data-no-fit]')) return;
      var txt = (t.textContent || '').trim(); if(!txt) return;
      var len; try { len = t.getComputedTextLength(); } catch(e){ return; }
      if(len <= 272) return;
      var cur = parseFloat(t.getAttribute('font-size') || window.getComputedStyle(t).fontSize) || 16;
      t.setAttribute('font-size', Math.max(8, Math.floor(cur * (272 / len))));
    });
  }
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(fit); else fit();
  var art = document.querySelector('[data-art]');
  if(art) art.addEventListener('click', function(){
    var stage = art.closest('.stage'), photo = stage.querySelector('.stage-photo');
    var showingArt = stage.classList.toggle('show-art');
    photo.style.visibility = showingArt ? 'hidden' : '';
    art.querySelector('span:last-child').textContent = showingArt ? 'See the photo' : 'See the artwork';
  });
})();
</script>
${sizeGuide ? '<script src="/size-guide.js"></script>' : ""}
<script src="/basket.js"></script>
<script data-goatcounter="https://froglogic.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>
</body>
</html>
`;
}

function relatedCards(items, shop) {
  return items.map((r) => `
      <a class="card related" href="/p/${r.slug}/">
        <div class="stage" style="background:${r.item.bg}">${r.photo ? `<img class="stage-photo" src="${attr(r.photo.src)}" alt="${attr(r.photo.alt || "")}" loading="lazy">` : r.svg}</div>
        <div class="card-meta"><p class="card-num">${esc(r.item.num)}</p><h3>${esc(r.item.word)}</h3><p class="card-price">${esc(r.item.price)}</p></div>
      </a>`).join("");
}

function buildPage(entry, related, shop) {
  const { item, group, slug, svg, photo, tiers } = entry;
  const c = copyFor(item, group);
  const url = `${SITE}/p/${slug}/`;
  const image = photo ? photo.src : `${SITE}/p/${slug}/og.png`;
  const description = (c.paras[0] || item.line).replace(/<[^>]+>/g, "").slice(0, 155);
  const kind = kindOf(item.num);
  const isTee = group === "physical" && kind === "Tee";

  const buyButton = (it, label) => `<button class="btn btn-primary" data-checkout-num="${attr(it.num)}" data-checkout-word="${attr(it.word)}" data-checkout-kind="${group === "physical" ? "physical" : "digital"}">${esc(label)}</button>`;
  let cta;
  if (c.cta.tiers) {
    cta = `<div class="tiers">${tiers.map((t) => `<div class="tier"><p class="card-price">${esc(kindOf(t.num))} — ${esc(t.price)}</p>${buyButton(t, c.cta.label)}</div>`).join("")}</div>`;
  } else if (c.cta.buy) {
    cta = `<p class="card-price">${esc(item.price)}</p>${buyButton(item, c.cta.label)}`;
  } else {
    cta = `<p class="card-price">${esc(item.price)}</p><a class="btn btn-primary" href="${attr(c.cta.href)}"${c.cta.download ? " download" : ""}${c.cta.external ? ' target="_blank" rel="noopener"' : ""}>${esc(c.cta.label)}</a>`;
  }

  const stage = photo
    ? `${svg}<img class="stage-photo" src="${attr(photo.src)}" alt="${attr(photo.alt || item.word)}"><button type="button" class="card-photo art-toggle" data-art><span class="card-thumb" style="background:${item.bg}">${svg}</span><span>See the artwork</span></button>`
    : svg;

  const body = `
<section class="collection product-page" id="product">
  <div class="wrap">
    <p class="crumbs"><a href="/">Frog Logic</a> › <a href="/${entry.anchor}">${esc(entry.section)}</a> › ${esc(item.word)}</p>
    <div class="product-grid-wrap" id="product-grid">
      <article class="card product-card" data-id="${attr(shop.checkoutId(item.num, item.word))}">
        <div class="stage" style="background:${item.bg}">${stage}</div>
        <div class="card-meta">
          <p class="card-num">${esc(c.eyebrow)}</p>
          <h1>${esc(c.h1)}</h1>
          ${c.sub ? `<p class="card-line">${esc(c.sub)}</p>` : ""}
          ${c.paras.map((p) => `<p class="product-para">${p}</p>`).join("\n          ")}
          ${cta}
        </div>
      </article>
    </div>
    <div class="product-about">
      <h2>About the shop</h2>
      <p>${BRAND} <a href="/#why">Why this exists.</a></p>
    </div>
    <h2 class="related-head">More from the pond</h2>
    <div class="pad-grid related-grid">${relatedCards(related, shop)}</div>
  </div>
</section>`;

  const jsonld = group === "guide"
    ? { "@context": "https://schema.org", "@type": "DigitalDocument", name: `${item.word} — a Pond Guide`, description, url, image, isAccessibleForFree: true, inLanguage: "en-GB", publisher: { "@type": "Organization", name: "Frog Logic", url: SITE }, encodingFormat: "application/pdf" }
    : { "@context": "https://schema.org", "@type": "Product", name: c.h1, description, url, image, brand: { "@type": "Brand", name: "Frog Logic" },
        offers: (tiers || [item]).map((t) => ({ "@type": "Offer", url, priceCurrency: "GBP", price: money(t.price), availability: "https://schema.org/InStock", itemCondition: "https://schema.org/NewCondition", seller: { "@type": "Organization", name: "Frog Logic" } })) };

  return shell({ title: c.title, description, url, image, imageAlt: `${item.word} — ${kind}`, body, jsonld, sizeGuide: isTee });
}

// ---- assemble the list of pages
function collect(shop) {
  const mockups = JSON.parse(fs.readFileSync(path.join(ROOT, "mockups.json"), "utf8"));
  const absSvg = (s) => String(s).replace(/href="assets\//g, 'href="/assets/');
  const pages = [];
  for (const p of shop.PRODUCTS.filter((x) => !x.retired)) {
    const section = p.halloween ? ["Halloween at the Pond", "#halloween"] : p.frog ? ["The frogs", "#frogs"] : ["The words", "#collection"];
    pages.push({ item: p, group: "physical", slug: shop.pageSlug(p), svg: absSvg(p.svg), photo: mockups[shop.checkoutId(p.num, p.word)] || null, section: section[0], anchor: section[1] });
  }
  for (const p of shop.DIGITAL_PRODUCTS) {
    pages.push({ item: p, group: p.feature ? "bespoke" : "digital", slug: shop.pageSlug(p), svg: absSvg(p.svg), photo: null, section: "Digital", anchor: "#digital" });
  }
  for (const g of shop.GUIDES) {
    pages.push({ item: g, group: "guide", slug: shop.pageSlug(g), svg: absSvg(shop.guideSvg(g)), photo: null, section: "The Pond Guides", anchor: "#guides" });
  }
  for (const p of shop.PROFESSIONAL) {
    pages.push({ item: p, group: "set", slug: shop.pageSlug(p), svg: absSvg(p.svg), photo: null, section: "For professionals", anchor: "#professionals" });
  }
  const org = shop.ORGANISATION;
  if (org.length) pages.push({ item: org[0], group: "org", slug: shop.pageSlug(org[0]), svg: absSvg(org[0].svg), photo: null, section: "Organisations", anchor: "#organisations", tiers: org });
  const seen = new Set();
  for (const p of pages) { if (seen.has(p.slug)) throw new Error("Duplicate page slug: " + p.slug); seen.add(p.slug); }
  return pages;
}

function pickRelated(page, pages) {
  const same = pages.filter((p) => p !== page && p.group === page.group);
  const pool = same.length >= 3 ? same : pages.filter((p) => p !== page);
  // Deterministic: start from the page's own position so neighbours vary.
  const i = pages.indexOf(page);
  const out = [];
  for (let k = 1; out.length < 3 && k <= pool.length; k++) out.push(pool[(i + k * 7) % pool.length]);
  return out;
}

async function renderOg(pages) {
  const { makeBrowserRenderer } = require(path.join(ROOT, "automation", "social", "gfonts.js"));
  const r = await makeBrowserRenderer(path.join(ROOT, "automation", "social", ".gfonts"));
  const logo = "data:image/png;base64," + fs.readFileSync(path.join(ROOT, "assets", "frog-logic-mark-sm.png")).toString("base64");
  let n = 0;
  try {
    for (const p of pages) {
      if (p.photo) continue; // real photo is the share image
      const svg = p.svg.replace(/href="\/assets\/frog-logic-mark-sm\.png"/g, `href="${logo}"`);
      const png = await r.renderPng(svg, p.item.bg, 1200);
      fs.writeFileSync(path.join(OUT, p.slug, "og.png"), png);
      n++;
    }
  } finally { await r.close(); }
  return n;
}

function sitemap(pages) {
  const fixed = [["/", "weekly", "1.0", TODAY], ["/returns.html", "yearly", "0.4", "2026-08-29"], ["/terms.html", "yearly", "0.3", "2026-08-29"], ["/privacy.html", "yearly", "0.3", "2026-08-29"]];
  const rows = fixed.map(([u, f, pr, d]) => `  <url><loc>${SITE}${u}</loc><lastmod>${d}</lastmod><changefreq>${f}</changefreq><priority>${pr}</priority></url>`)
    .concat(pages.map((p) => `  <url><loc>${SITE}/p/${p.slug}/</loc><lastmod>${TODAY}</lastmod><changefreq>monthly</changefreq><priority>${p.group === "guide" ? "0.7" : "0.8"}</priority></url>`));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join("\n")}\n</urlset>\n`;
}

(async () => {
  const shop = loadShop();
  shopRef = shop;
  const pages = collect(shop);
  // Start clean so a renamed or retired product's page disappears.
  fs.rmSync(OUT, { recursive: true, force: true });
  for (const p of pages) {
    fs.mkdirSync(path.join(OUT, p.slug), { recursive: true });
    fs.writeFileSync(path.join(OUT, p.slug, "index.html"), buildPage(p, pickRelated(p, pages), shop));
  }
  fs.writeFileSync(path.join(ROOT, "sitemap.xml"), sitemap(pages));
  let imgs = 0;
  if (process.env.SKIP_IMAGES !== "1") imgs = await renderOg(pages);
  console.log(`${pages.length} pages written to /p/, ${imgs} share images rendered, sitemap.xml has ${pages.length + 4} URLs`);
})().catch((e) => { console.error(e); process.exit(1); });
