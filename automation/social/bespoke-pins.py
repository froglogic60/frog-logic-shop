# Four more Pinterest pins for the Bespoke Planner (Sam, 20 Oct 2026: it is the
# one pin Pinterest sends real traffic to — 14.8k impressions, 35 clicks — so
# give the feed more of it, each with a different reason to click).
#
# 1000x1500 PNGs into automation/social/bespoke-pins/, plus bespoke-pins.csv
# for Pinterest's bulk upload (same columns as pins-pages.csv). Images are
# served from raw.githubusercontent.com once the workflow commits them.
# Usage: python bespoke-pins.py <fonts dir> [first publish date YYYY-MM-DD]
import os, sys, csv, datetime
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "../.."))
FONTS = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, ".gfonts")
START = sys.argv[2] if len(sys.argv) > 2 else (datetime.date.today() + datetime.timedelta(days=1)).isoformat()
OUT = os.path.join(HERE, "bespoke-pins")
RAW = "https://raw.githubusercontent.com/froglogic60/frog-logic-shop/main/automation/social/bespoke-pins"
LINK = "https://froglogic.co.uk/p/the-bespoke-planner/?ref=pinterest"
BOARD = "Printable planners & trackers"
W, H = 1000, 1500
CREAM, INK, GOLD, SAGE, PURPLE, BLUSH = "#F4EFE3", "#1A1A1A", "#E8B63C", "#8FB784", "#5E4A8C", "#F08F87"

def font(name, size, weight=None):
    f = ImageFont.truetype(os.path.join(FONTS, name), size)
    if weight is not None:
        try:
            axes = f.get_variation_axes(); vals = [a.get("default", a["minimum"]) for a in axes]
            for i, a in enumerate(axes):
                n = a.get("name", ""); n = (n.decode() if isinstance(n, bytes) else str(n)).lower()
                if "weight" in n: vals[i] = weight
                elif "optical" in n: vals[i] = max(a["minimum"], min(a["maximum"], round(size * 0.75)))
            f.set_variation_by_axes(vals)
        except Exception:
            pass
    return f

def wrap(d, text, f, maxw):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if d.textlength(t, font=f) > maxw and cur: lines.append(cur); cur = w
        else: cur = t
    if cur: lines.append(cur)
    return lines

def sheet(d, x, y, w, h, fill, ink, rows=5, ticks=(0,)):
    # A planner page with tick boxes and lines, blanks still blank.
    d.rounded_rectangle((x, y, x + w, y + h), 10, fill=fill)
    gap = h / (rows + 1)
    for i in range(rows):
        yy = y + gap * (i + 0.7)
        d.rounded_rectangle((x + 36, yy, x + 36 + 34, yy + 34), 4, outline=ink, width=4)
        if i in ticks:
            d.line((x + 44, yy + 18, x + 52, yy + 27), fill=GOLD, width=6); d.line((x + 52, yy + 27, x + 66, yy + 8), fill=GOLD, width=6)
        d.rounded_rectangle((x + 92, yy + 11, x + w - 40 - (i * 37) % 120, yy + 23), 6, fill="#9A968E")

def mark(img):
    m = Image.open(os.path.join(ROOT, "assets/frog-logic-mark-sm.png")).convert("RGBA"); m.thumbnail((110, 110))
    img.alpha_composite(m, (W - 70 - m.width, 60))

def pin(name, bg, ink, accent, eyebrow, headline, lines, foot, art):
    img = Image.new("RGBA", (W, H), bg); d = ImageDraw.Draw(img)
    art(d)
    mark(img); d = ImageDraw.Draw(img)
    d.text((70, 70), eyebrow, font=font("SpaceMono.ttf", 24), fill=accent, spacing=4)
    hf = font("Fraunces-var.ttf", 92, 700)
    hl = wrap(d, headline, hf, W - 140)
    y = 860
    for l in hl:
        d.text((70, y), l, font=hf, fill=ink); y += 100
    y += 26
    bf = font("SpaceGrotesk-var.ttf", 32, 500)
    for l in lines:
        for ll in wrap(d, l, bf, W - 140):
            d.text((70, y), ll, font=bf, fill=ink); y += 42
        y += 10
    d.text((70, H - 80), foot, font=font("SpaceMono.ttf", 30), fill=accent)
    f2 = font("SpaceMono.ttf", 24)
    d.text((W - 70 - d.textlength("froglogic.co.uk", font=f2), H - 76), "froglogic.co.uk", font=f2, fill=ink)
    os.makedirs(OUT, exist_ok=True)
    img.convert("RGB").save(os.path.join(OUT, name + ".png"), optimize=True)

