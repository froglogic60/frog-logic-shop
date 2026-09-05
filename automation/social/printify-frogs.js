// Build the Comfort & Chaos frog products on Printify.
//
// The seven frog designs live in script.js as PRODUCTS entries with frog: true,
// and their print files live in artwork/frogs/ — 3000x3000 PNGs exported from
// the vector originals. This uploads each PNG to Printify (by its public
// raw.githubusercontent URL, so nothing binary travels through this script) and
// builds one product per design, on the same blueprints and makers as the
// established lines, at the same prices.
//
//   DRY_RUN=1 node printify-frogs.js    report targets, scales and prices, change nothing
//             node printify-frogs.js    build or correct the seven products
//   ONLY=^h   node printify-frogs.js    only pieces whose catalogue id matches (the
//                                        Halloween range, say); other results are kept
//
// Safe to re-run: a product from an earlier run is found by its title and
// corrected in place, and an image already uploaded is reused by URL, so a
// second run leaves one set of everything.
//
// ONE DELIBERATE DIFFERENCE from the typographic tees: those print on charcoal,
// because pale type wants a dark garment. The frog designs are dark-outlined
// with warm brown text — on charcoal they would disappear — so the frog tees
// resolve WHITE variants at run time instead of reusing the pinned charcoal
// ids. The variant list comes fresh from Printify and the run stops if White
// is not offered in every size, rather than quietly printing the wrong shirt.
const fs = require("fs");
const path = require("path");
const { loadSiteData } = require("./lib.js");

const KEY = process.env.PRINTIFY_API_KEY;
let SHOP = process.env.PRINTIFY_SHOP_ID;
if (!KEY) { console.error("Missing PRINTIFY_API_KEY"); process.exit(1); }
const DRY = process.env.DRY_RUN === "1";
// Optional filter on the catalogue id (f1-comfort-creature, h3-social-battery-undead...).
// With it set, the result file is MERGED rather than replaced, so building the
// Halloween nine does not forget the seven frogs already recorded.
const ONLY = process.env.ONLY ? new RegExp(process.env.ONLY, "i") : null;

const RAW = "https://raw.githubusercontent.com/froglogic60/frog-logic-shop/main/artwork/frogs/";

// Which PNG belongs to which piece, keyed by the catalogue id (lowercase
// card number + word, the same slug catalog.json and checkout use). The file
// names predate the card numbers, so this is spelled out rather than derived.
// The frogs were renumbered 51-57 -> F1-F7 on 4 Sept 2026; the Halloween range
// (H1-H9) arrived 5 Sept 2026 and shares artwork across tee/mug, with a
// full-bleed variant for the poster.
const ARTWORK = {
  "f1-comfort-creature": "comfort-creature.png",
  "f2-brain-full-of-tabs": "brain-full-of-tabs.png",
  "f3-neurospicy": "neurospicy.png",
  "f4-low-battery": "low-battery.png",
  "f5-chaos-gremlin": "chaos-gremlin.png",
  "f6-overstimulated": "overstimulated.png",
  "f7-neurodivergent-household": "nd-household.png",
  "h1-do-not-perceive-me": "do-not-perceive-me.png",
  "h2-chaos-gremlin-halloween": "chaos-gremlin-halloween.png",
  "h3-social-battery-undead": "social-battery-undead.png",
  "h4-sensory-witch": "sensory-witch.png",
  "h5-do-not-perceive-me": "do-not-perceive-me.png",
  "h6-chaos-gremlin-halloween": "chaos-gremlin-halloween.png",
  "h7-social-battery-undead": "social-battery-undead.png",
  "h8-sensory-witch": "sensory-witch.png",
  "h9-do-not-perceive-me": "do-not-perceive-me-poster.png",
};

// Same targets as printify-rebuild.js, checked against Printify's own titles
// before anything is built. The tee entry carries sizes but NO variant ids —
// they are resolved to White at run time (see the note at the top).
const KINDS = {
  tee: {
    label: "tee",
    target: { blueprintId: 6, providerId: 331, sizeNames: ["S", "M", "L", "XL", "2XL"], colour: /^white$/i },
    expect: { blueprint: /heavy cotton tee/i, provider: /shirt monkey/i },
    match: /—\s*Tee/,
    title: (w) => `${w} — Frog Logic Tee`,
  },
  mug: {
    label: "mug",
    target: { blueprintId: 535, providerId: 6, variantId: 69010 },
    expect: { blueprint: /11oz white mug/i, provider: /t shirt and sons/i },
    match: /—\s*Mug/,
    title: (w) => `${w} — Frog Logic Mug`,
  },
  bottle: {
    label: "water bottle",
    target: { blueprintId: 716, providerId: 6, variantId: 73363 },
    expect: { blueprint: /water bottle/i, provider: /t shirt and sons/i },
    match: /—\s*Water bottle/,
    title: (w) => `${w} — Frog Logic Bottle`,
  },
  print: {
    label: "wall print",
    target: { blueprintId: 763, providerId: 72, variantId: 75271 },
    expect: { blueprint: /silk poster/i, provider: /print clever/i },
    match: /—\s*Wall print/,
    title: (w) => `${w} — Frog Logic Print`,
  },
};

