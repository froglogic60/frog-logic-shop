// Stripe calls this the moment a payment succeeds. This is the whole
// fulfilment pipeline for the site — no Zapier, no Payhip/Gumroad account:
//   digital item  -> email the buyer their download link, via Resend
//   physical item -> create the order in Printify, via the Printify API
//
// Requires these env vars in Netlify (Site settings -> Environment variables):
//   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET   (Stripe -> Developers -> Webhooks)
//   RESEND_API_KEY, FROM_EMAIL                 (same Resend account as the newsletter)
//   SITE_URL                                    e.g. https://frog-logic-shop.netlify.app
//   PRINTIFY_API_KEY, PRINTIFY_SHOP_ID          (only needed once physical pieces are live)
//
// Register this endpoint's URL (https://<your-site>/api/stripe-webhook) in
// Stripe -> Developers -> Webhooks, listening for checkout.session.completed.

import Stripe from "stripe";
import catalog from "./catalog.json";


async function sendDownloadEmail({ toEmail, item }) {
  const site = process.env.SITE_URL;
  const downloadUrl = `${site}/digital/${item.file}`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL,
      to: toEmail,
      subject: `Your download: ${item.name}`,
      html: `<p>Thanks for your order! Here's your download:</p>
             <p><a href="${downloadUrl}">${item.name}</a></p>
             <p>For personal and household use — print freely, please don't resell or redistribute the file.</p>
             <p>🐸 Frog Logic</p>`,
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend failed: ${res.status} ${await res.text()}`);
  }
}

async function createPrintifyOrder({ session, item }) {
  const shopId = process.env.PRINTIFY_SHOP_ID;
  const apiKey = process.env.PRINTIFY_API_KEY;
  // The size the customer picked, written into the session server-side by
  // create-checkout.js. Falling back to the catalogue default is only right for
  // one-size items — for a garment it would be the wrong size, so say so loudly.
  const variantId = Number(session.metadata?.variant_id) || item.printifyVariantId;
  if (Array.isArray(item.sizes) && !session.metadata?.variant_id) {
    console.error("Ordering", item.id, "with no size in the session metadata — check create-checkout");
  }
  const addr = session.shipping_details?.address;
  const name = session.shipping_details?.name || session.customer_details?.name || "";
  const [first_name, ...rest] = name.split(" ");

  const res = await fetch(`https://api.printify.com/v1/shops/${shopId}/orders.json`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      external_id: session.id,
      label: session.metadata?.size ? `${item.id} (${session.metadata.size})` : item.id,
      line_items: [
        { product_id: item.printifyProductId, variant_id: variantId, quantity: 1 },
      ],
      shipping_method: 1,
      send_shipping_notification: true,
      address_to: {
        first_name: first_name || "Customer",
        last_name: rest.join(" ") || "-",
        email: session.customer_details?.email,
        phone: session.customer_details?.phone || "0000000000",
        country: addr?.country,
        region: addr?.state || "",
        address1: addr?.line1,
        address2: addr?.line2 || "",
        city: addr?.city,
        zip: addr?.postal_code,
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`Printify order failed: ${res.status} ${await res.text()}`);
  }
}

export default async (req) => {
  const key = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!key || !webhookSecret) {
    return new Response("Webhook not configured", { status: 500 });
  }

  const stripe = new Stripe(key);
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    return new Response(`Signature verification failed: ${err.message}`, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return new Response("ok", { status: 200 });
  }

  const session = event.data.object;
  const productId = session.metadata?.product_id;
  const item = catalog.find((p) => p.id === productId);

  if (!item) {
    console.error("Webhook: unknown product_id in session metadata", productId);
    return new Response("ok", { status: 200 }); // ack anyway, nothing more we can do
  }

  try {
    if (item.type === "digital") {
      await sendDownloadEmail({ toEmail: session.customer_details?.email, item });
    } else {
      await createPrintifyOrder({ session, item });
    }
  } catch (err) {
    // Log loudly (visible in Netlify's function log) but still ack Stripe —
    // otherwise Stripe will keep retrying a payment that already succeeded.
    // A failure here means a paying customer with no fulfilment yet, so this
    // log is where to look first if someone emails asking "where's my order?"
    console.error("Fulfilment failed for", productId, err);
  }

  return new Response("ok", { status: 200 });
};

export const config = { path: "/api/stripe-webhook" };
