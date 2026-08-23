// Sends the monthly Frog Logic newsletter via Resend.
// Requires (as env vars / GitHub secrets):
//   RESEND_API_KEY       - from resend.com/api-keys
//   FROM_EMAIL            - a verified sender, e.g. "Sammie @ Frog Logic <hello@shop.froglogic.co.uk>"
//   SUBSCRIBERS_CSV_URL   - a published-to-web Google Sheet CSV link (one email per row;
//                           any column may hold the address - the first cell containing "@" is used)
//
// Content is read from content/newsletter.json, one folder up from this script.
// Edit that file each month before the scheduled run (or run manually via
// the "Run workflow" button in GitHub Actions).

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function loadContent() {
  const raw = await readFile(
    path.join(__dirname, "..", "..", "content", "newsletter.json"),
    "utf-8"
  );
  return JSON.parse(raw);
}

// Proper CSV parsing — form question text contains commas and quotes.
function parseCsv(text) {
  const rows = [];
  let row = [], cur = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else inQ = false; }
      else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cur); cur = "";
      if (row.some((f) => f !== "")) rows.push(row);
      row = [];
    } else cur += c;
  }
  if (cur !== "" || row.length) { row.push(cur); if (row.some((f) => f !== "")) rows.push(row); }
  return rows;
}

async function loadSubscribers(csvUrl) {
  const res = await fetch(csvUrl);
  if (!res.ok) {
    throw new Error(`Could not fetch subscriber list: ${res.status} ${res.statusText}`);
  }
  const emails = parseCsv(await res.text())
    .map((cells) => cells.map((c) => c.trim()).find((c) => c.includes("@")) || "")
    .filter((e) => e && e.toLowerCase() !== "email");
  return emails;
}

// Bespoke-planner customers who ticked the newsletter opt-in on the order form.
// Tolerant by design: no URL, no opt-in column, or an unreachable sheet just
// means no extra names — the monthly send carries on regardless.
async function loadPlannerOptIns(csvUrl) {
  if (!csvUrl) return [];
  try {
    const res = await fetch(csvUrl);
    if (!res.ok) { console.error(`Planner sheet unreachable (${res.status}) — skipping opt-ins.`); return []; }
    const rows = parseCsv(await res.text());
    if (rows.length < 2) return [];
    const header = rows[0];
    const emailIdx = header.findIndex((h) => /send it|email/i.test(h));
    const optIdx = header.findIndex((h) => /monthly note|from the pond|newsletter/i.test(h));
    if (emailIdx === -1 || optIdx === -1) {
      console.log("Planner sheet has no newsletter opt-in column yet — skipping.");
      return [];
    }
    const emails = rows.slice(1)
      .filter((r) => /^\s*yes/i.test(r[optIdx] || ""))
      .map((r) => (r[emailIdx] || "").trim())
      .filter((e) => e.includes("@"));
    console.log(`Planner opt-ins found: ${emails.length}`);
    return emails;
  } catch (err) {
    console.error(`Planner opt-in lookup failed (${err.message}) — skipping.`);
    return [];
  }
}

function renderHtml(content) {
  return `
  <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; color: #1F3229;">
    <h1 style="font-size: 22px;">${content.heading}</h1>
    ${content.body_html}
    <p style="margin-top: 28px;">
      <a href="${content.cta_url}" style="background:#3C5B45;color:#FBFAF5;padding:12px 22px;border-radius:999px;text-decoration:none;display:inline-block;">
        ${content.cta_text}
      </a>
    </p>
    <p style="margin-top:32px;font-size:12px;color:#5a6b5f;">
      You're getting this because you signed up at Frog Logic. It's monthly, always optional, and easy to leave.
    </p>
  </div>`;
}

async function sendOne(to, subject, html) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: process.env.FROM_EMAIL, to, subject, html }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`Failed to send to ${to}: ${res.status} ${body}`);
    return false;
  }
  return true;
}

async function main() {
  const required = ["RESEND_API_KEY", "FROM_EMAIL", "SUBSCRIBERS_CSV_URL"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }

  const content = await loadContent();
  const html = renderHtml(content);
  // Two sources, one list: the signup form, plus planner customers who opted in.
  // Deduped case-insensitively so nobody ever gets the same issue twice.
  const [signups, optIns] = await Promise.all([
    loadSubscribers(process.env.SUBSCRIBERS_CSV_URL),
    loadPlannerOptIns(process.env.PLANNER_CSV_URL),
  ]);
  const seen = new Set();
  const subscribers = [...signups, ...optIns].filter((e) => {
    const k = e.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  console.log(`Sending "${content.subject}" to ${subscribers.length} subscriber(s)...`);

  let sent = 0;
  for (const email of subscribers) {
    // Small delay to stay comfortably under Resend's rate limits at low volume.
    // Once the list grows past a couple hundred, switch to Resend Broadcasts/Audiences instead.
    const ok = await sendOne(email, content.subject, html);
    if (ok) sent++;
    await new Promise((r) => setTimeout(r, 350));
  }

  console.log(`Done. Sent ${sent}/${subscribers.length}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
