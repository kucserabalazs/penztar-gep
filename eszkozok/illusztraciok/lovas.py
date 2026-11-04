#!/usr/bin/env python3
"""Hunyadi-lovasszobor feljavítása a Széchenyi téri rajzokban (a kisangyal / kisördög minőségéhez igazítva).

Megjelenés:
- bronz patina (zöldes színátmenet; az arany változatnál meleg arany), csillanó fények a ló nyakán, fején, farán
  és a lovas köpenyén, sötétebb has alatti árnyék, a bankjegyekhez illő vésett árnyékvonalak; a vonalrajz fölötte marad;
- ízületek: a ló mellső és hátsó lábpárja, valamint a lovas buzogányos karja külön rétegen, saját forgásponttal mozog
  (a szobor rajza egyszer van meg, <use>-zal több kivágásban jelenik meg);
- a lovas kardja: kidolgozott, ezüst pengéjű, arany markolatú kard, amelyet kiránt, a magasba emel, suhogtat,
  majd visszadug a hüvelybe (a hüvelyben lévő markolatot ilyenkor patinás folt takarja).

Mozgás (20 mp-es ciklus, a kulcskockákat a program tizedmásodpercenként számolja ki):
   0.0– 7.0  nyugalom a talapzaton
   7.0– 9.6  lekuporodik, parabolaíven leugrik (orral fel, majd le), behúzott lábakkal; földet ér, összenyomódik, visszarugózik, port ver
   9.6–12.2  négy lépést sétál balra (váltott lábpárok, a test minden lépésnél billen)
  12.2–13.4  megáll, a lovas kirántja a kardját és a magasba emeli
  13.4–17.0  a ló ágaskodik (lendület, túllendülés, kapáló mellső lábak), a lovas suhogtatja a kardot és rázza a buzogányt
  17.0–19.6  leérkezik (por), lekuporodik, visszaugrik a talapzatra, megérkezik, rugózik, port ver
  19.3–20.0  a lovas visszadugja a kardot
Futtatás a repó gyökeréből (a gen.py után, az angyal.py előtt):  python3 eszkozok/illusztraciok/lovas.py
"""
import os, re, math

GYOKER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
WEB = os.path.join(GYOKER, "assets/illusztraciok/web")
JEL = "<!--lovas-v4-->"
T = 26.0
D = 305                         # a talapzat tetejétől a földig
X1, XB, XR = -200, -350, 262    # földet érés; a megkerülés kezdete (balra, a talapzattól szabadon); jobb oldal (a talapzat mögött)
HATRA, HSK = 16, .93            # a talapzat mögött: ennyivel hátrébb (feljebb) jár, ekkora (távolabb van)
FORGO = (1746, 357)             # a szobor forgáspontja: a hátsó paták (ágaskodás, összenyomódás)
KOZEP = 1612                    # a megforduláshoz: a szobor függőleges középvonala
TALAPZAT = "1478,355 1800,355 1813,398 1803,415 1813,618 1833,622 1833,662 1852,664 1852,702 1428,702 1428,664 1460,662 1460,622 1480,618 1482,415 1469,398"
ELSO_POLI = "1486,256 1606,246 1612,362 1478,362"
HATSO_POLI = "1638,268 1752,262 1758,300 1774,362 1634,362"
KAR_POLI = "1503,40 1584,36 1608,86 1608,114 1556,116 1503,92"
ELSO_F, HATSO_F, KAR_F = (1546, 258), (1700, 266), (1601, 101)
OKOL, HUVELY, HUV_SZOG = (1610, 126), (1638, 148), 164.75
TAKAR_POLI = "1625,121 1653,121 1658,172 1629,175"
PATAK_E, PATAK_H = (1515, 1546), (1672, 1760)

def cl(x, a=0., b=1.): return max(a, min(b, x))
def seg(t, a, b): return cl((t - a) / (b - a))
def lerp(a, b, u): return a + (b - a) * u
def eio(u): return 3 * u * u - 2 * u * u * u
def eo(u): return 1 - (1 - u) ** 3
def ei(u): return u ** 3
def eob(u, s=1.6): u -= 1; return 1 + (s + 1) * u ** 3 + s * u ** 2      # túllendüléses kifutás

