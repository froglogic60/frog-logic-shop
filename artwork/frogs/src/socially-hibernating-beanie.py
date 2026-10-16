# Beanie embroidery version of Socially Hibernating (Sam, 16 Oct 2026).
# Embroidery wants flat colour, thick lines and no tiny details, so this is
# just the head and the Santa hat from socially-hibernating.py: 5 threads
# (green, outline, red, white, pink), outlines ~2mm at print size, no nostrils,
# no fairy lights, no words. Wide format for the front of a cuffed beanie.
# Writes artwork/frogs/socially-hibernating-beanie.png (2400x840, transparent).
import io, os
import cairosvg
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(os.path.join(HERE, ".."))
GREEN, LINE, BLUSH, RED, WHITE = "#8fb784", "#22331f", "#f08f87", "#c4453b", "#fbf7ee"
W = 56  # outline width in drawing units (~2mm on a 5in-wide beanie patch)

def svg():
    s = ['<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="840" viewBox="0 0 2400 840">',
         # Head + hat occupy x 1000..2080, y 330..1520 in the main drawing.
         '<g transform="translate(1200,420) scale(0.66) translate(-1530,-930)">']
    s.append(f'<path d="M 1000 1380 C 930 1200 960 1020 1060 930 C 1010 780 1090 640 1240 630 C 1340 625 1410 690 1430 770 '
             f'C 1480 760 1520 760 1570 770 C 1590 690 1660 625 1760 630 C 1910 640 1990 780 1940 930 '
             f'C 2040 1020 2070 1200 2000 1380 C 1880 1520 1120 1520 1000 1380 Z" fill="{GREEN}" stroke="{LINE}" stroke-width="{W}" stroke-linejoin="round"/>')
    for cx in (1230, 1770):
        s.append(f'<path d="M {cx-85} 870 C {cx-40} 925 {cx+40} 925 {cx+85} 870" fill="none" stroke="{LINE}" stroke-width="{W}" stroke-linecap="round"/>')
    s.append(f'<ellipse cx="1165" cy="1140" rx="105" ry="78" fill="{BLUSH}"/>')
    s.append(f'<ellipse cx="1835" cy="1140" rx="105" ry="78" fill="{BLUSH}"/>')
    s.append(f'<path d="M 1410 1150 C 1455 1215 1545 1215 1590 1150" fill="none" stroke="{LINE}" stroke-width="{W}" stroke-linecap="round"/>')
    s.append(f'<path d="M 1330 700 C 1350 460 1500 340 1660 350 C 1820 360 1940 450 2000 600 C 1960 610 1920 640 1905 680 '
             f'C 1850 570 1780 520 1700 520 C 1760 580 1780 640 1700 700 Z" fill="{RED}" stroke="{LINE}" stroke-width="{W}" stroke-linejoin="round"/>')
    s.append(f'<path d="M 1300 745 C 1285 690 1320 660 1380 665 C 1480 645 1560 645 1640 665 C 1700 660 1735 690 1720 745 '
             f'C 1720 770 1700 790 1660 785 C 1560 770 1460 770 1360 785 C 1320 790 1300 770 1300 745 Z" fill="{WHITE}" stroke="{LINE}" stroke-width="{W}" stroke-linejoin="round"/>')
    s.append(f'<circle cx="1990" cy="655" r="80" fill="{WHITE}" stroke="{LINE}" stroke-width="{W}"/>')
    s.append('</g></svg>')
    return "".join(s)

if __name__ == "__main__":
    png = cairosvg.svg2png(bytestring=svg().encode(), output_width=2400, output_height=840)
    img = Image.open(io.BytesIO(png)).convert("RGBA")
    box = img.getbbox()
    print("drawn area", box)
    img.save(os.path.join(OUT, "socially-hibernating-beanie.png"))
