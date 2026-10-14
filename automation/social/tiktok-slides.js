// TikTok photo-mode slides, 1080x1920, Frog Logic house style. No face, no voice.
//
//   node tiktok-slides.js            -> renders every set in tiktok-sets.json
//                                        to tiktok/<set>/<n>-<set>.jpg
//
// Add a set to tiktok-sets.json (five slides: tag / big / small each) and run
// the "TikTok slides" workflow from the Actions tab. Download from
// https://github.com/froglogic60/frog-logic-shop/tree/main/automation/social/tiktok
const fs = require("fs");
const path = require("path");
const { fontFaceCSS, ensureFonts } = require("./gfonts.js");

const CREAM = "#F4EFE3", GOLD = "#E8B63C", NIGHT = "#1F3229", FERN = "#3C5B45";
const mark = "data:image/png;base64," + fs.readFileSync(path.join(__dirname, "..", "..", "assets", "frog-logic-mark.png")).toString("base64");
const SETS = JSON.parse(fs.readFileSync(path.join(__dirname, "tiktok-sets.json"), "utf8"));

function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br>"); }

(async () => {
  const fontDir = path.join(__dirname, ".gfonts");
  await ensureFonts(fontDir);
  const css = fontFaceCSS(fontDir);
  let chromium;
  try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require("playwright-core")); }
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const ctx = await browser.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  for (const [name, slides] of Object.entries(SETS)) {
    const OUT = path.join(__dirname, "tiktok", name);
    fs.mkdirSync(OUT, { recursive: true });
    let i = 0;
    for (const s of slides) {
      i++;
      const bg = i % 2 ? NIGHT : FERN;
      const long = s.big.length > 60;
      const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}
html,body{margin:0;padding:0}
.stage{position:relative;width:1080px;height:1920px;background:${bg};color:${CREAM};overflow:hidden;font-family:'Fraunces',serif}
.tag{position:absolute;left:90px;right:90px;top:260px;font-family:'Space Mono',monospace;font-size:34px;letter-spacing:7px;color:${GOLD};text-transform:uppercase}
.big{position:absolute;left:90px;right:90px;top:400px;font-size:${long ? 84 : 104}px;font-weight:600;line-height:1.08}
.small{position:absolute;left:90px;right:90px;top:${long ? 1180 : 1000}px;font-size:48px;font-style:italic;line-height:1.3;opacity:.92}
.foot{position:absolute;left:90px;bottom:120px;font-family:'Space Mono',monospace;font-size:30px;opacity:.8}
.mark{position:absolute;right:80px;top:80px;width:150px}
.n{position:absolute;right:90px;bottom:120px;font-family:'Space Mono',monospace;font-size:30px;opacity:.6}
</style></head><body><div class="stage">
<img class="mark" src="${mark}">
<div class="tag">${esc(s.tag)}</div>
<div class="big">${esc(s.big)}</div>
<div class="small">${esc(s.small || "")}</div>
<div class="foot">frog logic · froglogic.co.uk</div>
<div class="n">${i} / ${slides.length}</div>
</div></body></html>`;
      await page.setContent(html, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(120);
      await page.screenshot({ path: path.join(OUT, `${i}-${name}.jpg`), type: "jpeg", quality: 92 });
    }
    console.log(`${name}: ${i} slides`);
  }
  await browser.close();
})();
