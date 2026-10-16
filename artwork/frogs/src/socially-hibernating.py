# Socially Hibernating — Christmas frog (Sam, 16 Oct 2026).
# The frog, in a Santa hat, wrapped in a blanket with fairy lights tangled
# round it, eyes shut. Drawn as SVG in the house style (colours sampled from
# comfort-creature.png), text set with PIL in Fraunces / Caveat like the rest.
#
# Writes, at 3000x3000 transparent:
#   artwork/frogs/socially-hibernating.png        brown text, for light garments
#   artwork/frogs/socially-hibernating-dark.png   cream text, for dark garments
#   artwork/frogs/socially-hibernating-art.png    the frog alone, no words
# Usage: python socially-hibernating.py <fonts dir>
import io, os, sys
import cairosvg
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(os.path.join(HERE, ".."))
FONTS = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "../../../automation/social/.gfonts")

GREEN, LINE, CREAM, BLUSH, BROWN = "#8fb784", "#22331f", "#ede4d0", "#f08f87", "#6b4a32"
BELLY, RED, WHITE = "#c9dcb3", "#c4453b", "#fbf7ee"
BLANKET, BLANKET_DARK, BLANKET_STRIPE = "#d9a35f", "#c48a47", "#f3e2bf"
BULBS = ["#e8b63c", "#c4453b", "#5b7fc4", "#7fb069", "#e8b63c", "#d46aa0", "#5b7fc4", "#c4453b", "#7fb069"]
W = 26  # outline width

def bulb(x, y, angle, colour):
    return (f'<g transform="translate({x},{y}) rotate({angle})">'
            f'<rect x="-22" y="-30" width="44" height="34" rx="8" fill="#4a4a4a" stroke="{LINE}" stroke-width="12"/>'
            f'<path d="M -34 0 C -40 70 -14 118 0 122 C 14 118 40 70 34 0 Z" fill="{colour}" stroke="{LINE}" stroke-width="{W-6}" stroke-linejoin="round"/>'
            f'<ellipse cx="-10" cy="40" rx="8" ry="18" fill="#ffffff" opacity="0.55"/></g>')

