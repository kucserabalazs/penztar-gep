#!/usr/bin/env python3
"""Dzsámi angyallal – a főoldal „Látogasson el hozzánk” részének asztali illusztrációja.

Forrás: assets/illusztraciok/web/dzsami-szepia.svg (a kupola külön rétegen: #kupola).
Eredmény: assets/illusztraciok/web/dzsami-szepia-angyal.svg

Mozgás (16 mp-es ciklus, végtelenítve):
  - nyugalom → a kupola a jobb peremén zsanérként felnyílik (mint egy fedél), előtte egy kis rándulás;
  - a nyílásból aranyfény és fénysugarak áradnak;
  - kiszáll egy vonalrajzos angyal (glória, csapkodó szárnyak, harsona), kört ír a dzsámi fölött,
    majd a messzeségbe repül (kisebbedik, elhalványul), szikrákat hagyva maga után;
  - a kupola visszacsukódik, kicsit visszapattan, a félhold–kereszt meglendül.
A rajz fölé 120 egységnyi hely került (viewBox), hogy az angyal és a nyitott kupola kiférjen;
a weboldal CSS-e ezt kiegyenlíti, így az épület ugyanakkora és ugyanott marad.
Mozgáscsökkentést kérő gépen semmi nem mozog, és az angyal nem látszik.
Futtatás a repó gyökeréből:  python3 eszkozok/illusztraciok/angyal.py
"""
import os, re

GYOKER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
FORRAS = os.path.join(GYOKER, "assets/illusztraciok/web/dzsami-szepia.svg")
CEL = os.path.join(GYOKER, "assets/illusztraciok/web/dzsami-szepia-angyal.svg")
PLUSZ = 120                      # ennyivel nő a rajz fölötti hely
CIKLUS = "16s"
ARANY = "#c9973f"

s = open(FORRAS, encoding="utf-8").read()

# ---- 1) nagyobb hely felül ----
s = s.replace('viewBox="207.667 -68.3333 1032 1125"', f'viewBox="207.667 {-68.3333 - PLUSZ:.4f} 1032 {1125 + PLUSZ}"', 1)
s = s.replace('aria-label="Gázi Kászim pasa dzsámija – mozgó"', 'aria-label="Gázi Kászim pasa dzsámija – a kupolából angyal száll ki"', 1)

# ---- 2) a kupola zsanérja: a jobb alsó perem (a kupola befoglaló dobozában) ----
# kupola doboza: x 374…1071, y 32.7…351  →  zsanér kb. (1062, 343)
s = s.replace('<g id="kupola" class="resz" style="transform-origin:50.2% 89.4%">',
              '<g id="kupola" class="resz" style="transform-origin:98.7% 97.5%">', 1)

# a kupola tömör héja (a körvonal pontjainak konvex burka): nyitott állapotban eltakarja, ami mögötte van;
# csukott állapotban láthatatlan, így az eredeti rajzból semmit nem takar ki
_kup = s[s.find('<g id="kupola"'):]
_pts = [tuple(map(float, m)) for m in re.findall(r"(-?\d+(?:\.\d+)?)[ ,](-?\d+(?:\.\d+)?)", re.search(r'<path d="([^"]*)"', _kup).group(1))]
def _burok(p):
    p = sorted(set(p))
    def cr(o, a, b): return (a[0]-o[0])*(b[1]-o[1]) - (a[1]-o[1])*(b[0]-o[0])
    lo, hi = [], []
    for q in p:
        while len(lo) >= 2 and cr(lo[-2], lo[-1], q) <= 0: lo.pop()
        lo.append(q)
    for q in reversed(p):
        while len(hi) >= 2 and cr(hi[-2], hi[-1], q) <= 0: hi.pop()
        hi.append(q)
    return lo[:-1] + hi[:-1]
_h = _burok(_pts)
HEJ = '<path class="kup-hej" d="M' + " L".join(f"{x:.1f} {y:.1f}" for x, y in _h) + ' Z"/>'
s = s.replace('<g id="kupola" class="resz" style="transform-origin:98.7% 97.5%">',
              '<g id="kupola" class="resz" style="transform-origin:98.7% 97.5%">' + HEJ, 1)

