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

// Every size on the blueprint gets sampled, not just the first. The first run
// of this script priced one variant per maker and reported £2.69 for a maker
// the shop is already paying £5.46 to — because it had silently sampled a
// smaller sticker. Size is the whole question, so read all of them.
const MAX_VARIANTS = Number(process.env.MAX_VARIANTS) || 24;

// The same question keeps coming up for different products, so the parts that
// change live here and the rest of the script does not care which one it is.
// KIND=mug node sticker-makers.js sweeps mugs instead of stickers.
//
//   patterns / avoid  what counts as this product in Printify's catalogue
//   liveVariant       the variant the shop uses today, marked * in the report
//   prices            today's price first, then the ones worth testing
const KINDS = {
  sticker: {
    label: "sticker",
    patterns: [/kiss-?cut sticker/i, /die-?cut sticker/i, /vinyl sticker/i, /^sticker/i, /sticker sheet/i],
    avoid: /magnet|bumper|wall decal|transfer|iron-?on|window/i,
    liveVariant: 92314,
    prices: [350, 450, 650],
    report: "sticker-maker-report.json",
  },
  mug: {
    // £14 mug, £7.79 to post the first one to a UK address, because the maker
    // in use (OPT OnDemand, blueprint 441) is in the EU. The question this run
    // answers is whether a UK maker exists and what it would cost.
    label: "mug",
    // The broad \bmug\b pattern is here on purpose. The first mug run only
    // matched the specific names and came back with accent and two-tone mugs
    // and no plain white one, which is not a safe answer to "is there a UK
    // mug" — it might just have been a search that did not look widely enough.
    patterns: [/\bmug\b/i, /ceramic mug/i, /^mug/i, /coffee mug/i, /enamel mug/i, /colou?r[- ]changing mug/i],
    avoid: /travel|tumbler|bottle|flask|shot glass|can cooler|stein/i,
    maxBlueprints: 14,
    liveVariant: 62327,
    prices: [1400, 1600, 1800],
    report: "mug-maker-report.json",
  },
  print: {
    // The worst position in the shop. Sixteen wall prints sell at £12 and cost
    // £12.72 to make (Print Clever, blueprint 804), so every sale loses 72p
    // before postage — and postage is £5.29, the dearest in the shop. Nobody
    // knew, because wave 1 never recorded a cost for them; the margin check on
    // 27 Aug 2026 was the first time anyone asked.
    //
    // Repricing to clear the 60% rule would mean £20.50, nearly double. So the
    // question this run answers first is whether a cheaper maker exists, the
    // way one did for the mugs.
    label: "wall print",
    // Printify files these under several names and none of them is "wall
    // print". Matte and giclée posters are the same object by another word.
    patterns: [/poster/i, /art print/i, /giclée|giclee/i, /fine art/i, /wall art/i],
    // Canvas, framed and metal are different products at different prices, not
    // cheaper versions of this one. Excluded so the report compares like with
    // like rather than looking cheap by changing the goods.
    avoid: /canvas|framed|frame\b|metal|acrylic|wood|banner|sticker|decal|tapestry|puzzle/i,
    maxBlueprints: 16,
    liveVariant: 75303,
    prices: [1200, 1400, 1600],
    report: "print-maker-report.json",
  },
  // The four lines that fail Sam's pricing rule as at 27 Aug 2026: expected
  // profit after costs, Stripe and a refund provision comes to 20%, 18%, 16%
  // and 15% of the price against a 25% bar. Repricing to clear it would mean a
  // £21.87 tee and a £42.69 hoodie, so the cheaper-maker question gets asked
  // first — it answered the mugs and the prints without any price change.
  tee: {
    label: "tee",
    patterns: [/t-?shirt/i, /tee\b/i, /unisex.*shirt/i, /jersey.*shirt/i],
    avoid: /long ?sleeve|hoodie|sweatshirt|tank|crop|polo|baby|toddler|youth|kids|vest|raglan|3\/4/i,
    maxBlueprints: 18,
    liveVariant: 18388,
    prices: [1900, 2200, 2500],
    report: "tee-maker-report.json",
  },
  hoodie: {
    label: "hoodie",
    patterns: [/hoodie/i, /hooded sweatshirt/i, /pullover hood/i],
    avoid: /zip|zipper|crop|baby|toddler|youth|kids|sleeveless|lightweight tee/i,
    maxBlueprints: 16,
    liveVariant: 32870,
    prices: [3699, 4000, 4500],
    report: "hoodie-maker-report.json",
  },
  tote: {
    label: "tote",
    patterns: [/tote/i, /shopping bag/i, /canvas bag/i],
    avoid: /backpack|drawstring|duffel|weekender|pouch|cosmetic|lunch/i,
    maxBlueprints: 14,
    liveVariant: 73419,
    prices: [1600, 1800, 2000],
    report: "tote-maker-report.json",
  },
  notebook: {
    label: "notebook",
    patterns: [/notebook/i, /journal/i, /spiral/i, /wirebound|wiro/i],
    avoid: /sticker|planner refill|calendar|poster|card/i,
    maxBlueprints: 14,
    liveVariant: 91848,
    prices: [1200, 1400, 1600],
    report: "notebook-maker-report.json",
  },
  // Not a product Frog Logic sells — Sam asked on 27 Aug 2026 whether Printify
  // does water bottles at all. liveVariant is 0 because there is nothing live
  // to compare against; the report simply lists what exists and what it costs.
  bottle: {
    label: "water bottle",
    patterns: [/water bottle/i, /sports bottle/i, /\bbottle\b/i, /tumbler/i, /flask/i],
    avoid: /mug|can cooler|shot glass|wine|baby|opener|holder|carrier/i,
    maxBlueprints: 16,
    liveVariant: 0,
    prices: [1800, 2200, 2600],
    report: "bottle-maker-report.json",
  },
};

