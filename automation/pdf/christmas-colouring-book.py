"""Frog Logic Cosy Christmas Colouring Book (Sam, 6 Nov 2026).
30 cosy frog designs drawn in code. One file: the drawing kit, the 30 scenes,
the KDP paperback interior, and the printable download + shop pictures.
  python3 book.py printable <out>   A4 + US Letter PDFs and two JPG pictures
  python3 book.py kdp <out>         66-page KDP interior PDF
Needs rsvg-convert, pypdf, Pillow, and the Poppins + Fraunces fonts installed.
"""
import math, os, re, subprocess, sys, random
from pypdf import PdfWriter, PdfReader


W = 6.0      # main outline width
T = 3.6      # detail line width
INK = "#111"


def f(n):
    return f"{n:.2f}".rstrip("0").rstrip(".")


class Svg:
    def __init__(self):
        self.parts = []

    def add(self, s):
        self.parts.append(s)

    def __iadd__(self, s):
        self.parts.append(s)
        return self

    def text(self):
        return "\n".join(self.parts)


# ---------- primitives (return svg strings) ----------
def circ(x, y, r):
    return f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(r)}"/>'


def ell(x, y, rx, ry, rot=0):
    t = f' transform="rotate({f(rot)} {f(x)} {f(y)})"' if rot else ""
    return f'<ellipse cx="{f(x)}" cy="{f(y)}" rx="{f(rx)}" ry="{f(ry)}"{t}/>'


def rect(x, y, w, h, r=0, rot=0, cx=None, cy=None):
    t = ""
    if rot:
        cx = x + w / 2 if cx is None else cx
        cy = y + h / 2 if cy is None else cy
        t = f' transform="rotate({f(rot)} {f(cx)} {f(cy)})"'
    return f'<rect x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}" rx="{f(r)}"{t}/>'


def path(d):
    return f'<path d="{d}"/>'


def poly(pts):
    return '<polygon points="' + " ".join(f"{f(a)},{f(b)}" for a, b in pts) + '"/>'


def shape(s, w=W, fill="#fff"):
    """single outlined white shape"""
    return f'<g fill="{fill}" stroke="{INK}" stroke-width="{f(w)}" stroke-linejoin="round" stroke-linecap="round">{s}</g>'


def blob(shapes, w=W, fill="#fff"):
    s = "".join(shapes)
    return (f'<g fill="{fill}" stroke="{INK}" stroke-width="{f(2*w)}" stroke-linejoin="round" stroke-linecap="round">{s}</g>'
            f'<g fill="{fill}" stroke="none">{s}</g>')


def line(d, w=T):
    return f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="{f(w)}" stroke-linecap="round" stroke-linejoin="round"/>'


def dot(x, y, r=3.4):
    return f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(r)}" fill="{INK}"/>'


def g(content, x=0, y=0, s=1, rot=0, flip=False):
    t = f"translate({f(x)} {f(y)})"
    if rot:
        t += f" rotate({f(rot)})"
    if s != 1 or flip:
        t += f" scale({f(-s if flip else s)} {f(s)})"
    return f'<g transform="{t}">{content}</g>'


def star(x, y, r, n=5, inner=0.45, rot=-90):
    pts = []
    for i in range(2 * n):
        rr = r if i % 2 == 0 else r * inner
        a = math.radians(rot + i * 180 / n)
        pts.append((x + rr * math.cos(a), y + rr * math.sin(a)))
    return poly(pts)


def rounded_star(x, y, r, w=T):
    return shape(star(x, y, r), w)


def snowflake(x, y, r, w=3.2):
    d = ""
    for i in range(6):
        a = math.radians(i * 60 - 90)
        ex, ey = x + r * math.cos(a), y + r * math.sin(a)
        d += f"M{f(x)},{f(y)} L{f(ex)},{f(ey)} "
        for side in (-1, 1):
            bx, by = x + r * 0.6 * math.cos(a), y + r * 0.6 * math.sin(a)
            b2 = a + side * math.radians(40)
            d += f"M{f(bx)},{f(by)} L{f(bx + r*0.32*math.cos(b2))},{f(by + r*0.32*math.sin(b2))} "
    return line(d, w)


def heart(x, y, s):
    d = (f"M{f(x)},{f(y+s*0.9)} C{f(x-s*1.4)},{f(y)} {f(x-s*0.8)},{f(y-s*0.9)} {f(x)},{f(y-s*0.3)} "
         f"C{f(x+s*0.8)},{f(y-s*0.9)} {f(x+s*1.4)},{f(y)} {f(x)},{f(y+s*0.9)} Z")
    return shape(path(d), T)


# ---------- the frog ----------
def frog_head(eyes="happy", mouth="smile", cheeks=True, tongue=False):
    """head centred at 0,0; ~190 wide, bumps reach y=-94"""
    out = blob([ell(0, 0, 96, 70), circ(-52, -56, 38), circ(52, -56, 38)])
    if eyes == "happy":       # ∩ arcs
        out += line("M-72,-52 Q-52,-74 -32,-52") + line("M32,-52 Q52,-74 72,-52")
    elif eyes == "sleep":     # ∪ arcs
        out += line("M-72,-60 Q-52,-42 -32,-60") + line("M32,-60 Q52,-42 72,-60")
    elif eyes == "open":
        out += shape(circ(-52, -58, 14), T) + dot(-50, -56, 7) + shape(circ(52, -58, 14), T) + dot(54, -56, 7)
    elif eyes == "wink":
        out += line("M-72,-52 Q-52,-74 -32,-52") + shape(circ(52, -58, 14), T) + dot(54, -56, 7)
    out += dot(-10, -10) + dot(10, -10)
    if mouth == "smile":
        out += line("M-24,10 Q0,30 24,10")
    elif mouth == "o":
        out += shape(ell(0, 18, 9, 11), T)
    elif mouth == "small":
        out += line("M-14,12 Q0,22 14,12")
    if tongue:
        out += shape(path("M-8,16 Q0,60 8,16 Z"), T)
    if cheeks:
        out += shape(circ(-60, 14, 15), 3) + shape(circ(60, 14, 15), 3)
    return out


def frog_body(belly=True):
    out = shape(path("M-74,40 C-112,96 -112,160 -78,172 L78,172 C112,160 112,96 74,40 Z"))
    if belly:
        out += line("M-46,92 Q0,70 46,92 Q56,138 0,160 Q-56,138 -46,92 Z", 3)
    return out


def foot(x, y, flip=False):
    sx = -1 if flip else 1
    return blob([ell(x, y, 30, 14), circ(x + sx*22, y + 6, 9), circ(x + sx*6, y + 10, 9), circ(x - sx*10, y + 9, 8)], T + 1)


def hand(x, y, rot=0, s=1):
    shapes = [ell(0, 0, 19, 15), circ(-12, -12, 8), circ(0, -16, 8.5), circ(12, -12, 8)]
    return g(blob(shapes, T + 1), x, y, s, rot)


