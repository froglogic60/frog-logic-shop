# Turns any finished post picture into a vertical Reel (Sam, 7 Nov 2026:
# insights showed video posts reach far more people than still pictures, so
# every post now goes out as a video). 1080x1920, 30 fps, 9 s, silent H.264.
#
# The card sits in the middle of a 9:16 frame filled with its own background
# colour. Motion: the card settles in, the camera moves in on the headline,
# drifts down the card, then pulls back to show the whole thing.
#
#   python3 reel.py in.jpg out.mp4
import sys, math, subprocess
from PIL import Image, ImageFilter

SRC, OUT = sys.argv[1], sys.argv[2]
OW, OH, FPS, DUR = 1080, 1920, 30, 9

card = Image.open(SRC).convert("RGB")
# At rest the card is 86% of the frame width, so moving in to full width
# never cuts off any of its text.
REST = 0.86
cw = round(OW * REST)
card = card.resize((cw, round(cw * card.height / card.width)), Image.LANCZOS)
CW, CH = card.size
if CH > OH * 0.9:  # very tall picture: fit the height instead
    card = card.resize((round(CW * OH * 0.9 / CH), round(OH * 0.9)), Image.LANCZOS); CW, CH = card.size

# Background: the card's own edge colour, a shade darker, so the bands above
# and below look like part of the post.
edge = [card.getpixel((x, y)) for x in (2, CW // 2, CW - 3) for y in (2, CH - 3)]
avg = tuple(sum(c[i] for c in edge) // len(edge) for i in range(3))
bg = Image.new("RGB", (OW, OH), tuple(round(v * 0.82) for v in avg))
frame = bg.copy()
ox, oy = (OW - CW) // 2, (OH - CH) // 2
shadow = Image.new("RGB", (CW + 40, CH + 40), (0, 0, 0))
mask = Image.new("L", (CW + 40, CH + 40), 0)
mask.paste(90, (20, 20, CW + 20, CH + 20))
frame.paste(shadow, (ox - 20, oy - 6), mask.filter(ImageFilter.GaussianBlur(18)))
frame.paste(card, (ox, oy))
S = 2  # supersample so slow zooms stay smooth
big = frame.resize((OW * S, OH * S), Image.LANCZOS)
bgbig = bg.resize((OW * S, OH * S), Image.BICUBIC)

ease = lambda u: 0.5 - 0.5 * math.cos(math.pi * min(max(u, 0), 1))
cx0, cy0 = OW / 2, OH / 2
top = oy + CH * 0.30      # headline area
low = oy + CH * 0.70      # lower part of the card
zin = OW / CW * 0.995     # card just fills the width
KEYS = [(0.0, (cx0, cy0, 1.0)), (0.8, (cx0, cy0, 1.0)), (4.0, (cx0, top, zin)),
        (6.6, (cx0, low, zin)), (8.2, (cx0, cy0, 1.0)), (DUR, (cx0, cy0, 1.0))]

def at(t):
    for (t0, a), (t1, b) in zip(KEYS, KEYS[1:]):
        if t0 <= t <= t1:
            u = ease((t - t0) / (t1 - t0)) if t1 > t0 else 1
            return tuple(p + (q - p) * u for p, q in zip(a, b))
    return KEYS[-1][1]

p = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
                      "-s", f"{OW}x{OH}", "-r", str(FPS), "-i", "-", "-c:v", "libx264",
                      "-profile:v", "high", "-pix_fmt", "yuv420p", "-crf", "22", "-preset", "medium",
                      "-movflags", "+faststart", OUT], stdin=subprocess.PIPE)
for f in range(FPS * DUR):
    t = f / FPS
    cx, cy, z = at(t)
    w, h = OW / z, OH / z
    x0 = min(max(cx - w / 2, 0), OW - w); y0 = min(max(cy - h / 2, 0), OH - h)
    img = big.resize((OW, OH), Image.BICUBIC, box=(x0 * S, y0 * S, (x0 + w) * S, (y0 + h) * S))
    # opening: the card settles in from slightly smaller and faded
    if t < 0.8:
        u = ease(t / 0.8)
        sc = 0.93 + 0.07 * u
        small = img.resize((round(OW * sc), round(OH * sc)), Image.BICUBIC)
        base = bgbig.resize((OW, OH), Image.BICUBIC)
        base.paste(small, ((OW - small.width) // 2, (OH - small.height) // 2))
        img = Image.blend(bgbig.resize((OW, OH), Image.BICUBIC), base, 0.35 + 0.65 * u)
    p.stdin.write(img.tobytes())
p.stdin.close()
if p.wait() != 0:
    sys.exit("ffmpeg failed")
print("reel written", OUT)
