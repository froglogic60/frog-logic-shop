// What could Frog Logic sell for Christmas that a customer can personalise?
//
// Sam, 15 Oct 2026: "products for Christmas that can be personalised by the
// customer ... pick a winter product, choose size/colour/smell and
// personalised". This read-only scan answers which Printify blueprints fit,
// which UK and US makers carry them, what choices each offers (sizes, colours,
// scents), what they cost to make and post. Costs are read the same way as
// us-makers.js: a throwaway product is created, its cost read, then deleted.
//
// It never touches catalog.json or any live product. Writes xmas-catalog.json.
const fs = require("fs");
const path = require("path");

const KEY = process.env.PRINTIFY_API_KEY;
let SHOP = process.env.PRINTIFY_SHOP_ID;
if (!KEY) { console.error("PRINTIFY_API_KEY is not set"); process.exit(1); }

const KINDS = {
  candle: { want: /candle/i, avoid: /holder|lantern|warmer|matches|wick/i },
  ornament: { want: /ornament|bauble/i, avoid: /set of|pack of 10|card/i },
  stocking: { want: /stocking/i, avoid: /sock/i },
  blanket: { want: /blanket|throw/i, avoid: /pet|baby|towel/i },
  sweatshirt: { want: /crewneck sweatshirt|unisex.*sweatshirt|christmas sweater|ugly sweater/i, avoid: /kids|youth|toddler|baby|zip|hoodie/i },
  socks: { want: /socks/i, avoid: /kids|baby/i },
  mug: { want: /enamel mug|camping mug|christmas mug|color(ed)? mug|accent/i, avoid: /travel|tumbler/i },
  tote: { want: /christmas|gift bag/i, avoid: /card/i },
  // Sam, 15 Oct 2026: a Christmas frog hoodie, tee and beanie bundle.
  hoodie: { want: /hooded sweatshirt|hoodie/i, avoid: /kids|youth|toddler|baby|zip|dog|pet|crop|aop|all over|sublimat|vest|dress/i },
  beanie: { want: /beanie|knit hat|cuffed hat|winter hat/i, avoid: /kids|youth|baby|toddler|dog|pet/i },
};
// ONLY=hoodie,beanie scans just those kinds and keeps the rest of the report.
const ONLY = (process.env.ONLY || "").split(",").map((s) => s.trim()).filter(Boolean);
const RETIRED = /(drukātava|drukatava|drive fulfillment|hft71|rogac|jams designs|\bc4\b)/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lastCall = 0;
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
const cache = new Map();
const cached = (p) => { if (!cache.has(p)) cache.set(p, api(p)); return cache.get(p); };

// Variant titles look like "Lavender / 9oz" or "Black / L". Split into
// option columns so the report says "8 scents, 2 sizes" rather than 16 rows.
function optionsOf(variants) {
  const cols = [];
  for (const v of variants) {
    String(v.title).split("/").map((s) => s.trim()).forEach((part, i) => {
      cols[i] = cols[i] || new Set();
      cols[i].add(part);
    });
  }
  return cols.map((s) => [...s]);
}

async function shippingFor(bp, pr) {
  try {
    const s = await cached(`/catalog/blueprints/${bp}/print_providers/${pr}/shipping.json`);
    const pick = (cc) => {
      const p = (s.profiles || []).find((x) => (x.countries || []).includes(cc));
      return p ? { first: p.first_item?.cost, additional: p.additional_items?.cost, currency: p.first_item?.currency } : null;
    };
    return { GB: pick("GB"), US: pick("US") };
  } catch { return null; }
}

(async () => {
  if (!SHOP) SHOP = (await api("/shops.json"))[0].id;
  const image = ((await api("/uploads.json?limit=1")).data || [])[0];
  const all = await cached("/catalog/blueprints.json");
  const OUT = path.join(__dirname, "xmas-catalog.json");
  const prior = ONLY.length && fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : null;
  const report = { scannedAt: new Date().toISOString(), kinds: prior ? prior.kinds : {}, undeleted: [] };
  let probes = 0;
  const MAX_PROBES = Number(process.env.MAX_PROBES) || 40;

  for (const [kind, k] of Object.entries(KINDS)) {
    if (ONLY.length && !ONLY.includes(kind)) continue;
    const bps = all.filter((b) => k.want.test(b.title) && !k.avoid.test(b.title));
    const rows = [];
    for (const bp of bps.slice(0, 25)) {
      let provs; try { provs = await cached(`/catalog/blueprints/${bp.id}/print_providers.json`); } catch { continue; }
      for (const pr of provs) {
        if (RETIRED.test(pr.title)) continue;
        let country = "?";
        try { country = (await cached(`/catalog/print_providers/${pr.id}.json`)).location?.country || "?"; } catch {}
        if (!["GB", "US"].includes(country)) continue;
        let vres; try { vres = await cached(`/catalog/blueprints/${bp.id}/print_providers/${pr.id}/variants.json`); } catch { continue; }
        const vars = (vres.variants || []).filter((v) => v.placeholders && v.placeholders.length);
        if (!vars.length) continue;
        const row = {
          blueprint: bp.title, blueprintId: bp.id, brand: bp.brand, provider: pr.title, providerId: pr.id, makerCountry: country,
          variants: vars.length, options: optionsOf(vars).map((o) => (o.length > 12 ? o.slice(0, 12).concat([`…+${o.length - 12}`]) : o)),
          placeholders: [...new Set(vars.flatMap((v) => v.placeholders.map((p) => p.position)))],
          shipping: await shippingFor(bp.id, pr.id),
          cost: null,
        };
        // Cost: probe the first few variants once per blueprint+maker.
        if (image && probes < MAX_PROBES) {
          probes++;
          const ids = vars.slice(0, 6).map((v) => v.id);
          const ph = vars[0].placeholders[0];
          let pid = null;
          try {
            const created = await api(`/shops/${SHOP}/products.json`, "POST", {
              title: "COST PROBE — delete me", description: "Temporary product to read base costs. Safe to delete.",
              blueprint_id: bp.id, print_provider_id: pr.id,
              variants: ids.map((id) => ({ id, price: 9999, is_enabled: true })),
              print_areas: [{ variant_ids: ids, placeholders: [{ position: ph.position, images: [{ id: image.id, x: 0.5, y: 0.5, scale: 1, angle: 0 }] }] }],
            });
            pid = created.id;
            const got = (created.variants || []).filter((v) => ids.includes(v.id) && v.cost != null);
            const cs = got.map((v) => v.cost);
            row.cost = cs.length ? { min: Math.min(...cs), max: Math.max(...cs) } : null;
            // Per variant too: min/max hides the middle size (the 50x60 blanket, 16 Oct 2026).
            row.costs = Object.fromEntries(got.map((v) => [v.title, v.cost]));
          } catch (e) {
            row.costError = e.message.slice(0, 160);
          } finally {
            if (pid) { try { await api(`/shops/${SHOP}/products/${pid}.json`, "DELETE"); } catch (e) { report.undeleted.push(pid); } }
          }
        }
        rows.push(row);
        console.log(`${kind}: ${bp.title} | ${pr.title} (${country}) — ${vars.length} variants, cost ${row.cost ? row.cost.min + "–" + row.cost.max : "?"}, ${row.options.map((o) => o.length).join("×")}`);
      }
    }
    report.kinds[kind] = rows;
  }
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + "\n");
  console.log(report.undeleted.length ? "NOT DELETED: " + report.undeleted.join(", ") : "All probes deleted.");
})().catch((e) => { console.error(e); process.exit(1); });
