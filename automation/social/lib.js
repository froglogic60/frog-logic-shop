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
  // Each product's own page is /p/<slug>/, and the slug rule (pageSlug) sits
  // below the data boundary in script.js. Load the whole file the way
  // build-pages.cjs does so posts can link to the product itself rather than
  // the home page; if that ever fails, posts fall back to the home page.
  let pageSlug = null;
  try {
    const full = {
      document: { getElementById: () => null, addEventListener() {}, querySelectorAll: () => [], body: { addEventListener() {}, classList: { toggle() {} } } },
      window: {}, fetch: async () => ({ ok: false }), alert() {}, setTimeout, console,
    };
    vm.createContext(full);
    vm.runInContext(src + "\n;__ps=pageSlug;", full);
    pageSlug = full.__ps;
  } catch (e) { console.warn("pageSlug unavailable, posts will link to the home page: " + e.message); }
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
    pageSlug,
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
// From the week of 2 Nov 2026 (Sam, 1 Nov: "cut it"): the planner drops to two
// slots a week, Wednesday and Sunday at 1pm. Two weeks of four-a-week reached
// about 2 people a post with no interactions, and the extra posts read as
// spam. The two freed slots go back to a download showcase and a quote.
const WEEK_MIX_V3 = ["q", "q", "q", "q", "q", "a", "a", "a", "a", "s", "s", "s", "s", "p", "p", "e", "e", "e", "e", "b", "b"];
const V3_FROM_WEEK = 11; // week 11 = Mon 2 Nov 2026
const PLANNER_SLOTS_V3 = [7, 19]; // Wed, Sun at 1pm
// From the week of 9 Nov 2026 (Sam, 8 Nov: "nothing's selling ... sort out the
// posts"): the 30-day numbers showed the only things anyone looked at were the
// practical printables (visual schedules, burnout and spoon sheets, workplace
// asks), while the tees and mugs got no views at all. So the feelings artwork
// drops from four posts a week to two, and the download showcase goes from
// four to seven, rotating through FOCUS (below) instead of every download.
const WEEK_MIX_V4 = ["q", "q", "q", "q", "a", "a", "s", "s", "s", "s", "s", "s", "s", "p", "p", "e", "e", "e", "e", "b", "b"];
const V4_FROM_WEEK = 12; // week 12 = Mon 9 Nov 2026
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
  const v4 = weekIndex >= V4_FROM_WEEK;
  const v3 = weekIndex >= V3_FROM_WEEK;
  const v2 = weekIndex >= V2_FROM_WEEK;
  const mix = v4 ? WEEK_MIX_V4 : v3 ? WEEK_MIX_V3 : v2 ? WEEK_MIX_V2 : WEEK_MIX;
  const arr = mix.filter((t) => t !== "p");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  // A shuffle can stack three planner posts on one day, so the planner gets
  // fixed slots instead: the 1pm post on Monday, Wednesday, Friday and Sunday.
  if (v3) for (const pos of PLANNER_SLOTS_V3) arr.splice(pos, 0, "p");
  else if (v2) for (const pos of PLANNER_SLOTS) arr.splice(pos, 0, "p");
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
  const focus = w >= V4_FROM_WEEK;
  const dateIso = new Date(dateUtc).toISOString().slice(0, 10);
  // occurrence = how many times this type appeared before this slot, ever.
  let occurrence = 0;
  for (let wi = 0; wi < w; wi++) occurrence += weekTypes(wi).filter((t) => t === type).length;
  for (let p = 0; p < pos; p++) if (types[p] === type) occurrence++;
  // The focus rotation starts counting from its own first week, so it begins
  // at the top of the FOCUS list instead of part-way through.
  if (focus && type === "s") {
    occurrence = 0;
    for (let wi = V4_FROM_WEEK; wi < w; wi++) occurrence += weekTypes(wi).filter((t) => t === "s").length;
    for (let p = 0; p < pos; p++) if (types[p] === "s") occurrence++;
  }
  return { type, occurrence, focus, dateIso };
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

