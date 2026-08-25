// Build the printable sticker sheet's content file from the shop's own artwork.
//
// Printing stickers on demand is a bad business: £5.46 to make a £3.50 sticker
// and £6.49 to post the first one. Selling the same artwork as a printable
// sheet costs nothing to make, nothing to post, and arrives in a minute — the
// exact inverse of the problem.
//
// The designs already exist in script.js, so this reads them from there rather
// than keeping a second copy that can drift. Run it again whenever a sticker is
// added, renamed or redrawn, then rebuild the PDF:
//
//   node automation/pdf/sticker-sheet.js
//   python3 automation/pdf/build.py frog-logic-stickers
//
// Nine to an A4 page at 54mm square, which is a comfortable size to cut out and
// fits a laptop lid or a water bottle without dominating it.
const fs = require("fs");
const path = require("path");
const { loadSiteData } = require("../social/lib.js");

const OUT = path.join(__dirname, "products", "frog-logic-stickers.json");
const PER_PAGE = 9;

const { PRODUCTS } = loadSiteData();

// Both the plain stickers and the one pin/sticker crossover. The artwork is the
// product here, not the substrate.
const stickers = PRODUCTS.filter((p) => /sticker/i.test(p.num));
if (!stickers.length) {
  console.error("No sticker products found in script.js — nothing to build.");
  process.exit(1);
}

const pages = [];
for (let i = 0; i < stickers.length; i += PER_PAGE) {
  pages.push(stickers.slice(i, i + PER_PAGE));
}

const spec = {
  id: "frog-logic-stickers",
  output: "digital/Frog-Logic-Stickers.pdf",
  title: "Frog Logic Stickers",
  subtitle: "PRINT THEM YOURSELF",
  licence:
    "For your own personal use — print them as many times as you like, for yourself and your household. " +
    "Please don't resell, redistribute, or share the file itself. © Frog Logic",
  sheets: pages.map((page, i) => ({
    type: "tiles",
    label: pages.length > 1 ? `SHEET ${i + 1} OF ${pages.length}` : "PRINT THEM YOURSELF",
    ...(i === 0
      ? {
          intro:
            "Every design in the sticker collection, to print at home. Sticker paper from any stationers " +
            "works, and so does ordinary paper with a glue stick. Cut along the dashed lines — or round " +
            "the corners, which makes them last longer on a water bottle.",
        }
      : {}),
    note:
      i === pages.length - 1
        ? "PRINT AT 100% · DO NOT SCALE TO FIT · EACH SQUARE IS 54 × 54 MM"
        : "CUT ALONG THE DASHED LINES",
    tiles: page.map((p) => ({
      name: p.word,
      bg: p.bg,
      svg: p.svg,
    })),
  })),
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(spec, null, 2) + "\n");
console.log(
  `${stickers.length} sticker designs across ${pages.length} sheet(s) -> ${path.relative(path.join(__dirname, "../.."), OUT)}`
);
stickers.forEach((p) => console.log("  " + p.word));