def frog(x, y, s=1, eyes="happy", mouth="smile", body=True, feet=True, hands=None, between="", top="",
         tongue=False, belly=True, rot=0, cheeks=True):
    """Full frog. `between` is drawn after body/head but before hands (things being held).
    hands: list of (x,y,rot) in frog units. `top` drawn last (hats etc)."""
    out = ""
    if body:
        out += frog_body(belly)
        if feet:
            out += foot(-52, 172) + foot(52, 172, True)
    out += frog_head(eyes, mouth, cheeks, tongue)
    out += between
    if hands is None:
        hands = [(-58, 96, -20), (58, 96, 20)] if body else []
    for hx, hy, hr in hands:
        out += hand(hx, hy, hr)
    out += top
    return g(out, x, y, s, rot)


# ---------- props (all drawn around their own origin) ----------
def santa_hat(x=0, y=-96, rot=-8, s=1):
    hat = (shape(path("M-62,4 C-50,-60 10,-96 70,-70 C40,-60 34,-30 58,4 Z"))
           + shape(circ(74, -70, 15))
           + shape(rect(-72, -6, 144, 26, 13)))
    return g(hat, x, y, s, rot)


def beanie(x=0, y=-92):
    out = shape(path("M-78,10 C-78,-70 78,-70 78,10 Z"))
    out += line("M-40,-40 L-40,6 M-10,-48 L-10,6 M20,-48 L20,6 M50,-36 L50,6", 3)
    out += shape(rect(-86, -2, 172, 26, 12)) + shape(circ(0, -66, 18))
    return g(out, x, y)


def antlers(x=0, y=-92):
    out = ""
    for sx in (-1, 1):
        d = (f"M{sx*40},0 C{sx*44},-40 {sx*60},-70 {sx*70},-96 M{sx*52},-48 C{sx*72},-54 {sx*86},-62 {sx*96},-76 "
             f"M{sx*62},-74 C{sx*52},-88 {sx*44},-96 {sx*40},-110")
        out += line(d, 11) + f'<path d="{d}" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>'
    out += line("M-70,8 Q0,-26 70,8", 9) + '<path d="M-70,8 Q0,-26 70,8" fill="none" stroke="#fff" stroke-width="2"/>'
    return g(out, x, y)


def scarf(y=40, tail=True):
    out = shape(path(f"M-82,{y-14} Q0,{y+10} 82,{y-14} L84,{y+10} Q0,{y+36} -84,{y+10} Z"))
    if tail:
        out += shape(path(f"M30,{y+12} L58,{y+12} L66,{y+92} L38,{y+96} Z"))
        out += line(f"M40,{y+96} L38,{y+110} M50,{y+95} L50,{y+110} M60,{y+93} L63,{y+108}", 3)
        out += line(f"M34,{y+40} L60,{y+38} M36,{y+66} L63,{y+64}", 3)
    out += line(f"M-60,{y-4} L-58,{y+18} M-30,{y+2} L-30,{y+24} M0,{y+4} L0,{y+26}", 3)
    return out


def mug(x, y, s=1, steam=True, marsh=False, rot=0):
    out = shape(path("M-34,-30 L34,-30 L30,30 Q0,40 -30,30 Z"))
    out += shape(path("M32,-16 C62,-18 62,22 30,18"), W, "none")
    out += line("M-34,-30 Q0,-20 34,-30", 3)
    if marsh:
        out += shape(rect(-24, -42, 16, 16, 4, 12)) + shape(rect(-4, -46, 16, 16, 4, -10)) + shape(rect(14, -40, 15, 15, 4, 20))
    if steam:
        out += line("M-14,-52 C-24,-64 -4,-74 -14,-88 M10,-56 C0,-68 20,-78 10,-92", 3.2)
    out += heart(0, 4, 9)
    return g(out, x, y, s, rot)


def present(x, y, w=80, h=64, rot=0, bow=True):
    out = shape(rect(-w/2, -h/2, w, h, 6))
    out += shape(rect(-w/2 - 4, -h/2 - 14, w + 8, 18, 5))
    out += line(f"M0,{-h/2-14} L0,{h/2}", 8) + f'<path d="M0,{f(-h/2-14)} L0,{f(h/2)}" stroke="#fff" stroke-width="3"/>'
    if bow:
        out += shape(path(f"M0,{-h/2-14} C-30,{-h/2-44} -40,{-h/2-10} 0,{-h/2-14} Z"), T)
        out += shape(path(f"M0,{-h/2-14} C30,{-h/2-44} 40,{-h/2-10} 0,{-h/2-14} Z"), T)
        out += shape(circ(0, -h/2 - 14, 6), T)
    return g(out, x, y, 1, rot)


def tree(x, y, s=1, baubles=True, star_top=True, plain=False):
    tiers = [(-150, 150, 40), (-120, 120, -40), (-90, 90, -115)]
    out = shape(rect(-22, 40, 44, 44, 4))
    out += shape(path("M-60,84 L60,84 L50,124 L-50,124 Z"))
    for i, (l, r, yb) in enumerate(tiers):
        top = yb - 105
        out += shape(path(f"M{l},{yb} Q0,{yb+24} {r},{yb} L0,{top} Z"))
    if baubles and not plain:
        for bx, by in [(-80, 22), (20, 30), (95, 18), (-50, -50), (45, -55), (-10, -120), (-90, -2), (60, -10)]:
            out += shape(circ(bx, by, 11), T) + shape(rect(bx - 5, by - 16, 10, 6, 2), 2.6)
    if star_top:
        out += shape(star(0, -228, 30, inner=0.48), W)
    return g(out, x, y, s)


def garland(x1, y1, x2, y2, sag=40, n=8, w=3):
    """string of lights"""
    mx, my = (x1 + x2) / 2, (y1 + y2) / 2 + sag
    out = line(f"M{f(x1)},{f(y1)} Q{f(mx)},{f(my)} {f(x2)},{f(y2)}", w)
    for i in range(1, n):
        t = i / n
        bx = (1-t)**2*x1 + 2*(1-t)*t*mx + t*t*x2
        by = (1-t)**2*y1 + 2*(1-t)*t*my + t*t*y2
        rot = 15 if i % 2 else -15
        out += g(shape(rect(-4, -2, 8, 6, 1), 2.4) + shape(path("M-7,4 Q-9,18 0,24 Q9,18 7,4 Z"), 2.8), bx, by, 1, rot)
    return out


def candle(x, y, h=70, s=1):
    out = shape(rect(-14, -h, 28, h, 4))
    out += shape(path(f"M0,{-h-36} C-14,{-h-20} -10,{-h-4} 0,{-h-4} C10,{-h-4} 14,{-h-20} 0,{-h-36} Z"), T)
    out += line(f"M0,{-h} L0,{-h-6}", 3)
    out += shape(ell(0, 0, 30, 9), T)
    return g(out, x, y, s)


def book(x, y, s=1, rot=0):
    out = shape(path("M0,-6 C-30,-20 -60,-18 -80,-8 L-80,52 C-60,42 -30,40 0,54 Z"))
    out += shape(path("M0,-6 C30,-20 60,-18 80,-8 L80,52 C60,42 30,40 0,54 Z"))
    out += line("M-66,8 C-48,2 -28,2 -14,8 M-66,24 C-48,18 -28,18 -14,24 M14,8 C28,2 48,2 66,8 M14,24 C28,18 48,18 66,24", 2.6)
    return g(out, x, y, s, rot)


def snowfall(points, r=10):
    return "".join(snowflake(px, py, r) for px, py in points)


