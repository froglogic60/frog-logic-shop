// Swap the artwork on products that already exist, keeping everything else.
//
// Written 8 Nov 2026 when Sam spotted the words sitting too low on the
// "Open Tabs Have Open Tabs" tee. The fixed PNG goes into artwork/frogs/ under
// the same name, then this uploads it and puts it in place of the old image on
// each listed product, at the SAME position, scale and angle. Variants, prices,
// titles and tags are not touched.
//
//   ART=open-tabs-have-open-tabs.png PRODUCTS="main:abc,29335686:def" DRY_RUN=1 node printify-swap-art.js
//
// PRODUCTS is a comma list of shop:productId. "main" means the website's shop
// (PRINTIFY_SHOP_ID). PUBLISH=1 pushes the new photos to Etsy for products in
// an Etsy-linked shop, IMAGES ONLY: shipping_template stays false so Printify
// does not rewrite the UK-only / US-only delivery profiles.
const KEY = process.env.PRINTIFY_API_KEY;
const MAIN = process.env.PRINTIFY_SHOP_ID;
const ART = process.env.ART;
const DRY = process.env.DRY_RUN === "1";
const PUBLISH = process.env.PUBLISH === "1";
if (!KEY || !ART || !process.env.PRODUCTS) { console.error("Need PRINTIFY_API_KEY, ART and PRODUCTS"); process.exit(1); }
const RAW = "https://raw.githubusercontent.com/froglogic60/frog-logic-shop/main/artwork/frogs/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(p, method = "GET", body) {
  for (let attempt = 0; ; attempt++) {
    const r = await fetch("https://api.printify.com/v1" + p, {
      method,
      headers: { Authorization: "Bearer " + KEY, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (r.ok) return r.status === 204 ? {} : r.json();
    if ((r.status === 429 || r.status >= 500) && attempt < 5) { await sleep(3000 * (attempt + 1)); continue; }
    throw new Error(method + " " + p + " -> " + r.status + " " + (await r.text()).slice(0, 300));
  }
}

(async () => {
  const list = process.env.PRODUCTS.split(",").map((s) => s.trim()).filter(Boolean).map((s) => {
    const [shop, id] = s.split(":");
    return { shop: shop === "main" ? MAIN : shop, id };
  });
  let newId = null;
  if (!DRY) {
    const up = await api("/uploads/images.json", "POST", { file_name: ART, url: RAW + ART + "?v=" + Date.now() });
    newId = up.id;
    console.log(`uploaded ${ART} -> ${newId} (${up.width}x${up.height})`);
  }
  let failed = 0;
  for (const { shop, id } of list) {
    try {
      const p = await api(`/shops/${shop}/products/${id}.json`);
      const old = new Set();
      const print_areas = p.print_areas.map((a) => ({
        variant_ids: a.variant_ids,
        placeholders: a.placeholders.map((ph) => ({
          position: ph.position,
          images: ph.images.map((im) => { old.add(im.id); return { id: newId || im.id, x: im.x, y: im.y, scale: im.scale, angle: im.angle }; }),
        })),
      }));
      const place = p.print_areas[0].placeholders[0].images[0] || {};
      console.log(`${shop}/${id} "${p.title}": old image(s) ${[...old].join(", ")}, x ${place.x} y ${place.y} scale ${place.scale}, ${p.visible ? "visible" : "hidden"}`);
      if (DRY) continue;
      await api(`/shops/${shop}/products/${id}.json`, "PUT", { print_areas });
      console.log("   artwork swapped");
      if (PUBLISH && shop !== MAIN) {
        await sleep(45000); // let Printify redraw the mockups first
        await api(`/shops/${shop}/products/${id}/publish.json`, "POST", {
          title: false, description: false, images: true, variants: false, tags: false, keyFeatures: false, shipping_template: false,
        });
        console.log("   new photos pushed to Etsy (images only)");
        await sleep(5000);
      }
    } catch (e) { failed++; console.error(`   FAILED ${shop}/${id}: ${e.message}`); }
  }
  if (DRY) console.log("\nDRY_RUN: nothing changed.");
  if (failed) process.exit(1);
})();
