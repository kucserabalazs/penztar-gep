/* Antik pénztárgép a fejlécben (a sárkányfej helyén) – arany és ezüst.
 * Jelenet (21 mp-enként): az oldalsó hajtókar körbetekeredik → csilingel a gép, kiugrik a pénzfiók →
 * a fejléc alsó szabad sávjában a TOTÁL embléma végétől forgó arany- és ezüstérmék, lebegő bankjegyek
 * repülnek, egy kis ívvel beugranak a fiókba (csillanás) → a fiók becsukódik, a gép megbillen.
 * Rétegek: assets/illusztraciok/web/kassza-*.webp  (készítő: eszkozok/illusztraciok/kassza.py)
 */
(function () {
  "use strict";
  var top = document.querySelector(".top");
  if (!top || top.querySelector(".kassza")) return;
  /* a rétegek közös vásznának adatai (%) – a kassza.py kimenete */
  var K = { arany: 1.03098, csap: [26.446, 36.871], fiok: [-10.075, 5.194],
    vagas: [[68.37, 88.613], [58.093, 93.911], [2.871, 87.714], [2.871, 79.271], [13.148, 73.974], [68.37, 79.241]],
    talca: [35.218, 79.464], cseng: [55.222, 7.746] };
  var V = "1105k";
  var src = (document.currentScript && document.currentScript.src) || "";
  var DIR = src ? src.replace(/kassza\.js.*$/, "") + "illusztraciok/web/" : "assets/illusztraciok/web/";

  var css = document.createElement("style");
  css.id = "kasszaCss";
  css.textContent =
    ".top .kassza{position:absolute;top:4px;right:max(10px,1.3vw);height:calc(var(--th,110px) - 6px);aspect-ratio:" + K.arany + ";z-index:3;pointer-events:none;" +
    "filter:drop-shadow(0 2px 2px rgba(0,0,0,.5)) drop-shadow(0 0 7px rgba(244,213,141,.22))}" +
    ".kassza img{position:absolute;left:0;top:0;width:100%;height:100%;display:block;max-width:none}" +
    ".kassza .k-kar{transform-origin:" + K.csap[0] + "% " + K.csap[1] + "%}" +
    ".kassza .k-fiok{position:absolute;inset:0;clip-path:polygon(" + K.vagas.map(function (p) { return p[0] + "% " + p[1] + "%"; }).join(",") + ")}" +
    ".kassza .k-cseng{position:absolute;left:" + K.cseng[0] + "%;top:" + K.cseng[1] + "%;width:24%;aspect-ratio:1;transform:translate(-50%,-50%) scale(0);opacity:0}" +
    ".kassza .k-cseng svg,.kassza-penz svg{display:block;width:100%;height:100%;overflow:visible}" +
    ".kassza-penz{position:absolute;inset:0;pointer-events:none;z-index:4;overflow:visible}" +
    ".kassza-penz .pz,.kassza-penz .nyom,.kassza-penz .csill{position:absolute;left:0;top:0;opacity:0;will-change:transform,opacity}" +
    ".kassza-penz .nyom{width:4px;height:4px;margin:-2px 0 0 -2px;border-radius:50%;background:radial-gradient(circle,#fff6d8 0,#f4d58d 45%,rgba(244,213,141,0) 72%)}" +
    "@media (max-width:820px){.top .kassza{height:76px;top:5px;right:6px}}" +
    "@media (max-width:820px) and (min-width:380px){.top .kassza{height:72px;top:6px}}" +
    "html[dir=rtl] .top .kassza{right:auto;left:max(10px,1.3vw)}" +
    "@media (max-width:820px){html[dir=rtl] .top .kassza{left:6px}}";
  document.head.appendChild(css);

  var CSILLAG = '<svg viewBox="-10 -10 20 20"><path d="M0-10C.8-2.5 2.5-.8 10 0 2.5.8.8 2.5 0 10-.8 2.5-2.5.8-10 0-2.5-.8-.8-2.5 0-10Z" fill="#fff7dc"/><circle r="2.6" fill="#fff"/></svg>';
  var k = document.createElement("div");
  k.className = "kassza";
  k.setAttribute("aria-hidden", "true");
  k.innerHTML = '<img class="k-kar" alt="" src="' + DIR + "kassza-kar.webp?v=" + V + '">' +
    '<img class="k-test" alt="" src="' + DIR + "kassza-test.webp?v=" + V + '">' +
    '<div class="k-fiok"><img alt="" src="' + DIR + "kassza-fiok.webp?v=" + V + '"></div>' +
    '<i class="k-cseng">' + CSILLAG + "</i>";
  top.appendChild(k);
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  /* ---- repülő pénzek ---- */
  var DEFS = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
    '<radialGradient id="pzArany" cx="34%" cy="30%" r="78%"><stop offset="0" stop-color="#fffbe8"/><stop offset=".3" stop-color="#f7da8c"/><stop offset=".7" stop-color="#cf9a35"/><stop offset="1" stop-color="#7a4f10"/></radialGradient>' +
    '<radialGradient id="pzEzust" cx="34%" cy="30%" r="78%"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#e3e8ee"/><stop offset=".75" stop-color="#9aa3ae"/><stop offset="1" stop-color="#4b525c"/></radialGradient>' +
    '<linearGradient id="pzJegy" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6efd2"/><stop offset=".55" stop-color="#e2dcb8"/><stop offset="1" stop-color="#c9c08f"/></linearGradient>' +
    "</defs></svg>";
  var ERME_A = '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="9.4" fill="url(#pzArany)" stroke="#6b4510" stroke-width=".8"/><circle cx="10" cy="10" r="7.4" fill="none" stroke="#9b6a1c" stroke-width=".55" stroke-dasharray=".9 .7"/><path d="M6.6 6.2h4.6M6.6 6.2v7.6M6.6 9.8h3.6M12.6 7.4v5.2q0 1.2 1.2 1.2M11.4 9h2.8" fill="none" stroke="#7a4f10" stroke-width="1.15" stroke-linecap="round"/><ellipse cx="7" cy="6" rx="3" ry="1.6" fill="#fff" opacity=".45" transform="rotate(-35 7 6)"/></svg>';
  var ERME_E = '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="9.4" fill="url(#pzEzust)" stroke="#3c434d" stroke-width=".8"/><circle cx="10" cy="10" r="5.6" fill="url(#pzArany)" stroke="#6b4510" stroke-width=".6"/><text x="10" y="12.2" font-size="5.6" text-anchor="middle" font-weight="700" fill="#6b4510" font-family="Georgia,serif">100</text><ellipse cx="6.6" cy="5.8" rx="2.8" ry="1.4" fill="#fff" opacity=".55" transform="rotate(-35 6.6 5.8)"/></svg>';
  var JEGY = '<svg viewBox="0 0 34 17"><rect x=".5" y=".5" width="33" height="16" rx="1.6" fill="url(#pzJegy)" stroke="#9b7a2c" stroke-width=".8"/><rect x="2.4" y="2.4" width="29.2" height="12.2" rx="1" fill="none" stroke="#b9974a" stroke-width=".5"/><ellipse cx="11" cy="8.5" rx="4.2" ry="5" fill="#d7caa0" stroke="#8a6a22" stroke-width=".6"/><path d="M9.3 11.6q1.7-3.4 3.4 0M11 7.8a1.5 1.5 0 1 0 .01 0" fill="none" stroke="#7a5d1e" stroke-width=".55"/><path d="M19 6h10M19 8.5h7M19 11h9" stroke="#a48a49" stroke-width=".7" stroke-linecap="round"/><text x="29" y="14.3" font-size="3.6" text-anchor="end" font-weight="700" fill="#7a5d1e" font-family="Georgia,serif">Ft</text></svg>';
  var FAJTA = ["a", "e", "j", "a", "e", "a", "j"];      // a: aranyérme, e: ezüstérme (bimetál), j: bankjegy
  var N = FAJTA.length, NYOM = 4;
  var lay = document.createElement("div");
  lay.className = "kassza-penz";
  lay.setAttribute("aria-hidden", "true");
  var h = DEFS;
  FAJTA.forEach(function (f) {
    for (var i = 0; i < NYOM; i++) h += '<i class="nyom"></i>';
    h += '<i class="pz pz-' + f + '">' + (f === "a" ? ERME_A : f === "e" ? ERME_E : JEGY) + "</i>";
    h += '<i class="csill">' + CSILLAG + "</i>";
  });
  lay.innerHTML = h;
  top.appendChild(lay);
  var pz = lay.querySelectorAll(".pz"), ny = lay.querySelectorAll(".nyom"), cs = lay.querySelectorAll(".csill");
  var kar = k.querySelector(".k-kar"), fiokImg = k.querySelector(".k-fiok img"), cseng = k.querySelector(".k-cseng");

  /* ---- idővonal (mp) ---- */
  var T = 21, KAR0 = .8, KAR1 = 2.6, NYIT0 = 2.52, NYIT1 = 3.1, P0 = 3.2, LEP = .85, REP = 4.2, CSUK0 = 12.7, CSUK1 = 13.3;
  function cl(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function seg(t, a, b) { return cl((t - a) / (b - a)); }
  function eio(x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function eob(x) { var c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
  function ein(x) { return x * x * x; }

  /* ---- geometria: honnan (az embléma vége) hová (a kihúzott fiók belseje) ---- */
  var G = null;
  function vis(el) { if (!el) return null; var r = el.getBoundingClientRect(); return r.width && r.height && getComputedStyle(el).display !== "none" && getComputedStyle(el).visibility !== "hidden" ? r : null; }
  function geo() {
    var R = top.getBoundingClientRect(), kr = vis(k), l = vis(top.querySelector(".logo img")) || vis(top.querySelector(".logo"));
    if (!kr || !l) { G = null; return; }
    var H = R.height, tb = 0;
    [".slogan", ".contacts", ".zi-pick", ".mtools", ".vbar", ".mburger"].forEach(function (q) { var r = vis(top.querySelector(q)); if (r && r.bottom - R.top < H - 6) tb = Math.max(tb, r.bottom - R.top); });
    tb = Math.max(tb, l.bottom - R.top);
    var s = Math.max(11, Math.min(21, H * .18, H - tb - 12));
    /* a sáv közepén: a pénz alja se érjen az arany vonalhoz */
    var lo = tb + s * .5 + 2, hi = H - s * .5 - 10, by = hi >= lo ? (lo + hi) / 2 : hi;
    var kx = kr.left - R.left, ky = kr.top - R.top;
    var ex = kx + K.talca[0] / 100 * kr.width, ey = ky + K.talca[1] / 100 * kr.height;
    var jobbra = kr.left + kr.width / 2 > l.left + l.width / 2;
    var sx = jobbra ? l.right - R.left + 4 : l.left - R.left - 4;
    var dir = jobbra ? 1 : -1;
    var xa = ex - dir * Math.max(26, kr.width * .42);
    G = { sx: sx, by: by, ex: ex, ey: ey, xa: xa, dir: dir, s: s, hop: Math.max(14, Math.min(26, kr.height * .26)), W: kr.width };
    for (var i = 0; i < N; i++) {
      var j = FAJTA[i] === "j";
      pz[i].style.width = (j ? s * 1.9 : s) + "px";
      pz[i].style.height = (j ? s * .95 : s) + "px";
      pz[i].style.margin = (j ? -s * .475 : -s / 2) + "px 0 0 " + (j ? -s * .95 : -s / 2) + "px";
      cs[i].style.width = cs[i].style.height = s * 1.3 + "px";
      cs[i].style.margin = -s * .65 + "px 0 0 " + -s * .65 + "px";
    }
  }
  /* a röppálya: a sávban hullámozva, a végén kis ívvel be a fiókba */
  function poz(i, p) {
    var g = G, LA = Math.abs(g.xa - g.sx), LB = Math.hypot(g.ex - g.xa, g.ey - g.by) + g.hop, pa = LA / (LA + LB * 1.5), x, y;
    if (p <= pa) {
      var u = p / pa;
      x = g.sx + (g.xa - g.sx) * u;
      y = g.by + Math.sin(u * Math.PI * (3 + i % 3) + i) * 2.4 * Math.sin(u * Math.PI) - (1 - Math.pow(1 - Math.min(1, u * 8), 2)) * 0 ;
    } else {
      var v = (p - pa) / (1 - pa), cx = (g.xa + g.ex) / 2, cy = Math.min(g.by, g.ey) - g.hop;
      var w1 = 1 - v;
      x = w1 * w1 * g.xa + 2 * w1 * v * cx + v * v * g.ex;
      y = w1 * w1 * g.by + 2 * w1 * v * cy + v * v * g.ey;
    }
    return [x, y];
  }

  /* a ciklus csak akkor fut, ha a fejléc látszik, a fül előtérben van és az animációk nincsenek szüneteltetve;
     megállításkor az idő is megáll (folytatáskor onnan megy tovább, ahol abbamaradt) */
  var on = true, t0 = performance.now(), raf = 0, allt = 0;
  function mehet() { return on && G && !document.hidden && !(window.PTG_ANIM && window.PTG_ANIM.szunet); }
  function all() { if (raf) cancelAnimationFrame(raf); raf = 0; if (!allt) allt = performance.now(); }
  function indit() { if (raf) return; if (!mehet()) { if (!allt) allt = performance.now(); return; } if (allt) { t0 += performance.now() - allt; allt = 0; } raf = requestAnimationFrame(frame); }
  function frame(now) {
    raf = 0;
    if (!mehet()) { all(); return; }
    raf = requestAnimationFrame(frame);
    var t = ((now - t0) / 1000) % T;
    /* hajtókar */
    kar.style.transform = "rotate(" + (360 * eio(seg(t, KAR0, KAR1))).toFixed(2) + "deg)";
    /* fiók */
    var d = t < NYIT0 ? 0 : t < NYIT1 ? eob(seg(t, NYIT0, NYIT1)) : t < CSUK0 ? 1 : t < CSUK1 ? 1 - ein(seg(t, CSUK0, CSUK1)) : 0;
    fiokImg.style.transform = "translate(" + (K.fiok[0] * d).toFixed(3) + "%," + (K.fiok[1] * d).toFixed(3) + "%)";
    /* a gép megbillen, amikor a fiók kiugrik és amikor becsapódik */
    var b1 = seg(t, NYIT0, NYIT0 + .32), b2 = seg(t, CSUK1, CSUK1 + .3);
    var by = (b1 > 0 && b1 < 1 ? -Math.sin(b1 * Math.PI) * 1.4 : 0) + (b2 > 0 && b2 < 1 ? Math.sin(b2 * Math.PI * 2) * Math.pow(1 - b2, 2) * 1.6 : 0);
    var rot = b1 > 0 && b1 < 1 ? Math.sin(b1 * Math.PI * 2) * (1 - b1) * .9 : 0;
    k.style.transform = by || rot ? "translateY(" + by.toFixed(2) + "px) rotate(" + rot.toFixed(2) + "deg)" : "";
    /* csengő-csillanás a CASH táblán */
    var c = seg(t, NYIT0 - .05, NYIT0 + .75);
    cseng.style.opacity = c > 0 && c < 1 ? Math.sin(c * Math.PI).toFixed(3) : 0;
    cseng.style.transform = "translate(-50%,-50%) scale(" + (c > 0 && c < 1 ? (.25 + .75 * Math.sin(c * Math.PI)) : 0).toFixed(3) + ") rotate(" + (c * 90).toFixed(1) + "deg)";
    /* pénzek */
    for (var i = 0; i < N; i++) {
      var ti = (t - (P0 + i * LEP)) / REP, el = pz[i], j = FAJTA[i] === "j", n;
      if (ti <= 0 || ti >= 1) {
        el.style.opacity = 0;
        for (n = 0; n < NYOM; n++) ny[i * NYOM + n].style.opacity = 0;
      } else {
        var p = ti, q = poz(i, p), be = cl(p / .07), ki = cl((p - .93) / .07);
        var sc = (.35 + .65 * (1 - Math.pow(1 - be, 3))) * (1 - .45 * ki);
        var tr;
        if (j) {
          var fl = (now / 1000) * 6 + i;
          tr = "rotate(" + (Math.sin(fl * 1.3) * 16 - 8 * G.dir).toFixed(1) + "deg) skewY(" + (Math.sin(fl) * 12).toFixed(1) + "deg) scale(" + sc.toFixed(3) + "," + (sc * (.8 + .2 * Math.abs(Math.sin(fl * .8)))).toFixed(3) + ")";
        } else {
          var ph = ti * REP * 1.5 * Math.PI * 2 + i, cx = Math.cos(ph);
          tr = "rotate(" + (Math.sin(ph * .5) * 18).toFixed(1) + "deg) scale(" + (sc * Math.max(.13, Math.abs(cx))).toFixed(3) + "," + sc.toFixed(3) + ")";
          el.style.filter = "brightness(" + (1 + .35 * Math.max(0, cx) * Math.max(0, cx)).toFixed(2) + ")";
        }
        el.style.transform = "translate(" + q[0].toFixed(1) + "px," + q[1].toFixed(1) + "px) " + tr;
        el.style.opacity = (1 - ki).toFixed(3);
        for (n = 0; n < NYOM; n++) {
          var pp = p - (n + 1) * .012, nd = ny[i * NYOM + n];
          if (pp <= 0) { nd.style.opacity = 0; continue; }
          var qq = poz(i, pp);
          nd.style.transform = "translate(" + qq[0].toFixed(1) + "px," + qq[1].toFixed(1) + "px) scale(" + (1.3 - n * .22).toFixed(2) + ")";
          nd.style.opacity = ((.75 - n * .17) * (1 - ki) * be).toFixed(3);
        }
      }
      /* csillanás, ahol a pénz a fiókba esik */
      var cc = (t - (P0 + i * LEP + REP * .97)) / .45, ce = cs[i];
      if (cc > 0 && cc < 1) {
        ce.style.opacity = Math.sin(cc * Math.PI).toFixed(3);
        ce.style.transform = "translate(" + (G.ex + ((i * 37) % 13 - 6) * G.W / 110).toFixed(1) + "px," + (G.ey - 2 + ((i * 17) % 5 - 2)).toFixed(1) + "px) scale(" + (.3 + .9 * Math.sin(cc * Math.PI)).toFixed(3) + ") rotate(" + (cc * 120).toFixed(0) + "deg)";
      } else ce.style.opacity = 0;
    }
  }
  function geoIndit() { geo(); indit(); }
  geoIndit();
  addEventListener("resize", geoIndit);
  addEventListener("load", geoIndit);
  setTimeout(geoIndit, 900);
  k.querySelector(".k-test").addEventListener("load", geoIndit);
  if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { on = e[0].isIntersecting; on ? geoIndit() : all(); }).observe(top);
  document.addEventListener("visibilitychange", function () { document.hidden ? all() : indit(); });
  addEventListener("ptg-anim", function () { window.PTG_ANIM && window.PTG_ANIM.szunet ? all() : indit(); });
})();
