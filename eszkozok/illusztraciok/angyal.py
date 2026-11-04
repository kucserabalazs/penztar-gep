#!/usr/bin/env python3
"""Dzsámi angyallal és felhővel – a főoldal „Látogasson el hozzánk” részének asztali illusztrációja.

Forrás: assets/illusztraciok/web/dzsami-szepia.svg (a kupola külön rétegen: #kupola).
Eredmény: assets/illusztraciok/web/dzsami-szepia-angyal.svg

A jelenet (26 mp-es ciklus, végtelenítve):
  1. Balról, a dzsámi fölött egy kis felhő szép lassan közeledik.
  2. Közben a kupola a jobb peremén fedélként TELJESEN kinyílik jobbra (kb. 105°, kis rugózással),
     a nyílásból aranyfény árad.
  3. A felhő lelassul, és picit a dzsámitól balra megáll (enyhén lebeg).
  4. A tetőn kirepül egy angyal (csapkodó szárny, glória), átrepül a felhőre és ráül.
  5. A kupola visszacsukódik (kis zökkenés, a félhold–kereszt meglendül).
  6. Az angyal a felhőn ülve fütyülni kezd (kótafejek szállnak a szájától), lábát lógázza,
     és a felhővel együtt szépen elhaladnak a dzsámi fölött, tovább és tovább, majd kiúsznak a jelenetből.
A rajz jóval szélesebb és magasabb lett, mint maga a dzsámi (a felhő útja miatt); a weboldalon
az üres részt tölti ki (object-fit: cover), így a dzsámi mérete ugyanaz marad, a szélein a jelenet
lágyan elhalványul. Mozgáscsökkentést kérő gépen semmi nem mozog, angyal és felhő nem látszik.
Futtatás a repó gyökeréből:  python3 eszkozok/illusztraciok/angyal.py
"""
import os, re

GYOKER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
FORRAS = os.path.join(GYOKER, "assets/illusztraciok/web/dzsami-szepia.svg")
CEL = os.path.join(GYOKER, "assets/illusztraciok/web/dzsami-szepia-angyal.svg")
FENT = 400          # ennyi hely került a rajz fölé
OLDAL = 1700        # ennyi hely került a rajz mindkét oldalára
C = "26s"           # ciklusidő
ARANY = "#c9973f"

s = open(FORRAS, encoding="utf-8").read()

# ---- 1) nagyobb vászon ----
x0, y0, w0, h0 = 207.667, -68.3333, 1032, 1125
s = s.replace(f'viewBox="207.667 -68.3333 1032 1125"',
              f'viewBox="{x0 - OLDAL:.3f} {y0 - FENT:.4f} {w0 + 2 * OLDAL} {h0 + FENT}" preserveAspectRatio="xMidYMax meet"', 1)
s = s.replace('aria-label="Gázi Kászim pasa dzsámija – mozgó"',
              'aria-label="Gázi Kászim pasa dzsámija – a kupolából angyal száll ki, felhőn ülve fütyülve tovaúszik"', 1)

# ---- 2) kupola: zsanér a jobb alsó peremen + tömör héj (csak nyitva látszik) ----
s = s.replace('<g id="kupola" class="resz" style="transform-origin:50.2% 89.4%">',
              '<g id="kupola" class="resz" style="transform-origin:98.7% 97.5%">', 1)
_kup = s[s.find('<g id="kupola"'):]
_pts = [tuple(map(float, m)) for m in re.findall(r"(-?\d+(?:\.\d+)?)[ ,](-?\d+(?:\.\d+)?)", re.search(r'<path d="([^"]*)"', _kup).group(1))]
def _burok(p):
    p = sorted(set(p))
    cr = lambda o, a, b: (a[0]-o[0])*(b[1]-o[1]) - (a[1]-o[1])*(b[0]-o[0])
    lo, hi = [], []
    for q in p:
        while len(lo) >= 2 and cr(lo[-2], lo[-1], q) <= 0: lo.pop()
        lo.append(q)
    for q in reversed(p):
        while len(hi) >= 2 and cr(hi[-2], hi[-1], q) <= 0: hi.pop()
        hi.append(q)
    return lo[:-1] + hi[:-1]
