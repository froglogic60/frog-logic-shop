# Pinterest pins for the Socially Hibernating Christmas range (Sam, 16 Oct
# 2026: "yes do 1 and 2" — Etsy Ads on the Christmas listings, and pins).
# People plan Christmas gifts on Pinterest from October, and a pin keeps
# sending people to a listing for months.
#
# Eight pins: the two one-price sets (linking to the website's Christmas
# section, where they're sold) and the six single pieces (linking to their Etsy
# listings). Prices are left off the pictures on purpose: a pin lives for
# months and a price on it goes stale.
#
# Writes automation/social/xmas-pins/<slug>.jpg (1000x1500) and xmas-pins.csv,
# the spreadsheet Pinterest's bulk upload takes (Settings > Import content),
# with the same columns as pins-pages.csv. Images are served from
# raw.githubusercontent.com once the "Christmas pins" workflow commits them.
#
#   python xmas-pins.py [fonts dir]      (fonts: node -e "require('./gfonts.js').ensureFonts('.gfonts')")
import csv, os, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, ".gfonts")
MOCK = os.path.join(HERE, "xmas-bundle-mockups", "site")
SETS = os.path.join(HERE, "..", "..", "assets", "xmas")
OUT = os.path.join(HERE, "xmas-pins")
RAW = "https://raw.githubusercontent.com/froglogic60/frog-logic-shop/main/automation/social/xmas-pins/"
SITE = "https://shop.froglogic.co.uk/?ref=pinterest#christmas"
ETSY = "https://froglogic.etsy.com/listing/"
BOARD = "Christmas gifts for introverts and neurodivergent people"
START = os.environ.get("START", "2026-10-17")
SLOTS = ["13:00:00", "21:00:00"]  # UTC; clear of the pins-pages queue's times

CREAM, BROWN, GREEN, RED, INK = (244, 239, 227), (107, 74, 50), (34, 51, 31), (181, 68, 58), (26, 26, 26)
W, H = 1000, 1500

PINS = [
    dict(slug="set-uk", img=(SETS, "set-uk.jpg"), kicker="THE CHRISTMAS SET · MADE IN THE UK",
         lines=["Hoodie, tee & fleece throw", "One price, UK delivery included"], link=SITE,
         title="Socially Hibernating Christmas set: hoodie, tee and fleece throw | introvert Christmas gift",
         desc="The frog has put on a Santa hat, got under a blanket, tangled itself in the fairy lights, and is not coming out until January. A matching hoodie, tee and Arctic fleece throw for one price with UK delivery included. Pick each colour and size. Printed to order in the UK by Frog Logic, made by one neurodivergent person.",
         keys="introvert christmas gift, christmas hoodie, cosy christmas gift set, neurodivergent gift, frog gift"),
    dict(slug="set-us", img=(SETS, "set-us.jpg"), kicker="THE CHRISTMAS SET · MADE IN THE US",
         lines=["Hoodie, tee & embroidered beanie", "One price, US delivery included"], link=SITE,
         title="Socially Hibernating Christmas set: hoodie, tee and embroidered beanie | introvert Christmas gift",
         desc="A sleepy frog in a Santa hat, wrapped in a blanket and tangled in fairy lights: not available until January. A matching hoodie, tee and cuffed beanie with the frog embroidered on it, for one price with US delivery included. Made and shipped in the US, so no import fees. From Frog Logic.",
         keys="introvert christmas gift, christmas hoodie, christmas gift set, neurodivergent gift, cute frog gift"),
    dict(slug="uk-hoodie", img=(MOCK, "uk-hoodie-front-navy.jpg"), kicker="CHRISTMAS HOODIE · MADE IN THE UK",
         lines=["For anyone who loves Christmas", "and also needs it quieter"], link=ETSY + "4596674962",
         title="Socially Hibernating Christmas frog hoodie | cosy introvert Christmas jumper",
         desc="A sleepy frog in a Santa hat, wrapped in a blanket and tangled in fairy lights: see you in January. Gildan Heavy Blend hoodie in five colours, S to 2XL, printed to order in the UK. A Christmas gift for introverts, ADHD and autistic adults, and anyone who needs a quieter Christmas. On the Frog Logic Etsy shop.",
         keys="christmas hoodie, christmas jumper, introvert christmas, frog hoodie, neurodivergent gift"),
    dict(slug="uk-tee", img=(MOCK, "uk-tee-front-2-sport-grey.jpg"), kicker="CHRISTMAS T-SHIRT · MADE IN THE UK",
         lines=["Socially hibernating.", "See you in January."], link=ETSY + "4596658473",
         title="Socially Hibernating Christmas frog t-shirt | funny introvert Christmas top",
         desc="The Christmas frog has put on a Santa hat, got under a blanket and is not coming out until January. A Gildan cotton tee in four colours, S to 2XL, printed to order in the UK. A small Christmas gift for introverts and neurodivergent people. On the Frog Logic Etsy shop.",
         keys="christmas t-shirt, introvert christmas, funny christmas top, frog t-shirt, neurodivergent gift"),
    dict(slug="uk-throw", img=(MOCK, "uk-blanket-front-50-60.jpg"), kicker="FLEECE THROW · MADE IN THE UK",
         lines=["A cosy Christmas throw", "for hibernating under"], link=ETSY + "4596676046",
         title="Socially Hibernating Christmas frog fleece blanket | cosy throw gift",
         desc="A soft Arctic fleece throw printed edge to edge with the sleepy Christmas frog, snow and fairy lights. Lap size 30 x 40 in or sofa size 50 x 60 in, printed to order in the UK. A cosy Christmas gift for introverts and anyone who'd rather stay in. On the Frog Logic Etsy shop.",
         keys="christmas blanket, fleece throw, cosy christmas gift, frog blanket, introvert gift"),
    dict(slug="us-hoodie", img=(MOCK, "us-hoodie-front-maroon.jpg"), kicker="CHRISTMAS HOODIE · SHIPS FROM THE US",
         lines=["For anyone who loves Christmas", "and also needs it quieter"], link=ETSY + "4596672354",
         title="Socially Hibernating Christmas frog hoodie | cozy introvert Christmas sweatshirt",
         desc="A sleepy frog in a Santa hat, wrapped in a blanket and tangled in fairy lights: see you in January. Gildan Heavy Blend hoodie in five colors, S to 2XL, made and shipped in the US so there are no import fees. A Christmas gift for introverts and neurodivergent adults. On the Frog Logic Etsy shop.",
         keys="christmas sweatshirt, christmas hoodie, introvert christmas gift, cute frog hoodie, neurodivergent gift"),
    dict(slug="us-tee", img=(MOCK, "us-tee-front-2-navy.jpg"), kicker="CHRISTMAS T-SHIRT · SHIPS FROM THE US",
         lines=["Socially hibernating.", "See you in January."], link=ETSY + "4596656257",
         title="Socially Hibernating Christmas frog shirt | funny introvert Christmas tee",
         desc="The Christmas frog has put on a Santa hat, got under a blanket and is not coming out until January. A Gildan cotton tee in five colors, S to 2XL, made and shipped in the US. A small Christmas gift for introverts, ADHD and autistic adults. On the Frog Logic Etsy shop.",
         keys="christmas shirt, introvert christmas, funny christmas tee, frog shirt, neurodivergent gift"),
    dict(slug="us-beanie", img=(MOCK, "us-beanie-person-1-front-navy.jpg"), kicker="EMBROIDERED BEANIE · SHIPS FROM THE US",
         lines=["The sleepy Christmas frog,", "embroidered on the cuff"], link=ETSY + "4596673948",
         title="Christmas frog embroidered beanie | cute winter hat and stocking stuffer",
         desc="The sleepy Christmas frog from the Socially Hibernating set, embroidered on the cuff of a classic knit beanie: eyes shut, Santa hat on, not available until January. Navy, black or dark grey, one size, made and shipped in the US. A cute stocking stuffer. On the Frog Logic Etsy shop.",
         keys="embroidered beanie, christmas beanie, stocking stuffer, frog beanie, cute winter hat"),
]


