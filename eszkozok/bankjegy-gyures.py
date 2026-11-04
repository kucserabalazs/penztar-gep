"""Bankjegyek egyedi, valósághű meggyűrése: domborzat (hajtások, gyűrődések, sarokpöndörödés),
fény-árnyék, enyhe torzulás és vetett árnyék. Kimenet: átlátszó hátterű WebP."""
import numpy as np, sys, os
from PIL import Image
from scipy.ndimage import gaussian_filter, map_coordinates, laplace

SRC = sys.argv[1]; OUT = sys.argv[2]
NAMES = {'01': 'penztargep', '02': 'szamitastechnika', '03': 'merleg-arazo', '04': 'kellekanyagok', '05': 'szerviz', '06': 'e-penztargep'}
SC = 2  # belső számolás kétszeres felbontáson a szép élekért

def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t)

def papir(img):
    """Bankjegy keskeny nyomatlan papírszéllel és papírszemcsével."""
    w, h = img.size; m = round(w * 0.021)
    rng = np.random.default_rng(7)
    base = np.ones((h + 2 * m, w + 2 * m, 3)) * np.array([246, 241, 228]) / 255
    base *= (1 + gaussian_filter(rng.standard_normal(base.shape[:2]), 0.8)[..., None] * 0.025)
    a = np.asarray(img.convert('RGB')).astype(float) / 255
    base[m:m + h, m:m + w] = a
    grain = gaussian_filter(rng.standard_normal(base.shape[:2]), 0.6) * 0.022 + gaussian_filter(rng.standard_normal(base.shape[:2]), 3) * 0.03
    return np.clip(base * (1 + grain[..., None]), 0, 1)

def ridged(rng, shape, sigmas, amps):
    h = np.zeros(shape)
    for s, a in zip(sigmas, amps):
        n = gaussian_filter(rng.standard_normal(shape), s); n /= n.std() + 1e-9
        h += a * (1 - np.abs(np.tanh(n * 1.3)))  # éles gerincek, mint a gyűrt papíron
    return h - h.mean()

def hajtas(X, Y, x0, y0, ang, mely, hossz=None, irany=1, lagy=1.5):
    """Egyenes hajtásvonal: a vonal két oldalán a papír megdől (V vagy fordított V alak)."""
    c, s = np.cos(np.radians(ang)), np.sin(np.radians(ang))
    d = (X - x0) * (-s) + (Y - y0) * c          # távolság a vonaltól
    t = (X - x0) * c + (Y - y0) * s             # hely a vonal mentén
    v = np.sqrt(d * d + lagy * lagy) * irany * mely
    if hossz:  # részleges hajtás: a vonal végein elhal
        v *= 1 - smoothstep(hossz[0], hossz[1], np.abs(t))
    return v

def sarok(X, Y, cx, cy, r, mag):
    d = np.hypot(X - cx, Y - cy); return mag * smoothstep(r, 0, d) ** 1.6