def ugras(u, A, B, magas):
    """parabolaív A=(x,y) → B=(x,y); magas = mennyivel megy a két végpont egyenese fölé"""
    return (lerp(A[0], B[0], u), lerp(A[1], B[1], u) - 4 * magas * u * (1 - u))

def erkezes(u, y0, rx, sk):
    """földet érés: összenyomódás és visszarugózás; (y, sx, sy) – sk az alapméret"""
    if u < .25: k = u / .25; return (y0 + 5 * k, sk * (1 + .06 * k), sk * (1 - .09 * k))
    if u < .6: k = (u - .25) / .35; return (y0 + lerp(5, -3, eio(k)), sk * lerp(1.06, .99, k), sk * lerp(.91, 1.02, eio(k)))
    k = (u - .6) / .4; return (y0 + lerp(-3, 0, eio(k)), sk * lerp(.99, 1, k), sk * lerp(1.02, 1, k))

def lepes(u, n):  # séta: billegés
    return 3.2 * abs(math.sin(math.pi * n * u))

XR, XF = 400, 340               # a talapzat mögött a jobb szélen; onnan előrelép ide (elé), és innen ugrik fel

def sik(t):
    """(hátrébb lépés mértéke 0..1): a talapzat mögötti sík"""
    if t < 15.3: return 0
    if t < 20.3: return eio(seg(t, 15.3, 16.0))
    if t < 21.1: return 1 - eio(seg(t, 20.3, 21.1))
    return 0

def test(t):
    """(x, y, forgás°, skálaX, skálaY) – a szobor egésze a hátsó paták körül"""
    if t < 6.0: return (0, 0, 0, 1, 1)
    if t < 6.5: k = eio(seg(t, 6.0, 6.5)); return (0, 4 * k, 0, 1 + .03 * k, 1 - .06 * k)
    if t < 8.0:
        u = seg(t, 6.5, 8.0); x, y = ugras(u, (0, 4), (X1, D), 115)
        st = cl(1 - u / .18); return (x, y, lerp(-7, 9, u), 1 - .03 * st, 1 + .05 * st)
    if t < 8.6: y, sx, sy = erkezes(seg(t, 8.0, 8.6), D, 0, 1); return (X1, y, lerp(9, 0, cl(seg(t, 8.0, 8.15))), sx, sy)
    if t < 9.4: return (X1, D, 0, 1, 1)
    if t < 12.6:
        if t < 10.1: r = 22 * eob(seg(t, 9.4, 10.1))
        elif t < 11.9: r = 19 + 3.2 * math.sin(2 * math.pi * (t - 10.1) / .9) * (1 - seg(t, 11.5, 11.9))
        else: r = 19 * (1 - ei(seg(t, 11.9, 12.6)))
        return (X1, D, r, 1, 1)
    if t < 13.0: y, sx, sy = erkezes(seg(t, 12.6, 13.0), D, 0, 1); return (X1, y, 0, sx, sy)
    if t < 14.6: u = seg(t, 13.0, 14.6); return (lerp(X1, XB, eio(u)), D - lepes(u, 2), 0, 1, 1)
    if t < 15.3: return (XB, D, 0, 1, 1)
    h = sik(t); sk = lerp(1, HSK, h)
    if t < 20.3:
        u = seg(t, 15.3, 20.3)
        return (lerp(XB, XR, eio(u)), D - HATRA * h - lepes(u, 7) * sk, 0, sk, sk)
    if t < 21.1:
        u = seg(t, 20.3, 21.1)
        return (lerp(XR, XF, eio(u)), D - HATRA * h - lepes(u, 1), 0, sk, sk)
    if t < 21.5: k = eio(seg(t, 21.1, 21.5)); return (XF, D + 4 * k, 0, 1 + .03 * k, 1 - .06 * k)
    if t < 23.0:
        u = seg(t, 21.5, 23.0); x, y = ugras(u, (XF, D + 4), (0, 0), 215)
        st = cl(1 - u / .18); return (x, y, lerp(-8, 5, u), 1 - .03 * st, 1 + .05 * st)
    if t < 23.6: y, sx, sy = erkezes(seg(t, 23.0, 23.6), 0, 0, 1); return (0, y, lerp(5, 0, cl(seg(t, 23.0, 23.15))), sx, sy)
    return (0, 0, 0, 1, 1)

