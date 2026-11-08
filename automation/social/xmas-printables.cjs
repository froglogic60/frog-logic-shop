// Christmas printables, plus the year-round Visual Timetable Cards (D45, 8 Nov 2026)
// Two Christmas printables (Sam, 28 Oct 2026: "Get creative again" ... "Go!").
//
// 1. A FREE Christmas Day visual timetable for autistic children: a "My
//    Christmas Day" schedule to fill in, a sheet of twenty picture cards to
//    cut out, and a "first / then" board with an "I need a break" card and
//    a short note for the grown-ups. Free to share, like the Pond Guides.
//      digital/Christmas-Visual-Timetable.pdf (A4) and -Letter.pdf
// 2. Printable THANK-YOU CARDS for TAs, 1:1s, teachers and SEN staff, £3:
//    three fold-in-half cards with the Comfort Creature frog.
//      digital/Thank-You-Cards-SEN-Staff.pdf (A4) and -Letter.pdf
//    These are PAID: netlify.toml 404s their public addresses.
// Previews (PNG) go to automation/social/xmas-printables/ for the site and Etsy.
//
// Built in headless Chromium with the site's fonts. Run by the "Build the
// Christmas printables" workflow (xmas-printables.yml).
const fs = require("fs");
const path = require("path");
const { ensureFonts, fontFaceCSS } = require("./gfonts.js");

const ROOT = path.join(__dirname, "..", "..");
// TES=1 builds the Tes copies (no web address: Tes bars links that promote selling), into OUT_DIR.
const TES = process.env.TES === "1";
const DIGITAL = process.env.OUT_DIR ? path.resolve(process.env.OUT_DIR) : path.join(ROOT, "digital");
const PREV = process.env.OUT_DIR ? path.join(path.resolve(process.env.OUT_DIR), "prev") : path.join(__dirname, "xmas-printables");
const DMSANS = "https://raw.githubusercontent.com/google/fonts/main/ofl/dmsans/DMSans%5Bopsz,wght%5D.ttf";
const C = { cream: "#F4EFE3", ink: "#22331F", brown: "#6B4A32", sage: "#8FB784", red: "#B5443A", gold: "#E8B63C", pink: "#F08F87", blue: "#6E9BC8", sand: "#E2C99F", grey: "#9AA7B0" };
const S = `stroke="${C.ink}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"`;

// ---- picture-card icons, drawn in the frogs' style (thick dark line, soft fills). 100x100.
const ICONS = {
  "Wake up": `<path d="M10 72 H90" ${S}/><path d="M25 72 A25 25 0 0 1 75 72 Z" fill="${C.gold}" ${S}/><path d="M50 22 V32 M22 36 L29 43 M78 36 L71 43 M12 58 H20 M80 58 H88" ${S} fill="none"/>`,
  "Toilet": `<path d="M28 20 H62 V46 H28 Z" fill="#fff" ${S}/><path d="M20 46 H80 C80 66 68 74 50 74 C32 74 20 66 20 46 Z" fill="#fff" ${S}/><path d="M38 74 L35 88 H65 L62 74" fill="#fff" ${S}/>`,
  "Breakfast": `<path d="M14 50 H86 C86 72 70 84 50 84 C30 84 14 72 14 50 Z" fill="${C.blue}" ${S}/><circle cx="38" cy="44" r="6" fill="${C.gold}" ${S}/><circle cx="54" cy="42" r="6" fill="${C.gold}" ${S}/><path d="M70 50 L86 16" ${S} fill="none"/>`,
  "Get dressed": `<path d="M34 16 L14 28 L22 44 L30 40 V86 H70 V40 L78 44 L86 28 L66 16 C62 24 38 24 34 16 Z" fill="${C.sage}" ${S}/>`,
  "Presents": `<rect x="18" y="40" width="64" height="46" fill="${C.red}" ${S}/><rect x="14" y="30" width="72" height="14" fill="${C.red}" ${S}/><path d="M50 30 V86" ${S}/><path d="M50 30 C40 14 26 20 34 30 M50 30 C60 14 74 20 66 30" fill="none" ${S}/>`,
  "Quiet time": `<path d="M20 60 V48 C20 30 34 18 50 18 C66 18 80 30 80 48 V60" fill="none" ${S}/><rect x="12" y="56" width="18" height="28" rx="6" fill="${C.sage}" ${S}/><rect x="70" y="56" width="18" height="28" rx="6" fill="${C.sage}" ${S}/>`,
  "Go outside": `<path d="M50 14 L22 58 H38 L24 78 H76 L62 58 H78 Z" fill="${C.sage}" ${S}/><path d="M50 78 V90" ${S}/>`,
  "Watch TV": `<rect x="12" y="24" width="76" height="52" rx="6" fill="${C.blue}" ${S}/><path d="M36 88 H64 M50 76 V88 M38 12 L50 24 L62 12" fill="none" ${S}/>`,
  "Visitors": `<circle cx="34" cy="32" r="12" fill="${C.pink}" ${S}/><path d="M14 86 C14 62 54 62 54 86 Z" fill="${C.blue}" ${S}/><circle cx="68" cy="38" r="10" fill="${C.sand}" ${S}/><path d="M52 86 C52 66 86 66 86 86 Z" fill="${C.sage}" ${S}/>`,
  "Car journey": `<path d="M12 64 V50 L24 30 H70 L84 50 H90 V64 Z" fill="${C.red}" ${S}/><path d="M30 34 L24 48 H46 V34 Z M54 34 V48 H74 L66 34 Z" fill="#fff" ${S}/><circle cx="30" cy="66" r="9" fill="#fff" ${S}/><circle cx="72" cy="66" r="9" fill="#fff" ${S}/>`,
  "Christmas dinner": `<circle cx="50" cy="54" r="30" fill="#fff" ${S}/><circle cx="50" cy="54" r="18" fill="${C.sand}" ${S}/><path d="M8 24 V44 M8 44 V88 M92 24 C84 30 84 44 92 48 V88" fill="none" ${S}/>`,
  "Pudding": `<path d="M18 68 C18 38 82 38 82 68 Z" fill="${C.brown}" ${S}/><path d="M18 68 H82" ${S}/><path d="M30 48 C38 54 46 44 50 50 C56 56 64 46 70 50" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/><circle cx="50" cy="32" r="5" fill="${C.red}" ${S}/><path d="M50 32 L38 24 M50 32 L62 24" ${S}/>`,
  "Play a game": `<rect x="18" y="18" width="64" height="64" rx="12" fill="#fff" ${S}/><circle cx="34" cy="34" r="5" fill="${C.ink}"/><circle cx="66" cy="34" r="5" fill="${C.ink}"/><circle cx="50" cy="50" r="5" fill="${C.ink}"/><circle cx="34" cy="66" r="5" fill="${C.ink}"/><circle cx="66" cy="66" r="5" fill="${C.ink}"/>`,
  "Video call": `<rect x="28" y="10" width="44" height="80" rx="8" fill="#fff" ${S}/><circle cx="50" cy="42" r="10" fill="${C.pink}" ${S}/><path d="M36 72 C36 56 64 56 64 72" fill="none" ${S}/>`,
  "Snack": `<path d="M50 30 C34 18 14 28 18 52 C22 76 38 88 50 82 C62 88 78 76 82 52 C86 28 66 18 50 30 Z" fill="${C.red}" ${S}/><path d="M50 30 C50 22 54 16 60 12" fill="none" ${S}/>`,
  "Bath": `<path d="M10 50 H90 V60 C90 74 78 82 64 82 H36 C22 82 10 74 10 60 Z" fill="#fff" ${S}/><path d="M18 50 V24 C18 16 30 16 30 24" fill="none" ${S}/><circle cx="48" cy="38" r="6" fill="${C.blue}" ${S}/><circle cx="64" cy="30" r="8" fill="${C.blue}" ${S}/><path d="M26 82 L22 90 M74 82 L78 90" ${S}/>`,
  "Pyjamas": `<path d="M30 14 L12 26 L20 40 L28 36 V60 H72 V36 L80 40 L88 26 L70 14 C66 22 34 22 30 14 Z" fill="${C.blue}" ${S}/><path d="M28 60 L26 88 H46 L50 70 L54 88 H74 L72 60" fill="${C.blue}" ${S}/><path d="M50 22 V60" ${S}/>`,
  "Story": `<path d="M50 26 C40 18 22 18 12 22 V80 C22 76 40 76 50 84 C60 76 78 76 88 80 V22 C78 18 60 18 50 26 Z" fill="#fff" ${S}/><path d="M50 26 V84" ${S}/>`,
  "Bed": `<path d="M10 40 V84 M90 60 V84 M10 72 H90" ${S}/><rect x="10" y="56" width="80" height="16" fill="${C.sage}" ${S}/><rect x="16" y="44" width="24" height="14" rx="5" fill="#fff" ${S}/><path d="M70 14 C60 20 60 38 74 42 C66 44 56 36 58 24 C59 18 64 14 70 14 Z" fill="${C.gold}" ${S}/>`,
  "": "",
};

