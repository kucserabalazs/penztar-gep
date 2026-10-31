<?php
// penztar-gep.hu – egyszerű adatkezelő (termékek, árak, megrendelések, admin belépés)
// Nincs adatbázis: minden a data/ mappában lévő JSON fájlokban tárolódik.
declare(strict_types=1);
date_default_timezone_set('Europe/Budapest');
session_name('ptgadmin');
session_set_cookie_params(['httponly' => true, 'samesite' => 'Strict', 'secure' => !empty($_SERVER['HTTPS'])]);
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

const DATA = __DIR__ . '/data';
const UPLOADS = __DIR__ . '/uploads';
$PRODUCTS = DATA . '/products.json';
$ORDERS   = DATA . '/orders.json';
$HASH     = DATA . '/admin.hash';

function out($d, int $code = 200): void { http_response_code($code); echo json_encode($d, JSON_UNESCAPED_UNICODE); exit; }
function body(): array { $j = json_decode(file_get_contents('php://input') ?: '[]', true); return is_array($j) ? $j : []; }
function authed(): bool { return !empty($_SESSION['admin']); }
function need_auth(): void { if (!authed()) out(['error' => 'Be kell jelentkezni.'], 401); }
function read_json(string $f, $def) { if (!is_file($f)) return $def; $j = json_decode((string)file_get_contents($f), true); return $j ?? $def; }
function write_json(string $f, $d): void {
  $tmp = $f . '.tmp';
  file_put_contents($tmp, json_encode($d, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
  rename($tmp, $f);
}
function check_csrf(): void {
  $t = $_SERVER['HTTP_X_CSRF'] ?? '';
  if (!$t || !hash_equals($_SESSION['csrf'] ?? '', $t)) out(['error' => 'Lejárt munkamenet, jelentkezz be újra.'], 403);
}

$a = $_GET['a'] ?? '';
$m = $_SERVER['REQUEST_METHOD'];

switch ($a) {
  case 'data':      // nyilvános: termékek, kategóriák, szolgáltatások
    out(read_json($PRODUCTS, []));

  case 'status':
    out(['admin' => authed(), 'needsSetup' => !is_file($HASH), 'csrf' => authed() ? $_SESSION['csrf'] : null]);

  case 'login':
    if ($m !== 'POST') out(['error' => 'POST kell.'], 405);
    $b = body(); $pw = (string)($b['jelszo'] ?? '');
    // egyszerű fékezés a jelszópróbálgatás ellen
    $_SESSION['tries'] = ($_SESSION['tries'] ?? 0);
    if ($_SESSION['tries'] > 8 && time() - ($_SESSION['last'] ?? 0) < 300) out(['error' => 'Túl sok próbálkozás. Próbáld újra 5 perc múlva.'], 429);
    if (!is_file($HASH)) {           // első belépés: a megadott jelszó lesz az admin jelszó
      if (mb_strlen($pw) < 8) out(['error' => 'Az új jelszó legalább 8 karakter legyen.'], 400);
      file_put_contents($HASH, password_hash($pw, PASSWORD_DEFAULT), LOCK_EX);
    } elseif (!password_verify($pw, trim((string)file_get_contents($HASH)))) {
      $_SESSION['tries']++; $_SESSION['last'] = time();
      out(['error' => 'Hibás jelszó.'], 401);
    }
    session_regenerate_id(true);
    $_SESSION['admin'] = true; $_SESSION['tries'] = 0;
    $_SESSION['csrf'] = bin2hex(random_bytes(16));
    out(['ok' => true, 'csrf' => $_SESSION['csrf']]);

  case 'logout':
    $_SESSION = []; session_destroy(); out(['ok' => true]);

  case 'password':  // jelszócsere
    need_auth(); check_csrf();
    $b = body();
    if (!password_verify((string)($b['regi'] ?? ''), trim((string)file_get_contents($HASH)))) out(['error' => 'A jelenlegi jelszó nem stimmel.'], 400);
    if (mb_strlen((string)($b['uj'] ?? '')) < 8) out(['error' => 'Az új jelszó legalább 8 karakter legyen.'], 400);
    file_put_contents($HASH, password_hash((string)$b['uj'], PASSWORD_DEFAULT), LOCK_EX);
    out(['ok' => true]);

  case 'save':      // teljes katalógus mentése (termékek, árak, szolgáltatások, beállítások)
    need_auth(); check_csrf();
    $b = body();
    if (!isset($b['products'], $b['categories'], $b['services'], $b['settings'])) out(['error' => 'Hiányos adat.'], 400);
    if (is_file($PRODUCTS)) copy($PRODUCTS, DATA . '/products.backup-' . date('Ymd-His') . '.json');
    // csak az utolsó 20 mentést tartjuk meg
    $bk = glob(DATA . '/products.backup-*.json'); sort($bk);
    while (count($bk) > 20) { @unlink(array_shift($bk)); }
    write_json($PRODUCTS, $b);
    out(['ok' => true]);

  case 'upload':    // termékkép feltöltése
    need_auth(); check_csrf();
    if (empty($_FILES['kep']) || $_FILES['kep']['error'] !== UPLOAD_ERR_OK) out(['error' => 'Nem érkezett kép.'], 400);
    if ($_FILES['kep']['size'] > 8 * 1024 * 1024) out(['error' => 'A kép legfeljebb 8 MB lehet.'], 400);
    $info = @getimagesize($_FILES['kep']['tmp_name']);
    $ext = [IMAGETYPE_JPEG => 'jpg', IMAGETYPE_PNG => 'png', IMAGETYPE_WEBP => 'webp'][$info[2] ?? 0] ?? null;
    if (!$ext) out(['error' => 'Csak JPG, PNG vagy WEBP kép tölthető fel.'], 400);
    if (!is_dir(UPLOADS)) mkdir(UPLOADS, 0755, true);
    $name = date('Ymd-His') . '-' . bin2hex(random_bytes(4)) . '.' . $ext;
    move_uploaded_file($_FILES['kep']['tmp_name'], UPLOADS . '/' . $name);
    out(['ok' => true, 'url' => 'uploads/' . $name]);

  case 'order':     // nyilvános: megrendelés, ajánlatkérés, szerviz-időpont
    if ($m !== 'POST') out(['error' => 'POST kell.'], 405);
    $b = body();
    if (!empty($b['web'])) out(['ok' => true]);           // csapda a robotoknak (rejtett mező)
    $nev = trim((string)($b['nev'] ?? '')); $tel = trim((string)($b['telefon'] ?? '')); $email = trim((string)($b['email'] ?? ''));
    if ($nev === '' || ($tel === '' && $email === '')) out(['error' => 'Adja meg a nevét és legalább egy elérhetőséget.'], 400);
    $orders = read_json($ORDERS, []);
    $rec = [
      'id' => date('ymd') . '-' . strtoupper(bin2hex(random_bytes(2))),
      'ido' => date('c'),
      'tipus' => mb_substr((string)($b['tipus'] ?? 'ajanlat'), 0, 30),
      'nev' => mb_substr($nev, 0, 120), 'ceg' => mb_substr((string)($b['ceg'] ?? ''), 0, 120),
      'telefon' => mb_substr($tel, 0, 40), 'email' => mb_substr($email, 0, 120),
      'tetelek' => array_slice(is_array($b['tetelek'] ?? null) ? $b['tetelek'] : [], 0, 30),
      'idopont' => mb_substr((string)($b['idopont'] ?? ''), 0, 40),
      'uzenet' => mb_substr((string)($b['uzenet'] ?? ''), 0, 3000),
      'allapot' => 'uj'
    ];
    array_unshift($orders, $rec);
    write_json($ORDERS, $orders);
    // értesítő e-mail a boltnak (ha a tárhely engedi a mail() függvényt)
    $set = read_json($PRODUCTS, [])['settings'] ?? [];
    if (!empty($set['email']) && function_exists('mail')) {
      $txt = "Új " . $rec['tipus'] . " a weboldalról ({$rec['id']})\n\nNév: {$rec['nev']}\nCég: {$rec['ceg']}\nTelefon: {$rec['telefon']}\nE-mail: {$rec['email']}\nIdőpont: {$rec['idopont']}\n\n";
      foreach ($rec['tetelek'] as $t) $txt .= '- ' . ($t['db'] ?? 1) . ' × ' . ($t['nev'] ?? '') . "\n";
      $txt .= "\n" . $rec['uzenet'];
      @mail($set['email'], '=?UTF-8?B?' . base64_encode('Új megrendelés: ' . $rec['nev']) . '?=', $txt, "Content-Type: text/plain; charset=UTF-8");
    }
    out(['ok' => true, 'id' => $rec['id']]);

  case 'orders':
    need_auth(); out(read_json($ORDERS, []));

  case 'order-status':
    need_auth(); check_csrf();
    $b = body(); $orders = read_json($ORDERS, []);
    foreach ($orders as &$o) if ($o['id'] === ($b['id'] ?? '')) $o['allapot'] = in_array($b['allapot'] ?? '', ['uj', 'folyamatban', 'kesz']) ? $b['allapot'] : $o['allapot'];
    write_json($ORDERS, $orders); out(['ok' => true]);

  default:
    out(['error' => 'Ismeretlen művelet.'], 404);
}