# ---- 3) új stílus: a régi animációk helyett egy közös, 16 mp-es forgatókönyv ----
uj_stilus = """<style>svg{color:#2b3c53;--ill-hatter:#fffdf8}.resz{transform-box:fill-box}
.takaro{fill:var(--ill-hatter,#fff)}.perem{opacity:0}
#angyal,#feny,#sugarak,.nyom,.kup-hej{opacity:0}
.kup-hej{fill:var(--ill-hatter,#fff)}
#angyal{transform-box:view-box;transform-origin:0 0}
.szarny{transform-box:view-box}
#szb{transform-origin:-12px -66px}#szj{transform-origin:12px -66px}
#feny,#sugarak{transform-box:fill-box;transform-origin:50%% 100%%}
.a-vonal{fill:var(--ill-hatter,#fff);stroke:currentColor;stroke-width:3.4;stroke-linejoin:round;stroke-linecap:round}
.a-reszlet{fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.a-arany{fill:none;stroke:%(arany)s;stroke-width:4;stroke-linecap:round}
.a-arany-t{fill:%(arany)s;fill-opacity:.25;stroke:%(arany)s;stroke-width:2.6;stroke-linejoin:round}
.szikra{opacity:0;transform-box:fill-box;transform-origin:50%% 50%%}
@media (prefers-reduced-motion:no-preference){
#kupola{animation:fedel %(c)s cubic-bezier(.45,.05,.25,1) infinite}
#kupola .perem{animation:perem %(c)s linear infinite}
#kupola .kup-hej{animation:hej %(c)s linear infinite}
#jelkep{animation:jel %(c)s ease-in-out infinite}
#feny{animation:feny %(c)s ease-in-out infinite}
#sugarak{animation:sugar %(c)s ease-in-out infinite}
#angyal{animation:repul %(c)s linear infinite}
#angyal .test{animation:lebeg 1.1s ease-in-out infinite alternate}
#szb{animation:csapb .52s ease-in-out infinite alternate}
#szj{animation:csapj .52s ease-in-out infinite alternate}
.nyom{animation:nyom %(c)s ease-out infinite}
.szikra{animation:szikra 6s ease-in-out infinite}
}
/* kupola: nyugalom → rándulás → felnyílik (zsanér a jobb peremen) → nyitva marad → visszacsukódik, visszapattan */
@keyframes fedel{0%%,34%%{transform:rotate(0)}35.5%%{transform:rotate(1.4deg)}37%%{transform:rotate(-.6deg)}38%%{transform:rotate(0)}
 44%%{transform:translate(6px,-14px) rotate(33deg)}46%%{transform:translate(5px,-12px) rotate(29deg)}48%%,72%%{transform:translate(5px,-12px) rotate(31deg)}
 79%%{transform:rotate(-1deg)}80.5%%{transform:translate(0,-9px) rotate(2.5deg)}82%%{transform:rotate(0)}83%%{transform:translate(0,-3px) rotate(.6deg)}84%%,100%%{transform:rotate(0)}}
@keyframes perem{0%%,39%%{opacity:0}42%%,77%%{opacity:1}79%%,100%%{opacity:0}}
@keyframes hej{0%%,40%%{opacity:0}41%%,76.8%%{opacity:1}77.6%%,100%%{opacity:0}}
@keyframes jel{0%%,79%%,100%%{transform:rotate(0)}81%%{transform:rotate(-9deg)}84%%{transform:rotate(6deg)}87%%{transform:rotate(-3deg)}90%%{transform:rotate(1deg)}92%%{transform:rotate(0)}}
@keyframes feny{0%%,40%%{opacity:0;transform:scale(.6,.2)}46%%{opacity:.95;transform:scale(1,1)}62%%{opacity:.8;transform:scale(1.06,1.1)}74%%{opacity:.55;transform:scale(1,1)}79%%,100%%{opacity:0;transform:scale(.7,.25)}}
@keyframes sugar{0%%,42%%{opacity:0;transform:scaleY(.1)}49%%{opacity:.9;transform:scaleY(1)}58%%{opacity:.6;transform:scaleY(1.08)}70%%{opacity:.35;transform:scaleY(.95)}77%%,100%%{opacity:0;transform:scaleY(.2)}}
/* az angyal útja: kiemelkedik a nyílásból, kört ír, majd balra fel elszáll a messzeségbe */
@keyframes repul{0%%,44%%{opacity:0;transform:translate(718px,430px) scale(.62) rotate(0)}
 45%%{opacity:1;transform:translate(718px,420px) scale(.64) rotate(0)}
 50%%{opacity:1;transform:translate(716px,215px) scale(.86) rotate(-2deg)}
 53%%{opacity:1;transform:translate(700px,130px) scale(.95) rotate(-6deg)}
 56%%{opacity:1;transform:translate(640px,70px) scale(1) rotate(-12deg)}
 59%%{opacity:1;transform:translate(560px,60px) scale(1) rotate(-4deg)}
 62%%{opacity:1;transform:translate(500px,110px) scale(.98) rotate(8deg)}
 64.5%%{opacity:1;transform:translate(520px,170px) scale(.96) rotate(10deg)}
 67%%{opacity:1;transform:translate(590px,150px) scale(.94) rotate(-4deg)}
 70%%{opacity:1;transform:translate(560px,60px) scale(.82) rotate(-14deg)}
 73%%{opacity:1;transform:translate(470px,-30px) scale(.62) rotate(-20deg)}
 76%%{opacity:.75;transform:translate(390px,-95px) scale(.42) rotate(-24deg)}
 78.5%%{opacity:0;transform:translate(330px,-140px) scale(.26) rotate(-26deg)}
 100%%{opacity:0;transform:translate(330px,-140px) scale(.26) rotate(-26deg)}}
@keyframes lebeg{from{transform:translateY(-3px)}to{transform:translateY(4px)}}
@keyframes csapb{from{transform:rotate(14deg)}to{transform:rotate(-22deg)}}
@keyframes csapj{from{transform:rotate(-14deg)}to{transform:rotate(22deg)}}
@keyframes nyom{0%%,55%%{opacity:0;transform:scale(.2) rotate(0)}58%%{opacity:1;transform:scale(1) rotate(45deg)}66%%,100%%{opacity:0;transform:scale(.3) rotate(110deg)}}
@keyframes szikra{0%%,80%%,100%%{opacity:0;transform:scale(.2) rotate(0)}86%%{opacity:1;transform:scale(1) rotate(45deg)}92%%{opacity:0;transform:scale(.3) rotate(90deg)}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}</style>""" % {"c": CIKLUS, "arany": ARANY}
s = re.sub(r"<style>.*?</style>", lambda m: uj_stilus, s, count=1, flags=re.S)

