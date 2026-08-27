// What does every live product actually make, right now?
//
// Printify changes its base costs and its postage whenever it likes — it did
// both on 27 August 2026 — and a price that was fine in July can be a loss in
// September without anything on this side changing. Until now the only cost
// figures on record were whatever a build script happened to write down on the
// day it created the product, which left two problems: they go stale silently,
// and the sixteen wall prints from wave 1 never had one recorded at all.
//
// This asks Printify what each live product costs TODAY and compares it to what
// the shop charges. It is READ-ONLY: it changes no price, in the shop or in
// Printify. It only tells you where you stand.
//
//   node margin-check.js          write margin-report.json and print the table
//
// Sam's standing rule is a 60% markup over base cost, so a £10 item should sell
// for at least £16. Anything under that is flagged; anything that loses money is
// flagged louder. Postage is reported beside each item but NOT counted in the
// margin, because the customer pays it separately at checkout — it is here
// because a £3 margin on an item that costs £6 to post is a different business
// decision from a £3 margin on one that posts for 99p.
//
// For an item with sizes, the cost reported is the WORST of them. A 2XL tee
// costs more to make than a small one and they share a price, so the small
// one's cost would flatter the figure.
const fs = require("fs");
const path = require("path");

const KEY = process.env.PRINTIFY_API_KEY;
let SHOP = process.env.PRINTIFY_SHOP_ID;
if (!KEY) { console.error("Missing PRINTIFY_API_KEY"); process.exit(1); }

const MARKUP_RULE = 0.60; // Sam's standing 60% over base cost

const CATALOG = path.join(__dirname, "../../netlify/functions/catalog.json");
const OUT = path.join(__dirname, "margin-report.json");

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

const gbp = (p) => (p == null ? "     ?" : "£" + (p / 100).toFixed(2));
const pad = (s, n) => String(s).padEnd(n);
const rpad = (s, n) => String(s).padStart(n);

// The dearest variant the customer could pick for this price. If the catalogue
// lists sizes, only those count — a product can carry variants that are not on
// sale, and charging the shop for one of those would be inventing a problem.
function worstCost(product, entry) {
  const wanted = entry.sizes && entry.sizes.length
    ? new Set(entry.sizes.map((s) => s.variantId))
    : new Set([entry.printifyVariantId]);
  const costs = (product.variants || [])
    .filter((v) => wanted.has(v.id) && typeof v.cost === "number")
    .map((v) => v.cost);
  if (!costs.length) {
    // Fall back to any enabled variant rather than reporting nothing at all.
    const any = (product.variants || []).filter((v) => v.is_enabled && typeof v.cost === "number");
    if (!any.length) return null;
    return Math.max(...any.map((v) => v.cost));
  }
  return Math.max(...costs);
}

(async () => {
  if (!SHOP) {
    const shops = await api("/shops.json");
    if (!shops.length) { console.error("No shops on this Printify account"); process.exit(1); }
    SHOP = shops[0].id;
  }

  const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
  const live = catalog.filter((x) => x.type === "physical" && x.printifyProductId);
  console.log(`checking ${live.length} live physical product(s) against Printify\n`);

  const rows = [], failed = [];
  for (const entry of live) {
    try {
      const product = await api(`/shops/${SHOP}/products/${entry.printifyProductId}.json`);
      const cost = worstCost(product, entry);
      const price = Math.round(entry.price * 100);
      if (cost == null) { failed.push(`${entry.id} (no variant cost on the Printify product)`); continue; }
      rows.push({
        id: entry.id,
        name: entry.name,
        blueprint: product.blueprint_id,
        maker: entry.shipping ? entry.shipping.providerName : null,
        price,
        cost,
        keeps: price - cost,
        markup: cost > 0 ? (price - cost) / cost : null,
        postageFirst: entry.shipping ? entry.shipping.first : null,
        sizes: entry.sizes ? entry.sizes.length : 0,
      });
    } catch (e) {
      failed.push(`${entry.id} (${e.message.slice(0, 90)})`);
      console.error(`${pad(entry.id, 34)} FAILED — ${e.message.slice(0, 90)}`);
    }
  }

  rows.sort((a, b) => (a.markup ?? 9e9) - (b.markup ?? 9e9));

  const losing = rows.filter((r) => r.keeps < 0);
  const under = rows.filter((r) => r.keeps >= 0 && r.markup < MARKUP_RULE);
  const ok = rows.filter((r) => r.markup >= MARKUP_RULE);

  console.log(pad("product", 34) + rpad("price", 8) + rpad("cost", 8) + rpad("keeps", 8) + rpad("markup", 9) + rpad("postage", 9) + "  maker");
  console.log("-".repeat(104));
  for (const r of rows) {
    const flag = r.keeps < 0 ? " !! LOSS" : r.markup < MARKUP_RULE ? " !  under" : "";
    console.log(
      pad(r.id, 34) + rpad(gbp(r.price), 8) + rpad(gbp(r.cost), 8) + rpad(gbp(r.keeps), 8) +
      rpad(r.markup == null ? "?" : Math.round(r.markup * 100) + "%", 9) +
      rpad(gbp(r.postageFirst), 9) + "  " + (r.maker || "?") + flag
    );
  }

  console.log(`\n${rows.length} checked`);
  console.log(`  ${losing.length} LOSING money on every sale`);
  console.log(`  ${under.length} below the ${Math.round(MARKUP_RULE * 100)}% markup rule`);
  console.log(`  ${ok.length} at or above the rule`);
  if (failed.length) {
    console.log(`\n${failed.length} could not be checked:`);
    failed.forEach((f) => console.log("  ! " + f));
  }

  // What price would each flagged item need? Reported, never applied — pricing
  // is Sam's call and this script does not touch the shop.
  if (losing.length || under.length) {
    console.log(`\nTo reach a ${Math.round(MARKUP_RULE * 100)}% markup, these would need:`);
    for (const r of [...losing, ...under]) {
      const needed = Math.ceil((r.cost * (1 + MARKUP_RULE)) / 50) * 50; // round up to the nearest 50p
      console.log(`  ${pad(r.id, 34)} ${gbp(r.price)} -> ${gbp(needed)}`);
    }
    console.log("\nNothing above has been changed. This script only reports.");
  }

  fs.writeFileSync(
    OUT,
    JSON.stringify({ checkedAt: new Date().toISOString(), markupRule: MARKUP_RULE, rows, failed }, null, 2) + "\n"
  );
  console.log("\nwrote margin-report.json");
})().catch((e) => { console.error(e); process.exit(1); });
