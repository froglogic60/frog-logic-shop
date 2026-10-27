// The fun page posts (Sam, 27 Oct 2026: "maybe some fun, light stuff that
// makes people feel good" ... "all of them, write the first four weeks" ... "Go").
//
// Seven kinds of card, one a day on the Facebook page and Instagram:
//   news  — Pond News, a tiny newspaper front page
//   slip  — an official permission slip, signed and stamped by the frog
//   pond  — Down at the pond: the frog, Sid the snail, Hermione the heron, Dot the dormouse
//   fact  — Frog fact (every fact checked; the source is printed on the card)
//   star  — Gold Star Friday
//   spot  — Spot the frog: a busy picture with the frog hidden in it
//   frogs — Show us your frogs
//
// Reads automation/social/fun-queue.json and writes each card to
// automation/social/fun/<name>.jpg (1080x1080). The "Fun page posts" workflow
// renders and commits them; fun-posts.yml posts one a day at 19:07 UTC via
// announce.js (QUEUE_FILE=fun-queue.json), which uses the entry's `image`.
//
//   node fun-cards.cjs              build every card
//   ONLY=spot-1 node fun-cards.cjs  build one
const fs = require("fs");
const path = require("path");
const { ensureFonts, fontFaceCSS } = require("./gfonts.js");

const ROOT = path.join(__dirname, "..", "..");
const OUT = path.join(__dirname, "fun");
const S = 1080;
const C = { cream: "#F4EFE3", paper: "#FBF7EE", ink: "#22331F", brown: "#6B4A32", sage: "#8FB784", sageD: "#5E8A55", red: "#B5443A", gold: "#E8B63C", pink: "#F08F87", grey: "#9AA7B0" };
const LINE = `stroke="${C.ink}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"`;

const uri = (p) => "data:image/png;base64," + fs.readFileSync(path.join(ROOT, p)).toString("base64");
const ART = {};
const art = (name) => (ART[name] ||= uri(`artwork/frogs/${name}.png`));
const MARK = () => (ART.mark ||= uri("assets/frog-logic-mark.png"));
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// A frog from the approved artwork, cropped to the frog (the PNGs carry a title
// above and a line of text below the drawing).
function frog(name, w, extra = "") {
  const h = Math.round(w * 0.66);
  return `<div class="frog" style="width:${w}px;height:${h}px;${extra}"><img src="${art(name)}" style="width:${w}px;height:${w}px;margin-top:${-Math.round(w * 0.15)}px"></div>`;
}

