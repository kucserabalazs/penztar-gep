#!/usr/bin/env python3
"""Antik pénztárgép a fejlécbe (a sárkányfej helyére) – arany és ezüst, „öntött, vésett” fémhatással.

A forrás a felhasználó vonalrajza: assets/illusztraciok/eredeti/penztargep-antik.png
Kimenet (azonos vásznon, egymásra illeszthető rétegek, átlátszó háttérrel):
  assets/illusztraciok/web/kassza-test.webp   – a gép teste (a kar nélkül, a forgócsappal)
  assets/illusztraciok/web/kassza-kar.webp    – az oldalsó hajtókar (a test MÖGÖTT forog)
  assets/illusztraciok/web/kassza-fiok.webp   – a pénzfiók: előlap + belseje (pénzekkel) + oldalfala
A mozgatás adatai (forgáspont, fiók iránya, vágómaszk) a vászon %-ában: lásd a futás kimenetét
és az assets/kassza.js elején lévő K objektumot.

Futtatás a repó gyökeréből:  python3 eszkozok/illusztraciok/kassza.py
"""
import os, math, json
import cv2, numpy as np
from PIL import Image

GY = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
SRC = os.path.join(GY, "assets/illusztraciok/eredeti/penztargep-antik.png")
WEB = os.path.join(GY, "assets/illusztraciok/web")
OUT_H = 440                                   # kimeneti magasság (px) – ~4× a fejlécbeli méretnek

# vászon-bővítés (az eredeti rajz koordinátái köré), hogy a kihúzott fiók és a csillogás is elférjen
PAD_L, PAD_T, PAD_R, PAD_B = 70, 14, 14, 16

# ---- geometria (eredeti rajz koordinátái) ----
FA, FB, FC, FD = (105, 941), (840, 1009), (840, 1130), (105, 1050)   # a fiók előlapja (felirat-tábla)
ELORE = np.array([-0.894, 0.447])            # a fiók kihúzásának iránya (a talapzat oldalélével párhuzamos)
FIOK_MAX = 150                                # max. kihúzás (px)
FIOK_MELY = FIOK_MAX + 26                     # a fiók rajzolt mélysége
PIVOT = (282, 462)                            # a hajtókar tengelye a gép oldalán
def test_el(y): return 292 - (y - 420) * 25 / 110   # a gépház bal kontúrja a kar magasságában

# ---- színskálák (sötét → fény) ----
def ramp(stops):
    xs = np.array([s[0] for s in stops]); cs = np.array([s[1] for s in stops], float)
    def f(v):
        v = np.clip(v, 0, 1)
        return np.stack([np.interp(v, xs, cs[:, k]) for k in range(3)], -1)
    return f
def hx(h): return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))
ARANY = ramp([(0, hx("#3d2606")), (.22, hx("#7a4f10")), (.45, hx("#b8862a")), (.64, hx("#e2b553")),
              (.80, hx("#f6d98a")), (.92, hx("#fff1c4")), (1, hx("#fffbea"))])
EZUST = ramp([(0, hx("#272c33")), (.25, hx("#5b636e")), (.48, hx("#9aa3ae")), (.68, hx("#cfd5dc")),
              (.85, hx("#eef1f4")), (1, hx("#ffffff"))])
ELEFANTCSONT = ramp([(0, hx("#7d6a45")), (.5, hx("#d9c99f")), (.8, hx("#f4ead0")), (1, hx("#fffaf0"))])
BARSONY = ramp([(0, hx("#050d1c")), (.5, hx("#0f2546")), (1, hx("#28507f"))])
VONAL = np.array(hx("#2a1803"), float)

