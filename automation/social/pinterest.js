// Pinterest pins for the digital downloads.
//
// Why these products and why Pinterest: printable planners and trackers are one
// of the things people actively search Pinterest for, the pins keep pulling
// traffic for months rather than dying in an hour, and every click lands on
// shop.froglogic.co.uk rather than a marketplace that takes a cut. The
// downloads also cost nothing to fulfil, so a sale is a sale.
//
// This only builds the pins. Pinterest's API cannot post them for us yet:
// Trial access renders everything sandboxed and visible to nobody, and
// Standard access needs a review with a demo video. So the output here is a
// folder of finished 1000x1500 images plus pins.json holding the title,
// description and destination link for each one, ready to upload.
//
//   node pinterest.js              build every pin into automation/social/.pins
//   LIMIT=3 node pinterest.js      build the first three, for checking
//
// 1000x1500 is Pinterest's 2:3 ratio. Anything squarer gets cropped in the
// feed; anything longer gets truncated.
const fs = require("fs");
const path = require("path");
const { loadSiteData } = require("./lib.js");
const { ensureFonts, fontFaceCSS } = require("./gfonts.js");

const W = 1000;
const H = 1500;
const CREAM = "#F4EFE3";
const INK = "#1A1A1A";
const GOLD = "#E8B63C";

const OUT = path.join(__dirname, ".pins");
const SITE = "https://shop.froglogic.co.uk/#digital";

// Products whose pin is deliberately not built. A Pinterest description is
// public, indexed and durable, so anything unresolved in the product copy gets
// worse here, not better. Clear the entry once the copy is settled.
const HOLD = {
  "Show These Cards":
    "the product line names the Sunflower lanyard, which is a registered trademark — flagged 23 Aug and still unresolved. Needs Sam's wording before it goes in a public description.",
};

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function wrap(text, maxChars) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxChars && cur) { lines.push(cur); cur = w; }
    else cur = (cur + " " + w).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// "D18 — Printable PDF" -> "Printable PDF"
function kindOf(num) {
  const m = /—\s*(.+)$/.exec(num || "");
  return m ? m[1].trim() : "Printable PDF";
}

// The first sentence of the product line is the hook; the rest is detail that
// belongs in the description rather than on the image.
//
// Wrap first, then trim — a character budget is not a line budget, because
// wrapping breaks early and the same 138 characters can need three lines or
// four. Trimming against the wrapped result means the last visible line always
// ends deliberately: text that simply stops mid-phrase reads as a bug, where an
// ellipsis reads as "there's more".
function hookLinesFor(line, maxLines, maxChars) {
  const first = String(line || "").split(/(?<=[.!?])\s+/)[0].trim();
  const lines = wrap(first, maxChars);
  if (lines.length <= maxLines) return lines;

  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1];
  // Prefer cutting at a clause break in the last line — it reads as a pause
  // rather than a machine running out of room.
  const clause = Math.max(last.lastIndexOf(" — "), last.lastIndexOf(","), last.lastIndexOf(";"));
  if (clause > last.length * 0.4) {
    last = last.slice(0, clause).replace(/[,;]$/, "");
  } else {
    while (last.length > maxChars - 1 && last.includes(" ")) last = last.slice(0, last.lastIndexOf(" "));
  }
  kept[maxLines - 1] = last.trim().replace(/[.,;:—-]$/, "") + "…";
  return kept;
}

