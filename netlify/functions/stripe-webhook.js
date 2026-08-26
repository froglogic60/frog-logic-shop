// Stripe calls this the moment a payment succeeds. This is the whole
// fulfilment pipeline for the site — no Zapier, no Payhip/Gumroad account:
//   digital items  -> email the buyer their download links, via Resend
//   physical items -> create the orders in Printify, via the Printify API
//
// A basket can now hold several things at once, which changes the shape of
// this: one payment can mean one email with three downloads AND two separate
// Printify orders, because items made by different print providers ship as
// separate parcels and Printify wants one order per provider.
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

// create-checkout.js writes the basket as "id~variant~qty~size|id~variant~qty~size",
// split across basket_0, basket_1... because Stripe caps a metadata value at
// 500 characters. Rejoin in index order — a basket reassembled out of order
// would still parse and would still be wrong.
function readBasket(metadata = {}) {
  const parts = [];
  for (let i = 0; metadata[`basket_${i}`] != null; i++) parts.push(metadata[`basket_${i}`]);
  const encoded = parts.join("");

  if (!encoded) {
    // A session created before baskets existed, or by an older cached page.
    if (!metadata.product_id) return [];
    return [{
      id: metadata.product_id,
      variantId: Number(metadata.variant_id) || null,
      qty: 1,
      size: metadata.size || null,
    }];
  }

  return encoded.split("|").filter(Boolean).map((row) => {
    const [id, variantId, qty, size] = row.split("~");
    return {
      id,
      variantId: Number(variantId) || null,
      qty: Math.max(1, Number(qty) || 1),
      size: size || null,
    };
  });
}

async function sendDownloadEmail({ toEmail, items }) {
  const site = process.env.SITE_URL;
  const links = items
    .map((item) => `<p><a href="${site}/digital/${item.file}">${item.name}</a></p>`)
    .join("\n");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL,
      to: toEmail,
      subject: items.length === 1 ? `Your download: ${items[0].name}` : `Your ${items.length} downloads`,
      html: `<p>Thanks for your order! Here ${items.length === 1 ? "it is" : "they are"}:</p>
             ${links}
             <p>For personal and household use — print freely, please don't resell or redistribute the files.</p>
             <p>Trouble with a file — won't open, wrong one, didn't arrive? Reply to this email or write to
             <a href="mailto:hello@froglogic.co.uk">hello@froglogic.co.uk</a> and I'll sort it. The
             <a href="${site}/returns">returns page</a> has the detail.</p>
             <p>🐸 Frog Logic</p>`,
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend failed: ${res.status} ${await res.text()}`);
  }
}

// One Printify order per print provider. Printify will not accept a single
// order spanning two providers, and splitting is not optional — it is what is
// physically happening, since each provider posts its own parcel.
async function createPrintifyOrder({ session, providerKey, lines }) {
  const shopId = process.env.PRINTIFY_SHOP_ID;
  const apiKey = process.env.PRINTIFY_API_KEY;
  const addr = session.shipping_details?.address;
  const name = session.shipping_details?.name || session.customer_details?.name || "";
  const [first_name, ...rest] = name.split(" ");

  const res = await fetch(`https://api.printify.com/v1/shops/${shopId}/orders.json`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      // Unique per provider: Printify rejects a repeated external_id, so a
      // two-parcel order would silently lose its second half without this.
      external_id: `${session.id}-${providerKey}`,
      label: lines.map((l) => (l.size ? `${l.item.id} (${l.size}) x${l.qty}` : `${l.item.id} x${l.qty}`)).join(", ").slice(0, 250),
      line_items: lines.map((l) => ({
        product_id: l.item.printifyProductId,
        variant_id: l.variantId || l.item.printifyVariantId,
        quantity: l.qty,
      })),
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
  const rows = readBasket(session.metadata);

  if (!rows.length) {
    console.error("Webhook: no basket in session metadata", session.id);
    return new Response("ok", { status: 200 }); // ack anyway, nothing more we can do
  }

  const lines = [];
  for (const row of rows) {
    const item = catalog.find((p) => p.id === row.id);
    if (!item) { console.error("Webhook: unknown product id", row.id, "in session", session.id); continue; }
    if (Array.isArray(item.sizes) && !row.variantId) {
      console.error("Ordering", item.id, "with no size — check create-checkout");
    }
    lines.push({ ...row, item });
  }

  const digital = lines.filter((l) => l.item.type === "digital").map((l) => l.item);
  const physical = lines.filter((l) => l.item.type === "physical");

  // Grouped by provider, because that is one parcel and one Printify order.
  const byProvider = new Map();
  for (const l of physical) {
    const k = String(l.item.shipping?.provider ?? `unknown-${l.item.id}`);
    byProvider.set(k, [...(byProvider.get(k) || []), l]);
  }

  // Each fulfilment is attempted on its own. One failing maker must not stop
  // the others, and a failed Printify order must not stop the download email —
  // a customer who paid for four things should get the three that worked.
  const failures = [];

  if (digital.length) {
    try {
      await sendDownloadEmail({ toEmail: session.customer_details?.email, items: digital });
    } catch (err) {
      failures.push(`downloads (${digital.map((d) => d.id).join(", ")}): ${err.message}`);
    }
  }

  for (const [providerKey, group] of byProvider) {
    try {
      await createPrintifyOrder({ session, providerKey, lines: group });
    } catch (err) {
      failures.push(`printify ${providerKey} (${group.map((l) => l.item.id).join(", ")}): ${err.message}`);
    }
  }

  if (failures.length) {
    // Log loudly (visible in Netlify's function log) but still ack Stripe —
    // otherwise Stripe will keep retrying a payment that already succeeded.
    // A failure here means a paying customer with no fulfilment yet, so this
    // log is where to look first if someone emails asking "where's my order?"
    console.error(`Fulfilment problems on session ${session.id}:\n  ` + failures.join("\n  "));
  } else {
    console.log(`Fulfilled ${session.id}: ${digital.length} download(s), ${byProvider.size} parcel(s)`);
  }

  return new Response("ok", { status: 200 });
};

export const config = { path: "/api/stripe-webhook" };