def fordul(t):
    """vízszintes tükrözés a megforduláshoz: 1 = balra néz, -1 = jobbra"""
    if t < 14.6: return 1
    if t < 15.3: return math.cos(math.pi * eio(seg(t, 14.6, 15.3)))
    if t < 20.35: return -1
    if t < 21.1: return -math.cos(math.pi * eio(seg(t, 20.35, 21.1)))
    return 1

def maszk(t): return 1 if 15.3 <= t < 20.3 else 0

def jar(t, a, b, n):
    u = seg(t, a, b); return math.sin(2 * math.pi * n * u) * math.sqrt(math.sin(math.pi * u))

def elso(t):
    """a mellső lábpár szöge (+ = a paták előre-fel)"""
    if 6.5 <= t < 8.0: u = seg(t, 6.5, 8.0); return -30 * math.sin(math.pi * cl(u * 1.15))
    if 9.4 <= t < 12.6:
        be = seg(t, 9.4, 9.8) * (1 - seg(t, 12.1, 12.6))
        return be * (32 + 17 * math.sin(2 * math.pi * (t - 9.6) / .55))
    if 13.0 <= t < 14.6: return 17 * jar(t, 13.0, 14.6, 1)
    if 15.3 <= t < 20.3: return 17 * jar(t, 15.3, 20.3, 3.5)
    if 20.3 <= t < 21.1: return 14 * jar(t, 20.3, 21.1, .5)
    if 21.5 <= t < 23.0: u = seg(t, 21.5, 23.0); return -34 * math.sin(math.pi * cl(u * 1.1))
    return 0

def hatso(t):
    if 6.5 <= t < 8.0: u = seg(t, 6.5, 8.0); return lerp(-16, 14, u) * math.sin(math.pi * u)
    if 9.4 <= t < 12.6: return -6 * seg(t, 9.4, 9.9) * (1 - seg(t, 12.0, 12.6))
    if 13.0 <= t < 14.6: return -15 * jar(t, 13.0, 14.6, 1)
    if 15.3 <= t < 20.3: return -15 * jar(t, 15.3, 20.3, 3.5)
    if 20.3 <= t < 21.1: return -12 * jar(t, 20.3, 21.1, .5)
    if 21.5 <= t < 23.0: u = seg(t, 21.5, 23.0); return lerp(-22, 14, u) * math.sin(math.pi * u)
    return 0

def kar(t):
    if 9.6 <= t < 12.4:
        be = seg(t, 9.6, 9.9) * (1 - seg(t, 12.0, 12.4))
        return be * (12 + 7 * math.sin(2 * math.pi * (t - 9.6) / .5))
    if 21.5 <= t < 23.0: return 8 * math.sin(math.pi * seg(t, 21.5, 23.0))
    return 0

