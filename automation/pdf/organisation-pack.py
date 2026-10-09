#!/usr/bin/env python3
"""Build the Organisation Pack — the hand-out shelf, licensed for a team,
a service or a whole organisation.

Why this exists
---------------
Every printable in digital/ is sold for one person and their household. A
SENCO, an OT service or an employer's ND network wants the same sheets to hand
out to everyone they support, and a personal licence does not let them. This
pack is those sheets plus the complete Pond Guides, with a licence page that
says plainly who may print them and for whom — three tiers, three files, the
same content in each. Nothing is posted: it rides the shop's normal download
flow, which is the whole point of selling a licence rather than a box of cards.

    python3 automation/pdf/organisation-pack.py

writes digital/Organisation-Pack-Team.pdf, -Service.pdf and -Organisation.pdf.
Front matter (cover, licence, contents) is rendered with WeasyPrint in the
collection's house style; the sheets themselves are the shipped PDFs, merged
with pikepdf, so the pack can never drift from what the shop sells singly.
Rerun it after any sheet changes.
"""
import os
import sys

import pikepdf

sys.path.insert(0, os.path.dirname(__file__))
from build import ROOT, ensure_fonts, font_face_css, mark_data_uri, esc, INK, CREAM, GOLD, MUTED, FAINT, RULE  # noqa: E402

DIGITAL = os.path.join(ROOT, "digital")

# (file, title, one line on when a professional reaches for it)
SECTIONS = [
    ("Cards to hand over instead of explaining", [
        ("Access-Needs-Cards.pdf", "Access Needs Cards", "Six cut-out cards for the moment a person cannot explain out loud, plus blanks to write your own."),
        ("When-Words-Go.pdf", "When Words Go", "Twenty-two point-and-show cards — the toilet, help finding something, somewhere quiet."),
    ]),
    ("Sheets a person fills in about themselves", [
        ("My-Sensory-Profile.pdf", "My Sensory Profile", "Eight senses on an avoid-to-seek scale, hard no's, and what regulates them."),
        ("How-To-Help-Me.pdf", "How To Help Me", "A please-don't-say / try-instead table and exactly what to do in a shutdown."),
        ("My-Pond-Plan.pdf", "My Pond Plan", "A shutdown and meltdown support plan, written on a calm day."),
        ("The-Handover-Sheet.pdf", "The Handover Sheet", "Everything the next person needs — for respite, a hospital stay, a new key worker."),
    ]),
    ("Getting through the meeting", [
        ("Appointment-Prep.pdf", "Appointment Prep", "The one thing they need from the appointment, their questions, and what helps in the room."),
        ("Say-It-Scripts.pdf", "Say It — Communication Scripts", "Twelve hard conversations, two tones each, ready to adapt."),
        ("Ask-For-It-Properly.pdf", "Ask For It Properly", "Builds a workplace or school accommodations request line by line."),
    ]),
    ("Day to day", [
        ("One-Task-Broken-Down.pdf", "One Task, Broken Down", "Turns a task into steps small enough to start, and names what might block it."),
        ("Low-Spoons-Day-Planner.pdf", "Low Spoons Day Planner", "One main task, rough blocks, permission to leave boxes blank."),
        ("Weekly-Spoon-Tracker.pdf", "Weekly Spoon Tracker", "A week of energy, circled, with what drained it and what put some back."),
    ]),
    ("Kinder words", [
        ("Permission-Cards.pdf", "Permission Cards", "Twelve cut-out cards. “Rest is not something you earn first.”"),
        ("Translation-Cards.pdf", "Translation Cards", "The harsh thing they say about themselves, and a truer sentence beside it."),
        ("Affirmation-Cards.pdf", "Affirmation Cards", "Twenty-four lines to cut out and keep somewhere they will actually see them."),
    ]),
    ("After an assessment", [
        ("After-The-Diagnosis.pdf", "After The Diagnosis", "Relief, grief and anger at once; what made sense; who needs to know."),
        ("What-Im-Actually-Good-At.pdf", "What I'm Actually Good At", "The page nobody hands you after an assessment."),
    ]),
    ("The Pond Guides", [
        ("The-Pond-Guides-Complete-Set.pdf", "The Pond Guides — complete set", "All twenty-three plain-English guides, one per neurotype: what it feels like from the inside, what people get wrong, what helps, what to say."),
    ]),
]

