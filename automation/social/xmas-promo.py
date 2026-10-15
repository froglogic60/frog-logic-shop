# Pictures for the Christmas push (Sam, 15 Oct 2026: "Go for it").
#
# The personalised Christmas frog mug, the two ornaments and the candle went
# live on Etsy on 15 Oct 2026, but nothing pointed at them. This makes the
# pictures the push needs, from the Printify mockups already on the listings:
#
#   assets/xmas/<slug>.jpg                      900x900   website card
#   automation/social/xmas/<slug>-pin.jpg       1000x1500 Pinterest pin
#   automation/social/xmas/<slug>-post.jpg      1080x1350 Facebook/Instagram post
#
# Read-only on Printify. Run by the "Christmas pictures" workflow, which commits
# the files [skip netlify].
import io, json, os, re, sys, urllib.request
from PIL import Image, ImageDraw, ImageFont, ImageOps

KEY = os.environ["PRINTIFY_API_KEY"]
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
FONTS = os.path.join(HERE, ".gfonts")

CREAM, BROWN, GREEN, RED = (244, 239, 227), (107, 74, 50), (34, 51, 31), (196, 69, 59)

# What each picture says. Matched to the Printify product by title.
PRODUCTS = [
    {"slug": "xmas-mug", "prefer": "context-2", "match": r"Christmas Frog Mug", "title": "Personalised\nChristmas Frog Mug", "line": "Any name, printed on", "where": "Made & posted in the UK"},
    {"slug": "xmas-ornament", "match": r"Personalised Frog Christmas Ornament", "title": "Personalised\nFrog Ornament", "line": "Their name, on the tree", "where": "UK & US versions"},
    {"slug": "xmas-ornament-us", "match": r"Personalized Frog Christmas Ornament", "title": "Personalized\nFrog Ornament", "line": "Their name, on the tree", "where": "Made & shipped in the US"},
    {"slug": "xmas-candle", "match": r"Christmas Frog Candle", "title": "Personalized\nFrog Candle", "line": "Pick the scent, add a name", "where": "Made & shipped in the US"},
]


