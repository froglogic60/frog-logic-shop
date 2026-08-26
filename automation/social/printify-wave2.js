// Wave 2: tees, hoodies, totes, notebooks and the ex-pin stickers.
//
// Deliberately a separate file from printify-setup.js. That script deletes and
// recreates any product whose blueprint no longer matches its own pick, so
// touching its KINDS would churn the 35 live wave-1 products and invalidate the
// IDs already sitting in netlify/functions/catalog.json. This one only ever
// looks at wave-2 items.
//
// Runs in GitHub Actions with PRINTIFY_API_KEY (+ optional PRINTIFY_SHOP_ID).
//
//   node printify-wave2.js            create (skips products that exist)
//   DRY_RUN=1 node printify-wave2.js  price report: for each kind, builds a
//                                     sample on each of the top three UK/EU
//                                     makers, reads their real base costs,
//                                     deletes them all. Shop left unchanged.
//   RECREATE=1 node printify-wave2.js delete and rebuild wave-2 products
const fs = require("fs");
const path = require("path");
const { loadSiteData } = require("./lib.js");
const { makeBrowserRenderer } = require("./gfonts.js");

const KEY = process.env.PRINTIFY_API_KEY;
let SHOP = process.env.PRINTIFY_SHOP_ID;
if (!KEY) { console.error("Missing PRINTIFY_API_KEY"); process.exit(1); }
const DRY = process.env.DRY_RUN === "1";

const EU = ["LV","CZ","DE","NL","PL","ES","IT","FR","IE","SE","AT","BE","PT","DK","FI","EE","LT","SK","SI","HR","RO","BG","HU","LU","GR","MT","CY"];
// Sam's choice, 24 Aug 2026: white / natural garments, S-2XL, one price.
const GARMENT = /^(white|natural|vintage white|off[- ]white|ash|ecru)$/i;
const SIZES = ["S", "M", "L", "XL", "2XL"];

// Printify announced these partnerships ending in Jul/Aug 2026. They stay
// listed in the catalogue right up to their cut-off date, so without this the
// script would cheerfully build products on a maker that disappears days later.
// Once each date passes they drop out of the API on their own and this list is
// simply belt and braces.
const RETIRED = /(drukātava|drukatava|drive fulfillment|hft71|rogac|jams designs|\bc4\b)/i;

// Printify rate-limits the catalogue endpoints hard, and scoring every UK/EU
// maker for five kinds is hundreds of calls. Space them out, and back off
// rather than dying when one comes back 429.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const GAP_MS = 150;
let lastCall = 0;
const cache = new Map();

