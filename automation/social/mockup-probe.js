// Read-only question, answered once: can the Printify API choose which mockups
// go to Etsy, or is that a Printify-website-only step?
//
// Why: printify-etsy.js published 82 listings on 15 Oct 2026 with one photo
// each. They were fixed by hand in Printify's mockup library. Before changing
// the builder, check what the API actually reports and accepts instead of
// guessing.
//
// 1. Reads a tee already fixed by hand (10 mockups chosen) and prints how its
//    images are described.
// 2. Makes a throwaway copy in the Etsy store (never published), tries to
//    choose mockups on it through the API, re-reads it, then deletes it.
// Nothing reaches Etsy.
const KEY = process.env.PRINTIFY_API_KEY;
if (!KEY) { console.error("Missing PRINTIFY_API_KEY"); process.exit(1); }
const FIXED_TEE = "6ad0aeb4acc7ef505107dadc";

async function api(p, method = "GET", body) {
  const r = await fetch("https://api.printify.com/v1" + p, {
    method, headers: { Authorization: "Bearer " + KEY, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  if (!r.ok) throw new Error(method + " " + p + " -> " + r.status + " " + text.slice(0, 500));
  return text ? JSON.parse(text) : {};
}

function describe(label, prod) {
  const imgs = prod.images || [];
  const keys = [...new Set(imgs.flatMap((i) => Object.keys(i)))];
  const flags = {};
  for (const k of keys) {
    const vals = imgs.map((i) => i[k]);
    if (vals.every((v) => typeof v === "boolean" || v == null)) flags[k] = vals.filter((v) => v === true).length;
  }
  console.log(`\n== ${label}: ${imgs.length} images`);
  console.log("keys:", keys.join(", "));
  console.log("true counts:", JSON.stringify(flags));
  const seen = new Set();
  for (const i of imgs) {
    const name = String(i.src || "").split("camera_label=")[1]?.split("&")[0] || String(i.src || "").slice(-60);
    if (seen.has(name)) continue;
    seen.add(name);
    console.log("  ", JSON.stringify({ ...i, src: name, variant_ids: (i.variant_ids || []).length }));
    if (seen.size >= 25) break;
  }
}

(async () => {
  const shops = await api("/shops.json");
  const etsy = shops.find((s) => /etsy/i.test(s.sales_channel || ""));
  console.log("stores:", shops.map((s) => `${s.id} ${s.title} [${s.sales_channel}]`).join(" | "));
  if (!etsy) throw new Error("no Etsy store");

  const fixed = await api(`/shops/${etsy.id}/products/${FIXED_TEE}.json`);
  describe("hand-fixed tee " + FIXED_TEE, fixed);

  let probe = null;
  try {
    const ids = fixed.variants.filter((v) => v.is_enabled).map((v) => v.id);
    probe = await api(`/shops/${etsy.id}/products.json`, "POST", {
      title: "MOCKUP PROBE — delete me",
      description: "Temporary test product. Never published. Safe to delete.",
      blueprint_id: fixed.blueprint_id,
      print_provider_id: fixed.print_provider_id,
      variants: ids.map((id) => ({ id, price: 9999, is_enabled: true })),
      print_areas: fixed.print_areas.map((a) => ({
        variant_ids: a.variant_ids.filter((id) => ids.includes(id)),
        placeholders: a.placeholders.filter((ph) => (ph.images || []).length).map((ph) => ({
          position: ph.position,
          images: ph.images.map((im) => ({ id: im.id, x: im.x, y: im.y, scale: im.scale, angle: im.angle || 0 })),
        })),
      })).filter((a) => a.variant_ids.length && a.placeholders.length),
    });
    // Mockups render a moment after creation.
    await new Promise((r) => setTimeout(r, 15000));
    const fresh = await api(`/shops/${etsy.id}/products/${probe.id}.json`);
    describe("new throwaway copy (as the builder leaves it)", fresh);

    // Try choosing the same camera views the hand-fixed tee has.
    const chosen = new Set((fixed.images || []).filter((i) => i.is_selected_for_publishing).map((i) => String(i.src).split("camera_label=")[1]?.split("&")[0]));
    console.log("\nhand-fixed tee's chosen views:", [...chosen].join(", ") || "(none reported)");
    const want = (fresh.images || []).map((i) => ({ ...i, is_selected_for_publishing: chosen.has(String(i.src).split("camera_label=")[1]?.split("&")[0]) }));
    try {
      const put = await api(`/shops/${etsy.id}/products/${probe.id}.json`, "PUT", { images: want });
      console.log("\nPUT images accepted (status ok)");
      describe("PUT response", put);
    } catch (e) {
      console.log("\nPUT images REFUSED:", e.message);
    }
    const after = await api(`/shops/${etsy.id}/products/${probe.id}.json`);
    describe("throwaway after PUT (re-read)", after);
  } finally {
    if (probe) {
      try { await api(`/shops/${etsy.id}/products/${probe.id}.json`, "DELETE"); console.log("\nthrowaway deleted:", probe.id); }
      catch (e) { console.log("\nNOT DELETED — delete by hand:", probe.id, e.message); }
    }
  }
})().catch((e) => { console.error(e); process.exit(1); });
