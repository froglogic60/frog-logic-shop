// What does it actually cost to post each thing?
//
// The shop has been collecting a delivery address and charging nothing for
// delivery, so Frog Logic has been absorbing every parcel. Passing postage on
// needs a real number per product, not a flat guess — a hoodie posts for £4.49
// and a sticker for £6.49, and the two do not average into anything sensible.
//
// Two facts shape the model:
//
//   1. Printify charges per parcel: a first-item rate, then a cheaper rate for
//      each additional item in the same parcel. So a basket of three tees costs
//      first + 2 x additional, not 3 x first.
//   2. Items made by different print providers ship as separate parcels. A tee
//      and a notebook in one basket are two parcels and two first-item charges,
//      however much it looks like one order to the customer.
//
// So the checkout has to group a basket by provider and charge per group. This
// script writes the numbers that make that possible into catalog.json:
//
//   "shipping": { "provider": 99, "first": 349, "additional": 199 }
//
// Rates are in pence, read from Printify's own catalogue. Run it again whenever
// Printify changes prices.
const fs = require("fs");
const path = require("path");

const KEY = process.env.PRINTIFY_API_KEY;
let SHOP = process.env.PRINTIFY_SHOP_ID;
if (!KEY) { console.error("PRINTIFY_API_KEY is not set"); process.exit(1); }

const CATALOG = path.join(__dirname, "../../netlify/functions/catalog.json");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const GAP_MS = 150;
let lastCall = 0;
const cache = new Map();

async function api(p) {
  for (let attempt = 0; ; attempt++) {
    const wait = lastCall + GAP_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastCall = Date.now();
    const r = await fetch("https://api.printify.com/v1" + p, {
      headers: { Authorization: "Bearer " + KEY, "Content-Type": "application/json" },
    });
    if (r.ok) return r.json();
    if ((r.status === 429 || r.status >= 500) && attempt < 5) {
      const retryAfter = Number(r.headers.get("retry-after"));
      const backoff = retryAfter > 0 ? retryAfter * 1000 : Math.min(30000, 2000 * Math.pow(2, attempt));
      console.log(`   ${r.status} on ${p} — waiting ${Math.round(backoff / 1000)}s`);
      await sleep(backoff);
      continue;
    }
    throw new Error("GET " + p + " -> " + r.status + " " + (await r.text()).slice(0, 200));
  }
}

async function getCached(p) {
  if (!cache.has(p)) cache.set(p, api(p));
  return cache.get(p);
}

const gbp = (p) => (p == null ? "?" : "£" + (p / 100).toFixed(2));

// The GB profile if there is one, otherwise whatever covers the rest of the
// world. Falling back matters: a provider with no explicit GB row still posts
// here, just on the catch-all rate, and pretending otherwise would under-charge.
function ukRates(shipping) {
  const profiles = shipping.profiles || [];
  const gb = profiles.find((p) => (p.countries || []).includes("GB"));
  const rest = profiles.find((p) => (p.countries || []).includes("REST_OF_THE_WORLD"));
  const chosen = gb || rest;
  if (!chosen) return null;
  return {
    first: chosen.first_item?.cost ?? null,
    additional: chosen.additional_items?.cost ?? null,
    explicitGB: !!gb,
  };
}

(async () => {
  if (!SHOP) {
    const shops = await api("/shops.json");
    if (!shops.length) { console.error("No shops on this Printify account"); process.exit(1); }
    SHOP = shops[0].id;
    console.log("auto-detected shop:", shops[0].title, "(id " + SHOP + ")");
  }

  const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
  const live = catalog.filter((x) => x.type === "physical" && x.printifyProductId);
  console.log(`${live.length} orderable products to price up\n`);

  const providers = new Map();   // providerId -> { title, country, first, additional }
  const problems = [];
  let done = 0;

  for (const item of live) {
    let product;
    try {
      product = await getCached(`/shops/${SHOP}/products/${item.printifyProductId}.json`);
    } catch (e) {
      problems.push(`${item.id}: could not read the product — ${e.message.slice(0, 80)}`);
      continue;
    }
    const bpId = product.blueprint_id;
    const prId = product.print_provider_id;
    if (!bpId || !prId) { problems.push(`${item.id}: no blueprint or provider on the product`); continue; }

    const key = `${bpId}:${prId}`;
    if (!providers.has(key)) {
      let rates = null, title = String(prId);
      try {
        rates = ukRates(await getCached(`/catalog/blueprints/${bpId}/print_providers/${prId}/shipping.json`));
      } catch (e) {
        problems.push(`${item.id}: no shipping profile — ${e.message.slice(0, 60)}`);
      }
      try {
        title = (await getCached(`/catalog/print_providers/${prId}.json`)).title || title;
      } catch { /* the name is cosmetic; the rates are not */ }
      providers.set(key, rates ? { ...rates, title, providerId: prId } : null);
    }

    const p = providers.get(key);
    if (!p || p.first == null) { problems.push(`${item.id}: no usable UK rate`); continue; }

    // additional_items is occasionally absent. Charging the full first-item rate
    // for every extra item is the safe direction to be wrong in — it over-covers
    // rather than quietly eating the difference.
    item.shipping = {
      provider: prId,
      providerName: p.title,
      first: p.first,
      additional: p.additional == null ? p.first : p.additional,
      ...(p.explicitGB ? {} : { restOfWorldRate: true }),
    };
    done++;
  }

  console.log("POSTAGE BY MAKER");
  console.log("=".repeat(66));
  const byProvider = {};
  for (const item of live) {
    if (!item.shipping) continue;
    const k = item.shipping.providerName;
    byProvider[k] = byProvider[k] || { first: item.shipping.first, additional: item.shipping.additional, n: 0 };
    byProvider[k].n++;
  }
  for (const [name, v] of Object.entries(byProvider).sort((a, b) => b[1].n - a[1].n)) {
    console.log(
      name.padEnd(30) +
      String(v.n).padStart(3) + " products   first " + gbp(v.first).padEnd(7) + "  then " + gbp(v.additional)
    );
  }

  // The worst case is what a flat rate would have to cover, and the best case is
  // what most orders would actually be. Printing both makes it obvious why a
  // calculated rate is worth the trouble.
  const firsts = Object.values(byProvider).map((v) => v.first);
  if (firsts.length) {
    console.log(`\nOne item, cheapest maker: ${gbp(Math.min(...firsts))}`);
    console.log(`One item, dearest maker:  ${gbp(Math.max(...firsts))}`);
    console.log(`All ${Object.keys(byProvider).length} makers in one basket: ${gbp(firsts.reduce((a, b) => a + b, 0))} — separate parcels`);
  }

  if (problems.length) {
    console.log(`\n${problems.length} product(s) could not be priced:`);
    problems.slice(0, 20).forEach((p) => console.log("  ! " + p));
    if (problems.length > 20) console.log(`  ...and ${problems.length - 20} more`);
  }

  // Refuse rather than write a half-populated catalogue: a product with no
  // shipping row would silently ship for free, which is the bug being fixed.
  if (done !== live.length) {
    console.error(`\nREFUSING TO WRITE — priced ${done} of ${live.length} orderable products.`);
    process.exit(1);
  }

  fs.writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + "\n");
  console.log(`\nwrote shipping rates for all ${done} orderable products into catalog.json`);
})().catch((e) => { console.error(e); process.exit(1); });
