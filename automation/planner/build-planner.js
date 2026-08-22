// Assembles one bespoke planner PDF from a customer's questionnaire answers.
// Usage (standalone test): node build-planner.js answers.json out.pdf
// Also exported for the order-processing workflow.
//
// answers = {
//   name: "Sam",                       // goes on the cover + footers
//   layout: "time" | "list" | "both",  // daily page style
//   energy: "spoons" | "battery" | "none",
//   dayShape: "morning" | "evening" | "varies",
//   taskBreakdown: true|false,
//   extras: ["sensory","safe-foods","joy","appointment","review"],
//   easyRead: true|false,              // bigger, more spaced, no italics
//   colour: "fern" | "night" | "rust" | "plum",
// }
const fs = require("fs");
const path = require("path");
const M = require("./modules.js");
const { ensureFonts, fontFaceCSS } = require("../social/gfonts.js");

const FONT_DIR = path.join(__dirname, "..", "social", ".gfonts");

function plannerHtml(answers) {
  const a = {
    name: String(answers.name || "Your").trim().slice(0, 40),
    layout: answers.layout || "list",
    energy: answers.energy || "spoons",
    dayShape: answers.dayShape || "varies",
    taskBreakdown: answers.taskBreakdown !== false,
    extras: answers.extras || [],
    easyRead: !!answers.easyRead,
    colour: answers.colour || "fern",
  };
  a.accent = M.COLOURS[a.colour] || M.COLOURS.fern;

  const pages = [];
  const contents = [];
  pages.push(M.cover(a));

  if (a.layout === "time" || a.layout === "both") {
    pages.push(M.dailyTime(a)); contents.push("A time-blocked daily page" + (a.dayShape === "evening" ? " that starts when your day actually starts" : ""));
  }
  if (a.layout === "list" || a.layout === "both") {
    pages.push(M.dailyList(a)); contents.push("A list-style daily page — three things, then bonus room");
  }
  pages.push(M.weekly(a)); contents.push("A weekly spread (a shape, not a schedule)");
  if (a.energy !== "none") contents.push(a.energy === "spoons" ? "Spoon tracking on every daily page" : "Battery tracking on every daily page");
  if (a.taskBreakdown) { pages.push(M.taskBreakdown(a)); contents.push("One Task, Broken Down — for the un-startable jobs"); }
  const EXTRA = {
    "sensory": [M.sensoryReset, "A sensory reset page for too-loud days"],
    "safe-foods": [M.safeFoods, "A safe foods list that treats sameness as a system"],
    "joy": [M.joyLog, "The Joy Log — evidence of good things"],
    "appointment": [M.appointmentPrep, "Appointment prep, including a go-blank box"],
    "review": [M.weeklyReview, "A gentle weekly wind-down"],
  };
  for (const key of a.extras) {
    if (EXTRA[key]) { pages.push(EXTRA[key][0](a)); contents.push(EXTRA[key][1]); }
  }
  pages.push(M.notes(a)); contents.push("Dot-grid spare brain space");
  if (a.easyRead) contents.push("Set in clear, well-spaced easy-read type throughout");

  // The how-to page lists what was chosen — insert it after the cover.
  pages.splice(1, 0, M.howTo(a, contents));

  return `<!doctype html><html><head><meta charset="utf-8"><style>
  ${fontFaceCSS(FONT_DIR)}
  ${M.css(a)}
  </style></head><body>${pages.join("\n")}</body></html>`;
}

async function buildPlannerPdf(answers, outPath) {
  await ensureFonts(FONT_DIR);
  const html = plannerHtml(answers);
  // Resolve playwright from automation/social's node_modules too (that's where
  // the workflow installs it) so this file needs no install of its own.
  let chromium;
  const tries = ["playwright", "playwright-core",
    path.join(__dirname, "..", "social", "node_modules", "playwright"),
    path.join(__dirname, "..", "social", "node_modules", "playwright-core")];
  for (const t of tries) { try { ({ chromium } = require(t)); break; } catch {} }
  if (!chromium) throw new Error("playwright not found — run npm install in automation/social");
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: ["--no-sandbox", "--force-color-profile=srgb"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(150);
    await page.pdf({ path: outPath, format: "A4", printBackground: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } });
  } finally {
    await browser.close();
  }
  return outPath;
}

module.exports = { buildPlannerPdf, plannerHtml };

if (require.main === module) {
  const [answersFile, out] = process.argv.slice(2);
  if (!answersFile || !out) { console.error("usage: node build-planner.js answers.json out.pdf"); process.exit(1); }
  const answers = JSON.parse(fs.readFileSync(answersFile, "utf8"));
  buildPlannerPdf(answers, out).then((p) => console.log("wrote", p)).catch((e) => { console.error(e); process.exit(1); });
}
