# Card pictures for the two Socially Hibernating sets on the website
# (16 Oct 2026): the hoodie large on the left, the other two pieces stacked on
# the right, from the website store's own Printify mockups (STORE=site run of
# xmas-bundle-mockups.js). Writes assets/xmas/set-uk.jpg and set-us.jpg.
import os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
D = os.path.join(HERE, "xmas-bundle-mockups", "site")
OUT = os.path.join(HERE, "..", "..", "assets", "xmas")
SETS = {
    "set-uk.jpg": ["uk-hoodie-front-navy.jpg", "uk-tee-front-2-sport-grey.jpg", "uk-blanket-front-50-60.jpg"],
    "set-us.jpg": ["us-hoodie-front-maroon.jpg", "us-tee-front-2-sport-grey.jpg", "us-beanie-person-1-front-navy.jpg"],
}

os.makedirs(OUT, exist_ok=True)
for name, files in SETS.items():
    img = Image.new("RGB", (1200, 1200), (244, 239, 227))
    a, b, c = (Image.open(os.path.join(D, f)).convert("RGB") for f in files)
    img.paste(a.resize((720, 720)), (0, 240))
    img.paste(b.resize((480, 480)), (720, 120))
    img.paste(c.resize((480, 480)), (720, 600))
    img.save(os.path.join(OUT, name), quality=85, optimize=True)
    print("wrote", name)