# ---- 4) fény a nyílásban (a kupola MÖGÉ kerül) ----
feny = f"""<defs>
<radialGradient id="g-feny" cx="50%" cy="100%" r="75%"><stop offset="0" stop-color="#fff6d8" stop-opacity="1"/><stop offset=".45" stop-color="#f3d58a" stop-opacity=".75"/><stop offset="1" stop-color="#e9b957" stop-opacity="0"/></radialGradient>
<linearGradient id="g-sugar" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#f5d98f" stop-opacity=".85"/><stop offset="1" stop-color="#f5d98f" stop-opacity="0"/></linearGradient>
<clipPath id="ki-nyilas"><rect x="0" y="-400" width="1600" height="706"/></clipPath>
</defs>
<g id="sugarak"><path fill="url(#g-sugar)" d="M700 302 L560 -40 L612 -46 Z M712 302 L660 -90 L700 -92 Z M724 302 L740 -95 L778 -90 Z M736 302 L830 -60 L878 -48 Z M748 302 L930 0 L968 18 Z M690 302 L470 10 L505 -6 Z"/></g>
<ellipse id="feny" cx="722" cy="300" rx="300" ry="120" fill="url(#g-feny)"/>
"""
i_kup = s.find('<g id="kupola"')
s = s[:i_kup] + feny + s[i_kup:]

