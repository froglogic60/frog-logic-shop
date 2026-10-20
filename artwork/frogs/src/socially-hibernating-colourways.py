# Socially Hibernating in two more colourways (Sam, 20 Oct 2026: her group poll
# found many people prefer bright colours and some only like black and white).
#
# Same drawing as socially-hibernating.py; only the colours change, by swapping
# every colour in the SVG for its counterpart below.
#   bright  : saturated frog, hot-pink cheeks, purple stripy blanket, neon bulbs
#   mono    : pure black and white. "-light" = black lines on white fills for
#             light garments; "-dark" = the exact negative, for black garments.
#
# Writes to artwork/frogs/:
#   socially-hibernating-bright(.png|-dark.png|-tight.png|-dark-tight.png)
#   socially-hibernating-mono(.png|-dark.png|-tight.png|-dark-tight.png)
# Usage: python socially-hibernating-colourways.py <fonts dir>
import importlib.util, os, sys
from PIL import Image, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(os.path.join(HERE, ".."))
spec = importlib.util.spec_from_file_location("sh", os.path.join(HERE, "socially-hibernating.py"))
sh = importlib.util.module_from_spec(spec); spec.loader.exec_module(sh)
if len(sys.argv) > 1:
    sh.FONTS = sys.argv[1]

BRIGHT = {
    "#8fb784": "#3fd25a",  # frog green
    "#22331f": "#141428",  # outline
    "#ede4d0": "#ffe94a",  # circle behind the frog
    "#f08f87": "#ff4fa3",  # cheeks
    "#c9dcb3": "#a8f59a",  # belly
    "#c4453b": "#ff2438",  # hat, red bulbs
    "#fbf7ee": "#ffffff",  # hat trim
    "#d9a35f": "#8b5cff",  # blanket
    "#c48a47": "#5b2fd6",  # blanket stripe shadow
    "#f3e2bf": "#38e1ff",  # blanket stripe
    "#e8b63c": "#ffd400",  # yellow bulbs
    "#5b7fc4": "#1f6bff",  # blue bulbs
    "#7fb069": "#18e06f",  # green bulbs
    "#d46aa0": "#ff3fd2",  # pink bulbs
    "#4a4a4a": "#141428",  # bulb caps
    "#3d4a33": "#141428",  # wire
    "#e9e3d6": "#ffffff",  # plug
}
MONO = {
    "#8fb784": "#ffffff", "#22331f": "#111111", "#ede4d0": "#ffffff",
    "#f08f87": "#ffffff",  # no blush in black and white
    "#c9dcb3": "#ffffff", "#c4453b": "#111111", "#fbf7ee": "#ffffff",
    "#d9a35f": "#ffffff", "#c48a47": "#111111", "#f3e2bf": "#111111",
    "#e8b63c": "#ffffff", "#5b7fc4": "#ffffff", "#7fb069": "#ffffff", "#d46aa0": "#ffffff",  # all bulbs white so they read against the black stripes
    "#4a4a4a": "#111111", "#3d4a33": "#111111", "#e9e3d6": "#ffffff",
}

def recolour(svgtext, table):
    for a, b in table.items():
        svgtext = svgtext.replace(a, b).replace(a.upper(), b)
    return svgtext

def tight(img, m=40):
    x0, y0, x1, y1 = img.getbbox()
    return img.crop((max(0, x0 - m), max(0, y0 - m), min(img.width, x1 + m), min(img.height, y1 + m)))

def save(img, name):
    img.save(os.path.join(OUT, name + ".png"))
    tight(img).save(os.path.join(OUT, name + "-tight.png"))

def invert_keep_alpha(img):
    r, g, b, a = img.split()
    rgb = ImageOps.invert(Image.merge("RGB", (r, g, b)))
    return Image.merge("RGBA", (*rgb.split(), a))

if __name__ == "__main__":
    # Bright: magenta words on light garments, sunshine-yellow words on dark ones.
    art = sh.render(recolour(sh.svg(), BRIGHT))
    save(sh.words(art.copy(), "#e0187a"), "socially-hibernating-bright")
    save(sh.words(art.copy(), "#ffd400"), "socially-hibernating-bright-dark")
    # Black and white: the dark version is the exact negative of the light one.
    light = sh.words(sh.render(recolour(sh.svg(), MONO)), "#111111")
    save(light, "socially-hibernating-mono")
    save(invert_keep_alpha(light), "socially-hibernating-mono-dark")
    print("written")