const KIND = KINDS[(process.env.KIND || "sticker").toLowerCase()];
if (!KIND) { console.error("Unknown KIND — use one of: " + Object.keys(KINDS).join(", ")); process.exit(1); }

const LIVE_VARIANT = KIND.liveVariant;
const PRICES = KIND.prices;
const PATTERNS = KIND.patterns;
const AVOID = KIND.avoid;

// Same retirement list as the wave-2 script: Printify keeps announced-ending
// partnerships in the catalogue right up to their cut-off date.
const RETIRED = /(drukātava|drukatava|drive fulfillment|hft71|rogac|jams designs|\bc4\b)/i;

const EU = ["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE"];

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
    for (const bp of blueprints.filter((b) => pat.test(b.title) && !AVOID.test(b.title)).slice(0, KIND.maxBlueprints || 6)) {
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
          variants: vars.slice(0, MAX_VARIANTS), variantCount: vars.length,
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
  console.log(`\n${candidates.length} usable UK/EU ${KIND.label} maker(s) found. Sampling the best ${Math.min(LIMIT, candidates.length)}:\n`);

  const rows = [];
  const undeleted = [];
  for (const c of candidates.slice(0, LIMIT)) {
    const label = `${c.blueprint.title} | ${c.provider.title} (${c.country})`;
    console.log(`\n${label} — ${c.variants.length} of ${c.variantCount} size(s)`);
    let productId = null;
    try {
      const first = c.variants[0];
      const ph = first.placeholders.find((x) => /front|default/i.test(x.position)) || first.placeholders[0];
      const ids = c.variants.map((v) => v.id);
      const created = await api(`/shops/${SHOP}/products.json`, "POST", {
        title: "COST PROBE — delete me",
        description: "Temporary product created to read base costs. Safe to delete.",
        blueprint_id: c.blueprint.id,
        print_provider_id: c.provider.id,
        variants: ids.map((id) => ({ id, price: 999, is_enabled: true })),
        print_areas: [{ variant_ids: ids, placeholders: [{ position: ph.position, images: [{ id: image.id, x: 0.5, y: 0.5, scale: 1, angle: 0 }] }] }],
      });
      productId = created.id;
      for (const v of created.variants || []) {
        const src = c.variants.find((x) => x.id === v.id);
        rows.push({
          blueprint: c.blueprint.title, blueprintId: c.blueprint.id,
          provider: c.provider.title, providerId: c.provider.id,
          country: c.country, variantId: v.id, variantTitle: (src && src.title) || v.title || String(v.id),
          live: v.id === LIVE_VARIANT,
          cost: v.cost, ukShipping: c.shipGB,
          margins: Object.fromEntries(PRICES.map((p) => [p, v.cost == null ? null : p - v.cost])),
        });
        console.log(`  ${v.id === LIVE_VARIANT ? "*" : " "} ${pad((src && src.title) || v.id, 40)} cost ${gbp(v.cost)}`);
      }
    } catch (e) {
      console.log(`  FAILED — ${e.message.slice(0, 120)}`);
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
  console.log(pad("maker / size", 46) + pad("cost", 9) + pad("UK post", 9) + PRICES.map((p) => pad("@" + (p / 100).toFixed(2), 8)).join(""));
  for (const r of priced) {
    console.log(
      (r.live ? "* " : "  ") +
      pad(`${r.provider} (${r.country}) — ${r.variantTitle}`, 44) +
      pad(gbp(r.cost), 9) + pad(gbp(r.ukShipping), 9) +
      PRICES.map((p) => pad((r.margins[p] < 0 ? "-" : "+") + "£" + (Math.abs(r.margins[p]) / 100).toFixed(2), 8)).join("")
    );
  }
  console.log(`\n* = the ${KIND.label} variant the shop uses today.`);

  const current = priced.find((r) => r.live);
  const best = priced[0];
  console.log("\n" + "-".repeat(78));
  if (!best) {
    console.log("No candidate returned a base cost. Nothing can be concluded from this run.");
  } else if (current && best.variantId === current.variantId) {
    console.log(`The size already in use (${current.provider} — ${current.variantTitle}) is the cheapest of the ${priced.length} sampled.`);
    console.log("So repricing or repacking is the only way out, not switching size or maker.");
  } else {
    console.log(`Cheapest: ${best.provider} (${best.country}) — ${best.variantTitle}`);
    console.log(`  ${gbp(best.cost)} base + ${gbp(best.ukShipping)} UK postage.`);
    if (current) {
      console.log(`In use today: ${current.provider} — ${current.variantTitle} at ${gbp(current.cost)}.`);
      console.log(`Switching would save ${gbp(current.cost - best.cost)} a ${KIND.label} — but it is a different variant,`);
      console.log("so this is a product decision, not just a cheaper supplier.");
    }
    const p0 = PRICES[0];
    console.log(`At £${(p0/100).toFixed(2)} the cheapest ${best.margins[p0] >= 0 ? "makes" : "still loses"} ${gbp(Math.abs(best.margins[p0]))} a sale.`);
  }
  const gbOnly = priced.filter((r) => r.country === "GB");
  console.log(gbOnly.length
    ? `${gbOnly.length} UK-based option(s) in this sample.`
    : `No UK-based ${KIND.label} maker appeared in the catalogue at all — every option posts from the EU.`);
  console.log("Postage is charged on top and is not in these margins.");

  if (undeleted.length) {
    console.log("\n!! SAMPLES NOT DELETED — remove these in Printify by hand:");
    undeleted.forEach((u) => console.log(`   ${u.productId}  ${u.label}  (${u.error})`));
  } else {
    console.log("\nAll sample products deleted.");
  }

  fs.writeFileSync(
    path.join(__dirname, KIND.report),
    JSON.stringify({ sampledAt: new Date().toISOString(), prices: PRICES, considered: candidates.length, rows, undeleted }, null, 2) + "\n"
  );
  console.log("\nwrote " + KIND.report);
})().catch((e) => { console.error(e); process.exit(1); });
