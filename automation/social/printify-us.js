// Build the US versions of the tees, mugs, wall prints and notebooks.
//
// Half the shop's visitors are American and none of them could buy anything
// physical: the UK makers charge £23–35 to post across the Atlantic. The US
// maker check (us-makers.js, 14 Oct 2026) found Printify Choice makes all four
// lines inside the US for about the UK cost, posting for £3–6. Sam's call the
// same day: "tees, mugs, prints and notebooks at £12 please" — same prices as
// the UK, notebooks at £12.
//
// Each US product is a copy of the UK product that is on sale today, built on a
// US maker and reusing the very same uploaded artwork. Tees and prints are the
// same blank as the UK (Gildan heavy cotton tee, 16x16 silk poster); the mug and
// notebook are the nearest US equivalents, so their artwork is fitted to the new
// print area rather than copied blindly — the UK mugs were rejected once for
// running off the edges, and that lesson is built in here.
//
// It builds Printify products ONLY. Nothing in the shop sells them until
// wire-catalog.js merges printify-us-result.json into catalog.json and the shop
// is published. Re-running corrects the products from an earlier run in place
// (found by title) instead of building a second set. Halloween is skipped: it
// comes down on 31 Oct.
//
//   DRY_RUN=1 node printify-us.js       report only
//   ONLY=mug node printify-us.js        one line
const fs = require("fs");
const path = require("path");

const KEY = process.env.PRINTIFY_API_KEY;
let SHOP = process.env.PRINTIFY_SHOP_ID;
if (!KEY) { console.error("Missing PRINTIFY_API_KEY"); process.exit(1); }
const DRY = process.env.DRY_RUN === "1";
const ONLY = (process.env.ONLY || "").split(",").map((s) => s.trim()).filter(Boolean);

// ukBlueprint picks the products; target is where the US copy is built.
// pick() chooses which US variant stands in for a UK variant title.
const LINES = {
  tee: {
    ukBlueprint: 6, target: { blueprintId: 6, providerId: 99 }, price: 1900, label: "Tee",
    expect: { blueprint: /heavy cotton tee/i, provider: /printify choice/i },
    pick: (ukTitle, us) => us.find((v) => v.title.toLowerCase() === ukTitle.toLowerCase()),
  },
  mug: {
    ukBlueprint: 535, target: { blueprintId: 478, providerId: 99 }, price: 1350, label: "Mug",
    expect: { blueprint: /ceramic mug/i, provider: /printify choice/i },
    pick: (ukTitle, us) => us.find((v) => /^11\s*oz/i.test(v.title) && !/black|15/i.test(v.title)),
  },
  print: {
    ukBlueprint: 763, target: { blueprintId: 763, providerId: 99 }, price: 1200, label: "Print",
    expect: { blueprint: /silk poster/i, provider: /printify choice/i },
    pick: (ukTitle, us) => us.find((v) => v.title.replace(/[″"]/g, "in").toLowerCase() === ukTitle.replace(/[″"]/g, "in").toLowerCase()),
  },
  notebook: {
    ukBlueprint: 1193, target: { blueprintId: 74, providerId: 99 }, price: 1200, label: "Notebook",
    expect: { blueprint: /spiral notebook/i, provider: /printify choice/i },
    pick: (ukTitle, us) => us[0],
  },
};

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
    throw new Error(method + " " + p + " -> " + r.status + " " + (await r.text()).slice(0, 300));
  }
}
const cache = new Map();
const cached = (p) => { if (!cache.has(p)) cache.set(p, api(p)); return cache.get(p); };

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];
const sizeOf = (title) => String(title).split("/").map((s) => s.trim()).find((s) => SIZE_ORDER.includes(s.toUpperCase())) || null;

function frontOf(placeholders) {
  return (placeholders || []).find((y) => /front/i.test(y.position)) || (placeholders || [])[0];
}

async function uploadDims(id) {
  try { const u = await cached(`/uploads/${id}.json`); return { w: u.width, h: u.height }; } catch { return null; }
}

