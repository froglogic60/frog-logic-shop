# A Reel made from Printify's own photographs of people wearing the tee
# (Sam, 10 Nov 2026: "Printify is showing pictures of people wearing the
# clothing ... make our social posts videos using those").
#
# The photographs are Printify's mockup library shots (real studio models with
# our artwork placed on the shirt), fetched by reel.js. 1080x1920, 30 fps,
# silent H.264. The words sit above the photo so Instagram's own buttons and
# caption, which cover the bottom of a Reel, never hide them.
#
#   python3 worn.py out.mp4 "Title" "Line under it" "£19 · free UK post" a.jpg b.jpg ...
import sys, os, math, subprocess
from PIL import Image, ImageDraw, ImageFont

OUT, TITLE, LINE, PRICE = sys.argv[1:5]
SRC = sys.argv[5:]
if len(SRC) < 2:
    sys.exit("need at least two photographs")
OW, OH, FPS = 1080, 1920, 30
# SHAPE=square: 1080x1080, photographs only, for Etsy listing videos (no
# words, no price and no website address: Etsy prices differ and Etsy does not
# allow sending shoppers off the site).
SQUARE = os.environ.get("SHAPE") == "square"
if SQUARE:
    OH = 1080
HOLD, FADE = 2.1, 0.45            # seconds each photo is held, and the cross-fade
CREAM, INK, GREEN, GOLD = (244, 239, 227), (26, 26, 26), (47, 74, 58), (232, 182, 60)
PY, PS = (0 if SQUARE else 540), 1080   # photo: full width square starting here
FONTS = os.environ.get("FONT_DIR") or os.path.join(os.path.dirname(os.path.abspath(__file__)), ".gfonts")


def font(name, size, wght):
    f = ImageFont.truetype(os.path.join(FONTS, name), size)
    try:
        axes = f.get_variation_axes()
        vals = []
        for a in axes:
            tag = a.get("name")
            tag = tag.decode() if isinstance(tag, bytes) else str(tag)
            if tag.lower() in ("weight", "wght"):
                vals.append(min(max(wght, a["minimum"]), a["maximum"]))
            else:
                vals.append(a["default"])
        f.set_variation_by_axes(vals)
    except Exception:
        pass
    return f


def wrap(d, text, f, width):
    lines, cur = [], ""
    for w in text.split():
        t = (cur + " " + w).strip()
        if d.textlength(t, font=f) <= width or not cur:
            cur = t
        else:
            lines.append(cur); cur = w
    if cur:
        lines.append(cur)
    return lines


# ---- the still layer: background, words, price pill -------------------------
base = Image.new("RGB", (OW, OH), CREAM)
d = ImageDraw.Draw(base)
small = None if SQUARE else font("DMSans-var.ttf", 30, 700)
if SQUARE:
    TITLE, LINE = "", ""
else:
  d.text((OW / 2, 215), "F R O G   L O G I C", font=small, fill=GREEN, anchor="mm")

# Title: biggest size at which it fits in two lines.
for size in (92, 84, 76, 68, 60, 54, 48):
    tf = font("Fraunces-var.ttf", size, 700)
    tl = wrap(d, TITLE, tf, OW - 150)
    if len(tl) <= 2:
        break
# Line under it: shrink to fit two lines; if it still won't, keep whole
# sentences from the front rather than cutting one in half.
text = LINE
while True:
    for ls in (38, 34, 31):
        lf = font("DMSans-var.ttf", ls, 500)
        ll = wrap(d, text, lf, OW - 170)
        if len(ll) <= 2:
            break
    if len(ll) <= 2 or ". " not in text:
        ll = ll[:2]; break
    text = text.rsplit(". ", 1)[0] + "."
th = len(tl) * size * 1.08
block = th + (14 + len(ll) * 50 if ll else 0)
y = 255 + (PY - 30 - 255 - block) / 2
for t in tl:
    d.text((OW / 2, y + size * 0.54), t, font=tf, fill=INK, anchor="mm"); y += size * 1.08
y += 14
for t in ll:
    d.text((OW / 2, y + 25), t, font=lf, fill=(70, 70, 70), anchor="mm"); y += 50

# Price pill, laid over the bottom of the photo but above Instagram's buttons.
pf = font("DMSans-var.ttf", 40, 700)
ptxt = PRICE + "   froglogic.co.uk"
pw = d.textlength(ptxt, font=pf) + 80
pill = Image.new("RGBA", (OW, OH), (0, 0, 0, 0))
pd = ImageDraw.Draw(pill)
px0, py0 = (OW - pw) / 2, 1392
if not SQUARE:
    pd.rounded_rectangle((px0, py0, px0 + pw, py0 + 84), 42, fill=GOLD + (245,))
    pd.text((OW / 2, py0 + 42), ptxt, font=pf, fill=INK, anchor="mm")

photos = [Image.open(p).convert("RGB").resize((1200, 1200), Image.LANCZOS) for p in SRC]
N = len(photos)
STEP = HOLD + FADE
DUR = N * STEP + 0.6              # the last photo lingers


def shot(i, age):
    # Slow move in; alternate photos drift the other way so it doesn't pulse.
    z = 1.0 + 0.07 * min(age / (STEP + FADE), 1) if i % 2 == 0 else 1.07 - 0.07 * min(age / (STEP + FADE), 1)
    w = 1200 / z
    x0 = (1200 - w) / 2
    y0 = (1200 - w) * 0.35       # keep the chest (the artwork) in frame
    return photos[i].resize((PS, PS), Image.BICUBIC, box=(x0, y0, x0 + w, y0 + w))


p = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
                      "-s", f"{OW}x{OH}", "-r", str(FPS), "-i", "-", "-c:v", "libx264",
                      "-profile:v", "high", "-pix_fmt", "yuv420p", "-crf", "22", "-preset", "medium",
                      "-movflags", "+faststart", OUT], stdin=subprocess.PIPE)
for f in range(round(FPS * DUR)):
    t = f / FPS
    i = min(int(t / STEP), N - 1)
    age = t - i * STEP
    img = shot(i, age)
    if i > 0 and age < FADE:      # fade in over the previous photo
        prev = shot(i - 1, age + STEP)
        u = 0.5 - 0.5 * math.cos(math.pi * age / FADE)
        img = Image.blend(prev, img, u)
    frame = base.copy()
    frame.paste(img, (0, PY))
    frame.paste(pill, (0, 0), pill)
    if t < 0.5:                   # open with a short fade up from the background
        frame = Image.blend(Image.new("RGB", (OW, OH), CREAM), frame, t / 0.5)
    p.stdin.write(frame.tobytes())
p.stdin.close()
if p.wait() != 0:
    sys.exit("ffmpeg failed")
print("worn reel written", OUT, f"{N} photos, {DUR:.1f}s")
