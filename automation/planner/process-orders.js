// Bespoke planner order robot. Runs on a schedule in GitHub Actions.
//   1. Reads the questionnaire responses (published-CSV Google Sheet).
//   2. Checks Stripe for a completed £10 payment matching each email.
//   3. Builds the personalised PDF and emails it via Resend.
//   4. Records fulfilled orders in fulfilled.json (committed by the workflow)
//      so nobody ever gets charged twice or mailed twice.
//
// Required env (GitHub secrets):
//   PLANNER_CSV_URL    - published-to-web CSV of the responses sheet
//   STRIPE_SECRET_KEY  - to verify payment (checkout sessions of the payment link)
//   RESEND_API_KEY     - to send the email
//   FROM_EMAIL         - verified sender, e.g. "Sammie @ Frog Logic <hello@shop.froglogic.co.uk>"
// Optional:
//   PLANNER_PAYMENT_LINK - plink_... id (defaults to the live one below)
//   ALLOW_UNPAID=1       - TESTING ONLY: skip the payment check
const fs = require("fs");
const path = require("path");
const { buildPlannerPdf } = require("./build-planner.js");

const CSV_URL = process.env.PLANNER_CSV_URL;
const STRIPE = process.env.STRIPE_SECRET_KEY;
const RESEND = process.env.RESEND_API_KEY;
const FROM = process.env.FROM_EMAIL;
const PLINK = process.env.PLANNER_PAYMENT_LINK || "plink_1U7CIqGgi5tektD4xseHc5th";
const STATE = path.join(__dirname, "fulfilled.json");

for (const [k, v] of Object.entries({ PLANNER_CSV_URL: CSV_URL, RESEND_API_KEY: RESEND, FROM_EMAIL: FROM })) {
  if (!v) { console.error("Missing env: " + k); process.exit(1); }
}
if (!STRIPE && process.env.ALLOW_UNPAID !== "1") { console.error("Missing env: STRIPE_SECRET_KEY"); process.exit(1); }

// Small strict CSV parser (handles quoted fields, commas and newlines inside quotes).
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

// Map the form's answer wording onto the generator's schema.
function toAnswers(rec) {
  const layoutRaw = rec.layout || "";
  const layout = /both/i.test(layoutRaw) ? "both" : /time/i.test(layoutRaw) ? "time" : "list";
  const energy = /spoon/i.test(rec.energy) ? "spoons" : /batter/i.test(rec.energy) ? "battery" : "none";
  const dayShape = /later|evening/i.test(rec.dayStart) ? "evening" : /morning/i.test(rec.dayStart) ? "morning" : "varies";
  const extras = [];
  if (/sensory/i.test(rec.extras)) extras.push("sensory");
  if (/safe foods/i.test(rec.extras)) extras.push("safe-foods");
  if (/joy/i.test(rec.extras)) extras.push("joy");
  if (/appointment/i.test(rec.extras)) extras.push("appointment");
  if (/wind-?down/i.test(rec.extras)) extras.push("review");
  const colour = /night/i.test(rec.colour) ? "night" : /rust/i.test(rec.colour) ? "rust" : /plum/i.test(rec.colour) ? "plum" : "fern";
  return {
    name: rec.name, layout, energy, dayShape,
    taskBreakdown: /^yes/i.test((rec.task || "").trim()),
    extras, easyRead: /^yes/i.test((rec.easyRead || "").trim()), colour,
  };
}

// Every completed checkout session on the payment link -> set of payer emails.
async function paidEmails() {
  if (process.env.ALLOW_UNPAID === "1") return null; // testing: treat everyone as paid
  const emails = new Set();
  let after = "";
  for (let page = 0; page < 20; page++) {
    const url = `https://api.stripe.com/v1/checkout/sessions?limit=100&payment_link=${PLINK}${after ? "&starting_after=" + after : ""}`;
    const r = await fetch(url, { headers: { Authorization: "Bearer " + STRIPE } });
    if (!r.ok) throw new Error("Stripe " + r.status + " " + (await r.text()).slice(0, 200));
    const j = await r.json();
    for (const s of j.data || []) {
      if (s.status === "complete" && s.customer_details && s.customer_details.email) {
        emails.add(s.customer_details.email.trim().toLowerCase());
      }
    }
    if (!j.has_more || !j.data.length) break;
    after = j.data[j.data.length - 1].id;
  }
  return emails;
}

