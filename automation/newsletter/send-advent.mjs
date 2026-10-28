// Sends today's Pond Advent email (content/advent.json) to the Pond Advent list.
//
// The list is the Google Form "Pond Advent sign-ups" (fed by
// netlify/functions/advent.js), published as CSV: Timestamp, Email, Action.
// Rows are read in order and the latest row per address wins, so a "stop"
// after a "join" takes someone off. Rows with any other action are ignored.
//
// Day = today's date in London, 1-24 December 2026 only; anything else sends
// nothing. TEST_TO=<address> sends today's email (or DAY=<n>) to that one
// address and nobody else, for checking before 1 December.
//
// Env: RESEND_API_KEY, FROM_EMAIL, ADVENT_CSV_URL (GitHub secrets), TEST_TO, DAY.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = "https://froglogic.co.uk";

function parseCsv(text) {
  const rows = []; let row = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cur); cur = ""; if (row.some((f) => f !== "")) rows.push(row); row = []; }
    else cur += c;
  }
  row.push(cur); if (row.some((f) => f !== "")) rows.push(row);
  return rows;
}

function londonDate() {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", year: "numeric", month: "numeric", day: "numeric" }).formatToParts(new Date());
  const get = (t) => Number(parts.find((p) => p.type === t).value);
  return { y: get("year"), m: get("month"), d: get("day") };
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function html(day, email) {
  const stop = `${SITE}/api/advent?stop=${Buffer.from(email, "utf8").toString("base64url")}`;
  const [label, href] = day.button;
  const link = href.startsWith("http") ? href : SITE + href;
  return {
    stop,
    html: `<div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:560px;margin:0 auto;color:#22331F;line-height:1.55;font-size:16px;">
      <p style="font:700 12px/1 sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#B5443A;margin:0 0 14px;">Pond Advent · door ${day.day} of 24</p>
      ${day.p.map((x) => `<p>${x}</p>`).join("\n      ")}
      <p style="margin:22px 0;"><a href="${link}" style="display:inline-block;background:#3C5B45;color:#F4EFE3;padding:12px 18px;border-radius:6px;text-decoration:none;font-weight:600;">${esc(label)}</a></p>
      <p style="margin-top:28px;font-size:13px;color:#6B6355;">Everything behind the doors is free. Frog Logic is my small shop of calm, neurodivergent-friendly clothes, mugs and printables, at <a href="${SITE}/?ref=advent" style="color:#6B6355;">froglogic.co.uk</a>, if you'd ever like a look.</p>
      <p style="font-size:12px;color:#6B6355;">You're getting this because you signed up for Pond Advent. It stops on 24 December. <a href="${stop}" style="color:#6B6355;">Take me off the list</a>.</p>
    </div>`,
  };
}

async function send(to, day) {
  const { html: body, stop } = html(day, to);
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + process.env.RESEND_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL, to, reply_to: "hello@froglogic.co.uk",
      subject: "🐸 " + day.subject,
      headers: { "List-Unsubscribe": `<${stop}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
      html: body,
    }),
  });
  if (!r.ok) throw new Error(`Resend ${r.status} ${(await r.text()).slice(0, 200)}`);
}

const content = JSON.parse(await readFile(path.join(__dirname, "..", "..", "content", "advent.json"), "utf-8"));
const test = (process.env.TEST_TO || "").trim();
const today = londonDate();
let n = Number(process.env.DAY || 0);
if (!n) {
  if (today.y !== 2026 || today.m !== 12 || today.d > 24) {
    if (!test) { console.log(`Not an Advent day (${today.y}-${today.m}-${today.d}): nothing sent.`); process.exit(0); }
    n = 1;
  } else n = today.d;
}
const day = content.days.find((d) => d.day === n);
if (!day) throw new Error("No content for day " + n);

if (test) { await send(test, day); console.log(`Test: door ${n} sent to ${test}`); process.exit(0); }

const csv = await (await fetch(process.env.ADVENT_CSV_URL)).text();
const rows = parseCsv(csv).slice(1);
const state = new Map();
for (const r of rows) {
  const email = (r[1] || "").trim().toLowerCase(), action = (r[2] || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;
  if (action === "join") state.set(email, true);
  else if (action === "stop") state.set(email, false);
}
const list = [...state].filter(([, on]) => on).map(([e]) => e);
console.log(`Door ${n}: ${list.length} on the list (${state.size - list.length} stopped)`);
let sent = 0, failed = 0;
for (const e of list) {
  try { await send(e, day); sent++; } catch (err) { failed++; console.error(e.replace(/(.).*@/, "$1***@"), err.message); }
  await new Promise((r) => setTimeout(r, 600)); // Resend's free plan allows 2 a second
}
console.log(`sent ${sent}, failed ${failed}`);
if (failed && !sent) process.exit(1);
