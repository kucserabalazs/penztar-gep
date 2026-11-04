"""Bankjegyek valósághű meggyűrése (2. változat).

Fizikai alapú, előre kiszámolt kép: domborzat (éles hajtások, sík lapocskákra törő gyűrődés,
pöndörödő sarok), irányfény + szórt fény, önárnyék (a felemelkedő részek árnyéka a papíron),
üregárnyék, éles hajtásvonal-csúcsfény, kikopott festék a hajtásokon, kosz a hajtások és élek
mentén, sárgult papírszél, magasság szerint elmosódó vetett árnyék az asztalon.
Kimenet: átlátszó hátterű WebP (440 és 820 px széles).

Használat: python3 bankjegy-gyures.py <eredeti png-k mappája> <kimeneti mappa> [név ...]
"""
import os, sys
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, map_coordinates
from scipy.spatial import cKDTree

SC = 3                        # belső felbontás szorzója
NAMES = {'01': 'penztargep', '02': 'szamitastechnika', '03': 'merleg-arazo',
         '04': 'kellekanyagok', '05': 'szerviz', '06': 'e-penztargep'}


def ss(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def zaj(rng, shape, s):
    n = gaussian_filter(rng.standard_normal(shape), s)
    return n / (n.std() + 1e-9)


# ---------------------------------------------------------------- papír
def papir(img, rng):
    """A nyomat keskeny, kissé sárgult, nyomatlan papírszéllel, papírszemcsével."""
    w, h = img.size
    m = round(w * 0.022)
    W, H = w + 2 * m, h + 2 * m
    col = np.ones((H, W, 3)) * np.array([243, 237, 222]) / 255
    yy, xx = np.mgrid[0:H, 0:W]
    edge = np.minimum.reduce([xx, yy, W - 1 - xx, H - 1 - yy]).astype(float)
    col *= 1 - (0.07 * np.exp(-edge / (m * 0.5)))[..., None] * np.array([0.6, 0.85, 1.25])  # sárgult szél
    col[m:m + h, m:m + w] = np.asarray(img.convert('RGB')).astype(float) / 255
    return col


# ---------------------------------------------------------------- domborzat
def hajtas(X, Y, f, w, h, rng):
    x0, y0, ang, mely = f[:4]
    ex = f[4] if len(f) > 4 else {}
    c, s = np.cos(np.radians(ang)), np.sin(np.radians(ang))
    t = (X - x0 * w) * c + (Y - y0 * h) * s
    d = (X - x0 * w) * (-s) + (Y - y0 * h) * c
    d = d + zaj(rng, X.shape, w * 0.05) * w * 0.004          # a hajtásvonal sosem tökéletesen egyenes
    lagy = ex.get('lagy', 0.6) * SC
    v = np.sqrt(d * d + lagy * lagy) * ex.get('irany', 1) * mely
    v *= 1 + zaj(rng, X.shape, w * 0.08) * 0.12              # a két oldal sem egyenletes
    if 'hossz' in ex:
        a, b = ex['hossz']
        v *= 1 - ss(a * w, b * w, np.abs(t))
    return v, d


def lapocskak(rng, X, Y, n, amp, sim=0.5):
    """Gyűrt papír: összefüggő felület, amely éles élek mentén sík lapocskákra törik
    (véletlen pontok háromszögelése, lineáris kitöltés)."""
    from scipy.interpolate import LinearNDInterpolator
    x0, x1, y0, y1 = X.min(), X.max(), Y.min(), Y.max()
    pts = np.c_[rng.uniform(x0, x1, n), rng.uniform(y0, y1, n)]
    k = 12
    rim = np.r_[np.c_[np.linspace(x0, x1, k), np.full(k, y0)], np.c_[np.linspace(x0, x1, k), np.full(k, y1)],
                np.c_[np.full(k, x0), np.linspace(y0, y1, k)], np.c_[np.full(k, x1), np.linspace(y0, y1, k)]]
    P = np.r_[pts, rim]
    z = rng.normal(0, amp, len(P))
    f = LinearNDInterpolator(P, z, fill_value=0)
    st = 2                                   # ritkább rácson számol, majd simán felnagyít
    hs = f(X[::st, ::st], Y[::st, ::st])
    from scipy.ndimage import zoom
    hf = zoom(hs, (X.shape[0] / hs.shape[0], X.shape[1] / hs.shape[1]), order=1)[:X.shape[0], :X.shape[1]]
    return gaussian_filter(hf, sim * SC)


def domborzat(cfg, X, Y, w, h, rng):
    Hf = zaj(rng, X.shape, w * 0.14) * cfg.get('hullam', 5) * SC
    Hfold = np.zeros_like(X)
    for f in cfg.get('hajtasok', []):
        v, _ = hajtas(X, Y, f, w, h, rng)
        Hfold += v
    Hf += Hfold
    g = cfg.get('gyurt', 0)
    if g:
        Hf += lapocskak(rng, X, Y, int(70 + g * 70), 1.7 * g * SC, 0.6)
        Hf += lapocskak(rng, X, Y, int(260 + g * 200), 0.55 * g * SC, 0.45)
        Hf += lapocskak(rng, X, Y, int(900 + g * 400), 0.16 * g * SC, 0.35)
    for cx, cy, r, mag in cfg.get('sarkok', []):
        d = np.hypot(X - cx * w, Y - cy * h)
        Hf += mag * SC * ss(r * w, 0, d) ** 1.8
    inside = (X >= 0) & (X < w) & (Y >= 0) & (Y < h)
    Hf -= np.percentile(Hf[inside], 6)
    return np.maximum(Hf, 0), Hfold


# ---------------------------------------------------------------- render
def render(paper, cfg, seed):
    rng = np.random.default_rng(seed)
    H0, W0 = paper.shape[:2]
    img = np.stack([np.asarray(Image.fromarray((paper[..., i] * 255).astype(np.uint8)).resize((W0 * SC, H0 * SC), Image.LANCZOS))
                    for i in range(3)], -1).astype(float) / 255
    h, w = img.shape[:2]
    pad = int(w * 0.08)
    Hc, Wc = h + 2 * pad, w + 2 * pad
    Y, X = np.mgrid[0:Hc, 0:Wc].astype(float)
    Xp, Yp = X - pad, Y - pad
    Hf, Hfold = domborzat(cfg, Xp, Yp, w, h, rng)

    # nézőpont: a magasabb pontok kissé feljebb (és oldalra) látszanak
    py, px = cfg.get('nezo', (0.24, 0.04))
    sx, sy = Xp + Hf * px, Yp + Hf * py
    col = np.stack([map_coordinates(img[..., i], [sy, sx], order=1, mode='constant') for i in range(3)], -1)
    inside = ((sx >= 0) & (sx <= w - 1) & (sy >= 0) & (sy <= h - 1)).astype(float)
    alpha = gaussian_filter(inside, 0.55 * SC)
    Hs = map_coordinates(Hf, [sy + pad, sx + pad], order=1, mode='nearest')            # magasság a képernyő-pontban
    Fs = map_coordinates(Hfold, [sy + pad, sx + pad], order=1, mode='nearest')

    # normálvektor
    gy, gx = np.gradient(gaussian_filter(Hs, 0.45 * SC))
    N = np.dstack([-gx, -gy, np.ones_like(Hs)]); N /= np.linalg.norm(N, axis=-1, keepdims=True)
    L = np.array([-0.5, -0.7, 0.55]); L /= np.linalg.norm(L)
    ndl = np.clip(N @ L, 0, 1)
    diffuse = 0.40 + 0.60 * ndl / L[2]                 # sík papír ≈ 1
    # önárnyék: a fény felé haladva van-e magasabb pont (horizont-teszt)
    dirx, diry = L[0] / np.hypot(L[0], L[1]), L[1] / np.hypot(L[0], L[1])
    tanel = L[2] / np.hypot(L[0], L[1])
    occl = np.zeros_like(Hs)
    for st in np.geomspace(2 * SC, w * 0.25, 34):
        hh = map_coordinates(Hs, [Y + diry * st, X + dirx * st], order=1, mode='nearest')
        occl = np.maximum(occl, np.clip((hh - Hs - st * tanel) / (6 * SC), 0, 1))
    selfsh = 1 - 0.30 * gaussian_filter(occl, 1.8 * SC)
    # üregárnyék (szórt fény elzárása)
    cav = np.clip(gaussian_filter(Hs, 6 * SC) - Hs, 0, None)
    ao = 1 - np.clip(cav / (10 * SC), 0, 0.22)
    # csillanás
    R = 2 * (N @ L)[..., None] * N - L
    spec = np.clip(R[..., 2], 0, 1) ** 28 * 0.10
    # éles hajtásvonalak: gerincen csúcsfény, völgyben sötét vonal
    ky = np.gradient(np.gradient(Fs, axis=0), axis=0); kx = np.gradient(np.gradient(Fs, axis=1), axis=1)
    curv = gaussian_filter(kx + ky, 0.5 * SC)
    q = np.percentile(np.abs(curv), 99.6) + 1e-9
    cn = np.clip(curv / q, -1, 1)
    ridge = np.clip(-cn, 0, None) ** 1.4; valley = np.clip(cn, 0, None) ** 1.4
    line = gaussian_filter(np.abs(cn), 0.8 * SC)
    # kopás a hajtásokon: a festék kikopik (világos, szaggatott vonal)
    wear = np.clip(zaj(rng, Hs.shape, 1.2 * SC) * 0.6 + 0.4, 0, 1) * ridge
    paper_c = np.array([0.93, 0.91, 0.85])
    col = col * (1 - wear[..., None] * 0.55) + paper_c * wear[..., None] * 0.55
    # kosz a hajtások és az élek mentén
    edgeband = np.clip(1 - gaussian_filter(inside, 5 * SC) * 1.15, 0, 1) * inside
    dirt = (gaussian_filter(line, 3 * SC) * 1.4 + edgeband * 0.8) * (0.6 + 0.4 * np.clip(zaj(rng, Hs.shape, 4 * SC), -1, 1))
    col = col * (1 - np.clip(dirt, 0, 1)[..., None] * np.array([0.07, 0.085, 0.12]))
    # papírszemcse (finom dombornyomás-hatás)
    grain = zaj(rng, Hs.shape, 0.5 * SC) * 0.018 + zaj(rng, Hs.shape, 2.5 * SC) * 0.012
    shade = diffuse * selfsh * ao * (1 - valley * 0.30) + grain
    out = np.clip(col * shade[..., None] + spec[..., None] + ridge[..., None] * 0.16, 0, 1)

    # vetett árnyék az asztalon: minden papírpontot a fénnyel ellentétes irányba vetítünk,
    # a magasabb pontok távolabbra és puhábban vetnek árnyékot
    sh = np.zeros_like(Hs)
    hmax = max(Hs[inside > 0].max(), 1e-6)
    off = 4 * SC + Hs * 0.6
    ty, tx = Y - diry * off, X - dirx * off
    groups = [(0, 0.15, 1.8), (0.15, 0.45, 4.5), (0.45, 1.01, 9.0)]
    for lo, hi, sg in groups:
        m = inside * ((Hs >= lo * hmax) & (Hs < hi * hmax))
        buf = np.zeros_like(Hs)
        iy, ix = np.floor(ty).astype(int), np.floor(tx).astype(int)
        fy, fx = ty - iy, tx - ix
        for dy, dx, wgt in ((0, 0, (1 - fy) * (1 - fx)), (0, 1, (1 - fy) * fx), (1, 0, fy * (1 - fx)), (1, 1, fy * fx)):
            yy, xx = np.clip(iy + dy, 0, Hc - 1), np.clip(ix + dx, 0, Wc - 1)
            np.add.at(buf, (yy.ravel(), xx.ravel()), (m * wgt).ravel())
        sh += gaussian_filter(np.clip(buf, 0, 1), sg * SC) * (0.58 - 0.18 * lo)
    contact = gaussian_filter(inside * (Hs < 3 * SC), 1.6 * SC) * 0.35
    shadow = np.clip(np.maximum(sh, contact), 0, 0.7) * (1 - alpha)
    shc = np.array([38, 28, 12]) / 255

    a_tot = alpha + shadow
    rgb = (out * alpha[..., None] + shc * shadow[..., None]) / np.maximum(a_tot, 1e-6)[..., None]
    rgba = np.dstack([rgb, np.clip(a_tot, 0, 1)])
    ys, xs = np.where(a_tot > 0.008)
    rgba = rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    return Image.fromarray((rgba * 255).astype(np.uint8), 'RGBA')


# mindegyik másképp: más helyen, más irányban, más mértékben
CFG = {
    'penztargep':       dict(hullam=5, hajtasok=[(0.38, 0.5, 86, 0.2)], sarkok=[(1.0, 0.0, 0.24, 26)], gyurt=1.0, nezo=(0.24, 0.05)),
    'szamitastechnika': dict(hullam=4, hajtasok=[(0.34, 0.5, 93, 0.16), (0.68, 0.5, 88, 0.13, {'irany': -1})], gyurt=0.9, nezo=(0.21, -0.04)),
    'merleg-arazo':     dict(hullam=6, hajtasok=[(0.5, 0.56, 3, 0.24), (0.63, 0.5, 80, 0.08, {'hossz': (0.1, 0.28)})], gyurt=1.8, nezo=(0.26, 0.03)),
    'kellekanyagok':    dict(hullam=6, gyurt=2.6, hajtasok=[(0.6, 0.5, 97, 0.06, {'lagy': 3})], sarkok=[(0.0, 1.0, 0.2, 16)]),
    'szerviz':          dict(hullam=6, hajtasok=[(0.8, 0.22, 132, 0.2, {'hossz': (0.22, 0.4)}), (0.45, 0.5, 89, 0.06, {'irany': -1, 'lagy': 2})], gyurt=1.4, sarkok=[(0.0, 0.0, 0.15, 12)]),
    'e-penztargep':     dict(hullam=4, hajtasok=[(0.57, 0.5, 91, 0.17), (0.5, 0.44, 1, 0.11, {'irany': -1})], gyurt=1.3, sarkok=[(1.0, 1.0, 0.16, 16)], nezo=(0.22, -0.03)),
}

if __name__ == '__main__':
    src, out = sys.argv[1], sys.argv[2]
    only = sys.argv[3:] or None
    os.makedirs(out, exist_ok=True)
    for f in sorted(os.listdir(src)):
        if not f.endswith('.png') or f[:2] not in NAMES: continue
        n = NAMES[f[:2]]
        if only and n not in only: continue
        seed = sum(map(ord, n)) * 7
        im = Image.open(os.path.join(src, f)).convert('RGB').crop((6, 4, 692, 344))
        r = render(papir(im, np.random.default_rng(seed)), CFG[n], seed)
        r.save(os.path.join(out, f'{n}.png'))
        for wd in (440, 820):
            r.resize((wd, round(r.height * wd / r.width)), Image.LANCZOS).save(os.path.join(out, f'{n}-{wd}.webp'), quality=90, method=6)
        print(n, r.size, flush=True)
