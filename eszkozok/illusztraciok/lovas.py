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
JEL = "<!--lovas-v6-->"
T = 24.0
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

XKI, XBE, XU = -1860, 822, 330   # balra ki a képből; jobbról be; innen rugaszkodik fel
PER, DUTY = .46, .30               # egy vágtaütem (mp); a támaszfázis aránya lábanként
VMAX = 1660 / 3.0                  # kifelé: .8 mp alatt gyorsul fel erre, aztán egyenletes
V1, V2 = 520., 300.                # befelé: ezzel jön be, ennyire lassul az elrugaszkodásig
REJT = (12.6, 14.8)                # ekkor a képen kívül van
PIV = (1746, 357)                  # a test forgáspontja (hátsó paták)

def xpoz(t):
    if t < 9.2: return X1
    if t < 12.6:
        u = t - 9.2; return X1 - VMAX * (u * u / 1.6 if u < .8 else .4 + (u - .8))
    if t < 14.8: return XKI
    u = min(t, 16.0) - 14.8; return XBE - (V1 * u - (V1 - V2) * u * u / 2.4)

def sebesseg(t): return abs(xpoz(t + .01) - xpoz(t - .01)) / .02

def vagta_test(t, t0):
    """vágta: (emelkedés, bólintás°); a lebegő fázisban a legmagasabb, a hátsó támasznál orral fel"""
    f = ((t - t0) / PER) % 1
    be = seg(t, t0, t0 + .35)
    return be * (3.5 + 5 * math.cos(2 * math.pi * (f - .87))), be * 3.5 * math.cos(2 * math.pi * (f - .2))

def test(t):
    """(x, y, forgás°, skálaX, skálaY) – a szobor egésze a hátsó paták körül (+ forgás = orral fel)"""
    if t < 5.0: return (0, 0, 0, 1, 1)
    if t < 5.5: k = eio(seg(t, 5.0, 5.5)); return (0, 5 * k, 0, 1 + .03 * k, 1 - .06 * k)
    if t < 7.0:
        u = seg(t, 5.5, 7.0); x, y = ugras(u, (0, 5), (X1, D), 115)
        st = cl(1 - u / .18); return (x, y, lerp(7, -9, eio(u)), 1 - .03 * st, 1 + .05 * st)
    if t < 7.6: y, sx, sy = erkezes(seg(t, 7.0, 7.6), D, 0, 1); return (X1, y, lerp(-9, 0, eio(seg(t, 7.0, 7.3))), sx, sy)
    if t < 8.0: return (X1, D, 0, 1, 1)
    if t < 9.2:                                                  # rövid ágaskodás, a kard a magasban
        if t < 8.5: r = 21 * eob(seg(t, 8.0, 8.5))
        elif t < 8.85: r = 19 + 2.5 * math.sin(2 * math.pi * (t - 8.5) / .7)
        else: r = 19 * (1 - ei(seg(t, 8.85, 9.2)))
        return (X1, D, r, 1, 1)
    if REJT[0] <= t < REJT[1]: t = REJT[0] - .001 if t < 13.7 else REJT[1]
    if t < 12.6: e, b = vagta_test(t, 9.2); return (xpoz(t), D - e, b, 1, 1)
    if t < 16.0:
        e, b = vagta_test(t, 14.8 - .35)
        k = seg(t, 15.75, 16.0)                                  # elrugaszkodás előtt lekuporodik a hátsó lábakra
        return (xpoz(t), D - e * (1 - k) + 3 * k, b * (1 - k) - 3 * k, 1, 1)
    if t < 17.3:                                                 # lendületből felugrik a talapzatra
        u = seg(t, 16.0, 17.3); x, y = ugras(u, (XU, D + 3), (0, 0), 205)
        return (x, y, lerp(13, -5, eio(u)), 1, 1)
    if t < 17.9: y, sx, sy = erkezes(seg(t, 17.3, 17.9), 0, 0, 1); return (0, y, lerp(-5, 0, eio(seg(t, 17.3, 17.55))), sx, sy)
    return (0, 0, 0, 1, 1)