// ---- 29 more for the paid Big Pack (19 + 29 = 48 drawn, 12 blank) (Sam, 28 Oct 2026: "yes do 1 and 2"). The
// free timetable keeps exactly the 20 above.
const EXTRA = {
  "Shower": `<path d="M20 14 H50 V26" fill="none" ${S}/><path d="M36 26 H64 L72 40 H28 Z" fill="${C.grey}" ${S}/><path d="M36 52 L32 64 M50 52 V66 M64 52 L68 64 M42 74 L38 86 M58 74 L62 86" fill="none" stroke="${C.blue}" stroke-width="5" stroke-linecap="round"/>`,
  "Brush teeth": `<rect x="10" y="62" width="62" height="12" rx="6" fill="${C.blue}" ${S}/><rect x="60" y="46" width="26" height="16" rx="3" fill="#fff" ${S}/><path d="M64 46 V34 M71 46 V34 M78 46 V34" ${S}/>`,
  "Medicine": `<g transform="rotate(-35 50 50)"><rect x="18" y="36" width="64" height="28" rx="14" fill="#fff" ${S}/><path d="M50 36 H68 A14 14 0 0 1 68 64 H50 Z" fill="${C.red}" ${S}/></g>`,
  "Church": `<path d="M20 88 V52 L50 30 L80 52 V88 Z" fill="${C.sand}" ${S}/><path d="M50 30 V10 M42 17 H58" fill="none" ${S}/><path d="M42 88 V70 A8 8 0 0 1 58 70 V88" fill="#fff" ${S}/>`,
  "Shopping": `<path d="M20 36 H80 L74 88 H26 Z" fill="${C.gold}" ${S}/><path d="M36 36 V28 C36 12 64 12 64 28 V36" fill="none" ${S}/>`,
  "Train": `<rect x="22" y="12" width="56" height="64" rx="10" fill="${C.blue}" ${S}/><rect x="30" y="22" width="40" height="22" rx="3" fill="#fff" ${S}/><circle cx="36" cy="60" r="5" fill="#fff" ${S}/><circle cx="64" cy="60" r="5" fill="#fff" ${S}/><path d="M32 76 L22 90 M68 76 L78 90" ${S}/>`,
  "Plane": `<path d="M50 8 C56 8 56 20 56 30 L88 52 V60 L56 50 V74 L66 82 V88 L50 84 L34 88 V82 L44 74 V50 L12 60 V52 L44 30 C44 20 44 8 50 8 Z" fill="#fff" ${S}/>`,
  "Walk": `<ellipse cx="34" cy="64" rx="11" ry="17" fill="${C.brown}" ${S}/><ellipse cx="66" cy="34" rx="11" ry="17" fill="${C.brown}" ${S}/>`,
  "Playground": `<path d="M18 88 V28 H34 V88" fill="none" ${S}/><path d="M18 46 H34 M18 64 H34" ${S}/><path d="M34 28 C60 28 58 82 88 86" fill="none" stroke="${C.red}" stroke-width="10" stroke-linecap="round"/>`,
  "Grandparents' house": `<path d="M14 50 L50 18 L86 50 V88 H14 Z" fill="${C.sand}" ${S}/><path d="M50 76 C40 68 36 60 42 55 C46 52 50 57 50 57 C50 57 54 52 58 55 C64 60 60 68 50 76 Z" fill="${C.pink}" ${S}/>`,
  "Party": `<ellipse cx="38" cy="34" rx="16" ry="20" fill="${C.red}" ${S}/><ellipse cx="64" cy="40" rx="16" ry="20" fill="${C.blue}" ${S}/><path d="M38 54 C34 68 44 76 40 90 M64 60 C60 72 70 78 64 90" fill="none" ${S}/>`,
  "Music": `<path d="M38 74 V24 L76 16 V66" fill="none" ${S}/><ellipse cx="30" cy="74" rx="10" ry="8" fill="${C.ink}"/><ellipse cx="68" cy="66" rx="10" ry="8" fill="${C.ink}"/>`,
  "Crafts": `<rect x="14" y="14" width="52" height="66" rx="4" fill="#fff" ${S}/><path d="M48 84 L84 48 L74 38 L38 74 Z" fill="${C.gold}" ${S}/><path d="M38 74 L34 88 L48 84 Z" fill="${C.sand}" ${S}/>`,
  "Baking": `<circle cx="50" cy="24" r="12" fill="${C.sand}" ${S}/><path d="M38 40 H62 L82 52 L76 60 L62 54 V68 L72 88 L62 90 L50 74 L38 90 L28 88 L38 68 V54 L24 60 L18 52 Z" fill="${C.sand}" ${S}/><circle cx="50" cy="52" r="3" fill="${C.red}"/><circle cx="50" cy="62" r="3" fill="${C.red}"/>`,
  "Decorate the tree": `<path d="M50 10 L20 58 H36 L22 80 H78 L64 58 H80 Z" fill="${C.sage}" ${S}/><path d="M50 80 V92" ${S}/><circle cx="40" cy="50" r="5" fill="${C.red}"/><circle cx="60" cy="64" r="5" fill="${C.gold}"/><circle cx="46" cy="70" r="5" fill="${C.blue}"/><circle cx="56" cy="38" r="5" fill="${C.pink}"/>`,
  "Stocking": `<path d="M36 22 H64 V56 L80 66 C90 74 82 92 66 86 L36 68 Z" fill="${C.red}" ${S}/><rect x="32" y="10" width="36" height="14" rx="3" fill="#fff" ${S}/>`,
  "Write cards": `<rect x="12" y="24" width="76" height="52" rx="4" fill="#fff" ${S}/><path d="M12 28 L50 58 L88 28" fill="none" ${S}/>`,
  "Video game": `<path d="M24 32 H76 C88 32 92 70 82 74 C74 78 68 64 62 62 H38 C32 64 26 78 18 74 C8 70 12 32 24 32 Z" fill="${C.grey}" ${S}/><path d="M30 44 V58 M23 51 H37" ${S}/><circle cx="64" cy="46" r="4" fill="${C.ink}"/><circle cx="73" cy="55" r="4" fill="${C.ink}"/>`,
  "Phone call": `<path d="M28 12 L42 28 L34 40 C40 52 48 60 60 66 L72 58 L88 72 L78 86 C48 86 14 52 14 22 Z" fill="${C.sage}" ${S}/>`,
  "Lunch": `<path d="M14 66 L50 18 L86 66 Z" fill="${C.sand}" ${S}/><path d="M18 64 H82" stroke="${C.sage}" stroke-width="7"/><path d="M14 68 H86 V78 H14 Z" fill="${C.sand}" ${S}/>`,
  "Drink": `<path d="M24 30 H70 L64 88 H30 Z" fill="${C.blue}" ${S}/><path d="M46 30 L58 8" fill="none" ${S}/>`,
  "Sweets": `<path d="M38 90 V40 C38 18 72 18 72 40" fill="none" stroke="${C.ink}" stroke-width="20" stroke-linecap="round"/><path d="M38 90 V40 C38 18 72 18 72 40" fill="none" stroke="#fff" stroke-width="11" stroke-linecap="round"/><path d="M38 90 V40 C38 18 72 18 72 40" fill="none" stroke="${C.red}" stroke-width="11" stroke-dasharray="7 8"/>`,
  "Crackers": `<path d="M30 40 H70 V60 H30 Z" fill="${C.red}" ${S}/><path d="M30 40 L12 30 V70 L30 60 Z M70 40 L88 30 V70 L70 60 Z" fill="${C.gold}" ${S}/>`,
  "Photos": `<rect x="12" y="30" width="76" height="50" rx="8" fill="${C.grey}" ${S}/><path d="M34 30 L40 20 H60 L66 30" fill="${C.grey}" ${S}/><circle cx="50" cy="55" r="14" fill="#fff" ${S}/>`,
  "Wait": `<path d="M26 12 H74 M26 88 H74" ${S}/><path d="M32 12 C32 36 50 42 50 50 C50 58 32 64 32 88 H68 C68 64 50 58 50 50 C50 42 68 36 68 12 Z" fill="#fff" ${S}/><path d="M38 84 C40 72 50 68 50 68 C50 68 60 72 62 84 Z" fill="${C.gold}"/>`,
  "Finished": `<circle cx="50" cy="50" r="38" fill="${C.sage}" ${S}/><path d="M32 52 L45 64 L70 38" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`,
  "Help": `<path d="M34 88 V54 L26 42 C23 36 31 31 36 37 L42 46 V20 C42 13 50 13 50 20 V42 V14 C50 7 58 7 58 14 V42 V18 C58 11 66 11 66 18 V44 V28 C66 21 74 21 74 28 V60 C74 76 66 88 54 88 Z" fill="${C.sand}" ${S}/>`,
  "Hug": `<circle cx="36" cy="26" r="11" fill="${C.pink}" ${S}/><circle cx="64" cy="26" r="11" fill="${C.sand}" ${S}/><path d="M16 88 C16 54 50 46 50 46 C50 46 84 54 84 88 Z" fill="${C.blue}" ${S}/><path d="M28 64 C42 56 58 56 72 64" fill="none" ${S}/>`,
  "Stop": `<path d="M34 10 H66 L90 34 V66 L66 90 H34 L10 66 V34 Z" fill="${C.red}" ${S}/><text x="50" y="59" text-anchor="middle" font-family="DM Sans, sans-serif" font-weight="700" font-size="24" fill="#fff">STOP</text>`,
};

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const icon = (k, size) => `<svg viewBox="0 0 100 100" width="${size}" height="${size}">${ICONS[k] || EXTRA[k]}</svg>`;

