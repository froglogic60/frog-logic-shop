# Printable Christmas cards, Socially Hibernating, in the bright and the black
# and white colourways (Sam, 20 Oct 2026: her group poll wanted both).
#
# Each card is one landscape sheet folded in half: the right half is the front,
# the left half the back, and page two is the inside. White backgrounds so a
# home printer isn't asked for a full-bleed colour, and no edge-to-edge art.
# Three fronts per colourway, in A4 and US Letter.
#
# Writes to digital/:
#   Christmas-Cards-Original.pdf            A4, 6 pages (3 cards), the soft colours
#   Christmas-Cards-Original-Letter.pdf     US Letter
#   Christmas-Cards-Bright.pdf              A4, 6 pages (3 cards)
#   Christmas-Cards-Bright-Letter.pdf       US Letter
#   Christmas-Cards-Black-and-White.pdf     A4
#   Christmas-Cards-Black-and-White-Letter.pdf
# and previews to automation/social/xmas-cards/<colourway>-<n>.png
# Usage: python socially-hibernating-cards.py <fonts dir>
import importlib.util, os, random, sys
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "../../.."))
DIGITAL = os.path.join(ROOT, "digital")
PREVIEWS = os.path.join(ROOT, "automation/social/xmas-cards")

def load(name):
    spec = importlib.util.spec_from_file_location(name, os.path.join(HERE, name + ".py"))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m
sh = load("socially-hibernating")
cw = load("socially-hibernating-colourways")
if len(sys.argv) > 1:
    sh.FONTS = sys.argv[1]

DPI = 300
SIZES = {"": (3508, 2480), "-Letter": (3300, 2550)}  # landscape, 300 dpi

# Original (24 Oct 2026, Sam: the muted voters should have cards too): the
# untouched soft colours, brown words like the hoodie, cream-and-gold snow.
ORIGINAL = {}
COLOURWAYS = {
    "Original": dict(table=ORIGINAL, ink="#6b4a32", sub="#6b4a32", dots=["#e8b63c", "#c4453b", "#5b7fc4", "#7fb069", "#d46aa0"], outline=None),
    "Bright": dict(table=cw.BRIGHT, ink="#e0187a", sub="#1f6bff", dots=["#ffd400", "#ff2438", "#1f6bff", "#18e06f", "#ff3fd2"], outline=None),
    "Black-and-White": dict(table=cw.MONO, ink="#111111", sub="#111111", dots=[], outline="#111111"),
}
FRONTS = [
    ("Socially Hibernating", "see you in January", True),
    ("Merry Christmas", "from the pond", False),
    ("Thinking of you", "(from under a blanket)", False),
]

def snow(d, W, H, c, rnd, n, outline=None, keep_clear=None):
    # keep_clear: a box the snow stays out of, so no dot lands on the words.
    for _ in range(n):
        x, y, r = rnd.randrange(W), rnd.randrange(H), rnd.choice([10, 14, 18, 24])
        if keep_clear and keep_clear[0] < x < keep_clear[2] and keep_clear[1] < y < keep_clear[3]:
            continue
        if outline:
            d.ellipse((x - r, y - r, x + r, y + r), outline=outline, width=4)
        else:
            d.ellipse((x - r, y - r, x + r, y + r), fill=rnd.choice(c))

def fold_marks(d, W, H):
    x = W // 2
    for y0, y1 in ((0, 60), (H - 60, H)):
        d.line((x, y0, x, y1), fill="#999999", width=3)

