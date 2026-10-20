// One follow-up ("nudge") to each charity on the approach list that hasn't
// replied. Sent through Resend from the shop's sender, replies to
// hello@froglogic.co.uk, subject "Re: <original subject>". Anyone listed in
// SKIP (they replied) is left alone, and nudged.json records who has had one
// so a rerun never nudges anyone twice. DRY_RUN=1 prints and sends nothing.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const SENT = path.join(here, "sent.json");
const NUDGED = path.join(here, "nudged.json");
const REPLY_TO = "hello@froglogic.co.uk";
// Only the charity wave (9–10 Oct); the gift-guide pitches get their own follow-up later.
const WAVE = ["2026-10-09", "2026-10-10"];
const SKIP = new Set([]); // addresses that have replied

const sent = JSON.parse(await readFile(SENT, "utf8"));
let nudged = [];
try { nudged = JSON.parse(await readFile(NUDGED, "utf8")); } catch { /* first run */ }
const done = new Set(nudged.map((n) => n.to.toLowerCase()));

const day = (iso) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "Europe/London" });
const targets = sent.filter((s) => WAVE.includes(s.sentAt.slice(0, 10)) && !SKIP.has(s.to.toLowerCase()) && !done.has(s.to.toLowerCase()));
console.log(`${targets.length} to nudge`);

for (const s of targets) {
  const body = `Hi,\n\nJust floating my email from ${day(s.sentAt)} back up in case it got buried. In short: free plain-English guides to 23 neurotypes at https://froglogic.co.uk/#guides, yours to share with anyone they'd help.\n\nNo worries if it's not for you.\n\nSam, Frog Logic`;
  const subject = "Re: " + s.subject;
  if (process.env.DRY_RUN === "1") { console.log("would nudge:", s.to, "|", subject, "\n" + body + "\n"); continue; }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.FROM_EMAIL, to: s.to, reply_to: REPLY_TO, subject, text: body }),
  });
  if (!r.ok) { console.error("FAILED", s.to, r.status, (await r.text()).slice(0, 200)); continue; }
  const { id } = await r.json();
  nudged.push({ name: s.name, to: s.to, subject, sentAt: new Date().toISOString(), id });
  console.log("nudged:", s.name, "→", s.to);
}
await writeFile(NUDGED, JSON.stringify(nudged, null, 2) + "\n");
