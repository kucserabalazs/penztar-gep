#!/usr/bin/env python3
"""Napi ellenőrzés – penztar-gep.hu

A GitHub Actions minden nap lefuttatja (.github/workflows/napi-ellenorzes.yml). Csak olvas, semmit nem módosít,
nem ad le rendelést és nem küld űrlapot. Ha hibát talál, a jelentést a tulajdonos e-mail címére küldjük
(api.php?a=ellenorzes-jelentes), és a munkafolyamat pirosra vált (erről a GitHub is küld levelet).

Kimenet: jelentes.txt (a levél szövege), hibak.txt (a hibák száma). Kilépési kód: 0 = rendben, 1 = hiba.
Helyben: python3 eszkozok/napi_ellenorzes.py [--alap https://penztar-gep.hu] [--bongeszo-nelkul]
"""
import argparse, concurrent.futures as cf, datetime as dt, json, re, socket, ssl, sys, time, urllib.parse, urllib.request
from html.parser import HTMLParser

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 PTG-napi-ellenorzes"
HIBAK, FIGY, OK = [], [], []

def hiba(t): HIBAK.append(t)
def figy(t): FIGY.append(t)
def jo(t): OK.append(t)

class Valasz:
    def __init__(self, st, body=b"", hdr=None, ido=0.0, url="", hiba=""):
        self.st, self.body, self.hdr, self.ido, self.url, self.hiba = st, body, hdr or {}, ido, url, hiba
    @property
    def text(self): return self.body.decode("utf-8", "replace")

class NemKovet(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k): return None

def kerd(url, kovet=True, fej=None, tobbszor=2, timeout=30):
    op = urllib.request.build_opener() if kovet else urllib.request.build_opener(NemKovet)
    utolso = None
    for p in range(tobbszor + 1):
        t0 = time.time()
        try:
            r = op.open(urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "hu", **(fej or {})}), timeout=timeout)
            return Valasz(r.status, r.read(), dict(r.headers), time.time() - t0, r.geturl())
        except urllib.error.HTTPError as e:
            v = Valasz(e.code, e.read() if e.fp else b"", dict(e.headers or {}), time.time() - t0, url)
            if e.code < 500 or p == tobbszor: return v
            utolso = v
        except Exception as e:
            utolso = Valasz(0, ido=time.time() - t0, url=url, hiba=str(e))
        time.sleep(3 * (p + 1))   # átmeneti hiba: újrapróbáljuk, hogy ne riasszunk feleslegesen
    return utolso