function timetableHTML(frog) {
  const row = (n) => `<div class="row"><div class="when">${n === 0 ? "First" : n === 7 ? "Last" : "Then"}</div><div class="slot"></div><div class="line"></div><div class="tick"></div></div>`;
  const cards = Object.keys(ICONS).map((k) => `<div class="pc">${k ? icon(k, 92) : ""}<div class="lab">${k ? esc(k) : "&nbsp;"}</div></div>`).join("");
  return `
<section class="page">
  <div class="head"><div><div class="kick">FREE · PRINT · CUT · STICK</div><h1>My Christmas Day</h1><p class="sub">Put a picture card in each box, in order. Tick each one when it's done.</p></div><img class="frog" src="${frog}"></div>
  <div class="rows">${[0, 1, 2, 3, 4, 5, 6, 7].map(row).join("")}</div>
  <div class="foot">Free to share — print it, forward it, hand it to anyone who needs it. More free guides ${TES ? "in the FrogLogic shop on Tes" : "at froglogic.co.uk"}</div>
</section>
<section class="page">
  <div class="kick">CUT ALONG THE DASHED LINES</div><h2>Picture cards</h2>
  <div class="grid">${cards}</div>
  <p class="sub small">The blank card is for anything special to your day. Draw it or write it.</p>
  <div class="foot">Free to share. More free guides ${TES ? "in the FrogLogic shop on Tes" : "at froglogic.co.uk"}</div>
</section>
<section class="page">
  <div class="kick">FOR WHEN IT GETS A BIT MUCH</div><h2>First, then</h2>
  <div class="ft"><div><div class="ftl">First</div><div class="ftb"></div></div><div class="arrow">→</div><div><div class="ftl">Then</div><div class="ftb"></div></div></div>
  <div class="break">${icon("Quiet time", 120)}<div><div class="bt">I need a break</div><div class="bs">Show this card. Somewhere quiet, no questions, back when I'm ready.</div></div></div>
  <div class="note"><h3>For the grown-ups</h3><ul>
    <li>Go through the timetable the day before, and again in the morning.</li>
    <li>If plans change, change the cards and show the new order.</li>
    <li>Keep a quiet room free, and let the break card work without questions.</li>
    <li>Safe foods are fine on Christmas Day. So are ear defenders and screens.</li>
    <li>Expect a quieter day or two afterwards.</li></ul>
    <p class="more">Explaining your child to relatives? There are free plain-English guides to autism, ADHD, PDA and more ${TES ? "in the <b>FrogLogic shop on Tes</b>" : "at <b>froglogic.co.uk</b>"}</p></div>
  <div class="foot">A friendly printable from Frog Logic, made by a neurodivergent person in the UK. Not medical advice.</div>
</section>`;
}

