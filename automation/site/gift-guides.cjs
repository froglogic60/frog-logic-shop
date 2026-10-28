// Christmas gift guides (27 Oct 2026, Sam: "yes do 1 and 3").
//
// People search "ADHD gifts", "gifts for autistic adults", "neurodivergent
// stocking fillers" in November and December. Before this the shop had no page
// that answered those searches: every product had its own page, but nothing
// gathered them under the words people actually type. Each guide here is a
// hand-picked list of pieces already on sale, built from the same page list as
// the product pages, so names, prices and links can never drift from the shop.
//
// Called by build-pages.cjs after the product pages are written. Writes
// /p/<slug>/index.html for each guide and returns sitemap entries. A pick that
// no longer exists (retired, renamed) is skipped, and a guide left with fewer
// than MIN pieces fails the build loudly rather than going up half-empty.

const fs = require("fs");
const path = require("path");

const MIN = 6;
const ORDER_BY = "Order printed pieces by <strong>Thursday 10 December</strong> for UK delivery before Christmas (<strong>Monday 7 December</strong> for the US). Everything is made to order. Printable downloads arrive by email straight away, right up to Christmas Eve.";
const FREE_POST = new Set(["Tee", "Mug"]);

const GUIDES = [
  {
    slug: "adhd-gifts",
    title: "ADHD gifts UK — funny, kind tees, mugs and prints for someone with ADHD",
    h1: "Gifts for someone with ADHD",
    description: "ADHD gifts that get it: tees, mugs, prints and totes about time blindness, hyperfocus, object permanence and 47 tabs open. Made to order in the UK, free UK post on tees and mugs.",
    intro: [
      "I'm Sam, I'm neurodivergent, and I run Frog Logic from my lounge. These are about the bits of ADHD that are hard to explain and easy to laugh at once you've lived them: the mug for the 47 things at once, the tee for being time blind, the print for the list that exists while the doing doesn't.",
      "Nothing here is a joke at their expense. It's the kind of gift that says \"I see how your brain works, and I like it\".",
    ],
    picks: [
      "47 Things at Once|Mug", "Time Blind|Tee", "Brain Full of Tabs|Tee", "Object Permanence|Mug", "Hyperfocused|Tote",
      "Executive Dysfunction|Wall print", "Decision Paralysis|Wall print", "Low Battery|Mug", "Chaos Gremlin|Mug",
      "Neurospicy|Tee", "Snacks and Spite|Mug", "Waiting Mode|Wall print", "Regulation: Loading|Notebook",
    ],
  },
  {
    slug: "autism-gifts-for-adults",
    title: "Gifts for autistic adults UK — tees, mugs and prints that celebrate autistic joy",
    h1: "Gifts for autistic adults",
    description: "Autism gifts for grown-ups, in the words autistic people use for themselves: special interests, info dumps, parallel play, comfort rewatches. Made to order in the UK.",
    intro: [
      "I'm Sam, I'm neurodivergent, and I run Frog Logic from my lounge. Most autism gifts are puzzle pieces and slogans written by people looking in from outside. These use the words autistic people use for themselves: special interest, info dump, monotropic, parallel play.",
      "Good for the friend who just got a late diagnosis, the partner who'd rather you sat next to them than made small talk, or anyone whose joy is unreasonably big about very small things.",
    ],
    picks: [
      "Info Dump Incoming|Wall print", "Special Interest|Water bottle", "Parallel Play|Tee", "Autistic Joy|Wall print",
      "Late Diagnosed|Tee", "Comfort Rewatch|Mug", "Ask Me About It|Tee", "Monotropic|Tote",
      "Shared Interest, Not Small Talk|Mug", "No Idea What My Face Is Doing|Tee", "In Writing, Please|Tee",
      "I Notice Everything|Tote", "Comfort Creature|Tee", "Unreasonably Delighted|Wall print",
    ],
  },
  {
    slug: "gifts-for-sen-parents",
    title: "Gifts for SEN parents and carers — kind mugs, prints and notebooks for the ones holding it all",
    h1: "Gifts for SEN parents and carers",
    description: "Gifts for parents and carers of autistic, ADHD and disabled children: mugs, prints, tees and notebooks that say what nobody else does. Made to order in the UK.",
    intro: [
      "I'm Sam, I'm neurodivergent, and I run Frog Logic from my lounge. This range is for the people who go to every appointment, fill in every form, and learn one person's language fluently with no qualification for it.",
      "Every appointment is about the child, as it should be. These are for the parent: a mug that says twenty minutes counts, a notebook that says you're allowed to find it hard.",
    ],
    picks: [
      "You're Allowed To Find It Hard|Notebook", "Twenty Minutes Counts|Mug", "Nobody Asked How You Were|Wall print",
      "I Learned Their Language|Tote", "Guilt Is Not Evidence|Tee", "Recovery Is Part Of The Plan|Wall print",
      "A Different Route|Wall print", "Asking Is Not Failing|Notebook", "I Accommodated You First|Wall print",
      "Neurodivergent Household|Wall print", "Low Battery|Mug",
    ],
    extra: "Want something for the people around their child too? <a href=\"/#guides\">The Pond Guides</a> are free plain-English guides to autism, ADHD, PDA and more, written to be handed to grandparents, teachers and the other parent.",
  },
  {
    slug: "neurodivergent-stocking-fillers",
    title: "Neurodivergent stocking fillers under £15 — ADHD and autism mugs, notebooks and prints",
    h1: "Neurodivergent stocking fillers under £15",
    description: "Stocking fillers for ADHD, autistic and AuDHD friends and family: £13.50 mugs with free UK post, £13 notebooks, £12 prints and £3 printable Christmas cards.",
    intro: [
      "I'm Sam, I'm neurodivergent, and I run Frog Logic from my lounge. Everything here is £15 or less. Mugs post free in the UK; notebooks and prints show their postage before you pay.",
      "The printable Christmas cards are £3 for three designs, and arrive by email straight away, so they still work on Christmas Eve.",
    ],
    under: 15,
    picks: [
      "47 Things at Once|Mug", "Object Permanence|Mug", "Low Battery|Mug", "Chaos Gremlin|Mug", "Comfort Rewatch|Mug",
      "Interoception|Mug", "Snacks and Spite|Mug", "Twenty Minutes Counts|Mug", "Shutdown Mode|Notebook",
      "Functioning As Designed|Notebook", "Info Dump Incoming|Wall print", "Small Things, Enormous Joy|Wall print",
      "slug:christmas-cards", "slug:bright-christmas-cards", "slug:black-and-white-christmas-cards",
    ],
  },
  {
    slug: "neurodivergent-christmas-gifts",
    title: "Neurodivergent Christmas gifts — ADHD, autism and AuDHD gift ideas from a neurodivergent-run shop",
    h1: "Neurodivergent Christmas gifts",
    description: "Christmas gifts for ADHD, autistic and AuDHD people, picked by a neurodivergent shop owner: the Socially Hibernating frog set, tees, mugs, prints and £3 printable cards.",
    intro: [
      "I'm Sam, I'm neurodivergent, and I run Frog Logic from my lounge. Everything on the shop is written in the words we use for ourselves, and every piece carries a small frog.",
      "The Christmas frog has put on a Santa hat, got under a blanket and isn't coming out until January. He comes three ways, and they stay separate so you can pick the one that suits: the <a href=\"/#christmas\">originals</a>, <a href=\"/#christmas-bright\">bright colours</a>, or <a href=\"/#christmas-mono\">black and white</a>.",
    ],
    hub: true,
    picks: [
      "slug:christmas-set-uk", "slug:christmas-set-us", "Comfort Creature|Tee", "Brain Full of Tabs|Tee", "Low Battery|Mug",
      "Overstimulated|Tee", "Neurodivergent Household|Wall print", "Autistic Joy|Wall print", "Late Diagnosed|Tee",
      "slug:christmas-cards", "slug:bright-christmas-cards", "slug:black-and-white-christmas-cards",
    ],
  },
];

