/* =====================================================================================================
   Főoldali fejléc-jelenet a hős-kép alján futó arany íven – „A kisördög elcsórja a bevásárlókocsit”
   -----------------------------------------------------------------------------------------------------
   1) A bevásárlókocsi üresen, a megszokott tempóban végiggurul balról jobbra (a kis kavicson megdöccen).
   2) Szünet után megrakodva jön vissza jobbról. Az út közepe előtt az első kereke felfut a kavicsra, a kocsi
      előrebukik, orra a földre csapódik (por), a dobozok, a tekercs és a csomagok kirepülnek, pattognak,
      gurulnak; a hátsó kerék a levegőben pörög tovább.
   3) Jobbról kiszalad a kisördög, megcsúszva fékez, vigyorogva szemügyre veszi a kocsit, felugrik a fogantyúra,
      a súlyával visszabillenti (döccen, por). Sebesen összeszedi a csomagokat: mindegyikért odafut, lehajol,
      a feje fölé emeli, és a háta mögött visszadobja a kocsiba.
   4) Visszaáll a fogantyúhoz, körbesandít, összedörzsöli a markát – és a kocsival (ugyanazon az íven) elszalad
      balra, mintha ellopná; ki a képből.
   5) Két másodperc múlva balról újra feltűnik, a kocsit tolva rohan befelé. Amikor a szakasz egyötödéhez ér,
      balról beront a lovas (Hunyadi, a Széchenyi téri szoborról): vágtázik, kivont kardját suhogtatja,
      a buzogányos öklét rázza. A kisördög hátranéz, „!”, rémülten, verejtékezve menekül; azonos sebességgel
      futnak ki jobbra. Szünet, és kezdődik elölről.
   A kocsi, a kisördög és a lovas pontosan az arany íven jár (a háttérkép pixeleiből kiolvasva), az út soha nem
   változik. Csak akkor fut, amikor látszik; a „kevesebb mozgás” beállításnál nincs jelenet.
   Kellékek: assets/terkep-szereplok.js (a kisördög csontváza), assets/illusztraciok/web/lovas-fejlec.svg.
   ===================================================================================================== */
