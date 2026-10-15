// Brings Printify's prices for the US Etsy listings into line with Etsy.
//
// Sam, 15 Oct 2026: Etsy ranks US listings lower when US postage is US$6 or
// more, so with Etsy's own postage tool the US postage was cut to £4.49 and the
// cut was added to each item's price ("Move it into price"):
//   US mugs    £5.55 -> £4.49 postage, price +£1.06  (£13.50 -> £14.56)
//   US prints  £6.15 -> £4.49 postage, price +£1.66  (£14.00 -> £15.66)
//   US candle  £6.99 -> £4.49 postage, price +£2.50  (£13/£20 -> £15.50/£22.50)
// Etsy holds the new prices; Printify still held the old ones, so re-sending
// a listing from Printify would have dropped the price back while the postage
// stayed low. This sets Printify to match. It only changes a variant whose
// price is exactly the old figure (or already the new one); anything else is
// reported and that product is left alone.
//
// Printify only. Nothing is published to Etsy (Etsy already has these prices).
// DRY_RUN=1 reports without changing anything. Writes us-price-sync-report.json.
const fs = require("fs");
const path = require("path");

const KEY = process.env.PRINTIFY_API_KEY;
if (!KEY) { console.error("Missing PRINTIFY_API_KEY"); process.exit(1); }
const DRY = process.env.DRY_RUN === "1";
const OUT = path.join(__dirname, "us-price-sync-report.json");

// old price -> new price, in pence, by group.
const GROUPS = {
  mug: { blueprints: [478, 479, 635, 10669], map: { 1350: 1456 } },
  print: { blueprints: [763, 804], map: { 1400: 1566 } },
  candle: { blueprints: [1488], map: { 1300: 1550, 2000: 2250 } },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function api(p, method = "GET", body) {
  for (let attempt = 0; ; attempt++) {
    const r = await fetch("https://api.printify.com/v1" + p, {
      method,
      headers: { Authorization: "Bearer " + KEY, "Content-Type": "application/json", "User-Agent": "frog-logic-bot/1.0" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (r.ok) return r.json();
    if ((r.status === 429 || r.status >= 500) && attempt < 5) { await sleep(2000 * 2 ** attempt); continue; }
    throw new Error(method + " " + p + " -> " + r.status + " " + (await r.text()).slice(0, 300));
  }
}

(async () => {
  const shops = await api("/shops.json");
  const etsy = shops.find((s) => /etsy/i.test(s.sales_channel || ""));
  if (!etsy) throw new Error("No Etsy store in Printify");

  const products = [];
  for (let page = 1; page <= 20; page++) {
    const r = await api(`/shops/${etsy.id}/products.json?limit=50&page=${page}`);
    products.push(...(r.data || []));
    if ((r.data || []).length < 50) break;
  }

  const report = { ranAt: new Date().toISOString(), dryRun: DRY, changed: [], already: [], skipped: [], errors: [] };
  for (const p of products) {
    const isUs = /ships from the us/i.test(p.title) || /personalized christmas frog candle/i.test(p.title);
    if (!isUs) continue;
    const group = Object.entries(GROUPS).find(([, g]) => g.blueprints.includes(p.blueprint_id));
    if (!group) continue; // tees and the ornament were already under US$6
    const [kind, g] = group;
    const newPrices = new Set(Object.values(g.map));
    const enabled = (p.variants || []).filter((v) => v.is_enabled);
    const odd = enabled.filter((v) => !(v.price in g.map) && !newPrices.has(v.price));
    const line = `${kind}: ${p.title.split(/[,—]/)[0].trim()}`;
    if (!enabled.length) continue;
    if (odd.length) {
      report.skipped.push({ id: p.id, title: p.title, prices: [...new Set(enabled.map((v) => v.price))] });
      console.log(`SKIP ${line} — unexpected price(s) ${[...new Set(odd.map((v) => v.price))].join(", ")}`);
      continue;
    }
    const toChange = enabled.filter((v) => v.price in g.map);
    if (!toChange.length) { report.already.push({ id: p.id, title: p.title }); console.log(`ok   ${line} — already new prices`); continue; }
    const variants = enabled.map((v) => ({ id: v.id, price: g.map[v.price] || v.price, is_enabled: true }));
    const summary = [...new Set(toChange.map((v) => `${v.price}->${g.map[v.price]}`))].join(", ");
    if (DRY) { console.log(`would ${line} — ${summary} (${toChange.length} variant(s))`); report.changed.push({ id: p.id, title: p.title, summary, dry: true }); continue; }
    try {
      await api(`/shops/${etsy.id}/products/${p.id}.json`, "PUT", { variants });
      const after = await api(`/shops/${etsy.id}/products/${p.id}.json`);
      const left = (after.variants || []).filter((v) => v.is_enabled && v.price in g.map);
      if (left.length) throw new Error(`${left.length} variant(s) still at old price after update`);
      report.changed.push({ id: p.id, title: p.title, summary });
      console.log(`done ${line} — ${summary}`);
    } catch (e) {
      report.errors.push({ id: p.id, title: p.title, error: e.message.slice(0, 200) });
      console.log(`FAIL ${line} — ${e.message.slice(0, 200)}`);
    }
    await sleep(800);
  }

  fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + "\n");
  console.log(`\n${DRY ? "DRY RUN — " : ""}changed ${report.changed.length}, already right ${report.already.length}, skipped ${report.skipped.length}, failed ${report.errors.length}`);
  if (report.errors.length) process.exit(1);
})().catch((e) => { console.error(e); process.exit(1); });
