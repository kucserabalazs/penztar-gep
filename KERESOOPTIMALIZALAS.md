# Penztar-gep.hu – keresőoptimalizálás (SEO)

## Ami az oldalba be van építve

- **Kezdőlap (index.html):** kulcsszavas cím („Pénztárgép Pécs – …”), leírás, kanonikus cím, közösségi megosztási kép (assets/og-kep.jpg), és a Google számára gépileg olvasható adatok (JSON-LD):
  - üzlet (cím, telefon, e-mail, nyitvatartás, alapítás 1982, kiszolgált terület Pécs és Baranya, szolgáltatások);
  - weboldal;
  - a Gyakori kérdések mind a hat kérdése.
- **Webáruház (webaruhaz/index.html):** kulcsszavas cím és leírás, kanonikus cím, morzsamenü-adatok.
- **Önálló, kereshető termékoldalak (webaruhaz/termek.php):**
  - `termek.php?id=…`: minden termék saját oldalt kap. Rajta van az ár (nettó és bruttó), a készlet, a jellemzők, a műszaki adatok és a Product-adatok, így a Google árat és készletet is mutathat a találatban.
  - `termek.php?kat=…`: kategóriaoldalak, például „Mérlegek Pécsen”, a kategória GYIK-jével.
  - `termek.php`: a teljes termékkatalógus.
  - Az adatokat élőben a kezelőből (admin) olvassa. Ha új terméket vesz fel vagy árat módosít, az oldalak maguktól frissülnek.
- **sitemap.php:** élő oldaltérkép az összes oldallal és termékképpel.
- **robots.txt:** megmutatja a Google-nek az oldaltérképet, és kizárja a belső mappákat.
- **.htaccess:** tömörítés, böngésző-gyorsítótár, biztonsági fejlécek, belső mappák tiltása.
- **Nyelvváltó:** a keresőrobotok mindig a magyar oldalt kapják. Erre azért van szükség, mert a Google angol böngészőnyelvvel érkezik, és enélkül az angol fordítást indexelné.

## Teendők feltöltés után (ezek nélkül a Google lassan vagy rosszul talál rá)

1. **SSL:** a tárhely kezelőfelületén kapcsolja be az ingyenes SSL-tanúsítványt (Let's Encrypt). Ha a https://penztar-gep.hu lakattal megnyílik, a `.htaccess` fájlban törölje a `#` jeleket a „HTTPS és egységes cím” blokk soraiból.
2. **Google Search Console** (search.google.com/search-console):
   - adja hozzá a `penztar-gep.hu` domaint, és igazolja a tárhelyszolgáltatónál egy DNS TXT rekorddal;
   - a Webhelytérképek menüben küldje be ezt a címet: `https://penztar-gep.hu/sitemap.php`;
   - az URL-ellenőrzésnél kérjen indexelést a kezdőlapra és a webáruházra.
3. **Google Cégprofil** (business.google.com). A helyi keresésekben („pénztárgép Pécs”, „pénztárgép szerviz Pécs”) ez hozza a legtöbbet, ezért ez a legfontosabb.
   - **Adatok:** a név, a cím és a telefonszám egyezzen a weboldallal: Totál Pénztárgép és Számítástechnika, 7625 Pécs, Hunyadi János utca 34., 72/215-652.
   - **Kategóriák:** a felajánlott listából válassza a pénztárgépekhez legközelebb álló fő kategóriát. Mellé vegyen fel számítógép-javítással és irodatechnikával kapcsolatos további kategóriákat.
   - **Weboldal:** `https://penztar-gep.hu/`. Adja meg a nyitvatartást is, és töltsön fel fotókat az üzletről és a termékekről.
   - **Vélemények:** kérje meg az elégedett ügyfeleket, hogy írjanak értékelést. Ez erősen javítja a helyezést.
4. **Bing Webmaster Tools:** a Search Console-ból egy kattintással importálható.
5. **Hivatkozások:** a Pénztárgépcentrum viszonteladói listáján, a helyi cégjegyzékekben (pl. Cylex, Arany Oldalak) és a NAV szervizlistában a cégadatok egyezzenek a weboldallal, és mutassanak a penztar-gep.hu-ra.
