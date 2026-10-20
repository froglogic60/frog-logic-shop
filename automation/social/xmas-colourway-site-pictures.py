# Site pictures for the Socially Hibernating colourways (Sam, 20 Oct 2026:
# bright and black-and-white each get their own tab on the site). Takes the
# Printify mockups already committed to automation/social/xmas-bundle-mockups/
# and the card previews in automation/social/xmas-cards/, and writes 800x800
# JPGs to assets/xmas/, the size the other Christmas cards on the site use.
# Usage: python xmas-colourway-site-pictures.py
import os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "../.."))
MOCK = os.path.join(HERE, "xmas-bundle-mockups")
CARDS = os.path.join(HERE, "xmas-cards")
OUT = os.path.join(ROOT, "assets/xmas")

PICKS = {  # output name -> source
    "cw-bright-uk-tee": "bright/bright-uk-tee-front-2-white.jpg",
    "cw-bright-uk-hoodie": "bright/bright-uk-hoodie-front-black.jpg",
    "cw-bright-uk-throw": "bright/bright-uk-blanket-context-1-30-40.jpg",
    "cw-bright-uk-mug": "bright/bright-uk-mug-front-11oz.jpg",
    "cw-bright-us-tee": "bright/bright-us-tee-front-2-black.jpg",
    "cw-bright-us-hoodie": "bright/bright-us-hoodie-front-white.jpg",
    "cw-bright-us-mug": "bright/bright-us-mug-front-11oz.jpg",
    "cw-mono-uk-tee": "mono/mono-uk-tee-front-2-white.jpg",
    "cw-mono-uk-hoodie": "mono/mono-uk-hoodie-front-black.jpg",
    "cw-mono-uk-throw": "mono/mono-uk-blanket-context-1-30-40.jpg",
    "cw-mono-uk-mug": "mono/mono-uk-mug-front-11oz.jpg",
    "cw-mono-us-tee": "mono/mono-us-tee-front-2-black.jpg",
    "cw-mono-us-hoodie": "mono/mono-us-hoodie-front-white.jpg",
    "cw-mono-us-mug": "mono/mono-us-mug-front-11oz.jpg",
}
CARD_PICKS = {"cw-bright-cards": "bright-listing-3.png", "cw-mono-cards": "black-and-white-listing-3.png"}
# The product page shows all three cards (the hero listing image, squared).
PAGE_PICKS = {"cw-bright-cards-page": "bright-listing-1.png", "cw-mono-cards-page": "black-and-white-listing-1.png"}

def square(img, size=800, bg=(255, 255, 255)):
    img = img.convert("RGB")
    w, h = img.size
    s = max(w, h)
    canvas = Image.new("RGB", (s, s), bg)
    canvas.paste(img, ((s - w) // 2, (s - h) // 2))
    return canvas.resize((size, size), Image.LANCZOS)

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for name, src in PICKS.items():
        im = Image.open(os.path.join(MOCK, src))
        # The mockups are square already; crop a little off the edges so the
        # product sits larger in the card, like the original set pictures.
        w, h = im.size; m = int(min(w, h) * 0.06)
        im = im.crop((m, m, w - m, h - m))
        square(im).save(os.path.join(OUT, name + ".jpg"), quality=86, optimize=True)
        print("written", name)
    for name, src in CARD_PICKS.items():
        im = Image.open(os.path.join(CARDS, src))
        w, h = im.size
        # The single-card listing image is 4:3 on cream; its middle square
        # holds the card and its caption.
        side = h; x0 = (w - side) // 2
        square(im.crop((x0, 0, x0 + side, h)), bg=(244, 239, 227)).save(os.path.join(OUT, name + ".jpg"), quality=86, optimize=True)
        print("written", name)
    for name, src in PAGE_PICKS.items():
        im = Image.open(os.path.join(CARDS, src))
        square(im, bg=(244, 239, 227)).save(os.path.join(OUT, name + ".jpg"), quality=86, optimize=True)
        print("written", name)