async function api(p, method = "GET", body) {
  for (let attempt = 0; ; attempt++) {
    const wait = lastCall + GAP_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastCall = Date.now();
    const r = await fetch("https://api.printify.com/v1" + p, {
      method,
      headers: { Authorization: "Bearer " + KEY, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (r.ok) return r.json();
    if ((r.status === 429 || r.status >= 500) && attempt < 5) {
      const retryAfter = Number(r.headers.get("retry-after"));
      const backoff = retryAfter > 0 ? retryAfter * 1000 : Math.min(30000, 2000 * Math.pow(2, attempt));
      console.log(`   ${r.status} on ${p} — waiting ${Math.round(backoff / 1000)}s and retrying`);
      await sleep(backoff);
      continue;
    }
    throw new Error(method + " " + p + " -> " + r.status + " " + (await r.text()).slice(0, 300));
  }
}

// GETs during the catalogue sweep repeat a lot; one fetch each is plenty.
async function getCached(p) {
  if (!cache.has(p)) cache.set(p, api(p));
  return cache.get(p);
}

const KINDS = {
  tee: {
    label: "Tee", px: 3600, apparel: true,
    patterns: [/unisex.*(jersey )?short sleeve tee/i, /unisex.*t-?shirt/i, /^t-?shirt/i, /classic.*tee/i],
    avoid: /long sleeve|tank|crop|kid|youth|baby|toddler|women|ladies|v-?neck|raglan|tie-?dye|performance|sport|pocket|mineral wash/i,
  },
  hoodie: {
    label: "Hoodie", px: 3600, apparel: true,
    patterns: [/unisex.*hoodie/i, /hooded sweatshirt/i, /^hoodie/i],
    avoid: /zip|kid|youth|crop|women|ladies|lightweight|sleeveless/i,
    // Sam's instruction, 24 Aug 2026: run the cheaper hoodie. That is the
    // Gildan 18500 Heavy Blend at £28.69, not the College Hoodie at £29.24 —
    // same maker, same postage, so postage-ranking cannot tell them apart.
    // The size guide on the product pages is written to this garment.
    // Print Clever £28.69, T Shirt and Sons £30.14, for the identical
    // garment at identical postage — so the postage ranking below cannot tell
    // them apart and was taking the dearer one. Measured 24 Aug 2026.
    pin: { blueprint: /heavy blend|18500/i, provider: /print clever/i },
  },
  tote: {
    label: "Tote", px: 2400,
    patterns: [/organic cotton tote/i, /cotton tote bag/i, /tote bag/i, /\btote\b/i],
    avoid: /weekender|drawstring|duffle|laptop|lunch|mesh/i,
    sizeHint: /15|16|large/i,
  },
  notebook: {
    label: "Notebook", px: 2400,
    patterns: [/spiral notebook/i, /hardcover.*(notebook|journal)/i, /\bnotebook\b/i, /\bjournal\b/i],
    avoid: /sticky|note pad|notepad|planner/i,
    sizeHint: /a5|5.*x.*8|medium/i,
  },
  // The seven pin designs became £3.50 stickers, because Printify has no UK
  // or EU maker for pins at all. Pinned to exactly what wave 1 used for its ten
  // stickers — same blueprint, same maker, same variant — so the shop sells one
  // sticker, not two that differ in size for no reason a customer can see.
  sticker: {
    label: "Sticker", px: 1800,
    patterns: [/vinyl kiss-?cut sticker/i, /kiss-?cut sticker/i, /\bsticker sheet\b/i, /\bstickers?\b/i],
    avoid: /magnet|decal|wall|bumper|laptop skin/i,
    sizeHint: /3.*x.*3|medium/i,
    pin: { blueprint: /kiss-?cut sticker/i, provider: /sticky products europe/i },
    // 92314 is the 3", not the 4". These seven were held back on 24 Aug because
    // the 4" (92315) costs £5.46 against a £3.50 price — a £1.96 loss a sale.
    // On 26 Aug the ten live stickers moved to the 3", which costs £2.79 and
    // keeps 71p, so the reason for holding these back stopped being true. They
    // now match the ten already on sale: same blueprint, same maker, same size.
    //
    // Postage is still £6.49 from the Netherlands, because there is no UK maker
    // for kiss-cut stickers — but that is already the case for the ten on sale,
    // and the basket now quotes it before anyone commits to paying.
    pinVariantId: 92314,
  },
};

// Order matters: "Pin / sticker" was created as a sticker in wave 1 and must
// not be picked up again here.
function kindOf(num) {
  if (/Pin \/ sticker/.test(num)) return null;
  if (/—\s*Tee/.test(num)) return "tee";
  if (/—\s*Hoodie/.test(num)) return "hoodie";
  if (/—\s*Tote/.test(num)) return "tote";
  if (/—\s*Notebook/.test(num)) return "notebook";
  if (/—\s*Sticker/.test(num)) return "sticker";
  return null;
}

const slug = (w) => w.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const pence = (p) => Math.round(parseFloat(String(p).replace(/[^0-9.]/g, "")) * 100);
const gbp = (p) => "£" + (p / 100).toFixed(2);

const providerCache = {};
async function providerCountry(id) {
  if (!providerCache[id]) providerCache[id] = (await getCached(`/catalog/print_providers/${id}.json`)).location?.country || "?";
  return providerCache[id];
}

// Variant titles look like "White / S" or "S / White" depending on blueprint.
function parseVariant(title) {
  const parts = title.split("/").map((s) => s.trim());
  const size = parts.find((p) => SIZES.some((s) => s.toLowerCase() === p.toLowerCase()));
  const colour = parts.find((p) => GARMENT.test(p));
  return { size, colour, parts };
}

// First-item UK postage for a blueprint/provider, in pence.
async function ukShipping(bpId, prId) {
  try {
    const s = await getCached(`/catalog/blueprints/${bpId}/print_providers/${prId}/shipping.json`);
    for (const profile of s.profiles || []) {
      if ((profile.countries || []).includes("GB")) return profile.first_item?.cost ?? null;
    }
    const rest = (s.profiles || []).find((p) => (p.countries || []).includes("REST_OF_THE_WORLD"));
    return rest?.first_item?.cost ?? null;
  } catch { return null; }
}

// Every usable UK/EU maker for a kind, best first. The first version of this
// took the first match it found, which is how a £12 notebook ended up with a
// Latvian maker charging £19.59 to post it. Base cost can't be read before a
// product exists, so ranking uses what the catalogue does expose: country, then
// UK postage, then how much of the size range is covered.
async function collectCandidates(kind, blueprints) {
  const K = KINDS[kind];
  const out = [], tried = [], seenBp = new Set();
  for (const pat of K.patterns) {
    // Capped: the long tail of near-matching blueprints never wins, and
    // sweeping all of them is what got the last run rate-limited.
    for (const bp of blueprints.filter((b) => pat.test(b.title) && !(K.avoid && K.avoid.test(b.title))).slice(0, 6)) {
      if (seenBp.has(bp.id)) continue;
      seenBp.add(bp.id);
      let provs;
      try { provs = await getCached(`/catalog/blueprints/${bp.id}/print_providers.json`); } catch { continue; }
      for (const pr of provs) {
        if (RETIRED.test(pr.title)) { tried.push(`${bp.title} | ${pr.title} — skipped, partnership ending`); continue; }
        const country = await providerCountry(pr.id);
        if (country !== "GB" && !EU.includes(country)) continue;
        let vres;
        try { vres = await getCached(`/catalog/blueprints/${bp.id}/print_providers/${pr.id}/variants.json`); } catch { continue; }
        const vars = (vres.variants || []).filter((v) => v.placeholders && v.placeholders.length);
        if (!vars.length) continue;

        let variants;
        if (K.apparel) {
          const whites = vars.map((v) => ({ v, ...parseVariant(v.title) })).filter((x) => x.colour && x.size);
          const picked = SIZES.map((s) => whites.find((x) => x.size.toLowerCase() === s.toLowerCase())).filter(Boolean);
          if (picked.length < 4) { tried.push(`${bp.title} | ${pr.title} (${country}) — only ${picked.length}/5 white sizes`); continue; }
          variants = picked.map((x) => x.v);
        } else {
          // Wave 1's sticker is variant 92315. Matching it exactly keeps the
          // seven new stickers the same size as the ten already on sale.
          variants = [
            (K.pinVariantId && vars.find((v) => v.id === K.pinVariantId)) ||
            (K.sizeHint && vars.find((v) => K.sizeHint.test(v.title))) ||
            vars[0],
          ];
        }
        const shipGB = await ukShipping(bp.id, pr.id);
        out.push({ blueprint: bp, provider: pr, country, variants, shipGB });
        tried.push(`${bp.title} | ${pr.title} (${country}) — post ${shipGB == null ? "?" : gbp(shipGB)}`);
      }
    }
  }
  // A pinned maker wins outright. Postage ranking is the right default but
  // not always the right answer: two candidates can post identically and differ
  // only in base cost, which the catalogue does not expose before a product
  // exists. If the pin matches nothing we say so loudly and fall back rather
  // than silently building on whatever came first.
  const wantBp = K.pin && K.pin.blueprint;
  const wantPr = K.pin && K.pin.provider;
  const isPinned = (c) =>
    (!wantBp || wantBp.test(c.blueprint.title)) && (!wantPr || wantPr.test(c.provider.title)) ? 0 : 1;
  const pinMissed = !!(K.pin && !out.some((c) => isPinned(c) === 0));
  if (pinMissed) tried.push("!! nothing matched the pinned maker for this kind");
  out.sort((a, b) =>
    (K.pin ? isPinned(a) - isPinned(b) : 0) ||
    (a.country === "GB" ? 0 : 1) - (b.country === "GB" ? 0 : 1) ||
    (a.shipGB ?? 999999) - (b.shipGB ?? 999999) ||
    b.variants.length - a.variants.length);
  return { ranked: out, tried, pinMissed };
}

function artworkFor(renderer, logoURI) {
  return async (p, px) => {
    const svg = p.svg.replace(/href="assets\/frog-logic-mark-sm\.png"/g, `href="${logoURI}"`);
    return renderer.renderPng(svg, p.bg, px);
  };
}

async function createProduct(shop, cand, p, K, title, price, imageId) {
  const ids = cand.variants.map((v) => v.id);
  const ph = cand.variants[0].placeholders.find((x) => /front/i.test(x.position)) || cand.variants[0].placeholders[0];
  // Square artwork centred in a portrait print area: this fills the full chest
  // width, which is the colour-block panel Sam picked.
  const scale = Math.min(1, ph.height / ph.width);
  return api(`/shops/${shop}/products.json`, "POST", {
    title,
    description: p.line + " — " + p.word + ", from the Frog Logic feelings collection.",
    blueprint_id: cand.blueprint.id,
    print_provider_id: cand.provider.id,
    variants: ids.map((id) => ({ id, price, is_enabled: true })),
    print_areas: [{ variant_ids: ids, placeholders: [{ position: ph.position, images: [{ id: imageId, x: 0.5, y: 0.5, scale, angle: 0 }] }] }],
  });
}

(async () => {
  if (!SHOP) {
    const shops = await api("/shops.json");
    if (!shops.length) { console.error("No shops on this Printify account"); process.exit(1); }
    SHOP = shops[0].id;
    console.log("auto-detected shop:", shops[0].title, "(id " + SHOP + ")");
  }

  // Wave 1 made ten of the seventeen stickers. Skipping by product number
  // rather than by shop title means renaming a product inside Printify cannot
  // cause a duplicate to be built here.
  const ALREADY = new Set();
  try {
    const prev = require("./printify-result.json");
    (prev.results || prev).forEach((x) => x && x.num && ALREADY.add(x.num));
  } catch (e) {
    console.log("could not read the wave-1 result file:", e.message);
  }

  const { PRODUCTS } = loadSiteData();
  const wave = PRODUCTS.filter((p) => {
    const k = kindOf(p.num);
    return k && !ALREADY.has(p.num) && !KINDS[k].hold;
  });
  console.log(`skipping ${ALREADY.size} products wave 1 already made`);
  Object.keys(KINDS)
    .filter((k) => KINDS[k].hold)
    .forEach((k) => console.log(`HELD BACK — ${k}: ${KINDS[k].hold}`));
  const counts = {};
  wave.forEach((p) => (counts[kindOf(p.num)] = (counts[kindOf(p.num)] || 0) + 1));
  console.log("wave 2:", wave.length, "items", JSON.stringify(counts));

  const blueprints = await api("/catalog/blueprints.json");
  const targets = {}, alternates = {}, missing = [];
  for (const kind of Object.keys(KINDS)) {
    if (!counts[kind]) continue;
    console.log(`\nchoosing ${kind}...`);
    const { ranked, tried, pinMissed } = await collectCandidates(kind, blueprints);
    if (pinMissed) console.log(`  !! the pinned maker for ${kind} was not found — do not trust this pick`);
    if (!ranked.length) {
      missing.push(kind);
      console.log(`  no usable UK/EU maker. Considered:`);
      tried.slice(0, 14).forEach((t) => console.log("   ", t));
      continue;
    }
    console.log(`  ${ranked.length} usable option(s), best first:`);
    ranked.slice(0, 3).forEach((c, i) =>
      console.log(`   ${i + 1}. ${c.blueprint.title} | ${c.provider.title} (${c.country}) — UK post ${c.shipGB == null ? "?" : gbp(c.shipGB)}`));
    targets[kind] = ranked[0];
    alternates[kind] = ranked.slice(1, 3);
  }
  if (missing.length) console.log(`\nNO UK/EU MAKER FOR: ${missing.join(", ")} — those items are skipped.`);

  const renderer = await makeBrowserRenderer(path.join(__dirname, ".gfonts"));
  const logoURI = "data:image/png;base64," + fs.readFileSync(path.join(__dirname, "../../assets/frog-logic-mark-sm.png")).toString("base64");
  const render = artworkFor(renderer, logoURI);

  // ---------------- price check ----------------
  // Base cost is only visible on a created product, so each candidate gets a
  // real sample built, read and deleted. Nothing survives the run.
  if (DRY) {
    const report = [];
    for (const kind of Object.keys(targets)) {
      const K = KINDS[kind];
      const p = wave.find((x) => kindOf(x.num) === kind);
      const price = pence(p.price);
      const cands = [targets[kind], ...(alternates[kind] || [])];
      console.log(`\n--- ${kind} at ${gbp(price)} ---`);
      const png = await render(p, K.px);
      const up = await api("/uploads/images.json", "POST", { file_name: `probe-${kind}.png`, contents: Buffer.from(png).toString("base64") });
      for (const cand of cands) {
        const title = `ZZ price probe ${kind} ${cand.provider.id}`;
        try {
          const made = await createProduct(SHOP, cand, p, K, title, price, up.id);
          const enabled = (made.variants || []).filter((v) => v.is_enabled);
          const costs = enabled.map((v) => v.cost).filter((c) => typeof c === "number");
          const low = costs.length ? Math.min(...costs) : null;
          const high = costs.length ? Math.max(...costs) : null;
          const ship = cand.shipGB ?? 0;
          report.push({
            kind, price, blueprint: cand.blueprint.title, provider: cand.provider.title, country: cand.country,
            costLow: low, costHigh: high, ukShipping: ship,
            marginCustomerPaysPost: high == null ? null : price - high,
            marginYouPayPost: high == null ? null : price - high - ship,
            sizes: K.apparel ? enabled.map((v) => parseVariant(v.title).size || v.title) : undefined,
          });
          console.log(`  ${cand.provider.title} (${cand.country}): cost ${low == null ? "?" : gbp(low)}${low !== high ? "–" + gbp(high) : ""}, post ${gbp(ship)} -> keeps ${high == null ? "?" : gbp(price - high)} if the customer pays post`);
          await api(`/shops/${SHOP}/products/${made.id}.json`, "DELETE");
        } catch (e) {
          console.error(`  ${cand.provider.title}: FAILED — ${e.message}`);
        }
      }
    }
    await renderer.close();
    fs.writeFileSync(
      path.join(__dirname, "printify-wave2-result.json"),
      JSON.stringify({ createdAt: new Date().toISOString(), dryRun: true, skippedKinds: missing, report }, null, 2) + "\n"
    );
    console.log("\nprice check done — every sample deleted, shop unchanged");
    return;
  }

  // ---------------- create for real ----------------
  const existing = {};
  for (let page = 1; ; page++) {
    const res = await api(`/shops/${SHOP}/products.json?limit=50&page=${page}`);
    (res.data || []).forEach((pr) => (existing[pr.title] = pr));
    if (!res.data || res.data.length < 50) break;
  }

  const results = [], errors = [], warnings = [];
  for (const p of wave) {
    const kind = kindOf(p.num);
    const cand = targets[kind];
    if (!cand) continue;
    const K = KINDS[kind];
    const catalogId = p.num.split("—")[0].trim() + "-" + slug(p.word);
    const title = `${p.word} — Frog Logic ${K.label}`;
    const price = pence(p.price);

    try {
      if (existing[title] && (existing[title].blueprint_id !== cand.blueprint.id || process.env.RECREATE === "1")) {
        await api(`/shops/${SHOP}/products/${existing[title].id}.json`, "DELETE");
        console.log("deleted (stale):", title);
        delete existing[title];
      }

      let product;
      if (existing[title]) {
        product = await api(`/shops/${SHOP}/products/${existing[title].id}.json`);
        console.log("exists:", title);
      } else {
        const png = await render(p, K.px);
        const up = await api("/uploads/images.json", "POST", { file_name: catalogId + ".png", contents: Buffer.from(png).toString("base64") });
        product = await createProduct(SHOP, cand, p, K, title, price, up.id);
        console.log("created:", title, "->", product.id);
      }

      const enabled = (product.variants || []).filter((v) => v.is_enabled);
      const costs = enabled.map((v) => v.cost).filter((c) => typeof c === "number");
      const worst = costs.length ? Math.max(...costs) : null;
      const ship = cand.shipGB ?? 0;
      const keep = worst == null ? null : price - worst;
      if (keep != null && keep < 0) {
        warnings.push(`${title}: sells at ${gbp(price)} but costs ${gbp(worst)} to make — LOSS of ${gbp(-keep)} before postage`);
      } else if (keep != null && keep < 200) {
        warnings.push(`${title}: only ${gbp(keep)} left after production, before postage`);
      }
      console.log(`   ${gbp(price)} - cost ${worst == null ? "?" : gbp(worst)} = ${keep == null ? "?" : gbp(keep)} (UK post ${gbp(ship)}, charged to the customer)`);

      results.push({
        id: catalogId, num: p.num, word: p.word, kind,
        printifyProductId: product.id,
        printifyVariantId: enabled[0]?.id ?? cand.variants[0].id,
        sizes: K.apparel
          ? enabled.map((v) => ({ size: parseVariant(v.title).size || v.title, variantId: v.id, cost: v.cost }))
          : undefined,
        price, worstCost: worst, ukShipping: ship,
        blueprint: cand.blueprint.title, provider: cand.provider.title, country: cand.country,
      });
    } catch (e) {
      console.error("FAILED:", title, "-", e.message);
      errors.push({ id: catalogId, error: e.message });
    }
  }

  await renderer.close();
  fs.writeFileSync(
    path.join(__dirname, "printify-wave2-result.json"),
    JSON.stringify({ createdAt: new Date().toISOString(), dryRun: false, skippedKinds: missing, results, errors, warnings }, null, 2) + "\n"
  );

  if (warnings.length) {
    console.log("\n=== MARGIN WARNINGS ===");
    warnings.forEach((w) => console.log(" ! " + w));
  }
  console.log(`\ndone: ${results.length} ok, ${errors.length} failed, ${warnings.length} margin warnings`);
  if (errors.length) process.exit(1);
})().catch((e) => { console.error(e); process.exit(1); });
