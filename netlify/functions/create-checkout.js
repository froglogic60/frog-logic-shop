// Creates a Stripe Checkout Session for a basket.
//
// Called from the storefront's basket instead of a static Payment Link — this
// is what lets 121 products share ONE Stripe setup instead of needing a
// hand-made link per product. Prices, sizes and postage are all looked up
// server-side from catalog.json and never trusted from the browser, so nobody
// can tamper with the amount charged.
//
// POSTAGE
// -------
// Until now this charged nothing for delivery while still collecting an
// address, so every parcel came out of Frog Logic's margin — about £3.49 on a
// tee and £6.49 on a sticker, against a £4.63 and a NEGATIVE margin
// respectively. Postage is now passed on, calculated from the real Printify
// rates in catalog.json.
//
// Two things make it more than "rate x quantity":
//
//   1. Printify bills per parcel — a first-item rate, then a cheaper rate for
//      each additional item in the same parcel. Three tees from one maker cost
//      £3.49 + 2 x £1.99, not 3 x £3.49.
//   2. Different makers post separately. A tee and a notebook are two parcels
//      and two first-item charges, however much it looks like one order.
//
// Free UK delivery over £50 of goods (postage itself does not count towards
// the threshold — otherwise adding postage could tip an order over and cancel
// the very charge that tipped it).
//
// Requires this Netlify site to have the env var STRIPE_SECRET_KEY set
// (Site settings → Environment variables). Nothing else.

import Stripe from "stripe";
import catalog from "./catalog.json";
import zoneData from "./shipping-zones.json";

// Goods total, in pence, above which UK delivery is free.
const FREE_DELIVERY_OVER = 5000;

// Where the shop is willing to post. This used to be ["GB"] alone, because the
// only rates in catalog.json were UK ones and charging a Dublin address a UK
// price for a parcel that costs more to send loses money on every order.
//
// The real rate for every destination each maker quotes now lives in
// shipping-zones.json, so the limit is no longer arithmetic. It is judgement:
// outside the UK a parcel can arrive with an import VAT or duty bill on the
// doorstep, and this shop's whole promise is that nothing jumps out at you.
// So this is a shortlist, not "everywhere Printify will post" — and the
// checkout says plainly, before anyone pays, that a customs charge is possible.
//
// A country is only offered if EVERY maker in the basket posts there and a
// real rate exists for it. Adding one here does not force it; it permits it.
//
// The UK and the EU. Every maker quotes all 61 of the destinations in
// shipping-zones.json, so this list is a choice, not a limit — the US, Canada
// and Australia are all reachable and all left off, because postage there runs
// £17 to £33 on a £16 tee and a price like that is not an offer, it is a
// wasted click.
const DESTINATIONS = [
  "GB",
  "IE", "FR", "DE", "NL", "BE", "ES", "IT", "PT", "AT", "LU",
  "DK", "SE", "FI", "PL", "CZ", "SK", "SI", "HR", "HU", "RO",
  "BG", "GR", "EE", "LV", "LT", "CY", "MT",
];

// Only for what the customer sees. Kept next to the list so adding a country
// to one without the other shows a bare code rather than the wrong name.
export const COUNTRY_NAMES = {
  GB: "the UK", IE: "Ireland", FR: "France", DE: "Germany", NL: "the Netherlands",
  BE: "Belgium", ES: "Spain", IT: "Italy", PT: "Portugal", AT: "Austria",
  LU: "Luxembourg", DK: "Denmark", SE: "Sweden", FI: "Finland", PL: "Poland",
  CZ: "Czechia", SK: "Slovakia", SI: "Slovenia", HR: "Croatia", HU: "Hungary",
  RO: "Romania", BG: "Bulgaria", GR: "Greece", EE: "Estonia", LV: "Latvia",
  LT: "Lithuania", CY: "Cyprus", MT: "Malta",
};

// Countries where a parcel from the UK can attract import VAT or duty on
// arrival. Said out loud in the basket rather than discovered on the doorstep.
export const CUSTOMS_RISK = (c) => c !== "GB";

