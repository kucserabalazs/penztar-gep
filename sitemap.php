<?php
/* Élő oldaltérkép (sitemap) a Google-nek – a termékeket a webáruház adataiból veszi,
   így minden új vagy módosított termék automatikusan bekerül. */
declare(strict_types=1);
header('Content-Type: application/xml; charset=utf-8');
const SITE = 'https://penztar-gep.hu';
$f = __DIR__ . '/webaruhaz/data/products.json';
$db = json_decode((string)@file_get_contents($f), true) ?: [];
$dmod = date('Y-m-d', @filemtime($f) ?: time());
$hmod = date('Y-m-d', @filemtime(__DIR__ . '/index.html') ?: time());
$u = [];
$u[] = [SITE . '/', $hmod, 'weekly', '1.0'];
$u[] = [SITE . '/webaruhaz/', $dmod, 'daily', '0.9'];
$u[] = [SITE . '/webaruhaz/termek.php', $dmod, 'daily', '0.8'];
$prods = array_values(array_filter($db['products'] ?? [], fn($p) => empty($p['rejtett'])));
foreach (($db['categories'] ?? []) as $c) {
  if (!array_filter($prods, fn($p) => $p['kategoria'] === $c['id'])) continue;
  $u[] = [SITE . '/webaruhaz/termek.php?kat=' . rawurlencode($c['id']), $dmod, 'weekly', '0.8'];
}
foreach ($prods as $p) { $u[] = [SITE . '/webaruhaz/termek.php?id=' . rawurlencode($p['id']), $dmod, 'weekly', '0.7', $p]; }
$u[] = [SITE . '/webaruhaz/letoltesek/penztargep-megrendelo-adatlap.pdf', $hmod, 'yearly', '0.4'];
echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">' . "\n";
foreach ($u as $x) {
  echo '  <url><loc>' . htmlspecialchars($x[0], ENT_XML1) . '</loc><lastmod>' . $x[1] . '</lastmod><changefreq>' . $x[2] . '</changefreq><priority>' . $x[3] . '</priority>';
  if (!empty($x[4]['kepek'])) foreach (array_slice($x[4]['kepek'], 0, 5) as $k) echo '<image:image><image:loc>' . htmlspecialchars(SITE . '/webaruhaz/' . ltrim($k, './'), ENT_XML1) . '</image:loc></image:image>';
  echo "</url>\n";
}
echo "</urlset>\n";