# ---------------- a négy láb: külön-külön, ízületekkel (könyök/térd – csüd – pata), inverz kinematikával ----------------
LP, PATAH, PST = 12, 10, 35         # csüd hossza, pata magassága, a csüd dőlése álló helyzetben (fok)
LABAK = {   # név: (gyökér = könyök / térdkalács, felső hossz, alsó (szár) hossz, mellső?, távoli?, talppont x)
    "FF": ((1520, 257), 47, 34.5, True, True, 1512),
    "RF": ((1694, 264), 45, 32, False, True, 1700),
    "FN": ((1549, 257), 47, 34.5, True, False, 1543),
    "RN": ((1737, 264), 45, 32, False, False, 1745),
}
FAZIS = {"RF": 0.0, "RN": .10, "FF": .34, "FN": .44}   # a támasz kezdete az ütemen belül (bal vezetésű, keresztezett vágta)
OFS = (math.sin(math.radians(PST)) * LP, -(math.cos(math.radians(PST)) * LP + PATAH))

def talaj(t): return D if 5.5 <= t < 17.3 else 0

def foldy(t, x):
    """a föld magassága a test saját koordinátáiban az x helyen"""
    _, y, r, _, _ = test(t); rr = math.radians(r)
    return PIV[1] + (talaj(t) - y - math.sin(rr) * (x - PIV[0])) / math.cos(rr)

def all_(t, n):
    R, a, b, elol, tav, tx = LABAK[n]
    return (tx + OFS[0], foldy(t, tx) + OFS[1], 0., 1.)

def nyugvo(t, n):                  # a szobor eredeti tartása: a közeli mellső láb kissé felemelve, a pata hegye a talapzaton
    if n == "FN": return (1557, 327, .55, 0.)
    return all_(t, n)

def jarat(t, n, t0):
    R, a, b, elol, tav, tx = LABAK[n]
    f = ((t - t0) / PER - FAZIS[n]) % 1
    s = cl(sebesseg(t) * DUTY * PER, 24, 88 if elol else 66)
    hat, elo = tx + s * .5, tx - s * .5 - (6 if elol else 0)
    if f < DUTY:
        cx = lerp(elo, hat, f / DUTY)
        return (cx + OFS[0], foldy(t, cx) + OFS[1], 0., 1.)
    u = (f - DUTY) / (1 - DUTY)
    y0, y1 = foldy(t, hat) + OFS[1], foldy(t, elo) + OFS[1]
    if elol:   # a mellső láb: gyorsan felhajlik (a térd előre, a szár hátra), majd előrenyúlik és leteszi
        x = lerp(hat, elo, eio(cl(u * 1.08))) + OFS[0] - 10 * math.sin(math.pi * u) ** 2
        y = lerp(y0, y1, u) - 48 * math.sin(math.pi * cl(u * 1.25)) ** .9
        k = math.sin(math.pi * cl(u * 1.2)) ** .7
    else:      # a hátsó láb: a csánk hajlik, a pata előrelendül a has alá
        x = lerp(hat, elo, eio(u)) + OFS[0]
        y = lerp(y0, y1, u) - 24 * math.sin(math.pi * u) ** .8
        k = .8 * math.sin(math.pi * u) ** .8
    return (x, y, k, 1 - math.sin(math.pi * u) ** .5)

def relativ(R, dx, dy, k, fl=0.): return (R[0] + dx, R[1] + dy, k, fl)

