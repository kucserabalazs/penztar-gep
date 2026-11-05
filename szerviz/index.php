<?php
require __DIR__ . '/../inc/sablon.php';
$D = ptg_data(); $SVC = $D['services'] ?? [];
$ar = fn($s) => !empty($s['ar']) ? number_format((float)$s['ar'], 0, ',', "\u{00A0}") . "\u{00A0}Ft + ÁFA" : 'egyeztetés szerint';
$ld = [['@type' => 'Service', 'name' => 'Pénztárgép-szerviz és támogatás Pécsen', 'areaServed' => ['Pécs', 'Baranya megye'],
  'serviceType' => 'Pénztárgép-javítás, -felülvizsgálat és -üzembe helyezés', 'url' => PTG_SITE . '/szerviz/',
  'provider' => ['@id' => PTG_SITE . '/#uzlet'],
  'hasOfferCatalog' => ['@type' => 'OfferCatalog', 'name' => 'Szolgáltatások', 'itemListElement' => array_map(fn($s) => ['@type' => 'Offer', 'itemOffered' => ['@type' => 'Service', 'name' => $s['nev'] ?? '']], $SVC)]]];
ptg_fej('Pénztárgép-szerviz Pécsen · javítás, felülvizsgálat · Totál',
  'Pénztárgép-javítás, éves felülvizsgálat, üzembe helyezés és betanítás saját szervizünkben, Pécsen, a Hunyadi János utca 34. alatt. Számítógép- és hálózatjavítás is.',
  '/szerviz/', [['Kezdőlap', '/'], ['Szerviz és támogatás', '/szerviz/']], $ld); ?>
<h1>Szerviz és támogatás</h1>
<p class="lead">Saját szervizünkben javítjuk és évente felülvizsgáljuk a pénztárgépeket, és az üzembe helyezést, a NAV-bejelentést és a betanítást is elvégezzük. Számítógépek, nyomtatók és hálózatok javításában is segítünk.</p>
<div class="cta"><a class="gomb" href="/webaruhaz/#szerviz">Szervizt kérek</a><a class="gomb k" href="<?= e(ptg_tel_href()) ?>">Hívjon: <?= e(ptg_tel()) ?></a></div>

<h2>Így zajlik a javítás</h2>
<ol class="lepesek">
  <li><b>Hibabejelentés</b>Jelentse be a hibát telefonon, e-mailben vagy a szervizűrlapon. Pénztárgép esetén adja meg a készülék típusát és – ha rendelkezésére áll – az AP-számot is.</li>
  <li><b>Bevizsgálás</b>A készüléket hozza be üzletünkbe. Feltárjuk a hibát, és a javítás előtt tájékoztatjuk a várható költségről.</li>
  <li><b>Javítás</b>Az Ön jóváhagyása után elvégezzük a javítást. Az alkatrészek díját külön számítjuk fel.</li>
  <li><b>Átadás</b>Amikor a készülék elkészült, értesítjük, és üzletünkben átveheti.</li>
</ol>

<h2>Új pénztárgép üzembe helyezése</h2>
<ol class="lepesek">
  <li><b>Kódigénylés</b>Az üzembe helyezési kódot Ön vagy könyvelője igényli a NAV felületén. Ebben is segítünk.</li>
  <li><b>Programozás és NAV-bejelentés</b>Beprogramozzuk a gépet a vállalkozás adataival, és elvégezzük a NAV-bejelentést.</li>
  <li><b>Betanítás</b>Átadáskor bemutatjuk a mindennapi használat legfontosabb lépéseit.</li>
</ol>

<h2>Szolgáltatások és díjak</h2>
<table class="svc"><tbody><?php foreach ($SVC as $s): ?><tr><th scope="row"><?= e($s['nev'] ?? '') ?><?php if (!empty($s['leiras'])): ?><small><?= e($s['leiras']) ?></small><?php endif; ?></th><td class="ar"><?= e($ar($s)) ?></td></tr><?php endforeach; ?></tbody></table>
<p class="lead" style="font-size:.95rem">A feltüntetett árak nettó árak, ÁFA nélkül. Az alkatrészek díját külön számítjuk fel.</p>

<h2>Elérhetőség</h2>
<div class="kartyak">
  <div><h3>Üzlet és szerviz</h3><p>7625 Pécs, Hunyadi János utca 34.</p><p><?= e(ptg_nyitva()) ?></p><p><a href="https://www.google.com/maps/dir/?api=1&amp;destination=P%C3%A9cs%2C+Hunyadi+J%C3%A1nos+utca+34" target="_blank" rel="noopener">Útvonaltervezés</a></p></div>
  <div><h3>Telefon és e-mail</h3><p><a href="<?= e(ptg_tel_href()) ?>"><?= e(ptg_tel()) ?></a></p><p><a href="#uzenet" data-kapcsolat role="button">E-mail küldése</a></p></div>
</div>
<?php ptg_lab();
