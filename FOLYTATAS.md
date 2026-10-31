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

## Admin belépés jelszóval + telefonos kóddal (2026-10-31)
- Jól látható „Admin” gomb: főoldal menüsor és lábléc, webáruház menüsor (mobilon a menüben).
- Kétlépcsős belépés (TOTP, RFC 6238): jelszó, majd a telefon hitelesítő alkalmazásának 6 jegyű kódja (iPhone: Beállítások › Jelszavak; vagy Google/Microsoft Authenticator). SMS nem kell.
- Bekapcsolás: Admin › Biztonság › „Bekapcsolás a telefonommal” (QR-kód, telefonon „Megnyitás a telefonon” gomb, kézi kulcs), a telefon kódjával megerősítve. Utána 8 egyszer használható tartalékkód jelenik meg.
- Kikapcsolás jelszó + kód kell. Biztonság fülön jelszócsere és az utolsó 30 belépés naplója.
- api.php: `login` (ha be van kapcsolva: need2fa), `login2`, `totp-setup`, `totp-enable`, `totp-disable`, `security`. Újrajátszás elleni védelem (egy kód csak egyszer), 5 perces időkorlát, lassítás hibás próbálkozásnál.
- A titkos adatfájlok `.php` kiterjesztésűek, elejükön záró sorral (admin.hash.php, admin.totp.php, admin.log.php, orders.php), így .htaccess nélkül sem tölthetők le. A régi orders.json / admin.hash automatikusan átkerül.
- Nyitvatartás az adminban (Cégadatok, nyitvatartás fül): napi nyitás/zárás, rendkívüli zárva tartás (napok vagy időszakok). A főoldal élő „nyitva/zárva” jelzése ebből számol.

## Következő lépések
1. A felhasználó jelzett további átrendezési kéréseket a főoldalon – ezeket kell előbb átvezetni.
2. Termékfotók feltöltése (élő tárhelyen, adminból).
3. Éles tárhely: a penztar-gep.hu SSL-tanúsítványa lejárt, a tárhelyszolgáltatónál meg kell újítani.
