#!/usr/bin/env python3
"""A szerveren lévő termékadatokban (products.json) kicseréli a lektorált szövegeket.
Csak olyan szöveget cserél, amely PONTOSAN megegyezik a régi változattal; árakhoz,
készlethez és más adatokhoz nem nyúl (kivéve a hiányzó gyökérkulcsok pótlását, lásd „gyoker”). Kilépési kód: 0 = volt csere, 1 = nem volt mit cserélni."""
import json, sys
cel, lista = sys.argv[1], sys.argv[2]
adat = json.load(open(cel, encoding="utf-8"))
lst = json.load(open(lista, encoding="utf-8"))
parok = {p["regi"]: p["uj"] for p in lst if "regi" in p and "termek" not in p}
# Hiányzó beállítások pótlása (csak ha még üres): {"beallitas": kulcs, "ertek": érték}
potlas = [p for p in lst if "beallitas" in p]
db = 0
def jar(x):
    global db
    if isinstance(x, dict):
        return {k: jar(v) for k, v in x.items()}
    if isinstance(x, list):
        return [jar(v) for v in x]
    if isinstance(x, str) and x in parok:
        db += 1
        return parok[x]
    return x
uj = jar(adat)
# Egy adott termék egy mezőjének célzott cseréje: {"termek": id, "regi": ..., "uj": ...}
# (a termék teljes adatán belül csak a pontosan egyező szöveget cseréli – pl. engedélyszám)
for p in [p for p in lst if "termek" in p]:
    for i, t in enumerate(uj.get("products", []) if isinstance(uj, dict) else []):
        if t.get("id") == p["termek"]:
            parok_t = {p["regi"]: p["uj"]}
            def jar_t(x):
                global db
                if isinstance(x, dict): return {k: jar_t(v) for k, v in x.items()}
                if isinstance(x, list): return [jar_t(v) for v in x]
                if isinstance(x, str) and x in parok_t:
                    db += 1; return parok_t[x]
                return x
            uj["products"][i] = jar_t(t)
if isinstance(uj, dict):
    s = uj.setdefault("settings", {})
    for p in potlas:
        if not str(s.get(p["beallitas"]) or "").strip():
            s[p["beallitas"]] = p["ertek"]; db += 1
# Beállítás-listából elem törlése: {"lista_torol": kulcs, "elem": érték} (pl. mobilszám)
    for p in [p for p in lst if "lista_torol" in p]:
        l = s.get(p["lista_torol"])
        if isinstance(l, list) and p["elem"] in l:
            s[p["lista_torol"]] = [x for x in l if x != p["elem"]]; db += 1
# Hiányzó gyökérkulcs pótlása (csak ha még nincs meg, így egy későbbi admin-beállítást soha nem ír felül):
# {"gyoker": kulcs, "ertek": érték} – pl. {"gyoker": "keszletKovetes", "ertek": false}
if isinstance(uj, dict):
    for p in [p for p in lst if "gyoker" in p]:
        if p["gyoker"] not in uj:
            uj[p["gyoker"]] = p["ertek"]; db += 1
print(f"Lektorált termékszövegek cseréje: {db} db")
if not db:
    sys.exit(1)
json.dump(uj, open(cel, "w", encoding="utf-8"), ensure_ascii=False, indent=4)