const OUT = path.join(__dirname, "printify-frogs-result.json");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const GAP_MS = 150;
let lastCall = 0;

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
    if (r.ok) return r.status === 204 ? {} : r.json();
    if ((r.status === 429 || r.status >= 500) && attempt < 5) {
      const retryAfter = Number(r.headers.get("retry-after"));
      const backoff = retryAfter > 0 ? retryAfter * 1000 : Math.min(30000, 2000 * Math.pow(2, attempt));
      console.log(`   ${r.status} on ${p} — waiting ${Math.round(backoff / 1000)}s and retrying`);
      await sleep(backoff);
      continue;
    }
    throw new Error(method + " " + p + " -> " + r.status + " " + (await r.text()).slice(0, 200));
  }
}

const gbp = (p) => (p == null ? "?" : "£" + (p / 100).toFixed(2));
const pence = (p) => Math.round(parseFloat(String(p).replace(/[^0-9.]/g, "")) * 100);
const slug = (s) => s.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();

// Resolve which variants a kind prints on, and the print area that binds the
// artwork scale. For sized garments the binding area is the one with the
// smallest height-to-width ratio, so one scale is safe on every size.
async function resolveKind(kind) {
  const T = kind.target;
  const bp = await api(`/catalog/blueprints/${T.blueprintId}.json`);
  const provs = await api(`/catalog/blueprints/${T.blueprintId}/print_providers.json`);
  const pr = provs.find((x) => x.id === T.providerId);
  if (!pr) throw new Error(`provider ${T.providerId} no longer makes blueprint ${T.blueprintId}`);
  if (!kind.expect.blueprint.test(bp.title) || !kind.expect.provider.test(pr.title)) {
    throw new Error(`pinned target changed: got "${bp.title}" / "${pr.title}"`);
  }
  const { variants } = await api(
    `/catalog/blueprints/${T.blueprintId}/print_providers/${T.providerId}/variants.json`
  );

  let picked, sizes = null;
  if (T.sizeNames) {
    // Garment: find the White variant for each size, by Printify's own titles.
    sizes = T.sizeNames.map((name) => {
      const v = (variants || []).find((x) => {
        const parts = String(x.title).split("/").map((s) => s.trim());
        return parts.some((s) => kind.colour ? kind.colour.test(s) : /^white$/i.test(s))
            && parts.some((s) => s.toUpperCase() === name);
      });
      if (!v) throw new Error(`no White ${name} variant for blueprint ${T.blueprintId} provider ${T.providerId}`);
      return { size: name, id: v.id };
    });
    picked = (variants || []).filter((x) => sizes.some((s) => s.id === x.id));
  } else {
    picked = (variants || []).filter((x) => x.id === T.variantId);
    if (!picked.length) throw new Error(`variant ${T.variantId} not made by provider ${T.providerId} any more`);
  }

  const areas = picked.map((x) => {
    const q = (x.placeholders || []).find((y) => /front/i.test(y.position)) || (x.placeholders || [])[0];
    return q && q.width && q.height ? { id: x.id, ...q } : null;
  }).filter(Boolean);
  if (!areas.length) throw new Error("no usable print area for " + kind.label);
  areas.sort((a, b) => a.height / a.width - b.height / b.width);
  const ph = areas[0];
  const scale = Math.min(1, ph.height / ph.width);

  const variantIds = sizes ? sizes.map((s) => s.id) : [T.variantId];
  console.log(`${kind.label}: ${bp.title} | ${pr.title}`);
  console.log(`   print area ${ph.width}x${ph.height}px -> scale ${scale.toFixed(4)}${sizes ? " (White, " + sizes.length + " sizes)" : ""}`);
  return { bp, pr, ph, scale, variantIds, sizes, defaultVariant: variantIds[0] };
}

async function shopProducts() {
  const PER_PAGE = 50;
  const all = [];
  for (let page = 1; page <= 40; page++) {
    const r = await api(`/shops/${SHOP}/products.json?limit=${PER_PAGE}&page=${page}`);
    const rows = r.data || r;
    if (!Array.isArray(rows) || !rows.length) break;
    all.push(...rows);
    if (rows.length < PER_PAGE) break;
  }
  return all;
}