function build({ pages, shell, esc, attr, OUT, SITE, ownPhoto, kindOf, money, BUNDLES }) {
  const byKey = new Map();
  for (const p of pages) {
    byKey.set("slug:" + p.slug, p);
    if (p.item && p.item.num) byKey.set(`${p.item.word}|${kindOf(p.item.num)}`, p);
  }
  const setPrice = (p) => {
    const b = (BUNDLES || []).filter((x) => p.set.ids.includes(x.id)).map((x) => Number(x.price));
    return b.length ? Math.min(...b) : null;
  };
  const priceOf = (p) => (p.group === "xset" ? setPrice(p) : Number(money(p.item.price)));
  const label = (p) => {
    if (p.group === "xset") return p.set.where;
    if (p.group === "digital" || p.group === "bespoke") return "Printable download";
    return kindOf(p.item.num);
  };
  const priceText = (p) => {
    const n = priceOf(p);
    if (n == null) return "";
    if (p.group === "xset") return `from &pound;${n.toFixed(0)} &middot; delivery included`;
    const kind = kindOf(p.item.num || "");
    const tail = p.group === "digital" ? " &middot; instant download" : FREE_POST.has(kind) ? " &middot; free UK post" : " + postage";
    return `&pound;${n.toFixed(2)}${tail}`;
  };
  const nameOf = (p) => (p.group === "xset" ? p.set.h1 : p.item.word);
  const lineOf = (p) => (p.group === "xset" ? p.set.line : p.item.line || "");
  const pic = (p) => (p.photo ? `<img class="stage-photo" src="${attr(p.photo.src)}" alt="${attr(p.photo.alt || nameOf(p))}" loading="lazy">` : p.svg || "");

  const out = [];
  for (const g of GUIDES) {
    const items = [];
    for (const key of g.picks) {
      const p = byKey.get(key);
      if (!p) { console.log(`gift guide ${g.slug}: "${key}" is not on sale any more, skipped`); continue; }
      if (g.under && priceOf(p) > g.under) { console.log(`gift guide ${g.slug}: "${key}" is over £${g.under}, skipped`); continue; }
      if (!items.includes(p)) items.push(p);
    }
    if (items.length < MIN) throw new Error(`Gift guide ${g.slug} has only ${items.length} pieces left — update its picks in gift-guides.cjs`);

    const url = `${SITE}/p/${g.slug}/`;
    const first = items.find((p) => p.group === "physical") || items[0];
    const image = first.group === "xset" ? SITE + first.set.img : ownPhoto(first.slug, first.photo ? first.photo.src : `${SITE}/p/${first.slug}/og.png`);
    const others = GUIDES.filter((x) => x !== g);
    const cards = items.map((p) => `
      <a class="card related" href="/p/${p.slug}/">
        <div class="stage" style="background:${p.item && p.item.bg ? p.item.bg : "#F4EFE3"}">${pic(p)}</div>
        <div class="card-meta"><p class="card-num">${esc(label(p))}</p><h3>${esc(nameOf(p))}</h3><p class="card-line">${esc(lineOf(p))}</p><p class="card-price">${priceText(p)}</p></div>
      </a>`).join("");
    const body = `
<section class="collection product-page gift-guide" id="gift-guide">
  <div class="wrap">
    <p class="crumbs"><a href="/">Frog Logic</a> › <a href="/p/neurodivergent-christmas-gifts/">Gift guides</a> › ${esc(g.h1)}</p>
    <h1>${esc(g.h1)}</h1>
    ${g.intro.map((x) => `<p class="section-sub">${x}</p>`).join("\n    ")}
    <p class="section-sub xmas-dates">${ORDER_BY}</p>
    <div class="pad-grid related-grid">${cards}
    </div>
    ${g.extra ? `<p class="section-sub">${g.extra}</p>` : ""}
    <div class="product-about">
      <h2>More gift guides</h2>
      <p>${others.map((x) => `<a href="/p/${x.slug}/">${esc(x.h1)}</a>`).join(" &middot; ")}</p>
      <h2>Not sure what they'd like?</h2>
      <p>Send them <a href="/#guides">a free Pond Guide</a> instead: plain-English guides to autism, ADHD, AuDHD, PDA and more, no sign-up. Or <a href="/">see everything in the shop</a>.</p>
    </div>
  </div>
</section>`;
    const jsonld = {
      "@context": "https://schema.org", "@type": "CollectionPage", name: g.h1, description: g.description, url, inLanguage: "en-GB",
      isPartOf: { "@type": "WebSite", name: "Frog Logic", url: SITE },
      mainEntity: { "@type": "ItemList", numberOfItems: items.length,
        itemListElement: items.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/p/${p.slug}/`, name: nameOf(p) })) },
    };
    fs.mkdirSync(path.join(OUT, g.slug), { recursive: true });
    fs.writeFileSync(path.join(OUT, g.slug, "index.html"), shell({ title: g.title, description: g.description, url, image, imageAlt: g.h1, body, jsonld }));
    out.push({ slug: g.slug, group: "gift" });
    console.log(`gift guide ${g.slug}: ${items.length} pieces`);
  }
  return out;
}

module.exports = { build, GUIDES };
