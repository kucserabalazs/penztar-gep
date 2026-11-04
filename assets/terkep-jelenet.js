/* ==========================================================================
   Térkép helye (főoldal) – „A kisördög és a kisangyal” jelenet
   - A kisördög balról besettenkedik, felmászik a TV-torony csúcsára, kötéllel kötött nyilat lő át
     a székesegyház főtornyának keresztjére, a kötél megakad, és ő elindul rajta át.
   - Mikor már majdnem odaér, a bal hátsó toronyból észreveszi a kisangyal, odarepül, és ollóval elvágja a kötelet.
   - A kisördög a kötél végét fogva lezuhan; közben a torony teteje felé hajlik, jól elgörbül,
     majd gumiként visszaugrik, és csúzliként kilövi az ördögöt balra felfelé, aki lassan eltűnik a távolban.
   A TV-torony itt nem háttérkép, hanem a rajzba ágyazva él (ugyanott, ugyanakkora), hogy hajlani tudjon.
   A helyeket és méreteket a dzsami-hely.js-sel azonos képletek adják; minden képkockánál újraszámol.
   Csak akkor fut, ha a doboz látszik; mozgáscsökkentést kérő gépen nem indul el (marad az álló torony).
   ========================================================================== */
(function () {
  if (window.__terkepJelenet) return; window.__terkepJelenet = true;
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var NS = "http://www.w3.org/2000/svg", T = 32;      /* ciklusidő (mp) */
  var TORONY = "assets/illusztraciok/web/tv-torony-szepia-allo.svg?v=1104";
  var box, svg, torony, tvG = {}, csucsJel, kotel, nyil, ordog, angyal, felkialt, ollo, szikrak, rdy = false;
  var NAVY = "#2b3c53", PIROS = "#a8322a", ARANY = "#c9973f", PAPIR = "#fbf6ea";

  function el(n, a, p) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function ease(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeIn(t) { return t * t * t; }

  /* ---- geometria: ugyanaz, mint a dzsami-hely.js-ben ---- */
  function geo() {
    var r = box.getBoundingClientRect(), W = r.width, H = r.height;
    var mobil = matchMedia("(max-width:760px)").matches;
    var ht = mobil ? .54 * H : Math.min(.86 * H, 440), wt = ht * 448.667 / 1469.33;
    var hc = mobil ? .54 * H * 1.00192 - .01 : Math.min(.86 * H, 440) * 1.00192 - 2.01, wc = hc * 1139 / 995.333;
    var szx = (W - wc) * (mobil ? .98 : .97), szy = H + (mobil ? 3 : 4) - hc;
    var tvx = parseFloat(box.style.getPropertyValue("--tv-bal")) || 0, tvy = H + (mobil ? 4 : 6) - ht;
    return { W: W, H: H, r: r, ht: ht, wt: wt, tvx: tvx, tvy: tvy,
      talp: { x: tvx + wt * .5022, y: H - 2 },
      kereszt: { x: szx + wc * .5522, y: szy + hc * .03 },
      hatso: { x: szx + wc * .3942, y: szy + hc * .4462 },
      s: Math.max(18, ht * .105) };
  }

  /* ---- szereplők ---- */
  function ordogRajz(p) {
    var g = el("g", { "class": "tj-ordog" }, p);
    var test = el("g", {}, g);
    var farok = el("path", { d: "M-.12 -.38 C-.45 -.35 -.5 -.1 -.38 .02", fill: "none", stroke: NAVY, "stroke-width": .055, "stroke-linecap": "round" }, test);
    var farokVeg = el("path", { d: "M-.38 .02 l-.08 .02 l.05 -.09 z", fill: PIROS, stroke: PIROS, "stroke-width": .03, "stroke-linejoin": "round" }, test);
    var labB = el("line", { stroke: NAVY, "stroke-width": .07, "stroke-linecap": "round" }, test);
    var labJ = el("line", { stroke: NAVY, "stroke-width": .07, "stroke-linecap": "round" }, test);
    el("path", { d: "M-.17 -.3 C-.2 -.5 -.15 -.66 0 -.66 C.15 -.66 .2 -.5 .17 -.3 C.1 -.26 -.1 -.26 -.17 -.3 Z", fill: PAPIR, stroke: NAVY, "stroke-width": .05, "stroke-linejoin": "round" }, test);
    var karB = el("line", { stroke: NAVY, "stroke-width": .065, "stroke-linecap": "round" }, test);
    var karJ = el("line", { stroke: NAVY, "stroke-width": .065, "stroke-linecap": "round" }, test);
    var fej = el("g", {}, test);
    el("path", { d: "M-.1 -.92 L-.16 -1.08 L-.03 -.96 Z M.1 -.92 L.16 -1.08 L.03 -.96 Z", fill: PIROS, stroke: PIROS, "stroke-width": .03, "stroke-linejoin": "round" }, fej);
    el("circle", { cx: 0, cy: -.8, r: .16, fill: PAPIR, stroke: NAVY, "stroke-width": .05 }, fej);
    el("path", { d: "M-.07 -.83 l.03 .02 M.05 -.83 l.03 .02 M-.07 -.74 C-.03 -.7 .04 -.7 .08 -.75", fill: "none", stroke: NAVY, "stroke-width": .035, "stroke-linecap": "round" }, fej);
    var ij = el("g", { opacity: 0 }, test);
    el("path", { d: "M.18 -.85 C.42 -.72 .42 -.32 .18 -.2", fill: "none", stroke: "#7a5a2a", "stroke-width": .05, "stroke-linecap": "round" }, ij);
    var hur = el("line", { x1: .18, y1: -.85, x2: .18, y2: -.2, stroke: NAVY, "stroke-width": .02 }, ij);
    return { g: g, test: test, labB: labB, labJ: labJ, karB: karB, karJ: karJ, fej: fej, ij: ij, hur: hur };
  }
  function angyalRajz(p) {
    var g = el("g", { "class": "tj-angyal" }, p);
    var szB = el("path", { d: "M-.05 -.6 C-.25 -.8 -.5 -.82 -.55 -.7 C-.5 -.6 -.4 -.52 -.06 -.48 Z", fill: PAPIR, stroke: NAVY, "stroke-width": .045, "stroke-linejoin": "round" }, g);
    var szJ = el("path", { d: "M.05 -.6 C.25 -.8 .5 -.82 .55 -.7 C.5 -.6 .4 -.52 .06 -.48 Z", fill: PAPIR, stroke: NAVY, "stroke-width": .045, "stroke-linejoin": "round" }, g);
    el("path", { d: "M-.12 -.55 L-.2 -.05 C-.1 0 .1 0 .2 -.05 L.12 -.55 Z", fill: PAPIR, stroke: NAVY, "stroke-width": .045, "stroke-linejoin": "round" }, g);
    var kar = el("line", { x1: .08, y1: -.48, stroke: NAVY, "stroke-width": .055, "stroke-linecap": "round" }, g);
    el("circle", { cx: 0, cy: -.7, r: .13, fill: PAPIR, stroke: NAVY, "stroke-width": .045 }, g);
    el("ellipse", { cx: 0, cy: -.9, rx: .12, ry: .035, fill: "none", stroke: ARANY, "stroke-width": .04 }, g);
    el("path", { d: "M-.05 -.71 l.02 .01 M.04 -.71 l.02 .01 M-.04 -.64 C-.01 -.62 .02 -.62 .05 -.645", fill: "none", stroke: NAVY, "stroke-width": .03, "stroke-linecap": "round" }, g);
    var o = el("g", {}, g);   /* olló a kézben */
    var o1 = el("path", { d: "M0 0 L.22 -.03", stroke: ARANY, "stroke-width": .04, "stroke-linecap": "round" }, o);
    var o2 = el("path", { d: "M0 0 L.22 .03", stroke: ARANY, "stroke-width": .04, "stroke-linecap": "round" }, o);
    el("circle", { cx: -.05, cy: -.03, r: .035, fill: "none", stroke: ARANY, "stroke-width": .03 }, o);
    el("circle", { cx: -.05, cy: .03, r: .035, fill: "none", stroke: ARANY, "stroke-width": .03 }, o);
    return { g: g, szB: szB, szJ: szJ, kar: kar, o: o, o1: o1, o2: o2 };
  }

  function vegtag(line, x, y, hossz, szog) {   /* szög fokban, 0 = lefelé, + = előre (jobbra) */
    var a = szog * Math.PI / 180;
    line.setAttribute("x1", x); line.setAttribute("y1", y);
    line.setAttribute("x2", x + Math.sin(a) * hossz); line.setAttribute("y2", y + Math.cos(a) * hossz);
  }
  function poz(o, x, y, s, forg, tukor, op) {
    o.g.setAttribute("transform", "translate(" + x.toFixed(1) + " " + y.toFixed(1) + ") rotate(" + (forg || 0).toFixed(1) + ") scale(" + (tukor ? -s : s).toFixed(2) + " " + s.toFixed(2) + ")");
    o.g.setAttribute("opacity", op == null ? 1 : op);
  }

  /* ---- felépítés ---- */
  function epit(txt) {
    svg = el("svg", { "class": "tj-svg", "aria-hidden": "true", focusable: "false" });
    svg.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible;pointer-events:none;z-index:0;transform:none";
    var vb = /viewBox="([^"]*)"/.exec(txt)[1];
    var belso = txt.slice(txt.indexOf("</style>") + 8, txt.lastIndexOf("</svg>")).replace(/<title>[\s\S]*?<\/title>/, "")
      .replace(/id="csucs-also"/, 'id="tj-also"').replace(/id="csucs-kozep"/, 'id="tj-kozep"').replace(/id="csucs-felso"/, 'id="tj-felso"');
    torony = el("svg", { viewBox: vb, overflow: "visible", "class": "tj-torony" }, svg);
    torony.innerHTML = belso;
    tvG.also = torony.querySelector("#tj-also"); tvG.kozep = torony.querySelector("#tj-kozep"); tvG.felso = torony.querySelector("#tj-felso");
    csucsJel = el("circle", { cx: 513, cy: 42, r: .6, fill: "none" }, tvG.felso || torony);
    kotel = el("path", { fill: "none", stroke: "#7a5a2a", "stroke-width": 1.4, "stroke-linecap": "round", opacity: 0 }, svg);
    nyil = el("g", { opacity: 0 }, svg);
    el("line", { x1: -9, y1: 0, x2: 7, y2: 0, stroke: NAVY, "stroke-width": 1.4, "stroke-linecap": "round" }, nyil);
    el("path", { d: "M7 -3 L12 0 L7 3 Z", fill: NAVY }, nyil);
    el("path", { d: "M-9 0 l-3 -3 M-9 0 l-3 3 M-6 0 l-3 -3 M-6 0 l-3 3", stroke: PIROS, "stroke-width": 1, "stroke-linecap": "round" }, nyil);
    ordog = ordogRajz(svg);
    angyal = angyalRajz(svg);
    felkialt = el("text", { "font-size": 16, "font-weight": 800, fill: PIROS, "text-anchor": "middle", opacity: 0, "font-family": "Montserrat,Arial,sans-serif" }, svg);
    felkialt.textContent = "!";
    szikrak = el("g", { opacity: 0 }, svg);
    for (var i = 0; i < 5; i++) el("path", { d: "M0 -4L1 -1L4 0L1 1L0 4L-1 1L-4 0L-1 -1Z", fill: ARANY }, szikrak);
    box.insertBefore(svg, box.firstChild);
    box.classList.add("tj-be");     /* a CSS ekkor elrejti a háttérbeli tornyot */
    rdy = true;
  }

  function csucs(g) {   /* a torony csúcsának aktuális helye (a hajlítással együtt) */
    var a = csucsJel.getBoundingClientRect();
    return { x: a.left + a.width / 2 - g.r.left, y: a.top + a.height / 2 - g.r.top };
  }
  function hajlit(also, kozep, felso) {
    if (tvG.also) tvG.also.style.transform = "rotate(" + also.toFixed(2) + "deg)";
    if (tvG.kozep) tvG.kozep.style.transform = "rotate(" + kozep.toFixed(2) + "deg)";
    if (tvG.felso) tvG.felso.style.transform = "rotate(" + felso.toFixed(2) + "deg)";
  }
  function kotelRajz(pts, op) {
    if (!pts) { kotel.setAttribute("opacity", 0); return; }
    var d = "M" + pts[0].x.toFixed(1) + " " + pts[0].y.toFixed(1);
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i], l = Math.hypot(b.x - a.x, b.y - a.y), sag = pts.sag != null ? pts.sag : l * .06;
      d += " Q" + ((a.x + b.x) / 2).toFixed(1) + " " + ((a.y + b.y) / 2 + sag).toFixed(1) + " " + b.x.toFixed(1) + " " + b.y.toFixed(1);
    }
    kotel.setAttribute("d", d); kotel.setAttribute("opacity", op == null ? 1 : op);
  }

  /* ---- egy képkocka ---- */
  var start = performance.now(), fut = false, raf = 0;
  function kocka(now) {
    raf = 0;
    if (!box.isConnected) { stop(); return; }
    var g = geo(), t = typeof window.__tjIdo === "number" ? window.__tjIdo : ((now - start) / 1000) % T, s = g.s;   /* __tjIdo: csak teszteléshez (kimerevített pillanat) */
    torony.setAttribute("x", g.tvx.toFixed(1)); torony.setAttribute("y", g.tvy.toFixed(1));
    torony.setAttribute("width", g.wt.toFixed(1)); torony.setAttribute("height", g.ht.toFixed(1));

    /* --- a torony hajlása: zuhanáskor az ördög felé (jobbra le), aztán gumiként vissza, csillapodva --- */
    var hajl = 0;
    if (t >= 15.2 && t < 18) hajl = easeIn(seg(t, 15.2, 18)) * 1;                  /* feszül */
    else if (t >= 18 && t < 23) { var u = (t - 18); hajl = Math.cos(u * 7.5) * Math.exp(-u * 1.6) * (u < .12 ? 1 : 1); if (u < .12) hajl = lerp(1, Math.cos(.9), u / .12); }
    hajlit(9 * hajl, 17 * hajl, 30 * hajl);
    var tip = csucs(g);

    /* --- alapállapot: mindenki rejtve --- */
    var oOp = 0, aOp = 0, kot = null, nyOp = 0;
    ordog.ij.setAttribute("opacity", 0);
    felkialt.setAttribute("opacity", 0); szikrak.setAttribute("opacity", 0);

    /* 1) besettenkedik balról (lábujjhegyen, guggolva) */
    var lepes = Math.sin(t * 9), ox, oy, forg = 0, sk = s, tukor = false;
    if (t < 3.4) {
      var k = ease(seg(t, 0, 3.4));
      ox = lerp(-s * 1.5, g.talp.x - s * .55, k); oy = g.H - 2 - Math.abs(Math.sin(t * 4.5)) * s * .12;
      oOp = 1; forg = 4;
      vegtag(ordog.labB, -.07, -.3, .3, 25 * lepes); vegtag(ordog.labJ, .07, -.3, .3, -25 * lepes);
      vegtag(ordog.karB, -.15, -.58, .28, 120 + 10 * lepes); vegtag(ordog.karJ, .15, -.58, .28, 140 - 10 * lepes);
    }
    /* 2) felmászik a torony csúcsára */
    else if (t < 7.4) {
      var m = ease(seg(t, 3.4, 7.4)), mozdul = Math.sin(t * 12);
      var cel = { x: tip.x, y: tip.y + s * .95 };
      ox = lerp(g.talp.x, cel.x, m) + mozdul * s * .04; oy = lerp(g.H - 2, cel.y, m);
      oOp = 1;
      vegtag(ordog.labB, -.07, -.3, .3, 20 + 25 * mozdul); vegtag(ordog.labJ, .07, -.3, .3, -20 - 25 * mozdul);
      vegtag(ordog.karB, -.15, -.58, .3, 160 + 20 * mozdul); vegtag(ordog.karJ, .15, -.58, .3, 200 - 20 * mozdul);
    }
    /* 3) a csúcson: elővesz egy íjat, céloz, lő */
    else if (t < 9.6) {
      ox = tip.x + s * .05; oy = tip.y + s * .95; oOp = 1;
      var celoz = Math.atan2(g.kereszt.y - tip.y, g.kereszt.x - tip.x) * 180 / Math.PI;
      vegtag(ordog.labB, -.07, -.3, .3, -15); vegtag(ordog.labJ, .07, -.3, .3, 15);
      ordog.ij.setAttribute("opacity", t > 7.6 ? 1 : 0);
      ordog.ij.setAttribute("transform", "rotate(" + clamp(celoz, -60, 30) * .6 + " .1 -.55)");
      var feszit = t < 8.4 ? seg(t, 7.8, 8.4) : 0;
      ordog.hur.setAttribute("x2", (.18 - feszit * .22).toFixed(3)); ordog.hur.setAttribute("x1", .18);
      vegtag(ordog.karB, -.15, -.58, .32, 150); vegtag(ordog.karJ, .15, -.58, .3, 95 + feszit * 30);
      /* a nyíl röppályája */
      if (t >= 8.4) {
        var f = easeOut(seg(t, 8.4, 9.5)), ax = lerp(tip.x, g.kereszt.x, f), csucsY = Math.min(tip.y, g.kereszt.y) - g.H * .12;
        var ay = (1 - f) * (1 - f) * tip.y + 2 * (1 - f) * f * csucsY + f * f * g.kereszt.y;
        var dx = (g.kereszt.x - tip.x), dy = 2 * (1 - f) * (csucsY - tip.y) + 2 * f * (g.kereszt.y - csucsY);
        nyil.setAttribute("transform", "translate(" + ax.toFixed(1) + " " + ay.toFixed(1) + ") rotate(" + (Math.atan2(dy, dx) * 180 / Math.PI).toFixed(1) + ") scale(" + (s / 30).toFixed(2) + ")");
        nyOp = 1;
        kot = [tip, { x: ax, y: ay }]; kot.sag = 0;
      }
    }
    /* 4) a kötél megakad; az ördög elindul rajta át (kézen függve) */
    else if (t < 15.2) {
      var hook = g.kereszt;
      nyil.setAttribute("transform", "translate(" + hook.x.toFixed(1) + " " + hook.y.toFixed(1) + ") rotate(" + (8 * Math.sin(Math.max(0, 10.4 - t) * 20)).toFixed(1) + ") scale(" + (s / 30).toFixed(2) + ")");
      nyOp = 1;
      var hal = t < 10.2 ? 0 : ease(seg(t, 10.2, 15.2)) * .86;
      var kp = { x: lerp(tip.x, hook.x, hal), y: lerp(tip.y, hook.y, hal) };
      var lehajl = hal > 0 ? s * .55 * Math.sin(Math.PI * Math.max(.08, hal)) + s * .25 : 0;
      kp.y += lehajl;
      kot = hal > 0 ? [tip, kp, hook] : [tip, hook];
      kot.sag = hal > 0 ? s * .05 : s * .12;
      ox = kp.x; oy = kp.y + s * 1.05; oOp = hal > 0 || t > 9.9 ? 1 : 0;
      if (hal === 0) { ox = tip.x + s * .05; oy = tip.y + s * .95; }
      var lendul = Math.sin(t * 8);
      vegtag(ordog.karB, -.12, -.58, .45, 180 + 8 * lendul); vegtag(ordog.karJ, .12, -.58, .45, 180 - 8 * lendul);
      vegtag(ordog.labB, -.07, -.3, .3, 15 * lendul); vegtag(ordog.labJ, .07, -.3, .3, -15 * lendul);
      forg = 4 * lendul;
      if (hal === 0) { vegtag(ordog.karB, -.15, -.58, .32, 150); vegtag(ordog.karJ, .15, -.58, .3, 120); }
    }
    /* 5) elvágták: zuhan a kötél végén, a torony felé hajlik (feszül), aztán visszacsap */
    else if (t < 18.15) {
      var z = seg(t, 15.2, 18.15);
      var L0 = Math.hypot(g.kereszt.x - tip.x, g.kereszt.y - tip.y) * .86;
      var th0 = Math.atan2(g.kereszt.x - tip.x, g.kereszt.y - tip.y), th = lerp(th0, .12, easeIn(z) * .9 + z * .1);
      var L = L0 * (1 + .18 * easeIn(z));
      var kez = { x: tip.x + Math.sin(th) * L, y: tip.y + Math.cos(th) * L };
      kez.y = Math.min(kez.y, g.H - s * 1.2);
      kot = [tip, kez]; kot.sag = s * .05 * (1 - z);
      ox = kez.x; oy = kez.y + s * 1.05; oOp = 1; forg = -th * 180 / Math.PI * .5;
      var rug = Math.sin(t * 14);
      vegtag(ordog.karB, -.12, -.58, .45, 180 + 6 * rug); vegtag(ordog.karJ, .12, -.58, .45, 180 - 6 * rug);
      vegtag(ordog.labB, -.07, -.3, .3, 40 + 30 * rug); vegtag(ordog.labJ, .07, -.3, .3, -40 - 30 * rug);
    }
    /* 6) a torony visszacsap: csúzliként kilövi balra felfelé, lassan eltűnik a távolban */
    else if (t < 24.5) {
      var r2 = seg(t, 18.15, 24.5), rr = easeOut(r2);
      var indul = { x: tip.x + s * .4, y: tip.y + g.ht * .05 };
      /* balra felfelé, a dobozon belül marad: ív a csúcs fölött, közben lassan zsugorodik (a távolba repül) */
      var cel2 = { x: Math.max(s * .8, tip.x - Math.max(g.W * .1, s * 3)), y: Math.max(s * .7, tip.y * .45) };
      var iv = Math.min(Math.max(tip.y - s * .4, 0) * .9, g.H * .16);
      var vx = lerp(indul.x, cel2.x, rr), vy = lerp(indul.y, cel2.y, rr) - Math.sin(Math.PI * Math.min(1, rr * 1.15)) * iv;
      sk = s * lerp(1, .06, Math.pow(r2, .8)); ox = vx; oy = Math.max(vy, sk * .9 + 4);   /* a feje se lógjon ki a dobozból */ oOp = r2 < .9 ? 1 : 1 - seg(r2, .9, 1); forg = -(t - 18.15) * 300 % 360; tukor = true;
      vegtag(ordog.karB, -.12, -.58, .4, 200); vegtag(ordog.karJ, .12, -.58, .4, 160);
      vegtag(ordog.labB, -.07, -.3, .3, 50); vegtag(ordog.labJ, .07, -.3, .3, -50);
      /* a kötél elengedve: lóg a toronycsúcsról, lengedezik, aztán eltűnik */
      if (t < 22.5) { var lg = Math.sin((t - 18.15) * 4) * Math.exp(-(t - 18.15)) * .6; var lv = { x: tip.x + Math.sin(lg) * g.ht * .18, y: tip.y + Math.cos(lg) * g.ht * .18 }; kot = [tip, lv]; kot.sag = s * .1; }
      /* csillanás, ahol eltűnik */
      if (r2 > .9) { szikrak.setAttribute("opacity", 1 - seg(r2, .96, 1)); szikrak.setAttribute("transform", "translate(" + cel2.x.toFixed(1) + " " + (cel2.y).toFixed(1) + ") scale(" + (1 + seg(r2, .9, 1)) + ")");
        [].forEach.call(szikrak.children, function (c, i) { var a = i * 72 * Math.PI / 180, d = 8 * seg(r2, .9, 1) * 2; c.setAttribute("transform", "translate(" + (Math.cos(a) * d).toFixed(1) + " " + (Math.sin(a) * d).toFixed(1) + ")"); }); }
    }
    ordog.test.setAttribute("transform", "");
    poz(ordog, ox || 0, oy || 0, sk, forg, tukor, oOp);
    nyil.setAttribute("opacity", nyOp);
    kotelRajz(kot);

    /* --- a kisangyal: észreveszi (felkiáltójel), odarepül, elvágja, visszarepül a bal hátsó toronyhoz --- */
    var A = g.hatso, aPos = null, aS = s * .95, csap = Math.sin(t * 26);
    angyal.szB.setAttribute("transform", "rotate(" + (csap * 22) + " -.05 -.55)");
    angyal.szJ.setAttribute("transform", "rotate(" + (-csap * 22) + " .05 -.55)");
    var vagas = { x: lerp(tip.x, g.kereszt.x, .93), y: lerp(tip.y, g.kereszt.y, .93) + s * .1 };
    if (t >= 12.4 && t < 13.4) {           /* felbukkan a torony mögül */
      var fb = easeOut(seg(t, 12.4, 13.0)); aPos = { x: A.x, y: A.y + s * (1 - fb) * .6 - s * .1 }; aOp = fb;
      if (t > 12.9) { felkialt.setAttribute("opacity", 1); felkialt.setAttribute("x", A.x + s * .45); felkialt.setAttribute("y", A.y - s * .95); felkialt.setAttribute("font-size", (s * .7).toFixed(0)); }
    } else if (t >= 13.4 && t < 14.7) {    /* odarepül a kötélhez */
      var rp = ease(seg(t, 13.4, 14.7)); aPos = { x: lerp(A.x, vagas.x, rp), y: lerp(A.y - s * .1, vagas.y + s * .55, rp) - Math.sin(Math.PI * rp) * s * .9 }; aOp = 1;
    } else if (t >= 14.7 && t < 15.6) {    /* nyissz! */
      aPos = { x: vagas.x, y: vagas.y + s * .55 + Math.sin(t * 6) * s * .03 }; aOp = 1;
    } else if (t >= 15.6 && t < 17.4) {    /* vissza a toronyhoz */
      var vp = ease(seg(t, 15.6, 17.4)); aPos = { x: lerp(vagas.x, A.x, vp), y: lerp(vagas.y + s * .55, A.y - s * .1, vp) - Math.sin(Math.PI * vp) * s * .6 }; aOp = 1;
    } else if (t >= 17.4 && t < 26) {      /* a toronynál nézi, ahogy elrepül, aztán eltűnik */
      aPos = { x: A.x, y: A.y - s * .1 + Math.sin(t * 3) * s * .04 }; aOp = 1 - seg(t, 24.5, 26);
    }
    if (aPos) {
      var nyitva = t >= 14.7 && t < 15.6 ? Math.abs(Math.sin((t - 14.7) * 9)) : .15;
      angyal.o1.setAttribute("transform", "rotate(" + (-nyitva * 25) + ")"); angyal.o2.setAttribute("transform", "rotate(" + (nyitva * 25) + ")");
      angyal.o.setAttribute("transform", "translate(.2 -.5) rotate(-60)");
      angyal.kar.setAttribute("x2", .2); angyal.kar.setAttribute("y2", -.5);
      angyal.o.setAttribute("opacity", t >= 13.4 && t < 17.4 ? 1 : 0);
      poz(angyal, aPos.x, aPos.y, aS, 0, aPos.x > (t < 15.6 ? vagas.x + 1 : A.x + 1), aOp);
    } else angyal.g.setAttribute("opacity", 0);

    if (fut) raf = requestAnimationFrame(kocka);
  }

  function indit() { if (fut || !rdy) return; fut = true; raf = requestAnimationFrame(kocka); }
  function stop() { fut = false; if (raf) cancelAnimationFrame(raf); raf = 0; }

  function init() {
    box = document.querySelector(".map-ph"); if (!box) return;
    fetch(TORONY).then(function (r) { return r.text(); }).then(function (txt) {
      if (!box.isConnected) return;
      epit(txt);
      var lathato = true;
      if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { lathato = e[0].isIntersecting; lathato && !document.hidden ? indit() : stop(); }, { rootMargin: "100px" }).observe(box);
      document.addEventListener("visibilitychange", function () { document.hidden ? stop() : lathato && indit(); });
      indit();
    }).catch(function () {});
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