(async () => {
  if (!SHOP) {
    const shops = await api("/shops.json");
    if (!shops.length) { console.error("No shops on this Printify account"); process.exit(1); }
    SHOP = shops[0].id;
    console.log("auto-detected shop:", shops[0].title, "(id " + SHOP + ")");
  }

  const { PRODUCTS } = loadSiteData();
  const idFor = (p) => slug(p.num.split("—")[0].trim() + "-" + p.word);
  const frogs = PRODUCTS.filter((p) => p.frog && !p.retired && (!ONLY || ONLY.test(idFor(p))));
  if (!frogs.length) { console.error("No frog pieces in script.js" + (ONLY ? " matching " + ONLY : "")); process.exit(1); }
  console.log(`${frogs.length} frog piece(s) on the page${ONLY ? " (filtered by " + ONLY + ")" : ""}\n`);

  const existing = new Map();
  for (const prod of await shopProducts()) existing.set(prod.title, prod);

  const resolved = {};
  const uploads = new Map();
  const results = [], errors = [];

  for (const p of frogs) {
    const kindKey = Object.keys(KINDS).find((k) => KINDS[k].match.test(p.num));
    const kind = KINDS[kindKey];
    const catalogId = idFor(p);
    const title = kind.title(p.word);
    const price = pence(p.price);
    const art = ARTWORK[catalogId];

    try {
      if (!art) throw new Error("no artwork file mapped for " + catalogId);
      if (!resolved[kindKey]) resolved[kindKey] = await resolveKind(kind);
      const R = resolved[kindKey];

      if (DRY) {
        console.log(`${title}`);
        console.log(`   would upload ${art} and ${existing.has(title) ? "correct " + existing.get(title).id : "create"} at ${gbp(price)}, scale ${R.scale.toFixed(4)}`);
        continue;
      }

      if (!uploads.has(art)) {
        const up = await api("/uploads/images.json", "POST", { file_name: art, url: RAW + art });
        uploads.set(art, up.id);
        console.log(`uploaded ${art} (${up.width}x${up.height}) -> ${up.id}`);
      }
      const imageId = uploads.get(art);

      const payload = {
        title,
        description: `${p.word}. ${p.line}`,
        blueprint_id: kind.target.blueprintId,
        print_provider_id: kind.target.providerId,
        variants: R.variantIds.map((id) => ({ id, price, is_enabled: true })),
        print_areas: [{
          variant_ids: R.variantIds,
          placeholders: [{ position: R.ph.position, images: [{ id: imageId, x: 0.5, y: 0.5, scale: R.scale, angle: 0 }] }],
        }],
      };

      const already = existing.get(title);
      const product = already
        ? await api(`/shops/${SHOP}/products/${already.id}.json`, "PUT", payload)
        : await api(`/shops/${SHOP}/products.json`, "POST", payload);

      const enabled = (product.variants || []).filter((v) => R.variantIds.includes(v.id));
      const variant = enabled.find((v) => v.id === R.defaultVariant) || enabled[0] || (product.variants || [])[0];
      const costs = enabled.map((v) => v.cost).filter((c) => typeof c === "number");
      const cost = costs.length ? Math.max(...costs) : (variant ? variant.cost : null);
      console.log(`${title}`);
      console.log(`   ${already ? "corrected" : "created"} ${product.id} — ${gbp(price)} - cost ${gbp(cost)} = ${gbp(cost == null ? null : price - cost)}`);

      await sleep(2000);
      const fresh = await api(`/shops/${SHOP}/products/${product.id}.json`);
      const shot = (fresh.images || []).find((i) => i.is_default) || (fresh.images || [])[0];
      if (shot) console.log(`   ${shot.src}`);

      results.push({
        id: catalogId, num: p.num, word: p.word,
        kind: kind.label === "wall print" ? "print" : kind.label === "water bottle" ? "bottle" : kind.label,
        printifyProductId: product.id,
        printifyVariantId: variant ? variant.id : R.defaultVariant,
        ...(R.sizes ? { sizes: R.sizes.map((s) => {
          const v = enabled.find((x) => x.id === s.id);
          return { size: s.size, variantId: s.id, cost: v ? v.cost : null };
        }) } : {}),
        price, worstCost: cost,
        blueprint: R.bp.title, provider: R.pr.title, country: "GB",
        artworkScale: R.scale, artworkFile: art,
        mockup: shot ? shot.src : null,
      });
    } catch (e) {
      console.error("FAILED:", title, "-", e.message);
      errors.push({ id: catalogId, error: e.message });
    }
  }

  if (DRY) { console.log("\nDRY_RUN — nothing was uploaded, created or changed."); return; }

  let outResults = results;
  if (ONLY && fs.existsSync(OUT)) {
    const prev = JSON.parse(fs.readFileSync(OUT, "utf8"));
    const built = new Set(results.map((r) => r.id));
    outResults = [...(prev.results || []).filter((r) => !built.has(r.id)), ...results];
  }
  fs.writeFileSync(
    OUT,
    JSON.stringify({ createdAt: new Date().toISOString(), results: outResults, errors }, null, 2) + "\n"
  );
  console.log(`\ndone: ${results.length} built, ${errors.length} failed -> printify-frogs-result.json`);
  if (errors.length) process.exit(1);
})().catch((e) => { console.error(e); process.exit(1); });
