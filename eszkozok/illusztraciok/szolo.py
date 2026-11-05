#!/usr/bin/env python3
"""Zsolnay-sárkányfej és a szőlőfürt – mozgó jelenet (telefonos nézet, a fényreklám fölött).

A sárkányfej (eozin zöld) megpillantja a bal oldali szőlőfürtöt (eozin piros), a szeme odatéved, megnyalja a szája
szélét, csorog a nyála; aztán hosszú, kígyózó, villás nyelvét átnyújtja a fürt legalsó szeméig, a villával körbefogja,
lecsippenti (kis pattanás), visszahúzza a nyelvét a szemmel együtt, behappolja, boldogan, lehunyt szemmel majszol
(apró szívecskék szállnak), megnyalja a száját – a lecsípett szem helyén pedig lassan új szem nő, és kezdődik elölről.

Kimenet: assets/illusztraciok/web/zsolnay-szolo.svg  (önálló SVG, SMIL-animációval – <img>-ként is mozog)
Futtatás a repó gyökeréből:  python3 eszkozok/illusztraciok/szolo.py
"""
import os, re, math, sys
import cv2, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import szolo_retegek as R

GY = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
WEB = os.path.join(GY, "assets/illusztraciok/web")
KI = os.path.join(WEB, "zsolnay-szolo.svg")

T = 10.0
VB = (0, 0, 1840, 1230)
G_S, G_X, G_Y = .78, 40, 20                 # a szőlő helye a jelenetben
D_S, D_X, D_Y = .85, 268, 266               # a sárkányfej helye
CEL = R.CEL
P = (G_X + CEL[0] * G_S, G_Y + CEL[1] * G_S)  # az ellopott szem közepe (jelenet)
GR = CEL[2] * G_S                            # a szem sugara
SZAJ = (D_X + 942 * D_S, D_Y + 846 * D_S)   # a nyelv töve (a száj)
SZEM_K = (1298.5, 448.5); PUP0 = (1286, 441)  # a sárkány szivárványhártyájának közepe, eredeti pupilla (sárkány-koordináta)

def cl(x, a=0., b=1.): return max(a, min(b, x))
def seg(t, a, b): return cl((t - a) / (b - a))
def eio(u): return u * u * (3 - 2 * u)
def eo(u): return 1 - (1 - u) ** 3
def lerp(a, b, u): return a + (b - a) * u
def f(x): return f"{x:.0f}"

