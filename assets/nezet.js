/* Nézetválasztó: Automatikus · Asztali · Táblagép · Mobil
 * - Automatikus: a készülék szerinti megjelenés.
 * - Ha a választott nézet SZÉLESEBB a kijelzőnél (pl. telefonon „Asztali”): a böngésző
 *   annak a szélességnek megfelelően rajzolja ki az oldalt, és kicsinyíti a kijelzőre.
 * - Ha KESKENYEBB (pl. számítógépen „Mobil”): az oldal középen, a választott
 *   szélességű kereten belül jelenik meg, pontosan úgy, ahogy azon a készüléken.
 * A választást a böngésző megjegyzi (ptg-nezet).
 */
(function () {
  "use strict";
  var KEY = "ptg-nezet";
  var W = { asztali: 1366, tablagep: 1000, mobil: 390 };
  var CIMKE = { auto: "Automatikus", asztali: "Asztali", tablagep: "Táblagép", mobil: "Mobil" };
  var IKON = {
    auto: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/><circle cx="12" cy="12" r="3.2"/>',
    asztali: '<rect x="2.5" y="4" width="19" height="12.5" rx="1.6"/><path d="M8.5 20.5h7M12 16.5v4"/>',
    tablagep: '<rect x="4.5" y="2.5" width="15" height="19" rx="2.2"/><path d="M11 18.5h2"/>',
    mobil: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.6h2"/>'
  };
  var keretben = /[?&]nezet=keret\b/.test(location.search);
  function get() { try { return localStorage.getItem(KEY) || "auto"; } catch (e) { return "auto"; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  if (keretben) { document.documentElement.classList.add("nezet-keretben"); return; }

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
    if (!document.body) { document.addEventListener("DOMContentLoaded", function () { nyitKeret(w, v); }); return; }
    var u = location.href.replace(/#.*$/, "");
    u += (u.indexOf("?") < 0 ? "?" : "&") + "nezet=keret" + location.hash;
    keret = document.createElement("div");
    keret.className = "nezet-hatter";
    keret.setAttribute("data-noi18n", "");
    keret.innerHTML = '<div class="nezet-fej"><span>' + CIMKE[v] + " nézet · " + w + ' px</span><button type="button" data-v="auto">Vissza az automatikus nézetre ✕</button></div>' +
      '<iframe title="' + CIMKE[v] + ' nézet" style="width:' + w + 'px" src="' + u.replace(/"/g, "&quot;") + '"></iframe>';
    keret.querySelector("button").onclick = function () { valaszt("auto"); };
    document.body.appendChild(keret);
    document.documentElement.classList.add("nezet-keret-nyitva");
  }
  function zarKeret() {
    if (keret && keret.parentNode) keret.parentNode.removeChild(keret);
    keret = null;
    document.documentElement.classList.remove("nezet-keret-nyitva");
  }

  function valaszt(v) {
    set(v);
    if (meta && W[v] && W[v] > kijelzo + 40) { location.reload(); return; }
    if (meta && meta.getAttribute("content") !== EREDETI && !(W[v] > kijelzo + 40)) { location.reload(); return; }
    alkalmaz(v);
    festes();
  }

  /* ---- választó gombsor (a láblécbe kerül) ---- */
  var CSS = ".nezetval{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px;padding:16px 12px 18px;font:600 15px/1.2 Inter,'Segoe UI',system-ui,sans-serif;color:#d6dfea;position:relative;z-index:2}" +
    ".nezetval b{font-weight:700;color:#f4d58d;margin-right:4px}" +
    ".nezetval button{all:unset;box-sizing:border-box;cursor:pointer;display:inline-flex;align-items:center;gap:7px;height:42px;padding:0 14px;border-radius:999px;color:#fff;background:rgba(255,255,255,.07);box-shadow:inset 0 0 0 1px rgba(244,213,141,.45);font-size:15px}" +
    ".nezetval button:hover,.nezetval button:focus-visible{background:rgba(255,255,255,.14)}" +
    ".nezetval button[aria-pressed=true]{background:linear-gradient(180deg,#f7dfa6,#d6a64e);color:#172e47;box-shadow:0 4px 12px rgba(0,0,0,.3)}" +
    ".nezetval svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}" +
    ".nezet-hatter{position:fixed;inset:0;z-index:2147483600;background:radial-gradient(ellipse at 50% 0%,#123b61,#041a33 70%);display:flex;flex-direction:column;align-items:center}" +
    ".nezet-fej{display:flex;gap:14px;align-items:center;justify-content:center;flex-wrap:wrap;padding:10px 14px;color:#f4d58d;font:700 15px/1.2 Inter,system-ui,sans-serif}" +
    ".nezet-fej button{all:unset;cursor:pointer;padding:9px 16px;border-radius:999px;background:linear-gradient(180deg,#f7dfa6,#d6a64e);color:#172e47}" +
    ".nezet-hatter iframe{flex:1;max-width:100%;border:0;border-radius:18px 18px 0 0;background:#fff;box-shadow:0 0 0 2px rgba(244,213,141,.6),0 30px 80px rgba(0,0,0,.6)}" +
    "html.nezet-keret-nyitva,html.nezet-keret-nyitva body{overflow:hidden!important}" +
    "html.nezet-keretben .nezetval{display:none}";
  function festes() {
    var v = get();
    document.querySelectorAll(".nezetval button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-v") === v)); });
  }
  function felrak() {
    if (!document.getElementById("nezetCss")) { var s = document.createElement("style"); s.id = "nezetCss"; s.textContent = CSS; document.head.appendChild(s); }
    var hova = document.querySelector("footer");
    if (!hova || hova.querySelector(".nezetval")) return;
    var d = document.createElement("div");
    d.className = "nezetval"; d.setAttribute("role", "group"); d.setAttribute("aria-label", "Megjelenítés");
    d.innerHTML = "<b>Megjelenítés:</b>" + ["auto", "asztali", "tablagep", "mobil"].map(function (k) {
      return '<button type="button" data-v="' + k + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + IKON[k] + "</svg>" + CIMKE[k] + "</button>";
    }).join("");
    d.addEventListener("click", function (e) { var b = e.target.closest("button[data-v]"); if (b) valaszt(b.getAttribute("data-v")); });
    hova.appendChild(d);
    festes();
  }

  alkalmaz(get());
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", felrak); else felrak();
  window.PTG_NEZET = { valaszt: valaszt, get: get };
})();