def dots_snow(points, r=4):
    return "".join(shape(circ(px, py, r), 2.4) for px, py in points)


def candy_cane(x, y, s=1, rot=0):
    d = "M0,80 L0,-10 C0,-50 50,-50 50,-14"
    out = line(d, 22) + f'<path d="{d}" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round"/>'
    for yy in range(70, -10, -22):
        out += line(f"M-7,{yy} L7,{yy-12}", 2.6)
    out += line("M8,-36 L16,-24 M30,-44 L32,-30 M44,-30 L52,-24", 2.6)
    return g(out, x, y, s, rot)


def robin(x, y, s=1, flip=False):
    out = shape(path("M-40,10 C-40,-24 -6,-36 18,-24 C34,-16 40,0 36,14 C30,34 -10,40 -40,10 Z"))
    out += shape(path("M-36,4 L-70,-6 L-62,16 Z"), T)                   # tail
    out += line("M0,-14 C14,-10 22,6 14,22 C4,30 -6,22 -6,10", 3)      # red breast edge
    out += shape(path("M34,-6 L50,-2 L34,4 Z"), 3)                    # beak
    out += dot(22, -10, 3.4)
    out += line("M-14,10 C-6,0 4,2 8,12", 3)                          # wing
    out += line("M-6,34 L-8,48 M8,34 L8,48", 3)
    return g(out, x, y, s, 0, flip)


def holly(x, y, s=1, rot=0):
    leaf = "M0,0 C10,-8 18,-4 26,-12 C26,-4 34,0 40,-4 C38,4 44,10 50,10 C40,16 26,14 0,0 Z"
    out = shape(path(leaf), T) + g(shape(path(leaf), T), 0, 0, 1, 0, True)
    out += line("M8,-2 L40,4", 2.4) + line("M-8,-2 L-40,4", 2.4)
    out += shape(circ(-6, -6, 7), T) + shape(circ(6, -8, 7), T) + shape(circ(0, 4, 7), T)
    return g(out, x, y, s, rot)


def bauble(x, y, r=30, pattern=0):
    out = shape(rect(-r*0.3, -r - 12, r*0.6, 14, 3), T)
    out += line(f"M0,{-r-12} C-8,{-r-26} 8,{-r-26} 0,{-r-12}", 3)
    out += shape(circ(0, 0, r))
    if pattern == 0:
        out += line(f"M{-r},0 Q0,{r*0.35} {r},0 M{-r*0.86},{-r*0.5} Q0,{-r*0.2} {r*0.86},{-r*0.5}", 3)
    elif pattern == 1:
        out += rounded_star(0, 0, r * 0.45)
    else:
        out += heart(0, 2, r * 0.32)
    return g(out, x, y)


def window(x, y, w, h, snow=True):
    out = shape(rect(-w/2, -h/2, w, h, 10))
    out += shape(rect(-w/2 + 14, -h/2 + 14, w - 28, h - 28, 6), T)
    out += line(f"M0,{-h/2+14} L0,{h/2-14} M{-w/2+14},0 L{w/2-14},0", W)
    out += shape(rect(-w/2 - 14, h/2 - 4, w + 28, 18, 6))
    if snow:
        pts = [(-w/4, -h/4), (w/4 + 6, -h/4 - 10), (-w/4 - 10, h/4 - 6), (w/4, h/4 + 6), (-w/6, -h/2 + 34), (w/6, h/2 - 34)]
        out += "".join(snowflake(px, py, 9, 2.6) for px, py in pts)
    return g(out, x, y)


def fireplace(x, y):
    out = shape(rect(-170, -150, 340, 26, 8))
    out += shape(rect(-150, -124, 300, 210, 6))
    out += shape(path("M-90,86 L-90,-40 Q0,-110 90,-40 L90,86 Z"))
    for yy in range(-100, 86, 34):
        out += line(f"M-150,{yy} L-104,{yy} M104,{yy} L150,{yy}", 2.6)
    out += shape(rect(-60, 58, 120, 22, 10), T)
    out += shape(path("M-40,60 C-50,20 -20,10 -24,-20 C0,0 4,-30 0,-50 C30,-20 40,10 20,30 C40,20 44,40 40,60 Z"), T)
    out += shape(path("M-10,60 C-16,40 -2,30 0,14 C10,30 20,40 10,60 Z"), 3)
    return g(out, x, y)


def stocking(x, y, s=1, rot=0):
    out = shape(path("M-30,-60 L30,-60 L30,30 C30,60 0,70 -40,64 C-70,60 -70,30 -40,24 L-30,20 Z"))
    out += shape(rect(-38, -84, 76, 30, 10))
    out += line("M-40,64 C-50,50 -46,34 -36,30", 3)
    return g(out, x, y, s, rot)


def gingerbread(x, y, s=1, rot=0):
    body = [circ(0, -46, 26), ell(0, 6, 30, 38), ell(-36, -4, 18, 10, -20), ell(36, -4, 18, 10, 20),
            ell(-16, 44, 11, 20, -10), ell(16, 44, 11, 20, 10)]
    out = blob(body)
    out += dot(-9, -50, 3.6) + dot(9, -50, 3.6) + line("M-10,-38 Q0,-30 10,-38", 3)
    out += shape(circ(0, -6, 4), 2.6) + shape(circ(0, 10, 4), 2.6) + shape(circ(0, 26, 4), 2.6)
    out += line("M-46,-10 Q-40,-4 -46,2 M46,-10 Q40,-4 46,2", 2.6)
    return g(out, x, y, s, rot)


def snowman(x, y, s=1):
    out = shape(circ(0, 60, 70)) + shape(circ(0, -40, 50))
    out += dot(-16, -50, 5) + dot(16, -50, 5)
    out += shape(path("M0,-38 L40,-30 L0,-28 Z"), T)
    out += dot(-14, -16, 3.4) + dot(0, -12, 3.4) + dot(14, -16, 3.4)
    out += dot(0, 30, 5) + dot(0, 60, 5) + dot(0, 90, 5)
    out += line("M-62,30 L-118,0 M-98,10 L-108,-10 M62,30 L118,0 M98,10 L110,-6", 4)
    out += shape(path("M-50,-4 Q0,20 50,-4 L52,14 Q0,38 -52,14 Z"))
    out += shape(path("M24,10 L44,10 L48,62 L28,64 Z"))
    return g(out, x, y, s)


def wreath(x, y, r=110):
    out = ""
    leaves = 22
    for i in range(leaves):
        a = 2 * math.pi * i / leaves
        out += g(shape(ell(0, 0, 26, 13), T), x + r * math.cos(a), y + r * math.sin(a), 1, math.degrees(a) + 60)
    for i in range(0, leaves, 3):
        a = 2 * math.pi * (i + 0.5) / leaves
        out += shape(circ(x + (r - 4) * math.cos(a), y + (r - 4) * math.sin(a), 8), T)
    out += g(shape(path("M0,0 C-40,-34 -56,10 0,0 Z"), W) + shape(path("M0,0 C40,-34 56,10 0,0 Z"), W)
             + shape(path("M-6,2 L-30,50 L-14,46 Z"), T) + shape(path("M6,2 L30,50 L14,46 Z"), T) + shape(circ(0, 0, 10)),
             x, y + r)
    return out


