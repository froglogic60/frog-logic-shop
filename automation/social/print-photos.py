# Extra Etsy photos for the wall prints (Sam, 15 Oct 2026: "yes do number 2").
#
# The 34 print listings (17 designs, each listed once from the UK maker and
# once from the US maker) had 3 photos each: Printify's front view and its two
# room shots, which is all Printify offers for this poster. Mugs and tees have
# 5-10. This makes three more per design, from the design's own artwork:
#
#   automation/social/print-photos/<slug>-closeup.jpg   the artwork, close up
#   automation/social/print-photos/<slug>-size.jpg      to scale over a sofa,
#                                                       with the measurements
#   automation/social/print-photos/<slug>-more.jpg      three other designs
#                                                       from the range
#
# All 2000x2000 (Etsy shows a square crop). Facts on the pictures come from the
# listing description: 16 x 16 inch semi-gloss poster, frame not included.
# Read-only on Printify. Run by the "Print photos" workflow ([skip netlify]).
import io, json, os, re, sys, urllib.request
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

KEY = os.environ.get("PRINTIFY_API_KEY", "")
HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(HERE, ".gfonts")
OUT = os.path.join(HERE, "print-photos")
ONLY = [s.strip() for s in os.environ.get("ONLY", "").split(",") if s.strip()]

CREAM, BROWN, GREEN, WALL, SOFA, SOFA_DARK, FLOOR = (244, 239, 227), (107, 74, 50), (34, 51, 31), (233, 228, 216), (127, 140, 120), (104, 116, 98), (214, 200, 178)
S = 2000


