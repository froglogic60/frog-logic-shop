#!/usr/bin/env python3
"""Build a Frog Logic printable PDF from a product JSON file.

Why this exists
---------------
The original PDFs in digital/ were made with WeasyPrint by a tool that is no
longer around, so when "Show These Cards" was renamed to "When Words Go" there
was nothing left to regenerate the file with. The shop sold one name and
delivered a file with another on its cover, and the description inside still
named the Hidden Disabilities Sunflower, a registered trademark Frog Logic has
no affiliation with.

This puts the generator in the repo, so the next rename is a script run rather
than a rebuild. Content lives in automation/pdf/products/*.json; layout lives
here. Same renderer as the originals (WeasyPrint) so the output is consistent
with the rest of the collection.

    python3 automation/pdf/build.py when-words-go
    python3 automation/pdf/build.py --all

Fonts are downloaded once into automation/social/.gfonts (shared with the pin
and social renderers, and gitignored) so a clean checkout needs no setup.
"""
import base64
import json
import os
import sys
import urllib.request

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
PRODUCTS = os.path.join(os.path.dirname(__file__), "products")
FONT_DIR = os.path.join(ROOT, "automation", "social", ".gfonts")

# The same upstream binaries Google Fonts serves. Fraunces is the display serif
# the whole collection uses; DM Sans carries the small body text on a card,
# where a variable serif at 7pt turns to mush; Space Mono is the label voice.
FONTS = [
    ("fraunces/Fraunces%5BSOFT,WONK,opsz,wght%5D.ttf", "Fraunces-var.ttf", "Fraunces", "100 900"),
    ("dmsans/DMSans%5Bopsz,wght%5D.ttf", "DMSans-var.ttf", "DM Sans", "100 1000"),
    ("spacemono/SpaceMono-Regular.ttf", "SpaceMono.ttf", "Space Mono", "400"),
    ("spacemono/SpaceMono-Bold.ttf", "SpaceMono-Bold.ttf", "Space Mono", "700"),
    # The rest of the collection's faces. A card sheet only needs the first
    # four, but a sheet of product artwork carries whatever the designs use, and
    # a missing face does not fail loudly — it silently substitutes and the
    # artwork comes out looking like someone else's.
    ("instrumentserif/InstrumentSerif-Regular.ttf", "InstrumentSerif.ttf", "Instrument Serif", "400"),
    ("anton/Anton-Regular.ttf", "Anton.ttf", "Anton", "400"),
    ("spacegrotesk/SpaceGrotesk%5Bwght%5D.ttf", "SpaceGrotesk-var.ttf", "Space Grotesk", "300 700"),
    ("abrilfatface/AbrilFatface-Regular.ttf", "AbrilFatface.ttf", "Abril Fatface", "400"),
    ("syne/Syne%5Bwght%5D.ttf", "Syne-var.ttf", "Syne", "400 800"),
    ("caveat/Caveat%5Bwght%5D.ttf", "Caveat-var.ttf", "Caveat", "400 700"),
]
FONT_BASE = "https://raw.githubusercontent.com/google/fonts/main/ofl/"

INK = "#1A1A1A"
CREAM = "#FBFAF6"
GOLD = "#E8B63C"
MUTED = "#7F786C"
FAINT = "#A9A296"
RULE = "#D8D3CA"


def ensure_fonts():
    os.makedirs(FONT_DIR, exist_ok=True)
    for src, out, _, _ in FONTS:
        target = os.path.join(FONT_DIR, out)
        if os.path.exists(target) and os.path.getsize(target) > 10000:
            continue
        print("  downloading", out)
        with urllib.request.urlopen(FONT_BASE + src) as r:
            data = r.read()
        with open(target, "wb") as f:
            f.write(data)


def font_face_css():
    out = []
    for _, filename, family, weight in FONTS:
        path = os.path.join(FONT_DIR, filename).replace("\\", "/")
        style = "font-style:italic;" if "Italic" in filename else ""
        out.append(
            "@font-face{font-family:'%s';src:url('file://%s');font-weight:%s;%s}"
            % (family, path, weight, style)
        )
    return "\n".join(out)


def mark_data_uri():
    with open(os.path.join(ROOT, "assets", "frog-logic-mark-sm.png"), "rb") as f:
        return "data:image/png;base64," + base64.b64encode(f.read()).decode()


