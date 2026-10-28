// Pictures to tell people about the three new free things (Sam, 28 Oct 2026:
// "yes set those up"): the Christmas visual timetable, the "how to help me"
// card maker and Pond Advent.
//
//   automation/social/promo/<name>-post.jpg  1080x1350, Facebook + Instagram
//                                            (announce-queue.json entries)
//   automation/social/promo/<name>-pin.jpg   1000x1500, Pinterest
//   automation/social/promo/pins.csv         Pinterest bulk-upload sheet
//
// The short addresses (froglogic.co.uk/timetable, /card, /advent) are netlify.toml
// redirects with ?ref tags, so posts can be counted.
//
// Built by the "Build the free-tools promo pictures" workflow (promo-tools.yml).
const fs = require("fs");
const path = require("path");
const { ensureFonts, fontFaceCSS } = require("./gfonts.js");

const ROOT = path.join(__dirname, "..", "..");
const OUT = path.join(__dirname, "promo");
const RAW = "https://raw.githubusercontent.com/froglogic60/frog-logic-shop/main/automation/social/promo/";
const DMSANS = "https://raw.githubusercontent.com/google/fonts/main/ofl/dmsans/DMSans%5Bopsz,wght%5D.ttf";
const BOARD = "Free neurodivergence guides (The Pond Guides)";

const b64 = (f) => "data:image/png;base64," + fs.readFileSync(path.join(ROOT, f)).toString("base64");

// The three visuals, drawn in HTML so they stay sharp at both sizes.
function visual(kind, img) {
  if (kind === "timetable") return `<div class="fan"><img class="p1" src="${img.t1}"><img class="p2" src="${img.t2}"></div>`;
  if (kind === "bigpack") return `<div class="fan"><img class="p1" src="${img.b1}"><img class="p2" src="${img.b4}"></div>`;
  if (kind === "gift") return `<div class="gift"><div class="gcard"><div class="gk">A gift for you</div><img src="${img.cc}"><div class="gt">A planner built for your brain</div></div></div>`;
  if (kind === "card") return `<div class="cards">
    <div class="face front"><div class="k">How to help me</div><div class="n">Alex</div><div class="h">I'm neurodivergent</div>
      <div class="s"><b>If it gets too much I might</b><ul><li>go quiet</li><li>need to leave</li><li>cover my ears</li></ul></div><div class="f">froglogic.co.uk</div></div>
    <div class="face back"><div class="s"><b>What helps</b><ul><li>give me space</li><li>speak calmly and simply</li><li>give me time</li></ul></div>
      <div class="s"><b>Please don't</b><ul><li>touch me</li><li>ask lots of questions</li></ul></div><div class="m">I'm not being rude, I'm overloaded</div></div></div>`;
  return `<div class="adv"><div class="advent">${Array.from({ length: 24 }, (_, i) => `<span>${i + 1}</span>`).join("")}</div><img class="afrog" src="${img.frog}"></div>`;
}

