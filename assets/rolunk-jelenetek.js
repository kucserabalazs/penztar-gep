/* „Pécsen, 1982 óta” (Rólunk) – két kis jelenet a térkép-jelenet szereplőivel (TJSzereplok):
   1) A fejlécben a kisangyal egy bárányfelhőn ülve gitározik; a felhő lassan, ringatózva viszi ide-oda
      a címsor mellett. A jobb keze pengeti a húrokat (a húrok rezegnek), a bal keze akkordot fog és időnként
      lejjebb-feljebb csúszik a nyakon, a feje a ritmusra biccent, a lábát lógázza, a szárnya meg-megrebben,
      a gitárból hangjegyek szállnak fel.
   2) A „helyben vásárlás, üzembe helyezés és szerviz” keret tetején a kisördög ülve alszik: a lába lelóg
      a keret elé, a keze az ölében, a feje oldalra billen és lassan előrebólint, majd egy kis rándulással
      visszakapja; a teste a lélegzéssel emelkedik-süllyed, a szája szuszogáskor kinyílik, a farka lelóg és
      néha megrándul, a feje fölött „Z”-k szállnak.
   Csak akkor futnak, amikor látszanak; a „kevesebb mozgás” beállításnál nyugodt állókép marad. */
(function () {
  var NS = "http://www.w3.org/2000/svg";
  var TUS = "#2b3c53";
  function el(n, a, p) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
  function f1(x) { return (Math.round(x * 10) / 10).toString(); }
  var nyugi = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function lathatoFut(elem, rajz) {
    if (nyugi) { rajz(0, true); return; }
    var fut = false, raf = 0, t0 = performance.now();
    function lep(m) { rajz((m - t0) / 1000); raf = requestAnimationFrame(lep); }
    rajz(0);
    if ("IntersectionObserver" in window) new IntersectionObserver(function (e) {
      if (e[0].isIntersecting) { if (!fut) { fut = true; raf = requestAnimationFrame(lep); } }
      else if (fut) { fut = false; cancelAnimationFrame(raf); }
    }, { rootMargin: "60px" }).observe(elem);
    else raf = requestAnimationFrame(lep);
  }

  /* ---------- bárányfelhő (a dzsámis angyal felhőjének rajza) ---------- */
  var KORO = [[-150, 10, 52], [-92, -26, 66], [-20, -46, 74], [58, -32, 66], [124, -4, 56], [172, 22, 40], [-190, 30, 36],
    [-110, 40, 46], [-30, 44, 50], [50, 42, 50], [126, 38, 44]];
  var ELO = [[-58, -52, 56], [12, -60, 54], [78, -46, 46]];          /* az angyal ölét takaró elülső gomolyok */
  function felho(P, szulo, korok, vagas) {
    var g = el("g", {}, szulo);
    var klip = el("clipPath", { id: P + vagas }, g);
    korok.forEach(function (c) { el("circle", { cx: c[0], cy: c[1], r: c[2] }, klip); });
    var be = vagas === "fk" ? g : el("g", { "clip-path": "url(#" + P + "fe-v)" }, g);
    korok.forEach(function (c) { el("circle", { cx: c[0], cy: c[1], r: c[2], fill: "none", stroke: TUS, "stroke-width": 6 }, be); });
    korok.forEach(function (c) { el("circle", { cx: c[0], cy: c[1], r: c[2], fill: "url(#" + P + "felho)" }, be); });
    if (vagas === "fk") {
      var v = "";
      for (var i = 0, y = 28; y < 96; y += 7, i++) v += "M" + (-240 + i * 3) + " " + y + " C-120 " + (y - 4) + " -40 " + (y + 4) + " 40 " + (y - 2) + " C110 " + (y - 6) + " 170 " + (y + 3) + " 230 " + (y - 1) + " ";
      el("path", { d: v, fill: "none", stroke: TUS, "stroke-width": 1.1, opacity: .2, "stroke-linecap": "round", "clip-path": "url(#" + P + "fk)" }, g);
    }
    var iv = "", cs = "";
    korok.slice(0, 5).forEach(function (c) {
      var r1 = c[2] * .92, r2 = c[2] * .84, a1 = 115 * Math.PI / 180, a2 = 165 * Math.PI / 180, b1 = 200 * Math.PI / 180, b2 = 250 * Math.PI / 180;
      if (vagas === "fk") iv += "M" + f1(c[0] + r1 * Math.cos(a1)) + " " + f1(c[1] + r1 * Math.sin(a1)) + " A" + f1(r1) + " " + f1(r1) + " 0 0 1 " + f1(c[0] + r1 * Math.cos(a2)) + " " + f1(c[1] + r1 * Math.sin(a2)) + " ";
      cs += "M" + f1(c[0] + r2 * Math.cos(b1)) + " " + f1(c[1] + r2 * Math.sin(b1)) + " A" + f1(r2) + " " + f1(r2) + " 0 0 1 " + f1(c[0] + r2 * Math.cos(b2)) + " " + f1(c[1] + r2 * Math.sin(b2)) + " ";
    });
    if (iv) el("path", { d: iv, fill: "none", stroke: TUS, "stroke-width": 1.6, opacity: .35, "stroke-linecap": "round" }, g);
    el("path", { d: cs, fill: "none", stroke: "#fff", "stroke-width": 3.2, opacity: .95, "stroke-linecap": "round" }, g);
    return g;
  }

  /* ---------- gitár (a saját tengelye mentén: x a nyak felé) ---------- */
  function gitar(P, szulo) {
    var g = el("g", {}, szulo);
    var test = "M-9 0 C-9 -6 -5 -9 0 -8.6 C3 -8.4 4.5 -6.2 7 -6.3 C9.5 -6.4 11 -7.4 13.4 -6.8 C16.6 -6 17.4 -3 17.4 0 C17.4 3 16.6 6 13.4 6.8 C11 7.4 9.5 6.4 7 6.3 C4.5 6.2 3 8.4 0 8.6 C-5 9 -9 6 -9 0 Z";
    el("path", { d: test, fill: "url(#" + P + "gfa)", stroke: TUS, "stroke-width": 1, "stroke-linejoin": "round" }, g);
    el("path", { d: "M-7.6 0 C-7.6 -5 -4.4 -7.4 0 -7.2 C2.6 -7 4 -5.2 6.6 -5.2", fill: "none", stroke: "#fff3d6", "stroke-width": .9, opacity: .6, "stroke-linecap": "round" }, g);
    el("path", { d: test, fill: "none", stroke: "url(#" + P + "arany)", "stroke-width": .55, transform: "scale(.93) translate(.5 0)" }, g);
    el("circle", { cx: 8.6, cy: 0, r: 2.9, fill: "#3a2312", stroke: TUS, "stroke-width": .6 }, g);
    el("circle", { cx: 8.6, cy: 0, r: 3.6, fill: "none", stroke: "url(#" + P + "arany)", "stroke-width": .6 }, g);
    el("rect", { x: -5.6, y: -2.8, width: 2.2, height: 5.6, rx: .6, fill: "#3a2312", stroke: TUS, "stroke-width": .4 }, g);        /* húrláb */
    el("path", { d: "M14 -1.7 L36 -1.3 L36 1.3 L14 1.7 Z", fill: "#6b4422", stroke: TUS, "stroke-width": .7, "stroke-linejoin": "round" }, g);   /* nyak */
    var bund = ""; [18, 21.6, 24.8, 27.6, 30.2, 32.6, 34.6].forEach(function (x) { bund += "M" + x + " -1.5 L" + x + " 1.5 "; });
    el("path", { d: bund, stroke: "#e9dcc0", "stroke-width": .35 }, g);
    el("path", { d: "M36 -1.6 L42.6 -2.4 C43.4 -2.4 43.6 -1.6 43.6 0 C43.6 1.6 43.4 2.4 42.6 2.4 L36 1.6 Z", fill: "url(#" + P + "gfa)", stroke: TUS, "stroke-width": .7, "stroke-linejoin": "round" }, g);   /* fej */
    [37.6, 39.6, 41.6].forEach(function (x) { el("circle", { cx: x, cy: -3, r: .8, fill: "url(#" + P + "arany)", stroke: TUS, "stroke-width": .3 }, g); el("circle", { cx: x, cy: 3, r: .8, fill: "url(#" + P + "arany)", stroke: TUS, "stroke-width": .3 }, g); });
    var hurok = el("path", { fill: "none", stroke: "#f4ecd8", "stroke-width": .28 }, g);
    return { g: g, hurok: hurok };
  }

  /* hangjegyek: nyolcad és kettős nyolcad */
  var HANG = ["M0 0 m-2.6 0 a2.6 1.9 -20 1 0 5.2 0 a2.6 1.9 -20 1 0 -5.2 0 M2.3 -.6 L2.3 -13 C4.5 -11 7 -10 7.4 -6.4",
    "M0 0 m-2.4 0 a2.4 1.8 -20 1 0 4.8 0 a2.4 1.8 -20 1 0 -4.8 0 M2.1 -.6 L2.1 -12.4 L10.6 -14.4 L10.6 -2.6 M8.2 -2 m-2.4 0 a2.4 1.8 -20 1 0 4.8 0 a2.4 1.8 -20 1 0 -4.8 0"];

  /* ======================= 1) gitározó angyal a felhőn ======================= */
  var AY = 142, AS = 2.7;                    /* az angyal helye és mérete a felhőn */
  function angyalJelenet() {
    var sek = document.querySelector("#rolunk"), h2 = sek && sek.querySelector("h2"), oszlop = h2 && h2.parentNode;
    if (!h2 || oszlop.__angyal) return; oszlop.__angyal = true;
    if (getComputedStyle(oszlop).position === "static") oszlop.style.position = "relative";
    var P = "rja-";
    var svg = el("svg", { "class": "rolunk-angyal", "aria-hidden": "true", focusable: "false" });
    svg.style.cssText = "position:absolute;left:0;top:0;pointer-events:none;overflow:visible;z-index:2;color:" + TUS;
    oszlop.insertBefore(svg, oszlop.firstChild);
    var defs = el("defs", {}, svg);
    defs.innerHTML = '<radialGradient id="' + P + 'felho" cx="38%" cy="22%" r="85%"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#f7f2e7"/><stop offset="1" stop-color="#ddd1bb"/></radialGradient>' +
      '<linearGradient id="' + P + 'gfa" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f2c27a"/><stop offset=".5" stop-color="#cf8a3c"/><stop offset="1" stop-color="#8a4e1c"/></linearGradient>' +
      '<clipPath id="' + P + 'fe-v"><rect x="-300" y="-200" width="600" height="146"/></clipPath>' +
      '<filter id="' + P + 'fa" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#2b1a10" flood-opacity=".12"/></filter>';
    var hangok = el("g", {}, svg);
    var csop = el("g", { filter: "url(#" + P + "fa)" }, svg);
    felho(P, csop, KORO, "fk");
    var aHely = el("g", { transform: "translate(6 -" + AY + ") scale(" + AS + ")" }, csop);
    var a = TJSzereplok.angyal(aHely, P);
    var gt = gitar(P, el("g", {}, a.g));
    a.g.insertBefore(gt.g.parentNode, a.g.children[4]);                     /* a törzs elé, a karok mögé */
    gt.g.parentNode.setAttribute("transform", "translate(-6 -9) rotate(-34)");
    felho(P, csop, ELO, "fe");
    /* a felhő elején lógó lábak */
    var labak = el("g", {}, csop), lab = [];
    for (var i = 0; i < 2; i++) {
      var lg = el("g", {}, labak);
      el("path", { d: "M-4.4 0 L-3.8 22 L3.8 22 L4.4 0 Z", fill: "url(#" + P + "abor)", stroke: TUS, "stroke-width": 2, "stroke-linejoin": "round" }, lg);
      el("path", { d: "M-4.4 20 C-6 26 -2 30 4 29.4 C9 29 11.6 26.6 9.4 23.4 C7.6 21 3.6 21.4 3.8 19 Z", fill: "url(#" + P + "abor)", stroke: TUS, "stroke-width": 2, "stroke-linejoin": "round" }, lg);
      el("path", { d: "M-6 -3 C-2 -6 2 -6 6 -3 L5 3 C2 1 -2 1 -5 3 Z", fill: "url(#" + P + "kontos)", stroke: TUS, "stroke-width": 1.6, "stroke-linejoin": "round" }, lg);   /* a köntös szegélye */
      lab.push(lg);
    }
    var jegyek = [], kovetkezo = 0;
    var s = 1, xMin = 0, xMax = 0;
    var yAlap = 0;
    function elhelyez() {
      var o = oszlop.getBoundingClientRect(), r = h2.getBoundingClientRect(), sk = sek.getBoundingClientRect();
      var rg = document.createRange(); rg.selectNodeContents(h2); var rr = rg.getBoundingClientRect();
      var wr = (sek.querySelector(".wrap") || sek).getBoundingClientRect();
      var foto = sek.querySelector("figure"), fr = foto && foto.getBoundingClientRect();
      var dupla = fr && fr.left > o.right - 5;                              /* kéthasábos elrendezés: jobbra a fotó fölött üres a hely */
      var felso = sk.top - o.top + 84;                                      /* a szakaszelválasztó érme alatt */
      var MAG = 263, ALJ = 96;                                              /* az angyal teteje a felhő közepe fölött / a felhő alja alatta (egység) */
      s = o.width < 560 ? .24 : .4;
      if (dupla) {
        var also = fr.top - o.top - 10;
        s = Math.min(s, (also - felso) / (MAG + ALJ));
        yAlap = felso + MAG * s;
      } else {
        var also2 = r.bottom - o.top - 2;
        s = Math.min(s, Math.max(.16, (also2 - felso) / (MAG + ALJ)));
        yAlap = also2 - ALJ * s;
      }
      var fel = 440 * s;
      xMin = rr.right - o.left + fel * .55 + 16;
      if (dupla) xMin = Math.max(xMin, o.width - fel * .2);
      xMax = Math.max(xMin, wr.right - o.left - fel * .55 - 10);
      svg.setAttribute("width", o.width); svg.setAttribute("height", Math.max(10, r.bottom - o.top));
    }
    function rajz(t, all) {
      var ki = all ? .5 : .5 - .5 * Math.cos(2 * Math.PI * t / 30);        /* 30 mp alatt oda-vissza, lassan indul és áll meg */
      var x = xMin + (xMax - xMin) * ki, y = yAlap + (all ? 0 : 3 * Math.sin(t * 1.1));
      var dol = all ? 0 : 2.2 * Math.sin(2 * Math.PI * t / 30) + 1.2 * Math.sin(t * .9);
      csop.setAttribute("transform", "translate(" + f1(x) + " " + f1(y) + ") rotate(" + dol.toFixed(2) + ") scale(" + s + ")");
      /* zene: 2,2 ütés másodpercenként; pengetés le-fel */
      var BPM = 2.2, f = 2 * Math.PI * BPM * t, utes = all ? 0 : Math.sin(f);
      var akkord = all ? 0 : Math.floor(t * BPM / 4) % 3;                   /* négy ütésenként akkordváltás: a fogó kéz máshol fog */
      var fogX = [26, 22.5, 29.5][akkord];
      function gp(x2, y2) { var c = Math.cos(-34 * Math.PI / 180), sn = Math.sin(-34 * Math.PI / 180); return { x: -6 + x2 * c - y2 * sn, y: -9 + x2 * sn + y2 * c }; }
      var penget = gp(2.6, 5.5 * utes);
      var fog = gp(fogX, -2.2);
      var rezeg = all ? 0 : .9 * Math.abs(Math.cos(f)) * (.5 + .5 * Math.sin(t * 40));
      var hd = "";
      for (var h = 0; h < 6; h++) { var yy = -1.25 + h * .5; hd += "M-4.5 " + f1(yy) + " Q" + f1(16) + " " + f1(yy + (h % 2 ? rezeg : -rezeg) * .6) + " 36 " + f1(yy * .9) + " L42.4 " + f1(yy * 1.5) + " "; }
      gt.hurok.setAttribute("d", hd);
      a.rajzol({
        dolES: all ? 0 : 3 * Math.sin(f / 2),
        fejSzog: all ? 4 : 7 * Math.sin(f / 2) - 4,
        szarny: all ? -.35 : -.38 + .14 * Math.max(0, Math.sin(t * 1.7)) * Math.sin(t * 14),
        kezE: fog, kezH: penget,
        kifejezes: all ? "boldog" : (t % 9 < 6.5 ? "boldog" : "nyugodt"),
        ido: t
      });
      for (var l = 0; l < 2; l++) {
        var lx = l ? 9 : -9, sz = all ? 0 : (l ? 1 : -1) * 0 + 16 * Math.sin(f / 2 + l * 1.4);
        lab[l].setAttribute("transform", "translate(" + (6 + lx * AS * .8) + " -112) rotate(" + f1(sz) + ") scale(" + AS * .95 + ")");
      }
      /* hangjegyek */
      if (!all && t > kovetkezo) {
        kovetkezo = t + .75 + Math.random() * .5;
        var hg = el("path", { d: HANG[Math.random() < .6 ? 0 : 1], fill: TUS, stroke: TUS, "stroke-width": 1.2, "stroke-linecap": "round", "fill-rule": "nonzero" }, hangok);
        var gpont = gp(8, 0);
        jegyek.push({ e: hg, t0: t, x: x + (6 + gpont.x * AS) * s, y: y + (-AY + gpont.y * AS) * s, ir: Math.random() < .5 ? -1 : 1, sk: (.75 + Math.random() * .4) * (s / .4) });
      }
      for (var j = jegyek.length - 1; j >= 0; j--) {
        var q = jegyek[j], u = (t - q.t0) / 3.2;
        if (u > 1 || all) { q.e.remove(); jegyek.splice(j, 1); continue; }
        var nx = q.x + q.ir * (14 * u + 6 * Math.sin(u * 7)) * (s / .4), ny = q.y - 70 * u * (s / .4);
        q.e.setAttribute("transform", "translate(" + f1(nx) + " " + f1(ny) + ") rotate(" + f1(q.ir * 12 * Math.sin(u * 5)) + ") scale(" + (q.sk * (.6 + .5 * u)).toFixed(2) + ")");
        q.e.setAttribute("opacity", (Math.min(1, u * 6) * (1 - u) * .85).toFixed(2));
      }
    }
    elhelyez();
    window.addEventListener("resize", elhelyez);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(elhelyez);
    if (window.ResizeObserver) new ResizeObserver(elhelyez).observe(oszlop);
    lathatoFut(oszlop, rajz);
  }

  /* ======================= 2) alvó kisördög a keret tetején ======================= */
  function ordogJelenet() {
    var stats = document.querySelectorAll("#rolunk .stat");
    var keret = stats[1]; if (!keret) return;
    var szulo = keret.parentNode; if (szulo.__ordog) return; szulo.__ordog = true;
    if (getComputedStyle(szulo).position === "static") szulo.style.position = "relative";
    var P = "rjo-";
    var svg = el("svg", { "class": "rolunk-ordog", viewBox: "-60 -88 120 120", "aria-hidden": "true", focusable: "false" });
    svg.style.cssText = "position:absolute;pointer-events:none;overflow:visible;z-index:3";
    szulo.appendChild(svg);
    var zz = el("g", {}, svg);
    var fekvo = el("g", {}, svg);
    var o = TJSzereplok.ordog(fekvo, P);
    var Z = [];
    for (var i = 0; i < 3; i++) Z.push(el("text", { "font-family": "Georgia,'Times New Roman',serif", "font-style": "italic", "font-weight": 700, "font-size": 13, fill: TUS, stroke: "#fffaf0", "stroke-width": 2.4, "paint-order": "stroke", opacity: 0 }, zz));
    Z.forEach(function (z) { z.textContent = "Z"; });
    var k = 1;
    function elhelyez() {
      var r = keret.getBoundingClientRect(), d = szulo.getBoundingClientRect();
      k = Math.max(.5, Math.min(.64, r.width / 330));
      svg.style.width = (120 * k) + "px"; svg.style.height = (120 * k) + "px";
      svg.style.left = (r.right - d.left - 96 * k) + "px";
      svg.style.top = (r.top - d.top - 95 * k + 3) + "px";                    /* a csípő 7 egységgel a keret teteje fölött: ott ül */
    }
    function rajz(t, all) {
      var leg = all ? 0 : Math.sin(2 * Math.PI * t / 3.6);                  /* lassú lélegzés */
      var be = .5 + .5 * leg;
      fekvo.setAttribute("transform", "translate(0 " + f1(-.8 * be) + ")");
      /* bólintás: lassan előrebillen a feje, aztán egy kis rándulással visszakapja (kb. 9 mp-enként) */
      var c = all ? 0 : (t % 9) / 9, bolint = c < .85 ? 14 * c / .85 : 14 * (1 - (c - .85) / .15) * (1 - (c - .85) / .15);
      var rand = all ? 0 : Math.max(0, Math.sin(t * .7) - .96) * 25;          /* néha megrándul a farka */
      o.rajzol({
        torzsSzog: 5 + bolint * .25,
        fejSzog: 22 + bolint + 1.5 * leg,
        kezE: { x: 4, y: 3 + .6 * be }, kezH: { x: -4, y: 4 + .6 * be }, konyokE: 1, konyokH: -1,   /* keze az ölében */
        labE: { x: 6, y: 25 }, terdE: 1, labH: { x: -6, y: 25 }, terdH: -1,
        farokFazis: 2.2 + .25 * Math.sin(t * .8) + rand,
        kifejezes: "alszik", szajNyit: all ? .3 : .3 + .9 * be,
        tegez: false, kotelTekercs: false
      });
      for (var i = 0; i < 3; i++) {
        var u = all ? -1 : ((t / 3.6 + i / 3) % 1);
        if (u < 0) { Z[i].setAttribute("opacity", 0); continue; }
        var zx = 14 + 26 * u + 5 * Math.sin(u * 6), zy = -44 - 40 * u, sk = .6 + .9 * u;
        Z[i].setAttribute("transform", "translate(" + f1(zx) + " " + f1(zy) + ") rotate(" + f1(-12 + 18 * u) + ") scale(" + sk.toFixed(2) + ")");
        Z[i].setAttribute("opacity", (Math.min(1, u * 5) * (1 - u)).toFixed(2));
      }
    }
    elhelyez();
    window.addEventListener("resize", elhelyez);
    if (window.ResizeObserver) new ResizeObserver(elhelyez).observe(szulo);
    lathatoFut(szulo, rajz);
  }

  function indit() { if (!window.TJSzereplok) return; angyalJelenet(); ordogJelenet(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", indit); else indit();
  window.addEventListener("load", indit);
})();
