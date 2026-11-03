# Nyelvek
A weboldal fordításai (a Zephyr-oldal nyelvi motorja: `assets/nyelv.js`).
- `hu.json`: a mesterlista – minden magyar felirat (kulcs = érték).
- `en, de, it, hr, sk, pl, zh`: a fordítások; kulcs a magyar felirat, érték a fordítás. `{#}` = szám.
- Új vagy módosított magyar szöveg: nyissa meg az oldalt `?forditas=gyujt` végződéssel, a böngésző konzoljában `ZI18N.collected()` adja a még nem fordított feliratokat; ezeket kell felvenni a szótárakba.
- Ellenőrzés: `python3 eszkozok/nyelv/ellenoriz.py en de it hr sk pl zh`
- Az admin felület mindig magyar.
