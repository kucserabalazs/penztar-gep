# penztar-gep.hu – Totál Pénztárgép és Számítástechnika, Pécs

Az új penztar-gep.hu weboldal forrása.

- **Főoldal:** `index.html` – az elfogadott sötétkék–arany látványterv alapján, a képek az `assets/` mappában.
- **Webáruház:** `webaruhaz/` – termékek, kosár, megrendelés, szerviz bejelentés, jelszavas admin (`webaruhaz/#admin`).
  - Az admin mentése és a megrendelések fogadása PHP-t igényel (`api.php`), ezért élesben PHP-s tárhelyen működik.
  - GitHub Pages-en a webáruház előnézeti módban fut: minden látszik, a változások csak a böngészőben maradnak.
- Termékadatok és árak: `webaruhaz/data/products.json`.

Elérhetőség: 7625 Pécs, Hunyadi János utca 34. · +36 72 215 652 · info@penztar-gep.hu
