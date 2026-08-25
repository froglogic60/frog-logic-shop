// ===== Frog Logic — the basket =====
//
// The shop used to send you straight from a product to Stripe, one item at a
// time. Two stickers meant two payments and two lots of postage, which is a bad
// deal for the customer and a worse one for Frog Logic — the second parcel's
// postage costs more than the sticker in it.
//
// So: a real basket. Add things, change quantities, pay once, one lot of
// postage per maker.
//
// Kept out of script.js on purpose, the same way size-guide.js is. That file is
// 141KB of product data and artwork; this is a self-contained behaviour that can
// be read, changed or removed on its own.
//
// Three rules it tries to hold to, because the audience is people who find
// surprises expensive:
//   - postage is shown in the basket, never sprung at the payment step;
//   - nothing is ever silently added, removed or reordered;
//   - the basket survives a page reload, because losing it is infuriating.
//
// Prices here are for display. Every figure that decides what someone is
// charged comes from the server (/api/quote and /api/create-checkout), which
// reads catalog.json. The browser is never trusted with a price.
(function () {
  "use strict";

  var STORE_KEY = "froglogic.basket.v1";
  var MAX_QTY = 20;

  var basket = [];      // [{ id, name, size, qty, price }] — price in pence, display only
  var quote = null;     // last server quote
  var quoteSeq = 0;     // so a slow reply cannot overwrite a newer one
  var open = false;
  var lastFocus = null;

  // ------------------------------------------------------------- storage ---

  // Storage can throw outright in a private window or with site data blocked.
  // A basket that cannot be saved should still work for the current visit.
  function load() {
    try {
      var raw = window.localStorage.getItem(STORE_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(function (l) { return l && l.id && l.qty > 0; }).slice(0, 50);
    } catch (e) { return []; }
  }

  function save() {
    try { window.localStorage.setItem(STORE_KEY, JSON.stringify(basket)); } catch (e) { /* not fatal */ }
  }

  // --------------------------------------------------------------- money ---

  var money = function (pence) {
    return "£" + (pence / 100).toFixed(2);
  };

  function parsePrice(text) {
    var n = parseFloat(String(text || "").replace(/[^0-9.]/g, ""));
    return isNaN(n) ? 0 : Math.round(n * 100);
  }

  // Must stay identical to checkoutId() in script.js and size-guide.js — the id
  // the server looks up in catalog.json is derived from these two fields.
  function checkoutId(num, word, kind) {
    var numPart = num.indexOf("—") !== -1 ? num.split("—")[0].trim() : num;
    var base = (numPart + "-" + word).replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
    return kind === "guide" ? "guide-" + base : base;
  }

  // A line is identified by product AND size: a Medium and a Large of the same
  // tee are two different things to make, not one thing bought twice.
  function lineKey(l) { return l.id + "|" + (l.size || ""); }

  function count() {
    return basket.reduce(function (n, l) { return n + l.qty; }, 0);
  }

  // ----------------------------------------------------------------- css ---

  var CSS = [
    ".bk-open{position:relative}",
    "#bk-button{display:inline-flex;align-items:center;gap:7px;position:relative}",
    "#bk-count{display:inline-block;min-width:1.35em;padding:0 .35em;border-radius:999px;",
    "background:var(--gold);color:var(--ink);font-size:.72rem;font-weight:700;text-align:center;font-variant-numeric:tabular-nums}",
    "#bk-scrim{position:fixed;inset:0;background:rgba(26,26,26,.42);z-index:60;border:0}",
    "#bk-scrim[hidden]{display:none}",
    "#bk-panel{position:fixed;top:0;right:0;bottom:0;width:min(420px,100%);background:var(--bg,#EDE7DB);",
    "border-left:2px solid var(--ink);z-index:61;display:flex;flex-direction:column;overflow:hidden}",
    "#bk-panel[hidden]{display:none}",
    ".bk-head{display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:2px solid var(--ink)}",
    ".bk-head h2{margin:0;font-size:1.15rem}",
    ".bk-close{background:none;border:0;font-size:1.5rem;line-height:1;cursor:pointer;color:var(--ink);padding:4px 8px}",
    ".bk-close:focus-visible{outline:3px solid var(--gold);outline-offset:2px}",
    ".bk-lines{flex:1;overflow-y:auto;padding:6px 20px;margin:0;list-style:none}",
    ".bk-line{display:grid;grid-template-columns:1fr auto;gap:4px 12px;padding:14px 0;border-bottom:1px solid var(--line)}",
    ".bk-name{margin:0;font-family:var(--display);font-weight:600;font-size:1rem}",
    ".bk-size{margin:2px 0 0;font-size:.78rem;color:var(--muted);font-family:var(--ui)}",
    ".bk-price{margin:0;font-variant-numeric:tabular-nums;text-align:right;white-space:nowrap}",
    ".bk-qty{display:flex;align-items:center;gap:4px;margin-top:8px}",
    ".bk-qty button{width:30px;height:30px;border:1px solid var(--ink);background:transparent;cursor:pointer;",
    "font-size:1rem;line-height:1;color:var(--ink)}",
    ".bk-qty button:hover{background:var(--ink);color:var(--cream,#F4EFE3)}",
    ".bk-qty button:focus-visible{outline:3px solid var(--gold);outline-offset:2px}",
    ".bk-qty output{min-width:2.2em;text-align:center;font-variant-numeric:tabular-nums}",
    ".bk-remove{background:none;border:0;padding:0;margin-top:8px;font-size:.76rem;color:var(--muted);",
    "text-decoration:underline;cursor:pointer;font-family:var(--ui);justify-self:end}",
    ".bk-remove:hover{color:var(--ink)}",
    ".bk-foot{border-top:2px solid var(--ink);padding:16px 20px 20px;background:var(--bg,#EDE7DB)}",
    ".bk-row{display:flex;justify-content:space-between;gap:12px;margin:0 0 6px;font-variant-numeric:tabular-nums}",
    ".bk-row.total{font-weight:700;font-size:1.05rem;margin-top:10px;padding-top:10px;border-top:1px solid var(--line)}",
    ".bk-note{margin:8px 0 0;font-size:.78rem;color:var(--muted);line-height:1.5}",
    ".bk-empty{padding:40px 20px;text-align:center;color:var(--muted)}",
    ".bk-go{width:100%;margin-top:14px}",
    ".bk-go[disabled]{opacity:.55;cursor:not-allowed}",
    ".bk-err{margin:10px 0 0;font-size:.84rem;font-weight:700;color:var(--ink)}",
    ".bk-err[hidden]{display:none}",
    ".sg-warn{margin:8px 0 0;font-size:.82rem;color:var(--ink);font-weight:700}",
    ".sg-warn[hidden]{display:none}",
    "@media (max-width:520px){#bk-panel{width:100%;border-left:0}}",
  ].join("");

  function injectCss() {
    if (document.getElementById("bk-css")) return;
    var s = document.createElement("style");
    s.id = "bk-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  // -------------------------------------------------------------- panel ----

  var els = {};

  function buildPanel() {
    var scrim = document.createElement("div");
    scrim.id = "bk-scrim";
    scrim.hidden = true;
    scrim.addEventListener("click", close);

    var panel = document.createElement("aside");
    panel.id = "bk-panel";
    panel.hidden = true;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-label", "Your basket");
    panel.innerHTML =
      '<div class="bk-head"><h2>Your basket</h2>' +
      '<button class="bk-close" type="button" aria-label="Close basket">&times;</button></div>' +
      '<ul class="bk-lines"></ul>' +
      '<div class="bk-foot"></div>';

    panel.querySelector(".bk-close").addEventListener("click", close);

    document.body.appendChild(scrim);
    document.body.appendChild(panel);

    els.scrim = scrim;
    els.panel = panel;
    els.lines = panel.querySelector(".bk-lines");
    els.foot = panel.querySelector(".bk-foot");
  }

  function buildButton() {
    var nav = document.querySelector(".site-nav");
    if (!nav) return;
    var b = document.createElement("button");
    b.id = "bk-button";
    b.type = "button";
    b.className = "btn btn-ghost btn-small";
    b.innerHTML = 'Basket <span id="bk-count">0</span>';
    b.addEventListener("click", function () { open ? close() : show(); });
    nav.appendChild(b);
    els.button = b;
    els.count = b.querySelector("#bk-count");
  }

  function show() {
    lastFocus = document.activeElement;
    open = true;
    els.scrim.hidden = false;
    els.panel.hidden = false;
    document.body.style.overflow = "hidden";
    els.panel.querySelector(".bk-close").focus();
    refreshQuote();
  }

  function close() {
    open = false;
    els.scrim.hidden = true;
    els.panel.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && open) close();
  });

  // -------------------------------------------------------------- render ---

  function render() {
    if (els.count) {
      var n = count();
      els.count.textContent = String(n);
      els.button.setAttribute("aria-label", n === 1 ? "Basket, 1 item" : "Basket, " + n + " items");
    }
    if (!els.lines) return;

    if (!basket.length) {
      els.lines.innerHTML = '<li class="bk-empty">Nothing in here yet.</li>';
      els.foot.innerHTML = "";
      return;
    }

    els.lines.innerHTML = "";
    basket.forEach(function (l) {
      var li = document.createElement("li");
      li.className = "bk-line";

      var left = document.createElement("div");
      var h = document.createElement("p");
      h.className = "bk-name";
      h.textContent = l.name;
      left.appendChild(h);
      if (l.size) {
        var s = document.createElement("p");
        s.className = "bk-size";
        s.textContent = "Size " + l.size;
        left.appendChild(s);
      }

      var qty = document.createElement("div");
      qty.className = "bk-qty";
      qty.appendChild(qtyButton("−", "Reduce quantity of " + l.name, l, -1));
      var out = document.createElement("output");
      out.textContent = String(l.qty);
      qty.appendChild(out);
      qty.appendChild(qtyButton("+", "Increase quantity of " + l.name, l, 1));
      left.appendChild(qty);

      var price = document.createElement("p");
      price.className = "bk-price";
      price.textContent = money(l.price * l.qty);

      var remove = document.createElement("button");
      remove.type = "button";
      remove.className = "bk-remove";
      remove.textContent = "Remove";
      remove.setAttribute("aria-label", "Remove " + l.name + " from basket");
      remove.addEventListener("click", function () { setQty(l, 0); });

      li.appendChild(left);
      li.appendChild(price);
      li.appendChild(document.createElement("span"));
      li.appendChild(remove);
      els.lines.appendChild(li);
    });

    renderFoot();
  }

  function qtyButton(label, aria, line, delta) {
    var b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.setAttribute("aria-label", aria);
    b.addEventListener("click", function () { setQty(line, line.qty + delta); });
    return b;
  }

  function renderFoot() {
    var goods = basket.reduce(function (n, l) { return n + l.price * l.qty; }, 0);
    var rows = '<p class="bk-row"><span>Items</span><span>' + money(quote ? quote.goods : goods) + "</span></p>";

    if (!quote) {
      rows += '<p class="bk-row"><span>Delivery</span><span>working it out…</span></p>';
    } else if (quote.digitalOnly) {
      rows += '<p class="bk-row"><span>Delivery</span><span>nothing to post</span></p>';
    } else if (quote.freeDelivery) {
      rows += '<p class="bk-row"><span>Delivery</span><span>Free</span></p>';
    } else {
      rows += '<p class="bk-row"><span>Delivery</span><span>' + money(quote.postage) + "</span></p>";
    }

    rows += '<p class="bk-row total"><span>Total</span><span>' +
      money(quote ? quote.total : goods) + "</span></p>";

    var note = "";
    if (quote && quote.toFreeDelivery > 0) {
      note = "Add " + money(quote.toFreeDelivery) + " more for free UK delivery.";
    } else if (quote && quote.parcels > 1) {
      note = "This comes in " + quote.parcels + " parcels — different pieces are made in different places, so they post separately.";
    } else if (quote && quote.digitalOnly) {
      note = "Downloads arrive by email, usually within a minute.";
    }

    els.foot.innerHTML =
      rows +
      (note ? '<p class="bk-note">' + note + "</p>" : "") +
      '<p class="bk-err" hidden></p>' +
      '<button class="btn btn-primary bk-go" type="button">Checkout</button>' +
      '<p class="bk-note">We only deliver within the UK at the moment.</p>';

    els.foot.querySelector(".bk-go").addEventListener("click", checkout);
  }

  // --------------------------------------------------------------- state ---

  function setQty(line, qty) {
    qty = Math.max(0, Math.min(MAX_QTY, qty));
    var i = basket.findIndex(function (l) { return lineKey(l) === lineKey(line); });
    if (i === -1) return;
    if (qty === 0) basket.splice(i, 1);
    else basket[i].qty = qty;
    save();
    render();
    refreshQuote();
  }

  function add(entry) {
    var existing = basket.find(function (l) { return lineKey(l) === lineKey(entry); });
    if (existing) existing.qty = Math.min(MAX_QTY, existing.qty + 1);
    else basket.push(entry);
    save();
    render();
    refreshQuote();
  }

  // The server owns every figure that decides what someone pays. A stale quote
  // is worse than none, so each reply carries the sequence it was asked at and
  // an out-of-date one is dropped rather than rendered.
  function refreshQuote() {
    if (!basket.length) { quote = null; render(); return; }
    var seq = ++quoteSeq;
    fetch("/api/quote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items: basket.map(function (l) { return { id: l.id, qty: l.qty }; }) }),
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (q) {
        if (seq !== quoteSeq || !q) return;
        quote = q;
        if (basket.length) renderFoot();
      })
      .catch(function () { /* the basket still works; the total just says items only */ });
  }

  function fail(message) {
    var err = els.foot.querySelector(".bk-err");
    if (!err) return;
    err.textContent = message;
    err.hidden = false;
  }

  function checkout() {
    var go = els.foot.querySelector(".bk-go");
    var err = els.foot.querySelector(".bk-err");
    if (err) err.hidden = true;
    go.disabled = true;
    go.textContent = "One moment…";

    fetch("/api/create-checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        items: basket.map(function (l) { return { id: l.id, size: l.size, qty: l.qty }; }),
      }),
    })
      .then(function (res) { return res.json().then(function (d) { return { ok: res.ok, data: d }; }); })
      .then(function (r) {
        if (!r.ok || !r.data.url) {
          fail(r.data.error || "Sorry, checkout isn't available right now.");
          go.disabled = false;
          go.textContent = "Checkout";
          return;
        }
        window.location.href = r.data.url;
      })
      .catch(function () {
        fail("Sorry, something went wrong reaching checkout. Please try again in a moment.");
        go.disabled = false;
        go.textContent = "Checkout";
      });
  }

  // ---------------------------------------------------------- buy button ---

  function warnOn(card, message) {
    var warn = card.querySelector(".sg-warn");
    if (!warn) return;
    warn.textContent = message;
    warn.hidden = false;
  }

  // script.js listens on document.body in the bubble phase and sends one item
  // straight to Stripe. Catching the click here, on document in the capture
  // phase, replaces that with "add to basket" without touching that file.
  function interceptBuy(e) {
    var btn = e.target.closest && e.target.closest("[data-checkout-num]");
    if (!btn) return;

    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();

    var card = btn.closest(".card");
    var select = card && card.querySelector("select.sg-size");
    if (select && !select.value) {
      warnOn(card, "Which size? Pick one above and we'll get it made.");
      select.focus();
      return;
    }

    var num = btn.dataset.checkoutNum;
    var word = btn.dataset.checkoutWord;
    var kind = btn.dataset.checkoutKind;
    var priceEl = card && card.querySelector(".card-price");

    add({
      id: checkoutId(num, word, kind),
      name: word,
      size: select ? select.value : null,
      qty: 1,
      price: parsePrice(priceEl && priceEl.textContent),
    });

    // Say what happened, on the button that was pressed, rather than yanking
    // the page somewhere. The basket opens only when someone asks for it.
    var original = btn.dataset.bkLabel || btn.textContent;
    btn.dataset.bkLabel = original;
    btn.textContent = "Added ✓";
    window.setTimeout(function () { btn.textContent = btn.dataset.bkLabel || original; }, 1400);
  }

  // ---------------------------------------------------------------- boot ---

  function start() {
    injectCss();
    buildPanel();
    buildButton();
    basket = load();
    render();
    document.addEventListener("click", interceptBuy, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
