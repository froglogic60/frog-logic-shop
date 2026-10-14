// What will this basket actually cost, before anyone commits to paying?
//
// The basket needs to show postage as items go in, not spring it on someone at
// the payment step. For an audience who find surprises expensive, "delivery
// calculated at checkout" is the wrong answer — the whole point of the shop is
// that nothing jumps out at you.
//
// It deliberately shares its arithmetic with create-checkout.js rather than
// reimplementing it in the browser: two copies of a pricing rule is how a page
// ends up promising £3.49 and charging £5.29.
//
// Reads nothing, writes nothing, takes no payment. Safe to call on every
// basket change.

import catalog from "./catalog.json";
import { postageFor, destinationsFor, forCountry, COUNTRY_NAMES, CUSTOMS_RISK } from "./create-checkout.js";

// MUST match create-checkout.js. These were two separate 5000s until 27 Aug
// 2026, so raising the threshold in one place alone would have had the basket
// promise free delivery that the till then charged for — the same shape of bug
// as the hoodie that read £36.99 on the page and £32.00 at the till.
const FREE_DELIVERY_OVER = 8000;
const MAX_QTY = 20;

const json = (body, status) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let body;
  try { body = await req.json(); } catch { return json({ error: "Bad request" }, 400); }

  const requested = Array.isArray(body.items) ? body.items : [];
  const lines = [];
  const unknownIds = [];
  for (const raw of requested) {
    const item = catalog.find((p) => p.id === raw.id);
    if (!item) { unknownIds.push(raw.id); continue; }
    const qty = Math.min(MAX_QTY, Math.max(1, Math.floor(Number(raw.qty) || 1)));
    lines.push({ item, qty });
  }

  // Seven of the stickers exist on the shop but have no Printify product behind
  // them yet, so they cannot actually be made. The basket used to quote them
  // happily and create-checkout then refused the WHOLE basket at the payment
  // click — one unavailable sticker taking six good items down with it, at the
  // last possible moment. Say it here instead, while it can still be removed.
  const unavailable = lines
    .filter((l) => l.item.type === "physical" && !l.item.printifyProductId)
    .map((l) => ({ id: l.item.id, name: l.item.name }));

  // Where this basket can go, and where it is going. An unservable choice falls
  // back to the UK rather than erroring: the basket is not the place to argue,
  // and create-checkout refuses properly if it is still wrong at payment.
  const destinations = destinationsFor(lines);
  const asked = String(body.country || "GB").toUpperCase();
  let country = asked;
  if (!destinations.includes(country)) country = "GB";

  // The US range is made by a US maker, at its own price. Every figure below
  // uses the version that would actually be made for this country.
  const sellable = lines
    .filter((l) => !unavailable.some((u) => u.id === l.item.id))
    .map((l) => ({ ...l, item: forCountry(l.item, country) }));
  const goods = sellable.reduce((sum, l) => sum + Math.round(l.item.price * 100) * l.qty, 0);
  const physical = sellable.filter((l) => l.item.type === "physical");

  // Only tees, mugs, prints and notebooks are made in the US. When the US is
  // off the list because of what is in the basket, name the pieces holding it
  // back, so an American visitor knows what to take out rather than wondering
  // why their country is missing.
  const notMadeInUs = destinations.includes("US") ? [] : lines
    .filter((l) => l.item.type === "physical" && forCountry(l.item, "US").notMadeHere)
    .map((l) => l.item.name);

  const { total: rawPostage, parcels, unknown } = postageFor(physical, country);
  const overThreshold = country === "GB" && goods >= FREE_DELIVERY_OVER;
  // Tees and mugs post free in the UK at any basket size (their price carries
  // the postage), so rawPostage is 0 for a basket of only those.
  const freeDelivery = overThreshold || (country === "GB" && rawPostage === 0);
  const postage = physical.length === 0 ? 0 : freeDelivery ? 0 : rawPostage;

  return json({
    country,
    destinations: destinations.map((c) => ({ code: c, name: COUNTRY_NAMES[c] || c })),
    customsRisk: physical.length > 0 && CUSTOMS_RISK(country),
    // Price per piece for this country, in pence, so the basket lines match
    // the total (a US notebook costs more than a UK one).
    prices: Object.fromEntries(sellable.map((l) => [l.item.id, Math.round(l.item.price * 100)])),
    ...(notMadeInUs.length ? { notMadeInUs: [...new Set(notMadeInUs)], askedFor: asked } : {}),
    // The totals above EXCLUDE these, so the figure shown is what would
    // actually be charged once they are taken out.
    ...(unavailable.length ? { unavailable } : {}),
    ...(unknown.length ? { noRateFor: unknown } : {}),
    goods,
    postage,
    total: goods + postage,
    freeDelivery,
    // How much more is needed to reach free delivery, so the basket can say so
    // plainly instead of leaving people to work it out.
    toFreeDelivery: physical.length && country === "GB" && !freeDelivery ? FREE_DELIVERY_OVER - goods : 0,
    // True when the basket is free to post because of WHAT is in it (tees and
    // mugs) rather than how much — so the basket can say so.
    freePostItems: physical.length > 0 && country === "GB" && rawPostage === 0 && !overThreshold,
    freeDeliveryOver: FREE_DELIVERY_OVER,
    // Two parcels is not a mistake to hide — it is why the postage is what it
    // is, and saying so is cheaper than an email asking about it.
    parcels: physical.length ? parcels : 0,
    digitalOnly: physical.length === 0 && lines.length > 0,
    ...(unknownIds.length ? { unknownIds } : {}),
  }, 200);
};

export const config = { path: "/api/quote" };
