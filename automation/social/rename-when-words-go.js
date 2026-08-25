// One-shot. Renames "Show These Cards" to "When Words Go" and takes the
// trademarked "Sunflower lanyard" out of its shop description.
//
// The Hidden Disabilities Sunflower is a registered trademark and Frog Logic is
// not affiliated with the scheme, so naming it both risks the mark and implies
// an endorsement that does not exist. "A standard lanyard card holder" says the
// same useful thing — the physical size — without either problem.
//
// NOTE: this only fixes the website. The PDF itself still carries both the old
// title on its cover and the Sunflower wording inside, and there is no
// generator for it in this repo, so the artwork has to be remade separately.
// Until that happens the shop sells "When Words Go" and delivers a file whose
// cover reads "Show These Cards".
//
// Touches three files:
//   script.js                      the shop page: name and description
//   netlify/functions/catalog.json the checkout: id and name must follow, or
//                                  the catalogue rebuild refuses to write
//   automation/social/pinterest.js clears the hold so the pin can be built
//
// Every replacement asserts it matched exactly once. Safe to delete once run.
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "../..");
const OLD_NAME = "Show These Cards";
const NEW_NAME = "When Words Go";
const OLD_CLAUSE = "sized to fit a Sunflower lanyard";
const NEW_CLAUSE = "sized to fit a standard lanyard card holder";

function edit(file, pairs) {
  const full = path.join(ROOT, file);
  let src = fs.readFileSync(full, "utf8");
  for (const [from, to] of pairs) {
    if (src.includes(to) && !src.includes(from)) {
      console.log(`  already applied in ${file}: ${from.slice(0, 40)}`);
      continue;
    }
    const n = src.split(from).length - 1;
    if (n !== 1) throw new Error(`${file}: expected 1 match for "${from.slice(0, 50)}", found ${n}`);
    src = src.replace(from, to);
    console.log(`  ${file}: ${from.slice(0, 46)} -> ${to.slice(0, 46)}`);
  }
  fs.writeFileSync(full, src);
}

console.log("script.js");
edit("script.js", [
  [`word: "${OLD_NAME}"`, `word: "${NEW_NAME}"`],
  [OLD_CLAUSE, NEW_CLAUSE],
  // The name is drawn into the product's own artwork too, in caps. Missing it
  // the first time left a card headlined SHOW THESE CARDS sitting under the
  // label "When Words Go" — on the shop page and on the Pinterest pin.
  [">SHOW THESE CARDS<", ">WHEN WORDS GO<"],
]);

console.log("catalog.json");
edit("netlify/functions/catalog.json", [
  ['"id": "d18-show-these-cards"', '"id": "d18-when-words-go"'],
  [`"name": "${OLD_NAME}"`, `"name": "${NEW_NAME}"`],
]);

console.log("pinterest.js");
const pin = path.join(ROOT, "automation/social/pinterest.js");
let ps = fs.readFileSync(pin, "utf8");
const holdBlock = /const HOLD = \{[\s\S]*?\n\};/;
if (ps.includes("const HOLD = {};")) {
  console.log("  hold already cleared");
} else if (holdBlock.test(ps)) {
  ps = ps.replace(holdBlock, "const HOLD = {};");
  fs.writeFileSync(pin, ps);
  console.log("  hold cleared — the pin will now build");
} else {
  throw new Error("could not find the HOLD block in pinterest.js");
}

// ---- checks ----
const problems = [];
const site = fs.readFileSync(path.join(ROOT, "script.js"), "utf8");
const cat = JSON.parse(fs.readFileSync(path.join(ROOT, "netlify/functions/catalog.json"), "utf8"));

if (/Sunflower/i.test(site)) problems.push("script.js still mentions Sunflower");
if (site.includes(`word: "${OLD_NAME}"`)) problems.push("script.js still has the old name");
const entry = cat.find((x) => x.id === "d18-when-words-go");
if (!entry) problems.push("catalog.json has no d18-when-words-go entry");
if (entry && entry.name !== NEW_NAME) problems.push("catalog.json name is " + entry.name);
if (cat.length !== 121) problems.push("catalogue is no longer 121 entries");
if (/label: "Show These Cards"/.test(fs.readFileSync(pin, "utf8"))) problems.push("pinterest.js hold not cleared");

if (problems.length) {
  console.error("\nREFUSING — checks failed:");
  problems.forEach((p) => console.error("  ! " + p));
  process.exit(1);
}

console.log("\nall checks passed");
console.log("REMINDER: digital/Show-These-Cards.pdf still says \"Show These Cards\" on the cover");
console.log("and names the Sunflower lanyard inside. The artwork still needs remaking.");
