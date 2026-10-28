// The Christmas "send this to the relatives" picture (Sam, 28 Oct 2026:
// "yes do the Christmas picture" ... "queue the picture").
//
// One 1080x1350 card for Facebook, Instagram and sharing in groups: free
// plain-English guides for the grandparents, aunties and uncles, with the
// short address froglogic.co.uk/xmas (netlify.toml sends it to the free
// guides list, /?ref=xmascard#guides). It points at the FREE guides only;
// /p/the-pond-guides/ is the paid £8 set and must never be called free.
//
// Writes automation/social/xmas/xmas-relatives-card.jpg, which the
// announce-queue entry "xmas-relatives-card" posts. Built by the
// "Build the Christmas relatives card" workflow (xmas-card.yml).
const fs = require("fs");
const path = require("path");
const { ensureFonts, fontFaceCSS } = require("./gfonts.js");

const ROOT = path.join(__dirname, "..", "..");
const OUT = path.join(__dirname, "xmas", "xmas-relatives-card.jpg");
const FROG = path.join(ROOT, "artwork", "frogs", "socially-hibernating.png");
const DMSANS = "https://raw.githubusercontent.com/google/fonts/main/ofl/dmsans/DMSans%5Bopsz,wght%5D.ttf";

(async () => {
  const sharp = require("sharp");
  const fontDir = path.join(__dirname, ".gfonts");
  await ensureFonts(fontDir);
  const dm = path.join(fontDir, "DMSans-var.ttf");
  if (!fs.existsSync(dm) || fs.statSync(dm).size < 10000) {
    const r = await fetch(DMSANS);
    if (!r.ok) throw new Error("DM Sans download failed: " + r.status);
    fs.writeFileSync(dm, Buffer.from(await r.arrayBuffer()));
  }
  const css = fontFaceCSS(fontDir) +
    `@font-face{font-family:'DM Sans';src:url(data:font/ttf;base64,${fs.readFileSync(dm).toString("base64")});font-weight:100 1000;}`;
  // The frog without the "Socially Hibernating" title and "see you in January" line.
  const frog = await sharp(FROG).extract({ left: 600, top: 500, width: 1820, height: 2060 }).resize({ width: 860 }).png().toBuffer();
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}
html,body{margin:0}
.card{width:1080px;height:1350px;background:#F4EFE3;color:#2B2A26;box-sizing:border-box;padding:84px 86px 70px;display:flex;flex-direction:column;position:relative;overflow:hidden}
.tag{font:700 26px 'DM Sans';letter-spacing:.14em;text-transform:uppercase;color:#6E4B2E;margin-bottom:26px}
h1{font:600 84px/1.02 Fraunces;font-variation-settings:"opsz" 144;margin:0 0 30px;letter-spacing:-.01em}
h1 em{font-style:normal;color:#B7412F}
p{font:400 34px/1.38 'DM Sans';margin:0 0 16px;max-width:880px}
p strong{font-weight:700}
.frog{position:absolute;right:40px;bottom:205px;width:430px}
.list{font:500 30px/1.5 'DM Sans';color:#4a4740;max-width:520px;margin-top:10px}
.foot{margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end;border-top:3px solid #2B2A26;padding-top:26px;position:relative;z-index:2;background:#F4EFE3}
.url{font:700 50px 'DM Sans';letter-spacing:-.01em}
.small{font:500 24px 'DM Sans';color:#6E4B2E;margin-top:6px}
.sig{font:700 54px Caveat;color:#6E4B2E}
</style></head><body><div class="card">
<div class="tag">Free · no sign-up · print or forward</div>
<h1>Before the Christmas visit, <em>send this to the relatives.</em></h1>
<p>Short, plain-English guides for the grandparents, aunties and uncles. <strong>Not for your child. For the people around them.</strong></p>
<div class="list">Autism · ADHD · AuDHD · PDA<br>Sensory differences · Dyspraxia<br>Dyslexia · and 16 more</div>
<img class="frog" src="data:image/png;base64,${frog.toString("base64")}">
<div class="foot"><div><div class="url">froglogic.co.uk/xmas</div><div class="small">Written by a neurodivergent person, to be handed over</div></div><div class="sig">Frog Logic</div></div>
</div></body></html>`;
  let chromium; try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require("playwright-core")); }
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const page = await (await browser.newContext({ viewport: { width: 1080, height: 1350 } })).newPage();
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  await (await page.$(".card")).screenshot({ path: OUT, type: "jpeg", quality: 92 });
  await browser.close();
  console.log("written", OUT);
})().catch((e) => { console.error(e); process.exit(1); });
