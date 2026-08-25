// Which sticker maker should Frog Logic actually use?
//
// Ten stickers are on sale at £3.50 against a £5.46 base cost from Sticky
// Products Europe in the Netherlands, who charge £6.49 to post the first item
// to the UK. That is £1.96 lost on every sale before postage is even argued
// about. This script exists to find out whether a better maker exists, because
// the answer decides whether the stickers get repriced, repacked or pulled.
//
// The awkward part: Printify's catalogue does NOT expose base cost. Postage it
// will tell you; cost it will not, until a product actually exists on that
// blueprint and provider. So the only honest comparison is to build a throwaway
// product per candidate, read the real cost off it, and delete it again.
//
//   node sticker-makers.js          sweep, sample, report, clean up
//   LIMIT=4 node sticker-makers.js  only sample the four best-ranked
//   KEEP=1 node sticker-makers.js   leave the samples behind for inspection
//
// This script NEVER touches catalog.json or any real product. Everything it
// creates is deleted in a finally block, and anything it fails to delete is
// listed loudly at the end so it can be removed by hand.
const fs = require("fs");
const path = require("path");

const KEY = process.env.PRINTIFY_API_KEY;
let SHOP = process.env.PRINTIFY_SHOP_ID;
if (!KEY) { console.error("PRINTIFY_API_KEY is not set"); process.exit(1); }

const LIMIT = Number(process.env.LIMIT) || 10;
const KEEP = !!process.env.KEEP;

// What the shop charges today, and the two prices worth testing against.
const PRICES = [350, 450, 650];

// Same retirement list as the wave-2 script: Printify keeps announced-ending
// partnerships in the catalogue right up to their cut-off date.
const RETIRED = /(drukātava|drukatava|drive fulfillment|hft71|rogac|jams designs|\bc4\b)/i;

const EU = ["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE"];

const PATTERNS = [/kiss-?cut sticker/i, /die-?cut sticker/i, /vinyl sticker/i, /^sticker/i, /sticker sheet/i];
const AVOID = /magnet|bumper|wall decal|transfer|iron-?on|window/i;

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

async function getCached(p) {
  if (!cache.has(p)) cache.set(p, api(p));
  return cache.get(p);
}

const gbp = (p) => (p == null ? "  ?  " : "£" + (p / 100).toFixed(2));
const pad = (s, n) => String(s).slice(0, n).padEnd(n);

const providerCache = {};
async function providerCountry(id) {
  if (!providerCache[id]) providerCache[id] = (await getCached(`/catalog/print_providers/${id}.json`)).location?.country || "?";
  return providerCache[id];
}

// First-item UK postage for a blueprint/provider, in pence. This is the number
// that sinks a sticker: a £5 item posted for £6.49 is a postage business with a
// sticker attached.
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

async function sweep() {
  const blueprints = await api("/catalog/blueprints.json");
  const out = [], seen = new Set();
  for (const pat of PATTERNS) {
    for (const bp of blueprints.filter((b) => pat.test(b.title) && !AVOID.test(b.title)).slice(0, 6)) {
      if (seen.has(bp.id)) continue;
      seen.add(bp.id);
      let provs;
      try { provs = await getCached(`/catalog/blueprints/${bp.id}/print_providers.json`); } catch { continue; }
      for (const pr of provs) {
        if (RETIRED.test(pr.title)) continue;
        const country = await providerCountry(pr.id);
        if (country !== "GB" && !EU.includes(country)) continue;
        let vres;
        try { vres = await getCached(`/catalog/blueprints/${bp.id}/print_providers/${pr.id}/variants.json`); } catch { continue; }
        const vars = (vres.variants || []).filter((v) => v.placeholders && v.placeholders.length);
        if (!vars.length) continue;
        out.push({
          blueprint: bp, provider: pr, country,
          variant: vars[0], variantCount: vars.length,
          shipGB: await ukShipping(bp.id, pr.id),
        });
      }
    }
  }
  // GB first, then cheapest postage. Base cost is unknown at this stage, which
  // is exactly why the sampling step below exists — postage ranking alone is
  // what put a £5.46 sticker on the shop in the first place.
  out.sort((a, b) =>
    (a.country === "GB" ? 0 : 1) - (b.country === "GB" ? 0 : 1) ||
    (a.shipGB ?? 999999) - (b.shipGB ?? 999999));
  return out;
}