// ---- the pond regulars, drawn in the frogs' style (thick dark line, soft colours, pink cheeks)
function snail(w) {
  return `<svg width="${w}" height="${w * 0.8}" viewBox="0 0 250 200">
    <path d="M20 170 Q20 140 70 140 L200 140 Q232 140 232 118 L232 92 Q232 70 214 70 Q196 70 196 92 L196 150 Q196 180 160 180 L40 180 Q20 180 20 170Z" fill="#E3CFA0" ${LINE}/>
    <line x1="206" y1="74" x2="196" y2="30" ${LINE}/><line x1="224" y1="76" x2="236" y2="34" ${LINE}/>
    <circle cx="196" cy="26" r="9" fill="${C.ink}"/><circle cx="237" cy="30" r="9" fill="${C.ink}"/>
    <circle cx="208" cy="112" r="9" fill="${C.pink}"/>
    <path d="M214 124 Q222 130 230 124" fill="none" ${LINE}/>
    <circle cx="112" cy="96" r="70" fill="#C98A5A" ${LINE}/>
    <path d="M112 96 m0 -8 a8 8 0 1 1 -8 8 a18 18 0 1 1 18 18 a30 30 0 1 1 -30 -30 a44 44 0 1 1 44 44" fill="none" ${LINE}/>
  </svg>`;
}
function heron(w) {
  return `<svg width="${w}" height="${w * 1.6}" viewBox="0 0 200 320">
    <line x1="88" y1="230" x2="80" y2="312" ${LINE}/><line x1="118" y1="230" x2="126" y2="312" ${LINE}/>
    <path d="M70 312 h24 M112 312 h26" ${LINE}/>
    <path d="M48 190 Q40 130 100 128 Q160 130 156 190 Q150 240 100 240 Q52 240 48 190Z" fill="${C.grey}" ${LINE}/>
    <path d="M112 132 Q140 100 116 70 Q96 44 120 22" fill="none" stroke="${C.ink}" stroke-width="22" stroke-linecap="round"/>
    <path d="M112 132 Q140 100 116 70 Q96 44 120 22" fill="none" stroke="${C.grey}" stroke-width="10" stroke-linecap="round"/>
    <circle cx="124" cy="26" r="26" fill="#C9D2D8" ${LINE}/>
    <path d="M146 22 L196 30 L146 38Z" fill="${C.gold}" ${LINE}/>
    <path d="M106 8 Q86 0 70 10" fill="none" ${LINE}/>
    <circle cx="128" cy="20" r="5" fill="${C.ink}"/><circle cx="118" cy="36" r="7" fill="${C.pink}"/>
    <path d="M70 170 Q100 190 140 168" fill="none" ${LINE}/>
  </svg>`;
}
function dormouse(w, awake = false) {
  return `<svg width="${w}" height="${w * 0.8}" viewBox="0 0 250 200">
    <path d="M40 150 Q0 150 10 110 Q20 80 50 100" fill="none" stroke="${C.ink}" stroke-width="22" stroke-linecap="round"/>
    <path d="M40 150 Q0 150 10 110 Q20 80 50 100" fill="none" stroke="#C88A45" stroke-width="10" stroke-linecap="round"/>
    <ellipse cx="135" cy="125" rx="95" ry="68" fill="#E2A95E" ${LINE}/>
    <circle cx="170" cy="62" r="24" fill="#E2A95E" ${LINE}/><circle cx="208" cy="78" r="22" fill="#E2A95E" ${LINE}/>
    <circle cx="170" cy="62" r="11" fill="${C.pink}"/><circle cx="208" cy="78" r="10" fill="${C.pink}"/>
    <ellipse cx="160" cy="140" rx="50" ry="30" fill="#F3D9A8" stroke="none"/>
    ${awake ? `<circle cx="168" cy="108" r="6" fill="${C.ink}"/><circle cx="204" cy="118" r="6" fill="${C.ink}"/>` : `<path d="M158 108 q10 8 20 0 M194 118 q10 8 20 0" fill="none" ${LINE}/>`}
    <circle cx="214" cy="140" r="9" fill="${C.pink}"/><circle cx="226" cy="128" r="6" fill="${C.ink}"/>
  </svg>`;
}
const zzz = (x, y, s = 1) => `<div style="position:absolute;left:${x}px;top:${y}px;font:600 ${46 * s}px Caveat;color:${C.brown};transform:rotate(-12deg)">z z z</div>`;

function shell(inner, bg = C.cream) {
  return `<div class="card" style="background:${bg}">${inner}
  <div class="foot"><img src="${MARK()}"><span>Frog Logic</span></div></div>`;
}

