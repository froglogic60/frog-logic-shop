// One-shot. Two corrections to printify-wave2.js, both from the 24 Aug price
// check (automation/social/printify-wave2-price-check.json):
//
//   1. the hoodie is pinned to Print Clever as well as to the Heavy Blend.
//      Three makers offer the identical Gildan 18500 — Print Clever £28.69,
//      T Shirt and Sons £30.14, Textildruck Europa £24.31 but £7.79 postage
//      from Germany. Print Clever and T Shirt and Sons post identically at
//      £4.49, so postage-ranking could not separate them and was picking the
//      dearer one. £1.45 a hoodie;
//
//   2. the stickers are held back. Printify's base cost is £5.46 against the
//      £3.50 shelf price, so every sale would have lost £1.96 before postage —
//      and postage is £6.49, because the only maker is in the Netherlands and
//      there is no UK one. Sam's call, 24 Aug: create the other 26 and leave
//      the seven ex-pins off the shop until either a UK maker appears or the
//      basket exists, so postage can be shared across a multi-item order.
//
// The sticker configuration is left in place, correct and pinned to wave 1's
// blueprint, maker and variant — only the `hold` line stops it running. Delete
// that one line to bring them back.
//
// Every replacement asserts it matched exactly once, so a half-applied edit
// throws rather than committing. Safe to delete once run.
const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "printify-wave2.js");
let src = fs.readFileSync(FILE, "utf8");
const before = src.length;

const EDITS = [
  [
    "pin the hoodie maker to Print Clever",
    `    pin: { blueprint: /heavy blend|18500/i },`,
    `    // Print Clever £28.69, T Shirt and Sons £30.14, for the identical
    // garment at identical postage — so the postage ranking below cannot tell
    // them apart and was taking the dearer one. Measured 24 Aug 2026.
    pin: { blueprint: /heavy blend|18500/i, provider: /print clever/i },`,
  ],
  [
    "hold the stickers back",
    `    pin: { blueprint: /kiss-?cut sticker/i, provider: /sticky products europe/i },
    pinVariantId: 92315,
  },`,
    `    pin: { blueprint: /kiss-?cut sticker/i, provider: /sticky products europe/i },
    pinVariantId: 92315,
    // Held back 24 Aug 2026. Base cost £5.46 against a £3.50 price is a £1.96
    // loss a sale before postage, and postage is £6.49 because the only maker
    // is in the Netherlands. Delete this one line to bring them back once
    // there is a UK maker or the basket lets one parcel carry several items.
    hold: "base cost £5.46 vs a £3.50 price — a £1.96 loss a sale, plus £6.49 postage from NL",
  },`,
  ],
  [
    "skip held kinds",
    `  const wave = PRODUCTS.filter((p) => kindOf(p.num) && !ALREADY.has(p.num));
  console.log(\`skipping \${ALREADY.size} products wave 1 already made\`);`,
    `  const wave = PRODUCTS.filter((p) => {
    const k = kindOf(p.num);
    return k && !ALREADY.has(p.num) && !KINDS[k].hold;
  });
  console.log(\`skipping \${ALREADY.size} products wave 1 already made\`);
  Object.keys(KINDS)
    .filter((k) => KINDS[k].hold)
    .forEach((k) => console.log(\`HELD BACK — \${k}: \${KINDS[k].hold}\`));`,
  ],
];

for (const [name, from, to] of EDITS) {
  if (src.includes(to) && !src.includes(from)) {
    console.log("already applied:", name);
    continue;
  }
  const n = src.split(from).length - 1;
  if (n !== 1) throw new Error(`"${name}": expected exactly 1 match, found ${n}`);
  src = src.replace(from, to);
  console.log("applied:", name);
}

const must = [
  ["hoodie maker pin", /provider: \/print clever\/i/],
  ["sticker hold", /hold: "base cost £5\.46/],
  ["held kinds skipped", /!KINDS\[k\]\.hold/],
];
for (const [name, re] of must) if (!re.test(src)) throw new Error("missing after patch: " + name);

fs.writeFileSync(FILE, src);
new (require("vm").Script)(src, { filename: FILE });
console.log(`printify-wave2.js: ${before} -> ${src.length} bytes, parses cleanly`);
