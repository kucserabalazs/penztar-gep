<?php
// penztar-gep.hu – egyszerű adatkezelő (termékek, árak, megrendelések, admin belépés)
// Nincs adatbázis: minden a data/ mappában lévő fájlokban tárolódik.
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
$ORDERS   = DATA . '/orders.php';         // védett: közvetlenül nem tölthető le
$USERS    = DATA . '/admin.users.php';    // admin felhasználók: jelszó-ujjlenyomat, telefonos app, zárolás
$LOG      = DATA . '/admin.log.php';      // utolsó belépések
$MASTER   = DATA . '/admin.mester.php';   // mesterkód ujjlenyomata (tulajdonosoknak, a jelszó mellé, ha nem jön az e-mail)
$TASKS    = DATA . '/feladatok.php';      // a weboldallal kapcsolatos feladatok, észrevételek (csak adminoknak)
$CLIENTS  = DATA . '/clients.php';        // ügyféllista – titkosítva (AES-256-GCM)
$CLOG     = DATA . '/clients.log.php';    // ki mit csinált az ügyféllistával
$NOTIFY   = DATA . '/ertesites.php';      // titkos értesítési e-mail cím (csak tulajdonos állíthatja; a weboldalon sehol nem jelenik meg)
$KIP      = DATA . '/kapcsolat.ip.php';   // E-mail küldése űrlap: IP-korlát (csak az IP ujjlenyomata és az időpontok)

/* ===== Tulajdonosok =====
   Csak ők léphetnek be alapból, és csak ők adhatnak (vagy vonhatnak vissza) további admin hozzáférést.
   Nevüket és telefonszámukat csak itt, a programban lehet módosítani – a weboldalról nem.
   Az e-mail címük NEM a programban van (a forráskód nyilvános), hanem a tárhelyen lévő config.local.php fájlban.
   A belépési kódot a rendszer kizárólag oda küldi. */
const OWNERS = [
  ['id' => 'kucsera-istvan',     'nev' => 'Kucsera István',      'tel' => '+36209804748'],
  ['id' => 'ifj-kucsera-istvan', 'nev' => 'Ifj. Kucsera István', 'tel' => '+36203222669'],
  ['id' => 'kucsera-balazs',     'nev' => 'Kucsera Balázs',      'tel' => '+36205363120'],
];
// titkos helyi beállítások (nincs a GitHubon): ['emails' => ['kucsera-balazs' => '...', ...]]
$LOCAL = is_file(__DIR__ . '/config.local.php') ? (array)(include __DIR__ . '/config.local.php') : [];
function owner_email(string $id): string { global $LOCAL; return (string)($LOCAL['emails'][$id] ?? ''); }
const MAIL_FROM = 'noreply@penztar-gep.hu';   // feladó a belépési kódokhoz
const CODE_TTL  = 600;                         // e-mailes kód érvényessége (mp)

// PHP 7.4 kompatibilitás
if (!function_exists('str_contains')) { function str_contains($h, $n) { return $n === '' || strpos($h, $n) !== false; } }
if (!function_exists('str_starts_with')) { function str_starts_with($h, $n) { return strncmp($h, $n, strlen($n)) === 0; } }

