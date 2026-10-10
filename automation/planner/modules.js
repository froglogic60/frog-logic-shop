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

// The things the customer said they lose track of every day, as a tick strip
// on every daily page. Their words, not ours — that is the point of it.
function nonNegotiables(a) {
  if (!a.forgets || !a.forgets.length) return "";
  const items = a.forgets.slice(0, 7).map((t) =>
    `<span style="display:inline-flex;align-items:center;margin:0 5mm 1.5mm 0;white-space:nowrap;">
      <span style="width:5mm;height:5mm;border:1.1pt solid ${INK};border-radius:1.2mm;margin-right:2mm;flex-shrink:0;"></span>${esc(t)}</span>`).join("");
  return `<div style="border-top:0.7pt solid #b9b3a4;border-bottom:0.7pt solid #b9b3a4;padding:2.5mm 0 1mm;margin:3mm 0 2mm;font-size:${a.easyRead ? "11pt" : "10pt"};">
    <span style="font-family:'Space Mono',monospace;font-size:8pt;letter-spacing:2px;text-transform:uppercase;color:${a.accent};margin-right:4mm;">don't forget</span>${items}</div>`;
}

function dailyTime(a) {
  const start = a.dayShape === "evening" ? 10 : 6;
  const strip = nonNegotiables(a);
  const rows = Array.from({ length: strip ? 14 : 16 }, (_, i) => {
    const h = (start + i) % 24;
    const label = `${((h + 11) % 12) + 1}${h < 12 ? "am" : "pm"}`;
    return `<tr><td style="font-family:'Space Mono',monospace;font-size:8.5pt;color:#8a857a;width:14mm;padding:0 2mm;border-bottom:0.7pt solid #b9b3a4;height:${a.easyRead ? "10.2mm" : "8.6mm"};vertical-align:bottom;">${label}</td>
      <td style="border-bottom:0.7pt solid #b9b3a4;"></td></tr>`;
  }).join("");
  return `<div class="page">
    <div class="kicker">daily · time-blocked</div>
    <h1>Today</h1>
    ${energyRow(a)}
    ${strip}
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
  const strip = nonNegotiables(a);
  const maybe = Array.from({ length: strip ? 3 : 4 }, () => `<div class="rule-line"></div>`).join("");
  const dump = Array.from({ length: strip ? 5 : 7 }, () => `<div class="rule-line"></div>`).join("");
  return `<div class="page">
    <div class="kicker">daily · list</div>
    <h1>Today</h1>
    ${energyRow(a)}
    ${strip}
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

// Their own words: what a hard day looks like, what helps. Printed as written,
// typos included — it is theirs. The lower half is made to be torn off or
// photographed and handed to whoever is nearby.
function hardDay(a) {
  const looks = (a.hardDayLooks || "").trim();
  const helps = (a.hardDayHelps || "").trim();
  const words = (t, fallbackLines) => t
    ? `<div class="box" style="border-color:${a.accent};padding:4mm 5mm;white-space:pre-wrap;">${esc(t)}</div>`
    : Array.from({ length: fallbackLines }, () => `<div class="rule-line"></div>`).join("");
  return `<div class="page">
    <div class="kicker">hard days</div>
    <h1>If today is one of those</h1>
    <p class="soft">You wrote this on a better day, so present-you doesn't have to work it out from scratch.</p>
    <h2>What a hard day looks like for me</h2>
    ${words(looks, 4)}
    <h2>What actually helps</h2>
    ${words(helps, 4)}
    <h2>Early signs, for me to spot</h2>
    <div class="rule-line"></div><div class="rule-line"></div>
    <div style="position:absolute;left:15mm;right:15mm;bottom:18mm;border-top:1.2pt dashed ${a.accent};padding-top:4mm;">
      <div class="kicker" style="margin-bottom:2mm;">✂ hand this half to someone</div>
      <h2 style="margin-top:0;">${esc(a.name)} is having a hard day. Here's what helps:</h2>
      ${helps ? `<div style="white-space:pre-wrap;">${esc(helps)}</div>` : `<div class="rule-line"></div><div class="rule-line"></div><div class="rule-line"></div>`}
      <h2>Today, specifically, I need</h2>
      <div class="rule-line"></div><div class="rule-line"></div>
      <p class="soft" style="margin-top:3mm;">Please don't ask what's wrong. Please don't fix it. One of the things above, then give it time.</p>
    </div>
    ${foot(a, "hard days — keep one where you'll find it")}
  </div>`;
}

// Addressed to the person they said most needs to understand their brain,
// pre-filled from the answers they already gave. Nothing on it is a secret
// they didn't tell us.
function helpMe(a) {
  const who = a.helpWho || "";
  const them = { partner: "my partner", manager: "my manager", teacher: "my teacher", parent: "my parent" }[who] || "the people around me";
  const lines = [];
  if (a.energy === "spoons") lines.push("I track my energy in spoons. If I say I'm on three today, that's the whole budget — not a mood, a number.");
  if (a.energy === "battery") lines.push("I think of my energy as a battery. Low battery days get low battery plans; that isn't laziness, it's maths.");
  if (a.dayShape === "evening") lines.push("My day starts later than most people's. Mornings are not when I'm at my best, and that's not going to change by trying harder.");
  if (a.dayShape === "morning") lines.push("I'm at my best early. By the afternoon I've usually spent most of what I had.");
  if (a.dayShape === "varies") lines.push("Which part of the day works for me changes. Asking \"is now a good time?\" genuinely helps.");
  if (a.forgets && a.forgets.length) lines.push(`The things I lose track of every day: ${a.forgets.join(", ").toLowerCase()}. A reminder is a kindness, not a nag.`);
  if (a.taskBreakdown) lines.push("A big task can be impossible to start even when I want to do it. Breaking it into the first tiny step helps more than encouragement.");
  if ((a.hardDayHelps || "").trim()) lines.push(`On a hard day, what helps is: ${a.hardDayHelps.trim()}`);
  if (a.easyRead) lines.push("Plain text, bigger type, more space. Walls of words cost me more than they cost you.");
  const items = lines.map((t) => `<li style="margin-bottom:${a.easyRead ? "4mm" : "3mm"};">${esc(t)}</li>`).join("");
  return `<div class="page">
    <div class="kicker">how to help ${esc(a.name)}</div>
    <h1>For ${esc(them)}</h1>
    <p class="soft">${esc(a.name)} filled in a questionnaire about how their brain works. This page is the short version, for you.</p>
    <ul style="margin:4mm 0 0 5mm;">${items}</ul>
    <h2>Things I'd add</h2>
    <div class="rule-line"></div><div class="rule-line"></div><div class="rule-line"></div>
    <h2>Please don't say</h2>
    <div class="rule-line"></div>
    <h2>Try instead</h2>
    <div class="rule-line"></div>
    <h2>A good day for me looks like</h2>
    <div class="rule-line"></div><div class="rule-line"></div>
    <p class="caveat" style="margin-top:5mm;">thank you for reading this far — that's most of it</p>
    ${foot(a, "how to help — give this one away")}
  </div>`;
}

// Start-of-day and end-of-day as tick-lists, in the steps they chose.
function routine(a) {
  const col = (title, steps) => `<div style="flex:1;">
    <h2 style="margin-top:0;">${title}</h2>
    ${steps.length ? steps.map((t) => `<div style="display:flex;align-items:center;margin-bottom:${a.easyRead ? "5mm" : "4mm"};">
      <span style="width:6mm;height:6mm;border:1.2pt solid ${INK};border-radius:1.5mm;margin-right:3.5mm;flex-shrink:0;"></span>${esc(t)}</div>`).join("")
      : Array.from({ length: 6 }, () => `<div class="rule-line"></div>`).join("")}
    <div class="rule-line"></div><div class="rule-line"></div>
  </div>`;
  return `<div class="page">
    <div class="kicker">routines</div>
    <h1>Start and finish</h1>
    <p class="soft">The steps you said are yours, in a tickable order. Skip any of them. Half a routine is a routine.</p>
    <div style="display:flex;gap:8mm;margin-top:5mm;">
      ${col("Start of day", a.routineStart || [])}
      ${col("End of day", a.routineEnd || [])}
    </div>
    <h2>The one step that makes the rest easier</h2>
    <div class="rule-line"></div>
    <p class="caveat" style="margin-top:6mm;">done is a feeling, not a checklist</p>
    ${foot(a, "routines — stick this one on the wall")}
  </div>`;
}

// A month at a glance. Undated, five weeks, three big rocks instead of thirty tasks.
function month(a) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const head = days.map((d) => `<th style="font-family:'Space Mono',monospace;font-size:8pt;color:${a.accent};font-weight:400;padding-bottom:1.5mm;text-align:left;">${d}</th>`).join("");
  const rows = Array.from({ length: 5 }, () => `<tr>${days.map(() =>
    `<td style="border:0.9pt solid ${INK};height:23mm;vertical-align:top;padding:1.5mm;"><span style="display:inline-block;width:6mm;border-bottom:0.6pt solid #b9b3a4;font-size:7pt;">&nbsp;</span></td>`).join("")}</tr>`).join("");
  return `<div class="page">
    <div class="kicker">monthly</div>
    <h1>The month, roughly</h1>
    <h2 style="margin-top:0;">Three big rocks this month</h2>
    ${[1,2,3].map((n)=>`<div style="display:flex;align-items:flex-end;margin-bottom:2.5mm;"><span style="font-family:'Anton',sans-serif;font-size:14pt;color:${a.accent};width:9mm;">${n}</span><div class="rule-line" style="flex:1;height:7mm;"></div></div>`).join("")}
    <p class="soft" style="margin:2mm 0 3mm;">Write the dates in yourself. Thirty things is a wish list; three is a month.</p>
    <table><tr>${head}</tr>${rows}</table>
    ${foot(a, "monthly — print one per month")}
  </div>`;
}