// The paid Big Pack (D39): the free timetable's schedule, plus a now/next board,
// a holiday-week planner, 60 picture cards (48 drawn, 12 blank), first/then and
// break cards, and the grown-ups' page.
function bigPackHTML(frog) {
  const row = (n) => `<div class="row"><div class="when">${n === 0 ? "First" : n === 7 ? "Last" : "Then"}</div><div class="slot"></div><div class="line"></div><div class="tick"></div></div>`;
  const all = Object.keys(ICONS).filter(Boolean).concat(Object.keys(EXTRA));
  while (all.length < 60) all.push("");
  const cardPage = (keys, n) => `
<section class="page">
  <div class="kick">CUT ALONG THE DASHED LINES · ${n} OF 3</div><h2>Picture cards</h2>
  <div class="grid">${keys.map((k) => `<div class="pc">${k ? icon(k, 92) : ""}<div class="lab">${k ? esc(k) : "&nbsp;"}</div></div>`).join("")}</div>
  <div class="foot">Christmas Visual Timetable Big Pack · Frog Logic${TES ? "" : " · froglogic.co.uk"}</div>
</section>`;
  const days = ["Christmas Eve", "Christmas Day", "Boxing Day", "", "", "", ""];
  return `
<section class="page">
  <div class="head"><div><div class="kick">BIG PACK · PRINT · CUT · STICK</div><h1>My Christmas Day</h1><p class="sub">Put a picture card in each box, in order. Tick each one when it's done.</p></div><img class="frog" src="${frog}"></div>
  <div class="rows">${[0, 1, 2, 3, 4, 5, 6, 7].map(row).join("")}</div>
  <div class="foot">Christmas Visual Timetable Big Pack · Frog Logic${TES ? "" : " · froglogic.co.uk"}</div>
</section>
<section class="page">
  <div class="kick">ONE THING AT A TIME</div><h2>Now and next</h2>
  <div class="nn"><div><div class="ftl">Now</div><div class="nnb"></div></div><div class="arrow">→</div><div><div class="ftl">Next</div><div class="nnb"></div></div></div>
  <p class="sub small">Some days the whole timetable is too much to look at. Use just two cards: what's happening now, and what's next.</p>
  <div class="kick" style="margin-top:10mm">TODAY IS</div>
  <div class="today">${["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((d) => `<span>${d}</span>`).join("")}</div>
  <div class="foot">Christmas Visual Timetable Big Pack · Frog Logic${TES ? "" : " · froglogic.co.uk"}</div>
</section>
<section class="page">
  <div class="kick">THE WHOLE HOLIDAY</div><h2>My holiday week</h2>
  <div class="week"><div></div>${days.map((d) => `<div class="wd${d ? "" : " wdb"}">${d ? esc(d) : ""}</div>`).join("")}
  ${["Morning", "Afternoon", "Evening"].map((t) => `<div class="wt">${t}</div>${days.map(() => `<div class="ws"></div>`).join("")}`).join("")}</div>
  <p class="sub small">One card per box, or leave a box empty for a quiet one. A quiet day after a busy one helps.</p>
  <div class="foot">Christmas Visual Timetable Big Pack · Frog Logic${TES ? "" : " · froglogic.co.uk"}</div>
</section>
${[0, 1, 2].map((i) => cardPage(all.slice(i * 20, i * 20 + 20), i + 1)).join("")}
<section class="page">
  <div class="kick">FOR WHEN IT GETS A BIT MUCH</div><h2>First, then</h2>
  <div class="ft"><div><div class="ftl">First</div><div class="ftb"></div></div><div class="arrow">→</div><div><div class="ftl">Then</div><div class="ftb"></div></div></div>
  <div class="break">${icon("Quiet time", 110)}<div><div class="bt">I need a break</div><div class="bs">Show this card. Somewhere quiet, no questions, back when I'm ready.</div></div></div>
  <div class="break" style="background:#FBEFE0">${icon("Help", 110)}<div><div class="bt">I need help</div><div class="bs">Show this card. Come closer, keep it calm, ask me yes or no.</div></div></div>
  <div class="foot">Christmas Visual Timetable Big Pack · Frog Logic${TES ? "" : " · froglogic.co.uk"}</div>
</section>
<section class="page">
  <div class="kick">FOR THE GROWN-UPS</div><h2>How to use the pack</h2>
  <div class="note"><ul>
    <li>Go through the day's timetable the night before, and again in the morning.</li>
    <li>If plans change, change the cards and show the new order. A surprise on paper is easier than a surprise out loud.</li>
    <li>On a big day, use the now and next board instead of the whole timetable.</li>
    <li>Plan quiet days into the holiday week. Rest is part of the plan, not a reward.</li>
    <li>Let the break card and the help card work without questions.</li>
    <li>Laminate the cards, or print them on card, and stick Velcro dots or Blu Tack on the back. They'll last for years.</li>
    <li>The blank cards are for the things only your family does. Draw them or write them.</li>
  </ul>
  <p class="more">Explaining your child to relatives? There are free plain-English guides to autism, ADHD, PDA and more ${TES ? "in the <b>FrogLogic shop on Tes</b>" : "at <b>froglogic.co.uk</b>"}</p></div>
  <div class="foot">Thank you for buying from a small neurodivergent-run shop. For your own family's or classroom's use; please don't resell or share the file. Not medical advice.</div>
</section>`;
}