HEJ = '<path class="kup-hej" d="M' + " L".join(f"{x:.1f} {y:.1f}" for x, y in _burok(_pts)) + ' Z"/>'
s = s.replace('<g id="kupola" class="resz" style="transform-origin:98.7% 97.5%">',
              '<g id="kupola" class="resz" style="transform-origin:98.7% 97.5%">' + HEJ, 1)

# ---- 3) stílus és forgatókönyv ----
ST = """<style>svg{color:#2b3c53;--ill-hatter:#fffdf8}.resz{transform-box:fill-box}
.takaro{fill:var(--ill-hatter,#fff)}.perem{opacity:0}
#repulo,#ulo,#feny,#sugarak,.kup-hej,#felho{opacity:0}
.kup-hej{fill:var(--ill-hatter,#fff)}
#repulo,#felho{transform-box:view-box;transform-origin:0 0}
.vb{transform-box:view-box}
#szb{transform-origin:-12px -66px}#szj{transform-origin:12px -66px}
#lab{transform-origin:40px -6px}#ulo-szarny{transform-origin:-8px -92px}#fej{transform-origin:6px -104px}
#feny,#sugarak{transform-box:fill-box;transform-origin:50% 100%}
.a-vonal{fill:var(--ill-hatter,#fff);stroke:currentColor;stroke-width:3.4;stroke-linejoin:round;stroke-linecap:round}
.a-reszlet{fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.a-arany{fill:none;stroke:ARANY;stroke-width:4;stroke-linecap:round}
.kota{fill:ARANY;stroke:ARANY;stroke-width:2.4;stroke-linecap:round;opacity:0;transform-box:fill-box;transform-origin:50% 100%}
.f-kulso{fill:var(--ill-hatter,#fff);stroke:currentColor;stroke-width:7}
.f-belso{fill:var(--ill-hatter,#fff)}
.szikra{opacity:0;transform-box:fill-box;transform-origin:50% 50%}
@media (prefers-reduced-motion:no-preference){
#felho{animation:felho C linear infinite}
#felho .lebeg{animation:lebeg 2.6s ease-in-out infinite alternate}
#kupola{animation:fedel C cubic-bezier(.45,.05,.25,1) infinite}
#kupola .perem{animation:perem C linear infinite}
#kupola .kup-hej{animation:hej C linear infinite}
#jelkep{animation:jel C ease-in-out infinite}
#feny{animation:feny C ease-in-out infinite}
#sugarak{animation:sugar C ease-in-out infinite}
#repulo{animation:repul C linear infinite}
#repulo .test{animation:bob .9s ease-in-out infinite alternate}
#szb{animation:csapb .5s ease-in-out infinite alternate}
#szj{animation:csapj .5s ease-in-out infinite alternate}
#ulo{animation:ul C linear infinite}
#lab{animation:lograz 1.3s ease-in-out infinite alternate}
#ulo-szarny{animation:szarnyring 3.2s ease-in-out infinite alternate}
#fej{animation:dallam 1.3s ease-in-out infinite alternate}
.kota{animation:kota 2.6s ease-out infinite}
.szikra{animation:szikra 6s ease-in-out infinite}
}
/* felhő: balról lassan közeledik, lelassul, picit a dzsámitól balra megáll, majd az angyallal a dzsámi fölött tovaúszik jobbra, ki a jelenetből */
@keyframes felho{0%{opacity:1;transform:translate(-2600px,-62px)}
 10%{transform:translate(-1500px,-70px)}20%{transform:translate(-560px,-76px)}26%{transform:translate(60px,-74px)}
 29%{transform:translate(215px,-70px)}31%{transform:translate(250px,-68px)}
 42%{transform:translate(250px,-68px);animation-timing-function:ease-in}
 50%{transform:translate(520px,-92px)}60%{transform:translate(1000px,-104px)}70%{transform:translate(1500px,-100px)}
 80%{transform:translate(2050px,-90px)}92%{opacity:1;transform:translate(2750px,-80px)}
 92.1%,100%{opacity:0;transform:translate(2750px,-80px)}}
@keyframes lebeg{from{transform:translateY(-5px)}to{transform:translateY(5px)}}
/* kupola: rándulás, majd teljesen kinyílik jobbra (rugózik), nyitva vár, az angyal után visszacsukódik */
@keyframes fedel{0%,17%{transform:rotate(0)}18%{transform:rotate(1.5deg)}19%{transform:rotate(-.7deg)}20%{transform:rotate(0)}
 26%{transform:translate(4px,-6px) rotate(110deg)}27.5%{transform:translate(4px,-6px) rotate(101deg)}29%{transform:translate(4px,-6px) rotate(106deg)}30%,40%{transform:translate(4px,-6px) rotate(105deg)}
 45.5%{transform:rotate(-1.2deg)}46.6%{transform:translate(0,-10px) rotate(2.8deg)}47.8%{transform:rotate(0)}48.6%{transform:translate(0,-3px) rotate(.6deg)}49.4%,100%{transform:rotate(0)}}
@keyframes perem{0%,20.5%{opacity:0}22%,44%{opacity:1}45%,100%{opacity:0}}
@keyframes hej{0%,20.4%{opacity:0}21%,45%{opacity:1}45.6%,100%{opacity:0}}
@keyframes jel{0%,45.5%,100%{transform:rotate(0)}47%{transform:rotate(-9deg)}49%{transform:rotate(6deg)}51%{transform:rotate(-3deg)}53%{transform:rotate(1deg)}55%{transform:rotate(0)}}
@keyframes feny{0%,21%{opacity:0;transform:scale(.6,.2)}26%{opacity:.95;transform:scale(1,1)}36%{opacity:.85;transform:scale(1.05,1.1)}42%{opacity:.55;transform:scale(1,1)}45.5%,100%{opacity:0;transform:scale(.7,.25)}}
@keyframes sugar{0%,22%{opacity:0;transform:scaleY(.1)}28%{opacity:.85;transform:scaleY(1)}37%{opacity:.6;transform:scaleY(1.06)}43%{opacity:.3;transform:scaleY(.95)}45.5%,100%{opacity:0;transform:scaleY(.2)}}
/* repülő angyal: kiemelkedik a tetőn, ívben átrepül a felhőre */
@keyframes repul{0%,30%{opacity:0;transform:translate(718px,430px) scale(.6) rotate(0)}
 30.6%{opacity:1;transform:translate(718px,410px) scale(.62) rotate(0)}
 33%{opacity:1;transform:translate(716px,200px) scale(.8) rotate(-3deg)}
 35%{opacity:1;transform:translate(660px,40px) scale(.84) rotate(-10deg)}
 37%{opacity:1;transform:translate(470px,-110px) scale(.84) rotate(-16deg)}
 38.6%{opacity:1;transform:translate(248px,-210px) scale(.82) rotate(-6deg)}
 39.4%,100%{opacity:0;transform:translate(242px,-214px) scale(.8) rotate(0)}}
@keyframes bob{from{transform:translateY(-3px)}to{transform:translateY(4px)}}
@keyframes csapb{from{transform:rotate(14deg)}to{transform:rotate(-22deg)}}
@keyframes csapj{from{transform:rotate(-14deg)}to{transform:rotate(22deg)}}
/* ülő angyal (a felhőn): leszállás után jelenik meg, a felhővel együtt halad */
@keyframes ul{0%,38.8%{opacity:0}39.6%,100%{opacity:1}}
@keyframes lograz{from{transform:rotate(-14deg)}to{transform:rotate(12deg)}}
@keyframes szarnyring{from{transform:rotate(-4deg)}to{transform:rotate(5deg)}}
@keyframes dallam{from{transform:rotate(-4deg)}to{transform:rotate(5deg)}}
@keyframes kota{0%{opacity:0;transform:translate(0,0) scale(.4) rotate(0)}12%{opacity:1}
 60%{opacity:.9;transform:translate(34px,-48px) scale(1) rotate(10deg)}100%{opacity:0;transform:translate(62px,-96px) scale(1.15) rotate(-8deg)}}
@keyframes szikra{0%,80%,100%{opacity:0;transform:scale(.2) rotate(0)}86%{opacity:1;transform:scale(1) rotate(45deg)}92%{opacity:0;transform:scale(.3) rotate(90deg)}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}</style>"""
ST = ST.replace("ARANY", ARANY).replace(" C ", f" {C} ")
s = re.sub(r"<style>.*?</style>", lambda m: ST, s, count=1, flags=re.S)

