// Did the customer pay enough postage? Checks every new UK and US order.
//
// Sam, 15 Oct 2026: "check the first order when it comes in". That day the
// postage was converted from Printify's dollars to pounds (site and Etsy), and
// a tee to a UK address came out at £2.77, which looked cheap. The numbers came
// from Printify's price list; this checks them against what Printify actually
// BILLS on real orders.
//
// For each order Printify holds (website shop and Etsy shop) that this hasn't
// looked at before, it works out:
//   - what the customer was charged for postage, from the same rates the
//     website checkout and the Etsy delivery profiles use, and
//   - what Printify billed for shipping (total_shipping, in US cents),
//     converted at Printify's own rate,
// and writes one line per order: covered, or short by how much. Read-only.
// Lines go to the Desk and the email via /tmp/order-notes.json; every order it
// has checked is kept in order-postage-report.json so nothing is reported twice.
const fs = require("fs");
const path = require("path");

const KEY = process.env.PRINTIFY_API_KEY;
if (!KEY) { console.error("Missing PRINTIFY_API_KEY"); process.exit(1); }
const OUT = path.join(__dirname, "order-postage-report.json");
const NOTES = process.env.ORDER_NOTES || "/tmp/order-notes.json";
const CATALOG = path.join(__dirname, "../../netlify/functions/catalog.json");

// Printify's own conversion, seen on its catalogue page 15 Oct 2026
// ($24.79 shown as GBP 18.77).
const USD_TO_GBP = 0.757;
const FREE_DELIVERY_OVER = 8000; // the website's free UK delivery threshold, in pence

// Etsy delivery profiles as set by hand on 15 Oct 2026, in pence, by
// country and Printify blueprint: [first item, each additional].
// US first-item rates cut to £4.49 on 15 Oct 2026 with Etsy's postage tool
// (Etsy ranks US listings lower when postage is US$6+), and the cut was added
// to each item's price instead — Sam: "Move it into price".
const ETSY = {
  GB: { 6: [273, 152], 535: [296, 190], 763: [395, 53], 804: [395, 53], 813: [235, 76], 479: [296, 99], 635: [296, 99], 1125: [296, 99] },
  US: { 6: [377, 183], 478: [449, 235], 479: [449, 235], 635: [449, 235], 763: [449, 152], 804: [449, 152], 531: [448, 53], 1488: [449, 304] },
};
// Postage moved into the US item price on 15 Oct 2026, in pence per item.
// It pays towards Printify's shipping, so it counts as postage collected.
const MOVED_INTO_PRICE = { US: { 478: 106, 479: 106, 635: 106, 763: 166, 804: 166, 1488: 250 } };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function api(p) {
  for (let attempt = 0; ; attempt++) {
    const r = await fetch("https://api.printify.com/v1" + p, { headers: { Authorization: "Bearer " + KEY } });
    if (r.ok) return r.json();
    if ((r.status === 429 || r.status >= 500) && attempt < 5) { await sleep(2000 * 2 ** attempt); continue; }
    throw new Error("GET " + p + " -> " + r.status + " " + (await r.text()).slice(0, 200));
  }
}
const gbp = (p) => "£" + (p / 100).toFixed(2);

// Parcels are per maker: highest first-item rate in the group, the rest at
// the additional rate. Same rule as create-checkout.js.
function postage(lines) {
  const groups = new Map();
  for (const l of lines) {
    if (!l.rate) return null;
    const g = groups.get(l.group) || { first: 0, additional: 0, qty: 0 };
    g.first = Math.max(g.first, l.rate[0]);
    g.additional = Math.max(g.additional, l.rate[1]);
    g.qty += l.qty;
    groups.set(l.group, g);
  }
  let total = 0;
  for (const g of groups.values()) total += g.first + g.additional * Math.max(0, g.qty - 1);
  return total;
}

