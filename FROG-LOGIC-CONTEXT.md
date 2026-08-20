# Frog Logic — start here

Single orientation file for any new Claude session. Read this first; it should
be enough to start work without opening twenty other files. Keep it current —
when a decision changes, edit the line here rather than leaving it to be
rediscovered.

Last updated: 20 August 2026.

## Where everything lives (on Sam's PC, device "jay")

- `Downloads\Printify-Designer` — the main Replit store codebase.
- `Downloads\frog-logic-shop` — **the current feelings-collection static site.
  This is the one to work in.** Read on for why.
- `OneDrive\Desktop\Frog Logic` — brand assets, social exports and the business
  plan. The digital-product PDFs that used to live only here have now been
  folded into `frog-logic-shop`'s Digital section (see below) — don't treat
  the Desktop copies as the current version, the site's covers and copy have
  since been redone to match.
- **Ignore everything else Frog-Logic-shaped in `Downloads`.** There's a long
  trail of earlier attempts and exports cluttering that folder root —
  `frog-logic-shop_3` through `_10`, a dozen numbered `.zip`s, loose
  `index.html` / `index_1.html` / `preview*.html` files, `files.zip`. All
  superseded. `frog-logic-shop` (no suffix) is the merge of the best of that
  trail and is what actually matters. Worth deleting the rest next time you're
  in there — a session in future may otherwise repeat the same "wait, which
  version is real?" investigation this one did on 20 Aug.

---

## The business

- Frog Logic — one-person print-on-demand shop run by Sammie, Tonbridge, Kent.
- Live store: **froglogic.co.uk**, ~136 products, built on Replit + Printify + Stripe.
- Audience: neurodivergent people. Tagline territory: *soft landings for busy brains*.
- Voice is first person singular. **"I", never "we"** — it's one person, not a team.
- Contact/from address: hello@froglogic.co.uk (display name "Sammie @ Frog Logic").

## The label rule (refined 13 Aug — read this version, not an older one)

- Diagnostic labels (ADHD, autism, anxiety…) appear **only** in two places:
  Sammie's own story (About page, personal emails), and the **Pond Guides** —
  a dedicated reference section, one guide per neurotype, explicitly framed as
  something to hand to a relative, partner or manager. Every guide says up
  front whether that condition is contested ground.
- **Everywhere else — product names, product copy, the questionnaire,
  newsletter, social — feelings only, never the diagnosis.** "Overstimulated",
  "Touched Out", "Low Spoons Today", not the underlying condition.
- Labels stay in **backend tags** for search and discoverability regardless.

## Standing content rules

- Social mix: 40% relatable memes/quotes, 30% product showcases, 20%
  educational/community, 10% behind-the-scenes. Encoded in `planWeekTypes`.
- Everything runs from the PC. No phone-based workflows — when suggesting a
  routine, give the desktop/browser route.
- Conversion UI uses honest signals only. No invented reviews or testimonials.
- Nothing for the neurodivergent product line goes to the Replit agent.

---

## The two codebases

### 1. `Printify-Designer` — the main store (Replit)

The real shop behind froglogic.co.uk. Internally called PRINT.AI.

- pnpm monorepo, Node 24, TS 5.9. Express 5 API on :8080, React+Vite storefront,
  PostgreSQL + Drizzle, OpenAPI → Orval codegen, Printify for fulfilment.
- **Read `replit.md` for run commands, env vars, architecture and gotchas.**
- **Read `.agents/memory/MEMORY.md`** — a one-line index of ~77 topic notes in
  the same folder. Don't read them all; read the index, then only the notes
  matching the task.
- Hard rules worth knowing before touching anything: UK/EU print providers only;
  a variants-only Printify PUT silently clears tags; run codegen after any
  OpenAPI change; never `console.log` in server code.

### 2. `frog-logic-shop` — the feelings collection (static)

Separate site on a different URL, zero hosting cost. Netlify (static files +
two serverless functions) + Stripe Checkout + a fulfilment webhook that emails
digital files via Resend and will order physical prints via the Printify API
once artwork is mapped; newsletter and social run via GitHub Actions.
**Full setup runbook is `README.md` in that folder — follow it, don't improvise.**