# ---- 4) fény a nyílásban (a kupola mögött) ----
FENY = """<defs>
<radialGradient id="g-feny" cx="50%" cy="100%" r="75%"><stop offset="0" stop-color="#fff6d8"/><stop offset=".45" stop-color="#f3d58a" stop-opacity=".75"/><stop offset="1" stop-color="#e9b957" stop-opacity="0"/></radialGradient>
<linearGradient id="g-sugar" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#f5d98f" stop-opacity=".85"/><stop offset="1" stop-color="#f5d98f" stop-opacity="0"/></linearGradient>
<clipPath id="ki-nyilas"><rect x="-2000" y="-800" width="5000" height="1106"/></clipPath>
</defs>
<g id="sugarak"><path fill="url(#g-sugar)" d="M700 302 L560 -40 L612 -46 Z M712 302 L660 -90 L700 -92 Z M724 302 L740 -95 L778 -90 Z M736 302 L830 -60 L878 -48 Z M748 302 L930 0 L968 18 Z M690 302 L470 10 L505 -6 Z"/></g>
<ellipse id="feny" cx="722" cy="300" rx="300" ry="120" fill="url(#g-feny)"/>
"""
i = s.find('<g id="kupola"'); s = s[:i] + FENY + s[i:]

# ---- 5) repülő angyal (a kupola előtt) ----
SZARNY = """<path class="a-vonal" d="M-12 -66 C-40 -96 -86 -128 -150 -150 C-178 -158 -196 -152 -186 -136 C-196 -128 -194 -116 -180 -112 C-192 -102 -188 -90 -172 -88 C-182 -76 -176 -64 -158 -64 C-164 -52 -156 -42 -138 -44 C-140 -32 -128 -26 -112 -30 C-110 -18 -96 -14 -82 -22 C-72 -10 -54 -14 -44 -26 C-30 -36 -18 -50 -12 -66 Z"/>
<path class="a-reszlet" d="M-30 -60 C-70 -86 -110 -110 -160 -136 M-36 -48 C-80 -70 -124 -88 -164 -98 M-40 -38 C-84 -50 -120 -60 -150 -70 M-44 -32 C-76 -38 -104 -42 -128 -46 M-48 -28 C-66 -30 -84 -30 -100 -30"/>"""
REPULO = f"""<g clip-path="url(#ki-nyilas)"><g id="repulo"><g class="test">
<g id="szb" class="vb">{SZARNY}</g>
<g id="szj" class="vb"><g transform="scale(-1,1)">{SZARNY}</g></g>
<path class="a-vonal" d="M-22 -70 C-30 -40 -44 10 -60 60 C-70 92 -74 112 -64 126 C-44 118 -30 132 -12 122 C4 134 22 120 38 128 C54 120 70 124 76 110 C70 80 56 30 40 -20 C34 -44 28 -60 22 -70 C8 -78 -8 -78 -22 -70 Z"/>
<path class="a-reszlet" d="M-8 -40 C-14 0 -22 50 -30 112 M8 -40 C10 0 14 50 22 116 M-36 30 C-40 60 -46 88 -50 110 M40 26 C46 56 54 84 60 106 M-26 -58 C-10 -50 10 -50 26 -58"/>
<path class="a-vonal" d="M-20 -64 C-38 -50 -52 -40 -62 -30 C-66 -24 -60 -18 -54 -22 C-44 -30 -32 -40 -18 -46 Z"/>
<path class="a-vonal" d="M20 -64 C38 -50 52 -40 62 -30 C66 -24 60 -18 54 -22 C44 -30 32 -40 18 -46 Z"/>
<circle class="a-vonal" cx="0" cy="-98" r="19"/>
<path class="a-reszlet" d="M-17 -104 C-12 -120 12 -122 18 -104 M-18 -100 C-24 -88 -22 -78 -16 -72 M18 -100 C24 -88 22 -78 16 -72 M-6 -96 L-5 -95 M6 -96 L7 -95 M-4 -88 C-1 -86 2 -86 5 -88"/>
<ellipse class="a-arany" cx="0" cy="-128" rx="24" ry="7"/>
</g></g></g>
"""