(async () => {
  const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
  // Printify product id -> how the website charged postage for it.
  const site = new Map();
  for (const item of catalog) {
    if (item.printifyProductId && item.shipping) site.set(item.printifyProductId, { GB: [item.shipping.first, item.shipping.additional], group: "uk-" + item.shipping.provider, price: item.price });
    const us = item.us;
    if (us && us.shipping) for (const id of [].concat(us.printifyProductId || [], us.ids || [])) site.set(id, { US: [us.shipping.first, us.shipping.additional], group: String(us.shipping.provider), price: us.price });
  }

  // First run: orders already in Printify are recorded as seen, not reported —
  // the check is for orders that come in from now on.
  const baseline = !fs.existsSync(OUT);
  const report = baseline ? { checked: {} } : JSON.parse(fs.readFileSync(OUT, "utf8"));
  const shops = await api("/shops.json");
  const notes = [];

  for (const shop of shops) {
    const isEtsy = /etsy/i.test(shop.sales_channel || "");
    let orders = [];
    try {
      for (let page = 1; page <= 10; page++) {
        const r = await api(`/shops/${shop.id}/orders.json?limit=50&page=${page}`);
        const rows = r.data || [];
        orders.push(...rows);
        if (rows.length < 50) break;
      }
    } catch (e) {
      notes.push(`Order postage check: could not read ${isEtsy ? "Etsy" : "website"} orders — ${e.message.slice(0, 100)}`);
      continue;
    }
    for (const o of orders) {
      if (report.checked[o.id]) continue;
      if (baseline) { report.checked[o.id] = { shop: isEtsy ? "Etsy" : "website", created: o.created_at, result: "already there on the first run" }; continue; }
      const country = String(o.address_to?.country || "").toUpperCase();
      const where = isEtsy ? "Etsy" : "website";
      const label = `${where} order ${o.metadata?.shop_order_id || o.id} (${country || "?"}, ${String(o.created_at || "").slice(0, 10)})`;
      const entry = { shop: where, country, created: o.created_at, status: o.status, keys: Object.keys(o) };
      report.checked[o.id] = entry;
      if (country !== "GB" && country !== "US") { entry.result = "not UK/US — skipped"; continue; }
      if (typeof o.total_shipping !== "number") {
        entry.result = "no total_shipping on the order";
        notes.push(`${label}: Printify's order has no shipping total to compare — ask Claude to look at it by hand`);
        continue;
      }
      const lines = (o.line_items || []).map((li) => {
        const qty = Number(li.quantity) || 1;
        if (isEtsy) {
          const bp = li.blueprint_id ?? li.metadata?.blueprint_id;
          return { qty, group: String(li.print_provider_id ?? bp), rate: ETSY[country][bp] || null, bp, moved: (MOVED_INTO_PRICE[country]?.[bp] || 0) * qty };
        }
        const s = site.get(li.product_id);
        return { qty, group: s?.group, rate: s?.[country] || null, price: s?.price || 0 };
      });
      let charged = postage(lines);
      if (charged != null) charged += lines.reduce((t, l) => t + (l.moved || 0), 0);
      const billedGbp = Math.round(o.total_shipping * USD_TO_GBP);
      entry.billedCents = o.total_shipping;
      entry.billedGbpPence = billedGbp;
      if (charged == null) {
        entry.result = "unknown customer rate";
        notes.push(`${label}: Printify billed $${(o.total_shipping / 100).toFixed(2)} (~${gbp(billedGbp)}) postage, but I couldn't match every item to a rate — ask Claude to check it by hand`);
        continue;
      }
      // Website UK orders over the threshold post free.
      if (!isEtsy && country === "GB") {
        const goods = lines.reduce((t, l) => t + Math.round(l.price * 100) * l.qty, 0); // catalog prices are in pounds
        if (goods >= FREE_DELIVERY_OVER) charged = 0;
      }
      entry.chargedPence = charged;
      const diff = charged - billedGbp;
      entry.result = diff >= 0 ? "covered" : "short";
      notes.push(`${label}: customer paid ${gbp(charged)} postage${lines.some((l) => l.moved) ? " (including the part moved into the item price)" : ""},Printify billed $${(o.total_shipping / 100).toFixed(2)} (~${gbp(billedGbp)}) — ${diff >= 0 ? "covered, " + gbp(diff) + " spare" : "SHORT by " + gbp(-diff)}${charged === 0 ? " (free-delivery order)" : ""}`);
    }
  }

  report.updatedAt = new Date().toISOString();
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + "\n");
  if (notes.length) fs.writeFileSync(NOTES, JSON.stringify(notes));
  console.log(baseline ? `Baseline: ${Object.keys(report.checked).length} existing order(s) recorded as seen` : notes.length ? notes.join("\n") : "No new orders");
})().catch((e) => { console.error(e); process.exit(1); });
