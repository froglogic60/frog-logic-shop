# Lifts the text of the 23 Pond Guides out of digital/Pond-Guide-*.pdf into
# automation/site/pond-guides.json, which build-pages.cjs renders onto each
# guide's page as readable HTML (22 Oct 2026 — before this the guide pages
# were a download card with nothing for Google to read). The PDFs are the
# source of truth; rerun this (the "Build the product pages" workflow does)
# whenever a guide PDF changes. Needs pdfplumber.
import pdfplumber, json, glob, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "../.."))
OUT={}
def lines_of(page):
    words=page.extract_words(extra_attrs=['size','fontname'])
    rows={}
    for w in words:
        k=round(w['top']/3)*3
        rows.setdefault(k,[]).append(w)
    out=[]
    for k in sorted(rows):
        ws=sorted(rows[k],key=lambda w:w['x0'])
        out.append(dict(top=k,x=ws[0]['x0'],size=ws[0]['size'],font=ws[0]['fontname'],words=ws,text=' '.join(w['text'] for w in ws)))
    return out
def split_cols(ws,cut):
    L=' '.join(w['text'] for w in ws if w['x0']<cut); R=' '.join(w['text'] for w in ws if w['x0']>=cut); return L,R
def parse(path):
    g={'sections':{}}
    with pdfplumber.open(path) as pdf:
        p0=lines_of(pdf.pages[0]); p1=lines_of(pdf.pages[1])
    g['name']=p0[0]['text']
    body=[l for l in p0 if l['top']>90 and 'MADE WITH CARE' not in l['text']]
    # lede: Fraunces-Medium 12
    lede=[l['text'] for l in body if 'Fraunces-Medium' in l['font'] and abs(l['size']-12)<0.3]
    g['lede']=' '.join(lede)
    # sections by heading
    sec=None; S={}
    for l in body:
        if 'Semi-Bold' in l['font'] and l['size']>12: sec=l['text']; S[sec]=[]; continue
        if sec: S[sec].append(l)
    g['plain']=' '.join(l['text'] for l in S.get('In plain words',[]))
    g['inside']=[]
    for l in S.get('What it can feel like from the inside',[]):
        t=l['text']
        if t.startswith('•'): g['inside'].append(t[1:].strip())
        elif g['inside']: g['inside'][-1]+=' '+t
    wrong=[]
    for l in S.get('What people often get wrong',[]):
        if 'Grotesk' in l['font']: continue
        # find column cut: first word with x0>200
        L,R=split_cols(l['words'],200)
        if L: wrong.append([L,R])
        elif wrong: wrong[-1][1]+=' '+R
    g['wrong']=wrong
    body1=[l for l in p1 if l['top']>90 and 'MADE WITH CARE' not in l['text']]
    sec=None; S={}
    for l in body1:
        if 'Semi-Bold' in l['font'] and l['size']>12: sec=l['text']; S[sec]=[]; continue
        if sec: S[sec].append(l)
    g['strengths']=[l['text'] for l in S.get('What often comes with it',[]) if 'Grotesk' not in l['font'] and l['size']>9]
    cols={0:[],1:[]}
    for l in S.get('What actually helps',[]):
        L,R=split_cols(l['words'],297)
        for col,txt in ((0,L),(1,R)):
            if not txt: continue
            if cols[col] and txt[0].islower(): cols[col][-1]+=' '+txt
            else: cols[col].append(txt)
    g['helps']=cols[0]+cols[1]
    rc={0:[],1:[]}; closing=[]; disc=[]
    for l in S.get('If someone tells you this is them',[]):
        if 'Grotesk' in l['font']: continue
        if 'Italic' in l['font']: closing.append(l['text']); continue
        if l['size']<8: disc.append(l['text']); continue
        L,R=split_cols(l['words'],297)
        for col,txt in ((0,L),(1,R)):
            if not txt: continue
            if rc[col] and not txt.startswith(('“','(','*')): rc[col][-1]+=' '+txt
            else: rc[col].append(txt)
    resp=[rc[0],rc[1]]
    g['responses']=resp; g['closing']=' '.join(closing); g['disclaimer']=' '.join(disc)
    return g
for f in sorted(glob.glob(os.path.join(ROOT,'digital/Pond-Guide-*.pdf'))):
    key=os.path.basename(f)[11:-4]
    try: OUT[key]=parse(f); OUT[key].pop('sections',None)
    except Exception as e: print('FAIL',key,e)
json.dump(OUT,open(os.path.join(HERE,'pond-guides.json'),'w'),ensure_ascii=False,indent=1)
for k,g in OUT.items():
    print(f"{k:16s} lede={len(g['lede'])} plain={len(g['plain'])} inside={len(g['inside'])} wrong={len(g['wrong'])} str={len(g['strengths'])} helps={len(g['helps'])} resp={len(g['responses'])} close={len(g['closing'])}")
