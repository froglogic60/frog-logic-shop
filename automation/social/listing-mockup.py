# Main listing photo for the Christmas Visual Timetable Big Pack (3 Nov 2026).
#
# Etsy's old main photo was a flat grid of small icons; the main photo decides
# whether anyone clicks. This builds a 2400x1800 picture of the pack in use:
# the "My Christmas Day" page filled in with real picture cards (three ticked),
# a few loose cards and the "I need a break" card, with the title alongside.
# Everything is cut from digital/Christmas-Visual-Timetable-Big-Pack.pdf, so
# it shows exactly what the buyer gets. No web address in the picture (the
# page footer is cropped off), so the same image is fine on Etsy and on Tes.
#
#   FONT=/path/fraunces-latin-600-normal.woff2 python3 listing-mockup.py
# writes automation/social/listing-photos/christmas-visual-schedule.jpg
import base64, os, subprocess, tempfile
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PDF = os.path.join(ROOT, "digital", "Christmas-Visual-Timetable-Big-Pack.pdf")
OUT = os.path.join(ROOT, "automation", "social", "listing-photos", "christmas-visual-schedule.jpg")
FONT = os.environ["FONT"]

tmp = tempfile.mkdtemp()
subprocess.run(["pdftoppm", "-r", "250", "-png", PDF, os.path.join(tmp, "p")], check=True)
def page(n):
    for name in (f"p-{n}.png", f"p-{n:02d}.png"):
        f = os.path.join(tmp, name)
        if os.path.exists(f): return Image.open(f).convert("RGB")
    raise FileNotFoundError(n)
p1, p2, p4, p5, p7 = page(1), page(2), page(4), page(5), page(7)

# Picture-card grid on the card pages (pixels at 250 dpi)
X = [138, 586, 1031, 1479, 1927]
Y = [338, 795, 1251, 1707, 2160, 2615]
def cell(pg, r, c, inset=6):
    return pg.crop((X[c] + inset, Y[r] + inset, X[c + 1] - inset, Y[r + 1] - inset))

# Fill the eight slots on "My Christmas Day"
slots = [(579, 798), (842, 1061), (1102, 1321), (1363, 1582), (1626, 1845), (1886, 2105), (2147, 2365), (2410, 2628)]
cards = [(0, 0), (0, 2), (1, 0), (2, 0), (2, 2), (1, 1), (3, 3), (4, 2)]  # wake up, breakfast, presents, visitors, dinner, quiet time, bath, bed
tt = p1.copy(); d = ImageDraw.Draw(tt)
for (r, c), (y0, y1) in zip(cards, slots):
    s = y1 - y0 - 10
    card = cell(p4, r, c, 10); card = card.resize((int(card.width * s / card.height), s))
    x = 320 + (231 - card.width) // 2
    tt.paste(card, (x, y0 + 5))
    d.rectangle((x, y0 + 5, x + card.width, y0 + 5 + s), outline=(200, 190, 175), width=3)
for (y0, y1) in slots[:3]:
    cy = (y0 + y1) // 2
    d.line([(1835, cy + 5), (1865, cy + 40), (1925, cy - 35)], fill=(46, 125, 70), width=14)
tt = tt.crop((0, 0, 2066, 2720))  # footer (with the web address) cropped off

parts = {
    "tt": tt,
    "tree": cell(p5, 3, 1),
    "stocking": cell(p5, 3, 2),
    "pudding": cell(p4, 2, 3),
    "brk": p7.crop((120, 1050, 1950, 1500)),
}
def b64(im):
    f = os.path.join(tmp, "x.png"); im.save(f)
    return "data:image/png;base64," + base64.b64encode(open(f, "rb").read()).decode()
src = {k: b64(v) for k, v in parts.items()}
font = base64.b64encode(open(FONT, "rb").read()).decode()

html = f"""<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{{font-family:Fr;src:url(data:font/woff2;base64,{font}) format("woff2");font-weight:600}}
html,body{{margin:0;width:2400px;height:1800px;overflow:hidden}}
body{{background:radial-gradient(ellipse at 40% 45%,#F6EFE3 0%,#ECE1CF 60%,#E2D4BE 100%);font-family:"DejaVu Sans",sans-serif;position:relative}}
.paper{{position:absolute;background:#fff;box-shadow:0 30px 60px rgba(70,50,30,.28),0 6px 14px rgba(70,50,30,.18)}}
.tt{{left:120px;top:150px;width:1110px;transform:rotate(-2.5deg)}}
.tt img{{width:100%;display:block}}
.card{{position:absolute;background:#fff;border:3px solid #D8CCB8;border-radius:18px;overflow:hidden;box-shadow:0 18px 30px rgba(70,50,30,.25),0 3px 8px rgba(70,50,30,.15)}}
.card img{{display:block;width:100%}}
.brk{{position:absolute;border-radius:40px;overflow:hidden;box-shadow:0 22px 40px rgba(70,50,30,.25)}}
.brk img{{display:block;width:100%}}
.txt{{position:absolute;left:1340px;top:150px;width:960px;color:#5A3B27}}
.kick{{font-size:34px;letter-spacing:6px;color:#B4432F;font-weight:bold}}
h1{{font-family:Fr,serif;font-weight:600;font-size:132px;line-height:1.0;margin:22px 0 26px}}
.sub{{font-size:44px;color:#6B5443;margin-bottom:34px}}
ul{{list-style:none;padding:0;margin:0;font-size:42px;line-height:1.75}}
li::before{{content:"";display:inline-block;width:18px;height:18px;border-radius:50%;background:#7FA36B;margin-right:22px;vertical-align:middle}}
</style></head><body>
<div class="paper tt"><img src="{src['tt']}"></div>
<div class="txt"><div class="kick">PRINTABLE · INSTANT DOWNLOAD</div>
<h1>Christmas Visual Schedule</h1>
<div class="sub">for autistic and ADHD children</div>
<ul><li>60 picture cards</li><li>Now and next + first, then boards</li><li>Christmas Day + holiday week</li><li>A4 and US Letter PDF</li></ul></div>
<div class="card" style="left:1390px;top:1140px;width:250px;transform:rotate(-8deg)"><img src="{src['tree']}"></div>
<div class="card" style="left:1690px;top:1100px;width:250px;transform:rotate(5deg)"><img src="{src['stocking']}"></div>
<div class="card" style="left:1990px;top:1150px;width:250px;transform:rotate(-4deg)"><img src="{src['pudding']}"></div>
<div class="brk" style="left:1430px;top:1440px;width:860px;transform:rotate(2deg)"><img src="{src['brk']}"></div>
</body></html>"""
hf = os.path.join(tmp, "mock.html"); open(hf, "w").write(html)
os.makedirs(os.path.dirname(OUT), exist_ok=True)
png = os.path.join(tmp, "mock.png")
with sync_playwright() as pw:
    b = pw.chromium.launch(); pg = b.new_page(viewport={"width": 2400, "height": 1800})
    pg.goto("file://" + hf); pg.wait_for_timeout(800); pg.screenshot(path=png); b.close()
Image.open(png).convert("RGB").save(OUT, quality=90)
print("Wrote", OUT, os.path.getsize(OUT), "bytes")
