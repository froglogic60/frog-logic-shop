// Applies Sam's 24 Aug decisions to script.js:
//   - hoodies £32.00 -> £36.99 (base cost is £28.69; £32 left £3.31 a sale)
//   - the 7 pins become stickers at £3.50, matching the existing 10, because
//     Printify has no UK or EU maker for pins at all.
// "06 — Pin / sticker" is deliberately untouched: it is already live as a
// sticker at £6.50 from wave 1.
const fs = require("fs");
const path = require("path");
const SRC = path.join(__dirname, "..", "..", "script.js");
const OUT = SRC; // edits the file in place; the workflow commits it
const PINS = ["08", "16", "28", "34", "49", "55", "68"];

let t = fs.readFileSync(SRC, "utf8");
const count = (s, re) => (s.match(re) || []).length;
const before = { sticker: count(t, /— Sticker/g), pin: count(t, /— Pin"/g), h32: count(t, /£32\.00/g) };

t = t.split('"£32.00"').join('"£36.99"');

for (const n of PINS) {
  const re = new RegExp('(num: "' + n + ' — )Pin(", word:[\\s\\S]{0,400}?price: ")£6\\.50(")');
  const next = t.replace(re, "$1Sticker$2£3.50$3");
  if (next === t) throw new Error("no match for pin " + n);
  t = next;
}

const after = {
  sticker: count(t, /— Sticker/g), pin: count(t, /— Pin"/g),
  h32: count(t, /£32\.00/g), h3699: count(t, /£36\.99/g),
  p650: count(t, /£6\.50/g), p350: count(t, /£3\.50/g),
};
console.log("before", JSON.stringify(before));
console.log("after ", JSON.stringify(after));
fs.writeFileSync(OUT, t);
console.log("written", OUT, fs.statSync(OUT).size, "bytes");

if (after.pin !== 0 || after.h32 !== 0 || after.h3699 !== 3 || after.sticker !== before.sticker + 7) {
  throw new Error("unexpected result — refusing to leave script.js in this state");
}
