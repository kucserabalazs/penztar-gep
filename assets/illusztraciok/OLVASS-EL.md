# Pécsi illusztrációk – a weboldal eszköztára

Vonalrajzos pécsi jelképek a penztar-gep.hu-hoz. Minden kép **vektoros (SVG)**, átlátszó hátterű,
bármekkora méretben éles, és a **színe CSS-ből állítható** (a vonal színe a `color` tulajdonságot követi).

## Mappák
| Fájl | Mire való |
|---|---|
| `eredeti/*.png` | a kapott eredeti rajzok, változatlanul (forrásanyag, ne töröljük) |
| `<név>.svg` | egyrétegű, álló változat – díszítésnek, háttérnek, nyomtatáshoz |
| `<név>-mozgo.svg` | rétegekre bontott, beépített animációval – önmagában is mozog |
| `png/<név>.png` | 1600 px széles, átlátszó PNG (dokumentumokhoz, közösségi médiához) |
| `lista.json` | gépi lista: név, cím, mozgatható részek |

## Tartalék rajzok – még nincsenek felhasználva (`eredeti/kesobbre/`)
A kapott eredeti PNG-k változatlanul, későbbi felhasználásra (a tárhelyre nem kerülnek fel, csak a GitHubon és a mentésekben vannak):
- `01-keresztes-oszlop-templom.png` – feszület a domboldalon, mellette kis harangtornyos kápolna, fák
- `02-dombtetoi-templom.png` – dombtetői templom kilátással a városra, virágzó fák, lépcső, kőkerítés
- `03-zsolnay-vaza.png` – díszes, virágmintás Zsolnay-váza két füllel
- `04-bronzjelveny.png` – kerek bronzjelvény Krisztus-monogrammal (XP), alfával és ómegával

Ha valamelyikre szükség lesz, ugyanúgy vektorizáljuk és mozgatható részekre bontjuk, mint a többit.

## A képek és a mozgó részeik
- **TV-torony (Misina)** – `tv-torony`: a csúcs három szakaszban, egymásra épülve elhajlik a szélben, majd visszaleng (csucs-also, csucs-kozep, csucs-felso).
- **Zsolnay-kút – ökörfej** – `zsolnay-kut-okorfej`: a sárkányfej kiölti hosszú, villás kígyónyelvét (nyelv) és kacsint: a szemgolyót körülvevő ovális szemrés lecsukódik (hej, pillak); a szarvak nem mozognak.
- **Gázi Kászim pasa dzsámija** – `dzsami`: a kupola kalapként megemelkedik, megbillen, majd visszaül (kupola); a félhold–kereszt meglendül (jelkep); csillanások.
- **Széchenyi tér – Szentháromság-szobor, dzsámi, Hunyadi-lovasszobor** – `szechenyi-ter`: Hunyadi a lovával együtt leugrik a talapzatról, a ló ágaskodik, majd visszaugranak (szobor); a web/lovasszobor-szepia.svg csak ezt a részletet mutatja; a dzsámi kupolája megemelkedik (kupola), a félhold meglendül (felhold); a Szentháromság-szobor csillaga forog (csillag).
- **Pécsi székesegyház** – `szekesegyhaz`: a négy torony keresztjén csillanások.

A Zsolnay-kút ökörfejének webes változata Zsolnay-zöld vonalú: `web/zsolnay-kut-okorfej-zold.svg`.

## Használat a weboldalon
Egyszerű kép (mozog, de a színe fix fekete):
```html
<img src="assets/illusztraciok/tv-torony-mozgo.svg" alt="" width="300">
```
Színezhető, vezérelhető változat – a fájl tartalmát a HTML-be illesztjük (inline SVG), és a színét CSS adja:
```css
.ill { color: #0a2a4c; --ill-hatter: #fff; }   /* vonalszín és a lovas mögötti takaró szín */
.ill.arany { color: #c9a24e; }
```
A mozgó részek `id`-vel elérhetők (pl. `#lovas`, `#kupola`, `#nyelv`), így bármelyik animáció
lecserélhető, lassítható, vagy csak egérrávitelre / görgetésre indítható:
```css
.ill #lovas { animation-play-state: paused; }
.ill:hover #lovas { animation-play-state: running; }
```
A forgáspontok már be vannak állítva (pl. a TV-torony csúcsa a tövénél hajlik, a kupola a peremén billen).
Ha a látogató a rendszerében a mozgáscsökkentést kérte, az animációk automatikusan leállnak.

## Újragenerálás
A rétegezés és az animációk a `eszkozok/illusztraciok/gen.py` szkripttel készülnek az `eredeti/` képekből
(új mozgó rész: egy sokszög a kivágáshoz + forgáspont + CSS-kulcskockák).

## Dzsámi angyallal és felhővel (2026-11-04)
A weboldal minden dzsámis rajza asztali nézetben ezt a jelenetet játssza (26 mp-es ciklus): a kupola a jobb peremén teljesen kinyílik jobbra,
balról felhő közeledik és a dzsámitól picit balra megáll, a tetőn kirepülő angyal ráül, fütyülni kezd (kótafejek), és a felhővel tovaúsznak, ki a jelenetből; a kupola visszacsukódik.
- `web/dzsami-szepia-angyal.svg` – széles vászon (az üres részek kitöltésére, `object-fit: cover`, a dzsámi középen)
- `web/dzsami-szepia-angyal-kicsi.svg` – keskenyebb (háttérképnek, pl. a térkép helyén)
- `web/szechenyi-ter-szepia-angyal.svg`, `web/szechenyi-ter-arany-angyal.svg` – Széchenyi tér, teljes szélességben; a felhő a lovasszobor mögött úszik
- Előállítás: `python3 eszkozok/illusztraciok/angyal.py` (a forrás a meglévő mozgó rajz; más rajzra is ráilleszthető a `keszit()` függvénnyel)
- Elhelyezés: `assets/dzsami-hely.js` méri a tartalom jobb szélét (`data-dzs-tartalom` a tárolón), a CSS ebből teszi a dzsámit az üres rész közepére.
- Telefonon a régi, álló rajzok maradnak (a `<picture>` csak 761 px felett cseréli).