// ---- the focus rotation for download posts (from 9 Nov 2026).
// The practical printables people actually search for, each with a plain
// "what it is" opening line, because a stranger scrolling past can't tell what
// "Good Day Blueprint" is from the name. The label rule still holds: the
// caption names the situation, the labels go in the hashtags. Each post links
// to the product's own page, not the front door. An entry with "until" drops
// out of the rotation after that date (seasonal).
const FOCUS = [
  { id: "D1", hook: "For the days with hardly any energy: one main task, rough time blocks, and permission to leave boxes blank.", tags: "#FrogLogic #SpoonTheory #Spoonie #ChronicIllness #ADHD" },
  { id: "D10", hook: "When \u201ctidy the kitchen\u201d is too big to start: one sheet that breaks a task into steps small enough to begin.", tags: "#FrogLogic #ExecutiveFunction #ADHD #ADHDAdults #Neurodivergent" },
  { id: "D8", hook: "Twelve cards that say what you need to hear when you're running on empty.", tags: "#FrogLogic #Burnout #AutisticBurnout #ADHD #Neurodivergent" },
  { id: "D45", hook: "Picture cards for the school day: school run, PE kit, packed lunch, home time, tea time. Stick them on the fridge so the day can be seen, not just told.", tags: "#FrogLogic #VisualSchedule #VisualTimetable #SENParents #AutismParents" },
  { id: "D14", hook: "Work out what your good days have in common, so you can have more of them.", tags: "#FrogLogic #ADHDAdults #Routine #Neurodivergent #ActuallyAutistic" },
  { id: "D39", hook: "Christmas Day throws the usual routine out of the window. A picture timetable for the day itself: presents, visitors, the car, crackers, the dog walk.", tags: "#FrogLogic #VisualSchedule #SENParents #AutismParents #AutismChristmas", until: "2026-12-25" },
  { id: "D44", hook: "For the brain that forgets the direct debit until it bounces: paydays, bills, council tax and a 24-hour impulse catcher, all on paper.", tags: "#FrogLogic #ADHD #ADHDAdults #BudgetPlanner #UKBudget" },
  { id: "D15", hook: "Asking work for adjustments, written with you line by line: the situation, the effect, the ask, and what it costs them (usually nothing).", tags: "#FrogLogic #ReasonableAdjustments #ADHDAtWork #AutismAtWork #Neurodivergent" },
  { id: "D29", hook: "Small routines that stick: attach one new habit to something you already do.", tags: "#FrogLogic #ADHD #HabitStacking #Routine #ADHDAdults" },
  { id: "D6", hook: "What's too loud, too bright, too scratchy, and what actually calms you: a one-page map of your senses.", tags: "#FrogLogic #SensoryProcessing #ActuallyAutistic #ADHD #Neurodivergent" },
  { id: "D5", hook: "For the evening after a day of holding it all together.", tags: "#FrogLogic #Unmasking #AutisticBurnout #ActuallyAutistic #Neurodivergent" },
  { id: "D23", hook: "A week with three big things instead of twenty, and a wins column for the tiny hops.", tags: "#FrogLogic #ADHDPlanner #ADHDAdults #Neurodivergent #Planner" },
  { id: "D4", hook: "One sheet a week to see where your energy actually went.", tags: "#FrogLogic #SpoonTheory #Spoonie #ChronicIllness #Neurodivergent" },
  { id: "D12", hook: "Cards to hand over when explaining out loud is too much.", tags: "#FrogLogic #AccessNeeds #ActuallyAutistic #ADHD #Disabled" },
  { id: "D30", hook: "Swap the harsh thing you say about yourself for something truer.", tags: "#FrogLogic #SelfCompassion #Neurodivergent #ADHD #ActuallyAutistic" },
];
function focusPost(occurrence, site, dateIso) {
  const byId = (id) => site.DIGITAL_PRODUCTS.find((x) => !x.retired && (x.num || "").split(" ")[0] === id);
  const live = FOCUS.filter((f) => (!f.until || dateIso <= f.until) && byId(f.id));
  if (!live.length) return null;
  const f = live[occurrence % live.length];
  const p = byId(f.id);
  const slug = site.pageSlug ? site.pageSlug(p) : null;
  const link = slug ? `${SHOP}/p/${slug}/` : SHOP;
  return {
    kind: "showcase", item: p, page: slug,
    caption: `${f.hook} \ud83d\udc38\n\n${p.word} \u2014 ${p.price}, instant download: ${link}\n${etsyLine(null)}\n\n${f.tags}`,
  };
}

function buildPost({ type, occurrence, focus, dateIso }, bank, site) {
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
      kind: "art", item: p, page: site.pageSlug ? site.pageSlug(p) : null,
      caption: `${p.word}. ${p.line} 🐸\n\nFrom the feelings collection at ${SHOP} — the word is the artwork.\n${etsyLine(p)}\n\n${tags(occurrence)}`,
    };
  }
  if (type === "s") {
    // The planner has its own slots ("p") and isn't an instant download, so the
    // general download rotation leaves it out.
    if (focus) { const fp = focusPost(occurrence, site, dateIso); if (fp) return fp; }
    const downloads = site.DIGITAL_PRODUCTS.filter((x) => !x.feature && !x.retired);
    const p = downloads[(occurrence * 11) % downloads.length];
    const cta = SHOWCASE_LINES[occurrence % SHOWCASE_LINES.length];
    return {
      kind: "showcase", item: p, page: site.pageSlug ? site.pageSlug(p) : null,
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
