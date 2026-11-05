/* A weboldal készítője – lábléc-sor és megkereső ablak (csak magyarul).
 * A készítő e-mail-címe sehol nem jelenik meg: az üzenetet a szerver (webaruhaz/api.php?a=keszito) továbbítja.
 * Minden oldalon betöltődik (főoldal, webáruház, sablonoldalak, termékoldalak, 404). */
(function () {
  "use strict";
  if (window.PTG_KESZITO) return;
  var me = document.currentScript;
  var ROOT = me && me.src ? me.src.replace(/assets\/keszito\.js.*$/, "") : "/";
  var API = ROOT + "webaruhaz/api.php";
  var EV = new Date().getFullYear();

  var CSS =
    ".ksz-sor{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:6px 14px;padding:14px 16px 18px;margin:0;font:500 14px/1.5 Inter,'Segoe UI',system-ui,sans-serif;text-align:center;color:inherit;opacity:.92;border-top:1px solid color-mix(in srgb,currentColor 16%,transparent)}" +
    ".ksz-sor .ksz-pont{opacity:.45}" +
    ".ksz-sor button{all:unset;cursor:pointer;font-weight:700;color:inherit;text-decoration:underline;text-decoration-color:color-mix(in srgb,currentColor 45%,transparent);text-underline-offset:3px;border-radius:6px;padding:2px 4px}" +
    ".ksz-sor button:hover{text-decoration-color:currentColor}" +
    ".ksz-sor button:focus-visible{outline:3px solid #d6a64e;outline-offset:2px}" +
    ".ksz-ov{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(6,22,40,.62);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);opacity:0;transition:opacity .2s}" +
    ".ksz-ov.be{opacity:1}" +
    ".ksz-ov[hidden]{display:none}" +
    ".ksz-ab{position:relative;width:min(620px,100%);max-height:calc(100dvh - 32px);overflow:auto;background:#fffdf8;color:#172e47;border-radius:20px;box-shadow:0 30px 80px rgba(0,0,0,.4),inset 0 0 0 1px #e8dcc2;font:400 17px/1.55 Inter,'Segoe UI',system-ui,sans-serif;transform:translateY(10px);transition:transform .2s}" +
    ".ksz-ov.be .ksz-ab{transform:none}" +
    ".ksz-fej{padding:24px 72px 18px 26px;background:linear-gradient(135deg,#0a2c50,#123d6b);color:#fff;border-radius:20px 20px 0 0;border-bottom:3px solid #d6a64e}" +
    ".ksz-fej small{display:block;font:700 12px/1 Inter,system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#f4d58d;margin-bottom:8px}" +
    ".ksz-fej h2{margin:0;font:800 clamp(22px,4.6vw,27px)/1.2 Montserrat,Inter,system-ui,sans-serif;color:#fff}" +
    ".ksz-x{all:unset;position:absolute;top:14px;right:14px;width:44px;height:44px;display:grid;place-items:center;border-radius:50%;color:#fff;background:rgba(255,255,255,.1);cursor:pointer;font-size:26px;line-height:1}" +
    ".ksz-x:hover{background:rgba(255,255,255,.2)}.ksz-x:focus-visible{outline:3px solid #f4d58d;outline-offset:2px}" +
    ".ksz-tor{padding:20px 26px 26px}" +
    ".ksz-tor p{margin:0 0 12px}" +
    ".ksz-tor .ksz-kiemel{padding:12px 14px;border-radius:12px;background:#f6efe0;border-left:4px solid #d6a64e;margin:4px 0 18px}" +
    ".ksz-f{display:grid;gap:14px}" +
    ".ksz-f .ksz-2{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px}" +
    "@media (max-width:560px){.ksz-f .ksz-2{grid-template-columns:minmax(0,1fr)}}" +
    ".ksz-f label{display:flex;flex-wrap:wrap;align-items:baseline;column-gap:5px;row-gap:6px;font-weight:700;font-size:15px;color:#172e47}" +
    ".ksz-f label span.o{font-weight:500;color:#5b6878}" +
    ".ksz-f label span.k{color:#a3301f}" +
    ".ksz-f input,.ksz-f textarea{box-sizing:border-box;width:100%;min-height:48px;padding:11px 14px;border-radius:12px;border:1.5px solid #c9bfae;background:#fff;color:#172e47;font:400 17px/1.4 Inter,system-ui,sans-serif}" +
    ".ksz-f textarea{min-height:150px;resize:vertical}.ksz-f label>input,.ksz-f label>textarea{flex:1 0 100%}" +
    ".ksz-f input:focus,.ksz-f textarea:focus{outline:none;border-color:#123d6b;box-shadow:0 0 0 3px rgba(214,166,78,.45)}" +
    ".ksz-f .rossz{border-color:#a3301f!important;background:#fff6f4}" +
    ".ksz-csapda{position:absolute!important;left:-9999px!important;width:1px;height:1px;overflow:hidden}" +
    ".ksz-uz{padding:12px 14px;border-radius:12px;font-weight:600;font-size:16px}" +
    ".ksz-uz.hiba{background:#fdecea;color:#8a1f12;border:1px solid #f0b9b0}" +
    ".ksz-uz.ok{background:#e9f6ee;color:#0f5f36;border:1px solid #b7e0c6}" +
    ".ksz-gomb{all:unset;box-sizing:border-box;cursor:pointer;justify-self:start;display:inline-flex;align-items:center;gap:10px;min-height:50px;padding:0 24px;border-radius:999px;font:800 17px/1 Inter,system-ui,sans-serif;color:#172e47;background:linear-gradient(180deg,#f7dfa6,#d6a64e);box-shadow:0 6px 16px rgba(23,46,71,.22),inset 0 -2px 0 rgba(0,0,0,.12)}" +
    ".ksz-gomb:hover{filter:brightness(1.04)}.ksz-gomb:focus-visible{outline:3px solid #123d6b;outline-offset:3px}" +
    ".ksz-gomb[disabled]{opacity:.6;cursor:wait}" +
    ".ksz-adat{font-size:13.5px;color:#5b6878;margin:2px 0 0}" +
    "html.ksz-nyitva{overflow:hidden}";

  function el(tag, attrs, html) { var e = document.createElement(tag); for (var k in attrs || {}) e.setAttribute(k, attrs[k]); if (html != null) e.innerHTML = html; return e; }

  function sorBe() {
    var f = document.querySelector("footer"); if (!f || f.querySelector(".ksz-sor")) return;
    var s = el("p", { "class": "ksz-sor", "data-noi18n": "", lang: "hu" },
      "<span>© " + EV + " Minden jog fenntartva – <button type=\"button\" data-keszito aria-haspopup=\"dialog\">Kucsera Balázs</button></span><span class=\"ksz-pont\" aria-hidden=\"true\">·</span>" +
      "<span>A weboldal készítője: <button type=\"button\" data-keszito aria-haspopup=\"dialog\">Kucsera Balázs EV</button></span>");
    f.appendChild(s);
  }

  var ov, ab, form, uz, gomb, nyito, jegy = null, jegyIdo = 0, zarIdo = 0;
  function jegyKer() {
    return fetch(API + "?a=kapcsolat-jegy", { credentials: "same-origin", cache: "no-store" })
      .then(function (r) { return r.json(); }).then(function (j) { jegy = j.jegy || null; jegyIdo = Date.now(); }).catch(function () {});
  }
  function epit() {
    ov = el("div", { "class": "ksz-ov", hidden: "", "data-noi18n": "", lang: "hu" });
    ov.innerHTML =
      "<div class=\"ksz-ab\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"ksz-cim\">" +
      "<div class=\"ksz-fej\"><small>A weboldal készítője · Kucsera Balázs EV</small><h2 id=\"ksz-cim\">Saját weboldalt szeretne?</h2>" +
      "<button type=\"button\" class=\"ksz-x\" aria-label=\"Bezárás\">×</button></div>" +
      "<div class=\"ksz-tor\">" +
      "<p>Köszönöm, hogy felkeresett! Egyedi, igényes weboldalak és webáruházak tervezésével és elkészítésével foglalkozom – a látványtól a működésig, gondos kidolgozással.</p>" +
      "<p class=\"ksz-kiemel\">Szeretném előre jelezni, hogy <b>nem vállalok el minden megkeresést</b>: olyan munkákat választok, amelyekben valódi értéket tudok teremteni. Ezért kérem, írja le röviden, <b>milyen tevékenységű cég</b> számára készülne a weboldal, és <b>milyen elképzelései vannak</b> vele kapcsolatban (például a céljai, a szükséges funkciók, a kívánt stílus és a tervezett időpont).</p>" +
      "<p>Az üzenetét személyesen olvasom el, és amennyiben a megbízás illeszkedik a munkáimhoz, rövidesen válaszolok.</p>" +
      "<form class=\"ksz-f\" novalidate>" +
      "<div class=\"ksz-2\"><label>Név <span class=\"k\" aria-hidden=\"true\">*</span><input name=\"nev\" autocomplete=\"name\" required></label>" +
      "<label>E-mail-cím <span class=\"k\" aria-hidden=\"true\">*</span><input name=\"email\" type=\"email\" autocomplete=\"email\" required></label></div>" +
      "<div class=\"ksz-2\"><label>Telefon <span class=\"o\">(nem kötelező)</span><input name=\"telefon\" type=\"tel\" autocomplete=\"tel\"></label>" +
      "<label>Cég és tevékenység <span class=\"k\" aria-hidden=\"true\">*</span><input name=\"ceg\" autocomplete=\"organization\" placeholder=\"pl. családi pékség, Pécs\" required></label></div>" +
      "<label>Az elképzelése a weboldallal kapcsolatban <span class=\"k\" aria-hidden=\"true\">*</span><textarea name=\"uzenet\" required placeholder=\"Milyen oldalt szeretne? Mi a célja? Milyen funkciókra lenne szükség? Van-e már meglévő oldala vagy arculata?\"></textarea></label>" +
      "<div class=\"ksz-csapda\" aria-hidden=\"true\"><label>Weboldal<input name=\"web\" tabindex=\"-1\" autocomplete=\"off\"></label></div>" +
      "<div class=\"ksz-uz\" role=\"status\" aria-live=\"polite\" hidden></div>" +
      "<button type=\"submit\" class=\"ksz-gomb\">Megkeresés elküldése</button>" +
      "<p class=\"ksz-adat\">A csillaggal jelölt mezők kitöltése kötelező. Az adatait kizárólag a megkeresés megválaszolására használom, harmadik félnek nem adom át.</p>" +
      "</form></div></div>";
    document.body.appendChild(ov);
    ab = ov.querySelector(".ksz-ab"); form = ov.querySelector("form"); uz = ov.querySelector(".ksz-uz"); gomb = ov.querySelector(".ksz-gomb");
    ov.querySelector(".ksz-x").addEventListener("click", zar);
    ov.addEventListener("mousedown", function (e) { if (e.target === ov) zar(); });
    ov.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.preventDefault(); zar(); return; }
      if (e.key !== "Tab") return;
      var f = ab.querySelectorAll("button,input:not([tabindex='-1']),textarea,a[href]"); f = Array.prototype.filter.call(f, function (x) { return x.offsetParent !== null; });
      if (!f.length) return; var a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    });
    form.addEventListener("submit", kuld);
  }
  function uzenet(t, ok) { uz.hidden = !t; uz.className = "ksz-uz " + (ok ? "ok" : "hiba"); uz.textContent = t || ""; }
  function nyit(btn) {
    if (!ov) epit();
    nyito = btn || document.activeElement; clearTimeout(zarIdo);
    ov.hidden = false; document.documentElement.classList.add("ksz-nyitva");
    requestAnimationFrame(function () { ov.classList.add("be"); });
    if (!jegy || Date.now() - jegyIdo > 3600e3) jegyKer();
    setTimeout(function () { var i = form.querySelector("input[name=nev]"); if (i) i.focus(); }, 60);
  }
  function zar() {
    if (!ov || ov.hidden) return;
    ov.classList.remove("be"); document.documentElement.classList.remove("ksz-nyitva");
    zarIdo = setTimeout(function () { ov.hidden = true; }, 200);
    if (nyito && nyito.focus) nyito.focus();
  }
  function ellenoriz() {
    var d = {}; ["nev", "email", "telefon", "ceg", "uzenet", "web"].forEach(function (n) { d[n] = (form.elements[n].value || "").trim(); });
    form.querySelectorAll(".rossz").forEach(function (x) { x.classList.remove("rossz"); x.removeAttribute("aria-invalid"); });
    var hibak = [];
    function rossz(n, t) { var e = form.elements[n]; e.classList.add("rossz"); e.setAttribute("aria-invalid", "true"); hibak.push([e, t]); }
    if (d.nev.length < 2) rossz("nev", "Kérjük, adja meg a nevét.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) rossz("email", "Kérjük, adjon meg érvényes e-mail-címet – erre válaszolok.");
    if (d.telefon && !/^[\d\s+()\/-]{6,25}$/.test(d.telefon)) rossz("telefon", "A telefonszám formátuma nem megfelelő.");
    if (d.ceg.length < 3) rossz("ceg", "Kérjük, írja le, milyen tevékenységű cég számára készülne a weboldal.");
    if (d.uzenet.length < 20) rossz("uzenet", "Kérjük, írja le néhány mondatban az elképzelését a weboldallal kapcsolatban.");
    return { d: d, hibak: hibak };
  }
  function kuld(e) {
    e.preventDefault();
    var v = ellenoriz();
    if (v.hibak.length) { uzenet(v.hibak.map(function (h) { return h[1]; }).join(" ")); v.hibak[0][0].focus(); return; }
    uzenet(""); gomb.disabled = true; gomb.textContent = "Küldés…";
    var elott = jegy ? Promise.resolve() : jegyKer();
    elott.then(function () {
      var var4 = Math.max(0, 4200 - (Date.now() - jegyIdo));
      return new Promise(function (r) { setTimeout(r, var4); });
    }).then(function () { return post(v.d, true); });
  }
  function post(d, ujra) {
    var body = JSON.stringify({ nev: d.nev, email: d.email, telefon: d.telefon, ceg: d.ceg, uzenet: d.uzenet, web: d.web, jegy: jegy || "" });
    return fetch(API + "?a=keszito", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: body })
      .then(function (r) { return r.json().catch(function () { return { error: "A szerver nem válaszolt rendesen." }; }).then(function (j) { return { st: r.status, j: j }; }); })
      .then(function (x) {
        if (x.j && x.j.ok) {
          jegy = null;
          form.reset(); form.querySelectorAll("label,.ksz-2,.ksz-gomb,.ksz-adat").forEach(function (n) { n.hidden = true; });
          uzenet("Köszönöm a megkeresését! Az üzenetét megkaptam, és hamarosan válaszolok a megadott e-mail-címre.", true);
          return;
        }
        if (x.j && x.j.ujjegy && ujra) { jegy = x.j.ujjegy; jegyIdo = Date.now(); return new Promise(function (r) { setTimeout(r, 4200); }).then(function () { return post(d, false); }); }
        if (x.j && x.j.mezo && form.elements[x.j.mezo]) { form.elements[x.j.mezo].classList.add("rossz"); form.elements[x.j.mezo].focus(); }
        uzenet((x.j && x.j.error) || "Az üzenetet most nem sikerült elküldeni. Kérjük, próbálja újra később.");
      })
      .catch(function () { uzenet("Az üzenetet most nem sikerült elküldeni. Kérjük, ellenőrizze az internetkapcsolatot, és próbálja újra."); })
      .then(function () { gomb.disabled = false; gomb.textContent = "Megkeresés elküldése"; });
  }

  function indit() {
    var st = el("style", { id: "ksz-stilus" }); st.textContent = CSS; document.head.appendChild(st);
    sorBe();
    document.addEventListener("click", function (e) { var b = e.target.closest && e.target.closest("[data-keszito]"); if (b) { e.preventDefault(); nyit(b); } });
    /* a webáruház a láblécet újrarajzolhatja: ilyenkor a sor visszakerül */
    var t = 0; new MutationObserver(function () { if (t) return; t = requestAnimationFrame(function () { t = 0; sorBe(); }); }).observe(document.body, { childList: true, subtree: true });
  }
  window.PTG_KESZITO = { nyit: nyit };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", indit); else indit();
})();