function out($d, int $code = 200): void { http_response_code($code); echo json_encode($d, JSON_UNESCAPED_UNICODE); exit; }
function body(): array { $j = json_decode(file_get_contents('php://input') ?: '[]', true); return is_array($j) ? $j : []; }
const GUARD = "<?php http_response_code(404); exit; ?>\n";
// a .php végű adatfájlok elején egy záró sor van, így böngészőből megnyitva üresek
function strip_guard(string $t): string { return substr($t, 0, 5) === '<?php' ? (string)substr($t, strpos($t, "\n") + 1) : $t; }
function read_json(string $f, $def) { if (!is_file($f)) return $def; $j = json_decode(strip_guard((string)file_get_contents($f)), true); return $j ?? $def; }
function write_json(string $f, $d): void {
  $tmp = $f . '.tmp';
  file_put_contents($tmp, (substr($f, -4) === '.php' ? GUARD : '') . json_encode($d, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
  rename($tmp, $f);
}
function check_csrf(): void {
  $t = $_SERVER['HTTP_X_CSRF'] ?? '';
  if (!$t || !hash_equals($_SESSION['csrf'] ?? '', $t)) out(['error' => 'Lejárt munkamenet, jelentkezzen be újra.'], 403);
}
function locked(callable $fn) { $l = fopen(DATA . '/.lock', 'c'); flock($l, LOCK_EX); try { return $fn(); } finally { flock($l, LOCK_UN); fclose($l); } }

/* ---- felhasználók ---- */
function users(): array {
  global $USERS; $d = read_json($USERS, ['users' => []]); $list = $d['users'] ?? []; $by = [];
  foreach ($list as $u) $by[$u['id']] = $u;
  foreach (OWNERS as $o) { $u = $by[$o['id']] ?? ['hash' => null, 'totp' => null, 'ido' => date('c')];
    $by[$o['id']] = array_merge($u, ['id' => $o['id'], 'nev' => $o['nev'], 'tel' => $o['tel'], 'email' => owner_email($o['id']), 'szerep' => 'tulajdonos']); }
  foreach ($by as $id => $u) if (($u['szerep'] ?? '') === 'tulajdonos' && !in_array($id, array_column(OWNERS, 'id'), true)) unset($by[$id]);
  return $by;
}
function save_users(array $by): void { global $USERS; write_json($USERS, ['users' => array_values($by)]); }
function user(string $id): ?array { return users()[$id] ?? null; }
function update_user(string $id, callable $fn): void { locked(function () use ($id, $fn) { $by = users(); if (isset($by[$id])) { $by[$id] = $fn($by[$id]); save_users($by); } }); }
function mask_tel(string $t): string { $d = preg_replace('/\D/', '', $t); return strlen($d) >= 11 ? '+' . substr($d, 0, 2) . ' ' . substr($d, 2, 2) . ' *** ' . substr($d, -4) : '***'; }
function mask_mail(string $e): string { if (!str_contains($e, '@')) return ''; [$a, $b] = explode('@', $e, 2); return mb_substr($a, 0, 1) . str_repeat('•', max(2, min(6, mb_strlen($a) - 1))) . '@' . $b; }
function norm_tel(string $t): string { $d = preg_replace('/\D/', '', $t); if (str_starts_with($d, '06')) $d = '36' . substr($d, 2); return $d === '' ? '' : '+' . $d; }
function pub_user(array $u): array { return ['id' => $u['id'], 'nev' => $u['nev'], 'tel' => mask_tel($u['tel'] ?? ''), 'szerep' => $u['szerep'] ?? 'admin', 'aktiv' => !empty($u['hash']), 'email' => !empty($u['email'])]; }
function me(): ?array { return !empty($_SESSION['uid']) ? user((string)$_SESSION['uid']) : null; }
function authed(): bool {
  if (empty($_SESSION['admin'])) return false;
  if (time() - ($_SESSION['seen'] ?? time()) > 1800) { $_SESSION = []; return false; }   // 30 perc tétlenség után kiléptet
  $_SESSION['seen'] = time();
  return me() !== null;
}
function need_auth(): void { if (!authed()) out(['error' => 'Be kell jelentkezni.'], 401); }
function need_owner(): void { need_auth(); if ((me()['szerep'] ?? '') !== 'tulajdonos') out(['error' => 'Ezt csak a tulajdonosok végezhetik el.'], 403); }

/* ---- e-mailes kód ---- */
/* ===== Online fizetés: Barion =====
   A kulcsok a config.local.php-ban vannak: 'barion' => ['poskey' => '...', 'payee' => 'barion-fiók e-mail', 'teszt' => true]
   Amíg nincs kitöltve, a webáruház nem kínál online fizetést. */
function barion_cfg(): array { global $LOCAL; $b = (array)($LOCAL['barion'] ?? []); return ['poskey' => trim((string)($b['poskey'] ?? '')), 'payee' => trim((string)($b['payee'] ?? '')), 'teszt' => !empty($b['teszt'])]; }
function barion_on(): bool { $c = barion_cfg(); return $c['poskey'] !== '' && $c['payee'] !== ''; }
function barion_api(): string { global $LOCAL; if (!empty($LOCAL['barion']['api'])) return rtrim((string)$LOCAL['barion']['api'], '/'); return barion_cfg()['teszt'] ? 'https://api.test.barion.com' : 'https://api.barion.com'; }
function http_json(string $method, string $url, ?array $body = null): ?array {
  $payload = $body !== null ? json_encode($body, JSON_UNESCAPED_UNICODE) : null;
  if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 30, CURLOPT_CUSTOMREQUEST => $method, CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Accept: application/json']]);
    if ($payload !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    $r = curl_exec($ch); curl_close($ch);
  } else {
    $r = @file_get_contents($url, false, stream_context_create(['http' => ['method' => $method, 'header' => "Content-Type: application/json\r\nAccept: application/json\r\n", 'content' => (string)$payload, 'timeout' => 30, 'ignore_errors' => true]]));
  }
  if (!is_string($r) || $r === '') return null;
  $j = json_decode($r, true); return is_array($j) ? $j : null;
}
// a webáruház címe (a visszairányításhoz); a config.local.php 'oldal' kulcsával rögzíthető, pl. https://penztar-gep.hu/webaruhaz
function shop_url(): string {
  global $LOCAL; if (!empty($LOCAL['oldal'])) return rtrim((string)$LOCAL['oldal'], '/');
  $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
  $host = preg_replace('/[^A-Za-z0-9.:-]/', '', (string)($_SERVER['HTTP_HOST'] ?? 'penztar-gep.hu'));
  $dir = rtrim(str_replace('\\', '/', dirname((string)($_SERVER['SCRIPT_NAME'] ?? '/webaruhaz/api.php'))), '/');
  return ($https ? 'https' : 'http') . '://' . $host . $dir;
}
function ft(int $n): string { return number_format($n, 0, ',', ' ') . ' Ft'; }
function brutto($net, $afa): int { return (int)round((float)$net * (1 + (float)$afa / 100)); }
// megrendelés összesítője e-mailhez
function order_text(array $o): string {
  $t = ''; foreach ($o['tetelek'] as $x) $t .= '- ' . ($x['db'] ?? 1) . ' × ' . ($x['nev'] ?? '') . (isset($x['brutto']) ? '  (' . ft((int)$x['brutto'] * (int)($x['db'] ?? 1)) . ')' : '') . "\n";
  foreach (($o['extrak'] ?? []) as $x) $t .= '- ' . $x['nev'] . '  (' . ft((int)$x['brutto']) . ")\n";
  if (!empty($o['osszeg'])) $t .= "\nFizetendő összesen (bruttó): " . ft((int)$o['osszeg']) . "\n";
  $t .= "\nÁtvétel: " . ($o['atvetel'] ?? '') . (!empty($o['szallcim']) ? ' – ' . $o['szallcim'] : '') . "\nFizetés: " . ($o['fizmod'] ?? '') . "\n";
  return $t;
}
/* ---- titkos értesítési cím ----
   Ide érkeznek a megrendelések, ajánlatkérések és az „E-mail küldése” üzenetek.
   A data/ertesites.php fájlban van (nincs a GitHubon, böngészőből nem olvasható); ha még nincs beállítva,
   a Cégadatoknál megadott e-mail cím a tartalék. */
function notify_email(): string {
  global $NOTIFY; $e = (string)(read_json($NOTIFY, [])['email'] ?? '');
  if (filter_var($e, FILTER_VALIDATE_EMAIL)) return $e;
  $se = (string)((read_json(DATA . '/products.json', [])['settings'] ?? [])['email'] ?? '');
  return filter_var($se, FILTER_VALIDATE_EMAIL) ? $se : '';
}
// aláírt űrlapjegy: igazolja, hogy az űrlapot legalább néhány másodperce nyitották meg (a robotok azonnal küldenek)
function form_secret(): string {
  global $LOCAL; if (!empty($LOCAL['kulcs'])) return hash('sha256', 'kapcsolat|' . $LOCAL['kulcs']);
  $f = DATA . '/kapcsolat.titok.php'; $t = (string)(read_json($f, [])['t'] ?? '');
  if (strlen($t) < 32) { $t = bin2hex(random_bytes(32)); write_json($f, ['t' => $t]); }
  return $t;
}
function form_ticket(): string { $t = (string)time(); return $t . '.' . substr(hash_hmac('sha256', $t, form_secret()), 0, 32); }
function form_ticket_age(string $j): ?int {
  if (!preg_match('/^(\d{10})\.([a-f0-9]{32})$/', $j, $m)) return null;
  if (!hash_equals(substr(hash_hmac('sha256', $m[1], form_secret()), 0, 32), $m[2])) return null;
  return time() - (int)$m[1];
}
function client_ip(): string { return (string)($_SERVER['REMOTE_ADDR'] ?? ''); }
// visszaigazolás a vevőnek
function mail_customer(array $o, string $subj, string $intro): void {
  if (empty($o['email'])) return;
  $set = read_json(DATA . '/products.json', [])['settings'] ?? [];
  $txt = "Kedves {$o['nev']}!\n\n$intro\n\nRendelésszám: {$o['id']}\n\n" . order_text($o);
  if (($o['fizetes']['mod'] ?? '') === 'atutalas' && !empty($set['szamlaszam']))
    $txt .= "\nUtalási adatok (a díjbekérő megérkezése után):\nKedvezményezett: " . ($set['cegnevRovid'] ?? $set['cegnev'] ?? '') . "\nBank: " . ($set['bank'] ?? '') . "\nSzámlaszám: {$set['szamlaszam']}\nKözlemény: {$o['id']}\n";
  $txt .= "\nKérdése van? Egyszerűen válaszoljon erre a levélre, vagy hívjon minket: " . ($set['telefon'] ?? '+36 72 215 652') . "\n\n" . ($set['cegnev'] ?? 'Totál Pénztárgép és Számítástechnika') . "\n" . ($set['cim'] ?? '') . "\nhttps://penztar-gep.hu";
  send_mail($o['email'], $subj, $txt, notify_email());
}
function mail_shop(array $o, string $subj, string $extra = ''): void {
  $set = read_json(DATA . '/products.json', [])['settings'] ?? [];
  $to = notify_email(); if ($to === '') return;
  $txt = "$subj ({$o['id']})\n\nNév: {$o['nev']}\nCég: {$o['ceg']}\nTelefon: {$o['telefon']}\nE-mail: {$o['email']}\nIdőpont: {$o['idopont']}\n\n";
  $txt .= ($o['tetelek'] || !empty($o['osszeg'])) ? order_text($o) : '';
  $txt .= "\n" . $o['uzenet'] . $extra;
  if (!empty($o['adatlap'])) $txt .= "\n\nPénztárgép élesítése: " . ($o['adatlap']['Élesítés módja'] ?? '') . (count($o['adatlap']) > 1 ? "\nA kitöltött adatlap (személyes adatokkal) az admin felületen, a megrendelésnél látható." : '');
  send_mail($to, $subj . ': ' . $o['nev'], $txt, filter_var($o['email'] ?? '', FILTER_VALIDATE_EMAIL) ? $o['email'] : '');
}
// fizetés indítása a Barionnál; visszaadja a fizetési oldal címét, vagy null-t
function barion_start(array &$o): ?string {
  $c = barion_cfg(); $items = [];
  foreach ($o['tetelek'] as $t) $items[] = ['Name' => mb_substr($t['nev'], 0, 250), 'Description' => mb_substr($t['nev'], 0, 250), 'Quantity' => (int)$t['db'], 'Unit' => 'db', 'UnitPrice' => (int)$t['brutto'], 'ItemTotal' => (int)$t['brutto'] * (int)$t['db'], 'SKU' => mb_substr((string)$t['id'], 0, 100)];
  foreach (($o['extrak'] ?? []) as $x) $items[] = ['Name' => $x['nev'], 'Description' => $x['nev'], 'Quantity' => 1, 'Unit' => 'db', 'UnitPrice' => (int)$x['brutto'], 'ItemTotal' => (int)$x['brutto'], 'SKU' => $x['id']];
  $req = [
    'POSKey' => $c['poskey'], 'PaymentType' => 'Immediate', 'GuestCheckOut' => true, 'FundingSources' => ['All'],
    'PaymentRequestId' => $o['id'], 'OrderNumber' => $o['id'], 'PayerHint' => $o['email'], 'Locale' => 'hu-HU', 'Currency' => 'HUF',
    'RedirectUrl' => shop_url() . '/index.html?rendeles=' . rawurlencode($o['id']),
    'CallbackUrl' => shop_url() . '/api.php?a=barion-callback',
    'Transactions' => [['POSTransactionId' => $o['id'], 'Payee' => $c['payee'], 'Total' => (int)$o['osszeg'], 'Items' => $items]],
  ];
  $r = http_json('POST', barion_api() . '/v2/Payment/Start', $req);
  if (!$r || empty($r['PaymentId']) || empty($r['GatewayUrl'])) { $o['fizetes']['hiba'] = mb_substr(json_encode($r['Errors'] ?? 'nincs válasz', JSON_UNESCAPED_UNICODE), 0, 500); return null; }
  $o['fizetes']['paymentId'] = (string)$r['PaymentId'];
  return (string)$r['GatewayUrl'];
}
// raktárkészlet visszaadása (sikertelen fizetésnél)
function restock(array $tetelek): void {
  global $PRODUCTS;
  locked(function () use ($tetelek, $PRODUCTS) {
    $cat = read_json($PRODUCTS, []); $by = []; foreach (($cat['products'] ?? []) as $i => $p) $by[$p['id']] = $i;
    foreach ($tetelek as $t) { if (!isset($by[$t['id']])) continue; $p = &$cat['products'][$by[$t['id']]];
      if (isset($p['keszletDb']) && $p['keszletDb'] !== null) { $p['keszletDb'] += (int)$t['db']; if ($p['keszletDb'] > 0 && ($p['keszlet'] ?? '') === 'elfogyott') $p['keszlet'] = 'raktaron'; } unset($p); }
    write_json($PRODUCTS, $cat);
  });
}
// a Barion szerint mi a fizetés állapota; frissíti a rendelést, és értesít
function pay_refresh(string $orderId): ?array {
  global $ORDERS;
  $orders = read_json($ORDERS, []); $o = null; foreach ($orders as $x) if (($x['id'] ?? '') === $orderId) $o = $x;
  if (!$o || ($o['fizetes']['mod'] ?? '') !== 'online') return $o;
  if (($o['fizetes']['allapot'] ?? '') !== 'fizetesre_var' || empty($o['fizetes']['paymentId'])) return $o;
  $c = barion_cfg();
  $r = http_json('GET', barion_api() . '/v2/Payment/GetPaymentState?' . http_build_query(['POSKey' => $c['poskey'], 'PaymentId' => $o['fizetes']['paymentId']]));
  $st = (string)($r['Status'] ?? '');
  $uj = $st === 'Succeeded' ? 'fizetve' : (in_array($st, ['Canceled', 'Expired', 'Failed'], true) ? 'sikertelen' : null);
  if (!$uj) return $o;
  $changed = locked(function () use ($orderId, $uj, $st) {
    global $ORDERS; $orders = read_json($ORDERS, []); $hit = null;
    foreach ($orders as &$x) if (($x['id'] ?? '') === $orderId && ($x['fizetes']['allapot'] ?? '') === 'fizetesre_var') { $x['fizetes']['allapot'] = $uj; $x['fizetes']['barion'] = $st; $x['fizetes']['ido'] = date('c'); $hit = $x; }
    unset($x); if ($hit) write_json($ORDERS, $orders); return $hit;
  });
  if (!$changed) { foreach (read_json($ORDERS, []) as $x) if (($x['id'] ?? '') === $orderId) return $x; return $o; }
  if ($uj === 'fizetve') {
    mail_shop($changed, 'Új, online kifizetett megrendelés', "\n\nA vételárat a vevő bankkártyával kifizette (Barion).");
    mail_customer($changed, "Sikeres fizetés – rendelés {$changed['id']}", "Köszönjük a vásárlást! A fizetés sikeres volt, a megrendelését feldolgozzuk." . (!empty($changed['adatlap']) ? " A pénztárgépet beprogramozzuk és élesítjük, és e-mailben jelezzük, amikor átveheti." : " E-mailben értesítjük, amikor a csomagot átadtuk a futárnak, vagy amikor átveheti az üzletben."));
  } else {
    restock($changed['tetelek'] ?? []);
  }
  return $changed;
}

function send_mail(string $to, string $subj, string $text, string $reply = ''): bool {
  if (!filter_var($to, FILTER_VALIDATE_EMAIL)) return false;
  if ($dev = getenv('PTG_MAIL_LOG')) { file_put_contents($dev, json_encode(['to' => $to, 'subj' => $subj, 'text' => $text], JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND); return true; }  // csak fejlesztői teszthez
  if (!function_exists('mail')) return false;
  $h = "From: =?UTF-8?B?" . base64_encode('Totál webáruház') . "?= <" . MAIL_FROM . ">\r\n" . (filter_var($reply, FILTER_VALIDATE_EMAIL) ? "Reply-To: $reply\r\n" : '') . "Date: " . date('r') . "\r\nMessage-ID: <" . bin2hex(random_bytes(8)) . "." . time() . "@penztar-gep.hu>\r\n" . "MIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit";
  return @mail($to, '=?UTF-8?B?' . base64_encode($subj) . '?=', $text, $h, '-f' . MAIL_FROM);
}
function send_code(array $u, string $cel, string $hova = ''): void {
  if ($hova === 'uzlet') { $se = notify_email(); if ($se === '') out(['error' => 'Nincs beállítva az üzlet értesítési e-mail címe.'], 400); $u['email'] = $se; }
  if (empty($u['email'])) out(['error' => 'Ehhez a személyhez még nincs e-mail cím beállítva a tárhelyen (config.local.php), ezért nem tudunk kódot küldeni.'], 400);
  $prev = $_SESSION['code'] ?? null;
  if ($prev && $prev['uid'] === $u['id'] && time() - $prev['sent'] < 45) out(['error' => 'Az előző kódot most küldtük el. Várjon egy percet az újabb kéréssel.'], 429);
  $sent = array_filter($_SESSION['sends'] ?? [], fn($t) => time() - $t < 900);
  if (count($sent) >= 5) out(['error' => 'Túl sok kódkérés. Próbálja újra 15 perc múlva.'], 429);
  $code = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
  $mit = ['belepes' => 'belépéshez', 'aktivalas' => 'az első belépéshez', 'visszaallitas' => 'új jelszó beállításához'][$cel] ?? 'belépéshez';
  $txt = "Kedves {$u['nev']}!\n\nA penztar-gep.hu admin felületén $mit ezt a kódot írja be:\n\n    $code\n\nA kód " . (CODE_TTL / 60) . " percig érvényes, és csak egyszer használható.\nIdőpont: " . date('Y.m.d. H:i') . "\nIP-cím: " . ($_SERVER['REMOTE_ADDR'] ?? '') . "\n\nHa nem Ön kérte, ne adja meg senkinek, és szóljon a többi tulajdonosnak.\n\nTotál Pénztárgép és Számítástechnika";
  if (!send_mail($u['email'], "Belépési kód: $code", $txt)) out(['error' => 'Az e-mailt nem sikerült elküldeni. Kérjük, próbálja újra, vagy szóljon a tárhely üzemeltetőjének.'], 500);
  $sent[] = time(); $_SESSION['sends'] = array_values($sent);
  $_SESSION['code'] = ['uid' => $u['id'], 'cel' => $cel, 'hash' => password_hash($code, PASSWORD_DEFAULT), 'exp' => time() + CODE_TTL, 'tries' => 0, 'sent' => time()];
}
function check_code(string $uid, string $cel, string $kod): bool {
  $c = $_SESSION['code'] ?? null;
  if (!$c || $c['uid'] !== $uid || $c['cel'] !== $cel || time() > $c['exp']) return false;
  if ($c['tries'] >= 5) { unset($_SESSION['code']); return false; }
  $_SESSION['code']['tries']++;
  $kod = preg_replace('/\D/', '', $kod);
  if (strlen($kod) === 6 && password_verify($kod, $c['hash'])) { unset($_SESSION['code']); return true; }
  return false;
}

/* ---- telefonos hitelesítő app (TOTP, RFC 6238) – opcionális második lehetőség ---- */
function b32_encode(string $bin): string { $al='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; $bits=''; foreach (str_split($bin) as $c) $bits.=str_pad(decbin(ord($c)),8,'0',STR_PAD_LEFT); $out=''; foreach (str_split($bits,5) as $ch) $out.=$al[bindec(str_pad($ch,5,'0'))]; return $out; }
function b32_decode(string $s): string { $al='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; $s=strtoupper(preg_replace('/[^A-Za-z2-7]/','',$s)); $bits=''; foreach (str_split($s) as $c) $bits.=str_pad(decbin(strpos($al,$c)),5,'0',STR_PAD_LEFT); $out=''; foreach (str_split($bits,8) as $b) if (strlen($b)===8) $out.=chr(bindec($b)); return $out; }
function totp_at(string $secret, int $step): string { $h=hash_hmac('sha1', pack('J',$step), b32_decode($secret), true); $o=ord($h[19])&15; $n=((ord($h[$o])&127)<<24)|(ord($h[$o+1])<<16)|(ord($h[$o+2])<<8)|ord($h[$o+3]); return str_pad((string)($n%1000000),6,'0',STR_PAD_LEFT); }
function totp_check(string $secret, string $code, int $last = 0): ?int { $code=preg_replace('/\D/','',$code); if (strlen($code)!==6) return null; $t=intdiv(time(),30); foreach ([0,-1,1] as $d) { $st=$t+$d; if ($st>$last && hash_equals(totp_at($secret,$st),$code)) return $st; } return null; }

/* ---- belépés segédek ---- */
function log_login(array $u, string $how): void { global $LOG; locked(function () use ($u, $how, $LOG) { $l = read_json($LOG, []); array_unshift($l, ['ido' => date('c'), 'uid' => $u['id'], 'nev' => $u['nev'], 'ip' => $_SERVER['REMOTE_ADDR'] ?? '', 'mod' => $how, 'eszkoz' => mb_substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 160)]); write_json($LOG, array_slice($l, 0, 60)); }); }
function grant(array $u, string $how): void {
  session_regenerate_id(true);
  $_SESSION['admin'] = true; $_SESSION['seen'] = time(); $_SESSION['uid'] = $u['id']; $_SESSION['csrf'] = bin2hex(random_bytes(16));
  unset($_SESSION['pw_ok'], $_SESSION['code']);
  update_user($u['id'], function ($x) { $x['fail'] = 0; $x['lockUntil'] = 0; $x['utolso'] = date('c'); return $x; });
  log_login($u, $how);
  out(['ok' => true, 'csrf' => $_SESSION['csrf'], 'me' => pub_user($u) + ['szerep' => $u['szerep']]]);
}
function guard_user(array $u): void { if (($u['lockUntil'] ?? 0) > time()) out(['error' => 'Túl sok hibás próbálkozás miatt ez a hozzáférés ' . date('H:i', (int)$u['lockUntil']) . '-ig zárolva van.'], 429); }
function fail_user(string $id, string $msg): void { update_user($id, function ($x) { $x['fail'] = ($x['fail'] ?? 0) + 1; if ($x['fail'] >= 8) { $x['lockUntil'] = time() + 900; $x['fail'] = 0; } return $x; }); usleep(400000); out(['error' => $msg], 401); }
function pw_ok(string $pw): void { if (mb_strlen($pw) < 10) out(['error' => 'A jelszó legalább 10 karakter legyen.'], 400); }

/* ===== Ügyféllista: titkosított tárolás, távolság az üzlettől, zónák ===== */
function ckey(): string { global $LOCAL; $k = base64_decode((string)($LOCAL['kulcs'] ?? ''), true); if (!$k || strlen($k) !== 32) out(['error' => 'Hiányzik a titkosító kulcs a config.local.php fájlból, ezért az ügyféllista nem kezelhető.'], 500); return $k; }
function c_read(): array {
  global $CLIENTS; $raw = read_json($CLIENTS, null);
  $def = ['clients' => [], 'meta' => ['bolt' => ['lat' => 46.0786, 'lon' => 18.2318, 'cim' => '7625 Pécs, Hunyadi János utca 34.', 'ellenorzott' => false], 'zonak' => [
    ['nev' => 'Pécs belváros', 'km' => 3, 'szin' => '#1f9d55', 'dij' => ''], ['nev' => 'Pécs', 'km' => 10, 'szin' => '#2b6cb0', 'dij' => ''],
    ['nev' => 'Pécs környéke', 'km' => 25, 'szin' => '#c98e2b', 'dij' => ''], ['nev' => 'Baranya', 'km' => 50, 'szin' => '#dd6b20', 'dij' => ''], ['nev' => 'Távoli', 'km' => null, 'szin' => '#c0352b', 'dij' => '']]]];
  if (!$raw) return $def;
  $plain = openssl_decrypt(base64_decode($raw['data']), 'aes-256-gcm', ckey(), OPENSSL_RAW_DATA, base64_decode($raw['iv']), base64_decode($raw['tag']));
  if ($plain === false) out(['error' => 'Az ügyféllista nem fejthető vissza – a config.local.php kulcsa nem egyezik.'], 500);
  return json_decode($plain, true) ?: $def;
}
function c_write(array $d): void {
  global $CLIENTS; $iv = random_bytes(12); $tag = '';
  $ct = openssl_encrypt(json_encode($d, JSON_UNESCAPED_UNICODE), 'aes-256-gcm', ckey(), OPENSSL_RAW_DATA, $iv, $tag);
  write_json($CLIENTS, ['v' => 1, 'iv' => base64_encode($iv), 'tag' => base64_encode($tag), 'data' => base64_encode($ct)]);
}
function c_log(string $mit): void { global $CLOG; $u = me(); $l = read_json($CLOG, []); array_unshift($l, ['ido' => date('c'), 'nev' => $u['nev'] ?? '?', 'ip' => $_SERVER['REMOTE_ADDR'] ?? '', 'mit' => mb_substr($mit, 0, 200)]); write_json($CLOG, array_slice($l, 0, 300)); }
const C_FIELDS = ['nev' => 160, 'kapcsolattarto' => 120, 'telefon' => 60, 'email' => 120, 'irsz' => 10, 'varos' => 80, 'cim' => 160, 'adoszam' => 20, 'gep' => 120, 'ap' => 40, 'felulvizsgalat' => 10, 'megjegyzes' => 2000, 'cimkek' => 200];
function c_clean(array $in, array $old = []): array {
  $c = $old;
  foreach (C_FIELDS as $k => $max) if (array_key_exists($k, $in)) $c[$k] = mb_substr(trim((string)$in[$k]), 0, $max);
  if (!empty($c['felulvizsgalat']) && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $c['felulvizsgalat'])) $c['felulvizsgalat'] = '';
  $addrChanged = !$old || ($old['irsz'] ?? '') !== ($c['irsz'] ?? '') || ($old['varos'] ?? '') !== ($c['varos'] ?? '') || ($old['cim'] ?? '') !== ($c['cim'] ?? '');
  if (isset($in['lat'], $in['lon']) && is_numeric($in['lat']) && is_numeric($in['lon']) && abs((float)$in['lat']) <= 90 && abs((float)$in['lon']) <= 180 && ($in['geo'] ?? '') === 'kezi') { $c['lat'] = round((float)$in['lat'], 6); $c['lon'] = round((float)$in['lon'], 6); $c['geo'] = 'kezi'; }
  elseif ($addrChanged) { $c['lat'] = null; $c['lon'] = null; $c['geo'] = 'nincs'; }
  $c['id'] = $old['id'] ?? bin2hex(random_bytes(6));
  $c['letrehozva'] = $old['letrehozva'] ?? date('c'); $c['modositva'] = date('c'); $c['modositotta'] = me()['nev'] ?? '';
  return $c;
}
// cím → koordináta az OpenStreetMap ingyenes Nominatim szolgáltatásával (csak a cím megy ki, név soha)
function geocode(string $q): ?array {
  $url = 'https://nominatim.openstreetmap.org/search?' . http_build_query(['format' => 'jsonv2', 'limit' => 1, 'countrycodes' => 'hu', 'accept-language' => 'hu', 'q' => $q]);
  $ctx = stream_context_create(['http' => ['timeout' => 12, 'header' => "User-Agent: penztar-gep.hu-kezelo/1.0 (" . MAIL_FROM . ")\r\nAccept: application/json\r\n"]]);
  $r = @file_get_contents($url, false, $ctx); if ($r === false) return null;
  $j = json_decode($r, true); if (!is_array($j)) return null;
  if (!$j) return ['nincs' => true];
  return ['lat' => round((float)$j[0]['lat'], 6), 'lon' => round((float)$j[0]['lon'], 6)];
}
function addr(array $c): string { return trim(implode(', ', array_filter([trim(($c['irsz'] ?? '') . ' ' . ($c['varos'] ?? '')), $c['cim'] ?? '']))); }

$a = $_GET['a'] ?? '';
$m = $_SERVER['REQUEST_METHOD'];

switch ($a) {
  case 'data':      // nyilvános: termékek, kategóriák, szolgáltatások
    out(read_json($PRODUCTS, []) + ['fizetes' => ['online' => barion_on(), 'teszt' => barion_on() && barion_cfg()['teszt']]]);

  case 'status':
    $me = authed() ? me() : null;
    out(['admin' => (bool)$me, 'csrf' => $me ? $_SESSION['csrf'] : null, 'me' => $me ? pub_user($me) : null]);

  case 'admins':    // a belépő képernyőhöz: ki léphet be (a telefonszám csak részben látszik)
    out(array_values(array_map('pub_user', users())));

  case 'code-start':   // e-mailes kód kérése első belépéshez vagy elfelejtett jelszóhoz
    if ($m !== 'POST') out(['error' => 'POST kell.'], 405);
    $b = body(); $u = user((string)($b['id'] ?? '')); if (!$u) out(['error' => 'Ismeretlen felhasználó.'], 404);
    guard_user($u);
    $cel = empty($u['hash']) ? 'aktivalas' : 'visszaallitas';
    send_code($u, $cel);
    out(['ok' => true, 'cel' => $cel]);

  case 'set-password': // jelszó beállítása az e-mailben kapott kóddal, utána belép
    if ($m !== 'POST') out(['error' => 'POST kell.'], 405);
    $b = body(); $u = user((string)($b['id'] ?? '')); if (!$u) out(['error' => 'Ismeretlen felhasználó.'], 404);
    guard_user($u);
    $cel = empty($u['hash']) ? 'aktivalas' : 'visszaallitas';
    $pw = (string)($b['jelszo'] ?? ''); pw_ok($pw);
    if (!check_code($u['id'], $cel, (string)($b['kod'] ?? ''))) fail_user($u['id'], 'Hibás vagy lejárt kód. Kérjen újat, ha kell.');
    update_user($u['id'], function ($x) use ($pw) { $x['hash'] = password_hash($pw, PASSWORD_DEFAULT); return $x; });
    grant(user($u['id']), $cel === 'aktivalas' ? 'első belépés (e-mail kód)' : 'új jelszó (e-mail kód)');

  case 'login':     // 1. lépés: jelszó, utána kód az illető e-mail címére
    if ($m !== 'POST') out(['error' => 'POST kell.'], 405);
    $b = body(); $u = user((string)($b['id'] ?? '')); if (!$u) out(['error' => 'Ismeretlen felhasználó.'], 404);
    guard_user($u);
    if (empty($u['hash'])) out(['error' => 'Még nincs jelszava. Válassza az „Első belépés” lehetőséget.', 'activate' => true], 400);
    if (!password_verify((string)($b['jelszo'] ?? ''), (string)$u['hash'])) fail_user($u['id'], 'Hibás jelszó.');
    $_SESSION['pw_ok'] = ['uid' => $u['id'], 't' => time()];
    $app = !empty($u['totp']['enabled']);
    if (!empty($u['email'])) { send_code($u, 'belepes'); out(['need2fa' => true, 'via' => 'email', 'app' => $app]); }
    if ($app) out(['need2fa' => true, 'via' => 'app', 'app' => true]);
    out(['error' => 'Ehhez a személyhez nincs e-mail cím megadva, ezért nem tudjuk visszaigazolni a belépést.'], 400);

  case 'login-resend': // új e-mail kód a 2. lépésben
    if ($m !== 'POST') out(['error' => 'POST kell.'], 405);
    $p = $_SESSION['pw_ok'] ?? null; if (!$p || time() - $p['t'] > 900) out(['error' => 'Lejárt a belépés, adja meg újra a jelszót.', 'restart' => true], 401);
    $u = user($p['uid']); $hova = (string)(body()['hova'] ?? ''); send_code($u, 'belepes', $hova === 'uzlet' ? 'uzlet' : ''); out(['ok' => true, 'hova' => $hova === 'uzlet' ? 'uzlet' : 'sajat']);

  case 'login2':    // 2. lépés: e-mailben kapott kód (vagy a telefonos app kódja, vagy tartalékkód)
    if ($m !== 'POST') out(['error' => 'POST kell.'], 405);
    $p = $_SESSION['pw_ok'] ?? null; if (!$p || time() - $p['t'] > 900) out(['error' => 'Lejárt a belépés, adja meg újra a jelszót.', 'restart' => true], 401);
    $u = user($p['uid']); guard_user($u); $kod = trim((string)(body()['kod'] ?? ''));
    if (check_code($u['id'], 'belepes', $kod)) grant($u, 'jelszó + e-mail kód');
    if (!empty($u['totp']['enabled'])) {
      $st = totp_check((string)$u['totp']['secret'], $kod, (int)($u['totp']['last'] ?? 0));
      if ($st !== null) { update_user($u['id'], function ($x) use ($st) { $x['totp']['last'] = $st; return $x; }); grant($u, 'jelszó + telefonos app'); }
      $norm = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $kod));
      foreach (($u['totp']['recovery'] ?? []) as $k => $h) if (strlen($norm) === 10 && password_verify($norm, $h)) {
        update_user($u['id'], function ($x) use ($k) { unset($x['totp']['recovery'][$k]); $x['totp']['recovery'] = array_values($x['totp']['recovery']); return $x; });
        grant($u, 'jelszó + tartalékkód'); }
    }
    $mk = read_json($MASTER, []); $mn = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $kod));
    if (($u['szerep'] ?? '') === 'tulajdonos' && !empty($mk['hash']) && strlen($mn) === 16 && password_verify($mn, (string)$mk['hash'])) grant($u, 'jelszó + mesterkód');
    fail_user($u['id'], 'Hibás vagy lejárt kód. Nézze meg a legfrissebb e-mailt, vagy kérjen újat.');

  case 'master-new':   // új mesterkód: csak tulajdonos, csak egyszer látható, a régi azonnal érvénytelen
    need_owner(); check_csrf(); $me = me();
    $abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; $c = ''; for ($i = 0; $i < 16; $i++) $c .= $abc[random_int(0, 31)];
    locked(function () use ($MASTER, $c, $me) { write_json($MASTER, ['hash' => password_hash($c, PASSWORD_DEFAULT), 'ido' => date('c'), 'nev' => $me['nev']]); });
    out(['ok' => true, 'kod' => implode('-', str_split($c, 4))]);
  case 'master-info':
    need_auth(); $mk = read_json($MASTER, []); out(['van' => !empty($mk['hash']), 'ido' => $mk['ido'] ?? null, 'nev' => $mk['nev'] ?? null]);

  case 'logout':
    $_SESSION = []; session_destroy(); out(['ok' => true]);

  case 'password':  // saját jelszó cseréje
    need_auth(); check_csrf();
    $b = body(); $u = me();
    if (!password_verify((string)($b['regi'] ?? ''), (string)$u['hash'])) out(['error' => 'A jelenlegi jelszó nem stimmel.'], 400);
    pw_ok((string)($b['uj'] ?? ''));
    update_user($u['id'], function ($x) use ($b) { $x['hash'] = password_hash((string)$b['uj'], PASSWORD_DEFAULT); return $x; });
    out(['ok' => true]);

  case 'totp-setup':
    need_auth(); check_csrf();
    $sec = b32_encode(random_bytes(20)); $_SESSION['totp_pending'] = $sec; $u = me();
    $label = rawurlencode('Totál webáruház:' . $u['nev']);
    out(['secret' => $sec, 'uri' => "otpauth://totp/$label?secret=$sec&issuer=" . rawurlencode('Totál webáruház') . '&algorithm=SHA1&digits=6&period=30']);

  case 'totp-enable':
    need_auth(); check_csrf();
    $sec = (string)($_SESSION['totp_pending'] ?? ''); $b = body();
    if ($sec === '') out(['error' => 'Előbb kérjen új beállítási kódot.'], 400);
    $st = totp_check($sec, (string)($b['kod'] ?? ''));
    if ($st === null) out(['error' => 'A kód nem egyezik. Ellenőrizze, hogy a telefon órája pontos, és a legfrissebb kódot írta be.'], 400);
    $codes = []; $hashes = [];
    for ($i = 0; $i < 8; $i++) { $c = strtoupper(substr(b32_encode(random_bytes(8)), 0, 10)); $codes[] = substr($c,0,5) . '-' . substr($c,5); $hashes[] = password_hash($c, PASSWORD_DEFAULT); }
    update_user(me()['id'], function ($x) use ($sec, $st, $hashes) { $x['totp'] = ['enabled' => true, 'secret' => $sec, 'last' => $st, 'recovery' => $hashes, 'since' => date('c')]; return $x; });
    unset($_SESSION['totp_pending']);
    out(['ok' => true, 'recovery' => $codes]);

  case 'totp-disable':
    need_auth(); check_csrf();
    $b = body(); $u = me();
    if (!password_verify((string)($b['jelszo'] ?? ''), (string)$u['hash'])) out(['error' => 'A jelszó nem stimmel.'], 400);
    update_user($u['id'], function ($x) { $x['totp'] = null; return $x; });
    out(['ok' => true]);

  case 'security':  // saját biztonsági állapot + belépési napló (tulajdonos mindenkiét látja)
    need_auth(); $u = me(); $log = read_json($LOG, []);
    if ($u['szerep'] !== 'tulajdonos') $log = array_values(array_filter($log, fn($l) => ($l['uid'] ?? '') === $u['id']));
    out(['me' => pub_user($u) + ['emailMask' => mask_mail((string)$u['email'])], 'totp' => !empty($u['totp']['enabled']), 'since' => $u['totp']['since'] ?? null, 'recoveryLeft' => count($u['totp']['recovery'] ?? []), 'log' => array_slice($log, 0, 30)]);

  /* ---- ügyféllista ---- */
  case 'clients':
    need_auth(); $d = c_read();
    if (time() - ($_SESSION['clog'] ?? 0) > 600) { $_SESSION['clog'] = time(); locked(fn() => c_log('megnyitotta az ügyféllistát')); }
    out(['clients' => $d['clients'], 'meta' => $d['meta'], 'tulajdonos' => me()['szerep'] === 'tulajdonos']);

  case 'client-save':
    need_auth(); check_csrf(); $in = (array)(body()['c'] ?? []);
    $res = locked(function () use ($in) { $d = c_read(); $i = null;
      foreach ($d['clients'] as $k => $c) if ($c['id'] === ($in['id'] ?? '')) $i = $k;
      if (trim((string)($in['nev'] ?? ($i !== null ? $d['clients'][$i]['nev'] : ''))) === '') out(['error' => 'Adja meg az ügyfél nevét.'], 400);
      $c = c_clean($in, $i !== null ? $d['clients'][$i] : []);
      if ($i === null) $d['clients'][] = $c; else $d['clients'][$i] = $c;
      c_write($d); c_log(($i === null ? 'új ügyfél: ' : 'módosította: ') . $c['nev']); return $c; });
    out(['ok' => true, 'c' => $res]);

  case 'client-del':
    need_owner(); check_csrf(); $id = (string)(body()['id'] ?? '');
    locked(function () use ($id) { $d = c_read(); $n = '';
      $d['clients'] = array_values(array_filter($d['clients'], function ($c) use ($id, &$n) { if ($c['id'] === $id) { $n = $c['nev']; return false; } return true; }));
      c_write($d); c_log('törölte: ' . $n); });
    out(['ok' => true]);

  case 'clients-import':   // a böngésző beolvassa a fájlt, ide már csak a mezőkre bontott sorok jönnek
    need_owner(); check_csrf(); $b = body(); $rows = array_slice((array)($b['rows'] ?? []), 0, 5000); $mode = ($b['mode'] ?? '') === 'csere' ? 'csere' : 'hozza';
    $n = locked(function () use ($rows, $mode) { $d = c_read(); if ($mode === 'csere') $d['clients'] = [];
      $cnt = 0; foreach ($rows as $r) { if (!is_array($r) || trim((string)($r['nev'] ?? '')) === '') continue; $d['clients'][] = c_clean($r); $cnt++; }
      c_write($d); c_log("importált $cnt ügyfelet (" . ($mode === 'csere' ? 'teljes csere' : 'hozzáadás') . ')'); return $cnt; });
    out(['ok' => true, 'db' => $n]);

  case 'clients-meta':     // üzlet helye és a zónák
    need_owner(); check_csrf(); $b = body();
    locked(function () use ($b) { $d = c_read();
      if (isset($b['bolt']['lat'], $b['bolt']['lon']) && is_numeric($b['bolt']['lat']) && is_numeric($b['bolt']['lon'])) $d['meta']['bolt'] = ['lat' => (float)$b['bolt']['lat'], 'lon' => (float)$b['bolt']['lon'], 'cim' => mb_substr((string)($b['bolt']['cim'] ?? ''), 0, 160), 'ellenorzott' => true];
      if (is_array($b['zonak'] ?? null)) { $z = [];
        foreach (array_slice($b['zonak'], 0, 10) as $x) $z[] = ['nev' => mb_substr(trim((string)($x['nev'] ?? 'Zóna')), 0, 40), 'km' => is_numeric($x['km'] ?? null) ? (float)$x['km'] : null, 'szin' => preg_match('/^#[0-9a-f]{6}$/i', (string)($x['szin'] ?? '')) ? $x['szin'] : '#2b6cb0', 'dij' => mb_substr(trim((string)($x['dij'] ?? '')), 0, 60)];
        usort($z, fn($p, $q) => ($p['km'] ?? 1e9) <=> ($q['km'] ?? 1e9)); $d['meta']['zonak'] = $z; }
      c_write($d); c_log('módosította a zónákat / az üzlet helyét'); });
    out(['ok' => true]);

  case 'geocode':          // legfeljebb 6 cím helyének megkeresése kérésenként (a szolgáltatás szabálya: 1 kérés / mp)
    need_auth(); check_csrf();
    $res = locked(function () { $d = c_read(); $done = 0; $t0 = microtime(true);
      if (empty($d['meta']['bolt']['ellenorzott'])) { $g = geocode($d['meta']['bolt']['cim']); if ($g && empty($g['nincs'])) { $d['meta']['bolt']['lat'] = $g['lat']; $d['meta']['bolt']['lon'] = $g['lon']; $d['meta']['bolt']['ellenorzott'] = true; } usleep(1100000); }
      foreach ($d['clients'] as &$c) {
        if (($c['geo'] ?? 'nincs') !== 'nincs') continue; if ($done >= 6 || microtime(true) - $t0 > 20) break;
        $q = addr($c); if ($q === '') { $c['geo'] = 'hiba'; continue; }
        $g = geocode($q);
        if ($g === null) break;                        // a szolgáltatás nem érhető el – később újra
        if (!empty($g['nincs']) && !empty($c['varos'])) { usleep(1100000); $g = geocode(trim(($c['irsz'] ?? '') . ' ' . $c['varos'])); if ($g && empty($g['nincs'])) $g['kozelito'] = true; }
        if ($g && empty($g['nincs'])) { $c['lat'] = $g['lat']; $c['lon'] = $g['lon']; $c['geo'] = !empty($g['kozelito']) ? 'telepules' : 'ok'; } else $c['geo'] = 'hiba';
        $done++; usleep(1100000);
      } unset($c);
      c_write($d); $left = count(array_filter($d['clients'], fn($c) => ($c['geo'] ?? 'nincs') === 'nincs'));
      return ['kesz' => $done, 'hatra' => $left, 'clients' => $d['clients'], 'meta' => $d['meta']]; });
    out($res);

  case 'clients-export':
    need_owner(); check_csrf(); $d = c_read(); c_log('exportálta az ügyféllistát (' . count($d['clients']) . ' ügyfél)');
    out(['clients' => $d['clients']]);

  case 'clients-log':
    need_owner(); out(read_json($CLOG, []));

  /* ---- felhasználók kezelése: csak tulajdonos ---- */
  case 'users':
    need_owner();
    out(array_values(array_map(fn($u) => pub_user($u) + ['telTeljes' => $u['tel'], 'emailCim' => $u['email'] ?? '', 'utolso' => $u['utolso'] ?? null, 'app' => !empty($u['totp']['enabled']), 'felvette' => $u['felvette'] ?? null, 'zarolva' => ($u['lockUntil'] ?? 0) > time()], users())));

  case 'user-add':
    need_owner(); check_csrf();
    $b = body(); $nev = trim((string)($b['nev'] ?? '')); $tel = norm_tel((string)($b['tel'] ?? '')); $email = trim((string)($b['email'] ?? ''));
    if (mb_strlen($nev) < 3) out(['error' => 'Adja meg a nevet.'], 400);
    if (strlen($tel) < 11) out(['error' => 'Adjon meg érvényes telefonszámot (pl. +36 30 123 4567).'], 400);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) out(['error' => 'Adjon meg érvényes e-mail címet: erre megy a belépési kód.'], 400);
    $me = me();
    $id = locked(function () use ($nev, $tel, $email, $me) {
      $by = users();
      foreach ($by as $u) if (norm_tel($u['tel']) === $tel) out(['error' => 'Ezzel a telefonszámmal már van hozzáférés.'], 400);
      $id = trim(preg_replace('/[^a-z0-9]+/', '-', strtolower(iconv('UTF-8', 'ASCII//TRANSLIT', $nev) ?: 'admin')), '-') . '-' . substr(bin2hex(random_bytes(2)), 0, 4);
      $by[$id] = ['id' => $id, 'nev' => mb_substr($nev, 0, 60), 'tel' => $tel, 'email' => $email, 'szerep' => 'admin', 'hash' => null, 'totp' => null, 'ido' => date('c'), 'felvette' => $me['nev']];
      save_users($by); return $id; });
    send_mail($email, 'Admin hozzáférést kapott – penztar-gep.hu', "Kedves $nev!\n\n{$me['nev']} admin hozzáférést adott Önnek a penztar-gep.hu webáruházához.\n\nAz első belépéshez nyissa meg a weboldalon az Admin gombot, válassza ki a nevét, és kattintson az „Első belépés” gombra. A jelszó beállításához erre az e-mail címre küldünk kódot.\n\nTotál Pénztárgép és Számítástechnika");
    out(['ok' => true, 'id' => $id]);

  case 'user-reset':   // jelszó és app törlése: a személy újra az e-mailes kóddal állít be jelszót
    need_owner(); check_csrf();
    $id = (string)(body()['id'] ?? ''); if ($id === me()['id']) out(['error' => 'A saját hozzáférését a Biztonság fülön módosíthatja.'], 400);
    if (!user($id)) out(['error' => 'Ismeretlen felhasználó.'], 404);
    update_user($id, function ($x) { $x['hash'] = null; $x['totp'] = null; $x['fail'] = 0; $x['lockUntil'] = 0; return $x; });
    out(['ok' => true]);

  case 'user-del':     // további admin törlése (tulajdonost nem lehet)
    need_owner(); check_csrf();
    $id = (string)(body()['id'] ?? '');
    locked(function () use ($id) { $by = users(); if (!isset($by[$id])) out(['error' => 'Ismeretlen felhasználó.'], 404); if ($by[$id]['szerep'] === 'tulajdonos') out(['error' => 'Tulajdonost nem lehet törölni.'], 400); unset($by[$id]); save_users($by); });
    out(['ok' => true]);

  case 'save':      // teljes katalógus mentése (termékek, árak, szolgáltatások, beállítások)
    need_auth(); check_csrf();
    $b = body();
    if (!isset($b['products'], $b['categories'], $b['services'], $b['settings'])) out(['error' => 'Hiányos adat.'], 400);
    if (is_file($PRODUCTS)) copy($PRODUCTS, DATA . '/products.backup-' . date('Ymd-His') . '.json');
    // csak az utolsó 20 mentést tartjuk meg
    $bk = glob(DATA . '/products.backup-*.json'); sort($bk);
    while (count($bk) > 20) { @unlink(array_shift($bk)); }
    unset($b['fizetes']);
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
    $kosar = ($b['tipus'] ?? '') === 'megrendeles' && !empty($b['tetelek']);
    $fizmod = in_array($b['fizmod'] ?? '', ['online', 'atutalas', 'atvetelkor'], true) ? $b['fizmod'] : 'atvetelkor';
    $kiszall = false;   // jelenleg csak személyes átvétel van
    if (($b['atvetel'] ?? '') === 'Kiszállítással') out(['error' => 'A termékeket jelenleg csak üzletünkben lehet átvenni.'], 400);
    if ($kosar && !filter_var($email, FILTER_VALIDATE_EMAIL)) out(['error' => 'Adjon meg érvényes e-mail-címet: ide küldjük a visszaigazolást.'], 400);
    if ($kosar && $fizmod === 'online' && !barion_on()) out(['error' => 'Az online fizetés most nem érhető el. Kérjük, válasszon másik fizetési módot.'], 400);
    if ($kosar && $fizmod === 'atvetelkor' && $kiszall) out(['error' => 'Kiszállításnál előre, átutalással kell fizetni.'], 400);
    $szallcim = '';
    if ($kosar && $kiszall) {
      $sc = is_array($b['szallcim'] ?? null) ? $b['szallcim'] : [];
      $irsz = trim((string)($sc['irsz'] ?? '')); $varos = trim((string)($sc['varos'] ?? '')); $utca = trim((string)($sc['utca'] ?? ''));
      if (!preg_match('/^\d{4}$/', $irsz) || $varos === '' || $utca === '') out(['error' => 'Adja meg a szállítási címet (irányítószám, település, utca, házszám).'], 400);
      $szallcim = mb_substr("$irsz $varos, $utca", 0, 200);
    }
    // pénztárgép-adatlap (előre fizetésnél kötelező): külön mezőben tároljuk, e-mailben NEM küldjük ki
    $adatlap = null;
    if (is_array($b['adatlap'] ?? null)) {
      $adatlap = [];
      foreach (array_slice($b['adatlap'], 0, 25, true) as $k => $v) {
        $k = mb_substr(trim((string)$k), 0, 60); if ($k === '' || is_array($v)) continue;
        $adatlap[$k] = mb_substr(trim((string)$v), 0, 200);
      }
      if (str_starts_with($adatlap['Élesítés módja'] ?? '', 'Előre')) {
        foreach (['Képviselő neve', 'Cégnév', 'Személyigazolvány száma', 'Székhely', 'Telephely', 'Adószám', 'Mobiltelefon', 'E-mail', 'NAV regisztrációs kód', 'Gép típusa'] as $req)
          if (($adatlap[$req] ?? '') === '') out(['error' => 'Előre fizetésnél a pénztárgép-adatlapot teljesen ki kell tölteni (hiányzik: ' . $req . ').'], 400);
        if (!preg_match('/^\d{8}-\d-\d{2}$/', $adatlap['Adószám'])) out(['error' => 'Az adatlapon az adószám formátuma hibás.'], 400);
        if (strlen(preg_replace('/[^A-Za-z0-9]/', '', $adatlap['NAV regisztrációs kód'])) !== 16) out(['error' => 'A NAV regisztrációs kód 16 karakterből áll.'], 400);
      }
    }
    // tételek: név és ár a szerver katalógusából; készlet ellenőrzése és csökkentése zárolás alatt
    $tetelek = [];
    $lock = fopen(DATA . '/.lock', 'c'); flock($lock, LOCK_EX);
    $cat = read_json($PRODUCTS, []);
    $byId = []; foreach (($cat['products'] ?? []) as $i => $p) $byId[$p['id']] = $i;
    foreach (array_slice(is_array($b['tetelek'] ?? null) ? $b['tetelek'] : [], 0, 30) as $t) {
      $id = (string)($t['id'] ?? ''); $db = max(1, min(99, (int)($t['db'] ?? 1)));
      if (!isset($byId[$id])) continue;
      $p = &$cat['products'][$byId[$id]];
      if ($kosar && $fizmod === 'online' && ($p['akciosAr'] ?? $p['ar'] ?? null) === null) { flock($lock, LOCK_UN); out(['error' => ($p['nev'] ?? 'A termék') . ': az ára egyeztetés után derül ki, ezért online nem fizethető. Kérjük, válasszon átutalást.'], 400); }
      if (isset($p['keszletDb']) && $p['keszletDb'] !== null) {
        if ($p['keszletDb'] < $db) { flock($lock, LOCK_UN); out(['error' => ($p['nev'] ?? 'A termék') . ': csak ' . (int)$p['keszletDb'] . ' db van raktáron.'], 409); }
        $p['keszletDb'] -= $db;
        if ($p['keszletDb'] <= 0) { $p['keszletDb'] = 0; $p['keszlet'] = 'elfogyott'; }
      }
      $net = $p['akciosAr'] ?? $p['ar'] ?? null;
      $tetelek[] = ['id' => $id, 'db' => $db, 'nev' => trim(($p['marka'] ?? '') . ' ' . ($p['nev'] ?? '')), 'ar' => $net, 'brutto' => $net === null ? null : brutto($net, $cat['settings']['afa'] ?? 27)];
      unset($p);
    }
    if ($tetelek) write_json($PRODUCTS, $cat);
    flock($lock, LOCK_UN);
    // díjak: üzembe helyezés, szállítás
    $set = $cat['settings'] ?? []; $extrak = []; $osszeg = 0;
    foreach ($tetelek as $t) $osszeg += (int)($t['brutto'] ?? 0) * $t['db'];
    if ($kosar && !empty($b['uzembe'])) foreach (($cat['services'] ?? []) as $sv) if (($sv['id'] ?? '') === 'uzembe' && !empty($sv['ar'])) $extrak[] = ['id' => 'uzembe', 'nev' => 'Üzembe helyezés, betanítás, ügyintézés', 'brutto' => brutto($sv['ar'], $set['afa'] ?? 27)];
    foreach ($extrak as $x) $osszeg += $x['brutto'];
    if ($kosar && $kiszall) { $dij = (int)($set['szallitasDij'] ?? 0); $hat = (int)($set['ingyenesSzallitasFelett'] ?? 0); if ($hat && $osszeg >= $hat) $dij = 0;
      if ($dij) { $extrak[] = ['id' => 'szallitas', 'nev' => 'Szállítás (' . ($set['futar'] ?? 'futárszolgálat') . ')', 'brutto' => $dij]; $osszeg += $dij; } }
    $fizszoveg = ['online' => 'Online bankkártyával (Barion)', 'atutalas' => 'Átutalással, díjbekérő alapján', 'atvetelkor' => 'Átvételkor, az üzletben készpénzzel'][$fizmod];
    $rec = [
      'id' => date('ymd') . '-' . strtoupper(bin2hex(random_bytes(3))),
      'ido' => date('c'),
      'tipus' => mb_substr((string)($b['tipus'] ?? 'ajanlat'), 0, 30),
      'nev' => mb_substr($nev, 0, 120), 'ceg' => mb_substr((string)($b['ceg'] ?? ''), 0, 120),
      'telefon' => mb_substr($tel, 0, 40), 'email' => mb_substr($email, 0, 120),
      'tetelek' => $tetelek,
      'idopont' => mb_substr((string)($b['idopont'] ?? ''), 0, 40),
      'uzenet' => mb_substr((string)($b['uzenet'] ?? ''), 0, 3000),
      'adatlap' => $adatlap,
      'allapot' => 'uj'
    ];
    if ($kosar) $rec += ['extrak' => $extrak, 'osszeg' => $osszeg, 'atvetel' => $kiszall ? 'Kiszállítással' : 'Személyesen az üzletben', 'szallcim' => $szallcim, 'fizmod' => $fizszoveg,
      'fizetes' => ['mod' => $fizmod, 'allapot' => $fizmod === 'online' ? 'fizetesre_var' : 'nem_online']];
    $gw = null;
    if ($kosar && $fizmod === 'online') {
      $gw = barion_start($rec);
      if (!$gw) { restock($tetelek); out(['error' => 'Az online fizetést most nem sikerült elindítani. Kérjük, próbálja újra néhány perc múlva, vagy válasszon átutalást.'], 502); }
    }
    locked(function () use ($rec, $ORDERS) { $orders = read_json($ORDERS, []); array_unshift($orders, $rec); write_json($ORDERS, $orders); });
    if ($gw) out(['ok' => true, 'id' => $rec['id'], 'fizetes' => $gw]);   // az értesítők a sikeres fizetés után mennek ki
    mail_shop($rec, $kosar ? 'Új megrendelés a weboldalról' : 'Új ' . $rec['tipus'] . ' a weboldalról');
    if ($kosar) mail_customer($rec, "Megrendelését megkaptuk – {$rec['id']}", 'Köszönjük a megrendelését! Ez automatikus értesítés arról, hogy megrendelését megkaptuk és az alábbi adatokkal rögzítettük. Ez még nem a megrendelés elfogadása: munkatársunk a készlet és az ár ellenőrzése után külön e-mailben igazolja vissza.' . ($fizmod === 'atutalas' ? ' Az utaláshoz szükséges díjbekérőt a visszaigazolással együtt küldjük.' : ''));
    out(['ok' => true, 'id' => $rec['id']]);

  case 'barion-callback':   // a Barion szól, ha egy fizetés állapota megváltozott
    $pid = (string)($_POST['PaymentId'] ?? $_GET['PaymentId'] ?? $_GET['paymentId'] ?? (body()['PaymentId'] ?? ''));
    if ($pid !== '') foreach (read_json($ORDERS, []) as $x) if (($x['fizetes']['paymentId'] ?? '') === $pid) { pay_refresh($x['id']); break; }
    out(['ok' => true]);

  case 'pay-status':        // nyilvános: a vevő visszatér a fizetésből – csak az állapotot adja vissza
    $id = (string)($_GET['id'] ?? '');
    $o = $id !== '' ? pay_refresh($id) : null;
    if (!$o || ($o['fizetes']['mod'] ?? '') !== 'online') out(['error' => 'Nincs ilyen online fizetés.'], 404);
    out(['id' => $o['id'], 'allapot' => $o['fizetes']['allapot'], 'osszeg' => $o['osszeg'] ?? null, 'adatlap' => !empty($o['adatlap']), 'atvetel' => $o['atvetel'] ?? '']);

  /* ---- feladatok, észrevételek a weboldallal kapcsolatban ---- */
  /* ---- „E-mail küldése” űrlap (nyilvános) ----
     A weboldalon sehol nincs kiírva e-mail cím: a látogató ezen az űrlapon ír, a levél a titkos értesítési címre megy,
     a válaszcím a látogató saját címe. Védelem: rejtett csapdamező, aláírt jegy (legalább 4 mp az űrlap megnyitása után,
     legfeljebb 2 óra), legfeljebb 2 internetes hivatkozás, IP-korlát (10 percenként 3, naponta 10 üzenet).
     A látogatónak NEM küldünk automatikus levelet – így az űrlappal nem lehet idegen címekre levelet küldetni. */
  case 'kapcsolat-jegy':
    out(['jegy' => form_ticket()]);

  case 'kapcsolat':
    if ($m !== 'POST') out(['error' => 'POST kell.'], 405);
    $b = body();
    if (!empty($b['web'])) out(['ok' => true, 'id' => '']);                    // csapda a robotoknak (rejtett mező)
    $kor = form_ticket_age((string)($b['jegy'] ?? ''));
    if ($kor === null || $kor > 7200) out(['error' => 'Az űrlap lejárt. Kérjük, nyissa meg újra, és küldje el még egyszer.', 'ujjegy' => form_ticket()], 400);
    if ($kor < 4) out(['error' => 'Kérjük, várjon néhány másodpercet, mielőtt elküldi az üzenetet.'], 400);
    $nev = trim(preg_replace('/\s+/u', ' ', (string)($b['nev'] ?? '')));
    $email = trim((string)($b['email'] ?? '')); $tel = trim((string)($b['telefon'] ?? ''));
    $targy = trim(preg_replace('/\s+/u', ' ', (string)($b['targy'] ?? ''))); $uz = trim(str_replace("\r", '', (string)($b['uzenet'] ?? '')));
    $termek = trim(preg_replace('/\s+/u', ' ', (string)($b['termek'] ?? ''))); $oldal = trim((string)($b['oldal'] ?? ''));
    if (mb_strlen($nev) < 2) out(['error' => 'Kérjük, adja meg a nevét.', 'mezo' => 'nev'], 400);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || preg_match('/[\r\n]/', $email)) out(['error' => 'Kérjük, adjon meg érvényes e-mail címet – erre válaszolunk.', 'mezo' => 'email'], 400);
    if ($tel !== '' && !preg_match('/^[\d\s+()\/-]{6,25}$/', $tel)) out(['error' => 'A telefonszám formátuma nem megfelelő.', 'mezo' => 'telefon'], 400);
    if (mb_strlen($uz) < 10) out(['error' => 'Kérjük, írja le röviden, miben segíthetünk.', 'mezo' => 'uzenet'], 400);
    if (mb_strlen($uz) > 3000) out(['error' => 'Az üzenet legfeljebb 3000 karakter lehet.', 'mezo' => 'uzenet'], 400);
    if (preg_match_all('~(https?://|www\.|\[url|<a\s)~i', $nev . ' ' . $targy . ' ' . $uz) > 2) out(['error' => 'Az üzenetben legfeljebb 2 internetes hivatkozás lehet.', 'mezo' => 'uzenet'], 400);
    if (preg_match('~https?://|www\.~i', $nev)) out(['error' => 'Kérjük, adja meg a nevét.', 'mezo' => 'nev'], 400);
    // IP-korlát (az IP-címet nem tároljuk, csak egy ujjlenyomatát)
    $ip = hash('sha256', client_ip() . '|' . form_secret());
    $tilt = locked(function () use ($KIP, $ip) {
      $l = read_json($KIP, []); $most = time();
      foreach ($l as $k => $ts) { $l[$k] = array_values(array_filter((array)$ts, fn($t) => $most - (int)$t < 86400)); if (!$l[$k]) unset($l[$k]); }
      $sajat = $l[$ip] ?? [];
      $tiz = count(array_filter($sajat, fn($t) => $most - (int)$t < 600));
      if ($tiz >= 3 || count($sajat) >= 10) { write_json($KIP, $l); return true; }
      $sajat[] = $most; $l[$ip] = $sajat; write_json($KIP, $l); return false;
    });
    if ($tilt) out(['error' => 'Rövid időn belül több üzenet érkezett erről a hálózatról. Kérjük, próbálja újra később, vagy hívjon minket telefonon.'], 429);
    $targy = mb_substr($targy !== '' ? $targy : 'Egyéb kérdés', 0, 80);
    $rec = [
      'id' => date('ymd') . '-' . strtoupper(bin2hex(random_bytes(3))),
      'ido' => date('c'), 'tipus' => 'uzenet', 'targy' => $targy,
      'nev' => mb_substr($nev, 0, 120), 'ceg' => '', 'telefon' => mb_substr($tel, 0, 40), 'email' => mb_substr($email, 0, 120),
      'tetelek' => [], 'idopont' => '',
      'uzenet' => 'Tárgy: ' . $targy . ($termek !== '' ? "\nTermék: " . mb_substr($termek, 0, 160) : '') . "\n\n" . $uz,
      'adatlap' => null, 'allapot' => 'uj',
      'oldal' => mb_substr(preg_replace('/[^\x21-\x7e]/', '', $oldal), 0, 200), 'nyelv' => preg_match('/^[a-z]{2}$/', (string)($b['nyelv'] ?? '')) ? $b['nyelv'] : 'hu'
    ];
    locked(function () use ($rec, $ORDERS) { $orders = read_json($ORDERS, []); array_unshift($orders, $rec); write_json($ORDERS, $orders); });
    $to = notify_email();
    if ($to !== '') {
      $nyelvek = ['hu' => 'magyar', 'en' => 'angol', 'de' => 'német', 'it' => 'olasz', 'hr' => 'horvát', 'sk' => 'szlovák', 'pl' => 'lengyel', 'zh' => 'kínai'];
      $txt = "Új üzenet a penztar-gep.hu „E-mail küldése” űrlapjáról\n\n"
        . "Név: {$rec['nev']}\nE-mail: {$rec['email']}\n" . ($rec['telefon'] !== '' ? "Telefon: {$rec['telefon']}\n" : '')
        . "Tárgy: $targy\n" . ($termek !== '' ? 'Termék: ' . mb_substr($termek, 0, 160) . "\n" : '')
        . ($rec['nyelv'] !== 'hu' ? 'A látogató nyelve: ' . ($nyelvek[$rec['nyelv']] ?? $rec['nyelv']) . "\n" : '')
        . ($rec['oldal'] !== '' ? "Oldal: {$rec['oldal']}\n" : '')
        . "Azonosító: #{$rec['id']} · " . date('Y.m.d. H:i') . "\n\n" . str_repeat('-', 40) . "\n$uz\n" . str_repeat('-', 40)
        . "\n\nVálaszhoz egyszerűen nyomja meg a Válasz gombot – a levél a látogató címére megy.\nAz üzenet az admin felületen, a Rendelések között is megtalálható („Üzenet”).";
      send_mail($to, 'Üzenet a weboldalról: ' . $targy . ' – ' . $rec['nev'], $txt, $rec['email']);
    }
    out(['ok' => true, 'id' => $rec['id']]);

  /* ---- titkos értesítési cím (admin › Cégadatok) ---- */
  case 'ertesites':
    need_auth(); $d = read_json($NOTIFY, []); $own = (me()['szerep'] ?? '') === 'tulajdonos'; $e = (string)($d['email'] ?? '');
    out(['beallitva' => filter_var($e, FILTER_VALIDATE_EMAIL) ? true : false, 'email' => $own ? $e : '', 'maszk' => mask_mail($e), 'tulajdonos' => $own,
         'modositva' => $d['ido'] ?? null, 'nev' => $d['nev'] ?? null, 'proba' => $d['proba'] ?? null]);
  case 'ertesites-mentes':
    need_owner(); check_csrf(); $e = trim((string)(body()['email'] ?? ''));
    if ($e !== '' && (!filter_var($e, FILTER_VALIDATE_EMAIL) || preg_match('/[\r\n,;]/', $e))) out(['error' => 'Ez nem érvényes e-mail cím.'], 400);
    $u = me(); locked(function () use ($NOTIFY, $e, $u) { write_json($NOTIFY, ['email' => $e, 'ido' => date('c'), 'nev' => $u['nev']]); });
    out(['ok' => true, 'maszk' => mask_mail($e)]);
  case 'ertesites-proba':
    need_owner(); check_csrf(); $d = read_json($NOTIFY, []); $e = (string)($d['email'] ?? '');
    if (!filter_var($e, FILTER_VALIDATE_EMAIL)) out(['error' => 'Előbb adja meg és mentse el az értesítési címet.'], 400);
    if (!empty($d['proba']) && time() - strtotime((string)$d['proba']) < 60) out(['error' => 'Az előző próbalevél egy percen belül ment el. Várjon egy kicsit.'], 429);
    $u = me();
    $ok = send_mail($e, 'Próbalevél – penztar-gep.hu értesítések', "Ez egy próbalevél a penztar-gep.hu weboldalról.\n\nHa megkapta, a beállítás jó: ide érkeznek majd a megrendelések, ajánlatkérések és az „E-mail küldése” gombbal írt üzenetek.\n\nKérte: {$u['nev']}\nIdőpont: " . date('Y.m.d. H:i') . "\n\nHa a levél a Spam / Levélszemét mappába került, jelölje meg „Nem spam”-ként, és vegye fel a noreply@penztar-gep.hu címet a névjegyek közé.");
    if (!$ok) out(['error' => 'A próbalevelet nem sikerült elküldeni (a tárhely levelezője hibát jelzett).'], 500);
    locked(function () use ($NOTIFY, $d) { $d['proba'] = date('c'); write_json($NOTIFY, $d); });
    out(['ok' => true]);

  case 'tasks':
    need_auth(); out(['tasks' => read_json($TASKS, [])]);
  case 'task-add':
    need_auth(); check_csrf(); $u = me(); $sz = trim((string)(body()['szoveg'] ?? ''));
    if ($sz === '') out(['error' => 'Írja be a feladatot vagy az észrevételt.'], 400);
    $sz = mb_substr($sz, 0, 4000);
    $r = locked(function () use ($TASKS, $u, $sz) { $l = read_json($TASKS, []); $x = ['id' => bin2hex(random_bytes(6)), 'szoveg' => $sz, 'ido' => date('c'), 'uid' => $u['id'], 'nev' => $u['nev'], 'kesz' => false];
      array_unshift($l, $x); write_json($TASKS, array_slice($l, 0, 2000)); return $x; });
    out(['ok' => true, 'task' => $r]);
  case 'task-done':
    need_auth(); check_csrf(); $u = me(); $b = body(); $id = (string)($b['id'] ?? ''); $vissza = !empty($b['vissza']);
    $ok = locked(function () use ($TASKS, $u, $id, $vissza) { $l = read_json($TASKS, []); $f = false;
      foreach ($l as &$x) if (($x['id'] ?? '') === $id) { $f = true; if ($vissza) { $x['kesz'] = false; unset($x['keszIdo'], $x['keszNev']); } else { $x['kesz'] = true; $x['keszIdo'] = date('c'); $x['keszNev'] = $u['nev']; } }
      unset($x); if ($f) write_json($TASKS, $l); return $f; });
    if (!$ok) out(['error' => 'Ilyen bejegyzés nincs.'], 404);
    out(['ok' => true]);

  case 'orders':
    need_auth(); out(read_json($ORDERS, []));

  case 'order-status':
    need_auth(); check_csrf();
    $b = body(); $orders = read_json($ORDERS, []);
    $vissza = null;
    foreach ($orders as &$o) if ($o['id'] === ($b['id'] ?? '')) {
      $uj = in_array($b['allapot'] ?? '', ['uj', 'folyamatban', 'kesz']) ? $b['allapot'] : $o['allapot'];
      // megrendelés visszaigazolása: az első "Visszaigazolva" állapotnál a vevő e-mailt kap (ezzel jön létre a szerződés)
      if ($uj === 'folyamatban' && ($o['allapot'] ?? '') === 'uj' && !empty($o['tetelek']) && empty($o['visszaigazolva'])) { $o['visszaigazolva'] = date('c'); $vissza = $o; }
      $o['allapot'] = $uj;
    }
    unset($o);
    write_json($ORDERS, $orders);
    if ($vissza) mail_customer($vissza, "Megrendelés visszaigazolása – {$vissza['id']}", 'Megrendelését visszaigazoljuk: az alábbi tételeket az Ön részére előkészítjük, a megrendelés ezzel elfogadásra került. Amikor a termék átvehető, e-mailben értesítjük.' . (($vissza['fizetes']['mod'] ?? '') === 'atutalas' ? ' Az utaláshoz szükséges díjbekérőt külön küldjük.' : ''));
    out(['ok' => true, 'visszaigazolva' => $vissza ? $vissza['visszaigazolva'] : null]);

  default:
    out(['error' => 'Ismeretlen művelet.'], 404);
}
