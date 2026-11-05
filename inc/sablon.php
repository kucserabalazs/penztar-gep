<?php
/* Közös oldalsablon a tájékoztató oldalakhoz (szerviz, tudnivalók, pénztárgép-választás)
   és a közös fejléc/lábléc a termékoldalakhoz (webaruhaz/termek.php) és a 404-oldalhoz.
   Csak függvényeket tartalmaz; közvetlenül megnyitva nem jelenít meg semmit. */
const PTG_SITE = 'https://penztar-gep.hu';
const PTG_TEL = '+36 72 215 652';
const PTG_TEL_HREF = 'tel:+3672215652';
const PTG_NYITVA = 'Hétfőtől péntekig 9:00–15:00; szombaton és vasárnap zárva';
const PTG_SZLOGEN = 'Pénztárgép-szaküzlet és -szerviz 1982 óta';
const PTG_V = '20261105';   /* a közös CSS/JS gyorsítótár-verziója */
/* az üzlet koordinátái (Pécs, Hunyadi János utca 34.) – a strukturált adatokhoz */
const PTG_GEO = ['@type' => 'GeoCoordinates', 'latitude' => 46.0786, 'longitude' => 18.2311];

if (!function_exists('e')) { function e($s): string { return htmlspecialchars((string)$s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); } }
function ptg_data(): array {
  static $d = null;
  if ($d !== null) return $d;
  $f = __DIR__ . '/../webaruhaz/data/products.json';
  $d = is_file($f) ? json_decode((string)file_get_contents($f), true) : null;
  return $d = is_array($d) ? $d : [];
}
function ptg_s(string $k, $alap = '') { $v = ptg_data()['settings'][$k] ?? null; return (is_string($v) && trim($v) !== '') ? $v : $alap; }
function ptg_tel(): string { return ptg_s('telefon', PTG_TEL); }
function ptg_tel_href(): string { return 'tel:' . preg_replace('/[^\d+]/', '', ptg_tel()); }
function ptg_nyitva(): string { return ptg_s('nyitvatartas', PTG_NYITVA); }

/* ---- fejléc (ugrólink + logó + fő menü); $root: a webhely gyökere az oldalhoz képest ("/" vagy "../") ---- */
function ptg_fejlec(string $aktiv = '', string $root = '/'): string {
  $menu = [
    ['', 'Kezdőlap'], ['webaruhaz/', 'Webáruház'], ['webaruhaz/termek.php', 'Termékkatalógus'], ['szerviz/', 'Szerviz'],
    ['tudnivalok/', 'E-pénztárgép tudnivalók'], ['penztargep-valasztas/', 'Gépválasztás'], ['#kapcsolat', 'Kapcsolat'],
  ];
  $h = '<a class="ugro" href="#tartalom">Ugrás a tartalomra</a>' . "\n"
     . '<header><div class="wrap"><a class="logo" href="' . e($root) . '"><img src="' . e($root) . 'assets/logo/total-logo-fejlec.svg" alt="TOTÁL Pénztárgép és Számítástechnika – Pécs" width="232" height="70"></a>' . "\n"
     . '<nav aria-label="Fő menü">';
  foreach ($menu as [$u, $n]) {
    $h .= '<a href="' . e($root . $u) . '"' . ($u === $aktiv ? ' aria-current="page"' : '') . '>' . e($n) . '</a>';
  }
  return $h . "</nav></div></header>\n";
}

/* ---- lábléc: cég, elérhetőség, hasznos oldalak, kínálat (kategóriák) ---- */
function ptg_lablec(string $root = '/'): string {
  $D = ptg_data();
  $vannak = [];
  foreach (($D['products'] ?? []) as $p) { if (empty($p['rejtett'])) $vannak[$p['kategoria'] ?? ''] = true; }
  $kin = '';
  foreach (($D['categories'] ?? []) as $c) {
    if (empty($vannak[$c['id'] ?? ''])) continue;
    $kin .= '<a href="' . e($root . 'webaruhaz/termek.php?kat=' . rawurlencode($c['id'])) . '">' . e($c['nev'] ?? '') . '</a>';
  }
  return '<footer><div class="wrap">'
    . '<div><b>' . e(ptg_s('cegnev', 'Totál Pénztárgép és Számítástechnika Kkt.')) . '</b><p>' . e(ptg_s('cim', '7625 Pécs, Hunyadi János utca 34.')) . '<br>' . e(PTG_SZLOGEN) . '</p></div>'
    . '<div><b>Elérhetőség</b><p class="ll"><span class="cimke">Telefon</span><a href="' . e(ptg_tel_href()) . '">' . e(ptg_tel()) . '</a>'
    . '<a href="#uzenet" data-kapcsolat role="button">E-mail küldése</a>'
    . '<span class="cimke">Nyitvatartás</span><span>' . e(ptg_nyitva()) . '</span></p></div>'
    . '<div><b>Hasznos oldalak</b><p class="ll"><a href="' . e($root) . 'szerviz/">Szerviz és támogatás</a><a href="' . e($root) . 'tudnivalok/">Pénztárgép és e-pénztárgép tudnivalók</a><a href="' . e($root) . 'penztargep-valasztas/">Pénztárgép-választási segítség</a><a href="' . e($root) . 'webaruhaz/#aszf">Vásárlási feltételek</a></p></div>'
    . ($kin !== '' ? '<div><b>Kínálat</b><p class="ll">' . $kin . '</p></div>' : '')
    . "</div></footer>\n";
}

