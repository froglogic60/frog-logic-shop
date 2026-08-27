// Rebuilds netlify/functions/catalog.json from the two things that actually
// know the truth:
//
//   script.js                  — the shop page: what a customer is shown
//   printify-*result.json      — Printify: what can actually be fulfilled
//
// catalog.json is what create-checkout.js charges from and what stripe-webhook.js
// fulfils from, so anything stale in it is a customer being charged the wrong
// amount or an order that cannot ship. It held both prices and Printify IDs by
// hand, which is how the hoodie ended up priced £36.99 on the page and £32.00 at
// the till, and the seven ex-pins £3.50 on the page and £6.50 at the till.
//
// Safe to run repeatedly: it only ever writes values derived from those sources,
// and it refuses to write at all if the result fails its own checks. Digital
// items are untouched — no Printify, no price change.
const fs = require("fs");
const path = require("path");
const { loadSiteData } = require("./lib.js");

const CATALOG = path.join(__dirname, "../../netlify/functions/catalog.json");

// Must stay identical to checkoutId() in script.js — the browser derives the id
// it posts to /api/create-checkout from the same two fields.
function slugFor(num, word) {
  const numPart = num.includes("—") ? num.split("—")[0].trim() : num;
  return (numPart + "-" + word).replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
}

const pence = (p) => Math.round(parseFloat(String(p).replace(/[^0-9.]/g, "")) * 100);

function loadResults(file) {
  const full = path.join(__dirname, file);
  if (!fs.existsSync(full)) {
    console.log("no", file, "— skipping");
    return [];
  }
  const raw = JSON.parse(fs.readFileSync(full, "utf8"));
  const rows = raw.results || raw;
  return Array.isArray(rows) ? rows.filter((r) => r && r.id && r.printifyProductId) : [];
}

const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
const byId = new Map(catalog.map((x) => [x.id, x]));
// Digital entries are never touched by this script — no Printify, no price
// change, and retiring only ever affects printed pieces. So the count going in
// must equal the count coming out, and that is the truncation guard. It used to
// be a hardcoded total of every entry, which had to be edited by hand every
// time the range changed and was wrong within a day of being written.
const digitalBefore = catalog.filter((x) => x.type === "digital").length;
const { PRODUCTS, ALL_PRODUCTS } = loadSiteData();

// Retired pieces are off the page and out of the catalogue, but they still exist
// as products in Printify — nothing was deleted there. Without this, every
// retired sticker would read as an orphan in the result files and block the
// whole rebuild.
const RETIRED = new Set(
  ALL_PRODUCTS.filter((p) => p.retired).map((p) => slugFor(p.num, p.word))
);

// ---- 1. prices and names, from the page ----
const repriced = [];
const orphans = [];
for (const p of PRODUCTS) {
  const id = slugFor(p.num, p.word);
  const entry = byId.get(id);
  if (!entry) { orphans.push(id); continue; }
  const want = pence(p.price);
  if (Math.round(entry.price * 100) !== want) {
    repriced.push(`${id}: £${entry.price.toFixed(2)} -> £${(want / 100).toFixed(2)}`);
    entry.price = want / 100;
  }
  if (entry.name !== p.word) {
    repriced.push(`${id}: renamed "${entry.name}" -> "${p.word}"`);
    entry.name = p.word;
  }
}

// ---- 2. Printify ids, from what was actually created ----
// Order matters. Later files win, because a piece can appear in more than one
// of them: the eight mugs are in wave 1 on the EU maker AND in the mugs file on
// the UK maker, and the UK one is the one that should be sold. Same for the
// sixteen wall prints. Keep the rebuild files last, wave 1 first.
const wired = [];
// Where each piece pointed BEFORE any of this ran. Comparing against the live
// entry inside the loop reported every intermediate hop instead of the net
// move — 48 for 24 pieces, because wave 1 sets a mug back to the EU product and
// the mugs file then moves it forward again.
const wasAt = new Map(catalog.map((x) => [x.id, x.printifyProductId]));
for (const file of ["printify-result.json", "printify-wave2-result.json", "printify-mugs-result.json", "printify-prints-result.json", "printify-tees-result.json"]) {
  for (const r of loadResults(file)) {
    if (RETIRED.has(r.id)) continue;
    const entry = byId.get(r.id);
    if (!entry) { orphans.push(r.id + " (in " + file + ")"); continue; }
    const isNew = !wasAt.get(r.id);
    entry.printifyProductId = r.printifyProductId;
    entry.printifyVariantId = r.printifyVariantId;
    // Apparel only. The cost figures stay out — nothing downstream needs a
    // supplier price, and this file ships inside the checkout function.
    if (Array.isArray(r.sizes) && r.sizes.length) {
      entry.sizes = r.sizes.map((s) => ({ size: s.size, variantId: s.variantId }));
    }
    if (isNew) wired.push(`${r.id} (${r.kind || "?"})${entry.sizes ? ", " + entry.sizes.length + " sizes" : ""}`);
  }
}