// ---- Year-round Visual Timetable Cards (D45, £5; Sam, 8 Nov 2026: "do all of them").
// UK school-day wording (school run, PE kit, packed lunch, tea time) plus a
// grown-up set, reusing the Christmas pack's drawing style and its everyday icons.
const NEW = {
  "School run": `<path d="M30 30 C30 14 70 14 70 30 V84 H30 Z" fill="${C.blue}" ${S}/><path d="M30 46 H70" ${S}/><rect x="40" y="56" width="20" height="16" rx="3" fill="${C.gold}" ${S}/><path d="M40 24 C40 10 60 10 60 24" fill="none" ${S}/>`,
  "School": `<path d="M12 88 V44 H88 V88 Z" fill="${C.sand}" ${S}/><path d="M8 46 L50 22 L92 46" fill="${C.red}" ${S}/><path d="M50 22 V8 L66 12 L50 16" fill="${C.gold}" ${S}/><path d="M42 88 V68 H58 V88" fill="#fff" ${S}/><rect x="20" y="54" width="14" height="12" fill="#fff" ${S}/><rect x="66" y="54" width="14" height="12" fill="#fff" ${S}/>`,
  "Assembly": `<circle cx="26" cy="40" r="9" fill="${C.pink}" ${S}/><circle cx="50" cy="40" r="9" fill="${C.sand}" ${S}/><circle cx="74" cy="40" r="9" fill="${C.pink}" ${S}/><path d="M12 72 C12 54 40 54 40 72 Z M36 72 C36 54 64 54 64 72 Z M60 72 C60 54 88 54 88 72 Z" fill="${C.blue}" ${S}/><path d="M8 84 H92" ${S}/>`,
  "PE kit": `<path d="M12 70 C12 58 22 56 30 56 L44 42 H56 L60 56 C76 58 88 62 88 72 V78 H12 Z" fill="#fff" ${S}/><path d="M12 72 H88" ${S}/><path d="M46 50 L52 54 M42 56 L48 60" ${S}/><path d="M60 56 C64 62 74 64 82 64" fill="none" stroke="${C.red}" stroke-width="5" stroke-linecap="round"/>`,
  "Packed lunch": `<rect x="14" y="36" width="72" height="50" rx="8" fill="${C.red}" ${S}/><path d="M14 52 H86" ${S}/><path d="M38 36 V26 C38 18 62 18 62 26 V36" fill="none" ${S}/><circle cx="50" cy="66" r="7" fill="#fff" ${S}/>`,
  "Break time": `<circle cx="50" cy="50" r="34" fill="#fff" ${S}/><path d="M50 16 C38 30 38 70 50 84 M50 16 C62 30 62 70 50 84 M18 40 C36 46 64 46 82 40 M18 60 C36 54 64 54 82 60" fill="none" stroke="${C.red}" stroke-width="4"/>`,
  "Home time": `<path d="M14 50 L50 18 L86 50 V88 H14 Z" fill="${C.sage}" ${S}/><path d="M42 88 V64 H58 V88" fill="${C.gold}" ${S}/><rect x="22" y="56" width="12" height="12" fill="#fff" ${S}/><rect x="66" y="56" width="12" height="12" fill="#fff" ${S}/>`,
  "After-school club": `<path d="M50 10 L61 36 L90 38 L68 56 L75 84 L50 69 L25 84 L32 56 L10 38 L39 36 Z" fill="${C.gold}" ${S}/>`,
  "Homework": `<rect x="16" y="14" width="50" height="70" rx="4" fill="#fff" ${S}/><path d="M26 32 H56 M26 44 H56 M26 56 H46" ${S}/><path d="M60 86 L88 58 L80 50 L52 78 Z" fill="${C.gold}" ${S}/><path d="M52 78 L48 90 L60 86 Z" fill="${C.sand}" ${S}/>`,
  "Tea time": `<circle cx="50" cy="54" r="30" fill="#fff" ${S}/><circle cx="50" cy="54" r="18" fill="${C.sand}" ${S}/><path d="M8 24 V44 M8 44 V88 M92 24 C84 30 84 44 92 48 V88" fill="none" ${S}/><path d="M40 50 H60 M44 58 H56" stroke="${C.sage}" stroke-width="5" stroke-linecap="round"/>`,
  "Bus": `<rect x="14" y="16" width="72" height="60" rx="8" fill="${C.red}" ${S}/><rect x="22" y="24" width="56" height="22" rx="3" fill="#fff" ${S}/><path d="M50 24 V46" ${S}/><circle cx="30" cy="78" r="8" fill="#fff" ${S}/><circle cx="70" cy="78" r="8" fill="#fff" ${S}/><path d="M24 60 H32 M68 60 H76" ${S}/>`,
  "Swimming": `<path d="M8 50 C18 42 26 42 36 50 C46 58 54 58 64 50 C74 42 82 42 92 50" fill="none" stroke="${C.blue}" stroke-width="7" stroke-linecap="round"/><path d="M8 70 C18 62 26 62 36 70 C46 78 54 78 64 70 C74 62 82 62 92 70" fill="none" stroke="${C.blue}" stroke-width="7" stroke-linecap="round"/><circle cx="62" cy="26" r="10" fill="${C.pink}" ${S}/><path d="M28 40 L52 32" ${S}/>`,
  "Doctor": `<rect x="14" y="30" width="72" height="54" rx="8" fill="#fff" ${S}/><path d="M38 30 V20 H62 V30" fill="none" ${S}/><path d="M44 46 H56 V52 H62 V64 H56 V70 H44 V64 H38 V52 H44 Z" fill="${C.red}" ${S}/>`,
  "Dentist": `<path d="M28 18 C16 18 14 34 18 46 C22 58 24 86 34 86 C42 86 42 64 50 64 C58 64 58 86 66 86 C76 86 78 58 82 46 C86 34 84 18 72 18 C62 18 58 24 50 24 C42 24 38 18 28 18 Z" fill="#fff" ${S}/>`,
  "Haircut": `<circle cx="28" cy="72" r="12" fill="#fff" ${S}/><circle cx="72" cy="72" r="12" fill="#fff" ${S}/><path d="M36 62 L76 14 M64 62 L24 14" ${S}/><circle cx="50" cy="40" r="3" fill="${C.ink}"/>`,
  "Library": `<rect x="14" y="20" width="16" height="66" fill="${C.red}" ${S}/><rect x="30" y="28" width="16" height="58" fill="${C.blue}" ${S}/><rect x="46" y="16" width="16" height="70" fill="${C.sage}" ${S}/><path d="M64 86 L78 26 L92 30 L78 88 Z" fill="${C.gold}" ${S}/>`,
  // grown-up set
  "Work": `<rect x="20" y="22" width="60" height="40" rx="4" fill="${C.blue}" ${S}/><path d="M10 72 H90 L84 80 H16 Z" fill="${C.grey}" ${S}/>`,
  "Meeting": `<path d="M10 20 H56 V50 H28 L18 60 V50 H10 Z" fill="#fff" ${S}/><path d="M44 42 H90 V72 H82 V82 L72 72 H44 Z" fill="${C.sage}" ${S}/>`,
  "Cook": `<path d="M14 44 H70 V60 C70 74 60 80 42 80 C24 80 14 74 14 60 Z" fill="${C.grey}" ${S}/><path d="M70 50 H92" ${S}/><path d="M30 34 C26 26 34 22 30 14 M44 34 C40 26 48 22 44 14 M58 34 C54 26 62 22 58 14" fill="none" ${S}/>`,
  "Washing": `<rect x="16" y="10" width="68" height="80" rx="6" fill="#fff" ${S}/><path d="M16 26 H84" ${S}/><circle cx="50" cy="56" r="20" fill="${C.blue}" ${S}/><circle cx="28" cy="18" r="3" fill="${C.ink}"/>`,
  "Tidy up": `<path d="M62 10 L44 56" ${S}/><path d="M30 52 L58 62 L50 88 C40 90 22 84 16 76 Z" fill="${C.gold}" ${S}/><path d="M28 66 L44 72 M24 74 L40 80" ${S}/>`,
  "Pay bills": `<circle cx="50" cy="50" r="36" fill="${C.gold}" ${S}/><text x="50" y="64" text-anchor="middle" font-family="Fraunces, serif" font-weight="700" font-size="40" fill="${C.ink}">£</text>`,
  "Exercise": `<path d="M30 50 H70" stroke="${C.ink}" stroke-width="8" stroke-linecap="round"/><rect x="16" y="32" width="14" height="36" rx="4" fill="${C.grey}" ${S}/><rect x="70" y="32" width="14" height="36" rx="4" fill="${C.grey}" ${S}/><path d="M10 42 V58 M90 42 V58" ${S}/>`,
  "Cup of tea": `<path d="M18 38 H70 V62 C70 76 60 84 44 84 C28 84 18 76 18 62 Z" fill="#fff" ${S}/><path d="M70 46 C86 46 86 66 70 66" fill="none" ${S}/><path d="M34 28 C30 22 38 18 34 10 M50 28 C46 22 54 18 50 10" fill="none" ${S}/>`,
  "Text a friend": `<rect x="30" y="10" width="40" height="80" rx="8" fill="#fff" ${S}/><path d="M38 28 H62 V44 H48 L42 50 V44 H38 Z" fill="${C.sage}" ${S}/><path d="M46 80 H54" ${S}/>`,
  "Appointment": `<rect x="14" y="20" width="72" height="66" rx="6" fill="#fff" ${S}/><path d="M14 38 H86" ${S}/><path d="M32 12 V26 M68 12 V26" ${S}/><circle cx="58" cy="62" r="10" fill="${C.red}" ${S}/>`,
  "Water plants": `<path d="M30 60 H70 L64 88 H36 Z" fill="${C.brown}" ${S}/><path d="M50 60 V36 M50 44 C40 40 34 30 36 22 C46 24 50 32 50 44 Z M50 40 C60 36 66 28 64 20 C54 22 50 30 50 40 Z" fill="${C.sage}" ${S}/>`,
  "Bins out": `<path d="M24 30 H76 L70 88 H30 Z" fill="${C.sage}" ${S}/><path d="M18 30 H82 V22 H18 Z" fill="${C.sage}" ${S}/><path d="M40 42 V78 M60 42 V78" ${S}/>`,
  "Screens off": `<rect x="30" y="10" width="40" height="80" rx="8" fill="${C.grey}" ${S}/><path d="M18 86 L82 14" stroke="${C.red}" stroke-width="8" stroke-linecap="round"/>`,
  "Wind down": `<rect x="38" y="40" width="24" height="46" rx="3" fill="#fff" ${S}/><path d="M50 40 V32" ${S}/><path d="M50 30 C42 22 46 14 50 8 C54 14 58 22 50 30 Z" fill="${C.gold}" ${S}/><path d="M28 86 H72" ${S}/>`,
};
const ALL_ICONS = Object.assign({}, ICONS, EXTRA, NEW);
const vicon = (k, size) => `<svg viewBox="0 0 100 100" width="${size}" height="${size}">${ALL_ICONS[k]}</svg>`;
const KID_CARDS = ["Wake up", "Toilet", "Get dressed", "Breakfast", "Brush teeth", "School run", "School", "Assembly",
  "PE kit", "Break time", "Packed lunch", "Lunch", "Home time", "After-school club", "Homework", "Snack",
  "Drink", "Tea time", "Bath", "Shower", "Pyjamas", "Story", "Bed", "Medicine",
  "Quiet time", "Go outside", "Playground", "Walk", "Watch TV", "Video game", "Play a game", "Music",
  "Crafts", "Baking", "Swimming", "Library", "Visitors", "Grandparents' house", "Party", "Video call",
  "Phone call", "Car journey", "Bus", "Train", "Plane", "Shopping", "Doctor", "Dentist",
  "Haircut", "Hug", "Help", "Wait", "Finished", "Stop", "", "", "", "", "", ""];