def esc(s):
    return (
        str(s)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def card_html(card, mark):
    """One 85x54mm card.

    A card is a single message read at arm's length by someone who is not
    expecting it, so the title carries the whole job and the sub-line is
    support. Blank cards exist so a person can add their own without the sheet
    looking unfinished.
    """
    cls = "card invert" if card.get("invert") else "card"
    parts = []
    if card.get("title"):
        parts.append('<p class="card-title">%s</p>' % esc(card["title"]))
    for _ in range(card.get("lines", 0)):
        parts.append('<span class="fill"></span>')
    if card.get("sub"):
        parts.append('<p class="card-sub">%s</p>' % esc(card["sub"]))
    for _ in range(card.get("linesAfter", 0)):
        parts.append('<span class="fill"></span>')
    parts.append(
        '<div class="card-foot"><span class="card-brand">FROG LOGIC</span>'
        '<img class="card-mark" src="%s"></div>' % mark
    )
    return '<div class="%s">%s</div>' % (cls, "".join(parts))


def tile_html(tile):
    """One square of artwork, with its name under it.

    The name sits outside the cut line on purpose: the sticker is the artwork,
    not the artwork plus a caption. It is there so someone cutting out nine
    squares knows which is which, and so the sheet reads as a contents page
    rather than a puzzle.
    """
    return (
        '<div class="tile">'
        '<div class="tile-art" style="background:%s">%s</div>'
        '<p class="tile-name">%s</p>'
        "</div>"
    ) % (esc(tile.get("bg", "#FFFFFF")), tile["svg"], esc(tile.get("name", "")))


def sheet_html(sheet, title, mark, licence=None):
    head = (
        '<div class="head">'
        '<div class="brand"><img class="brand-mark" src="%s"><span>Frog Logic</span></div>'
        '<div class="head-right"><p class="doc-title">%s</p>'
        '<p class="doc-sub">%s</p></div>'
        "</div>" % (mark, esc(title), esc(sheet.get("label", "")))
    )
    intro = '<p class="intro">%s</p>' % esc(sheet["intro"]) if sheet.get("intro") else ""

    # Two kinds of sheet. "cards" is the 85x54mm message card. "tiles" is a
    # grid of the shop's own artwork, printed square so it can be cut out —
    # the same designs that go on vinyl, on paper you already own.
    if sheet.get("type") == "tiles":
        body = '<div class="tiles">%s</div>' % "".join(tile_html(t) for t in sheet["tiles"])
    else:
        body = '<div class="grid">%s</div>' % "".join(card_html(c, mark) for c in sheet["cards"])
    # The licence line rides in the last sheet's footer on purpose. In the
    # original it sat outside the sheets and overflowed onto a fourth,
    # otherwise blank page — three sheets of cards, then a page carrying one
    # sentence. Anyone printing all pages wasted a sheet of paper on it.
    lic = '<p class="licence">%s</p>' % esc(licence) if licence else ""
    foot = (
        '<div class="foot"><p class="foot-note">%s</p>'
        '<p class="foot-brand">FROG LOGIC — MADE WITH CARE</p>%s</div>'
        % (esc(sheet.get("note", "")), lic)
    )
    return '<section class="sheet">%s%s%s%s</section>' % (head, intro, body, foot)


def build(spec):
    mark = mark_data_uri()
    last = len(spec["sheets"]) - 1
    sheets = "".join(
        sheet_html(s, spec["title"], mark, spec.get("licence") if i == last else None)
        for i, s in enumerate(spec["sheets"])
    )

    css = """
%(fonts)s
@page { size: A4; margin: 14mm 16mm 12mm; }
* { box-sizing: border-box; }
body { margin: 0; font-family: 'DM Sans', sans-serif; color: %(ink)s; }
.sheet { page-break-after: always; }
.sheet:last-child { page-break-after: auto; }

.head { display: flex; align-items: flex-end; justify-content: space-between;
        border-bottom: 0.6pt solid %(rule)s; padding-bottom: 3mm; }
.brand { display: flex; align-items: center; gap: 2.4mm; }
.brand-mark { width: 6.4mm; height: 6.4mm; }
.brand span { font-family: 'Fraunces', serif; font-weight: 700; font-size: 12pt;
              white-space: nowrap; }
.head-right { text-align: right; }
.doc-title { font-family: 'Fraunces', serif; font-weight: 700; font-size: 19pt;
             margin: 0 0 1.2mm; letter-spacing: -0.01em; white-space: nowrap; }
.doc-sub { font-family: 'Space Mono', monospace; font-size: 6.6pt;
           letter-spacing: 0.16em; color: %(muted)s; margin: 0; }

.intro { background: %(cream)s; border-left: 1.2mm solid %(gold)s;
         padding: 3.4mm 4mm; margin: 5mm 0 0; font-size: 8.4pt;
         line-height: 1.55; color: #3A3630; }

.grid { display: flex; flex-wrap: wrap; gap: 4mm; margin-top: 5mm; }
.card { width: 85mm; height: 54mm; border: 1pt solid %(ink)s; border-radius: 2mm;
        padding: 4mm 4.4mm 3mm; display: flex; flex-direction: column;
        position: relative; }
.card.invert { background: %(ink)s; border-color: %(ink)s; }
.card-title { font-family: 'Fraunces', serif; font-weight: 700; font-size: 11.5pt;
              line-height: 1.24; margin: 0 0 2mm; }
.card.invert .card-title { color: %(cream)s; }
.card-sub { font-size: 7.2pt; line-height: 1.45; margin: 0; color: #4A453D; }
.card.invert .card-sub { color: #D6D1C6; }
.fill { display: block; border-bottom: 0.5pt solid %(rule)s; height: 6.5mm; }
.fill:nth-of-type(even) { border-bottom-color: #E3D6BA; }
/* Pinned rather than pushed down with margin-top:auto — WeasyPrint's flex
   implementation does not honour auto margins the way a browser does, and the
   footer ended up tucked under the text instead of sitting on the cut line. */
.card-foot { position: absolute; left: 4.4mm; right: 4.4mm; bottom: 3mm;
             display: flex; align-items: flex-end; justify-content: space-between; }
.card-brand { font-family: 'Space Mono', monospace; font-size: 5pt;
              letter-spacing: 0.22em; color: %(faint)s; }
.card.invert .card-brand { color: #8C867A; }
.card-mark { width: 4mm; height: 4mm; }

/* Artwork tiles. 54mm squares, three across, with a dashed cut line so the
   edge is visible without printing a heavy border into the sticker itself. */
.tiles { display: flex; flex-wrap: wrap; gap: 5mm 4mm; margin-top: 5mm; }
.tile { width: 54mm; }
.tile-art { width: 54mm; height: 54mm; border: 0.5pt dashed %(faint)s; overflow: hidden; }
.tile-art svg { display: block; width: 100%%; height: 100%%; }
.tile-name { font-family: 'Space Mono', monospace; font-size: 5.6pt; letter-spacing: 0.1em;
             text-transform: uppercase; color: %(faint)s; margin: 1.6mm 0 0; text-align: center; }

.foot { margin-top: 6mm; text-align: center; }
.foot-note { font-family: 'Space Mono', monospace; font-size: 6pt;
             letter-spacing: 0.14em; color: %(faint)s; margin: 0 0 3mm; }
.foot-brand { font-family: 'Space Mono', monospace; font-size: 6pt;
              letter-spacing: 0.2em; color: #BDB6AA; margin: 0; }
.licence { font-size: 6.4pt; color: %(faint)s; text-align: center;
           margin: 3mm 0 0; line-height: 1.5; }
""" % {
        "fonts": font_face_css(),
        "ink": INK, "cream": CREAM, "gold": GOLD,
        "muted": MUTED, "faint": FAINT, "rule": RULE,
    }

    return (
        "<!doctype html><html><head><meta charset='utf-8'>"
        "<title>%s</title><style>%s</style></head><body>%s</body></html>"
        % (esc(spec["title"]), css, sheets)
    )


def main():
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        sys.exit(1)
    ensure_fonts()

    names = (
        [f[:-5] for f in sorted(os.listdir(PRODUCTS)) if f.endswith(".json")]
        if args[0] == "--all"
        else args
    )

    from weasyprint import HTML  # imported late so --help works without it

    for name in names:
        spec_path = os.path.join(PRODUCTS, name + ".json")
        with open(spec_path, encoding="utf-8") as f:
            spec = json.load(f)
        print(spec["title"])
        html = build(spec)
        out = os.path.join(ROOT, spec["output"])
        os.makedirs(os.path.dirname(out), exist_ok=True)
        HTML(string=html, base_url=ROOT).write_pdf(out)
        pieces = sum(len(s.get("cards") or s.get("tiles") or []) for s in spec["sheets"])
        print("  %d sheets, %d pieces -> %s (%d bytes)"
              % (len(spec["sheets"]), pieces, spec["output"], os.path.getsize(out)))

        # A renamed product keeps its old filename alive on purpose. Download
        # links are minted at purchase and live in a customer's inbox, so
        # deleting the old file would break any link already sent — while
        # leaving the old file untouched would keep serving the old text. This
        # writes the corrected document to both names.
        with open(out, "rb") as f:
            data = f.read()
        for extra in spec.get("alsoWriteTo", []):
            path = os.path.join(ROOT, extra)
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, "wb") as f:
                f.write(data)
            print("  also written to %s (old download links keep working)" % extra)


if __name__ == "__main__":
    main()
