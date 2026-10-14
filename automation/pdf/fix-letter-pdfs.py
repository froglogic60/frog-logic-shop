"""Repair the eight older printables that were exported at US Letter size.

1. Emoji fix: these PDFs draw each emoji twice - an invisible glyph in the
   colour-emoji font at the right spot, then a bitmap of the emoji placed by a
   separate `cm` that is ~109 units too high. That pushed every frog up onto
   the line above (e.g. sitting on "CHAPTER" in the Hoppy Thoughts zines, and
   off the top of the page beside the title). We move each bitmap to sit on
   the glyph's own baseline.
2. Size fix: the pages are US Letter but the site and Etsy sell them as A4.
   Each page is scaled to fit A4, centred.

Usage: python3 -I fix-letter-pdfs.py in.pdf out.pdf
"""
import sys
import pikepdf
from pikepdf import Operator

A4W, A4H = 595.276, 841.89


def emoji_fonts(page):
    fonts = page.Resources.get("/Font", {})
    return {str(k) for k, f in fonts.items() if "Emoji" in str(f.get("/BaseFont", ""))}


def fix_emoji(pdf, page):
    """Shift every emoji bitmap down by the page's constant offset so it sits on
    its glyph's baseline. The offset is measured from the glyph/bitmap pairs."""
    emo = emoji_fonts(page)
    if not emo:
        return 0
    ops = pikepdf.parse_content_stream(page)
    is_emoji_img = lambda name: any(name.startswith("/i" + f.lstrip("/")) for f in emo)
    # locate every emoji bitmap block: q / cm / cm / Do
    blocks, gaps, font, tm_y, fsize = [], [], None, None, 12.0
    for i, (operands, op) in enumerate(ops):
        o = str(op)
        if o == "Tf":
            font, fsize = str(operands[0]), float(operands[1])
        elif o == "Tm":
            tm_y = float(operands[5])
        elif o in ("TJ", "Tj") and font in emo:
            last_glyph_y = tm_y
            gaps.append(None)  # filled by the first bitmap that follows
        elif (o == "Do" and is_emoji_img(str(operands[0])) and i >= 3
              and str(ops[i - 1][1]) == "cm" and str(ops[i - 2][1]) == "cm"):
            blocks.append((i - 2, fsize))
            if gaps and gaps[-1] is None:
                gaps[-1] = last_glyph_y - float(ops[i - 2][0][5])
    gaps = sorted(g for g in gaps if g is not None)
    if not gaps:
        return 0
    off = gaps[len(gaps) // 2]
    for j, fs in blocks:
        a, b, c, d, x, ty = [float(v) for v in ops[j][0]]
        s = float(ops[j + 1][0][0])
        h = d * s
        top = ty + off - 0.86 * h  # where the glyph's top should be
        ops[j] = ([a, b, c, d, x, top], Operator("cm"))
    page.Contents = pdf.make_stream(pikepdf.unparse_content_stream(ops))
    return len(blocks)


def main(src_path, out_path):
    src = pikepdf.open(src_path)
    sizes = {(round(float(p.mediabox[2])), round(float(p.mediabox[3]))) for p in src.pages}
    if sizes == {(595, 842)}:
        print(f"{src_path}: already A4, left alone")  # makes re-runs harmless
        return
    n = sum(fix_emoji(src, p) for p in src.pages)
    out = pikepdf.Pdf.new()
    for page in src.pages:
        box = page.mediabox
        pw, ph = float(box[2]) - float(box[0]), float(box[3]) - float(box[1])
        k =min(A4W / pw, A4H / ph)
        dx, dy = (A4W - pw * k) / 2, (A4H - ph * k) / 2
        new = out.add_blank_page(page_size=(A4W, A4H))
        form = out.copy_foreign(page.as_form_xobject())
        new.add_overlay(form, pikepdf.Rectangle(dx, dy, dx + pw * k, dy + ph * k))
    out.docinfo = out.copy_foreign(src.docinfo)
    out.save(out_path)
    print(f"{src_path}: {n} emoji moved, {len(out.pages)} A4 pages")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
