# TOTÁL webáruház – Claude átadási dokumentáció

## Tartalom
- `index.html`: reszponzív, interaktív demóoldal 8 pénztárgéppel, termékadatlap-résszel, fülekkel, mennyiségválasztóval és demó kosárral.
- `assets/products/`: a grafikai referencia tábláról kivágott 8 termékkártya-kép.
- `assets/icons/`: 12 külön SVG ikon.
- `assets/references/`: referencia látványtervek és grafikai eszköztábla.
- `docs/`: ez a specifikáció.

## Valós kapcsolati adatok
Telefon: +36 72 215 652
E-mail: info@penztar-gep.hu
Cím: 7625 Pécs, Hunyadi János utca 34.

## Arculati tokenek
- Mély fejléc-kék: #082746
- Másodlagos kék: #123B61
- Arany: #D6A64E
- Világos arany: #F4D58D
- Fő szöveg: #182E48
- Másodlagos szöveg: #6E7D8E
- Keret: #DFE5EB
- Háttér: #F7F8FA
- Krém: #F7F3EB
- Fehér: #FFFFFF

## Tipográfia
- Fejlécek: Montserrat 700–900
- Törzsszöveg és kezelőfelület: Inter 400–700
- Termékoldal H1/H2: 22–35 px
- Termékkártya név: 14 px desktop / 12 px mobil
- Navigáció: 13 px
- Törzsszöveg: 12–14 px
- Gomb: 12 px, 700
- Gombmagasság: kb. 38–42 px; lekerekítés: 7–9 px

## Fejlesztési megjegyzések – kötelező élesítés előtt
1. A termékfotók jelenleg a generált grafikai referencia tábláról kivágott képrészletek. Ezek nem gyártói fotók és nem átlátszó kivágások. Éles webáruházhoz cseréld őket jogtiszta, pontos modellfotókra.
2. A terméknevek és árak demonstrációs adatok. A valódi készletet, árakat, nettó/bruttó számítást és termékjellemzőket a kereskedő hiteles adataiból kell betölteni.
3. A kosár és ajánlatkérés jelenleg csak kliensoldali demó visszajelzés. Nem történik rendelés, fizetés vagy e-mailküldés.
4. A 360 fokos nézethez termékenként legalább 24–36, egyenletes szögből készült fotó szükséges; ezekből képkocka-váltós forgató jeleníthető meg. Valódi 3D-hez külön fotogrammetriai/3D modellkészítés és GLB/GLTF export szükséges.
5. A weboldal önálló HTML demó. Éles rendszerhez backend, adatbázis, rendeléskezelés, számlázás, fizetési szolgáltató, adatkezelési és cookie-megoldás szükséges.
6. A Google Fonts betöltése internetkapcsolatot igényel; a betűtípusok lokális hosztolása javasolt.
7. A nyolc termék megjelenítése katalógus- és termékadatlap-struktúra bemutatására szolgál; a termékspecifikus műszaki tartalmat modellenként kell ellenőrizni.

## Claude-nak szóló feladat
A ZIP-et projektgyökérként nyisd meg. Az `index.html` a jelenlegi prototípus. A látványt őrizd meg, de az összes demonstrációs termékadatot cseréld le hiteles termékadatokra. A működő rendszerhez tervezz termékadat-modellt, adminisztrálható termékkatalógust, valódi kosarat, ajánlatkérést és rendelési folyamatot. A vizuális referencia az `assets/references/` mappában található.