def ugro(u, n, kezd, veg):
    """ugrás közbeni lábtartás: elrugaszkodás – behúzás – leérkezés előtti kinyúlás"""
    R, a, b, elol, tav, tx = LABAK[n]
    tv = LABAK[n][4]                     # a két láb ne fedje egymást: a távolabbi kicsit másképp hajlik
    if elol:
        beh, nyu = (relativ(R, -3, 45, .9), relativ(R, -16, 73, .1)) if tv else (relativ(R, -15, 36, 1.), relativ(R, -30, 68, .25))
        if u < .14: return keve(kezd, beh, eio(u / .14))
        if u < .58: return beh
        if u < .9: return keve(beh, nyu, eio((u - .58) / .32))
        return keve(nyu, veg, eio((u - .9) / .1))
    tol, beh, nyu = ((relativ(R, 30, 62, .35), relativ(R, -10, 46, .75), relativ(R, 0, 62, .15)) if tv else
                     (relativ(R, 22, 64, .25), relativ(R, -20, 40, .9), relativ(R, -9, 60, .25)))
    if u < .15: return keve(kezd, tol, eio(u / .15))
    if u < .45: return keve(tol, beh, eio((u - .15) / .3))
    if u < .7: return beh
    if u < .95: return keve(beh, nyu, eio((u - .7) / .25))
    return keve(nyu, veg, eio((u - .95) / .05))

def keve(A, B, w): return tuple(lerp(A[i], B[i], w) for i in range(4))

def kapal(t, n):                    # ágaskodás: a mellső lábak felváltva kapálnak
    R = LABAK[n][0]; p = 2 * math.pi * (t - 8.0) / .55 + (math.pi if n == "FN" else 0)
    return relativ(R, -20 - 17 * math.sin(p), 47 + 14 * math.cos(p), .55 + .35 * math.sin(p))

def poz(t, n):
    """(csüdízület x, y a test koordinátáiban, csüdhajlítás 0..1, a pata a földön fekszik 0..1)"""
    elol = LABAK[n][3]
    if REJT[0] <= t < REJT[1]: t = REJT[0] - .001
    if t < 5.0: return nyugvo(t, n)
    if t < 5.5: return keve(nyugvo(t, n), all_(t, n), eio(seg(t, 5.0, 5.3)))
    if t < 7.0: return ugro(seg(t, 5.5, 7.0), n, all_(5.499, n), all_(7.0, n))
    if t < 8.0: return all_(t, n)
    if t < 9.2:
        if not elol: return all_(t, n)
        return keve(all_(t, n), kapal(t, n), eio(seg(t, 8.0, 8.2)) * (1 - eio(seg(t, 8.9, 9.2))))
    if t < 12.6: return keve(all_(t, n), jarat(t, n, 9.2), eio(seg(t, 9.2, 9.45)))
    if t < 16.0:
        p = jarat(t, n, 14.8 - .35)
        if not elol: return keve(p, all_(t, n), eio(seg(t, 15.78, 16.0)))      # a hátsó lábak alá kerülnek: elrugaszkodás
        return p
    if t < 17.3: return ugro(seg(t, 16.0, 17.3), n, poz(15.999, n), all_(17.3, n))
    if t < 17.9: return all_(t, n)
    return keve(all_(t, n), nyugvo(t, n), eio(seg(t, 17.9, 18.6)))

def ik(n, F):
    R, a, b, elol, tav, tx = LABAK[n]
    dx, dy = F[0] - R[0], F[1] - R[1]; d = math.hypot(dx, dy)
    d2 = cl(d, abs(a - b) + 2, a + b - .4); alap = math.atan2(dy, dx)
    al = math.acos(cl((a * a + d2 * d2 - b * b) / (2 * a * d2), -1, 1))
    j = [(R[0] + a * math.cos(alap + sg * al), R[1] + a * math.sin(alap + sg * al)) for sg in (1, -1)]
    J = min(j) if elol else max(j)                     # mellső: a térd előre (kisebb x), hátsó: a csánk hátra
    Fv = (R[0] + dx / d * d2, R[1] + dy / d * d2) if d > 1e-6 else F
    th1 = math.degrees(math.atan2(-(J[0] - R[0]), J[1] - R[1]))
    lo, hi = (-38, 72) if elol else (-48, 30)          # a felső rész (alkar / lábszár) mozgástartománya: a comb, a váll izmai nem engednek többet
    if not lo <= th1 <= hi:
        th1 = cl(th1, lo, hi); rr = math.radians(th1); J = (R[0] - a * math.sin(rr), R[1] + a * math.cos(rr))
    th2 = math.degrees(math.atan2(-(Fv[0] - J[0]), Fv[1] - J[1]))
    return th1, th2

