#!/usr/bin/env python3
"""A szerveren lévő termékadatokban (products.json) kicseréli a lektorált szövegeket.
Csak olyan szöveget cserél, amely PONTOSAN megegyezik a régi változattal; árakhoz,
készlethez és más adatokhoz nem nyúl. Kilépési kód: 0 = volt csere, 1 = nem volt mit cserélni."""
import json, sys
cel, lista = sys.argv[1], sys.argv[2]
adat = json.load(open(cel, encoding="utf-8"))
parok = {p["regi"]: p["uj"] for p in json.load(open(lista, encoding="utf-8"))}
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
print(f"Lektorált termékszövegek cseréje: {db} db")
if not db:
    sys.exit(1)
json.dump(uj, open(cel, "w", encoding="utf-8"), ensure_ascii=False, indent=4)
