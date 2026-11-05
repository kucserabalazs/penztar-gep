#!/usr/bin/env python3
"""A Hunyadi-lovas (arany változat, csontvázas lábakkal, kivont karddal) kiemelése a fejléc-jelenethez.

Forrás: assets/illusztraciok/web/szechenyi-ter-arany.svg  (a lovas.py által felépített #szobor csoport)
Kimenet: assets/illusztraciok/web/lovas-fejlec.svg – csak a lovas (a talapzat, a tér és a por nélkül),
         az azonosítók „fl-” előtaggal, hogy a lapba ágyazva ne ütközzenek. A mozgatást az assets/fejlec-jelenet.js végzi
         (lábízületek: #fl-lFF1…4, #fl-lRF1…4, #fl-lFN1…4, #fl-lRN1…4; buzogányos kar: #fl-kar; kard: #fl-kard; hüvely-takaró: #fl-takar).
Futtatás a repó gyökeréből:  python3 eszkozok/illusztraciok/lovas_fejlec.py
"""
import os, re

GY = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
SRC = os.path.join(GY, "assets/illusztraciok/web/szechenyi-ter-arany.svg")
OUT = os.path.join(GY, "assets/illusztraciok/web/lovas-fejlec.svg")

s = open(SRC, encoding="utf-8").read()
i = s.index('<g id="szobor"')
j = s.index('<g id="lov-por1"')
blk = s[i:j]
# a #szobor nyitócímkéjének stílusa (talapzati forgáspont) nem kell
blk = re.sub(r'^<g id="szobor"[^>]*>', '<g id="fl-szobor">', blk)
blk = blk.replace("<!--lovas-v6-->", "")
# a stíluslapból jövő kitöltés (.lov-p) attribútumként
blk = blk.replace('class="lov-p"', 'fill="url(#lov-patina)"')
blk = blk.replace("lov-", "fl-")
# a talapzat apró maradványai a farok alatt (a szobor rajzából) – kimaradnak
def tisztit(m):
    out = []
    for sp in re.findall(r"M[^M]+", m.group(2)):
        n = list(map(float, re.findall(r"-?[\d.]+", sp)))
        xs, ys = n[0::2], n[1::2]
        if min(xs) > 1750 and min(ys) > 315 and max(xs) - min(xs) < 30: continue
        out.append(sp)
    return m.group(1) + "".join(out) + '"'
blk = re.sub(r'(<path id="fl-(?:szil|vonal)" d=")([^"]+)"', tisztit, blk)
# a lezáró </g>-k: a #szobor csoportot a por előtt kell zárni
nyit = blk.count("<g ") + blk.count("<g>")
zar = blk.count("</g>")
if nyit > zar:
    blk += "</g>" * (nyit - zar)
while zar > nyit and blk.endswith("</g>"):
    blk = blk[:-4]; zar -= 1
svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="1380 -160 500 540" style="color:#7d5a1e">'
       + blk + "</svg>")
open(OUT, "w", encoding="utf-8").write(svg)
print(OUT, len(svg) // 1024, "KB")