// Net moves only, worked out once everything has been applied.
const moved = [];
for (const x of catalog) {
  const before = wasAt.get(x.id);
  if (before && x.printifyProductId && before !== x.printifyProductId) {
    moved.push(`${x.id}: ${before} -> ${x.printifyProductId}`);
  }
}

// ---- 3. drop anything that has been retired ----
// Retiring a piece is a single `retired: true` in script.js. Without this it
// was only half a job: the piece vanished from the page but its entry stayed in
// catalog.json, so the checks below saw more physical entries than the page had
// and refused to write. That is what happened when the 18 stickers went and it
// had to be sorted out by hand.
const dropped = [];
for (let i = catalog.length - 1; i >= 0; i--) {
  if (RETIRED.has(catalog[i].id)) dropped.push(...catalog.splice(i, 1).map((x) => x.id));
}

// ---- 4. checks, before anything is written ----
const physical = catalog.filter((x) => x.type === "physical");
const sellable = physical.filter((x) => x.printifyProductId);
const held = physical.filter((x) => !x.printifyProductId);
const problems = [];

if (orphans.length) problems.push("ids with no catalogue entry: " + orphans.join(", "));
// Both halves check themselves against the page, so retiring a piece or adding
// a wave needs no number touched by hand here.
if (physical.length !== PRODUCTS.length) {
  problems.push("page shows " + PRODUCTS.length + " physical pieces, catalogue holds " + physical.length);
}
const digitalNow = catalog.filter((x) => x.type === "digital").length;
if (digitalNow !== digitalBefore) {
  problems.push("digital downloads went from " + digitalBefore + " to " + digitalNow + " — this script should never change them");
}
for (const x of sellable) {
  if (!x.printifyVariantId) problems.push(x.id + " has a product id but no variant id");
  if (x.sizes && !x.sizes.some((s) => s.variantId === x.printifyVariantId)) {
    problems.push(x.id + "'s default variant is not one of its sizes");
  }
}
// Every price on the page must equal every price at the till. This is the check
// that would have caught the £32 / £36.99 hoodie.
for (const p of PRODUCTS) {
  const entry = byId.get(slugFor(p.num, p.word));
  if (entry && Math.round(entry.price * 100) !== pence(p.price)) {
    problems.push("price still differs for " + entry.id);
  }
}
if (problems.length) {
  console.error("REFUSING TO WRITE:");
  problems.forEach((p) => console.error("  ! " + p));
  process.exit(1);
}

fs.writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + "\n");

if (dropped.length) {
  console.log(`removed ${dropped.length} retired piece(s) from the catalogue:`);
  dropped.forEach((d) => console.log("  " + d));
  console.log("");
}
console.log(`catalogue: ${catalog.length} entries`);
console.log(`  ${sellable.length} physical products can be ordered`);
console.log(`  ${held.length} physical products have no Printify product yet:`);
held.forEach((x) => console.log(`     ${x.id} — £${x.price.toFixed(2)}`));
console.log(`  ${catalog.filter((x) => x.type === "digital").length} digital downloads (untouched)`);
if (repriced.length) {
  console.log(`\ncorrected ${repriced.length} price/name mismatches against the page:`);
  repriced.forEach((r) => console.log("  " + r));
}
if (wired.length) {
  console.log(`\nnewly orderable (${wired.length}):`);
  wired.forEach((w) => console.log("  " + w));
}
if (moved.length) {
  console.log(`\n${moved.length} piece(s) now point at a different Printify product:`);
  moved.forEach((m) => console.log("  " + m));
  console.log("\n  ! Each of these still carries the OLD maker's postage. A different maker");
  console.log("    means a different parcel and a different rate, so run \"Refresh the");
  console.log("    postage rates\" next or the customer is charged the wrong delivery.");
  console.log("  ! Their product photos are dead too — a mockup URL belongs to the product");
  console.log("    it was rendered for. Run \"Refresh the product photos\" as well.");
}