def teacup(x, y, s=1):
    out = shape(ell(0, 60, 120, 18))
    out += shape(path("M-100,-20 L100,-20 C96,40 60,62 0,62 C-60,62 -96,40 -100,-20 Z"))
    out += shape(path("M96,0 C140,-6 140,46 76,40"), W, "none")
    out += line("M-60,20 Q-50,10 -40,20 Q-30,30 -20,20 M20,20 Q30,10 40,20 Q50,30 60,20", 3)
    return g(out, x, y, s)


def lilypad(x, y, rx=140, ry=34):
    out = shape(path(f"M0,0 L{rx*0.25},{-ry} A{rx},{ry} 0 1,1 {-rx*0.25},{-ry} Z"))
    out += line(f"M0,0 L{-rx*0.6},{ry*0.4} M0,0 L{rx*0.5},{ry*0.5} M0,0 L0,{ry*0.9}", 2.6)
    return g(out, x, y)


def moon(x, y, r=40):
    return shape(path(f"M{f(x)},{f(y-r)} A{r},{r} 0 1,0 {f(x)},{f(y+r)} A{r*0.75},{r} 0 1,1 {f(x)},{f(y-r)} Z"))


def mitten(x, y, s=1, rot=0):
    out = shape(path("M-34,40 L-38,-20 C-40,-60 30,-66 34,-20 L36,40 Z"))
    out += shape(path("M-36,0 C-70,-6 -70,-36 -40,-30"), W)
    out += shape(rect(-44, 34, 88, 30, 10))
    out += line("M-20,-30 L-10,-20 L0,-30 L10,-20 L20,-30", 3)
    return g(out, x, y, s, rot)


def snowglobe(x, y):
    out = shape(path("M-110,110 L110,110 L90,170 L-90,170 Z"))
    out += shape(circ(0, 0, 130))
    out += shape(path("M-120,60 Q0,90 120,60 L110,90 Q0,120 -110,90 Z"), T)
    out += line("M-80,-60 Q-60,-90 -30,-100", 4)
    return g(out, x, y)


def cracker(x, y, rot=0):
    out = shape(rect(-60, -22, 120, 44, 8))
    out += shape(path("M-60,-22 L-96,-40 L-104,0 L-96,40 L-60,22 Z"))
    out += shape(path("M60,-22 L96,-40 L104,0 L96,40 L60,22 Z"))
    out += line("M-30,-22 L-30,22 M30,-22 L30,22", 3) + rounded_star(0, 0, 13)
    return g(out, x, y, 1, rot)


def mince_pie(x, y, s=1):
    out = shape(path("M-46,0 L46,0 L38,26 L-38,26 Z"))
    out += line("M-30,0 L-26,26 M-14,0 L-12,26 M0,0 L0,26 M14,0 L12,26 M30,0 L26,26", 2.4)
    out += shape(path("M-48,0 C-40,-22 40,-22 48,0 Z"))
    out += rounded_star(0, -8, 11)
    return g(out, x, y, s)


def headphones(y=-10):
    out = line("M-96,-30 C-96,-150 96,-150 96,-30", 12) + '<path d="M-96,-30 C-96,-150 96,-150 96,-30" fill="none" stroke="#fff" stroke-width="5"/>'
    out += shape(rect(-120, -40, 36, 64, 16)) + shape(rect(84, -40, 36, 64, 16))
    return g(out, 0, y)


def sledge(x, y):
    out = shape(rect(-120, -20, 240, 30, 8))
    out += line("M-100,10 L-100,34 M100,10 L100,34 M0,10 L0,34", W)
    out += line("M-140,34 L120,34 C150,34 160,20 150,4", W + 2)
    out += line("M-80,-20 L-80,10 M-40,-20 L-40,10 M0,-20 L0,10 M40,-20 L40,10 M80,-20 L80,10", 2.6)
    return g(out, x, y)


def skate_blade(x, y, flip=False):
    out = line("M-30,0 L30,0 C42,0 44,-10 38,-14", 4) + line("M-18,0 L-18,-12 M18,0 L18,-12", 3)
    return g(out, x, y, 1, 0, flip)


def lantern(x, y, s=1):
    out = shape(path("M-30,-40 L30,-40 L36,40 L-36,40 Z"))
    out += shape(path("M-36,-40 L0,-70 L36,-40 Z")) + shape(circ(0, -78, 9), T)
    out += shape(rect(-42, 40, 84, 14, 4))
    out += shape(path("M0,-14 C-10,0 -8,20 0,20 C8,20 10,0 0,-14 Z"), T)
    return g(out, x, y, s)


def knitting(x, y):
    out = shape(circ(90, 40, 36))
    out += line("M60,26 Q90,10 120,30 M58,46 Q90,30 124,52 M70,66 Q94,52 116,70", 2.6)
    out += shape(path("M-60,-10 L40,-10 L44,40 L-56,44 Z"))
    out += line("M-50,4 L34,4 M-48,18 L36,18 M-46,32 L38,32", 2.6)
    out += line("M-70,-60 L-20,0 M60,-60 L10,0", W)
    out += line("M44,30 Q60,60 70,52", 2.6)
    return g(out, x, y)


def cards_pen(x, y):
    out = shape(rect(-90, -60, 140, 100, 6, -6))
    out += line("M-70,-30 L20,-38 M-68,-12 L10,-20 M-66,6 L24,-2", 2.6) + heart(-6, 22, 9)
    out += shape(rect(40, -20, 110, 14, 6, -30))
    return g(out, x, y)


# ---------------- the 30 scenes ----------------

PW, PH = 612, 792
M = 43.2  # 0.6 in frame inset


def page(art, title, line_):
    frame = (f'<rect x="{M}" y="{M}" width="{PW-2*M}" height="{PH-2*M}" rx="22" fill="none" '
             f'stroke="{INK}" stroke-width="4"/>')
    txt = (f'<text x="306" y="{PH-M-66}" text-anchor="middle" font-family="Fraunces" font-weight="700" '
           f'font-size="27" fill="{INK}">{title}</text>'
           f'<text x="306" y="{PH-M-36}" text-anchor="middle" font-family="Poppins" font-weight="500" '
           f'font-size="14" fill="#333">{line_}</text>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{PW}pt" height="{PH}pt" viewBox="0 0 {PW} {PH}">'
            f'<rect width="{PW}" height="{PH}" fill="#fff"/>{frame}{art}{txt}</svg>')


def ground(y=600, x1=70, x2=542):
    return line(f"M{x1},{y} Q306,{y-14} {x2},{y}", W)


S = []  # (title, line, art)


def add(title, line_):
    def deco(fn):
        S.append((title, line_, fn))
        return fn
    return deco


@add("Socially Hibernating", "See you in January.")
def p1():
    blanket = shape(path("M-108,30 C-130,110 -120,170 -96,184 L96,184 C120,170 130,110 108,30 C60,60 -60,60 -108,30 Z"))
    stripes = line("M-118,90 Q0,120 118,90 M-122,130 Q0,160 122,130", 3)
    lights = garland(-110, 60, 110, 150, 30, 9) + garland(-100, 170, 100, 70, 40, 8)
    art = frog(0, 0, 1, eyes="sleep", body=False, between="", top=santa_hat(0, -112, -8, 0.82))
    zz = (f'<text x="150" y="-60" font-family="Poppins" font-weight="700" font-size="30" fill="none" stroke="{INK}" stroke-width="2">z</text>'
          f'<text x="176" y="-100" font-family="Poppins" font-weight="700" font-size="40" fill="none" stroke="{INK}" stroke-width="2">z</text>')
    body = blanket + stripes + lights + hand(-24, 40, 0) + hand(24, 40, 0)
    return g(body + art + zz, 306, 330, 1.25) + ground(615)


