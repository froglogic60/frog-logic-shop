// One-shot. Puts the printable sticker sheet on the shop.
//
// Printed stickers are the one thing print-on-demand is genuinely bad at:
// £5.46 to make one and £6.49 to post the first, against a £3.50 price. The
// same artwork sold as a printable sheet costs nothing to make, nothing to
// post, and arrives in a minute.
//
// This adds it as D31 in script.js and as a digital entry in catalog.json.
// Safe to delete once run. Every step asserts, and re-running it changes
// nothing.
//
// The PDF itself is built separately:
//   node automation/pdf/sticker-sheet.js      content from the shop's artwork
//   python3 automation/pdf/build.py --all     render it
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "../..");
const SCRIPT = path.join(ROOT, "script.js");
const CATALOG = path.join(ROOT, "netlify/functions/catalog.json");

const NUM = "D31 — Printable PDF";
const WORD = "Frog Logic Stickers";
const PRICE = "£4.50";
const FILE = "Frog-Logic-Stickers.pdf";
const ID = "d31-frog-logic-stickers";

// A sheet of squares waiting to be cut out, in the collection's own colours.
// Deliberately not a picture of one sticker: the product is all of them.
const ENTRY = `  {
    num: "${NUM}", word: "${WORD}",
    line: "Every design in the sticker collection, to print at home on whatever paper you already have. Eighteen designs across two sheets, 54mm square.",
    price: "${PRICE}", link: "#", bg: "#2F5D50",
    svg: \`<svg viewBox="0 0 300 300">\${grain("d31", 0.1)}
      <g stroke="\${CREAM}" stroke-width="1" stroke-dasharray="4 4" opacity="0.55" fill="none">
        <rect x="42" y="52" width="66" height="66"/><rect x="117" y="52" width="66" height="66"/><rect x="192" y="52" width="66" height="66"/>
        <rect x="42" y="127" width="66" height="66"/><rect x="192" y="127" width="66" height="66"/>
      </g>
      <rect x="117" y="127" width="66" height="66" fill="\${GOLD}"/>
      <text x="150" y="167" text-anchor="middle" font-family="Anton, sans-serif" font-size="17" fill="#1A1A1A">CUT</text>
      <text x="150" y="228" text-anchor="middle" font-family="Anton, sans-serif" font-size="34" fill="\${CREAM}">PRINT YOUR OWN</text>
      <text x="150" y="252" text-anchor="middle" font-family="Space Mono, monospace" font-size="8" fill="\${GOLD}" letter-spacing="0.12em">EIGHTEEN DESIGNS · TWO SHEETS</text>
      <rect width="300" height="300" fill="url(#d31)"/>\${mark()}</svg>\`
  },
];`;

// ---- script.js ----
let src = fs.readFileSync(SCRIPT, "utf8");
if (src.includes(`word: "${WORD}"`)) {
  console.log("script.js: already there");
} else {
  // The array ends with the only "\n];" that follows the last digital product.
  const anchor = '<rect width="300" height="300" fill="url(#d30)"/>${mark()}</svg>`\n  },\n];';
  const n = src.split(anchor).length - 1;
  if (n !== 1) throw new Error(`script.js: expected 1 anchor after D30, found ${n}`);
  src = src.replace(anchor, anchor.replace(/\n\];$/, "\n") + ENTRY);
  fs.writeFileSync(SCRIPT, src);
  console.log(`script.js: added ${NUM}`);
}

// ---- catalog.json ----
const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
if (catalog.some((x) => x.id === ID)) {
  console.log("catalog.json: already there");
} else {
  catalog.push({
    id: ID,
    name: WORD,
    price: Number(PRICE.replace(/[^0-9.]/g, "")),
    type: "digital",
    currency: "gbp",
    file: FILE,
  });
  fs.writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + "\n");
  console.log(`catalog.json: added ${ID}`);
}

// ---- checks ----
const problems = [];
const after = fs.readFileSync(SCRIPT, "utf8");
const cat = JSON.parse(fs.readFileSync(CATALOG, "utf8"));

if ((after.split(`word: "${WORD}"`).length - 1) !== 1) problems.push("script.js does not have exactly one entry");
const entry = cat.find((x) => x.id === ID);
if (!entry) problems.push("catalog.json has no " + ID);
if (entry && entry.price !== 4.5) problems.push("catalog price is " + entry.price);
if (entry && entry.file !== FILE) problems.push("catalog file is " + entry.file);
// The download link is built from this filename, so a missing PDF is a paying
// customer with a 404. Build it before this runs, not after.
if (!fs.existsSync(path.join(ROOT, "digital", FILE))) problems.push(`digital/${FILE} does not exist yet`);
if (cat.filter((x) => x.type === "digital").length !== 54) problems.push("expected 54 digital entries, got " + cat.filter((x) => x.type === "digital").length);

if (problems.length) {
  console.error("\nREFUSING — checks failed:");
  problems.forEach((p) => console.error("  ! " + p));
  process.exit(1);
}
console.log("\nall checks passed");
