// Socially Hibernating Christmas bundle (Sam, 16 Oct 2026).
//
//   US (made in the US, Printify Choice): Gildan Heavy Blend hoodie, Gildan
//      5000 tee, embroidered Classic Cuffed Beanie.
//   UK (made in the UK): Gildan Heavy Blend hoodie (Print Clever), Gildan 5000
//      tee (Shirt Monkey, same maker as the UK frog tees), Arctic fleece
//      blanket (Harrier). No UK maker does beanies, so the UK set swaps it for
//      the blanket (Sam: "Sherpa blanket for UK bundle", then "Arctic fleece
//      instead" when sherpa would have needed ~£70).
//
// Sold as six separate Etsy listings that read as a matching set — no bundle
// discount (Sam). Prices keep at least 25% on every size after making, Etsy
// fees with VAT, postage and a returns allowance (worked out 16 Oct 2026 with
// Printify's dollar costs at 0.78):
//   US hoodie £34 S–XL / £37 2XL, US tee £22, US beanie £22
//   UK hoodie £42 (Print Clever charges the same for 2XL), UK tee £19,
//   UK fleece £25 30x40 / £41 50x60
//
// Light garments (Sport Grey, Ash, White) carry the brown-text artwork; dark
// ones (Navy, Maroon) the cream-text version.
//
// Creates the products in the Printify Etsy store and does NOT publish them:
// the photos have to be chosen in Printify's mockup library first (the API
// can't), and every new Etsy delivery profile has to be checked (UK-only or
// US-only, in pounds, production partner attached). DRY_RUN=1 reports only.
// Writes xmas-bundle-result.json.
const fs = require("fs");
const path = require("path");

const KEY = process.env.PRINTIFY_API_KEY;
if (!KEY) { console.error("Missing PRINTIFY_API_KEY"); process.exit(1); }
const DRY = process.env.DRY_RUN === "1";
// REPRINT=1: on products that already exist, also replace the artwork and
// placement (only safe before photos are chosen in the mockup library).
const REPRINT = process.env.REPRINT === "1";
const OUT = path.join(__dirname, "xmas-bundle-result.json");
const RAW = "https://raw.githubusercontent.com/froglogic60/frog-logic-shop/main/artwork/frogs/";

const LIGHT = ["Sport Grey", "Ash", "White"];
const DARK = ["Navy", "Maroon"];
const SIZES = ["S", "M", "L", "XL", "2XL"];

const US_NOTE = "Made and shipped in the US, so there are no import fees.";
const UK_NOTE = "Printed to order in the UK and posted from there.";
const SET_US = "Part of the Socially Hibernating set: hoodie, tee and embroidered beanie. Each is listed on its own, so you can get one piece or the whole set.";
const SET_UK = "Part of the Socially Hibernating set: hoodie, tee and fleece blanket. Each is listed on its own, so you can get one piece or the whole set.";
const STORY = "The frog has put on a Santa hat, got under a blanket, tangled itself in the fairy lights, and is not coming out until January. For anyone who loves Christmas and also needs it to be quieter.";

