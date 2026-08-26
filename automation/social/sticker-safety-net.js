// Keep the 4" sticker orderable until the shop actually redeploys.
//
// The stickers now sell as 3" (£2.79 to make, against £5.46 for the 4"). But
// the LIVE site is frozen on the 21 August build, because Netlify has been
// skipping production deploys since then, and that build's catalogue still
// orders variant 92315 — the 4". With only the 3" enabled, a sticker bought
// today reaches Printify as a variant that is switched off and the order fails,
// after the customer has paid.
//
// So both sizes stay enabled until the new build is live:
//
//   92314  3" — what the new catalogue orders. 71p a sticker.
//   92315  4" — what the frozen live site orders. Loses £1.96, but it ships.
//
// Losing £1.96 on a sticker is bad. Taking someone's money and then silently
// failing to make the thing is worse, and this shop's whole promise is that
// nothing goes wrong quietly.
//
// Once the new build is live nothing references 92315 any more, so leaving it
// enabled costs nothing — no follow-up needed.
//
//   node sticker-safety-net.js          say what it would do, change nothing
//   APPLY=1 node sticker-safety-net.js  do it
//
// It also corrects automation/social/printify-result.json, which still records
// 92315 as each sticker's variant. wire-catalog.js rebuilds catalog.json FROM
// that file, so leaving it would mean the next "Rebuild the checkout catalogue"
// run quietly puts every sticker back on the 4" and the loss with it.
const fs = require("fs");
const path = require("path");

const KEY = process.env.PRINTIFY_API_KEY;
let SHOP = process.env.PRINTIFY_SHOP_ID;
if (!KEY) { console.error("PRINTIFY_API_KEY is not set"); process.exit(1); }

const APPLY = !!process.env.APPLY;

const CATALOG = path.join(__dirname, "../../netlify/functions/catalog.json");
const RESULTS = path.join(__dirname, "printify-result.json");

const THREE_INCH = 92314;
const FOUR_INCH = 92315;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const GAP_MS = 200;
let lastCall = 0;

async function api(p, method = "GET", body) {
  for (let attempt = 0; ; attempt++) {
    const wait = lastCall + GAP_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastCall = Date.now();
    const r = await fetch("https://api.printify.com/v1" + p, {
      method,
      headers: { Authorization: "Bearer " + KEY, "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (r.ok) { const t = await r.text(); return t ? JSON.parse(t) : {}; }
    if ((r.status === 429 || r.status >= 500) && attempt < 5) {
      const retryAfter = Number(r.headers.get("retry-after"));
      const backoff = retryAfter > 0 ? retryAfter * 1000 : Math.min(30000, 2000 * Math.pow(2, attempt));
      console.log(`   ${r.status} on ${p} — waiting ${Math.round(backoff / 1000)}s`);
      await sleep(backoff);
      continue;
    }
    throw new Error(method + " " + p + " -> " + r.status + " " + (await r.text()).slice(0, 600));
  }
}

const gbp = (p) => (p == null ? "?" : "£" + (p / 100).toFixed(2));

(async () => {
  if (!SHOP) {
    const shops = await api("/shops.json");
    if (!shops.length) { console.error("No shops on this Printify account"); process.exit(1); }
    SHOP = shops[0].id;
    console.log("auto-detected shop:", shops[0].title, "(id " + SHOP + ")");
  }

  const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
  const stickers = catalog.filter(
    (x) => x.type === "physical" && x.printifyProductId && x.printifyVariantId === THREE_INCH
  );
  if (!stickers.length) {
    console.error(`No stickers on variant ${THREE_INCH}. Has the 3" move actually run?`);
    process.exit(1);
  }

  console.log(`${stickers.length} sticker(s) to give a safety net\n`);
  console.log(APPLY ? "APPLYING\n" : "DRY RUN — nothing will be changed. Set APPLY=1 to do it.\n");

  const problems = [];
  let done = 0;

  for (const item of stickers) {
    const label = `${item.id} (${item.name})`;
    let product;
    try {
      product = await api(`/shops/${SHOP}/products/${item.printifyProductId}.json`);
    } catch (e) {
      problems.push(`${label}: could not read the product — ${e.message.slice(0, 90)}`);
      continue;
    }

    const three = (product.variants || []).find((v) => v.id === THREE_INCH);
    const four = (product.variants || []).find((v) => v.id === FOUR_INCH);
    if (!three || !four) { problems.push(`${label}: missing one of the two sizes`); continue; }

    const retail = three.is_enabled ? three.price : Math.round(item.price * 100);
    const already = three.is_enabled && four.is_enabled;

    console.log(
      label.padEnd(34) +
      `${gbp(retail)} retail  ·  3" costs ${gbp(three.cost)} (keeps ${gbp(retail - three.cost)})` +
      `  ·  4" costs ${gbp(four.cost)} (${retail - four.cost < 0 ? "LOSES " : "keeps "}${gbp(Math.abs(retail - four.cost))})` +
      (already ? "  — already both on" : "")
    );

    if (!APPLY || already) { done++; continue; }

    try {
      // Both sizes on, everything else off, prices untouched. print_areas is
      // deliberately not sent: the existing one already covers all six sizes,
      // and sending it is what made three earlier attempts fail validation.
      const variants = (product.variants || []).map((v) => ({
        id: v.id,
        price: v.id === THREE_INCH || v.id === FOUR_INCH ? retail : v.price,
        is_enabled: v.id === THREE_INCH || v.id === FOUR_INCH,
      }));
      await api(`/shops/${SHOP}/products/${item.printifyProductId}.json`, "PUT", { variants });
    } catch (e) {
      problems.push(`${label}: update refused — ${e.message.slice(0, 300)}`);
      continue;
    }

    // A 200 is not proof. Read it back.
    const after = await api(`/shops/${SHOP}/products/${item.printifyProductId}.json`);
    const live = (after.variants || []).filter((v) => v.is_enabled).map((v) => v.id).sort();
    if (live.join(",") !== [THREE_INCH, FOUR_INCH].sort().join(",")) {
      problems.push(`${label}: after the update the live variants are ${live.join(",") || "none"}`);
      continue;
    }
    done++;
    console.log(`   both sizes live: ${live.join(" and ")}`);
  }

  if (problems.length) {
    console.log(`\n${problems.length} problem(s):`);
    problems.forEach((p) => console.log("  ! " + p));
  }

  if (!APPLY) {
    console.log(`\nwould give ${done} of ${stickers.length} a safety net. Nothing written.`);
    if (problems.length) process.exit(1);
    return;
  }
  if (done !== stickers.length) {
    console.error(`\nREFUSING — handled ${done} of ${stickers.length}. Fix the above and run again.`);
    process.exit(1);
  }

  // ---- and stop the catalogue rebuild undoing the 3" move ----
  const raw = JSON.parse(fs.readFileSync(RESULTS, "utf8"));
  const rows = Array.isArray(raw) ? raw : (raw.created || raw.results || raw.products || []);
  let fixed = 0;
  for (const r of rows) {
    if (r && r.printifyVariantId === FOUR_INCH) { r.printifyVariantId = THREE_INCH; fixed++; }
  }
  if (fixed) {
    fs.writeFileSync(RESULTS, JSON.stringify(raw, null, 2) + "\n");
    console.log(`\nprintify-result.json: moved ${fixed} sticker row(s) from ${FOUR_INCH} to ${THREE_INCH},`);
    console.log("so rebuilding the checkout catalogue keeps the 3\" rather than reverting it.");
  } else {
    console.log("\nprintify-result.json already records the 3\" variant.");
  }
})().catch((e) => { console.error(e); process.exit(1); });
