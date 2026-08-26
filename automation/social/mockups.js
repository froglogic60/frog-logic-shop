// Collect the real product photographs from Printify.
//
// Until now every card on the shop showed the artwork alone — a word set as a
// picture on a coloured square. That is exactly right for a download, where the
// artwork IS the thing being bought. It is a problem for a £19 tee, because the
// customer never sees a tee. Printify already renders a proper mockup for every
// product; they were simply never used.
//
// This writes mockups.json at the site root: catalogue id -> photo. The page
// loads it after rendering and adds a thumbnail to each physical card, so if
// this file is missing, stale or unreachable the shop still renders exactly as
// it does today. Nothing depends on it.
//
//   node mockups.js            fetch and write mockups.json
//   DRY_RUN=1 node mockups.js  report what it would write, change nothing
//
// The URLs point at Printify's own image CDN rather than copies committed here.
// That keeps ~10MB of photographs out of the repo and, more usefully, keeps the
// images off Netlify's bandwidth — which is metered in the same credits that
// pay for deploys. The cost is that a photo disappears if its product is ever
// deleted in Printify, so re-run this after any product rebuild.
const fs = require("fs");
const path = require("path");

const KEY = process.env.PRINTIFY_API_KEY;
let SHOP = process.env.PRINTIFY_SHOP_ID;
if (!KEY) { console.error("Missing PRINTIFY_API_KEY"); process.exit(1); }
const DRY = process.env.DRY_RUN === "1";

const CATALOG = path.join(__dirname, "../../netlify/functions/catalog.json");
const OUT = path.join(__dirname, "../../mockups.json");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const GAP_MS = 150;
let lastCall = 0;

async function api(p) {
  for (let attempt = 0; ; attempt++) {
    const wait = lastCall + GAP_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastCall = Date.now();
    const r = await fetch("https://api.printify.com/v1" + p, {
      headers: { Authorization: "Bearer " + KEY, "Content-Type": "application/json" },
    });
    if (r.ok) return r.json();
    if ((r.status === 429 || r.status >= 500) && attempt < 5) {
      const retryAfter = Number(r.headers.get("retry-after"));
      const backoff = retryAfter > 0 ? retryAfter * 1000 : Math.min(30000, 2000 * Math.pow(2, attempt));
      console.log(`   ${r.status} on ${p} — waiting ${Math.round(backoff / 1000)}s`);
      await sleep(backoff);
      continue;
    }
    throw new Error("GET " + p + " -> " + r.status + " " + (await r.text()).slice(0, 160));
  }
}

// Printify returns several angles per product. Prefer the one it marks default,
// then a front view, then simply the first — every product has at least one.
function pickImage(product) {
  const images = (product.images || []).filter((i) => i && i.src);
  if (!images.length) return null;
  return (
    images.find((i) => i.is_default) ||
    images.find((i) => /front/i.test(i.position || "")) ||
    images[0]
  );
}

(async () => {
  if (!SHOP) {
    const shops = await api("/shops.json");
    if (!shops.length) { console.error("No shops on this Printify account"); process.exit(1); }
    SHOP = shops[0].id;
    console.log("auto-detected shop:", shops[0].title);
  }

  const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
  const physical = catalog.filter((x) => x.type === "physical" && x.printifyProductId);
  console.log(`${physical.length} orderable physical product(s) to photograph\n`);

  const out = {};
  const missing = [];
  for (const item of physical) {
    try {
      const product = await api(`/shops/${SHOP}/products/${item.printifyProductId}.json`);
      const image = pickImage(product);
      if (!image) { missing.push(item.id + " (no images on the Printify product)"); continue; }
      out[item.id] = { src: image.src, alt: `${item.name} on the real product` };
      console.log(`${item.id.padEnd(34)} ok`);
    } catch (e) {
      missing.push(`${item.id} (${e.message.slice(0, 80)})`);
      console.error(`${item.id.padEnd(34)} FAILED — ${e.message.slice(0, 80)}`);
    }
  }

  console.log(`\n${Object.keys(out).length} photo(s) found, ${missing.length} missing`);
  missing.forEach((m) => console.log("  ! " + m));

  if (DRY) {
    console.log("\nDRY_RUN — mockups.json not written.");
    return;
  }

  // Sorted so the file has a stable order and a re-run produces no diff unless
  // Printify actually changed something.
  const sorted = {};
  for (const k of Object.keys(out).sort()) sorted[k] = out[k];
  fs.writeFileSync(OUT, JSON.stringify(sorted, null, 2) + "\n");
  console.log("\nwrote mockups.json");
})().catch((e) => { console.error(e); process.exit(1); });
