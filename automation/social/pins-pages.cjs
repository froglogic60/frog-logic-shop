// One Pinterest pin per product page, plus the spreadsheet Pinterest's bulk
// upload takes (Settings → Import content). Built 13 Oct 2026 for "lets get
// this business seen!": every piece, download and free guide now has its own
// page at froglogic.co.uk/p/<slug>/, so every pin can point at the exact thing
// rather than the shop's front door.
//
// The images are committed to the repo by the "Build the Pinterest pins"
// workflow and served from raw.githubusercontent.com, which is public — so the
// spreadsheet's Media URL column works without a site deploy and without Sam
// touching a file picker. Pinterest's columns (help.pinterest.com, "Bulk upload
// Pins"): Title, Media URL, Pinterest board, Thumbnail, Description, Link,
// Publish date, Keywords. Publish date is UTC, e.g. 2026-10-14T18:00:00.
//
//   node pins-pages.cjs                   build everything into pins-pages/
//   START=2026-10-14 node pins-pages.cjs  first publish date (default: tomorrow)
//   SKIP_IMAGES=1 node pins-pages.cjs     spreadsheet only
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { ensureFonts, fontFaceCSS } = require("./gfonts.js");

const ROOT = path.join(__dirname, "..", "..");
const OUT = path.join(__dirname, "pins-pages");
const RAW = "https://raw.githubusercontent.com/froglogic60/frog-logic-shop/main/automation/social/pins-pages";
const SITE = "https://froglogic.co.uk";
const W = 1000, H = 1500;
const CREAM = "#F4EFE3", INK = "#1A1A1A", GOLD = "#E8B63C";
const PER_DAY = ["08:00:00", "10:30:00", "15:00:00", "18:00:00", "20:30:00"]; // UTC; the existing queue posts at 12:00

const BOARDS = {
  download: "Printable planners & trackers",
  guide: "Free neurodivergence guides (The Pond Guides)",
  frog: "Cute frog gifts for neurodivergent brains",
  words: "Words for how it actually feels — neurodivergent prints, tees & mugs",
};

function loadShop() {
  const src = fs.readFileSync(path.join(ROOT, "script.js"), "utf8");
  const ctx = { document: { getElementById: () => null, addEventListener() {}, querySelectorAll: () => [], body: { addEventListener() {}, classList: { toggle() {} } } }, window: {}, fetch: async () => ({ ok: false }), alert() {}, setTimeout, console };
  vm.createContext(ctx);
  vm.runInContext(src + "\n;__shop={PRODUCTS,DIGITAL_PRODUCTS,GUIDES,PROFESSIONAL,ORGANISATION,pageSlug,guideSvg};", ctx);
  return ctx.__shop;
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const kindOf = (num) => { const m = /—\s*(.+)$/.exec(num || ""); return m ? m[1].trim() : num; };
function wrap(text, maxChars) {
  const words = String(text).split(/\s+/); const lines = []; let cur = "";
  for (const w of words) { if ((cur + " " + w).trim().length > maxChars && cur) { lines.push(cur); cur = w; } else cur = (cur + " " + w).trim(); }
  if (cur) lines.push(cur); return lines;
}
function hookLinesFor(line, maxLines, maxChars) {
  const first = String(line || "").split(/(?<=[.!?])\s+/)[0].trim();
  const lines = wrap(first, maxChars);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines); let last = kept[maxLines - 1];
  const clause = Math.max(last.lastIndexOf(" — "), last.lastIndexOf(","), last.lastIndexOf(";"));
  if (clause > last.length * 0.4) last = last.slice(0, clause).replace(/[,;]$/, "");
  else while (last.length > maxChars - 1 && last.includes(" ")) last = last.slice(0, last.lastIndexOf(" "));
  kept[maxLines - 1] = last.trim().replace(/[.,;:—-]$/, "") + "…"; return kept;
}

