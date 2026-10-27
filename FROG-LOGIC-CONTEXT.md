# Frog Logic — start here

Single orientation file for any Claude session working on Frog Logic. Read this
first. When a decision changes, edit the line here, and keep the copies in step:
this file on GitHub is the master; copies sit in `Downloads\frog-logic-shop`,
`Downloads\Printify-Designer` and `OneDrive\Desktop\Frog Logic` on Sam's PC.

Last updated: 26 October 2026. (The previous version was frozen at 21 Aug and
described the retired Replit store as live. Ignore any copy older than this.)

**The number-one goal is Frog Logic making sales.** Check anything
customer-facing for "will this get found and bought?" before it goes up.

---

## Where things live

- **The shop:** froglogic.co.uk (also shop.froglogic.co.uk). Static site on
  Netlify, project `jade-arithmetic-2d2701`, Personal plan ($9/month, 1,000
  credits, 15 per deploy, cycle runs 26th–25th).
- **Code = GitHub `froglogic60/frog-logic-shop`.** It is the source of truth.
  `Downloads\frog-logic-shop` on the PC is an old August copy; don't edit it.
- **Etsy:** froglogic.etsy.com (shop name FrogLogic). Downloads plus tees, mugs,
  prints and the Christmas range made through Printify.
- **Printify:** API store 28035653 (the site's orders) and "My Etsy Store"
  29335686. The API store also holds ~2,870 stray products from the old Replit
  app; a clean-out robot is possible, not urgent.
- **The Desk:** froglogic.co.uk/desk.html, reads `content/calendar.json` live.
  It is the schedule. Anything dated or repeating goes there, and a repeating
  task shows on every day it applies to.
- **Brand assets, business plan:** `OneDrive\Desktop\Frog Logic`.
- **Retired:** the Replit store and `Downloads\Printify-Designer`. The Replit
  account is deleted and the app has been dark since 5 Sept. Nothing new goes to
  Replit or its agent.

## The business and the voice

- One person, Sam, running it from her lounge in Kent. **"I", never "we".**
- Audience: neurodivergent adults and the people around them. Tagline:
  *soft landings for busy brains*.
- Label rule: diagnoses (ADHD, autism…) appear in Sam's own story and the Pond
  Guides only. Product names and copy name feelings, not conditions. Labels stay
  in tags and keywords for search.
- Sam's own posts open "Hi, I'm Sam, I'm neurodivergent", say "from my lounge",
  sign off "with love Sam". Don't date the shop's age ("only been open a short
  while").
- **No video of Sam, no voice.** TikTok is text slides, posted by hand.
- Contact is email only: hello@froglogic.co.uk. Her phone number must never be
  visible. Her trading address is on the privacy and terms pages (legal
  requirement); not on the package insert.
- Not VAT registered. Nothing should imply VAT is charged.
- Honest signals only: no invented reviews, testimonials or urgency.

## Pricing (rule set 16 Oct 2026)

- Every price covers **all** costs (Printify cost and postage, Printify's 20%
  VAT on UK orders, Stripe/Etsy fees, a returns allowance of 5% on clothing and
  2% on everything else) and leaves **23–25% profit**.
- Sam does not want prices pushed high ("people can't afford it"). Look for a
  cheaper maker before raising a price.
- **Sales and discount codes may go below the rule** ("a sale is a sale"), but
  not below zero: leave out anything that would lose money.
- Site prices: printables about £1 a page (£2 minimum: 1–2 pages £2, 3–4 £3,
  5+ £4); tees £19 and mugs £13.50 with free UK post; prints £12; totes £17;
  notebooks £13; Bespoke Planner £25; Organisation Pack £95 / £195 / £395.
- Etsy prices sit above the site so the site stays the best deal (downloads
  mostly £3.50–£5.50; tee £19 UK / £22 US; mug £13.50; print £14).
- Printed pieces post to the **UK and US only** (no EU or Northern Ireland,
  because of GPSR). Downloads sell everywhere. US orders are made in the US.
- Newsletter code POND10 = 10% off a first order.

## What's on sale

- Typographic feelings range (tees, mugs, prints, totes, notebooks, bottles),
  the Comfort & Chaos mascot frogs, Halloween (retire after 31 Oct), Christmas
  "Socially Hibernating" in three colourways (soft, bright with a brightness
  warning, black and white), personalised ornaments and US candle, printable
  Christmas cards.
- ~50+ printable downloads, 23 free Pond Guides (readable on their own pages).
- **Bespoke Planner** £25: Google Form questionnaire → robot builds a 9–18 page
  personal PDF, emails it. Free **taster** at froglogic.co.uk/taster/ (one free
  page, live 22 Oct).
- **Organisation Pack**: digital licence, 3 tiers. If one sells, build the
  12-month update-sender (Sam asked).
- 125 product pages at froglogic.co.uk/p/<slug>/, sitemap in Search Console.

## What runs by itself (GitHub Actions)

- 3 FB/IG posts a day (crons at :17). 1pm on Mon/Wed/Fri/Sun is the Bespoke
  Planner, and since 25 Oct every planner post ends with the free taster link.
- Dated posts from `automation/social/announce-queue.json`, daily 10:00 UTC.
- Monthly newsletter on the 1st (writes itself unless marked handwritten).
- Planner order robot every 2 hours; taster sign-up count daily 06:50.
- Printify cost check Mondays 06:40 (emails hello@ only if something changed);
  engagement report Mondays 07:20.
- Pinterest: scheduled pins from bulk CSV uploads (max 100 scheduled at once).

## Where things stand (25–26 Oct 2026)

- **No sales from strangers yet.** Etsy, last 30 days: 12 visits, 0 orders,
  0 favourites, 1 visit from Etsy search. Social reach is tiny. The shop works;
  **getting seen is the problem**, so effort goes to visibility, not building.
- Pinterest ad test (planner) finished 24 Oct: £24.72, 53 outbound clicks,
  47p a click, no sale seen. **The £25 paid-ads cap is spent; don't suggest
  more paid ads.** Full review on the Desk for 4 Nov.
- 90-day target (to 6 Jan 2027): ten orders from strangers and one £100+ order,
  then decide the bigger route from real numbers. Half-way check 24 Nov.

### Done on 25–26 Oct

- Taster link added to every planner post and to the Facebook bio. Instagram
  bio link is Sam's to add in the app (Meta won't let Claude edit it).
- "Thank you for voting" results comment posted, as Frog Logic, on the colour
  poll in 10 groups: Neurodivergent squad, Global Neurodivergent Community,
  NeuroDiverseLink, Unmasking AuDHD Her, Autism Support Network, Let us talk
  ADHD, The ADHD Revolution, Autism Parents Support & Resources, Neurodiversity
  Forward, Everything Autism UK.
- Global Neurodivergent Community: a Small Business Sunday comment (shop link
  and the three-colourway picture) and an introduction comment. A post Sam made
  there on 1 Aug is still waiting for admin approval, so standalone posts in that
  group don't show; use the admin's threads.
- Etsy: existing 10% sale XMAS10PART1 on 80 listings runs 15 Oct–14 Nov.
  **Joined Etsy Cyber Specials: 25% off 134 listings, 23 Nov–1 Dec.** Left out
  because they'd lose money at 25%: UK hoodies (all colourways), all fleece
  blankets, UK ornament, US candle.

## Next up (see the Desk for dates)

- Reply to anyone who answers the group comments; draft replies for Sam.
- Group and Reddit answers pointing to the free guides and taster (Claude
  drafts, Sam posts).
- Gift-guide follow-ups DONE 26 Oct (8 nudged by robot, Alive with Chronic
  Illness chased by Sam: they offered a newsletter/January pacing-event slot for a
  pay-what-you-can donation; Sam offered free planners + a reader code with 10%
  donated instead).
- Small Business Sunday every Sunday 5–7:30pm (Theo Paphitis, #SBS).
- 27 Oct: Emily Ladau replied she'll "hold onto your shop for consideration" for
  her gift guide (Sam thanked her). Netlify's card payment failed (27 Oct email):
  the shop is suspended after 28 days unpaid, so ~24 Nov. Sam will pay when her
  money comes in (on the Desk 30 Oct).
- 27 Oct, Google Shopping: the photo fix worked (not approved 113 -> 5, those 5
  just await image reprocessing; ~130 under review, 9 approved; Google also found
  33 more products itself). Merchant Center now targets the UK AND the US: the
  feed carries a US shipping rate for every piece with a US-made twin at the same
  price (102 of 113 listings), shown to US shoppers in dollars via Google's
  currency conversion. Customer service contact set (hello@ + returns page).
- GoatCounter, 28 Sep-27 Oct: 105 visits (82 to the home page). From: Pinterest
  33, unknown 29, Facebook 18, ChatGPT 3, Google 2. UK 64%, US 20%, Canada 7%.
  54% on phones. Traffic, not the shop, is the bottleneck.
- 27 Oct, phone layout (Sam: "yes go ahead"): on screens up to 720px the header
  is one line (logo, Menu button, basket) instead of four sticky rows, and a
  "Popular for Christmas" 2x2 grid of real products with prices sits under the
  hero (Christmas set, Overstimulated tee, Low Battery mug, printable cards;
  hand-picked in index.html .mobile-picks, update if prices change). Computer
  view unchanged. "WORDS" on the ranges card no longer runs off the edge.
- 27 Oct full site check: 138 pages load, no broken links, no script errors,
  nothing overflows on a phone, all 284 product photos load, every paid page
  price matches the checkout, basket UK/US postage and the live Stripe page are
  right. Fixed: UK Christmas ornament said £10 but Etsy charges £13.75. Etsy
  shows US-made listings 20% dearer to UK viewers (import VAT) - not an error.
- More outreach 26 Oct: ADHD UK and Genius Within (website forms), ADHD Aware
  and Crip Life (emailed by the robot; Crip Life = feature for cross-promotion),
  Neurodivergent Insights gift guide (site form, sent). A daily
  7:59 scheduled task checks Outlook for replies and drafts answers.
- 26 Oct evening: Kent Messenger pitched (local story, product photos only, no
  photo of Sam) and 9 neurodivergent creators offered a free printable of their
  choice (approach-list #22–31). 3 Dec post queued for International Day of
  Persons with Disabilities (Disability History Month is 19 Nov–19 Dec).
- Google Business Profile: Sam set it up herself around 16 Oct (the same flow
  offered Google Ads, which she skipped); it isn't under the Google account in
  her Chrome. Verification is submitted and waiting on Google ("Google will
  verify"). On 26 Oct Sam set the category (Gift shop), service area Tonbridge
  with the address hidden, and the description; the Maps pin was showing North
  America before that.
- Halloween goes on 1 Nov (Sam, 27 Oct: "Get rid of the Halloween ones Nov
  1st"). script.js marks every halloween entry retired from that date, so the
  page hides the band and menu link itself; the "Retire Halloween" workflow
  (retire-halloween.yml, 00:20 UTC 1 Nov, date-guarded) reruns wire-catalog +
  build-pages, drops the sticker download from catalog.json, checks nothing
  Halloween is left, and publishes once. netlify.toml 301s the 10 old /p/
  addresses to /#frogs (stickers to /#digital). Chaos Gremlin itself is a
  year-round frog and stays.
- The three Christmas ranges (originals, bright, black & white) stay as three
  separate menu links and sections; never group or mix them (Sam, 27 Oct). Christmas order-by dates are live
  (UK 10 Dec, US 7 Dec) with posts queued 15 Nov and 5 Dec (the 5 Dec one doubles
  as the Small Business Saturday post); check Printify's
  2026 cut-offs around 10 Nov and move the dates earlier if theirs are.
- Pinterest is loaded to 16 Nov: 21 Christmas pins (28 Oct–7 Nov), then 3 taster
  and 15 Pond Guides pins (8–16 Nov). Built by the "Christmas pins" workflow
  (batch 2 / batch guides). The account caps at 100 scheduled pins.
- Search Console check 17 Nov; put the Cyber Specials sale in posts from 23 Nov.
- **Google Shopping fix (26 Oct):** Merchant Center had 113 of 113 products
  blocked ("unable to do quality & policy checks") because the feed's photos
  sat on images-api.printify.com, whose robots.txt blocks every crawler. The
  "Build the product pages" workflow now copies each physical product's photo
  to froglogic.co.uk/feed-images/<slug>.jpg and the feed, og:image and schema
  point there. Google re-checks over a few days; look at Merchant Center
  (account 5875298214) again around 2 Nov.
- Share images (p/<slug>/og.png) now shrink long titles to fit (the renderer
  in automation/social/gfonts.js), so long Pond Guide titles no longer run off
  the edge. Those guides can go back into Pinterest batches.
- TikTok is off the dated days while Sam recovers: three slide posts are ready
  under "whenever you have the spoons" on the Desk. Don't chase them.
- eBay insert cards in parcels from Sam's personal eBay account (card in the
  box only; no links in eBay listings or messages).

## Decided, parked or declined (don't re-raise unless Sam does)

- Replit store retired (26 Aug); Etsy is the second channel; Share & Save on.
- Hoodies off the site; totes and notebooks stay; printed stickers retired
  (printable sheet only); pins became stickers then retired.
- Google Ads £400 credit: declined. Merchant Center free listings only.
  Microsoft/Bing: parked (needs a card). eBay listings: no.
- EU selling: only if EU demand appears and a paid EU representative is worth it.
- Renaming the brand: discussed in July, not adopted. Frog Logic stays.
- Package insert (Printify) is switched off; design kept.
- Etsy is complete (26 Oct check: every download listed, 142 active). Listing the
  23 Pond Guides singly on Etsy was offered; Sam: leave Etsy as it is for now.
- A Tonbridge local-deals app idea (25 Oct) is not Frog Logic and is parked so
  Sam can focus on Frog Logic.

## Running costs (checked 25 Oct)

Claude Max £90/month · Netlify $9/month · Porkbun domain ~$5.66/year ·
Etsy and Stripe fees per sale. Free: GitHub, Resend, GoatCounter, Printify,
Search Console, Merchant Center. Replit and Google Workspace: no longer charging.
(ElevenLabs and OpenAI are Miranda's, not the shop's.)

## How to work on it (the traps that have cost time or credits)

- Claude can read the repo but commits through the GitHub web editor in Sam's
  Chrome. Every commit message carries `[skip netlify]`; one deliberate
  "Publish the shop" run at the end carries site changes (15 credits a deploy).
- Editor: replace content via the CodeMirror view, check the sha256, then commit
  in a **separate** call; the message box is found by placeholder
  `/^(Update|Rename|Create)/`; check `[skip netlify]` right before clicking.
- Binary files can't go through the web editor: build them in a workflow.
- Facebook groups: Sam's personal profile isn't a member. Switch Chrome's
  Facebook to the Frog Logic profile, post, then switch back. Typing "Sam"
  opens a tag list; end the line with a space and click the send arrow
  (Escape triggers a "Leave page?" box).
- Chrome `file_upload` refuses files from the cloud workspace and the PC. To
  attach a picture: show it on a froglogic.co.uk page, screenshot it, use
  `upload_image`. Etsy can also fetch files from raw.githubusercontent.com.
- instagram.com is blocked for the Chrome extension; Business Suite edits
  Facebook, and Instagram profile edits need Sam's app.
- Logins, passwords, codes and identity checks are Sam's.
- Fuller notes: Claude's memory files `frog-logic` and `frog-logic-ops`.
