"""Contact sheets of the US product mockups, one per product line, so they can
be checked by eye before the US range goes live. Reads printify-us-result.json
and writes automation/social/us-mockups/<kind>.jpg."""
import io, json, os, urllib.request
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "us-mockups")
os.makedirs(OUT, exist_ok=True)
rows = json.load(open(os.path.join(HERE, "printify-us-result.json")))["results"]
S, C, LAB = 360, 5, 30
try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 17)
except OSError:
    font = ImageFont.load_default()
for kind in ["mug", "tee", "print", "notebook"]:
    items = [r for r in rows if r["kind"] == kind and r.get("mockup")]
    if not items:
        continue
    R = (len(items) + C - 1) // C
    sheet = Image.new("RGB", (S * C, (S + LAB) * R), "white")
    d = ImageDraw.Draw(sheet)
    for k, r in enumerate(items):
        x, y = (k % C) * S, (k // C) * (S + LAB)
        try:
            req = urllib.request.Request(r["mockup"], headers={"User-Agent": "Mozilla/5.0"})
            im = Image.open(io.BytesIO(urllib.request.urlopen(req, timeout=60).read())).convert("RGB")
            im.thumbnail((S - 6, S - 6))
            sheet.paste(im, (x + (S - im.width) // 2, y + 3))
        except Exception as e:
            d.text((x + 10, y + S // 2), "FAILED " + str(e)[:30], fill="red", font=font)
        d.text((x + S // 2, y + S + 4), r["name"][:32], fill="black", font=font, anchor="ma")
    sheet.save(os.path.join(OUT, kind + ".jpg"), quality=82)
    print(kind, len(items))
