// Shared pieces for the Frog Logic daily social automation.
// Lives in automation/social/ in the repo; paths are relative to that folder.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..", "..");

// ---- site data: read PRODUCTS / DIGITAL_PRODUCTS straight out of script.js
// so social content always matches the live site.
function loadSiteData() {
  const src = fs.readFileSync(path.join(ROOT, "script.js"), "utf8");
  const cut = src.indexOf("function wireLowStimToggle");
  if (cut === -1) throw new Error("script.js layout changed — can't find data boundary");
  const ctx = { document: { getElementById: () => null } };
  vm.createContext(ctx);
  vm.runInContext(src.slice(0, cut) + "\n;__out={PRODUCTS,DIGITAL_PRODUCTS};", ctx);
  const { PRODUCTS, DIGITAL_PRODUCTS } = ctx.__out;
  // A retired piece is off the page and out of the checkout, so it must also be
  // out of anything that quotes prices or points people at the shop — the
  // catalogue rebuild and the social posts both read PRODUCTS from here, and a
  // post advertising something nobody can buy is the surprise this shop exists
  // to avoid. ALL_PRODUCTS keeps the retired ones for the one job that still
  // needs them: building the printable sticker sheet from their artwork.
  return {
    PRODUCTS: PRODUCTS.filter((p) => !p.retired),
    DIGITAL_PRODUCTS,
    ALL_PRODUCTS: PRODUCTS,
  };
}

// ---- fonts: decompress the @fontsource woff2s to ttf once per run.
async function prepareFonts(dir) {
  const { decompress } = require("wawoff2");
  const jobs = [
    ["@fontsource/fraunces/files/fraunces-latin-600-normal.woff2", "fraunces-600.ttf"],
    ["@fontsource/fraunces/files/fraunces-latin-500-italic.woff2", "fraunces-500i.ttf"],
    ["@fontsource/anton/files/anton-latin-400-normal.woff2", "anton-400.ttf"],
    ["@fontsource/space-mono/files/space-mono-latin-400-normal.woff2", "space-mono-400.ttf"],
    ["@fontsource/space-grotesk/files/space-grotesk-latin-500-normal.woff2", "space-grotesk-500.ttf"],
  ];
  fs.mkdirSync(dir, { recursive: true });
  for (const [src, out] of jobs) {
    const target = path.join(dir, out);
    if (fs.existsSync(target)) continue;
    const ttf = await decompress(fs.readFileSync(require.resolve(src)));
    fs.writeFileSync(target, Buffer.from(ttf));
  }
  return fs.readdirSync(dir).map((f) => path.join(dir, f));
}

// ---- deterministic schedule.
// Weekly mix follows the standing content rules: ~40% relatable (quote/art),
// ~30% product showcase, ~20% educational, ~10% behind-the-scenes.
const WEEK_MIX = ["q", "q", "q", "q", "q", "a", "a", "a", "a", "s", "s", "s", "s", "s", "s", "e", "e", "e", "e", "b", "b"];
const EPOCH = Date.UTC(2026, 7, 17); // Monday 17 Aug 2026

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function weekTypes(weekIndex) {
  const rand = mulberry32(weekIndex + 1);
  const arr = [...WEEK_MIX];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// slot: 0,1,2 = the three posts of the day.
function scheduleFor(dateUtc, slot) {
  const dayIndex = Math.floor((Date.UTC(dateUtc.getUTCFullYear(), dateUtc.getUTCMonth(), dateUtc.getUTCDate()) - EPOCH) / 86400000);
  const globalSlot = dayIndex * 3 + slot;
  if (globalSlot < 0) return { type: "q", occurrence: 0 };
  const w = Math.floor(globalSlot / 21);
  const pos = globalSlot % 21;
  const types = weekTypes(w);
  const type = types[pos];
  // occurrence = how many times this type appeared before this slot, ever.
  let occurrence = 0;
  for (let wi = 0; wi < w; wi++) occurrence += weekTypes(wi).filter((t) => t === type).length;
  for (let p = 0; p < pos; p++) if (types[p] === type) occurrence++;
  return { type, occurrence };
}

// ---- captions. Feelings only, first person, honest. Labels live in the
// hashtags (Sam's decision 21 Aug: hashtags count as backend-style tags).
const HASHTAG_SETS = [
  "#FrogLogic #NeurodivergentOwned #ActuallyAutistic #ADHD",
  "#FrogLogic #Neurodivergent #NeurodivergentJoy #ActuallyAutistic",
  "#FrogLogic #NeurodivergentOwned #ADHD #NeurodivergentJoy",
];
function tags(n) { return HASHTAG_SETS[n % HASHTAG_SETS.length]; }

// The shop address, spelled out rather than "link in bio".
//
// Every one of these captions used to end "link in bio", and the same caption
// goes to Facebook and Instagram alike. On Instagram that works. On Facebook
// there is no bio link to follow, so for a month half of every day's posts
// pointed at nothing — Meta's per-post link-click column was empty because
// there was never a link to click. A bare domain is clickable on Facebook and
// short enough to read off a phone screen on Instagram, so it works on both.
//
// Only the posts that show something for sale carry it. The quotes, the
// educational notes and the behind-the-scenes ones stay clean, because a feed
// where every single post ends in an address is an advert, not a pond.
const SHOP = "froglogic.co.uk";

const SHOWCASE_LINES = [
  `Made for the days it describes. Instant download at ${SHOP}`,
  `No shipping, no waiting, no fuss. ${SHOP}`,
  `Designed to be legible on a hard day. ${SHOP}`,
  `One of the calm tools from the pond. ${SHOP}`,
];

function buildPost({ type, occurrence }, bank, site) {
  if (type === "q") {
    const q = bank.quotes[occurrence % bank.quotes.length];
    return {
      kind: "quote", item: q,
      caption: `${q.text} 🐸\n\n${tags(occurrence)}`,
    };
  }
  if (type === "a") {
    const p = site.PRODUCTS[(occurrence * 7) % site.PRODUCTS.length];
    return {
      kind: "art", item: p,
      caption: `${p.word}. ${p.line} 🐸\n\nFrom the feelings collection at ${SHOP} — the word is the artwork.\n\n${tags(occurrence)}`,
    };
  }
  if (type === "s") {
    const p = site.DIGITAL_PRODUCTS[(occurrence * 11) % site.DIGITAL_PRODUCTS.length];
    const cta = SHOWCASE_LINES[occurrence % SHOWCASE_LINES.length];
    return {
      kind: "showcase", item: p,
      caption: `${p.word} — ${p.price}. ${cta} 🐸\n\n${tags(occurrence)}`,
    };
  }
  if (type === "e") {
    const n = bank.educational[occurrence % bank.educational.length];
    return {
      kind: "note", item: { tag: "from the pond", ...n },
      caption: `${n.title}: ${n.body} 🐸\n\n${tags(occurrence)}`,
    };
  }
  const b = bank.bts[occurrence % bank.bts.length];
  return {
    kind: "note", item: { tag: "behind the pond", ...b },
    caption: `${b.title} — ${b.body} 🐸\n\n${tags(occurrence)}`,
  };
}

module.exports = { loadSiteData, prepareFonts, scheduleFor, buildPost };