const ADULT_CARDS = ["Work", "Emails", "Meeting", "Cook", "Washing", "Tidy up", "Food shop", "Pay bills",
  "Take meds", "Exercise", "Cup of tea", "Text a friend", "Appointment", "Water plants", "Bins out", "Screens off",
  "Wind down", "Rest", "", ""];
const ADULT_ICON = { "Emails": "Write cards", "Food shop": "Shopping", "Take meds": "Medicine", "Rest": "Quiet time" };

function everydayHTML(frog) {
  const foot = `<div class="foot">Visual Timetable Cards · Frog Logic${TES ? "" : " · froglogic.co.uk"}</div>`;
  const row = (n) => `<div class="row"><div class="when">${n === 0 ? "First" : n === 7 ? "Last" : "Then"}</div><div class="slot"></div><div class="line"></div><div class="tick"></div></div>`;
  const trow = () => `<div class="row"><div class="when tm">&nbsp;</div><div class="slot"></div><div class="line"></div><div class="tick"></div></div>`;
  const card = (k, iconKey) => `<div class="pc">${k ? vicon(iconKey || k, 92) : ""}<div class="lab">${k ? esc(k) : "&nbsp;"}</div></div>`;
  const cardPage = (keys, n, of, title, kick) => `
<section class="page">
  <div class="kick">${kick} · ${n} OF ${of}</div><h2>${title}</h2>
  <div class="grid">${keys.map((k) => card(k, ADULT_ICON[k])).join("")}</div>
  ${foot}
</section>`;
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  return `
<section class="page">
  <div class="head"><div><div class="kick">PRINT · CUT · STICK</div><h1>My day</h1><p class="sub">Put a picture card in each box, in order. Tick each one when it's done.</p></div><img class="frog" src="${frog}"></div>
  <div class="rows">${[0, 1, 2, 3, 4, 5, 6, 7].map(row).join("")}</div>
  ${foot}
</section>
<section class="page">
  <div class="head"><div><div class="kick">FOR GROWN-UPS AND TEENS</div><h1>Today</h1><p class="sub">Write a time on the left if it helps. One card per box. Tick it off when it's done.</p></div><img class="frog" src="${frog}"></div>
  <div class="rows">${[0, 1, 2, 3, 4, 5, 6, 7].map(trow).join("")}</div>
  ${foot}
</section>
<section class="page">
  <div class="kick">ONE THING AT A TIME</div><h2>Now and next</h2>
  <div class="nn"><div><div class="ftl">Now</div><div class="nnb"></div></div><div class="arrow">→</div><div><div class="ftl">Next</div><div class="nnb"></div></div></div>
  <p class="sub small">Some days the whole timetable is too much to look at. Use just two cards: what's happening now, and what's next.</p>
  <div class="kick" style="margin-top:10mm">TODAY IS</div>
  <div class="today">${days.map((d) => `<span>${d}</span>`).join("")}</div>
  ${foot}
</section>
<section class="page">
  <div class="kick">THE WHOLE WEEK</div><h2>My week</h2>
  <div class="week"><div></div>${days.map((d) => `<div class="wd">${d.slice(0, 3)}</div>`).join("")}
  ${["Morning", "Afternoon", "Evening"].map((t) => `<div class="wt">${t}</div>${days.map(() => `<div class="ws"></div>`).join("")}`).join("")}</div>
  <p class="sub small">One card per box, or leave a box empty for a quiet one. A quiet day after a busy one helps.</p>
  ${foot}
</section>
${[0, 1, 2].map((i) => cardPage(KID_CARDS.slice(i * 20, i * 20 + 20), i + 1, 3, "Picture cards", "CUT ALONG THE DASHED LINES")).join("")}
${cardPage(ADULT_CARDS, 1, 1, "Grown-up cards", "FOR ADULTS AND TEENS")}
<section class="page">
  <div class="kick">FOR WHEN IT GETS A BIT MUCH</div><h2>First, then</h2>
  <div class="ft"><div><div class="ftl">First</div><div class="ftb"></div></div><div class="arrow">→</div><div><div class="ftl">Then</div><div class="ftb"></div></div></div>
  <div class="break">${vicon("Quiet time", 110)}<div><div class="bt">I need a break</div><div class="bs">Show this card. Somewhere quiet, no questions, back when I'm ready.</div></div></div>
  <div class="break" style="background:#FBEFE0">${vicon("Help", 110)}<div><div class="bt">I need help</div><div class="bs">Show this card. Come closer, keep it calm, ask me yes or no.</div></div></div>
  ${foot}
</section>
<section class="page">
  <div class="kick">HOW TO USE THE CARDS</div><h2>A few tips</h2>
  <div class="note"><ul>
    <li>Go through tomorrow's timetable the night before, and again in the morning.</li>
    <li>If plans change, change the cards and show the new order. A change on paper is easier than a change out loud.</li>
    <li>On a busy day, use the now and next board instead of the whole timetable.</li>
    <li>The week page helps with the bumpy bits: PE days, after-school clubs, visits and quiet days.</li>
    <li>Laminate the cards, or print them on card, and stick Velcro dots or Blu Tack on the back. They'll last for years.</li>
    <li>Share a set with school or nursery so home and school use the same pictures.</li>
    <li>The grown-up cards are for adults and teens who like their day laid out too. Nothing childish about it.</li>
    <li>The blank cards are for the things only your family does. Draw them or write them.</li>
  </ul>
  <p class="more">Free plain-English guides to autism, ADHD, PDA and more ${TES ? "in the <b>FrogLogic shop on Tes</b>" : "at <b>froglogic.co.uk</b>"}</p></div>
  <div class="foot">Thank you for buying from a small neurodivergent-run shop. For your own family's or classroom's use; please don't resell or share the file. Not medical advice.</div>
</section>`;
}