# ---------------- rétegek nyomvonalazása ----------------
def nyom(m, eps=1.1, minarea=8):
    cs, _ = cv2.findContours(m, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    out = []
    for c in cs:
        if cv2.contourArea(c) < minarea * R.S * R.S and len(c) < 12: continue
        a = cv2.approxPolyDP(c, eps, True)[:, 0, :] / R.S
        if len(a) < 3: continue
        out.append("M" + "L".join(f"{round(x, 1):g} {round(y, 1):g}" for x, y in a) + "Z")
    return " ".join(out)

def szolo_svg():
    r = R.retegek()
    S = R.S
    # szemenkénti fény: a szem-foltok középpontja és sugara
    n, lab, st, cen = cv2.connectedComponentsWithStats(r["szem"], connectivity=4)
    korok = []
    for i in range(1, n):
        a = st[i][4] / (S * S)
        if a < 300: continue
        korok.append((cen[i][0] / S, cen[i][1] / S, math.sqrt(a / math.pi)))
    fenyek = "".join(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{rr * 1.15:.0f}"/>' for x, y, rr in korok)
    return (f'<g id="szolo" transform="translate({G_X} {G_Y}) scale({G_S})">'
            f'<path fill="url(#sz-level)" d="{nyom(r["level"], 1.4, 30)}"/>'
            f'<path fill="url(#sz-szar)" d="{nyom(r["szar"], 1.2, 4)}"/>'
            f'<clipPath id="sz-szemc"><path d="{nyom(r["szem"], 1.2, 20)}"/></clipPath>'
            f'<path fill="url(#sz-bogyo)" d="{nyom(r["szem"], 1.2, 20)}"/>'
            f'<g clip-path="url(#sz-szemc)" fill="url(#sz-csillo)">{fenyek}</g>'
            f'<path fill="#fbe3e6" d="{nyom(r["feny"], 1, 2)}"/>'
            f'<path fill="#3a1d1f" fill-rule="evenodd" d="{nyom(r["line"], 1.1, 6)}"/>'
            f'</g>')

def ellopott_szem():
    """az ellopott szem önálló rajza (a jelenet koordinátáiban, (0,0) körül)"""
    rr = GR
    return (f'<circle r="{rr:.1f}" fill="url(#sz-bogyo1)" stroke="#3a1d1f" stroke-width="{7.6 * G_S:.1f}"/>'
            f'<path d="M{-rr * .55:.1f} {-rr * .1:.1f} A{rr * .6:.1f} {rr * .6:.1f} 0 0 1 {-rr * .05:.1f} {-rr * .55:.1f}" fill="none" stroke="#fbe3e6" stroke-width="{rr * .22:.1f}" stroke-linecap="round"/>'
            f'<circle cx="{-rr * .45:.1f}" cy="{-rr * .45:.1f}" r="{rr * .1:.1f}" fill="#fff"/>')

# ---------------- a mozgás ----------------
def nyujt(t):
    """a nyelv kinyúlása 0..1"""
    if 1.4 <= t < 2.3: return .075 * math.sin(math.pi * seg(t, 1.4, 2.3))          # megnyalja a száját
    if 2.6 <= t < 3.9: return eo(seg(t, 2.6, 3.9))
    if 3.9 <= t < 4.5: return 1
    if 4.5 <= t < 5.7: return 1 - eio(seg(t, 4.5, 5.7))
    if 7.1 <= t < 7.8: return .07 * math.sin(math.pi * seg(t, 7.1, 7.8))
    return 0

def hullam(t):
    if 2.6 <= t < 3.9: return lerp(26, 8, seg(t, 2.6, 3.9))
    if 3.9 <= t < 4.5: return 5
    if 4.5 <= t < 5.7: return lerp(12, 4, seg(t, 4.5, 5.7))
    return 4

def fog(t):
    """a villa körbefogja a szemet 0..1"""
    if t < 3.75 or t >= 5.75: return 0
    if t < 4.15: return eio(seg(t, 3.75, 4.15))
    return 1

KONTR = ((SZAJ[0] + P[0]) / 2, max(SZAJ[1], P[1]) + 150)
CEL_TIP = (P[0] + GR + 4, P[1])
def gorbe(u):
    """a nyelv pályája (másodfokú Bézier), u 0..1"""
    a = (1 - u) ** 2; b = 2 * u * (1 - u); c = u * u
    return (a * SZAJ[0] + b * KONTR[0] + c * CEL_TIP[0], a * SZAJ[1] + b * KONTR[1] + c * CEL_TIP[1])

N = 26
def nyelv(t):
    """(test-körvonal, felső villa, alsó villa, csúcs, irány)"""
    e = max(nyujt(t), .0001)
    A = hullam(t)
    kozep = []
    for k in range(N):
        s = k / (N - 1)
        x, y = gorbe(s * e)
        x2, y2 = gorbe(min(1, s * e + .002))
        dx, dy = x2 - x, y2 - y; L = math.hypot(dx, dy) or 1; nx, ny = -dy / L, dx / L
        w = A * math.sin(2 * math.pi * (2.4 * s * e - 1.7 * t)) * math.sin(math.pi * s) * (1 - fog(t) * s)
        kozep.append((x + nx * w, y + ny * w, nx, ny))
    bal, jobb = [], []
    for k, (x, y, nx, ny) in enumerate(kozep):
        s = k / (N - 1)
        sz = lerp(21, 10, s) * (.55 + .45 * min(1, e * 6))
        bal.append((x + nx * sz, y + ny * sz)); jobb.append((x - nx * sz, y - ny * sz))
    test = "M" + "L".join(f"{f(x)} {f(y)}" for x, y in bal + jobb[::-1]) + "Z"
    hx, hy = kozep[-1][0], kozep[-1][1]
    dx, dy = hx - kozep[-2][0], hy - kozep[-2][1]; L = math.hypot(dx, dy) or 1; ux, uy = dx / L, dy / L
    vill = []
    w = fog(t)
    for sg in (1, -1):
        pts = []
        for k in range(6):
            q = k / 5
            if w > 0:  # körbefonja a szemet: ív a szem körül
                gx, gy = hx + P[0] - CEL_TIP[0], hy + P[1] - CEL_TIP[1]
                a0 = math.atan2(hy - gy, hx - gx)
                ang = a0 + sg * q * (2.1 * w + .35 * (1 - w))
                rr = lerp(math.hypot(hx - gx, hy - gy), GR + 6, min(1, q * 3))
                px, py = gx + rr * math.cos(ang), gy + rr * math.sin(ang)
                pts.append((lerp(hx + (ux * math.cos(sg * .45) - uy * math.sin(sg * .45)) * 34 * q, px, w),
                            lerp(hy + (uy * math.cos(sg * .45) + ux * math.sin(sg * .45)) * 26 * q, py, w)))
            else:
                a = sg * .5; L2 = 34 * q * min(1, e * 5)
                pts.append((hx + (ux * math.cos(a) - uy * math.sin(a)) * L2, hy + (uy * math.cos(a) + ux * math.sin(a)) * L2))
        vill.append("M" + "L".join(f"{f(x)} {f(y)}" for x, y in pts))
    return test, vill[0], vill[1], (hx, hy)

def szem_hely(t):
    """az ellopott szem: (x, y, méret, átlátszóság)"""
    if t < 4.3:
        j = 2.2 * math.sin(t * 40) * seg(t, 3.85, 4.0) * (1 - seg(t, 4.2, 4.3))
        return (P[0] + j, P[1], 1, 1)
    if t < 5.75:
        _, _, _, (hx, hy) = nyelv(t)
        dx, dy = P[0] - CEL_TIP[0], P[1] - CEL_TIP[1]
        k = 1 - .25 * seg(t, 5.45, 5.75)
        return (hx + dx, hy + dy, k, 1 - seg(t, 5.6, 5.75))
    if t < 8.6: return (P[0], P[1], 0, 0)
    if t < 9.6:
        u = seg(t, 8.6, 9.6); k = 1 + .12 * math.sin(math.pi * u) * (1 - u) if u > .6 else eo(u / .6)
        return (P[0], P[1], k, min(1, u * 3))
    return (P[0], P[1], 1, 1)

def fej(t):
    """a sárkányfej mozgása: (elfordulás°, eltolás y) – kívánkozó előrehajlás, majszolás"""
    r, y = 0, 0
    r += -2.2 * eio(seg(t, .4, 1.2)) * (1 - eio(seg(t, 2.4, 2.8)))        # odahajol a fürthöz
    r += -1.2 * eio(seg(t, 2.6, 3.0)) * (1 - eio(seg(t, 5.4, 5.8)))
    if 5.75 <= t < 7.1:                                                     # majszol
        u = seg(t, 5.75, 7.1); r += 1.6 * abs(math.sin(math.pi * 4.5 * u)) * (1 - u * .4); y += 4 * abs(math.sin(math.pi * 4.5 * u))
    return r, y

def pupilla(t):
    """a pupilla eltolása (sárkány-koordinátában) – a fürtre néz"""
    nez = eio(seg(t, .3, .8)) * (1 - eio(seg(t, 7.8, 8.4)))
    k = eio(seg(t, 8.9, 9.3)) * (1 - eio(seg(t, 9.6, 9.95)))      # az újra nőtt szemre is rápillant
    return (lerp(0, -9, max(nez, k)), lerp(0, 6, max(nez, k)))

def hej(t):
    """szemhéj: 0 nyitva, 1 csukva (pislogás, majszolás közben boldogan lehunyja)"""
    if 1.0 <= t < 1.22: return math.sin(math.pi * seg(t, 1.0, 1.22))
    if 5.85 <= t < 7.0: return eio(seg(t, 5.85, 6.05)) * (1 - eio(seg(t, 6.8, 7.0)))
    return 0

def nyal(t):
    """nyálcsepp: (y-nyúlás, esés, átlátszóság)"""
    if 1.9 <= t < 2.9:
        u = seg(t, 1.9, 2.9)
        if u < .45: return (u / .45, 0, 1)
        return (1, (u - .45) / .55, 1 - seg(u, .8, 1))
    return (0, 0, 0)

def szivek(t, k):
    a = 6.0 + k * .35
    if a <= t < a + 1.4:
        u = (t - a) / 1.4
        return (k * 46 - 46 + 14 * math.sin(u * 6 + k), -150 * u, 1.4 + 1.0 * u, math.sin(math.pi * min(1, u * 1.2)))
    return (0, 0, .5, 0)

def pattan(t):
    if 4.25 <= t < 4.75:
        u = seg(t, 4.25, 4.75); return (.4 + 1.2 * u, math.sin(math.pi * u))
    return (.3, 0)

# ---------------- mintavétel → SMIL ----------------
LEPES = .05
IDO = [round(i * LEPES, 3) for i in range(int(T / LEPES) + 1)]

def anim(attr, fv, tipus=None, add=""):
    vals, kts, prev = [], [], None
    for i, t in enumerate(IDO):
        v = fv(min(t, T - 1e-6))
        if v == prev and i not in (0, len(IDO) - 1):
            if i + 1 < len(IDO) and fv(min(IDO[i + 1], T - 1e-6)) == v: continue
        vals.append(v); kts.append(t / T); prev = v
    kt = ";".join(f"{k:.4f}".rstrip("0").rstrip(".") if k else "0" for k in kts)
    if tipus:
        return f'<animateTransform attributeName="transform" type="{tipus}" additive="sum" dur="{T:g}s" repeatCount="indefinite" calcMode="linear" keyTimes="{kt}" values="{";".join(vals)}"{add}/>'
    return f'<animate attributeName="{attr}" dur="{T:g}s" repeatCount="indefinite" calcMode="linear" keyTimes="{kt}" values="{";".join(vals)}"{add}/>'

def r2(x): return f"{x:.1f}".rstrip("0").rstrip(".")

def sarkany():
    s = open(os.path.join(WEB, "zsolnay-kut-okorfej-zold.svg"), encoding="utf-8").read()
    i = s.index("</style>") + 8; j = s.rindex("</svg>")
    b = s[i:j]
    b = re.sub(r'<path id="nyelv"[^>]*/>', "", b)
    b = b.replace('<g fill="currentColor" fill-rule="evenodd">', '<g fill="url(#eoz-zold)" fill-rule="evenodd">', 1)
    # szemhéj és pillák: az eredeti CSS helyett SMIL
    b = b.replace('<g id="hej">', '<g id="hej">' + anim(None, lambda t: f"0 {r2(-120 * (1 - hej(t)))}", "translate"), 1)
    b = b.replace('<path id="pillak"', '<path id="pillak" opacity="0"', 1)
    b = b.replace('id="pillak" opacity="0"', 'id="pillak" opacity="0"', 1)
    k = b.index('<path id="pillak"'); e = b.index("/>", k)
    b = b[:e] + ">" + anim("opacity", lambda t: "1" if hej(t) > .9 else "0") + "</path>" + b[e + 2:]
    return b

def main():
    rx, ry = SZEM_K
    fej_g = (f'<g id="fej">'
             + anim(None, lambda t: f"{r2(fej(t)[0])} 1700 900", "rotate")
             + f'<g transform="translate({D_X} {D_Y}) scale({D_S})">'
             + sarkany()
             # saját, mozgó pupilla az eredeti helyén (az eredetit eltakarjuk)
             + f'<circle cx="{PUP0[0]}" cy="{PUP0[1]}" r="8.5" fill="var(--ill-hatter,#f6efe2)"/>'
             + f'<circle cx="{PUP0[0]}" cy="{PUP0[1]}" r="7" fill="#123a2c">'
             + anim(None, lambda t: f"{r2(pupilla(t)[0])} {r2(pupilla(t)[1])}", "translate") + '</circle>'
             + f'<circle cx="{PUP0[0] - 2.5}" cy="{PUP0[1] - 2.5}" r="2" fill="#fff">'
             + anim(None, lambda t: f"{r2(pupilla(t)[0])} {r2(pupilla(t)[1])}", "translate") + '</circle>'
             + '</g></g>')
    nyelv_g = ('<g id="nyelv">'
               + '<path fill="url(#eoz-nyelv)" stroke="#5c1424" stroke-width="3.2" stroke-linejoin="round" d="' + nyelv(0)[0] + '">'
               + anim("d", lambda t: nyelv(t)[0]) + '</path>'
               + ''.join('<path fill="none" stroke="#5c1424" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" d="' + nyelv(0)[k] + '">'
                         + anim("d", lambda t, k=k: nyelv(t)[k]) + '</path>'
                         + '<path fill="none" stroke="#d24a62" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round" d="' + nyelv(0)[k] + '">'
                         + anim("d", lambda t, k=k: nyelv(t)[k]) + '</path>' for k in (1, 2))
               + anim("opacity", lambda t: "1" if nyujt(t) > .002 else "0")
               + '</g>')
    szem_g = (f'<g id="lopott">'
              + anim(None, lambda t: f"{r2(szem_hely(t)[0])} {r2(szem_hely(t)[1])}", "translate")
              + '<g>' + anim(None, lambda t: r2(max(.001, szem_hely(t)[2])), "scale") + ellopott_szem() + '</g>'
              + anim("opacity", lambda t: r2(szem_hely(t)[3]))
              + '</g>')
    nyal_g = (f'<g transform="translate({SZAJ[0] - 40:.0f} {SZAJ[1] + 22:.0f})">'
              + '<path fill="#cfe9f2" stroke="#4d7f8c" stroke-width="2.5" d="M0 0C-7 10 -8 20 0 24C8 20 7 10 0 0Z">'
              + anim("d", lambda t: (lambda n: f"M0 0C-7 {r2(4 + 8 * n[0])} -8 {r2(8 + 16 * n[0])} 0 {r2(10 + 18 * n[0])}C8 {r2(8 + 16 * n[0])} 7 {r2(4 + 8 * n[0])} 0 0Z")(nyal(t))) + '</path>'
              + anim(None, lambda t: f"0 {r2(nyal(t)[1] ** 2 * 230)}", "translate")
              + anim("opacity", lambda t: r2(nyal(t)[2]))
              + '</g>')
    sziv = ""
    for k in range(3):
        sziv += (f'<g transform="translate({D_X + 1330 * D_S:.0f} {D_Y + 300 * D_S:.0f})"><g>'
                 + anim(None, lambda t, k=k: f"{r2(szivek(t, k)[0])} {r2(szivek(t, k)[1])}", "translate")
                 + '<path fill="url(#sz-bogyo1)" stroke="#5c1424" stroke-width="2.5" d="M0 8C-14 -2 -16 -14 -8 -18C-3 -20 0 -16 0 -13C0 -16 3 -20 8 -18C16 -14 14 -2 0 8Z">'
                 + anim(None, lambda t, k=k: r2(szivek(t, k)[2]), "scale") + '</path>'
                 + anim("opacity", lambda t, k=k: r2(szivek(t, k)[3])) + '</g></g>')
    pattanas = (f'<g transform="translate({P[0] + 4:.0f} {P[1] - GR - 6:.0f})">'
                + '<path fill="#fff3c4" stroke="#c99a3c" stroke-width="2" d="M0 -16L3 -4L15 -6L5 1L11 12L0 5L-11 12L-5 1L-15 -6L-3 -4Z">'
                + anim(None, lambda t: r2(pattan(t)[0]), "scale") + '</path>'
                + anim("opacity", lambda t: r2(pattan(t)[1])) + '</g>')
    defs = ('<defs>'
            '<linearGradient id="eoz-zold" gradientUnits="userSpaceOnUse" x1="500" y1="150" x2="1800" y2="1100">'
            '<stop offset="0" stop-color="#0a3a2b"/><stop offset=".28" stop-color="#125a3f"/><stop offset=".45" stop-color="#2d6e35"/>'
            '<stop offset=".6" stop-color="#0f5240"/><stop offset=".8" stop-color="#164a52"/><stop offset="1" stop-color="#2b3563"/></linearGradient>'
            '<linearGradient id="eoz-nyelv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ee7b8a"/><stop offset=".5" stop-color="#c62f4a"/><stop offset="1" stop-color="#7d1730"/></linearGradient>'
            '<linearGradient id="sz-bogyo" gradientUnits="userSpaceOnUse" x1="300" y1="380" x2="720" y2="1290">'
            '<stop offset="0" stop-color="#b8243c"/><stop offset=".45" stop-color="#8e1430"/><stop offset=".7" stop-color="#a51e3c"/><stop offset="1" stop-color="#6a0d26"/></linearGradient>'
            '<radialGradient id="sz-csillo" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#f28a8f" stop-opacity=".85"/>'
            '<stop offset=".35" stop-color="#d0405a" stop-opacity=".35"/><stop offset=".75" stop-color="#5a0a20" stop-opacity="0"/><stop offset="1" stop-color="#3d0716" stop-opacity=".55"/></radialGradient>'
            '<radialGradient id="sz-bogyo1" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#f08a90"/><stop offset=".35" stop-color="#c4304a"/><stop offset=".8" stop-color="#8a1230"/><stop offset="1" stop-color="#5a0a20"/></radialGradient>'
            '<linearGradient id="sz-level" gradientUnits="userSpaceOnUse" x1="100" y1="130" x2="1060" y2="720">'
            '<stop offset="0" stop-color="#9cc685"/><stop offset=".4" stop-color="#5f9c5d"/><stop offset=".7" stop-color="#7fae63"/><stop offset="1" stop-color="#3f7a4e"/></linearGradient>'
            '<linearGradient id="sz-szar" gradientUnits="userSpaceOnUse" x1="200" y1="0" x2="650" y2="1300">'
            '<stop offset="0" stop-color="#a48245"/><stop offset=".5" stop-color="#7a5a2c"/><stop offset="1" stop-color="#5e4422"/></linearGradient>'
            '</defs>')
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{" ".join(map(str, VB))}" role="img" '
           'aria-label="Zsolnay-sárkányfej ellopja a szőlőfürt egyik szemét – mozgó">'
           '<title>Zsolnay-sárkányfej és szőlőfürt</title>'
           '<style>svg{color:#1d5c43;--ill-hatter:#f6efe2}</style>'
           + defs + szolo_svg() + pattanas + nyal_g + fej_g + szem_g + nyelv_g + sziv + '</svg>')
    open(KI, "w", encoding="utf-8").write(svg)
    print("Kész:", KI, len(svg) // 1024, "KB")

if __name__ == "__main__":
    main()
