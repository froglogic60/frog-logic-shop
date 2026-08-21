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

async function loadSubscribers(csvUrl) {
  const res = await fetch(csvUrl);
  if (!res.ok) {
    throw new Error(`Could not fetch subscriber list: ${res.status} ${res.statusText}`);
  }
  const text = await res.text();
  const rows = text.split(/\r?\n/).map((r) => r.trim()).filter(Boolean);
  const emails = rows
    .map((r) =>
      r
        .split(",")
        .map((c) => c.trim().replace(/^"|"$/g, ""))
        .find((c) => c.includes("@")) || ""
    )
    .filter((e) => e && e.toLowerCase() !== "email");
  return [...new Set(emails)];
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
  const subscribers = await loadSubscribers(process.env.SUBSCRIBERS_CSV_URL);

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
