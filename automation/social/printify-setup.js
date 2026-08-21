// One-off: create first-wave Printify products (wall prints, stickers, mugs).
// Runs in GitHub Actions with PRINTIFY_API_KEY + PRINTIFY_SHOP_ID secrets.
// Renders each design at print resolution from script.js (same pipeline as
// the social posts), uploads it to Printify, creates the product with a
// UK-first print provider, and writes printify-result.json with the IDs
// needed for netlify/functions/catalog.json. Safe to re-run: products that
// already exist (matched by title) are skipped but still reported.
const fs = require("fs");
const path = require("path");
const { loadSiteData, prepareFonts } = require("./lib.js");
const { Resvg } = require("@resvg/resvg-js");

const KEY = process.env.PRINTIFY_API_KEY;
let SHOP = process.env.PRINTIFY_SHOP_ID; // optional — auto-detected when absent
if (!KEY) { console.error("Missing PRINTIFY_API_KEY"); process.exit(1); }

const EU = ["LV","CZ","DE","NL","PL","ES","IT","FR","IE","SE","AT","BE","PT","DK","FI","EE","LT","SK","SI","HR","RO","BG","HU","LU","GR","MT","CY"];

async function api(p, method = "GET", body) {
  const r = await fetch("https://api.printify.com/v1" + p, {
    method,
    headers: { Authorization: "Bearer " + KEY, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(method + " " + p + " -> " + r.status + " " + (await r.text()).slice(0, 300));
  return r.json();
}

const KINDS = {
  print:   { label: "Wall print", px: 3600, patterns: [/giclee|giclée/i, /matte.*poster/i, /premium.*poster/i, /art print/i, /poster/i], avoid: /silk|outdoor|gloss|foam|canvas|fabric/i, square: true, sizePref: [12, 14, 10] },
  sticker: { label: "Sticker",    px: 1800, patterns: [/kiss-?cut sticker(?!.*sheet)/i, /kiss-?cut/i, /(?<!bumper )sticker/i], avoid: /sheet|bumper|holographic/i, square: true, sizePref: [4, 3] },
  mug:     { label: "Mug",        px: 1800, patterns: [/white ceramic mug/i, /^ceramic mug/i, /mug.*11\s*oz/i, /^mug/i], avoid: /black|colou?r|accent|two-tone|enamel|travel|espresso|latte|camp|magic|frosted/i, square: false, sizePref: [11] },
};

function kindOf(num) {
  if (/Wall print/.test(num)) return "print";
  if (/Sticker|Pin \/ sticker/.test(num)) return "sticker";
  if (/Mug/.test(num)) return "mug";
  return null;
}
const slug = (w) => w.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const dims = (title) => { const m = title.match(/(\d+(?:\.\d+)?)\s*(?:″|"|in)?\s*[x×]\s*(\d+(?:\.\d+)?)/i); return m ? [+m[1], +m[2]] : null; };

const providerCache = {};
async function providerCountry(id) {
  if (!providerCache[id]) providerCache[id] = (await api(`/catalog/print_providers/${id}.json`)).location?.country || "?";
  return providerCache[id];
}

// Pick blueprint + provider (GB first, then EU) + variant for a kind.
async function pickTarget(kind, blueprints) {
  const K = KINDS[kind];
  for (const pat of K.patterns) {
    const cands = blueprints.filter((b) => pat.test(b.title) && !(K.avoid && K.avoid.test(b.title)));
    for (const bp of cands) {
      let provs;
      try { provs = await api(`/catalog/blueprints/${bp.id}/print_providers.json`); } catch { continue; }
      const scored = [];
      for (const pr of provs) {
        const c = await providerCountry(pr.id);
        if (c === "GB") scored.push([0, pr]);
        else if (EU.includes(c)) scored.push([1, pr]);
      }
      scored.sort((a, b) => a[0] - b[0]);
      for (const [, pr] of scored) {
        let vres;
        try { vres = await api(`/catalog/blueprints/${bp.id}/print_providers/${pr.id}/variants.json`); } catch { continue; }
        const vars = vres.variants || [];
        let pick = null;
        if (kind === "mug") {
          pick = vars.find((v) => /11\s*oz/i.test(v.title)) || vars[0];
        } else {
          const squares = vars.filter((v) => { const d = dims(v.title); return d && Math.abs(d[0] - d[1]) < 0.01; });
          for (const s of K.sizePref) { pick = squares.find((v) => Math.abs(dims(v.title)[0] - s) < 0.01); if (pick) break; }
          if (!pick) pick = squares[0];
        }
        if (pick && pick.placeholders && pick.placeholders.length) {
          return { blueprint: bp, provider: pr, variant: pick, country: await providerCountry(pr.id) };
        }
      }
    }
  }
  return null;
}

(async () => {
  if (!SHOP) {
    const shops = await api("/shops.json");
    if (!shops.length) { console.error("No shops on this Printify account"); process.exit(1); }
    SHOP = shops[0].id;
    console.log("auto-detected shop:", shops[0].title, "(id " + SHOP + ")");
  }
  const fontFiles = await prepareFonts(path.join(__dirname, ".fonts"));
  const logoURI = "data:image/png;base64," + fs.readFileSync(path.join(__dirname, "../../assets/frog-logic-mark-sm.png")).toString("base64");
  const { PRODUCTS } = loadSiteData();
  const wave = PRODUCTS.filter((p) => kindOf(p.num));
  console.log("first wave:", wave.length, "items");

  const blueprints = await api("/catalog/blueprints.json");
  const targets = {};
  for (const kind of Object.keys(KINDS)) {
    targets[kind] = await pickTarget(kind, blueprints);
    if (!targets[kind]) { console.error("NO TARGET for", kind); process.exit(1); }
    const t = targets[kind];
    console.log(kind, "->", t.blueprint.title, "| provider:", t.provider.title, "(" + t.country + ") | variant:", t.variant.title);
  }

  // Existing products (idempotency)
  const existing = {};
  for (let page = 1; ; page++) {
    const res = await api(`/shops/${SHOP}/products.json?limit=50&page=${page}`);
    (res.data || []).forEach((pr) => (existing[pr.title] = pr));
    if (!res.data || res.data.length < 50) break;
  }

  const results = [], errors = [];
  for (const p of wave) {
    const kind = kindOf(p.num);
    const K = KINDS[kind];
    const numPrefix = p.num.split("—")[0].trim();
    const catalogId = numPrefix + "-" + slug(p.word);
    const title = `${p.word} — Frog Logic ${K.label}`;
    try {
      const t = targets[kind];
      const ph = t.variant.placeholders[0];
      let productId, variantId = t.variant.id;
      // A product with this title but the wrong blueprint (e.g. the earlier
      // black-mug / silk-poster picks) gets deleted and recreated properly.
      if (existing[title] && existing[title].blueprint_id !== t.blueprint.id) {
        await api(`/shops/${SHOP}/products/${existing[title].id}.json`, "DELETE");
        console.log("deleted (wrong blueprint):", title);
        delete existing[title];
      }
      if (existing[title]) {
        productId = existing[title].id;
        const ev = (existing[title].variants || []).find((v) => v.is_enabled) || (existing[title].variants || [])[0];
        if (ev) variantId = ev.id;
        console.log("exists:", title);
      } else {
        const inner = p.svg
          .replace(/href="assets\/frog-logic-mark-sm\.png"/g, `href="${logoURI}"`)
          .replace(/<svg viewBox="0 0 300 300">/, "");
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${K.px}" height="${K.px}" viewBox="0 0 300 300"><rect width="300" height="300" fill="${p.bg}"/>` + inner;
        const png = new Resvg(svg, { fitTo: { mode: "width", value: K.px }, font: { fontFiles, loadSystemFonts: false, defaultFontFamily: "Fraunces" } }).render().asPng();
        const up = await api("/uploads/images.json", "POST", { file_name: catalogId + ".png", contents: Buffer.from(png).toString("base64") });
        const scale = Math.min(1, ph.height / ph.width); // square image fitted inside the print area
        const pence = Math.round(parseFloat(p.price.replace(/[^0-9.]/g, "")) * 100);
        const created = await api(`/shops/${SHOP}/products.json`, "POST", {
          title,
          description: p.line + " — " + p.word + ", from the Frog Logic feelings collection.",
          blueprint_id: t.blueprint.id,
          print_provider_id: t.provider.id,
          variants: [{ id: t.variant.id, price: pence, is_enabled: true }],
          print_areas: [{ variant_ids: [t.variant.id], placeholders: [{ position: ph.position, images: [{ id: up.id, x: 0.5, y: 0.5, scale, angle: 0 }] }] }],
        });
        productId = created.id;
        console.log("created:", title, "->", productId);
      }
      results.push({ id: catalogId, num: p.num, word: p.word, kind, printifyProductId: productId, printifyVariantId: variantId, blueprint: targets[kind].blueprint.title, provider: targets[kind].provider.title });
    } catch (e) {
      console.error("FAILED:", title, "-", e.message);
      errors.push({ id: catalogId, error: e.message });
    }
  }

  fs.writeFileSync(path.join(__dirname, "printify-result.json"), JSON.stringify({ createdAt: new Date().toISOString(), results, errors }, null, 2));
  console.log(`done: ${results.length} ok, ${errors.length} failed`);
  if (errors.length) process.exit(1);
})().catch((e) => { console.error(e); process.exit(1); });
