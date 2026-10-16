// What every product really keeps, with the VAT Printify adds (Sam, 16 Oct
// 2026: "yes then check them all please").
//
// The test order on 16 Oct 2026 showed Printify adding 20% VAT on top of the
// making and postage cost of a UK order (Overstimulated tee: $9.36 + $3.59
// postage + $2.58 VAT). None of the earlier margin checks (sale-check.js,
// xmas-bundle.js, margin-check.js) counted it. This one does, for:
//
//   - every product in the Printify Etsy store (per variant, like sale-check.js)
//   - every physical product on the website (catalog.json, UK and US versions)
//   - the website's Christmas sets (bundles.json)
//
// READ-ONLY. Changes no price anywhere. Writes margin-vat-report.json and
// prints, for each item under Sam's rule (keep >= 25% of the price, also at
// 10% off where a 10% offer applies), the lowest price that would clear it.
//
// Assumptions, so the numbers can be checked:
//   - Printify bills in US dollars; converted at 0.78 (Printify's own rate was
//     0.757, the rest allows for the card's FX fee).
//   - VAT: 20% on making + postage for orders posted to the UK (seen on real
//     orders). US orders: NONE assumed — not yet seen on a real US order; set
//     US_TAX=0.08 to see the effect of a sales-tax charge.
//   - Etsy fees: 6.5% + 4% + 20p processing + 0.32% regulatory, plus VAT on
//     those, plus 15p listing renewal (+3p VAT), on item + postage.
//   - Website card fees: 1.5% + 20p UK (seen on the test order: 49p on £19);
//     US cards 3.25% + 20p, plus 2% in case of currency conversion.
//   - Returns allowance: 5% of price on garments, 2% on everything else.
const fs = require("fs");
const path = require("path");

const KEY = process.env.PRINTIFY_API_KEY;
const SITE_SHOP = process.env.PRINTIFY_SHOP_ID;
if (!KEY) { console.error("Missing PRINTIFY_API_KEY"); process.exit(1); }
const OUT = path.join(__dirname, "margin-vat-report.json");
const FX = 0.78;
const VAT = { GB: 0.2, US: Number(process.env.US_TAX || 0) };
const RULE = 0.25;
const ETSY_RATE = 1.2 * (0.065 + 0.04 + 0.0032), ETSY_FIXED = 1.2 * 20 + 18;
const CARD = { GB: { rate: 0.015, fixed: 20 }, US: { rate: 0.0525, fixed: 20 } };
const GARMENT = /t-shirt|tee|hoodie|sweatshirt|jumper|shirt/i;

// What the Etsy buyer pays for postage, first item, pence (set by hand on Etsy;
// see sale-check.js). Socially Hibernating profiles set 16 Oct 2026.
const ETSY_POSTAGE = {
  GB: { 6: 273, 535: 296, 763: 395, 804: 395, 813: 235, 479: 296, 635: 296, 1125: 296, 77: 469, 1328: 494 },
  US: { 6: 377, 478: 449, 479: 449, 635: 449, 763: 449, 804: 449, 531: 448, 1488: 449, 77: 449, 1691: 449 },
};
const etsyPostage = (title, country, bp) =>
  (/socially hibernating/i.test(title) && country === "US" && bp === 6) ? 449 : ETSY_POSTAGE[country][bp];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function api(p) {
  for (let attempt = 0; ; attempt++) {
    const r = await fetch("https://api.printify.com/v1" + p, { headers: { Authorization: "Bearer " + KEY, "User-Agent": "frog-logic-bot/1.0" } });
    if (r.ok) return r.json();
    if ((r.status === 429 || r.status >= 500) && attempt < 5) { await sleep(2000 * 2 ** attempt); continue; }
    throw new Error("GET " + p + " -> " + r.status + " " + (await r.text()).slice(0, 200));
  }
}
const shipCache = {};
async function printifyPostage(bp, pp, country, variantId) {
  const k = `${bp}:${pp}`;
  if (!(k in shipCache)) {
    try { shipCache[k] = await api(`/catalog/blueprints/${bp}/print_providers/${pp}/shipping.json`); } catch (e) { shipCache[k] = { profiles: [] }; }
  }
  const hits = (shipCache[k].profiles || []).filter((p) => (p.countries || []).includes(country) && (!variantId || (p.variant_ids || []).includes(variantId)));
  const c = hits.map((p) => p.first_item?.cost).filter((x) => typeof x === "number");
  return c.length ? Math.min(...c) : null; // US cents
}

