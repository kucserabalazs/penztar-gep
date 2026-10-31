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
$ORDERS   = DATA . '/orders.php';        // védett: közvetlenül nem tölthető le
$HASH     = DATA . '/admin.hash.php';
$TOTP     = DATA . '/admin.totp.php';   // kétlépcsős belépés (telefonos kód)
$LOG      = DATA . '/admin.log.php';    // utolsó belépések

function out($d, int $code = 200): void { http_response_code($code); echo json_encode($d, JSON_UNESCAPED_UNICODE); exit; }
function body(): array { $j = json_decode(file_get_contents('php://input') ?: '[]', true); return is_array($j) ? $j : []; }
function authed(): bool { return !empty($_SESSION['admin']); }
function need_auth(): void { if (!authed()) out(['error' => 'Be kell jelentkezni.'], 401); }
const GUARD = "<?php http_response_code(404); exit; ?>\n";
// a .php végű adatfájlok elején egy záró sor van, így böngészőből megnyitva üresek
function strip_guard(string $t): string { return substr($t, 0, 5) === '<?php' ? (string)substr($t, strpos($t, "\n") + 1) : $t; }
function read_json(string $f, $def) { if (!is_file($f)) return $def; $j = json_decode(strip_guard((string)file_get_contents($f)), true); return $j ?? $def; }
function read_hash(string $f): string { return is_file($f) ? trim(strip_guard((string)file_get_contents($f))) : ''; }
function write_hash(string $f, string $pw): void { file_put_contents($f, GUARD . password_hash($pw, PASSWORD_DEFAULT), LOCK_EX); }
function write_json(string $f, $d): void {
  $tmp = $f . '.tmp';
  file_put_contents($tmp, (substr($f, -4) === '.php' ? GUARD : '') . json_encode($d, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
  rename($tmp, $f);
}
function check_csrf(): void {
  $t = $_SERVER['HTTP_X_CSRF'] ?? '';
  if (!$t || !hash_equals($_SESSION['csrf'] ?? '', $t)) out(['error' => 'Lejárt munkamenet, jelentkezz be újra.'], 403);
}

// ---- telefonos hitelesítő kód (TOTP, RFC 6238): iPhone Jelszavak app, Google/Microsoft Authenticator ----
function b32_encode(string $bin): string { $al='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; $bits=''; foreach (str_split($bin) as $c) $bits.=str_pad(decbin(ord($c)),8,'0',STR_PAD_LEFT); $out=''; foreach (str_split($bits,5) as $ch) $out.=$al[bindec(str_pad($ch,5,'0'))]; return $out; }
function b32_decode(string $s): string { $al='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; $s=strtoupper(preg_replace('/[^A-Za-z2-7]/','',$s)); $bits=''; foreach (str_split($s) as $c) $bits.=str_pad(decbin(strpos($al,$c)),5,'0',STR_PAD_LEFT); $out=''; foreach (str_split($bits,8) as $b) if (strlen($b)===8) $out.=chr(bindec($b)); return $out; }
function totp_at(string $secret, int $step): string { $h=hash_hmac('sha1', pack('J',$step), b32_decode($secret), true); $o=ord($h[19])&15; $n=((ord($h[$o])&127)<<24)|(ord($h[$o+1])<<16)|(ord($h[$o+2])<<8)|ord($h[$o+3]); return str_pad((string)($n%1000000),6,'0',STR_PAD_LEFT); }
// visszaadja az elfogadott időlépést (±30 mp tűrés), vagy null-t
function totp_check(string $secret, string $code, int $last = 0): ?int { $code=preg_replace('/\D/','',$code); if (strlen($code)!==6) return null; $t=intdiv(time(),30); foreach ([0,-1,1] as $d) { $st=$t+$d; if ($st>$last && hash_equals(totp_at($secret,$st),$code)) return $st; } return null; }
function log_login(string $how): void { global $LOG; $l=read_json($LOG,[]); array_unshift($l,['ido'=>date('c'),'ip'=>$_SERVER['REMOTE_ADDR']??'','mod'=>$how,'eszkoz'=>mb_substr((string)($_SERVER['HTTP_USER_AGENT']??''),0,160)]); write_json($LOG,array_slice($l,0,30)); }
function grant_admin(string $how): void { session_regenerate_id(true); $_SESSION['admin']=true; $_SESSION['tries']=0; unset($_SESSION['pw_ok']); $_SESSION['csrf']=bin2hex(random_bytes(16)); log_login($how); out(['ok'=>true,'csrf'=>$_SESSION['csrf']]); }
function slow_down(): void { if (($_SESSION['tries'] ?? 0) > 8 && time() - ($_SESSION['last'] ?? 0) < 300) out(['error' => 'Túl sok próbálkozás. Próbálja újra 5 perc múlva.'], 429); }
function fail(string $msg): void { $_SESSION['tries']=($_SESSION['tries']??0)+1; $_SESSION['last']=time(); usleep(400000); out(['error'=>$msg],401); }

// régi (védelem nélküli) fájlok áthelyezése az új, védett nevekre
foreach (['/orders.json' => $ORDERS, '/admin.hash' => $HASH] as $old => $new) if (is_file(DATA . $old) && !is_file($new)) { file_put_contents($new, GUARD . file_get_contents(DATA . $old), LOCK_EX); @unlink(DATA . $old); }

$a = $_GET['a'] ?? '';
$m = $_SERVER['REQUEST_METHOD'];

switch ($a) {
  case 'data':      // nyilvános: termékek, kategóriák, szolgáltatások
    out(read_json($PRODUCTS, []));

  case 'status':
    $tf = read_json($TOTP, []);
    out(['admin' => authed(), 'needsSetup' => !is_file($HASH), 'csrf' => authed() ? $_SESSION['csrf'] : null, 'totp' => !empty($tf['enabled'])]);

  case 'login':
    if ($m !== 'POST') out(['error' => 'POST kell.'], 405);
    $b = body(); $pw = (string)($b['jelszo'] ?? '');
    slow_down();
    if (!is_file($HASH)) {           // első belépés: a megadott jelszó lesz az admin jelszó
      if (mb_strlen($pw) < 8) out(['error' => 'Az új jelszó legalább 8 karakter legyen.'], 400);
      write_hash($HASH, $pw);
    } elseif (!password_verify($pw, read_hash($HASH))) {
      fail('Hibás jelszó.');
    }
    $tf = read_json($TOTP, []);
    if (!empty($tf['enabled'])) { $_SESSION['pw_ok'] = time(); out(['need2fa' => true]); }
    grant_admin('jelszó');

  case 'login2':   // második lépés: a telefon hitelesítő alkalmazásának 6 jegyű kódja, vagy egy tartalékkód
    if ($m !== 'POST') out(['error' => 'POST kell.'], 405);
    slow_down();
    if (empty($_SESSION['pw_ok']) || time() - $_SESSION['pw_ok'] > 300) out(['error' => 'Lejárt a belépés, adja meg újra a jelszót.', 'restart' => true], 401);
    $b = body(); $code = trim((string)($b['kod'] ?? ''));
    $lock = fopen(DATA . '/.lock', 'c'); flock($lock, LOCK_EX);
    $tf = read_json($TOTP, []);
    $st = totp_check((string)($tf['secret'] ?? ''), $code, (int)($tf['last'] ?? 0));
    if ($st !== null) { $tf['last'] = $st; write_json($TOTP, $tf); flock($lock, LOCK_UN); grant_admin('jelszó + telefonos kód'); }
    $norm = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $code));
    foreach (($tf['recovery'] ?? []) as $k => $h) {
      if (strlen($norm) === 10 && password_verify($norm, $h)) { unset($tf['recovery'][$k]); $tf['recovery'] = array_values($tf['recovery']); write_json($TOTP, $tf); flock($lock, LOCK_UN); grant_admin('jelszó + tartalékkód'); }
    }
    flock($lock, LOCK_UN);
    fail('Hibás vagy lejárt kód. Írja be a telefonján most látható 6 jegyű kódot.');

  case 'totp-setup':   // új titkos kulcs a telefonhoz (még nincs bekapcsolva)
    need_auth(); check_csrf();
    $sec = b32_encode(random_bytes(20)); $_SESSION['totp_pending'] = $sec;
    $label = rawurlencode('Totál webáruház:admin');
    out(['secret' => $sec, 'uri' => "otpauth://totp/$label?secret=$sec&issuer=" . rawurlencode('Totál webáruház') . '&algorithm=SHA1&digits=6&period=30']);

  case 'totp-enable':  // bekapcsolás: a telefonon megjelenő kóddal igazolja, hogy jól állította be
    need_auth(); check_csrf();
    $sec = (string)($_SESSION['totp_pending'] ?? ''); $b = body();
    if ($sec === '') out(['error' => 'Előbb kérjen új beállítási kódot.'], 400);
    $st = totp_check($sec, (string)($b['kod'] ?? ''));
    if ($st === null) out(['error' => 'A kód nem egyezik. Ellenőrizze, hogy a telefon órája pontos, és a legfrissebb kódot írta be.'], 400);
    $codes = []; $hashes = [];
    for ($i = 0; $i < 8; $i++) { $c = strtoupper(substr(b32_encode(random_bytes(8)), 0, 10)); $codes[] = substr($c,0,5) . '-' . substr($c,5); $hashes[] = password_hash($c, PASSWORD_DEFAULT); }
    write_json($TOTP, ['enabled' => true, 'secret' => $sec, 'last' => $st, 'recovery' => $hashes, 'since' => date('c')]);
    unset($_SESSION['totp_pending']);
    out(['ok' => true, 'recovery' => $codes]);

  case 'totp-disable': // kikapcsolás: jelszó + aktuális kód kell hozzá
    need_auth(); check_csrf();
    $b = body(); $tf = read_json($TOTP, []);
    if (!password_verify((string)($b['jelszo'] ?? ''), read_hash($HASH))) out(['error' => 'A jelszó nem stimmel.'], 400);
    if (!empty($tf['enabled']) && totp_check((string)$tf['secret'], (string)($b['kod'] ?? '')) === null) out(['error' => 'A telefonos kód nem stimmel.'], 400);
    @unlink($TOTP); out(['ok' => true]);

  case 'security':     // biztonsági állapot az adminban
    need_auth(); $tf = read_json($TOTP, []);
    out(['totp' => !empty($tf['enabled']), 'since' => $tf['since'] ?? null, 'recoveryLeft' => count($tf['recovery'] ?? []), 'log' => read_json($LOG, [])]);

  case 'logout':
    $_SESSION = []; session_destroy(); out(['ok' => true]);

  case 'password':  // jelszócsere
    need_auth(); check_csrf();
    $b = body();
    if (!password_verify((string)($b['regi'] ?? ''), read_hash($HASH))) out(['error' => 'A jelenlegi jelszó nem stimmel.'], 400);
    if (mb_strlen((string)($b['uj'] ?? '')) < 8) out(['error' => 'Az új jelszó legalább 8 karakter legyen.'], 400);
    write_hash($HASH, (string)$b['uj']);
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
