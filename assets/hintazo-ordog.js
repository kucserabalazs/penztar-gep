/* „Bevizsgált használt gépek” fejléce: a kisördög a TV-torony csúcsán ül, és a torony teteje vele együtt
   gumiként leng jobbra-balra.
   - A torony ugyanaz a rajz, mint a képen; a felső része három, egymásba ágyazott szakaszból áll
     (alsó – középső – felső), mindegyik a saját tövénél hajlik. A felsőbb szakaszok kicsit késve követik
     az alsóbbat, ezért a hajlás hullámként fut fel a csúcsig, mint egy gumirúdnál; a holtpontokon
     a csúcs még tovább lendül, és visszarugózik.
   - A kisördög (a térkép-jelenet szereplője) a csúcson ül: a csúcs dőlésével együtt dől, a teste kicsit
     lemaradva követi; a lábával lendületet vesz, a karjait kitárva egyensúlyoz, a farka himbálózik,
     elégedetten vigyorog, időnként huncutul hunyorít.
   Csak akkor fut, amikor a rész látszik; a „kevesebb mozgás” beállításnál a torony áll, az ördög nyugodtan ül. */
(function () {
  var NS = "http://www.w3.org/2000/svg";
  var PER = 2.6;                             /* egy teljes lengés (mp) */
  var ULES = 7;                              /* a törzs alja a csípő alatt ennyivel: ezzel ül a csúcson */
  var CSUCS = { x: 512.5, y: 41 }, CSUCS2 = { x: 512.5, y: 160 };   /* két pont a torony legfelső szakaszán (a dőlés méréséhez) */
  function el(n, a, p) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }

  function indit() {
    var kep = document.querySelector(".hsz-torony");
    if (!kep || !window.TJSzereplok || kep.__ordog) return;
    kep.__ordog = true;
    var doboz = kep.parentNode;
    if (getComputedStyle(doboz).position === "static") doboz.style.position = "relative";
    fetch(kep.getAttribute("src")).then(function (r) { return r.text(); }).then(function (txt) { epit(kep, doboz, txt); }).catch(function () { kep.__ordog = false; });
  }

  function epit(kep, doboz, txt) {
    var vb = /viewBox="([^"]*)"/.exec(txt)[1];
    var belso = txt.slice(txt.indexOf("</style>") + 8, txt.lastIndexOf("</svg>")).replace(/<title>[\s\S]*?<\/title>/, "")
      .replace(/id="csucs-(also|kozep|felso)"/g, 'id="hszt-$1"');
    /* a torony: a kép helyén, ugyanakkora méretben, de hajlítható; a kép a helyén marad (láthatatlanul), így az elrendezés nem változik */
    var torony = el("svg", { viewBox: vb, "class": "hsz-torony-elo", "aria-hidden": "true", focusable: "false" });
    torony.style.cssText = "position:absolute;pointer-events:none;overflow:visible;opacity:.85;z-index:1";
    torony.innerHTML = "<style>.hsz-torony-elo .resz{transform-box:fill-box}</style>" + belso;
    doboz.appendChild(torony);
    var G = ["also", "kozep", "felso"].map(function (n) { return torony.querySelector("#hszt-" + n); });
    var jel1 = el("circle", { cx: CSUCS.x, cy: CSUCS.y, r: .5, fill: "none" }, G[2] || torony);
    var jel2 = el("circle", { cx: CSUCS2.x, cy: CSUCS2.y, r: .5, fill: "none" }, G[2] || torony);
    kep.style.visibility = "hidden";

    /* a kisördög */
    var svg = el("svg", { "class": "hsz-ordog", viewBox: "-60 -112 120 132", "aria-hidden": "true", focusable: "false" });
    svg.style.cssText = "position:absolute;pointer-events:none;overflow:visible;z-index:2";
    doboz.appendChild(svg);
    var forgo = el("g", {}, svg);
    var test = el("g", { transform: "translate(0 " + -ULES + ")" }, forgo);
    var o = TJSzereplok.ordog(test, "hszo-");

    var k = 1;
    function elhelyez() {
      var r = kep.getBoundingClientRect(), d = doboz.getBoundingClientRect();
      if (!r.height) return;
      torony.style.left = (r.left - d.left) + "px"; torony.style.top = (r.top - d.top) + "px";
      torony.style.width = r.width + "px"; torony.style.height = r.height + "px";
      k = r.height / 200 * .5;               /* a szereplő mérete a toronyhoz igazodik */
      svg.style.width = (120 * k) + "px"; svg.style.height = (132 * k) + "px";
    }
    function pont(e) { var a = e.getBoundingClientRect(), d = doboz.getBoundingClientRect(); return { x: a.left + a.width / 2 - d.left, y: a.top + a.height / 2 - d.top }; }

    /* gumis lengés: a három szakasz késleltetve követi egymást, a csúcs a holtponton túllendül és visszarugózik */
    function hajlas(t) {
      var w = 2 * Math.PI / PER;
      function h(kes) { var f = w * t - kes; return Math.sin(f) + .18 * Math.sin(2 * f - .6); }
      return [4.5 * h(0), 7.5 * h(.32), 11 * h(.7)];
    }
    function rajzol(t, all) {
      var a = all ? [0, 0, 0] : hajlas(t);
      for (var i = 0; i < 3; i++) if (G[i]) G[i].style.transform = "rotate(" + a[i].toFixed(2) + "deg)";
      var p1 = pont(jel1), p2 = pont(jel2);
      var dol = Math.atan2(p1.x - p2.x, p2.y - p1.y) * 180 / Math.PI;      /* a csúcs dőlése (fok, + = jobbra) */
      var w = 2 * Math.PI / PER, f = w * t - 1.05;                          /* az ördög kicsit lemaradva követi a csúcsot */
      var lemar = all ? 0 : -6 * Math.sin(f + .9);                          /* a teste a lendülettel szemben visszadől */
      svg.style.left = (p1.x - 60 * k) + "px"; svg.style.top = (p1.y - 112 * k) + "px";
      forgo.setAttribute("transform", "rotate(" + (dol + lemar).toFixed(2) + ")");
      var sz = Math.sin(f), cs = Math.cos(f);
      var lendit = all ? .3 : .5 + .5 * Math.sin(f + 1.4);
      function lab(o2) { return { x: o2 * (8.5 + 3 * lendit) - dol * .25, y: 22 - 9 * lendit }; }
      var ravasz = !all && (t % 7.8) > 6.4;
      o.rajzol({
        torzsSzog: all ? 0 : -dol * .25,
        fejSzog: all ? 0 : -dol * .3 + 3 * Math.sin(f * 2),
        labE: lab(1), labH: lab(-1), terdE: 1, terdH: -1,
        kezE: { x: 25 + 2 * cs, y: -20 - dol * .5 + 3 * Math.sin(f * 2) },
        kezH: { x: -25 + 2 * cs, y: -20 + dol * .5 + 3 * Math.sin(f * 2 + 1) },
        konyokE: 1, konyokH: -1,
        farokFazis: t * 2.6,
        kifejezes: ravasz ? "ravasz" : "elégedett",
        nez: { x: all ? .3 : -sz * .9, y: -.15 },
        kotelTekercs: false
      });
    }

    elhelyez();
    var nyugi = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (nyugi) { rajzol(0, true); window.addEventListener("resize", function () { elhelyez(); rajzol(0, true); }); return; }
    var fut = false, raf = 0, t0 = performance.now();
    function lep(most) { rajzol((most - t0) / 1000); raf = requestAnimationFrame(lep); }
    function be() { if (!fut) { fut = true; raf = requestAnimationFrame(lep); } }
    function ki() { if (fut) { fut = false; cancelAnimationFrame(raf); } }
    rajzol(0);
    if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { e[0].isIntersecting ? be() : ki(); }).observe(doboz);
    else be();
    window.addEventListener("resize", elhelyez);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(elhelyez);
    if (window.ResizeObserver) new ResizeObserver(elhelyez).observe(doboz);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", indit); else indit();
  window.addEventListener("load", indit);
})();