// The Bespoke Planner gift card (D40): a fold-in-half card. The person who
// receives it claims their planner by answering the questions at
// froglogic.co.uk/gift and typing the giver's email address as the gift code;
// automation/planner/process-orders.js matches that to the gift payment.
function giftCardHTML(frog, mark) {
  return `
<section class="page land">
  <div class="half back"><img class="mark" src="${mark}"><div class="bk">Frog Logic</div><div class="bks">froglogic.co.uk</div></div>
  <div class="half front gfront"><div class="gk">A gift for you</div><img class="gfrog" src="${frog}"><div class="gt">A planner built for your brain</div><div class="gs">The Bespoke Planner</div></div>
</section>
<section class="page land">
  <div class="half ginside">
    <div class="gh">What it is</div>
    <p>Every planner you've ever bought was built for someone else's brain. This one is built for yours.</p>
    <p>You answer fifteen questions: how your day actually runs, how you track your energy, what you keep forgetting, what a hard day looks like and who needs to understand you. Then a planner of up to eighteen pages is made from your answers, in your words, and emailed to you as a PDF to print as often as you like.</p>
    <p>If it doesn't fit, answer again and it gets rebuilt, free.</p>
  </div>
  <div class="half ginside">
    <div class="gto">To ______________________</div>
    <div class="gh" style="margin-top:6mm">How to claim it</div>
    <ol>
      <li>Go to <b>froglogic.co.uk/gift</b></li>
      <li>Answer the questions. There are no wrong answers.</li>
      <li>In the gift code box, type the code below.</li>
      <li>Your planner arrives by email, usually within a couple of hours.</li>
    </ol>
    <div class="gcode"><div class="gcl">Your gift code (the giver's email address)</div><div class="gcb"></div></div>
    <div class="gto" style="margin-top:6mm">From ____________________</div>
  </div>
</section>`;
}

const CARDS = [
  { bg: "#DDEBD5", text: "Thank you for understanding me.", sub: "To the best ______________ in the pond" },
  { bg: "#F6E4C6", text: "Thank you for being my safe person.", sub: "To the kindest ______________ there is" },
  { bg: "#F6DCDC", text: "Thank you for seeing me.", sub: "To my favourite ______________" },
];
function cardsHTML(frog, mark) {
  return CARDS.map((c) => `
<section class="page land">
  <div class="half back"><img class="mark" src="${mark}"><div class="bk">Frog Logic</div><div class="bks">froglogic.co.uk</div></div>
  <div class="half front" style="background:${c.bg}"><img class="cfrog" src="${frog}"><div class="ct">${esc(c.text)}</div><div class="cs">${esc(c.sub)}</div></div>
</section>
<section class="page land"><div class="half"></div><div class="half inside"><div class="to">To</div><div class="from">From</div></div></section>`).join("");
}