def api(path):
    # Printify's firewall refuses Python's default "Python-urllib" user agent
    # (403 on the first run, 15 Oct 2026), so name the bot like the others.
    req = urllib.request.Request("https://api.printify.com/v1" + path, headers={"Authorization": "Bearer " + KEY, "User-Agent": "frog-logic-bot/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def fetch_image(url):
    req = urllib.request.Request(url, headers={"User-Agent": "frog-logic-bot"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return Image.open(io.BytesIO(r.read())).convert("RGB")


def font(name, size, weight=None):
    f = ImageFont.truetype(os.path.join(FONTS, name), size)
    if weight is not None:
        # Variable fonts: set only the weight axis, leave the others (Fraunces
        # also has optical size, softness, wonk) at their defaults.
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


def label(img_src):
    m = re.search(r"camera_label=([^&]+)", img_src or "")
    return m.group(1) if m else ""


def pick(images, prefer=None):
    """Lifestyle shots sell a gift better than a plain front view, so a context
    mockup first, then the front. `prefer` names a camera when the first
    context shot is the wrong one (the mug's context-1 shows only the name
    side; context-2 shows the frog)."""
    chosen = [i for i in images if i.get("is_selected_for_publishing")] or images
    if prefer:
        hit = [i for i in chosen if label(i["src"]) == prefer]
        if hit:
            front = [i for i in chosen if label(i["src"]).startswith("front")]
            return hit[0], (front or chosen)[0]
    ctx = [i for i in chosen if label(i["src"]).startswith("context")]
    front = [i for i in chosen if label(i["src"]).startswith("front")]
    return (ctx or front or chosen)[0], (front or chosen)[0]


def cover(img, w, h):
    return ImageOps.fit(img, (w, h), Image.LANCZOS, centering=(0.5, 0.5))


def text_block(draw, x, y, w, title, line, where, big):
    t = font("Fraunces-var.ttf", big, 600)
    c = font("Caveat-var.ttf", int(big * 0.62), 600)
    s = font("Fraunces-var.ttf", int(big * 0.36), 500)
    for part in title.split("\n"):
        tw = draw.textlength(part, font=t)
        draw.text((x + (w - tw) / 2, y), part, font=t, fill=BROWN)
        y += int(big * 1.12)
    y += int(big * 0.15)
    tw = draw.textlength(line, font=c)
    draw.text((x + (w - tw) / 2, y), line, font=c, fill=GREEN)
    y += int(big * 0.8)
    tw = draw.textlength(where, font=s)
    draw.text((x + (w - tw) / 2, y), where, font=s, fill=RED)
    return y + int(big * 0.5)


def mug_two_sides(prod, out_path):
    """Etsy's first photo for the personalised mug (Sam, 15 Oct 2026): the
    name side and the frog side next to each other, because no single mockup
    shows both and a buyer needs to see "it's personalised" in a thumbnail.
    Uses the black-handle variant's "right" (name) and "left" (frog) views."""
    black = [v["id"] for v in prod.get("variants", []) if v.get("is_enabled") and "black" in v.get("title", "").lower()]
    if not black:
        sys.exit("mug: no enabled black variant")
    # Each mockup's URL names the variant it shows (/mockup/<product>/<variant>/...).
    # variant_ids alone isn't enough: one mockup can list every colour, which
    # put a red and a pink mug side by side on the first run.
    imgs = [i for i in prod.get("images") or [] if f"/{black[0]}/" in i["src"]]
    by = {}
    for i in imgs:
        by.setdefault(label(i["src"]), i)
    if "right" not in by or "left" not in by:
        sys.exit(f"mug: need right and left views for the black variant, have {sorted(by)}")
    # Square: Etsy shows a square crop of the first photo in search, and a
    # 4:3 picture lost the name and the frog at the edges (first try, 15 Oct).
    W, H = 2000, 2000
    canvas = Image.new("RGB", (W, H), (255, 255, 255))
    for n, cam in enumerate(["right", "left"]):
        side = fetch_image(by[cam]["src"])
        s = min(side.size)
        side = side.crop(((side.width - s) // 2, (side.height - s) // 2, (side.width + s) // 2, (side.height + s) // 2))
        # The mug sits in the middle ~70% of Printify's square mockup; trim the
        # margin so the two mugs read large side by side.
        m = int(s * 0.10)
        side = side.crop((m, m, s - m, s - m)).resize((1000, 1000), Image.LANCZOS)
        canvas.paste(side, (n * 1000, 380))
    d = ImageDraw.Draw(canvas)
    f = font("Fraunces-var.ttf", 72, 600)
    for k, line in enumerate(["Your name on one side,", "the Christmas frog on the other"]):
        tw = d.textlength(line, font=f)
        d.text(((W - tw) / 2, 1480 + k * 100), line, font=f, fill=BROWN)
    canvas.save(out_path, quality=90, optimize=True)


def main():
    shops = api("/shops.json")
    etsy = next(s for s in shops if "etsy" in (s.get("sales_channel") or "").lower())
    products, page = [], 1
    while True:
        r = api(f"/shops/{etsy['id']}/products.json?limit=50&page={page}")
        products += r.get("data", [])
        if len(r.get("data", [])) < 50:
            break
        page += 1

    os.makedirs(os.path.join(ROOT, "assets", "xmas"), exist_ok=True)
    os.makedirs(os.path.join(HERE, "xmas"), exist_ok=True)
    made = []
    for spec in PRODUCTS:
        hits = [p for p in products if re.search(spec["match"], p["title"])]
        if len(hits) != 1:
            sys.exit(f"{spec['slug']}: expected one product matching {spec['match']!r}, found {len(hits)}")
        prod = api(f"/shops/{etsy['id']}/products/{hits[0]['id']}.json")
        hero, front = pick(prod.get("images") or [], spec.get("prefer"))
        photo = fetch_image(hero["src"])

        # Website card: the photo, square.
        cover(photo, 900, 900).save(os.path.join(ROOT, "assets", "xmas", spec["slug"] + ".jpg"), quality=86, optimize=True)

        # Pinterest pin, 2:3: photo on top, words underneath.
        pin = Image.new("RGB", (1000, 1500), CREAM)
        pin.paste(cover(photo, 1000, 1000), (0, 0))
        d = ImageDraw.Draw(pin)
        text_block(d, 0, 1040, 1000, spec["title"], spec["line"], spec["where"], 74)
        mark = font("Fraunces-var.ttf", 30, 500)
        tw = d.textlength("Frog Logic · on Etsy", font=mark)
        d.text(((1000 - tw) / 2, 1440), "Frog Logic · on Etsy", font=mark, fill=BROWN)
        pin.save(os.path.join(HERE, "xmas", spec["slug"] + "-pin.jpg"), quality=88, optimize=True)

        # Facebook/Instagram, 4:5: photo with a cream band at the foot.
        post = Image.new("RGB", (1080, 1350), CREAM)
        post.paste(cover(photo, 1080, 1000), (0, 0))
        d = ImageDraw.Draw(post)
        text_block(d, 0, 1030, 1080, spec["title"].replace("\n", " "), spec["line"], spec["where"], 62)
        post.save(os.path.join(HERE, "xmas", spec["slug"] + "-post.jpg"), quality=88, optimize=True)

        if spec["slug"] == "xmas-mug":
            mug_two_sides(prod, os.path.join(HERE, "xmas", "xmas-mug-two-sides.jpg"))
        made.append({"slug": spec["slug"], "printifyProductId": prod["id"], "title": prod["title"], "photo": label(hero["src"])})
        print(f"{spec['slug']}: {prod['title'][:60]} — photo '{label(hero['src'])}'")

    with open(os.path.join(HERE, "xmas", "made.json"), "w") as f:
        json.dump(made, f, indent=2)


if __name__ == "__main__":
    main()
