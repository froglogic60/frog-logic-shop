// What would a sale leave Sam on each Etsy listing? (Sam, 15 Oct 2026: "yes
// check the 10% sale".) Read-only: changes nothing in Printify or Etsy.
//
// For every product in the Printify Etsy store it reads, straight from
// Printify, the price of each enabled variant, what each costs to make, and
// what the maker charges to post one to the listing's country. Printify gives
// costs and postage in US cents (its product page labels them USD, checked 15
// Oct 2026: a UK mug shows "Production cost USD 5.34"), so they are converted
// to pence here. Prices are the number Etsy shows in pounds.
//
// Writes sale-check-report.json with, per listing, the cheapest and dearest
// variant at full price and at each discount in DISCOUNTS. The maths is done
// in sale-check-report.json's "rows"; see keep() for the formula.
const fs = require("fs");
const path = require("path");

const KEY = process.env.PRINTIFY_API_KEY;
if (!KEY) { console.error("Missing PRINTIFY_API_KEY"); process.exit(1); }
const OUT = path.join(__dirname, "sale-check-report.json");
const DISCOUNTS = (process.env.DISCOUNTS || "10").split(",").map(Number);

// Printify's own rate was 0.757 (15 Oct 2026). 0.78 allows ~3% for a card's
// foreign-exchange fee, so the answer errs on the side of keeping less.
const USD_TO_GBP = 0.78;
// Etsy UK fees with 20% VAT: 6.5% transaction + 4% + 20p processing + 0.32%
// regulatory, on item + postage; plus the 15p listing renewal per sale (+3p
// VAT). Same figures as printify-etsy.js.
const FEE_RATE = 1.2 * (0.065 + 0.04 + 0.0032);
const FEE_FIXED = 1.2 * 20 + 18;
const RETURNS = { tee: 0.05, mug: 0.02, print: 0.02, other: 0.02 };
const MIN_KEEP = 0.25;

// What the buyer pays Etsy for postage, first item, in pence (set by hand
// 15 Oct 2026; US cut to £4.49 later that day). Keyed by blueprint.
const ETSY_POSTAGE = {
  GB: { 6: 273, 535: 296, 763: 395, 804: 395, 813: 235, 479: 296, 635: 296, 1125: 296 },
  US: { 6: 377, 478: 449, 479: 449, 635: 449, 763: 449, 804: 449, 531: 448, 1488: 449 },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function api(p) {
  for (let attempt = 0; ; attempt++) {
    const r = await fetch("https://api.printify.com/v1" + p, { headers: { Authorization: "Bearer " + KEY, "User-Agent": "frog-logic-bot/1.0" } });
    if (r.ok) return r.json();
    if ((r.status === 429 || r.status >= 500) && attempt < 5) { await sleep(2000 * 2 ** attempt); continue; }
    throw new Error("GET " + p + " -> " + r.status + " " + (await r.text()).slice(0, 200));
  }
}

function kindOf(t) {
  if (/t-shirt|tee/i.test(t)) return "tee";
  if (/mug/i.test(t)) return "mug";
  if (/wall print|poster/i.test(t)) return "print";
  return "other";
}

// What Sam keeps from a one-item order, in pence.
function keep(price, postage, makeCostP, shipCostP, kind) {
  const fees = FEE_RATE * (price + postage) + FEE_FIXED;
  return price + postage - fees - makeCostP - shipCostP - RETURNS[kind] * price;
}

(async () => {
  const shops = await api("/shops.json");
  const etsy = shops.find((s) => /etsy/i.test(s.sales_channel || ""));
  const list = [];
  for (let page = 1; page <= 20; page++) {
    const r = await api(`/shops/${etsy.id}/products.json?limit=50&page=${page}`);
    list.push(...(r.data || []));
    if ((r.data || []).length < 50) break;
  }
  const shipCache = {};
  async function ship(bp, pp, country) {
    const k = `${bp}:${pp}`;
    if (!(k in shipCache)) {
      try { shipCache[k] = await api(`/catalog/blueprints/${bp}/print_providers/${pp}/shipping.json`); } catch (e) { shipCache[k] = { error: e.message }; }
    }
    const s = shipCache[k];
    const costs = (s.profiles || []).filter((p) => (p.countries || []).includes(country)).map((p) => p.first_item?.cost).filter((c) => typeof c === "number");
    return costs.length ? Math.max(...costs) : null;
  }

  const rows = [];
  for (const p of list) {
    const full = await api(`/shops/${etsy.id}/products/${p.id}.json`);
    const country = /ships from the us|personalized|personalize\b/i.test(full.title) && !/personalised/i.test(full.title) ? "US" : "GB";
    const kind = kindOf(full.title);
    const shipC = await ship(full.blueprint_id, full.print_provider_id, country);
    const postage = ETSY_POSTAGE[country][full.blueprint_id];
    const vars = (full.variants || []).filter((v) => v.is_enabled && typeof v.cost === "number");
    if (!vars.length) continue;
    const variants = vars.map((v) => {
      const make = Math.round(v.cost * USD_TO_GBP);
      const shipP = shipC == null ? null : Math.round(shipC * USD_TO_GBP);
      const out = { price: v.price, makeCostUsdCents: v.cost, makeCostP: make, shipCostP: shipP };
      for (const d of [0, ...DISCOUNTS]) {
        const sale = Math.round(v.price * (1 - d / 100));
        const k = postage == null || shipP == null ? null : Math.round(keep(sale, postage, make, shipP, kind));
        out["off" + d] = { sale, keep: k, share: k == null ? null : +(k / sale).toFixed(3) };
      }
      return out;
    });
    // Worst variant = the one that keeps the smallest share.
    const worst = variants.reduce((a, b) => ((a.off0.share ?? 9) <= (b.off0.share ?? 9) ? a : b));
    rows.push({ title: full.title, id: full.id, etsyId: full.external?.id || null, country, kind, blueprint: full.blueprint_id, provider: full.print_provider_id, postageP: postage ?? null, shipCostUsdCents: shipC, prices: [...new Set(vars.map((v) => v.price))], worst, variants: variants.length > 6 ? undefined : variants });
    await sleep(300);
  }
  fs.writeFileSync(OUT, JSON.stringify({ checkedAt: new Date().toISOString(), usdToGbp: USD_TO_GBP, discounts: DISCOUNTS, rule: MIN_KEEP, rows }, null, 2) + "\n");
  for (const r of rows) {
    const w = r.worst;
    const cells = [0, ...DISCOUNTS].map((d) => `${d}% off: £${(w["off" + d].sale / 100).toFixed(2)} keeps ${w["off" + d].keep == null ? "?" : "£" + (w["off" + d].keep / 100).toFixed(2)} (${w["off" + d].share == null ? "?" : Math.round(w["off" + d].share * 100) + "%"})`);
    console.log(`${r.country} ${r.kind.padEnd(5)} ${r.title.split(/[,—]/)[0].trim().slice(0, 40).padEnd(40)} ${cells.join(" | ")}`);
  }
})().catch((e) => { console.error(e); process.exit(1); });
