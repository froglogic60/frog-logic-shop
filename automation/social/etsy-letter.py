"""Scale an A4 PDF onto US Letter pages, centred, keeping the aspect ratio.
Usage: python3 -I etsy-letter.py in.pdf out.pdf
"""
import sys
import pikepdf

src = pikepdf.open(sys.argv[1])
out = pikepdf.Pdf.new()
LW, LH = 612.0, 792.0
for page in src.pages:
    box = page.mediabox
    pw, ph = float(box[2]) - float(box[0]), float(box[3]) - float(box[1])
    k = min(LW / pw, LH / ph)
    dx, dy = (LW - pw * k) / 2, (LH - ph * k) / 2
    new = out.add_blank_page(page_size=(LW, LH))
    form = out.copy_foreign(page.as_form_xobject())
    new.add_overlay(form, pikepdf.Rectangle(dx, dy, dx + pw * k, dy + ph * k))
out.save(sys.argv[2])
