// Creates a Stripe Checkout Session for one catalogue item.
//
// Called from the storefront's "Get this piece" / "Download" buttons instead
// of a static Payment Link — this is what lets 121 products share ONE Stripe
// setup instead of needing a hand-made link per product. Price and name are
// looked up server-side from catalog.json, never trusted from the browser,
// so nobody can tamper with the amount charged.
//
// Requires this Netlify site to have the env var STRIPE_SECRET_KEY set
// (Site settings → Environment variables). Nothing else.

import Stripe from "stripe";
import catalog from "./catalog.json";

const EU_COUNTRIES = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
];

const json = (body, status) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return json({ error: "Checkout isn't configured yet — STRIPE_SECRET_KEY is missing." }, 500);
  }

  let id, size;
  try {
    ({ id, size } = await req.json());
  } catch {
    return json({ error: "Bad request" }, 400);
  }

  const item = catalog.find((p) => p.id === id);
  if (!item) {
    return json({ error: "Unknown product" }, 404);
  }

  if (item.type === "physical" && !item.printifyProductId) {
    // Real print-ready artwork hasn't been loaded into Printify for this
    // piece yet, so there's nothing to fulfil an order with. Fail clearly
    // rather than taking money for something that can't ship.
    return json({ error: "This piece isn't open for orders yet — check back soon." }, 503);
  }

  // Garments come in five sizes. Refuse rather than guess: quietly shipping a
  // Small to someone who wanted a 2XL is a return, a refund and a lost customer.
  let variantId = item.printifyVariantId;
  let chosenSize = null;
  if (Array.isArray(item.sizes) && item.sizes.length) {
    if (!size) {
      return json({ error: "Please choose a size first.", needsSize: item.sizes.map((s) => s.size) }, 400);
    }
    const match = item.sizes.find((s) => String(s.size).toLowerCase() === String(size).toLowerCase());
    if (!match) {
      return json({ error: `We don't make that one in ${size}.`, needsSize: item.sizes.map((s) => s.size) }, 400);
    }
    variantId = match.variantId;
    chosenSize = match.size;
  }

  const stripe = new Stripe(key);
  const site = process.env.SITE_URL || new URL(req.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: item.currency || "gbp",
          unit_amount: Math.round(item.price * 100),
          product_data: { name: chosenSize ? `${item.name} (${chosenSize})` : item.name },
        },
        quantity: 1,
      },
    ],
    shipping_address_collection:
      item.type === "physical" ? { allowed_countries: ["GB", "IE", ...EU_COUNTRIES] } : undefined,
    // variant_id is what the webhook actually orders from Printify. It is
    // written here, server-side, from the catalogue — never taken from the
    // browser — so the size a customer picked is the size that gets made.
    metadata: {
      product_id: item.id,
      product_type: item.type,
      ...(variantId ? { variant_id: String(variantId) } : {}),
      ...(chosenSize ? { size: chosenSize } : {}),
    },
    success_url: `${site}/thank-you.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/#${item.type === "digital" ? "digital" : "collection"}`,
  });

  return json({ url: session.url }, 200);
};

export const config = { path: "/api/create-checkout" };
