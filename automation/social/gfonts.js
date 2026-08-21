// Browser-accurate rendering with the site's exact fonts.
// The old resvg pipeline only carried 5 static font files while the designs
// use 8 families (incl. variable-width Fraunces with its optical-size axis),
// so several pieces rendered with wrong fonts and overflowing text. This
// module downloads the same upstream font binaries Google Fonts serves
// (from the google/fonts GitHub repo), builds @font-face CSS with data URIs,
// and renders SVGs in headless Chromium — identical to what the site shows.
const fs = require("fs");
const path = require("path");

const FONTS = [
  ["fraunces/Fraunces%5BSOFT,WONK,opsz,wght%5D.ttf", "Fraunces-var.ttf", "'Fraunces'", "100 900", "normal"],
  ["fraunces/Fraunces-Italic%5BSOFT,WONK,opsz,wght%5D.ttf", "Fraunces-Italic-var.ttf", "'Fraunces'", "100 900", "italic"],
  ["anton/Anton-Regular.ttf", "Anton.ttf", "'Anton'", "400", "normal"],
  ["spacemono/SpaceMono-Regular.ttf", "SpaceMono.ttf", "'Space Mono'", "400", "normal"],
  ["spacemono/SpaceMono-Bold.ttf", "SpaceMono-Bold.ttf", "'Space Mono'", "700", "normal"],
  ["instrumentserif/InstrumentSerif-Regular.ttf", "InstrumentSerif.ttf", "'Instrument Serif'", "400", "normal"],
  ["instrumentserif/InstrumentSerif-Italic.ttf", "InstrumentSerif-Italic.ttf", "'Instrument Serif'", "400", "italic"],
  ["spacegrotesk/SpaceGrotesk%5Bwght%5D.ttf", "SpaceGrotesk-var.ttf", "'Space Grotesk'", "300 700", "normal"],
  ["abrilfatface/AbrilFatface-Regular.ttf", "AbrilFatface.ttf", "'Abril Fatface'", "400", "normal"],
  ["syne/Syne%5Bwght%5D.ttf", "Syne-var.ttf", "'Syne'", "400 800", "normal"],
  ["caveat/Caveat%5Bwght%5D.ttf", "Caveat-var.ttf", "'Caveat'", "400 700", "normal"],
];
const BASE = "https://raw.githubusercontent.com/google/fonts/main/ofl/";

async function ensureFonts(dir) {
  fs.mkdirSync(dir, { recursive: true });
  for (const [src, out] of FONTS) {
    const target = path.join(dir, out);
    if (fs.existsSync(target) && fs.statSync(target).size > 10000) continue;
    const r = await fetch(BASE + src);
    if (!r.ok) throw new Error("font download failed: " + src + " -> " + r.status);
    fs.writeFileSync(target, Buffer.from(await r.arrayBuffer()));
  }
  return dir;
}

function fontFaceCSS(dir) {
  return FONTS.map(([, out, fam, weight, style]) => {
    const b64 = fs.readFileSync(path.join(dir, out)).toString("base64");
    return `@font-face{font-family:${fam};src:url(data:font/ttf;base64,${b64});font-weight:${weight};font-style:${style};}`;
  }).join("\n");
}

// Renderer: pageFor a square stage. svg must be a full <svg> element string.
// Returns PNG buffer at px×px.
async function makeBrowserRenderer(fontDir) {
  await ensureFonts(fontDir);
  const css = fontFaceCSS(fontDir);
  let chromium;
  try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require("playwright-core")); }
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  async function renderPngHiRes(svg, bg, px) {
    const ctx = await browser.newContext({ viewport: { width: 900, height: 900 }, deviceScaleFactor: px / 900 });
    const p2 = await ctx.newPage();
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}
html,body{margin:0;padding:0}
.stage{width:900px;height:900px;background:${bg};overflow:hidden}
.stage svg{display:block;width:100%;height:100%}</style></head><body><div class="stage">${svg}</div></body></html>`;
    await p2.setContent(html, { waitUntil: "load" });
    await p2.evaluate(() => document.fonts.ready);
    await p2.waitForTimeout(150);
    const el = await p2.$(".stage");
    const buf = await el.screenshot({ type: "png" });
    await ctx.close();
    return buf;
  }
  return { renderPng: renderPngHiRes, close: () => browser.close() };
}

module.exports = { ensureFonts, fontFaceCSS, makeBrowserRenderer };
