// Etsy postage watch — runs inside the Monday Printify check.
//
// Why: Printify writes its postage into the Etsy delivery profiles as plain
// numbers, and the Etsy shop is in pounds, so Printify's DOLLAR rates were
// being charged as POUNDS (a third too much). On 15 Oct 2026 every Etsy
// delivery profile was converted to the right pound amounts by hand (dollars
// x 0.76, rounded up; the candle uses its 9oz rate so no order loses money).
// Printify's own setting says it will "update the profile with any changes in
// costs", which could put the dollar figures back.
//
// This script can't see Etsy (there is no Etsy API key), so it watches the two
// things that would make Printify touch a profile:
//   1. Printify's postage for any maker behind an Etsy product changes.
//   2. A new product appears in the Printify Etsy store (its fresh profile will
//      be in dollars, include the EU, and have no production partner).
// Either one becomes a note for the Desk and the Monday email. Read-only:
// nothing in Printify or Etsy is changed. Writes etsy-postage-report.json.
const fs = require("fs");
const path = require("path");

const KEY = process.env.PRINTIFY_API_KEY;
if (!KEY) { console.error("Missing PRINTIFY_API_KEY"); process.exit(1); }
const OUT = path.join(__dirname, "etsy-postage-report.json");
const PREV = process.env.POSTAGE_PREVIOUS || "/tmp/postage-previous.json";
const NOTES = "/tmp/postage-notes.json";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function api(p) {
  for (let attempt = 0; ; attempt++) {
    const r = await fetch("https://api.printify.com/v1" + p, { headers: { Authorization: "Bearer " + KEY } });
    if (r.ok) return r.json();
    if ((r.status === 429 || r.status >= 500) && attempt < 5) { await sleep(2000 * 2 ** attempt); continue; }
    throw new Error("GET " + p + " -> " + r.status + " " + (await r.text()).slice(0, 200));
  }
}

// Distinct first/additional rates (in cents) Printify charges to one country.
function ratesFor(shipping, country) {
  const seen = new Map();
  for (const prof of shipping.profiles || []) {
    if (!(prof.countries || []).includes(country)) continue;
    const r = { first: prof.first_item?.cost, additional: prof.additional_items?.cost, currency: prof.first_item?.currency };
    seen.set(JSON.stringify(r), r);
  }
  return [...seen.values()].sort((a, b) => a.first - b.first);
}

(async () => {
  const shops = await api("/shops.json");
  const etsy = shops.find((s) => /etsy/i.test(s.sales_channel || ""));
  if (!etsy) throw new Error("No Etsy store in Printify");

  const products = [];
  for (let page = 1; page <= 20; page++) {
    const r = await api(`/shops/${etsy.id}/products.json?limit=50&page=${page}`);
    const rows = r.data || [];
    products.push(...rows.map((p) => ({ id: p.id, title: p.title, bp: p.blueprint_id, pp: p.print_provider_id })));
    if (rows.length < 50) break;
  }

  const rates = {};
  for (const key of [...new Set(products.map((p) => p.bp + ":" + p.pp))]) {
    const [bp, pp] = key.split(":");
    try {
      const s = await api(`/catalog/blueprints/${bp}/print_providers/${pp}/shipping.json`);
      rates[key] = { GB: ratesFor(s, "GB"), US: ratesFor(s, "US") };
    } catch (e) {
      rates[key] = { error: e.message.slice(0, 120) };
    }
  }

  const report = { checkedAt: new Date().toISOString(), etsyStore: etsy.id, products, rates };
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + "\n");

  let prev = null;
  try { prev = JSON.parse(fs.readFileSync(PREV, "utf8")); } catch {}
  if (!prev || !prev.rates) { console.log(`Etsy postage: baseline saved (${products.length} products, ${Object.keys(rates).length} maker rates)`); return; }

  const notes = [];
  const fmt = (list) => (list || []).map((r) => "$" + (r.first / 100).toFixed(2) + "+" + (r.additional / 100).toFixed(2)).join(" / ") || "none";
  const example = (key) => (products.find((p) => p.bp + ":" + p.pp === key)?.title || key).split(/[,—]/)[0].trim();
  for (const [key, now] of Object.entries(rates)) {
    const was = prev.rates[key];
    if (!was || now.error || was.error) continue;
    for (const c of ["GB", "US"]) {
      if (JSON.stringify(was[c]) !== JSON.stringify(now[c])) {
        notes.push(`Etsy postage: Printify's ${c === "GB" ? "UK" : "US"} postage for ${example(key)} changed ${fmt(was[c])} → ${fmt(now[c])}. Printify may have put dollar figures back into the Etsy delivery profile as pounds — ask Claude to re-check Etsy postage`);
      }
    }
  }
  const before = new Set((prev.products || []).map((p) => p.id));
  const added = products.filter((p) => !before.has(p.id));
  if (added.length) {
    notes.push(`Etsy: ${added.length} new Printify product(s) (${added.map((p) => p.title.split(/[,—]/)[0].trim()).join("; ")}) — check each delivery profile is UK-only or US-only, in pounds, with the production partner attached`);
  }
  if (notes.length) fs.writeFileSync(NOTES, JSON.stringify(notes));
  console.log(notes.length ? notes.join("\n") : "Etsy postage: nothing changed");
})().catch((e) => { console.error(e); process.exit(1); });
