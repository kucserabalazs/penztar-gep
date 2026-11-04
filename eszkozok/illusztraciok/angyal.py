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
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import angyal_rajz as AR

GYOKER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
WEB = os.path.join(GYOKER, "assets/illusztraciok/web")
C = "26s"           # ciklusidő
ARANY = "#c9973f"
SZAM = r"(-?\d+(?:\.\d+)?)[ ,](-?\d+(?:\.\d+)?)"

def kupola_pontok(svg):
    k = svg[svg.find('<g id="kupola"'):]
    return [tuple(map(float, m)) for m in re.findall(SZAM, re.search(r'<path d="([^"]*)"', k).group(1))]

def doboz(p):
    xs = [a for a, _ in p]; ys = [b for _, b in p]
    return min(xs), min(ys), max(xs) - min(xs)

# a jelenet minden mérete az önálló dzsámi-rajz kupolájához van szabva; más rajzon ehhez arányítunk
REF = doboz(kupola_pontok(open(os.path.join(WEB, "dzsami-szepia.svg"), encoding="utf-8").read()))

def jelenet(forras, cel, fent, oldal=0, hatter="#fffdf8", felho_emel=0, szobor_mogott=False, cimke=""):
    """forras: az eredeti (mozgó) rajz; fent/oldal: plusz hely a rajz fölött / két oldalán (a rajz saját egységeiben);
    felho_emel: a felhő útja a dzsámi fölött ennyivel magasabban halad (a jelenet egységeiben, negatív = feljebb);
    szobor_mogott: a felhő a lovasszobor mögött úszik (Széchenyi tér)."""
    s = open(os.path.join(WEB, forras), encoding="utf-8").read()

    # ---- 1) nagyobb vászon ----
    vb = re.search(r'viewBox="([^"]*)"', s)
    x0, y0, w0, h0 = map(float, vb.group(1).split())
    s = s.replace(vb.group(0), f'viewBox="{x0 - oldal:.3f} {y0 - fent:.4f} {w0 + 2 * oldal:.3f} {h0 + fent:.4f}" preserveAspectRatio="xMidYMax meet"', 1)
    s = re.sub(r'aria-label="([^"]*?)( – mozgó)?"', lambda m: f'aria-label="{m.group(1)} – {cimke}"', s, count=1)
    VB = (x0 - oldal, y0 - fent, w0 + 2 * oldal, h0 + fent)

    # a jelenet (önálló dzsámi egységei) → ennek a rajznak az egységei
    bx, by, bw = doboz(kupola_pontok(s))
    k = bw / REF[2]; dx = bx - REF[0] * k; dy = by - REF[1] * k
    TR = f'translate({dx:.2f} {dy:.2f}) scale({k:.4f})'

    # ---- 2) kupola: zsanér a jobb alsó peremen + tömör héj (csak nyitva látszik) ----
    s = re.sub(r'<g id="kupola" class="resz" style="transform-origin:[^"]*">', '<g id="kupola" class="resz" style="transform-origin:98.7% 97.5%">', s, count=1)
    HEJ = '<path class="kup-hej" d="M' + " L".join(f"{x:.1f} {y:.1f}" for x, y in burok(kupola_pontok(s))) + ' Z"/>'
    s = s.replace('<g id="kupola" class="resz" style="transform-origin:98.7% 97.5%">',
                  '<g id="kupola" class="resz" style="transform-origin:98.7% 97.5%">' + HEJ, 1)
    return s, TR, VB, hatter, felho_emel, szobor_mogott, cel

def burok(p):
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

