# Fleece blanket artwork for Socially Hibernating (Sam, 16 Oct 2026).
# Edge-to-edge: the cream-text frog on deep forest green with a light scatter
# of snow dots, at the Harrier Arctic fleece blanket's print area (5025x6525,
# 50x60in; the 30x40in size is scaled to cover by xmas-bundle.js).
# Needs socially-hibernating-dark.png (made by socially-hibernating.py).
# Writes artwork/frogs/socially-hibernating-blanket.png.
import os, random
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(os.path.join(HERE, ".."))
W, H = 5025, 6525
FOREST, SNOW = (34, 51, 31), (237, 228, 208)

img = Image.new("RGBA", (W, H), FOREST + (255,))
d = ImageDraw.Draw(img)
rnd = random.Random(16102026)  # fixed seed: the same dots every run
for _ in range(420):
    x, y, r = rnd.randrange(W), rnd.randrange(H), rnd.choice([10, 14, 18, 24])
    d.ellipse((x - r, y - r, x + r, y + r), fill=SNOW + (rnd.choice([70, 100, 140]),))
art = Image.open(os.path.join(OUT, "socially-hibernating-dark.png")).convert("RGBA")
size = int(W * 0.86)
art = art.resize((size, size), Image.LANCZOS)
# Keep the snow off the frog: a soft forest-green disc behind the art.
pad = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ImageDraw.Draw(pad).ellipse(((W - size) // 2 + 120, (H - size) // 2 + 120, (W + size) // 2 - 120, (H + size) // 2 - 120), fill=FOREST + (255,))
img.alpha_composite(pad)
img.alpha_composite(art, ((W - size) // 2, (H - size) // 2))
img.convert("RGB").save(os.path.join(OUT, "socially-hibernating-blanket.png"), optimize=True)
print("written", img.size)