// ---- what each pin says. A pin title is a search query, not a shelf label.
function pinCopy(e) {
  const w = e.item.word, line = String(e.item.line || "").trim(), price = e.item.price;
  const tail = "From Frog Logic — made by one neurodivergent person in the UK.";
  if (e.group === "guide") return {
    eyebrow: "FREE GUIDE · PLAIN ENGLISH", foot: "free",
    title: `${w} explained — a free, plain-English guide for the person and the people around them`,
    description: `${line} A free PDF: no email, no sign-up. Written for the person it's about and for partners, parents, teachers, managers and GPs. One of 23 Pond Guides. ${tail}`,
    keywords: `${w.toLowerCase()}, neurodivergent, autism, adhd, free guide, printable, plain english`,
  };
  if (e.group === "bespoke") return {
    eyebrow: "MADE TO ORDER · BUILT FOR ONE BRAIN", foot: price,
    title: "The Bespoke Planner | A printable planner built for your brain (ADHD, autism, AuDHD)",
    description: `Answer fifteen questions and get a printable PDF planner assembled for how your brain actually works: your words on the pages, a hard-day page to hand to someone, your routines as tick-lists, spoons or battery tracking. Undated, so print it forever. £25. ${tail}`,
    keywords: "adhd planner, neurodivergent planner, autism planner printable, executive dysfunction planner, custom planner",
  };
  if (e.group === "set") return {
    eyebrow: "FOR PROFESSIONALS · 23 GUIDES", foot: price,
    title: "The Pond Guides, complete set | 23 plain-English neurodivergence guides in one PDF",
    description: `All 23 Pond Guides in one file for teachers, GPs, managers, SENCOs and support workers — autism, ADHD, AuDHD, dyslexia, dyspraxia, PDA, OCD and more, each explained warmly. Instant download, ${price}. ${tail}`,
    keywords: "neurodiversity guide, senco resources, teacher resources, neurodivergent staff, plain english guides",
  };
  if (e.group === "org") return {
    eyebrow: "FOR ORGANISATIONS · DIGITAL LICENCE", foot: "from £95",
    title: "The Organisation Pack | printable neurodivergence tools with a licence for your team or service",
    description: `Seventeen printable tools and all 23 Pond Guides in one 79-page file, with a plain-English licence to print them for everyone you support. Team £95, Service £195, Organisation £395. Instant download, invoice on request. ${tail}`,
    keywords: "neurodiversity resources, workplace neurodiversity, senco, occupational therapy resources, neurodivergent staff",
  };
  if (e.group === "digital") return {
    eyebrow: "PRINTABLE PDF · INSTANT DOWNLOAD", foot: price,
    title: `${w} | Printable PDF for ADHD, autistic and neurodivergent adults`,
    description: `${line} Print it at home as many times as you like. Instant download, ${price}. ${tail}`,
    keywords: `${w.toLowerCase()}, printable, adhd, autism, neurodivergent, planner, pdf`,
  };
  const kind = kindOf(e.item.num).toLowerCase();
  const nouns = { "tee": "t-shirt", "mug": "mug", "wall print": "wall print", "tote": "tote bag", "notebook": "notebook", "water bottle": "water bottle" };
  const noun = nouns[kind] || kind;
  return {
    eyebrow: `${kind.toUpperCase()} · PRINTED TO ORDER IN THE UK`, foot: price,
    title: `${w} ${noun} | ${e.item.frog ? "cute frog" : "neurodivergent-affirming"} ${noun} for ADHD and autistic adults`,
    description: `${line} ${e.item.frog ? "One of the Comfort & Chaos frogs." : "The word is the artwork — said by us, not about us."} Printed to order in the UK, ${price}${/tee|mug/.test(kind) ? ", free UK delivery" : ""}. ${tail}`,
    keywords: `${w.toLowerCase()}, neurodivergent ${noun}, adhd gift, autism gift, ${e.item.frog ? "frog " + noun : "typography " + noun}`,
  };
}

