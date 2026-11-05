#!/usr/bin/env python3
"""Jogi oldalak fordításának betöltése: python3 eszkozok/nyelv/jogi_betolt.py <fájl>
A fájlban {"<nyelv>": {"ASZF-001": "...", ...}} JSON (akár szöveg közé ágyazva).
Ellenőrzi: minden szakasz megvan, a {HELYŐRZŐK}, HTML-címkék és ______ vonalak egyeznek a magyarral.
Hibátlan nyelvet ír a nyelv/jogi-<nyelv>.json fájlba."""
import json, re, sys, os
GY = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
src = json.load(open(os.path.join(GY, "nyelv/jogi-hu.json"), encoding="utf-8"))
t = open(sys.argv[1], encoding="utf-8").read()
d = json.loads(re.search(r"\{.*\}", t, re.S).group(0))
ok = True
for lang, m in d.items():
    hib = [f"hiányzik: {k}" for k in src if k not in m] + [f"fölösleges: {k}" for k in m if k not in src]
    for k, v in m.items():
        if k not in src: continue
        h = src[k]["hu"]
        for ph in set(re.findall(r"\{[A-Z0-9]+\}", h)) | set(re.findall(r"\{[A-Z0-9]+\}", v)):
            if v.count(ph) != h.count(ph): hib.append(f"{k}: helyőrző {ph}")
        if sorted(re.findall(r"</?[a-z]+", h)) != sorted(re.findall(r"</?[a-z]+", v)): hib.append(f"{k}: HTML-címke")
        if h.count("______") != v.count("______"): hib.append(f"{k}: kitöltendő vonal")
        if re.search(r"\b(\w+) \1\b", v): print(f"  figyelem – {lang} {k}: ismétlődő szó: {re.search(r'\b(\w+) \1\b', v).group(0)}")
    print(lang, "OK" if not hib else hib)
    if hib: ok = False; continue
    json.dump(m, open(os.path.join(GY, f"nyelv/jogi-{lang}.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
sys.exit(0 if ok else 1)
