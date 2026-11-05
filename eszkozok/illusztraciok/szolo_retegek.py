"""A szőlőfürt vonalrajzának rétegekre bontása (vonal, szemek, levelek, szár) – a szolo.py használja."""
import cv2, numpy as np, os
S = 3
GY = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
KEP = os.path.join(GY, "assets/illusztraciok/eredeti/szolofurt.png")
FURT = [(292,385),(380,386),(470,388),(560,384),(640,380),(700,385),(718,520),(718,620),(676,700),(668,860),(648,1000),(612,1110),(640,1290),(462,1275),(442,1080),(436,960),(404,780),(372,700),(330,640),(296,560),(296,470)]
LEVEL_RECT = [(96,218,362,580),(232,616,358,734),(555,124,1084,716)]
SZAR_RECT = [(318,10,672,402),(196,440,372,1292),(372,640,420,760)]
CEL = (591, 1236, 39)   # az ellopott szem: középpont, sugár (kép-képpont)

def retegek():
    g = cv2.imread(KEP, 0)
    big = cv2.GaussianBlur(cv2.resize(g.astype(np.float32), None, fx=S, fy=S, interpolation=cv2.INTER_CUBIC), (0, 0), 1.1)
    line = (big < 150).astype(np.uint8)
    H, W = line.shape
    def poly(P):
        m = np.zeros((H, W), np.uint8); cv2.fillPoly(m, [np.array([[x*S, y*S] for x, y in P], np.int32)], 1); return m
    def rects(R):
        m = np.zeros((H, W), np.uint8)
        for x0, y0, x1, y1 in R: m[y0*S:y1*S, x0*S:x1*S] = 1
        return m
    furt, lev, szr = poly(FURT), rects(LEVEL_RECT), rects(SZAR_RECT)
    # zárt alakzatok: a szabad (nem vonal) területet „megnyitjuk”: a keskeny csatornák (a szárak csőszerű belseje,
    # a levelek vonalhézagai) elzáródnak, így a kívülről elárasztott rész nem folyik be a levelekbe és a szárakba
    free = (1 - line).astype(np.uint8)
    r = 7 * S; k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2*r+1, 2*r+1))
    er = cv2.erode(free, k)
    n0, lab0, st0, _ = cv2.connectedComponentsWithStats(er, connectivity=4)
    elert = np.zeros((H, W), np.uint8)
    for i in range(1, n0):
        x, y, w, h, a = st0[i]
        if x == 0 or y == 0 or x + w >= W or y + h >= H: elert[lab0 == i] = 1
    kint = cv2.dilate(elert, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2*r+5, 2*r+5))) & free
    belso = (free & (1 - kint)).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats((1 - line).astype(np.uint8), connectivity=4)
    hatter = np.zeros((H, W), np.uint8)
    for i in range(1, n):
        x, y, w, h, a = st[i]
        if x == 0 or y == 0 or x + w >= W or y + h >= H: hatter[lab == i] = 1
    # széles részek (levéllemez, szemek) és vékony csövek (szár, inda, levélnyél) szétválasztása
    rk = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (12*S+1, 12*S+1))
    szeles = cv2.morphologyEx(belso, cv2.MORPH_OPEN, rk)
    vissza = lambda m: (cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (16*S+1, 16*S+1))) & belso).astype(np.uint8)
    szem = np.zeros((H, W), np.uint8); feny = np.zeros((H, W), np.uint8)
    szel = (furt - cv2.erode(furt, np.ones((3, 3), np.uint8))).astype(np.uint8)
    nb, labb, stb, _ = cv2.connectedComponentsWithStats((belso & furt).astype(np.uint8), connectivity=4)
    for i in range(1, nb):
        x, y, w, h, a = stb[i]
        reg = (labb[y:y+h, x:x+w] == i).astype(np.uint8)
        if a / (S*S) < 260: feny[y:y+h, x:x+w][reg > 0] = 1; continue
        if not (szel[y:y+h, x:x+w][reg > 0]).any(): szem[y:y+h, x:x+w][reg > 0] = 1   # a fürt körvonalát nem érintő zárt folt: szem
    for sx, sy in ((455, 428),):   # a fürt tetején, a körvonalat érintő szem
        i = labb[sy*S, sx*S]
        if i: szem[labb == i] = 1
    level = (szeles & lev & (1 - furt) & (1 - szem)).astype(np.uint8)
    nl, labl, stl, _ = cv2.connectedComponentsWithStats(level, connectivity=4)
    for i in range(1, nl):
        x, y, w, h, a = stl[i]
        for x0, y0, x1, y1 in LEVEL_RECT:
            if (x <= x0*S or y <= y0*S or x + w >= x1*S or y + h >= y1*S) and x0*S <= x + w//2 < x1*S and y0*S <= y + h//2 < y1*S:
                level[labl == i] = 0; break
    level = (vissza(level) & lev & (1 - szem)).astype(np.uint8)
    # szár / inda: csak a vékony „csövek” belseje (a szárak közti nagy, zárt háttérfoltok nem)
    szar = np.zeros((H, W), np.uint8)
    jel = (belso & szr & (1 - level) & (1 - szem) & (1 - feny)).astype(np.uint8)
    n2, lab2, st2, _ = cv2.connectedComponentsWithStats(jel, connectivity=4)
    dt = cv2.distanceTransform(jel, cv2.DIST_L2, 3)
    for i in range(1, n2):
        x, y, w, h, a = st2[i]; reg = lab2[y:y+h, x:x+w] == i
        if dt[y:y+h, x:x+w][reg].max() < 10*S: szar[y:y+h, x:x+w][reg] = 1
    # a célszem kivágása mindenből (külön rajzoljuk)
    cel = np.zeros((H, W), np.uint8); cv2.circle(cel, (CEL[0]*S, CEL[1]*S), (CEL[2]+3)*S, 1, -1)
    for m in (line, szem, feny): m[cel > 0] = 0
    return dict(line=line, szem=szem, feny=feny, level=level, szar=szar)

if __name__ == "__main__":
    r = retegek(); H, W = r["line"].shape
    v = np.full((H, W, 3), 255, np.uint8)
    v[r["level"] > 0] = (80, 150, 60); v[r["szar"] > 0] = (40, 90, 130); v[r["szem"] > 0] = (40, 30, 150); v[r["feny"] > 0] = (230, 210, 255); v[r["line"] > 0] = 0
    cv2.imwrite(os.environ.get("KI", "retegek.png"), cv2.resize(v, None, fx=.6/S, fy=.6/S, interpolation=cv2.INTER_AREA))
