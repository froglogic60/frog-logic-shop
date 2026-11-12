# Moonfae card posts (Sam, 12 Nov 2026): three times a week (Mon, Wed, Fri)
# one tarot card's meaning goes to the Moonfae Readings Facebook page and
# @moonfaereadings on Instagram, ending with a "book a reading" line.
# Cards come from cards.json in order; posted.json remembers what went out,
# so a late or repeated run never posts twice in a day.
#
#   python3 moonfae_post.py generate   -> queue/<date>.jpg, prints due=yes/no
#   python3 moonfae_post.py post       -> publishes it (after the workflow has
#                                         committed the image) and records it
#
# Secrets: META_ACCESS_TOKEN (the same long-lived user token Frog Logic uses;
# it must include the Moonfae page). The Instagram account is looked up from
# the page each run.
#
# Wording rules (Sam, 11 Nov): the £40 reading is "Full Reading", never
# "Celtic Cross", and never say how many cards it uses. Images are our own
# design, never photos of the Morgan-Greer cards (they're copyrighted).
import json, os, sys, time, random, textwrap, urllib.request, urllib.parse
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

HERE = os.path.dirname(os.path.abspath(__file__))
QUEUE = os.path.join(HERE, "queue")
STATE = os.path.join(HERE, "posted.json")
PAGE_ID = "1465310013332806"
GRAPH = "https://graph.facebook.com/v20.0"
RAW = "https://raw.githubusercontent.com/froglogic60/frog-logic-shop"
POST_DAYS = {0, 2, 4}  # Mon, Wed, Fri
SITE = "moonfae.netlify.app"
TAGS = "#tarot #tarotreading #tarotreadings #morgangreer #emailreading #ukreader"


def today():
    return datetime.now(ZoneInfo("Europe/London")).date()


def load_state():
    if os.path.exists(STATE):
        return json.load(open(STATE))
    return {"next": 0, "posted": []}


def due():
    d = today()
    st = load_state()
    if d.weekday() not in POST_DAYS:
        return None, f"Not a posting day ({d})."
    if d.isoformat() in [p["date"] for p in st["posted"]]:
        return None, f"Already posted today ({d})."
    cards = json.load(open(os.path.join(HERE, "cards.json"), encoding="utf-8"))
    return (d, st["next"], cards[st["next"] % len(cards)]), "due"


def cta(index, d):
    gift_season = "2026-11-16" <= d.isoformat() <= "2026-12-20"
    if gift_season and index % 2 == 0:
        return f"Looking for a different kind of Christmas present? Gift a written reading, from £15: {SITE}/#gift"
    return f"Want to see what the cards say about your own question? Written readings by email, from £15: {SITE}"


def caption(card, index, d):
    return (
        f"{card['name']} ✨\n\n{card['caption']}\n\n"
        f"A question to sit with: {card['question']}\n\n"
        f"{cta(index, d)}\n\n"
        f"For entertainment and personal reflection · 18+\n\n{TAGS}"
    )


