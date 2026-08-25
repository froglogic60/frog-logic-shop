// Move the stickers from 4" to 3".
//
// Sticky Products Europe charge £5.46 to make the 4" sticker the shop has been
// selling at £3.50. That is £1.96 lost on every single one, before postage is
// even argued about — the only product in the shop that loses money by being
// bought. The 3" variant off the same blueprint, from the same maker, on the
// same artwork, costs £2.79. At £3.50 that is 71p to the good instead.
//
// The sweep in sticker-makers.js checked the alternatives first: there is no UK
// sticker maker on Printify at all, and no maker cheaper than this one at 4".
// Size was the only lever left.
//
//   node resize-stickers.js          say what it would do, change nothing
//   APPLY=1 node resize-stickers.js  do it
//
// Nothing is redrawn. Printify stores placeholder images as fractions of the
// print area, not pixels, so the same artwork re-lays itself onto the smaller
// square. The script copies each product's existing placeholders across rather
// than rebuilding them, so whatever position and scale were set stay set.
const fs = require("fs");
const path = require("path");

const KEY = process.env.PRINTIFY_API_KEY;
let SHOP = process.env.PRINTIFY_SHOP_ID;
if (!KEY) { console.error("PRINTIFY_API_KEY is not set"); process.exit(1); }

const APPLY = !!process.env.APPLY;

const CATALOG = path.join(__dirname, "../../netlify/functions/catalog.json");

// From sticker-makers.js, which read these costs off real products because
// Printify's catalogue will not report a base cost any other way.
const FROM_VARIANT = 92315;   // 4" x 4" / 1 pc / Matte — £5.46
const TO_VARIANT = 92314;     // 3" x 3" / 1 pc / Matte — £2.79
const EXPECT_COST = 279;      // pence, checked against the live product after the change

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const GAP_MS = 200;
let lastCall = 0;

