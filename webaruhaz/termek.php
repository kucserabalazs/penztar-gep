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

const SITE = 'https://penztar-gep.hu';
const SHOP = SITE . '/webaruhaz/';

$db = json_decode((string)@file_get_contents(__DIR__ . '/data/products.json'), true) ?: [];
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
  'telephone' => '+36 72 215 652',
  'priceRange' => '$$',
  'currenciesAccepted' => 'HUF',
  'paymentAccepted' => 'Készpénz, banki átutalás',
  'address' => ['@type' => 'PostalAddress', 'streetAddress' => 'Hunyadi János utca 34.', 'postalCode' => '7625', 'addressLocality' => 'Pécs', 'addressRegion' => 'Baranya', 'addressCountry' => 'HU'],
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
  $title = $name . ($P['alcim'] ? ' – ' . $P['alcim'] : '') . ' | Totál Pénztárgép Pécs';
  if (mb_strlen($title) > 72) { $title = $name . ' – ár és átvétel Pécsen | Totál Pénztárgép'; }
  $desc = cut(($P['alcim'] ? $P['alcim'] . '. ' : '') . ($price ? 'Ár: ' . ft($price) . ' + ÁFA (bruttó ' . ft(gross($price)) . '). ' : '') . ($P['leiras'] ?? '') . ' Átvétel és szerviz Pécsen, a Hunyadi János utca 34. alatt.', 158);
  $canon = SHOP . plink($P);
  $ogimg = img($P) ? absurl(img($P)) : SITE . '/assets/og-kep.jpg';
  $crumbs[] = [$c['nev'], SHOP . klink($c['id'])];
  $crumbs[] = [$name, $canon];
  $prod = [
    '@type' => 'Product', '@id' => $canon . '#termek', 'name' => $name, 'url' => $canon,
    'description' => cut(($P['alcim'] ? $P['alcim'] . '. ' : '') . ($P['leiras'] ?? ''), 4900),
    'category' => $c['nev'], 'sku' => $P['id'],
  ];
  if (!empty($P['marka'])) { $prod['brand'] = ['@type' => 'Brand', 'name' => $P['marka']]; }
  if (!empty($P['kepek'])) { $prod['image'] = array_map('absurl', array_slice($P['kepek'], 0, 6)); }
  if (!empty($P['specs'])) { $prod['additionalProperty'] = array_map(fn($s) => ['@type' => 'PropertyValue', 'name' => $s[0], 'value' => $s[1]], array_slice($P['specs'], 0, 20)); }
  if ($price) {
    $prod['offers'] = [
      '@type' => 'Offer', 'url' => $canon, 'priceCurrency' => 'HUF', 'price' => (string)gross($price),
      'priceSpecification' => ['@type' => 'UnitPriceSpecification', 'price' => gross($price), 'priceCurrency' => 'HUF', 'valueAddedTaxIncluded' => true],
      'availability' => ($P['keszlet'] ?? '') === 'raktaron' ? 'https://schema.org/InStock' : (($P['keszlet'] ?? '') === 'elfogyott' ? 'https://schema.org/OutOfStock' : 'https://schema.org/PreOrder'),
      'itemCondition' => ($P['kategoria'] === 'hasznalt' || stripos($P['nev'], 'használt') !== false) ? 'https://schema.org/UsedCondition' : 'https://schema.org/NewCondition',
      'seller' => ['@id' => SITE . '/#uzlet'],
      'availableAtOrFrom' => ['@id' => SITE . '/#uzlet'],
      'availableDeliveryMethod' => 'https://schema.org/OnSitePickup',
    ];
  }
  $ld[] = $prod;
} elseif ($kat !== '') {
  $c = $CATS[$kat];
  $list = array_values(array_filter($PRODS, fn($p) => $p['kategoria'] === $kat));
  $title = $c['nev'] . ' Pécsen – ' . ($c['listaCim'] ?? 'kínálat') . ' | Totál Pénztárgép';
  $desc = cut(($c['leiras'] ?? '') . ' Személyes átvétel, beüzemelés és szerviz Pécsen, a Hunyadi János utca 34. alatt.', 158);
  $canon = SHOP . klink($kat);
  $ogimg = SITE . '/assets/og-kep.jpg';
  $crumbs[] = [$c['nev'], $canon];
} else {
  $title = 'Termékkatalógus – pénztárgépek, POS, mérlegek, árazógépek Pécsen | Totál';
  $desc = 'A Totál Pénztárgép teljes kínálata: online pénztárgépek, POS terminálok, kasszafiókok, mérlegek, árazógépek, irodatechnika és kellékanyagok. Pécs, Hunyadi János utca 34.';
  $canon = SHOP . 'termek.php';
  $ogimg = SITE . '/assets/og-kep.jpg';
}
if (!$P && $id !== '') { $title = 'A termék nem található | Totál Pénztárgép Pécs'; }

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
    . '<span class="kk">' . ($i ? '<img src="' . h($i) . '" alt="' . h(fullname($p)) . '" loading="lazy" decoding="async" width="320" height="240">' : '<span class="nincs">TOTÁL</span>') . '</span>'
    . '<span class="kn"><b>' . h(fullname($p)) . '</b><small>' . h($p['alcim'] ?? '') . '</small>'
    . '<em>' . ($pr ? h(ft($pr)) . ($p['arTol'] ? '-tól' : '') . ' <i>+ ÁFA</i>' : 'Ár kérésre') . '</em></span></a>';
}
?><!doctype html>
<html lang="hu">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= h($title) ?></title>
<meta name="description" content="<?= h($desc ?? '') ?>">
<?php if ($id !== '' && !$P): ?><meta name="robots" content="noindex,follow">
<?php else: ?><meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<link rel="canonical" href="<?= h($canon) ?>">
<?php endif; ?>
<link rel="icon" type="image/png" href="../assets/favicon-64.png">
<link rel="apple-touch-icon" href="../assets/apple-touch-icon.png">
<meta name="theme-color" content="#082746">
<meta property="og:type" content="<?= $P ? 'product' : 'website' ?>">
<meta property="og:locale" content="hu_HU">
<meta property="og:site_name" content="Totál Pénztárgép Pécs">
<meta property="og:title" content="<?= h($title) ?>">
<meta property="og:description" content="<?= h($desc ?? '') ?>">
<meta property="og:url" content="<?= h($canon ?? SHOP) ?>">
<meta property="og:image" content="<?= h($ogimg ?? SITE . '/assets/og-kep.jpg') ?>">
<meta name="twitter:card" content="summary_large_image">
<link rel="stylesheet" href="../assets/fonts/betutipusok.css?v=20261104">
<script type="application/ld+json"><?= json_encode(['@context' => 'https://schema.org', '@graph' => $ld], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG) ?></script>
<style>
:root{--n0:#041a33;--n2:#082746;--n3:#123b61;--gold:#d6a64e;--gold-l:#f4d58d;--gold-d:#b7832e;--ink:#182e48;--muted:#5f6f80;--line:#e3dccd;--cream:#f7f3eb;--fd:"Montserrat","Arial Black",Arial,sans-serif;--fb:"Inter","Segoe UI",system-ui,sans-serif}
*{box-sizing:border-box}html,body{margin:0}
body{background:var(--cream) url("../assets/motivumok/gilos-vilagos.svg") center/900px;color:var(--ink);font:17px/1.6 var(--fb);-webkit-font-smoothing:antialiased}
a{color:inherit}
.wrap{max-width:1180px;margin:0 auto;padding:0 max(16px,4vw)}
header{background:radial-gradient(ellipse 70% 140% at 25% 0%,#0b2a52,var(--n2) 55%,var(--n0));color:#fff;border-bottom:3px solid var(--gold)}
header .wrap{display:flex;align-items:center;gap:22px;min-height:84px;flex-wrap:wrap;padding-block:10px}
header img{height:56px;width:auto;display:block}
header nav{margin-left:auto;display:flex;gap:18px;flex-wrap:wrap;font:600 .95rem var(--fd)}
header nav a{text-decoration:none;color:#f4d58d}header nav a:hover{color:#fff}
.morzsa{font-size:.88rem;color:var(--muted);padding:18px 0 4px}.morzsa a{text-decoration:none}.morzsa a:hover{text-decoration:underline}
h1{font:italic 800 clamp(1.7rem,3.6vw,2.6rem)/1.12 var(--fd);color:var(--n2);margin:.25em 0 .3em}
h2{font:italic 800 clamp(1.3rem,2.4vw,1.75rem)/1.2 var(--fd);color:var(--n2);margin:1.6em 0 .6em}
.lead{font-size:1.1rem;color:#33475e;max-width:780px}
.termek{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.05fr);gap:clamp(20px,4vw,48px);align-items:start;margin:10px 0 30px}
.kep{background:#fff;border:1px solid var(--line);border-radius:20px;padding:20px;box-shadow:0 20px 40px -24px rgba(8,39,70,.35)}
.kep img{width:100%;height:auto;display:block;aspect-ratio:4/3;object-fit:contain}
.kepek{display:flex;gap:10px;margin-top:12px;flex-wrap:wrap}.kepek img{width:84px;height:64px;object-fit:contain;background:#fff;border:1px solid var(--line);border-radius:10px;padding:4px}
.ar{background:#fff;border:1px solid var(--line);border-left:5px solid var(--gold);border-radius:16px;padding:16px 20px;margin:14px 0}
.ar b{font:800 1.9rem var(--fd);color:var(--n2)}.ar small{color:var(--muted);display:block}
.ar s{color:var(--muted);margin-right:8px}
.kesz{display:inline-block;font-weight:700;font-size:.9rem;padding:4px 12px;border-radius:999px;background:#e6f4ec;color:#17643b;margin-top:8px}
.kesz.r{background:#fff4e0;color:#8a5200}
.gomb{display:inline-flex;align-items:center;gap:8px;font:700 1.02rem var(--fd);text-decoration:none;padding:14px 22px;border-radius:12px;margin:6px 8px 6px 0;background:linear-gradient(180deg,#f4d58d,#d6a64e 55%,#b7832e);color:#1b1404;box-shadow:0 6px 0 #8c6020,0 12px 20px -8px rgba(0,0,0,.35)}
.gomb.k{background:linear-gradient(180deg,#fff,#e8edf3);color:var(--n2);box-shadow:0 6px 0 #b9c3cf,0 12px 20px -8px rgba(0,0,0,.25)}
ul.jel{padding:0;list-style:none}ul.jel li{padding-left:30px;position:relative;margin:.35em 0}
ul.jel li::before{content:"";position:absolute;left:0;top:.28em;width:20px;height:20px;background:url("../assets/motivumok/erme-total.svg") center/contain no-repeat}
table{width:100%;border-collapse:collapse;background:#fff;border-radius:14px;overflow:hidden;border:1px solid var(--line)}
th,td{text-align:left;padding:10px 14px;border-bottom:1px solid #eee6d6;vertical-align:top}th{width:38%;color:var(--n3);font-weight:600;background:#fbf8f1}
.racs{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:18px;margin:14px 0 30px}
.kartya{display:flex;flex-direction:column;background:#fff;border:1px solid var(--line);border-radius:18px;overflow:hidden;text-decoration:none;box-shadow:0 14px 30px -22px rgba(8,39,70,.45);transition:transform .2s}
.kartya:hover{transform:translateY(-3px)}
.kk{height:210px;display:grid;place-items:center;background:#fff;padding:12px;overflow:hidden}.kk img{width:100%;height:100%;max-height:186px;object-fit:contain}
.nincs{font:italic 800 1.6rem var(--fd);color:var(--gold-d)}
.kn{padding:12px 16px 16px;display:flex;flex-direction:column;gap:4px;border-top:1px solid #f0e9da}
.kn b{font:700 1.02rem/1.25 var(--fd);color:var(--n2)}.kn small{color:var(--muted);font-size:.88rem;line-height:1.35}.kn em{font-style:normal;font-weight:700;margin-top:auto;color:var(--n2)}.kn i{font-style:normal;font-weight:500;font-size:.8rem;color:var(--muted)}
.katok{display:flex;flex-wrap:wrap;gap:10px;margin:10px 0 6px}.katok a{background:#fff;border:1px solid var(--line);border-radius:999px;padding:8px 16px;text-decoration:none;font-weight:600}
.katok a.on{background:var(--n2);color:#fff;border-color:var(--n2)}
.gyik details{background:#fff;border:1px solid var(--line);border-radius:14px;padding:12px 18px;margin:10px 0}.gyik summary{font-weight:700;cursor:pointer;color:var(--n2)}
footer{background:var(--n0);color:#d6dfea;margin-top:50px;border-top:3px solid var(--gold);font-size:.98rem}
footer .wrap{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:24px;padding-block:34px}
footer b{color:#f4d58d;font-family:var(--fd)}footer a{text-decoration:none}footer a:hover{text-decoration:underline}
@media (max-width:820px){.termek{grid-template-columns:1fr}body{font-size:18px}header nav{margin-left:0;width:100%}}
</style>
</head>
<body>
<header><div class="wrap"><a href="../"><img src="../assets/logo/total-logo-fejlec.svg" alt="TOTÁL Pénztárgép és Számítástechnika – Pécs" width="232" height="70"></a>
<nav aria-label="Fő menü"><a href="../">Kezdőlap</a><a href="./">Webáruház</a><a href="termek.php">Termékkatalógus</a><a href="../#kapcsolat">Kapcsolat</a></nav></div></header>
<main class="wrap">
<nav class="morzsa" aria-label="Útvonal"><?php foreach ($crumbs as $i => $b) { echo $i ? ' › ' : ''; echo $i === count($crumbs) - 1 ? '<span>' . h($b[0]) . '</span>' : '<a href="' . h($b[1]) . '">' . h($b[0]) . '</a>'; } ?></nav>

<?php if ($P):
  $c = $CATS[$P['kategoria']] ?? ['id' => $P['kategoria'], 'nev' => 'Termékek'];
  $pr = nowprice($P); ?>
<article class="termek" itemscope>
  <div>
    <div class="kep"><?php if (img($P)): ?><img src="<?= h(img($P)) ?>" alt="<?= h(fullname($P) . ($P['alcim'] ? ' – ' . $P['alcim'] : '')) ?>" width="800" height="600" fetchpriority="high"><?php else: ?><div class="nincs" style="aspect-ratio:4/3;display:grid;place-items:center">TOTÁL</div><?php endif; ?></div>
    <?php if (count($P['kepek'] ?? []) > 1): ?><div class="kepek"><?php foreach (array_slice($P['kepek'], 1, 6) as $k => $src): ?><img src="<?= h($src) ?>" alt="<?= h(fullname($P)) ?> – <?= $k + 2 ?>. kép" loading="lazy" width="84" height="64"><?php endforeach; ?></div><?php endif; ?>
  </div>
  <div>
    <h1><?= h(fullname($P)) ?></h1>
    <p class="lead"><?= h($P['alcim'] ?? '') ?></p>
    <div class="ar"><?php if ($pr): ?><?php if (!empty($P['akciosAr'])): ?><s><?= h(ft($P['ar'])) ?></s><?php endif; ?><b><?= h(ft($pr)) ?><?= $P['arTol'] ? '-tól' : '' ?></b> <span>+ ÁFA</span><small>bruttó <?= h(ft(gross($pr))) ?> (<?= h((string)$AFA) ?>% ÁFA-val)</small><?php else: ?><b>Ár kérésre</b><small>Kérjen ajánlatot telefonon vagy e-mailben.</small><?php endif; ?>
      <span class="kesz<?= ($P['keszlet'] ?? '') === 'raktaron' ? '' : ' r' ?>"><?= ($P['keszlet'] ?? '') === 'raktaron' ? 'Raktáron – átvehető Pécsen' : (($P['keszlet'] ?? '') === 'elfogyott' ? 'Jelenleg elfogyott – érdeklődjön' : 'Rendelésre – kérjen időpontot') ?></span></div>
    <a class="gomb" href="<?= h(shoplink($P)) ?>">Megrendelem a webáruházban ›</a><a class="gomb k" href="tel:+3672215652">Hívjon: 72/215-652</a><a class="gomb k" href="#uzenet" data-kapcsolat role="button" data-kapcsolat-targy="Ajánlatkérés" data-kapcsolat-termek="<?= h(fullname($P)) ?>">Kérdés e-mailben</a>
    <?php if (!empty($P['engedely'])): ?><p><b>NAV forgalmazási engedély:</b> <?= h($P['engedely']) ?></p><?php endif; ?>
    <?php if (!empty($P['garancia'])): ?><p><b>Garancia:</b> <?= h($P['garancia']) ?></p><?php endif; ?>
    <?php if (!empty($P['jellemzok'])): ?><h2>Főbb jellemzők</h2><ul class="jel"><?php foreach ($P['jellemzok'] as $j): ?><li><?= h($j) ?></li><?php endforeach; ?></ul><?php endif; ?>
  </div>
</article>
<?php if (ajanlott($P) !== ''): ?><section><h2>Kinek ajánljuk?</h2><p class="lead"><?= h(ajanlott($P)) ?></p></section><?php endif; ?>
<?php if (!empty($P['leiras'])): ?><section><h2>Leírás</h2><p class="lead"><?= nl2br(h($P['leiras'])) ?></p></section><?php endif; ?>
<?php if (!empty($P['specs'])): ?><section><h2>Műszaki adatok</h2><table><?php foreach ($P['specs'] as $s): ?><tr><th scope="row"><?= h($s[0]) ?></th><td><?= h($s[1]) ?></td></tr><?php endforeach; ?></table></section><?php endif; ?>
<section><h2>Vásárlás, átvétel és szerviz Pécsen</h2><p class="lead">A terméket üzletünkben, Pécsen, a Hunyadi János utca 34. alatt veheti át (hétfőtől péntekig 9:00–15:00). Fizethet készpénzzel átvételkor vagy előre banki átutalással. <?= $P['kategoria'] === 'penztargep' ? 'Pénztárgépek esetén az üzembe helyezést, a NAV-bejelentést, a kezelés betanítását és az éves felülvizsgálatot is mi végezzük.' : 'A beállításban és a használatba vételben is segítünk.' ?></p></section>
<?php $rel = array_values(array_filter($PRODS, fn($x) => $x['kategoria'] === $P['kategoria'] && $x['id'] !== $P['id'])); if ($rel): ?>
<section><h2>További <?= h(mb_strtolower($c['nev'])) ?></h2><div class="racs"><?php foreach (array_slice($rel, 0, 8) as $x) echo card($x); ?></div><p><a href="<?= h(klink($c['id'])) ?>">Az összes <?= h(mb_strtolower($c['nev'])) ?> ›</a></p></section>
<?php endif; ?>

<?php elseif ($id !== ''): ?>
<h1>Ez a termék nem található</h1><p class="lead">Lehet, hogy már nem forgalmazzuk. Nézze meg teljes kínálatunkat, vagy hívjon minket: <a href="tel:+3672215652">72/215-652</a>.</p><p><a class="gomb" href="termek.php">Termékkatalógus ›</a></p>

<?php else:
  $lista = $kat !== '' ? [$kat] : array_keys($CATS); ?>
<h1><?= $kat !== '' ? h($CATS[$kat]['nev']) . ' Pécsen' : 'Termékkatalógus' ?></h1>
<p class="lead"><?= $kat !== '' ? h($CATS[$kat]['leiras'] ?? '') : 'Online pénztárgépek, POS rendszerek, kasszafiókok, mérlegek, árazógépek, irodatechnika és kellékanyagok – személyes átvétellel, beüzemeléssel és helyi szervizzel Pécsen, 1982 óta.' ?></p>
<div class="katok"><a href="termek.php"<?= $kat === '' ? ' class="on"' : '' ?>>Összes</a><?php foreach ($CATS as $k => $c) { if (!array_filter($PRODS, fn($p) => $p['kategoria'] === $k)) continue; echo '<a href="' . h(klink($k)) . '"' . ($k === $kat ? ' class="on"' : '') . '>' . h($c['nev']) . '</a>'; } ?></div>
<?php foreach ($lista as $k): $ps = array_values(array_filter($PRODS, fn($p) => $p['kategoria'] === $k)); if (!$ps) continue; ?>
<section><?php if ($kat === ''): ?><h2><a href="<?= h(klink($k)) ?>" style="text-decoration:none"><?= h($CATS[$k]['nev']) ?></a></h2><?php endif; ?><div class="racs"><?php foreach ($ps as $p) echo card($p); ?></div></section>
<?php endforeach; ?>
<?php if ($kat !== '' && !empty($CATS[$kat]['gyik'])): ?><section class="gyik"><h2>Gyakori kérdések</h2><?php foreach ($CATS[$kat]['gyik'] as $q): ?><details><summary><?= h($q[0]) ?></summary><p><?= h($q[1]) ?></p></details><?php endforeach; ?></section>
<script type="application/ld+json"><?= json_encode(['@context' => 'https://schema.org', '@type' => 'FAQPage', 'mainEntity' => array_map(fn($q) => ['@type' => 'Question', 'name' => $q[0], 'acceptedAnswer' => ['@type' => 'Answer', 'text' => $q[1]]], $CATS[$kat]['gyik'])], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG) ?></script><?php endif; ?>
<p><a class="gomb" href="./<?= $kat !== '' ? '#kat-' . h($kat) : '#termekek' ?>">Tovább a webáruházba ›</a></p>
<?php endif; ?>
</main>
<footer><div class="wrap">
<div><b>Totál Pénztárgép és Számítástechnika Kkt.</b><br>7625 Pécs, Hunyadi János utca 34.<br>Pénztárgép szaküzlet és szerviz 1982 óta</div>
<div><b>Elérhetőség</b><br>Telefon: <a href="tel:+3672215652">72/215-652</a><br><a href="#uzenet" data-kapcsolat role="button">E-mail küldése</a><br>Nyitvatartás: hétfő–péntek 9:00–15:00</div>
<div><b>Kínálat</b><br><?php foreach ($CATS as $k => $c) { if (!array_filter($PRODS, fn($p) => $p['kategoria'] === $k)) continue; echo '<a href="' . h(klink($k)) . '">' . h($c['nev']) . '</a><br>'; } ?></div>
</div></footer>
<script src="/assets/kapcsolat.js?v=20261104" defer></script>
</body>
</html>
