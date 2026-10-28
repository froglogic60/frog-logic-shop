// Pond Advent (Sam, 28 Oct 2026: "3. Yes"): one free thing a day by email,
// 1-24 December, then it stops.
//
// POST /api/advent   (the form on /p/pond-advent/)
//   Adds the address to the Pond Advent list (a row "join" in the Google Form
//   "Pond Advent sign-ups", whose sheet is ADVENT_CSV_URL for the sender) and
//   sends a short hello by email, so people know it worked and the address is
//   real. Then back to the page with ?joined=1.
// GET  /api/advent?stop=<address, base64url>
//   The one-click way off in every email (and the List-Unsubscribe header).
//   Adds a "stop" row; the sender takes the latest row per address.
//
// It is its own list on purpose: the newsletter promises once a month.
// Env: RESEND_API_KEY, FROM_EMAIL, SITE_URL (already set for the till).

const SITE = (process.env.SITE_URL || "https://froglogic.co.uk").replace(/\/$/, "");
const FORM = "https://docs.google.com/forms/d/e/1FAIpQLSdEj17uH7YsnjGNigMmTWQwhzkb9bADFxjbVdQvjaWf6mUALQ/formResponse";
const F_EMAIL = "entry.2109993402";
const F_ACTION = "entry.1645589398";

const ok = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 120;
const b64 = (s) => Buffer.from(s, "utf8").toString("base64url");
const unb64 = (s) => { try { return Buffer.from(String(s), "base64url").toString("utf8"); } catch { return ""; } };

async function record(email, action) {
  const r = await fetch(FORM, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ [F_EMAIL]: email, [F_ACTION]: action }).toString(),
  });
  if (!r.ok) throw new Error("form " + r.status);
}

async function hello(email) {
  const stop = `${SITE}/api/advent?stop=${b64(email)}`;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + process.env.RESEND_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL,
      to: email,
      reply_to: "hello@froglogic.co.uk",
      subject: "🐸 You're on the Pond Advent list",
      headers: { "List-Unsubscribe": `<${stop}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
      html: `<div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:560px;margin:0 auto;color:#22331F;line-height:1.55;font-size:16px;">
        <p>Hello, it's Sam from Frog Logic.</p>
        <p>You're on the list. From 1 December you'll get one short email a day with one free thing in it: a guide for the relatives, a printable for the big day, or a tip for when it all gets too much. On Christmas Eve it stops.</p>
        <p>If you can't wait, the first one is already here: the free <a href="${SITE}/p/christmas-visual-timetable/?ref=advent" style="color:#B5443A;">Christmas visual timetable</a>.</p>
        <p>Sam</p>
        <p style="margin-top:28px;font-size:12px;color:#6B6355;">You're getting this because you signed up at froglogic.co.uk/p/pond-advent/. Changed your mind? <a href="${stop}" style="color:#6B6355;">Take me off the list</a>.</p>
      </div>`,
    }),
  });
  if (!r.ok) throw new Error("Resend " + r.status + " " + (await r.text()).slice(0, 200));
}

const page = (title, text) => new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} | Frog Logic</title><meta name="robots" content="noindex"><link rel="stylesheet" href="/styles.css"></head><body><main class="wrap" style="padding:64px 16px;max-width:620px"><h1>${title}</h1><p>${text}</p><p><a class="btn btn-primary" href="/">Back to Frog Logic</a></p></main></body></html>`, { headers: { "Content-Type": "text/html; charset=utf-8" } });

export default async (req) => {
  const url = new URL(req.url);
  const stopParam = url.searchParams.get("stop");
  if (stopParam) {
    const email = unb64(stopParam).trim().toLowerCase();
    if (!ok(email)) return page("That link didn't work", "Reply to any Pond Advent email with the word stop and I'll take you off by hand.");
    // Mail apps' one-click unsubscribe POSTs here; a person clicking GETs. Both stop.
    try { await record(email, "stop"); } catch (e) { console.error(e.message); return page("Something went wrong", "Please try the link again in a minute, or reply to any Pond Advent email with the word stop."); }
    return page("You're off the list", "No more Pond Advent emails. Thank you for having a look, and I hope December is kind to you.");
  }
  if (req.method !== "POST") return Response.redirect(`${SITE}/p/pond-advent/`, 303);

  let f;
  try { f = Object.fromEntries(new URLSearchParams(await req.text())); } catch { return new Response("Bad request", { status: 400 }); }
  if (f["bot-field"]) return Response.redirect(`${SITE}/p/pond-advent/?joined=1`, 303); // honeypot
  const email = String(f.email || "").trim().toLowerCase();
  if (!ok(email)) return page("That email address didn't look right", 'Please <a href="/p/pond-advent/">go back</a> and check it.');
  try { await record(email, "join"); } catch (e) { console.error(e.message); return page("Something went wrong", 'The list didn\'t save. Please <a href="/p/pond-advent/">try again</a> in a minute.'); }
  await hello(email).catch((e) => console.error(e.message));
  return Response.redirect(`${SITE}/p/pond-advent/?joined=1`, 303);
};

export const config = { path: "/api/advent" };