def kard(t):
    """(markolat x, y, szög°, átlátszóság) a szobor koordinátáiban; 0° = a penge felfelé"""
    if t < 8.6 or t >= 24.22: return (HUVELY[0], HUVELY[1], HUV_SZOG, 0)
    if t < 9.0:
        u = seg(t, 8.6, 9.0); g = (lerp(HUVELY[0], OKOL[0], eio(u)), lerp(HUVELY[1], OKOL[1], eio(u)))
        return (g[0], g[1], lerp(HUV_SZOG, 70, ei(u)), 1)
    if t < 9.45: u = seg(t, 9.0, 9.45); return (OKOL[0], OKOL[1], lerp(70, -40, eob(u, 2.2)), 1)
    if t < 23.6:
        sz = -40
        if 9.6 <= t < 11.9: sz += 11 * math.sin(2 * math.pi * (t - 9.6) / .8) * seg(t, 9.6, 9.9) * (1 - seg(t, 11.5, 11.9))
        if 13.0 <= t < 21.1: sz += 3 * math.sin(2 * math.pi * (t - 13.0) / .8)
        if 21.5 <= t < 23.0: sz -= 14 * math.sin(math.pi * seg(t, 21.5, 23.0))
        return (OKOL[0], OKOL[1], sz, 1)
    u = seg(t, 23.6, 24.2)
    g = (lerp(OKOL[0], HUVELY[0], eio(u)), lerp(OKOL[1], HUVELY[1], eio(u)))
    return (g[0], g[1], lerp(-40, HUV_SZOG, eio(u)), 1)

def takar(t): return 1 if 8.62 <= t < 24.18 else 0

def arnyek(t):
    """(x, y-eltolás, átlátszóság, szélesség)"""
    x, y, r, sx, sy = test(t)
    if not (8.0 <= t < 23.0) or (6.5 <= t < 8.0): 
        if 6.5 <= t < 8.0:
            mag = max(0, D - y); return (x, 0, .2 * cl(1 - mag / 160), 1 - .5 * cl(mag / 160))
        return (x, 0, 0, .3)
    alap = D - HATRA * sik(t)
    mag = max(0, alap - y)
    return (x, alap - D, .2 * cl(1 - mag / 160), lerp(1, HSK, sik(t)) * (1 - .5 * cl(mag / 160)))

def csillan(t):
    for k in (9.7, 11.2, 20.9):
        if k <= t < k + .45: u = (t - k) / .45; return math.sin(math.pi * u)
    return 0

def por(kezd):
    def f(t):
        if kezd <= t < kezd + .9:
            u = (t - kezd) / .9; return (.9 * math.sin(math.pi * min(1, u * 2.2)) if u < .45 else .9 * (1 - (u - .45) / .55), .4 + 1.2 * u, -10 * u)
        return (0, .3, 0)
    return f

# ---------------- kulcskocka-generátor ----------------
def kockak(nev, fv, css, lepes=.1):
    sorok, elozo = [], None
    n = int(round(T / lepes))
    for i in range(n + 1):
        t = min(T - 1e-6, i * lepes)
        ertek = css(fv(t))
        sorok.append((i * lepes / T * 100, ertek))
    # azonos egymás utániak összevonása (csak az elsőt és az utolsót tartjuk meg)
    tom = []
    for i, (p, v) in enumerate(sorok):
        if 0 < i < len(sorok) - 1 and v == sorok[i - 1][1] and v == sorok[i + 1][1]: continue
        tom.append(f"{p:.2f}%{{{v}}}")
    return f"@keyframes {nev}{{" + "".join(tom) + "}\n"

def r1(x): return f"{x:.1f}".rstrip("0").rstrip(".") if abs(x) > .04 else "0"
def r3(x): return f"{x:.3f}".rstrip("0").rstrip(".")

def szinek(arany):
    if arany: return [("0", "#f6e7b8"), (".5", "#d7b56a"), ("1", "#9c7432")], "#5a4216"
    return [("0", "#c9dfd1"), (".5", "#93b4a1"), ("1", "#587765")], "#1f3328"

