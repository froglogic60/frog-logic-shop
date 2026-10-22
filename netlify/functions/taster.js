// The Bespoke Planner taster (22 Oct 2026). Three questions, one free page.
//
// The Bespoke Planner is the one thing on the shop people actually stop for
// (Pinterest: 14.8k impressions, 35 clicks) and nobody buys unseen at £25.
// So: a visitor answers three of the fifteen questions — how they like a day
// laid out, how they track energy, the things they keep forgetting — and gets
// one daily page built the same way the full planner is, with their name on
// it, straight away. No PDF is generated here: the page lives at /taster/
// and draws itself from the answers in the URL (same page modules as the £25
// planner, so it IS a page of the real thing), and the browser's print
// dialog saves it as a PDF. This function's job is the email: it sends the
// link so they can find the page again, with the £25 one a sentence away,
// and, if they ticked the box, adds them to the newsletter list the same way
// the sign-up form does (a POST to the Google Form behind it).
//
// Env: RESEND_API_KEY, FROM_EMAIL, SITE_URL (all already set for the till).

const SITE = (process.env.SITE_URL || "https://froglogic.co.uk").replace(/\/$/, "");
const NEWSLETTER_FORM = "https://docs.google.com/forms/d/e/1FAIpQLSeZy3f1I3JB7L2wdGxzCMl1govvS6-mVotb5_MWXgFgJL1UIQ/formResponse";
const NEWSLETTER_FIELD = "entry.1412839294";

const clean = (s, n) => String(s ?? "").replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function pageLink(a) {
  const q = new URLSearchParams({ n: a.name, l: a.layout, e: a.energy, f: a.forgets.join("|") });
  return `${SITE}/taster/?${q.toString()}`;
}

async function sendEmail(a, link) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + process.env.RESEND_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL,
      to: a.email,
      reply_to: "hello@froglogic.co.uk",
      subject: `🐸 ${a.name}, your page is ready`,
      html: `<div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;color:#1F3229;line-height:1.5;">
        <h1 style="font-size:22px;">One page, built for your brain</h1>
        <p>Here's your daily page — ${a.layout === "time" ? "time-blocked" : "list-style"}, ${a.energy === "battery" ? "battery" : "spoons"} at the top, and your don't-forget strip (${esc(a.forgets.join(", ") || "blank, for now")}) on every copy.</p>
        <p><a href="${link}" style="display:inline-block;background:#3C5B45;color:#F4EFE3;padding:12px 18px;border-radius:6px;text-decoration:none;font-weight:600;">Open your page</a></p>
        <p>It's a web page on purpose: open it, press print, and choose "Save as PDF" or print it straight onto paper. Print as many as you like — it's yours.</p>
        <p>That page is one of up to eighteen in the Bespoke Planner. The full one asks you fifteen questions — including what a hard day looks like, what helps, and who most needs to understand your brain — and puts your own words on the pages: a hard-day page you can hand to someone, a page addressed to your partner, manager, teacher or parent, your routines as tick-lists. It's £25, undated, emailed as a PDF usually within a couple of hours, and rebuilt free if it doesn't fit.</p>
        <p><a href="${SITE}/p/the-bespoke-planner/">The Bespoke Planner — £25</a></p>
        <p style="margin-top:28px;font-size:12px;color:#5a6b5f;">Sam, Frog Logic · froglogic.co.uk · you're getting this because you asked for the page; ${a.newsletter ? "you also ticked the newsletter box, so you'll hear from me once a month, never more" : "nothing else will follow unless you ask"}.</p>
      </div>`,
    }),
  });
  if (!r.ok) throw new Error("Resend " + r.status + " " + (await r.text()).slice(0, 200));
}

async function addToNewsletter(email) {
  try {
    await fetch(NEWSLETTER_FORM, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ [NEWSLETTER_FIELD]: email }).toString() });
  } catch (e) { console.error("newsletter add failed", e.message); }
}

export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  let f;
  const ct = req.headers.get("content-type") || "";
  try {
    if (ct.includes("application/json")) f = await req.json();
    else f = Object.fromEntries(new URLSearchParams(await req.text()));
  } catch { return new Response("Bad request", { status: 400 }); }

  if (f["bot-field"]) return Response.redirect(`${SITE}/taster/`, 303); // honeypot
  const email = clean(f.email, 120).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return new Response("Please give an email address the page can be sent to.", { status: 400 });
  const a = {
    email,
    name: clean(f.name, 40) || "Your",
    layout: /time/i.test(f.layout) ? "time" : "list",
    energy: /batter/i.test(f.energy) ? "battery" : "spoons",
    forgets: clean(f.forgets, 120).split(/[,|\n]/).map((t) => t.trim()).filter(Boolean).slice(0, 5),
    newsletter: !!f.newsletter,
  };
  const link = pageLink(a);

  // The page first, the email second: if Resend has a bad minute the visitor
  // still gets what they came for.
  const jobs = [sendEmail(a, link).catch((e) => console.error(e.message))];
  if (a.newsletter) jobs.push(addToNewsletter(email));
  await Promise.all(jobs);
  return Response.redirect(link, 303);
};

export const config = { path: "/api/taster" };
