/* Nézetválasztó: Automatikus · Asztali · Táblagép · Mobil
 * - Automatikus: a készülék szerinti megjelenés.
 * - Ha a választott nézet SZÉLESEBB a kijelzőnél (pl. telefonon „Asztali”): a böngésző
 *   annak a szélességnek megfelelően rajzolja ki az oldalt, és kicsinyíti a kijelzőre.
 * - Ha KESKENYEBB (pl. számítógépen „Mobil”): az oldal középen, a választott
 *   szélességű kereten belül jelenik meg, pontosan úgy, ahogy azon a készüléken.
 *   Ilyenkor a mögötte lévő (eltakart) oldal tartalma el van rejtve, így nem fut kétszer minden animáció,
 *   és a kereten belül megnyitott további oldalak is keretnézetben maradnak (window.top !== window).
 * - A gombsor színei a lábléc hátteréhez igazodnak: sötét háttéren arany/fehér, világoson sötétkék.
 *   (Kényszeríthető: <footer data-nezet-tema="vilagos|sotet">.)
 * - Animációk szüneteltetése: ha a <html> elemen ott a data-anim-kapcsolo attribútum, a gombsor mellé
 *   egy „Animációk szüneteltetése / indítása” kapcsoló is kerül. Állapota: html.anim-szunet osztály,
 *   window.PTG_ANIM.szunet és a „ptg-anim” esemény (a JS-jelenetek erre állnak meg / indulnak).
 * A választást a böngésző megjegyzi (ptg-nezet, ptg-anim).
 */
