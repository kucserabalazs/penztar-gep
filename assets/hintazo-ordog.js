/* „Bevizsgált használt gépek” fejléce: a kisördög a TV-torony csúcsán ül és folyamatosan hintázik.
   A szereplő a térkép-jelenet kisördöge (TJSzereplok.ordog), ugyanazzal a rajzzal és ízületes csontvázzal.
   Mozgás: a csúcs körül ide-oda billeg, mint a hintán; a lábával lendületet vesz (előrenyújtja, visszahúzza),
   a karjait egyensúlyozva kitárja, a teste és a feje a lendülettel ellentétesen kicsit visszadől, a farka himbálózik.
   Csak akkor fut, amikor a torony látszik; a „kevesebb mozgás” beállításnál nyugodtan ül. */
(function () {
  var NS = "http://www.w3.org/2000/svg";
  var CSUCS_X = .5004, CSUCS_Y = .0041;      /* a torony csúcsa a kép szélességének/magasságának arányában */
  var ULES = 7;                              /* a törzs alja a csípő alatt ennyivel: ezzel ül a csúcson */
  var PER = 2.7;                             /* egy teljes hintázás (mp) */
  function el(n, a, p) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }

  function indit() {
    var kep = document.querySelector(".hsz-torony");
    if (!kep || !window.TJSzereplok || kep.__ordog) return;
    kep.__ordog = true;
    var doboz = kep.parentNode;
    if (getComputedStyle(doboz).position === "static") doboz.style.position = "relative";
    var svg = el("svg", { "class": "hsz-ordog", viewBox: "-60 -112 120 132", "aria-hidden": "true", focusable: "false" });
    svg.style.cssText = "position:absolute;pointer-events:none;overflow:visible;z-index:1";
    doboz.appendChild(svg);
    var hinta = el("g", {}, svg);
    var test = el("g", { transform: "translate(0 " + -ULES + ")" }, hinta);
    var o = TJSzereplok.ordog(test, "hszo-");

    function elhelyez() {
      var r = kep.getBoundingClientRect(), d = doboz.getBoundingClientRect();
      if (!r.height) return;
      var k = r.height / 200 * .5;          /* a szereplő mérete a toronyhoz igazodik (asztali 200 px-es toronynál kb. 50 px magas) */
      var x = r.left - d.left + r.width * CSUCS_X, y = r.top - d.top + r.height * CSUCS_Y;
      svg.style.width = (120 * k) + "px"; svg.style.height = (132 * k) + "px";
      svg.style.left = (x - 60 * k) + "px"; svg.style.top = (y - 112 * k) + "px";
    }

    function rajzol(t) {
      var f = 2 * Math.PI * t / PER, sz = Math.sin(f), cs = Math.cos(f);
      var dol = 17 * sz;                                       /* a billegés szöge a csúcs körül */
      hinta.setAttribute("transform", "rotate(" + dol.toFixed(2) + ")");
      /* lábak: ülő tartás (a térd kifelé, a lábszár lelóg); a lendületvételnél a két láb együtt előre-fel lendül,
         a holtpontokon visszahúzza, és kicsit lemarad a billegéstől, mint a valódi hintázásnál */
      var lendit = .5 + .5 * Math.sin(f + 1.1), lemarad = -dol * .32;
      function lab(o) { return { x: o * (8.5 + 3 * lendit) + lemarad, y: 22 - 9 * lendit }; }
      var ravasz = (t % 7.5) > 6.1;                            /* időnként huncutul hunyorít */
      o.rajzol({
        torzsSzog: -dol * .3,
        fejSzog: -dol * .35 + 4 * Math.sin(f * 2),
        labE: lab(1), labH: lab(-1), terdE: 1, terdH: -1,
        kezE: { x: 25 + 2 * cs, y: -20 + dol * .45 + 3 * Math.sin(f * 2) },
        kezH: { x: -25 + 2 * cs, y: -20 - dol * .45 + 3 * Math.sin(f * 2 + 1) },
        konyokE: 1, konyokH: -1,
        farokFazis: t * 2.6,
        kifejezes: ravasz ? "ravasz" : "elégedett",
        nez: { x: cs * .9, y: -.15 },
        kotelTekercs: false
      });
    }

    elhelyez();
    var nyugi = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (nyugi) { rajzol(PER * .5); return; }
    var fut = false, raf = 0, t0 = performance.now();
    function lep(most) { rajzol((most - t0) / 1000); raf = requestAnimationFrame(lep); }
    function be() { if (!fut) { fut = true; raf = requestAnimationFrame(lep); } }
    function ki() { if (fut) { fut = false; cancelAnimationFrame(raf); } }
    rajzol(0);
    if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { e[0].isIntersecting ? be() : ki(); }).observe(doboz);
    else be();
    window.addEventListener("resize", elhelyez);
    if (kep.complete) elhelyez(); else kep.addEventListener("load", elhelyez);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(elhelyez);
    if (window.ResizeObserver) new ResizeObserver(elhelyez).observe(doboz);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", indit); else indit();
  window.addEventListener("load", indit);
})();