// ---- the seven kinds of card
function newsCard(c, date) {
  const d = new Date(date + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const photo = c.photo === "SNAIL" ? `<div class="ph-svg">${snail(360)}</div>` :
    c.photo === "DOT" ? `<div class="ph-svg">${dormouse(380)}${zzz(560, 40)}</div>` : frog(c.photo, 420, "margin:0 auto");
  return shell(`<div class="news">
    <div class="mast">The Pond News</div>
    <div class="dateline"><span>${esc(d)}</span><span>Price: one fly</span></div>
    <h1 class="fit" data-max="88">${esc(c.headline)}</h1>
    <p class="sub">${esc(c.sub)}</p>
    <div class="photo">${photo}</div>
    <p class="pictured">${esc(c.pictured)}</p>
  </div>`, C.paper);
}

function slipCard(c) {
  return shell(`<div class="slip">
    <div class="slip-in">
      <div class="slip-top"><span>OFFICIAL PERMISSION SLIP</span><span>No. ${esc(c.no)}</span></div>
      <p class="slip-text fit" data-max="68">${esc(c.text)}</p>
      <p class="slip-small">${esc(c.small)}</p>
      <div class="sign"><span class="sig">the frog</span><span class="sigline">Signed</span></div>
      <div class="stamp"><img src="${MARK()}"><span>APPROVED</span></div>
    </div>
  </div>`);
}

function factCard(c) {
  return shell(`<div class="fact">
    <div class="tag">FROG FACT · No. ${c.no}</div>
    <p class="fact-text fit" data-max="66">${esc(c.text)}</p>
    <div class="fact-frog">${frog("comfort-creature", 400)}</div>
    <p class="src">Source: ${esc(c.source)}</p>
  </div>`, C.ink);
}

function starCard(c) {
  const pts = Array.from({ length: 10 }, (_, i) => { const r = i % 2 ? 120 : 270, a = -Math.PI / 2 + i * Math.PI / 5; return `${300 + r * Math.cos(a)},${300 + r * Math.sin(a)}`; }).join(" ");
  return shell(`<div class="star">
    <div class="star-k">${esc(c.kicker || "Every Friday")}</div>
    <h1>${esc(c.title)}</h1>
    <svg class="bigstar" width="460" height="460" viewBox="0 0 600 600"><polygon points="${pts}" fill="${C.gold}" stroke="${C.ink}" stroke-width="14" stroke-linejoin="round"/>
      <circle cx="250" cy="300" r="12" fill="${C.ink}"/><circle cx="350" cy="300" r="12" fill="${C.ink}"/>
      <path d="M262 345 Q300 375 338 345" fill="none" stroke="${C.ink}" stroke-width="12" stroke-linecap="round"/>
      <circle cx="225" cy="335" r="16" fill="${C.pink}"/><circle cx="375" cy="335" r="16" fill="${C.pink}"/></svg>
    <p class="star-text fit" data-max="54">${esc(c.text)}</p>
  </div>`);
}

function frogsCard(c) {
  const pics = c.xmas ? ["socially-hibernating", "socially-hibernating-bright", "socially-hibernating-mono"] : ["comfort-creature", "low-battery", "neurospicy"];
  const rot = [-7, 4, -3];
  return shell(`<div class="frogs">
    <h1>Show us your frogs</h1>
    <div class="polas">${pics.map((p, i) => `<div class="pola" style="transform:rotate(${rot[i]}deg)">${frog(p, 205)}</div>`).join("")}
      <div class="pola mine" style="transform:rotate(6deg)"><div class="q">yours<br>here</div></div></div>
    <p class="frogs-text fit" data-max="50">${esc(c.text)}</p>
    <p class="hint">Pop a photo in the comments</p>
  </div>`);
}

// Seeded so a card is the same every time it's built.
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

function spotScene(scene) {
  const r = rng({ leaves: 7, shelf: 11, frost: 23, tree: 41 }[scene]);
  const hide = (x, y, w, rot = 0) => `<img class="hid" src="${MARK()}" style="left:${x}px;top:${y}px;width:${w}px;transform:rotate(${rot}deg)">`;
  if (scene === "leaves") {
    const cols = ["#C0602F", "#D9893B", "#B5443A", "#E3B04B", "#8C5A2B", "#A97B3C"];
    const leaf = (x, y, s, a, c) => `<svg class="it" style="left:${x}px;top:${y}px;transform:rotate(${a}deg)" width="${s}" height="${s}" viewBox="0 0 100 100"><path d="M50 4 C80 20 92 56 50 96 C8 56 20 20 50 4Z" fill="${c}" stroke="#5A3A1E" stroke-width="3"/><path d="M50 10 V90 M50 40 L30 28 M50 40 L70 28 M50 62 L28 50 M50 62 L72 50" stroke="#5A3A1E" stroke-width="3" fill="none"/></svg>`;
    let under = "", over = "";
    for (let i = 0; i < 150; i++) under += leaf(r() * 980 - 20, r() * 640 - 20, 70 + r() * 70, r() * 360, cols[Math.floor(r() * cols.length)]);
    for (let i = 0; i < 70; i++) { const x = r() * 980 - 20, y = r() * 640 - 20; if (Math.abs(x - 700) < 90 && Math.abs(y - 400) < 80) continue; over += leaf(x, y, 60 + r() * 60, r() * 360, cols[Math.floor(r() * cols.length)]); }
    const cover = leaf(650, 420, 90, 200, "#C0602F") + leaf(730, 388, 80, 70, "#D9893B") + leaf(688, 360, 60, 140, "#B5443A");
    return `<div class="scene" style="background:#7A5A34">${under}${hide(676, 392, 78, -14)}${cover}${over}</div>`;
  }
  if (scene === "shelf") {
    const cols = ["#8FB784", "#F08F87", "#E8B63C", "#6B8FB5", "#F4EFE3", "#B5443A", "#9A7AB0", "#E3CFA0", "#5E8A55"];
    let s = "";
    for (let row = 0; row < 3; row++) {
      const y = 40 + row * 210;
      s += `<div class="it" style="left:0;top:${y + 160}px;width:1000px;height:22px;background:#8C5A2B;border:4px solid #4A2E18"></div>`;
      let x = 20;
      while (x < 940) {
        const w = 70 + r() * 50, h = 90 + r() * 60, c = cols[Math.floor(r() * cols.length)];
        if (r() < 0.25) s += `<svg class="it" style="left:${x}px;top:${y + 160 - 120}px" width="150" height="120" viewBox="0 0 150 120"><ellipse cx="70" cy="74" rx="56" ry="44" fill="${c}" stroke="${C.ink}" stroke-width="5"/><path d="M122 62 Q148 40 140 30" stroke="${C.ink}" stroke-width="8" fill="none"/><path d="M18 60 Q0 70 14 90" stroke="${C.ink}" stroke-width="7" fill="none"/><rect x="50" y="22" width="40" height="12" rx="6" fill="${c}" stroke="${C.ink}" stroke-width="5"/></svg>`, x += 150;
        else s += `<svg class="it" style="left:${x}px;top:${y + 160 - h}px" width="${w + 26}" height="${h}" viewBox="0 0 ${w + 26} ${h}"><rect x="3" y="3" width="${w}" height="${h - 6}" rx="10" fill="${c}" stroke="${C.ink}" stroke-width="5"/><path d="M${w + 2} ${h * 0.3} q22 0 22 ${h * 0.2} q0 ${h * 0.2} -22 ${h * 0.2}" fill="none" stroke="${C.ink}" stroke-width="6"/></svg>`, x += w + 34;
      }
    }
    return `<div class="scene" style="background:#E9DFC9">${s}${hide(470, 494, 70, 4)}<div class="it" style="left:430px;top:500px;width:60px;height:110px;background:#6B8FB5;border:5px solid ${C.ink};border-radius:10px"></div></div>`;
  }
  if (scene === "frost") {
    let s = "";
    for (let i = 0; i < 26; i++) { const x = r() * 980 - 40, y = 200 + r() * 420, w = 120 + r() * 140; if (i === 20) s += hide(724, 452, 70, -6) + `<div class="it" style="left:690px;top:486px;width:150px;height:112px;border-radius:50%;background:#3E6450;border:5px solid ${C.ink}"></div><div class="it" style="left:705px;top:482px;width:120px;height:30px;border-radius:50%;background:#F7F7F2"></div>`; s += `<div class="it" style="left:${x}px;top:${y}px;width:${w}px;height:${w * 0.75}px;border-radius:50%;background:${["#4F7A5A", "#3E6450", "#5E8A55"][i % 3]};border:5px solid ${C.ink}"></div><div class="it" style="left:${x + w * 0.1}px;top:${y - 4}px;width:${w * 0.8}px;height:${w * 0.22}px;border-radius:50%;background:#F7F7F2"></div>`; }
    let lights = "";
    for (let i = 0; i < 22; i++) { const x = 20 + i * 46, y = 90 + Math.sin(i / 2) * 30; lights += `<div class="it" style="left:${x}px;top:${y}px;width:20px;height:28px;border-radius:50% 50% 45% 45%;background:${["#E8B63C", "#B5443A", "#6B8FB5", "#8FB784"][i % 4]};border:3px solid ${C.ink}"></div>`; }
    let snow = ""; for (let i = 0; i < 90; i++) snow += `<div class="it" style="left:${r() * 1000}px;top:${r() * 640}px;width:8px;height:8px;border-radius:50%;background:#fff"></div>`;
    return `<div class="scene" style="background:linear-gradient(#2E3F5C,#5C7091)"><svg class="it" style="left:0;top:60px" width="1000" height="80"><path d="M0 40 Q250 90 500 40 T1000 40" stroke="${C.ink}" stroke-width="4" fill="none"/></svg>${lights}${s}${snow}</div>`;
  }
  // tree
  let b = "";
  const tri = `<svg class="it" style="left:200px;top:20px" width="600" height="600" viewBox="0 0 600 600"><path d="M300 10 L560 560 L40 560Z" fill="#2F6B45" stroke="${C.ink}" stroke-width="8" stroke-linejoin="round"/><rect x="270" y="560" width="60" height="40" fill="#8C5A2B" stroke="${C.ink}" stroke-width="6"/></svg>`;
  const placed = [[422, 380]];
  for (let i = 0; i < 400 && placed.length < 34; i++) {
    const y = 120 + r() * 420, half = (y - 30) * 0.47, x = 500 + (r() * 2 - 1) * (half - 34);
    if (placed.some(([px, py]) => Math.hypot(px - x, py - y) < 66)) continue;
    placed.push([x, y]);
    b += `<div class="it" style="left:${x - 26}px;top:${y - 26}px;width:52px;height:52px;border-radius:50%;background:${["#B5443A", "#E8B63C", "#6B8FB5", "#F08F87", "#9A7AB0", "#8FB784"][i % 6]};border:5px solid ${C.ink}"></div>`;
  }
  return `<div class="scene" style="background:#3A2C2A">${tri}${b}<div class="it" style="left:388px;top:346px;width:68px;height:68px;border-radius:50%;background:#8FB784;border:5px solid ${C.ink}"></div>${hide(392, 356, 60, 0)}</div>`;
}

function spotCard(c) {
  return shell(`<div class="spot">
    <div class="spot-head"><h1>Spot the frog</h1><p>${esc(c.text)}</p></div>
    <div class="spot-frame">${spotScene(c.scene)}</div>
    <p class="hint">Comment 🐸 when you find him. No spoilers!</p>
  </div>`);
}

function pondScene(scene) {
  if (scene === "tea") return `<div class="pscene">
    <div class="clock">3</div>
    <div style="position:absolute;left:60px;bottom:120px">${frog("comfort-creature", 360)}</div>
    <svg style="position:absolute;right:90px;bottom:120px" width="220" height="300" viewBox="0 0 220 300"><path d="M30 290 V40 Q30 10 60 10 H160 Q190 10 190 40 V290 M30 180 H190" fill="none" ${LINE}/></svg>
    <div class="table"></div>
    <svg style="position:absolute;left:420px;bottom:200px" width="240" height="150" viewBox="0 0 240 150"><ellipse cx="110" cy="92" rx="70" ry="52" fill="${C.pink}" ${LINE}/><path d="M178 80 Q220 50 214 30" fill="none" ${LINE}/><rect x="86" y="30" width="48" height="14" rx="7" fill="${C.pink}" ${LINE}/><path d="M60 140 h100" ${LINE}/></svg>
    <svg style="position:absolute;left:330px;bottom:200px" width="90" height="70" viewBox="0 0 90 70"><path d="M10 10 h56 v34 q0 20 -28 20 q-28 0 -28 -20Z" fill="#fff" ${LINE}/><path d="M66 20 q18 0 18 12 q0 12 -18 12" fill="none" ${LINE}/></svg>
    <svg style="position:absolute;left:680px;bottom:200px" width="90" height="70" viewBox="0 0 90 70"><path d="M10 10 h56 v34 q0 20 -28 20 q-28 0 -28 -20Z" fill="#fff" ${LINE}/><path d="M66 20 q18 0 18 12 q0 12 -18 12" fill="none" ${LINE}/></svg>
  </div>`;
  if (scene === "heron") return `<div class="pscene">
    <div style="position:absolute;right:110px;bottom:90px">${heron(330)}</div>
    <div style="position:absolute;left:90px;bottom:100px">${frog("comfort-creature", 380)}</div>
    <svg style="position:absolute;left:470px;bottom:120px" width="140" height="40" viewBox="0 0 140 40"><ellipse cx="70" cy="22" rx="64" ry="14" fill="#fff" ${LINE}/></svg><svg style="position:absolute;left:495px;bottom:138px" width="90" height="90" viewBox="0 0 90 90"><circle cx="45" cy="45" r="36" fill="#D9A15B" ${LINE}/><circle cx="34" cy="36" r="4" fill="${C.ink}"/><circle cx="54" cy="52" r="4" fill="${C.ink}"/><circle cx="50" cy="30" r="4" fill="${C.ink}"/></svg>
    <div class="shout">“I'M ABSOLUTELY FINE”</div>
  </div>`;
  if (scene === "dot") return `<div class="pscene">
    <svg style="position:absolute;left:330px;bottom:110px" width="440" height="300" viewBox="0 0 440 300"><path d="M40 60 H360 V170 Q360 280 200 280 Q40 280 40 170Z" fill="#fff" ${LINE}/><path d="M360 90 Q430 90 430 140 Q430 190 356 196" fill="none" ${LINE}/><path d="M20 290 H380" ${LINE}/></svg>
    <div style="position:absolute;left:410px;bottom:270px">${dormouse(290)}</div>
    <svg style="position:absolute;left:420px;bottom:250px" width="260" height="110" viewBox="0 0 260 110"><path d="M10 60 C70 0 190 0 250 60 C190 110 70 110 10 60Z" fill="${C.sage}" ${LINE}/><path d="M20 60 H240" ${LINE}/></svg>
    ${zzz(700, 160)}
    <div style="position:absolute;left:40px;bottom:120px">${frog("comfort-creature", 300)}</div>
    <div class="note">Wake up whenever.<br>No rush. x</div>
  </div>`;
  // cracker
  return `<div class="pscene">
    <div class="table" style="bottom:120px;left:300px;right:300px"></div>
    <div style="position:absolute;left:330px;bottom:150px">${frog("socially-hibernating", 300)}</div>
    <div style="position:absolute;left:40px;bottom:120px">${snail(240)}</div>
    <div style="position:absolute;right:50px;bottom:110px">${heron(190)}</div>
    <div style="position:absolute;left:630px;bottom:150px">${dormouse(160)}</div>${zzz(680, 330, 0.7)}
    <svg style="position:absolute;left:400px;bottom:146px" width="180" height="52" viewBox="0 0 280 80"><path d="M70 20 H210 V60 H70Z M70 20 L30 6 V74 L70 60 M210 20 L250 6 V74 L210 60" fill="${C.red}" ${LINE}/><path d="M110 20 V60 M170 20 V60" stroke="${C.gold}" stroke-width="8"/></svg>
  </div>`;
}

function pondCard(c) {
  return shell(`<div class="pond">
    <div class="tag dark">DOWN AT THE POND</div>
    <div class="pond-frame">${pondScene(c.scene)}</div>
    <p class="pond-text fit" data-max="48">${esc(c.text)}</p>
  </div>`);
}

const CSS = `
html,body{margin:0;padding:0}
.card{width:${S}px;height:${S}px;position:relative;overflow:hidden;box-sizing:border-box;font-family:'Space Grotesk';color:${C.ink}}
.foot{position:absolute;right:46px;bottom:28px;display:flex;align-items:center;gap:12px;font:600 34px Caveat;color:${C.brown}}
.foot img{width:46px}
.fit{margin:0}
.frog{overflow:hidden;position:relative}.frog img{display:block}
.tag{display:inline-block;font:700 26px 'Space Mono';letter-spacing:.18em;color:${C.gold};margin-bottom:28px}
.tag.dark{color:${C.red}}
.news{position:absolute;inset:56px 70px 90px;display:flex;flex-direction:column;align-items:center;text-align:center}
.mast{font:italic 600 108px Fraunces;letter-spacing:-.01em;border-bottom:6px double ${C.ink};width:100%;padding-bottom:8px;line-height:1}
.dateline{display:flex;justify-content:space-between;width:100%;font:400 24px 'Space Mono';border-bottom:3px solid ${C.ink};padding:10px 0 12px}
.news h1{font:800 88px/1.02 Fraunces;margin:30px 0 12px;max-height:190px}
.sub{font:italic 400 40px/1.15 'Instrument Serif';margin:0 0 18px;color:${C.brown}}
.photo{border:4px solid ${C.ink};background:#EDE6D6;width:540px;height:330px;display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative}
.ph-svg{position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center}
.pictured{font:italic 400 28px 'Instrument Serif';margin:10px 0 0}
.slip{position:absolute;inset:110px 80px 140px;background:${C.paper};border:5px solid ${C.ink};box-shadow:14px 14px 0 ${C.sage};transform:rotate(-2deg)}
.slip-in{position:absolute;inset:22px;border:3px dashed ${C.brown};padding:44px 50px}
.slip-top{display:flex;justify-content:space-between;font:700 30px 'Space Mono';letter-spacing:.12em;border-bottom:3px solid ${C.ink};padding-bottom:18px}
.slip-text{font:600 68px/1.12 Fraunces;margin-top:48px;max-height:330px}
.slip-small{font:italic 400 40px 'Instrument Serif';color:${C.brown};margin:18px 0 0}
.sign{position:absolute;left:50px;bottom:60px;display:flex;flex-direction:column}
.sig{font:700 76px Caveat;color:${C.ink};transform:rotate(-4deg);margin-bottom:-14px}
.sigline{border-top:3px solid ${C.ink};width:330px;font:400 22px 'Space Mono';padding-top:6px;letter-spacing:.1em}
.stamp{position:absolute;right:60px;bottom:50px;width:210px;height:210px;border-radius:50%;border:8px solid ${C.red};color:${C.red};display:flex;flex-direction:column;align-items:center;justify-content:center;transform:rotate(14deg);opacity:.9}
.stamp img{width:96px;filter:grayscale(1) sepia(1) saturate(6) hue-rotate(-30deg) brightness(.8)}
.stamp span{font:700 30px 'Space Mono';letter-spacing:.1em;margin-top:6px}
.fact{position:absolute;inset:80px 90px 100px;color:${C.cream}}
.fact-text{font:500 66px/1.15 Fraunces;max-height:470px}
.fact-frog{position:absolute;right:-20px;bottom:40px}
.src{position:absolute;left:0;bottom:-30px;font:400 22px 'Space Mono';color:#B9C7B0}
.card .fact ~ .foot,.card:has(.fact) .foot{color:${C.cream}}
.star{position:absolute;inset:60px 80px 110px;display:flex;flex-direction:column;align-items:center;text-align:center}
.star-k{font:700 26px 'Space Mono';letter-spacing:.18em;color:${C.red};text-transform:uppercase}
.star h1{font:800 104px Fraunces;margin:4px 0 0;line-height:1}
.bigstar{margin:6px 0}
.star-text{font:500 54px/1.15 Fraunces;max-height:200px}
.frogs{position:absolute;inset:60px 60px 110px;display:flex;flex-direction:column;align-items:center;text-align:center}
.frogs h1{font:800 96px Fraunces;margin:0;line-height:1}
.polas{display:flex;gap:18px;margin:44px 0 36px;align-items:center}
.pola{background:#fff;padding:14px 14px 50px;border:3px solid #D8CFBC;box-shadow:6px 8px 0 rgba(0,0,0,.08)}
.pola .frog{background:#F1ECDF}
.mine{width:180px;height:135px;display:flex;align-items:center;justify-content:center}
.q{font:700 52px/1 Caveat;color:${C.brown}}
.frogs-text{font:500 48px/1.18 Fraunces;max-height:180px}
.hint{font:600 46px Caveat;color:${C.red};margin:16px 0 0}
.spot{position:absolute;inset:44px 50px 96px;display:flex;flex-direction:column;align-items:center;text-align:center}
.spot-head h1{font:800 92px Fraunces;margin:0;line-height:1}.spot-head p{font:italic 400 44px 'Instrument Serif';margin:8px 0 18px;color:${C.brown}}
.spot-frame{width:980px;height:640px;border:6px solid ${C.ink};position:relative;overflow:hidden}
.scene{position:absolute;inset:0;overflow:hidden}.scene .it,.scene .hid{position:absolute}
.pond{position:absolute;inset:60px 60px 100px;display:flex;flex-direction:column;align-items:center;text-align:center}
.pond-frame{width:960px;height:640px;background:linear-gradient(#E4EEDB 0 70%,#CFE0C4 70%);border:6px solid ${C.ink};border-radius:28px;position:relative;overflow:hidden}
.pscene{position:absolute;inset:0}
.table{position:absolute;left:280px;right:250px;bottom:180px;height:26px;background:#B07A4A;border:6px solid ${C.ink};border-radius:8px}
.clock{position:absolute;left:470px;top:40px;width:120px;height:120px;border-radius:50%;background:#fff;border:6px solid ${C.ink};font:800 60px Fraunces;display:flex;align-items:center;justify-content:center}
.shout{position:absolute;left:50px;top:40px;max-width:520px;text-align:left;line-height:1.05;font:800 50px Fraunces;color:${C.red};transform:rotate(-4deg)}
.note{position:absolute;left:70px;top:60px;background:#FFF6C9;border:4px solid ${C.ink};padding:22px 30px;font:700 50px/1.05 Caveat;transform:rotate(-5deg);box-shadow:6px 6px 0 rgba(0,0,0,.1)}
.pond-text{font:500 48px/1.18 Fraunces;margin-top:28px;max-height:170px}
`;

const BUILD = { news: newsCard, slip: slipCard, fact: factCard, star: starCard, frogs: frogsCard, spot: spotCard, pond: pondCard };

(async () => {
  const queue = JSON.parse(fs.readFileSync(path.join(__dirname, "fun-queue.json"), "utf8"));
  const only = process.env.ONLY ? process.env.ONLY.split(",") : null;
  const fontDir = path.join(__dirname, ".gfonts");
  await ensureFonts(fontDir);
  const css = fontFaceCSS(fontDir);
  fs.mkdirSync(OUT, { recursive: true });
  let chromium; try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require("playwright-core")); }
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const page = await (await browser.newContext({ viewport: { width: S, height: S } })).newPage();
  let n = 0;
  for (const e of queue) {
    if (only && !only.includes(e.name)) continue;
    const html = BUILD[e.type](e.card, e.postOn);
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${css}${CSS}</style></head><body>${html}</body></html>`, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    // Shrink any text marked .fit until it sits inside its max-height.
    await page.evaluate(() => {
      document.querySelectorAll(".fit").forEach((el) => {
        let size = parseFloat(getComputedStyle(el).fontSize);
        const max = parseFloat(getComputedStyle(el).maxHeight) || Infinity;
        el.style.maxHeight = "none";
        while (el.scrollHeight > max && size > 20) { size -= 2; el.style.fontSize = size + "px"; }
      });
    });
    await page.waitForTimeout(60);
    await (await page.$(".card")).screenshot({ path: path.join(OUT, `${e.name}.jpg`), type: "jpeg", quality: 90 });
    n++;
  }
  await browser.close();
  console.log(`${n} fun cards built in ${OUT}`);
})().catch((e) => { console.error(e); process.exit(1); });