async function sendPlanner(email, name, pdfPath) {
  const pdf = fs.readFileSync(pdfPath);
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + RESEND, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM,
      to: email,
      subject: "🐸 Your bespoke planner is ready",
      html: `<div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;color:#1F3229;">
        <h1 style="font-size:22px;">Here it is — built for your brain</h1>
        <p>Your planner is attached as a PDF, assembled from your answers with your name on the cover.</p>
        <p>It's undated on purpose: print the pages you need, as often as you need them, forever. Skipped days aren't failure — they're just days.</p>
        <p>If anything about it doesn't fit, reply to this email and we'll adjust it — that's what bespoke means.</p>
        <p style="margin-top:28px;font-size:12px;color:#5a6b5f;">Frog Logic · soft landings for busy brains · shop.froglogic.co.uk</p>
      </div>`,
      attachments: [{ filename: `${String(name).replace(/[^A-Za-z0-9 _-]/g, "").trim() || "your"}-bespoke-planner.pdf`, content: pdf.toString("base64") }],
    }),
  });
  if (!r.ok) throw new Error("Resend " + r.status + " " + (await r.text()).slice(0, 200));
}

(async () => {
  const state = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, "utf8")) : { done: [] };
  const doneKeys = new Set(state.done.map((d) => d.key));

  const res = await fetch(CSV_URL, { redirect: "follow" });
  if (!res.ok) throw new Error("CSV fetch " + res.status);
  const rows = parseCsv(await res.text());
  if (rows.length < 2) { console.log("No responses yet."); return; }
  const header = rows[0];
  const col = (re) => header.findIndex((h) => re.test(h));
  const idx = {
    ts: col(/timestamp/i), name: col(/name.*cover/i), email: col(/send it|email/i),
    layout: col(/day laid out/i), energy: col(/track energy/i), dayStart: col(/day actually start/i),
    task: col(/impossible to start/i), extras: col(/extra pages/i), easyRead: col(/easy-?read/i), colour: col(/cover colour/i),
  };
  for (const [k, v] of Object.entries(idx)) if (v === -1) throw new Error("Column not found in sheet: " + k);

  const paid = await paidEmails();
  let made = 0, waiting = 0;
  for (const r of rows.slice(1)) {
    const rec = Object.fromEntries(Object.entries(idx).map(([k, i]) => [k, (r[i] || "").trim()]));
    if (!rec.email || !rec.name) continue;
    const key = (rec.ts + "|" + rec.email).toLowerCase();
    if (doneKeys.has(key)) continue;
    if (paid && !paid.has(rec.email.toLowerCase())) {
      console.log("awaiting payment:", rec.email);
      waiting++;
      continue;
    }
    const answers = toAnswers(rec);
    console.log("building for:", rec.email, JSON.stringify(answers));
    const out = path.join(__dirname, "out-" + made + ".pdf");
    await buildPlannerPdf(answers, out);
    await sendPlanner(rec.email, rec.name, out);
    fs.unlinkSync(out);
    state.done.push({ key, email: rec.email, sentAt: new Date().toISOString() });
    doneKeys.add(key);
    made++;
    console.log("sent:", rec.email);
  }
  fs.writeFileSync(STATE, JSON.stringify(state, null, 2) + "\n");
  console.log(`done: ${made} sent, ${waiting} awaiting payment, ${state.done.length} total fulfilled`);
})().catch((e) => { console.error(e); process.exit(1); });
