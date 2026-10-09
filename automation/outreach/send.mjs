// Sends the approach-list emails via Resend, from the shop's verified sender,
// with replies going to hello@froglogic.co.uk.
//
// Reads automation/outreach/approach-list.md, takes every section that has a
// real email address in its "To:" line (the contact-form ones are skipped and
// listed at the end for Sam to do by hand), sends each one once, and records
// it in sent.json so a second run never emails anyone twice. The quoted block
// under each "Subject:" line is the body, sent as plain text.
//
// Env: RESEND_API_KEY, FROM_EMAIL (same secrets the newsletter uses).
// Dry run: DRY_RUN=1 prints what would go and sends nothing.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const LIST = path.join(here, "approach-list.md");
const SENT = path.join(here, "sent.json");
const REPLY_TO = "hello@froglogic.co.uk";

const md = await readFile(LIST, "utf8");
let sent = [];
try { sent = JSON.parse(await readFile(SENT, "utf8")); } catch { /* first run */ }
const done = new Set(sent.map((s) => s.to.toLowerCase()));

const entries = [];
for (const block of md.split(/\n---\n/)) {
  const m = block.match(/## \d+\. (.+?)\n\n\*\*To:\*\* (.+?)\n[\s\S]*?\*\*Subject:\*\* (.+?)\n\n((?:>.*\n?)+)/);
  if (!m) continue;
  const [, name, to, subject, quoted] = m;
  const body = quoted.trim().split("\n").map((l) => l.replace(/^> ?/, "")).join("\n");
  entries.push({ name: name.trim(), to: to.trim(), subject: subject.trim(), body });
}

const byHand = entries.filter((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.to));
const toSend = entries.filter((e) => !byHand.includes(e) && !done.has(e.to.toLowerCase()));

console.log(`${entries.length} entries, ${toSend.length} to send, ${byHand.length} contact-form only, ${done.size} already sent`);

for (const e of toSend) {
  if (process.env.DRY_RUN === "1") { console.log("would send:", e.to, "|", e.subject); continue; }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.FROM_EMAIL, to: e.to, reply_to: REPLY_TO, subject: e.subject, text: e.body }),
  });
  if (!r.ok) { console.error("FAILED", e.to, r.status, (await r.text()).slice(0, 200)); continue; }
  const { id } = await r.json();
  sent.push({ name: e.name, to: e.to, subject: e.subject, sentAt: new Date().toISOString(), id });
  console.log("sent:", e.name, "→", e.to);
}

await writeFile(SENT, JSON.stringify(sent, null, 2) + "\n");
if (byHand.length) {
  console.log("\nStill to do by hand (contact forms):");
  for (const e of byHand) console.log(" -", e.name, "—", e.to);
}
