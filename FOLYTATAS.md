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

## Webáruház – elfogadott látványterv szerinti kategóriaoldal (2026-10-31)
- Referencia: `referencia/webaruhaz/elfogadott_webaruhaz_latvanyterv.png` és az átadási specifikáció.
- Színek a specifikációból: #082746, #123B61, #D6A64E, #F4D58D, #182E48, #6E7D8E, #DFE5EB, #F7F8FA, #F7F3EB.
- Kategóriaoldal (`#kat-<kategória>/<termék>`): kék banner (cím arany kiemeléssel, gépfotó, 3 előny), útvonal, „Pénztárgépeink (8 termék)” + rendezés, kártyasor (kiválasztott arany kerettel), alatta kiemelt termék panel: galéria „Kiemelt termék” szalaggal, cím + pipás jellemzők + 4 fül (Termékleírás, Műszaki adatok, Letölthetők, Szolgáltatások), árdoboz (bruttó nagy, nettó kicsi, készlet, mennyiség, Kosárba, Ajánlatkérés).
- Mobilon: fejléc ikonokkal (telefon, e-mail, kosár, menü), lapozható kártyasor pontokkal, termékcím, galéria, ár, lenyíló szekciók.
- Alul krém szolgáltatássáv a dzsámi rajzzal, az átadott SVG ikonokkal (`assets/ikonok/`).
- A 8 pénztárgép valós adatokkal és árakkal (totalkkt), a képek **illusztrációk** (`webaruhaz/kepek/illusztracio/`, a termékben `illusztracio: true`, a galériában „Illusztráció” jelölés). Valódi fotó feltöltésekor az illusztráció automatikusan lekerül.
- Az Ajánlatkérés űrlap a megrendelések közé kerül („Ajánlatkérés” típus), készletet nem foglal.
- A külön termékoldal (`#t-<termék>`) a felhasználó következő látványterve alapján készül majd.

## Logó, lábléc, bővített főoldal (2026-10-31)
- Új logó (`assets/logo.webp`, átlátszó): nagy TOTÁL felirat, alatta „PÉNZTÁRGÉP ÉS SZÁMÍTÁSTECHNIKA”. A régi („Pécs · 1982”) változat nincs a repóban.
- Webáruház: a kék lábléc megszűnt, helyette egy vékony krémszínű sor; a szolgáltatássáv maradt.
- Főoldal lefelé görgethető szekciói (világos tónus): Amivel foglalkozunk (6 terület), Kiemelt termékek (a webáruház adataiból, élőben az api.php-ből, GitHubon a products.json-ból), Rólunk + homlokzatkép, Vásárlás 4 lépésben, E-pénztárgép határidők, GYIK, Kapcsolat (élő nyitva/zárva állapot magyar ünnepnapokkal, heti nyitvatartás a mai nap kiemelésével, elérhetőségek, ingyenes parkolás, útvonaltervezés, Google térkép), rövid lábléc, mobilon alsó Hívás/Útvonal sáv.
- A homlokzatkép a régi weboldal anyagából származik (2007-es fotó): `assets/uzlet-homlokzat.webp`. Friss fotó esetén ugyanazon a néven cserélhető.

## Admin hozzáférés: személyenként, e-mailes kóddal (2026-10-31)
- Tulajdonosok (api.php, OWNERS – csak a programban módosítható): Kucsera István +36209804748, Ifj. Kucsera István +36203222669, Kucsera Balázs +36205363120. Csak ők adhatnak/vonhatnak vissza további admin hozzáférést (Admin › Felhasználók fül).
- Belépés: „Ki lép be?” → saját jelszó → 6 jegyű kód az illető saját e-mail címére (10 percig érvényes, egyszer használható). Első belépés és elfelejtett jelszó: e-mailes kóddal állít be jelszót (min. 10 karakter).
- A tulajdonosok e-mail címei NEM a forráskódban vannak (a GitHub-tároló nyilvános): `webaruhaz/config.local.php` (gitignore-ban; minta: config.local.minta.php). Ezt kézzel kell feltölteni a tárhelyre.
- Belépés közben a felület nem mutatja az e-mail címet. Tartalék: telefonos hitelesítő app (opcionális) + tartalékkódok. 8 hibás próbálkozás után 15 perc zárolás az adott személyre.
- Adatok: data/admin.users.php (jelszó-ujjlenyomat, app, zárolás), data/admin.log.php (belépési napló, tulajdonos mindenkiét látja), védett .php fájlok.
- Levélküldés a tárhely mail() függvényével, feladó noreply@penztar-gep.hu. Fejlesztői teszt: PTG_MAIL_LOG környezeti változóval fájlba ír.
- Előnézetben (GitHub Pages / artifact) a szerver nélkül a böngésző szimulálja a folyamatot, és kiírja a kódot.

