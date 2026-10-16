// One-off price changes in the Printify Etsy store (16 Oct 2026). Printify
// adds 20% VAT to UK orders (seen on the test order), which none of the
// earlier price checks counted; margin-vat.js found these under Sam's rule:
// "All prices need to cover ALL expenses with 23-25% profit".
//
//   UK personalised ornament  £10    -> £13.75  (was keeping 1%)
//   US personalised candle    9oz £22.50 -> £24.50 (was 18%; 4oz unchanged)
//
// The Socially Hibernating UK hoodie and throw are repriced through
// xmas-bundle.js instead (that file owns their prices).
//
// Changes Printify only. Etsy picks the new prices up when each product is
// republished in Printify with "Colors, sizes, prices and SKUs" ticked.
// DRY_RUN=1 reports only. Writes price-set-result.json.
const fs = require("fs");
const path = require("path");

const KEY = process.env.PRINTIFY_API_KEY;
if (!KEY) { console.error("Missing PRINTIFY_API_KEY"); process.exit(1); }
const DRY = process.env.DRY_RUN === "1";

const PLAN = [
  { title: /^Personalised Frog Christmas Ornament/, price: () => 1375 },
  { title: /^Personalized Christmas Frog Candle/, price: (v) => (/9\s*oz/i.test(v.title) ? 2450 : null) },
];

async function api(p, method = "GET", body) {
  const r = await fetch("https://api.printify.com/v1" + p, {
    method, headers: { Authorization: "Bearer " + KEY, "Content-Type": "application/json", "User-Agent": "frog-logic-bot/1.0" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(method + " " + p + " -> " + r.status + " " + (await r.text()).slice(0, 300));
  return r.status === 204 ? {} : r.json();
}

(async () => {
  const shops = await api("/shops.json");
  const etsy = shops.find((s) => /etsy/i.test(s.sales_channel || ""));
  const list = [];
  for (let page = 1; page <= 20; page++) {
    const r = await api(`/shops/${etsy.id}/products.json?limit=50&page=${page}`);
    list.push(...(r.data || [])); if ((r.data || []).length < 50) break;
  }
  const out = [];
  for (const step of PLAN) {
    const hits = list.filter((p) => step.title.test(p.title));
    if (hits.length !== 1) { out.push({ plan: String(step.title), error: `${hits.length} products matched` }); continue; }
    const full = await api(`/shops/${etsy.id}/products/${hits[0].id}.json`);
    const changes = (full.variants || []).filter((v) => v.is_enabled)
      .map((v) => ({ v, to: step.price(v) })).filter((c) => c.to != null && c.to !== c.v.price);
    console.log(`${full.title.slice(0, 60)}: ${changes.length} variant(s) ${changes.map((c) => `${c.v.title} ${c.v.price}->${c.to}`).slice(0, 4).join("; ")}`);
    if (!DRY && changes.length) {
      // Every enabled variant is sent, changed or not, so none is switched off.
      const variants = (full.variants || []).filter((v) => v.is_enabled).map((v) => {
        const c = changes.find((x) => x.v.id === v.id);
        return { id: v.id, price: c ? c.to : v.price, is_enabled: true };
      });
      await api(`/shops/${etsy.id}/products/${full.id}.json`, "PUT", { variants });
    }
    const fresh = DRY ? full : await api(`/shops/${etsy.id}/products/${full.id}.json`);
    out.push({ id: full.id, title: full.title, prices: [...new Set((fresh.variants || []).filter((v) => v.is_enabled).map((v) => v.title.split(" / ")[0] + " " + v.price))] });
  }
  fs.writeFileSync(path.join(__dirname, "price-set-result.json"), JSON.stringify({ ranAt: new Date().toISOString(), dryRun: DRY, out }, null, 2) + "\n");
  console.log(JSON.stringify(out, null, 1));
  if (out.some((o) => o.error)) process.exit(1);
})().catch((e) => { console.error(e); process.exit(1); });
