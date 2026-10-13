// Etsy listing kit for a batch of digital downloads.
//
// Etsy brings its own shoppers, which the site does not yet, so each download
// gets a ready-to-post kit: five listing images (2000x1500, Etsy's 4:3 crop),
// the PDF in A4 and US Letter, and a listing.txt holding the title, price,
// tags and description to paste. Images render through headless Chromium with
// the site's own fonts, exactly like the Pinterest pins.
//
//   BATCH="Say It,Unmasking,Sensory Profile,Appointment Prep,Permission Cards" \
//   PRICE=3.50 node etsy-kit.js
//
// Etsy prices sit above the site so Sam's own shop stays the best deal, and no
// copy may mention froglogic.co.uk — Etsy forbids linking out from a listing.
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { loadSiteData } = require("./lib.js");
const { ensureFonts, fontFaceCSS } = require("./gfonts.js");

const W = 2000, H = 1500;
const CREAM = "#F4EFE3", INK = "#1A1A1A", GOLD = "#E8B63C";
const OUT = path.join(__dirname, ".etsy");
const PRICE = process.env.PRICE || "3.50";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
function wrap(text, maxChars) {
  const words = String(text).split(/\s+/); const lines = []; let cur = "";
  for (const w of words) { if ((cur + " " + w).trim().length > maxChars && cur) { lines.push(cur); cur = w; } else cur = (cur + " " + w).trim(); }
  if (cur) lines.push(cur); return lines;
}
function pdfFor(p) {
  const guess = {
    "Say It — Communication Scripts": "Say-It-Scripts.pdf",
    "What I'm Actually Good At": "What-Im-Actually-Good-At.pdf",
    "When Words Go": "When-Words-Go.pdf",
  }[p.word];
  const file = guess || p.word.replace(/[’']/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".pdf";
  const full = path.join(__dirname, "../../digital", file);
  if (!fs.existsSync(full)) throw new Error("no PDF for " + p.word + " (" + file + ")");
  return full;
}

// Per-product selling copy: what is inside and who it is for. Written as
// sentences for a human reading an Etsy page, not keyword soup.
const COPY = {
  "Say It — Communication Scripts": {
    title: "Communication Scripts for Neurodivergent Adults | 12 Hard Conversations, Two Tones Each | Printable PDF for ADHD & Autistic Adults",
    inside: ["12 conversations you keep putting off", "Each one in two tones: soft and direct", "Cancelling plans, asking for accommodations, correcting a misread tone, disclosing if you choose", "Two A4 pages, print or keep on your phone"],
    why: "The words are already written. You just pick the tone that fits the day.",
    tags: ["communication scripts", "autistic adults", "adhd printable", "social scripts", "neurodivergent", "self advocacy", "cancel plans script", "accommodation request", "anxiety tools", "masking", "printable pdf", "instant download", "neurodiversity"],
  },
  "Unmasking Recovery": {
    title: "Unmasking Recovery Sheet | After-Masking Wind-Down for Autistic & ADHD Adults | Printable PDF Self-Care Worksheet",
    inside: ["What the day cost you", "What you held back", "One small place you could mask less next time", "One A4 page, use it after any performance"],
    why: "A wind-down for after the performance ends. Not a journal you have to keep up with.",
    tags: ["unmasking", "autistic burnout", "masking recovery", "autism worksheet", "adhd self care", "neurodivergent", "late diagnosed", "burnout recovery", "mental health printable", "self reflection", "printable pdf", "instant download", "neurodiversity"],
  },
  "My Sensory Profile": {
    title: "My Sensory Profile Worksheet | Avoid-to-Seek Map Across 8 Senses | Printable PDF for Autistic, ADHD & Sensory Sensitive Adults",
    inside: ["Eight senses on an avoid-to-seek scale", "Your hard no's", "What actually regulates you", "One A4 page you can hand to someone who needs to understand you"],
    why: "A maintenance manual for your own nervous system. Not a diagnosis, not a test.",
    tags: ["sensory profile", "sensory processing", "autism sensory", "adhd sensory", "sensory worksheet", "neurodivergent", "sensory needs", "occupational therapy", "sensory overload", "self knowledge", "printable pdf", "instant download", "neurodiversity"],
  },
  "Appointment Prep": {
    title: "Appointment Prep Sheet | Doctor, GP & Therapy Visit Planner for Neurodivergent Adults | Printable PDF for ADHD & Autism",
    inside: ["The one thing you need from this appointment", "Your questions, written before the room empties your head", "A tick-list of what helps you while you're there", "One A4 page, fill in the night before"],
    why: "Get the words ready before you need them, so the appointment goes the way you meant it to.",
    tags: ["appointment prep", "doctor visit planner", "gp appointment", "therapy prep", "medical anxiety", "neurodivergent", "adhd planner", "autism support", "self advocacy", "health planner", "printable pdf", "instant download", "neurodiversity"],
  },
  "Permission Cards": {
    title: "Permission Cards | 12 Printable Cut-Out Cards for Neurodivergent Adults | Rest, Cancel, Leave Early | ADHD & Autism Printable PDF",
    inside: ["12 cut-out cards for your wallet, mirror or desk", "“Rest is not something you earn first.”", "“Cancelling is kinder than resenting it.”", "Two A4 pages, cut along the dashed lines"],
    why: "Small cards that say the thing you forget you're allowed to do.",
    tags: ["permission cards", "affirmation cards", "self compassion", "adhd printable", "autistic adults", "neurodivergent", "rest reminder", "burnout", "mental health cards", "printable cards", "printable pdf", "instant download", "neurodiversity"],
  },

  // ---- batch four onwards (13 Oct 2026): everything still unlisted.
  "When Words Go": {
    title: "Non-Speaking Moment Cards | 22 Point-and-Show Cards for Autistic Adults, Shutdown & Situational Mutism | Printable PDF Lanyard Size",
    inside: ["22 point-and-show cards: I can't speak right now, I need somewhere quieter, please don't touch me, help me find…", "Blanks to write your own, plus a contact card", "85 × 54 mm — fits a standard lanyard sleeve, wallet or phone case", "Three A4 pages, cut along the outlines; laminate to make them last"],
    why: "For the moment speech goes and you're stood in a shop. The card says it so you don't have to.",
    tags: ["non speaking cards", "situational mutism", "autism cards", "shutdown support", "communication cards", "neurodivergent", "lanyard cards", "aac cards", "autistic adults", "selective mutism", "printable pdf", "instant download", "neurodiversity"],
  },
  "My Pond Plan": {
    title: "Shutdown and Meltdown Support Plan | Early Signs, What Helps, What Makes It Worse | Printable PDF for Autistic & ADHD Adults",
    inside: ["Early signs — what shows up before a shutdown or meltdown", "What helps: a place, a sound, an object, a person, being left alone", "What makes it harder, named plainly", "Afterwards, what helps you recover; two A4 pages, one to hand to someone"],
    why: "A plan for hard moments, written on a calm one. Change it whenever you learn something new.",
    tags: ["meltdown plan", "shutdown plan", "autism support plan", "sensory overload", "crisis plan", "neurodivergent", "adhd printable", "autistic adults", "self regulation", "care plan", "printable pdf", "instant download", "neurodiversity"],
  },
  "Access Needs Cards": {
    title: "Access Needs Cards | 6 Cut-Out Cards: I Communicate Better in Writing, I Need a Moment to Process | Printable PDF for Neurodivergent Adults",
    inside: ["Six ready-written cards to hand over instead of explaining out loud", "I communicate better in writing · I need a moment to process · please don't touch me", "A sheet of blanks to write your own", "Two A4 pages; print, cut, keep a few in your wallet"],
    why: "For appointments, new workplaces, shops — any moment where saying it out loud is the hardest part.",
    tags: ["access needs", "accommodation cards", "autism cards", "adhd cards", "communication cards", "neurodivergent", "disability cards", "self advocacy", "sensory needs", "wallet cards", "printable pdf", "instant download", "neurodiversity"],
  },
  "What I'm Actually Good At": {
    title: "What I'm Actually Good At | Strengths Worksheet After an Autism or ADHD Assessment | Printable PDF Reframing Sheet",
    inside: ["Things I do better than most people — not modestly, accurately", "What people come to me for", "A time my brain worked exactly right", "A traits-reframed table: what you were criticised for, written the true way round. Two A4 pages"],
    why: "Diagnostic paperwork is a list of deficits. This is the other half of the assessment.",
    tags: ["adhd strengths", "autism strengths", "late diagnosed", "post diagnosis", "self esteem", "neurodivergent", "reframing", "strengths worksheet", "autistic adults", "adhd adults", "printable pdf", "instant download", "neurodiversity"],
  },
  "Good Day Blueprint": {
    title: "Good Day Blueprint | Work Backwards From a Day That Felt Right | Printable PDF Planner for ADHD & Autistic Adults",
    inside: ["Start from a day that actually felt right — recent or not", "What time it started, who was in it, how much was planned, what you ate, how noisy it was", "Pull out the ingredients you can repeat", "One A4 page"],
    why: "Good days aren't luck — they have components. This finds yours.",
    tags: ["good day planner", "adhd planner", "autism planner", "routine planner", "self care worksheet", "neurodivergent", "burnout prevention", "daily routine", "wellbeing printable", "reflection sheet", "printable pdf", "instant download", "neurodiversity"],
  },
  "Ask For It Properly": {
    title: "Workplace Accommodations Request Builder | Reasonable Adjustments Sheet for ADHD & Autistic Adults | Printable PDF",
    inside: ["Builds the request line by line: the situation, the effect on the work, the specific ask, what it costs them", "Ten common asks to tick", "No apology, no justifying your existence — just what happens and what fixes it", "Two A4 pages"],
    why: "Requests land better when they name a specific problem and offer a specific fix. This writes it with you.",
    tags: ["adjustments", "work accommodations", "adhd at work", "autism at work", "accommodation", "neurodivergent", "access to work", "self advocacy", "employment support", "hr letter", "printable pdf", "instant download", "neurodiversity"],
  },
  "After The Diagnosis": {
    title: "After The Diagnosis | Late-Diagnosed Autism & ADHD Reflection Sheet: Relief, Grief, What Made Sense, Who to Tell | Printable PDF",
    inside: ["What you felt when you found out — tick freely, contradictions allowed", "Things that suddenly made sense", "Who you've told, and who doesn't need to know", "Two A4 pages; come back to it over months, not days"],
    why: "Nobody hands you this part. Relief, grief and anger can all land in the same hour, and there's no right order.",
    tags: ["late diagnosed", "adhd diagnosis", "autism diagnosis", "post diagnosis", "late diagnosis adult", "neurodivergent", "self discovery", "reflection worksheet", "autistic adults", "adhd adults", "printable pdf", "instant download", "neurodiversity"],
  },
  "Finding My People": {
    title: "Finding My People | Friendship Without Small Talk, Shared Interests and Side-by-Side Time | Printable PDF for Autistic & ADHD Adults",
    inside: ["What you actually want more of: one or two close people, someone to be quiet near, text-based contact", "Places organised around a thing, not around chat", "A low-effort contact list", "One small move. One A4 page"],
    why: "Wanting friendship and finding the usual routes to it unbearable is not a contradiction.",
    tags: ["making friends", "autism friendship", "adhd friendship", "social anxiety", "loneliness", "neurodivergent", "social skills", "connection", "adult friendship", "introvert", "printable pdf", "instant download", "neurodiversity"],
  },
  "The Handover Sheet": {
    title: "The Handover Sheet | Everything the Next Carer Needs to Know: Respite, Hospital, Sitter, School Trip | Autism & ADHD Printable PDF",
    inside: ["How they communicate, and what changes when they're stressed", "What a good hour looks like; early warning signs", "A do / don't table", "Two A4 pages — fill in once, photocopy it, done. Written to be understood by someone who has never met them"],
    why: "For respite, a hospital stay, a sitter, or the day you're ill. Everything the next person needs, on one sheet.",
    tags: ["care handover", "respite care", "autism care plan", "all about me", "hospital passport", "neurodivergent", "sen parent", "carer sheet", "babysitter notes", "special needs", "printable pdf", "instant download", "neurodiversity"],
  },
  "Your Sheet, For Once": {
    title: "Your Sheet, For Once | Carer & SEN Parent Check-In: Your Warning Signs, Respite Named Properly, Scripts for Asking | Printable PDF",
    inside: ["Where you actually are today: running on empty → alright, actually", "Your own warning signs — you can spot theirs instantly; these are yours", "Twenty minutes of respite, named properly", "Scripts for asking without apologising. One A4 page, needs showing to nobody"],
    why: "Every form you've filled in this year has been about someone else. This one isn't.",
    tags: ["carer self care", "sen parent", "parent burnout", "carer burnout", "respite", "nd family", "autism parent", "adhd parent", "self care worksheet", "wellbeing check in", "printable pdf", "instant download", "neurodiversity"],
  },
  "For The Sibling": {
    title: "For The Sibling | A Sheet for the One Who Got Good at Being Fine, for Siblings of Autistic and ADHD People | Printable PDF",
    inside: ["Things I got very good at: being fine, being quiet, sorting it myself", "Things I didn't ask for, but wanted", "What I love about them — both things allowed on the same page", "What I'd like more of now. One A4 page"],
    why: "Houses like yours run on everyone adjusting, and you did your share early. That can be true at the same time as loving them.",
    tags: ["sibling support", "autism sibling", "adhd sibling", "glass child", "sen sibling", "nd family", "family worksheet", "sibling worksheet", "young carer", "family therapy", "printable pdf", "instant download", "neurodiversity"],
  },
  "Lily Pad Planner": {
    title: "Lily Pad Planner | Gentle Weekly Planner & Daily Tracker for ADHD Adults — 3 Big Rocks, Froggy Wins Column | Cute Frog Printable PDF",
    inside: ["Weekly overview: Mon–Sun with your top three big rocks for the week", "A froggy wins column — anything counts, even the tiny hops", "A daily tracker page", "Three A4 pages, undated: print a fresh week whenever you need one"],
    why: "No need to leap ahead — just hop to the next lily pad.",
    tags: ["adhd planner", "weekly planner", "cute frog planner", "gentle planner", "undated planner", "neurodivergent", "executive function", "habit tracker", "daily tracker", "frog printable", "printable pdf", "instant download", "neurodiversity"],
  },
  "Hoppy Thoughts — Issue 01": {
    title: "Hoppy Thoughts Zine Issue 01 | Frog Jokes, One-Liners and Gentle Truths for ADHD & Autistic Brains | 8-Page Printable Zine PDF",
    inside: ["An eight-page zine of frog-themed jokes, one-liners and gentle truths", "Focus, executive function, sensory everything, social battery, rest", "Read front to back, or flip to whatever lily pad calls to you", "A4, prints as single pages or a booklet"],
    why: "A little zine of frog logic, for brains that work sideways.",
    tags: ["zine", "printable zine", "adhd humour", "autism humour", "neurodivergent gift", "frog zine", "cute frog", "mental health zine", "adhd gift", "autism gift", "printable pdf", "instant download", "neurodiversity"],
  },
  "Hoppy Thoughts — Issue 02": {
    title: "Hoppy Thoughts Zine Issue 02, The Slow Season | Work & School Accommodations, Relationships, Holidays, Frog Horoscope | Printable Zine PDF",
    inside: ["Work and school accommodations", "Relationships and communication; holidays and big gatherings", "Dear Frog — an advice column", "Your froggy horoscope. Eight A4 pages, prints as single pages or a booklet"],
    why: "The slow season edition: work, love, holidays and hibernation.",
    tags: ["zine", "printable zine", "adhd humour", "autism humour", "neurodivergent gift", "frog zine", "holiday survival", "accommodations", "adhd gift", "autism gift", "printable pdf", "instant download", "neurodiversity"],
  },
  "Affirmation Cards": {
    title: "Affirmation Cards for Neurodivergent Adults | 24 Cut-Out Cards: My Pace Is Not a Flaw, Slow Days Are Still Days | Cute Frog Printable PDF",
    inside: ["24 cards to cut out and keep where you'll actually see them", "“My pace is not a flaw. It's just my pace.” “Small hops still move me across the pond.”", "Nothing here needs to be earned first", "Two A4 pages, cut along the lines"],
    why: "Twenty-four lines for the days the inner voice is unkind.",
    tags: ["affirmation cards", "affirmations", "adhd affirmations", "autism affirmations", "self compassion", "neurodivergent", "cute frog", "positivity cards", "mental health cards", "self love cards", "printable pdf", "instant download", "neurodiversity"],
  },
  "Habit Stacking Cards": {
    title: "Habit Stacking Cards | After I ___, I Will ___ — Fill-in Cards for ADHD Routines | Cute Frog Printable PDF",
    inside: ["Fill-in cards: After I ______, I will drink one glass of water / take my meds / put one dish in the sink", "Attach one small habit to something you already do without thinking", "Then stop thinking about it", "Two A4 pages, cut out and stick where the habit happens"],
    why: "Habits that hang off something you already do don't need remembering.",
    tags: ["habit stacking", "adhd habits", "habit cards", "routine cards", "executive function", "neurodivergent", "adhd routine", "habit tracker", "cute frog", "productivity", "printable pdf", "instant download", "neurodiversity"],
  },
  "Translation Cards": {
    title: "Translation Cards | 12 Self-Talk Swaps: 'I'm Lazy' → 'I'm Conserving Energy for What Matters' | Cute Frog Printable PDF for ADHD & Autism",
    inside: ["Twelve harsh things you say about yourself, each with a truer sentence beside it", "“I'm too sensitive” → “I notice things at a different volume than most”", "“I can't focus” → “My attention free-ranges instead of staying fenced in”", "Two A4 pages, ready to use"],
    why: "The harsh thing you say about yourself, and a truer sentence to put next to it.",
    tags: ["self talk", "cognitive reframing", "adhd self esteem", "autism self esteem", "rsd", "neurodivergent", "cute frog", "mental health cards", "self compassion", "cbt cards", "printable pdf", "instant download", "neurodiversity"],
  },
  "Frog Logic Stickers": {
    title: "Printable Neurodivergent Stickers | 18 Designs to Print at Home: Low Spoons, Touched Out, Do Not Perceive Me | ADHD & Autism Sticker PDF",
    inside: ["Eighteen designs across two A4 sheets, 54 mm square", "Low spoons today, touched out, rejection sensitive, stimming, demand avoidant, do not perceive me, sensory seeking, recharging…", "Sticker paper from any stationers works; so does ordinary paper with a glue stick", "Cut along the dashed lines, or round the corners so they last on a water bottle"],
    why: "Every design in the sticker collection, to print at home on whatever paper you already have.",
    tags: ["printable stickers", "nd stickers", "adhd stickers", "autism stickers", "sticker sheet", "spoon theory", "sensory stickers", "laptop stickers", "bottle stickers", "digital stickers", "printable pdf", "instant download", "neurodiversity"],
  },
};

function description(p, c, pages) {
  return [
    `${p.line}`,
    "",
    "WHAT YOU GET",
    ...c.inside.map((l) => "• " + l),
    `• Two PDFs: A4 and US Letter (${pages} page${pages > 1 ? "s" : ""} each)`,
    "",
    "HOW IT WORKS",
    "This is a digital download. Nothing is posted. As soon as payment clears, Etsy gives you the files to download from your purchases page and by email. Print at home as many times as you like, in colour or black and white, or keep the PDF on your phone.",
    "",
    "WHO IT'S FOR",
    "Made by a neurodivergent maker for ADHD, autistic, AuDHD and otherwise differently wired adults. No condition labels on the sheet itself, so it can live on a fridge or a desk without announcing anything.",
    "",
    c.why,
    "",
    "Personal use only. Please don't resell or share the files. If anything is wrong with your download, message me and I'll sort it.",
    "",
    "Frog Logic — soft landings for busy brains.",
  ].join("\n");
}

// --- the five listing images ---------------------------------------------
function frame(inner, bg) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="${bg}"/>${inner}</svg>`;
}
function artBlock(p, logoData, x, y, size) {
  const art = String(p.svg).replace(/href="assets\/frog-logic-mark-sm\.png"/g, `href="${logoData}"`).replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  return `<g transform="translate(${x},${y}) scale(${size / 300})"><rect width="300" height="300" fill="${p.bg}"/>${art}</g>`;
}
function textLines(lines, x, y, size, lead, font, fill, weight = 400, opacity = 1, anchor = "start") {
  return lines.map((l, i) => `<text x="${x}" y="${y + i * lead}" text-anchor="${anchor}" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${fill}" opacity="${opacity}">${esc(l)}</text>`).join("");
}

function img1(p, logoData) { // hero: art left, title right
  const t = wrap(p.word, 14).slice(0, 4);
  const ts = t.length > 2 ? 78 : 96;
  const tx = 1130;
  return frame(
    artBlock(p, logoData, 130, 200, 900) +
    `<text x="${tx}" y="300" font-family="Space Mono" font-size="26" letter-spacing="4" fill="${GOLD}">PRINTABLE PDF · INSTANT DOWNLOAD</text>` +
    textLines(t, tx, 420, ts, ts * 1.08, "Fraunces", CREAM, 600) +
    textLines(wrap(p.line.split(/(?<=[.!?])\s+/)[0], 34).slice(0, 5), tx, 420 + t.length * ts * 1.08 + 50, 36, 50, "Space Grotesk", CREAM, 400, 0.85) +
    `<text x="${tx}" y="${H - 150}" font-family="Space Mono" font-size="44" fill="${GOLD}">£${PRICE}</text>` +
    `<text x="${W - 150}" y="${H - 150}" text-anchor="end" font-family="Space Mono" font-size="30" fill="${CREAM}" opacity="0.6">FROG LOGIC</text>`,
    INK);
}
function img2(p, c, logoData) { // what's inside
  const lines = c.inside.flatMap((l) => { const w = wrap(l, 44); return w.map((x, i) => (i ? "   " + x : "• " + x)); });
  return frame(
    artBlock(p, logoData, 1350, 300, 500) +
    `<text x="150" y="260" font-family="Space Mono" font-size="34" letter-spacing="5" fill="${INK}" opacity="0.6">WHAT'S INSIDE</text>` +
    textLines(wrap(p.word, 22).slice(0, 2), 150, 400, 96, 104, "Fraunces", INK, 600) +
    textLines(lines, 150, 400 + wrap(p.word, 22).slice(0, 2).length * 104 + 60, 44, 66, "Space Grotesk", INK, 400, 0.9) +
    `<text x="150" y="${H - 150}" font-family="Space Mono" font-size="30" fill="${INK}" opacity="0.6">A4 + US LETTER · PRINT AT HOME</text>`,
    CREAM);
}
function img3(p, pageData, pages) { // the real page
  const ph = 1180, pw = Math.round(ph * 595 / 842);
  return frame(
    `<rect x="${(W - pw) / 2 + 18}" y="${160 + 18}" width="${pw}" height="${ph}" fill="${INK}" opacity="0.18"/>` +
    `<image x="${(W - pw) / 2}" y="160" width="${pw}" height="${ph}" href="${pageData}"/>` +
    `<text x="${W / 2}" y="100" text-anchor="middle" font-family="Space Mono" font-size="32" letter-spacing="5" fill="${INK}" opacity="0.6">PAGE 1 OF ${pages} · WHAT YOU'LL PRINT</text>` +
    `<text x="${W / 2}" y="${H - 70}" text-anchor="middle" font-family="Space Grotesk" font-size="36" fill="${INK}" opacity="0.8">${esc(p.word)}</text>`,
    p.bg === INK ? CREAM : "#E9E2D2");
}
function img4(p, c) { // how it works
  const steps = [["1", "Buy it", "Etsy sends the files the moment payment clears"], ["2", "Download", "A4 and US Letter PDFs, yours to keep"], ["3", "Print at home", "As many times as you like, colour or black and white"], ["4", "Or don't print", "It reads fine on a phone or tablet too"]];
  return frame(
    `<text x="150" y="240" font-family="Space Mono" font-size="34" letter-spacing="5" fill="${GOLD}">HOW IT WORKS</text>` +
    textLines(["Instant download.", "No post, no waiting."], 150, 380, 100, 112, "Fraunces", CREAM, 600) +
    steps.map(([n, h, d], i) => {
      const y = 680 + i * 170;
      return `<circle cx="190" cy="${y - 16}" r="44" fill="${GOLD}"/><text x="190" y="${y}" text-anchor="middle" font-family="Anton" font-size="48" fill="${INK}">${n}</text>` +
        `<text x="280" y="${y - 10}" font-family="Fraunces" font-size="54" font-weight="600" fill="${CREAM}">${esc(h)}</text>` +
        `<text x="280" y="${y + 44}" font-family="Space Grotesk" font-size="34" fill="${CREAM}" opacity="0.75">${esc(d)}</text>`;
    }).join("") +
    `<text x="${W - 150}" y="${H - 150}" text-anchor="end" font-family="Space Mono" font-size="30" fill="${CREAM}" opacity="0.6">FROG LOGIC · £${PRICE}</text>`,
    INK);
}
function img5(p, c) { // why / voice
  const lines = wrap(c.why, 34);
  return frame(
    `<rect x="150" y="150" width="${W - 300}" height="${H - 300}" fill="none" stroke="${CREAM}" stroke-width="3" opacity="0.5"/>` +
    textLines(lines, W / 2, H / 2 - (lines.length - 1) * 48 - 40, 84, 96, "Instrument Serif", CREAM, 400, 1, "middle") +
    `<text x="${W / 2}" y="${H / 2 + lines.length * 48 + 100}" text-anchor="middle" font-family="Space Mono" font-size="32" letter-spacing="5" fill="${GOLD}">SOFT LANDINGS FOR BUSY BRAINS</text>` +
    `<text x="${W / 2}" y="${H - 220}" text-anchor="middle" font-family="Space Grotesk" font-size="34" fill="${CREAM}" opacity="0.7">Made by a neurodivergent maker · no condition labels on the sheet</text>`,
    p.bg);
}

(async () => {
  const { DIGITAL_PRODUCTS } = loadSiteData();
  const wanted = (process.env.BATCH || Object.keys(COPY).join(",")).split(",").map((s) => s.trim().toLowerCase());
  const items = wanted.map((w) => {
    const p = DIGITAL_PRODUCTS.find((x) => String(x.word).toLowerCase().includes(w));
    if (!p) throw new Error("no product matches " + w);
    if (!COPY[p.word]) throw new Error("no Etsy copy written for " + p.word);
    return p;
  });

  const fontDir = path.join(__dirname, ".gfonts");
  await ensureFonts(fontDir);
  const css = fontFaceCSS(fontDir);
  const logoData = "data:image/png;base64," + fs.readFileSync(path.join(__dirname, "../../assets/frog-logic-mark-sm.png")).toString("base64");
  let chromium; try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require("playwright-core")); }
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  fs.mkdirSync(OUT, { recursive: true });

  for (const p of items) {
    const c = COPY[p.word];
    const dir = path.join(OUT, slug(p.word));
    fs.mkdirSync(dir, { recursive: true });
    const pdf = pdfFor(p);
    const pages = Number(/Pages:\s+(\d+)/.exec(execFileSync("pdfinfo", [pdf]).toString())[1]);
    fs.copyFileSync(pdf, path.join(dir, slug(p.word) + "-A4.pdf"));
    execFileSync("python3", ["-I", path.join(__dirname, "etsy-letter.py"), pdf, path.join(dir, slug(p.word) + "-US-Letter.pdf")]);
    execFileSync("pdftoppm", ["-png", "-r", "110", "-f", "1", "-l", "1", "-singlefile", pdf, path.join(dir, "page1")]);
    const pageData = "data:image/png;base64," + fs.readFileSync(path.join(dir, "page1.png")).toString("base64");
    fs.unlinkSync(path.join(dir, "page1.png"));

    const svgs = [img1(p, logoData), img2(p, c, logoData), img3(p, pageData, pages), img4(p, c), img5(p, c)];
    for (let i = 0; i < svgs.length; i++) {
      const ctx = await browser.newContext({ viewport: { width: W, height: H } });
      const page = await ctx.newPage();
      await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${css}html,body{margin:0;padding:0}.stage{width:${W}px;height:${H}px;overflow:hidden}.stage svg{display:block;width:100%;height:100%}</style></head><body><div class="stage">${svgs[i]}</div></body></html>`, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(120);
      await (await page.$(".stage")).screenshot({ path: path.join(dir, `${i + 1}-${slug(p.word)}.jpg`), type: "jpeg", quality: 90 });
      await ctx.close();
    }
    const title = c.title.slice(0, 140);
    fs.writeFileSync(path.join(dir, "listing.txt"), [
      "TITLE (" + title.length + "/140)", title, "",
      "PRICE", "£" + PRICE, "",
      "TYPE", "Digital download · Category: Paper & Party Supplies > Paper > Stationery > Planners & Organisers (or Templates)", "",
      "TAGS (13, paste one per box)", ...c.tags.map((t) => t.slice(0, 20)), "",
      "DESCRIPTION", description(p, c, pages), "",
      "FILES TO UPLOAD", slug(p.word) + "-A4.pdf", slug(p.word) + "-US-Letter.pdf", "",
      "IMAGES (in this order)", ...[1, 2, 3, 4, 5].map((i) => `${i}-${slug(p.word)}.jpg`),
    ].join("\n") + "\n");
    console.log("built", p.word, pages + "pp");
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