# ---- 5) az angyal (a kupola ELÉ kerül) ----
szarny = """<path class="a-vonal" d="M-12 -66 C-40 -96 -86 -128 -150 -150 C-178 -158 -196 -152 -186 -136 C-196 -128 -194 -116 -180 -112 C-192 -102 -188 -90 -172 -88 C-182 -76 -176 -64 -158 -64 C-164 -52 -156 -42 -138 -44 C-140 -32 -128 -26 -112 -30 C-110 -18 -96 -14 -82 -22 C-72 -10 -54 -14 -44 -26 C-30 -36 -18 -50 -12 -66 Z"/>
<path class="a-reszlet" d="M-30 -60 C-70 -86 -110 -110 -160 -136 M-36 -48 C-80 -70 -124 -88 -164 -98 M-40 -38 C-84 -50 -120 -60 -150 -70 M-44 -32 C-76 -38 -104 -42 -128 -46 M-48 -28 C-66 -30 -84 -30 -100 -30"/>"""
angyal = f"""<g clip-path="url(#ki-nyilas)"><g id="angyal"><g class="test">
<g id="szb" class="szarny">{szarny}</g>
<g id="szj" class="szarny"><g transform="scale(-1,1)">{szarny}</g></g>
<path class="a-vonal" d="M-22 -70 C-30 -40 -44 10 -60 60 C-70 92 -74 112 -64 126 C-44 118 -30 132 -12 122 C4 134 22 120 38 128 C54 120 70 124 76 110 C70 80 56 30 40 -20 C34 -44 28 -60 22 -70 C8 -78 -8 -78 -22 -70 Z"/>
<path class="a-reszlet" d="M-8 -40 C-14 0 -22 50 -30 112 M8 -40 C10 0 14 50 22 116 M-36 30 C-40 60 -46 88 -50 110 M40 26 C46 56 54 84 60 106 M-26 -58 C-10 -50 10 -50 26 -58"/>
<path class="a-vonal" d="M-20 -64 C-38 -50 -52 -40 -62 -30 C-66 -24 -60 -18 -54 -22 C-44 -30 -32 -40 -18 -46 Z"/>
<path class="a-vonal" d="M20 -64 C34 -56 46 -60 58 -72 C62 -78 56 -84 50 -80 C40 -72 30 -70 18 -74 Z"/>
<circle class="a-vonal" cx="0" cy="-98" r="19"/>
<path class="a-reszlet" d="M-17 -104 C-12 -120 12 -122 18 -104 M-18 -100 C-24 -88 -22 -78 -16 -72 M18 -100 C24 -88 22 -78 16 -72 M-6 -96 L-5 -95 M6 -96 L7 -95 M-4 -88 C-1 -86 2 -86 5 -88"/>
<ellipse class="a-arany" cx="0" cy="-128" rx="24" ry="7"/>
<path class="a-arany-t" d="M10 -94 L62 -120 L66 -132 C74 -134 80 -126 76 -118 L70 -112 L14 -88 Z"/>
<path class="a-arany" d="M56 -104 L60 -96" style="stroke-width:2.6"/>
</g></g></g>
<g class="nyom-csop">
<g transform="translate(600 40) scale(1.1)"><path class="szikra nyom" style="fill:{ARANY};animation-delay:0s" d="M0 -9L2 -2L9 0L2 2L0 9L-2 2L-9 0L-2 -2Z"/></g>
<g transform="translate(520 120) scale(.9)"><path class="szikra nyom" style="fill:{ARANY};animation-delay:.5s" d="M0 -9L2 -2L9 0L2 2L0 9L-2 2L-9 0L-2 -2Z"/></g>
<g transform="translate(560 190) scale(.8)"><path class="szikra nyom" style="fill:{ARANY};animation-delay:1s" d="M0 -9L2 -2L9 0L2 2L0 9L-2 2L-9 0L-2 -2Z"/></g>
<g transform="translate(470 -10) scale(1)"><path class="szikra nyom" style="fill:{ARANY};animation-delay:1.6s" d="M0 -9L2 -2L9 0L2 2L0 9L-2 2L-9 0L-2 -2Z"/></g>
<g transform="translate(400 -80) scale(.8)"><path class="szikra nyom" style="fill:{ARANY};animation-delay:2.1s" d="M0 -9L2 -2L9 0L2 2L0 9L-2 2L-9 0L-2 -2Z"/></g>
</g>
"""
# a kupola csoport vége után (a fő <g> zárása előtt) – a meglévő szikrák elé
i_szikra = s.find('<g transform="translate(758 40)')
s = s[:i_szikra] + angyal + s[i_szikra:]

open(CEL, "w", encoding="utf-8").write(s)
print("Kész:", os.path.relpath(CEL, GYOKER), len(s), "bájt")