def gyur(paper, cfg, seed):
    rng = np.random.default_rng(seed)
    H0, W0 = paper.shape[:2]
    img = np.stack([np.asarray(Image.fromarray((paper[..., i] * 255).astype(np.uint8)).resize((W0 * SC, H0 * SC), Image.LANCZOS)) for i in range(3)], -1).astype(float) / 255
    h, w = img.shape[:2]; pad = int(w * 0.07)
    Hc, Wc = h + 2 * pad, w + 2 * pad
    Y, X = np.mgrid[0:Hc, 0:Wc].astype(float); Xp, Yp = X - pad, Y - pad   # papír-koordináták
    u, v = Xp / w, Yp / h
    # --- domborzat ---
    Hf = np.zeros((Hc, Wc))
    nagy = gaussian_filter(rng.standard_normal((Hc, Wc)), w * 0.12); nagy /= nagy.std()
    Hf += nagy * cfg.get('hullam', 6) * SC
    Hfold = np.zeros((Hc, Wc))
    for f in cfg.get('hajtasok', []):
        x0, y0, ang, mely = f[:4]; extra = f[4] if len(f) > 4 else {}
        hs = extra.get('hossz'); hs = (hs[0] * w, hs[1] * w) if hs else None
        Hfold += hajtas(Xp, Yp, x0 * w, y0 * h, ang, mely, hs, extra.get('irany', 1), extra.get('lagy', 1.4) * SC)
    Hf += Hfold
    if cfg.get('gyurt'):
        g = cfg['gyurt']
        Hf += ridged(rng, (Hc, Wc), [w * 0.018, w * 0.035, w * 0.07], [g * 0.35, g * 0.7, g]) * SC
    for cx, cy, r, mag in cfg.get('sarkok', []):
        Hf += sarok(Xp, Yp, cx * w, cy * h, r * w, mag * SC)
    Hf -= np.percentile(Hf[pad:pad + h, pad:pad + w], 8)  # a legalsó pontok érintik az asztalt
    Hf = np.maximum(Hf, 0)
    # --- vetítés: a magasabb részek kissé feljebb és oldalra látszanak ---
    py, px = cfg.get('nezo', (0.22, 0.05))
    sy = Yp + Hf * py; sx = Xp + Hf * px
    col = np.stack([map_coordinates(img[..., i], [sy, sx], order=1, mode='constant', cval=0) for i in range(3)], -1)
    inside = ((sx >= 0) & (sx <= w - 1) & (sy >= 0) & (sy <= h - 1)).astype(float)
    alpha = gaussian_filter(inside, 0.7 * SC)
    # --- fény: normálvektor a domborzatból, fény balról-felülről ---
    gy, gx = np.gradient(gaussian_filter(Hf, 0.8 * SC))
    k = 1.6
    N = np.stack([-gx * k, -gy * k, np.ones_like(Hf)], -1); N /= np.linalg.norm(N, axis=-1, keepdims=True)
    L = np.array([-0.45, -0.62, 0.65]); L /= np.linalg.norm(L)
    lam = (N @ L) / L[2]
    shade = 1 + (lam - 1) * 0.85
    Rv = 2 * (N @ L)[..., None] * N - L; spec = np.clip(Rv[..., 2], 0, 1) ** 40 * 0.16
    curv = laplace(gaussian_filter(Hf, 1.0 * SC))
    ao = 1 - np.clip(curv, 0, None) * 0.9 / SC          # völgyekben enyhe sötétedés
    hl = np.clip(-curv, 0, None) * 0.35 / SC            # gerinceken csúcsfény
    cf = laplace(gaussian_filter(Hfold, 0.9 * SC))
    crease = 1 - np.clip(cf, 0, None) * 5.0 / SC + 0 * cf
    hl = hl + np.clip(-cf, 0, None) * 2.2 / SC
    # a hajtás két oldala határozottan eltérő fényt kap
    shade = shade * ao * np.clip(crease, 0.55, 1)
    out = np.clip(col * shade[..., None] + spec[..., None] + hl[..., None], 0, 1)
    # --- vetett árnyék: a magasabb részek messzebbre vetnek, puhábban ---
    sh_dx, sh_dy = 0.006 * w, 0.018 * h
    shx = X - sh_dx - Hf * 0.35; shy = Y - sh_dy - Hf * 0.55
    sha = map_coordinates(alpha, [shy, shx], order=1, mode='constant', cval=0)
    shadow = gaussian_filter(sha, 7 * SC) * 0.42 + gaussian_filter(alpha, 1.5 * SC) * 0.22
    shadow = np.clip(shadow, 0, 0.6) * (1 - alpha)
    shcol = np.array([45, 33, 14]) / 255
    a_tot = alpha + shadow
    rgb = (out * alpha[..., None] + shcol * shadow[..., None]) / np.maximum(a_tot, 1e-6)[..., None]
    rgba = np.dstack([rgb, np.clip(a_tot, 0, 1)])
    # vágás a tartalomra
    ys, xs = np.where(a_tot > 0.01); rgba = rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    im = Image.fromarray((rgba * 255).astype(np.uint8), 'RGBA')
    return im.resize((im.width // SC, im.height // SC), Image.LANCZOS)

# mindegyik másképp: más helyen, más irányban, más mértékben
CFG = {
 'penztargep': dict(hullam=5, hajtasok=[(0.38, 0.5, 86, 0.2)], sarkok=[(1.0, 0.0, 0.22, 22)], gyurt=1.1, nezo=(0.24, 0.06)),
 'szamitastechnika': dict(hullam=4, hajtasok=[(0.34, 0.5, 93, 0.16), (0.68, 0.5, 88, 0.13, {'irany': -1})], gyurt=0.8, nezo=(0.2, -0.04)),
 'merleg-arazo': dict(hullam=7, hajtasok=[(0.5, 0.56, 3, 0.26), (0.63, 0.5, 80, 0.08, {'hossz': (0.1, 0.28)})], gyurt=2.0, nezo=(0.26, 0.03)),
 'kellekanyagok': dict(hullam=6, gyurt=5.2, hajtasok=[(0.6, 0.5, 97, 0.07, {'lagy': 6})], sarkok=[(0.0, 1.0, 0.18, 14)]),
 'szerviz': dict(hullam=6, hajtasok=[(0.8, 0.22, 132, 0.2, {'hossz': (0.22, 0.4)}), (0.45, 0.5, 89, 0.06, {'irany': -1, 'lagy': 4})], gyurt=1.5, sarkok=[(0.0, 0.0, 0.14, 10)]),
 'e-penztargep': dict(hullam=4, hajtasok=[(0.57, 0.5, 91, 0.17), (0.5, 0.44, 1, 0.11, {'irany': -1})], gyurt=1.3, sarkok=[(1.0, 1.0, 0.15, 14)], nezo=(0.22, -0.03)),
}
os.makedirs(OUT, exist_ok=True)
only = sys.argv[3:] or None
for f in sorted(os.listdir(SRC)):
    if not f.endswith('.png'): continue
    n = NAMES[f[:2]]
    if only and n not in only: continue
    im = Image.open(os.path.join(SRC, f)).convert('RGB').crop((6, 4, 692, 344))
    r = gyur(papir(im), CFG[n], seed=sum(map(ord,n))*7)
    r.save(os.path.join(OUT, f'{n}.png'))
    for wdt in (440, 820):
        if wdt > r.width: wdt = r.width
        r.resize((wdt, round(r.height * wdt / r.width)), Image.LANCZOS).save(os.path.join(OUT, f'{n}-{wdt if wdt in (440,820) else 820}.webp'), quality=88, method=6)
    print(n, r.size)
