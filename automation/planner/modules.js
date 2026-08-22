// Bespoke planner module library — every page is A4, house style.
// Each module is a function (answers) => html string for one page (or more).
// Assembled by build-planner.js according to the customer's questionnaire.
const COLOURS = {
  fern: "#3C5B45",
  night: "#1F3229",
  rust: "#B5432F",
  plum: "#5E4A8C",
};
const CREAM = "#F4EFE3";
const INK = "#1A1A1A";
const GOLD = "#E8B63C";
const PAPER = "#FBFAF5";

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Shared page scaffolding. Easy-read swaps serif body for Space Grotesk,
// bumps sizes and spacing, and drops italics.
function css(a) {
  const easy = a.easyRead;
  return `
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  .page { width: 210mm; height: 297mm; background: ${PAPER}; color: ${INK};
    padding: 16mm 15mm; page-break-after: always; position: relative;
    font-family: ${easy ? "'Space Grotesk'" : "'Fraunces'"}, serif;
    font-size: ${easy ? "13pt" : "11.5pt"}; line-height: ${easy ? 1.7 : 1.5}; }
  .kicker { font-family: 'Space Mono', monospace; font-size: 9pt; letter-spacing: 3px;
    text-transform: uppercase; color: ${a.accent}; margin-bottom: 4mm; }
  h1 { font-family: 'Anton', sans-serif; font-weight: 400; font-size: ${easy ? "26pt" : "24pt"};
    text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6mm; }
  h2 { font-family: ${easy ? "'Space Grotesk'" : "'Fraunces'"}, serif; font-weight: 600;
    font-size: ${easy ? "15pt" : "14pt"}; margin: 5mm 0 3mm; }
  .soft { ${easy ? "" : "font-style: italic;"} color: #4a564d; font-size: ${easy ? "12pt" : "10.5pt"}; }
  .box { border: 1.2pt solid ${INK}; border-radius: 3mm; padding: 4mm; }
  .rule-line { border-bottom: 0.7pt solid #b9b3a4; height: ${easy ? "11mm" : "9mm"}; }
  .foot { position: absolute; bottom: 9mm; left: 15mm; right: 15mm;
    font-family: 'Space Mono', monospace; font-size: 7.5pt; color: #8a857a;
    display: flex; justify-content: space-between; }
  .caveat { font-family: 'Caveat', cursive; font-size: 16pt; color: ${a.accent}; }
  table { border-collapse: collapse; width: 100%; }
  `;
}

const foot = (a, label) =>
  `<div class="foot"><span>${esc(label)}</span><span>made for ${esc(a.name)} · frog logic</span></div>`;

// ---- pages ----

function cover(a) {
  return `<div class="page" style="background:${a.accent}; color:${CREAM}; display:flex; flex-direction:column; justify-content:center;">
    <div style="font-family:'Space Mono',monospace; letter-spacing:4px; font-size:10pt; opacity:.85;">FROG LOGIC · BESPOKE</div>
    <div style="font-family:'Anton',sans-serif; font-size:46pt; text-transform:uppercase; line-height:1.08; margin:10mm 0 6mm; transform:rotate(-1.5deg);">
      ${esc(a.name)}'s<br/>Planner</div>
    <div style="font-family:'Caveat',cursive; font-size:22pt; color:${GOLD};">built for your brain, not the other way round</div>
    <div style="position:absolute; bottom:14mm; left:15mm; font-family:'Space Mono',monospace; font-size:8.5pt; opacity:.8;">
      shop.froglogic.co.uk · print as many copies as you like — it's yours</div>
  </div>`;
}

function howTo(a, moduleNames) {
  const items = moduleNames.map((m) => `<li style="margin-bottom:2.5mm;">${esc(m)}</li>`).join("");
  return `<div class="page">
    <div class="kicker">how this works</div>
    <h1>Built from your answers</h1>
    <p>This planner was assembled for you, from what you said about how your brain likes to work. Nothing here is filler — every page earned its place. It's undated on purpose: skip a day, skip a week, and nothing is "ruined". Print pages again whenever you need them.</p>
    <h2>What's inside</h2>
    <ul style="list-style:none;">${items}</ul>
    <p class="soft" style="margin-top:6mm;">A planner is a tool, not a report card. If a page doesn't help, leave it blank. Blank pages are not failure — they're pages.</p>
    ${foot(a, "how this works")}
  </div>`;
}

