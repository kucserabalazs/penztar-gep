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
$CLIENTS  = DATA . '/clients.php';        // ügyféllista – titkosítva (AES-256-GCM)
$CLOG     = DATA . '/clients.log.php';    // ki mit csinált az ügyféllistával

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
function send_mail(string $to, string $subj, string $text): bool {
  if (!filter_var($to, FILTER_VALIDATE_EMAIL)) return false;
  if ($dev = getenv('PTG_MAIL_LOG')) { file_put_contents($dev, json_encode(['to' => $to, 'subj' => $subj, 'text' => $text], JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND); return true; }  // csak fejlesztői teszthez
  if (!function_exists('mail')) return false;
  $h = "From: =?UTF-8?B?" . base64_encode('Totál webáruház') . "?= <" . MAIL_FROM . ">\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit";
  return @mail($to, '=?UTF-8?B?' . base64_encode($subj) . '?=', $text, $h, '-f' . MAIL_FROM);
}
function send_code(array $u, string $cel): void {
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
    out(read_json($PRODUCTS, []));

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
    $u = user($p['uid']); send_code($u, 'belepes'); out(['ok' => true]);

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
    fail_user($u['id'], 'Hibás vagy lejárt kód. Nézze meg a legfrissebb e-mailt, vagy kérjen újat.');

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
      if (isset($p['keszletDb']) && $p['keszletDb'] !== null) {
        if ($p['keszletDb'] < $db) { flock($lock, LOCK_UN); out(['error' => ($p['nev'] ?? 'A termék') . ': csak ' . (int)$p['keszletDb'] . ' db van raktáron.'], 409); }
        $p['keszletDb'] -= $db;
        if ($p['keszletDb'] <= 0) { $p['keszletDb'] = 0; $p['keszlet'] = 'elfogyott'; }
      }
      $tetelek[] = ['id' => $id, 'db' => $db, 'nev' => trim(($p['marka'] ?? '') . ' ' . ($p['nev'] ?? '')), 'ar' => $p['akciosAr'] ?? $p['ar'] ?? null];
      unset($p);
    }
    if ($tetelek) write_json($PRODUCTS, $cat);
    flock($lock, LOCK_UN);
    $orders = read_json($ORDERS, []);
    $rec = [
      'id' => date('ymd') . '-' . strtoupper(bin2hex(random_bytes(2))),
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
    array_unshift($orders, $rec);
    write_json($ORDERS, $orders);
    // értesítő e-mail a boltnak (ha a tárhely engedi a mail() függvényt)
    $set = read_json($PRODUCTS, [])['settings'] ?? [];
    if (!empty($set['email']) && function_exists('mail')) {
      $txt = "Új " . $rec['tipus'] . " a weboldalról ({$rec['id']})\n\nNév: {$rec['nev']}\nCég: {$rec['ceg']}\nTelefon: {$rec['telefon']}\nE-mail: {$rec['email']}\nIdőpont: {$rec['idopont']}\n\n";
      foreach ($rec['tetelek'] as $t) $txt .= '- ' . ($t['db'] ?? 1) . ' × ' . ($t['nev'] ?? '') . "\n";
      $txt .= "\n" . $rec['uzenet'];
      if ($adatlap) $txt .= "\n\nPénztárgép élesítése: " . ($adatlap['Élesítés módja'] ?? '') . (count($adatlap) > 1 ? "\nA kitöltött adatlap (személyes adatokkal) az admin felületen, a megrendelésnél látható." : '');
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