function pinSvg(e, copy, logoData) {
  const art = String(e.svg).replace(/href="\/?assets\/frog-logic-mark-sm\.png"/g, `href="${logoData}"`).replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  const panelH = 460, panelY = H - panelH;
  const title = wrap(e.group === "guide" ? `${e.item.word}, explained warmly` : e.item.word, 24).slice(0, 3);
  const titleSize = title.length > 2 ? 52 : title.length > 1 ? 64 : 76;
  const lead = titleSize * 1.1, titleTop = panelY + 120, titleEnd = titleTop + (title.length - 1) * lead;
  const hook = hookLinesFor(e.item.line, title.length > 2 ? 2 : 3, 46);
  const hookTop = titleEnd + 60;
  const scale = W / 300, artY = (panelY - W) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${e.item.bg}"/>
  <g transform="translate(0,${artY}) scale(${scale})">${art}</g>
  <rect x="0" y="${panelY}" width="${W}" height="${panelH}" fill="${INK}"/>
  <text x="70" y="${panelY + 52}" font-family="Space Mono" font-size="24" letter-spacing="3" fill="${GOLD}">${esc(copy.eyebrow)}</text>
  ${title.map((l, i) => `<text x="70" y="${titleTop + i * lead}" font-family="Fraunces" font-size="${titleSize}" font-weight="600" fill="${CREAM}">${esc(l)}</text>`).join("\n  ")}
  ${hook.map((l, i) => `<text x="70" y="${hookTop + i * 38}" font-family="Space Grotesk" font-size="28" fill="${CREAM}" opacity="0.82">${esc(l)}</text>`).join("\n  ")}
  <text x="70" y="${H - 52}" font-family="Space Mono" font-size="30" fill="${GOLD}">${esc(copy.foot)}</text>
  <text x="${W - 70}" y="${H - 52}" text-anchor="end" font-family="Space Mono" font-size="24" fill="${CREAM}" opacity="0.7">froglogic.co.uk</text>
</svg>`;
}

function collect(shop) {
  const abs = (s) => String(s).replace(/href="assets\//g, 'href="/assets/');
  const out = [];
  const push = (item, group, svg, board) => out.push({ item, group, svg: abs(svg), slug: shop.pageSlug(item), board });
  // Order = publish order: the planner, then the free guides (they travel),
  // then the downloads, then the physical pieces.
  for (const p of shop.DIGITAL_PRODUCTS.filter((x) => x.feature)) push(p, "bespoke", p.svg, BOARDS.download);
  for (const g of shop.GUIDES) push(g, "guide", shop.guideSvg(g), BOARDS.guide);
  for (const p of shop.DIGITAL_PRODUCTS.filter((x) => !x.feature)) push(p, "digital", p.svg, BOARDS.download);
  for (const p of shop.PROFESSIONAL) push(p, "set", p.svg, BOARDS.guide);
  if (shop.ORGANISATION.length) push(shop.ORGANISATION[0], "org", shop.ORGANISATION[0].svg, BOARDS.guide);
  for (const p of shop.PRODUCTS.filter((x) => !x.retired && !x.halloween)) push(p, "physical", p.svg, p.frog ? BOARDS.frog : BOARDS.words);
  // Halloween pieces retire on 31 Oct; a pin scheduled past that would sell nothing.
  return out;
}

const csvCell = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;

(async () => {
  const shop = loadShop();
  const entries = collect(shop);
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  const start = process.env.START ? new Date(process.env.START + "T00:00:00Z") : new Date(Date.now() + 86400000);
  const day0 = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const rows = [["Title", "Media URL", "Pinterest board", "Thumbnail", "Description", "Link", "Publish date", "Keywords"]];
  const manifest = [];
  entries.forEach((e, i) => {
    const copy = pinCopy(e);
    const d = new Date(day0 + Math.floor(i / PER_DAY.length) * 86400000).toISOString().slice(0, 10);
    const when = `${d}T${PER_DAY[i % PER_DAY.length]}`;
    const file = `${e.slug}.png`;
    rows.push([copy.title.slice(0, 100), `${RAW}/${file}`, e.board, "", copy.description.slice(0, 500), `${SITE}/p/${e.slug}/?ref=pinterest`, when, copy.keywords]);
    manifest.push({ file, slug: e.slug, group: e.group, when, title: copy.title.slice(0, 100) });
    e.copy = copy;
  });
  fs.writeFileSync(path.join(OUT, "pins-pages.csv"), rows.map((r) => r.map(csvCell).join(",")).join("\n") + "\n");
  fs.writeFileSync(path.join(OUT, "pins-pages.json"), JSON.stringify(manifest, null, 2) + "\n");

  if (process.env.SKIP_IMAGES === "1") { console.log(`${entries.length} rows, no images`); return; }
  const fontDir = path.join(__dirname, ".gfonts");
  await ensureFonts(fontDir);
  const css = fontFaceCSS(fontDir);
  const logoData = "data:image/png;base64," + fs.readFileSync(path.join(ROOT, "assets", "frog-logic-mark-sm.png")).toString("base64");
  let chromium; try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require("playwright-core")); }
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const ctx = await browser.newContext({ viewport: { width: W, height: H } });
  const page = await ctx.newPage();
  for (const e of entries) {
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${css}
html,body{margin:0;padding:0}.stage{width:${W}px;height:${H}px;overflow:hidden}.stage svg{display:block;width:100%;height:100%}</style></head><body><div class="stage">${pinSvg(e, e.copy, logoData)}</div></body></html>`, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(80);
    await (await page.$(".stage")).screenshot({ path: path.join(OUT, `${e.slug}.png`), type: "png" });
  }
  await browser.close();
  console.log(`${entries.length} pins built in ${OUT}, scheduled ${manifest[0].when} → ${manifest[manifest.length - 1].when}`);
})().catch((e) => { console.error(e); process.exit(1); });