def lab_szogek(t, n):
    """(felső, alsó relatív, csüd relatív, pata relatív) fokban"""
    fx, fy, k, fl = poz(t, n)
    th1, th2 = ik(n, (fx, fy))
    r = test(t if not (REJT[0] <= t < REJT[1]) else REJT[0] - .001)[2]
    th3 = lerp(PST - r, th2 - 80, k)
    th4 = lerp(th3 - 12 * k, -r, fl)
    return th1, th2 - th1, th3 - th2, th4 - th3

def fordul(t): return 1
def maszk(t): return 0

def elso(t):
    """a mellső lábpár szöge (+ = a paták előre-fel)"""
    if 5.5 <= t < 7.0: u = seg(t, 5.5, 7.0); return -30 * math.sin(math.pi * cl(u * 1.15))
    if 8.0 <= t < 9.2:
        be = seg(t, 8.0, 8.3) * (1 - seg(t, 8.85, 9.2))
        return be * (32 + 17 * math.sin(2 * math.pi * (t - 8.1) / .55))
    if 9.2 <= t < 12.6: return vagta(t, 9.2)[2]
    if 14.0 <= t < 16.0: return vagta(t, 13.7)[2] * seg(t, 14.0, 14.05)
    if 16.0 <= t < 17.3: u = seg(t, 16.0, 17.3); return lerp(vagta(16.0, 13.7)[2], 0, cl(u * 4)) - 38 * math.sin(math.pi * cl(u * 1.1))
    return 0

def hatso(t):
    if 5.5 <= t < 7.0: u = seg(t, 5.5, 7.0); return lerp(-16, 14, u) * math.sin(math.pi * u)
    if 8.0 <= t < 9.2: return -6 * seg(t, 8.0, 8.4) * (1 - seg(t, 8.8, 9.2))
    if 9.2 <= t < 12.6: return vagta(t, 9.2)[3]
    if 14.0 <= t < 16.0: return vagta(t, 13.7)[3]
    if 16.0 <= t < 17.3: u = seg(t, 16.0, 17.3); return lerp(vagta(16.0, 13.7)[3], 0, cl(u * 4)) + lerp(-26, 16, u) * math.sin(math.pi * u)
    return 0

def kar(t):
    if 8.1 <= t < 9.2:
        be = seg(t, 8.1, 8.35) * (1 - seg(t, 8.9, 9.2))
        return be * (12 + 7 * math.sin(2 * math.pi * (t - 8.1) / .5))
    if 9.2 <= t < 17.3: return 5 + 3 * math.sin(2 * math.pi * (t - 9.2) / PER)
    return 0

def kard(t):
    """(markolat x, y, szög°, átlátszóság) a szobor koordinátáiban; 0° = a penge felfelé"""
    if t < 7.6 or t >= 18.62: return (HUVELY[0], HUVELY[1], HUV_SZOG, 0)
    if t < 7.95:
        u = seg(t, 7.6, 7.95); g = (lerp(HUVELY[0], OKOL[0], eio(u)), lerp(HUVELY[1], OKOL[1], eio(u)))
        return (g[0], g[1], lerp(HUV_SZOG, 70, ei(u)), 1)
    if t < 8.35: u = seg(t, 7.95, 8.35); return (OKOL[0], OKOL[1], lerp(70, -20, eob(u, 2.2)), 1)
    if t < 18.0:
        if t < 9.2: sz = -20 + 12 * math.sin(2 * math.pi * (t - 8.35) / .8)              # a magasban suhogtatja
        elif t < 9.6: sz = lerp(-20, -62, eio(seg(t, 9.2, 9.6)))                        # előreszegezi: roham!
        elif t < 17.3: sz = -62 + 4 * math.sin(2 * math.pi * (t - 9.6) / PER)
        else: sz = lerp(-62, -12, eob(seg(t, 17.3, 17.75)))                             # érkezéskor a magasba emeli
        return (OKOL[0], OKOL[1], sz, 1)
    u = seg(t, 18.0, 18.6)
    g = (lerp(OKOL[0], HUVELY[0], eio(u)), lerp(OKOL[1], HUVELY[1], eio(u)))
    return (g[0], g[1], lerp(-12, HUV_SZOG, eio(u)), 1)

