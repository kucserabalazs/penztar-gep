<?php
/*
 * Keresőbarát termékoldalak (SEO)
 * ------------------------------------------------------------
 *  termek.php                → teljes termékkatalógus (minden kategória)
 *  termek.php?kat=merleg     → kategóriaoldal (pl. Mérlegek Pécsen)
 *  termek.php?id=sam4s-nr-330 → önálló termékoldal
 *
 * Az adatokat élőben a data/products.json-ból olvassa, így ha a kezelőben
 * (admin) módosít egy terméket, árat vagy készletet, ezek az oldalak és a
 * sitemap is azonnal frissülnek. A látogató innen egy kattintással a
 * webáruház megfelelő termékére jut (ott rendelhet).
 */
declare(strict_types=1);
header('Content-Type: text/html; charset=utf-8');
header('X-Content-Type-Options: nosniff');

require __DIR__ . '/../inc/sablon.php';   /* közös fejléc, lábléc, közösségi címkék */
const SITE = 'https://penztar-gep.hu';
const SHOP = SITE . '/webaruhaz/';

$db = ptg_data();
$S = $db['settings'] ?? [];
$CATS = [];
foreach (($db['categories'] ?? []) as $c) { $CATS[$c['id']] = $c; }
$PRODS = array_values(array_filter($db['products'] ?? [], fn($p) => empty($p['rejtett'])));
$AFA = (float)($S['afa'] ?? 27);

