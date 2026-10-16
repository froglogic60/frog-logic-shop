// ===== Frog Logic — the Socially Hibernating Christmas sets =====
//
// Three pieces for one price, delivery included (Sam, 16 Oct 2026: "Can each
// bundle of three just have one price"). The UK set is a hoodie, a tee and a
// fleece throw, made in the UK; the US set is a hoodie, a tee and an
// embroidered beanie, made in the US.
//
// The colours and sizes come from /api/sets, the same bundles.json the
// checkout prices from, so the page can't offer a combination the till would
// refuse. Each piece has its own colour and size, chosen here; basket.js holds
// the set as one line, and the Stripe webhook sends each piece to its maker.
(function () {
  "use strict";

  var CSS = [
    ".set-card .set-part{margin:0 0 10px}",
    ".set-card .set-part-name{font-family:var(--ui);font-weight:700;font-size:.66rem;letter-spacing:.14em;",
    "text-transform:uppercase;color:var(--muted);margin:0 0 6px}",
    ".set-card .set-row{display:flex;gap:8px}",
    ".set-card .set-row select{flex:1;min-width:0;padding:9px 10px;font:inherit;font-size:.9rem;color:var(--ink);",
    "background:transparent;border:1px solid var(--line);border-radius:6px;cursor:pointer}",
    ".set-card .set-row select:focus-visible{outline:3px solid var(--gold);outline-offset:2px}",
    ".set-card .set-row select[data-empty=\"1\"]{color:var(--muted)}",
    ".set-card .set-loading{font-size:.82rem;color:var(--muted);margin:0 0 12px}",
  ].join("");

  var money = function (pounds) {
    return "£" + (Math.round(pounds * 100) % 100 ? pounds.toFixed(2) : String(Math.round(pounds)));
  };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function select(placeholder, values) {
    var s = el("select");
    s.dataset.empty = "1";
    var p = el("option", null, placeholder);
    p.value = "";
    s.appendChild(p);
    values.forEach(function (v) {
      var o = el("option", null, v);
      o.value = v;
      s.appendChild(o);
    });
    s.addEventListener("change", function () { s.dataset.empty = s.value ? "0" : "1"; });
    return s;
  }

  function unique(list) {
    var out = [];
    list.forEach(function (v) { if (v && out.indexOf(v) === -1) out.push(v); });
    return out;
  }

  // One part (hoodie, tee, beanie): a colour list, and a size list that only
  // offers the sizes that colour comes in. No defaults, so nobody is sent a
  // Small they never chose.
  function buildPart(part, n) {
    var wrap = el("div", "set-part");
    var name = el("p", "set-part-name", part.label);
    wrap.appendChild(name);
    var row = el("div", "set-row");
    var colours = unique(part.options.map(function (o) { return o.colour; }));
    var sizes = unique(part.options.map(function (o) { return o.size; }));
    var c = colours.length ? select("Colour", colours) : null;
    var s = sizes.length ? select("Size", sizes) : null;
    if (c) { c.setAttribute("aria-label", part.label + " colour"); row.appendChild(c); }
    if (s) { s.setAttribute("aria-label", part.label + " size"); row.appendChild(s); }
    if (c && s) {
      c.addEventListener("change", function () {
        var ok = part.options.filter(function (o) { return o.colour === c.value; }).map(function (o) { return o.size; });
        Array.prototype.forEach.call(s.options, function (o) {
          if (!o.value) return;
          o.disabled = !!c.value && ok.indexOf(o.value) === -1;
          o.textContent = o.value + (o.disabled ? " (not in " + c.value + ")" : "");
        });
        if (s.value && s.selectedOptions[0].disabled) { s.value = ""; s.dataset.empty = "1"; }
      });
    }
    wrap.appendChild(row);
    return {
      node: wrap,
      // "Hoodie: Navy, L" — the exact text the checkout reads back. Null
      // until both are chosen.
      value: function () {
        if ((c && !c.value) || (s && !s.value)) return null;
        var bits = [c && c.value, s && s.value].filter(Boolean).join(", ");
        return part.label + ": " + bits;
      },
      focus: function () { ((c && !c.value) ? c : s || c).focus(); },
    };
  }

  function buildCard(card, sets) {
    var ids = card.dataset.sets.split(",");
    var mine = ids.map(function (id) { return sets.filter(function (x) { return x.id === id; })[0]; }).filter(Boolean);
    var slot = card.querySelector(".set-pickers");
    var priceEl = card.querySelector(".card-price");
    var btn = card.querySelector(".set-add");
    var warn = card.querySelector(".sg-warn");
    if (!mine.length || !slot) return;
    slot.innerHTML = "";

    var current = mine[0];
    var parts = [];

    // The UK set comes with a choice of throw size, which is a different set
    // (and price) rather than an option, so the price stays one number.
    if (mine.length > 1) {
      var wrap = el("div", "set-part");
      wrap.appendChild(el("p", "set-part-name", "Throw size"));
      var row = el("div", "set-row");
      var t = el("select");
      t.setAttribute("aria-label", "Throw size");
      mine.forEach(function (x) {
        var o = el("option", null, x.choice + " · " + money(x.price));
        o.value = x.id;
        t.appendChild(o);
      });
      t.addEventListener("change", function () {
        current = mine.filter(function (x) { return x.id === t.value; })[0];
        showPrice();
      });
      row.appendChild(t);
      wrap.appendChild(row);
      slot.appendChild(wrap);
    }

    // The parts with choices are the same across a card's sets (only the
    // throw differs), so they are drawn once from the first.
    mine[0].parts.forEach(function (p, i) {
      if (p.options.length < 2) return;
      var built = buildPart(p, i);
      parts.push(built);
      slot.appendChild(built.node);
    });

    function showPrice() {
      priceEl.textContent = money(current.price) + " for all three, delivery included";
    }
    showPrice();
    btn.disabled = false;

    btn.addEventListener("click", function () {
      warn.hidden = true;
      for (var i = 0; i < parts.length; i++) {
        if (!parts[i].value()) {
          warn.textContent = "Pick a colour and size for each piece, then add the set.";
          warn.hidden = false;
          parts[i].focus();
          return;
        }
      }
      if (!window.FrogBasket) {
        warn.textContent = "Sorry, the basket didn't load. Please refresh the page.";
        warn.hidden = false;
        return;
      }
      window.FrogBasket.add({
        id: current.id,
        name: current.name,
        size: parts.map(function (p) { return p.value(); }).join(" · "),
        qty: 1,
        price: Math.round(current.price * 100),
      });
      var original = btn.dataset.label || btn.textContent;
      btn.dataset.label = original;
      btn.textContent = "Added ✓";
      window.setTimeout(function () { btn.textContent = original; }, 1400);
    });
  }

  function start() {
    var cards = document.querySelectorAll(".set-card[data-sets]");
    if (!cards.length) return;
    var s = document.createElement("style");
    s.textContent = CSS;
    document.head.appendChild(s);
    fetch("/api/sets")
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (sets) { Array.prototype.forEach.call(cards, function (c) { buildCard(c, sets); }); })
      .catch(function () {
        Array.prototype.forEach.call(cards, function (c) {
          var slot = c.querySelector(".set-pickers");
          if (slot) slot.textContent = "The colour and size options didn't load. Please refresh the page.";
        });
      });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