TIERS = {
    "Team": {
        "price": "£95",
        "scope": "one team of up to ten members of staff, at one organisation",
        "who": "a classroom team, a small clinic, a ward, a department’s ND network",
    },
    "Service": {
        "price": "£195",
        "scope": "one service, department or school of up to fifty members of staff, at one organisation",
        "who": "a SEN department, an OT or CAMHS service, a college, a GP practice group",
    },
    "Organisation": {
        "price": "£395",
        "scope": "every member of staff at one organisation, across all of its sites, and on its own staff intranet",
        "who": "a trust, a council service, a multi-academy trust, an employer",
    },
}

FRONT_PAGES = 3


def front_html(tier, contents):
    t = TIERS[tier]
    mark = mark_data_uri()
    toc = []
    for section, rows in contents:
        toc.append('<p class="toc-section">%s</p>' % esc(section))
        for title, page in rows:
            toc.append('<div class="toc-row"><span class="toc-title">%s</span><span class="toc-page">%d</span></div>' % (esc(title), page))
    css = """
%(fonts)s
@page { size: A4; margin: 14mm 16mm 12mm; }
* { box-sizing: border-box; }
body { margin: 0; font-family: 'DM Sans', sans-serif; color: %(ink)s; }
.sheet { page-break-after: always; position: relative; min-height: 262mm; }
.sheet:last-child { page-break-after: auto; }
.head { display: flex; align-items: flex-end; justify-content: space-between;
        border-bottom: 0.6pt solid %(rule)s; padding-bottom: 3mm; }
.brand { display: flex; align-items: center; gap: 2.4mm; }
.brand-mark { width: 6.4mm; height: 6.4mm; }
.brand span { font-family: 'Fraunces', serif; font-weight: 700; font-size: 12pt; }
.head-right { text-align: right; }
.doc-title { font-family: 'Fraunces', serif; font-weight: 700; font-size: 19pt; margin: 0 0 1.2mm; letter-spacing: -0.01em; white-space: nowrap; }
.doc-sub { font-family: 'Space Mono', monospace; font-size: 6.6pt; letter-spacing: 0.16em; color: %(muted)s; margin: 0; }

.cover { margin-top: 40mm; }
.cover-kicker { font-family: 'Space Mono', monospace; font-size: 7.5pt; letter-spacing: 0.2em; color: %(muted)s; margin: 0 0 6mm; }
.cover-title { font-family: 'Fraunces', serif; font-weight: 700; font-size: 44pt; line-height: 1.02; letter-spacing: -0.02em; margin: 0 0 8mm; }
.cover-tier { display: inline-block; font-family: 'Space Mono', monospace; font-size: 8pt; letter-spacing: 0.18em;
              background: %(ink)s; color: %(cream)s; padding: 2.4mm 4mm; margin: 0 0 10mm; }
.cover-body { font-size: 10.5pt; line-height: 1.6; max-width: 128mm; color: #3A3630; margin: 0 0 4mm; }
.cover-licensed { margin-top: 14mm; font-family: 'Space Mono', monospace; font-size: 7pt; letter-spacing: 0.14em; color: %(muted)s; }
.cover-line { display: block; border-bottom: 0.7pt solid %(ink)s; width: 110mm; height: 9mm; margin-top: 1mm; }

h2 { font-family: 'Fraunces', serif; font-weight: 700; font-size: 20pt; margin: 8mm 0 4mm; letter-spacing: -0.01em; }
.intro { background: %(cream)s; border-left: 1.2mm solid %(gold)s; padding: 3.4mm 4mm; margin: 5mm 0 0;
         font-size: 9pt; line-height: 1.55; color: #3A3630; }
.lic p { font-size: 9pt; line-height: 1.6; margin: 0 0 3mm; color: #2E2A25; }
.lic h3 { font-family: 'Space Mono', monospace; font-size: 6.8pt; letter-spacing: 0.18em; text-transform: uppercase;
          color: %(muted)s; margin: 6mm 0 2mm; }
.lic ul { margin: 0 0 3mm; padding-left: 4.5mm; }
.lic li { font-size: 9pt; line-height: 1.55; margin: 0 0 1.4mm; color: #2E2A25; }
.scope { font-family: 'Fraunces', serif; font-weight: 700; font-size: 13pt; line-height: 1.35; margin: 2mm 0 3mm; }

.toc-section { font-family: 'Space Mono', monospace; font-size: 6.8pt; letter-spacing: 0.18em; text-transform: uppercase;
               color: %(muted)s; margin: 5.5mm 0 1.6mm; }
.toc-row { display: flex; justify-content: space-between; align-items: baseline; font-size: 9.6pt;
           padding: 0.9mm 0; border-bottom: 0.4pt solid %(rule)s; }
.toc-title { font-family: 'Fraunces', serif; font-weight: 600; }
.toc-page { font-family: 'Space Mono', monospace; font-size: 8pt; color: %(muted)s; }
.toc-note { font-size: 8.4pt; color: #4A453D; line-height: 1.55; margin: 6mm 0 0; }

.foot { margin-top: 16mm; text-align: center; }
.foot-brand { font-family: 'Space Mono', monospace; font-size: 6pt; letter-spacing: 0.2em; color: #BDB6AA; margin: 0; }
""" % {"fonts": font_face_css(), "ink": INK, "cream": CREAM, "gold": GOLD, "muted": MUTED, "faint": FAINT, "rule": RULE}

    head = ('<div class="head"><div class="brand"><img class="brand-mark" src="%s"><span>Frog Logic</span></div>'
            '<div class="head-right"><p class="doc-title">The Organisation Pack</p><p class="doc-sub">%s LICENCE</p></div></div>'
            % (mark, tier.upper()))
    foot = '<div class="foot"><p class="foot-brand">FROG LOGIC — MADE WITH CARE</p></div>'

    cover = (
        '<section class="sheet">%s<div class="cover">'
        '<p class="cover-kicker">THE HAND-OUT SHELF · LICENSED FOR MORE THAN ONE PERSON</p>'
        '<h1 class="cover-title">The Organisation<br>Pack</h1>'
        '<p class="cover-tier">%s LICENCE · %s</p>'
        '<p class="cover-body">Seventeen printable tools and all twenty-three Pond Guides, in one file, with a licence to print them for every person you support. Cards to hand over instead of explaining. Sheets a person fills in about themselves and gives to you. Pages for getting through the meeting, for the day to day, and for the weeks after an assessment.</p>'
        '<p class="cover-body">Everything here was written for the person it is about, not about them. Hand it over as it is.</p>'
        '<p class="cover-licensed">LICENSED TO<span class="cover-line"></span></p>'
        '</div>%s</section>' % (head, tier.upper(), t["price"], foot)
    )

    licence = (
        '<section class="sheet">%s<h2>The licence</h2>'
        '<div class="intro">Plain English, because a licence you cannot understand is not one you can keep. The short version: print as much as you like for the people you support; don’t sell it, don’t post the file publicly.</div>'
        '<div class="lic">'
        '<h3>Who this covers</h3><p class="scope">%s.</p>'
        '<p>For example %s. If you are not sure which tier you are, the honest guess is fine — nobody is checking badges — and you can move up later by paying the difference.</p>'
        '<h3>What you may do</h3><ul>'
        '<li>Print any page, as many times as you need, for as long as you like. The licence does not expire.</li>'
        '<li>Hand printed copies to the people you support, their families and carers, and anyone else who needs one. There is no limit on how many people receive a sheet.</li>'
        '<li>Use the pages in sessions, lessons, inductions, assessments, care plans and training within the licensed team, service or organisation.</li>'
        '<li>Keep the file on the licensed staff’s own devices and shared drives%s.</li>'
        '<li>Stamp or write your organisation’s name on printed copies. Please leave the Frog Logic mark where it is.</li>'
        '</ul>'
        '<h3>What you may not do</h3><ul>'
        '<li>Sell the pack, any page of it, or anything made from it.</li>'
        '<li>Put the file, or any page of it, on a public website or in a public post.</li>'
        '<li>Pass the file to another organisation. They can buy their own; every sheet is also sold singly for personal use at froglogic.co.uk.</li>'
        '<li>Present the pages as your own work or remove the attribution.</li>'
        '</ul>'
        '<h3>What you get for the next twelve months</h3>'
        '<p>When a new sheet joins the pack, or one of these is improved, an updated file is sent to the email address that bought it. After twelve months the file you have stays yours forever; it just stops updating.</p>'
        '<h3>If something here is wrong for your setting</h3>'
        '<p>Write to hello@froglogic.co.uk. Wording that does not fit a particular service gets changed, not defended.</p>'
        '<p>© Frog Logic. Not affiliated with any scheme, charity or trademark named on any sheet.</p>'
        '</div></section>' % (head, esc(t["scope"][0].upper() + t["scope"][1:]), esc(t["who"]),
                              ", and on the organisation’s own staff intranet" if tier == "Organisation" else "")
    )

    toc_page = (
        '<section class="sheet">%s<h2>What’s in it</h2>%s'
        '<p class="toc-note">Page numbers count this cover and licence. Every tool is A4, designed to print in black and white on an office printer, and most are one or two sides. The Pond Guides are two pages each; print a single guide by its page range rather than the whole set.</p>'
        '</section>' % (head, "".join(toc))
    )
    return ("<!doctype html><html><head><meta charset='utf-8'><title>The Organisation Pack — %s licence</title>"
            "<style>%s</style></head><body>%s%s%s</body></html>" % (esc(tier), css, cover, licence, toc_page))