async function api(p, method = "GET", body) {
  for (let attempt = 0; ; attempt++) {
    const wait = lastCall + GAP_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastCall = Date.now();
    const r = await fetch("https://api.printify.com/v1" + p, {
      method,
      headers: { Authorization: "Bearer " + KEY, "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (r.ok) {
      const text = await r.text();
      return text ? JSON.parse(text) : {};
    }
    if ((r.status === 429 || r.status >= 500) && attempt < 5) {
      const retryAfter = Number(r.headers.get("retry-after"));
      const backoff = retryAfter > 0 ? retryAfter * 1000 : Math.min(30000, 2000 * Math.pow(2, attempt));
      console.log(`   ${r.status} on ${p} — waiting ${Math.round(backoff / 1000)}s`);
      await sleep(backoff);
      continue;
    }
    throw new Error(method + " " + p + " -> " + r.status + " " + (await r.text()).slice(0, 900));
  }
}

const gbp = (p) => (p == null ? "?" : "£" + (p / 100).toFixed(2));

(async () => {
  if (!SHOP) {
    const shops = await api("/shops.json");
    if (!shops.length) { console.error("No shops on this Printify account"); process.exit(1); }
    SHOP = shops[0].id;
    console.log("auto-detected shop:", shops[0].title, "(id " + SHOP + ")");
  }

  const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
  const stickers = catalog.filter(
    (x) => x.type === "physical" && x.printifyProductId && x.printifyVariantId === FROM_VARIANT
  );

  if (!stickers.length) {
    console.log(`Nothing on variant ${FROM_VARIANT}. Already moved, or moved by hand.`);
    return;
  }

  console.log(`${stickers.length} sticker(s) on the 4" variant\n`);
  console.log(APPLY ? "APPLYING\n" : "DRY RUN — nothing will be changed. Set APPLY=1 to do it.\n");

  const problems = [];
  let changed = 0;

  for (const item of stickers) {
    const label = `${item.id} (${item.name})`;
    let product;
    try {
      product = await api(`/shops/${SHOP}/products/${item.printifyProductId}.json`);
    } catch (e) {
      problems.push(`${label}: could not read the product — ${e.message.slice(0, 90)}`);
      continue;
    }

    const target = (product.variants || []).find((v) => v.id === TO_VARIANT);
    if (!target) {
      problems.push(`${label}: this product has no 3" variant — different blueprint?`);
      continue;
    }
    const current = (product.variants || []).filter((v) => v.is_enabled);
    const retail = current.length ? current[0].price : Math.round(item.price * 100);

    // The artwork, exactly as it sits on the 4" square. Copied rather than
    // rebuilt: these coordinates are fractions of the print area, so they carry
    // over to a smaller square unchanged, and anything hand-nudged stays put.
    const area = (product.print_areas || []).find((a) =>
      (a.variant_ids || []).includes(FROM_VARIANT)
    ) || (product.print_areas || [])[0];
    if (!area || !area.placeholders || !area.placeholders.length) {
      problems.push(`${label}: no print area to copy — refusing to publish a blank sticker`);
      continue;
    }
    const images = area.placeholders.flatMap((p) => p.images || []);
    if (!images.length) {
      problems.push(`${label}: the print area has no artwork on it`);
      continue;
    }

    console.log(
      label.padEnd(34) +
      `${gbp(retail)} retail  ·  ${current.length} variant(s) live  ·  ` +
      `cost ${gbp(current[0] && current[0].cost)} -> ${gbp(target.cost)}`
    );

    if (target.cost !== EXPECT_COST) {
      // Printify raised prices on 27 August. If the 3" cost has moved since the
      // sweep, stop and say so rather than quietly switching to a number nobody
      // has looked at.
      problems.push(`${label}: 3" costs ${gbp(target.cost)}, expected ${gbp(EXPECT_COST)} — prices moved, check before applying`);
      continue;
    }

    if (!APPLY) { changed++; continue; }

    try {
      // Every variant on the product, not just the one being switched on.
      // Sending the single new variant alone is rejected as a validation error:
      // Printify wants the whole set so it can see what is being turned off as
      // well as what is being turned on.
      const allVariants = (product.variants || []).map((v) => ({
        id: v.id,
        price: v.id === TO_VARIANT ? retail : v.price,
        is_enabled: v.id === TO_VARIANT,
      }));
      await api(`/shops/${SHOP}/products/${item.printifyProductId}.json`, "PUT", {
        variants: allVariants,
        print_areas: [{
          variant_ids: [TO_VARIANT],
          // Only the placeholders that actually carry artwork. These products
          // have a second, empty placeholder (the sticker's back), and Printify
          // rejects the whole update with "placeholders.1.images is required"
          // rather than ignoring an empty one.
          placeholders: area.placeholders
            .filter((p) => (p.images || []).length)
            .map((p) => ({ position: p.position, images: p.images })),
        }],
      });
    } catch (e) {
      problems.push(`${label}: update refused — ${e.message.slice(0, 600)}`);
      continue;
    }

    // Read it back. A 200 from an update is not proof the variant took.
    const after = await api(`/shops/${SHOP}/products/${item.printifyProductId}.json`);
    const live = (after.variants || []).filter((v) => v.is_enabled);
    if (live.length !== 1 || live[0].id !== TO_VARIANT) {
      problems.push(`${label}: after the update, live variants are ${live.map((v) => v.id).join(",") || "none"}`);
      continue;
    }
    const stillHasArt = (after.print_areas || []).some((a) =>
      (a.variant_ids || []).includes(TO_VARIANT) &&
      (a.placeholders || []).some((p) => (p.images || []).length)
    );
    if (!stillHasArt) {
      problems.push(`${label}: the 3" variant has no artwork on it after the update`);
      continue;
    }

    item.printifyVariantId = TO_VARIANT;
    changed++;
    console.log(`   moved · cost ${gbp(live[0].cost)} · margin ${gbp(retail - live[0].cost)} before postage`);
  }

  if (problems.length) {
    console.log(`\n${problems.length} problem(s):`);
    problems.forEach((p) => console.log("  ! " + p));
  }

  if (!APPLY) {
    console.log(`\nwould move ${changed} of ${stickers.length}. Nothing written.`);
    if (problems.length) process.exit(1);
    return;
  }

  // All or nothing on the catalogue. A half-updated catalog.json would have the
  // checkout ordering a 4" variant that is no longer enabled on the product,
  // which fails at fulfilment — after the customer has paid.
  if (changed !== stickers.length) {
    console.error(`\nREFUSING TO WRITE — moved ${changed} of ${stickers.length}. Fix the problems above and run again; the ones already moved will be skipped.`);
    process.exit(1);
  }

  fs.writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + "\n");
  console.log(`\nwrote ${changed} sticker(s) onto variant ${TO_VARIANT} in catalog.json`);
})().catch((e) => { console.error(e); process.exit(1); });
