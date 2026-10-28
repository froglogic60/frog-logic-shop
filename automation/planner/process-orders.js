// Bespoke planner order robot. Runs on a schedule in GitHub Actions.
//   1. Reads the questionnaire responses (published-CSV Google Sheet).
//   2. Checks Stripe for a completed payment (£25 link, or the old £10 one) matching each email,
//      or a Bespoke Planner Gift Card bought at the shop's checkout by the person whose
//      email the answerer typed as their gift code (28 Oct 2026). One planner per card.
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
// £25 link (live 9 Oct 2026) first; the old £10 link stays so anyone who answered
// the questions before the change can still pay and be fulfilled.
const PLINKS = (process.env.PLANNER_PAYMENT_LINK || "plink_1UOlwMGgi5tektD4tNjrcEe3,plink_1U7CIqGgi5tektD4xseHc5th").split(",").map((x) => x.trim()).filter(Boolean);
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
  // Google Forms joins checkbox answers with ", " — and an "Other" answer is
  // whatever they typed, which may itself contain a comma, so split carefully.
  const ticks = (s) => String(s || "").split(/,\s(?=[A-Z])/).map((t) => t.trim()).filter(Boolean);
  const w = rec.helpWho || "";
  const helpWho = /partner/i.test(w) ? "partner" : /manager|boss|work/i.test(w) ? "manager" : /teacher|tutor|school/i.test(w) ? "teacher" : /parent|mum|dad/i.test(w) ? "parent" : /nobody/i.test(w) ? "nobody" : "";
  return {
    name: rec.name, layout, energy, dayShape,
    taskBreakdown: /^yes/i.test((rec.task || "").trim()),
    extras, easyRead: /^yes/i.test((rec.easyRead || "").trim()), colour,
    forgets: ticks(rec.forgets), hardDayLooks: rec.hardDayLooks || "", hardDayHelps: rec.hardDayHelps || "",
    helpWho, routineStart: ticks(rec.routineStart), routineEnd: ticks(rec.routineEnd),
  };
}

// Every completed checkout session on the payment links -> set of payer emails.
async function paidEmails() {
  if (process.env.ALLOW_UNPAID === "1") return null; // testing: treat everyone as paid
  const emails = new Set();
  for (const plink of PLINKS) await collectPaid(plink, emails);
  return emails;
}

async function collectPaid(plink, emails) {
  let after = "";
  for (let page = 0; page < 20; page++) {
    const url = `https://api.stripe.com/v1/checkout/sessions?limit=100&payment_link=${plink}${after ? "&starting_after=" + after : ""}`;
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
}

// Gift cards (D40, 28 Oct 2026): every paid shop checkout whose basket holds the
// gift card -> { buyer email: number of cards bought }. The basket is stored in
// the session metadata as "id~variant~qty~size|..." across basket_0, basket_1...
const GIFT_ID = "d40-bespoke-planner-gift-card";
async function giftCredits() {
  const credits = new Map();
  if (process.env.ALLOW_UNPAID === "1") return credits;
  const since = Math.floor(Date.UTC(2026, 9, 28) / 1000); // the card went on sale after this
  let after = "";
  for (let page = 0; page < 30; page++) {
    const url = `https://api.stripe.com/v1/checkout/sessions?limit=100&status=complete&created[gte]=${since}${after ? "&starting_after=" + after : ""}`;
    const r = await fetch(url, { headers: { Authorization: "Bearer " + STRIPE } });
    if (!r.ok) throw new Error("Stripe " + r.status + " " + (await r.text()).slice(0, 200));
    const j = await r.json();
    for (const s of j.data || []) {
      const email = s.customer_details && s.customer_details.email && s.customer_details.email.trim().toLowerCase();
      // "no_payment_required" = a 100%-off promotion code (used to test the gift card for £0).
      if (!email || !["paid", "no_payment_required"].includes(s.payment_status)) continue;
      const m = s.metadata || {};
      const basket = Object.keys(m).filter((k) => /^basket_\d+$/.test(k)).sort((a, b) => Number(a.split("_")[1]) - Number(b.split("_")[1])).map((k) => m[k]).join("");
      let qty = 0;
      for (const line of basket.split("|")) {
        const [id, , q] = line.split("~");
        if (id === GIFT_ID) qty += Number(q) || 1;
      }
      if (!basket && m.product_id === GIFT_ID) qty = 1;
      if (qty) credits.set(email, (credits.get(email) || 0) + qty);
    }
    if (!j.has_more || !j.data.length) break;
    after = j.data[j.data.length - 1].id;
  }
  return credits;
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
    // Added 10 Oct 2026. Optional: responses from before these questions
    // existed have no such columns, and the builder treats a missing answer
    // as "leave that page out".
    forgets: col(/keep forgetting/i), hardDayLooks: col(/hard day look/i), hardDayHelps: col(/actually helps/i),
    helpWho: col(/understand how your brain/i), routineStart: col(/start of day/i), routineEnd: col(/end of day/i),
    // Added 28 Oct 2026: the gift code box (the giver's email address).
    giftCode: col(/gift code/i),
  };
  const OPTIONAL = new Set(["forgets", "hardDayLooks", "hardDayHelps", "helpWho", "routineStart", "routineEnd", "giftCode"]);
  for (const [k, v] of Object.entries(idx)) if (v === -1 && !OPTIONAL.has(k)) throw new Error("Column not found in sheet: " + k);

  const paid = await paidEmails();
  const credits = paid ? await giftCredits() : new Map();
  const used = new Map();
  for (const d of state.done) if (d.gift) used.set(d.gift, (used.get(d.gift) || 0) + 1);
  let made = 0, waiting = 0;
  for (const r of rows.slice(1)) {
    const rec = Object.fromEntries(Object.entries(idx).map(([k, i]) => [k, i === -1 ? "" : (r[i] || "").trim()]));
    if (!rec.email || !rec.name) continue;
    const key = (rec.ts + "|" + rec.email).toLowerCase();
    if (doneKeys.has(key)) continue;
    // A gift code is the giver's email address; it pays for one planner per
    // card they bought. Without a usable code, the answerer pays as before.
    const code = (rec.giftCode || "").trim().toLowerCase().replace(/^mailto:/, "");
    let gift = "";
    if (paid && code && (credits.get(code) || 0) > (used.get(code) || 0)) gift = code;
    if (paid && !gift && !paid.has(rec.email.toLowerCase())) {
      console.log(code ? "gift code not matched yet (or already used), awaiting payment:" : "awaiting payment:", rec.email);
      waiting++;
      continue;
    }
    if (gift) used.set(gift, (used.get(gift) || 0) + 1);
    const answers = toAnswers(rec);
    console.log("building for:", rec.email, JSON.stringify(answers));
    const out = path.join(__dirname, "out-" + made + ".pdf");
    await buildPlannerPdf(answers, out);
    await sendPlanner(rec.email, rec.name, out);
    fs.unlinkSync(out);
    state.done.push({ key, email: rec.email, sentAt: new Date().toISOString(), ...(gift ? { gift } : {}) });
    doneKeys.add(key);
    made++;
    console.log("sent:", rec.email);
  }
  fs.writeFileSync(STATE, JSON.stringify(state, null, 2) + "\n");
  console.log(`done: ${made} sent, ${waiting} awaiting payment, ${state.done.length} total fulfilled`);
})().catch((e) => { console.error(e); process.exit(1); });