async function shopProducts() {
  const all = [];
  for (let page = 1; page <= 80; page++) {
    const r = await api(`/shops/${SHOP}/products.json?limit=50&page=${page}`);
    const rows = r.data || r;
    if (!Array.isArray(rows) || !rows.length) break;
    all.push(...rows);
    if (rows.length < 50) break;
  }
  return all;
}

(async () => {
  if (!SHOP) SHOP = (await api("/shops.json"))[0].id;
  const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, "../../netlify/functions/catalog.json"), "utf8"));
  const margin = JSON.parse(fs.readFileSync(path.join(__dirname, "margin-report.json"), "utf8")).rows;
  const OUT = path.join(__dirname, "printify-us-result.json");
  const prior = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : { results: [] };
  const keepPrior = new Map((prior.results || []).map((r) => [r.id, r]));

  const existing = new Map();
  for (const prod of await shopProducts()) if (/\(US\)$/.test(prod.title)) existing.set(prod.title, prod);
  if (existing.size) console.log(`${existing.size} US product(s) from an earlier run will be corrected in place`);

  const results = [], errors = [];
  for (const [kind, L] of Object.entries(LINES)) {
    if (ONLY.length && !ONLY.includes(kind)) continue;
    const T = L.target;
    const bp = await cached(`/catalog/blueprints/${T.blueprintId}.json`);
    const pr = (await cached(`/catalog/blueprints/${T.blueprintId}/print_providers.json`)).find((x) => x.id === T.providerId);
    if (!pr) throw new Error(`provider ${T.providerId} no longer makes blueprint ${T.blueprintId}`);
    if (!L.expect.blueprint.test(bp.title) || !L.expect.provider.test(pr.title)) throw new Error(`target changed: "${bp.title}" / "${pr.title}"`);
    const usVariants = (await cached(`/catalog/blueprints/${T.blueprintId}/print_providers/${T.providerId}/variants.json`)).variants || [];
    const ship = await cached(`/catalog/blueprints/${T.blueprintId}/print_providers/${T.providerId}/shipping.json`);
    const usProfile = (ship.profiles || []).find((p) => (p.countries || []).includes("US"));
    if (!usProfile) throw new Error(`${bp.title} / ${pr.title} has no US postage profile`);
    const usShipping = { first: usProfile.first_item.cost, additional: usProfile.additional_items.cost, currency: usProfile.first_item.currency };
    console.log(`\n=== ${kind}: ${bp.title} | ${pr.title} — US post ${usShipping.first}/${usShipping.additional} ${usShipping.currency}`);

    const ids = margin.filter((r) => r.blueprint === L.ukBlueprint).map((r) => r.id).filter((id) => !/^h\d/.test(id));
    for (const id of ids) {
      const item = catalog.find((c) => c.id === id);
      const title = `${item ? item.name : id} — Frog Logic ${L.label} (US)`;
      try {
        if (!item || !item.printifyProductId) throw new Error("no live UK product in catalog.json");
        const uk = await api(`/shops/${SHOP}/products/${item.printifyProductId}.json`);
        const ukEnabled = (uk.variants || []).filter((v) => v.is_enabled);
        // The sizes the shop actually sells: catalog.json is the truth for that.
        const wantIds = item.sizes ? item.sizes.map((s) => s.variantId) : [item.printifyVariantId];
        const ukSold = ukEnabled.filter((v) => wantIds.includes(v.id));
        const map = [];
        for (const v of (ukSold.length ? ukSold : ukEnabled.slice(0, 1))) {
          const us = L.pick(v.title, usVariants);
          if (!us) throw new Error(`no US variant for "${v.title}"`);
          if (!map.some((m) => m.us.id === us.id)) map.push({ uk: v, us, size: sizeOf(v.title) });
        }
        map.sort((a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size));
        const variantIds = map.map((m) => m.us.id);

        // Artwork: the UK product's own image and placement. Kept exactly when
        // the US print area has the same shape; refitted when it does not.
        let ukPh = null, ukImg = null;
        for (const area of uk.print_areas || []) for (const ph of area.placeholders || []) {
          if (!ukImg && (ph.images || []).length) { ukPh = ph; ukImg = ph.images[0]; }
        }
        if (!ukImg) throw new Error("no artwork on the UK product");
        const ukCat = (await cached(`/catalog/blueprints/${uk.blueprint_id}/print_providers/${uk.print_provider_id}/variants.json`)).variants || [];
        const ukArea = frontOf((ukCat.find((x) => x.id === ukSold[0]?.id) || ukCat[0] || {}).placeholders);
        // Tightest US print area across the sizes, so one placement is safe on all.
        const usAreas = map.map((m) => frontOf(m.us.placeholders)).filter((a) => a && a.width && a.height)
          .sort((a, b) => a.height / a.width - b.height / b.width);
        const usArea = usAreas[0];
        if (!usArea) throw new Error("US variant has no print area");
        const sameShape = ukArea && ukArea.width && Math.abs(ukArea.height / ukArea.width - usArea.height / usArea.width) < 0.02;
        let placement;
        if (sameShape) {
          placement = { x: ukImg.x, y: ukImg.y, scale: ukImg.scale, angle: ukImg.angle || 0 };
        } else {
          const d = await uploadDims(ukImg.id);
          const imgRatio = d && d.w && d.h ? d.h / d.w : 1;
          placement = { x: 0.5, y: 0.5, scale: Math.min(1, (usArea.height / usArea.width) / imgRatio), angle: 0 };
        }
        const payload = {
          title,
          description: uk.description || item.name,
          blueprint_id: T.blueprintId, print_provider_id: T.providerId,
          variants: variantIds.map((vid) => ({ id: vid, price: L.price, is_enabled: true })),
          print_areas: [{ variant_ids: variantIds, placeholders: [{ position: usArea.position, images: [{ id: ukImg.id, ...placement }] }] }],
        };
        if (DRY) { console.log(`  ${title}: would ${existing.has(title) ? "correct" : "create"} — ${variantIds.length} variant(s), ${sameShape ? "UK placement kept" : "refitted, scale " + placement.scale.toFixed(3)}`); continue; }

        const already = existing.get(title);
        const product = already
          ? await api(`/shops/${SHOP}/products/${already.id}.json`, "PUT", payload)
          : await api(`/shops/${SHOP}/products.json`, "POST", payload);
        await sleep(1500);
        const fresh = await api(`/shops/${SHOP}/products/${product.id}.json`);
        const enabled = (fresh.variants || []).filter((v) => variantIds.includes(v.id));
        const costs = enabled.map((v) => v.cost).filter((c) => typeof c === "number");
        const shot = (fresh.images || []).find((i) => i.is_default) || (fresh.images || [])[0];
        const row = {
          id, kind, name: item.name,
          printifyProductId: product.id,
          printifyVariantId: map[0].us.id,
          ...(item.sizes ? { sizes: map.map((m) => ({ size: m.size, variantId: m.us.id, cost: (enabled.find((v) => v.id === m.us.id) || {}).cost ?? null })) } : {}),
          price: L.price, worstCost: costs.length ? Math.max(...costs) : null,
          blueprintId: T.blueprintId, blueprint: bp.title, providerId: T.providerId, provider: pr.title,
          usShipping, placement: sameShape ? "kept" : "refitted",
          mockup: shot ? shot.src : null,
          ukProductId: item.printifyProductId,
        };
        results.push(row); keepPrior.delete(id);
        console.log(`  ${already ? "corrected" : "created"} ${title} -> ${product.id}  cost ${row.worstCost}  ${row.placement}`);
      } catch (e) {
        console.error(`  FAILED ${title}: ${e.message}`);
        errors.push({ id, error: e.message });
      }
    }
  }
  if (DRY) { console.log("\nDRY_RUN — nothing created or changed."); return; }
  const all = [...keepPrior.values(), ...results];
  fs.writeFileSync(OUT, JSON.stringify({ createdAt: new Date().toISOString(), results: all, errors }, null, 2) + "\n");
  console.log(`\ndone: ${results.length} built/corrected, ${errors.length} failed -> printify-us-result.json`);
})().catch((e) => { console.error(e); process.exit(1); });
