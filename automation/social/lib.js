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
// From the week of 12 Oct 2026 (Sam, 13 Oct: "more planner posts ... and more
// often"): four of the 21 weekly slots go to the Bespoke Planner ("p"), roughly
// every other day. Before this the planner only came up when the download
// rotation happened to land on it — about once a month. It takes three of the
// six general download slots and one quote slot, so the feed is still mostly
// not-an-advert. Earlier weeks keep the old mix so the rotations carry on from
// where they were instead of jumping.
const WEEK_MIX_V2 = ["q", "q", "q", "q", "a", "a", "a", "a", "s", "s", "s", "p", "p", "p", "p", "e", "e", "e", "e", "b", "b"];
const V2_FROM_WEEK = 8; // week 8 = Mon 12 Oct 2026
const PLANNER_SLOTS = [1, 7, 13, 19]; // day*3 + slot: Mon, Wed, Fri, Sun at 1pm
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
  const v2 = weekIndex >= V2_FROM_WEEK;
  const arr = v2 ? WEEK_MIX_V2.filter((t) => t !== "p") : [...WEEK_MIX];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  // A shuffle can stack three planner posts on one day, so the planner gets
  // fixed slots instead: the 1pm post on Monday, Wednesday, Friday and Sunday.
  if (v2) for (const pos of PLANNER_SLOTS) arr.splice(pos, 0, "p");
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

// ---- the Bespoke Planner's own rotation.
// Alternates two looks so four a week don't feel like the same advert: even
// occurrences show the planner artwork with the price, odd ones a text card
// about one thing the planner does. Every caption carries the price and
// points at the planner on the page, not just the shop's front door.
const PLANNER_LINK = `${SHOP}/#bespoke`;
// Since 25 Oct 2026 (Sam: "do the bios and posts"): the free taster went live
// 22 Oct with no sign-ups, so every planner post also offers the free page
// for anyone not ready to spend £25.
const TASTER_LINE = `Not ready for the full planner? Try a free page first: ${SHOP}/taster/`;
const PLANNER_NOTES = [
  { title: "A planner that knows your hard days", body: "Tell it what a hard day looks like and what actually helps. It prints your own words back to you — with a tear-off half to hand to someone." },
  { title: "Built for one brain", body: "Fifteen questions about how your days really run. Then a planner of up to eighteen pages, made for nobody but you." },
  { title: "The page you give away", body: "Pick who most needs to understand you — a partner, a manager, a teacher, a parent. One page, addressed to them, in your words." },
  { title: "Undated on purpose", body: "Skip a week, skip a month. Nothing is wasted. Print the pages you need, as often as you need them, forever." },
  { title: "Your mornings, as a tick-list", body: "Tell it how your day starts and ends. The steps become boxes, so the routine lives on paper instead of in your head." },
  { title: "The don't-forget strip", body: "Meds, water, keys, food — whatever you keep losing goes on every daily page. One glance. No app." },
  { title: "Energy, counted your way", body: "Spoons, battery, or neither. Every daily page tracks it the way you already think about it." },
  { title: "If it doesn't fit, it gets rebuilt", body: "Answer the questions again and a new one is built, free. That's what made for you means." },
];
const PLANNER_LINES = [
  "Every planner I bought was built for someone else's brain. This one is built for yours.",
  "Answer the questions, and a printable planner made around your days lands in your inbox.",
  "Not a template with your name on it. A planner assembled from your answers, page by page.",
  "For everyone who has abandoned a planner by February.",
];

function plannerPost(occurrence, site) {
  const p = site.DIGITAL_PRODUCTS.find((x) => x.feature);
  if (!p) throw new Error("Bespoke Planner (feature: true) missing from DIGITAL_PRODUCTS");
  const n = Math.floor(occurrence / 2);
  if (occurrence % 2 === 0) {
    const line = PLANNER_LINES[n % PLANNER_LINES.length];
    return {
      // The site artwork still says "NINE QUESTIONS" until the next site deploy
      // (it's fifteen since 10 Oct), so the posts swap in the pin's wording.
      kind: "showcase", item: { ...p, sub: "made for you", svg: p.svg.replace("NINE QUESTIONS", "YOUR WORDS") },
      caption: `${line} 🐸\n\nThe Bespoke Planner — ${p.price}. ${PLANNER_LINK}\n\n${TASTER_LINE}\n\n${tags(occurrence)}`,
    };
  }
  const note = PLANNER_NOTES[n % PLANNER_NOTES.length];
  return {
    kind: "note", item: { tag: "the bespoke planner", ...note },
    caption: `${note.title}. ${note.body} 🐸\n\nThe Bespoke Planner — ${p.price}. ${PLANNER_LINK}\n\n${TASTER_LINE}\n\n${tags(occurrence)}`,
  };
}

// Etsy, since 15 Oct 2026: the tees, mugs and prints are listed there too
// (UK and US makers), and the whole shop is in Etsy's Share & Save, so any
// sale that comes through a froglogic.etsy.com link costs 4% less in fees
// (6.5% until 29 Oct). The map is written by hand from the Etsy shop after
// the "Put tees, mugs and prints on Etsy" workflow runs.
const ETSY_SHOP = "froglogic.etsy.com";
let ETSY_LISTINGS = {};
try { ETSY_LISTINGS = JSON.parse(fs.readFileSync(path.join(__dirname, "etsy-listings.json"), "utf8")); } catch { /* none yet */ }
function etsyLine(p) {
  const id = p && p.num ? (() => { const n = p.num.includes("—") ? p.num.split("—")[0].trim() : p.num; return (n + "-" + p.word).replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase(); })() : null;
  const l = id && ETSY_LISTINGS[id];
  return l && l.uk ? `Also on Etsy: ${ETSY_SHOP}/listing/${l.uk}` : `Also on Etsy: ${ETSY_SHOP}`;
}

function buildPost({ type, occurrence }, bank, site) {
  if (type === "p") return plannerPost(occurrence, site);
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
      caption: `${p.word}. ${p.line} 🐸\n\nFrom the feelings collection at ${SHOP} — the word is the artwork.\n${etsyLine(p)}\n\n${tags(occurrence)}`,
    };
  }
  if (type === "s") {
    // The planner has its own slots ("p") and isn't an instant download, so the
    // general download rotation leaves it out.
    const downloads = site.DIGITAL_PRODUCTS.filter((x) => !x.feature);
    const p = downloads[(occurrence * 11) % downloads.length];
    const cta = SHOWCASE_LINES[occurrence % SHOWCASE_LINES.length];
    return {
      kind: "showcase", item: p,
      caption: `${p.word} — ${p.price}. ${cta} 🐸\n${etsyLine(null)}\n\n${tags(occurrence)}`,
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
