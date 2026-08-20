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
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let catalogCache = null;

const EU_COUNTRIES = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
];

async function loadCatalog() {
  if (!catalogCache) {
    const raw = await readFile(path.join(__dirname, "catalog.json"), "utf-8");
    catalogCache = JSON.parse(raw);
  }
  return catalogCache;
}

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return new Response(
      JSON.stringify({ error: "Checkout isn't configured yet — STRIPE_SECRET_KEY is missing." }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }

  let id;
  try {
    ({ id } = await req.json());
  } catch {
    return new Response(JSON.stringify({ error: "Bad request" }), { status: 400 });
  }

  const catalog = await loadCatalog();
  const item = catalog.find((p) => p.id === id);
  if (!item) {
    return new Response(JSON.stringify({ error: "Unknown product" }), { status: 404 });
  }

  if (item.type === "physical" && !item.printifyProductId) {
    // Real print-ready artwork hasn't been loaded into Printify for this
    // piece yet, so there's nothing to fulfil an order with. Fail clearly
    // rather than taking money for something that can't ship.
    return new Response(
      JSON.stringify({ error: "This piece isn't open for orders yet — check back soon." }),
      { status: 503, headers: { "content-type": "application/json" } }
    );
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
          product_data: { name: item.name },
        },
        quantity: 1,
      },
    ],
    shipping_address_collection:
      item.type === "physical" ? { allowed_countries: ["GB", "IE", ...EU_COUNTRIES] } : undefined,
    metadata: { product_id: item.id, product_type: item.type },
    success_url: `${site}/thank-you.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/#${item.type === "digital" ? "digital" : "collection"}`,
  });

  return new Response(JSON.stringify({ url: session.url }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};

export const config = { path: "/api/create-checkout" };
