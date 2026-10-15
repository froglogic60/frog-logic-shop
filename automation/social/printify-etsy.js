// Put the tees, mugs and wall prints on Etsy, through Printify's Etsy store.
//
// Sam's goal is sales, and Etsy is where gift buyers search. Until 15 Oct 2026
// the Etsy shop held downloads only. Sam's calls that day: tees, mugs and
// prints go on Etsy (notebooks, totes and bottles stay off: they would need
// £17–22 there to pay their way), each design twice — once on its UK maker for
// UK and EU buyers, once on its US maker (Printify Choice) for American buyers —
// and Offsite Ads stay on.
//
// Every Etsy product is a copy of a product the website already sells: same
// blueprint, same maker, same artwork and placement, same sizes. Only the
// title, description, tags and price are Etsy's own. Prices must keep Sam's
// rule — 25% of the price left after making, Etsy's fees (with VAT), a returns
// provision — and the script refuses to publish anything that falls short.
//
// Re-running corrects earlier products in place (matched by title) rather than
// listing a design twice.
//
//   DRY_RUN=1 node printify-etsy.js   report only, nothing created
//   PUBLISH=1 node printify-etsy.js   create/correct AND publish to Etsy
//   ONLY=mug node printify-etsy.js    one line
const fs = require("fs");
const path = require("path");
const { loadSiteData } = require("./lib.js");

const KEY = process.env.PRINTIFY_API_KEY;
let API_SHOP = process.env.PRINTIFY_SHOP_ID;
if (!KEY) { console.error("Missing PRINTIFY_API_KEY"); process.exit(1); }
const DRY = process.env.DRY_RUN === "1";
const PUBLISH = process.env.PUBLISH === "1";
const ONLY = (process.env.ONLY || "").split(",").map((s) => s.trim()).filter(Boolean);

// Etsy prices in pence, before postage (Printify's Etsy shipping profile adds
// the maker's own postage at checkout). UK rows use the UK maker, US rows the
// US maker. Kept beside the costs they were worked out from on 15 Oct 2026.
const PRICES = {
  uk: { tee: 1900, mug: 1350, print: 1400 },
  us: { tee: 2200, mug: 1350, print: 1400 },
};
const RETURNS = { tee: 0.05, mug: 0.02, print: 0.02 };
// Etsy UK fees with 20% VAT on each: 6.5% transaction, 4% + 20p payment
// processing, 0.32% regulatory operating fee — all on price + postage — plus a
// 15p listing renewal per sale. Checked against Sam's own statement (15p + 3p VAT).
const FEE_RATE = 1.2 * (0.065 + 0.04 + 0.0032);
const FEE_FIXED = 1.2 * 20 + 18;
const MIN_KEEP = 0.25;