KARD_RAJZ = (
    '<path d="M-3.4 -18 L3.4 -18 L2.7 -100 L0 -119 L-2.7 -100 Z" fill="url(#lov-penge)" stroke="currentColor" stroke-width=".9" stroke-linejoin="round"/>'
    '<path d="M0 -22 L0 -97" stroke="#8a96a2" stroke-width=".8" stroke-linecap="round"/>'
    '<path d="M-1.6 -26 L-1.3 -92" stroke="#ffffff" stroke-width=".7" stroke-opacity=".85" stroke-linecap="round"/>'
    '<path d="M-14 -20 C-10 -16.5 10 -16.5 14 -20 L13 -16 C9 -13 -9 -13 -13 -16 Z" fill="url(#lov-arany)" stroke="currentColor" stroke-width=".8" stroke-linejoin="round"/>'
    '<circle cx="-14.2" cy="-18.4" r="2.2" fill="url(#lov-arany)" stroke="currentColor" stroke-width=".6"/><circle cx="14.2" cy="-18.4" r="2.2" fill="url(#lov-arany)" stroke="currentColor" stroke-width=".6"/>'
    '<rect x="-2.7" y="-15" width="5.4" height="27" rx="2.2" fill="#5a3a22" stroke="currentColor" stroke-width=".8"/>'
    '<path d="M-2.4 -11 L2.4 -8 M-2.4 -5 L2.4 -2 M-2.4 1 L2.4 4 M-2.4 7 L2.4 10" stroke="#a87a4a" stroke-width=".8"/>'
    '<circle cx="0" cy="15" r="4.4" fill="url(#lov-arany)" stroke="currentColor" stroke-width=".8"/>'
    '<circle cx="-1.2" cy="13.8" r="1.2" fill="#fff6d0" opacity=".9"/>'
    '<g id="lov-csillan" transform="translate(0 -116)"><path d="M0 -14 C1 -3 3 -1 14 0 C3 1 1 3 0 14 C-1 3 -3 1 -14 0 C-3 -1 -1 -3 0 -14 Z" fill="#fffbe6" stroke="#e9c76a" stroke-width=".8"/></g>'
)