@add("Hot Chocolate Hour", "Warm hands, slow sips, no plans.")
def p2():
    m = mug(0, 104, 1.2, steam=False, marsh=True)
    art = frog(0, 0, 1, belly=False, between=m, hands=[(-40, 112, -10), (40, 112, 10)], top=beanie())
    return g(art, 306, 320, 1.3) + snowfall([(110, 140), (500, 120), (95, 420), (520, 400), (480, 250)], 14)


@add("A Tree of My Own", "Decorated at my own pace.")
def p3():
    t = tree(392, 400, 1.0)
    fr = frog(0, 0, 1, hands=[(-58, 96, -20), (88, 40, 40)], between=bauble(118, 4, 20, 1))
    return t + g(fr, 190, 390, 0.95) + ground(620)


@add("Fireside Frog", "Blanket on. World off.")
def p4():
    fp = fireplace(306, 236)
    shawl = (shape(path("M-100,30 C-140,80 -130,150 -96,176 L96,176 C130,150 140,80 100,30 C60,56 -60,56 -100,30 Z"))
             + line("M-112,96 Q0,124 112,96 M-118,140 Q0,168 118,140", 3) + shape(path("M-20,52 L0,96 L20,52 Z"), T))
    fr = frog(0, 0, 1, body=False, between=shawl, hands=[(-26, 70, 0), (26, 70, 0)])
    rug = shape(ell(306, 600, 210, 26), W)
    return fp + rug + g(fr + foot(-52, 176) + foot(52, 176, True), 306, 440, 0.85)


@add("One More Chapter", "Cosy reading counts as plans.")
def p5():
    b = book(0, 90, 1.1)
    fr = frog(0, 0, 1, between=b, hands=[(-86, 116, -30), (86, 116, 30)], eyes="happy")
    c = candle(480, 600, 90)
    return g(fr, 270, 330, 1.2) + c + snowfall([(470, 130), (120, 120)], 13)


@add("Snow Friends", "A quiet friend who never asks questions.")
def p6():
    sm = snowman(400, 420, 1.15)
    fr = frog(0, 0, 1, top=santa_hat(), hands=[(-58, 96, -20), (100, 30, 50)])
    return sm + g(fr, 180, 410, 0.9) + ground(625) + dots_snow([(100, 120), (180, 90), (300, 110), (520, 100), (540, 200), (80, 250)], 5)


@add("Knit One, Breathe One", "Repetitive and calm. That's the point.")
def p7():
    k = knitting(0, 104)
    fr = frog(0, 0, 1, between=k, hands=[(-70, 70, -40), (60, 70, 40)], top=beanie())
    return g(fr, 290, 330, 1.25)


@add("Gingerbread Buddy", "Biscuits made with zero pressure.")
def p8():
    gb = gingerbread(0, 104, 1.1)
    fr = frog(0, 0, 1, between=gb, hands=[(-40, 100, -30), (40, 100, 30)])
    tray = shape(rect(400, 600, 130, 14, 6)) + gingerbread(440, 574, 0.42) + gingerbread(492, 574, 0.42)
    return g(fr, 270, 300, 1.15) + tray


@add("Stocking Nap", "Found the cosiest spot in the house.")
def p9():
    st = shape(path("M-110,-40 L110,-40 L110,150 C110,220 40,240 -40,234 C-140,226 -150,150 -90,140 L-110,130 Z"))
    cuff = shape(rect(-128, -86, 256, 56, 20))
    fr = frog(0, 0, 0.8, eyes="sleep", body=False)
    peek = g(fr, 0, -96, 1) + cuff + hand(-60, -78, 0) + hand(60, -78, 0)
    hook = line("M0,-200 L0,-150", 4) + shape(circ(0, -150, 10), T)
    return g(st + peek, 306, 380, 1.05) + snowfall([(110, 130), (500, 140)], 14)


@add("Jumper Weather", "Soft, warm and a bit too big.")
def p10():
    jumper = (shape(path("M-90,36 C-120,60 -128,130 -100,176 L100,176 C128,130 120,60 90,36 Z"))
              + line("M-104,80 Q0,100 104,80 M-110,150 Q0,170 110,150", 3)
              + rounded_star(-40, 118, 16) + rounded_star(40, 118, 16) + heart(0, 124, 12)
              + shape(path("M-40,34 Q0,52 40,34 L40,48 Q0,66 -40,48 Z"), T))
    fr = frog(0, 0, 1, body=False, between=jumper, hands=[(-110, 150, -20), (110, 150, 20)])
    return g(fr, 306, 300, 1.3) + snowfall([(100, 120), (510, 130), (90, 560), (520, 560)], 14)


@add("A Little Something", "Wrapped with love (and a lot of tape).")
def p11():
    pr = present(0, 116, 110, 80)
    fr = frog(0, 0, 1, between=pr, hands=[(-60, 120, -10), (60, 120, 10)])
    return g(fr, 306, 300, 1.25) + present(110, 600, 70, 54, -8) + present(500, 606, 60, 46, 10)


@add("Pond on Ice", "Gliding along, at my own speed.")
def p12():
    fr = frog(0, 0, 1, top=beanie(), feet=False, hands=[(-110, 60, -50), (110, 60, 50)], between=scarf(46))
    ice = shape(ell(306, 610, 240, 40), W) + line("M140,610 L200,600 M380,620 L440,612", 3)
    return ice + g(fr + skate_blade(-52, 200) + skate_blade(52, 200, True) + line("M-52,172 L-52,200 M52,172 L52,200", 4), 306, 330, 1.1) + snowfall([(110, 140), (500, 130)], 12)


@add("Snowflake Catcher", "Tiny moments of joy count.")
def p13():
    fr = frog(0, 0, 1, eyes="happy", mouth="o", hands=[(-70, 70, -30), (70, 70, 30)])
    return g(fr, 306, 360, 1.2) + snowflake(306, 222, 12) + snowfall([(306, 160), (200, 120), (420, 110), (130, 240), (480, 230), (110, 420), (500, 420)], 16) + ground(630)


@add("Oh Deer", "Festive, but make it comfy.")
def p14():
    fr = frog(0, 0, 1, top=antlers() + shape(circ(0, 0, 0), 0), between=scarf(46))
    nose = shape(circ(0, -10, 12), T)
    return g(fr + nose, 306, 360, 1.2)


@add("Wheee!", "Every slope is a gentle one.")
def p15():
    sl = sledge(0, 172)
    fr = frog(0, 0, 1, body=True, feet=False, top=santa_hat(), hands=[(-100, 30, -60), (100, 30, 60)], between=scarf(46))
    hill = line("M60,560 C220,610 400,630 552,640", W)
    return hill + g(fr + sl, 300, 432, 0.85, 10) + snowfall([(120, 140), (480, 140), (320, 120)], 13)