// The artwork sits square and uncropped at the top; the caption panel takes the
// remaining 460px. Sizes step down as the title wraps so the panel never
// overflows — a pin whose text runs off the bottom looks broken in the feed.
function pinSvg(p, logoData) {
  const art = String(p.svg)
    .replace(/href="assets\/frog-logic-mark-sm\.png"/g, `href="${logoData}"`)
    .replace(/^<svg[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "");

  const panelH = 460;
  const panelY = H - panelH;

  const title = wrap(p.word, 24).slice(0, 3);
  const titleSize = title.length > 2 ? 52 : title.length > 1 ? 64 : 76;
  const titleLead = titleSize * 1.1;
  const titleTop = panelY + 120;
  const titleEnd = titleTop + (title.length - 1) * titleLead;

  const hook = hookLinesFor(p.line, title.length > 2 ? 2 : 3, 46);
  const hookTop = titleEnd + 60;

  // The artwork is authored on a 300x300 canvas; square, centred in the space
  // above the panel so nothing is cut off.
  const scale = W / 300;
  const artY = (panelY - W) / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${p.bg}"/>
  <g transform="translate(0,${artY}) scale(${scale})">${art}</g>
  <rect x="0" y="${panelY}" width="${W}" height="${panelH}" fill="${INK}"/>
  <text x="70" y="${panelY + 52}" font-family="Space Mono" font-size="24" letter-spacing="3" fill="${GOLD}">${esc(
    kindOf(p.num).toUpperCase()
  )} · INSTANT DOWNLOAD</text>
  ${title
    .map(
      (l, i) =>
        `<text x="70" y="${titleTop + i * titleLead}" font-family="Fraunces" font-size="${titleSize}" font-weight="600" fill="${CREAM}">${esc(
          l
        )}</text>`
    )
    .join("\n  ")}
  ${hook
    .map(
      (l, i) =>
        `<text x="70" y="${hookTop + i * 38}" font-family="Space Grotesk" font-size="28" fill="${CREAM}" opacity="0.82">${esc(
          l
        )}</text>`
    )
    .join("\n  ")}
  <text x="70" y="${H - 52}" font-family="Space Mono" font-size="30" fill="${GOLD}">${esc(p.price)}</text>
  <text x="${W - 70}" y="${H - 52}" text-anchor="end" font-family="Space Mono" font-size="24" fill="${CREAM}" opacity="0.7">shop.froglogic.co.uk</text>
</svg>`;
}

// Pinterest allows 100 characters of title and 500 of description. Both are
// written as plain sentences rather than stuffed with keywords — Pinterest
// stopped rewarding that years ago and it reads badly to a human.
function copyFor(p) {
  const isSheet = /spreadsheet/i.test(kindOf(p.num));
  // A pipe rather than a dash: several product names already contain an em
  // dash, and "Say It — Communication Scripts — printable PDF" reads badly.
  const title = `${p.word} | ${isSheet ? "Printable tracker" : "Printable PDF"} for neurodivergent adults`.slice(0, 100);
  const format = isSheet
    ? "A spreadsheet you fill in on your computer."
    : "Print it at home as many times as you like.";
  const description = [String(p.line || "").trim(), format, `Instant download, ${p.price}.`, "From Frog Logic — soft landings for busy brains."]
    .join(" ")
    .slice(0, 500);
  return { title, description };
}

(async () => {
  const { DIGITAL_PRODUCTS } = loadSiteData();
  const limit = Number(process.env.LIMIT) || DIGITAL_PRODUCTS.length;
  const items = DIGITAL_PRODUCTS.slice(0, limit);

  const fontDir = path.join(__dirname, ".gfonts");
  await ensureFonts(fontDir);
  const css = fontFaceCSS(fontDir);
  const logoData =
    "data:image/png;base64," +
    fs.readFileSync(path.join(__dirname, "../../assets/frog-logic-mark-sm.png")).toString("base64");

  let chromium;
  try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require("playwright-core")); }
  const browser = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
  );

  fs.mkdirSync(OUT, { recursive: true });
  const manifest = [];

  const held = [];
  for (const p of items) {
    if (HOLD[p.word]) { held.push(`${p.word} — ${HOLD[p.word]}`); continue; }
    const svg = pinSvg(p, logoData);
    const ctx = await browser.newContext({ viewport: { width: W, height: H } });
    const page = await ctx.newPage();
    await page.setContent(
      `<!doctype html><html><head><meta charset="utf-8"><style>${css}
html,body{margin:0;padding:0}
.stage{width:${W}px;height:${H}px;overflow:hidden}
.stage svg{display:block;width:100%;height:100%}</style></head><body><div class="stage">${svg}</div></body></html>`,
      { waitUntil: "load" }
    );
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(120);
    const file = `${slug(p.num.split("—")[0].trim())}-${slug(p.word)}.png`;
    await (await page.$(".stage")).screenshot({ path: path.join(OUT, file), type: "png" });
    await ctx.close();

    const { title, description } = copyFor(p);
    manifest.push({ file, product: p.word, num: p.num, price: p.price, title, description, link: SITE });
    console.log("built", file);
  }

  await browser.close();
  fs.writeFileSync(path.join(OUT, "pins.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log(`\n${manifest.length} pins in ${OUT}`);
  if (held.length) {
    console.log(`\nHELD BACK (${held.length}):`);
    held.forEach((h) => console.log("  ! " + h));
  }
})().catch((e) => { console.error(e); process.exit(1); });