(function () {
  "use strict";
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var par = document.querySelector(".hero .parade");
  if (!par || !window.TJSzereplok) return;
  var NS = "http://www.w3.org/2000/svg";
  var src = (document.currentScript && document.currentScript.src) || "";
  var LOVAS = (src ? src.replace(/fejlec-jelenet\.js.*$/, "") : "assets/") + "illusztraciok/web/lovas-fejlec.svg?v=1105a";

  function el(n, a, p) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
  function f(x) { return (Math.round(x * 100) / 100).toString(); }
  function cl(x, a, b) { a = a === undefined ? 0 : a; b = b === undefined ? 1 : b; return x < a ? a : x > b ? b : x; }
  function seg(t, a, b) { return cl((t - a) / (b - a)); }
  function lerp(a, b, u) { return a + (b - a) * u; }
  function eio(u) { return u * u * (3 - 2 * u); }
  function eo(u) { return 1 - (1 - u) * (1 - u) * (1 - u); }
  function ei(u) { return u * u * u; }
  function rnd(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  /* 2D affin mátrix: [a b c d e f] → x' = a x + c y + e, y' = b x + d y + f */
  function mm(A, B) { return [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]]; }
  function T(x, y) { return [1, 0, 0, 1, x, y]; }
  function Sc(x, y) { return [x, 0, 0, y, 0, 0]; }
  function R(deg) { var r = deg * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); return [c, s, -s, c, 0, 0]; }
  function Rp(deg, x, y) { return mm(T(x, y), mm(R(deg), T(-x, -y))); }
  function ap(M, p) { return { x: M[0] * p.x + M[2] * p.y + M[4], y: M[1] * p.x + M[3] * p.y + M[5] }; }
  function ms(M) { return "matrix(" + M.map(function (v) { return +v.toFixed(5); }).join(" ") + ")"; }

  /* ---------------- az arany ív: a háttérkép pixeleiből (mint eddig a kocsinál) ---------------- */
  function kepGorbe(cb) {
    var hero = par.closest(".hero"); if (!hero) return cb(null);
    var img = new Image();
    img.onload = function () {
      var c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
      var g = c.getContext("2d"); g.drawImage(img, 0, 0);
      var d; try { d = g.getImageData(0, 0, c.width, c.height).data; } catch (e) { return cb(null); }
      var W = c.width, H = c.height, pts = [];
      for (var x = 0; x < W; x += Math.max(2, W / 240 | 0)) {
        var best = -1, by = -1;
        for (var y = (H * .62) | 0; y < H; y++) { var i = (y * W + x) * 4, r = d[i], gg = d[i + 1], b = d[i + 2], s = (r - b) + (gg - b) * .5 + (r > 150 ? 40 : 0); if (r > 120 && r - b > 45 && s > best) { best = s; by = y; } }
        if (by > 0) pts.push([x, by]);
      }
      if (pts.length < 20) return cb(null);
      var sm = pts.map(function (p, k) { var a = 0, n = 0; for (var j = Math.max(0, k - 3); j <= Math.min(pts.length - 1, k + 3); j++) { a += pts[j][1]; n++; } return [p[0], a / n]; });
      cb(function () {
        var hr = hero.getBoundingClientRect(), pr = par.getBoundingClientRect(), cs = getComputedStyle(hero);
        var sc = Math.max(hr.width / W, hr.height / H), dw = W * sc, dh = H * sc;
        var px = (parseFloat((cs.backgroundPositionX || "50%").split(",")[0]) || 50) / 100, py = (parseFloat((cs.backgroundPositionY || "50%").split(",")[0]) || 50) / 100;
        var ox = hr.left + (hr.width - dw) * px, oy = hr.top + (hr.height - dh) * py;
        return function (xv) { var ix = (pr.left + xv - ox) / sc, k = 0; while (k < sm.length - 2 && sm[k + 1][0] < ix) k++; var a = sm[k], b = sm[k + 1] || a, t = b[0] === a[0] ? 0 : cl((ix - a[0]) / (b[0] - a[0])); return oy + (a[1] + (b[1] - a[1]) * t) * sc - pr.top; };
      });
    };
    img.onerror = function () { cb(null); };
    img.src = (getComputedStyle(hero).backgroundImage.match(/url\("?([^")]+)"?\)/) || [])[1] || "";
  }

  /* az arany hullámvonal (svg.sep) – ha van, ezt követi (a régi kocsi is ezt használta) */
  function sepGorbe() {
    var pr = par.getBoundingClientRect(), sep = null, best = 1e9;
    document.querySelectorAll("svg.sep path").forEach(function (pa) { var r = pa.getBoundingClientRect(), d = Math.abs(r.top - pr.bottom); if (r.width > pr.width * .6 && d < best && d < 160) { best = d; sep = pa; } });
    if (!sep) return null;
    var m = sep.getScreenCTM(), L = sep.getTotalLength(), pts = [];
    for (var i = 0; i <= 400; i++) { var q = sep.getPointAtLength(L * i / 400); pts.push([m.a * q.x + m.c * q.y + m.e - pr.left, m.b * q.x + m.d * q.y + m.f - pr.top]); }
    pts.sort(function (a, b) { return a[0] - b[0]; });
    return function (xv) { var k = 0; while (k < pts.length - 2 && pts[k + 1][0] < xv) k++; var A = pts[k], B = pts[k + 1], t = B[0] === A[0] ? 0 : cl((xv - A[0]) / (B[0] - A[0])); return A[1] + (B[1] - A[1]) * t; };
  }

  /* ---------------- a színpad ---------------- */
  var regi = par.querySelector(".kocsi");
  var svg = el("svg", { "class": "fj-szin", "aria-hidden": "true", focusable: "false" });
  svg.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible;pointer-events:none;z-index:3";
  var defs = el("defs", {}, svg);
  defs.innerHTML =
    '<filter id="fj-izz" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="0" stdDeviation="2.6" flood-color="#f4d58d" flood-opacity=".38"/><feDropShadow dx="0" dy="1.6" stdDeviation="1.2" flood-color="#000" flood-opacity=".45"/></filter>' +
    '<filter id="fj-arnyek" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="1.4" stdDeviation="1.4" flood-color="#000" flood-opacity=".42"/><feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#f4d58d" flood-opacity=".16"/></filter>' +
    '<radialGradient id="fj-fold"><stop offset="0" stop-color="#000814" stop-opacity=".55"/><stop offset=".6" stop-color="#000814" stop-opacity=".22"/><stop offset="1" stop-color="#000814" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="fj-por"><stop offset="0" stop-color="#fff1c8" stop-opacity=".85"/><stop offset=".55" stop-color="#e9c977" stop-opacity=".45"/><stop offset="1" stop-color="#e9c977" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="fj-ko" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#c9a65e"/><stop offset=".6" stop-color="#7a5a24"/><stop offset="1" stop-color="#3d2a0e"/></radialGradient>' +
    '<linearGradient id="fj-vonal" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f4d58d" stop-opacity="0"/><stop offset=".15" stop-color="#f4d58d" stop-opacity=".85"/><stop offset=".5" stop-color="#fff0c8"/><stop offset=".85" stop-color="#f4d58d" stop-opacity=".85"/><stop offset="1" stop-color="#f4d58d" stop-opacity="0"/></linearGradient>' +
    '<linearGradient id="fj-csepp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#9fd3ff"/></linearGradient>';
  var gArny = el("g", {}, svg), gKo = el("g", {}, svg), gKocsi = el("g", { filter: "url(#fj-izz)" }, svg),
    gTargy = el("g", { filter: "url(#fj-izz)" }, svg), gOrd = el("g", {}, svg), gLo = el("g", {}, svg), gPor = el("g", {}, svg);

  /* a kocsi: a régi rajz másolata, mozgatható kerekekkel és rakománnyal */
  var forras = regi && regi.querySelector("svg");
  var kocsi = el("g", { fill: "none", stroke: "currentColor", "stroke-width": "2.4", "stroke-linecap": "round", "stroke-linejoin": "round" }, gKocsi);
  kocsi.style.color = "#f4d58d";
  kocsi.innerHTML = forras ? forras.innerHTML : "";
  var kerek = kocsi.querySelectorAll(".ker");
  var KER_K = [{ x: 30, y: 56 }, { x: 70, y: 56 }], KER_R = 5.5, FOGAS = { x: 24, y: 44 };   /* felbukáskor itt fogja meg (a hátsó kerék szára) */
  var rak = kocsi.querySelector(".rak");
  if (rak) rak.style.display = "inline";
  /* a rakomány darabjai: a kocsiban a helyük (helyi középpont) és a méretük */
  var DB = [
    { n: 1, c: { x: 34, y: 15.5 }, r: 7.2, kor: false },
    { n: 2, c: { x: 51, y: 13 }, r: 8.2, kor: false },
    { n: 3, c: { x: 66, y: 16 }, r: 6, kor: true },
    { n: 4, c: { x: 39.6, y: 5.5 }, r: 5.4, kor: false },
    { n: 5, c: { x: 65.5, y: 4 }, r: 5.8, kor: false },
    { n: 6, c: { x: 77.8, y: 6.6 }, r: 5.4, kor: false }];
  /* a szatyor és az üveg: zárt, önmagukban is felismerhető rajz (a kocsiban és a földön is) */
  var r4 = kocsi.querySelector(".rak .r4"), r6 = kocsi.querySelector(".rak .r6");
  if (r4) r4.innerHTML = '<path d="M33.4 10 L34.8 1 H44.4 L45.6 10 Z"/><path d="M37.2 1 C37.2 -2.6 42 -2.6 42 1" stroke-width="1.3"/>';
  if (r6) r6.innerHTML = '<path d="M75.6 12 V6.4 L77 4 V1.2 H78.6 V4 L80 6.4 V12 Z"/><path d="M75.6 8.4 H80" stroke-width="1.1"/>';
  DB.forEach(function (d) {
    d.benn = kocsi.querySelector(".rak .r" + d.n);
    var g = el("g", { fill: "none", stroke: "currentColor", "stroke-width": "1.8", "stroke-linecap": "round", "stroke-linejoin": "round", opacity: 0 }, gTargy);
    g.style.color = "#f4d58d";
    var b = el("g", { transform: "translate(" + -d.c.x + " " + -d.c.y + ")" }, g);
    if (d.benn) b.innerHTML = d.benn.innerHTML;
    d.kint = g;
  });
  if (regi) regi.style.display = "none";

  /* árnyékok és a kavics */
  var aKocsi = el("ellipse", { fill: "url(#fj-fold)" }, gArny), aOrd = el("ellipse", { fill: "url(#fj-fold)" }, gArny), aLo = el("ellipse", { fill: "url(#fj-fold)" }, gArny);
  var ko = el("g", {}, gKo);
  el("path", { d: "M-5 1 C-5 -2.4 -2.6 -4 .2 -4 C3.2 -4 5 -2.2 5 1 Z", fill: "url(#fj-ko)", stroke: "#f4d58d", "stroke-width": ".7", "stroke-opacity": ".75" }, ko);
  el("path", { d: "M-2.4 -2.6 C-1.6 -3.3 -.4 -3.5 .6 -3.3", fill: "none", stroke: "#fff3d0", "stroke-width": ".6", "stroke-linecap": "round", opacity: ".8" }, ko);

  /* a kisördög */
  var ord = el("g", { opacity: 0 }, gOrd);
  var ordBelso = el("g", {}, ord);
  var O = TJSzereplok.ordog(ordBelso, "fjo-");
  var felkialt = el("g", { opacity: 0 }, ord);
  el("path", { d: "M-1.9 -14 L1.9 -14 L1.1 -2.6 L-1.1 -2.6 Z", fill: "#fff6d8", stroke: "#7a1c16", "stroke-width": ".9", "stroke-linejoin": "round" }, felkialt);
  el("circle", { cx: 0, cy: 1.6, r: 1.6, fill: "#fff6d8", stroke: "#7a1c16", "stroke-width": ".9" }, felkialt);
  var cseppek = [0, 1, 2].map(function () { return el("path", { d: "M0 -3.2 C1.6 -1 2.2 .4 2.2 1.2 C2.2 2.6 1.2 3.4 0 3.4 C-1.2 3.4 -2.2 2.6 -2.2 1.2 C-2.2 .4 -1.6 -1 0 -3.2 Z", fill: "url(#fj-csepp)", stroke: "#2b5b8a", "stroke-width": ".5", opacity: 0 }, ord); });
  var csikok = [0, 1, 2, 3].map(function () { return el("path", { fill: "none", stroke: "#f4d58d", "stroke-width": "1.6", "stroke-linecap": "round", opacity: 0 }, ord); });

  /* a lovas (betöltés után) */
  var lo = el("g", { opacity: 0 }, gLo), LQ = {}, loKesz = false;
  fetch(LOVAS).then(function (r) { return r.text(); }).then(function (txt) {
    var doc = new DOMParser().parseFromString(txt, "image/svg+xml");
    var sz = doc.getElementById("fl-szobor"); if (!sz) return;
    lo.appendChild(document.importNode(sz, true));
    ["lFF1", "lFF2", "lFF3", "lFF4", "lRF1", "lRF2", "lRF3", "lRF4", "lFN1", "lFN2", "lFN3", "lFN4", "lRN1", "lRN2", "lRN3", "lRN4", "kar", "kard", "takar", "csillan"].forEach(function (id) { LQ[id] = lo.querySelector("#fl-" + id); });
    lo.style.color = "#7d5a1e";
    loKesz = true;
  }).catch(function () {});

  /* porfelhő-készlet */
  var PORDB = 70, porok = [];
  for (var i = 0; i < PORDB; i++) porok.push(el("circle", { r: 0, fill: "url(#fj-por)", opacity: 0 }, gPor));

  par.appendChild(svg);

  /* =================================================================================================
     Idővonal – a méretekből számolva (asztali és mobil nézetben is ugyanaz a történet)
     ================================================================================================= */
  var gyf = null, G = null, emelV = 0;
  function gy(x) { return gyf ? gyf(x) - emelV : 40; }
  /* telefonon a hullámvonal a kép alján nem látszik: ott kicsit feljebb, saját arany vonalon járnak */
  var sajatVonal = el("path", { fill: "none", stroke: "url(#fj-vonal)", "stroke-width": "1.6", "stroke-linecap": "round", opacity: 0 }, gArny);
  function vonalIgazit() {
    var hero = par.closest(".hero"), pr = par.getBoundingClientRect(), hb = hero.getBoundingClientRect().bottom, W = par.clientWidth, mx = -1e9;
    emelV = 0;
    for (var x = 0; x <= W; x += 10) mx = Math.max(mx, gyf(x));
    if (W <= 700 && hb - (pr.top + mx) < 16) {
      emelV = 14 + (pr.top + mx) - hb + 10;
      var d = "";
      for (x = -4; x <= W + 4; x += 6) d += (d ? "L" : "M") + f(x) + " " + f(gy(x) + .3);
      sajatVonal.setAttribute("d", d); sajatVonal.setAttribute("opacity", 1);
    } else sajatVonal.setAttribute("opacity", 0);
  }
  var LOV = {   /* a lovas lábai: csípő (szobor-koordináta), szakaszhosszok */
    FF: { h: { x: 1520, y: 257 }, l: [47, 34.5, 12], e: 1, o: .34 },
    FN: { h: { x: 1549, y: 257 }, l: [47, 34.5, 12], e: 1, o: .46 },
    RF: { h: { x: 1694, y: 264 }, l: [45, 32, 12], e: 0, o: 0 },
    RN: { h: { x: 1737, y: 264 }, l: [45, 32, 12], e: 0, o: .1 } };

  function epit() {
    var W = par.clientWidth; if (!W || !gyf) { G = null; return; }
    var w = W <= 700 ? 58 : 78, K = w / 96;
    var g = { W: W, w: w, K: K, sd: .62 * K, sh: .34 * K };
    g.v0 = (W + 2 * w) / 17;                       /* a megszokott tempó */
    g.vD = g.v0 * 2.9;                             /* a kisördög futása */
    g.vS = g.v0 * 2.35;                            /* a lopott kocsival (és a lovas) */
    g.xp = W * .54;                                /* a kavics */
    g.kavH = 3.4 * K; g.kavW = 5.2 * K;
    var t = 0;
    g.A0 = 0; g.A1 = 17; g.B0 = g.A1 + 7;
    g.cTip = g.xp + 20 * K;                        /* az első kerék a kavics tetején */
    g.tTip = g.B0 + (W + w - g.cTip) / g.v0;
    g.TIPD = .62; g.csuszas = 7 * K;
    /* a felbukás végszöge: az orra (a kosár elülső felső sarka) leér a földre */
    var fi = 0, M;
    for (fi = 0; fi < 110; fi += .5) {
      M = kocsiM(g, g.cTip - g.csuszas, -1, fi);
      var sarok = ap(M, { x: 82, y: 18 });
      if (sarok.y >= gy(sarok.x) - 1.5) break;
    }
    g.fiMax = fi;
    g.tTipLe = g.tTip + g.TIPD;                    /* becsapódás */
    g.cLe = g.cTip - g.csuszas;
    /* a rakomány kirepül: fizikai szimuláció */
    g.db = DB.map(function (d, i) { return szim(g, d, i); });
    /* a kisördög terve */
    var terv = [], ox = W + 40 * g.sd, tt = g.tTip + 1.9;
    var Mfent = kocsiM(g, g.cLe, -1, g.fiMax), Hfent = ap(Mfent, { x: 9, y: 8 });
    /* a felbukott kocsi „hátsó” (felső) kereke mellé áll: azt ragadja meg */
    var Kfent = ap(Mfent, FOGAS);
    var xFog = Math.max(Kfent.x, ap(Mfent, { x: 30, y: 61.5 }).x) + 13 * g.sd;
    g.xFog = xFog;
    terv.push({ tip: "rejt", t0: -1, t1: tt });
    var d1 = (ox - xFog) / g.vD;
    terv.push({ tip: "fut", t0: tt, t1: tt + d1, x0: ox, x1: xFog, dd: -1, kif: "ravasz" }); tt += d1;
    terv.push({ tip: "fek", t0: tt, t1: tt + .32, x: xFog, dd: -1 }); tt += .32;
    terv.push({ tip: "nez", t0: tt, t1: tt + .55, x: xFog, dd: -1 }); tt += .55;
    terv.push({ tip: "billent", t0: tt, t1: tt + 1.15, x: xFog, dd: -1 }); g.tB1 = tt + .3; g.tB2 = tt + 1.0; tt += 1.15;
    /* a csomagok összeszedése: a kocsihoz legközelebbitől */
    var Mall = kocsiM(g, g.cLe, -1, 0);
    g.Mall = Mall;
    var sor = g.db.map(function (s, i) { return i; }).sort(function (a, b) { return Math.abs(g.db[a].veg.x - g.cLe) - Math.abs(g.db[b].veg.x - g.cLe); });
    var x = xFog;
    sor.forEach(function (i) {
      var s = g.db[i], cel = s.veg.x + 9 * g.sd, dd = cel < x ? -1 : 1, d = Math.abs(cel - x) / g.vD;
      if (d > .02) { terv.push({ tip: "fut", t0: tt, t1: tt + d, x0: x, x1: cel, dd: dd, kif: "ravasz" }); tt += d; }
      x = cel;
      terv.push({ tip: "felvesz", t0: tt, t1: tt + .62, x: x, dd: -1, i: i });
      s.tFel = tt + .2; s.tDob = tt + .5; s.tBe = tt + .5 + .48;
      s.cel = ap(Mall, DB[i].c); s.dobP = { x: x + 1 * g.sd, y: ordogTalaj(g, x) - 74 * g.sd };
      tt += .62;
    });
    var xTol = ap(Mall, { x: 9, y: 8 }).x + 25 * g.sd;
    g.xTol = xTol;
    var d2 = Math.abs(xTol - x) / g.vD;
    terv.push({ tip: "fut", t0: tt, t1: tt + d2, x0: x, x1: xTol, dd: xTol > x ? 1 : -1, kif: "elégedett" }); tt += d2;
    terv.push({ tip: "sandit", t0: tt, t1: tt + 1.35, x: xTol, dd: -1 }); tt += 1.35;
    /* lopás: a kocsival balra, ki a képből */
    g.tL0 = tt; g.acc = .45;
    var lopUt = g.cLe + w * .5 + 60 * g.sd + 20;
    g.tL1 = g.tL0 + lopUt / g.vS + g.acc / 2;
    terv.push({ tip: "lop", t0: g.tL0, t1: g.tL1 });
    tt = g.tL1 + 2;
    /* vissza balról, a lovas üldözi */
    g.tC0 = tt; g.cC0 = -(w * .5 + 60 * g.sd + 10);
    g.tLovas = g.tC0 + (W / 5 - g.cC0) / g.vS;    /* a kocsi a szakasz egyötödénél: beront a lovas */
    g.loFel = 215 * g.sh;
    g.xLo0 = -g.loFel - 12;
    g.tC1 = g.tLovas + (W + g.loFel + 30 - g.xLo0) / g.vS;
    terv.push({ tip: "menekul", t0: g.tC0, t1: g.tC1 });
    g.T = g.tC1 + 6;
    g.terv = terv;
    /* porfelhők */
    var pf = [];
    function por(t0, x, n, er, el2, mag, sz) { pf.push({ t0: t0, x: x, n: n, er: er, el: el2 || .7, mag: mag || 1, sz: sz || 1 }); }
    por(g.tTipLe, ap(kocsiM(g, g.cLe, -1, g.fiMax), { x: 82, y: 18 }).x, 7, 14 * K, .9, 1.2, 1.3);
    g.db.forEach(function (s) { if (s.leer) por(s.leer.t, s.leer.x, 3, 6 * K, .55, .8, .8); });
    terv.forEach(function (p) {
      if (p.tip === "fut") { for (var q = p.t0 + .05; q < p.t1; q += .22) por(q, lerp(p.x0, p.x1, (q - p.t0) / (p.t1 - p.t0)) - p.dd * 3 * g.sd, 2, 5 * K, .5, .6, .7); }
      if (p.tip === "fek") por(p.t0 + .05, p.x + 10 * g.sd, 5, 10 * K, .7, .9, 1.1);
    });
    por(g.tB2, g.cLe, 6, 18 * K, .8, 1, 1.1);
    for (var q = g.tL0 + .1; q < g.tL1; q += .2) por(q, ordX(g, q) + 6 * g.sd, 2, 6 * K, .5, .6, .7);
    for (q = g.tC0; q < g.tC1; q += .2) por(q, ordX(g, q) - 6 * g.sd, 2, 6 * K, .5, .6, .7);
    for (q = g.tLovas; q < g.tC1; q += .16) por(q, loX(g, q) - 100 * g.sh, 3, 9 * K, .6, .8, 1);
    g.porok = pf;
    G = g;
  }

  /* a kocsi mátrixa: c = a két kerék közepe (x), dir = haladási irány; fi = előrebukás (fok, az első kerék körül) */
  function kerekY(g, x) {
    var d = Math.abs(x - g.xp) / g.kavW;
    return gy(x) - 1 - (d < 1 ? g.kavH * Math.cos(d * Math.PI / 2) : 0);
  }
  function kocsiM(g, c, dir, fi) {
    var K = g.K, xr = c - dir * 20 * K, xf = c + dir * 20 * K;
    var yr = kerekY(g, xr), yf = kerekY(g, xf);
    var th = Math.atan2(dir * (yf - yr), dir * (xf - xr)) * 180 / Math.PI;
    var M = mm(T((xr + xf) / 2, (yr + yf) / 2 - KER_R * K * 0), mm(R(th), mm(Sc(dir * K, K), T(-50, -61.5))));
    if (fi) { var P = ap(M, { x: 70, y: 61.5 }); M = mm(Rp(dir * fi, P.x, P.y), M); }
    return M;
  }

  /* a kirepülő csomag pályája (ütközés az ívvel, pattogás, gurulás, megállás) */
  function szim(g, d, i) {
    var K = g.K, dt = 1 / 120, tl = g.tTip + .22 + i * .035;
    var fiL = g.fiMax * ei(seg(tl, g.tTip, g.tTip + g.TIPD));
    var M0 = kocsiM(g, lerp(g.cTip, g.cLe, eo(seg(tl, g.tTip, g.tTip + g.TIPD))), -1, fiL);
    var p = ap(M0, d.c), r0 = rnd(i + 3), r1 = rnd(i + 11);
    var vx = -(120 + 150 * r0) * K - (d.c.y < 8 ? 50 * K : 0), vy = -(90 + 110 * r1) * K, gr = 980 * K;
    var a = -fiL, w = -(280 + 380 * rnd(i + 21)), rr = d.r * K, ut = [], leer = null, nyug = false, ttt = 0;
    for (var s = 0; s < 4.2; s += dt) {
      if (!nyug) {
        vy += gr * dt; p.x += vx * dt; p.y += vy * dt; a += w * dt;
        var fy = gy(p.x) - 1 - rr;
        if (p.y >= fy) {
          p.y = fy;
          if (!leer) leer = { t: tl + s, x: p.x };
          if (Math.abs(vy) > 70 * K) { vy = -vy * .34; vx *= .62; w *= .5; }
          else {
            vy = 0; vx *= Math.exp(-(d.kor ? 1.4 : 7) * dt);
            var lejt = Math.atan2(gy(p.x + 2) - gy(p.x - 2), 4) * 180 / Math.PI;
            if (d.kor) { w = vx / rr * 180 / Math.PI; a += 0; }
            else { var cel = Math.round((a - lejt) / 90) * 90 + lejt; a += (cel - a) * Math.min(1, dt * 14); w *= .8; }
            if (Math.abs(vx) < 4 * K) { nyug = true; ttt = s; }
          }
        }
      }
      ut.push([p.x, p.y, a]);
    }
    return { tl: tl, dt: dt, ut: ut, veg: { x: p.x, y: p.y, a: a }, leer: leer, rr: rr };
  }

  /* a kisördög és a lovas helye a lopás / menekülés közben */
  function lopS(g, t) { var u = t - g.tL0; return u < g.acc ? g.vS * u * u / (2 * g.acc) : g.vS * (u - g.acc / 2); }
  function kocsiC(g, t) {
    if (t < g.tL0) return g.cLe;
    if (t < g.tL1 + .5) return g.cLe - lopS(g, t);
    return g.cC0 + g.vS * (t - g.tC0);
  }
  function ordX(g, t) {
    var c = kocsiC(g, t), dir = t < g.tC0 ? -1 : 1;
    return c - dir * (41 * g.K + 25 * g.sd);
  }
  function loX(g, t) { return g.xLo0 + g.vS * (t - g.tLovas); }

  /* ---------------- a kisördög pózai ---------------- */
  function ordogTalaj(g, x) { return gy(x) - 1 - 30.4 * g.sd; }
  function futPoz(st, ps, kar) {
    st.labE = { x: 11 * Math.sin(ps), y: 27 - 9 * Math.pow(Math.max(0, Math.cos(ps)), 1.4) };
    st.labH = { x: -11 * Math.sin(ps), y: 27 - 9 * Math.pow(Math.max(0, -Math.cos(ps)), 1.4) };
    st.terdE = -1; st.terdH = -1;
    if (kar) { st.kezE = { x: 10 - 10 * Math.sin(ps), y: -10 - 5 * Math.cos(ps) }; st.kezH = { x: -4 + 10 * Math.sin(ps), y: -10 + 5 * Math.cos(ps) }; st.konyokE = -1; st.konyokH = -1; }
    return 2.4 * Math.abs(Math.sin(ps));
  }

  /* =================================================================================================
     Rajzolás egy adott pillanatban
     ================================================================================================= */
  var porN = 0, hol = {};
  function rajzol(t) {
    var g = G; if (!g) return;
    var K = g.K, W = g.W, w = g.w;
    t = ((t % g.T) + g.T) % g.T;
    /* ---- kavics ---- */
    ko.setAttribute("transform", "translate(" + f(g.xp) + " " + f(gy(g.xp) - 1) + ") scale(" + f(K * 1.05) + ")");

    /* ---- kocsi ---- */
    var kl = false, c = 0, dir = 1, fi = 0, ut = 0, tip = false, hatsoPorog = 0, rakVan = [false, false, false, false, false, false];
    if (t < g.A1) { kl = true; c = -w + g.v0 * t; dir = 1; ut = c; }
    else if (t >= g.B0 && t < g.tTip) { kl = true; c = W + w - g.v0 * (t - g.B0); dir = -1; ut = W + w - c; rakVan = rakVan.map(function () { return true; }); }
    else if (t >= g.tTip && t < g.tL0) {
      kl = true; dir = -1; tip = true;
      var u = seg(t, g.tTip, g.tTip + g.TIPD);
      c = lerp(g.cTip, g.cLe, eo(u));
      if (t < g.tTip + g.TIPD) fi = g.fiMax * ei(u) * (1 + .0 * u);
      else if (t < g.tB1) { var b = t - g.tTipLe; fi = g.fiMax - 7 * Math.exp(-b * 9) * Math.abs(Math.sin(b * 16)); }
      else if (t < g.tB2) { var ub = seg(t, g.tB1, g.tB2); fi = g.fiMax * (1 - ei(ub)); }
      else { var bb = t - g.tB2; fi = -2.4 * Math.exp(-bb * 7) * Math.sin(bb * 22); }
      ut = W + w - g.cTip;
      hatsoPorog = t < g.tB2 ? 900 * (1 - Math.exp(-(t - g.tTip) / .9)) : 900;
      for (var i = 0; i < 6; i++) { var s = g.db[i]; rakVan[i] = t < s.tl || (s.tBe && t >= s.tBe); }
    }
    else if (t >= g.tL0 && t < g.tL1) { kl = true; dir = -1; c = kocsiC(g, t); ut = W + w - g.cTip + 900 / (KER_R * K) + (g.cLe - c); rakVan = rakVan.map(function () { return true; }); }
    else if (t >= g.tC0 && t < g.tC1) { kl = true; dir = 1; c = kocsiC(g, t); ut = c; rakVan = rakVan.map(function () { return true; }); }
    kocsi.setAttribute("opacity", kl ? .96 : 0);
    var M = null;
    if (kl) {
      M = kocsiM(g, c, dir, fi);
      kocsi.setAttribute("transform", ms(M));
      var szogE = ut / (KER_R * K) * 180 / Math.PI;
      if (kerek[0]) kerek[0].setAttribute("transform", "rotate(" + f(szogE + hatsoPorog) + " 30 56)");
      if (kerek[1]) kerek[1].setAttribute("transform", "rotate(" + f(szogE) + " 70 56)");
      DB.forEach(function (d, i) { if (d.benn) d.benn.style.display = rakVan[i] ? "" : "none"; });
      var am = ap(M, { x: 50, y: 61.5 });
      aKocsi.setAttribute("cx", f(am.x)); aKocsi.setAttribute("cy", f(gy(am.x) + 1)); aKocsi.setAttribute("rx", f(34 * K * (1 - fi / 220))); aKocsi.setAttribute("ry", f(3.2 * K)); aKocsi.setAttribute("opacity", 1);
    } else aKocsi.setAttribute("opacity", 0);

    /* ---- a kisördög ---- */
    var st = { farokFazis: t * 7, kifejezes: "ravasz", nez: { x: 1, y: 0 }, torzsSzog: 0, fejSzog: 0, tegez: false },
      ox = 0, oy = 0, dd = 1, lathato = false, kiPar = 0, cseppOp = 0, csikOp = 0, ugras = 0;
    var terv = null;
    if (t >= g.tL0 && t < g.tL1 + .3) terv = { tip: "lop" };
    else if (t >= g.tC0 && t < g.tC1) terv = { tip: "menekul" };
    else for (var j = 0; j < g.terv.length; j++) { var p = g.terv[j]; if (t >= p.t0 && t < p.t1 && p.tip !== "lop" && p.tip !== "menekul") { terv = p; break; } }
    function lok(P) { return { x: (P.x - ox) / (dd * g.sd), y: (P.y - oy) / g.sd }; }
    function vil(P) { return { x: ox + P.x * dd * g.sd, y: oy + P.y * g.sd }; }
    var tartott = -1, tartPont = null;
    if (terv && terv.tip !== "rejt") {
      lathato = true;
      if (terv.tip === "fut") {
        var uu = seg(t, terv.t0, terv.t1); ox = lerp(terv.x0, terv.x1, uu); dd = terv.dd;
        var ps = Math.abs(ox) / (34 * g.sd) * Math.PI;
        var bob = futPoz(st, ps, true);
        oy = ordogTalaj(g, ox) - bob * g.sd; st.torzsSzog = 14; st.kifejezes = terv.kif || "ravasz"; st.fejSzog = 4;
        csikOp = .55;
      } else if (terv.tip === "fek") {
        var uf = seg(t, terv.t0, terv.t1); dd = terv.dd; ox = terv.x;
        oy = ordogTalaj(g, ox) + 2 * g.sd * Math.sin(uf * Math.PI);
        st.torzsSzog = -16 * Math.sin(uf * Math.PI); st.labE = { x: 14, y: 25 }; st.labH = { x: 4, y: 27 }; st.terdE = -1; st.terdH = -1;
        st.kezE = { x: 4, y: -38 }; st.kezH = { x: -16, y: -30 }; st.konyokE = -1; st.konyokH = 1; st.kifejezes = "rémült";
      } else if (terv.tip === "nez") {
        var un = seg(t, terv.t0, terv.t1); ox = terv.x; dd = terv.dd; oy = ordogTalaj(g, ox);
        st.kifejezes = "ravasz"; st.nez = { x: un < .5 ? 1 : .6, y: un < .5 ? -.4 : -1 }; st.fejSzog = -8 - 4 * Math.sin(un * 9);
        st.kezE = { x: 10, y: 0 }; st.kezH = { x: -6, y: -40 }; st.konyokE = 1; st.konyokH = 1;   /* „hm”: állát vakarja */
        st.labE = { x: 7, y: 27 }; st.labH = { x: -6, y: 27 };
      } else if (terv.tip === "billent") {
        ox = terv.x; dd = terv.dd;
        var H0 = M ? ap(M, FOGAS) : { x: ox, y: 0 };
        var talaj = ordogTalaj(g, ox);
        var ug = seg(t, terv.t0, terv.t0 + .3);
        if (t < terv.t0 + .3) {   /* felugrik a fogantyúra */
          var hcel = H0.y + 54 * g.sd;
          oy = lerp(talaj, Math.min(talaj, hcel), eo(ug)) - Math.sin(ug * Math.PI) * 10 * g.sd;
          st.kezE = lok({ x: H0.x, y: H0.y + lerp(30, 0, ug) * g.sd }); st.kezH = lok({ x: H0.x - 2, y: H0.y + lerp(30, 0, ug) * g.sd });
          st.labE = { x: 6, y: 20 }; st.labH = { x: -6, y: 18 };
        } else {
          oy = Math.min(talaj, H0.y + 54 * g.sd);
          st.kezE = lok({ x: H0.x + 1, y: H0.y }); st.kezH = lok({ x: H0.x - 1.5, y: H0.y + 1 });
          var lent = oy >= talaj - .5;
          st.labE = lent ? { x: 10, y: 26 } : { x: 7 + 3 * Math.sin(t * 20), y: 22 }; st.labH = lent ? { x: -2, y: 27 } : { x: -6 - 3 * Math.sin(t * 20), y: 21 };
        }
        st.konyokE = 1; st.konyokH = 1; st.torzsSzog = -10; st.kifejezes = t < g.tB2 ? "erőlködik" : "elégedett"; st.nez = { x: -.6, y: -1 };
      } else if (terv.tip === "felvesz") {
        var i2 = terv.i, s2 = g.db[i2], uv = t - terv.t0; ox = terv.x; dd = terv.dd;
        var talaj2 = ordogTalaj(g, ox);
        var targy = { x: s2.veg.x, y: s2.veg.y };
        if (uv < .2) {   /* lehajol */
          var a1 = eio(uv / .2); oy = talaj2 + 7 * g.sd * a1; st.torzsSzog = 34 * a1;
          st.kezE = lok({ x: lerp(ox - 8 * g.sd * dd, targy.x, a1), y: lerp(oy - 10 * g.sd, targy.y, a1) }); st.kezH = lok({ x: lerp(ox, targy.x + 3, a1), y: lerp(oy - 8 * g.sd, targy.y, a1) });
          st.labE = { x: 10, y: 22 }; st.labH = { x: -8, y: 22 }; st.kifejezes = "ravasz";
        } else if (uv < .45) {   /* a feje fölé emeli */
          var a2 = eio((uv - .2) / .25); oy = talaj2 + 7 * g.sd * (1 - a2); st.torzsSzog = 34 * (1 - a2) - 8 * a2;
          var fent = { x: ox + 2 * g.sd * dd, y: talaj2 - 76 * g.sd };
          var kp = { x: lerp(targy.x, fent.x, a2), y: lerp(targy.y, fent.y, a2) - Math.sin(a2 * Math.PI) * 6 * g.sd };
          st.kezE = lok({ x: kp.x + 4 * g.sd, y: kp.y + 3 * g.sd }); st.kezH = lok({ x: kp.x - 4 * g.sd, y: kp.y + 3 * g.sd });
          st.labE = { x: 9, y: 24 + 3 * a2 }; st.labH = { x: -8, y: 24 + 3 * a2 }; st.kifejezes = "erőlködik";
          tartott = i2; tartPont = kp;
        } else {   /* hátradobja a válla fölött a kocsiba */
          var a3 = seg(uv, .45, .62); oy = talaj2 - Math.sin(a3 * Math.PI) * 3 * g.sd; st.torzsSzog = -8 - 14 * Math.sin(a3 * Math.PI);
          st.kezE = { x: lerp(2, -14, eo(a3)), y: lerp(-76, -58, a3) }; st.kezH = { x: lerp(-4, -18, eo(a3)), y: lerp(-74, -52, a3) };
          st.konyokE = 1; st.konyokH = 1; st.labE = { x: 9, y: 27 }; st.labH = { x: -8, y: 27 }; st.kifejezes = "elégedett"; st.nez = { x: -1, y: -.4 };
          if (uv < .5) { tartott = i2; tartPont = vil({ x: -1, y: -72 }); }
        }
      } else if (terv.tip === "sandit") {
        var us = t - terv.t0; ox = terv.x; dd = terv.dd; oy = ordogTalaj(g, ox);
        var Hs = ap(g.Mall, { x: 9, y: 8 });
        var jobbra = Math.floor(us / .34) % 2 === 0;
        st.kifejezes = "ravasz"; st.nez = { x: jobbra ? 1 : -1, y: -.1 }; st.fejSzog = jobbra ? 10 : -10;
        if (us < .95) {   /* összedörzsöli a markát */
          var dz = Math.sin(us * 30) * 3;
          st.kezE = { x: 4 + dz, y: -14 }; st.kezH = { x: -2 - dz, y: -13 }; st.konyokE = 1; st.konyokH = -1;
        } else { var ak = eio(seg(us, .95, 1.25)); st.kezE = { x: lerp(4, lok(Hs).x, ak), y: lerp(-14, lok(Hs).y, ak) }; st.kezH = { x: lerp(-2, lok(Hs).x - 2, ak), y: lerp(-13, lok(Hs).y + 1, ak) }; st.konyokE = -1; st.konyokH = -1; }
        st.labE = { x: 6, y: 27 }; st.labH = { x: -6, y: 27 }; st.torzsSzog = 6;
        oy -= Math.abs(Math.sin(us * 10)) * .6 * g.sd;
      } else if (terv.tip === "lop" || terv.tip === "menekul") {
        dd = terv.tip === "lop" ? -1 : 1; ox = ordX(g, t);
        var psl = Math.abs(ox) / (40 * g.sd) * Math.PI;
        var bob2 = futPoz(st, psl, false);
        oy = ordogTalaj(g, ox) - bob2 * g.sd;
        var Hl = M ? ap(M, { x: 9, y: 8 }) : { x: ox, y: oy };
        st.kezE = lok({ x: Hl.x, y: Hl.y }); st.kezH = lok({ x: Hl.x - dd * 2 * g.sd, y: Hl.y + 1.5 * g.sd }); st.konyokE = -1; st.konyokH = -1;
        st.torzsSzog = 20; csikOp = 1;
        if (terv.tip === "lop") { st.kifejezes = "ravasz"; st.fejSzog = 6; }
        else {
          var lu = t - g.tLovas;
          if (lu > -.15 && lu < .5) { kiPar = Math.min(1, (lu + .15) / .12); }
          if (lu > 0) { st.kifejezes = "rémült"; st.nez = { x: -1, y: -.1 }; st.fejSzog = -14 + 5 * Math.sin(t * 13); cseppOp = 1; }
          else { st.kifejezes = "ravasz"; st.fejSzog = 6; }
        }
      }
    }
    hol = { ox: lathato ? ox : null, oy: oy, c: kl ? c : null };
    ord.setAttribute("opacity", lathato ? 1 : 0);
    if (lathato) {
      var kezek = O.rajzol(st);
      ord.setAttribute("transform", "translate(" + f(ox) + " " + f(oy) + ") scale(" + f(dd * g.sd) + " " + f(g.sd) + ")");
      aOrd.setAttribute("cx", f(ox)); aOrd.setAttribute("cy", f(gy(ox) + 1)); aOrd.setAttribute("rx", f(15 * g.sd)); aOrd.setAttribute("ry", f(3 * g.sd)); aOrd.setAttribute("opacity", 1);
      felkialt.setAttribute("opacity", kiPar ? f(kiPar * (t - g.tLovas < .55 ? 1 : 0)) : 0);
      felkialt.setAttribute("transform", "translate(12 -86) scale(" + f(.8 + .5 * kiPar) + ") rotate(10)");
      cseppek.forEach(function (cs, k2) {
        var fz = (t * 1.6 + k2 / 3) % 1;
        cs.setAttribute("opacity", f(cseppOp * Math.sin(fz * Math.PI)));
        cs.setAttribute("transform", "translate(" + f(-10 - fz * 22 - k2 * 3) + " " + f(-64 - Math.sin(fz * Math.PI) * 10 + fz * 12 + k2 * 6) + ") rotate(" + f(-40 - fz * 40) + ")");
      });
      csikok.forEach(function (cs, k3) {
        var yy = -46 + k3 * 14, ff = (t * 3 + k3 * .37) % 1;
        cs.setAttribute("d", "M" + f(-26 - ff * 8) + " " + yy + " h" + f(-12 - 8 * Math.sin(k3 + t * 5)));
        cs.setAttribute("opacity", f(csikOp * (.35 + .4 * Math.sin(ff * Math.PI))));
      });
    } else aOrd.setAttribute("opacity", 0);

    /* ---- a rakomány darabjai a kocsin kívül ---- */
    DB.forEach(function (d, i) {
      var s = g.db[i], g2 = d.kint, P = null, a = 0;
      if (t >= g.tTip && t < g.tL0 && t >= s.tl && !(s.tBe && t >= s.tBe)) {
        if (s.tFel && t >= s.tFel && t < s.tDob) { P = tartott === i && tartPont ? tartPont : { x: s.veg.x, y: s.veg.y }; a = (t - s.tFel) * 160; }
        else if (s.tDob && t >= s.tDob) {   /* repül vissza a kocsiba */
          var ud = seg(t, s.tDob, s.tBe), P0 = s.dobP;
          var Pc = s.cel, mag = Math.max(26 * K, Math.abs(Pc.x - P0.x) * .45);
          P = { x: lerp(P0.x, Pc.x, ud), y: lerp(P0.y, Pc.y, ud) - Math.sin(ud * Math.PI) * mag }; a = 360 * ud * (i % 2 ? 1 : -1);
        } else {
          var k = Math.min(s.ut.length - 1, Math.floor((t - s.tl) / s.dt)), q = s.ut[k];
          P = { x: q[0], y: q[1] }; a = q[2];
        }
      }
      if (P) { g2.setAttribute("opacity", 1); g2.setAttribute("transform", "translate(" + f(P.x) + " " + f(P.y) + ") rotate(" + f(a) + ") scale(" + f(-K) + " " + f(K) + ")"); }
      else g2.setAttribute("opacity", 0);
    });

    /* ---- a lovas ---- */
    var lv = loKesz && t >= g.tLovas && t < g.tC1;
    lo.setAttribute("opacity", lv ? 1 : 0);
    if (lv) {
      var xh = loX(g, t), sh = g.sh, dist = xh - g.xLo0, uu2 = (dist / (300 * sh)) % 1;
      var lab = {}, mely = -1e9;
      ["FF", "FN", "RF", "RN"].forEach(function (L) {
        var l = LOV[L], p2 = ((uu2 - l.o) % 1 + 1) % 1, a1, a2, a3, ST = .32;
        var A = l.e ? 42 : 28, B = l.e ? -28 : -46;
        if (p2 < ST) { var s3 = p2 / ST; a1 = A + (B - A) * s3; a2 = l.e ? -4 * Math.sin(Math.PI * s3) : 8 + 6 * Math.sin(Math.PI * s3); a3 = -28 * Math.sin(Math.PI * s3); }
        else { var q2 = (p2 - ST) / (1 - ST), e2 = eio(q2), fo = Math.pow(Math.sin(Math.PI * Math.min(1, q2 * 1.15)), .9); a1 = B + (A - B) * e2; a2 = l.e ? -105 * fo : 8 + 70 * fo; a3 = l.e ? 55 * fo : -40 * fo; }
        var a4 = -(a1 + a2 + a3) * (p2 < ST ? 1 : .5);
        lab[L] = [a1, a2, a3, a4];
        /* paták helye (előre számolt kinematika) */
        var x = l.h.x, y = l.h.y, sz = 0;
        for (var j2 = 0; j2 < 3; j2++) { sz += lab[L][j2]; var rr = sz * Math.PI / 180; x += -Math.sin(rr) * l.l[j2]; y += Math.cos(rr) * l.l[j2]; }
        sz += a4; var r4 = sz * Math.PI / 180; y += Math.cos(r4) * 10 + Math.sin(r4) * 0;
        if (y > mely) mely = y;
      });
      var bil = 3.2 * Math.sin((uu2 - .08) * Math.PI * 2), emel = 7 * Math.max(0, Math.sin((uu2 - .55) / .45 * Math.PI)) * (uu2 > .55 ? 1 : 0);
      var Mh = mm(T(xh, gy(xh) - 1), mm(Sc(-sh, sh), mm(T(0, -emel), mm(T(-1625, -mely), Rp(bil, 1625, 290)))));
      lo.setAttribute("transform", ms(Mh)); hol.mely = mely; hol.lab = lab;
      ["FF", "FN", "RF", "RN"].forEach(function (L) { for (var j3 = 0; j3 < 4; j3++) { var e3 = LQ["l" + L + (j3 + 1)]; if (e3) e3.setAttribute("transform", "rotate(" + f(lab[L][j3]) + ")"); } });
      var kardSz = -36 + 30 * Math.sin(t * 7.5) + 9 * Math.sin(t * 13.1);
      if (LQ.kard) { LQ.kard.setAttribute("transform", "translate(1610 126) rotate(" + f(kardSz) + ") scale(1.3)"); LQ.kard.setAttribute("opacity", 1); }
      if (LQ.takar) LQ.takar.setAttribute("opacity", 1);
      if (LQ.kar) LQ.kar.setAttribute("transform", "rotate(" + f(5 + 7 * Math.sin(t * 11)) + " 1601 101)");
      if (LQ.csillan) { var cs2 = Math.max(0, Math.sin(t * 7.5 - .4)); cs2 = Math.pow(cs2, 8); LQ.csillan.setAttribute("opacity", f(cs2)); LQ.csillan.setAttribute("transform", "translate(0 -116) scale(" + f(.4 + cs2) + ") rotate(" + f(t * 200) + ")"); }
      aLo.setAttribute("cx", f(xh)); aLo.setAttribute("cy", f(gy(xh) + 1)); aLo.setAttribute("rx", f(170 * sh)); aLo.setAttribute("ry", f(9 * sh)); aLo.setAttribute("opacity", 1);
    } else aLo.setAttribute("opacity", 0);

    /* ---- porfelhők ---- */
    var n = 0;
    for (var pi = 0; pi < g.porok.length && n < PORDB; pi++) {
      var pp = g.porok[pi], kor = t - pp.t0;
      if (kor < 0 || kor > pp.el) continue;
      var uk = kor / pp.el;
      for (var m = 0; m < pp.n && n < PORDB; m++, n++) {
        var r5 = rnd(pi * 7 + m), r6 = rnd(pi * 13 + m * 3);
        var px = pp.x + (r5 - .5) * pp.er * (.6 + uk * 1.6), py = gy(pp.x) - 1 - (2 + r6 * 6 + uk * 10 * pp.mag) * K;
        var e4 = porok[n];
        e4.setAttribute("cx", f(px)); e4.setAttribute("cy", f(py)); e4.setAttribute("r", f((3 + 5 * uk) * K * pp.sz * (.7 + r6 * .6)));
        e4.setAttribute("opacity", f((1 - uk) * .75));
      }
    }
    for (var z = n; z < porN; z++) porok[z].setAttribute("opacity", 0);
    porN = n;
  }

  /* ---------------- indítás ---------------- */
  var t0 = performance.now() - 0, latszik = true, rogzitett = null;
  function lep(now) {
    requestAnimationFrame(lep);
    if (!latszik || document.hidden) return;
    rajzol(rogzitett !== null ? rogzitett : (now - t0) / 1000);
  }
  function inditas(fn) {
    if (!fn) { if (regi) regi.style.display = ""; svg.remove(); return; }
    var frissit = function () { gyf = fn(); vonalIgazit(); epit(); };
    frissit();
    addEventListener("resize", function () { clearTimeout(frissit.t); frissit.t = setTimeout(frissit, 150); });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { latszik = e[0].isIntersecting; }, { rootMargin: "80px" }).observe(par);
    requestAnimationFrame(lep);
  }
  if (sepGorbe()) inditas(sepGorbe); else kepGorbe(inditas);
  /* teszteléshez: PTG_JELENET.ido(mp) egy pillanatra rögzít, PTG_JELENET.ido(null) folytatja */
  window.PTG_JELENET = { gy: function (x) { return gy(x); }, ido: function (s) { rogzitett = s; if (s !== null) rajzol(s); }, adat: function () { return G; }, hol: function () { var r = par.getBoundingClientRect(); return { mely: hol.mely, lab: hol.lab, x: hol.ox !== null && hol.ox !== undefined ? hol.ox : hol.c, y: r.top + scrollY + (hol.oy || 0), px: r.left, gy: r.top + scrollY + gy(hol.ox || hol.c || 0) }; } };
})();
