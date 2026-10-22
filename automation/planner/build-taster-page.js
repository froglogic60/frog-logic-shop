// Writes /taster/index.html — the free one-page taste of the Bespoke Planner
// (22 Oct 2026). The page draws itself in the browser from the answers in its
// URL (?n=name&l=list|time&e=spoons|battery&f=a|b|c) using the SAME module
// code as the £25 planner (modules.js is inlined below), so what people get
// is a page of the real thing, not a mock-up. With no answers in the URL it
// shows the three-question form instead, which posts to /api/taster
// (netlify/functions/taster.js) — that sends the link by email and bounces
// straight back here with the answers filled in.
//
// Run by build-pages.cjs; also: node build-taster-page.js
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const MODULES = fs.readFileSync(path.join(__dirname, "modules.js"), "utf8");

const FONTS = "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500&family=Space+Grotesk:wght@500;700&family=DM+Sans:wght@400;500;700&family=Anton&family=Space+Mono:wght@400;700&family=Caveat:wght@600;700&display=swap";

function build() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>A free page of the Bespoke Planner, built for your brain | Frog Logic</title>
<meta name="description" content="Answer three questions and get one daily planner page built for your brain — list or time-blocked, spoons or battery, with the things you keep forgetting on it. Free, printable, yours.">
<link rel="icon" href="/assets/frog-logic-mark-sm.png">
<link rel="canonical" href="https://froglogic.co.uk/taster/">
<meta property="og:title" content="A free page of the Bespoke Planner, built for your brain">
<meta property="og:description" content="Three questions, one daily page made for how your brain works. Free, printable, yours.">
<meta property="og:image" content="https://froglogic.co.uk/p/the-bespoke-planner/og.png">
<meta property="og:url" content="https://froglogic.co.uk/taster/">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${FONTS}" rel="stylesheet">
<link rel="stylesheet" href="/styles.css">
<style>
  .taster-bar{ background:var(--ink); color:var(--cream); padding:14px 16px; }
  .taster-bar .wrap{ display:flex; flex-wrap:wrap; gap:12px 20px; align-items:center; justify-content:space-between; }
  .taster-bar p{ margin:0; max-width:60ch; font-size:.95rem; }
  .taster-bar a{ color:var(--cream); }
  .taster-bar .btn-primary{ background:var(--cream); color:var(--ink); white-space:nowrap; }
  .taster-stage{ background:#DDD5C6; padding:24px 0 40px; overflow:auto; }
  .taster-stage .sheet{ margin:0 auto; width:210mm; box-shadow:0 10px 30px rgba(0,0,0,.18); transform-origin:top center; }
  .taster-form{ max-width:640px; margin:0 auto; padding:40px 16px 60px; }
  .taster-form h1{ font-family:var(--display); font-size:clamp(1.6rem,3.5vw,2.3rem); margin:0 0 10px; }
  .taster-form p{ color:var(--muted); }
  .taster-form fieldset{ border:1px solid var(--line); padding:14px 16px; margin:0 0 16px; }
  .taster-form legend{ font-weight:600; padding:0 6px; }
  .taster-form label{ display:block; margin:6px 0; }
  .taster-form input[type=text], .taster-form input[type=email]{ width:100%; padding:10px 12px; border:2px solid var(--ink); background:#fff; font:inherit; }
  .taster-form .row{ display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .taster-form .small{ font-size:.85rem; }
  @media (max-width:640px){ .taster-form .row{ grid-template-columns:1fr; } }
  @media print{
    body{ background:#fff; }
    .site-header, .taster-bar, .site-footer, .taster-form{ display:none !important; }
    .taster-stage{ padding:0; background:#fff; overflow:visible; }
    .taster-stage .sheet{ box-shadow:none; transform:none !important; }
  }
</style>
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap header-row">
    <a class="wordmark" href="/"><img src="/assets/frog-logic-mark-sm.png" alt="">Frog Logic</a>
    <nav class="site-nav" aria-label="Primary">
      <a href="/#digital">Digital</a>
      <a href="/#guides">Guides</a>
      <a href="/p/the-bespoke-planner/">The Bespoke Planner</a>
    </nav>
  </div>
</header>
<main id="main">
  <div class="taster-bar" id="bar" hidden>
    <div class="wrap">
      <p><strong>This is one page of your Bespoke Planner.</strong> The full one is up to eighteen pages, fifteen questions, your own words on the pages, £25. <a href="/p/the-bespoke-planner/">See what's in it</a>.</p>
      <button class="btn btn-primary" type="button" onclick="window.print()">Print, or save as PDF</button>
    </div>
  </div>
  <div class="taster-stage" id="stage" hidden><div class="sheet" id="sheet"></div></div>

  <section class="taster-form" id="form-wrap">
    <p class="eyebrow">Free · a taste of the Bespoke Planner</p>
    <h1>Three questions. One page, built for your brain.</h1>
    <p>The Bespoke Planner asks fifteen questions and builds a planner from the answers. This is three of them, and one page: your daily page, in your shape, with the things you keep forgetting already on it. Printable, free, yours. The link is emailed to you so you can find it again.</p>
    <form method="POST" action="/api/taster">
      <p hidden><label>Don't fill this in: <input name="bot-field"></label></p>
      <div class="row">
        <div><label for="t-name">Your first name (it goes on the page)</label><input type="text" id="t-name" name="name" maxlength="40" required autocomplete="given-name"></div>
        <div><label for="t-email">Email, to send you the link</label><input type="email" id="t-email" name="email" required autocomplete="email"></div>
      </div>
      <fieldset><legend>1. How do you like a day laid out?</legend>
        <label><input type="radio" name="layout" value="list" checked> As a list: three things that matter, then room for the rest</label>
        <label><input type="radio" name="layout" value="time"> In time blocks, hour by hour</label>
      </fieldset>
      <fieldset><legend>2. How do you think about energy?</legend>
        <label><input type="radio" name="energy" value="spoons" checked> Spoons: I count what I woke up with</label>
        <label><input type="radio" name="energy" value="battery"> Battery: full, half, nearly flat</label>
      </fieldset>
      <fieldset><legend>3. What do you keep forgetting?</legend>
        <label for="t-forgets" class="small">Up to five things, separated by commas. They become a tick strip on the page: meds, water, eat, keys, charge phone.</label>
        <input type="text" id="t-forgets" name="forgets" maxlength="120" placeholder="meds, water, eat something">
      </fieldset>
      <label><input type="checkbox" name="newsletter" value="yes"> Also send me the Frog Logic newsletter (once a month, never more, 10% off your first order)</label>
      <p style="margin-top:18px;"><button class="btn btn-primary" type="submit">Build my page</button></p>
      <p class="small">Your email is used to send you the link, and for the newsletter only if you tick the box. The full planner, if you want it afterwards: <a href="/p/the-bespoke-planner/">The Bespoke Planner, £25</a>.</p>
    </form>
  </section>
</main>
<footer class="site-footer">
  <div class="wrap footer-row">
    <p>Frog Logic — made with care, printed to order</p>
    <nav aria-label="Policies"><a href="/returns.html">Returns</a><a href="/privacy.html">Privacy</a><a href="/terms.html">Terms</a></nav>
  </div>
</footer>
<script>
// ---- the planner's own page modules (automation/planner/modules.js), inlined
var module = { exports: {} };
${MODULES}
var M = module.exports;
// ---- draw the page from the URL, or show the form
(function(){
  var q = new URLSearchParams(location.search);
  var name = (q.get('n') || '').trim().slice(0, 40);
  if (!name) return; // no answers: the form stays
  var a = {
    name: name, layout: q.get('l') === 'time' ? 'time' : 'list',
    energy: q.get('e') === 'battery' ? 'battery' : 'spoons', dayShape: 'varies',
    easyRead: false, colour: 'fern', accent: M.COLOURS.fern,
    forgets: (q.get('f') || '').split('|').map(function(t){ return t.trim().slice(0, 30); }).filter(Boolean).slice(0, 5),
  };
  var style = document.createElement('style');
  style.textContent = M.css(a) + ' .page{ page-break-after:auto; }';
  document.head.appendChild(style);
  var page = a.layout === 'time' ? M.dailyTime(a) : M.dailyList(a);
  page = page.replace('daily page — print one per day', 'a taste of the Bespoke Planner · froglogic.co.uk/taster');
  document.getElementById('sheet').innerHTML = page;
  document.getElementById('form-wrap').hidden = true;
  document.getElementById('bar').hidden = false;
  document.getElementById('stage').hidden = false;
  document.title = name + "'s page | Frog Logic";
  function fit(){
    var sheet = document.getElementById('sheet');
    var w = Math.min(1, (document.documentElement.clientWidth - 24) / sheet.offsetWidth);
    sheet.style.transform = 'scale(' + w + ')';
    sheet.parentNode.style.height = (sheet.offsetHeight * w + 64) + 'px';
  }
  fit(); window.addEventListener('resize', fit);
})();
</script>
<script data-goatcounter="https://froglogic.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>
</body>
</html>
`;
  fs.mkdirSync(path.join(ROOT, "taster"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "taster", "index.html"), html);
  return path.join(ROOT, "taster", "index.html");
}

module.exports = { build };
if (require.main === module) console.log("wrote", build());