def api(path):
    req = urllib.request.Request("https://api.printify.com/v1" + path, headers={"Authorization": "Bearer " + KEY, "User-Agent": "frog-logic-bot/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def fetch_image(url):
    req = urllib.request.Request(url, headers={"User-Agent": "frog-logic-bot/1.0"})
    with urllib.request.urlopen(req, timeout=90) as r:
        return Image.open(io.BytesIO(r.read())).convert("RGB")


def font(name, size, weight=None):
    f = ImageFont.truetype(os.path.join(FONTS, name), size)
    if weight is not None:
        axes = f.get_variation_axes()
        values = [a.get("default", a["minimum"]) for a in axes]
        for i, a in enumerate(axes):
            n = a.get("name", "")
            n = (n.decode() if isinstance(n, bytes) else str(n)).lower()
            if "weight" in n:
                values[i] = weight
            elif "optical" in n:
                values[i] = max(a["minimum"], min(a["maximum"], round(size * 0.75)))
        f.set_variation_by_axes(values)
    return f


def centred(d, y, text, f, fill):
    w = d.textlength(text, font=f)
    d.text(((S - w) / 2, y), text, font=f, fill=fill)


def shadowed(canvas, art, x, y, blur=18, offset=(0, 14), alpha=90):
    """Paste art with a soft drop shadow, like paper on a wall."""
    sh = Image.new("L", (art.width + blur * 4, art.height + blur * 4), 0)
    ImageDraw.Draw(sh).rectangle((blur * 2, blur * 2, blur * 2 + art.width, blur * 2 + art.height), fill=alpha)
    sh = sh.filter(ImageFilter.GaussianBlur(blur))
    canvas.paste((60, 50, 40), (x - blur * 2 + offset[0], y - blur * 2 + offset[1]), sh)
    canvas.paste(art, (x, y))


def closeup(art, out):
    # The middle 72% of the artwork: close enough for the lettering and paper
    # texture to read, loose enough not to cut words in half (55% did).
    w, h = art.size
    c = 0.72
    box = (int(w * (1 - c) / 2), int(h * (1 - c) / 2), int(w * (1 + c) / 2), int(h * (1 + c) / 2))
    img = art.crop(box).resize((S, S), Image.LANCZOS)
    # No label: a pill in the corner covered lettering on some designs.
    img.save(out, quality=90, optimize=True)


def size_guide(art, out):
    # To scale: 20 px per inch. A 16 in poster is 320 px; a 78 in sofa 1560 px.
    PX = 20
    img = Image.new("RGB", (S, S), WALL)
    d = ImageDraw.Draw(img)
    floor_y = 1430
    d.rectangle((0, floor_y, S, S), fill=FLOOR)
    d.rectangle((0, floor_y - 14, S, floor_y), fill=(240, 236, 228))  # skirting
    # Sofa, 78 in wide, 34 in tall, centred.
    sw, sh_ = 78 * PX, 34 * PX
    sx, sy = (S - sw) // 2, floor_y - sh_
    d.rounded_rectangle((sx, sy, sx + sw, sy + int(sh_ * 0.62)), radius=50, fill=SOFA_DARK)          # back
    d.rounded_rectangle((sx - 40, sy + int(sh_ * 0.38), sx + 150, floor_y - 60), radius=50, fill=SOFA)  # arms
    d.rounded_rectangle((sx + sw - 150, sy + int(sh_ * 0.38), sx + sw + 40, floor_y - 60), radius=50, fill=SOFA)
    d.rounded_rectangle((sx + 110, sy + int(sh_ * 0.52), sx + sw - 110, floor_y - 60), radius=30, fill=SOFA)  # seat
    for lx in (sx + 40, sx + sw - 70):
        d.rectangle((lx, floor_y - 60, lx + 30, floor_y), fill=(90, 70, 55))
    # Poster, 16 x 16 in, centred above the sofa with a hand's width between.
    p = 16 * PX
    px, py = (S - p) // 2, sy - p - 9 * PX
    shadowed(img, art.resize((p, p), Image.LANCZOS), px, py, blur=8, offset=(0, 6), alpha=70)
    d = ImageDraw.Draw(img)
    # Dimension lines.
    lab = font("Fraunces-var.ttf", 40, 500)
    y = py - 50
    d.line((px, y, px + p, y), fill=BROWN, width=4)
    for x in (px, px + p):
        d.line((x, y - 16, x, y + 16), fill=BROWN, width=4)
    t = "16 in · 40.6 cm"
    d.text((px + (p - d.textlength(t, font=lab)) / 2, y - 64), t, font=lab, fill=BROWN)
    x = px + p + 50
    d.line((x, py, x, py + p), fill=BROWN, width=4)
    for yy in (py, py + p):
        d.line((x - 16, yy, x + 16, yy), fill=BROWN, width=4)
    d.text((x + 28, py + p / 2 - 24), "16 in", font=lab, fill=BROWN)
    # Words.
    d.rectangle((0, 1560, S, S), fill=CREAM)
    centred(d, 1610, "16 × 16 inch square poster", font("Fraunces-var.ttf", 92, 600), BROWN)
    centred(d, 1740, "Semi-gloss paper · frame not included", font("Fraunces-var.ttf", 58, 500), GREEN)
    centred(d, 1840, "Shown to scale above a standard sofa", font("Caveat-var.ttf", 60, 600), BROWN)
    img.save(out, quality=90, optimize=True)


def more(arts, out):
    img = Image.new("RGB", (S, S), CREAM)
    d = ImageDraw.Draw(img)
    centred(d, 400, "More from the collection", font("Fraunces-var.ttf", 100, 600), BROWN)
    centred(d, 540, "More designs in the FrogLogic shop", font("Caveat-var.ttf", 72, 600), GREEN)
    tile = 580
    gap = (S - 3 * tile) // 4
    y = 760
    for i, a in enumerate(arts[:3]):
        x = gap + i * (tile + gap)
        shadowed(img, a.resize((tile, tile), Image.LANCZOS), x, y)
    d = ImageDraw.Draw(img)
    centred(d, 1470, "16 × 16 inch prints · made to order", font("Fraunces-var.ttf", 60, 500), BROWN)
    img.save(out, quality=90, optimize=True)


def slug(title):
    base = re.split(r"\s+(?:Wall Print|—)", title)[0]
    return re.sub(r"[^a-z0-9]+", "-", base.lower()).strip("-")


def artwork(prod):
    for area in prod.get("print_areas") or []:
        for ph in area.get("placeholders") or []:
            for im in ph.get("images") or []:
                if im.get("src"):
                    return im["src"]
    return None


def main():
    os.makedirs(OUT, exist_ok=True)
    shops = api("/shops.json")
    etsy = next(s for s in shops if "etsy" in (s.get("sales_channel") or "").lower())
    products, page = [], 1
    while True:
        r = api(f"/shops/{etsy['id']}/products.json?limit=50&page={page}")
        products += r.get("data", [])
        if len(r.get("data", [])) < 50:
            break
        page += 1
    prints = [p for p in products if "Wall Print" in p["title"]]
    designs = {}
    for p in prints:
        designs.setdefault(slug(p["title"]), []).append(p)
    print(f"{len(prints)} print listings, {len(designs)} designs")
    if len(designs) * 2 != len(prints):
        print("note: not every design has exactly a UK and a US listing")

    arts, manifest = {}, {}
    for s, ps in sorted(designs.items()):
        src = None
        for p in ps:
            src = artwork(api(f"/shops/{etsy['id']}/products/{p['id']}.json"))
            if src:
                break
        if not src:
            sys.exit(f"{s}: no artwork found")
        art = fetch_image(src)
        side = min(art.size)
        arts[s] = ImageOps.fit(art, (side, side), Image.LANCZOS)
        manifest[s] = {"titles": [p["title"] for p in ps], "printifyIds": [p["id"] for p in ps], "artwork": src}

    names = sorted(arts)
    for i, s in enumerate(names):
        if ONLY and s not in ONLY:
            continue
        others = [arts[names[(i + k) % len(names)]] for k in (1, 2, 3)]
        closeup(arts[s], os.path.join(OUT, f"{s}-closeup.jpg"))
        size_guide(arts[s], os.path.join(OUT, f"{s}-size.jpg"))
        more(others, os.path.join(OUT, f"{s}-more.jpg"))
        manifest[s]["more"] = [names[(i + k) % len(names)] for k in (1, 2, 3)]
        print("made", s)
    with open(os.path.join(OUT, "manifest.json"), "w") as f:
        json.dump(manifest, f, indent=2)


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--sample":
        # Local layout check with stand-in artwork; no Printify needed.
        os.makedirs(OUT, exist_ok=True)
        def fake(col, word):
            a = Image.new("RGB", (1200, 1200), col)
            d = ImageDraw.Draw(a)
            f = font("Fraunces-var.ttf", 120, 700)
            for k in range(5):
                d.text((120, 200 + k * 170), word, font=f, fill=CREAM)
            return a
        a = [fake((67, 104, 76), "INFO DUMP"), fake((60, 70, 140), "NOT BROKEN"), fake((170, 120, 40), "JUSTICE"), fake((40, 110, 90), "FOUND MY")]
        closeup(a[0], os.path.join(OUT, "sample-closeup.jpg"))
        size_guide(a[0], os.path.join(OUT, "sample-size.jpg"))
        more(a[1:], os.path.join(OUT, "sample-more.jpg"))
    else:
        main()