def feljavit(nev, arany=False):
    ut = os.path.join(WEB, nev)
    s = open(ut, encoding="utf-8").read()
    if JEL in s: print("már kész:", nev); return
    i = s.index('<g id="szobor"'); nyit = s.index(">", i) + 1; j = s.index("</g>", nyit)
    tart = s[nyit:j]
    takaro = re.search(r'<path class="takaro" d="([^"]*)"/>', tart).group(1)
    vonal = re.search(r'<path d="([^"]*)"/>', tart).group(1)
    stops, sotet = szinek(arany)
    st = "".join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in stops)
    lyuk = " ".join("M" + p.replace(" ", " L") + " Z" for p in (ELSO_POLI, HATSO_POLI, KAR_POLI))
    defs = (f'<defs>'
            f'<linearGradient id="lov-patina" gradientUnits="userSpaceOnUse" x1="1430" y1="30" x2="1790" y2="350">{st}</linearGradient>'
            f'<radialGradient id="lov-feny"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>'
            f'<radialGradient id="lov-arny"><stop offset="0" stop-color="{sotet}" stop-opacity=".42"/><stop offset="1" stop-color="{sotet}" stop-opacity="0"/></radialGradient>'
            '<linearGradient id="lov-penge" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#eef3f7"/><stop offset=".45" stop-color="#b3bec8"/><stop offset=".55" stop-color="#d9e1e8"/><stop offset="1" stop-color="#8e9aa6"/></linearGradient>'
            '<linearGradient id="lov-arany" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbe7a6"/><stop offset=".45" stop-color="#d9a945"/><stop offset="1" stop-color="#9a6b1c"/></linearGradient>'
            f'<path id="lov-szil" d="{takaro}"/><path id="lov-vonal" d="{vonal}"/>'
            f'<clipPath id="lov-szilc"><use href="#lov-szil"/></clipPath>'
            f'<clipPath id="lov-testc"><path clip-rule="evenodd" d="M1300 -200 H2000 V900 H1300 Z {lyuk}"/></clipPath>'
            f'<clipPath id="lov-elsoc"><polygon points="{ELSO_POLI}"/></clipPath>'
            f'<clipPath id="lov-hatsoc"><polygon points="{HATSO_POLI}"/></clipPath>'
            f'<clipPath id="lov-karc"><polygon points="{KAR_POLI}"/></clipPath>'
            f'<g id="lov-reteg"><use href="#lov-szil" class="lov-p"/>'
            f'<g clip-path="url(#lov-szilc)">'
            f'<ellipse cx="1612" cy="300" rx="150" ry="58" fill="url(#lov-arny)"/>'
            f'<ellipse cx="1528" cy="345" rx="40" ry="30" fill="url(#lov-arny)"/><ellipse cx="1712" cy="340" rx="50" ry="30" fill="url(#lov-arny)"/>'
            f'<ellipse cx="1522" cy="175" rx="52" ry="30" fill="url(#lov-feny)" transform="rotate(-32 1522 175)"/>'
            f'<ellipse cx="1462" cy="160" rx="22" ry="34" fill="url(#lov-feny)" transform="rotate(-25 1462 160)"/>'
            f'<ellipse cx="1700" cy="240" rx="58" ry="26" fill="url(#lov-feny)"/>'
            f'<ellipse cx="1648" cy="104" rx="26" ry="52" fill="url(#lov-feny)" transform="rotate(18 1648 104)"/>'
            f'<ellipse cx="1610" cy="40" rx="18" ry="14" fill="url(#lov-feny)"/>'
            f'<path fill="none" stroke="{sotet}" stroke-width=".8" stroke-opacity=".28" stroke-linecap="round" d="'
            + " ".join(f"M{1450 + k * 7} 360 L{1496 + k * 7} 268" for k in range(50)) + '"/>'
            f'</g><use href="#lov-vonal"/></g>'
            f'</defs>')
    uj = (f'{JEL}{defs}<g id="lov-fordul">'
          f'<g clip-path="url(#lov-testc)"><use href="#lov-reteg"/></g>'
          f'<g id="lov-hatso"><g clip-path="url(#lov-hatsoc)"><use href="#lov-reteg"/></g></g>'
          f'<g id="lov-elso"><g clip-path="url(#lov-elsoc)"><use href="#lov-reteg"/></g></g>'
          f'<g id="lov-kar"><g clip-path="url(#lov-karc)"><use href="#lov-reteg"/></g></g>'
          f'<g id="lov-takar"><polygon points="{TAKAR_POLI}" fill="url(#lov-patina)" clip-path="url(#lov-szilc)"/></g>'
          f'<g id="lov-kard">{KARD_RAJZ}</g></g>')
    s = s[:nyit] + uj + s[j:]
    # árnyék a földön (a szobor mögött) és porfelhők (előtte)
    talaj = 357 + D
    def porg(azon, xs, y):
        k = ""
        for n, x in enumerate(xs):
            for dx, dy, r in ((-14, -5, 8), (0, -11, 12), (15, -6, 9), (7, -2, 6)):
                k += f'<circle cx="{x + dx + (n % 2) * 3}" cy="{y + dy}" r="{r}"/>'
        return f'<g id="{azon}" class="lov-por" fill="#e6dcc7" stroke="currentColor" stroke-width=".9" stroke-opacity=".45">{k}</g>'
    maszk_def = (f'<defs><mask id="lov-maszk" maskUnits="userSpaceOnUse" x="0" y="-300" width="2400" height="1300">'
                 f'<rect x="0" y="-300" width="2400" height="1300" fill="#fff"/><polygon id="lov-maszk-p" points="{TALAPZAT}" fill="#000"/></mask></defs>')
    s = s.replace('<g id="szobor"', f'{maszk_def}<g mask="url(#lov-maszk)"><ellipse id="lov-arnyek" cx="1615" cy="{talaj - 1}" rx="125" ry="9" fill="currentColor"/><g id="szobor"', 1)
    k0 = s.index('<g id="lov-kard"'); zar = s.index("</g>", s.index("</g>", s.index('id="lov-csillan"', k0)) + 4) + 4   # a kard vége
    zar = s.index("</g>", zar) + 4                                                                                    # a forduló csoport vége
    zar = s.index("</g>", zar) + 4                                                                                    # a szobor csoport vége
    s = s[:zar] + "</g>" + s[zar:]; zar += 4                                                                          # a maszkos csoport vége
    utana = (porg("lov-por1", [x + X1 for x in PATAK_E + PATAK_H], talaj)
             + porg("lov-por2", [x + X1 for x in PATAK_E], talaj)
             + porg("lov-por3", list(PATAK_E + PATAK_H), 357))
    s = s[:zar] + utana + s[zar:]
    # animációk
    anim = {"szobor": "lov-test"}
    for n in ("elso", "hatso", "kar", "kard", "takar", "csillan", "arnyek", "por1", "por2", "por3", "fordul", "maszk-p"): anim["lov-" + n] = "lov-" + n
    regi = "#szobor{animation:szobor 12s cubic-bezier(.3,.7,.4,1) infinite}"
    assert regi in s
    s = s.replace(regi, "".join(f"#{a}{{animation:{k} {T:g}s linear infinite}}" for a, k in anim.items()))
    css = ("\n.lov-p{fill:url(#lov-patina)}"
           f"#lov-elso{{transform-origin:{ELSO_F[0]}px {ELSO_F[1]}px}}#lov-hatso{{transform-origin:{HATSO_F[0]}px {HATSO_F[1]}px}}#lov-kar{{transform-origin:{KAR_F[0]}px {KAR_F[1]}px}}"
           f"#lov-kard{{transform-box:view-box;transform-origin:0 0;opacity:0;transform:translate({HUVELY[0]}px,{HUVELY[1]}px) rotate({HUV_SZOG}deg)}}#lov-takar{{opacity:0}}"
           "#lov-csillan{opacity:0;transform-box:fill-box;transform-origin:50% 50%}"
           f"#lov-fordul{{transform-box:view-box;transform-origin:{KOZEP}px 357px}}#lov-maszk-p{{opacity:0}}"
           "#lov-arnyek{opacity:0;transform-box:fill-box;transform-origin:50% 50%}.lov-por{opacity:0;transform-box:fill-box;transform-origin:50% 100%}\n")
    css += kockak("lov-test", test, lambda v: f"transform:translate({r1(v[0])}px,{r1(v[1])}px) rotate({r1(v[2])}deg) scale({r3(v[3])},{r3(v[4])})")
    css += kockak("lov-elso", elso, lambda v: f"transform:rotate({r1(v)}deg)")
    css += kockak("lov-hatso", hatso, lambda v: f"transform:rotate({r1(v)}deg)")
    css += kockak("lov-kar", kar, lambda v: f"transform:rotate({r1(v)}deg)")
    css += kockak("lov-kard", kard, lambda v: f"opacity:{v[3]};transform:translate({r1(v[0])}px,{r1(v[1])}px) rotate({r1(v[2])}deg)", .05)
    css += kockak("lov-takar", takar, lambda v: f"opacity:{v}", .05)
    css += kockak("lov-fordul", fordul, lambda v: f"transform:scaleX({r3(v)})", .05)
    css += kockak("lov-maszk-p", maszk, lambda v: f"opacity:{v}", .05)
    css += kockak("lov-csillan", csillan, lambda v: f"opacity:{r3(v)};transform:scale({r3(.3 + v)}) rotate({r1(v * 90)}deg)", .05)
    css += kockak("lov-arnyek", arnyek, lambda v: f"opacity:{r3(v[2])};transform:translate({r1(v[0])}px,{r1(v[1])}px) scale({r3(v[3])},1)")
    for n, kezd in (("lov-por1", 8.0), ("lov-por2", 12.6), ("lov-por3", 23.0)):
        css += kockak(n, por(kezd), lambda v: f"opacity:{r3(v[0])};transform:translateY({r1(v[2])}px) scale({r3(v[1])})", .05)
    s = s.replace("@media (prefers-reduced-motion:reduce)", css + "@media (prefers-reduced-motion:reduce)", 1)
    open(ut, "w", encoding="utf-8").write(s)
    print("Kész:", nev, len(s), "bájt")

if __name__ == "__main__":
    feljavit("szechenyi-ter-szepia.svg")
    feljavit("szechenyi-ter-arany.svg", arany=True)
    feljavit("lovasszobor-szepia.svg")
