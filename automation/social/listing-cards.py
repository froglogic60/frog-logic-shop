# Main listing photos for the printable card sets (3 Nov 2026), in the same
# style as listing-mockup.py: the three card fronts, cut from the real PDFs
# (right half of pages 1, 3 and 5), fanned out with the title alongside.
# No web address in the pictures (only the fronts are shown).
#
#   FONT=/path/fraunces-latin-600-normal.woff2 python3 listing-cards.py
# writes automation/social/listing-photos/<name>.jpg for each set below.
import base64, os, subprocess, tempfile
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUTDIR = os.path.join(ROOT, "automation", "social", "listing-photos")
FONT = base64.b64encode(open(os.environ["FONT"], "rb").read()).decode()

SETS = [
    dict(name="thank-you-cards-sen-staff", pdf="Thank-You-Cards-SEN-Staff.pdf",
         title="Teacher Thank You Cards",
         sub="for teaching assistants, SEN teachers and SENCOs",
         bullets=["Set of 3 fold-in-half cards", "Space inside for your own words", "Print at home, A4 and US Letter"],
         bg="radial-gradient(ellipse at 35% 45%,#F7F3EA 0%,#EEE6D6 60%,#E4D8C3 100%)", ink="#3F5A35", kick="#B4432F"),
    dict(name="christmas-cards-bright", pdf="Christmas-Cards-Bright.pdf",
         title="Introvert Christmas Cards",
         sub="the Socially Hibernating frog, in bright colours",
         bullets=["Set of 3 fold-in-half cards", "Blank inside to write your own", "Print at home, A4 and US Letter"],
         bg="radial-gradient(ellipse at 35% 45%,#F5F0FF 0%,#E8E0F7 60%,#DCD1F0 100%)", ink="#4A2E7A", kick="#D6246E"),
    dict(name="christmas-cards-original", pdf="Christmas-Cards-Original.pdf",
         title="Introvert Christmas Cards",
         sub="the Socially Hibernating frog, in soft colours",
         bullets=["Set of 3 fold-in-half cards", "Blank inside to write your own", "Print at home, A4 and US Letter"],
         bg="radial-gradient(ellipse at 35% 45%,#F6EFE3 0%,#ECE1CF 60%,#E2D4BE 100%)", ink="#5A3B27", kick="#B4432F"),
    dict(name="christmas-cards-black-and-white", pdf="Christmas-Cards-Black-and-White.pdf",
         title="Introvert Christmas Cards",
         sub="black and white, ready to colour in",
         bullets=["Set of 3 fold-in-half cards", "Blank inside to write your own", "Print at home, A4 and US Letter"],
         bg="radial-gradient(ellipse at 35% 45%,#F7F7F5 0%,#E9E9E5 60%,#DCDCD6 100%)", ink="#2E2C27", kick="#2E2C27"),
]

def b64(im, tmp):
    f = os.path.join(tmp, "x.png"); im.save(f)
    return "data:image/png;base64," + base64.b64encode(open(f, "rb").read()).decode()

def fronts(pdf, tmp):
    prefix = os.path.join(tmp, "p")
    subprocess.run(["pdftoppm", "-r", "200", "-png", "-f", "1", "-l", "5", os.path.join(ROOT, "digital", pdf), prefix], check=True)
    out = []
    for n in (1, 3, 5):
        f = next(p for p in (f"{prefix}-{n}.png", f"{prefix}-{n:02d}.png") if os.path.exists(p))
        im = Image.open(f).convert("RGB"); w, h = im.size
        out.append(im.crop((w // 2, 0, w, h)))  # right half = the front of the folded card
    return out

def page(s, cards):
    li = "".join(f"<li>{b}</li>" for b in s["bullets"])
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{{font-family:Fr;src:url(data:font/woff2;base64,{FONT}) format("woff2");font-weight:600}}
html,body{{margin:0;width:2400px;height:1800px;overflow:hidden}}
body{{background:{s['bg']};font-family:"DejaVu Sans",sans-serif;position:relative}}
.c{{position:absolute;width:700px;box-shadow:0 30px 50px rgba(60,45,30,.28),0 5px 12px rgba(60,45,30,.18);border-radius:6px;overflow:hidden;background:#fff}}
.c img{{display:block;width:100%}}
.txt{{position:absolute;left:1440px;top:520px;width:880px;color:{s['ink']}}}
.kick{{font-size:34px;letter-spacing:6px;color:{s['kick']};font-weight:bold}}
h1{{font-family:Fr,serif;font-weight:600;font-size:124px;line-height:1.02;margin:22px 0 26px}}
.sub{{font-size:42px;opacity:.85;margin-bottom:40px;line-height:1.3}}
ul{{list-style:none;padding:0;margin:0;font-size:42px;line-height:1.75}}
li::before{{content:"";display:inline-block;width:18px;height:18px;border-radius:50%;background:{s['kick']};opacity:.7;margin-right:22px;vertical-align:middle}}
</style></head><body>
<div class="c" style="left:70px;top:500px;transform:rotate(-9deg)"><img src="{cards[1]}"></div>
<div class="c" style="left:640px;top:530px;transform:rotate(8deg)"><img src="{cards[2]}"></div>
<div class="c" style="left:350px;top:410px;transform:rotate(-1deg);z-index:2"><img src="{cards[0]}"></div>
<div class="txt"><div class="kick">PRINTABLE · INSTANT DOWNLOAD</div>
<h1>{s['title']}</h1><div class="sub">{s['sub']}</div><ul>{li}</ul></div>
</body></html>"""

os.makedirs(OUTDIR, exist_ok=True)
only = os.environ.get("ONLY")
with sync_playwright() as pw:
    b = pw.chromium.launch()
    for s in SETS:
        if only and s["name"] != only: continue
        tmp = tempfile.mkdtemp()
        cards = [b64(c, tmp) for c in fronts(s["pdf"], tmp)]
        hf = os.path.join(tmp, "m.html"); open(hf, "w").write(page(s, cards))
        pg = b.new_page(viewport={"width": 2400, "height": 1800})
        pg.goto("file://" + hf); pg.wait_for_timeout(800)
        png = os.path.join(tmp, "m.png"); pg.screenshot(path=png); pg.close()
        out = os.path.join(OUTDIR, s["name"] + ".jpg")
        Image.open(png).convert("RGB").save(out, quality=90)
        print("Wrote", out, os.path.getsize(out), "bytes")
    b.close()