function energyRow(a) {
  if (a.energy === "spoons") {
    const sp = Array.from({ length: 10 }, () =>
      `<span style="display:inline-block;width:7mm;height:7mm;border:1.1pt solid ${INK};border-radius:50% 50% 40% 40%;margin-right:2mm;"></span>`).join("");
    return `<h2>Spoons today</h2><div>${sp}</div><div class="soft" style="margin-top:1.5mm;">Colour in what you woke up with. Plan for that number, not the number you wish it was.</div>`;
  }
  if (a.energy === "battery") {
    return `<h2>Battery today</h2>
      <div style="display:flex;align-items:center;"><div style="width:60mm;height:9mm;border:1.2pt solid ${INK};border-radius:2mm;display:flex;">
      ${[0,1,2,3].map(()=>`<div style="flex:1;border-right:0.7pt solid #b9b3a4;"></div>`).join("")}<div style="flex:1;"></div></div>
      <div style="width:2.5mm;height:4mm;background:${INK};border-radius:0 1mm 1mm 0;"></div></div>
      <div class="soft" style="margin-top:1.5mm;">Shade to today's level. Low battery days get low battery plans.</div>`;
  }
  return "";
}

function dailyTime(a) {
  const start = a.dayShape === "evening" ? 10 : 6;
  const rows = Array.from({ length: 16 }, (_, i) => {
    const h = (start + i) % 24;
    const label = `${((h + 11) % 12) + 1}${h < 12 ? "am" : "pm"}`;
    return `<tr><td style="font-family:'Space Mono',monospace;font-size:8.5pt;color:#8a857a;width:14mm;padding:0 2mm;border-bottom:0.7pt solid #b9b3a4;height:${a.easyRead ? "10.2mm" : "8.6mm"};vertical-align:bottom;">${label}</td>
      <td style="border-bottom:0.7pt solid #b9b3a4;"></td></tr>`;
  }).join("");
  return `<div class="page">
    <div class="kicker">daily · time-blocked</div>
    <h1>Today</h1>
    ${energyRow(a)}
    <h2>The day, in blocks</h2>
    <table>${rows}</table>
    <p class="soft" style="margin-top:3mm;">Blocks are guesses, not promises. Moving one is planning, not failing.</p>
    ${foot(a, "daily page — print one per day")}
  </div>`;
}

function dailyList(a) {
  const three = [1, 2, 3].map((n) =>
    `<div style="display:flex;align-items:flex-end;margin-bottom:4mm;">
      <span style="font-family:'Anton',sans-serif;font-size:16pt;color:${a.accent};width:10mm;">${n}</span>
      <div class="rule-line" style="flex:1;"></div></div>`).join("");
  const maybe = Array.from({ length: 4 }, () => `<div class="rule-line"></div>`).join("");
  const dump = Array.from({ length: 7 }, () => `<div class="rule-line"></div>`).join("");
  return `<div class="page">
    <div class="kicker">daily · list</div>
    <h1>Today</h1>
    ${energyRow(a)}
    <h2>The big three</h2>
    <p class="soft">If only these happen, today counted.</p>
    ${three}
    <h2>If there's room</h2>
    ${maybe}
    <h2>Brain dump</h2>
    <p class="soft">Everything circling — out of your head, onto the page.</p>
    ${dump}
    ${foot(a, "daily page — print one per day")}
  </div>`;
}

function weekly(a) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const cells = days.map((d) =>
    `<div style="border:1.1pt solid ${INK};border-radius:2.5mm;padding:2.5mm;height:28mm;">
      <span style="font-family:'Space Mono',monospace;font-size:9pt;color:${a.accent};">${d}</span></div>`).join("");
  return `<div class="page">
    <div class="kicker">weekly</div>
    <h1>The week, roughly</h1>
    <p class="soft">A shape, not a schedule. Pencil recommended.</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:3.5mm;margin-top:4mm;">${cells}
      <div style="border:1.1pt dashed ${a.accent};border-radius:2.5mm;padding:2.5mm;height:28mm;">
        <span style="font-family:'Space Mono',monospace;font-size:9pt;color:${a.accent};">Wins</span>
        <div class="soft" style="font-size:9pt;">anything that went right, however small</div></div>
    </div>
    ${foot(a, "weekly spread — print one per week")}
  </div>`;
}

function taskBreakdown(a) {
  const steps = Array.from({ length: 9 }, (_, i) =>
    `<div style="display:flex;align-items:flex-end;margin-bottom:3mm;">
      <span style="font-family:'Space Mono',monospace;font-size:9pt;color:#8a857a;width:8mm;">${i + 1}.</span>
      <div class="rule-line" style="flex:1;height:${a.easyRead ? "10mm" : "8mm"};"></div></div>`).join("");
  return `<div class="page">
    <div class="kicker">one task, broken down</div>
    <h1>Make it startable</h1>
    <h2>The task</h2><div class="rule-line"></div>
    <h2>The very first physical action</h2>
    <p class="soft">Smaller than feels sensible. "Pick up one cup" beats "tidy the kitchen".</p>
    <div class="rule-line"></div>
    <h2>Then, in order</h2>
    ${steps}
    <h2>What might block me</h2>
    <div class="rule-line"></div><div class="rule-line"></div>
    ${foot(a, "task breakdown — print per scary task")}
  </div>`;
}