@add("Silent Night on the Pond", "Still water, soft light.")
def p16():
    lp = lilypad(0, 120, 170, 40)
    fr = frog(0, 0, 0.9, eyes="sleep", between="", hands=[(-50, 96, -20), (50, 96, 20)])
    l = lantern(150, 70, 0.9)
    water = line("M70,600 Q140,590 210,600 M260,620 Q330,610 400,620 M440,596 Q500,588 540,596", 3)
    sky = moon(480, 140, 46) + rounded_star(130, 120, 16) + rounded_star(220, 90, 11) + rounded_star(380, 100, 12)
    return sky + water + g(lp + g(fr, 0, -40) + l, 306, 440, 1.0)


@add("Dear Santa", "My list: rest, snacks, quiet.")
def p17():
    cp = cards_pen(0, 0)
    fr = frog(0, 0, 1, hands=[(-58, 96, -20), (40, 110, 20)])
    desk = shape(rect(-200, 160, 400, 30, 8)) + line("M-170,190 L-170,280 M170,190 L170,280", W)
    return g(fr, 306, 260, 1.0) + g(desk + g(cp, 20, 120, 0.9), 306, 330, 1.0)


@add("Tea for One", "A cup-sized break.")
def p18():
    fr = frog(0, 0, 0.75, body=False, eyes="happy")
    cup = teacup(0, 60, 1.2)
    steam = line("M-60,-100 C-70,-120 -50,-130 -60,-150 M60,-100 C50,-120 70,-130 60,-150", 3.2)
    inner = g(fr, 0, -20) + shape(path("M-120,4 L120,4 C118,40 90,70 0,72 C-90,70 -118,40 -120,4 Z"))
    return g(inner + g(teacup(0, 0, 1.2), 0, 30), 306, 400, 1.15) + snowfall([(120, 130), (500, 140)], 13)


@add("Knock Knock", "Visitors welcome. Briefly.")
def p19():
    door = shape(rect(160, 90, 292, 540, 14)) + shape(rect(190, 120, 232, 210, 8), T) + shape(rect(190, 360, 232, 240, 8), T) + shape(circ(420, 400, 10))
    wr = wreath(306, 220, 72)
    fr = frog(0, 0, 0.75, eyes="wink", body=False)
    return door + wr + g(fr + hand(-86, 10, -60), 150, 520, 0.9) + ground(632, 50, 562)


@add("Mince Pie Moment", "One for now, one for later.")
def p20():
    plate = shape(ell(0, 132, 130, 22)) + mince_pie(-50, 112, 0.9) + mince_pie(50, 112, 0.9) + mince_pie(0, 96, 0.9)
    fr = frog(0, 0, 1, between=plate, hands=[(-110, 130, -40), (110, 130, 40)])
    return g(fr, 306, 300, 1.2) + holly(120, 140, 1) + holly(490, 140, 1, 20)


@add("Quiet Mode", "Headphones on. Snow outside.")
def p21():
    w = window(420, 270, 220, 260)
    fr = frog(0, 0, 1, top=headphones(-10), between=scarf(46, False))
    return w + g(fr, 220, 380, 1.0) + ground(630)


@add("Shared Scarf", "Some people feel like a warm scarf.")
def p22():
    long_scarf = shape(path("M-200,40 Q0,70 200,40 L204,66 Q0,96 -204,66 Z")) + line("M-150,50 L-148,74 M-100,56 L-98,80 M-50,60 L-50,84 M50,60 L50,84 M100,56 L98,80 M150,50 L148,74", 3)
    f1 = g(frog(0, 0, 1, hands=[(-58, 96, -20)]), -105, 0, 0.82)
    f2 = g(frog(0, 0, 1, hands=[(58, 96, 20)], eyes="happy"), 105, 0, 0.82)
    return g(f1 + f2 + long_scarf + heart(0, -60, 16), 306, 330, 1.12) + ground(620) + snowfall([(110, 130), (500, 130)], 12)


@add("Bauble Business", "Hang them anywhere. Rules optional.")
def p23():
    br = line("M70,120 C200,140 400,100 542,130", W + 2)
    hangs = line("M180,130 L180,190 M320,118 L320,170 M450,118 L450,200", 2.6)
    bs = bauble(180, 226, 34, 0) + bauble(320, 204, 30, 2) + bauble(450, 238, 34, 1)
    fr = frog(0, 0, 1, hands=[(-58, 96, -20), (80, -10, 30)])
    return br + hangs + bs + g(fr, 306, 440, 0.9) + ground(640)


@add("Top of the Tree", "Shining, quietly.")
def p24():
    t = tree(0, 0, 1.0, star_top=False)
    fr = frog(0, 0, 0.42, top=santa_hat(), hands=[(-80, 30, -60), (80, 30, 60)])
    return g(t + g(fr, 0, -258), 306, 420, 1.1)


@add("Mitten Snuggle", "Small and safe and snug.")
def p25():
    mt = shape(path("M-110,170 L-120,-30 C-126,-150 110,-170 116,-30 L120,170 Z"))
    th = shape(path("M-118,40 C-200,30 -200,-60 -124,-40"), W)
    cuff = shape(rect(-140, 150, 280, 70, 24)) + line("M-110,160 L-110,210 M-70,160 L-70,210 M-30,160 L-30,210 M10,160 L10,210 M50,160 L50,210 M90,160 L90,210", 3)
    fr = frog(0, 0, 0.6, eyes="sleep", body=False)
    peek = th + mt + g(fr, 0, -20) + shape(path("M-110,30 Q0,0 110,30 L120,170 L-110,170 Z")) + cuff
    return g(peek, 306, 340, 1.05) + snowfall([(110, 140), (500, 150), (100, 560), (510, 560)], 13)


@add("Pull!", "Bad jokes included.")
def p26():
    cr = cracker(0, 0)
    f1 = frog(0, 0, 1, hands=[(-58, 96, -20)])
    f2 = frog(0, 0, 1, hands=[(58, 96, 20)], eyes="wink")
    return g(f1, 160, 460, 0.82) + g(f2, 452, 460, 0.82) + g(cr, 306, 500, 1.0) + hand(222, 500, 80) + hand(390, 500, -80) + ground(626)


@add("Robin Visit", "A small friend, a small hello.")
def p27():
    branch = line("M60,250 C200,240 360,270 552,230", W + 2) + holly(470, 238, 0.9)
    fr = frog(0, 0, 1, hands=[(-58, 96, -20), (70, 40, 30)], between=scarf(46, True))
    return branch + robin(260, 214, 1.2) + g(fr, 306, 420, 0.95) + ground(640)


@add("Candy Cane Lane", "Sweet things in small doses.")
def p28():
    fr = frog(0, 0, 1, between=candy_cane(70, 80, 0.9, 10), hands=[(-58, 96, -20), (66, 104, 20)], top=santa_hat())
    return candy_cane(110, 430, 1.2, -10) + candy_cane(500, 430, 1.2, 10) + g(fr, 306, 330, 1.15) + ground(630)


@add("Snow Globe World", "My own little calm place.")
def p29():
    sg = snowglobe(0, 0)
    fr = frog(0, 0, 0.5, eyes="happy")
    inner = g(fr, 0, 0) + tree(80, 30, 0.35, baubles=False) + dots_snow([(-80, -60), (-40, -90), (40, -80), (90, -40), (-90, 10), (0, -110)], 4)
    return g(sg + inner, 306, 340, 1.3)


