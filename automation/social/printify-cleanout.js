// Printify clean-out (Sam: "yes build the clean-out", 20 Oct 2026).
//
// The site's Printify store (PRINTIFY_SHOP_ID, NOT the Etsy store) still holds
// thousands of leftovers from the old Replit app. This finds them and, only
// when told to, deletes them.
//
// What is KEPT, always:
//   - any product whose id appears ANYWHERE in this repo (catalog.json incl.
//     the US twins, Christmas sets, stickers, Halloween, every result file) —
//     so nothing the shop sells or has ever wired up can go;
//   - anything created on or after 24 Aug 2026 (when this repo started) — those
//     are listed separately for Sam to decide on, never deleted here;
//   - anything published to a sales channel (visible / external link) — listed
//     separately too.
//
//   MODE=list   (default) read-only: writes printify-cleanout-report.json
//   MODE=delete deletes exactly the "delete" list from a fresh list run, and
//               only if CONFIRM=DELETE. Permanent: Printify has no undo.
const fs = require("fs");
const path = require("path");

const KEY = process.env.PRINTIFY_API_KEY;
let SHOP = process.env.PRINTIFY_SHOP_ID;
const MODE = process.env.MODE || "list";
const ROOT = path.join(__dirname, "..", "..");
const REPORT = path.join(__dirname, "printify-cleanout-report.json");
const CUTOFF = "2026-08-24";
const ETSY_STORE = "29335686";

const api = async (p, method = "GET") => {
  for (let tries = 0; ; tries++) {
    const r = await fetch("https://api.printify.com/v1" + p, { method, headers: { Authorization: "Bearer " + KEY } });
    if (r.status === 429 && tries < 6) { await new Promise((s) => setTimeout(s, 5000 * (tries + 1))); continue; }
    if (!r.ok) throw new Error(`${method} ${p} -> ${r.status} ${(await r.text()).slice(0, 200)}`);
    return method === "DELETE" ? null : r.json();
  }
};

function repoIds() {
  const ids = new Set();
  const walk = (dir) => {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      if ([".git", "node_modules"].includes(f.name)) continue;
      const p = path.join(dir, f.name);
      if (f.isDirectory()) walk(p);
      else if (/\.(json|js|cjs|mjs|html|yml|md|csv|txt)$/.test(f.name) && fs.statSync(p).size < 20e6) {
        for (const m of fs.readFileSync(p, "utf8").matchAll(/\b[0-9a-f]{24}\b/g)) ids.add(m[0]);
      }
    }
  };
  walk(ROOT);
  return ids;
}

(async () => {
  if (!KEY) throw new Error("Missing PRINTIFY_API_KEY");
  if (!SHOP) SHOP = String((await api("/shops.json")).find((s) => !/etsy/i.test(s.sales_channel || "")).id);
  if (String(SHOP) === ETSY_STORE) throw new Error("Refusing to run on the Etsy store");

  const keep = repoIds();
  let page = 1, all = [];
  for (;;) {
    const d = await api(`/shops/${SHOP}/products.json?limit=50&page=${page}`);
    all.push(...d.data);
    if (page >= d.last_page) break;
    page++;
    await new Promise((s) => setTimeout(s, 300));
  }

  const groups = { kept_in_repo: [], recent_ask_sam: [], published_ask_sam: [], delete: [] };
  for (const p of all) {
    const row = { id: p.id, title: p.title, created: (p.created_at || "").slice(0, 10), blueprint: p.blueprint_id };
    const published = p.visible || (p.external && p.external.id);
    if (keep.has(p.id)) groups.kept_in_repo.push(row);
    else if (row.created >= CUTOFF) groups.recent_ask_sam.push(row);
    else if (published) groups.published_ask_sam.push(row);
    else groups.delete.push(row);
  }

  // A plain-words summary: what the deletions are, by the first word or two of the title.
  const byName = {};
  for (const r of groups.delete) {
    const k = r.title.split(/\s+/).slice(0, 2).join(" ");
    byName[k] = (byName[k] || 0) + 1;
  }
  const summary = Object.entries(byName).sort((a, b) => b[1] - a[1]).slice(0, 40);
  const report = {
    checkedAt: new Date().toISOString(), shop: SHOP, total: all.length,
    counts: Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, v.length])),
    deleteByName: summary,
    oldestToDelete: groups.delete.map((r) => r.created).sort()[0] || null,
    newestToDelete: groups.delete.map((r) => r.created).sort().pop() || null,
    recent_ask_sam: groups.recent_ask_sam, published_ask_sam: groups.published_ask_sam,
    delete: groups.delete,
  };
  console.log(JSON.stringify({ total: report.total, counts: report.counts, oldest: report.oldestToDelete, newest: report.newestToDelete, deleteByName: summary.slice(0, 15) }, null, 1));

  if (MODE === "delete") {
    if (process.env.CONFIRM !== "DELETE") throw new Error("MODE=delete needs CONFIRM=DELETE");
    let done = 0, failed = 0;
    for (const r of groups.delete) {
      try { await api(`/shops/${SHOP}/products/${r.id}.json`, "DELETE"); done++; }
      catch (e) { failed++; console.error("FAILED", r.id, e.message); }
      if (done % 50 === 0) console.log(`deleted ${done}/${groups.delete.length}`);
      await new Promise((s) => setTimeout(s, 250));
    }
    report.deleted = done; report.failedDeletes = failed; report.deletedAt = new Date().toISOString();
    console.log(`Deleted ${done}, failed ${failed}`);
  }
  fs.writeFileSync(REPORT, JSON.stringify(report, null, 1) + "\n");
})().catch((e) => { console.error(e); process.exit(1); });
