# Free Pond Guides: say they're free to share, and say where they came from.
#
# Sam, 28 Oct 2026 ("yes do 1"): every single Pond Guide PDF ended with
# "For your own personal use ... Please don't resell, redistribute, or share
# the file itself" while every post, email and the Christmas picture tells
# people to forward them to the relatives. The PDFs also carried no web
# address, so a forwarded guide led nobody back to the shop.
#
# This stamps all digital/Pond-Guide-*.pdf in place:
#   - the personal-use line (page 2) becomes a free-to-share line;
#   - "FROG LOGIC — MADE WITH CARE" (both pages) becomes
#     "FROG LOGIC — FREE GUIDES AT FROGLOGIC.CO.UK", clickable.
# Same fonts (DM Sans, Space Grotesk), size and colour as the originals.
# Only the free single guides: the paid Complete Set keeps its licence.
# Safe to rerun: a guide that already has the new line is skipped.
#
#   pip install pymupdf && python automation/pdf/guide-share-line.py
import glob
import os
import urllib.request

import pymupdf

ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
FONTS = os.path.join(os.path.dirname(__file__), ".fonts")
SRC = {
    "DMSans.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/dmsans/DMSans%5Bopsz,wght%5D.ttf",
    "SpaceGrotesk.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/spacegrotesk/SpaceGrotesk%5Bwght%5D.ttf",
}
SHARE = "Free to share — print it, forward it, hand it to anyone who needs it. More free guides, one per neurotype, at froglogic.co.uk"
BRAND = "FROG LOGIC — FREE GUIDES AT FROGLOGIC.CO.UK"
LINK = "https://froglogic.co.uk/?ref=pdf#guides"
COLOUR = (0xA3 / 255, 0x96 / 255, 0x83 / 255)


def font(name):
    os.makedirs(FONTS, exist_ok=True)
    path = os.path.join(FONTS, name)
    if not os.path.exists(path) or os.path.getsize(path) < 10000:
        urllib.request.urlretrieve(SRC[name], path)
    return path


def lines(page):
    for blk in page.get_text("dict")["blocks"]:
        for line in blk.get("lines", []):
            yield "".join(s["text"] for s in line["spans"]), pymupdf.Rect(line["bbox"]), line["spans"][0]["size"]


def centred(page, rect, text, fontfile, fontname, size):
    f = pymupdf.Font(fontfile=fontfile)
    width = f.text_length(text, fontsize=size)
    while width > page.rect.width - 80 and size > 5:
        size -= 0.25
        width = f.text_length(text, fontsize=size)
    x = (page.rect.width - width) / 2
    y = rect.y1 - (rect.height - size) / 2 - size * 0.22
    page.insert_text((x, y), text, fontsize=size, fontname=fontname, fontfile=fontfile, color=COLOUR)
    return pymupdf.Rect(x, rect.y0, x + width, rect.y1)


def stamp(path, dm, sg):
    doc = pymupdf.open(path)
    if any(BRAND in t for p in doc for t, _, _ in lines(p)):
        return "already stamped"
    jobs = []
    for page in doc:
        for text, rect, size in lines(page):
            if "MADE WITH CARE" in text:
                jobs.append((page.number, rect, BRAND, sg, "sg", size, True))
            elif "personal use" in text:
                jobs.append((page.number, rect, SHARE, dm, "dm", size, True))
    if not any(j[2] == SHARE for j in jobs):
        return "SKIPPED: no personal-use line found"
    for n in range(doc.page_count):
        page = doc[n]
        mine = [j for j in jobs if j[0] == n]
        for _, rect, *_ in mine:
            page.add_redact_annot(rect + (-2, -1, 2, 1), fill=(1, 1, 1))
        if mine:
            page.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_NONE)
        for _, rect, text, fontfile, fontname, size, link in mine:
            where = centred(page, rect, text, fontfile, fontname, size)
            if link:
                page.insert_link({"kind": pymupdf.LINK_URI, "from": where, "uri": LINK})
    doc.save(path + ".tmp", garbage=3, deflate=True)
    doc.close()
    os.replace(path + ".tmp", path)
    return "stamped"


if __name__ == "__main__":
    dm, sg = font("DMSans.ttf"), font("SpaceGrotesk.ttf")
    files = sorted(glob.glob(os.path.join(ROOT, "digital", "Pond-Guide-*.pdf")))
    bad = 0
    for f in files:
        result = stamp(f, dm, sg)
        bad += result.startswith("SKIPPED")
        print(os.path.basename(f), "-", result)
    print(f"{len(files)} guides checked")
    if bad:
        raise SystemExit(f"{bad} guide(s) had no personal-use line")
