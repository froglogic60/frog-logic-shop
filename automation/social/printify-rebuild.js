// Move a whole product line onto a different maker, keeping the artwork.
//
// Printify does not let you change a product's blueprint or print provider, so
// "move the mugs to a UK maker" really means "build them again on the new one".
// This does that for a whole line at once, reusing the images already uploaded
// to Printify rather than re-rendering anything — which keeps the renderer, the
// fonts and the browser out of it, and guarantees the artwork is identical to
// what is on sale today.
//
//   KIND=mug   DRY_RUN=1 node printify-rebuild.js    report, change nothing
//   KIND=print           node printify-rebuild.js    build or correct the line
//
// It has been used twice:
//
//   mug   — £5.76 to make in Czechia and £7.79 to post to a UK address, against
//           £5.23 and £3.79 from T Shirt and Sons in the UK. Same plain white
//           11oz mug, cheaper both ways, no price change.
//   print — sixteen 16x16 Fine Art matte prints sold at £12 and cost £12.72, so
//           every sale lost 72p. Fine Art has no square size that works at that
//           price: the smallest, 10x10, still costs £11.51. The same maker's
//           silk poster in the same 16x16 costs £6.83, so the size and the price
//           both stay and the paper changes from matte to semi-gloss. Sam's
//           call, made 27 Aug 2026 after seeing the alternatives.
//
// It does NOT delete anything. The products being replaced stay in Printify,
// unlisted and harmless, until the new ones have been looked at and approved.
// And if a product from an earlier run of this script is already there, it is
// CORRECTED in place rather than built again — so re-running never leaves
// duplicates behind.
//
// The first mug run placed the artwork at scale 1 and Sam rejected the mockups:
// "the designs dont sit right", too big, running off the edges. scale is a
// fraction of the print area's WIDTH, and a mug's print area is wide and short,
// so a square design at 1 overflows top and bottom. min(1, height/width) fits
// the square inside the area whichever way up the area is, and the real numbers
// come from Printify for whichever blueprint and variant is being targeted.
const fs = require("fs");
const path = require("path");
const { loadSiteData } = require("./lib.js");

const KEY = process.env.PRINTIFY_API_KEY;
let SHOP = process.env.PRINTIFY_SHOP_ID;
if (!KEY) { console.error("Missing PRINTIFY_API_KEY"); process.exit(1); }
const DRY = process.env.DRY_RUN === "1";

// What each line is being moved TO. expect is checked against Printify's own
// titles before anything is built, so a blueprint or provider id that has been
// reused or retired stops the run rather than quietly making the wrong thing.
const KINDS = {
  mug: {
    label: "mug",
    target: { blueprintId: 535, providerId: 6, variantId: 69010 },
    expect: { blueprint: /11oz white mug/i, provider: /t shirt and sons/i },
    match: /—\s*Mug/,
    title: (word) => `${word} — Frog Logic Mug`,
    out: "printify-mugs-result.json",
  },
  tee: {
    // Same maker as before (Shirt Monkey), same £3.49 postage, same £19 price.
    // Only the blank changes: Bella+Canvas jersey at £14.37 becomes Gildan Heavy
    // Cotton at £9.18, which takes expected profit from 16% to 43% of the price.
    // Sam picked margin over the softer Gildan Softstyle (£11.34, 32%) on
    // 27 Aug 2026. Charcoal is the nearest Gildan colour to the Asphalt in use.
    //
    // Every size costs the same £9.18 here, which is worth noticing: on the old
    // blank a 2XL cost more than an S and they shared a price, so the 2XL set
    // the margin for the whole line.
    label: "tee",
    target: {
      blueprintId: 6,
      providerId: 331,
      sizes: [
        { size: "S", id: 11874 },
        { size: "M", id: 11873 },
        { size: "L", id: 11872 },
        { size: "XL", id: 11875 },
        { size: "2XL", id: 11876 },
      ],
    },
    expect: { blueprint: /heavy cotton tee/i, provider: /shirt monkey/i },
    match: /—\s*Tee/,
    title: (word) => `${word} — Frog Logic Tee`,
    out: "printify-tees-result.json",
  },
  print: {
    label: "wall print",
    target: { blueprintId: 763, providerId: 72, variantId: 75271 },
    expect: { blueprint: /silk poster/i, provider: /print clever/i },
    match: /—\s*Wall print/,
    title: (word) => `${word} — Frog Logic Print`,
    out: "printify-prints-result.json",
  },
};

const KIND = KINDS[(process.env.KIND || "").toLowerCase()];
if (!KIND) { console.error("Set KIND to one of: " + Object.keys(KINDS).join(", ")); process.exit(1); }

const TARGET = KIND.target;
const EXPECT = KIND.expect;