@add("Merry Everything", "However you do Christmas, it counts.")
def p30():
    fr = frog(0, 0, 1, top=santa_hat(), hands=[(-90, 40, -50), (90, 40, 50)], between=scarf(46))
    stars = rounded_star(120, 140, 18) + rounded_star(500, 150, 20) + rounded_star(140, 470, 14) + rounded_star(480, 460, 16)
    return stars + g(fr, 306, 330, 1.25) + holly(306, 610, 1.1) + snowfall([(200, 110), (110, 300), (500, 300)], 12)


# ---------------- KDP paperback interior ----------------



def svgdoc(body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{PW}pt" height="{PH}pt" viewBox="0 0 {PW} {PH}">'
            f'<rect width="{PW}" height="{PH}" fill="#fff"/>{body}</svg>')


def T_(x, y, s, txt, fam="Poppins", wt=500, anchor="middle", col="#222"):
    return (f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="{fam}" font-weight="{wt}" '
            f'font-size="{s}" fill="{col}">{txt}</text>')


def kdp_pages():
    pages = []

    pages.append(svgdoc(
        T_(306, 150, 15, "FROG LOGIC", wt=700, col="#111")
        + T_(306, 220, 46, "Cosy Christmas", "Fraunces", 800, col="#111")
        + T_(306, 266, 28, "Colouring Book", "Fraunces", 700, col="#111")
        + T_(306, 304, 15, "30 bold and easy frog designs for calm, cosy colouring")
        + g(frog(0, 0, 1, eyes="happy", top=santa_hat(0, -112, -8, 0.82), between=scarf(46)), 306, 440, 0.7)
        + T_(306, 680, 15, "by Samantha Hall", wt=500)))

    # 2 copyright / info
    info = [
        "Frog Logic Cosy Christmas Colouring Book",
        "Text and illustrations © 2026 Samantha Hall. All rights reserved.",
        "You're welcome to copy pages for your own personal colouring.",
        "",
        "Frog Logic makes gentle, practical things for busy brains:",
        "printable planners, feelings cards and cosy frog gifts.",
        "Find more at froglogic.co.uk",
    ]
    pages.append(svgdoc("".join(T_(306, 560 + i * 22, 12, t, col="#333") for i, t in enumerate(info))))

    # 3 belongs to
    pages.append(svgdoc(
        f'<rect x="{M}" y="{M}" width="{PW-2*M}" height="{PH-2*M}" rx="22" fill="none" stroke="{INK}" stroke-width="4"/>'
        + T_(306, 250, 34, "This book belongs to", "Fraunces", 700, col="#111")
        + line("M150,330 L462,330", 3)
        + g(frog(0, 0, 1, eyes="happy", hands=[(-58, 96, -20), (58, 96, 20)], between=present(0, 118, 100, 70)), 306, 470, 0.75)
        + T_(306, 700, 13, "No rules. Any colours. Any order. Breaks allowed.", col="#333")))

    # 4 colour test page
    swatches = "".join(shape(rect(96 + (i % 5) * 88, 190 + (i // 5) * 88, 68, 68, 12), 3) for i in range(20))
    pages.append(svgdoc(
        T_(306, 120, 28, "Colour Test Page", "Fraunces", 700, col="#111")
        + T_(306, 150, 13, "Try your pens and pencils here first. Tip: slip a spare sheet behind each page.", col="#333")
        + swatches + g(mug(0, 0, 1.3, steam=True, marsh=True), 306, 640)))

    BLANK = svgdoc(T_(306, PH - 60, 10, "This page is left blank so colours don't show through.", col="#999"))

    for i, (t, l, fn) in enumerate(S, 1):
        pages.append(page(fn(), t, l))
        pages.append(BLANK)

    # closing page
    pages.append(svgdoc(
        f'<rect x="{M}" y="{M}" width="{PW-2*M}" height="{PH-2*M}" rx="22" fill="none" stroke="{INK}" stroke-width="4"/>'
        + T_(306, 170, 32, "Thank you for colouring!", "Fraunces", 700, col="#111")
        + T_(306, 220, 14, "I hope these frogs brought you a little calm this Christmas.", col="#333")
        + T_(306, 244, 14, "If you enjoyed the book, a quick review on Amazon helps more", col="#333")
        + T_(306, 266, 14, "than you might think.", col="#333")
        + g(frog(0, 0, 1, eyes="sleep", body=False, top=santa_hat(0, -112, -8, 0.82)), 306, 420, 0.8)
        + T_(306, 560, 15, "More gentle things from Frog Logic", "Poppins", 700, col="#111")
        + T_(306, 586, 14, "printable planners, feelings cards and cosy frog gifts", col="#333")
        + T_(306, 612, 14, "froglogic.co.uk", "Poppins", 700, col="#111")
        + T_(306, 690, 13, "With love, Sam", col="#333")))
    pages.append(BLANK)
    return pages


def kdp(OUT):
    os.makedirs(OUT, exist_ok=True); WORK = os.path.join(OUT, ".work"); os.makedirs(WORK, exist_ok=True)
    pages = kdp_pages()
    w = PdfWriter()
    for n, svg in enumerate(pages, 1):
        sp, pp = f"{WORK}/k{n:03d}.svg", f"{WORK}/k{n:03d}.pdf"
        open(sp, "w").write(svg)
        subprocess.run(["rsvg-convert", "-f", "pdf", "-o", pp, sp], check=True)
        w.append(PdfReader(pp))
    w.add_metadata({"/Title": "Frog Logic Cosy Christmas Colouring Book", "/Author": "Samantha Hall"})
    w.write(f"{OUT}/Frog-Logic-Cosy-Christmas-Interior-8.5x11.pdf")
    print("kdp interior:", len(pages), "pages")


# ---------------- printable download + pictures ----------------
"""Printable (digital download) version of the Frog Logic Cosy Christmas Colouring Book.
A4 and US Letter PDFs: title page, before-you-start, 30 designs, thank-you. Single-sided.
Also renders the shop/social pictures. Usage: python3 printable.py <out_dir>"""
import os, re, subprocess, sys


def printable(OUT):
    os.makedirs(OUT, exist_ok=True)
    WORK = os.path.join(OUT, ".work"); os.makedirs(WORK, exist_ok=True)
    PRINT_LINE = "Print single-sided on plain paper, as often as you like, for yourself and your household. Please don't resell or share the file itself. © Frog Logic"

    pages = []
    pages.append(svgdoc(
        T_(306, 150, 15, "FROG LOGIC", wt=700, col="#111")
        + T_(306, 220, 46, "Cosy Christmas", "Fraunces", 800, col="#111")
        + T_(306, 266, 28, "Colouring Book", "Fraunces", 700, col="#111")
        + T_(306, 304, 15, "30 bold and easy frog designs for calm, cosy colouring")
        + g(frog(0, 0, 1, eyes="happy", top=santa_hat(0, -112, -8, 0.82), between=scarf(46)), 306, 440, 0.7)
        + T_(306, 660, 15, "soft landings for busy brains")
        + T_(306, 690, 13, "froglogic.co.uk", wt=700, col="#111")))

    rules = ["There are no rules in this book.", "Any colours you like. Purple frogs are very welcome.",
             "Start anywhere. Skip pages. Colour half a frog.", "Outside the lines still counts.",
             "Stop the moment it stops feeling nice.", "Every page is single-sided, so felt tips won't spoil the next frog."]
    pages.append(svgdoc(
        f'<rect x="{M}" y="{M}" width="{PW-2*M}" height="{PH-2*M}" rx="22" fill="none" stroke="{INK}" stroke-width="4"/>'
        + T_(306, 150, 32, "Before you start", "Fraunces", 700, col="#111")
        + "".join(T_(306, 220 + i * 34, 14, r, col="#222") for i, r in enumerate(rules))
        + g(mug(0, 0, 1.3, steam=True, marsh=True), 306, 520)
        + T_(306, 640, 13, "made in my lounge, with love - Sam", col="#333")
        + "".join(T_(306, 690 + i * 16, 9.5, t, col="#666") for i, t in enumerate([PRINT_LINE[:86], PRINT_LINE[86:]]))))
    for t, l, fn in S:
        pages.append(page(fn(), t, l))
    pages.append(svgdoc(
        f'<rect x="{M}" y="{M}" width="{PW-2*M}" height="{PH-2*M}" rx="22" fill="none" stroke="{INK}" stroke-width="4"/>'
        + T_(306, 170, 32, "Thank you for colouring!", "Fraunces", 700, col="#111")
        + T_(306, 220, 14, "I hope these frogs brought you a little calm this Christmas.", col="#333")
        + g(frog(0, 0, 1, eyes="sleep", body=False, top=santa_hat(0, -112, -8, 0.82)), 306, 400, 0.8)
        + T_(306, 560, 15, "More gentle things from Frog Logic", "Poppins", 700, col="#111")
        + T_(306, 586, 14, "printable planners, feelings cards and cosy frog gifts", col="#333")
        + T_(306, 612, 14, "froglogic.co.uk", "Poppins", 700, col="#111")
        + T_(306, 690, 13, "With love, Sam", col="#333")))

    from pypdf import PdfWriter, PdfReader
    for label, w, h in [("", "210mm", "297mm"), ("-Letter", "8.5in", "11in")]:
        pw = PdfWriter()
        for n, svg in enumerate(pages, 1):
            body = re.sub(r'^<svg[^>]*>|</svg>$', '', svg)
            doc = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {PW} {PH}" '
                   f'preserveAspectRatio="xMidYMid meet"><rect width="{PW}" height="{PH}" fill="#fff"/>{body}</svg>')
            sp, pp = f"{WORK}/p{n:03d}{label}.svg", f"{WORK}/p{n:03d}{label}.pdf"
            open(sp, "w").write(doc)
            subprocess.run(["rsvg-convert", "-f", "pdf", "-o", pp, sp], check=True)
            pw.append(PdfReader(pp))
        pw.add_metadata({"/Title": "Frog Logic Cosy Christmas Colouring Book", "/Author": "Frog Logic"})
        pw.write(f"{OUT}/Frog-Logic-Cosy-Christmas-Colouring-Book{label}.pdf")
    print("printable: ", len(pages), "pages x 2 sizes")

    # ---- shop / social pictures (1200x1200 and a 1200x630 post) ----
    def thumb(n, x, y, s):
        t, l, fn = S[n - 1]
        inner = re.sub(r'^<svg[^>]*>|</svg>$', '', page(fn(), t, l))
        return (f'<rect x="{x+6}" y="{y+8}" width="{612*s}" height="{792*s}" rx="8" fill="#000" opacity="0.18"/>'
                f'<g transform="translate({x} {y}) scale({s})">{inner}</g>')

    def picture(name, W_, H_, body):
        svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{W_}" height="{H_}" viewBox="0 0 {W_} {H_}">{body}</svg>'
        sp = f"{WORK}/{name}.svg"; open(sp, "w").write(svg)
        subprocess.run(["rsvg-convert", "-w", str(W_), "-o", f"{WORK}/{name}.png", sp], check=True)
        from PIL import Image
        Image.open(f"{WORK}/{name}.png").convert("RGB").save(f"{OUT}/{name}.jpg", quality=90)

    BG = "#2F4A3A"; CREAM = "#F6EFE2"; GOLD = "#E6B450"; RED = "#C8473E"
    def title_block(cx, y, s=1):
        return (f'<text x="{cx}" y="{y}" text-anchor="middle" font-family="Poppins" font-weight="700" font-size="{22*s}" fill="{GOLD}" letter-spacing="5">FROG LOGIC</text>'
                f'<text x="{cx}" y="{y+78*s}" text-anchor="middle" font-family="Fraunces" font-weight="800" font-size="{74*s}" fill="{CREAM}">Cosy Christmas</text>'
                f'<text x="{cx}" y="{y+132*s}" text-anchor="middle" font-family="Fraunces" font-weight="700" font-size="{46*s}" fill="{CREAM}">Colouring Book</text>')

    import random; random.seed(3)
    snow = "".join(f'<circle cx="{random.uniform(0,1200):.0f}" cy="{random.uniform(0,1200):.0f}" r="{random.choice([2,3,4])}" fill="{CREAM}" opacity="0.8"/>' for _ in range(90))
    # square: hero with three pages fanned
    body = f'<rect width="1200" height="1200" fill="{BG}"/>' + snow + title_block(600, 120)
    body += thumb(2, 120, 400, 0.78) + thumb(1, 600 - 612*0.9/2, 360, 0.9) + thumb(25, 1200 - 120 - 612*0.78, 400, 0.78)
    body += f'<rect x="330" y="1060" width="540" height="60" rx="30" fill="{RED}"/><text x="600" y="1100" text-anchor="middle" font-family="Poppins" font-weight="700" font-size="26" fill="#fff">30 printable pages · £5 · froglogic.co.uk</text>'
    picture("christmas-colouring-book-square", 1200, 1200, body)
    # wide post 1200x630
    snow2 = "".join(f'<circle cx="{random.uniform(0,1200):.0f}" cy="{random.uniform(0,630):.0f}" r="{random.choice([2,3,4])}" fill="{CREAM}" opacity="0.8"/>' for _ in range(50))
    body = f'<rect width="1200" height="630" fill="{BG}"/>' + snow2 + title_block(360, 170, 0.9)
    body += f'<text x="360" y="360" text-anchor="middle" font-family="Poppins" font-weight="500" font-size="22" fill="{CREAM}">30 bold and easy frog designs</text>'
    body += f'<text x="360" y="392" text-anchor="middle" font-family="Poppins" font-weight="500" font-size="22" fill="{CREAM}">calm, cosy colouring for busy brains</text>'
    body += f'<rect x="150" y="440" width="420" height="56" rx="28" fill="{RED}"/><text x="360" y="477" text-anchor="middle" font-family="Poppins" font-weight="700" font-size="24" fill="#fff">froglogic.co.uk</text>'
    body += thumb(1, 700, 60, 0.64) + thumb(9, 1000 - 80, 100, 0.56)
    picture("christmas-colouring-book-post", 1200, 630, body)
    print("pictures done")


if __name__ == "__main__":
    mode, out = sys.argv[1], sys.argv[2]
    {"printable": printable, "kdp": kdp}[mode](out)