const ZONES = zoneData.providers || {};

const MAX_QTY = 20;

const json = (body, status) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

// The rate a single product posts at, to one country, in pence.
//
// Zones are keyed by blueprint AND maker, because the same maker charges more
// for a hoodie than a tee. Falls back to the flat UK figure on the catalogue
// entry — which is only ever right for GB, and is why an unknown country
// returns null rather than guessing.
function rateFor(item, country) {
  const s = item.shipping;
  if (!s) return null;
  const table = ZONES[s.zoneKey] || ZONES[String(s.provider)];
  if (table && Array.isArray(table.zones)) {
    const zone =
      table.zones.find((z) => z.countries.includes(country)) ||
      table.zones.find((z) => z.countries.includes("REST_OF_THE_WORLD"));
    if (zone && zone.first != null) {
      return { first: zone.first, additional: zone.additional ?? zone.first };
    }
  }
  if (country === "GB" && s.first != null) {
    return { first: s.first, additional: s.additional ?? s.first };
  }
  return null;
}

// Postage for a set of physical lines, in pence.
//
// Each line is { item, qty }. Lines are grouped by print provider because that
// is what decides how many parcels there are — but the first-item rate charged
// for a parcel is the dearest of the things in it, since a maker bills the
// parcel at the rate of what is in it and a hoodie is not a sticker.
export function postageFor(lines, country = "GB") {
  const parcels = new Map();
  const unknown = [];
  for (const { item, qty } of lines) {
    if (item.type !== "physical") continue;
    // A physical product with no usable rate would ship free, which is the bug
    // this whole thing exists to fix. Name it rather than silently zero it.
    const rate = rateFor(item, country);
    if (!rate) { unknown.push(item.id); continue; }
    const key = String(item.shipping.provider);
    const p = parcels.get(key) || { first: 0, additional: 0, qty: 0 };
    p.first = Math.max(p.first, rate.first);
    p.additional = Math.max(p.additional, rate.additional);
    p.qty += qty;
    parcels.set(key, p);
  }

  let total = 0;
  for (const p of parcels.values()) {
    total += p.first + p.additional * Math.max(0, p.qty - 1);
  }
  return { total, parcels: parcels.size, unknown };
}