class Linkek(HTMLParser):
    def __init__(self): super().__init__(); self.l = []
    def handle_starttag(self, tag, at):
        a = dict(at)
        if tag == "script" and a.get("src"): self.l.append(a["src"])
        if tag == "link" and a.get("href") and (a.get("rel") or "") in ("stylesheet", "icon", "apple-touch-icon", "manifest", "preload"): self.l.append(a["href"])
        if tag == "img" and a.get("src") and not a["src"].startswith("data:"): self.l.append(a["src"])

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--alap", default="https://penztar-gep.hu"); ap.add_argument("--bongeszo-nelkul", action="store_true")
    arg = ap.parse_args(); A = arg.alap.rstrip("/"); host = urllib.parse.urlparse(A).hostname

    # 1) Fő oldalak: válaszkód, tartalom, válaszidő
    oldalak = {"/": "Főoldal", "/webaruhaz/": "Webáruház", "/szerviz/": "Szerviz", "/tudnivalok/": "Tudnivalók",
               "/penztargep-valasztas/": "Pénztárgép-választás", "/webaruhaz/termek.php": "Terméklista (szerver oldali)"}
    html = {}
    for ut, nev in oldalak.items():
        v = kerd(A + ut)
        if v.st != 200: hiba(f"{nev} ({A+ut}) nem tölt be: {v.st or v.hiba}"); continue
        html[ut] = v.text
        if len(v.body) < 3000 or "Totál" not in v.text and "TOTÁL" not in v.text: hiba(f"{nev} ({A+ut}) hiányos tartalommal tölt be ({len(v.body)} bájt).")
        elif v.ido > 6: figy(f"{nev} lassan tölt be: {v.ido:.1f} mp.")
        else: jo(f"{nev}: rendben ({v.ido:.1f} mp)")
        if re.search(r"(Fatal error|Parse error|Warning:|Notice:|Deprecated:)\s*.{0,80}\.php", v.text): hiba(f"{nev}: PHP-hibaüzenet látszik az oldalon.")

    # 2) www, http → https, nem létező oldal
    v = kerd("https://www." + host + "/")
    if v.st != 200: hiba(f"A www.{host} cím nem tölt be: {v.st or v.hiba}")
    v = kerd("http://" + host + "/", kovet=False)
    if v.st not in (301, 302, 307, 308) or not str(v.hdr.get("Location", "")).startswith("https://"): figy(f"A http:// cím nem irányít át https://-re (válasz: {v.st}).")
    v = kerd(A + "/nem-letezo-oldal-ellenorzes-" + str(int(time.time())))
    if v.st != 404: figy(f"Nem létező oldalra {v.st} válasz jön 404 helyett.")

    # 3) Webáruház adatai (api.php)
    v = kerd(A + "/webaruhaz/api.php?a=data", fej={"Cache-Control": "no-cache"})
    termekek = []
    try:
        d = json.loads(v.text); termekek = d.get("products") or []
        if v.st != 200 or len(termekek) < 5: hiba(f"A webáruház termékadatai hiányosak (válasz {v.st}, {len(termekek)} termék).")
        else: jo(f"Webáruház adatai: {len(termekek)} termék, {len(d.get('categories') or [])} kategória")
        s = d.get("settings") or {}
        for k in ("telefon", "cim", "nyitvatartas"):
            if not s.get(k): hiba(f"A webáruház beállításaiból hiányzik: {k}.")
    except Exception as e:
        hiba(f"A webáruház adatvégpontja (api.php?a=data) nem ad érvényes adatot: {v.st or v.hiba} {str(e)[:80]}")
    v = kerd(A + "/webaruhaz/api.php?a=kapcsolat-jegy")
    if v.st != 200 or '"jegy"' not in v.text: hiba(f"Az űrlapok (kapcsolat, rendelés) szerveroldala nem válaszol rendesen: {v.st or v.hiba}")
    v = kerd(A + "/webaruhaz/api.php?a=users")
    if v.st != 401: hiba(f"Az admin adatai bejelentkezés nélkül is válaszolnak ({v.st}) – biztonsági hiba!")

    # 4) Védett fájlok nem olvashatók kívülről
    for ut in ("/webaruhaz/data/orders.php", "/webaruhaz/data/admin.users.php", "/webaruhaz/config.local.php", "/.git/config"):
        v = kerd(A + ut, tobbszor=0)
        tart = v.text.lower()
        if v.st == 200 and any(x in tart for x in ('"hash"', "'kulcs'", "[core]", '"products"', "@")):
            hiba(f"Védett fájl kívülről olvasható: {ut} – biztonsági hiba!")

    # 5) Személyes e-mail cím nem lehet nyilvános a nem jogi oldalakon
    for ut, t in html.items():
        if re.search(r"kucserabalazs79", t, re.I): hiba(f"A személyes e-mail cím látható a(z) {ut} oldal forrásában.")

    # 6) Oldaltérkép: minden benne lévő oldal és termékkép elérhető
    v = kerd(A + "/sitemap.php")
    urlek = re.findall(r"<loc>([^<]+)</loc>", v.text); kepek = re.findall(r"<image:loc>([^<]+)</image:loc>", v.text)
    if v.st != 200 or len(urlek) < 5: hiba(f"Az oldaltérkép (sitemap.php) hibás: {v.st}, {len(urlek)} cím.")
    rb = kerd(A + "/robots.txt")
    if rb.st != 200 or "Sitemap:" not in rb.text: figy("A robots.txt hiányzik vagy nem hivatkozik az oldaltérképre.")
    if re.search(r"^Disallow:\s*/\s*$", rb.text, re.M): hiba("A robots.txt az egész oldalt letiltja a Google elől!")

    # 7) Az oldalak által betöltött saját fájlok (szkriptek, stílusok, képek)
    eroforras = set()
    for ut, t in html.items():
        p = Linkek()
        try: p.feed(t)
        except Exception: pass
        for l in p.l:
            u = urllib.parse.urljoin(A + ut, l)
            if urllib.parse.urlparse(u).hostname in (host, "www." + host): eroforras.add(u.split("#")[0])
    cel = sorted(set(urlek) | set(kepek) | eroforras)
    def ell(u):
        r = kerd(u, tobbszor=1, timeout=40)
        return u, r.st, r.hiba, len(r.body)
    rossz = []
    with cf.ThreadPoolExecutor(6) as ex:
        for u, st, h, n in ex.map(ell, cel):
            if st != 200 or n == 0: rossz.append(f"{u.replace(A, '') or '/'} → {st or h}")
    if rossz: hiba(f"{len(rossz)} oldal vagy fájl nem érhető el:\n    " + "\n    ".join(rossz[:40]) + ("\n    …" if len(rossz) > 40 else ""))
    else: jo(f"Oldaltérkép és fájlok: mind a {len(cel)} cím elérhető")

    # 8) Nyelvi fájlok
    for ny in ("en", "de", "it", "hr", "sk", "pl", "zh"):
        v = kerd(A + f"/nyelv/{ny}.json", tobbszor=1)
        try:
            if v.st != 200 or len(json.loads(v.text)) < 500: raise ValueError
        except Exception: hiba(f"A(z) {ny} nyelvi fájl hiányzik vagy sérült ({v.st}).")

    # 9) SSL-tanúsítvány lejárata
    try:
        ctx = ssl.create_default_context()
        with socket.create_connection((host, 443), timeout=20) as s, ctx.wrap_socket(s, server_hostname=host) as ss:
            lejar = dt.datetime.strptime(ss.getpeercert()["notAfter"], "%b %d %H:%M:%S %Y %Z")
        nap = (lejar - dt.datetime.utcnow()).days
        if nap < 7: hiba(f"Az SSL-tanúsítvány {nap} napon belül lejár ({lejar:%Y-%m-%d})! Lejárat után a böngészők nem nyitják meg az oldalt.")
        elif nap < 20: figy(f"Az SSL-tanúsítvány {nap} nap múlva lejár ({lejar:%Y-%m-%d}); általában magától megújul.")
        else: jo(f"SSL-tanúsítvány: még {nap} napig érvényes")
    except Exception as e:
        hiba(f"Az SSL-tanúsítvány nem ellenőrizhető: {e}")

    # 10) Valódi böngészővel: JavaScript-hibák, hibás betöltések, a fő elemek megjelenése (asztali és mobil nézet)
    if not arg.bongeszo_nelkul:
        try: bongeszo(A, host)
        except Exception as e: figy(f"A böngészős ellenőrzés nem futott le: {str(e)[:200]}")

