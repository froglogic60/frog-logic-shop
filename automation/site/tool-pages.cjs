// Two free tools (Sam, 28 Oct 2026: "1. Yes 2. ... 3. Yes" / "Yes 2. As well"):
//
//   /p/help-card-maker/  A "How to help me" wallet card maker. Pick what
//                        happens when it gets too much, what helps and what
//                        doesn't, and print a credit-card-sized card to keep
//                        in a wallet or phone case. Everything stays in the
//                        browser: nothing is sent or saved. The card carries
//                        froglogic.co.uk, so every card handed over is a
//                        signpost. The £2 How To Help Me sheet (D21) is the
//                        full version, linked underneath.
//   /p/pond-advent/      Sign-up for Pond Advent: one free thing a day by
//                        email, 1-24 December, then it stops. Its own list
//                        (the newsletter promises once a month), handled by
//                        netlify/functions/advent.js; the emails are
//                        content/advent.json, sent by send-advent.yml.
//
// Called from build-pages.cjs. The client script is plain ES5 in a normal
// string, with no backticks or template placeholders, so it can sit inside
// this file's template literals untouched.
const fs = require("fs");
const path = require("path");

const CARD_JS = String.raw`
(function(){
  var $ = function(id){ return document.getElementById(id); };
  var form = $('hc-form'); if(!form) return;
  document.body.appendChild($('hc-print')); // printed on its own, outside the page
  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function picked(name){
    var out = [];
    form.querySelectorAll('input[name="' + name + '"]:checked').forEach(function(i){ out.push(i.value); });
    var extra = form.querySelector('input[data-extra="' + name + '"]');
    if(extra && extra.value.trim()) out.push(extra.value.trim());
    return out;
  }
  function list(items){ return items.length ? '<ul>' + items.map(function(t){ return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' : ''; }
  function draw(){
    var name = $('hc-name').value.trim();
    var head = $('hc-head').value === 'custom' ? $('hc-head-custom').value.trim() : $('hc-head').value;
    var colour = (form.querySelector('input[name="colour"]:checked') || {}).value || 'green';
    var might = picked('might'), helps = picked('helps'), dont = picked('dont');
    var more = $('hc-more').value.trim(), contact = $('hc-contact').value.trim();
    var front = '<div class="hc-face hc-front hc-' + colour + '">' +
      '<div class="hc-kick">How to help me</div>' +
      (name ? '<div class="hc-name">' + esc(name) + '</div>' : '') +
      (head ? '<div class="hc-head">' + esc(head) + '</div>' : '') +
      (might.length ? '<div class="hc-sec"><b>If it gets too much I might</b>' + list(might) + '</div>' : '') +
      '<div class="hc-foot">froglogic.co.uk</div></div>';
    var back = '<div class="hc-face hc-back">' +
      (helps.length ? '<div class="hc-sec"><b>What helps</b>' + list(helps) + '</div>' : '') +
      (dont.length ? '<div class="hc-sec"><b>Please don\'t</b>' + list(dont) + '</div>' : '') +
      (more ? '<div class="hc-more">' + esc(more) + '</div>' : '') +
      (contact ? '<div class="hc-contact">If I can\'t speak, please contact: <b>' + esc(contact) + '</b></div>' : '') +
      '</div>';
    var pair = '<div class="hc-pair">' + front + back + '</div>';
    $('hc-preview').innerHTML = pair;
    $('hc-print').innerHTML = '<p class="hc-print-note">Cut round each pair, fold down the middle, and glue or laminate. froglogic.co.uk</p>' + pair + pair + pair + pair;
  }
  form.addEventListener('input', draw);
  form.addEventListener('change', function(){
    $('hc-head-custom').style.display = $('hc-head').value === 'custom' ? '' : 'none';
    draw();
  });
  $('hc-go').addEventListener('click', function(){ draw(); window.print(); });
  draw();
})();
`;

