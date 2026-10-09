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
  const { chromium } = require("playwright-core");
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