function h($s): string { return htmlspecialchars((string)$s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function ft($n): string { return number_format((float)$n, 0, ',', "\u{00A0}") . "\u{00A0}Ft"; }
function fullname(array $p): string { return trim(($p['marka'] ?? '') . ' ' . ($p['nev'] ?? '')); }
function nowprice(array $p) { return ($p['akciosAr'] ?? null) ?: ($p['ar'] ?? null); }
function gross($n): int { global $AFA; return (int)round((float)$n * (1 + $AFA / 100)); }
function img(array $p): ?string { return ($p['kepek'][0] ?? null) ?: null; }
function absurl(string $rel): string { return SHOP . ltrim($rel, './'); }
function plink(array $p): string { return 'termek.php?id=' . rawurlencode($p['id']); }
function klink(string $k): string { return 'termek.php?kat=' . rawurlencode($k); }
/* készletállapot egy szabály szerint: raktáron / elfogyott / rendelésre */
function allapot(array $p): string {
  $k = (string)($p['keszlet'] ?? '');
  if ($k === 'raktaron' && array_key_exists('keszletDb', $p) && $p['keszletDb'] !== null && (int)$p['keszletDb'] <= 0) return 'elfogyott';
  return in_array($k, ['raktaron', 'elfogyott'], true) ? $k : 'rendelesre';
}
/* kép nélküli termékhez a kategória érme-illusztrációja (helyettesítő kép) */
function katkep(string $kat): string {
  static $M = ['penztargep' => 'penztargep', 'pos' => 'kassza', 'fiok' => 'kassza', 'merleg' => 'merleg', 'arazo' => 'arazogep', 'irodatechnika' => 'irodatechnika', 'kellek' => 'kellekanyagok', 'hasznalt' => 'hasznalt'];
  return 'assets/kategoria-ermek/' . ($M[$kat] ?? 'penztargep') . '-640.webp';
}
/* megjelenített név: a márka külön elemben, így a nyelvi motor a terméknevet magában is lefordíthatja */
function nevhtml(array $p): string { $m = trim((string)($p['marka'] ?? '')); return ($m !== '' ? '<span class="marka">' . h($m) . '</span> ' : '') . h(trim((string)($p['nev'] ?? ''))); }
/* oldalcím: részei „ · ” jellel elválasztva (a nyelvi motor részenként fordítja), legfeljebb kb. 65 karakter */
function cim(array ...$valt): string { foreach ($valt as $v) { $t = implode(' · ', array_filter($v, 'strlen')); if (mb_strlen($t) <= 65) return $t; } return implode(' · ', array_filter(end($valt), 'strlen')); }
function shoplink(array $p): string { return './#kat-' . rawurlencode($p['kategoria']) . '/' . rawurlencode($p['id']); }
function cut(string $s, int $n): string { $s = trim(preg_replace('/\s+/u', ' ', $s)); return mb_strlen($s) > $n ? rtrim(mb_substr($s, 0, $n - 1), " ,.;–-") . '…' : $s; }

/* nyitvatartás a beállításokból (0 = vasárnap … 6 = szombat), alapból H–P 9–15 */
$DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
$hours = [];
$ny = $S['nyitva'] ?? null;
if (is_array($ny)) { foreach ($ny as $k => $v) { if (is_array($v) && count($v) === 2 && isset($DAYS[(int)$k])) { $hours[] = ['@type' => 'OpeningHoursSpecification', 'dayOfWeek' => $DAYS[(int)$k], 'opens' => $v[0], 'closes' => $v[1]]; } } }
if (!$hours) { $hours[] = ['@type' => 'OpeningHoursSpecification', 'dayOfWeek' => ['Monday','Tuesday','Wednesday','Thursday','Friday'], 'opens' => '09:00', 'closes' => '15:00']; }

$STORE = [
  '@type' => ['Store', 'ElectronicsStore'],
  '@id' => SITE . '/#uzlet',
  'name' => 'Totál Pénztárgép és Számítástechnika',
  'legalName' => $S['cegnev'] ?? 'Totál Pénztárgép és Számítástechnika Kkt.',
  'url' => SITE . '/',
  'logo' => SITE . '/assets/logo/total-logo-512.png',
  'image' => SITE . '/assets/uzlet-homlokzat.webp',
  'telephone' => ptg_tel(),
  'priceRange' => '$$',
  'currenciesAccepted' => 'HUF',
  'paymentAccepted' => 'Készpénz, banki átutalás',
  'address' => ['@type' => 'PostalAddress', 'streetAddress' => 'Hunyadi János utca 34.', 'postalCode' => '7625', 'addressLocality' => 'Pécs', 'addressRegion' => 'Baranya', 'addressCountry' => 'HU'],
  'geo' => PTG_GEO,
  'openingHoursSpecification' => $hours,
  'hasMap' => 'https://www.google.com/maps?q=P%C3%A9cs%2C+Hunyadi+J%C3%A1nos+utca+34',
];

/* ---------- melyik oldal? ---------- */
$id  = isset($_GET['id'])  ? preg_replace('/[^a-z0-9-]/', '', strtolower((string)$_GET['id']))  : '';
$kat = isset($_GET['kat']) ? preg_replace('/[^a-z0-9-]/', '', strtolower((string)$_GET['kat'])) : '';
$P = null;
if ($id !== '') { foreach ($PRODS as $x) { if ($x['id'] === $id) { $P = $x; break; } } }
if ($id !== '' && !$P) { http_response_code(404); }
if ($kat !== '' && !isset($CATS[$kat])) { http_response_code(404); $kat = ''; }

$crumbs = [['Kezdőlap', SITE . '/'], ['Webáruház', SHOP], ['Termékkatalógus', SHOP . 'termek.php']];
$ld = [$STORE];

if ($P) {
  $c = $CATS[$P['kategoria']] ?? ['id' => $P['kategoria'], 'nev' => 'Termékek'];
  $name = fullname($P);
  $price = nowprice($P);
  $title = cim([$name, $P['alcim'] ?? '', 'Totál Pénztárgép'], [$name, $P['alcim'] ?? '', 'Totál'], [$name, $P['alcim'] ?? ''], [$name, $c['nev'] . ' Pécsen', 'Totál'], [$name, 'Totál Pénztárgép Pécs']);
  $desc = cut(($P['alcim'] ? $P['alcim'] . '. ' : '') . ($price ? 'Ár: ' . ft($price) . ' + ÁFA (bruttó ' . ft(gross($price)) . '). ' : '') . ($P['leiras'] ?? '') . ' Átvétel és szerviz Pécsen, a Hunyadi János utca 34. alatt.', 158);
  $canon = SHOP . plink($P);
  $ogimg = img($P) ? absurl(img($P)) : SITE . '/' . katkep($P['kategoria']);
  $crumbs[] = [$c['nev'], SHOP . klink($c['id'])];
  $crumbs[] = [$name, $canon];
  $kepek = !empty($P['kepek']) ? array_map('absurl', array_slice($P['kepek'], 0, 6)) : [SITE . '/' . katkep($P['kategoria'])];
  $leiras = cut(($P['alcim'] ? $P['alcim'] . '. ' : '') . ($P['leiras'] ?? ''), 4900);
  if ($price) {
    /* Product (termék-gazdagtalálat): csak ha van ár, mert az ár nélküli Offer érvénytelen */
    $prod = [
      '@type' => 'Product', '@id' => $canon . '#termek', 'name' => $name, 'url' => $canon,
      'description' => $leiras, 'category' => $c['nev'], 'sku' => $P['id'], 'image' => $kepek,
    ];
    if (!empty($P['marka'])) { $prod['brand'] = ['@type' => 'Brand', 'name' => $P['marka']]; }
    if (!empty($P['specs'])) { $prod['additionalProperty'] = array_map(fn($s) => ['@type' => 'PropertyValue', 'name' => $s[0], 'value' => $s[1]], array_slice($P['specs'], 0, 20)); }
    $all = allapot($P);
    $prod['offers'] = [
      '@type' => 'Offer', 'url' => $canon, 'priceCurrency' => 'HUF', 'price' => (string)gross($price),
      'priceSpecification' => ['@type' => 'UnitPriceSpecification', 'price' => gross($price), 'priceCurrency' => 'HUF', 'valueAddedTaxIncluded' => true],
      'availability' => $all === 'raktaron' ? 'https://schema.org/InStock' : ($all === 'elfogyott' ? 'https://schema.org/OutOfStock' : 'https://schema.org/BackOrder'),
      'itemCondition' => ($P['kategoria'] === 'hasznalt' || stripos($P['nev'], 'használt') !== false) ? 'https://schema.org/UsedCondition' : 'https://schema.org/NewCondition',
      'seller' => ['@id' => SITE . '/#uzlet'],
      'availableAtOrFrom' => ['@id' => SITE . '/#uzlet'],
      'availableDeliveryMethod' => 'https://schema.org/OnSitePickup',
      /* csak személyes átvétel: házhoz szállítás nincs */
      'shippingDetails' => ['@type' => 'OfferShippingDetails', 'shippingDestination' => ['@type' => 'DefinedRegion', 'addressCountry' => 'HU'], 'doesNotShip' => true],
      /* ÁSZF: 14 napos elállás, a terméket az üzletbe kell visszahozni */
      'hasMerchantReturnPolicy' => ['@type' => 'MerchantReturnPolicy', 'applicableCountry' => 'HU', 'returnPolicyCategory' => 'https://schema.org/MerchantReturnFiniteReturnWindow', 'merchantReturnDays' => 14, 'returnMethod' => 'https://schema.org/ReturnInStore'],
    ];
  } else {
    /* ár nélkül („Ár kérésre”): termékoldal + általános leírás, Product-állítás nélkül */
    $prod = [
      '@type' => 'ItemPage', '@id' => $canon . '#oldal', 'url' => $canon, 'name' => $name, 'description' => $leiras, 'inLanguage' => 'hu-HU',
      'primaryImageOfPage' => ['@type' => 'ImageObject', 'url' => $kepek[0]],
      'mainEntity' => ['@type' => 'Thing', 'name' => $name, 'description' => $leiras, 'image' => $kepek, 'url' => $canon, 'identifier' => $P['id']],
      'publisher' => ['@id' => SITE . '/#uzlet'],
    ];
  }
  $ld[] = $prod;
} elseif ($kat !== '') {
  $c = $CATS[$kat];
  $list = array_values(array_filter($PRODS, fn($p) => $p['kategoria'] === $kat));
  $title = cim([$c['nev'] . ' Pécsen', 'kínálat és szerviz', 'Totál Pénztárgép'], [$c['nev'] . ' Pécsen', 'Totál Pénztárgép']);
  $desc = cut(($c['leiras'] ?? '') . ' Személyes átvétel, beüzemelés és szerviz Pécsen, a Hunyadi János utca 34. alatt.', 158);
  $canon = SHOP . klink($kat);
  $ogimg = SITE . '/assets/og-kep.jpg';
  $crumbs[] = [$c['nev'], $canon];
} else {
  $title = 'Termékkatalógus · pénztárgépek, POS, mérlegek Pécsen · Totál';
  $desc = 'A Totál Pénztárgép teljes kínálata: online pénztárgépek, POS-terminálok, kasszafiókok, mérlegek, árazógépek, irodatechnika és kellékanyagok. Pécs, Hunyadi János utca 34.';
  $canon = SHOP . 'termek.php';
  $ogimg = SITE . '/assets/og-kep.jpg';
}
if (!$P && $id !== '') { $title = 'A termék nem található · Totál Pénztárgép'; }

$ld[] = ['@type' => 'BreadcrumbList', 'itemListElement' => array_map(fn($b, $i) => ['@type' => 'ListItem', 'position' => $i + 1, 'name' => $b[0], 'item' => $b[1]], $crumbs, array_keys($crumbs))];
if (!$P) {
  $lst = ($kat !== '') ? array_values(array_filter($PRODS, fn($p) => $p['kategoria'] === $kat)) : $PRODS;
  $ld[] = ['@type' => 'ItemList', 'name' => $kat !== '' ? $CATS[$kat]['nev'] : 'Termékkatalógus', 'itemListElement' => array_map(fn($p, $i) => ['@type' => 'ListItem', 'position' => $i + 1, 'url' => SHOP . plink($p), 'name' => fullname($p)], $lst, array_keys($lst))];
}

function ajanlott(array $p): string {
  static $A = [
    'penztargep' => ['kezi' => 'Mozgóárusításhoz, kiszállításhoz, piaci és rendezvényes árusításhoz, ahol nincs állandó pénztárhely.', 'kompakt' => 'Kisebb üzleteknek és szolgáltatóknak, ahol a pulton kevés a hely.', 'nagy' => 'Nagyobb forgalmú üzleteknek, ahol kasszafiók, vonalkódolvasó vagy mérleg is csatlakozik a géphez.', '_' => 'Üzleteknek és szolgáltatóknak, amelyeknek online pénztárgépet kell használniuk.'],
    'hasznalt' => ['_' => 'Annak, aki kedvezőbb áron, szervizünkben bevizsgált és átszemélyesített pénztárgépet keres.'],
    'pos' => ['scanner' => 'Üzleteknek, ahol a termékeket vonalkód alapján, gyorsan kell beolvasni.', 'nyomtato' => 'POS-rendszerekhez, számlázási és címkézési feladatokra.', '_' => 'Vendéglátóhelyeknek és üzleteknek, amelyek érintőképernyős kasszarendszert szeretnének.'],
    'fiok' => ['_' => 'Pénztárgéphez vagy POS-rendszerhez, a készpénz biztonságos tárolásához.'],
    'merleg' => ['_' => 'Boltoknak, piaci árusoknak és pultos kiszolgáláshoz, ahol a termékeket súly szerint árazzák.'],
    'arazo' => ['_' => 'Üzleteknek a termékek gyors és jól olvasható árazásához.'],
    'irodatechnika' => ['_' => 'Irodáknak, üzleteknek és otthoni használatra, igény szerint összeállítva és telepítve.'],
    'kellek' => ['_' => 'A mindennapi munkához: pénztárgépekhez, nyomtatókhoz és árazógépekhez.'],
  ];
  if (!empty($p['ajanlott'])) return (string)$p['ajanlott'];
  $k = $A[$p['kategoria'] ?? ''] ?? [];
  return $k[$p['modell'] ?? ''] ?? ($k['_'] ?? '');
}
function card(array $p): string {
  $pr = nowprice($p);
  $i = img($p);
  return '<a class="kartya" href="' . h(plink($p)) . '">'
    . '<span class="kk">' . ($i ? '<img src="' . h($i) . '" alt="" loading="lazy" decoding="async" width="320" height="240">' : '<img class="helyettes" src="../' . h(katkep($p['kategoria'] ?? '')) . '" alt="" loading="lazy" decoding="async" width="160" height="160">') . '</span>'
    . '<span class="kn"><b>' . nevhtml($p) . '</b><small>' . h($p['alcim'] ?? '') . '</small>'
    . '<em>' . ($pr ? h(ft($pr)) . ($p['arTol'] ? '-tól' : '') . ' <i>+ ÁFA</i>' : 'Ár kérésre') . '</em></span></a>';
}
/* közösségi kép: a termékkép mérete a fájlból (ha olvasható), egyébként az alapértelmezett OG-kép */
$ogkep = null;
if (($ogimg ?? '') !== '' && strpos($ogimg, SITE . '/') === 0) {
  $lok = __DIR__ . '/../' . substr($ogimg, strlen(SITE . '/'));
  $m = is_file($lok) ? @getimagesize($lok) : false;
  $ogkep = [$ogimg, $m[0] ?? 0, $m[1] ?? 0, $P ? fullname($P) : $title];
  if (substr($ogimg, -11) === '/og-kep.jpg') $ogkep = null;
}
?><!doctype html>
<html lang="hu">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="../assets/nezet.js?v=<?= PTG_V ?>"></script>
<title><?= h($title) ?></title>
<meta name="description" content="<?= h($desc ?? '') ?>">
<?php if ($id !== '' && !$P): ?><meta name="robots" content="noindex,follow">
<?php else: ?><meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<link rel="canonical" href="<?= h($canon) ?>">
<?php endif; ?>
<link rel="icon" href="../favicon.ico" sizes="any">
<link rel="icon" type="image/png" href="../assets/favicon-64.png">
<link rel="apple-touch-icon" href="../assets/apple-touch-icon.png">
<meta name="theme-color" content="#082746">
<?= ptg_kozossegi($title, $desc ?? '', $canon ?? SHOP, $P ? 'product' : 'website', $ogkep) ?>
<link rel="stylesheet" href="../assets/fonts/betutipusok.css?v=20261104">
<link rel="stylesheet" href="../assets/oldal.css?v=<?= PTG_V ?>">
<script type="application/ld+json"><?= json_encode(['@context' => 'https://schema.org', '@graph' => $ld], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG) ?></script>
<style>
.kk img.helyettes{width:auto;height:auto;max-width:150px;max-height:150px;opacity:.9}
.kep img.helyettes{max-width:62%;margin:0 auto}
</style>
</head>
<body>
<?= ptg_fejlec('webaruhaz/termek.php', '../') ?>
<main class="wrap" id="tartalom" tabindex="-1">
<nav class="morzsa" aria-label="Útvonal"><?php foreach ($crumbs as $i => $b) { echo $i ? '<span class="sep" aria-hidden="true">›</span>' : ''; echo $i === count($crumbs) - 1 ? '<span aria-current="page">' . h($b[0]) . '</span>' : '<a href="' . h($b[1]) . '">' . h($b[0]) . '</a>'; } ?></nav>

<?php if ($P):
  $c = $CATS[$P['kategoria']] ?? ['id' => $P['kategoria'], 'nev' => 'Termékek'];
  $pr = nowprice($P); ?>
<article class="termek">
  <div>
    <div class="kep"><?php if (img($P)): ?><img src="<?= h(img($P)) ?>" alt="<?= h(fullname($P)) ?>" width="800" height="600" fetchpriority="high"><?php else: ?><img class="helyettes" src="../<?= h(katkep($P['kategoria'])) ?>" alt="" width="640" height="640"><?php endif; ?></div>
    <?php if (count($P['kepek'] ?? []) > 1): ?><div class="kepek"><?php foreach (array_slice($P['kepek'], 1, 6) as $k => $src): ?><img src="<?= h($src) ?>" alt="<?= h(fullname($P)) ?> – <?= $k + 2 ?>. kép" loading="lazy" width="84" height="64"><?php endforeach; ?></div><?php endif; ?>
  </div>
  <div>
    <h1><?= nevhtml($P) ?></h1>
    <p class="lead"><?= h($P['alcim'] ?? '') ?></p>
    <div class="ar"><?php if ($pr): ?><?php if (!empty($P['akciosAr'])): ?><s><?= h(ft($P['ar'])) ?></s><?php endif; ?><b><?= h(ft($pr)) ?><?= $P['arTol'] ? '-tól' : '' ?></b> <span>+ ÁFA</span><small>bruttó <?= h(ft(gross($pr))) ?> (<?= h((string)$AFA) ?>% ÁFA-val)</small><?php else: ?><b>Ár kérésre</b><small>Kérjen ajánlatot telefonon vagy e-mailben.</small><?php endif; ?>
      <?php $all = allapot($P); ?><span class="kesz<?= $all === 'raktaron' ? '' : ' r' ?>"><?= $all === 'raktaron' ? 'Raktáron – átvehető Pécsen' : ($all === 'elfogyott' ? 'Jelenleg elfogyott – érdeklődjön' : 'Rendelésre – érdeklődjön a beszerzési időről') ?></span></div>
    <a class="gomb" href="<?= h(shoplink($P)) ?>">Megrendelem a webáruházban ›</a><a class="gomb k" href="<?= h(ptg_tel_href()) ?>">Hívjon: <?= h(ptg_tel()) ?></a><a class="gomb k" href="#uzenet" data-kapcsolat role="button" data-kapcsolat-targy="Ajánlatkérés" data-kapcsolat-termek="<?= h(fullname($P)) ?>">Kérdés e-mailben</a>
    <?php if (!empty($P['engedely'])): ?><p><b>NAV forgalmazási engedély:</b> <?= h($P['engedely']) ?></p><?php endif; ?>
    <?php if (!empty($P['garancia'])): ?><p><b>Garancia:</b> <?= h($P['garancia']) ?></p><?php endif; ?>
    <?php if (!empty($P['jellemzok'])): ?><h2>Főbb jellemzők</h2><ul class="jel"><?php foreach ($P['jellemzok'] as $j): ?><li><?= h($j) ?></li><?php endforeach; ?></ul><?php endif; ?>
  </div>
</article>
<?php if (ajanlott($P) !== ''): ?><section><h2>Kinek ajánljuk?</h2><p class="lead"><?= h(ajanlott($P)) ?></p></section><?php endif; ?>
<?php if (!empty($P['leiras'])): ?><section><h2>Leírás</h2><p class="lead"><?= nl2br(h($P['leiras'])) ?></p></section><?php endif; ?>
<?php if (!empty($P['specs'])): ?><section><h2>Műszaki adatok</h2><table class="spec"><tbody><?php foreach ($P['specs'] as $s): ?><tr><th scope="row"><?= h($s[0]) ?></th><td><?= h($s[1]) ?></td></tr><?php endforeach; ?></tbody></table></section><?php endif; ?>
<section><h2>Vásárlás, átvétel és szerviz Pécsen</h2><p class="lead">A terméket üzletünkben, Pécsen, a Hunyadi János utca 34. alatt veheti át (hétfőtől péntekig 9:00–15:00). Fizethet készpénzzel átvételkor vagy előre banki átutalással. <?= $P['kategoria'] === 'penztargep' ? 'Pénztárgépek esetén az üzembe helyezést, a NAV-bejelentést, a kezelés betanítását és az éves felülvizsgálatot is mi végezzük.' : 'A beállításban és a használatba vételben is segítünk.' ?></p></section>
<?php $rel = array_values(array_filter($PRODS, fn($x) => $x['kategoria'] === $P['kategoria'] && $x['id'] !== $P['id'])); if ($rel): ?>
<section><h2>Hasonló termékek</h2><div class="racs"><?php foreach (array_slice($rel, 0, 8) as $x) echo card($x); ?></div><p><a href="<?= h(klink($c['id'])) ?>">A csoport összes terméke ›</a></p></section>
<?php endif; ?>

<?php elseif ($id !== ''): ?>
<h1>Ez a termék nem található</h1><p class="lead">Lehet, hogy már nem forgalmazzuk. Nézze meg teljes kínálatunkat, vagy hívjon minket: <a href="<?= h(ptg_tel_href()) ?>"><?= h(ptg_tel()) ?></a>.</p><p><a class="gomb" href="termek.php">Termékkatalógus <span aria-hidden="true">›</span></a></p>

<?php else:
  $lista = $kat !== '' ? [$kat] : array_keys($CATS); ?>
<h1><?= $kat !== '' ? h($CATS[$kat]['nev']) . ' Pécsen' : 'Termékkatalógus' ?></h1>
<p class="lead"><?= $kat !== '' ? h($CATS[$kat]['leiras'] ?? '') : 'Online pénztárgépek, POS-rendszerek, kasszafiókok, mérlegek, árazógépek, irodatechnika és kellékanyagok – személyes átvétellel, beüzemeléssel és helyi szervizzel Pécsen, 1982 óta.' ?></p>
<div class="katok"><a href="termek.php"<?= $kat === '' ? ' class="on"' : '' ?>>Összes</a><?php foreach ($CATS as $k => $c) { if (!array_filter($PRODS, fn($p) => $p['kategoria'] === $k)) continue; echo '<a href="' . h(klink($k)) . '"' . ($k === $kat ? ' class="on"' : '') . '>' . h($c['nev']) . '</a>'; } ?></div>
<?php foreach ($lista as $k): $ps = array_values(array_filter($PRODS, fn($p) => $p['kategoria'] === $k)); if (!$ps) continue; ?>
<section><?php if ($kat === ''): ?><h2><a href="<?= h(klink($k)) ?>" style="text-decoration:none"><?= h($CATS[$k]['nev']) ?></a></h2><?php endif; ?><div class="racs"><?php foreach ($ps as $p) echo card($p); ?></div></section>
<?php endforeach; ?>
<?php if ($kat !== '' && !empty($CATS[$kat]['gyik'])): ?><section class="gyik"><h2>Gyakori kérdések</h2><?php foreach ($CATS[$kat]['gyik'] as $q): ?><details><summary><?= h($q[0]) ?></summary><p><?= h($q[1]) ?></p></details><?php endforeach; ?></section>
<script type="application/ld+json"><?= json_encode(['@context' => 'https://schema.org', '@type' => 'FAQPage', 'mainEntity' => array_map(fn($q) => ['@type' => 'Question', 'name' => $q[0], 'acceptedAnswer' => ['@type' => 'Answer', 'text' => $q[1]]], $CATS[$kat]['gyik'])], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG) ?></script><?php endif; ?>
<p><a class="gomb" href="./<?= $kat !== '' ? '#kat-' . h($kat) : '#termekek' ?>">Tovább a webáruházba ›</a></p>
<?php endif; ?>
</main>
<?= ptg_lablec('../') ?>
<?= ptg_szkriptek('/') ?>
</body>
</html>
