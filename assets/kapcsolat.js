/* ==========================================================================
   Totál Pénztárgép – „E-mail küldése” gomb és üzenetküldő ablak
   - A weboldalon sehol nincs kiírva e-mail cím (védelem a kéretlen levelek ellen):
     minden e-mail gomb ezt az ablakot nyitja meg, a levelet a szerver küldi tovább
     a titkos értesítési címre (webaruhaz/api.php?a=kapcsolat).
   - Használat: bármely elemre  data-kapcsolat  (elhagyható értékek:
       data-kapcsolat-targy="Ajánlatkérés"   – előre kiválasztott tárgy
       data-kapcsolat-termek="Sam4s NR-240"  – melyik termékről kérdez)
     vagy szkriptből: PTGKapcsolat.open({targy, termek}).
   - A feliratok magyarok; a nyelvi motor (assets/nyelv.js) a nyelv/*.json szótárak alapján fordítja.
   - Védelem: rejtett csapdamező, aláírt jegy (min. 4 mp), max. 2 hivatkozás, IP-korlát – a szerveren.
   - Félbehagyott üzenet: a böngésző megjegyzi (csak ezen a gépen), így véletlen bezárásnál nem vész el.
   ========================================================================== */
(function () {
  if (window.PTGKapcsolat) return;
  var SCRIPT = document.currentScript;
  var API = (function () {
    try { return new URL("../webaruhaz/api.php", SCRIPT && SCRIPT.src ? SCRIPT.src : location.href).href; }
    catch (e) { return "/webaruhaz/api.php"; }
  })();
  var PRIVACY = API.replace(/api\.php$/, "#adatkezeles");
  var TEL = "+36 72 215 652", TEL_H = "tel:+3672215652";
  var DRAFT = "ptg-uzenet-piszkozat";
  var TARGYAK = ["Ajánlatkérés", "Pénztárgép-vásárlás", "Szerviz, javítás", "Átállás e-pénztárgépre", "Számítástechnika, irodatechnika", "Egyéb kérdés"];
  var MAX = 3000;

  var store = {
    get: function () { try { return JSON.parse(localStorage.getItem(DRAFT) || "null"); } catch (e) { return null; } },
    set: function (v) { try { localStorage.setItem(DRAFT, JSON.stringify(v)); } catch (e) {} },
    del: function () { try { localStorage.removeItem(DRAFT); } catch (e) {} }
  };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  /* a nyelvi motor a szövegdobozt (textarea) kihagyja, ezért annak a súgószövegét itt fordítjuk */
  var T = function (hu) { return window.ZI18N && ZI18N.t ? ZI18N.t(hu) : hu; };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  var ICON = {
    mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m4 7 8 6 8-6"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    send: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 3 10 14"/><path d="M21 3 14.5 21l-4.5-7-7-4.5z"/></svg>',
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h3.5l1.8 4.5-2.3 1.4a11 11 0 0 0 5.1 5.1l1.4-2.3L19 14.5V18a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
    shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6z"/><path d="m9 12 2 2 4-4"/></svg>',
    tag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/></svg>'
  };

  var CSS = [
    ".ptgk-ov{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:max(12px,env(safe-area-inset-top)) 12px max(12px,env(safe-area-inset-bottom));background:rgba(3,12,28,.62);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);opacity:0;transition:opacity .22s ease}",
    ".ptgk-ov.on{opacity:1}",
    ".ptgk-ov[hidden]{display:none}",
    ".ptgk{--nv:#082746;--nv2:#123b61;--gd:#e9b957;--gdl:#ffd98a;--gdd:#c98e2b;--ink:#182e48;--mu:#5f6f81;--ln:#d9dee5;--pp:#fffdf6;--er:#b3261e;--ok:#1e7a46;",
    "position:relative;width:min(600px,100%);max-height:calc(100dvh - 24px);display:flex;flex-direction:column;background:var(--pp);color:var(--ink);border-radius:18px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.45),0 0 0 1px rgba(233,185,87,.35);font:17px/1.5 \"Inter\",\"Segoe UI\",system-ui,sans-serif;transform:translateY(18px) scale(.98);transition:transform .28s cubic-bezier(.2,.8,.2,1);text-align:left}",
    ".ptgk-ov.on .ptgk{transform:none}",
    ".ptgk *{box-sizing:border-box}",
    ".ptgk svg{width:1.15em;height:1.15em;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0}",
    ".ptgk-hd{position:relative;padding:20px 64px 18px 24px;background:radial-gradient(ellipse 90% 140% at 20% 0%,#0f3766 0%,var(--nv) 60%,#04112a 100%);color:#f7f8fc}",
    ".ptgk-hd::after{content:\"\";position:absolute;left:0;right:0;bottom:0;height:3px;background:linear-gradient(90deg,var(--gdd),var(--gdl) 30%,var(--gd) 70%,var(--gdd))}",
    ".ptgk-ey{display:flex;align-items:center;gap:8px;margin:0 0 4px;font:600 .78rem/1.2 \"Inter\",system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--gdl)}",
    ".ptgk-hd h2{margin:0;font:italic 800 clamp(1.45rem,4.6vw,1.8rem)/1.15 \"Montserrat\",\"Arial Black\",Arial,sans-serif;color:#fff}",
    ".ptgk-hd p{margin:6px 0 0;color:#d6dfea;font-size:.95rem}",
    ".ptgk-x{position:absolute;top:14px;right:14px;width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,217,138,.45);background:rgba(255,255,255,.06);color:#fff;display:grid;place-items:center;cursor:pointer;font-size:20px}",
    ".ptgk-x:hover{background:rgba(255,217,138,.16)}",
    ".ptgk-bd{overflow:auto;-webkit-overflow-scrolling:touch;padding:20px 24px 22px;overscroll-behavior:contain}",
    ".ptgk form{display:grid;gap:14px;margin:0}",
    ".ptgk-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}",
    "@media (max-width:560px){.ptgk-row{grid-template-columns:1fr}.ptgk{font-size:18px}.ptgk-hd{padding:18px 60px 16px 18px}.ptgk-bd{padding:16px 18px 20px}}",
    ".ptgk label{display:grid;gap:5px;font-weight:600;font-size:.92rem;color:var(--ink)}",
    ".ptgk label small{font-weight:500;color:var(--mu)}",
    ".ptgk input,.ptgk select,.ptgk textarea{width:100%;font:inherit;font-size:max(16px,1rem);color:var(--ink);background:#fff;border:1.5px solid var(--ln);border-radius:11px;padding:12px 14px;min-height:50px;transition:border-color .15s,box-shadow .15s;appearance:none;-webkit-appearance:none}",
    ".ptgk select{background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23082746' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\");background-repeat:no-repeat;background-position:right 12px center;background-size:20px;padding-right:42px}",
    ".ptgk textarea{min-height:150px;resize:vertical;line-height:1.5}",
    ".ptgk ::placeholder{color:#8b97a6;font-weight:400;opacity:1}",
    ".ptgk input:focus,.ptgk select:focus,.ptgk textarea:focus{outline:none;border-color:var(--gdd);box-shadow:0 0 0 4px rgba(233,185,87,.28)}",
    ".ptgk .bad{border-color:var(--er)!important;box-shadow:0 0 0 4px rgba(179,38,30,.14)!important}",
    ".ptgk-cnt{justify-self:end;margin-top:-8px;font-size:.8rem;color:var(--mu);font-variant-numeric:tabular-nums}",
    ".ptgk-cnt.warn{color:var(--er)}",
    ".ptgk-hp{position:absolute!important;left:-9999px!important;width:1px!important;height:1px!important;overflow:hidden!important}",
    ".ptgk-chip{display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:10px;background:#f4ecd8;border:1px dashed #d8c49a;font-size:.92rem;color:var(--ink)}",
    ".ptgk-chip b{font-weight:700}",
    ".ptgk-note{display:flex;gap:10px;align-items:flex-start;margin:0;font-size:.84rem;color:var(--mu);line-height:1.45}",
    ".ptgk-note svg{color:var(--gdd);margin-top:2px}",
    ".ptgk-note a{color:var(--nv2);text-decoration:underline;text-underline-offset:2px}",
    ".ptgk-msg{margin:0;padding:12px 14px;border-radius:11px;font-size:.95rem;line-height:1.45}",
    ".ptgk-msg:empty{display:none}",
    ".ptgk-msg.err{background:#fbeceb;color:var(--er);border:1px solid #efc4c0}",
    ".ptgk-msg.info{background:#eef3fa;color:var(--nv2);border:1px solid #cfdcec}",
    ".ptgk-msg a{color:inherit;font-weight:700}",
    ".ptgk-act{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin-top:2px}",
    ".ptgk-send{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:54px;padding:0 26px;border:0;border-radius:12px;cursor:pointer;font:italic 800 1.06rem/1 \"Montserrat\",\"Arial Black\",Arial,sans-serif;color:#1d1400;background:linear-gradient(180deg,var(--gdl),var(--gd) 55%,var(--gdd));box-shadow:0 2px 0 #a8741f,0 8px 22px rgba(201,142,43,.35);transition:transform .12s,filter .12s}",
    ".ptgk-send:hover{filter:brightness(1.05)}",
    ".ptgk-send:active{transform:translateY(1px)}",
    ".ptgk-send[disabled]{opacity:.7;cursor:progress}",
    ".ptgk-send .sp{width:18px;height:18px;border-radius:50%;border:2.5px solid rgba(29,20,0,.25);border-top-color:#1d1400;animation:ptgkSp .8s linear infinite}",
    "@keyframes ptgkSp{to{transform:rotate(360deg)}}",
    ".ptgk-alt{display:inline-flex;align-items:center;gap:8px;font-size:.92rem;color:var(--mu)}",
    ".ptgk-alt a{color:var(--nv2);font-weight:700;text-decoration:none;white-space:nowrap}",
    ".ptgk-alt a:hover{text-decoration:underline}",
    /* sikeres küldés: kinyomtatott blokk */
    ".ptgk-ok{display:grid;justify-items:center;gap:16px;padding:6px 0 4px;text-align:center}",
    ".ptgk-slot{width:min(330px,92%);height:10px;border-radius:6px;background:linear-gradient(180deg,#0b1f38,#21405f);box-shadow:inset 0 2px 3px rgba(0,0,0,.5)}",
    ".ptgk-rc{width:min(300px,84%);margin-top:-14px;padding:20px 18px 16px;background:#fff;color:#222;font:15px/1.45 \"Courier Prime\",\"Courier New\",monospace;text-align:center;box-shadow:0 10px 26px rgba(0,0,0,.14);clip-path:polygon(0 0,100% 0,100% calc(100% - 8px),95% 100%,90% calc(100% - 8px),85% 100%,80% calc(100% - 8px),75% 100%,70% calc(100% - 8px),65% 100%,60% calc(100% - 8px),55% 100%,50% calc(100% - 8px),45% 100%,40% calc(100% - 8px),35% 100%,30% calc(100% - 8px),25% 100%,20% calc(100% - 8px),15% 100%,10% calc(100% - 8px),5% 100%,0 calc(100% - 8px));transform-origin:top;animation:ptgkPrint 1.1s steps(14) both}",
    "@keyframes ptgkPrint{from{clip-path:inset(0 0 100% 0)}to{clip-path:inset(0 0 0 0)}}",
    ".ptgk-rc big{display:block;font:800 1.5rem/1 \"Montserrat\",\"Arial Black\",Arial,sans-serif;letter-spacing:.06em;margin-bottom:4px}",
    ".ptgk-rc hr{border:0;border-top:1.5px dashed #999;margin:10px 0}",
    ".ptgk-rc .r{display:flex;justify-content:space-between;gap:10px;text-align:left}",
    ".ptgk-rc .bc{height:34px;margin:10px auto 2px;width:80%;background:repeating-linear-gradient(90deg,#222 0 2px,transparent 2px 4px,#222 4px 5px,transparent 5px 8px,#222 8px 11px,transparent 11px 12px)}",
    ".ptgk-ok h3{margin:4px 0 0;font:italic 800 1.4rem/1.2 \"Montserrat\",\"Arial Black\",Arial,sans-serif;color:var(--nv)}",
    ".ptgk-ok p{margin:0;max-width:440px;color:var(--ink)}",
    ".ptgk-ok .ptgk-send{min-height:50px}",
    ".ptgk-ok .ptgk-sm{font-size:.9rem;color:var(--mu)}",
    "@media (prefers-reduced-motion:reduce){.ptgk-ov,.ptgk{transition:none}.ptgk-rc{animation:none}}",
    /* a gombok közös kinézete ott, ahol az oldal saját stílusa nem ad semmit */
    "button[data-kapcsolat].ptgk-link{background:none;border:0;padding:0;font:inherit;color:inherit;cursor:pointer;text-decoration:underline;text-underline-offset:2px}"
  ].join("\n");

  var ov, box, form, lastFocus, ticket = null, ticketAt = 0, offline = false, ctx = {};

  function injectCss() {
    if (document.getElementById("ptgkCss")) return;
    var s = document.createElement("style"); s.id = "ptgkCss"; s.textContent = CSS; document.head.appendChild(s);
  }

  function getTicket() {
    ticket = null; offline = false; ticketAt = Date.now();
    return fetch(API + "?a=kapcsolat-jegy", { credentials: "same-origin", cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (j) { if (j && j.jegy) ticket = j.jegy; else offline = true; })
      .catch(function () { offline = true; });
  }

  function formHTML(d) {
    var opts = TARGYAK.map(function (t) { return '<option' + (t === d.targy ? " selected" : "") + ">" + esc(t) + "</option>"; }).join("");
    return '<form novalidate>' +
      (ctx.termek ? '<div class="ptgk-chip">' + ICON.tag + '<span>Termék: <b data-noi18n>' + esc(ctx.termek) + '</b></span></div>' : "") +
      '<div class="ptgk-row">' +
        '<label><span>Az Ön neve</span><input name="nev" autocomplete="name" maxlength="120" required value="' + esc(d.nev) + '"></label>' +
        '<label><span>E-mail-címe <small>(erre válaszolunk)</small></span><input name="email" type="email" inputmode="email" autocomplete="email" maxlength="120" required value="' + esc(d.email) + '"></label>' +
      '</div>' +
      '<div class="ptgk-row">' +
        '<label><span>Telefonszáma <small>(nem kötelező)</small></span><input name="telefon" type="tel" inputmode="tel" autocomplete="tel" maxlength="25" value="' + esc(d.telefon) + '"></label>' +
        '<label><span>Miben segíthetünk?</span><select name="targy">' + opts + '</select></label>' +
      '</div>' +
      '<label><span>Üzenet</span><textarea name="uzenet" maxlength="' + MAX + '" required placeholder="' + esc(T("Írja le röviden, mire van szüksége – például milyen üzletbe keres pénztárgépet, vagy mi a hiba a gépével.")) + '">' + esc(d.uzenet) + '</textarea></label>' +
      '<span class="ptgk-cnt" aria-hidden="true" data-noi18n></span>' +
      '<label class="ptgk-hp" aria-hidden="true">Weboldal<input name="web" tabindex="-1" autocomplete="off"></label>' +
      '<p class="ptgk-note">' + ICON.shield + '<span>Adatait kizárólag az üzenetére adott válaszhoz használjuk. <a href="' + esc(PRIVACY) + '" target="_blank" rel="noopener">Adatkezelési tájékoztató</a></span></p>' +
      '<p class="ptgk-msg" role="alert" aria-live="assertive"></p>' +
      '<div class="ptgk-act"><button class="ptgk-send" type="submit">' + ICON.send + '<span>Üzenet küldése</span></button>' +
        '<span class="ptgk-alt">Sürgős? <a href="' + TEL_H + '">' + ICON.phone + ' <span data-noi18n>' + TEL + '</span></a></span></div>' +
    '</form>';
  }

  function build() {
    injectCss();
    ov = document.createElement("div"); ov.className = "ptgk-ov"; ov.hidden = true;
    ov.innerHTML = '<div class="ptgk" role="dialog" aria-modal="true" aria-labelledby="ptgkT">' +
      '<div class="ptgk-hd"><p class="ptgk-ey">' + ICON.mail + '<span>E-mail küldése</span></p><h2 id="ptgkT">Írjon nekünk!</h2><p>Munkanapokon általában még aznap válaszolunk.</p>' +
      '<button class="ptgk-x" type="button" aria-label="Bezárás" title="Bezárás">' + ICON.x + '</button></div>' +
      '<div class="ptgk-bd"></div></div>';
    document.body.appendChild(ov);
    box = ov.querySelector(".ptgk-bd");
    ov.addEventListener("mousedown", function (e) { if (e.target === ov) close(); });
    ov.querySelector(".ptgk-x").addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (!ov || ov.hidden) return;
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key !== "Tab") return;
      var f = Array.prototype.filter.call(ov.querySelectorAll("a[href],button,input:not([tabindex='-1']),select,textarea"), function (el) { return !el.disabled && el.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  function saveDraft() {
    if (!form) return;
    var d = {}; ["nev", "email", "telefon", "targy", "uzenet"].forEach(function (k) { d[k] = form.elements[k].value; });
    if (d.uzenet.trim() || d.nev.trim() || d.email.trim()) store.set(d); else store.del();
  }

  function counter() {
    var t = form.elements.uzenet, c = form.querySelector(".ptgk-cnt"), n = t.value.length;
    c.textContent = n + " / " + MAX; c.classList.toggle("warn", n > MAX - 150);
  }

  function showMsg(html, kind) { var m = form.querySelector(".ptgk-msg"); m.className = "ptgk-msg " + (kind || "err"); m.innerHTML = html; }

  function markBad(name) {
    Array.prototype.forEach.call(form.querySelectorAll(".bad"), function (x) { x.classList.remove("bad"); x.removeAttribute("aria-invalid"); });
    if (!name || !form.elements[name]) return;
    var el = form.elements[name]; el.classList.add("bad"); el.setAttribute("aria-invalid", "true"); el.focus();
  }

  function check() {
    var e = form.elements, n = e.nev.value.trim(), m = e.email.value.trim(), u = e.uzenet.value.trim(), t = e.telefon.value.trim();
    if (n.length < 2) return ["nev", "Kérjük, adja meg a nevét."];
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(m)) return ["email", "Kérjük, adjon meg érvényes e-mail címet – erre válaszolunk."];
    if (t && !/^[\d\s+()\/-]{6,25}$/.test(t)) return ["telefon", "A telefonszám formátuma nem megfelelő."];
    if (u.length < 10) return ["uzenet", "Kérjük, írja le röviden, miben segíthetünk."];
    if ((u.match(/https?:\/\/|www\./gi) || []).length > 2) return ["uzenet", "Az üzenetben legfeljebb 2 internetes hivatkozás lehet."];
    return null;
  }

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function submit(ev) {
    ev.preventDefault();
    var bad = check();
    if (bad) { markBad(bad[0]); showMsg(esc(bad[1])); return; }
    markBad(null); showMsg("", "err");
    var btn = form.querySelector(".ptgk-send"), lbl = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = '<i class="sp" aria-hidden="true"></i><span>Küldés…</span>';
    var e = form.elements;
    var payload = {
      nev: e.nev.value.trim(), email: e.email.value.trim(), telefon: e.telefon.value.trim(), targy: e.targy.value,
      uzenet: e.uzenet.value.trim(), web: e.web.value, termek: ctx.termek || "", jegy: ticket,
      oldal: (location.pathname + location.hash).slice(0, 200), nyelv: (window.ZI18N && ZI18N.lang) || document.documentElement.lang || "hu"
    };
    var done = function () { btn.disabled = false; btn.innerHTML = lbl; };
    /* a szerver legalább 4 mp-et vár a megnyitás után – egy gyors kitöltőnek nem dobunk hibát, csak kivárjuk */
    var left = 4300 - (Date.now() - ticketAt);
    (left > 0 ? wait(left) : Promise.resolve()).then(function () {
      if (offline || !ticket) return getTicket().then(function () {
        if (offline) throw { offline: true };
        payload.jegy = ticket; return wait(4300);
      });
    }).then(function () {
      return fetch(API + "?a=kapcsolat", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        .then(function (r) { return r.json().catch(function () { throw { offline: true }; }).then(function (j) { return { ok: r.ok, j: j }; }); });
    }).then(function (res) {
      if (res.ok && res.j && res.j.ok) { store.del(); success(res.j.id, payload); return; }
      var j = res.j || {};
      if (j.ujjegy) { ticket = j.ujjegy; ticketAt = Date.now(); }
      done(); markBad(j.mezo || null); showMsg(esc(j.error || "Az üzenetet most nem sikerült elküldeni. Kérjük, próbálja újra."));
    }).catch(function (err) {
      done();
      if (err && err.offline) showMsg('Az üzenetküldés ebben az előnézetben nem működik – az élő weboldalon (penztar-gep.hu) igen. Addig is hívjon minket: <a href="' + TEL_H + '"><span data-noi18n>' + TEL + '</span></a>', "info");
      else showMsg('Nem sikerült kapcsolódni a szerverhez. Ellenőrizze az internetkapcsolatot, és próbálja újra – vagy hívjon minket: <a href="' + TEL_H + '"><span data-noi18n>' + TEL + '</span></a>');
    });
  }

  function success(id, p) {
    var now = new Date(), pad = function (n) { return (n < 10 ? "0" : "") + n; };
    var ts = now.getFullYear() + "." + pad(now.getMonth() + 1) + "." + pad(now.getDate()) + ". " + pad(now.getHours()) + ":" + pad(now.getMinutes());
    box.innerHTML = '<div class="ptgk-ok" tabindex="-1">' +
      '<div class="ptgk-slot" aria-hidden="true"></div>' +
      '<div class="ptgk-rc" aria-hidden="true"><big data-noi18n>TOTÁL</big><span>PÉNZTÁRGÉP</span><hr>' +
        '<div class="r"><span>ÜZENET</span><span data-noi18n>' + (id ? "#" + esc(id) : "OK") + '</span></div>' +
        '<div class="r"><span>DÁTUM</span><span data-noi18n>' + esc(ts) + '</span></div>' +
        '<div class="r"><span>TÁRGY</span><span>' + esc(p.targy) + '</span></div><hr>' +
        '<span>KÖSZÖNJÜK!</span><i class="bc" style="display:block"></i></div>' +
      '<h3>Üzenetét megkaptuk!</h3>' +
      '<p>Hamarosan válaszolunk erre a címre:<br><b data-noi18n>' + esc(p.email) + '</b></p>' +
      '<p class="ptgk-sm">Ha nem találja a válaszunkat, nézze meg a Levélszemét (Spam) mappát is.</p>' +
      '<button type="button" class="ptgk-send ptgk-close">Rendben</button></div>';
    box.querySelector(".ptgk-close").addEventListener("click", close);
    var ok = box.querySelector(".ptgk-ok"); ok.focus({ preventScroll: true });
    form = null;
  }

  var zarIdo = 0;   /* a bezárás késleltetett elrejtése – újranyitáskor törölni kell, különben a friss ablak eltűnne */
  function open(o) {
    o = o || {};
    if (!ov) build();
    clearTimeout(zarIdo); zarIdo = 0;
    ctx = { targy: o.targy || "", termek: (o.termek || "").slice(0, 160) };
    var d = store.get() || {};
    var data = { nev: d.nev || "", email: d.email || "", telefon: d.telefon || "", targy: ctx.targy && TARGYAK.indexOf(ctx.targy) >= 0 ? ctx.targy : (d.targy || (ctx.termek ? "Ajánlatkérés" : TARGYAK[0])), uzenet: d.uzenet || "" };
    box.innerHTML = formHTML(data);
    form = box.querySelector("form");
    form.addEventListener("submit", submit);
    form.addEventListener("input", function (e) { if (e.target.classList.contains("bad")) markBad(null); if (e.target.name === "uzenet") counter(); saveDraft(); });
    form.addEventListener("change", saveDraft);
    counter();
    if (d.uzenet) showMsg("Félbehagyott üzenetét visszatöltöttük.", "info");
    lastFocus = document.activeElement;
    ov.hidden = false;
    document.documentElement.style.overflow = "hidden";
    requestAnimationFrame(function () { ov.classList.add("on"); });
    var first = !data.nev ? form.elements.nev : !data.email ? form.elements.email : form.elements.uzenet;
    setTimeout(function () { try { first.focus({ preventScroll: true }); } catch (e) {} }, reduce ? 0 : 180);
    getTicket();
    if (window.ZI18N && ZI18N.rescan) setTimeout(function () { ZI18N.rescan(); }, 0);
  }

  function close() {
    if (!ov || ov.hidden || zarIdo) return;
    saveDraft();
    ov.classList.remove("on");
    document.documentElement.style.overflow = "";
    zarIdo = setTimeout(function () { zarIdo = 0; ov.hidden = true; }, reduce ? 0 : 220);
    if (lastFocus && lastFocus.focus) try { lastFocus.focus({ preventScroll: true }); } catch (e) {}
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("[data-kapcsolat]");
    if (!t) return;
    e.preventDefault(); e.stopPropagation();   /* elkapó fázis: a webáruház saját #-útválasztója ne lépjen tovább */
    open({ targy: t.getAttribute("data-kapcsolat-targy") || "", termek: t.getAttribute("data-kapcsolat-termek") || "" });
  }, true);
  /* közvetlen link: …#uzenet megnyitja az ablakot (pl. egy levélben vagy névjegykártyán) */
  function fromHash() { if (/^#(uzenet|email|e-mail)$/i.test(location.hash)) { open({}); try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {} } }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fromHash); else fromHash();
  window.addEventListener("hashchange", fromHash);

  window.PTGKapcsolat = { open: open, close: close };
})();