def main():
    g0 = cv2.imread(SRC, 0)
    H0, W0 = g0.shape
    g = np.full((H0 + PAD_T + PAD_B, W0 + PAD_L + PAD_R), 255, np.uint8)
    g[PAD_T:PAD_T + H0, PAD_L:PAD_L + W0] = g0
    H, W = g.shape
    def P(p): return (p[0] + PAD_L, p[1] + PAD_T)          # eredeti → vászon
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)

    ink = np.clip((215 - g.astype(np.float32)) / 150, 0, 1)   # élsimított vonal-erősség
    L = (g < 150).astype(np.uint8)
    n, lab, st, cen = cv2.connectedComponentsWithStats(1 - L, connectivity=4)
    hatter = lab == lab[0, 0]
    obj = ~hatter
    obj = cv2.morphologyEx(obj.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8)).astype(bool)

    # ---------- anyagok régiónként ----------
    MAT = np.zeros(n, np.int8)        # 0 arany, 1 ezüst, 2 elefántcsont
    TONE = np.full(n, .55, np.float32)
    area = st[:, 4].astype(np.float32)
    for i in range(1, n):
        if i == lab[0, 0]: continue
        x, y, w, h, a = st[i]; cx, cy = cen[i]; ox, oy = cx - PAD_L, cy - PAD_T
        circ = 0
        if w and h:
            circ = a / (math.pi * (max(w, h) / 2) ** 2)
        # kijelzők: CASH tábla és az összegjelző ablak – zománcozott elefántcsont
        if (500 <= ox <= 832 and 58 <= oy <= 124) or (440 <= ox <= 845 and 170 <= oy <= 270):
            MAT[i] = 2; TONE[i] = .82; continue
        # billentyűk: kerek gombok ezüstben
        if 280 <= ox <= 800 and 315 <= oy <= 690 and 200 <= a <= 2800 and circ > .5 and .7 < w / max(h, 1) < 1.45:
            MAT[i] = 1; TONE[i] = .74; continue
        # jobb oldali gombok, nyugtakiadó fedél, pénzlap: ezüst
        if (ox > 1068 and 425 <= oy <= 610) or (805 <= ox <= 980 and 380 <= oy <= 475) or (190 <= ox <= 812 and 832 <= oy <= 925 and a > 15000 and w < 650 and h < 90):
            MAT[i] = 1; TONE[i] = .66; continue
        # a talapzat két betéttáblája (elöl a feliratos fióktábla, jobbra az oldaltábla): ezüst lap aranykeretben
        if a > 9000 and ((105 <= ox <= 840 and 940 <= oy <= 1130) or (925 <= ox <= 1140 and 915 <= oy <= 1080)):
            MAT[i] = 1; TONE[i] = .6; continue
        # a hajtókar: kar ezüst, a fogantyú arany
        if ox < test_el(oy) - 4 and 430 <= oy <= 525:
            MAT[i] = 0 if (ox < 200) else 1; TONE[i] = .62 if ox < 200 else .7; continue
        # arany: a nagy felületek mélyebbek, a díszítmények fényesebbek
        TONE[i] = float(np.interp(math.log10(max(a, 1)), [1.3, 2.6, 3.6, 4.6, 5.5], [.78, .74, .62, .55, .5]))

    mat = MAT[lab]; tone = TONE[lab]

    # ---------- domborítás (öntött / vésett fém) ----------
    dist = cv2.distanceTransform((1 - L).astype(np.uint8), cv2.DIST_L2, 5)
    r = np.where(mat == 1, 9.0, np.where(mat == 2, 4.0, 6.5)).astype(np.float32)
    hgt = 1 - np.exp(-dist / r)
    hgt = cv2.GaussianBlur(hgt, (0, 0), 1.2)
    gy_, gx_ = np.gradient(hgt)
    lx, ly = -.62, -.78                                      # fény balról-felülről
    emb = -(gx_ * lx + gy_ * ly) * 9.0
    emb = np.clip(emb, -1, 1)
    # fénylés: átlós csillogó sávok + felülről világosabb
    u = (xx * .8 + yy * .6) / W
    sheen = .16 * np.exp(-((u - .42) / .07) ** 2) + .10 * np.exp(-((u - .78) / .05) ** 2)
    vert = .10 * (1 - yy / H)
    lum = tone + .28 * emb + sheen + vert + .10 * (hgt - .5)
    # ezüst gombok: kupola-csúcsfény
    lum = np.where(mat == 1, lum + .12 * np.clip(hgt - .55, 0, 1), lum)
    col = np.where((mat == 0)[..., None], ARANY(lum), np.where((mat == 1)[..., None], EZUST(lum), ELEFANTCSONT(lum)))
    # vonalak: a fémfelületbe vésve – a vonal körül kicsit sötétebb árnyék
    halo = cv2.GaussianBlur(ink, (0, 0), 1.6)
    col = col * (1 - .22 * np.clip(halo - ink, 0, 1))[..., None]
    a_ink = np.clip(ink * 1.05, 0, 1)[..., None]
    col = col * (1 - a_ink) + VONAL * a_ink
    alpha = np.clip(obj.astype(np.float32) + ink, 0, 1)
    alpha = cv2.GaussianBlur(alpha, (0, 0), .6) * (obj | (ink > .05))
    rgba = np.dstack([col, alpha * 255]).astype(np.float32)

    # ---------- hajtókar leválasztása ----------
    kar_m = (xx - PAD_L < test_el(yy - PAD_T) - 4) & (yy - PAD_T >= 425) & (yy - PAD_T <= 530) & (xx - PAD_L > 70)
    kar = rgba.copy(); kar[..., 3] *= kar_m
    test = rgba.copy(); test[..., 3] *= ~kar_m
    # forgócsap (tengelyfej) a gép oldalán – a kar alatta fordul
    pvx, pvy = P(PIVOT)
    test = csap(test, pvx, pvy, 17)

    # ---------- fiók ----------
    fiok = fiok_retegek(rgba, P, W, H)

    # ---------- mentés ----------
    sc = OUT_H / H
    ow = round(W * sc)
    def ment(arr, nev):
        im = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGBA")
        # előszorzott alfával kicsinyítünk, hogy a szélek ne sötétedjenek
        a = arr[..., 3:4] / 255
        pm = np.dstack([arr[..., :3] * a, arr[..., 3]]).astype(np.float32)
        sm = cv2.resize(pm, (ow, OUT_H), interpolation=cv2.INTER_AREA)
        aa = np.clip(sm[..., 3:4] / 255, 1e-4, 1)
        outp = np.dstack([np.clip(sm[..., :3] / aa, 0, 255), sm[..., 3]])
        outp = sharpen(outp)
        Image.fromarray(np.clip(outp, 0, 255).astype(np.uint8), "RGBA").save(os.path.join(WEB, nev), "WEBP", quality=90, method=6, alpha_quality=95)
        print(nev, os.path.getsize(os.path.join(WEB, nev)) // 1024, "KB")
    ment(test, "kassza-test.webp")
    ment(kar, "kassza-kar.webp")
    ment(fiok, "kassza-fiok.webp")

    # ---------- a mozgatás adatai (a vászon %-ában) ----------
    def pct(p): return [round(float(p[0]) / W * 100, 3), round(float(p[1]) / H * 100, 3)]
    A, B, C, D = map(np.array, map(P, (FA, FB, FC, FD)))
    V = ELORE * FIOK_MAX
    hull = cv2.convexHull(np.array([A, B, C, D, A + V * 1.02, B + V * 1.02, C + V * 1.02, D + V * 1.02], np.float32))[:, 0]
    adat = {
        "arany": round(W / H, 5),
        "csap": pct((pvx, pvy)),
        "fiok": [round(float(V[0]) / W * 100, 3), round(float(V[1]) / H * 100, 3)],
        "vagas": [pct(p) for p in hull],
        "talca": pct(tuple((A + B) / 2 + V * .55)),     # a kihúzott fiók belsejének közepe
        "cseng": pct(P((665, 86))),                      # a CASH tábla (csengő-csillanás)
    }
    print(json.dumps(adat))

def sharpen(a):
    rgb = a[..., :3]
    bl = cv2.GaussianBlur(rgb, (0, 0), .8)
    a[..., :3] = np.clip(rgb + .35 * (rgb - bl), 0, 255)
    return a

def csap(arr, cx, cy, rr):
    """Ezüst tengelyfej: domború korong, gyűrű, közepén csavarfej."""
    H, W = arr.shape[:2]
    y0, y1, x0, x1 = int(cy - rr - 4), int(cy + rr + 5), int(cx - rr - 4), int(cx + rr + 5)
    yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
    d = np.hypot(xx - cx, yy - cy)
    m = np.clip(rr + .5 - d, 0, 1)
    nx, ny = (xx - cx) / rr, (yy - cy) / rr
    z = np.sqrt(np.clip(1 - nx * nx - ny * ny, 0, 1))
    lum = .45 + .45 * (-.55 * nx - .7 * ny + .45 * z) + .25 * np.exp(-((nx + .35) ** 2 + (ny + .4) ** 2) / .05)
    lum = np.where(d > rr * .78, lum - .18, lum)                     # gyűrű
    lum = np.where(d < rr * .32, .38 + .3 * (-ny), lum)               # csavarfej
    col = EZUST(lum)
    ring = np.clip(1.6 - np.abs(d - rr), 0, 1) + .8 * np.clip(1.2 - np.abs(d - rr * .78), 0, 1) + .9 * np.clip(1.2 - np.abs(d - rr * .32), 0, 1)
    slot = (np.abs((xx - cx) * .7 - (yy - cy) * .7) < 1.3) & (d < rr * .3)
    ring = np.clip(ring + slot, 0, 1)
    col = col * (1 - ring[..., None]) + VONAL * ring[..., None]
    a = np.clip(np.maximum(m, ring * (d < rr + 1.5)), 0, 1)
    seg = arr[y0:y1, x0:x1]
    seg[..., :3] = seg[..., :3] * (1 - a[..., None]) + col * a[..., None]
    seg[..., 3] = np.maximum(seg[..., 3], a * 255)
    return arr

def fiok_retegek(rgba, P, W, H):
    """A fiók: előlap (a feliratos tábla a rajzból) + belső tér felülről (bársony, rekeszek, pénz) + jobb oldalfal.
    Zárt helyzetben az előlap pontosan a rajz táblájára esik; a JS az ELORE irányba tolja és a nyílásra vágja."""
    A, B, C, D = [np.array(P(p), np.float32) for p in (FA, FB, FC, FD)]
    vissza = -ELORE                              # a fiók mélysége a géptest felé
    M = FIOK_MELY
    out = np.zeros_like(rgba)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    rng = np.random.default_rng(7)

    # --- tetőlap (a fiók belseje felülről): koordináták u (A→B, 0..1), w (mélység, px) ---
    AB = B - A
    Mx = np.array([[AB[0], vissza[0]], [AB[1], vissza[1]]], np.float32)
    inv = np.linalg.inv(Mx)
    rx, ry = xx - A[0], yy - A[1]
    uu = inv[0, 0] * rx + inv[0, 1] * ry
    ww = inv[1, 0] * rx + inv[1, 1] * ry
    teto = (uu >= 0) & (uu <= 1) & (ww >= 0) & (ww <= M)
    # bársony alap, a mélységgel sötétedik (árnyék a gép alatt)
    lum = .62 - .38 * np.clip(ww / M, 0, 1) + .06 * np.sin(uu * 90) * .2
    col = BARSONY(lum)
    # peremek: elöl (előlap vastagsága), két oldalt, rekeszválasztók – aranyozott
    perem = (ww < 9) | (uu < .012) | (uu > .988)
    valaszto = np.zeros_like(teto)
    for k in (.2, .4, .6, .8):
        valaszto |= np.abs(uu - k) < .0045
    pl = np.where(ww < 9, .86 - ww / 9 * .25, .7)
    col = np.where((perem | valaszto)[..., None], ARANY(pl + .1 * np.sin(uu * 40)), col)
    # árnyék a peremek mögött
    sh = np.clip(1 - (ww - 9) / 14, 0, 1) * (ww >= 9) * .45
    col = np.where(teto[..., None] & ~(perem | valaszto)[..., None], col * (1 - sh[..., None]), col)

    # --- pénz a rekeszekben ---
    def pont(u, w): return A + AB * u + vissza * w
    ermek = []
    for rek, (u0, u1) in enumerate([(.012, .2), (.2, .4), (.4, .6), (.6, .8), (.8, .988)]):
        if rek in (1, 3):                             # bankjegy-köteg
            ermek.append(("jegy", u0 + .012, u1 - .012, 16, M - 6, rek))
        else:
            for j in range(16):
                uc = rng.uniform(u0 + .03, u1 - .03); wc = rng.uniform(18, M - 14)
                ermek.append(("erme", uc, wc, rng.uniform(13, 17), "arany" if (rek + j) % 3 else "ezust", rng.uniform(0, 6.28)))
    lay = np.dstack([col, teto.astype(np.float32) * 255])
    # bankjegyek: halványzöld-krém papír, arany keret, ovális arcképmező – egymáson elcsúszott lapok
    for e in ermek:
        if e[0] != "jegy": continue
        _, u0, u1, w0, w1, rek = e
        for k in range(5):
            du = rng.uniform(-.006, .006); dw = k * 2.2
            poly = np.array([pont(u0 + du, w0 + dw), pont(u1 + du, w0 + dw), pont(u1 + du, w1 - 4 + dw * .2), pont(u0 + du, w1 - 4 + dw * .2)], np.int32)
            m = np.zeros((H, W), np.uint8); cv2.fillPoly(m, [poly], 1, cv2.LINE_AA)
            papir = np.array(hx("#e9e2c4") if rek == 1 else hx("#d9e3cf"), float) * (.82 + .05 * k)
            mb = m.astype(bool)
            lay[mb, :3] = papir
            lay[mb, 3] = 255
            cv2.polylines(lay, [poly], True, (*hx("#a8822e"), 255), 2, cv2.LINE_AA)
        # díszítés a legfelső lapon: keret és ovális medalion
        uc, wc = (u0 + u1) / 2, (w0 + w1) / 2
        oval = np.array([pont(uc + .045 * math.cos(t), wc + 28 * math.sin(t)) for t in np.linspace(0, 6.283, 40)], np.int32)
        cv2.polylines(lay, [oval], True, (*hx("#8a6a22"), 255), 2, cv2.LINE_AA)
        inner = np.array([pont(u0 + .012, w0 + 14), pont(u1 - .012, w0 + 14), pont(u1 - .012, w1 - 14), pont(u0 + .012, w1 - 14)], np.int32)
        cv2.polylines(lay, [inner], True, (*hx("#b99446"), 255), 1, cv2.LINE_AA)
    # érmék: lapjukon fekvő korongok (ellipszis a tetőlap síkjában), domborítással
    for e in sorted([e for e in ermek if e[0] == "erme"], key=lambda e: e[2]):
        _, uc, wc, rr, fajta, fi = e
        ru = rr / np.linalg.norm(AB)
        pts = np.array([pont(uc + ru * math.cos(t), wc + rr * math.sin(t)) for t in np.linspace(0, 6.283, 48)], np.float32)
        x0, y0 = np.floor(pts.min(0)).astype(int) - 3; x1, y1 = np.ceil(pts.max(0)).astype(int) + 3
        sub_u = uu[y0:y1, x0:x1]; sub_w = ww[y0:y1, x0:x1]
        nx = (sub_u - uc) / ru; ny = (sub_w - wc) / rr
        d = np.hypot(nx, ny)
        m = np.clip((1 - d) * rr * 1.2, 0, 1)
        ramp_ = ARANY if fajta == "arany" else EZUST
        l = .58 + .25 * (-.5 * nx - .7 * ny) + .2 * np.exp(-((nx + .3) ** 2 + (ny + .35) ** 2) / .08)
        l = np.where(d > .8, l - .16, l)
        if fajta == "ezust":                          # kétszínű (bimetál) érme: arany közép
            c = np.where((d < .55)[..., None], ARANY(l + .05), EZUST(l))
        else:
            c = ramp_(l)
        rim = np.clip(1 - np.abs(d - 1) * rr * .9, 0, 1) * .8 + np.clip(1 - np.abs(d - .8) * rr * 1.2, 0, 1) * .35
        c = c * (1 - rim[..., None] * .55)
        seg = lay[y0:y1, x0:x1]
        seg[..., :3] = seg[..., :3] * (1 - m[..., None]) + c * m[..., None]
        seg[..., 3] = np.maximum(seg[..., 3], m * 255)
    lay[..., 3] *= teto
    out = lay

    # --- jobb oldalfal (B→C él mélységben): árnyékos arany, belső keretléc ---
    BC = C - B
    Mx2 = np.array([[BC[0], vissza[0]], [BC[1], vissza[1]]], np.float32)
    inv2 = np.linalg.inv(Mx2)
    rx, ry = xx - B[0], yy - B[1]
    s = inv2[0, 0] * rx + inv2[0, 1] * ry
    w2 = inv2[1, 0] * rx + inv2[1, 1] * ry
    old = (s >= 0) & (s <= 1) & (w2 >= 0) & (w2 <= M)
    l2 = .36 + .12 * (1 - s) - .16 * np.clip(w2 / M, 0, 1)
    lec = (np.abs(s - .12) < .02) | (np.abs(s - .88) < .02) | (np.abs(w2 - 14) < 1.6)
    c2 = ARANY(np.where(lec, l2 + .22, l2))
    out[old, :3] = c2[old]; out[old, 3] = 255

    # --- előlap: a rajz feliratos táblája, kicsit kiemelve (a fiók szélei sötét éllel) ---
    elo = np.zeros((H, W), np.uint8)
    poly = np.array([A, B, C, D], np.int32)
    cv2.fillPoly(elo, [poly], 1)
    elo = cv2.dilate(elo, np.ones((7, 7), np.uint8)).astype(bool)
    e_rgba = rgba.copy(); e_rgba[~elo, 3] = 0
    a = e_rgba[..., 3:4] / 255
    out[..., :3] = out[..., :3] * (1 - a) + e_rgba[..., :3] * a
    out[..., 3] = np.maximum(out[..., 3], e_rgba[..., 3])
    # fogantyú: kis ezüst fogó a tábla közepén lent
    fx, fy = (D + C) / 2 * .5 + (A + B) / 2 * .5
    fx, fy = fx, fy + 44
    for t in range(2):
        pass
    out = fogo(out, (A + B + C + D) / 4 + np.array([0, 50]), AB / np.linalg.norm(AB))
    return out

def fogo(arr, c, irany):
    """Ezüst fiókhúzó (vízszintes fül) az előlapon."""
    H, W = arr.shape[:2]
    cx, cy = c
    L_, T_ = 46, 7
    x0, y0, x1, y1 = int(cx - L_ - 6), int(cy - 14), int(cx + L_ + 6), int(cy + 14)
    yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
    rx, ry = xx - cx, yy - cy
    a_ = rx * irany[0] + ry * irany[1]; b_ = -rx * irany[1] + ry * irany[0]
    m = np.clip(1 - (np.abs(a_) - L_), 0, 1) * np.clip(1 - (np.abs(b_) - T_), 0, 1)
    l = .62 - .5 * (b_ / T_) + .15 * np.exp(-(b_ / T_ + .45) ** 2 / .08)
    col = EZUST(l)
    edge = np.clip(1.4 - np.abs(np.abs(b_) - T_), 0, 1) * (np.abs(a_) <= L_) + np.clip(1.4 - np.abs(np.abs(a_) - L_), 0, 1) * (np.abs(b_) <= T_)
    col = col * (1 - edge[..., None]) + VONAL * edge[..., None]
    a = np.clip(np.maximum(m, edge), 0, 1)
    seg = arr[y0:y1, x0:x1]
    seg[..., :3] = seg[..., :3] * (1 - a[..., None]) + col * a[..., None]
    seg[..., 3] = np.maximum(seg[..., 3], a * 255)
    return arr

if __name__ == "__main__":
    main()