# ---- 3) stílus és forgatókönyv ----
ST = AR.CSS + """svg{--ill-hatter:HATTER}.resz{transform-box:fill-box}
.perem{opacity:0}
#repulo,#ulo,#ulo-arnyek,#feny,#sugarak,.kup-hej,#felho{opacity:0}
.kup-hej{fill:var(--ill-hatter,#fff)}
#repulo,#felho{transform-box:view-box;transform-origin:0 0}
.vb{transform-box:view-box}
#feny,#sugarak{transform-box:fill-box;transform-origin:50% 100%}
.a-vonal{fill:var(--ill-hatter,#fff);stroke:currentColor;stroke-width:3.4;stroke-linejoin:round;stroke-linecap:round}
.a-reszlet{fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.a-arany{fill:none;stroke:ARANY;stroke-width:4;stroke-linecap:round}
.kota{fill:ARANY;stroke:ARANY;stroke-width:2.4;stroke-linecap:round;opacity:0;transform-box:fill-box;transform-origin:50% 100%}
.f-kulso{fill:var(--ill-hatter,#fff);stroke:currentColor;stroke-width:7}
.f-belso{fill:var(--ill-hatter,#fff)}
@media (prefers-reduced-motion:no-preference){
#felho{animation:aj-felho C linear infinite}
#felho .lebeg{animation:aj-lebeg 2.6s ease-in-out infinite alternate}
#kupola{animation:aj-fedel C cubic-bezier(.45,.05,.25,1) infinite}
#kupola .perem{animation:aj-perem C linear infinite}
#kupola .kup-hej{animation:aj-hej C linear infinite}
#jelkep,#felhold{animation:aj-jel C ease-in-out infinite}
#feny{animation:aj-feny C ease-in-out infinite}
#sugarak{animation:aj-sugar C ease-in-out infinite}
#repulo{animation:aj-repul C linear infinite}
#repulo .test{animation:aj-bob .9s ease-in-out infinite alternate}
#szb{animation:aj-csapb .5s ease-in-out infinite alternate}
#szj{animation:aj-csapb .5s ease-in-out infinite alternate}
#ulo,#ulo-arnyek{animation:aj-ul C linear infinite}
#labb{animation:aj-lograz 1.3s ease-in-out infinite alternate}#labj{animation:aj-lograz 1.3s ease-in-out -.65s infinite alternate}
#ulo-szarny{animation:aj-szarnyring 3.2s ease-in-out infinite alternate}
#fej{animation:aj-dallam 1.3s ease-in-out infinite alternate}
.kota{animation:aj-kota 2.6s ease-out infinite}
}
/* felhő: balról lassan közeledik, lelassul, picit a dzsámitól balra megáll, majd az angyallal a dzsámi fölött tovaúszik jobbra, ki a jelenetből */
@keyframes aj-felho{0%{opacity:1;transform:translate(-2600px,-62px)}
 10%{transform:translate(-1500px,-70px)}20%{transform:translate(-560px,-76px)}26%{transform:translate(60px,-74px)}
 29%{transform:translate(215px,-70px)}31%{transform:translate(250px,-68px)}
 42%{transform:translate(250px,-68px);animation-timing-function:ease-in}
 50%{transform:translate(520px,Y1px)}60%{transform:translate(1000px,Y2px)}70%{transform:translate(1500px,Y3px)}
 80%{transform:translate(2050px,Y4px)}92%{opacity:1;transform:translate(2750px,Y5px)}
 92.1%,100%{opacity:0;transform:translate(2750px,Y5px)}}
@keyframes aj-lebeg{from{transform:translateY(-5px)}to{transform:translateY(5px)}}
/* kupola: rándulás, majd teljesen kinyílik jobbra (rugózik), nyitva vár, az angyal után visszacsukódik */
@keyframes aj-fedel{0%,17%{transform:rotate(0)}18%{transform:rotate(1.5deg)}19%{transform:rotate(-.7deg)}20%{transform:rotate(0)}
 26%{transform:translate(4px,-6px) rotate(110deg)}27.5%{transform:translate(4px,-6px) rotate(101deg)}29%{transform:translate(4px,-6px) rotate(106deg)}30%,40%{transform:translate(4px,-6px) rotate(105deg)}
 45.5%{transform:rotate(-1.2deg)}46.6%{transform:translate(0,-10px) rotate(2.8deg)}47.8%{transform:rotate(0)}48.6%{transform:translate(0,-3px) rotate(.6deg)}49.4%,100%{transform:rotate(0)}}
@keyframes aj-perem{0%,20.5%{opacity:0}22%,44%{opacity:1}45%,100%{opacity:0}}
@keyframes aj-hej{0%,20.4%{opacity:0}21%,45%{opacity:1}45.6%,100%{opacity:0}}
@keyframes aj-jel{0%,45.5%,100%{transform:rotate(0)}47%{transform:rotate(-9deg)}49%{transform:rotate(6deg)}51%{transform:rotate(-3deg)}53%{transform:rotate(1deg)}55%{transform:rotate(0)}}
@keyframes aj-feny{0%,21%{opacity:0;transform:scale(.6,.2)}26%{opacity:.95;transform:scale(1,1)}36%{opacity:.85;transform:scale(1.05,1.1)}42%{opacity:.55;transform:scale(1,1)}45.5%,100%{opacity:0;transform:scale(.7,.25)}}
@keyframes aj-sugar{0%,22%{opacity:0;transform:scaleY(.1)}28%{opacity:.85;transform:scaleY(1)}37%{opacity:.6;transform:scaleY(1.06)}43%{opacity:.3;transform:scaleY(.95)}45.5%,100%{opacity:0;transform:scaleY(.2)}}
/* repülő angyal: kiemelkedik a tetőn, ívben átrepül a felhőre */
@keyframes aj-repul{0%,30%{opacity:0;transform:translate(718px,430px) scale(.86) rotate(0)}
 30.6%{opacity:1;transform:translate(718px,410px) scale(.9) rotate(0)}
 33%{opacity:1;transform:translate(716px,200px) scale(1.08) rotate(-3deg)}
 35%{opacity:1;transform:translate(660px,40px) scale(1.22) rotate(-10deg)}
 37%{opacity:1;transform:translate(470px,-120px) scale(1.3) rotate(-14deg)}
 38.6%{opacity:1;transform:translate(236px,-191px) scale(1.36) rotate(-3deg)}
 38.95%{opacity:1;transform:translate(232px,-191px) scale(1.36) rotate(0)}
 39.15%,100%{opacity:0;transform:translate(232px,-191px) scale(1.36) rotate(0)}}
@keyframes aj-bob{from{transform:translateY(-3px)}to{transform:translateY(4px)}}
@keyframes aj-csapb{from{transform:rotate(14deg)}to{transform:rotate(-22deg)}}
@keyframes aj-csapj{from{transform:rotate(-14deg)}to{transform:rotate(22deg)}}
/* ülő angyal (a felhőn): leszállás után jelenik meg, a felhővel együtt halad */
@keyframes aj-ul{0%,38.85%{opacity:0}39.1%,100%{opacity:1}}
#ulo-arnyek{opacity:0}
@keyframes aj-lograz{from{transform:rotate(-14deg)}to{transform:rotate(12deg)}}
@keyframes aj-szarnyring{from{transform:rotate(-4deg)}to{transform:rotate(5deg)}}
@keyframes aj-dallam{from{transform:rotate(-4deg)}to{transform:rotate(5deg)}}
@keyframes aj-kota{0%{opacity:0;transform:translate(0,0) scale(.4) rotate(0)}12%{opacity:1}
 60%{opacity:.9;transform:translate(34px,-48px) scale(1) rotate(10deg)}100%{opacity:0;transform:translate(62px,-96px) scale(1.15) rotate(-8deg)}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}"""