function sensoryReset(a) {
  const items = ["Lights down or softer", "Noise off / headphones on", "Comfortable clothes, tags out",
    "Something to touch or fidget with", "Water or a safe drink", "Weight — blanket, pet, cushion",
    "Somewhere quieter to be", "Phone somewhere else"];
  const list = items.map((t) =>
    `<div style="display:flex;align-items:center;margin-bottom:${a.easyRead ? "5mm" : "4mm"};">
      <span style="width:6mm;height:6mm;border:1.2pt solid ${INK};border-radius:1.5mm;margin-right:4mm;flex-shrink:0;"></span>${esc(t)}</div>`).join("");
  return `<div class="page">
    <div class="kicker">sensory reset</div>
    <h1>Too much? Start here</h1>
    <p class="soft">For the days the world is loud. Tick what you can reach; skip what you can't.</p>
    <div style="margin-top:5mm;">${list}</div>
    <h2>My fastest resets</h2>
    <p class="soft">The ones that actually work for you — fill these in on a good day.</p>
    <div class="rule-line"></div><div class="rule-line"></div><div class="rule-line"></div>
    ${foot(a, "sensory reset")}
  </div>`;
}

function safeFoods(a) {
  const cols = ["Always works", "Usually works", "Only on good days"].map((h) =>
    `<div style="flex:1;"><h2 style="margin-top:0;">${h}</h2>${Array.from({ length: 8 }, () => `<div class="rule-line"></div>`).join("")}</div>`).join(`<div style="width:6mm;"></div>`);
  return `<div class="page">
    <div class="kicker">safe foods</div>
    <h1>Food that's on your side</h1>
    <p class="soft">Same meal again is a system, not a rut. Keep the list where hungry-you can find it.</p>
    <div style="display:flex;margin-top:4mm;">${cols}</div>
    <h2>Low-effort backups that count as eating</h2>
    <div class="rule-line"></div><div class="rule-line"></div>
    ${foot(a, "safe foods")}
  </div>`;
}

function joyLog(a) {
  const rows = Array.from({ length: 10 }, () =>
    `<div style="display:flex;align-items:flex-end;margin-bottom:3.5mm;">
      <span class="caveat" style="width:10mm;">☺</span><div class="rule-line" style="flex:1;"></div></div>`).join("");
  return `<div class="page">
    <div class="kicker">the joy log</div>
    <h1>Evidence of good things</h1>
    <p class="soft">Not gratitude homework. Textures, sounds, moments, the special interest hit — anything that felt genuinely good.</p>
    <div style="margin-top:5mm;">${rows}</div>
    <p class="caveat" style="margin-top:4mm;">read this page back on the bad days — that's what it's for</p>
    ${foot(a, "joy log")}
  </div>`;
}

function appointmentPrep(a) {
  return `<div class="page">
    <div class="kicker">appointment prep</div>
    <h1>Before you go in</h1>
    <h2>What this appointment is for, in one line</h2><div class="rule-line"></div>
    <h2>The three things I need to say</h2>
    ${[1,2,3].map((n)=>`<div style="display:flex;align-items:flex-end;margin-bottom:3mm;"><span style="font-family:'Space Mono',monospace;width:8mm;color:#8a857a;">${n}.</span><div class="rule-line" style="flex:1;"></div></div>`).join("")}
    <h2>What I want to leave with</h2><div class="rule-line"></div><div class="rule-line"></div>
    <h2>If I go blank, show them this box</h2>
    <div class="box" style="height:34mm;"></div>
    <p class="soft" style="margin-top:3mm;">Write it while you're calm. Going blank isn't failing — it's why this page exists.</p>
    ${foot(a, "appointment prep — print per appointment")}
  </div>`;
}

function weeklyReview(a) {
  return `<div class="page">
    <div class="kicker">weekly wind-down</div>
    <h1>Look back, gently</h1>
    <h2>What worked this week</h2><div class="rule-line"></div><div class="rule-line"></div>
    <h2>What cost more than it should</h2><div class="rule-line"></div><div class="rule-line"></div>
    <h2>What I'm dropping next week, guilt-free</h2><div class="rule-line"></div>
    <h2>One kind thing I'm doing for future me</h2><div class="rule-line"></div>
    <p class="caveat" style="margin-top:8mm;">the week is finished either way — you may as well be kind about it</p>
    ${foot(a, "weekly wind-down — print one per week")}
  </div>`;
}

function notes(a) {
  const dots = `<div style="height:225mm;background-image:radial-gradient(circle, #b9b3a4 0.45mm, transparent 0.45mm);background-size:6mm 6mm;"></div>`;
  return `<div class="page">
    <div class="kicker">notes</div>
    <h1>Spare brain space</h1>
    ${dots}
    ${foot(a, "notes — print as many as you like")}
  </div>`;
}

module.exports = { COLOURS, css, cover, howTo, dailyTime, dailyList, weekly, taskBreakdown, sensoryReset, safeFoods, joyLog, appointmentPrep, weeklyReview, notes };