// A line is either one variant (a mug, a poster) or a run of sizes (a tee). The
// rest of the script works off these two so it does not care which.
const VARIANT_IDS = TARGET.sizes ? TARGET.sizes.map((s) => s.id) : [TARGET.variantId];
const DEFAULT_VARIANT = VARIANT_IDS[0];

const OUT = path.join(__dirname, KIND.out);

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

// The artwork already on the old mug. Printify uploads are account-level, so
// the same image id can be placed on a different blueprint without re-uploading
// anything — and reusing it is the only way to be certain the new mug carries
// exactly the design the shop is selling today.
// Only the image ids are taken from the old mug. Its placement is thrown away,
// because it was worked out for a print area of a different shape.
function imageIdsFrom(product) {
  for (const area of product.print_areas || []) {
    for (const ph of area.placeholders || []) {
      if ((ph.images || []).length) return ph.images.map((im) => im.id);
    }
  }
  return null;
}

// The print area of the mug we are actually printing on, in pixels, straight
// from Printify — not a number written down here.
async function frontPlaceholder() {
  const { variants } = await api(
    `/catalog/blueprints/${TARGET.blueprintId}/print_providers/${TARGET.providerId}/variants.json`
  );
  const v = (variants || []).find((x) => x.id === DEFAULT_VARIANT);
  if (!v) throw new Error(`variant ${DEFAULT_VARIANT} is not made by provider ${TARGET.providerId} any more`);
  // Every size shares one print area on every blueprint seen so far, but check
  // rather than assume: a size the artwork would not fit is worth stopping for.
  const odd = (variants || []).filter((x) => VARIANT_IDS.includes(x.id))
    .filter((x) => {
      const q = (x.placeholders || []).find((y) => y.position === (v.placeholders || [])[0]?.position);
      return q && (q.width !== (v.placeholders || [])[0]?.width || q.height !== (v.placeholders || [])[0]?.height);
    });
  if (odd.length) throw new Error(`${odd.length} size(s) have a different print area — check before building`);
  const ph = (v.placeholders || []).find((x) => /front/i.test(x.position)) || (v.placeholders || [])[0];
  if (!ph || !ph.width || !ph.height) throw new Error("no usable print area on variant " + DEFAULT_VARIANT);
  return ph;
}

function placements(ids, ph, scale) {
  return ids.map((id) => ({ id, x: 0.5, y: 0.5, scale, angle: 0 }));
}

function body({ title, description, price, ids, ph, scale }) {
  return {
    title,
    description,
    blueprint_id: TARGET.blueprintId,
    print_provider_id: TARGET.providerId,
    variants: VARIANT_IDS.map((id) => ({ id, price, is_enabled: true })),
    print_areas: [
      { variant_ids: VARIANT_IDS, placeholders: [{ position: ph.position, images: placements(ids, ph, scale) }] },
    ],
  };
}