const PRODUCTS = [
  {
    key: "us-hoodie", where: "us", blueprint: 77, provider: 99, position: "front",
    colours: [...LIGHT, ...DARK], sizes: SIZES,
    price: (size) => (size === "2XL" ? 3700 : 3400),
    title: "Socially Hibernating Christmas Frog Hoodie — Cute Frog in Santa Hat, Introvert Christmas Sweatshirt, Neurodivergent Gift, Ships from the US",
    description: [STORY, "A Gildan Heavy Blend hooded sweatshirt: soft, warm, unisex fit, with a front pouch pocket. The design is printed on the front.", SET_US, US_NOTE, "Sizes run unisex, so check the size chart in the photos."],
    tags: ["christmas hoodie", "frog hoodie", "introvert christmas", "cute frog gift", "santa frog", "neurodivergent gift", "adhd gift", "autism gift", "cozy christmas", "funny xmas hoodie", "frog lover gift", "socially hibernating", "holiday sweatshirt"],
  },
  {
    key: "us-tee", where: "us", blueprint: 6, provider: 99, position: "front",
    colours: [...LIGHT, ...DARK], sizes: SIZES,
    price: () => 2200,
    title: "Socially Hibernating Christmas Frog T-Shirt — Cute Frog in Santa Hat, Introvert Christmas Shirt, Neurodivergent Gift, Ships from the US",
    description: [STORY, "A Gildan Heavy Cotton tee: classic unisex fit, 100% cotton (heather colours are a cotton/poly blend). The design is printed on the front.", SET_US, US_NOTE],
    tags: ["christmas t-shirt", "frog shirt", "introvert christmas", "cute frog gift", "santa frog", "neurodivergent gift", "adhd gift", "autism gift", "funny xmas shirt", "frog lover gift", "socially hibernating", "holiday tee", "christmas frog"],
  },
  {
    key: "us-beanie", where: "us", blueprint: 1691, provider: 99, position: "front",
    colours: ["Black", "Dark Grey", "Navy"], sizes: null, art: { light: "socially-hibernating-beanie.png", dark: "socially-hibernating-beanie.png" },
    price: () => 2200,
    title: "Socially Hibernating Christmas Frog Beanie — Embroidered Cute Frog in Santa Hat, Cuffed Winter Hat, Neurodivergent Gift, Ships from the US",
    description: ["The sleepy Christmas frog from the Socially Hibernating set, embroidered on the cuff of a classic knit beanie: eyes shut, Santa hat on, not available until January.", "A Yupoong cuffed beanie, one size, embroidered rather than printed so it lasts.", SET_US, US_NOTE],
    tags: ["christmas beanie", "frog beanie", "embroidered beanie", "cute frog gift", "santa frog", "winter hat", "neurodivergent gift", "introvert gift", "stocking stuffer", "frog lover gift", "socially hibernating", "cuffed beanie", "christmas frog"],
  },
  {
    key: "uk-hoodie", where: "uk", blueprint: 77, provider: 72, position: "front",
    colours: [...LIGHT, ...DARK], sizes: SIZES,
    price: () => 4200,
    title: "Socially Hibernating Christmas Frog Hoodie — Cute Frog in Santa Hat, Introvert Christmas Jumper, Neurodivergent Gift, Made in the UK",
    description: [STORY, "A Gildan Heavy Blend hoodie: soft, warm, unisex fit, with a front pouch pocket. The design is printed on the front.", SET_UK, UK_NOTE, "Sizes run unisex, so check the size chart in the photos."],
    tags: ["christmas hoodie", "frog hoodie", "introvert christmas", "cute frog gift", "santa frog", "neurodivergent gift", "adhd gift", "autism gift", "cosy christmas", "christmas jumper", "frog lover gift", "socially hibernating", "uk made gift"],
  },
  {
    key: "uk-tee", where: "uk", blueprint: 6, provider: 331, position: "front",
    colours: [...LIGHT, ...DARK], sizes: SIZES,
    price: () => 1900,
    title: "Socially Hibernating Christmas Frog T-Shirt — Cute Frog in Santa Hat, Introvert Christmas Top, Neurodivergent Gift, Made in the UK",
    description: [STORY, "A Gildan Heavy Cotton tee: classic unisex fit, 100% cotton (heather colours are a cotton/poly blend). The design is printed on the front.", SET_UK, UK_NOTE],
    tags: ["christmas t-shirt", "frog t-shirt", "introvert christmas", "cute frog gift", "santa frog", "neurodivergent gift", "adhd gift", "autism gift", "christmas top", "frog lover gift", "socially hibernating", "uk made gift", "christmas frog"],
  },
  {
    key: "uk-blanket", where: "uk", blueprint: 1328, provider: 94, position: "front",
    colours: null, sizes: ["30'' × 40''", '50" × 60"'], art: { light: "socially-hibernating-blanket.png", dark: "socially-hibernating-blanket.png" }, cover: true,
    price: (size) => (/50/.test(size) ? 4100 : 2500),
    title: "Socially Hibernating Christmas Frog Fleece Blanket — Cute Frog in Santa Hat, Cosy Throw, Introvert Christmas Gift, Made in the UK",
    description: [STORY, "A soft Arctic fleece throw, printed edge to edge with the Socially Hibernating frog. Two sizes: 30 × 40 inches (lap or cot size) or 50 × 60 inches (sofa throw).", SET_UK, UK_NOTE],
    tags: ["fleece blanket", "frog blanket", "christmas blanket", "cosy throw", "cute frog gift", "santa frog", "introvert gift", "neurodivergent gift", "christmas gift", "frog lover gift", "socially hibernating", "sofa throw", "uk made gift"],
  },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function api(p, method = "GET", body) {
  for (let attempt = 0; ; attempt++) {
    const r = await fetch("https://api.printify.com/v1" + p, {
      method, headers: { Authorization: "Bearer " + KEY, "Content-Type": "application/json", "User-Agent": "frog-logic-bot/1.0" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (r.ok) return r.status === 204 ? {} : r.json();
    if ((r.status === 429 || r.status >= 500) && attempt < 5) { await sleep(2000 * 2 ** attempt); continue; }
    throw new Error(method + " " + p + " -> " + r.status + " " + (await r.text()).slice(0, 300));
  }
}

const opt = (v, i) => String(v.title).split("/").map((s) => s.trim())[i];

(async () => {
  const shops = await api("/shops.json");
  const etsy = shops.find((s) => /etsy/i.test(s.sales_channel || ""));
  if (!etsy) throw new Error("No Etsy store in Printify");
  const existing = new Map();
  for (let page = 1; page <= 20; page++) {
    const r = await api(`/shops/${etsy.id}/products.json?limit=50&page=${page}`);
    for (const p of r.data || []) existing.set(p.title, p);
    if ((r.data || []).length < 50) break;
  }

  const uploads = new Map();
  async function upload(file) {
    if (!uploads.has(file)) {
      const up = await api("/uploads/images.json", "POST", { file_name: file, url: RAW + file });
      console.log(`  uploaded ${file} (${up.width}x${up.height}) -> ${up.id}`);
      uploads.set(file, up);
    }
    return uploads.get(file);
  }

  const results = [], errors = [];
  for (const spec of PRODUCTS) {
    console.log(`\n${spec.key}: ${spec.title.split(" —")[0]}`);
    try {
      const vres = await api(`/catalog/blueprints/${spec.blueprint}/print_providers/${spec.provider}/variants.json`);
      const all = vres.variants || [];
      // Match colour and size from the variant title, whatever order Printify uses.
      let picked = all.filter((v) => {
        const parts = String(v.title).split("/").map((s) => s.trim());
        const okC = !spec.colours || spec.colours.some((c) => parts.includes(c));
        const okS = !spec.sizes || spec.sizes.some((s) => parts.includes(s));
        return okC && okS;
      });
      // Printify lists some colours twice under one name (US "Ash" on 16 Oct
      // 2026: two blanks, both titled "Ash / S" ...). Etsy can't show two
      // identical options, so keep the first of each title.
      { const seen = new Set(); for (let i = picked.length - 1; i >= 0; i--) {} 
        const uniq = []; for (const v of picked) { if (!seen.has(v.title)) { seen.add(v.title); uniq.push(v); } }
        if (uniq.length !== picked.length) console.log(`  dropped ${picked.length - uniq.length} duplicate-named variant(s)`);
        picked.length = 0; picked.push(...uniq); }
      const found = (list, partsOf) => list.filter((x) => !picked.some((v) => String(v.title).split("/").map((s) => s.trim()).includes(x)));
      const missingC = spec.colours ? found(spec.colours) : [];
      const missingS = spec.sizes ? found(spec.sizes) : [];
      if (missingC.length || missingS.length) console.log(`  NOTE missing from this maker: ${[...missingC, ...missingS].join(", ")}`);
      if (!picked.length) throw new Error("no matching variants");
      const phOf = (v) => (v.placeholders || []).find((p) => p.position === spec.position);
      if (picked.some((v) => !phOf(v))) throw new Error(`a variant has no ${spec.position} print area`);
      const dims = [...new Set(picked.map((v) => `${phOf(v).width}x${phOf(v).height}`))];
      console.log(`  ${picked.length} variants, ${spec.position} print area ${dims.join(" / ")}`);
      const ph = phOf(picked[0]);
      const priced = picked.map((v) => {
        const parts = String(v.title).split("/").map((s) => s.trim());
        const size = spec.sizes ? spec.sizes.find((s) => parts.includes(s)) : null;
        const colour = spec.colours ? spec.colours.find((c) => parts.includes(c)) : null;
        return { id: v.id, title: v.title, colour, size, price: spec.price(size || ""), dark: colour ? DARK.includes(colour) : false, ph: phOf(v) };
      });
      if (DRY) {
        const byPrice = {};
        for (const v of priced) (byPrice[v.price] = byPrice[v.price] || []).push(v.size || v.title);
        console.log(`  would ${existing.has(spec.title) ? "update" : "create"}; prices: ${Object.entries(byPrice).map(([p, s]) => `£${(p / 100).toFixed(2)} (${[...new Set(s)].join(", ")})`).join("; ")}`);
        console.log(`  variants: ${priced.map((v) => v.title).join(" | ")}`);
        results.push({ key: spec.key, dry: true, variants: priced.length, titles: priced.map((v) => v.title), printAreas: dims });
        continue;
      }

      const art = spec.art || { light: "socially-hibernating-tight.png", dark: "socially-hibernating-dark-tight.png" };
      const areas = [];
      for (const tone of ["light", "dark"]) {
        const group = priced.filter((v) => (tone === "dark") === v.dark);
        if (!group.length) continue;
        const img = await upload(art[tone]);
        const ratio = img.height / img.width;
        if (spec.cover) {
          // Edge-to-edge art (the blanket): each size has its own print area,
          // so each gets the scale that covers it with no gaps.
          const bySize = new Map();
          for (const v of group) { const k = `${v.ph.width}x${v.ph.height}`; (bySize.get(k) || bySize.set(k, []).get(k)).push(v); }
          for (const [, vs] of bySize) {
            const scale = Math.max(1, (vs[0].ph.height / vs[0].ph.width) / ratio);
            areas.push({ variant_ids: vs.map((v) => v.id), placeholders: [{ position: spec.position, images: [{ id: img.id, x: 0.5, y: 0.5, scale, angle: 0 }] }] });
          }
        } else {
          // Square garment art: one scale that fits the tightest size's area.
          const tight = Math.min(...group.map((v) => v.ph.height / v.ph.width));
          // Hoodies: fill the short print area's height. Tees: 75% (a full-height
          // tee print would run from collar to hem). First mockups, 16 Oct 2026,
          // showed the hoodie print far too small with untrimmed art at 90%.
          const share = spec.key.includes("tee") ? 0.75 : 1;
          const scale = Math.min(1, tight / ratio) * share;
          areas.push({ variant_ids: group.map((v) => v.id), placeholders: [{ position: spec.position, images: [{ id: img.id, x: 0.5, y: 0.5, scale, angle: 0 }] }] });
        }
      }
      const payload = {
        title: spec.title,
        description: spec.description.map((p) => `<p>${p}</p>`).join(""),
        tags: spec.tags,
        blueprint_id: spec.blueprint,
        print_provider_id: spec.provider,
        variants: priced.map((v) => ({ id: v.id, price: v.price, is_enabled: true })),
        print_areas: areas,
      };
      const already = existing.get(spec.title);
      if (already) {
        // Already built: only the prices are brought up to date (artwork and
        // words are left as they are, so chosen photos aren't disturbed).
        const update = { variants: priced.map((v) => ({ id: v.id, price: v.price, is_enabled: true })) };
        if (REPRINT) update.print_areas = areas;
        await api(`/shops/${etsy.id}/products/${already.id}.json`, "PUT", update);
        const fresh = await api(`/shops/${etsy.id}/products/${already.id}.json`);
        const vs = (fresh.variants || []).filter((v) => v.is_enabled).map((v) => ({ title: v.title, price: v.price, costUsdCents: v.cost }));
        console.log(`  exists (${already.id}) — prices${REPRINT ? " and artwork" : ""} updated`);
        results.push({ key: spec.key, where: spec.where, title: spec.title, printifyProductId: already.id, existed: true, variants: vs,
          mockupLibrary: `https://printify.com/app/mockup-library/shops/${etsy.id}/products/${already.id}` });
        continue;
      }
      const prod = await api(`/shops/${etsy.id}/products.json`, "POST", payload);
      await sleep(1500);
      const fresh = await api(`/shops/${etsy.id}/products/${prod.id}.json`);
      const costs = (fresh.variants || []).filter((v) => v.is_enabled).map((v) => [v.title, v.price, v.cost]);
      console.log(`  created ${prod.id}`);
      results.push({
        key: spec.key, where: spec.where, title: spec.title, printifyProductId: prod.id, printAreas: dims,
        variants: costs.map(([t, p, c]) => ({ title: t, price: p, costUsdCents: c })),
        mockupLibrary: `https://printify.com/app/mockup-library/shops/${etsy.id}/products/${prod.id}`,
      });
    } catch (e) {
      console.log(`  FAILED: ${e.message}`);
      errors.push({ key: spec.key, error: e.message });
    }
  }
  fs.writeFileSync(OUT, JSON.stringify({ ranAt: new Date().toISOString(), dryRun: DRY, etsyStore: etsy.id, results, errors }, null, 2) + "\n");
  console.log(`\n${DRY ? "DRY RUN — " : ""}${results.length} ok, ${errors.length} failed`);
  if (errors.length) process.exit(1);
})().catch((e) => { console.error(e); process.exit(1); });