def render(card, out):
    from PIL import Image, ImageDraw, ImageFont, ImageFilter
    W, H = 1080, 1350
    BG = (14, 11, 30); GOLD = (214, 178, 96); CREAM = (236, 226, 206); MUTED = (170, 158, 190)
    fdir = os.path.join(HERE, "assets")
    F = lambda n, s: ImageFont.truetype(os.path.join(fdir, n), s)
    FELL, GAR, GARI = "im-fell-english.ttf", "eb-garamond.ttf", "eb-garamond-italic.ttf"
    im = Image.new("RGB", (W, H), BG)
    glow = Image.new("L", (W, H), 0)
    ImageDraw.Draw(glow).ellipse((W / 2 - 500, H / 2 - 600, W / 2 + 500, H / 2 + 600), fill=70)
    glow = glow.filter(ImageFilter.GaussianBlur(160))
    im = Image.composite(Image.new("RGB", (W, H), (46, 28, 76)), im, glow)
    d = ImageDraw.Draw(im)
    random.seed(card["name"])
    for _ in range(140):
        x, y = random.randint(0, W), random.randint(0, H)
        r = random.choice([1, 1, 1, 2]); a = random.randint(80, 190)
        d.ellipse((x - r, y - r, x + r, y + r), fill=(BG[0] + a, BG[1] + int(a * .85), BG[2] + int(a * .5)))
    icon = Image.open(os.path.join(fdir, "moonfae-icon.png")).convert("RGBA").resize((130, 130), Image.LANCZOS)
    im.paste(icon, ((W - 130) // 2, 80), icon)
    # gold card frame
    d.rounded_rectangle((150, 250, W - 150, 1110), radius=28, outline=GOLD, width=3)
    d.rounded_rectangle((166, 266, W - 166, 1094), radius=20, outline=(120, 98, 60), width=1)

    def C(y, t, f, fill):
        w = d.textlength(t, font=f); d.text(((W - w) / 2, y), t, font=f, fill=fill); return y + f.size * 1.25

    def wrapC(y, t, f, fill, width):
        for line in textwrap.wrap(t, width): y = C(y, line, f, fill)
        return y

    def body(y, draw=True):
        def T(y, t, f, fill):
            if draw: return C(y, t, f, fill)
            return y + f.size * 1.25
        def TW(y, t, f, fill, width):
            for line in textwrap.wrap(t, width): y = T(y, line, f, fill)
            return y
        y = T(y, "From the Major Arcana", F(GARI, 34), MUTED)
        # IM Fell's zero looks like a small o, so The Fool's 0 uses Garamond
        y = T(y + 20, card["n"], F(GAR if card["n"] == "0" else FELL, 110), GOLD)
        y = TW(y + 5, card["name"], F(FELL, 88), CREAM, 16)
        if draw: d.line((W / 2 - 90, y + 20, W / 2 + 90, y + 20), fill=GOLD, width=2)
        y = TW(y + 55, card["meaning"], F(GAR, 42), CREAM, 34)
        y = TW(y + 35, card["question"], F(GARI, 38), GOLD, 30)
        return y

    # centre the text block inside the frame (266..1094)
    h = body(0, draw=False)
    body(266 + (828 - h) / 2)
    C(H - 205, "Written tarot readings by email", F(GAR, 38), CREAM)
    C(H - 150, SITE, F(GAR, 40), GOLD)
    C(H - 92, "For entertainment and personal reflection  ·  18+", F(GARI, 30), MUTED)
    im.save(out, quality=92)


def graph(path, params=None, method="GET"):
    params = params or {}
    if method == "GET":
        url = f"{GRAPH}/{path}?{urllib.parse.urlencode(params)}"
        req = urllib.request.Request(url)
    else:
        req = urllib.request.Request(f"{GRAPH}/{path}", data=urllib.parse.urlencode(params).encode(), method="POST")
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        raise SystemExit(f"Graph error on {path}: {e.read().decode()}")


def generate():
    item, why = due()
    out_flag = os.environ.get("GITHUB_OUTPUT")
    if not item:
        print(why)
        if out_flag: open(out_flag, "a").write("due=no\n")
        return
    d, index, card = item
    os.makedirs(QUEUE, exist_ok=True)
    render(card, os.path.join(QUEUE, f"{d.isoformat()}.jpg"))
    # keep the repo small: drop images older than 14 days
    for f in os.listdir(QUEUE):
        if f.endswith(".jpg") and f[:10] < (d.fromordinal(d.toordinal() - 14)).isoformat():
            os.remove(os.path.join(QUEUE, f))
    print(f"Generated {d}: {card['name']}")
    if out_flag: open(out_flag, "a").write("due=yes\n")


def post():
    item, why = due()
    if not item:
        print(why); return
    d, index, card = item
    user = os.environ["META_ACCESS_TOKEN"]
    page = graph(PAGE_ID, {"fields": "access_token,instagram_business_account", "access_token": user})
    if "access_token" not in page:
        raise SystemExit(f"Could not get the Moonfae page token: {page}")
    ptok = page["access_token"]
    sha = os.environ.get("COMMIT_SHA", "main")
    img = f"{RAW}/{sha}/automation/moonfae/queue/{d.isoformat()}.jpg"
    cap = caption(card, index, d)
    fb = graph(f"{PAGE_ID}/photos", {"url": img, "caption": cap, "access_token": ptok}, "POST")
    print("Facebook:", fb)
    ig_id = (page.get("instagram_business_account") or {}).get("id")
    if ig_id:
        c = graph(f"{ig_id}/media", {"image_url": img, "caption": cap, "access_token": ptok}, "POST")
        for _ in range(20):
            s = graph(c["id"], {"fields": "status_code", "access_token": ptok})
            if s.get("status_code") == "FINISHED": break
            time.sleep(5)
        print("Instagram:", graph(f"{ig_id}/media_publish", {"creation_id": c["id"], "access_token": ptok}, "POST"))
    else:
        print("No Instagram account linked to the Moonfae page; Facebook only.")
    st = load_state()
    st["posted"].append({"date": d.isoformat(), "card": card["name"]})
    st["next"] = index + 1
    json.dump(st, open(STATE, "w"), indent=1, ensure_ascii=False)


if __name__ == "__main__":
    {"generate": generate, "post": post}[sys.argv[1]]()
