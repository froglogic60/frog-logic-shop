# Fleece blanket artwork for Socially Hibernating (Sam, 16 Oct 2026).
# Edge-to-edge: the cream-text frog on deep forest green with a light scatter
# of snow dots. Drawn at 8025x10425 so the 50x60in blanket (print area
# 8025x9525) prints sharp; xmas-bundle.js scales it to cover each size, and the
# 30x40in (5025x6525) gets the same picture smaller. The frog is re-rendered
# from the SVG at full size rather than enlarged from the 3000px PNG.
# Writes artwork/frogs/socially-hibernating-blanket.png.
import os, random, sys
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import importlib.util
_spec = importlib.util.spec_from_file_location("sh", os.path.join(os.path.dirname(os.path.abspath(__file__)), "socially-hibernating.py"))
sh = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(sh)

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(os.path.join(HERE, ".."))
W, H = 8025, 10425
FOREST, SNOW = (34, 51, 31), (237, 228, 208)

img = Image.new("RGBA", (W, H), FOREST + (255,))
d = ImageDraw.Draw(img)
rnd = random.Random(16102026)  # fixed seed: the same dots every run
for _ in range(1050):
    x, y, r = rnd.randrange(W), rnd.randrange(H), rnd.choice([16, 22, 29, 38])
    d.ellipse((x - r, y - r, x + r, y + r), fill=SNOW + (rnd.choice([70, 100, 140]),))
size = int(W * 0.86)
art = sh.words(sh.render(sh.svg(), size), sh.CREAM, k=size / 3000)
# Keep the snow off the frog: a soft forest-green disc behind the art.
pad = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ImageDraw.Draw(pad).ellipse(((W - size) // 2 + 190, (H - size) // 2 + 190, (W + size) // 2 - 190, (H + size) // 2 - 190), fill=FOREST + (255,))
img.alpha_composite(pad)
img.alpha_composite(art, ((W - size) // 2, (H - size) // 2))
img.convert("RGB").save(os.path.join(OUT, "socially-hibernating-blanket.png"), optimize=True)
print("written", img.size)
