// ===== Frog Logic — sizes for the apparel =====
//
// Two jobs, both about the same problem: a customer cannot see or touch the
// garment, so everything they need to get the size right has to be on the page.
//
//   1. a size guide on every tee and hoodie card;
//   2. a size picker, because the checkout needs to be told which one.
//
// Kept out of script.js on purpose. That file is 141KB of product data and
// artwork; this is a small, self-contained enhancement that can be read,
// changed or removed on its own.
//
// The tees and hoodies are US-cut unisex garments, so their letter sizes do not
// line up with UK sizes the way people expect — and the hoodie runs a full size
// larger than the tee at the same letter. Saying so on the page is the cheapest
// way to avoid a return.
//
// Garment chest is the full circumference: the manufacturers publish a
// half-chest "laid flat" measurement, doubled here.
//   Tee    — Bella + Canvas 3001, half-chest 18/20/22/24/26"
//   Hoodie — Gildan 18500 Heavy Blend, half-chest 20/22/24/26/28"
// UK equivalents are guidance, not gospel; the measurement is the fact.
(function () {
  "use strict";

  var SIZES = ["S", "M", "L", "XL", "2XL"];

  var GUIDES = {
    Tee: {
      garment: "Bella + Canvas 3001 unisex jersey tee",
      rows: [
        ["S", '36"', '32–34"', "8–10", "XS–S"],
        ["M", '40"', '36–38"', "12–14", "S–M"],
        ["L", '44"', '40–42"', "16–18", "M–L"],
        ["XL", '48"', '44–46"', "20–22", "L–XL"],
        ["2XL", '52"', '48–50"', "24–26", "XL–2XL"],
      ],
      note: "Cut straight and unisex, so it runs small against UK sizes — a UK 16 usually wants a Large, not a Medium.",
    },
    Hoodie: {
      garment: "Gildan 18500 Heavy Blend hooded sweatshirt",
      rows: [
        ["S", '40"', '36–38"', "12–14", "S"],
        ["M", '44"', '40–42"', "16–18", "M"],
        ["L", '48"', '44–46"', "20–22", "L"],
        ["XL", '52"', '48–50"', "24–26", "XL"],
        ["2XL", '56"', '52–54"', "28–30", "2XL"],
      ],
      note: "Roomier than the tee by a whole size. If you take a Medium in our tee, you want a Small in this.",
    },
  };

  var CSS = [
    ".size-guide{margin:12px 0 14px;border-top:1px solid var(--line);padding-top:10px}",
    ".size-guide>summary{cursor:pointer;font-family:var(--ui);font-weight:700;font-size:.72rem;",
    "letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}",
    ".size-guide>summary:hover{color:var(--ink)}",
    ".size-guide>summary:focus-visible{outline:3px solid var(--gold);outline-offset:3px}",
    ".size-guide .sg-inner{margin-top:10px}",
    ".size-guide .sg-scroll{overflow-x:auto}",
    ".size-guide table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}",
    ".size-guide th,.size-guide td{text-align:right;padding:6px 6px;border-bottom:1px solid var(--line);",
    "font-size:.8rem;white-space:nowrap}",
    ".size-guide th:first-child,.size-guide td:first-child{text-align:left;font-weight:700}",
    ".size-guide thead th{font-family:var(--ui);font-weight:700;text-transform:uppercase;",
    "letter-spacing:.08em;font-size:.6rem;color:var(--faint)}",
    ".size-guide .sg-how{margin:10px 0 0;font-size:.8rem;color:var(--muted);line-height:1.5}",
    ".size-guide .sg-note{margin:8px 0 0;font-size:.8rem;color:var(--ink);line-height:1.5}",
    ".size-guide .sg-garment{margin:8px 0 0;font-size:.72rem;color:var(--faint)}",
    ".sg-pick{margin:10px 0 12px}",
    ".sg-pick label{display:block;font-family:var(--ui);font-weight:700;font-size:.66rem;",
    "letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:6px}",
    ".sg-pick select{width:100%;padding:10px 12px;font:inherit;font-size:.95rem;color:var(--ink);",
    "background:transparent;border:1px solid var(--line);border-radius:6px;cursor:pointer}",
    ".sg-pick select:focus-visible{outline:3px solid var(--gold);outline-offset:2px}",
    ".sg-pick select[data-empty=\"1\"]{color:var(--muted)}",
    ".sg-warn{margin:8px 0 0;font-size:.82rem;color:var(--ink);font-weight:700}",
    ".sg-warn[hidden]{display:none}",
  ].join("");

  function injectCss() {
    if (document.getElementById("size-guide-css")) return;
    var s = document.createElement("style");
    s.id = "size-guide-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function kindOf(card) {
    var el = card.querySelector(".card-num");
    if (!el) return null;
    var parts = el.textContent.split("—");
    return parts.length > 1 ? parts[1].trim() : null;
  }

  // ---------------------------------------------------------------- guide ---

  function buildGuide(kind) {
    var g = GUIDES[kind];
    var d = document.createElement("details");
    d.className = "size-guide";

    var summary = document.createElement("summary");
    summary.textContent = "Size guide — please read, sizes run small";
    d.appendChild(summary);

    var inner = document.createElement("div");
    inner.className = "sg-inner";

    var how = document.createElement("p");
    how.className = "sg-how";
    how.textContent =
      "The surest way: take a top you already like the fit of, lay it flat, " +
      "measure straight across the chest under the arms, double it, and find " +
      "the nearest number in the Garment chest column.";
    inner.appendChild(how);

    var scroll = document.createElement("div");
    scroll.className = "sg-scroll";
    var table = document.createElement("table");

    var thead = document.createElement("thead");
    var hrow = document.createElement("tr");
    ["Size", "Garment chest", "Fits chest", "UK women's", "UK men's"].forEach(function (h) {
      var th = document.createElement("th");
      th.scope = "col";
      th.textContent = h;
      hrow.appendChild(th);
    });
    thead.appendChild(hrow);
    table.appendChild(thead);

    var tbody = document.createElement("tbody");
    g.rows.forEach(function (r) {
      var tr = document.createElement("tr");
      r.forEach(function (cell, i) {
        var td = document.createElement(i === 0 ? "th" : "td");
        if (i === 0) td.scope = "row";
        td.textContent = cell;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    scroll.appendChild(table);
    inner.appendChild(scroll);

    var note = document.createElement("p");
    note.className = "sg-note";
    note.textContent = g.note;
    inner.appendChild(note);

    var garment = document.createElement("p");
    garment.className = "sg-garment";
    garment.textContent = g.garment + ". UK sizes are a guide — the measurement is the fact.";
    inner.appendChild(garment);

    d.appendChild(inner);
    return d;
  }

  // --------------------------------------------------------------- picker ---

  var pickerSeq = 0;

  function buildPicker() {
    var wrap = document.createElement("div");
    wrap.className = "sg-pick";

    var id = "sg-size-" + ++pickerSeq;
    var label = document.createElement("label");
    label.setAttribute("for", id);
    label.textContent = "Size";
    wrap.appendChild(label);

    var select = document.createElement("select");
    select.id = id;
    select.className = "sg-size";
    select.dataset.empty = "1";
    select.required = true;

    // No pre-selected size on purpose. A default would let someone click
    // straight through and receive a Small they never asked for; the checkout
    // refuses a missing size for the same reason.
    var placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Choose a size";
    select.appendChild(placeholder);

    SIZES.forEach(function (s) {
      var o = document.createElement("option");
      o.value = s;
      o.textContent = s;
      select.appendChild(o);
    });

    select.addEventListener("change", function () {
      select.dataset.empty = select.value ? "0" : "1";
      var warn = wrap.querySelector(".sg-warn");
      if (warn && select.value) warn.hidden = true;
    });

    wrap.appendChild(select);

    var warn = document.createElement("p");
    warn.className = "sg-warn";
    warn.setAttribute("role", "status");
    warn.hidden = true;
    wrap.appendChild(warn);

    return wrap;
  }

  function warnOn(card, message) {
    var warn = card.querySelector(".sg-warn");
    if (!warn) return;
    warn.textContent = message;
    warn.hidden = false;
  }

  // Must stay identical to checkoutId() in script.js — the id the server looks
  // up in catalog.json is derived from these two fields.
  function checkoutId(num, word, kind) {
    var numPart = num.indexOf("—") !== -1 ? num.split("—")[0].trim() : num;
    var base = (numPart + "-" + word).replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
    return kind === "guide" ? "guide-" + base : base;
  }

  // script.js listens on document.body in the bubble phase and posts { id }
  // with no size. Catching the click here, on document in the capture phase,
  // lets a garment send its size without touching that file at all: everything
  // else falls through to the original handler untouched.
  function interceptBuy(e) {
    var btn = e.target.closest && e.target.closest("[data-checkout-num]");
    if (!btn) return;
    var card = btn.closest(".card");
    if (!card) return;
    var select = card.querySelector("select.sg-size");
    if (!select) return; // not a garment — let script.js handle it as before

    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();

    if (!select.value) {
      warnOn(card, "Which size? Pick one above and we'll get it made.");
      select.focus();
      return;
    }

    var id = checkoutId(btn.dataset.checkoutNum, btn.dataset.checkoutWord, btn.dataset.checkoutKind);
    var original = btn.textContent;
    btn.textContent = "One moment…";
    btn.disabled = true;

    fetch("/api/create-checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: id, size: select.value }),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (r) {
        if (!r.ok || !r.data.url) {
          warnOn(card, r.data.error || "Sorry, checkout isn't available right now.");
          btn.textContent = original;
          btn.disabled = false;
          return;
        }
        window.location.href = r.data.url;
      })
      .catch(function () {
        warnOn(card, "Sorry, something went wrong reaching checkout. Please try again in a moment.");
        btn.textContent = original;
        btn.disabled = false;
      });
  }

  // ---------------------------------------------------------------- wiring --

  function enhance() {
    var grid = document.getElementById("product-grid");
    if (!grid) return;
    injectCss();
    var cards = grid.querySelectorAll(".card");
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      if (card.querySelector(".size-guide")) continue;
      var kind = kindOf(card);
      if (!kind || !GUIDES[kind]) continue;
      var meta = card.querySelector(".card-meta");
      var price = card.querySelector(".card-price");
      var button = card.querySelector("[data-checkout-num]");
      if (!meta || !price) continue;
      // Guide first, then the picker directly above the button — read, choose,
      // buy, in that order.
      meta.insertBefore(buildGuide(kind), price.nextSibling);
      if (button) meta.insertBefore(buildPicker(), button);
    }
  }

  function start() {
    enhance();
    document.addEventListener("click", interceptBuy, true);
    var grid = document.getElementById("product-grid");
    if (!grid || typeof MutationObserver === "undefined") return;
    // The collection re-renders (low-stim mode, for one), which would otherwise
    // wipe the guides and pickers out.
    new MutationObserver(function () { enhance(); }).observe(grid, { childList: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
