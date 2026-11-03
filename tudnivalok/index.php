<?php
require __DIR__ . '/../inc/sablon.php';
$ELLENORIZVE = '2026. november 4.';
$gyik = [
  ['Meddig használható az online pénztárgépem?', 'A NAV tájékoztatása szerint az online pénztárgépek 2028. július 1-jéig használhatók. Addig az e-pénztárgépre való áttérés önkéntes.'],
  ['Kötelező már most e-pénztárgépet venni?', 'Nem. Az e-pénztárgép 2025. július 1-je óta helyezhető üzembe, de a használata jelenleg nem általánosan kötelező. A pénztárgép-használatra kötelezett vállalkozásoknak 2028. július 1-jétől kell hardveralapú e-pénztárgépre váltaniuk.'],
  ['Használhatok felhőalapú e-pénztárgépet?', 'Pénztárgép-használatra kötelezett tevékenységhez a felhőalapú e-pénztárgép nem használható; ilyenkor online pénztárgép vagy hardveralapú e-pénztárgép jöhet szóba. Ha a tevékenysége nem kötelezett pénztárgép-használatra, önkéntesen felhőalapú vagy hardveralapú e-pénztárgépet is használhat.'],
  ['Mit jelent a nyugtaadat-szolgáltatás?', 'A kézi nyugtatömbbel vagy számítógéppel kiállított nyugták adatait 2026. szeptember 1-jétől a NAV felé be kell jelenteni: napi összesítésben, a nyugta kiállítását követő 3 naptári napon belül. E-pénztárgép használata esetén ezt a készülék automatikusan elvégzi.'],
];
$ld = [['@type' => 'FAQPage', 'mainEntity' => array_map(fn($q) => ['@type' => 'Question', 'name' => $q[0], 'acceptedAnswer' => ['@type' => 'Answer', 'text' => $q[1]]], $gyik)],
       ['@type' => 'Article', 'headline' => 'Pénztárgép és e-pénztárgép tudnivalók', 'dateModified' => '2026-11-04', 'author' => ['@type' => 'Organization', 'name' => 'Totál Pénztárgép és Számítástechnika Kkt.'], 'inLanguage' => 'hu-HU']];
ptg_fej('Pénztárgép és e-pénztárgép tudnivalók 2026 – határidők, NAV | Totál Pécs',
  'Online pénztárgép, hardveralapú és felhőalapú e-pénztárgép: határidők, nyugtaadat-szolgáltatás és teendők a NAV tájékoztatása alapján. Ellenőrizve: 2026. november 4.',
  '/tudnivalok/', [['Kezdőlap', '/'], ['Pénztárgép és e-pénztárgép tudnivalók', '/tudnivalok/']], $ld); ?>
<h1>Pénztárgép és e-pénztárgép tudnivalók</h1>
<p class="datum">Utoljára ellenőrizve: <?= e($ELLENORIZVE) ?> · a NAV tájékoztatása alapján</p>
<p class="lead">Röviden összefoglaljuk, mit kell tudnia az online pénztárgépekről és az e-pénztárgépekről. A szabályok vállalkozásonként eltérhetnek, ezért a saját helyzetét mindig egyeztesse könyvelőjével is.</p>

<h2>Háromféle eszköz – nem felcserélhető fogalmak</h2>
<div class="kartyak">
  <div><h3>Online pénztárgép</h3><p>A ma legelterjedtebb, NAV-engedéllyel rendelkező készülék. Az adóügyi egységen keresztül mobilhálózaton küldi az adatokat a NAV-nak.</p><p>A NAV tájékoztatása szerint 2028. július 1-jéig használható.</p></div>
  <div><h3>Hardveralapú e-pénztárgép</h3><p>Új típusú, NAV-engedéllyel forgalmazott készülék, amely interneten keresztül közvetlenül küldi az adatokat a NAV-nak.</p><p>2025. július 1-je óta helyezhető üzembe. A NAV 2026. augusztus 6-án adta ki az első ilyen készülék forgalmazási engedélyét.</p></div>
  <div><h3>Felhőalapú e-pénztárgép</h3><p>Szoftveres megoldás, amelyet a vállalkozás saját eszközén (pl. telefonon vagy számítógépen) használ.</p><p>Pénztárgép-használatra kötelezett tevékenységhez nem használható; ott online pénztárgép vagy hardveralapú e-pénztárgép jöhet szóba.</p></div>
</div>

<h2>Fontos határidők</h2>
<div class="idovonal">
  <div><time datetime="2025-07-01">2025. július 1.</time><span>Az e-pénztárgépek üzembe helyezhetők (az érvényes forgalmazási engedéllyel rendelkező típusok).</span></div>
  <div><time datetime="2026-09-01">2026. szeptember 1.</time><span>Kötelező nyugtaadat-szolgáltatás a kézi és a számítógéppel kiállított nyugtákról: napi összesítésben, 3 naptári napon belül.</span></div>
  <div><time datetime="2026-09-10">2026. szeptember 10.</time><span>A NAV pénztárgépes felülete, a KOBAK új neve: Pénztárgép Portál. A működése nem változott.</span></div>
  <div><time datetime="2028-07-01">2028. július 1.</time><span>Eddig használhatók az online pénztárgépek. Ettől az időponttól a pénztárgép-használatra kötelezett vállalkozásoknak hardveralapú e-pénztárgépet kell használniuk.</span></div>
</div>

<h2>Gyakori kérdések</h2>
<div class="gyik"><?php foreach ($gyik as $q): ?><details><summary><?= e($q[0]) ?></summary><p><?= e($q[1]) ?></p></details><?php endforeach; ?></div>

<h2>Mit érdemes most tennie?</h2>
<ol class="lepesek">
  <li><b>Nem kell kapkodnia</b>Ha online pénztárgépe van, azt 2028. július 1-jéig használhatja. Az átállást érdemes időben, de átgondoltan megtervezni.</li>
  <li><b>Egyeztessen könyvelőjével</b>Ő tudja megmondani, hogy vállalkozása tevékenysége pénztárgép-használatra kötelezett-e, és milyen nyilvántartási teendői vannak.</li>
  <li><b>Kérjen tőlünk tájékoztatást</b>Megmutatjuk, mely engedélyezett készülékek jöhetnek szóba az Ön munkájához, és mennyibe kerül az átállás.</li>
</ol>
<div class="cta"><a class="gomb" href="/webaruhaz/#e-penztargep">E-pénztárgépes tájékoztatást kérek</a><a class="gomb k" href="tel:+3672215652">Hívjon: 72/215-652</a></div>

<p class="figy">Ez az oldal általános tájékoztatás, nem minősül jogi vagy adótanácsadásnak. A termékek engedélyezettségét mindig a NAV aktuális engedélylistája alapján ellenőrizzük.</p>

<h2>Hivatalos források</h2>
<ul class="forrasok">
  <li><a href="https://nav.gov.hu/ado/enyugta" target="_blank" rel="noopener">NAV – eNyugta és e-pénztárgép tájékoztató</a></li>
  <li><a href="https://nav.gov.hu/ado/onlinepenztargepek_1417761437385" target="_blank" rel="noopener">NAV – Online pénztárgépek</a></li>
  <li><a href="https://penztargepportal.nav.gov.hu/" target="_blank" rel="noopener">NAV – Pénztárgép Portál</a></li>
</ul>
<?php ptg_lab();