function brainDump(a) {
  const lines = Array.from({ length: a.easyRead ? 20 : 24 }, () => `<div class="rule-line"></div>`).join("");
  return `<div class="page">
    <div class="kicker">brain dump</div>
    <h1>Empty it here</h1>
    <p class="soft">No order, no categories. Get it out of your head so the daily page stays clean. Sort it later, or never.</p>
    <div style="margin-top:4mm;">${lines}</div>
    ${foot(a, "brain dump — print as many as you like")}
  </div>`;
}

function wins(a) {
  const rows = Array.from({ length: a.easyRead ? 14 : 17 }, () =>
    `<div style="display:flex;align-items:flex-end;margin-bottom:${a.easyRead ? "3.5mm" : "3mm"};">
      <span style="width:18mm;border-bottom:0.7pt solid #b9b3a4;font-family:'Space Mono',monospace;font-size:7.5pt;color:#8a857a;height:${a.easyRead ? "10mm" : "8mm"};">date</span>
      <div class="rule-line" style="flex:1;margin-left:3mm;height:${a.easyRead ? "10mm" : "8mm"};"></div></div>`).join("");
  return `<div class="page">
    <div class="kicker">wins</div>
    <h1>Evidence I'm doing fine</h1>
    <p class="soft">Not the Joy Log — that's for things that felt good. This is for things that went right, however small, so there's proof on the bad days.</p>
    <div style="margin-top:4mm;">${rows}</div>
    ${foot(a, "wins — a running list")}
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

module.exports = { COLOURS, css, cover, howTo, dailyTime, dailyList, weekly, month, taskBreakdown, routine, hardDay, helpMe, sensoryReset, safeFoods, joyLog, appointmentPrep, weeklyReview, brainDump, wins, notes };