// The countries this particular basket can be sent to: on the shortlist, and
// quotable for every physical line in it. Always includes GB, which the flat
// catalogue rate covers even before the zone table has ever been built.
export function destinationsFor(lines) {
  const physical = lines.filter((l) => l.item.type === "physical");
  if (!physical.length) return DESTINATIONS.slice();
  return DESTINATIONS.filter((c) => physical.every((l) => rateFor(l.item, c)));
}

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return json({ error: "Checkout isn't configured yet — STRIPE_SECRET_KEY is missing." }, 500);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Bad request" }, 400);
  }

  // One basket, but a single { id, size } is still accepted so an older cached
  // copy of the page keeps working rather than failing at the moment of payment.
  const requested = Array.isArray(body.items)
    ? body.items
    : body.id
      ? [{ id: body.id, size: body.size, qty: 1 }]
      : [];

  if (!requested.length) {
    return json({ error: "Your basket is empty." }, 400);
  }

  const lines = [];
  for (const raw of requested) {
    const item = catalog.find((p) => p.id === raw.id);
    if (!item) return json({ error: "Unknown product", id: raw.id }, 404);

    if (item.type === "physical" && !item.printifyProductId) {
      // Real print-ready artwork hasn't been loaded into Printify for this
      // piece yet, so there's nothing to fulfil an order with. Fail clearly
      // rather than taking money for something that can't ship.
      return json({ error: `"${item.name}" isn't open for orders yet — check back soon.`, id: item.id }, 503);
    }

    const qty = Math.min(MAX_QTY, Math.max(1, Math.floor(Number(raw.qty) || 1)));

    // Garments come in five sizes. Refuse rather than guess: quietly shipping a
    // Small to someone who wanted a 2XL is a return, a refund and a lost customer.
    let variantId = item.printifyVariantId;
    let chosenSize = null;
    if (Array.isArray(item.sizes) && item.sizes.length) {
      if (!raw.size) {
        return json({ error: `Please choose a size for "${item.name}".`, id: item.id, needsSize: item.sizes.map((s) => s.size) }, 400);
      }
      const match = item.sizes.find((s) => String(s.size).toLowerCase() === String(raw.size).toLowerCase());
      if (!match) {
        return json({ error: `We don't make "${item.name}" in ${raw.size}.`, id: item.id, needsSize: item.sizes.map((s) => s.size) }, 400);
      }
      variantId = match.variantId;
      chosenSize = match.size;
    }

    lines.push({ item, qty, variantId, size: chosenSize });
  }

  const goodsTotal = lines.reduce((sum, l) => sum + Math.round(l.item.price * 100) * l.qty, 0);
  const physical = lines.filter((l) => l.item.type === "physical");

  // Stripe's fixed-amount shipping rates are set before the customer types an
  // address, so the amount cannot react to where they turn out to live. The
  // basket therefore asks first, and the address form is then locked to that
  // one country — otherwise someone could pick the UK, pay UK postage and have
  // it sent to Dublin.
  const allowed = destinationsFor(lines);
  const country = String(body.country || "GB").toUpperCase();
  if (physical.length && !allowed.includes(country)) {
    return json({ error: "We can't post this order to that country yet.", country, allowed }, 400);
  }

  const { total: rawPostage, unknown } = postageFor(physical.map((l) => ({ item: l.item, qty: l.qty })), country);
  if (unknown.length) {
    console.error("No postage rate for", unknown.join(", "), "— run the Refresh the postage rates workflow");
    return json({ error: "We can't work out delivery for one of these just now. Please try again shortly." }, 503);
  }
  // Free delivery is a UK offer. Posting abroad costs roughly double, so
  // extending it there would turn the best orders into the worst ones.
  const freeDelivery = country === "GB" && goodsTotal >= FREE_DELIVERY_OVER;
  const postage = physical.length === 0 || freeDelivery ? 0 : rawPostage;

  const stripe = new Stripe(key);
  const site = process.env.SITE_URL || new URL(req.url).origin;

  // variant_id and size are written here, server-side, from the catalogue —
  // never taken from the browser — so the size a customer picked is the size
  // that gets made. The basket is stored as compact text because Stripe caps a
  // metadata value at 500 characters, and a long basket would be truncated
  // mid-item and fulfil the wrong thing.
  const encoded = lines
    .map((l) => `${l.item.id}~${l.variantId || ""}~${l.qty}~${l.size || ""}`)
    .join("|");
  const chunks = {};
  for (let i = 0; i * 450 < encoded.length; i++) {
    chunks[`basket_${i}`] = encoded.slice(i * 450, (i + 1) * 450);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lines.map((l) => ({
      price_data: {
        currency: l.item.currency || "gbp",
        unit_amount: Math.round(l.item.price * 100),
        product_data: { name: l.size ? `${l.item.name} (${l.size})` : l.item.name },
      },
      quantity: l.qty,
    })),
    shipping_address_collection:
      physical.length ? { allowed_countries: [country] } : undefined,
    shipping_options: physical.length
      ? [{
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: postage, currency: "gbp" },
            display_name: freeDelivery
              ? "Free UK delivery (over £50)"
              : "Delivery to " + (COUNTRY_NAMES[country] || country),
          },
        }]
      : undefined,
    metadata: {
      ...chunks,
      basket_count: String(lines.length),
      // Kept so a session created before this change, or a single-item basket,
      // still fulfils through the old path in the webhook.
      ...(lines.length === 1 ? { product_id: lines[0].item.id, product_type: lines[0].item.type } : {}),
      ...(lines.length === 1 && lines[0].variantId ? { variant_id: String(lines[0].variantId) } : {}),
      ...(lines.length === 1 && lines[0].size ? { size: lines[0].size } : {}),
    },
    success_url: `${site}/thank-you.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/#collection`,
  });

  return json({ url: session.url }, 200);
};

export const config = { path: "/api/create-checkout" };