// Pence kept from one order of one item.
function keepEtsy(price, post, costP, returns) {
  return price + post - ETSY_RATE * (price + post) - ETSY_FIXED - costP - returns * price;
}
function keepSite(price, post, costP, returns, country) {
  const c = CARD[country];
  return price + post - c.rate * (price + post) - c.fixed - costP - returns * price;
}
// Lowest price (pence, rounded up to 10p) where keep >= RULE * charged price.
function priceForRule(fn, post, costP, returns, discount) {
  for (let p = 100; p < 50000; p += 10) {
    const sale = p * (1 - discount);
    if (fn(sale, post, costP, returns) >= RULE * sale) return p;
  }
  return null;
}
const pct = (k, p) => (k == null ? null : Math.round((k / p) * 1000) / 10);

(async () => {
  const shops = await api("/shops.json");
  const etsy = shops.find((s) => /etsy/i.test(s.sales_channel || ""));
  const site = SITE_SHOP ? shops.find((s) => String(s.id) === String(SITE_SHOP)) : shops.find((s) => s.id !== etsy.id);
  const rows = [];

  // ---- Etsy ----
  const list = [];
  for (let page = 1; page <= 20; page++) {
    const r = await api(`/shops/${etsy.id}/products.json?limit=50&page=${page}`);
    list.push(...(r.data || [])); if ((r.data || []).length < 50) break;
  }
  for (const p of list) {
    const full = await api(`/shops/${etsy.id}/products/${p.id}.json`);
    if (!full.external?.id) continue; // not on Etsy
    const country = /ships from the us|personalized|personalize\b/i.test(full.title) && !/personalised/i.test(full.title) ? "US" : "GB";
    const returns = GARMENT.test(full.title) ? 0.05 : 0.02;
    const post = etsyPostage(full.title, country, full.blueprint_id);
    let worst = null;
    for (const v of (full.variants || []).filter((x) => x.is_enabled && typeof x.cost === "number")) {
      const ship = await printifyPostage(full.blueprint_id, full.print_provider_id, country, v.id);
      if (ship == null || post == null) { worst = worst || { title: v.title, price: v.price, unknown: post == null ? "Etsy postage" : "Printify postage" }; continue; }
      const cost = Math.round((v.cost + ship) * FX * (1 + VAT[country]));
      const costNoVat = Math.round((v.cost + ship) * FX);
      const k = keepEtsy(v.price, post, cost, returns);
      const k0 = keepEtsy(v.price, post, costNoVat, returns);
      const k10 = keepEtsy(Math.round(v.price * 0.9), post, cost, returns);
      const row = { title: v.title, price: v.price, post, costP: cost, keep: Math.round(k), share: pct(k, v.price), shareNoVat: pct(k0, v.price), share10: pct(k10, v.price * 0.9),
        need: priceForRule(keepEtsy, post, cost, returns, 0), need10: priceForRule(keepEtsy, post, cost, returns, 0.1) };
      if (!worst || worst.unknown || (row.share < worst.share)) worst = row;
    }
    rows.push({ where: "Etsy", country, name: full.title.split(" — ")[0].split(" | ")[0].slice(0, 70), id: full.external.id, ...worst });
    await sleep(250);
  }

  // ---- Website ----
  const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, "../../netlify/functions/catalog.json"), "utf8"));
  const bundles = JSON.parse(fs.readFileSync(path.join(__dirname, "../../netlify/functions/bundles.json"), "utf8"));
  const prodCache = {};
  const prod = async (id) => (prodCache[id] = prodCache[id] || await api(`/shops/${site.id}/products/${id}.json`));
  for (const item of catalog.filter((x) => x.type === "physical" && x.printifyProductId)) {
    for (const country of ["GB", "US"]) {
      const v = country === "US" ? (item.us ? { ...item, ...item.us } : null) : item;
      if (!v) continue;
      const pr = await prod(v.printifyProductId);
      const ids = new Set((v.sizes && v.sizes.length ? v.sizes.map((s) => s.variantId) : [v.printifyVariantId]));
      const vars = (pr.variants || []).filter((x) => ids.has(x.id) && typeof x.cost === "number");
      if (!vars.length) { rows.push({ where: "Website", country, name: item.name + " (" + item.id + ")", unknown: "variant cost" }); continue; }
      const make = Math.max(...vars.map((x) => x.cost));
      const shipUsd = await printifyPostage(pr.blueprint_id, pr.print_provider_id, country, vars[0].id);
      const shipP = shipUsd == null ? (v.shipping?.first ?? null) : Math.round(shipUsd * FX);
      if (shipP == null) { rows.push({ where: "Website", country, name: item.name, unknown: "postage" }); continue; }
      // What the customer pays for postage: nothing for UK tees and mugs
      // (built into the price), otherwise the catalogue rate.
      const post = country === "GB" && item.freeUkPost ? 0 : (v.shipping?.first ?? 0);
      const price = Math.round(v.price * 100);
      const cost = Math.round(make * FX * (1 + VAT[country]) + shipP * (1 + VAT[country]));
      const costNoVat = Math.round(make * FX + shipP);
      const returns = GARMENT.test(item.id + " " + (pr.title || "")) ? 0.05 : 0.02;
      const f = (pp, po, c, r) => keepSite(pp, po, c, r, country);
      const k = f(price, post, cost, returns), k0 = f(price, post, costNoVat, returns), k10 = f(price * 0.9, post, cost, returns);
      rows.push({ where: "Website", country, name: `${item.name} (${(pr.title || "").split("—").pop().trim().slice(0, 30)})`, id: item.id, price, post, costP: cost, keep: Math.round(k),
        share: pct(k, price), shareNoVat: pct(k0, price), share10: pct(k10, price * 0.9), need: priceForRule(f, post, cost, returns, 0), need10: priceForRule(f, post, cost, returns, 0.1) });
    }
  }
  for (const b of bundles) {
    const country = b.country;
    let make = 0, ship = 0, shipNoVat = 0;
    for (const part of b.parts) {
      const pr = await prod(part.printifyProductId);
      const ids = new Set(part.options.map((o) => o.variantId));
      const vars = (pr.variants || []).filter((x) => ids.has(x.id) && typeof x.cost === "number");
      make += Math.max(...vars.map((x) => x.cost));
      ship += (await printifyPostage(pr.blueprint_id, pr.print_provider_id, country, vars[0].id)) || 0;
    }
    const price = Math.round(b.price * 100);
    const cost = Math.round((make + ship) * FX * (1 + VAT[country]));
    const costNoVat = Math.round((make + ship) * FX);
    const f = (pp, po, c, r) => keepSite(pp, po, c, r, country);
    const k = f(price, 0, cost, 0.05), k0 = f(price, 0, costNoVat, 0.05), k10 = f(price * 0.9, 0, cost, 0.05);
    rows.push({ where: "Website", country, name: b.name, id: b.id, price, post: 0, costP: cost, keep: Math.round(k), share: pct(k, price), shareNoVat: pct(k0, price), share10: pct(k10, price * 0.9),
      need: priceForRule(f, 0, cost, 0.05, 0), need10: priceForRule(f, 0, cost, 0.05, 0.1), note: "every part posted separately at its first-item rate (cautious)" });
  }

  const under = rows.filter((r) => r.share != null && r.share < RULE * 100);
  const under10 = rows.filter((r) => r.share10 != null && r.share10 < RULE * 100);
  fs.writeFileSync(OUT, JSON.stringify({ checkedAt: new Date().toISOString(), fx: FX, vat: VAT, rule: RULE, rows, under: under.length, under10: under10.length }, null, 2) + "\n");
  const g = (p) => (p == null ? "?" : "£" + (p / 100).toFixed(2));
  for (const r of rows.sort((a, b) => (a.share ?? -99) - (b.share ?? -99))) {
    if (r.unknown) { console.log(`?? ${r.where} ${r.country} ${r.name}: ${r.unknown} unknown`); continue; }
    console.log(`${r.share < 25 ? "UNDER" : "ok   "} ${r.where.padEnd(7)} ${r.country} ${String(r.name).slice(0, 50).padEnd(50)} ${g(r.price).padStart(7)} keeps ${String(r.share).padStart(5)}% (was ${r.shareNoVat}% before VAT; ${r.share10}% at 10% off) need ${g(r.need)} / ${g(r.need10)} at 10% off`);
  }
  console.log(`\n${rows.length} rows; ${under.length} under ${RULE * 100}% at full price; ${under10.length} under at 10% off`);
})().catch((e) => { console.error(e); process.exit(1); });
