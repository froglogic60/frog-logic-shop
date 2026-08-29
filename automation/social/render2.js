// Frog Logic social image renderer — house style, 1080x1080 JPEG.
// Four layouts: quote, art (product artwork), showcase (digital product),
// note (educational / behind-the-scenes card).
const fs = require("fs");
const path = require("path");

const sharp = require("sharp");

const SIZE = 1080;
const CREAM = "#F4EFE3";
const INK = "#1A1A1A";
const GOLD = "#E8B63C";
const NIGHT = "#1F3229";
const FERN = "#3C5B45";
const RUST = "#D14A26";
const QUOTE_BGS = [FERN, NIGHT, RUST, INK, "#5E4A8C", "#B5432F"];

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function wrap(text, maxChars) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxChars && cur) { lines.push(cur); cur = w; }
    else cur = (cur + " " + w).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}

function makeRenderer({ logoFile }) {
  const logoData = "data:image/png;base64," + fs.readFileSync(logoFile).toString("base64");

  const grain = (id, opacity, fill) => `<defs><pattern id="${id}" width="22" height="22" patternUnits="userSpaceOnUse">
      <circle cx="5.5" cy="5.5" r="5.5" fill="${fill}" opacity="${opacity}"/>
    </pattern></defs><rect width="${SIZE}" height="${SIZE}" fill="url(#${id})"/>`;
  const logoMark = (x, y, w) => `<image href="${logoData}" x="${x}" y="${y}" width="${w}" height="${w}" preserveAspectRatio="xMidYMid meet"/>`;
  const inlineArt = (svg) => svg
    .replace(/href="assets\/frog-logic-mark-sm\.png"/g, `href="${logoData}"`)
    .replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");

  function quoteSvg({ text, kicker }, seed = 0) {
    const bg = QUOTE_BGS[seed % QUOTE_BGS.length];
    const maxChars = text.length > 90 ? 24 : text.length > 50 ? 20 : 14;
    const lines = wrap(text.toUpperCase(), maxChars);
    const fsz = lines.length > 5 ? 88 : lines.length > 3 ? 104 : 128;
    const lh = fsz * 1.08;
    const y0 = (SIZE - lines.length * lh) / 2 + fsz * 0.8;
    const rot = [-2, 1.5, -1, 2, -1.5, 1];
    const tspans = lines.map((l, i) => {
      const y = y0 + i * lh;
      return `<text x="90" y="${y}" font-family="Anton" font-size="${fsz}" fill="${i === lines.length - 1 ? GOLD : CREAM}" transform="rotate(${rot[i % rot.length]} 90 ${y})">${esc(l)}</text>`;
    }).join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" fill="${bg}"/>${grain("g", 0.10, CREAM)}
  <text x="90" y="120" font-family="Space Mono" font-size="30" letter-spacing="6" fill="${CREAM}" opacity="0.85">${esc(kicker.toUpperCase())}</text>
  ${tspans}
  <text x="90" y="${SIZE - 70}" font-family="Space Mono" font-size="28" fill="${CREAM}" opacity="0.8">frog logic · froglogic.co.uk</text>
  ${logoMark(SIZE - 190, 62, 120)}
</svg>`;
  }

  function artSvg(product) {
    const lines = wrap(product.line, 44).slice(0, 3).map((l, i) =>
      `<text x="${SIZE / 2}" y="${SIZE - 150 + i * 44}" text-anchor="middle" font-family="Fraunces" font-style="italic" font-size="34" fill="${CREAM}">${esc(l)}</text>`).join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" fill="${product.bg}"/>
  <g transform="translate(140,60) scale(2.66)">${inlineArt(product.svg)}</g>
  <rect x="0" y="${SIZE - 230}" width="${SIZE}" height="230" fill="${INK}" opacity="0.28"/>
  ${lines}
  <text x="${SIZE / 2}" y="${SIZE - 42}" text-anchor="middle" font-family="Space Mono" font-size="26" fill="${CREAM}" opacity="0.8">frog logic</text>
</svg>`;
  }

  function showcaseSvg(product) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" fill="${product.bg}"/>
  <g transform="translate(190,40) scale(2.33)">${inlineArt(product.svg)}</g>
  <rect x="0" y="${SIZE - 290}" width="${SIZE}" height="290" fill="${INK}"/>
  <text x="90" y="${SIZE - 200}" font-family="Fraunces" font-size="52" font-weight="600" fill="${CREAM}">${esc(product.word)}</text>
  <text x="90" y="${SIZE - 136}" font-family="Space Mono" font-size="32" fill="${GOLD}">${esc(product.price)} · instant download</text>
  <text x="90" y="${SIZE - 74}" font-family="Space Mono" font-size="28" fill="${CREAM}" opacity="0.85">froglogic.co.uk</text>
</svg>`;
  }

  function noteSvg({ tag, title, body }, seed = 0) {
    const bg = seed % 2 ? FERN : NIGHT;
    const titleLines = wrap(title, 22);
    const bodyLines = wrap(body, 44).slice(0, 8);
    const tY = 300;
    const tParts = titleLines.map((l, i) =>
      `<text x="90" y="${tY + i * 72}" font-family="Fraunces" font-size="60" font-weight="600" fill="${CREAM}">${esc(l)}</text>`).join("");
    const bY = tY + titleLines.length * 72 + 60;
    const bParts = bodyLines.map((l, i) =>
      `<text x="90" y="${bY + i * 52}" font-family="Fraunces" font-style="italic" font-size="36" fill="${CREAM}" opacity="0.92">${esc(l)}</text>`).join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" fill="${bg}"/>${grain("g", 0.08, CREAM)}
  <text x="90" y="150" font-family="Space Mono" font-size="30" letter-spacing="6" fill="${GOLD}">${esc(tag.toUpperCase())}</text>
  ${tParts}${bParts}
  <text x="90" y="${SIZE - 70}" font-family="Space Mono" font-size="28" fill="${CREAM}" opacity="0.8">frog logic · froglogic.co.uk</text>
  ${logoMark(SIZE - 190, 62, 120)}
</svg>`;
  }

  // Renders in headless Chromium with the site's exact fonts (see gfonts.js)
  // — the old resvg path lacked several font families the product artwork
  // uses, so embedded designs came out with wrong, overflowing type.
  let browserRenderer = null;
  async function renderToJpeg(svg, outPath) {
    if (!browserRenderer) {
      const { makeBrowserRenderer } = require("./gfonts.js");
      browserRenderer = await makeBrowserRenderer(path.join(__dirname, ".gfonts"));
    }
    const png = await browserRenderer.renderPng(svg, "#ffffff", SIZE);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    await sharp(png).flatten({ background: "#ffffff" }).jpeg({ quality: 88 }).toFile(outPath);
    await browserRenderer.close();
    browserRenderer = null;
    return outPath;
  }

  function svgFor(post, seed) {
    if (post.kind === "quote") return quoteSvg(post.item, seed);
    if (post.kind === "art") return artSvg(post.item);
    if (post.kind === "showcase") return showcaseSvg(post.item);
    return noteSvg(post.item, seed);
  }

  return { svgFor, renderToJpeg };
}

module.exports = { makeRenderer };
