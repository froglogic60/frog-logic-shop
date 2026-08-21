// One-off: create first-wave Printify products (wall prints, stickers, mugs).
// Runs in GitHub Actions with PRINTIFY_API_KEY + PRINTIFY_SHOP_ID secrets.
// Renders each design at print resolution from script.js (same pipeline as
// the social posts), uploads it to Printify, creates the product with a
// UK-first print provider, and writes printify-result.json with the IDs
// needed for netlify/functions/catalog.json. Safe to re-run: products that
// already exist (matched by title) are skipped but still reported.
const fs = require("fs");
const path = require("path");
const { loadSiteData } = require("./lib.js");
const { makeBrowserRenderer } = require("./gfonts.js");

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

// Prints need care: many poster blueprints are portrait-only, glossy, or
// framed (base cost above the £12 price). Score every square option in
// GB/EU and pick the best unframed, matte-leaning one near 12".
async function pickPrintTarget(blueprints) {
  const opts = [];
  const cands = blueprints.filter((b) => /poster|art print|giclee|giclée/i.test(b.title) && !/canvas|foam|fabric|outdoor|silk|framed|hanger/i.test(b.title));
  for (const bp of cands) {
    let provs; try { provs = await api(`/catalog/blueprints/${bp.id}/print_providers.json`); } catch { continue; }
    for (const pr of provs) {
      const c = await providerCountry(pr.id);
      if (c !== "GB" && !EU.includes(c)) continue;
      let vres; try { vres = await api(`/catalog/blueprints/${bp.id}/print_providers/${pr.id}/variants.json`); } catch { continue; }
