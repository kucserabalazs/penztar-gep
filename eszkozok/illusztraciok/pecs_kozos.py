#!/usr/bin/env python3
"""Közös pécsi kép: elöl a székesegyház, hátul a Mecsek dombvonala, a Misina csúcsán a TV-torony.
A főoldalon a térkép helyén ez az egész háttér (background-size: cover).

Forrás: assets/illusztraciok/web/tv-torony-szepia.svg, szekesegyhaz-szepia.svg (a saját mozgásuk megmarad:
a torony csúcsa a szélben elhajlik, a székesegyház keresztjein csillanások).
Eredmény: assets/illusztraciok/web/pecs-szekesegyhaz-tvtorony.svg
A részek azonosítóval elérhetők a későbbi közös jelenethez: #tvtorony, #szekesegyhaz, #domb, #fak.
Futtatás a repó gyökeréből:  python3 eszkozok/illusztraciok/pecs_kozos.py
"""
import os, re, random

GYOKER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
WEB = os.path.join(GYOKER, "assets/illusztraciok/web")
W, H = 2400, 1000
SZAM = r"(-?\d+(?:\.\d+)?)[ ,](-?\d+(?:\.\d+)?)"

def betolt(nev):
    s = open(os.path.join(WEB, nev), encoding="utf-8").read()
    vb = tuple(map(float, re.search(r'viewBox="([^"]*)"', s).group(1).split()))
    stilus = re.search(r"<style>(.*?)</style>", s, re.S).group(1)
    belso = s[s.index("</style>") + 8: s.rindex("</svg>")]
    belso = re.sub(r"<title>.*?</title>", "", belso)
    return vb, stilus, belso

def burok(p):
    p = sorted(set(p)); cr = lambda o, a, b: (a[0]-o[0])*(b[1]-o[1]) - (a[1]-o[1])*(b[0]-o[0])
    lo, hi = [], []
    for q in p:
        while len(lo) >= 2 and cr(lo[-2], lo[-1], q) <= 0: lo.pop()
        lo.append(q)
    for q in reversed(p):
        while len(hi) >= 2 and cr(hi[-2], hi[-1], q) <= 0: hi.pop()
        hi.append(q)
    return lo[:-1] + hi[:-1]

tv_vb, tv_st, tv_in = betolt("tv-torony-szepia.svg")
sz_vb, sz_st, sz_in = betolt("szekesegyhaz-szepia.svg")

def pontok(belso):
    # csak a rajz vonalai számítanak – a csillanások (class="szikra") saját, eltolt koordinátájúak
    ds = [m.group(2) for m in re.finditer(r'<path([^>]*?) d="([^"]*)"', belso) if "szikra" not in m.group(1)]
    return [tuple(map(float, m)) for m in re.findall(SZAM, " ".join(ds))]

# ---- elhelyezés ----
SZ_W = 900;  sz_s = SZ_W / sz_vb[2]; sz_h = sz_vb[3] * sz_s
SZ_X, SZ_Y = 930, H - sz_h + 2                       # a székesegyház elöl, a talajvonalon
sz_pts = [p for p in pontok(sz_in) if sz_vb[1] - 5 <= p[1] <= sz_vb[1] + sz_vb[3] + 5]
CSUCS_Y = SZ_Y + (min(y for _, y in sz_pts) - sz_vb[1]) * sz_s     # a legmagasabb torony keresztjének csúcsa
# TV-torony: a töve a Misina csúcsán (812, 540), a csúcsa PONTOSAN a székesegyház legmagasabb csúcsával egy magasságban
tv_pts = [p for p in pontok(tv_in) if tv_vb[1] - 5 <= p[1] <= tv_vb[1] + tv_vb[3] + 5]
t_min, t_max = min(y for _, y in tv_pts), max(y for _, y in tv_pts)
TALP = 540
tv_s = (TALP - CSUCS_Y) / (t_max - t_min)
TV_H = tv_vb[3] * tv_s; tv_w = tv_vb[2] * tv_s
TV_Y = CSUCS_Y - (t_min - tv_vb[1]) * tv_s
tv_xs = [x for x, _ in tv_pts]; tv_kx = (min(tv_xs) + max(tv_xs)) / 2
TV_X = 812 - (tv_kx - tv_vb[0]) * tv_s

def be(vb, s, x, y):
    return lambda px, py: (x + (px - vb[0]) * s, y + (py - vb[1]) * s)

# a székesegyház körvonala: mögötte a dombvonal nem látszik át
f = be(sz_vb, sz_s, SZ_X, SZ_Y)
hull = burok([f(*p) for p in sz_pts])
HULL = "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in hull) + " Z"
fv = be(tv_vb, tv_s, TV_X, TV_Y)