def svg(with_circle=True):
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" width="3000" height="3000" viewBox="0 0 3000 3000">']
    s.append('<g transform="translate(1500,1500) scale(0.94) translate(-1500,-1390)">')
    if with_circle:
        s.append(f'<circle cx="1500" cy="1560" r="930" fill="{CREAM}"/>')
    # Blanket: a big rounded burrito from the shoulders to the floor.
    s.append(f'<path d="M 760 2380 C 700 1980 820 1560 1040 1420 C 1240 1300 1760 1300 1960 1420 '
             f'C 2180 1560 2300 1980 2240 2380 C 1900 2470 1100 2470 760 2380 Z" fill="{BLANKET}" stroke="{LINE}" stroke-width="{W}" stroke-linejoin="round"/>')
    # Knit stripes across the blanket, clipped to it.
    s.append('<clipPath id="bk"><path d="M 760 2380 C 700 1980 820 1560 1040 1420 C 1240 1300 1760 1300 1960 1420 C 2180 1560 2300 1980 2240 2380 C 1900 2470 1100 2470 760 2380 Z"/></clipPath>')
    s.append('<g clip-path="url(#bk)">')
    for y in (1700, 1980, 2260):
        s.append(f'<path d="M 600 {y} C 1100 {y+60} 1900 {y+60} 2400 {y}" fill="none" stroke="{BLANKET_STRIPE}" stroke-width="70"/>')
        s.append(f'<path d="M 600 {y+75} C 1100 {y+135} 1900 {y+135} 2400 {y+75}" fill="none" stroke="{BLANKET_DARK}" stroke-width="22"/>')
    s.append('</g>')
    # The fold where the blanket is pulled round the front.
    s.append(f'<path d="M 1500 1500 C 1460 1800 1470 2100 1530 2420" fill="none" stroke="{LINE}" stroke-width="{W-6}" stroke-linecap="round"/>')
    # Head: wide and round, with the two eye bumps showing either side of the hat.
    s.append(f'<path d="M 1000 1380 C 930 1200 960 1020 1060 930 C 1010 780 1090 640 1240 630 C 1340 625 1410 690 1430 770 '
             f'C 1480 760 1520 760 1570 770 C 1590 690 1660 625 1760 630 C 1910 640 1990 780 1940 930 '
             f'C 2040 1020 2070 1200 2000 1380 C 1880 1520 1120 1520 1000 1380 Z" fill="{GREEN}" stroke="{LINE}" stroke-width="{W}" stroke-linejoin="round"/>')
    # Closed, contented eyes.
    for cx in (1230, 1770):
        s.append(f'<path d="M {cx-80} 860 C {cx-40} 910 {cx+40} 910 {cx+80} 860" fill="none" stroke="{LINE}" stroke-width="{W}" stroke-linecap="round"/>')
    # Cheeks and a small smile.
    s.append(f'<ellipse cx="1175" cy="1130" rx="95" ry="70" fill="{BLUSH}"/>')
    s.append(f'<ellipse cx="1825" cy="1130" rx="95" ry="70" fill="{BLUSH}"/>')
    s.append(f'<path d="M 1420 1150 C 1460 1200 1540 1200 1580 1150" fill="none" stroke="{LINE}" stroke-width="{W-4}" stroke-linecap="round"/>')
    s.append(f'<circle cx="1450" cy="1060" r="14" fill="{LINE}"/><circle cx="1550" cy="1060" r="14" fill="{LINE}"/>')
    # Hands holding the blanket closed.
    for cx, sx in ((1400, -1), (1620, 1)):
        s.append(f'<path d="M {cx-90} 1560 C {cx-100} 1490 {cx-30} 1460 {cx} 1470 C {cx+40} 1460 {cx+100} 1490 {cx+90} 1560 '
                 f'C {cx+60} 1600 {cx-60} 1600 {cx-90} 1560 Z" fill="{GREEN}" stroke="{LINE}" stroke-width="{W-4}" stroke-linejoin="round"/>')
        s.append(f'<path d="M {cx-30} 1495 L {cx-35} 1560 M {cx+30} 1495 L {cx+35} 1560" stroke="{LINE}" stroke-width="12" stroke-linecap="round"/>')
    # Santa hat sat between the eye bumps, flopping to the right.
    s.append(f'<path d="M 1330 700 C 1350 460 1500 340 1660 350 C 1820 360 1940 450 2000 600 C 1960 610 1920 640 1905 680 '
             f'C 1850 570 1780 520 1700 520 C 1760 580 1780 640 1700 700 Z" fill="{RED}" stroke="{LINE}" stroke-width="{W}" stroke-linejoin="round"/>')
    s.append(f'<path d="M 1300 745 C 1285 690 1320 660 1380 665 C 1480 645 1560 645 1640 665 C 1700 660 1735 690 1720 745 '
             f'C 1720 770 1700 790 1660 785 C 1560 770 1460 770 1360 785 C 1320 790 1300 770 1300 745 Z" fill="{WHITE}" stroke="{LINE}" stroke-width="{W}" stroke-linejoin="round"/>')
    s.append(f'<circle cx="1990" cy="655" r="75" fill="{WHITE}" stroke="{LINE}" stroke-width="{W}"/>')
    # Fairy lights, properly tangled (Sam, 16 Oct 2026: "more tangled instead of
    # just wrapped around"): one strand that loops back on itself, knots in the
    # middle, goes up over a shoulder, and trails off the blanket at both ends,
    # with a plug on one. A second strand crosses it. Bulbs point every way.
    wire = ("M 700 2540 C 760 2470 860 2420 930 2330 "
            "C 1050 2170 1160 2360 1010 2390 C 860 2420 900 2210 1100 2180 "
            "C 1300 2160 1350 1860 1550 1880 "
            "C 1760 1900 1710 2100 1520 2085 C 1330 2070 1420 1820 1610 1835 "
            "C 1800 1855 1660 2050 1470 1995 "
            "C 1650 1780 1880 1640 2050 1520 "
            "C 2210 1440 2260 1660 2120 1705 C 1985 1750 2110 1960 2240 1990 "
            "C 2360 2020 2380 2250 2300 2380 C 2260 2450 2330 2520 2420 2570")
    wire2 = ("M 880 1640 C 1090 1560 1260 1890 1190 2050 C 1130 2190 1360 2260 1520 2210 "
             "C 1660 2170 1700 2290 1820 2300 C 1950 2310 1990 2200 1930 2150")
    for w in (wire, wire2):
        s.append(f'<path d="{w}" fill="none" stroke="#3d4a33" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>')
    # Plug on the trailing left end.
    s.append(f'<g transform="translate(700,2540) rotate(35)"><rect x="-38" y="-10" width="76" height="70" rx="12" fill="#e9e3d6" stroke="{LINE}" stroke-width="14"/>'
             f'<rect x="-22" y="58" width="12" height="40" fill="{LINE}"/><rect x="10" y="58" width="12" height="40" fill="{LINE}"/></g>')
    pts = [(1010, 2390, 160), (1100, 2180, -40), (1560, 1880, 60), (1715, 2060, -125), (1410, 1985, 35),
           (2050, 1520, -70), (2160, 1705, 120), (2330, 2300, 10), (1210, 1770, -30), (1330, 2235, 85),
           (950, 1615, 45), (1820, 2300, -150), (2235, 1990, 70)]
    colours = BULBS + ["#d46aa0", "#e8b63c", "#5b7fc4", "#7fb069"]
    for (x, y, a), c in zip(pts, colours):
        s.append(bulb(x, y, a, c))
    s.append('</g></svg>')
    return "".join(s)

def render(svgtext, size=3000):
    png = cairosvg.svg2png(bytestring=svgtext.encode(), output_width=size, output_height=size)
    return Image.open(io.BytesIO(png)).convert("RGBA")

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

def words(img, colour):
    d = ImageDraw.Draw(img)
    t = font("Fraunces-var.ttf", 250, 600)
    title = "Socially Hibernating"
    d.text(((3000 - d.textlength(title, font=t)) / 2, 150), title, font=t, fill=colour)
    c = font("Caveat-var.ttf", 230, 600)
    cap = "see you in January"
    d.text(((3000 - d.textlength(cap, font=c)) / 2, 2560), cap, font=c, fill=colour)
    z = font("Caveat-var.ttf", 150, 700)
    for i, (x, y) in enumerate([(2150, 1140), (2250, 1020), (2340, 890)]):
        d.text((x, y), "z", font=z, fill=colour)
    return img

if __name__ == "__main__":
    art = render(svg())
    art.save(os.path.join(OUT, "socially-hibernating-art.png"))
    words(art.copy(), BROWN).save(os.path.join(OUT, "socially-hibernating.png"))
    words(art.copy(), CREAM).save(os.path.join(OUT, "socially-hibernating-dark.png"))
    print("written")
