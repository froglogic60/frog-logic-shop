// The Christmas sets' colours, sizes and prices, for christmas-set.js on the
// page. Read from the same bundles.json the checkout prices from, so the page
// can only offer what the till will accept. Printify ids are left out: the
// page doesn't need them.
import bundles from "./bundles.json";

export default async () =>
  new Response(JSON.stringify(bundles.map((b) => ({
    id: b.id, name: b.name, choice: b.choice, price: b.price, country: b.country,
    parts: b.parts.map((p) => ({ key: p.key, label: p.label, options: p.options.map((o) => ({ colour: o.colour, size: o.size })) })),
  }))), { status: 200, headers: { "content-type": "application/json", "cache-control": "public, max-age=300" } });

export const config = { path: "/api/sets" };