def font(name, size, weight=None):
    f = ImageFont.truetype(os.path.join(FONTS, name), size)
    if weight is not None:
        axes = f.get_variation_axes(); vals = [a.get("default", a["minimum"]) for a in axes]
        for i, a in enumerate(axes):
            n = a.get("name", ""); n = (n.decode() if isinstance(n, bytes) else str(n)).lower()
            if "weight" in n: vals[i] = weight
            elif "optical" in n: vals[i] = max(a["minimum"], min(a["maximum"], round(size * 0.75)))
        f.set_variation_by_axes(vals)
    return f


def centred(d, y, text, f, fill, spacing=0):
    if spacing:
        total = sum(d.textlength(c, font=f) for c in text) + spacing * (len(text) - 1)
        x = (W - total) / 2
        for c in text:
            d.text((x, y), c, font=f, fill=fill); x += d.textlength(c, font=f) + spacing
        return
    d.text(((W - d.textlength(text, font=f)) / 2, y), text, font=f, fill=fill)


def pin(p):
    img = Image.new("RGB", (W, H), CREAM)
    d = ImageDraw.Draw(img)
    centred(d, 78, p["kicker"], font("SpaceGrotesk-var.ttf", 26, 700), RED, spacing=3)
    centred(d, 130, "Socially Hibernating", font("Fraunces-var.ttf", 92, 600), BROWN)
    # The product, on a white card with a soft shadow.
    S, x, y = 840, 80, 290
    photo = Image.open(os.path.join(*p["img"])).convert("RGB").resize((S, S), Image.LANCZOS)
    sh = Image.new("L", (S + 80, S + 80), 0)
    ImageDraw.Draw(sh).rectangle((40, 40, 40 + S, 40 + S), fill=80)
    img.paste((60, 50, 40), (x - 40, y - 28), sh.filter(ImageFilter.GaussianBlur(18)))
    img.paste(photo, (x, y))
    d = ImageDraw.Draw(img)
    l1, l2 = p["lines"]
    centred(d, 1188, l1, font("Fraunces-var.ttf", 50, 600), INK)
    centred(d, 1256, l2, font("Fraunces-var.ttf", 44, 400), GREEN)
    d.line((W / 2 - 60, 1350, W / 2 + 60, 1350), fill=BROWN, width=3)
    centred(d, 1376, "Frog Logic", font("Caveat-var.ttf", 64, 700), BROWN)
    img.save(os.path.join(OUT, p["slug"] + ".jpg"), quality=88, optimize=True)


def main():
    os.makedirs(OUT, exist_ok=True)
    from datetime import date, timedelta
    day0 = date.fromisoformat(START)
    rows = []
    for i, p in enumerate(PINS):
        pin(p)
        when = f"{(day0 + timedelta(days=i // len(SLOTS))).isoformat()}T{SLOTS[i % len(SLOTS)]}"
        rows.append([p["title"][:100], RAW + p["slug"] + ".jpg", BOARD, "", p["desc"][:500], p["link"], when, p["keys"]])
        print("made", p["slug"], when)
    with open(os.path.join(OUT, "xmas-pins.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f, quoting=csv.QUOTE_ALL)
        w.writerow(["Title", "Media URL", "Pinterest board", "Thumbnail", "Description", "Link", "Publish date", "Keywords"])
        w.writerows(rows)


if __name__ == "__main__":
    main()
