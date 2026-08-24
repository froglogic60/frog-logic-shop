// ===== Frog Logic — size guides for the apparel =====
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
      if (!meta || !price) continue;
      // Sits between the price and the buy button, where the question occurs.
      meta.insertBefore(buildGuide(kind), price.nextSibling);
    }
  }

  function start() {
    enhance();
    var grid = document.getElementById("product-grid");
    if (!grid || typeof MutationObserver === "undefined") return;
    // The collection re-renders (low-stim mode, for one), which would otherwise
    // wipe the guides out.
    new MutationObserver(function () { enhance(); }).observe(grid, { childList: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