def main():
    from weasyprint import HTML
    ensure_fonts()

    # Page map first, so the contents page is right by construction.
    contents, page = [], FRONT_PAGES + 1
    for section, rows in SECTIONS:
        entries = []
        for fname, title, _ in rows:
            n = len(pikepdf.open(os.path.join(DIGITAL, fname)).pages)
            entries.append((title, page))
            page += n
        contents.append((section, entries))
    total = page - 1

    for tier in TIERS:
        front = os.path.join("/tmp", "org-pack-front-%s.pdf" % tier.lower())
        HTML(string=front_html(tier, contents)).write_pdf(front)
        out = pikepdf.Pdf.new()
        with pikepdf.open(front) as f:
            assert len(f.pages) == FRONT_PAGES, "front matter is %d pages, expected %d" % (len(f.pages), FRONT_PAGES)
            out.pages.extend(f.pages)
        for _, rows in SECTIONS:
            for fname, _, _ in rows:
                with pikepdf.open(os.path.join(DIGITAL, fname)) as src:
                    out.pages.extend(src.pages)
        assert len(out.pages) == total, (len(out.pages), total)
        with out.open_metadata() as meta:
            meta["dc:title"] = "The Organisation Pack — %s licence" % tier
            meta["dc:creator"] = ["Frog Logic"]
        target = os.path.join(DIGITAL, "Organisation-Pack-%s.pdf" % tier)
        out.save(target)
        print("wrote", os.path.relpath(target, ROOT), total, "pages", os.path.getsize(target) // 1024, "KB")


if __name__ == "__main__":
    main()