(async () => {
  if (!SHOP) {
    const shops = await api("/shops.json");
    if (!shops.length) { console.error("No shops on this Printify account"); process.exit(1); }
    SHOP = shops[0].id;
    console.log("auto-detected shop:", shops[0].title, "(id " + SHOP + ")");
  }

  // Reuse artwork already on the account rather than rendering fresh. The
  // sample is deleted either way, so what is printed on it does not matter —
  // and skipping the render keeps this workflow to a couple of minutes.
  const uploads = await api("/uploads.json?limit=1");
  const image = (uploads.data || [])[0];
  if (!image) {
    console.error("No images uploaded to this Printify account, so no sample can be built.");
    console.error("Run the Printify product setup workflow first, or upload any image in Printify.");
    process.exit(1);
  }
  console.log("sampling with existing upload:", image.file_name);

  const candidates = await sweep();
  console.log(`\n${candidates.length} usable UK/EU sticker maker(s) found. Sampling the best ${Math.min(LIMIT, candidates.length)}:\n`);

  const rows = [];
  const undeleted = [];
  for (const c of candidates.slice(0, LIMIT)) {
    const label = `${c.blueprint.title} | ${c.provider.title} (${c.country})`;
    let productId = null;
    try {
      const ph = c.variant.placeholders.find((x) => /front|default/i.test(x.position)) || c.variant.placeholders[0];
      const created = await api(`/shops/${SHOP}/products.json`, "POST", {
        title: "COST PROBE — delete me",
        description: "Temporary product created to read a base cost. Safe to delete.",
        blueprint_id: c.blueprint.id,
        print_provider_id: c.provider.id,
        variants: [{ id: c.variant.id, price: 999, is_enabled: true }],
        print_areas: [{ variant_ids: [c.variant.id], placeholders: [{ position: ph.position, images: [{ id: image.id, x: 0.5, y: 0.5, scale: 1, angle: 0 }] }] }],
      });
      productId = created.id;
      const v = (created.variants || []).find((x) => x.id === c.variant.id) || (created.variants || [])[0];
      const cost = v ? v.cost : null;
      rows.push({
        blueprint: c.blueprint.title, blueprintId: c.blueprint.id,
        provider: c.provider.title, providerId: c.provider.id,
        country: c.country, variantId: c.variant.id, variantTitle: c.variant.title,
        cost, ukShipping: c.shipGB,
        margins: Object.fromEntries(PRICES.map((p) => [p, cost == null ? null : p - cost])),
      });
      console.log(`  ${pad(label, 58)} cost ${gbp(cost)}  post ${gbp(c.shipGB)}`);
    } catch (e) {
      console.log(`  ${pad(label, 58)} FAILED — ${e.message.slice(0, 80)}`);
    } finally {
      if (productId && !KEEP) {
        try { await api(`/shops/${SHOP}/products/${productId}.json`, "DELETE"); }
        catch (e) { undeleted.push({ productId, label, error: e.message }); }
      } else if (productId) {
        undeleted.push({ productId, label, error: "KEEP was set" });
      }
    }
  }

  // Sorted by what actually matters: the money left on a £3.50 sale.
  const priced = rows.filter((r) => r.cost != null).sort((a, b) => a.cost - b.cost);
  console.log("\n" + "=".repeat(78));
  console.log("BASE COST, CHEAPEST FIRST");
  console.log("=".repeat(78));
  console.log(pad("maker", 44) + pad("cost", 9) + pad("UK post", 9) + PRICES.map((p) => pad("@" + (p / 100).toFixed(2), 8)).join(""));
  for (const r of priced) {
    console.log(
      pad(`${r.provider} (${r.country})`, 44) +
      pad(gbp(r.cost), 9) + pad(gbp(r.ukShipping), 9) +
      PRICES.map((p) => pad((r.margins[p] < 0 ? "-" : "+") + "£" + (Math.abs(r.margins[p]) / 100).toFixed(2), 8)).join("")
    );
  }

  const current = priced.find((r) => /sticky products europe/i.test(r.provider));
  const best = priced[0];
  console.log("\n" + "-".repeat(78));
  if (!best) {
    console.log("No candidate returned a base cost. Nothing can be concluded from this run.");
  } else if (current && best.providerId === current.providerId) {
    console.log(`The maker already in use (${current.provider}) is the cheapest of the ${priced.length} sampled.`);
    console.log("So repricing or repacking is the only way out, not switching maker.");
  } else {
    const saving = current ? current.cost - best.cost : null;
    console.log(`Cheapest: ${best.provider} (${best.country}) at ${gbp(best.cost)} + ${gbp(best.ukShipping)} UK postage.`);
    if (saving != null) console.log(`That is ${gbp(saving)} per sticker cheaper than the maker in use.`);
    console.log(`At £3.50 it ${best.margins[350] >= 0 ? "makes" : "still loses"} ${gbp(Math.abs(best.margins[350]))} a sale.`);
  }
  console.log("Postage is charged on top and is not in these margins.");

  if (undeleted.length) {
    console.log("\n!! SAMPLES NOT DELETED — remove these in Printify by hand:");
    undeleted.forEach((u) => console.log(`   ${u.productId}  ${u.label}  (${u.error})`));
  } else {
    console.log("\nAll sample products deleted.");
  }

  fs.writeFileSync(
    path.join(__dirname, "sticker-maker-report.json"),
    JSON.stringify({ sampledAt: new Date().toISOString(), prices: PRICES, considered: candidates.length, rows, undeleted }, null, 2) + "\n"
  );
  console.log("\nwrote sticker-maker-report.json");
})().catch((e) => { console.error(e); process.exit(1); });
