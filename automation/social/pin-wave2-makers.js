// One-shot. Rewrites automation/social/printify-wave2.js so that:
//
//   1. the hoodie is pinned to the Gildan 18500 Heavy Blend, which is the
//      cheaper of the two candidates (£28.69 against the College Hoodie's
//      £29.24) and the garment the site's size guide is written to. The
//      script ranks makers by postage, not base cost, and the two hoodies post
//      identically — so without a pin it would pick the dearer one;
//   2. the "pin" kind becomes "sticker", pinned to the same blueprint,
//      provider and variant wave 1 used, so the shop sells one sticker rather
//      than two subtly different ones;
//   3. anything wave 1 already made is skipped by product number.
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
    "header",
    "// Wave 2: tees, hoodies, totes, notebooks and pins.",
    "// Wave 2: tees, hoodies, totes, notebooks and the ex-pin stickers.",
  ],
  [
    "pin the hoodie to Heavy Blend",
    `    avoid: /zip|kid|youth|crop|women|ladies|lightweight|sleeveless/i,
  },`,
    `    avoid: /zip|kid|youth|crop|women|ladies|lightweight|sleeveless/i,
    // Sam's instruction, 24 Aug 2026: run the cheaper hoodie. That is the
    // Gildan 18500 Heavy Blend at £28.69, not the College Hoodie at £29.24 —
    // same maker, same postage, so postage-ranking cannot tell them apart.
    // The size guide on the product pages is written to this garment.
    pin: { blueprint: /heavy blend|18500/i },
  },`,
  ],
  [
    "pins become stickers",
    `  pin: {
    label: "Pin", px: 1800,
    patterns: [/enamel pin/i, /pin button/i, /button pin/i, /\\bbadge\\b/i, /\\bpins?\\b/i, /magnet/i],
    avoid: /sticker|keychain|keyring/i,
    sizeHint: /1\\.?25|1\\.?5|25 ?mm|32 ?mm|small/i,
  },`,
    `  // The seven pin designs became £3.50 stickers, because Printify has no UK
  // or EU maker for pins at all. Pinned to exactly what wave 1 used for its ten
  // stickers — same blueprint, same maker, same variant — so the shop sells one
  // sticker, not two that differ in size for no reason a customer can see.
  sticker: {
    label: "Sticker", px: 1800,
    patterns: [/vinyl kiss-?cut sticker/i, /kiss-?cut sticker/i, /\\bsticker sheet\\b/i, /\\bstickers?\\b/i],
    avoid: /magnet|decal|wall|bumper|laptop skin/i,
    sizeHint: /3.*x.*3|medium/i,
    pin: { blueprint: /kiss-?cut sticker/i, provider: /sticky products europe/i },
    pinVariantId: 92315,
  },`,
  ],
  [
    "kindOf recognises stickers",
    `  if (/—\\s*Pin/.test(num)) return "pin";`,
    `  if (/—\\s*Sticker/.test(num)) return "sticker";`,
  ],
  [
    "match wave 1's sticker variant",
    `          variants = [(K.sizeHint && vars.find((v) => K.sizeHint.test(v.title))) || vars[0]];`,
    `          // Wave 1's sticker is variant 92315. Matching it exactly keeps the
          // seven new stickers the same size as the ten already on sale.
          variants = [
            (K.pinVariantId && vars.find((v) => v.id === K.pinVariantId)) ||
            (K.sizeHint && vars.find((v) => K.sizeHint.test(v.title))) ||
            vars[0],
          ];`,
  ],
  [
    "a pinned maker wins the ranking",
    `  out.sort((a, b) =>
    (a.country === "GB" ? 0 : 1) - (b.country === "GB" ? 0 : 1) ||
    (a.shipGB ?? 999999) - (b.shipGB ?? 999999) ||
    b.variants.length - a.variants.length);
  return { ranked: out, tried };`,
    `  // A pinned maker wins outright. Postage ranking is the right default but
  // not always the right answer: two candidates can post identically and differ
  // only in base cost, which the catalogue does not expose before a product
  // exists. If the pin matches nothing we say so loudly and fall back rather
  // than silently building on whatever came first.
  const wantBp = K.pin && K.pin.blueprint;
  const wantPr = K.pin && K.pin.provider;
  const isPinned = (c) =>
    (!wantBp || wantBp.test(c.blueprint.title)) && (!wantPr || wantPr.test(c.provider.title)) ? 0 : 1;
  const pinMissed = !!(K.pin && !out.some((c) => isPinned(c) === 0));
  if (pinMissed) tried.push("!! nothing matched the pinned maker for this kind");
  out.sort((a, b) =>
    (K.pin ? isPinned(a) - isPinned(b) : 0) ||
    (a.country === "GB" ? 0 : 1) - (b.country === "GB" ? 0 : 1) ||
    (a.shipGB ?? 999999) - (b.shipGB ?? 999999) ||
    b.variants.length - a.variants.length);
  return { ranked: out, tried, pinMissed };`,
  ],
  [
    "report a missed pin",
    `    const { ranked, tried } = await collectCandidates(kind, blueprints);`,
    `    const { ranked, tried, pinMissed } = await collectCandidates(kind, blueprints);
    if (pinMissed) console.log(\`  !! the pinned maker for \${kind} was not found — do not trust this pick\`);`,
  ],
  [
    "skip what wave 1 already made",
    `  const { PRODUCTS } = loadSiteData();
  const wave = PRODUCTS.filter((p) => kindOf(p.num));`,
    `  // Wave 1 made ten of the seventeen stickers. Skipping by product number
  // rather than by shop title means renaming a product inside Printify cannot
  // cause a duplicate to be built here.
  const ALREADY = new Set();
  try {
    const prev = require("./printify-result.json");
    (prev.results || prev).forEach((x) => x && x.num && ALREADY.add(x.num));
  } catch (e) {
    console.log("could not read the wave-1 result file:", e.message);
  }

  const { PRODUCTS } = loadSiteData();
  const wave = PRODUCTS.filter((p) => kindOf(p.num) && !ALREADY.has(p.num));
  console.log(\`skipping \${ALREADY.size} products wave 1 already made\`);`,
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

// Assertions on the finished file, so a wrong result cannot reach the shop.
const must = [
  ["hoodie pin", /pin: \{ blueprint: \/heavy blend\|18500\/i \}/],
  ["sticker kind", /sticker: \{\n\s+label: "Sticker"/],
  ["sticker variant pin", /pinVariantId: 92315/],
  ["kindOf sticker", /return "sticker";/],
  ["wave-1 skip", /!ALREADY\.has\(p\.num\)/],
];
for (const [name, re] of must) if (!re.test(src)) throw new Error("missing after patch: " + name);
if (/label: "Pin"/.test(src)) throw new Error("the old pin kind is still there");

fs.writeFileSync(FILE, src);
new (require("vm").Script)(src, { filename: FILE }); // throws on a syntax error
console.log(`printify-wave2.js: ${before} -> ${src.length} bytes, parses cleanly`);