const CHIPS = {
  might: ["go quiet", "not be able to speak", "need to leave", "cover my ears", "stim or rock", "not look at you", "take longer to answer", "cry or get angry"],
  helps: ["give me space", "speak calmly and simply", "ask yes or no questions", "let me write it down", "turn the noise down", "give me time", "stay nearby, quietly", "let me go somewhere quiet"],
  dont: ["touch me", "crowd me", "ask lots of questions", "raise your voice", "take it personally"],
};
const HEADS = ["I'm neurodivergent", "I'm autistic", "I have ADHD", "I'm autistic and ADHD", "I have sensory processing differences", "I'm having a hard time"];

function chipSet(name, label, defaults, extraLabel, attr) {
  const boxes = CHIPS[name].map((t) => `<label class="hc-chip"><input type="checkbox" name="${name}" value="${attr(t)}"${defaults.includes(t) ? " checked" : ""}> ${t}</label>`).join("");
  return `<fieldset class="hc-set"><legend>${label}</legend>${boxes}<input type="text" class="hc-extra" data-extra="${name}" maxlength="40" placeholder="${attr(extraLabel)}" aria-label="${attr(extraLabel)}"></fieldset>`;
}

const CARD_CSS = `
.hc-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:32px;align-items:start;margin-top:24px}
@media(max-width:820px){.hc-grid{grid-template-columns:minmax(0,1fr)}.hc-sticky{position:static}}
.hc-form label.hc-line{display:block;font-weight:700;margin:14px 0 6px}
.hc-form input[type=text],.hc-form select{width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:8px;font:inherit;background:#fff}
.hc-set{border:0;padding:0;margin:18px 0 0}.hc-set legend{font-weight:700;margin-bottom:8px}
.hc-chip{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);border-radius:999px;padding:6px 12px;margin:0 6px 8px 0;background:#fff;cursor:pointer;font-size:15px}
.hc-chip input{margin:0}.hc-extra{margin-top:4px}
.hc-colours{display:flex;gap:10px;margin-top:8px}.hc-colours label{display:flex;align-items:center;gap:6px}
.hc-sticky{position:sticky;top:16px}
.hc-pair{display:flex;gap:0;width:max-content;max-width:100%;overflow:auto}
.hc-face{width:85.6mm;height:54mm;box-sizing:border-box;padding:3.5mm 4mm;font:400 8.2pt/1.25 'DM Sans',sans-serif;color:#22331F;border:1px dashed #9AA7B0;position:relative;overflow:hidden;background:#fff}
.hc-front.hc-green{background:#DDEBD5}.hc-front.hc-peach{background:#F6E4C6}.hc-front.hc-blue{background:#DCE8F3}
.hc-kick{font:700 7pt 'Space Grotesk',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#6B4A32}
.hc-name{font:600 15pt/1.05 Fraunces,serif;margin-top:1mm}.hc-head{font-weight:700;margin-top:.8mm}
.hc-sec{margin-top:1.6mm}.hc-sec ul{margin:.4mm 0 0;padding-left:4mm}.hc-sec li{margin:0}
.hc-more{margin-top:1.6mm;font-style:italic}.hc-contact{position:absolute;left:4mm;right:4mm;bottom:3mm;font-size:7.4pt}
.hc-foot{position:absolute;right:4mm;bottom:2.6mm;font:700 6.5pt 'Space Grotesk',sans-serif;color:#6B4A32;letter-spacing:.04em}
#hc-print{display:none}
@media print{
  html,body{background:#fff !important}
  body > *:not(#hc-print){display:none !important}
  #hc-print{display:block !important;padding:10mm}
  #hc-print .hc-pair{margin:0 0 6mm;overflow:visible}
  .hc-print-note{font:400 8pt 'DM Sans',sans-serif;color:#6B6355;margin:0 0 5mm}
  @page{size:A4;margin:0}
}
.pa-form{display:flex;gap:10px;flex-wrap:wrap;margin:18px 0 8px}.pa-form input[type=email]{flex:1 1 260px;padding:12px 14px;border:1px solid var(--line);border-radius:8px;font:inherit}
.pa-days{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;max-width:520px;margin:18px 0}
.pa-days span{aspect-ratio:1;border:1.5px solid #22331F;border-radius:8px;display:flex;align-items:center;justify-content:center;font:600 18px Fraunces,serif;background:#DDEBD5}
.pa-days span:nth-child(3n){background:#F6E4C6}.pa-days span:nth-child(4n){background:#F6DCDC}
.pa-ok{background:#DDEBD5;border-radius:10px;padding:14px 16px;font-weight:700;display:none}
`;

