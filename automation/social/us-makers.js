// Can Frog Logic sell its physical range in the US?
//
// About half the shop's visitors are American, but every physical piece is
// made in the UK and costs £23–35 to post across the Atlantic, so in practice
// they can only buy downloads. This script answers, product line by product
// line, whether a US-based Printify maker can make the same thing and what it
// would cost to make and to post inside the US.
//
// It prefers the SAME blueprint the shop already uses (so the artwork sits
// exactly as it does today) and only falls back to a look-alike blueprint
// when no US maker offers the same one. Printify's catalogue does not expose
// base cost, so — exactly like sticker-makers.js — each candidate gets a
// throwaway product, its cost is read off, and it is deleted again.
//
// It NEVER touches catalog.json or any live product. Anything it fails to
// delete is listed at the end of the log and in the report.
//
//   node us-makers.js            all six lines
//   ONLY=tee,mug node us-makers.js
//   PER_KIND=3 node us-makers.js  how many makers to cost per line
const fs = require("fs");
const path = require("path");

const KEY = process.env.PRINTIFY_API_KEY;
let SHOP = process.env.PRINTIFY_SHOP_ID;
if (!KEY) { console.error("PRINTIFY_API_KEY is not set"); process.exit(1); }
const PER_KIND = Number(process.env.PER_KIND) || 4;
const ONLY = (process.env.ONLY || "").split(",").map((s) => s.trim()).filter(Boolean);

// blueprint = what the shop sells today. patterns/avoid = look-alikes to try
// only if no US maker carries the same blueprint.
const KINDS = {
  tee: { blueprint: 6, patterns: [/heavy cotton.*t-?shirt/i, /unisex.*t-?shirt/i], avoid: /long ?sleeve|hoodie|tank|crop|baby|toddler|youth|kids|v-?neck|pocket/i },
  mug: { blueprint: 535, patterns: [/^mug 11oz$/i, /ceramic mug/i, /\bmug\b/i], avoid: /travel|tumbler|enamel|colou?r[- ]changing|two-?tone|accent|latte|camp/i },
  print: { blueprint: 763, patterns: [/poster/i, /art print/i], avoid: /canvas|framed|frame\b|metal|acrylic|wood|banner|sticker|tapestry|puzzle/i },
  tote: { blueprint: 720, patterns: [/tote/i], avoid: /backpack|drawstring|duffel|weekender|pouch|cosmetic|lunch|aop|all over/i },
  notebook: { blueprint: 1193, patterns: [/spiral notebook/i, /notebook/i, /journal/i], avoid: /sticker|calendar|poster|card|planner/i },
  bottle: { blueprint: 716, patterns: [/water bottle/i, /sports bottle/i, /stainless.*bottle/i], avoid: /mug|can cooler|shot glass|wine|baby|opener|holder|carrier|tumbler/i },
};