const ITEMS = [
  { name: "timetable", kind: "timetable", tag: "Free · print · cut · stick", head: "A Christmas Day you can see coming", sub: "A free visual timetable with 20 picture cards, a first/then board and an “I need a break” card.", url: "froglogic.co.uk/timetable",
    pins: [
      { slug: "timetable-pin", head: "Free Christmas visual timetable", sub: "20 picture cards for an autistic child's big day", link: "https://froglogic.co.uk/p/christmas-visual-timetable/?ref=pinterest", title: "Free Christmas visual timetable for autistic children | printable picture cards PDF", desc: "A free printable Christmas Day visual timetable: a First, Then, Last schedule, 20 picture cards (presents, visitors, car journey, quiet time, Christmas dinner, bed), a first/then board and an I need a break card. A4 and US Letter, no sign-up. From Frog Logic, made by a neurodivergent person in the UK.", keys: "visual timetable, autism christmas, sen christmas, visual schedule printable, autistic child christmas" },
      { slug: "timetable-pin-2", head: "First, then, Christmas", sub: "A free visual schedule for the big day", link: "https://froglogic.co.uk/p/christmas-visual-timetable/?ref=pinterest-2", title: "Christmas visual schedule printable | free first then board and picture cards for SEN", desc: "Christmas without the surprises: a free printable visual schedule with picture cards, a first/then board and a break card, for autistic and ADHD children (and grown-ups). Print, cut and stick. Free to share.", keys: "first then board, visual schedule, autism printable, christmas routine, sen resources" },
    ] },
  { name: "card-maker", kind: "card", tag: "Free · nothing is saved", head: "A card that says it for you", sub: "Make a free “how to help me” card in a minute: what happens when it’s too much, what helps, what doesn’t.", url: "froglogic.co.uk/card",
    pins: [
      { slug: "card-maker-pin", head: "How to help me card", sub: "Free to make, credit-card size, for a wallet", link: "https://froglogic.co.uk/p/help-card-maker/?ref=pinterest", title: "Free how to help me card maker | printable autism and ADHD wallet card", desc: "Make a free printable 'how to help me' card: what happens when it gets too much, what helps and what doesn't, and who to contact. Credit-card size for a wallet, lanyard or phone case. Nothing you type is sent or saved. From Frog Logic.", keys: "autism card, autism alert card, adhd card, sensory overload card, communication card" },
      { slug: "card-maker-pin-2", head: "When words go", sub: "Hand over a card instead of explaining", link: "https://froglogic.co.uk/p/help-card-maker/?ref=pinterest-2", title: "Printable autism communication card | free maker for shutdowns and sensory overload", desc: "For the moment you can't explain: a free printable card that tells people how to help. Pick what helps, what doesn't, and add your own words. Prints four on a sheet. Free, no sign-up.", keys: "shutdown card, nonverbal card, autism communication, neurodivergent printable, meltdown help card" },
    ] },
  { name: "pond-advent", kind: "advent", tag: "Free · 1–24 December", head: "Pond Advent", sub: "One free thing a day by email: guides for the relatives, printables and calm tips. On Christmas Eve it stops.", url: "froglogic.co.uk/advent",
    pins: [
      { slug: "advent-pin", head: "Pond Advent", sub: "One free thing a day, 1–24 December", link: "https://froglogic.co.uk/p/pond-advent/?ref=pinterest", title: "Pond Advent: a free email advent calendar for autistic and ADHD families", desc: "One small, calm, useful thing a day from 1 to 24 December: plain-English guides for the relatives, a Christmas visual timetable, a how-to-help-me card and tips for visits, presents and the quiet days after. Free, then it stops.", keys: "advent calendar, autism christmas, adhd christmas, sen parents, neurodivergent christmas" },
      { slug: "advent-pin-2", head: "24 free doors", sub: "For a calmer neurodivergent Christmas", link: "https://froglogic.co.uk/p/pond-advent/?ref=pinterest-2", title: "Free neurodivergent advent calendar | 24 days of autism and ADHD Christmas help", desc: "A free advent calendar by email for neurodivergent families: one guide, printable or tip a day in December, written by a neurodivergent person in the UK. One email a day, one-click off, stops on Christmas Eve.", keys: "free advent calendar, autism parents, adhd parents, christmas tips, sensory friendly christmas" },
    ] },
  // Posts only, no pins (28 Oct 2026, "yes do 1 and 2"): the two new paid pieces.
  { name: "planner-gift-card", kind: "gift", tag: "Gift card · £25", head: "A present built for their brain", sub: "They answer fifteen questions, and a planner is built from their answers, in their words.", url: "froglogic.co.uk/gift-card", pins: [] },
  { name: "timetable-big-pack", kind: "bigpack", tag: "Big Pack · £3", head: "60 picture cards for the big day", sub: "Church, the car, crackers, the dog walk and 12 blanks, plus a now and next board and a holiday week.", url: "froglogic.co.uk/big-pack", pins: [] },
];