## Termékkínálat egy oldalon (2026-10-31)
- A webáruházban minden termékcsoport egymás alatt, elválasztva jelenik meg (címsor, kártyasor, saját kiemelt termék panel).
- Rögzített csoportválasztó sáv a menü alatt: kattintásra a csoporthoz ugrik, görgetéskor kiemeli az aktuálisat (és a felső menüben is). Nem kell visszalépni.
- `#kat-<csoport>` a csoporthoz görget, `#kat-<csoport>/<termék>` kiválasztja a terméket az adott csoport panelében.

## Termékkatalógus bővítése a régi oldal anyagából (2026-10-31)
- Forrás: Penztar-gep_termekkatalogus.zip (a totalkkt.t-online.hu képei és leírásai). A termékek a bolt saját fotóit kapták (`webaruhaz/kepek/termekek/`), az illusztráció csak a használt pénztárgépnél maradt.
- A csomag 3 képhozzárendelése hibás volt, javítva: NR-240 = image011, Jota E = image013, K10 = image017. Kasszafiókok: CWY-1 = image020 + image021 (fekete/fehér), Durable = image023, CD-4141 = image026 (ellenőrizendő).
- Új termékek: iMin 15,6" POS terminál (129 900 Ft + ÁFA; az üzleti árcédulán D3-504, a régi oldalon SWAN2 – ellenőrizendő), iMin D2 10,1" (92 900 Ft + ÁFA), Belövőszál 5000 db (2 500 Ft + ÁFA). A generikus „iMin POS” megszűnt.
- CP2200: a régi oldalon a 2 500 Ft a belövőszál-csomag ára volt, a pisztoly most „ár kérésre”.
- Műszaki adatok és leírások kiegészítve a régi oldal szövegei alapján (méretek, nyomtató, akku, csatlakozók, hitelesítési díjak, NR-440 kasszafiók nélküli ára, +2 év garancia).

## Főoldal sorrend, lábléc, jogi oldalak, ügyfélkezelő (2026-10-31)
- Főoldal szekciói: Amivel foglalkozunk, Kiemelt termékek, Kapcsolat, Vásárlás lépései, E-pénztárgép, GYIK, Rólunk (utolsó). Teljes lábléc: termékek, szolgáltatások, információk, elérhetőség, élő nyitva/zárva, Admin belépés.
- Webáruház: #impresszum és #adatkezeles oldal; adószám, cégjegyzékszám, tárhelyszolgáltató az adminban (Cégadatok) tölthető ki.
- Ügyfélkezelő (Admin › Ügyfelek): titkosított tárolás (data/clients.php, AES-256-GCM, kulcs: config.local.php 'kulcs' – ha elveszik, a lista nem olvasható vissza), napló (data/clients.log.php), 30 perc tétlenség után kiléptetés.
  - Távolság légvonalban az üzlettől, zónák (alap: 3/10/25/50 km + távoli), zónánként kiszállási díj; szűrés, keresés, rendezés, saját SVG térkép (külső térképszolgáltató nélkül), kijelölt ügyfelekhez Google Térkép útvonal (legközelebbi szomszéd sorrend).
  - Címből hely: OpenStreetMap Nominatim, szerveroldalon, csak a cím megy ki, 1 kérés/mp; nem talált cím esetén település szerint; kézi koordináta.
  - Import Excel/CSV (böngészőben olvasva, Windows-1250 is), oszlop-felismerés, előnézet; export CSV (csak tulajdonos, naplózva). Törlés, import, export, zónák: csak tulajdonos.
- Kezelő app: webaruhaz/kezelo.webmanifest + ikonok – iPhone Safari › Megosztás › Hozzáadás a Főképernyőhöz.
- Az ügyféllista fájlja még nincs meg (a meghajtó csatolt mappájában nincs); a felhasználó adja meg a helyét.