Everything is in `index.html`, `styles.css`, `script.js`. Products live in
three arrays at the top of `script.js`: `PRODUCTS`, `DIGITAL_PRODUCTS`,
`GUIDES`. `preview-standalone.html` is a self-contained build (CSS and JS
inlined, images as data URIs) — open it directly in a browser to see the
whole site with no server needed; regenerate it from the other three files if
you change them, don't hand-edit it.

**House style:** rotated/collage Fraunces serif lettering, halftone-dot grain
texture over a solid background colour, Anton for the big headline word, Space
Mono for the small kicker line, one small Frog Logic logo mark fixed top-right
on every single piece — no per-mood frog expressions, no gradients. This
superseded two earlier directions (a "quiet" flat-oat-background version and a
"bold" gradient/expressive-frog version) that a previous session built before
finding this one. Don't resurrect either.

Three sections, as of 20 Aug 2026:
- **68 physical designs** — tees, totes, pins, prints, mugs, stickers.
- **30 digital downloads** — low-pressure planners and check-in tools,
  deliberately calmer than the prints. The last 8 (D23–D30: Lily Pad Planner,
  The Pocket Pond, Hoppy Thoughts Issues 01 & 02, 30 Days at the Pond,
  Affirmation Cards, Habit Stacking Cards, Translation Cards) were added 20 Aug
  — older products that existed as PDFs on the Desktop since July but had never
  been brought into the site; their cover art was redesigned from scratch to
  match the house style rather than reusing the old covers, and their copy was
  rewritten tighter to match the site's current voice (the July originals were
  softer and more pun-heavy).
- **23 Pond Guides** — see the label rule above.

### 3. `Desktop\Frog Logic` — brand assets, business plan

- **`Business Plan.docx`** — positioning, audience, pricing, roadmap, channel
  strategy and real performance numbers. Read this before any marketing,
  pricing or strategy work. Headlines: 2,741 SKUs across 37 collections on the
  *main* store (froglogic.co.uk, not the static site); biggest collections are
  ADHD Frog, Sensory Overload Frog, PTSD Frog, Zen Frog; early-stage traffic
  and revenue; roadmap runs validate → seasonal drops → expand winners →
  bundles and subscription boxes. It predates the label rule and still names
  collections by diagnosis — fine internally, don't lift the wording straight
  into customer-facing copy.
- **Social assets:** `Frog_Logic_Caption_Pack.md` (20 captions, sorted into
  promo / relatable / educational / CTA), three phone wallpapers, story
  graphics, nine condition-frog videos exported for Meta/TikTok.
- The digital-product PDFs that used to be the reason to open this folder are
  now superseded — see above.

---

## Decisions already made (don't re-litigate)

- **Art direction: the house style described above.** Chosen by finding and
  adopting the 13 Aug build over two earlier, less-resolved sessions' worth of
  gradient and flat-mark experiments.
- Waiting-list early access is **7 days**, not 48 hours.
- Package insert copy: descriptive paragraphs, no condition labels.
- Store name: "Frog Logic" is still in use. A friendlier rename has been
  discussed ("The Friendly Frog Co.") but not adopted.

## Open threads

- The 30-design productisation plan for the *main* store (3 waves, ~107
  products) is written but not executed. Brief is in
  `Printify-Designer/attached_assets/`.
- TikTok rejected the API audit — auto-posting is permanently off the table.
  Manual upload or a third-party scheduler only.
- `frog-logic-shop` checkout was rebuilt 20 Aug: one shared Stripe Checkout
  function + fulfilment webhook (`netlify/functions/`) replaces the old
  per-product Payment Links / Payhip / Zapier plan. Digital items are fully
  wired (email delivery via Resend); physical items deliberately refuse
  checkout until real artwork exists in Printify and the item gets
  `printifyProductId`/`printifyVariantId` in `catalog.json`. Still to do by
  Sam, per README Parts 1–3: create the GitHub repo + Netlify site, add the
  Stripe/Resend env vars, register the Stripe webhook. `catalog.json` is
  generated from `script.js` — regenerate it whenever a product or price
  changes.
- Physical artwork: all 68 physical pieces are SVG mockups only — no
  print-ready files exist yet (README Part 6).
