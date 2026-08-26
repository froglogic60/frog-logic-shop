// Move the eight mugs from the EU maker to the UK one.
//
// The mugs were built in wave 1 on "Ceramic Mug (EU)" by OPT OnDemand in
// Czechia. That costs £5.76 to make and £7.79 to post the first one to a UK
// address, so a £14 mug reaches a British doorstep at £21.79 and may pick up a
// customs charge on the way.
//
// The maker sweep on 26 Aug 2026 found "11oz White Mug" from T Shirt and Sons
// in the UK at £5.23 with £3.79 postage — cheaper to make AND four pounds
// cheaper to post, for the same plain white 11oz mug. T Shirt and Sons already
// make the seven totes, so a mug and a tote now travel as one parcel.
//
// This script does one job and pins its target rather than ranking makers,
// because the ranking has already been done and written down.
//
//   DRY_RUN=1 node printify-mugs.js   build ONE sample, read its real cost,
//                                     delete it, report. Shop unchanged.
//   node printify-mugs.js             create all eight, write the result file
//
// It does NOT re-render artwork. Every mug's design is already uploaded to
// Printify from wave 1, and uploads belong to the account rather than to a
// product, so the new mugs reuse the very same image. That keeps this script
// free of the renderer, the fonts and the browser, and guarantees the artwork
// is identical to what is on sale today.
//
// It does NOT delete the old EU mugs either. They stay in Printify, unlisted
// and harmless, until the new ones have been looked at and approved.
const fs = require("fs");
const path = require("path");
const { loadSiteData } = require("./lib.js");

const KEY = process.env.PRINTIFY_API_KEY;
let SHOP = process.env.PRINTIFY_SHOP_ID;
if (!KEY) { console.error("Missing PRINTIFY_API_KEY"); process.exit(1); }
const DRY = process.env.DRY_RUN === "1";

// The answer from the maker sweep, pinned. blueprint 535 / provider 6 is
// "11oz White Mug" by T Shirt and Sons; 69010 is its only variant, the 11oz.
const TARGET = { blueprintId: 535, providerId: 6, variantId: 69010 };
const EXPECT = { blueprint: /11oz white mug/i, provider: /t shirt and sons/i };

const OUT = path.join(__dirname, "printify-mugs-result.json");

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
function imagesFrom(product) {
  for (const area of product.print_areas || []) {
    for (const ph of area.placeholders || []) {
      if ((ph.images || []).length) return ph.images.map((im) => ({ id: im.id, x: 0.5, y: 0.5, scale: 1, angle: 0 }));
    }
  }
  return null;
}

async function createMug({ title, description, price, images }) {
  return api(`/shops/${SHOP}/products.json`, "POST", {
    title,
    description,
    blueprint_id: TARGET.blueprintId,
    print_provider_id: TARGET.providerId,
    variants: [{ id: TARGET.variantId, price, is_enabled: true }],
    print_areas: [{ variant_ids: [TARGET.variantId], placeholders: [{ position: "front", images }] }],
  });
}

(async () => {
  if (!SHOP) {
    const shops = await api("/shops.json");
    if (!shops.length) { console.error("No shops on this Printify account"); process.exit(1); }
    SHOP = shops[0].id;
    console.log("auto-detected shop:", shops[0].title, "(id " + SHOP + ")");
  }

  // Confirm the pinned target really is the mug we think it is, rather than
  // trusting two numbers written down yesterday.
  const bp = await api(`/catalog/blueprints/${TARGET.blueprintId}.json`);
  const provs = await api(`/catalog/blueprints/${TARGET.blueprintId}/print_providers.json`);
  const pr = provs.find((x) => x.id === TARGET.providerId);
  if (!pr) throw new Error(`provider ${TARGET.providerId} does not make blueprint ${TARGET.blueprintId} any more`);
  if (!EXPECT.blueprint.test(bp.title) || !EXPECT.provider.test(pr.title)) {
    throw new Error(`pinned target has changed under us: got "${bp.title}" / "${pr.title}"`);
  }
  console.log(`target: ${bp.title} | ${pr.title}`);

  const { PRODUCTS } = loadSiteData();
  const mugs = PRODUCTS.filter((p) => /—\s*Mug/.test(p.num));
  if (!mugs.length) { console.error("No mugs found in script.js"); process.exit(1); }

  // Wave 1 holds the current Printify product id for each mug, which is where
  // the existing artwork lives.
  const wave1 = new Map();
  for (const r of (require("./printify-result.json").results || require("./printify-result.json"))) {
    if (r && r.id && r.printifyProductId) wave1.set(r.id, r);
  }

  console.log(`\n${mugs.length} mug(s) to move:\n`);

  const results = [], errors = [];
  for (const p of mugs) {
    const catalogId = p.num.split("—")[0].trim() + "-" + slug(p.word);
    const title = `${p.word} — Frog Logic Mug`;
    const price = pence(p.price);
    const old = wave1.get(catalogId);

    try {
      if (!old) throw new Error("no wave-1 product recorded, so there is no artwork to reuse");
      const oldProduct = await api(`/shops/${SHOP}/products/${old.printifyProductId}.json`);
      const images = imagesFrom(oldProduct);
      if (!images) throw new Error("could not find the artwork on the existing mug");

      const created = await createMug({
        title,
        description: oldProduct.description || `${p.word}. ${p.line}`,
        price,
        images,
      });

      const variant = (created.variants || []).find((v) => v.is_enabled) || (created.variants || [])[0];
      const cost = variant ? variant.cost : null;
      const keep = cost == null ? null : price - cost;
      console.log(`${title}`);
      console.log(`   ${gbp(price)} - cost ${gbp(cost)} = ${gbp(keep)}   (was ${gbp(old.worstCost ?? null)} on the EU mug)`);

      if (DRY) {
        await api(`/shops/${SHOP}/products/${created.id}.json`, "DELETE");
        console.log("   sample deleted — DRY_RUN, nothing kept");
        console.log("\nDRY_RUN: stopping after one sample. Re-run without DRY_RUN to build all of them.");
        return;
      }

      results.push({
        id: catalogId, num: p.num, word: p.word, kind: "mug",
        printifyProductId: created.id,
        printifyVariantId: variant ? variant.id : TARGET.variantId,
        price, worstCost: cost,
        blueprint: bp.title, provider: pr.title, country: "GB",
        replaces: old.printifyProductId,
      });
    } catch (e) {
      console.error("FAILED:", title, "-", e.message);
      errors.push({ id: catalogId, error: e.message });
    }
  }

  fs.writeFileSync(
    OUT,
    JSON.stringify({ createdAt: new Date().toISOString(), target: TARGET, results, errors }, null, 2) + "\n"
  );
  console.log(`\ndone: ${results.length} created, ${errors.length} failed -> printify-mugs-result.json`);
  if (results.length) {
    console.log("\nThe old EU mugs are untouched and still in Printify. Look at the new");
    console.log("mockups before the shop is pointed at them — the print area on a");
    console.log("different mug is not the same shape, so the artwork may sit differently.");
  }
})().catch((e) => { console.error(e); process.exit(1); });