function css(fontCss, size, land) {
  const [w, h] = size === "A4" ? [210, 297] : [215.9, 279.4];
  const W = land ? h : w, H = land ? w : h;
  return `${fontCss}
@page { size: ${W}mm ${H}mm; margin: 0 }
html,body{margin:0;padding:0}
body{font-family:'DM Sans';color:${C.ink}}
.page{width:${W}mm;height:${H}mm;box-sizing:border-box;padding:14mm 14mm 12mm;position:relative;page-break-after:always;overflow:hidden;background:#fff}
.kick{font:700 9pt 'Space Grotesk';letter-spacing:.14em;color:${C.red}}
h1{font:600 34pt/1 Fraunces;margin:2mm 0 2mm;color:${C.brown}} h2{font:600 26pt/1 Fraunces;margin:2mm 0 5mm;color:${C.brown}} h3{font:600 15pt Fraunces;margin:0 0 2mm;color:${C.brown}}
.sub{font:400 11pt 'DM Sans';margin:0;color:#4a4740}.small{margin-top:4mm}
.head{display:flex;justify-content:space-between;align-items:flex-start}.frog{width:38mm;margin-top:-4mm}
.rows{margin-top:5mm}
.row{display:flex;align-items:center;gap:4mm;margin-bottom:2.5mm}
.when{width:14mm;font:700 11pt Caveat;font-size:17pt;color:${C.brown}}
.slot{width:${size === "A4" ? 23 : 20.5}mm;height:${size === "A4" ? 23 : 20.5}mm;border:2.5px dashed ${C.grey};border-radius:4mm}
.line{flex:1;border-bottom:1.5px solid #cfc7b4;height:14mm}
.tick{width:10mm;height:10mm;border:2.5px solid ${C.ink};border-radius:2mm}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:0;border-top:1.5px dashed ${C.grey};border-left:1.5px dashed ${C.grey}}
.pc{height:${size === "A4" ? 46 : 42}mm;border-right:1.5px dashed ${C.grey};border-bottom:1.5px dashed ${C.grey};display:flex;flex-direction:column;align-items:center;justify-content:center}
.lab{font:600 12pt 'DM Sans';margin-top:1mm}
.ft{display:flex;align-items:center;gap:6mm;margin:2mm 0 8mm}.ftl{font:700 20pt Caveat;color:${C.brown};text-align:center}.ftb{width:72mm;height:56mm;border:2.5px dashed ${C.grey};border-radius:5mm}.arrow{font:600 30pt Fraunces;color:${C.brown};margin-top:10mm}
.break{display:flex;align-items:center;gap:6mm;border:3px solid ${C.ink};border-radius:6mm;padding:6mm 8mm;background:#EEF4EA;margin-bottom:8mm}.bt{font:600 24pt Fraunces}.bs{font:400 12pt 'DM Sans';margin-top:2mm}
.note{background:${C.cream};border-radius:5mm;padding:6mm 8mm}.note ul{margin:0;padding-left:5mm;font:400 11pt/1.5 'DM Sans'}.more{font:400 11pt 'DM Sans';margin:3mm 0 0}
.foot{position:absolute;left:14mm;right:14mm;bottom:8mm;text-align:center;font:400 8pt 'DM Sans';color:#a39683}
.land{padding:0;display:flex}.half{width:50%;height:100%;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative}
.back{background:#fff}.mark{width:16mm}.bk{font:700 18pt Caveat;color:${C.brown};margin-top:2mm}.bks{font:400 9pt 'DM Sans';color:#a39683}
.front{padding:12mm}.cfrog{width:78mm}.ct{font:600 22pt/1.15 Fraunces;text-align:center;text-wrap:balance;max-width:110mm;margin-top:6mm;color:${C.ink}}.cs{font:600 15pt Caveat;font-size:19pt;color:${C.brown};margin-top:6mm;text-align:center}
.inside{align-items:flex-start;justify-content:flex-start;padding:18mm}.to,.from{font:700 20pt Caveat;color:#cfc7b4}.from{position:absolute;bottom:20mm}
.nn{display:flex;align-items:center;gap:6mm;margin:4mm 0 6mm}.nnb{width:80mm;height:80mm;border:2.5px dashed ${C.grey};border-radius:6mm}
.tm{border-bottom:1.5px solid #cfc7b4;height:9mm;align-self:flex-end;margin-bottom:6mm}
.today{display:flex;flex-wrap:wrap;gap:3mm;margin-top:3mm}.today span{border:2px solid ${C.ink};border-radius:3mm;padding:2.5mm 4mm;font:600 12pt 'DM Sans'}
.week{display:grid;grid-template-columns:20mm repeat(7,minmax(0,1fr));gap:2mm;margin:4mm 0 5mm}.wd{font:700 9pt 'DM Sans';text-align:center;align-self:end;color:${C.brown}}
.wdb{border-bottom:1.5px solid #cfc7b4;height:8mm;margin:0 1mm}.wt{font:700 13pt Caveat;color:${C.brown};align-self:center}.ws{height:${size === "A4" ? 54 : 48}mm;border:2px dashed ${C.grey};border-radius:3mm}
.gfront{background:#E7E1F2}.gk{font:700 9pt 'Space Grotesk';letter-spacing:.16em;text-transform:uppercase;color:#5E4A8C}.gfrog{width:70mm;margin-top:4mm}
.gt{font:600 24pt/1.12 Fraunces;text-align:center;text-wrap:balance;max-width:110mm;margin-top:5mm;color:${C.ink}}.gs{font:700 20pt Caveat;color:#5E4A8C;margin-top:3mm}
.ginside{align-items:flex-start;justify-content:flex-start;padding:14mm 14mm;font:400 10.5pt/1.45 'DM Sans'}.ginside p{margin:0 0 3mm}.ginside ol{margin:1mm 0 0;padding-left:5mm}
.gh{font:600 15pt Fraunces;color:#5E4A8C;margin-bottom:2mm}.gto{font:700 18pt Caveat;color:${C.brown}}
.gcode{margin-top:6mm;width:100%}.gcl{font:700 8.5pt 'Space Grotesk';letter-spacing:.08em;text-transform:uppercase;color:#5E4A8C}.gcb{height:14mm;border:2.5px solid #5E4A8C;border-radius:3mm;margin-top:2mm}
`;
}

(async () => {
  const sharp = require("sharp");
  const fontDir = path.join(__dirname, ".gfonts");
  await ensureFonts(fontDir);
  const dm = path.join(fontDir, "DMSans-var.ttf");
  if (!fs.existsSync(dm) || fs.statSync(dm).size < 10000) {
    const r = await fetch(DMSANS); if (!r.ok) throw new Error("DM Sans " + r.status);
    fs.writeFileSync(dm, Buffer.from(await r.arrayBuffer()));
  }
  const fontCss = fontFaceCSS(fontDir) + `@font-face{font-family:'DM Sans';src:url(data:font/ttf;base64,${fs.readFileSync(dm).toString("base64")});font-weight:100 1000;}`;
  const png = async (file, box, w) => "data:image/png;base64," + (await sharp(path.join(ROOT, file)).extract(box).resize({ width: w }).png().toBuffer()).toString("base64");
  const hib = await png("artwork/frogs/socially-hibernating.png", { left: 600, top: 500, width: 1820, height: 2060 }, 500);
  const comfort = await png("artwork/frogs/comfort-creature.png", { left: 500, top: 520, width: 2020, height: 2000 }, 700);
  const mark = "data:image/png;base64," + fs.readFileSync(path.join(ROOT, "assets", "frog-logic-mark.png")).toString("base64");

  let chromium; try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require("playwright-core")); }
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const page = await browser.newPage();
  fs.mkdirSync(PREV, { recursive: true });
  const jobs = [
    ["Christmas-Visual-Timetable", false, timetableHTML(hib)],
    ["Thank-You-Cards-SEN-Staff", true, cardsHTML(comfort, mark)],
    ["Christmas-Visual-Timetable-Big-Pack", false, bigPackHTML(hib)],
    ["Bespoke-Planner-Gift-Card", true, giftCardHTML(comfort, mark)],
    ["Visual-Timetable-Cards", false, everydayHTML(comfort)],
  ].filter(([name]) => !process.env.ONLY || process.env.ONLY.split(",").includes(name));
  for (const [name, land, body] of jobs) {
    for (const size of ["A4", "Letter"]) {
      await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${css(fontCss, size, land)}</style></head><body>${body}</body></html>`, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(150);
      const out = path.join(DIGITAL, `${name}${size === "A4" ? "" : "-Letter"}.pdf`);
      await page.pdf({ path: out, preferCSSPageSize: true, printBackground: true });
      console.log("written", out);
      if (size === "A4") {
        const els = await page.$$(".page");
        for (let i = 0; i < els.length; i++) {
          if (land && i % 2 === 1) continue; // skip the blank insides
          await els[i].screenshot({ path: path.join(PREV, `${name}-${land ? i / 2 + 1 : i + 1}.png`) });
        }
      }
    }
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