## Katalógus bővítés a 3D-fotó kutatásból (2026-10-31)
- Forrás: 3D_foto_kutatas.zip, Penztar-gep-hu_termek_katalogus.zip, Egyesitett_termeklista.csv. Valódi 8 nézetes forgatósorozat egyik termékhez sincs – fotózni kell (8 kép, 45°-onként, ugyanarról a példányról).
- Képjavítás: a szürke gép (régi oldal image013 + montel.hu galéria) = Montel Sento H Light; a Micra Jota E képe az image015. NR-240 PRO 4G: 4 nagy felbontású nézet (front + 3 szög). Az alap NR-240 a régi oldal image011 képét kapta.
- Minden termék műszaki adatai bővítve az ellenőrzött adatokkal (PLU, gyűjtők, nyomtató, csatlakozók, méret, tömeg). Javítások: Argox AS-8060 CCD (nem lézer), Open S14 8+6 karakter, Jota E 2,4 kg.
- Új termékek (ár kérésre, rendelésre): Sam4s NR-240, NR-270 kasszafiókkal, Elcom Euro-150TE Flexy, Montel Jota H / Micra Jota M, Montel Mini H / Micra Mini M, CashCube Light, CashCube Mini, Pris EP-210. A Durable NR440 fiók a meglévő Sam4s Durable tétellel összevonva; az Aclas PS1 az NR-240 kompatibilis mérlegeként szerepel.
- Letöltések: gyártói kezelési útmutatók (Montel Sento H, Jota H, Mini H).
- A CashCube Mini kereskedői fotói (másik bolt használt gépe, sorozatszámmal) nem kerültek fel.

## Következő lépések
1. A felhasználó jelzett további átrendezési kéréseket a főoldalon – ezeket kell előbb átvezetni.
2. Termékfotók feltöltése (élő tárhelyen, adminból).
3. Éles tárhely: a penztar-gep.hu SSL-tanúsítványa lejárt, a tárhelyszolgáltatónál meg kell újítani.

## E-mail küldése gomb, titkos értesítési cím (2026-11-04)
- A weboldalon (főoldal, webáruház, termékkatalógus, szerviz / tudnivalók / gépválasztás) **sehol nincs kiírva e-mail cím**: minden e-mail hivatkozás az „E-mail küldése” ablakot nyitja (`assets/kapcsolat.js`, 8 nyelv a `nyelv/*.json` szótárakból). Kivétel: Impresszum, vásárlási feltételek, Adatkezelési tájékoztató – ott marad a nyilvános cím (Cégadatok › Nyilvános e-mail cím, jelenleg info@penztar-gep.hu). A schema.org adatokból az e-mail kikerült.
- Használat bármely elemen: `data-kapcsolat` (+ `data-kapcsolat-targy`, `data-kapcsolat-termek`), szkriptből `PTGKapcsolat.open({...})`, közvetlen link: `…#uzenet`.
- Szerver: `webaruhaz/api.php?a=kapcsolat-jegy` (aláírt jegy) és `?a=kapcsolat`. Védelem: rejtett csapdamező, legalább 4 mp a megnyitás után (legfeljebb 2 óra), max. 2 hivatkozás, IP-korlát 10 percenként 3 / naponta 10 (`data/kapcsolat.ip.php`, csak IP-ujjlenyomat). A látogatónak nem megy automatikus levél (így idegen címekre sem lehet vele levelet küldetni).
- Az üzenet a Rendelések közé is bekerül „Üzenet” típussal (tárgy, termék, oldal, nyelv); a levél válaszcíme a látogató címe.
- **Titkos értesítési cím**: Admin › Cégadatok, nyitvatartás › „Értesítési e-mail cím” (csak tulajdonos; Mentés, Próbalevél). Fájl: `data/ertesites.php` (nincs a GitHubon). Ide mennek: E-mail küldése üzenetek, megrendelések, ajánlatkérések, szervizbejelentések, és a „kód az üzlet címére” belépési kód. Ha nincs beállítva, a nyilvános cím a tartalék. A vevőknek küldött visszaigazolások válaszcíme is ez.
- Teendő az élesítés után: értesítési cím = penztargepbolt@gmail.com, Próbalevél; a noreply@penztar-gep.hu postafiók létrehozása az ELIN-en ajánlott (feladócím).