PINS = [
    dict(name="bespoke-fifteen-questions", bg=CREAM, ink=INK, accent="#5E4A8C",
         eyebrow="THE BESPOKE PLANNER · MADE TO ORDER",
         headline="Fifteen questions. One planner that fits.",
         lines=["How your day runs, how you track energy, what you keep forgetting, what a hard day looks like.", "A printable PDF planner built from your answers and emailed, usually within a couple of hours."],
         foot="£25 · up to 18 pages",
         art=lambda d: (sheet(d, 150, 180, 700, 560, "#FFFFFF", "#1A1A1A", rows=5, ticks=(0, 1))),
         title="ADHD planner built from 15 questions | The Bespoke Planner, printable PDF made for your brain",
         description="Every planner you've bought was built for someone else's brain. Answer fifteen questions and a printable planner of up to eighteen pages is built for yours and emailed as a PDF, usually within a couple of hours. If it doesn't fit, answer again and it gets rebuilt free. £25, undated. From Frog Logic, made by one neurodivergent person in the UK.",
         keywords="adhd planner, custom planner, neurodivergent planner, autism planner, printable planner pdf"),
    dict(name="bespoke-hard-day-page", bg=INK, ink=CREAM, accent=GOLD,
         eyebrow="THE BESPOKE PLANNER · A PAGE FOR THE HARD DAYS",
         headline="A hard-day page you can hand to someone.",
         lines=["What helps, what doesn't, who to ring. Written in your words, printed in your planner, ready before you need it.", "One of the pages the Bespoke Planner builds from your answers."],
         foot="£25 · made to order",
         art=lambda d: (sheet(d, 150, 180, 700, 560, "#F4EFE3", "#1A1A1A", rows=4, ticks=())),
         title="Hard-day page for ADHD and autistic adults | The Bespoke Planner, a printable planner in your own words",
         description="A planner page for the days that go wrong: what helps, what makes it worse, who to ring, in your own words so someone else can read it. It's one of the pages the Bespoke Planner builds from your fifteen answers. Printable PDF, up to eighteen pages, £25, rebuilt free if it doesn't fit. From Frog Logic, made by one neurodivergent person in the UK.",
         keywords="meltdown plan, shutdown plan, autism planner, adhd planner, hard day plan, neurodivergent printable"),
    dict(name="bespoke-undated", bg=SAGE, ink=INK, accent="#1A1A1A",
         eyebrow="THE BESPOKE PLANNER · UNDATED",
         headline="Buy one planner. Print it for years.",
         lines=["No dates, so nothing goes out of date. Print the pages you need, when you need them, as many times as you like.", "Built for your brain from fifteen questions, emailed as a PDF."],
         foot="£25 once",
         art=lambda d: (sheet(d, 110, 200, 560, 480, "#F4EFE3", "#1A1A1A", rows=4, ticks=(0,)), sheet(d, 330, 300, 560, 480, "#FFFFFF", "#1A1A1A", rows=4, ticks=(0, 2))),
         title="Undated printable planner for ADHD and autism | The Bespoke Planner, buy once and print forever",
         description="An undated planner you print at home, so one PDF lasts for years. Built from fifteen questions about how your brain actually works: your routines as tick-lists, your words on the pages, energy tracking the way you do it. Up to eighteen pages, £25, rebuilt free if it doesn't fit. From Frog Logic, made by one neurodivergent person in the UK.",
         keywords="undated planner, printable planner, adhd planner, autism planner, neurodivergent planner"),
    dict(name="bespoke-your-words", bg=PURPLE, ink=CREAM, accent=GOLD,
         eyebrow="THE BESPOKE PLANNER · YOUR WORDS ON THE PAGES",
         headline="Not a planner. Your planner.",
         lines=["Your routines as tick-lists. Spoons or battery, whichever you actually use. The things you keep forgetting, on the page where you'd look.", "Fifteen questions in, a planner for your brain out."],
         foot="£25 · emailed as a PDF",
         art=lambda d: (sheet(d, 150, 180, 700, 560, "#F4EFE3", "#1A1A1A", rows=5, ticks=(0, 1, 2))),
         title="Custom planner for ADHD and autistic adults | The Bespoke Planner, your routines and your words, printable",
         description="Not a planner: your planner. Answer fifteen questions and get a printable PDF with your routines as tick-lists, spoons or battery tracking the way you do it, your own words on the pages and a hard-day page to hand to someone. Up to eighteen pages, £25, undated, rebuilt free if it doesn't fit. From Frog Logic, made by one neurodivergent person in the UK.",
         keywords="custom planner, personalised planner, adhd planner, autism planner, executive dysfunction planner"),
]

if __name__ == "__main__":
    for p in PINS:
        pin(p["name"], p["bg"], p["ink"], p["accent"], p["eyebrow"], p["headline"], p["lines"], p["foot"], p["art"])
        print("written", p["name"])
    start = datetime.date.fromisoformat(START)
    with open(os.path.join(OUT, "bespoke-pins.csv"), "w", newline="") as f:
        w = csv.writer(f, quoting=csv.QUOTE_ALL, lineterminator="\n")
        w.writerow(["Title", "Media URL", "Pinterest board", "Thumbnail", "Description", "Link", "Publish date", "Keywords"])
        for i, p in enumerate(PINS):
            day = start + datetime.timedelta(days=i)
            w.writerow([p["title"], f"{RAW}/{p['name']}.png", BOARD, "", p["description"], LINK, f"{day.isoformat()}T12:30:00", p["keywords"]])
    print("csv written from", START)