/* ---- közös szkriptek a lap alján (nyelv, e-mail ablak, nyelvválasztó) ---- */
function ptg_szkriptek(string $root = '/'): string {
  return '<script>window.ZEPHYR_I18N_BASE=' . json_encode($root . 'nyelv/') . ';</script>' . "\n"
    . '<script src="' . e($root) . 'assets/nyelv.js?v=20261105c"></script>' . "\n"
    . '<script src="' . e($root) . 'assets/kapcsolat.js?v=20261105c" defer></script>' . "\n"
    . '<script src="' . e($root) . 'assets/keszito.js?v=20261105n" defer></script>' . "\n"
    . '<script>if (window.ZI18N) ZI18N.mountPicker(document.querySelector("header nav"));</script>' . "\n";
}

/* ---- közösségi (OG / Twitter) címkék ---- */
function ptg_kozossegi(string $title, string $desc, string $canon, string $type = 'article', ?array $kep = null): string {
  $kep = $kep ?: [PTG_SITE . '/assets/og-kep.jpg', 1200, 630, 'Totál Pénztárgép és Számítástechnika – pénztárgép-szaküzlet és -szerviz Pécsen'];
  $h = '<meta property="og:type" content="' . e($type) . '"><meta property="og:locale" content="hu_HU"><meta property="og:site_name" content="Totál Pénztárgép Pécs">' . "\n"
     . '<meta property="og:title" content="' . e($title) . '"><meta property="og:description" content="' . e($desc) . '"><meta property="og:url" content="' . e($canon) . '">' . "\n"
     . '<meta property="og:image" content="' . e($kep[0]) . '">';
  if (!empty($kep[1])) $h .= '<meta property="og:image:width" content="' . (int)$kep[1] . '"><meta property="og:image:height" content="' . (int)$kep[2] . '">';
  $h .= '<meta property="og:image:alt" content="' . e($kep[3] ?? $title) . '">' . "\n"
     . '<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="' . e($title) . '"><meta name="twitter:description" content="' . e($desc) . '"><meta name="twitter:image" content="' . e($kep[0]) . '"><meta name="twitter:image:alt" content="' . e($kep[3] ?? $title) . '">' . "\n";
  return $h;
}

function ptg_fej(string $title, string $desc, string $path, array $crumbs, array $ld = []): void {
  $canon = PTG_SITE . $path;
  $ld[] = ['@type' => 'BreadcrumbList', 'itemListElement' => array_map(fn($c, $i) => ['@type' => 'ListItem', 'position' => $i + 1, 'name' => $c[0], 'item' => PTG_SITE . $c[1]], $crumbs, array_keys($crumbs))];
?><!doctype html>
<html lang="hu">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="/assets/nezet.js?v=<?= PTG_V ?>"></script>
<title><?= e($title) ?></title>
<meta name="description" content="<?= e($desc) ?>">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<link rel="canonical" href="<?= e($canon) ?>">
<link rel="icon" href="/favicon.ico?v=20261105il" sizes="any">
<link rel="icon" type="image/png" href="/assets/favicon-64.png?v=20261105il">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png?v=20261105il">
<meta name="theme-color" content="#082746">
<?= ptg_kozossegi($title, $desc, $canon) ?>
<link rel="stylesheet" href="/assets/fonts/betutipusok.css?v=20261105">
<link rel="stylesheet" href="/assets/oldal.css?v=<?= PTG_V ?>">
<script type="application/ld+json"><?= json_encode(['@context' => 'https://schema.org', '@graph' => $ld], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG) ?></script>
</head>
<body>
<?= ptg_fejlec(ltrim($path, '/')) ?>
<main class="wrap" id="tartalom" tabindex="-1">
<nav class="morzsa" aria-label="Útvonal"><?php foreach ($crumbs as $i => $b) { echo $i ? '<span class="sep" aria-hidden="true">›</span>' : ''; echo $i === count($crumbs) - 1 ? '<span aria-current="page">' . e($b[0]) . '</span>' : '<a href="' . e($b[1]) . '">' . e($b[0]) . '</a>'; } ?></nav>
<?php }
function ptg_lab(): void { ?>
</main>
<?= ptg_lablec() ?>
<?= ptg_szkriptek() ?>
</body>
</html>
<?php }