def front(art_words, art_plain, title, cap, use_words, c, W, H, rnd):
    # The right half of the sheet. Frog on its circle, words above and below.
    half = W // 2
    page = Image.new("RGBA", (half, H), (255, 255, 255, 255))
    d = ImageDraw.Draw(page)
    size = int(half * 0.86)
    k = size / 3000
    x0, y0 = (half - size) // 2, (H - size) // 2
    clear = (x0 + 380 * k, y0 + 90 * k, x0 + size - 380 * k, y0 + 2900 * k)
    snow(d, half, H, c["dots"], rnd, 110, c["outline"], clear)
    if use_words:
        art = art_words.resize((size, size), Image.LANCZOS)
        page.alpha_composite(art, ((half - size) // 2, (H - size) // 2))
    else:
        art = art_plain.resize((size, size), Image.LANCZOS)
        page.alpha_composite(art, ((half - size) // 2, (H - size) // 2))
        d = ImageDraw.Draw(page)
        t = sh.font("Fraunces-var.ttf", int(250 * k), 600)
        d.text(((half - d.textlength(title, font=t)) / 2, (H - size) // 2 + 150 * k), title, font=t, fill=c["ink"])
        cf = sh.font("Caveat-var.ttf", int(230 * k), 600)
        d.text(((half - d.textlength(cap, font=cf)) / 2, (H - size) // 2 + 2560 * k), cap, font=cf, fill=c["ink"])
    return page

def back(art_plain, c, W, H):
    half = W // 2
    page = Image.new("RGBA", (half, H), (255, 255, 255, 255))
    small = cw.tight(art_plain); small.thumbnail((int(half * 0.14), int(half * 0.14)))
    page.alpha_composite(small, ((half - small.width) // 2, int(H * 0.80)))
    d = ImageDraw.Draw(page)
    f = sh.font("SpaceMono.ttf", 30)
    for i, line in enumerate(["FROG LOGIC", "a Socially Hibernating card, printed at home"]):
        d.text(((half - d.textlength(line, font=f)) / 2, int(H * 0.80) + small.height + 30 + i * 44), line, font=f, fill="#8a8a8a")
    return page

def inside(art_plain, c, W, H, rnd):
    page = Image.new("RGBA", (W, H), (255, 255, 255, 255))
    d = ImageDraw.Draw(page)
    half = W // 2
    # A little frog asleep in the bottom corner of the right-hand page, and
    # the rest left blank for the writing.
    small = cw.tight(art_plain); small.thumbnail((int(half * 0.22), int(half * 0.22)))
    page.alpha_composite(small, (W - small.width - int(half * 0.06), H - small.height - int(H * 0.05)))
    z = sh.font("Caveat-var.ttf", 60, 700)
    d = ImageDraw.Draw(page)
    x0, y0 = W - small.width - int(half * 0.06), H - small.height - int(H * 0.05)
    for i, (dx, dy) in enumerate([(0.72, 0.30), (0.80, 0.20), (0.87, 0.10)]):
        d.text((x0 + small.width * dx, y0 + small.height * dy), "z", font=z, fill=c["ink"])
    fold_marks(d, W, H)
    return page

def sheet(front_img, back_img, W, H):
    page = Image.new("RGBA", (W, H), (255, 255, 255, 255))
    page.alpha_composite(back_img, (0, 0))
    page.alpha_composite(front_img, (W // 2, 0))
    fold_marks(ImageDraw.Draw(page), W, H)
    return page

CREAM, INK, FAINT = (244, 239, 227), "#1a1a1a", "#6b6b6b"

def caption(img, title, sub, colour):
    d = ImageDraw.Draw(img)
    t = sh.font("Fraunces-var.ttf", 96, 600)
    d.text(((img.width - d.textlength(title, font=t)) / 2, 90), title, font=t, fill=colour)
    f = sh.font("SpaceMono.ttf", 34)
    d.text(((img.width - d.textlength(sub, font=f)) / 2, 215), sub, font=f, fill=FAINT)

def listing_images(name, c, fronts, outside, rnd):
    # Five 2000x1500 images for the Etsy listing (Etsy's 4:3 crop).
    W, H = 2000, 1500
    out = []
    pretty = {"Bright": "Bright Colours", "Black-and-White": "Black and White"}.get(name, "the Original Colours")
    # 1: the three fronts fanned.
    img = Image.new("RGB", (W, H), CREAM)
    for i, f in enumerate(fronts):
        t = f.convert("RGB").copy(); t.thumbnail((560, 1080))
        shadow = Image.new("RGB", (t.width + 24, t.height + 24), (210, 204, 190))
        x = 90 + i * 620
        img.paste(shadow, (x + 12, 330 + 12)); img.paste(t, (x, 330))
    caption(img, f"Christmas Cards in {pretty}", "THREE PRINTABLE CARDS · A4 AND US LETTER · PRINT AT HOME", c["ink"])
    out.append(img)
    # 2: the folded sheet, how it works.
    img = Image.new("RGB", (W, H), CREAM)
    o = outside.convert("RGB").copy(); o.thumbnail((1500, 1060))
    img.paste(o, ((W - o.width) // 2, 320))
    caption(img, "One sheet, folded in half", "FRONT ON THE RIGHT, BACK ON THE LEFT, BLANK INSIDE FOR YOUR WORDS", c["ink"])
    out.append(img)
    # 3–5: each front, close.
    subs = ["\u201cSOCIALLY HIBERNATING \u2014 SEE YOU IN JANUARY\u201d", "\u201cMERRY CHRISTMAS \u2014 FROM THE POND\u201d", "\u201cTHINKING OF YOU (FROM UNDER A BLANKET)\u201d"]
    for f, sub in zip(fronts, subs):
        img = Image.new("RGB", (W, H), CREAM)
        t = f.convert("RGB").copy(); t.thumbnail((900, 1120))
        img.paste(t, ((W - t.width) // 2, 320))
        caption(img, {"Bright": "Bright, for the ones who like bright", "Black-and-White": "Colour it in, or leave it crisp"}.get(name, "The soft colours, on a card"), sub, c["ink"])
        out.append(img)
    for i, img in enumerate(out):
        img.save(os.path.join(PREVIEWS, f"{name.lower()}-listing-{i + 1}.png"))

def main():
    os.makedirs(DIGITAL, exist_ok=True); os.makedirs(PREVIEWS, exist_ok=True)
    for name, c in COLOURWAYS.items():
        plain = sh.render(cw.recolour(sh.svg(), c["table"]))
        if name == "Black-and-White":
            with_words = sh.words(plain.copy(), "#111111")
        else:
            with_words = sh.words(plain.copy(), c["ink"])
        for suffix, (W, H) in SIZES.items():
            rnd = random.Random(20102026)
            pages, fronts, first_outside = [], [], None
            for i, (title, cap, use_words) in enumerate(FRONTS):
                f = front(with_words, plain, title, cap, use_words, c, W, H, rnd)
                outside = sheet(f, back(plain, c, W, H), W, H)
                first_outside = first_outside or outside
                fronts.append(f)
                pages += [outside.convert("RGB"), inside(plain, c, W, H, rnd).convert("RGB")]
            if suffix == "":
                listing_images(name, c, fronts, first_outside, rnd)
            out = os.path.join(DIGITAL, f"Christmas-Cards-{name}{suffix}.pdf")
            pages[0].save(out, save_all=True, append_images=pages[1:], resolution=DPI, quality=88)
            print("written", out, os.path.getsize(out) // 1024, "KB")

if __name__ == "__main__":
    main()
