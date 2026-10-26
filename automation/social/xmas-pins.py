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
# BATCH=2 (26 Oct 2026, Sam: "the next batch of Pinterest pins"): the bright and
# black-and-white colourways, the personalised pieces and the printable cards,
# none of which had a pin. Batch 1 (the original eight) is left as it was.
BATCH = os.environ.get("BATCH", "1")
OUT_NAME = "xmas-pins" if BATCH == "1" else "xmas-pins-" + BATCH
OUT = os.path.join(HERE, OUT_NAME)
RAW = "https://raw.githubusercontent.com/froglogic60/frog-logic-shop/main/automation/social/" + OUT_NAME + "/"
MOCKB = os.path.join(HERE, "xmas-bundle-mockups", "bright")
MOCKM = os.path.join(HERE, "xmas-bundle-mockups", "mono")
SITE = "https://shop.froglogic.co.uk/?ref=pinterest#christmas"
ETSY = "https://froglogic.etsy.com/listing/"
BOARD = "Neurodivergent & introvert Christmas gifts"  # created 16 Oct 2026 (50-character limit)
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


PINS2 = [
    dict(slug="bright-uk-hoodie", img=(MOCKB, "bright-uk-hoodie-front-black.jpg"), kicker="CHRISTMAS HOODIE · BRIGHT · MADE IN THE UK", lines=["Bright on purpose,", "for the ones who like bright"], link="https://froglogic.etsy.com/listing/4599571512", title="Socially Hibernating Christmas frog hoodie in bright colours | cosy introvert Christmas gift", desc="The sleepy Socially Hibernating frog in a Santa hat, tangled in fairy lights: see you in January. This version is in bold bright colours, made because a lot of people asked for bright. Hoodie printed to order in the UK. A Christmas gift for introverts, ADHD and autistic adults. From Frog Logic, made by one neurodivergent person in the UK.", keys="bright christmas hoodie, introvert christmas gift, frog hoodie, neurodivergent gift, christmas hoodie"),
    dict(slug="name-uk-ornament", img=(SETS, "xmas-ornament.jpg"), head="Add Any Name", kicker="PERSONALISED ORNAMENT · MADE IN THE UK", lines=["Their name on the tree,", "with a little Christmas frog"], link="https://froglogic.etsy.com/listing/4596100263", title="Personalised frog Christmas ornament with any name | aluminium tree decoration gift", desc="The Christmas frog in a Santa hat, with any name printed above it. Aluminium hanging decoration with a red ribbon, printed to order in the UK. A small gift for a stocking, a Secret Santa or a first tree of your own. From Frog Logic, made by one neurodivergent person in the UK.", keys="personalised christmas ornament, name bauble, frog ornament, secret santa gift, stocking filler"),
    dict(slug="mono-uk-hoodie", img=(MOCKM, "mono-uk-hoodie-front-black.jpg"), kicker="CHRISTMAS HOODIE · BLACK & WHITE · MADE IN THE UK", lines=["Christmas, without the", "colour overload"], link="https://froglogic.etsy.com/listing/4599573112", title="Socially Hibernating Christmas frog hoodie in black and white | minimalist Christmas gift", desc="The sleepy Socially Hibernating frog in a Santa hat, tangled in fairy lights: see you in January. This version is plain black and white, for anyone who only wears monochrome or finds bright Christmas colours too much. Hoodie printed to order in the UK. From Frog Logic, made by one neurodivergent person in the UK.", keys="black and white christmas hoodie, minimalist christmas gift, introvert christmas, frog hoodie, neurodivergent gift"),
    dict(slug="cards-soft", img=(SETS, "cw-original-cards.jpg"), kicker="PRINTABLE CHRISTMAS CARDS · SOFT COLOURS", lines=["Three cards to print at home,", "fold in half, blank inside"], link="https://froglogic.co.uk/p/christmas-cards/?ref=pinterest", title="Printable Christmas cards with a sleepy frog | introvert Christmas cards PDF", desc="Three printable Christmas cards with the Socially Hibernating frog: see you in January, Merry Christmas from the pond, and thinking of you from under a blanket. A4 and US Letter PDFs, fold in half, blank inside. From Frog Logic, made by one neurodivergent person in the UK.", keys="printable christmas cards, introvert christmas card, frog christmas card, funny christmas card, instant download"),
    dict(slug="bright-uk-tee", img=(MOCKB, "bright-uk-tee-front-2-white.jpg"), kicker="CHRISTMAS T-SHIRT · BRIGHT · MADE IN THE UK", lines=["Bright on purpose,", "for the ones who like bright"], link="https://froglogic.etsy.com/listing/4599568228", title="Socially Hibernating Christmas frog t-shirt in bright colours | cosy introvert Christmas gift", desc="The sleepy Socially Hibernating frog in a Santa hat, tangled in fairy lights: see you in January. This version is in bold bright colours, made because a lot of people asked for bright. T-shirt printed to order in the UK. A Christmas gift for introverts, ADHD and autistic adults. From Frog Logic, made by one neurodivergent person in the UK.", keys="bright christmas t-shirt, introvert christmas gift, frog t-shirt, neurodivergent gift, christmas t-shirt"),
    dict(slug="name-us-ornament", img=(SETS, "xmas-ornament-us.jpg"), head="Add Any Name", kicker="PERSONALIZED ORNAMENT · SHIPS FROM THE US", lines=["Their name on the tree,", "with a little Christmas frog"], link="https://froglogic.etsy.com/listing/4596126028", title="Personalized frog Christmas ornament with any name | ceramic tree ornament gift", desc="The Christmas frog in a Santa hat, with any name printed on a round ceramic ornament. Made and shipped in the US, so no import fees. A small gift for a stocking, a Secret Santa or a first tree of your own. From Frog Logic.", keys="personalized christmas ornament, custom name ornament, frog ornament, stocking stuffer, secret santa gift"),
    dict(slug="mono-uk-tee", img=(MOCKM, "mono-uk-tee-front-2-white.jpg"), kicker="CHRISTMAS T-SHIRT · BLACK & WHITE · MADE IN THE UK", lines=["Christmas, without the", "colour overload"], link="https://froglogic.etsy.com/listing/4599569554", title="Socially Hibernating Christmas frog t-shirt in black and white | minimalist Christmas gift", desc="The sleepy Socially Hibernating frog in a Santa hat, tangled in fairy lights: see you in January. This version is plain black and white, for anyone who only wears monochrome or finds bright Christmas colours too much. T-shirt printed to order in the UK. From Frog Logic, made by one neurodivergent person in the UK.", keys="black and white christmas t-shirt, minimalist christmas gift, introvert christmas, frog t-shirt, neurodivergent gift"),
    dict(slug="cards-bright", img=(SETS, "cw-bright-cards.jpg"), kicker="PRINTABLE CHRISTMAS CARDS · BRIGHT", lines=["Three bright cards to print,", "fold in half, blank inside"], link="https://froglogic.co.uk/p/bright-christmas-cards/?ref=pinterest", title="Bright printable Christmas cards with a sleepy frog | colourful Christmas cards PDF", desc="Three printable Christmas cards with the Socially Hibernating frog in bold bright colours: see you in January, Merry Christmas from the pond, and thinking of you from under a blanket. A4 and US Letter PDFs, blank inside. From Frog Logic, made by one neurodivergent person in the UK.", keys="printable christmas cards, bright christmas card, frog christmas card, colourful christmas card, instant download"),
    dict(slug="bright-uk-mug", img=(MOCKB, "bright-uk-mug-front-11oz.jpg"), kicker="CHRISTMAS MUG · BRIGHT · MADE IN THE UK", lines=["Bright on purpose,", "for the ones who like bright"], link="https://froglogic.etsy.com/listing/4599550881", title="Socially Hibernating Christmas frog mug in bright colours | cosy introvert Christmas gift", desc="The sleepy Socially Hibernating frog in a Santa hat, tangled in fairy lights: see you in January. This version is in bold bright colours, made because a lot of people asked for bright. Mug printed to order in the UK. A Christmas gift for introverts, ADHD and autistic adults. From Frog Logic, made by one neurodivergent person in the UK.", keys="bright christmas mug, introvert christmas gift, frog mug, neurodivergent gift, christmas mug"),
    dict(slug="name-us-candle", img=(SETS, "xmas-candle.jpg"), head="Add Any Name", kicker="PERSONALIZED CANDLE · SHIPS FROM THE US", lines=["Pick the scent,", "add a name"], link="https://froglogic.etsy.com/listing/4596136952", title="Personalized Christmas frog candle with any name | scented amber jar candle gift", desc="An amber jar candle with the Christmas frog and any name on the label. 4oz or 9oz, ten scents including Fraser Fir, Cinnamon Chai and an unscented one. Made and shipped in the US. A cosy Christmas gift. From Frog Logic.", keys="personalized candle, christmas candle gift, custom name candle, frog gift, cozy christmas gift"),
    dict(slug="mono-uk-mug", img=(MOCKM, "mono-uk-mug-front-11oz.jpg"), kicker="CHRISTMAS MUG · BLACK & WHITE · MADE IN THE UK", lines=["Christmas, without the", "colour overload"], link="https://froglogic.etsy.com/listing/4599575380", title="Socially Hibernating Christmas frog mug in black and white | minimalist Christmas gift", desc="The sleepy Socially Hibernating frog in a Santa hat, tangled in fairy lights: see you in January. This version is plain black and white, for anyone who only wears monochrome or finds bright Christmas colours too much. Mug printed to order in the UK. From Frog Logic, made by one neurodivergent person in the UK.", keys="black and white christmas mug, minimalist christmas gift, introvert christmas, frog mug, neurodivergent gift"),
    dict(slug="cards-mono", img=(SETS, "cw-mono-cards.jpg"), kicker="PRINTABLE CHRISTMAS CARDS · BLACK & WHITE", lines=["Print, fold, and colour in", "if you feel like it"], link="https://froglogic.co.uk/p/black-and-white-christmas-cards/?ref=pinterest", title="Black and white printable Christmas cards to colour in | sleepy frog Christmas cards PDF", desc="Three printable Christmas cards with the Socially Hibernating frog in black and white, so they can be coloured in: see you in January, Merry Christmas from the pond, and thinking of you from under a blanket. A4 and US Letter PDFs. From Frog Logic, made by one neurodivergent person in the UK.", keys="colour in christmas card, printable christmas cards, black and white christmas card, frog christmas card, instant download"),
    dict(slug="bright-uk-throw", img=(MOCKB, "bright-uk-blanket-context-1-50-60.jpg"), kicker="FLEECE THROW · BRIGHT · MADE IN THE UK", lines=["Bright on purpose,", "for the ones who like bright"], link="https://froglogic.etsy.com/listing/4599553173", title="Socially Hibernating Christmas frog blanket in bright colours | cosy introvert Christmas gift", desc="The sleepy Socially Hibernating frog in a Santa hat, tangled in fairy lights: see you in January. This version is in bold bright colours, made because a lot of people asked for bright. Blanket printed to order in the UK. A Christmas gift for introverts, ADHD and autistic adults. From Frog Logic, made by one neurodivergent person in the UK.", keys="bright christmas blanket, introvert christmas gift, frog blanket, neurodivergent gift, christmas blanket"),
    dict(slug="name-uk-mug", img=(SETS, "xmas-mug.jpg"), head="Add Any Name", kicker="PERSONALISED MUG · MADE IN THE UK", lines=["The Christmas frog,", "with their name on it"], link="https://froglogic.etsy.com/listing/4596035492", title="Personalised Christmas frog mug with any name | cute frog in a Santa hat gift", desc="The frog in a Santa hat on an 11oz white mug, with any name you like. Printed to order in the UK. A cosy Christmas gift or Secret Santa for someone who'd rather be under a blanket. From Frog Logic, made by one neurodivergent person in the UK.", keys="personalised christmas mug, name mug, frog mug, secret santa gift, cute christmas gift"),
    dict(slug="mono-uk-throw", img=(MOCKM, "mono-uk-blanket-context-1-50-60.jpg"), kicker="FLEECE THROW · BLACK & WHITE · MADE IN THE UK", lines=["Christmas, without the", "colour overload"], link="https://froglogic.etsy.com/listing/4599577116", title="Socially Hibernating Christmas frog blanket in black and white | minimalist Christmas gift", desc="The sleepy Socially Hibernating frog in a Santa hat, tangled in fairy lights: see you in January. This version is plain black and white, for anyone who only wears monochrome or finds bright Christmas colours too much. Blanket printed to order in the UK. From Frog Logic, made by one neurodivergent person in the UK.", keys="black and white christmas blanket, minimalist christmas gift, introvert christmas, frog blanket, neurodivergent gift"),
    dict(slug="bright-us-hoodie", img=(MOCKB, "bright-us-hoodie-front-black.jpg"), kicker="CHRISTMAS HOODIE · BRIGHT · SHIPS FROM THE US", lines=["Bright on purpose,", "for the ones who like bright"], link="https://froglogic.etsy.com/listing/4599548863", title="Socially Hibernating Christmas frog sweatshirt in bright colours | cozy introvert Christmas gift", desc="The sleepy Socially Hibernating frog in a Santa hat, tangled in fairy lights: see you in January. This version is in bold bright colours, made because a lot of people asked for bright. Sweatshirt made and shipped in the US, so no import fees. A Christmas gift for introverts, ADHD and autistic adults. From Frog Logic, made by one neurodivergent person in the UK.", keys="bright christmas sweatshirt, introvert christmas gift, frog sweatshirt, neurodivergent gift, christmas sweatshirt"),
    dict(slug="mono-us-hoodie", img=(MOCKM, "mono-us-hoodie-front-black.jpg"), kicker="CHRISTMAS HOODIE · BLACK & WHITE · SHIPS FROM THE US", lines=["Christmas, without the", "colour overload"], link="https://froglogic.etsy.com/listing/4599573332", title="Socially Hibernating Christmas frog sweatshirt in black and white | minimalist Christmas gift", desc="The sleepy Socially Hibernating frog in a Santa hat, tangled in fairy lights: see you in January. This version is plain black and white, for anyone who only wears monochrome or finds bright Christmas colours too much. Sweatshirt made and shipped in the US, so no import fees. From Frog Logic, made by one neurodivergent person in the UK.", keys="black and white christmas sweatshirt, minimalist christmas gift, introvert christmas, frog sweatshirt, neurodivergent gift"),
    dict(slug="bright-us-tee", img=(MOCKB, "bright-us-tee-front-2-white.jpg"), kicker="CHRISTMAS T-SHIRT · BRIGHT · SHIPS FROM THE US", lines=["Bright on purpose,", "for the ones who like bright"], link="https://froglogic.etsy.com/listing/4599568962", title="Socially Hibernating Christmas frog shirt in bright colours | cozy introvert Christmas gift", desc="The sleepy Socially Hibernating frog in a Santa hat, tangled in fairy lights: see you in January. This version is in bold bright colours, made because a lot of people asked for bright. Shirt made and shipped in the US, so no import fees. A Christmas gift for introverts, ADHD and autistic adults. From Frog Logic, made by one neurodivergent person in the UK.", keys="bright christmas shirt, introvert christmas gift, frog shirt, neurodivergent gift, christmas shirt"),
    dict(slug="mono-us-tee", img=(MOCKM, "mono-us-tee-front-2-white.jpg"), kicker="CHRISTMAS T-SHIRT · BLACK & WHITE · SHIPS FROM THE US", lines=["Christmas, without the", "colour overload"], link="https://froglogic.etsy.com/listing/4599546685", title="Socially Hibernating Christmas frog shirt in black and white | minimalist Christmas gift", desc="The sleepy Socially Hibernating frog in a Santa hat, tangled in fairy lights: see you in January. This version is plain black and white, for anyone who only wears monochrome or finds bright Christmas colours too much. Shirt made and shipped in the US, so no import fees. From Frog Logic, made by one neurodivergent person in the UK.", keys="black and white christmas shirt, minimalist christmas gift, introvert christmas, frog shirt, neurodivergent gift"),
    dict(slug="bright-us-mug", img=(MOCKB, "bright-us-mug-front-11oz.jpg"), kicker="CHRISTMAS MUG · BRIGHT · SHIPS FROM THE US", lines=["Bright on purpose,", "for the ones who like bright"], link="https://froglogic.etsy.com/listing/4599551293", title="Socially Hibernating Christmas frog mug in bright colours | cozy introvert Christmas gift", desc="The sleepy Socially Hibernating frog in a Santa hat, tangled in fairy lights: see you in January. This version is in bold bright colours, made because a lot of people asked for bright. Mug made and shipped in the US, so no import fees. A Christmas gift for introverts, ADHD and autistic adults. From Frog Logic, made by one neurodivergent person in the UK.", keys="bright christmas mug, introvert christmas gift, frog mug, neurodivergent gift, christmas mug"),
    dict(slug="mono-us-mug", img=(MOCKM, "mono-us-mug-front-11oz.jpg"), kicker="CHRISTMAS MUG · BLACK & WHITE · SHIPS FROM THE US", lines=["Christmas, without the", "colour overload"], link="https://froglogic.etsy.com/listing/4599552299", title="Socially Hibernating Christmas frog mug in black and white | minimalist Christmas gift", desc="The sleepy Socially Hibernating frog in a Santa hat, tangled in fairy lights: see you in January. This version is plain black and white, for anyone who only wears monochrome or finds bright Christmas colours too much. Mug made and shipped in the US, so no import fees. From Frog Logic, made by one neurodivergent person in the UK.", keys="black and white christmas mug, minimalist christmas gift, introvert christmas, frog mug, neurodivergent gift"),
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
    centred(d, 130, p.get("head", "Socially Hibernating"), font("Fraunces-var.ttf", 92, 600), BROWN)
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
    for i, p in enumerate(PINS if BATCH == "1" else PINS2):
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
