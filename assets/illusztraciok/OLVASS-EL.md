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

## A képek és a mozgó részeik
- **TV-torony (Misina)** – `tv-torony`: a csúcs három szakaszban, egymásra épülve elhajlik a szélben, majd visszaleng (csucs-also, csucs-kozep, csucs-felso).
- **Zsolnay-kút – ökörfej** – `zsolnay-kut-okorfej`: a sárkányfej kiölti hosszú, villás kígyónyelvét (nyelv); a fülek megrebbennek (ful-bal, ful-jobb).
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
