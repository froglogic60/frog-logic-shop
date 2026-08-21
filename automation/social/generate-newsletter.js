// Writes content/newsletter.json for this month's send, automatically.
// Rotates honestly through the collection: one physical piece to look at,
// two digital tools you can actually buy today, one gentle sign-off line.
// Runs inside the send-newsletter workflow just before sending.
//
// If newsletter.json contains "handwritten": true, this script leaves it
// completely alone — that's the override for months Sam writes herself.
const fs = require("fs");
const path = require("path");
const { loadSiteData } = require("./lib.js");

const TARGET = path.join(__dirname, "..", "..", "content", "newsletter.json");

const SIGNOFFS = [
  "That's it. Short on purpose — see you next month.",
  "That's the lot. Go gently.",
  "Nothing else this month. Rest well.",
  "That's everything. Small and quiet, like promised.",
];

const SUBJECTS = [
  "🐸 A short note from the pond",
  "🐸 Three things from the pond",
  "🐸 This month, from the pond",
  "🐸 A quiet one from the pond",
];

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function main() {
  const existing = JSON.parse(fs.readFileSync(TARGET, "utf8"));
  if (existing.handwritten === true) {
    console.log("newsletter.json is marked handwritten — leaving it untouched.");
    return;
  }
  const site = loadSiteData();
  const now = new Date();
  const m = now.getUTCFullYear() * 12 + now.getUTCMonth(); // month counter
  const phys = site.PRODUCTS[(m * 7) % site.PRODUCTS.length];
  const dig1 = site.DIGITAL_PRODUCTS[(m * 5) % site.DIGITAL_PRODUCTS.length];
  const dig2 = site.DIGITAL_PRODUCTS[(m * 5 + 11) % site.DIGITAL_PRODUCTS.length];

  // Explain, don't just name: say what the featured piece physically is,
  // frame its caption as the words on the design, and use each tool's real
  // description from the site — a name and a price sell nothing on their own.
  const kind = (phys.num.split("—")[1] || "piece").trim().toLowerCase();
  const art = /^[aeiou]/.test(kind) ? "an" : "a";
  const body = [
    `<p>Hello. One short note, as promised — never more than this: one piece from the feelings collection, two printable tools, done.</p>`,
    `<p><strong>From the collection:</strong> <em>${esc(phys.word)}</em> — ${art} ${esc(kind)}, ${esc(phys.price)}. The design reads: “${esc(phys.line)}”</p>`,
    `<p><strong>A tool to download:</strong> <em>${esc(dig1.word)}</em> (${esc(dig1.price)}) — ${esc(dig1.line)}</p>`,
    `<p><strong>And one more:</strong> <em>${esc(dig2.word)}</em> (${esc(dig2.price)}) — ${esc(dig2.line)} Both are printable PDFs, in your inbox the moment you buy.</p>`,
    `<p>${SIGNOFFS[m % SIGNOFFS.length]}</p>`,
  ].join("");

  const out = {
    subject: SUBJECTS[m % SUBJECTS.length],
    heading: "From the pond this month",
    body_html: body,
    cta_text: "See the collection",
    cta_url: "https://shop.froglogic.co.uk/",
    generated: now.toISOString().slice(0, 7),
  };
  fs.writeFileSync(TARGET, JSON.stringify(out, null, 2) + "\n");
  console.log(`Wrote newsletter for ${out.generated}: ${phys.word} / ${dig1.word} / ${dig2.word}`);
}

main();
