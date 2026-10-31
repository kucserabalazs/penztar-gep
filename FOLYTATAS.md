# Folytatási jegyzet

## Állás (2026-10-31)
- A főoldal elkészült a ChatGPT-vel készített, elfogadott sötétkék–arany terv alapján (fejléc logóval és elérhetőségekkel, arany menüsor, kezdőkép a termékcsoporttal és a „Pécs 1982 óta” jelvénnyel, ikonsáv, krémszínű alsó sáv).
- Az ikonsáv 2. eleme: „Számítástechnika és Irodatechnika”.
- A képek egy része a látványtervből lágy szélekkel kivágott részlet (termékcsoport, jelvény, logó, panoráma, dzsámi). Ha nagy felbontású, átlátszó hátterű változat érkezik, az `assets/` mappában ugyanazon a néven cserélhető.

## Mentett asztali változat
- A felhasználó kérésére 2026-10-31-én elmentve „asztali gépes verzió”-ként: `mentesek/asztali-v1/index.html`.
- Ez a jóváhagyott asztali megjelenés; további módosításoknál ehhez kell igazodni, és ide lehet visszaállni.

## Mobil változat
- Mobilon a „Pécs 1982 óta” jelvény a főcím mellé került jobbra, a külön sorba tört „Szerviz” szó mellé (a felhasználó jelölése alapján). Asztali nézetben a jelvény a termékcsoport mellett marad.

## Belépő animáció
- Betöltéskor kb. 2,5 mp alatt minden a helyére csúszik: logó és szlogen balról, elérhetőségek jobbról, menüpontok felülről sorban, arany vonalak kirajzolódnak, főcím soronként balról, az arany „és Szerviz” felvillan, a pipák felpattannak, gombok alulról, termékcsoport jobbról, jelvény forogva, ikonsáv sorban.
- Mozgáscsökkentést kérő eszközön az animáció kikapcsol.

## Webáruház (új, világos arculat)
- `webaruhaz/forras-index.html` a forrás; a `python3 build.py` (a webaruhaz mappában) beágyazza a `data/products.json`-t és elkészíti az `index.html`-t.
- Világos tónus a főoldal stílusjegyeivel: azonos sötétkék fejléc és arany menüpont, Montserrat dőlt címek, arany kiemelések, krém fejsáv.
- Készlet darabra: `keszletDb` (üres = rendelésre). A kosárba csak a raktáron lévő darabszám tehető; a szerver megrendeléskor zárolás alatt ellenőrzi és csökkenti a készletet, ha nincs elég, 409-es hibát ad.
- Termékoldal: médiaszínpad 360° / Fotók / 3D füllel. 360°: külön `spin` sorozatból, vagy ha legalább 8 fotó van, a fotókból (húzás tehetetlenséggel, automatikus forgás, nagyítás, teljes képernyő, előtöltés-jelző). Fotók: nagyító lencse, lapozás, teljes képernyős nézegető húzással. Ha nincs fotó, a szemléltető CSS-3D modell jelenik meg.
- Fülek: Áttekintés, Műszaki adatok (`specs`), Támogatás (letöltések, videó, szerviz), Gyakori kérdések (kategóriánként `gyik`); ragadós vásárlósáv, hasonló és nemrég megtekintett termékek.
- Lista: szűrők (márka, ár, csak raktáron), rendezés, rács/lista nézet, gyorsnézet, összehasonlítás (max. 3), kereső (Ctrl+K vagy /).
- Admin: készlet darabszám, fotók feltöltése és sorrendezése, külön 360° sorozat, műszaki adatok, letöltések, videó, kategóriánkénti GYIK.
- **Még nincs valódi termékfotó**: minden termék a 3D modellel jelenik meg, amíg az adminban fel nem töltik a fotókat. 360°-hoz 24–36, egyenletes szögben körbefotózott kép ajánlott, azonos távolságból, fehér háttér előtt.

## Következő lépések
1. A felhasználó jelzett további átrendezési kéréseket a főoldalon – ezeket kell előbb átvezetni.
2. Termékfotók feltöltése (élő tárhelyen, adminból).
3. Éles tárhely: a penztar-gep.hu SSL-tanúsítványa lejárt, a tárhelyszolgáltatónál meg kell újítani.