# ---- 4) fény a nyílásban (a kupola mögött) ----
FENY = """<defs>""" + AR.DEFS + """
<radialGradient id="g-feny" cx="50%" cy="100%" r="75%"><stop offset="0" stop-color="#fff6d8"/><stop offset=".45" stop-color="#f3d58a" stop-opacity=".75"/><stop offset="1" stop-color="#e9b957" stop-opacity="0"/></radialGradient>
<linearGradient id="g-sugar" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#f5d98f" stop-opacity=".85"/><stop offset="1" stop-color="#f5d98f" stop-opacity="0"/></linearGradient>
<clipPath id="ki-nyilas"><rect x="-2000" y="-800" width="5000" height="1106"/></clipPath>
</defs>
<g id="sugarak"><path fill="url(#g-sugar)" d="M700 302 L560 -40 L612 -46 Z M712 302 L660 -90 L700 -92 Z M724 302 L740 -95 L778 -90 Z M736 302 L830 -60 L878 -48 Z M748 302 L930 0 L968 18 Z M690 302 L470 10 L505 -6 Z"/></g>
<ellipse id="feny" cx="722" cy="300" rx="300" ry="120" fill="url(#g-feny)"/>
"""

# ---- 5) repülő angyal (a kupola előtt) ----
SZARNY = """<path class="a-vonal" d="M-12 -66 C-40 -96 -86 -128 -150 -150 C-178 -158 -196 -152 -186 -136 C-196 -128 -194 -116 -180 -112 C-192 -102 -188 -90 -172 -88 C-182 -76 -176 -64 -158 -64 C-164 -52 -156 -42 -138 -44 C-140 -32 -128 -26 -112 -30 C-110 -18 -96 -14 -82 -22 C-72 -10 -54 -14 -44 -26 C-30 -36 -18 -50 -12 -66 Z"/>
<path class="a-reszlet" d="M-30 -60 C-70 -86 -110 -110 -160 -136 M-36 -48 C-80 -70 -124 -88 -164 -98 M-40 -38 C-84 -50 -120 -60 -150 -70 M-44 -32 C-76 -38 -104 -42 -128 -46 M-48 -28 C-66 -30 -84 -30 -100 -30"/>"""
REPULO = f"""<g clip-path="url(#ki-nyilas)"><g id="repulo"><g class="test"><g transform="scale(2.2)">{AR.REPULO_ANGYAL}</g></g></g></g>
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
FELHO = f"""<g id="felho"><g class="lebeg"><g transform="scale(1.3)">{AR.felho_rajz("aj-felho-klip")}<ellipse id="ulo-arnyek" cx="-14" cy="-68" rx="36" ry="7" fill="currentColor" opacity=".13"/><g id="ulo" transform="translate(-14 -95) scale(2.3)">{AR.ULO_ANGYAL}</g></g></g></g>
"""

def befejez(s, TR, VB, hatter, felho_emel, szobor_mogott, cel):
    st = ST.replace("ARANY", ARANY).replace(" C ", f" {C} ").replace("HATTER", hatter)
    for n, y in zip(("Y1", "Y2", "Y3", "Y4", "Y5"), (-92, -104, -100, -90, -80)):
        st = st.replace(n, str(y + felho_emel))
    s = s.replace("</style>", st + "</style>", 1)
    i = s.find('<g id="kupola"'); s = s[:i] + FENY.replace("<g id=\"sugarak\">", f'<g transform="{TR}"><g id="sugarak">', 1).replace('fill="url(#g-feny)"/>\n', 'fill="url(#g-feny)"/></g>\n', 1) + s[i:]
    vege = s.rfind("</g>", 0, s.rfind("</svg>"))
    rep = f'<g transform="{TR}">{REPULO}</g>'
    fel = f'<g transform="{TR}">{FELHO}</g>'
    if szobor_mogott and '<g id="szobor"' in s:
        s = s[:vege] + rep + s[vege:]
        j = s.find('<g id="szobor"'); s = s[:j] + fel + s[j:]
    else:
        s = s[:vege] + fel + rep + s[vege:]
    open(os.path.join(WEB, cel), "w", encoding="utf-8").write(s)
    print("Kész:", cel, len(s), "bájt", "viewBox:", " ".join(f"{v:.1f}" for v in VB))

def keszit(forras, cel, **kw):
    befejez(*jelenet(forras, cel, **kw))

if __name__ == "__main__":
    CIM_D = "a kupolából angyal száll ki, felhőn ülve fütyülve tovaúszik"
    CIM_SZ = "a dzsámi kupolájából angyal száll ki, felhőn ülve fütyülve tovaúszik"
    # önálló dzsámi: széles (üres részek kitöltése, object-fit: cover) és keskenyebb (háttérképnek)
    keszit("dzsami-szepia.svg", "dzsami-szepia-angyal.svg", fent=400, oldal=1700, cimke=CIM_D)
    keszit("dzsami-szepia.svg", "dzsami-szepia-angyal-kicsi.svg", fent=400, oldal=700, cimke=CIM_D)
    # Széchenyi tér (dzsámi + lovasszobor): a felhő a szobor mögött, az égen úszik
    keszit("szechenyi-ter-szepia.svg", "szechenyi-ter-szepia-angyal.svg", fent=170, hatter="#fbf7ee", szobor_mogott=True, felho_emel=-40, cimke=CIM_SZ)
    keszit("szechenyi-ter-arany.svg", "szechenyi-ter-arany-angyal.svg", fent=170, hatter="#fbf7ee", szobor_mogott=True, felho_emel=-40, cimke=CIM_SZ)