function build({ shell, esc, attr, OUT, SITE }) {
  const out = [];
  const write = (slug, opts) => {
    fs.mkdirSync(path.join(OUT, slug), { recursive: true });
    fs.writeFileSync(path.join(OUT, slug, "index.html"), shell(opts));
    out.push({ slug, group: "help" });
    console.log(`tool page ${slug}`);
  };

  // ---- the card maker
  {
    const slug = "help-card-maker";
    const url = `${SITE}/p/${slug}/`;
    const title = "Free 'how to help me' card maker — a printable wallet card for autistic and ADHD people";
    const description = "Make a free printable 'how to help me' card in a minute: what happens when it gets too much, what helps and what doesn't. Credit-card size, for a wallet or phone case. Nothing is sent or saved.";
    const body = `
<style>${CARD_CSS}</style>
<section class="collection product-page help-page" id="help">
  <div class="wrap">
    <p class="crumbs"><a href="/">Frog Logic</a> › <a href="/#guides">Free guides</a> › How to help me card</p>
    <h1>Free "how to help me" card maker</h1>
    <p class="section-sub">I'm Sam, I'm neurodivergent, and I run Frog Logic from my lounge. When it all gets too much, explaining what you need is the first thing to go. So make the card now, while it's easy, and hand it over later instead of finding the words. It's credit-card size, for a wallet, a lanyard or the back of a phone case.</p>
    <div class="hc-grid">
      <form class="hc-form" id="hc-form" onsubmit="return false">
        <label class="hc-line" for="hc-name">Your name (optional)</label>
        <input type="text" id="hc-name" maxlength="30" autocomplete="off">
        <label class="hc-line" for="hc-head">The line under your name</label>
        <select id="hc-head">${HEADS.map((h) => `<option>${esc(h)}</option>`).join("")}<option value="">(leave it off)</option><option value="custom">Write my own…</option></select>
        <input type="text" id="hc-head-custom" maxlength="45" placeholder="e.g. I'm deaf in my left ear" style="display:none;margin-top:6px" aria-label="Your own line">
        ${chipSet("might", "If it gets too much, I might…", ["go quiet", "need to leave"], "Add your own", attr)}
        ${chipSet("helps", "What helps", ["give me space", "speak calmly and simply", "give me time"], "Add your own", attr)}
        ${chipSet("dont", "Please don't", ["touch me", "ask lots of questions"], "Add your own", attr)}
        <label class="hc-line" for="hc-more">One more thing they should know (optional)</label>
        <input type="text" id="hc-more" maxlength="70" placeholder="e.g. I'm not being rude, I'm overloaded">
        <label class="hc-line" for="hc-contact">If you can't speak, who should they contact? (optional)</label>
        <input type="text" id="hc-contact" maxlength="40" placeholder="e.g. Mum, 07700 900123">
        <div class="hc-set"><b>Colour</b><div class="hc-colours">
          <label><input type="radio" name="colour" value="green" checked> Green</label>
          <label><input type="radio" name="colour" value="peach"> Peach</label>
          <label><input type="radio" name="colour" value="blue"> Blue</label></div></div>
        <p style="margin-top:18px"><button type="button" class="btn btn-primary" id="hc-go">Print my card</button></p>
        <p class="section-sub">Prints four copies on one A4 or Letter sheet. Cut round each one, fold down the middle, then glue it or laminate it. Everything stays on your device: nothing you type is sent or saved.</p>
      </form>
      <div class="hc-sticky"><p><b>Your card</b> (front, then back)</p><div id="hc-preview"></div></div>
    </div>
    <div id="hc-print"></div>
    <div class="product-about">
      <h2>Want the full version?</h2>
      <p>The card is the short version for a hard moment. The <a href="/p/how-to-help-me/">How To Help Me sheet</a> (£2, printable) is the long one to hand over in advance: a please-don't-say / try-instead table, what helps day to day, exactly what to do if you shut down, and a space for the thing you most want people to know. The <a href="/p/access-needs-cards/">Access Needs Cards</a> are six ready-made cards for appointments, shops and work.</p>
      <h2>Explaining it properly</h2>
      <p>If someone needs more than a card, the <a href="/#guides">free Pond Guides</a> explain autism, ADHD, PDA, sensory differences and more in plain English, two pages each, free to print or forward.</p>
      <p class="section-sub">A free tool from Frog Logic, made by a neurodivergent person in the UK. Not medical advice.</p>
    </div>
  </div>
</section>
<script>${CARD_JS}</script>`;
    const jsonld = { "@context": "https://schema.org", "@type": "WebApplication", name: "How to help me card maker", description, url, applicationCategory: "LifestyleApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" }, isPartOf: { "@type": "WebSite", name: "Frog Logic", url: SITE } };
    write(slug, { title, description, url, image: `${SITE}/p/how-to-help-me/og.png`, imageAlt: "How to help me card", body, jsonld });
  }

  // ---- Pond Advent sign-up
  {
    const slug = "pond-advent";
    const url = `${SITE}/p/${slug}/`;
    const title = "Pond Advent — one free neurodivergent-friendly thing a day, 1–24 December";
    const description = "A free email advent calendar from Frog Logic: one small, calm, useful thing a day from 1 to 24 December — guides, printables and tips for autistic and ADHD families. Then it stops.";
    const days = Array.from({ length: 24 }, (_, i) => `<span>${i + 1}</span>`).join("");
    const body = `
<style>${CARD_CSS}</style>
<section class="collection product-page help-page" id="help">
  <div class="wrap">
    <p class="crumbs"><a href="/">Frog Logic</a> › Pond Advent</p>
    <h1>Pond Advent</h1>
    <p class="section-sub">One free thing a day, 1 to 24 December. Small, calm and useful: a guide for the relatives, a printable for the big day, a tip for when it all gets too much. One short email a day, and on Christmas Eve it stops.</p>
    <div class="pa-days" aria-hidden="true">${days}</div>
    <p class="pa-ok" id="pa-ok">You're in. Check your inbox for a hello from me, and the first door opens on 1 December.</p>
    <form class="pa-form" id="pa-form" method="POST" action="/api/advent">
      <label class="sr-only" for="pa-email">Email address</label>
      <input type="email" id="pa-email" name="email" placeholder="you@example.com" required autocomplete="email">
      <input type="text" name="bot-field" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">
      <button class="btn btn-primary" type="submit">Open the doors</button>
    </form>
    <p class="section-sub">Free. You won't be added to anything else, and every email has a one-click way off. Already signed up for the monthly newsletter? This is separate, so sign up here too if you'd like it.</p>
    <div class="product-about">
      <h2>What's behind the doors</h2>
      <ul>
        <li>The free <a href="/p/christmas-visual-timetable/">Christmas visual timetable</a> and picture cards</li>
        <li>Plain-English guides to hand to grandparents, aunties and uncles: autism, ADHD, PDA, sensory differences and more</li>
        <li>The <a href="/p/help-card-maker/">"how to help me" card maker</a></li>
        <li>Short, practical tips for visits, presents, food and the quiet days after</li>
      </ul>
      <p>Everything is free. I'm Sam, I'm neurodivergent, and Frog Logic is my small shop. The emails mention it at the bottom, and that's all.</p>
    </div>
  </div>
</section>
<script>if(/[?&]joined=1/.test(location.search)){var o=document.getElementById('pa-ok');o.style.display='block';document.getElementById('pa-form').style.display='none';}</script>`;
    const jsonld = { "@context": "https://schema.org", "@type": "WebPage", name: "Pond Advent", description, url, inLanguage: "en-GB", isPartOf: { "@type": "WebSite", name: "Frog Logic", url: SITE } };
    write(slug, { title, description, url, image: `${SITE}/automation/social/xmas-printables/Christmas-Visual-Timetable-2.png`, imageAlt: "Pond Advent", body, jsonld });
  }
  return out;
}

module.exports = { build };
