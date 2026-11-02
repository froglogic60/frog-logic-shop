# Product-only video from one mockup photo (Sam, 2 Nov 2026): a slow zoom in to
# the design, then back out. No people, no text. 12 s, silent, H.264 MP4.
# Square 1080x1080 for Etsy listings; vertical 1080x1920 for Reels/TikTok.
#   IMAGE=path/to/mockup.jpg NAME=out-name SHAPES=square,vertical python3 product-video.py
# Writes automation/social/videos/<NAME>-<shape>.mp4
import os, math, subprocess
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
IMAGE = os.path.join(ROOT, os.environ["IMAGE"])
NAME = os.environ["NAME"]
SHAPES = (os.environ.get("SHAPES") or "square").split(",")
OUT = os.path.join(os.path.dirname(__file__), "videos")
os.makedirs(OUT, exist_ok=True)

src = Image.open(IMAGE).convert("RGB")
src = src.resize((1200, round(1200 * src.height / src.width)), Image.LANCZOS)
W, H = src.size
bg = src.getpixel((5, 5))
FPS, DUR = 30, 12
# (time, (centre x, centre y, zoom)) in 1200-wide source coordinates
BASE = [(0, (600, H / 2, 1.0)), (3.5, (600, H / 2 + 10, 1.22)), (7.5, (590, H / 2 - 100, 1.7)),
        (10.5, (600, H / 2, 1.0)), (12, (600, H / 2, 1.0))]
ease = lambda u: 0.5 - 0.5 * math.cos(math.pi * u)

def render(shape, ow, oh, zmul):
    keys = [(t, (x, y, z * zmul)) for t, (x, y, z) in BASE]
    def at(t):
        for (t0, a), (t1, b) in zip(keys, keys[1:]):
            if t0 <= t <= t1:
                u = ease((t - t0) / (t1 - t0))
                return tuple(p + (q - p) * u for p, q in zip(a, b))
        return keys[-1][1]
    cw = max(W, round(H * ow / oh)); ch = max(H, round(W * oh / ow))
    canvas = Image.new("RGB", (cw, ch), bg)
    ox, oy = (cw - W) // 2, (ch - H) // 2
    canvas.paste(src, (ox, oy))
    big = canvas.resize((cw * 2, ch * 2), Image.LANCZOS)
    path = os.path.join(OUT, f"{NAME}-{shape}.mp4")
    p = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
                          "-s", f"{ow}x{oh}", "-r", str(FPS), "-i", "-", "-c:v", "libx264",
                          "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "slow",
                          "-movflags", "+faststart", path], stdin=subprocess.PIPE)
    for f in range(FPS * DUR):
        cx, cy, z = at(f / FPS)
        cx += ox; cy += oy
        w, h = cw / z, ch / z
        x0 = min(max(cx - w / 2, 0), cw - w); y0 = min(max(cy - h / 2, 0), ch - h)
        p.stdin.write(big.resize((ow, oh), Image.LANCZOS, box=(x0 * 2, y0 * 2, (x0 + w) * 2, (y0 + h) * 2)).tobytes())
    p.stdin.close(); p.wait()
    print("written", path)

for s in SHAPES:
    if s == "square": render("square", 1080, 1080, 1.0)
    if s == "vertical": render("vertical", 1080, 1920, 1.4)