(function () {
  "use strict";
  var KEY = "ptg-nezet", AKEY = "ptg-anim";
  var W = { asztali: 1366, tablagep: 1000, mobil: 390 };
  var CIMKE = { auto: "Automatikus", asztali: "Asztali", tablagep: "Táblagép", mobil: "Mobil" };
  var IKON = {
    auto: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/><circle cx="12" cy="12" r="3.2"/>',
    asztali: '<rect x="2.5" y="4" width="19" height="12.5" rx="1.6"/><path d="M8.5 20.5h7M12 16.5v4"/>',
    tablagep: '<rect x="4.5" y="2.5" width="15" height="19" rx="2.2"/><path d="M11 18.5h2"/>',
    mobil: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.6h2"/>',
    szunet: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7M14 8.5v7"/>',
    indit: '<circle cx="12" cy="12" r="9"/><path d="M10 8.3v7.4l6-3.7z"/>'
  };
  var html = document.documentElement;
  var keretben = /[?&]nezet=keret\b/.test(location.search);
  try { if (window.top !== window && window.parent.PTG_NEZET) keretben = true; } catch (e) {}
  function lget(k, d) { try { return localStorage.getItem(k) || d; } catch (e) { return d; } }
  function lset(k, v) { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch (e) {} }
  function get() { return lget(KEY, "auto"); }
  function set(v) { lset(KEY, v); }

  /* ---- animációk szüneteltetése (csak ott, ahol az oldal kéri) ---- */
  var animKapcsolo = html.hasAttribute("data-anim-kapcsolo");
  var szunet = animKapcsolo && lget(AKEY, "") === "szunet";
  /* betöltéskor szüneteltetve: a belépő animációk a végállapotban, a folyamatosak állnak (anim-szunet-be);
     menet közben szüneteltetve: minden ott áll meg, ahol éppen tart (anim-szunet) */
  if (szunet) html.classList.add("anim-szunet", "anim-szunet-be");
  window.PTG_ANIM = {
    get szunet() { return szunet; },
    allit: function (v) {
      v = !!v; if (v === szunet) return; szunet = v;
      lset(AKEY, v ? "szunet" : "");
      html.classList.toggle("anim-szunet", v);
      if (!v) html.classList.remove("anim-szunet-be");
      try { window.dispatchEvent(new CustomEvent("ptg-anim", { detail: { szunet: v } })); } catch (e) {}
      animFestes();
    }
  };

  var CSS = ".nezetval{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px;padding:16px 12px 18px;font:600 15px/1.2 Inter,'Segoe UI',system-ui,sans-serif;color:#d6dfea;position:relative;z-index:2}" +
    ".nezetval b{font-weight:700;color:#f4d58d;margin-right:4px}" +
    ".nezetval button{all:unset;box-sizing:border-box;cursor:pointer;display:inline-flex;align-items:center;gap:7px;height:42px;padding:0 14px;border-radius:999px;color:#fff;background:rgba(255,255,255,.07);box-shadow:inset 0 0 0 1px rgba(244,213,141,.45);font-size:15px}" +
    ".nezetval button:hover,.nezetval button:focus-visible{background:rgba(255,255,255,.14)}" +
    ".nezetval button:focus-visible{outline:3px solid #ffd98a;outline-offset:3px}" +
    ".nezetval button[aria-pressed=true]{background:linear-gradient(180deg,#f7dfa6,#d6a64e);color:#172e47;box-shadow:0 4px 12px rgba(0,0,0,.3)}" +
    ".nezetval svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}" +
    ".nezetval .nv-sep{width:1px;height:26px;margin:0 6px;background:currentColor;opacity:.3}" +
    ".nezetval .nv-anim[data-szunet=true]{box-shadow:inset 0 0 0 1.5px #f4d58d}" +
    /* világos lábléc (pl. a webáruház krémszínű lábléce): sötétkék szöveg és keret */
    ".nezetval.vilagos{color:#3a4a5c}" +
    ".nezetval.vilagos b{color:#7a5410}" +
    ".nezetval.vilagos button{color:#172e47;background:rgba(23,46,71,.05);box-shadow:inset 0 0 0 1.5px rgba(23,46,71,.6)}" +
    ".nezetval.vilagos button:hover,.nezetval.vilagos button:focus-visible{background:rgba(23,46,71,.12)}" +
    ".nezetval.vilagos button:focus-visible{outline-color:#172e47}" +
    ".nezetval.vilagos button[aria-pressed=true]{background:linear-gradient(180deg,#f7dfa6,#d6a64e);color:#172e47;box-shadow:inset 0 0 0 1.5px #8a5f12,0 3px 10px rgba(23,46,71,.18)}" +
    ".nezetval.vilagos .nv-anim[data-szunet=true]{box-shadow:inset 0 0 0 2px #172e47}" +
    ".nezet-hatter{position:fixed;inset:0;z-index:2147483600;background:radial-gradient(ellipse at 50% 0%,#123b61,#041a33 70%);display:flex;flex-direction:column;align-items:center}" +
    ".nezet-fej{display:flex;gap:14px;align-items:center;justify-content:center;flex-wrap:wrap;padding:10px 14px;color:#f4d58d;font:700 15px/1.2 Inter,system-ui,sans-serif}" +
    ".nezet-fej button{all:unset;cursor:pointer;padding:9px 16px;border-radius:999px;background:linear-gradient(180deg,#f7dfa6,#d6a64e);color:#172e47}" +
    ".nezet-fej button:focus-visible{outline:3px solid #ffd98a;outline-offset:3px}" +
    ".nezet-hatter iframe{flex:1;max-width:100%;border:0;border-radius:18px 18px 0 0;background:#fff;box-shadow:0 0 0 2px rgba(244,213,141,.6),0 30px 80px rgba(0,0,0,.6)}" +
    "html.nezet-keret-nyitva,html.nezet-keret-nyitva body{overflow:hidden!important}" +
    /* a keret mögötti oldal nem látszik – el is rejtjük: nem rajzol, nem animál, a lusta képeit nem tölti le */
    "html.nezet-keret-nyitva body>*:not(.nezet-hatter){display:none!important}" +
    "html.nezet-keretben .nezetval{display:none}" +
    /* szüneteltetett animációk */
    "html.anim-szunet *,html.anim-szunet *::before,html.anim-szunet *::after{animation-play-state:paused!important}" +
    "html.anim-szunet-be *,html.anim-szunet-be *::before,html.anim-szunet-be *::after{animation-delay:-999s!important}";
  function cssBe() {
    if (document.getElementById("nezetCss")) return;
    var s = document.createElement("style"); s.id = "nezetCss"; s.textContent = CSS;
    (document.head || html).appendChild(s);
  }
  cssBe();

  if (keretben) { html.classList.add("nezet-keretben"); window.PTG_NEZET = { valaszt: function () {}, get: get, keretben: true }; return; }

  var meta = document.querySelector('meta[name="viewport"]');
  var EREDETI = meta ? meta.getAttribute("content") : "width=device-width, initial-scale=1";
  var kijelzo = Math.min(window.innerWidth || 9999, (window.screen && screen.width) || 9999);

  function alkalmaz(v) {
    var w = W[v];
    zarKeret();
    if (meta) meta.setAttribute("content", EREDETI);
    if (!w) return;
    if (w > kijelzo + 40) {
      /* szélesebb nézet keskeny kijelzőn: a böngésző kicsinyít */
      if (meta) { var sc = Math.max(0.1, Math.min(1, kijelzo / w)).toFixed(4); meta.setAttribute("content", "width=" + w + ", initial-scale=" + sc + ", minimum-scale=" + sc + ", viewport-fit=cover"); }
    } else if (w < kijelzo - 40) {
      nyitKeret(w, v);
    }
  }

  /* ---- keskenyebb nézet nagy kijelzőn: középre igazított keret ---- */
  var keret = null;
  function nyitKeret(w, v) {
    /* már a <head>-ben elrejtjük a mögöttes oldalt, hogy a takart képek, betűk, háttérképek le se töltődjenek */
    html.classList.add("nezet-keret-nyitva");
    if (!document.body) { document.addEventListener("DOMContentLoaded", function () { if (get() === v) nyitKeret(w, v); }); return; }
    if (keret) return;
    var u = location.href.replace(/#.*$/, "");
    u += (u.indexOf("?") < 0 ? "?" : "&") + "nezet=keret" + location.hash;
    keret = document.createElement("div");
    keret.className = "nezet-hatter";
    keret.setAttribute("data-noi18n", "");
    keret.innerHTML = '<div class="nezet-fej"><span>' + CIMKE[v] + " nézet · " + w + ' px</span><button type="button" data-v="auto">Vissza az automatikus nézetre ✕</button></div>' +
      '<iframe title="' + CIMKE[v] + ' nézet" style="width:' + w + 'px" src="' + u.replace(/"/g, "&quot;") + '"></iframe>';
    keret.querySelector("button").onclick = function () { valaszt("auto"); };
    document.body.appendChild(keret);
  }
  function zarKeret() {
    if (keret && keret.parentNode) keret.parentNode.removeChild(keret);
    keret = null;
    html.classList.remove("nezet-keret-nyitva");
  }

  function valaszt(v) {
    var volt = !!keret;
    set(v);
    if (meta && W[v] && W[v] > kijelzo + 40) { location.reload(); return; }
    if (meta && meta.getAttribute("content") !== EREDETI && !(W[v] > kijelzo + 40)) { location.reload(); return; }
    alkalmaz(v);
    /* a keretből visszatérve a rejtve volt oldal elemei újra mérik magukat (fejléc-jelenetek, térkép) */
    if (volt && !keret) try { window.dispatchEvent(new Event("resize")); } catch (e) {}
    festes();
  }

  /* ---- a lábléc hátterének fényessége (világos háttéren sötét gombsor) ---- */
  function lum(c) {
    var m = /rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:[ ,/]+([\d.]+%?))?/.exec(c || "");
    if (!m) return null;
    var a = m[4] == null ? 1 : /%$/.test(m[4]) ? parseFloat(m[4]) / 100 : +m[4];
    var f = function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return { l: 0.2126 * f(+m[1]) + 0.7152 * f(+m[2]) + 0.0722 * f(+m[3]), a: a };
  }
  function vilagosHatter(el) {
    for (var e = el; e && e.nodeType === 1; e = e.parentElement) {
      var t = e.getAttribute("data-nezet-tema");
      if (t) return t === "vilagos";
      var cs = getComputedStyle(e), bg = lum(cs.backgroundColor);
      if (bg && bg.a > 0.5) return bg.l > 0.4;
      var img = cs.backgroundImage || "";
      if (/gradient/.test(img)) {
        var sz = img.match(/rgba?\([^)]*\)/g) || [], ossz = 0, db = 0;
        sz.forEach(function (c) { var x = lum(c); if (x && x.a > 0.5) { ossz += x.l; db++; } });
        if (db) return ossz / db > 0.4;
      }
    }
    return false;
  }

  /* ---- választó gombsor (a láblécbe kerül) ---- */
  function festes() {
    var v = get();
    document.querySelectorAll(".nezetval button[data-v]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-v") === v)); });
  }
  function animFestes() {
    document.querySelectorAll(".nezetval .nv-anim").forEach(function (b) {
      b.setAttribute("data-szunet", String(szunet));
      b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + (szunet ? IKON.indit : IKON.szunet) + "</svg>" + (szunet ? "Animációk indítása" : "Animációk szüneteltetése");
    });
  }
  function felrak() {
    cssBe();
    var hova = document.querySelector("footer");
    if (!hova || hova.querySelector(".nezetval")) return;
    var d = document.createElement("div");
    d.className = "nezetval"; d.setAttribute("role", "group"); d.setAttribute("aria-label", "Megjelenítés");
    d.innerHTML = "<b>Megjelenítés:</b>" + ["auto", "asztali", "tablagep", "mobil"].map(function (k) {
      return '<button type="button" data-v="' + k + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + IKON[k] + "</svg>" + CIMKE[k] + "</button>";
    }).join("") + (animKapcsolo ? '<span class="nv-sep" aria-hidden="true"></span><button type="button" class="nv-anim"></button>' : "");
    d.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-v]"); if (b) { valaszt(b.getAttribute("data-v")); return; }
      if (e.target.closest(".nv-anim")) window.PTG_ANIM.allit(!szunet);
    });
    hova.appendChild(d);
    if (vilagosHatter(hova)) d.classList.add("vilagos");
    festes(); animFestes();
  }

  alkalmaz(get());
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", felrak); else felrak();
  window.PTG_NEZET = { valaszt: valaszt, get: get };
})();