const UK_BLUEPRINT = { tee: 6, mug: 535, print: 763 };
const KIND_WORD = { tee: "T-Shirt", mug: "Mug", print: "Wall Print" };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lastCall = 0;
async function api(p, method = "GET", body) {
  for (let attempt = 0; ; attempt++) {
    const wait = lastCall + 200 - Date.now();
    if (wait > 0) await sleep(wait);
    lastCall = Date.now();
    const r = await fetch("https://api.printify.com/v1" + p, {
      method, headers: { Authorization: "Bearer " + KEY, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (r.ok) return r.status === 204 ? {} : r.json();
    // Publishing to Etsy is rate-limited hard (429 "Too Many Attempts" after
    // ~17 in a row on 15 Oct 2026), so back off for minutes, not seconds.
    if ((r.status === 429 || r.status >= 500) && attempt < 6) { await sleep(Math.min(180000, (r.status === 429 ? 20000 : 2000) * 2 ** attempt)); continue; }
    throw new Error(method + " " + p + " -> " + r.status + " " + (await r.text()).slice(0, 400));
  }
}

async function shopProducts(shop) {
  const all = [];
  for (let page = 1; page <= 40; page++) {
    const r = await api(`/shops/${shop}/products.json?limit=50&page=${page}`);
    const rows = r.data || r;
    if (!Array.isArray(rows) || !rows.length) break;
    all.push(...rows);
    if (rows.length < 50) break;
  }
  return all;
}

// ---- the words. Lead with what it is and who it's for — that is how Etsy
// buyers search — and keep the design's own name at the front so a buyer who
// saw it elsewhere can find it.
function titleFor(kind, item, frog, where) {
  const what = {
    tee: `${frog ? "Cute Frog " : ""}T-Shirt — Neurodivergent ADHD and Autism Shirt, Unisex Heavy Cotton Tee`,
    mug: `${frog ? "Cute Frog " : ""}Mug — Neurodivergent ADHD and Autism Gift, 11oz Ceramic Coffee Mug`,
    print: `${frog ? "Cute Frog " : ""}Wall Print — Neurodivergent ADHD and Autism Art Poster, 16x16 Inch`,
  }[kind];
  const tail = where === "us" ? ", Ships from the US" : "";
  let t = `${item.word} ${what}${tail}`;
  if (t.length > 140) t = `${item.word} ${KIND_WORD[kind]} — Neurodivergent ADHD and Autism Gift${tail}`;
  return t.slice(0, 140);
}

function descriptionFor(kind, item, frog, where) {
  const made = where === "us"
    ? "Printed to order in the United States and posted from there, so there's no import charge."
    : "Printed to order in the UK and posted from there.";
  const what = {
    tee: "A unisex heavy-cotton tee, sizes S to 2XL. It's a relaxed, roomy fit — if you're between sizes, go with your usual.",
    mug: "An 11oz white ceramic mug, printed all the way round. Dishwasher and microwave safe.",
    print: "A 16 × 16 inch semi-gloss poster, ready for a square frame (frame not included).",
  }[kind];
  const art = frog
    ? "One of the Comfort & Chaos frogs — a small green frog living through a very relatable mood."
    : "The word is the artwork: the letters scatter, spiral, sink or trail off depending on what the feeling actually does to you.";
  return [
    `${item.word}. ${item.line}`,
    art,
    what,
    made,
    "Frog Logic is a small shop run by one neurodivergent person, using the words we actually use for ourselves — never a clinical label — and every piece carries a small frog.",
    "Faulty or damaged? Send a photo within 30 days and it's replaced or refunded.",
  ].join("\n\n");
}

function tagsFor(kind, item, frog) {
  const base = {
    tee: ["neurodivergent shirt", "adhd shirt", "autism shirt", "audhd", "adhd gift", "autism gift", "actually autistic", "late diagnosed", "neurodivergent gift", "funny adhd shirt", "unisex tshirt"],
    mug: ["neurodivergent mug", "adhd mug", "autism mug", "audhd", "adhd gift", "autism gift", "actually autistic", "neurodivergent gift", "coffee mug gift", "stocking filler", "funny adhd mug"],
    print: ["neurodivergent art", "adhd wall art", "autism wall art", "audhd", "adhd gift", "autism gift", "neurodivergent gift", "typography print", "square poster", "office wall art", "late diagnosed"],
  }[kind].slice();
  const own = item.word.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
  const extra = [];
  if (own && own.length <= 20) extra.push(own);
  if (frog) extra.push(kind === "print" ? "frog wall art" : `cute frog ${kind === "tee" ? "shirt" : "mug"}`);
  else extra.push("christmas gift");
  const tags = [...new Set([...extra, ...base])].filter((t) => t.length <= 20).slice(0, 13);
  return tags;
}

// Profit on one item sold alone, postage passed through at cost.
function keeps(price, cost, kind) {
  const fees = FEE_RATE * price + FEE_FIXED; // postage is pass-through; its fee share is small and covered below
  return price - cost - fees - RETURNS[kind] * price;
}

(async () => {
  const shops = await api("/shops.json");
  if (!API_SHOP) API_SHOP = (shops.find((s) => !/etsy/i.test(s.sales_channel)) || shops[0]).id;
  const etsy = shops.find((s) => /etsy/i.test(s.sales_channel || ""));
  console.log("Printify stores:", shops.map((s) => `${s.id} ${s.title} [${s.sales_channel}]`).join(" | "));
  if (!etsy) { console.error("No Etsy store connected in Printify yet — connect it first (Printify → My stores → Add new store → Etsy)."); process.exit(1); }
  const ETSY = etsy.id;

  const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, "../../netlify/functions/catalog.json"), "utf8"));
  const margin = JSON.parse(fs.readFileSync(path.join(__dirname, "margin-report.json"), "utf8")).rows;
  const usRes = JSON.parse(fs.readFileSync(path.join(__dirname, "printify-us-result.json"), "utf8")).results || [];
  const { PRODUCTS } = loadSiteData();
  const slug = (p) => { const n = p.num.includes("—") ? p.num.split("—")[0].trim() : p.num; return (n + "-" + p.word).replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase(); };
  const site = new Map(PRODUCTS.map((p) => [slug(p), p]));

  // What to list: every live UK tee, mug and print except Halloween, plus the
  // US twin of each.
  const jobs = [];
  for (const kind of Object.keys(UK_BLUEPRINT)) {
    if (ONLY.length && !ONLY.includes(kind)) continue;
    for (const r of margin.filter((x) => x.blueprint === UK_BLUEPRINT[kind] && !/^h\d/.test(x.id))) {
      const item = catalog.find((c) => c.id === r.id);
      const p = site.get(r.id);
      if (!item || !item.printifyProductId || !p) continue;
      jobs.push({ kind, where: "uk", id: r.id, item, p, source: item.printifyProductId, sizes: item.sizes });
      const us = usRes.find((u) => u.id === r.id && u.kind === kind);
      if (us) jobs.push({ kind, where: "us", id: r.id, item, p, source: us.printifyProductId, sizes: us.sizes });
    }
  }
  console.log(`${jobs.length} Etsy products to build (${jobs.filter((j) => j.where === "uk").length} UK, ${jobs.filter((j) => j.where === "us").length} US)`);

  const existing = new Map((await shopProducts(ETSY)).map((x) => [x.title, x]));
  const OUT = path.join(__dirname, "printify-etsy-result.json");
  // Keep what earlier runs built: a run limited with ONLY, or one that failed
  // part-way, must not wipe the record of the products already on Etsy.
  const prior = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : { results: [] };
  const keepPrior = new Map((prior.results || []).map((r) => [r.where + ":" + r.id, r]));
  const results = [], errors = [], held = [];

  for (const j of jobs) {
    const frog = /^f\d/.test(j.id);
    const title = titleFor(j.kind, j.p, frog, j.where);
    try {
      const src = await api(`/shops/${API_SHOP}/products/${j.source}.json`);
      const want = j.sizes ? j.sizes.map((s) => s.variantId) : null;
      const vars = (src.variants || []).filter((v) => v.is_enabled && (!want || want.includes(v.id)));
      if (!vars.length) throw new Error("source product has no enabled variants");
      const price = PRICES[j.where][j.kind];
      const worst = Math.max(...vars.map((v) => v.cost || 0));
      const keep = keeps(price, worst, j.kind);
      if (keep < MIN_KEEP * price) {
        held.push({ title, price, worstCost: worst, keeps: Math.round(keep) });
        console.log(`  HELD ${title}: keeps ${Math.round(keep)}p of ${price}p — under 25%`);
        continue;
      }
      const ids = vars.map((v) => v.id);
      const payload = {
        title,
        description: descriptionFor(j.kind, j.p, frog, j.where),
        tags: tagsFor(j.kind, j.p, frog),
        blueprint_id: src.blueprint_id,
        print_provider_id: src.print_provider_id,
        variants: ids.map((id) => ({ id, price, is_enabled: true })),
        print_areas: (src.print_areas || []).map((a) => ({
          variant_ids: a.variant_ids.filter((id) => ids.includes(id)),
          // Only placeholders that carry artwork: the tees have empty back and
          // sleeve areas, and Printify refuses a placeholder with no image.
          placeholders: (a.placeholders || []).filter((ph) => (ph.images || []).length).map((ph) => ({
            position: ph.position,
            images: ph.images.map((im) => ({ id: im.id, x: im.x, y: im.y, scale: im.scale, angle: im.angle || 0 })),
          })),
        })).filter((a) => a.variant_ids.length && a.placeholders.length),
      };
      if (DRY) { console.log(`  would ${existing.has(title) ? "correct" : "create"}: ${title} — £${(price / 100).toFixed(2)}, keeps ${Math.round(keep)}p, ${ids.length} variant(s), tags: ${payload.tags.join(", ")}`); continue; }
      const already = existing.get(title);
      const prod = already
        ? await api(`/shops/${ETSY}/products/${already.id}.json`, "PUT", payload)
        : await api(`/shops/${ETSY}/products.json`, "POST", payload);
      let published = false;
      if (PUBLISH) {
        await sleep(1500);
        await api(`/shops/${ETSY}/products/${prod.id}/publish.json`, "POST", {
          title: true, description: true, images: true, variants: true, tags: true, keyFeatures: true, shipping_template: true,
        });
        published = true;
        await sleep(6000);
      }
      keepPrior.delete(j.where + ":" + j.id);
      results.push({ id: j.id, kind: j.kind, where: j.where, title, printifyProductId: prod.id, price, worstCost: worst, keeps: Math.round(keep), published });
      console.log(`  ${already ? "corrected" : "created"}${published ? " + published" : ""}: ${title} -> ${prod.id}`);
    } catch (e) {
      console.error(`  FAILED ${title}: ${e.message}`);
      errors.push({ id: j.id, where: j.where, error: e.message });
    }
  }
  if (DRY) { console.log("\nDRY_RUN — nothing created or changed."); return; }
  const all = [...keepPrior.values(), ...results];
  fs.writeFileSync(OUT, JSON.stringify({ ranAt: new Date().toISOString(), etsyStore: ETSY, results: all, held, errors }, null, 2) + "\n");
  console.log(`\ndone: ${results.length} built, ${held.length} held for price, ${errors.length} failed -> printify-etsy-result.json`);
})().catch((e) => { console.error(e); process.exit(1); });
