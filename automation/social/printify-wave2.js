// Wave 2: tees, hoodies, totes, notebooks and pins.
//
// Deliberately a separate file from printify-setup.js. That script deletes and
// recreates any product whose blueprint no longer matches its own pick, so
// touching its KINDS would churn the 35 live wave-1 products and invalidate the
// IDs already sitting in netlify/functions/catalog.json. This one only ever
// looks at wave-2 items.
//
// Runs in GitHub Actions with PRINTIFY_API_KEY (+ optional PRINTIFY_SHOP_ID).
// Renders each design at print resolution, uploads it, creates the product with
// a UK-first print provider, then reads the product back to report real base
// costs and UK shipping against Sam's shelf price — so nothing quietly sells at
// a loss. Writes printify-wave2-result.json.
//
//   node printify-wave2.js            create (skips products that exist)
//   DRY_RUN=1 node printify-wave2.js  price report: builds one sample product
//                                     per kind to read its real base cost,
//                                     then deletes it. Shop left unchanged.
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

async function api(p, method = "GET", body) {
  const r = await fetch("https://api.printify.com/v1" + p, {
    method,
    headers: { Authorization: "Bearer " + KEY, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(method + " " + p + " -> " + r.status + " " + (await r.text()).slice(0, 300));
  return r.json();
}

const KINDS = {
  tee: {
    label: "Tee", px: 3600, apparel: true,
    patterns: [/unisex.*(jersey )?short sleeve tee/i, /unisex.*t-?shirt/i, /^t-?shirt/i, /classic.*tee/i],
    avoid: /long sleeve|tank|crop|kid|youth|baby|toddler|women|ladies|v-?neck|raglan|tie-?dye|performance|sport|pocket|heavy ?weight tie/i,
  },
  hoodie: {
    label: "Hoodie", px: 3600, apparel: true,
    patterns: [/unisex.*hoodie/i, /hooded sweatshirt/i, /^hoodie/i],
    avoid: /zip|kid|youth|crop|women|ladies|lightweight|sleeveless/i,
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
  pin: {
    label: "Pin", px: 1800,
    patterns: [/enamel pin/i, /pin button/i, /button pin/i, /\bbadge\b/i, /\bpins?\b/i],
    avoid: /sticker|magnet|keychain|keyring/i,
    sizeHint: /1\.?25|1\.?5|25 ?mm|32 ?mm|small/i,
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
  if (/—\s*Pin/.test(num)) return "pin";
  return null;
}

const slug = (w) => w.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const pence = (p) => Math.round(parseFloat(String(p).replace(/[^0-9.]/g, "")) * 100);
const gbp = (p) => "£" + (p / 100).toFixed(2);

const providerCache = {};
async function providerCountry(id) {
  if (!providerCache[id]) providerCache[id] = (await api(`/catalog/print_providers/${id}.json`)).location?.country || "?";
  return providerCache[id];
}

// Variant titles look like "White / S" or "S / White" depending on blueprint.
function parseVariant(title) {
  const parts = title.split("/").map((s) => s.trim());
  const size = parts.find((p) => SIZES.some((s) => s.toLowerCase() === p.toLowerCase()));
  const colour = parts.find((p) => GARMENT.test(p));
  return { size, colour, parts };
}

// GB providers first, then EU. Apparel additionally needs a white garment
// carrying the whole S-2XL range from one provider.
async function pickTarget(kind, blueprints) {
  const K = KINDS[kind];
  const tried = [];
  let best = null;
  for (const pat of K.patterns) {
    const cands = blueprints.filter((b) => pat.test(b.title) && !(K.avoid && K.avoid.test(b.title)));
    for (const bp of cands) {
      let provs;
      try { provs = await api(`/catalog/blueprints/${bp.id}/print_providers.json`); } catch { continue; }
      const scored = [];
      for (const pr of provs) {
        const c = await providerCountry(pr.id);
        if (c === "GB") scored.push([0, pr, c]);
        else if (EU.includes(c)) scored.push([1, pr, c]);
      }
      scored.sort((a, b) => a[0] - b[0]);
      for (const [, pr, country] of scored) {
        let vres;
        try { vres = await api(`/catalog/blueprints/${bp.id}/print_providers/${pr.id}/variants.json`); } catch { continue; }
        const vars = (vres.variants || []).filter((v) => v.placeholders && v.placeholders.length);
        if (!vars.length) continue;

        if (K.apparel) {
          const whites = vars.map((v) => ({ v, ...parseVariant(v.title) })).filter((x) => x.colour && x.size);
          const picked = SIZES.map((s) => whites.find((x) => x.size.toLowerCase() === s.toLowerCase())).filter(Boolean);
          tried.push(`${bp.title} | ${pr.title} (${country}) -> ${picked.length}/${SIZES.length} white sizes`);
          // Keep the best option rather than demanding a perfect one: a GB
          // provider missing 2XL still beats no product at all.
          const cand = { blueprint: bp, provider: pr, country, variants: picked.map((x) => x.v) };
          if (picked.length === SIZES.length && country === "GB") return cand;
          if (picked.length >= 4 && (!best || picked.length > best.variants.length ||
              (picked.length === best.variants.length && country === "GB" && best.country !== "GB"))) {
            best = cand;
          }
        } else {
          let pick = K.sizeHint ? vars.find((v) => K.sizeHint.test(v.title)) : null;
          pick = pick || vars[0];
          tried.push(`${bp.title} | ${pr.title} (${country}) -> ${pick.title}`);
          return { blueprint: bp, provider: pr, country, variants: [pick] };
        }
      }
    }
  }
  if (best) {
    const got = best.variants.map((v) => parseVariant(v.title).size).join(", ");
    console.log(`  best available for ${kind}: ${best.blueprint.title} | ${best.provider.title} (${best.country}) — sizes ${got}`);
    return best;
  }
  console.log(`  no usable target for ${kind}. Considered:`);
  tried.slice(0, 12).forEach((t) => console.log("   ", t));
  return null;
}

// First-item UK shipping for a blueprint/provider, in pence. Printify quotes
// this separately from the base cost and the shop does not charge the customer
// for it, so it comes straight out of the margin.
async function ukShipping(bpId, prId) {
  try {
    const s = await api(`/catalog/blueprints/${bpId}/print_providers/${prId}/shipping.json`);
    for (const profile of s.profiles || []) {
      if ((profile.countries || []).includes("GB")) return profile.first_item?.cost ?? null;
    }
    const rest = (s.profiles || []).find((p) => (p.countries || []).includes("REST_OF_THE_WORLD"));
    return rest?.first_item?.cost ?? null;
  } catch { return null; }
}

(async () => {
  if (!SHOP) {
    const shops = await api("/shops.json");
    if (!shops.length) { console.error("No shops on this Printify account"); process.exit(1); }
    SHOP = shops[0].id;
    console.log("auto-detected shop:", shops[0].title, "(id " + SHOP + ")");
  }

  const { PRODUCTS } = loadSiteData();
  const wave = PRODUCTS.filter((p) => kindOf(p.num));
  const counts = {};
  wave.forEach((p) => (counts[kindOf(p.num)] = (counts[kindOf(p.num)] || 0) + 1));
  console.log("wave 2:", wave.length, "items", JSON.stringify(counts));

  const blueprints = await api("/catalog/blueprints.json");
  const targets = {}, missing = [];
  for (const kind of Object.keys(KINDS)) {
    if (!counts[kind]) continue;
    console.log(`\nchoosing ${kind}...`);
    targets[kind] = await pickTarget(kind, blueprints);
    if (!targets[kind]) { missing.push(kind); continue; }
    const t = targets[kind];
    t.shipGB = await ukShipping(t.blueprint.id, t.provider.id);
    console.log(`  ${kind} -> ${t.blueprint.title} | ${t.provider.title} (${t.country}) | ${t.variants.map((v) => v.title).join(", ")}`);
    console.log(`  UK shipping, first item: ${t.shipGB == null ? "unknown" : gbp(t.shipGB)}`);
  }
  if (missing.length) console.log(`\nNO TARGET FOUND FOR: ${missing.join(", ")} — those items are skipped, everything else still runs.`);

  // Margin report before anything is created, so a loss-making price is visible
  // rather than discovered after 33 products exist.
  console.log("\n--- price check (base cost is read back after creation; shipping is Printify's UK first-item rate) ---");

  const existing = {};
  for (let page = 1; ; page++) {
    const res = await api(`/shops/${SHOP}/products.json?limit=50&page=${page}`);
    (res.data || []).forEach((pr) => (existing[pr.title] = pr));
    if (!res.data || res.data.length < 50) break;
  }

  // In dry-run we still build one real product per kind, because Printify only
  // reveals base cost on a created product. It is read, reported, then deleted,
  // so the shop is left exactly as it was.
  const renderer = await makeBrowserRenderer(path.join(__dirname, ".gfonts"));
  const probed = new Set();
  const logoURI = "data:image/png;base64," + fs.readFileSync(path.join(__dirname, "../../assets/frog-logic-mark-sm.png")).toString("base64");

  const results = [], errors = [], warnings = [];
  for (const p of wave) {
    const kind = kindOf(p.num);
    const t = targets[kind];
    if (!t) continue;
    const K = KINDS[kind];
    const catalogId = p.num.split("—")[0].trim() + "-" + slug(p.word);
    const title = `${p.word} — Frog Logic ${K.label}`;
    const price = pence(p.price);
    if (DRY) {
      if (probed.has(kind)) continue;
      probed.add(kind);
    }

    try {
      if (existing[title] && (existing[title].blueprint_id !== t.blueprint.id || process.env.RECREATE === "1")) {
        if (!DRY) { await api(`/shops/${SHOP}/products/${existing[title].id}.json`, "DELETE"); console.log("deleted (stale):", title); }
        delete existing[title];
      }

      let product;
      if (existing[title]) {
        product = await api(`/shops/${SHOP}/products/${existing[title].id}.json`);
        console.log("exists:", title);
      } else {
        const svg = p.svg.replace(/href="assets\/frog-logic-mark-sm\.png"/g, `href="${logoURI}"`);
        const png = await renderer.renderPng(svg, p.bg, K.px);
        const up = await api("/uploads/images.json", "POST", { file_name: catalogId + ".png", contents: Buffer.from(png).toString("base64") });
        const ids = t.variants.map((v) => v.id);
        const ph = t.variants[0].placeholders.find((x) => /front/i.test(x.position)) || t.variants[0].placeholders[0];
        // Square artwork centred in a portrait print area: scale 1 fills the
        // full chest width, which is the colour-block panel Sam picked.
        const scale = Math.min(1, ph.height / ph.width);
        product = await api(`/shops/${SHOP}/products.json`, "POST", {
          title,
          description: p.line + " — " + p.word + ", from the Frog Logic feelings collection.",
          blueprint_id: t.blueprint.id,
          print_provider_id: t.provider.id,
          variants: ids.map((id) => ({ id, price, is_enabled: true })),
          print_areas: [{ variant_ids: ids, placeholders: [{ position: ph.position, images: [{ id: up.id, x: 0.5, y: 0.5, scale, angle: 0 }] }] }],
        });
        console.log("created:", title, "->", product.id);
      }

      // Real numbers, straight from the created product.
      const enabled = (product.variants || []).filter((v) => v.is_enabled);
      const costs = enabled.map((v) => v.cost).filter((c) => typeof c === "number");
      const worst = costs.length ? Math.max(...costs) : null;
      const ship = t.shipGB ?? 0;
      const margin = worst == null ? null : price - worst - ship;
      if (margin != null && margin < 0) {
        warnings.push(`${title}: sells at ${gbp(price)}, costs ${gbp(worst)} + ${gbp(ship)} shipping = LOSS of ${gbp(-margin)} per sale`);
      } else if (margin != null && margin < 200) {
        warnings.push(`${title}: only ${gbp(margin)} left after cost and UK shipping`);
      }
      console.log(`   ${gbp(price)} - cost ${worst == null ? "?" : gbp(worst)} - ship ${gbp(ship)} = ${margin == null ? "?" : gbp(margin)}`);

      if (DRY) {
        await api(`/shops/${SHOP}/products/${product.id}.json`, "DELETE");
        console.log("   (dry run — sample deleted, shop unchanged)");
      }

      results.push({
        id: catalogId, num: p.num, word: p.word, kind,
        printifyProductId: product.id,
        printifyVariantId: enabled[0]?.id ?? t.variants[0].id,
        sizes: KINDS[kind].apparel
          ? enabled.map((v) => ({ size: parseVariant(v.title).size || v.title, variantId: v.id, cost: v.cost }))
          : undefined,
        price, worstCost: worst, ukShipping: ship,
        blueprint: t.blueprint.title, provider: t.provider.title, country: t.country,
      });
    } catch (e) {
      console.error("FAILED:", title, "-", e.message);
      errors.push({ id: catalogId, error: e.message });
    }
  }

  if (renderer) await renderer.close();
  fs.writeFileSync(
    path.join(__dirname, "printify-wave2-result.json"),
    JSON.stringify({ createdAt: new Date().toISOString(), skippedKinds: missing, results, errors, warnings }, null, 2) + "\n"
  );

  if (warnings.length) {
    console.log("\n=== MARGIN WARNINGS ===");
    warnings.forEach((w) => console.log(" ! " + w));
  }
  console.log(`\ndone: ${results.length} ok, ${errors.length} failed, ${warnings.length} margin warnings`);
  if (errors.length) process.exit(1);
})().catch((e) => { console.error(e); process.exit(1); });