def takar(t): return 1 if 7.62 <= t < 18.58 else 0

def arnyek(t):
    """(x, y-eltolás, átlátszóság, szélesség)"""
    x, y, r, sx, sy = test(t)
    if not (5.5 <= t < 17.3) or 12.6 <= t < 14.0: return (x, 0, 0, .3)
    mag = max(0, D - y)
    return (x, 0, .2 * cl(1 - mag / 160), 1 - .5 * cl(mag / 160))

def csillan(t):
    for k in (8.3, 9.5, 17.55):
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
    return [("0", "#f5e4c2"), (".42", "#cfa772"), (".75", "#a47a4b"), ("1", "#6f4a2b")], "#3b2614"

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

VAGAS_E = "1486,263 1505,255 1569,255 1569,292 1612,392 1458,392"     # a rajzolt mellső lábak helye (kivágjuk)
VAGAS_H = "1658,270 1676,262 1763,262 1763,322 1760,392 1640,392"     # a rajzolt hátsó lábak helye

def lab_svg(n, vonal):
    """egy láb: izmos felső rész – ízület – szár – csüdízület – csüd – pata; a körvonal csak az oldalakon fut,
    az ízületeknél folytonosan, így nem darabos, hanem egybefüggő, élő lábnak hat"""
    R, a, b, elol, tav, tx = LABAK[n]
    g = f'fill="url(#{"lov-labt" if tav else "lov-lab"})"'
    kv = f'fill="none" stroke="{vonal}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'
    fv = 'fill="none" stroke="#fff7e4" stroke-opacity=".5" stroke-width="1.8" stroke-linecap="round"'
    av = f'fill="none" stroke="{vonal}" stroke-opacity=".28" stroke-width="1.2" stroke-linecap="round"'
    if elol:   # alkar: felül a mellkasba fut, elöl domború izom; alul a kéztőízület (a „térd”)
        felso = (f'<path d="M-17 -22 C-19 -4 -13 20 -7.5 {a} L7.2 {a} C8.5 26 13.5 4 17 -22 Z" {g}/>'
                 f'<path d="M-11.5 -2 C-12 12 -9 26 -5.5 {a - 6}" {fv}/><path d="M8.5 4 C7.5 18 6 28 5.2 {a - 6}" {av}/>'
                 f'<path d="M-17.4 -1 C-16.4 14 -12 28 -7.5 {a}" {kv}/><path d="M15.8 -1 C13 10 9 26 7.2 {a}" {kv}/>'
                 f'<ellipse cx="-.4" cy="{a}" rx="9" ry="7.6" {g}/>'
                 f'<path d="M-7.6 {a - 6} C-10.6 {a - 2} -10.2 {a + 4} -6.8 {a + 7}" {kv}/><path d="M7.4 {a - 6} C9.6 {a - 2} 9.3 {a + 4} 6.4 {a + 7}" {kv}/>')
    else:      # comb–lábszár: felül széles, hátul az Achilles-ín a csánkcsúcsig feszül; a csánk hátra mutat
        felso = (f'<path d="M-21 -22 C-20.5 0 -12 22 -7.5 {a} L8 {a} C10 24 17 4 22 -22 Z" {g}/>'
                 f'<path d="M-14 4 C-12 14 -8.5 26 -5.5 {a - 6}" {fv}/><path d="M13 6 C11 18 9.5 28 8.6 {a - 5}" {av}/>'
                 f'<path d="M-21 -2 C-19 12 -11 26 -7.5 {a}" {kv}/><path d="M21 -2 C15.5 12 10.5 26 8 {a - 7}" {kv}/>'
                 f'<path d="M-7.8 {a - 7} C-10 {a + 3} -6 {a + 9} 1 {a + 8.5} L11.5 {a + 2.5} C13 {a - 3} 10 {a - 9} 7.5 {a - 9} Z" {g}/>'
                 f'<path d="M8 {a - 8} C11 {a - 7} 13.6 {a - 2} 11.5 {a + 2.5} L6.4 {a + 7}" {kv}/><path d="M-7.6 {a - 6} C-9.8 {a + 2} -7.6 {a + 7} -5.8 {a + 9}" {kv}/>')
    szar = (f'<path d="M-6.4 -2 L-5.6 {b} L5.8 {b} L6.6 -2 Z" {g}/>'
            f'<path d="M-3.4 4 L-3 {b - 5}" {fv}/><path d="M3.4 4 L3.3 {b - 5}" {av}/>'
            f'<path d="M-6.3 5 L-5.6 {b - 4}" {kv}/><path d="M6.5 5 C6.9 {b * .4} 6.2 {b * .7} 5.9 {b - 4}" {kv}/>')
    bok = (f'<ellipse cx="1" cy="{b}" rx="7.8" ry="6.8" {g}/>'
           f'<path d="M5.6 {b - 6} C9.8 {b - 3} 9.8 {b + 4} 6 {b + 6.5}" {kv}/><path d="M-5.8 {b - 5} C-8 {b - 1} -7.6 {b + 3} -5.4 {b + 5.5}" {kv}/>')
    csud = (f'<path d="M-5.4 -2 L-5 {LP + .5} L5.6 {LP + .5} L6.2 -2 Z" {g}/>'
            f'<path d="M-5.3 3 L-5 {LP}" {kv}/><path d="M6.1 3 L5.6 {LP}" {kv}/>')
    pata = (f'<path d="M-6.4 0 L6.2 0 L8.4 {PATAH} L-11.5 {PATAH} Z" fill="url(#lov-pata)" stroke="{vonal}" stroke-width="2" stroke-linejoin="round"/>'
            f'<path d="M-6 1.9 L6 1.9" stroke="#fff3d6" stroke-opacity=".5" stroke-width="1.2"/>'
            f'<path d="M-8.6 {PATAH - 2.4} L6.8 {PATAH - 2.4}" stroke="#000" stroke-opacity=".18" stroke-width="1"/>')
    i = f"lov-l{n}"
    return (f'<g transform="translate({R[0]} {R[1]})"><g id="{i}1">'
            f'<g transform="translate(0 {a})"><g id="{i}2">{szar}'
            f'<g transform="translate(0 {b})"><g id="{i}3">{csud}<g transform="translate(0 {LP})"><g id="{i}4">{pata}</g></g></g></g>'
            f'{bok}</g></g>{felso}</g></g>')

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
    def szukit(poli, d=1.6):   # a lyukak picit kisebbek a kivágott daraboknál, így nincs hajszálvékony rés a varratoknál
        pt = [tuple(map(float, q.split(","))) for q in poli.split()]
        cx = sum(x for x, _ in pt) / len(pt); cy = sum(y for _, y in pt) / len(pt)
        ki = []
        for x, y in pt:
            dx, dy = x - cx, y - cy; h = math.hypot(dx, dy) or 1
            ki.append(f"{x - dx / h * d:.1f},{y - dy / h * d:.1f}")
        return " ".join(ki)
    lyuk = " ".join("M" + q.replace(" ", " L") + " Z" for q in (szukit(KAR_POLI), VAGAS_E, VAGAS_H))
    vonal_szin = "#7d5a1e" if arany else "currentColor"
    if arany: lab_st = (("#fbeec4", "#e2c27a", "#c29a4e", "#8a6424"), ("#ead7a0", "#cfaa5e", "#a87f38", "#6f4e18"), ("#9c7432", "#5e4214"))
    else: lab_st = (("#ecd2a3", "#c99e68", "#9c7247", "#69452a"), ("#d6b98c", "#ae8656", "#83603b", "#55381f"), ("#6a4628", "#3b2614"))
    def lgr(azon, c): return (f'<linearGradient id="{azon}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="{c[1]}"/><stop offset=".22" stop-color="{c[0]}"/>'
                              f'<stop offset=".6" stop-color="{c[2]}"/><stop offset="1" stop-color="{c[3]}"/></linearGradient>')
    defs = (f'<defs>'
            f'<linearGradient id="lov-patina" gradientUnits="userSpaceOnUse" x1="1430" y1="30" x2="1790" y2="350">{st}</linearGradient>'
            f'<radialGradient id="lov-feny"><stop offset="0" stop-color="#fffaf0" stop-opacity=".7"/><stop offset=".5" stop-color="#fff3d6" stop-opacity=".3"/><stop offset="1" stop-color="#fff3d6" stop-opacity="0"/></radialGradient>'
            f'<linearGradient id="lov-mely" gradientUnits="userSpaceOnUse" x1="0" y1="20" x2="0" y2="362"><stop offset="0" stop-color="#fff8e6" stop-opacity=".22"/><stop offset=".5" stop-color="#fff8e6" stop-opacity="0"/><stop offset=".78" stop-color="{sotet}" stop-opacity=".12"/><stop offset="1" stop-color="{sotet}" stop-opacity=".38"/></linearGradient>'
            f'<radialGradient id="lov-arny"><stop offset="0" stop-color="{sotet}" stop-opacity=".42"/><stop offset="1" stop-color="{sotet}" stop-opacity="0"/></radialGradient>'
            '<linearGradient id="lov-penge" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#eef3f7"/><stop offset=".45" stop-color="#b3bec8"/><stop offset=".55" stop-color="#d9e1e8"/><stop offset="1" stop-color="#8e9aa6"/></linearGradient>'
            '<linearGradient id="lov-arany" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbe7a6"/><stop offset=".45" stop-color="#d9a945"/><stop offset="1" stop-color="#9a6b1c"/></linearGradient>'
            f'<path id="lov-szil" d="{takaro}"/><path id="lov-vonal" d="{vonal}"/>'
            f'<clipPath id="lov-szilc"><use href="#lov-szil"/></clipPath>'
            f'<clipPath id="lov-testc"><path clip-rule="evenodd" d="M1300 -200 H2000 V900 H1300 Z {lyuk}"/></clipPath>'
            + lgr("lov-lab", lab_st[0]) + lgr("lov-labt", lab_st[1]) +
            f'<linearGradient id="lov-pata" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{lab_st[2][0]}"/><stop offset="1" stop-color="{lab_st[2][1]}"/></linearGradient>'
            f'<clipPath id="lov-karc"><polygon points="{KAR_POLI}"/></clipPath>'
            f'<g id="lov-reteg"><g id="lov-reteg0"><use href="#lov-szil" class="lov-p"/>'
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
            f'<rect x="1400" y="0" width="430" height="370" fill="url(#lov-mely)"/>'
            f'<use href="#lov-szil" fill="none" stroke="#fff6df" stroke-width="5" stroke-opacity=".6" transform="translate(2.4 2)"/>'
            f'<use href="#lov-szil" fill="none" stroke="{sotet}" stroke-width="5" stroke-opacity=".35" transform="translate(-2.4 -2.2)"/>'
            f'</g></g><use href="#lov-vonal"{' fill="#7d5a1e"' if arany else ''}/></g>'
            f'</defs>')
    uj = (f'{JEL}{defs}<g id="lov-fordul">'
          + "".join(lab_svg(n, vonal_szin) for n in ("FF", "RF", "FN", "RN")) +
          # a mellkas alja: a két alkar ide fut be, így mozgás közben sem látszik a lábak felső széle
          '<clipPath id="lov-mellc"><path d="M1500 248 L1501 262 C1505 270 1512 273 1520 273 C1527 273 1531 268 1534.5 265 C1538 268 1542 273 1549 273 C1557 273 1563 269 1567 262 L1570 248 Z"/></clipPath>'
          '<g clip-path="url(#lov-mellc)"><use href="#lov-reteg0"/></g>'
          f'<path d="M1501 262 C1505 270 1512 273 1520 273" fill="none" stroke="{vonal_szin}" stroke-width="2" stroke-linecap="round"/>' +
          f'<g clip-path="url(#lov-testc)"><use href="#lov-reteg"/></g>'
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
    for n in ("kar", "kard", "takar", "csillan", "arnyek", "por1", "por2", "por3", "fordul", "maszk-p"): anim["lov-" + n] = "lov-" + n
    regi = "#szobor{animation:szobor 12s cubic-bezier(.3,.7,.4,1) infinite}"
    assert regi in s
    for n in LABAK:
        for q in "1234": anim[f"lov-l{n}{q}"] = f"lov-l{n}{q}"
    s = s.replace(regi, "".join(f"#{a}{{animation:{k} {T:g}s linear infinite}}" for a, k in anim.items()))
    s = re.sub(r'<g id="szobor"[^>]*>', '<g id="szobor" style="transform-box:view-box;transform-origin:1746px 357px">', s, 1)
    css = ("\n.lov-p{fill:url(#lov-patina)}"
           f"#lov-kar{{transform-origin:{KAR_F[0]}px {KAR_F[1]}px}}"
           f"#lov-kard{{transform-box:view-box;transform-origin:0 0;opacity:0;transform:translate({HUVELY[0]}px,{HUVELY[1]}px) rotate({HUV_SZOG}deg)}}#lov-takar{{opacity:0}}"
           "#lov-csillan{opacity:0;transform-box:fill-box;transform-origin:50% 50%}"
           f"#lov-fordul{{transform-box:view-box;transform-origin:{KOZEP}px 357px}}#lov-maszk-p{{opacity:0}}"
           "#lov-arnyek{opacity:0;transform-box:fill-box;transform-origin:50% 50%}.lov-por{opacity:0;transform-box:fill-box;transform-origin:50% 100%}\n")
    css += kockak("lov-test", lambda t: test(t) + (0 if 12.6 <= t <= 14.0 else 1,), lepes=.04, css=lambda v: f"opacity:{v[5]};transform:translate({r1(v[0])}px,{r1(v[1])}px) rotate({r1(v[2])}deg) scale({r3(v[3])},{r3(v[4])})")
    for n in LABAK:
        for q in range(4):
            css += kockak(f"lov-l{n}{q + 1}", lambda t, n=n, q=q: lab_szogek(t, n)[q], lepes=.04, css=lambda v: f"transform:rotate({r1(v)}deg)")
    css += kockak("lov-kar", kar, lambda v: f"transform:rotate({r1(v)}deg)")
    css += kockak("lov-kard", kard, lambda v: f"opacity:{v[3]};transform:translate({r1(v[0])}px,{r1(v[1])}px) rotate({r1(v[2])}deg)", .05)
    css += kockak("lov-takar", takar, lambda v: f"opacity:{v}", .05)
    css += kockak("lov-fordul", fordul, lambda v: f"transform:scaleX({r3(v)})", .05)
    css += kockak("lov-maszk-p", maszk, lambda v: f"opacity:{v}", .05)
    css += kockak("lov-csillan", csillan, lambda v: f"opacity:{r3(v)};transform:scale({r3(.3 + v)}) rotate({r1(v * 90)}deg)", .05)
    css += kockak("lov-arnyek", arnyek, lepes=.04, css= lambda v: f"opacity:{r3(v[2])};transform:translate({r1(v[0])}px,{r1(v[1])}px) scale({r3(v[3])},1)")
    for n, kezd in (("lov-por1", 7.0), ("lov-por2", 9.2), ("lov-por3", 17.3)):
        css += kockak(n, por(kezd), lambda v: f"opacity:{r3(v[0])};transform:translateY({r1(v[2])}px) scale({r3(v[1])})", .05)
    s = s.replace("@media (prefers-reduced-motion:reduce)", css + "@media (prefers-reduced-motion:reduce)", 1)
    open(ut, "w", encoding="utf-8").write(s)
    print("Kész:", nev, len(s), "bájt")

if __name__ == "__main__":
    feljavit("szechenyi-ter-szepia.svg")
    feljavit("szechenyi-ter-arany.svg", arany=True)
    feljavit("lovasszobor-szepia.svg")
