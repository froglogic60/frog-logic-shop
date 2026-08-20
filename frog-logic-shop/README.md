# Frog Logic — the feelings collection

A standalone storefront for the feelings-led product line — literal emotion
words as the hero design, with the small Frog Logic mark fixed top-right on
every piece. Separate from froglogic.co.uk (the main 136-product Replit
store); this one is a static site plus two tiny serverless functions, so it
costs nothing to host, with the monthly newsletter and social posts run by
GitHub Actions instead of any paid server or the Replit agent.

> **Naming note:** this uses the Frog Logic name directly, same as the main
> store. Since it lives on a different domain/URL, there's no technical
> collision — but if customers might land on both, it may be worth a
> subtitle somewhere (the page title tag currently says "Frog Logic — the
> feelings collection") so it's clear which is which. Entirely your call.

## What's in this folder

```
index.html, styles.css, script.js   the storefront (edit script.js to change products)
netlify/functions/catalog.json      server-side price list — generated from script.js, see below
netlify/functions/create-checkout.js   turns a "Get this piece"/"Download" click into a Stripe Checkout Session
netlify/functions/stripe-webhook.js    runs the moment a payment succeeds — emails digital files, orders physical prints
thank-you.html                      the page a buyer lands on right after paying
content/newsletter.json             what the monthly email says — edit before each send
content/social-post.json            what the monthly FB/IG post says — edit before each post
automation/newsletter/              the script GitHub Actions runs to send the newsletter
automation/social/                  the script GitHub Actions runs to post to FB/IG
.github/workflows/                  the schedules that run those scripts automatically
```

## How checkout works now (read this before Part 1)

With 121 products, hand-making a Stripe Payment Link and a Payhip/Gumroad
listing for every single one isn't realistic — that was fine for the
original 6-product draft, but not at this size. So instead, every "Get this
piece" and "Download" button on the site calls one shared checkout function
(`netlify/functions/create-checkout.js`), which looks the item's real price
up server-side from `catalog.json` and creates a Stripe Checkout Session for
it — the browser can never send its own price. After payment,
`stripe-webhook.js` does the fulfilment automatically: for a **digital**
item it emails the buyer their download link (via your existing Resend
account); for a **physical** item it creates the order directly in Printify's
API. This replaces the old plan of Payhip/Gumroad *and* Zapier — neither is
needed any more.

The upshot: instead of manually creating ~120 payment links and ~120
Printify/Payhip listings, you create **one Stripe account setup, one Netlify
site, and paste in a handful of secret keys** — covered below. Adding or
re-pricing a product later is just an edit to `script.js`, then regenerating
`catalog.json` (ask me to do this any time you change a price or add a
product — it's a five-minute job).

This does mean the site needs to run on **Netlify** rather than GitHub
Pages — GitHub Pages can only serve static files, it can't run the checkout
function. Netlify is still free at this volume.

## Part 1 — Get the site live on Netlify (free, ~10 minutes)

1. Create a free GitHub account if you don't have one, then create a new
   **public** repository called `frog-logic-shop` and upload every file in
   this folder to it (GitHub's web upload works fine — drag the whole folder
   in, including the hidden-looking `netlify` folder).
2. Create a free account at **netlify.com**, then **Add a new site → Import
   an existing project** and pick that GitHub repo. Netlify reads
   `netlify.toml` automatically — no build settings to configure.
3. Once deployed, your site is live at `https://<something>.netlify.app`
   (Site settings → Change site name lets you pick a nicer subdomain, e.g.
   `frog-logic-shop.netlify.app`, or add your own domain later).
4. Open `content/newsletter.json` and `content/social-post.json` and replace
   `REPLACE-WITH-YOUR-USERNAME...` with your real site URL from step 3.

## Part 2 — Take payment (Stripe, one-time setup)

You already have a Stripe account from the main store — this collection can
use the same one; Stripe Checkout Sessions don't need per-product setup in
the Stripe dashboard at all, `create-checkout.js` creates them on the fly.

1. In Stripe, go to **Developers → API keys** and copy the **Secret key**.
2. In Netlify, go to **Site settings → Environment variables** and add:
   - `STRIPE_SECRET_KEY` — the key from step 1
   - `SITE_URL` — your site's real URL from Part 1 step 3
3. Redeploy the site (Netlify → Deploys → Trigger deploy) so the functions
   pick up the new variables.

That's it — every product on the site can now be bought. Test it: click
"Get this piece" or "Download" on any product; it should redirect to a real
Stripe Checkout page. Use Stripe's test card `4242 4242 4242 4242`, any
future date, any CVC, while `STRIPE_SECRET_KEY` is still a **test** key
(starts `sk_test_`) — switch to the **live** key only once you're ready to
take real payments.

## Part 3 — Selling the digital items (already wired, one more secret)

Digital pieces email themselves to the buyer automatically via
`stripe-webhook.js` — nothing to set up per-product, and no Payhip/Gumroad
account needed.

1. In Stripe, go to **Developers → Webhooks → Add endpoint**, set the URL to
   `https://<your-site>/api/stripe-webhook`, and select the
   `checkout.session.completed` event. Stripe gives you a **Signing secret**.
2. In Netlify, add these environment variables (alongside the ones from
   Part 2):
   - `STRIPE_WEBHOOK_SECRET` — the signing secret from step 1
   - `RESEND_API_KEY` — reuse the same one the main store's newsletter uses
   - `FROM_EMAIL` — e.g. `Frog Logic <hello@yourdomain.com>`
3. Redeploy.

Test with the Stripe test card above on a digital item — the download email
should land within a few seconds. Check Netlify's **Functions** log
(`stripe-webhook`) if it doesn't; that log is also the first place to look if
a customer ever emails asking where their download is.

### Licensing the digital files

A PDF can't be locked down — once someone downloads it they can print it any
number of times, which is the point for something like a daily planner.
Worth doing anyway: every PDF already carries a line on its last page
(personal and household use, print freely, don't resell or redistribute),
and the same wording is worth repeating in the product description so
buyers see it before purchase. Nothing stops determined piracy for
printables, but this sets a clear, statable boundary.

## Part 3b — Fulfilment: turning a physical sale into a Printify order

**Not ready yet, and that's fine for now.** Every physical piece on the site
is currently a pure SVG mockup, not real print-ready artwork, so there's
nothing in Printify to actually order yet — `create-checkout.js` already
knows this and will politely refuse to take payment for a physical item
until it's mapped (a customer sees "This piece isn't open for orders yet"
rather than you taking money for something that can't ship). Digital sales
work today regardless of this.

When real artwork exists for a piece (see Part 6):

1. Create the matching product in Printify — blueprint, provider, variant,
   the real print file.
2. Note its **Product ID** and the **Variant ID** you want to sell (both
   visible in Printify's product URL / API response).
3. Add `"printifyProductId"` and `"printifyVariantId"` to that item's entry
   in `netlify/functions/catalog.json`.
4. Once your Printify account has any pieces mapped this way, add two more
   Netlify environment variables and redeploy: `PRINTIFY_API_KEY` (Printify
   → My Profile → Connections) and `PRINTIFY_SHOP_ID` (from the same page).

Ask me to do steps 2–3 for any piece once you've created it in Printify —
send me the Printify product URL and I'll fill in the catalog entry.

> **Worth knowing:** Printify is a marketplace of independent print providers
> rather than a single printer, and providers do occasionally leave the
> network or run into delays — it's worth checking
> [Printify's live fulfilment status page](https://printify.com/network-fulfillment-status/)
> before a big push (like sending the newsletter), and picking providers with
> strong review histories per product rather than just the cheapest option.

### Licensing the digital files

A PDF can't be locked down — once someone downloads it they can print it any
number of times, which is the point for something like a daily planner. Two
things are worth doing anyway:

1. **Cap re-downloads.** Payhip and Gumroad both let you limit how many times a
   buyer can re-download from their link (3–5 is normal). This discourages
   passing the download link around; it doesn't limit printing.
2. **State the licence.** Every PDF now carries a line on its last page:
   personal and household use, print freely, don't resell or redistribute the
   file. Repeat the same wording in the product description so buyers see it
   before purchase.

Neither stops determined piracy — nothing does for printables — but together
they set a clear boundary and give you something concrete to point to if
another shop starts reselling your files.

## Part 4 — Automate the monthly newsletter

This reuses your existing Resend account, just with its own subscriber list
for this collection.

1. **Collect emails:** make a Google Form with one "Email" question, linked
   to a new Google Sheet. In that Sheet, go to **File → Share → Publish to
   web**, choose "Comma-separated values (.csv)," and copy the link.
2. **Get a Resend API key** at resend.com/api-keys (or reuse your existing
   one), and make sure a sending domain/address is verified.
3. In your GitHub repo, go to **Settings → Secrets and variables → Actions**
   and add three repository secrets:
   - `RESEND_API_KEY`
   - `FROM_EMAIL` — e.g. `Frog Logic <hello@yourdomain.com>`
   - `SUBSCRIBERS_CSV_URL` — the published Sheet link from step 1
4. Each month before the 1st, edit `content/newsletter.json` with what's new.
5. The `Send monthly newsletter` workflow then runs automatically on the 1st,
   or you can trigger it early anytime from the repo's **Actions** tab →
   "Send monthly newsletter" → "Run workflow."

This sends one email per subscriber in a simple loop, which is plenty for a
new list. If the list grows past a couple hundred people, it's worth moving
to Resend's own Broadcasts/Audiences feature instead.

## Part 5 — Automate the monthly Facebook & Instagram post

This is the fiddliest part because Meta requires developer registration even
for your own accounts — but it's free. Note: the main froglogic.co.uk store
already has its own social auto-posting built into the Replit app — this is
a *separate* token/app registration for this collection's own accounts (or
reuse the same Facebook Page/Instagram account if you want both lines posted
from one place; just point both systems at the same Page).

1. Make sure your Instagram account is a **Professional (Business or
   Creator)** account, linked to your Facebook Page.
2. Go to developers.facebook.com, create a free developer account, then
   **Create App** → type "Business."
3. In the app, add the **Instagram Graph API** product.
4. Under **Tools → Graph API Explorer**, generate a **Page access token**
   with: `pages_manage_posts`, `pages_read_engagement`, `instagram_basic`,
   `instagram_content_publish`.
5. Exchange it for a **long-lived token** (60 days) — search "Meta long-lived
   page access token" for the current step-by-step, as Meta updates this
   flow periodically. Repeat roughly every 60 days.
6. Find your **Facebook Page ID** and **Instagram User ID** (via Graph API
   Explorer: `GET /me/accounts` then
   `GET /{page-id}?fields=instagram_business_account`).
7. Add three repository secrets in GitHub: `META_ACCESS_TOKEN`, `FB_PAGE_ID`,
   `IG_USER_ID`.
8. Each month, edit `content/social-post.json` with the caption and an image
   URL — the easiest free host is the site itself, via an `assets/` folder
   in the repo.

The `Post monthly social update` workflow then posts to both platforms
automatically on the 1st, or on demand from the Actions tab.

## Part 6 — Real product artwork

Right now each product is pure SVG (from the approved mockups) — no image
files needed, which is why this costs nothing to run. When you're ready for
Printify, bring the actual Frog Logic frog artwork over and I'll help lay
out real print-ready files per product, matching this same fixed
bottom-right placement. The full mascot character (for package inserts,
thank-you cards, the About page) is a separate, later piece — this
storefront only needs the small signature mark.

## What this costs, honestly

- **Free forever at low volume:** Netlify hosting and functions, the
  storefront, Printify's own account, Resend's free sending tier, GitHub
  Actions minutes, Meta's API.
- **Percentage-based, not fixed:** Stripe's transaction fee, Printify's base
  product cost per order.
- **Only if you outgrow the free tier:** Netlify's function invocations and
  Resend's sending both cap free usage — the caps are far above a new shop's
  volume, worth checking only if things take off.