const RETIRED = /(drukātava|drukatava|drive fulfillment|hft71|rogac|jams designs|\bc4\b)/i;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lastCall = 0;
const cache = new Map();
async function api(p, method = "GET", body) {
  for (let attempt = 0; ; attempt++) {
    const wait = lastCall + 150 - Date.now();
    if (wait > 0) await sleep(wait);
    lastCall = Date.now();
    const r = await fetch("https://api.printify.com/v1" + p, {
      method, headers: { Authorization: "Bearer " + KEY, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (r.ok) return r.status === 204 ? {} : r.json();
    if ((r.status === 429 || r.status >= 500) && attempt < 5) { await sleep(Math.min(30000, 2000 * 2 ** attempt)); continue; }
    throw new Error(method + " " + p + " -> " + r.status + " " + (await r.text()).slice(0, 200));
  }
}
const cached = (p) => { if (!cache.has(p)) cache.set(p, api(p)); return cache.get(p); };
const country = async (id) => (await cached(`/catalog/print_providers/${id}.json`)).location?.country || "?";

// US domestic postage: first item and each additional, in the shop's currency (pence).
async function usShipping(bp, pr) {
  try {
    const s = await cached(`/catalog/blueprints/${bp}/print_providers/${pr}/shipping.json`);
    const prof = (s.profiles || []).find((p) => (p.countries || []).includes("US"));
    return prof ? { first: prof.first_item?.cost ?? null, additional: prof.additional_items?.cost ?? null, currency: prof.first_item?.currency } : null;
  } catch { return null; }
}

// What the shop sells today on this line: one live product's enabled variants,
// reduced to the words that matter (size, colour) so a US maker's variants can
// be matched against them.
function liveProductFor(kind) {
  const margin = JSON.parse(fs.readFileSync(path.join(__dirname, "margin-report.json"), "utf8")).rows;
  const cat = JSON.parse(fs.readFileSync(path.join(__dirname, "../../netlify/functions/catalog.json"), "utf8"));
  const rows = margin.filter((r) => r.blueprint === KINDS[kind].blueprint);
  const items = rows.map((r) => cat.find((c) => c.id === r.id)).filter((c) => c && c.printifyProductId);
  return { count: rows.length, names: rows.map((r) => r.name), price: rows[0]?.price, ukCost: rows[0]?.cost, item: items[0] };
}

const norm = (t) => String(t).toLowerCase().replace(/[″"]/g, "in").replace(/\s+/g, " ").trim();

async function candidatesFor(kind) {
  const k = KINDS[kind];
  const out = [];
  const tryBlueprint = async (bp, same) => {
    let provs; try { provs = await cached(`/catalog/blueprints/${bp.id}/print_providers.json`); } catch { return; }
    for (const pr of provs) {
      if (RETIRED.test(pr.title)) continue;
      if ((await country(pr.id)) !== "US") continue;
      let vres; try { vres = await cached(`/catalog/blueprints/${bp.id}/print_providers/${pr.id}/variants.json`); } catch { continue; }
      const vars = (vres.variants || []).filter((v) => v.placeholders && v.placeholders.length);
      if (!vars.length) continue;
      out.push({ blueprint: bp, provider: pr, same, variants: vars, ship: await usShipping(bp.id, pr.id) });
    }
  };
  const all = await cached("/catalog/blueprints.json");
  const own = all.find((b) => b.id === k.blueprint);
  if (own) await tryBlueprint(own, true);
  if (!out.length) {
    const seen = new Set([k.blueprint]);
    for (const pat of k.patterns) for (const bp of all.filter((b) => pat.test(b.title) && !k.avoid.test(b.title)).slice(0, 8)) {
      if (seen.has(bp.id)) continue; seen.add(bp.id); await tryBlueprint(bp, false);
    }
  }
  out.sort((a, b) => (b.same - a.same) || ((a.ship?.first ?? 1e9) - (b.ship?.first ?? 1e9)));
  return out;
}

(async () => {
  if (!SHOP) SHOP = (await api("/shops.json"))[0].id;
  const image = ((await api("/uploads.json?limit=1")).data || [])[0];
  if (!image) { console.error("No uploaded image to probe with"); process.exit(1); }

  const report = { sampledAt: new Date().toISOString(), kinds: {}, undeleted: [] };
  for (const kind of Object.keys(KINDS).filter((k) => !ONLY.length || ONLY.includes(k))) {
    const live = liveProductFor(kind);
    let liveTitles = [];
    if (live.item) {
      try {
        const p = await api(`/shops/${SHOP}/products/${live.item.printifyProductId}.json`);
        liveTitles = (p.variants || []).filter((v) => v.is_enabled).map((v) => v.title);
      } catch (e) { console.log("could not read live product:", e.message.slice(0, 100)); }
    }
    console.log(`\n=== ${kind.toUpperCase()} — ${live.count} live product(s) on blueprint ${KINDS[kind].blueprint}; sizes in use: ${liveTitles.join(", ") || "?"}`);
    const cands = await candidatesFor(kind);
    console.log(`${cands.length} US maker(s) found${cands.length && !cands[0].same ? " (none on the same blueprint — look-alikes)" : ""}`);
    const rows = [];
    for (const c of cands.slice(0, PER_KIND)) {
      // match the sizes/colours in use; if the maker names them differently, cost its first few
      const want = new Set(liveTitles.map(norm));
      let vars = c.variants.filter((v) => want.has(norm(v.title)));
      if (!vars.length) vars = c.variants.filter((v) => liveTitles.some((t) => norm(v.title).includes(norm(t).split(" / ").pop())));
      if (!vars.length) vars = c.variants.slice(0, 6);
      vars = vars.slice(0, 12);
      const label = `${c.blueprint.title} | ${c.provider.title}`;
      let productId = null;
      try {
        const ph = vars[0].placeholders.find((x) => /front|default/i.test(x.position)) || vars[0].placeholders[0];
        const ids = vars.map((v) => v.id);
        const created = await api(`/shops/${SHOP}/products.json`, "POST", {
          title: "COST PROBE — delete me", description: "Temporary product created to read base costs. Safe to delete.",
          blueprint_id: c.blueprint.id, print_provider_id: c.provider.id,
          variants: ids.map((id) => ({ id, price: 9999, is_enabled: true })),
          print_areas: [{ variant_ids: ids, placeholders: [{ position: ph.position, images: [{ id: image.id, x: 0.5, y: 0.5, scale: 1, angle: 0 }] }] }],
        });
        productId = created.id;
        const costs = (created.variants || []).filter((v) => ids.includes(v.id)).map((v) => ({ id: v.id, title: (vars.find((x) => x.id === v.id) || {}).title || v.title, cost: v.cost }));
        rows.push({ blueprint: c.blueprint.title, blueprintId: c.blueprint.id, sameBlueprint: c.same, provider: c.provider.title, providerId: c.provider.id, usShipping: c.ship, costs });
        const cs = costs.map((x) => x.cost).filter((x) => x != null);
        console.log(`  ${label}: cost ${Math.min(...cs)}–${Math.max(...cs)}p, US post ${c.ship?.first}p first / ${c.ship?.additional}p more (${c.ship?.currency})`);
      } catch (e) {
        console.log(`  ${label}: FAILED — ${e.message.slice(0, 140)}`);
      } finally {
        if (productId) {
          try { await api(`/shops/${SHOP}/products/${productId}.json`, "DELETE"); }
          catch (e) { report.undeleted.push({ productId, label, error: e.message }); }
        }
      }
    }
    report.kinds[kind] = { liveCount: live.count, names: live.names, ukPrice: live.price, ukCost: live.ukCost, liveTitles, makersFound: cands.length, rows };
  }
  fs.writeFileSync(path.join(__dirname, "us-maker-report.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(report.undeleted.length ? "\n!! NOT DELETED: " + JSON.stringify(report.undeleted) : "\nAll probe products deleted.");
  console.log("wrote us-maker-report.json");
})().catch((e) => { console.error(e); process.exit(1); });