def bongeszo(A, host):
    from playwright.sync_api import sync_playwright
    lapok = [("/", "Főoldal", ["header", ".hero"]), ("/webaruhaz/", "Webáruház", ["#app"]), ("/webaruhaz/#kat-penztargep", "Pénztárgépek", [".pcard, .card, .prod, [data-id]"]),
             ("/webaruhaz/#kosar", "Kosár", ["#app"]), ("/szerviz/", "Szerviz", ["main, body"]), ("/webaruhaz/#aszf", "ÁSZF", ["#app"]), ("/webaruhaz/#impresszum", "Impresszum", ["#app"])]
    with sync_playwright() as pw:
        br = pw.chromium.launch()
        for nezet, opt in (("asztali", dict(viewport={"width": 1366, "height": 900})), ("mobil", dict(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True, device_scale_factor=2))):
            ctx = br.new_context(user_agent=UA.replace(" PTG-napi-ellenorzes", ""), locale="hu-HU", **opt)
            ctx.add_init_script("try{localStorage.setItem('ptg-lang','hu')}catch(e){}")
            for ut, nev, elemek in lapok:
                pg = ctx.new_page(); hib, rossz = [], []
                pg.on("pageerror", lambda e: hib.append(str(e)[:160]))
                pg.on("console", lambda m: m.type == "error" and hib.append(m.text[:160]))
                pg.on("response", lambda r: r.status >= 400 and urllib.parse.urlparse(r.url).hostname in (host, "www." + host) and "api.php" not in r.url and rossz.append(f"{r.status} {r.url.replace(A, '')}"))
                try:
                    pg.goto(A + ut, wait_until="networkidle", timeout=45000); pg.wait_for_timeout(1500)
                    for sel in elemek:
                        if not pg.query_selector(sel): hiba(f"{nev} ({nezet} nézet): nem jelenik meg a(z) „{sel}” elem.")
                    if pg.evaluate("document.body.innerText.trim().length") < 200: hiba(f"{nev} ({nezet} nézet): az oldal üres.")
                    tul = pg.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
                    if nezet == "mobil" and tul > 8: figy(f"{nev} (mobil nézet): {tul} képponttal oldalra kilóg.")
                except Exception as e:
                    hiba(f"{nev} ({nezet} nézet) nem töltött be a böngészőben: {str(e)[:150]}")
                zaj = ("favicon", "net::ERR_ABORTED", "googletagmanager", "google-analytics", "maps.google", "Permissions policy")
                hib = [h for h in hib if not any(z in h for z in zaj)]
                if hib: hiba(f"{nev} ({nezet} nézet) – JavaScript-hiba: " + " | ".join(sorted(set(hib))[:4]))
                if rossz: hiba(f"{nev} ({nezet} nézet) – nem töltődött be: " + ", ".join(sorted(set(rossz))[:6]))
                pg.close()
            ctx.close()
        br.close()
    jo("Böngészős ellenőrzés (asztali és mobil): lefutott")

if __name__ == "__main__":
    t0 = time.time()
    try: main()
    except Exception as e: hiba(f"Maga az ellenőrzés hibára futott: {e}")
    most = dt.datetime.now(dt.timezone(dt.timedelta(hours=1))).strftime("%Y. %m. %d. %H:%M")
    sor = ["PENZTAR-GEP.HU – NAPI ELLENŐRZÉS", f"Időpont: {most}", ""]
    if HIBAK:
        sor += [f"HIBÁT TALÁLTAM ({len(HIBAK)} db):", ""] + [f"✖ {h}" for h in HIBAK] + [""]
    if FIGY: sor += ["Figyelmeztetés (nem sürgős):", ""] + [f"• {f}" for f in FIGY] + [""]
    sor += ["Rendben lévő tételek:"] + [f"✓ {o}" for o in OK] + ["", f"Az ellenőrzés {time.time()-t0:.0f} mp alatt futott le."]
    open("jelentes.txt", "w", encoding="utf-8").write("\n".join(sor) + "\n")
    open("hibak.txt", "w").write(str(len(HIBAK)))
    print("\n".join(sor))
    sys.exit(1 if HIBAK else 0)
