// Downloads a few Printify mockups of each Socially Hibernating bundle product
// so they can be checked before anything is published (16 Oct 2026). The
// mockup library page is too heavy to screenshot with 25 variants, and
// Printify's image host can't be reached from Claude's workspace.
// Read-only. Saves automation/social/xmas-bundle-mockups/<key>-<camera>-<colour>.jpg.
const fs = require("fs");
const path = require("path");

const KEY = process.env.PRINTIFY_API_KEY;
if (!KEY) { console.error("Missing PRINTIFY_API_KEY"); process.exit(1); }
// STORE=site: the copies in the website's store, into xmas-bundle-mockups/site/.
const SITE = process.env.STORE === "site";
const OUT = path.join(__dirname, "xmas-bundle-mockups", SITE ? "site" : "");
const result = JSON.parse(fs.readFileSync(path.join(__dirname, SITE ? "xmas-bundle-site-result.json" : "xmas-bundle-result.json"), "utf8"));
const STORE_ID = SITE ? result.siteStore : result.etsyStore;

async function api(p) {
  const r = await fetch("https://api.printify.com/v1" + p, { headers: { Authorization: "Bearer " + KEY, "User-Agent": "frog-logic-bot/1.0" } });
  if (!r.ok) throw new Error(p + " -> " + r.status);
  return r.json();
}
const camera = (src) => (src.match(/camera_label=([^&]+)/) || [])[1] || "x";
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  for (const r of result.results) {
    const prod = await api(`/shops/${STORE_ID}/products/${r.printifyProductId}.json`);
    // Only enabled variants: an image lists every variant it fits, disabled
    // ones included, so the first id isn't necessarily a colour on sale.
    const byVariant = new Map((prod.variants || []).filter((v) => v.is_enabled).map((v) => [v.id, v.title]));
    const seen = new Set();
    for (const img of prod.images || []) {
      const vid = img.variant_ids.find((id) => byVariant.has(id));
      const vt = byVariant.get(vid) || "";
      const colour = vt.split("/")[0].trim();
      const key = `${camera(img.src)}-${colour}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const res = await fetch(img.src);
      if (!res.ok) { console.log(`  skip ${key}: ${res.status}`); continue; }
      const file = `${r.key}-${slug(camera(img.src))}-${slug(colour)}.jpg`;
      fs.writeFileSync(path.join(OUT, file), Buffer.from(await res.arrayBuffer()));
      console.log(`${file}  (${img.is_default ? "default" : ""} ${img.is_selected_for_publishing ? "selected" : ""})`);
    }
  }
})().catch((e) => { console.error(e); process.exit(1); });