# ---- 6) felhő ülő, fütyülő angyallal (oldalnézet, a haladás iránya, jobbra néz) ----
KORO = [(-150, 10, 52), (-92, -26, 66), (-20, -46, 74), (58, -32, 66), (124, -4, 56), (172, 22, 40), (-190, 30, 36),
        (-110, 40, 46), (-30, 44, 50), (50, 42, 50), (126, 38, 44)]
KULSO = "".join(f'<circle class="f-kulso" cx="{x}" cy="{y}" r="{r}"/>' for x, y, r in KORO)
BELSO = "".join(f'<circle class="f-belso" cx="{x}" cy="{y}" r="{r}"/>' for x, y, r in KORO)
KOTA = """<path d="M0 0 C-5 -1 -9 3 -7 7 C-5 11 3 10 5 5 L5 -22 C10 -18 16 -16 18 -9" fill-opacity=".9" style="fill:none"/><ellipse cx="-1" cy="4" rx="6.5" ry="4.6" transform="rotate(-20 -1 4)"/>"""
ULO = f"""<g id="ulo" transform="translate(-8 -66) scale(.92)">
<g id="ulo-szarny"><path class="a-vonal" d="M-8 -92 C-30 -118 -60 -150 -104 -160 C-122 -163 -128 -150 -116 -142 C-130 -136 -128 -122 -112 -120 C-124 -110 -118 -98 -102 -98 C-110 -86 -100 -76 -86 -80 C-88 -66 -74 -60 -62 -68 C-58 -54 -42 -54 -34 -66 C-22 -72 -12 -80 -8 -92 Z"/>
<path class="a-reszlet" d="M-20 -88 C-46 -110 -76 -132 -108 -150 M-26 -78 C-54 -94 -84 -110 -110 -118 M-32 -72 C-56 -82 -80 -90 -98 -96"/></g>
<path class="a-vonal" d="M-14 -96 C-28 -70 -34 -36 -34 -8 C-34 2 -24 6 -14 4 L52 4 C62 4 66 -6 60 -12 C50 -20 30 -22 14 -24 C16 -50 16 -76 12 -96 C4 -102 -6 -102 -14 -96 Z"/>
<path class="a-reszlet" d="M-4 -86 C-10 -60 -14 -34 -16 -6 M6 -74 C6 -54 4 -36 2 -22 M18 -18 C30 -16 42 -12 52 -6"/>
<g id="lab"><path class="a-vonal" d="M34 -8 C42 12 48 30 50 44 C51 52 58 56 66 54 C72 52 72 46 66 44 C60 42 58 38 58 32 C56 18 52 4 50 -6 Z"/></g>
<path class="a-vonal" d="M10 -84 C24 -70 34 -52 40 -34 C42 -28 36 -24 32 -28 C24 -44 14 -60 2 -72 Z"/>
<g id="fej"><circle class="a-vonal" cx="6" cy="-118" r="17"/>
<path class="a-reszlet" d="M-11 -122 C-8 -138 12 -142 20 -128 M-11 -118 C-16 -106 -12 -96 -6 -92 M13 -122 L14 -121"/>
<circle class="a-vonal" cx="24.5" cy="-110" r="3.4" style="stroke-width:2.4"/>
<ellipse class="a-arany" cx="2" cy="-146" rx="20" ry="6" transform="rotate(-10 2 -146)"/>
<g transform="translate(30 -112)"><g class="kota" style="animation-delay:0s">{KOTA}</g></g>
<g transform="translate(30 -112)"><g class="kota" style="animation-delay:.87s">{KOTA}</g></g>
<g transform="translate(30 -112)"><g class="kota" style="animation-delay:1.73s">{KOTA}</g></g>
</g>
</g>"""
FELHO = f"""<g id="felho"><g class="lebeg"><g transform="scale(1.3)">
<g>{KULSO}{BELSO}</g>
<path class="a-reszlet" d="M-146 18 C-140 2 -124 -6 -108 -2 M96 8 C104 -6 122 -10 136 0 M-8 -6 C2 -18 20 -20 32 -12"/>
{ULO}
</g></g></g>
"""
i = s.find('<g transform="translate(758 40)')
s = s[:i] + REPULO + FELHO + s[i:]

open(CEL, "w", encoding="utf-8").write(s)
print("Kész:", os.path.relpath(CEL, GYOKER), len(s), "bájt")