# ---- Mecsek: két dombvonal, fák a lejtőn ----
DOMB1 = "M-60 790 C 220 760 470 660 640 600 C 720 572 770 545 812 540 C 870 534 940 560 1040 610 C 1280 720 1640 690 1960 735 C 2160 765 2320 790 2460 805"
DOMB2 = "M-60 700 C 260 650 520 600 700 575 M 980 585 C 1200 600 1500 560 1800 600 C 2050 630 2280 650 2460 670"
random.seed(1982)
def domb_y(x):  # a DOMB1 közelítő magassága (fák elhelyezéséhez)
    pts = [(-60, 790), (220, 772), (470, 690), (640, 600), (720, 570), (812, 540), (900, 545), (1040, 610), (1280, 690), (1640, 700), (1960, 735), (2160, 762), (2460, 805)]
    for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
        if x1 <= x <= x2: return y1 + (y2 - y1) * (x - x1) / (x2 - x1)
    return 800
fak = []
for x in list(range(40, 700, 46)) + list(range(1060, 2380, 52)):
    if 860 <= x <= 1880: continue    # a székesegyház mögött nem kell
    x += random.randint(-14, 14); y = domb_y(x) + 2; m = random.randint(18, 30); r = m * random.uniform(.42, .55)
    fak.append(f'<path d="M{x} {y} V{y - m * .55:.1f}"/><ellipse cx="{x}" cy="{y - m * .78:.1f}" rx="{r * .8:.1f}" ry="{r:.1f}"/>')
FAK = "".join(fak)
# bokrok a székesegyház két oldalán
BOKROK = ""
for x, r in [(870, 26), (905, 20), (1860, 24), (1895, 30), (1935, 20)]:
    BOKROK += f'<path d="M{x - r} {H - 4} C{x - r} {H - 4 - r * 1.3} {x + r} {H - 4 - r * 1.3} {x + r} {H - 4}"/>'

STILUS = tv_st.replace("svg{color:#2b3c53;--ill-hatter:#fbf7ee}", "svg{color:#2b3c53;--ill-hatter:#fbf7ee}.taj{fill:none;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round}")
# a székesegyház stílusa a torony stílusának része (ugyanazok a csillanások) – csak a hiányzó szabályok kellenek
for sor in sz_st.split("\n"):
    if sor.strip() and sor not in STILUS and "@media (prefers-reduced-motion:no-preference){}" not in sor:
        STILUS = STILUS.replace("@media (prefers-reduced-motion:reduce)", sor + "\n@media (prefers-reduced-motion:reduce)", 1)

svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMax slice" role="img" aria-label="Pécs: a székesegyház és a Misina-tetői TV-torony"><title>Pécs – székesegyház és TV-torony</title><style>{STILUS}</style>
<defs><clipPath id="szekesegyhaz-mogott"><path clip-rule="evenodd" d="M-100 -100 H{W + 100} V{H + 100} H-100 Z {HULL}"/></clipPath></defs>
<g id="tajkep" clip-path="url(#szekesegyhaz-mogott)">
<path id="domb2" class="taj" d="{DOMB2}" stroke-width="2" opacity=".35"/>
<path id="domb" class="taj" d="{DOMB1}" stroke-width="3.2"/>
<g id="fak" class="taj" stroke-width="2.4" opacity=".75">{FAK}</g>
<svg id="tvtorony" x="{TV_X:.1f}" y="{TV_Y:.1f}" width="{tv_w:.1f}" height="{TV_H:.1f}" viewBox="{' '.join(map(str, tv_vb))}" overflow="visible">{tv_in}</svg>
</g>
<path id="talaj" class="taj" d="M-20 {H - 3} H{W + 20}" stroke-width="3"/>
<g id="bokrok" class="taj" stroke-width="2.6">{BOKROK}</g>
<svg id="szekesegyhaz" x="{SZ_X:.1f}" y="{SZ_Y:.1f}" width="{SZ_W}" height="{sz_h:.1f}" viewBox="{' '.join(map(str, sz_vb))}" overflow="visible">{sz_in}</svg>
</svg>"""
cel = os.path.join(WEB, "pecs-szekesegyhaz-tvtorony.svg")
open(cel, "w", encoding="utf-8").write(svg)
print("Kész:", os.path.relpath(cel, GYOKER), len(svg), "bájt; csúcsok y:", f"székesegyház {CSUCS_Y:.1f}, TV-torony {TV_Y + (t_min - tv_vb[1]) * tv_s:.1f};", "TV-torony:", f"{TV_X:.0f},{TV_Y:.0f} {tv_w:.0f}x{TV_H:.0f}", "székesegyház:", f"{SZ_X:.0f},{SZ_Y:.0f} {SZ_W}x{sz_h:.0f}")
