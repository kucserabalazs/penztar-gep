<?php
/* Közös oldalsablon a tájékoztató oldalakhoz (szerviz, tudnivalók, pénztárgép-választás).
   Csak függvényeket tartalmaz; közvetlenül megnyitva nem jelenít meg semmit. */
const PTG_SITE = 'https://penztar-gep.hu';
function e($s): string { return htmlspecialchars((string)$s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function ptg_data(): array {
  $f = __DIR__ . '/../webaruhaz/data/products.json';
  $d = is_file($f) ? json_decode((string)file_get_contents($f), true) : null;
  return is_array($d) ? $d : [];
}
function ptg_fej(string $title, string $desc, string $path, array $crumbs, array $ld = []): void {
  $canon = PTG_SITE . $path;
  $ld[] = ['@type' => 'BreadcrumbList', 'itemListElement' => array_map(fn($c, $i) => ['@type' => 'ListItem', 'position' => $i + 1, 'name' => $c[0], 'item' => PTG_SITE . $c[1]], $crumbs, array_keys($crumbs))];
?><!doctype html>
<html lang="hu">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="/assets/nezet.js"></script>
<title><?= e($title) ?></title>
<meta name="description" content="<?= e($desc) ?>">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<link rel="canonical" href="<?= e($canon) ?>">
<link rel="icon" type="image/png" href="/assets/favicon-64.png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<meta name="theme-color" content="#082746">
<meta property="og:type" content="article"><meta property="og:locale" content="hu_HU"><meta property="og:site_name" content="Totál Pénztárgép Pécs">
<meta property="og:title" content="<?= e($title) ?>"><meta property="og:description" content="<?= e($desc) ?>"><meta property="og:url" content="<?= e($canon) ?>"><meta property="og:image" content="<?= PTG_SITE ?>/assets/og-kep.jpg">
<link rel="stylesheet" href="/assets/fonts/betutipusok.css?v=20261104">
<link rel="stylesheet" href="/assets/oldal.css?v=20261104">
<script type="application/ld+json"><?= json_encode(['@context' => 'https://schema.org', '@graph' => $ld], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG) ?></script>
</head>
<body>
<header><div class="wrap"><a href="/"><img src="/assets/logo/total-logo-fejlec.svg" alt="TOTÁL Pénztárgép és Számítástechnika – Pécs" width="232" height="70"></a>
<nav aria-label="Fő menü"><a href="/">Kezdőlap</a><a href="/webaruhaz/">Webáruház</a><a href="/szerviz/">Szerviz</a><a href="/tudnivalok/">E-pénztárgép tudnivalók</a><a href="/penztargep-valasztas/">Gépválasztás</a><a href="/#kapcsolat">Kapcsolat</a></nav></div></header>
<main class="wrap">
<nav class="morzsa" aria-label="Útvonal"><?php foreach ($crumbs as $i => $b) { echo $i ? ' › ' : ''; echo $i === count($crumbs) - 1 ? '<span>' . e($b[0]) . '</span>' : '<a href="' . e($b[1]) . '">' . e($b[0]) . '</a>'; } ?></nav>
<?php }
function ptg_lab(): void { ?>
</main>
<footer><div class="wrap">
<div><b>Totál Pénztárgép és Számítástechnika Kkt.</b><br>7625 Pécs, Hunyadi János utca 34.<br>Pénztárgép-szaküzlet és szerviz 1982 óta</div>
<div><b>Elérhetőség</b><br>Telefon: <a href="tel:+3672215652">72/215-652</a><br>E-mail: <a href="mailto:info@penztar-gep.hu">info@penztar-gep.hu</a><br>Nyitvatartás: hétfőtől péntekig 9:00–15:00</div>
<div><b>Hasznos oldalak</b><br><a href="/szerviz/">Szerviz és támogatás</a><br><a href="/tudnivalok/">Pénztárgép és e-pénztárgép tudnivalók</a><br><a href="/penztargep-valasztas/">Pénztárgép-választási segítség</a><br><a href="/webaruhaz/#aszf">Vásárlási feltételek</a></div>
</div></footer>
<script>window.ZEPHYR_I18N_BASE="/nyelv/";</script>
<script src="/assets/nyelv.js?v=20261104"></script>
<script>if (window.ZI18N) ZI18N.mountPicker(document.querySelector("header nav"));</script>
</body>
</html>
<?php }