function page(css, { w, h, tag, head, sub, url, vis }) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}
html,body{margin:0}
.c{width:${w}px;height:${h}px;background:#F4EFE3;color:#22331F;box-sizing:border-box;padding:${h > 1400 ? 86 : 74}px 76px 64px;display:flex;flex-direction:column;position:relative;overflow:hidden}
.tag{font:700 24px 'Space Grotesk';letter-spacing:.14em;text-transform:uppercase;color:#B5443A}
h1{font:600 ${h > 1400 ? 84 : 76}px/1.02 Fraunces;color:#6B4A32;margin:18px 0 18px;letter-spacing:-.01em}
.sub{font:400 33px/1.35 'DM Sans';margin:0;max-width:900px}
.vis{flex:1;display:flex;align-items:center;justify-content:center;min-height:0}
.foot{display:flex;justify-content:space-between;align-items:flex-end;border-top:3px solid #22331F;padding-top:22px}
.url{font:700 36px 'DM Sans';letter-spacing:-.01em}.sig{font:700 52px Caveat;color:#6B4A32}
.fan{position:relative;width:820px;height:600px}
.fan img{position:absolute;width:390px;border-radius:6px;box-shadow:0 18px 40px rgba(60,50,40,.25);background:#fff}
.fan .p1{left:70px;top:20px;transform:rotate(-6deg)}.fan .p2{right:70px;top:40px;transform:rotate(5deg)}
.cards{display:flex;transform:rotate(-4deg);box-shadow:0 18px 40px rgba(60,50,40,.25)}
.face{width:430px;height:272px;box-sizing:border-box;padding:20px 22px;background:#fff;font:400 20px/1.25 'DM Sans';position:relative;border:2px dashed #9AA7B0}
.front{background:#DDEBD5}.k{font:700 15px 'Space Grotesk';letter-spacing:.12em;text-transform:uppercase;color:#6B4A32}
.n{font:600 38px/1 Fraunces;margin-top:4px}.h{font-weight:700;margin-top:3px}
.s{margin-top:8px}.s ul{margin:2px 0 0;padding-left:22px}.m{margin-top:8px;font-style:italic}
.f{position:absolute;right:20px;bottom:14px;font:700 14px 'Space Grotesk';color:#6B4A32}
.adv{display:flex;align-items:flex-end;gap:10px}.advent{display:grid;grid-template-columns:repeat(6,92px);gap:10px}
.advent span{height:92px;border:3px solid #22331F;border-radius:14px;display:flex;align-items:center;justify-content:center;font:600 40px Fraunces;background:#DDEBD5}
.advent span:nth-child(3n){background:#F6E4C6}.advent span:nth-child(4n){background:#F6DCDC}
.afrog{width:300px;margin-bottom:-30px}
.gcard{width:520px;background:#E7E1F2;border-radius:10px;box-shadow:0 18px 40px rgba(60,50,40,.25);padding:34px 30px 40px;text-align:center;transform:rotate(-3deg)}
.gcard .gk{font:700 18px 'Space Grotesk';letter-spacing:.16em;text-transform:uppercase;color:#5E4A8C}.gcard img{width:300px;margin:12px 0}
.gcard .gt{font:600 40px/1.1 Fraunces;color:#22331F}
${w < 1080 ? '.adv,.cards{zoom:.88}' : ''}
</style></head><body><div class="c"><div class="tag">${tag}</div><h1>${head}</h1><p class="sub">${sub}</p><div class="vis">${vis}</div>
<div class="foot"><div class="url">${url}</div><div class="sig">Frog Logic</div></div></div></body></html>`;
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
  const css = fontFaceCSS(fontDir) + `@font-face{font-family:'DM Sans';src:url(data:font/ttf;base64,${fs.readFileSync(dm).toString("base64")});font-weight:100 1000;}`;
  const frog = "data:image/png;base64," + (await sharp(path.join(ROOT, "artwork/frogs/socially-hibernating.png")).extract({ left: 600, top: 500, width: 1820, height: 2060 }).resize({ width: 600 }).png().toBuffer()).toString("base64");
  const cc = "data:image/png;base64," + (await sharp(path.join(ROOT, "artwork/frogs/comfort-creature.png")).extract({ left: 500, top: 520, width: 2020, height: 2000 }).resize({ width: 600 }).png().toBuffer()).toString("base64");
  const img = { t1: b64("automation/social/xmas-printables/Christmas-Visual-Timetable-1.png"), t2: b64("automation/social/xmas-printables/Christmas-Visual-Timetable-2.png"),
    b1: b64("automation/social/xmas-printables/Christmas-Visual-Timetable-Big-Pack-1.png"), b4: b64("automation/social/xmas-printables/Christmas-Visual-Timetable-Big-Pack-4.png"), frog, cc };

  let chromium; try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require("playwright-core")); }
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  fs.mkdirSync(OUT, { recursive: true });
  const shoot = async (file, w, h, o) => {
    const p = await (await browser.newContext({ viewport: { width: w, height: h } })).newPage();
    await p.setContent(page(css, { w, h, ...o, vis: visual(o.kind, img) }), { waitUntil: "load" });
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(150);
    await (await p.$(".c")).screenshot({ path: path.join(OUT, file), type: "jpeg", quality: 90 });
    await p.close(); console.log("written", file);
  };
  const start = new Date(process.env.START || "2026-11-02T00:00:00Z");
  for (const it of ITEMS) {
    await shoot(`${it.name}-post.jpg`, 1080, 1350, it);
    for (const pin of it.pins) await shoot(`${pin.slug}.jpg`, 1000, 1500, { ...it, head: pin.head, sub: pin.sub });
  }
  // One pin a day at 18:30 UTC, taking turns: timetable, card, Advent, then the second of each.
  const order = [0, 1].flatMap((k) => ITEMS.map((it) => it.pins[k]).filter(Boolean));
  const rows = order.map((pin, n) => [pin.title.slice(0, 100), RAW + pin.slug + ".jpg", BOARD, "", pin.desc.slice(0, 500), pin.link,
    new Date(start.getTime() + n * 86400000).toISOString().slice(0, 10) + "T18:30:00", pin.keys]);
  await browser.close();
  const q = (s) => '"' + String(s).replace(/"/g, '""') + '"';
  const header = ["Title", "Media URL", "Pinterest board", "Thumbnail", "Description", "Link", "Publish date", "Keywords"];
  fs.writeFileSync(path.join(OUT, "pins.csv"), [header, ...rows].map((r) => r.map(q).join(",")).join("\n") + "\n");
  console.log("pins.csv:", rows.length, "pins");
})().catch((e) => { console.error(e); process.exit(1); });