// Every product in the shop, so an earlier run's mug can be found and corrected
// instead of a second one being built beside it.
async function shopProducts() {
  // 50 is Printify's maximum for this endpoint; asking for 100 gets a 400
  // "Validation failed", which is exactly how the first run of this fix died.
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

  // Confirm the pinned target really is the product we think it is, rather
  // than trusting three numbers written down some other day.
  const bp = await api(`/catalog/blueprints/${TARGET.blueprintId}.json`);
  const provs = await api(`/catalog/blueprints/${TARGET.blueprintId}/print_providers.json`);
  const pr = provs.find((x) => x.id === TARGET.providerId);
  if (!pr) throw new Error(`provider ${TARGET.providerId} does not make blueprint ${TARGET.blueprintId} any more`);
  if (!EXPECT.blueprint.test(bp.title) || !EXPECT.provider.test(pr.title)) {
    throw new Error(`pinned target has changed under us: got "${bp.title}" / "${pr.title}"`);
  }
  console.log(`target: ${bp.title} | ${pr.title}`);

  // scale is a fraction of the print area's WIDTH and the artwork is square,
  // so fitting it means shrinking to the area's height whenever the area is
  // wider than it is tall — which a mug's is, and a square poster's is not.
  const ph = await frontPlaceholder();
  const scale = Math.min(1, ph.height / ph.width);
  console.log(`print area: ${ph.position} ${ph.width}x${ph.height}px -> artwork scale ${scale.toFixed(4)}`);
  if (scale === 1) {
    console.log("   (area is portrait or square, so the artwork fills the width)");
  }

  const { PRODUCTS } = loadSiteData();
  const items = PRODUCTS.filter((p) => KIND.match.test(p.num));
  if (!items.length) { console.error(`No ${KIND.label}s found in script.js`); process.exit(1); }

  // Wave 1 holds the current Printify product id for each piece, which is
  // where the existing artwork lives.
  const wave1 = new Map();
  for (const r of (require("./printify-result.json").results || require("./printify-result.json"))) {
    if (r && r.id && r.printifyProductId) wave1.set(r.id, r);
  }

  // Anything this script built before, indexed by the title it gives them, so a
  // second run corrects the same items rather than making a second set.
  const existing = new Map();
  for (const prod of await shopProducts()) {
    if (prod.blueprint_id === TARGET.blueprintId && prod.print_provider_id === TARGET.providerId) {
      existing.set(prod.title, prod);
    }
  }
  if (existing.size) console.log(`${existing.size} ${KIND.label}(s) from an earlier run will be corrected in place`);

  console.log(`\n${items.length} ${KIND.label}(s) to move:\n`);

  const results = [], errors = [];
  for (const p of items) {
    const catalogId = p.num.split("—")[0].trim() + "-" + slug(p.word);
    const title = KIND.title(p.word);
    const price = pence(p.price);
    const old = wave1.get(catalogId);
    const already = existing.get(title);

    try {
      if (!old) throw new Error("no wave-1 product recorded, so there is no artwork to reuse");
      const oldProduct = await api(`/shops/${SHOP}/products/${old.printifyProductId}.json`);
      const ids = imageIdsFrom(oldProduct);
      if (!ids) throw new Error("could not find the artwork on the existing product");

      const payload = body({
        title,
        description: oldProduct.description || `${p.word}. ${p.line}`,
        price, ids, ph, scale,
      });

      if (DRY) {
        console.log(`${title}`);
        console.log(`   would ${already ? "correct " + already.id : "create"} — ${ids.length} image(s) at scale ${scale.toFixed(4)}, ${gbp(price)}`);
        continue;
      }

      const product = already
        ? await api(`/shops/${SHOP}/products/${already.id}.json`, "PUT", payload)
        : await api(`/shops/${SHOP}/products.json`, "POST", payload);

      const enabled = (product.variants || []).filter((v) => VARIANT_IDS.includes(v.id));
      const variant = enabled.find((v) => v.id === DEFAULT_VARIANT) || enabled[0] || (product.variants || [])[0];
      // The dearest size, because they all share one price. On the old tee a 2XL
      // cost £2 more than an S, so quoting the S would have flattered the line.
      const costs = enabled.map((v) => v.cost).filter((c) => typeof c === "number");
      const cost = costs.length ? Math.max(...costs) : (variant ? variant.cost : null);
      const keep = cost == null ? null : price - cost;
      console.log(`${title}`);
      console.log(`   ${already ? "corrected" : "created"} ${product.id} — artwork at scale ${scale.toFixed(4)}`);
      console.log(`   ${gbp(price)} - cost ${gbp(cost)} = ${gbp(keep)}   (was ${gbp(old.worstCost ?? null)} before)`);

      // The whole point of this script is that somebody looks at the result, so
      // it records where to look. Printify re-renders the mockups after an
      // update, which takes a few seconds, so the photo is read back fresh
      // rather than taken from the response to the write.
      await sleep(2000);
      const fresh = await api(`/shops/${SHOP}/products/${product.id}.json`);
      const shot = (fresh.images || []).find((i) => i.is_default) || (fresh.images || [])[0];
      if (shot) console.log(`   ${shot.src}`);
      else console.log("   (no mockup rendered yet — re-run to pick it up)");

      results.push({
        id: catalogId, num: p.num, word: p.word, kind: KIND.label === "wall print" ? "print" : KIND.label,
        printifyProductId: product.id,
        printifyVariantId: variant ? variant.id : DEFAULT_VARIANT,
        ...(TARGET.sizes ? { sizes: TARGET.sizes.map((s) => {
          const v = enabled.find((x) => x.id === s.id);
          return { size: s.size, variantId: s.id, cost: v ? v.cost : null };
        }) } : {}),
        price, worstCost: cost,
        blueprint: bp.title, provider: pr.title, country: "GB",
        artworkScale: scale,
        mockup: shot ? shot.src : null,
        replaces: old.printifyProductId,
      });
    } catch (e) {
      console.error("FAILED:", title, "-", e.message);
      errors.push({ id: catalogId, error: e.message });
    }
  }

  if (DRY) {
    console.log("\nDRY_RUN — nothing was created, changed or deleted.");
    return;
  }

  fs.writeFileSync(
    OUT,
    JSON.stringify({ createdAt: new Date().toISOString(), target: TARGET, results, errors }, null, 2) + "\n"
  );
  console.log(`\ndone: ${results.length} created, ${errors.length} failed -> ${KIND.out}`);
  if (results.length) {
    console.log("\nThe products being replaced are untouched and still in Printify, and");
    console.log("the shop is still selling them. Run \"Refresh the product photos\" and look");
    console.log("at the new mockups before the shop is pointed at these.");
  }
})().catch((e) => { console.error(e); process.exit(1); });
