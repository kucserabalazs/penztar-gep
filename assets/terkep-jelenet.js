/* ==========================================================================
   Térkép helye (főoldal) – „A kisördög és a kisangyal”
   Forgatókönyv (36 mp-es ciklus):
    0.0– 4.2  a kisördög balról lábujjhegyen besettenkedik a TV-torony tövéhez, körülnéz
    4.2– 9.0  fogásról fogásra felmászik a torony csúcsára, felhúzza magát és megáll rajta
    9.0–11.6  leveszi az íjat, kötéllel kötött nyilat illeszt, megfeszíti, céloz, lő
   11.6–13.0  a nyíl ívben átrepül a székesegyház keresztjére (a kötél letekeredik utána), megakad, rezeg
   13.0–14.9  a kötelet a csúcshoz köti, megrántja (a kötél megpendül), alá lendül
   14.9–20.6  kézről kézre átkel a kötélen, a teste ring, a kötél a súlyától belóg
   17.8–20.6  a bal hátsó toronyból kikukucskál a kisangyal, észreveszi, ollót ránt, odarepül, elvágja
   20.6–22.7  a kisördög a kötél végét fogva ingaként lezuhan, közben a torony felé hajlik, jól elgörbül
   22.7–28.4  a torony gumiként visszacsap, csúzliként kilövi balra fel; pörögve, zsugorodva eltűnik a távolban
   21.2–29.0  a kisangyal örül, integet, visszarepül a tornyához; a kötélvégek lengedeznek, elhalványulnak
   A geometria a dzsami-hely.js-sel azonos (a torony és a székesegyház helye, mérete); minden képkockánál újraszámol.
   A szereplők rajza: assets/terkep-szereplok.js
   ========================================================================== */
(function () {
  if (window.__terkepJelenet) return; window.__terkepJelenet = true;
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var NS = "http://www.w3.org/2000/svg", T = 36;
  var TORONY = "assets/illusztraciok/web/tv-torony-szepia-allo.svg?v=1104";
  var box, svg, torony, tvG = {}, csucsJel, reteg, ord, ang, angClipRect, felk, csillag, nyil, kotelek = [], vonalak;
  var rdy = false;

  function el(n, a, p) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
  function f1(x) { return (Math.round(x * 10) / 10).toString(); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function L2(a, b, t) { return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) }; }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eio(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function eo(t) { return 1 - Math.pow(1 - t, 3); }
  function ei(t) { return t * t; }
  function dist(a, b) { return Math.hypot(b.x - a.x, b.y - a.y); }
  function bez3(a, b, c, d, t) { var u = 1 - t; return { x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x, y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y }; }
  function bez2(a, c, b, t) { var u = 1 - t; return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y }; }

  /* ---------- geometria (azonos a dzsami-hely.js képleteivel) ---------- */
  function geo() {
    var r = box.getBoundingClientRect(), W = r.width, H = r.height;
    var mobil = matchMedia("(max-width:760px)").matches;
    var hm = Math.min(.54 * H, .58 * W);   /* mobilon: legfeljebb akkora, hogy a torony és a székesegyház kényelmesen elférjen */
    var ht = mobil ? hm : Math.min(.86 * H, 440), wt = ht * 448.667 / 1469.33;
    var hc = mobil ? hm * 1.00192 - .01 : Math.min(.86 * H, 440) * 1.00192 - 2.01, wc = hc * 1139 / 995.333;
    var szx = (W - wc) * (mobil ? .98 : .97), szy = H + (mobil ? 3 : 4) - hc;
    var tvx = parseFloat(box.style.getPropertyValue("--tv-bal")) || 0, tvy = H + (mobil ? 4 : 6) - ht;
    var s = clamp(ht * .17, 26, 78);
    return { W: W, H: H, r: r, ht: ht, wt: wt, tvx: tvx, tvy: tvy, s: s, k: s / 105,
      talp: { x: tvx + wt * .5022, y: H - 1 },
      kereszt: { x: szx + wc * .5522, y: szy + hc * .028 },
      hatso: { x: szx + wc * .3942, y: szy + hc * .4462 }, hatsoW: wc * .05 };
  }

  /* ---------- felépítés ---------- */
  function epit(txt) {
    svg = el("svg", { "class": "tj-svg", "aria-hidden": "true", focusable: "false" });
    svg.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible;pointer-events:none;z-index:0;transform:none";
    var defs = el("defs", {}, svg);
    var vb = /viewBox="([^"]*)"/.exec(txt)[1];
    var belso = txt.slice(txt.indexOf("</style>") + 8, txt.lastIndexOf("</svg>")).replace(/<title>[\s\S]*?<\/title>/, "")
      .replace(/id="csucs-also"/, 'id="tj-also"').replace(/id="csucs-kozep"/, 'id="tj-kozep"').replace(/id="csucs-felso"/, 'id="tj-felso"');
    torony = el("svg", { viewBox: vb, overflow: "visible", "class": "tj-torony" }, svg);
    torony.innerHTML = belso;
    tvG.also = torony.querySelector("#tj-also"); tvG.kozep = torony.querySelector("#tj-kozep"); tvG.felso = torony.querySelector("#tj-felso");
    csucsJel = el("circle", { cx: 513, cy: 44, r: .6, fill: "none" }, tvG.felso || torony);
    /* kötelek: 0 fő kötél, 1 toronyról lógó vég, 2 keresztről lógó vég – sötét körvonal + sodrott belső + csillanó szál */
    for (var i = 0; i < 3; i++) {
      var g = el("g", { opacity: 0 }, svg);
      el("path", { fill: "none", stroke: "#3d2814", "stroke-linecap": "round" }, g);
      el("path", { fill: "none", stroke: "#c08f4e", "stroke-linecap": "round" }, g);
      el("path", { fill: "none", stroke: "#f1d29a", "stroke-linecap": "round", opacity: .75 }, g);
      kotelek.push(g);
    }
    nyil = el("g", { opacity: 0 }, svg);
    el("line", { x1: -26, y1: 0, x2: 8, y2: 0, stroke: "#3d2814", "stroke-width": 2.6, "stroke-linecap": "round" }, nyil);
    el("line", { x1: -26, y1: 0, x2: 8, y2: 0, stroke: "#a77b45", "stroke-width": 1.4, "stroke-linecap": "round" }, nyil);
    el("path", { d: "M7 -3.4 L15 0 L7 3.4 Z", fill: "#d5dce4", stroke: "#24324a", "stroke-width": .9, "stroke-linejoin": "round" }, nyil);
    el("path", { d: "M-24 0 l-6 -5 l8 1.6 Z M-24 0 l-6 5 l8 -1.6 Z M-18 0 l-6 -5 l8 1.6 Z M-18 0 l-6 5 l8 -1.6 Z", fill: "#b53a2a", stroke: "#24324a", "stroke-width": .6, "stroke-linejoin": "round" }, nyil);
    vonalak = el("g", { opacity: 0, stroke: "#8a7a62", "stroke-width": 1.2, "stroke-linecap": "round", fill: "none" }, svg);
    for (i = 0; i < 4; i++) el("path", {}, vonalak);
    reteg = el("g", {}, svg);
    var arnyek = el("ellipse", { rx: 10, ry: 2.4, fill: "#2b1a10", opacity: 0 }, reteg);
    var ordG = el("g", {}, reteg);
    ord = { g: ordG, a: TJSzereplok.ordog(ordG, "tjo_"), arnyek: arnyek };
    var cp = el("clipPath", { id: "tj-ang-clip", clipPathUnits: "userSpaceOnUse" }, defs);
    angClipRect = el("path", { d: "", "clip-rule": "evenodd" }, cp);
    var angWrap = el("g", { "clip-path": "url(#tj-ang-clip)" }, reteg);
    var angG = el("g", {}, angWrap);
    ang = { g: angG, a: TJSzereplok.angyal(angG, "tja_") };
    felk = el("g", { opacity: 0 }, reteg);
    el("path", { d: "M-3.2 -22 L3.2 -22 L1.8 -5 L-1.8 -5 Z", fill: "#c0392b", stroke: "#fff", "stroke-width": 1.6, "stroke-linejoin": "round", "paint-order": "stroke" }, felk);
    el("circle", { cx: 0, cy: 1.5, r: 2.6, fill: "#c0392b", stroke: "#fff", "stroke-width": 1.6, "paint-order": "stroke" }, felk);
    csillag = el("g", { opacity: 0 }, reteg);
    el("path", { d: "M0 -12 C1 -3 3 -1 12 0 C3 1 1 3 0 12 C-1 3 -3 1 -12 0 C-3 -1 -1 -3 0 -12 Z", fill: "#f4d27a", stroke: "#c9973f", "stroke-width": 1 }, csillag);
    el("circle", { r: 3, fill: "#fffbe9" }, csillag);
    box.insertBefore(svg, box.firstChild);
    box.classList.add("tj-be");
    rdy = true;
  }

  /* ---------- segédek ---------- */
  function hajlit(b) {
    if (tvG.also) tvG.also.style.transform = "rotate(" + (11 * b).toFixed(2) + "deg)";
    if (tvG.kozep) tvG.kozep.style.transform = "rotate(" + (19 * b).toFixed(2) + "deg)";
    if (tvG.felso) tvG.felso.style.transform = "rotate(" + (31 * b).toFixed(2) + "deg)";
  }
  function csucs(g) { var a = csucsJel.getBoundingClientRect(); return { x: a.left + a.width / 2 - g.r.left, y: a.top + a.height / 2 - g.r.top }; }
  function kotel(i, pts, sags, w, op) {
    var g = kotelek[i];
    if (!pts) { g.setAttribute("opacity", 0); return; }
    var d = "M" + f1(pts[0].x) + " " + f1(pts[0].y);
    for (var j = 1; j < pts.length; j++) {
      var a = pts[j - 1], b = pts[j], m = L2(a, b, .5), sg = sags ? sags[j - 1] || 0 : 0;
      if (typeof sg === "object") d += " Q" + f1(m.x + sg.x) + " " + f1(m.y + sg.y) + " " + f1(b.x) + " " + f1(b.y);
      else d += " Q" + f1(m.x) + " " + f1(m.y + 2 * sg) + " " + f1(b.x) + " " + f1(b.y);
    }
    var c = g.children;
    c[0].setAttribute("d", d); c[0].setAttribute("stroke-width", f1(w * 1.9));
    c[1].setAttribute("d", d); c[1].setAttribute("stroke-width", f1(w * 1.15));
    c[2].setAttribute("d", d); c[2].setAttribute("stroke-width", f1(w * .45)); c[2].setAttribute("stroke-dasharray", f1(w * 1.4) + " " + f1(w * 1.6));
    g.setAttribute("opacity", op == null ? 1 : op);
  }
  /* szereplő elhelyezése: X,Y = csípő (világ), R = elforgatás (fok), k = méret, tukor = balra néz */
  function hely(o, X, Y, R, k, tukor, op) {
    o.g.setAttribute("transform", "translate(" + f1(X) + " " + f1(Y) + ") rotate(" + f1(R) + ") scale(" + (tukor ? -k : k).toFixed(3) + " " + k.toFixed(3) + ")");
    o.g.setAttribute("opacity", op == null ? 1 : op);
    o._ = { X: X, Y: Y, R: R * Math.PI / 180, k: k, m: tukor ? -1 : 1 };
  }
  function lok(o, p) {   /* világ → szereplő helyi koordináta */
    var q = o._, dx = p.x - q.X, dy = p.y - q.Y, c = Math.cos(-q.R), s = Math.sin(-q.R);
    return { x: (dx * c - dy * s) / q.k * q.m, y: (dx * s + dy * c) / q.k };
  }
  function vil(o, p) {   /* szereplő helyi → világ */
    var q = o._, x = p.x * q.k * q.m, y = p.y * q.k, c = Math.cos(q.R), s = Math.sin(q.R);
    return { x: q.X + x * c - y * s, y: q.Y + x * s + y * c };
  }
  function nyilHely(C, sz, s, op) { nyil.setAttribute("opacity", op == null ? 1 : op); nyil.setAttribute("transform", "translate(" + f1(C.x) + " " + f1(C.y) + ") rotate(" + f1(sz) + ") scale(" + (s / 70).toFixed(3) + ")"); }

  /* ---------- a torony hajlása (rugómodell) ---------- */
  function hajlas(t) {
    if (t < 14.9) return 0;
    if (t < 20.6) return .03 * Math.sin((t - 14.9) * 5.2) * seg(t, 14.9, 15.6);         /* a kötél rángatja */
    if (t < 22.62) return eio(seg(t, 20.75, 22.62));                                   /* a zuhanó ördög húzza: jól elgörbül */
    if (t < 22.74) return lerp(1, -.62, ei(seg(t, 22.62, 22.74)));                    /* gumiként visszacsap */
    var u = t - 22.74; return -.62 * Math.exp(-u * 1.25) * Math.cos(u * 6.2);         /* csillapodva kileng */
  }

  /* ---------- egy képkocka ---------- */
  var start = performance.now(), fut = false, raf = 0;
  function kocka(now) {
    raf = 0;
    if (!box.isConnected) { stop(); return; }
    var g = geo(), t = typeof window.__tjIdo === "number" ? window.__tjIdo : ((now - start) / 1000) % T, s = g.s, k = g.k;   /* __tjIdo: csak teszthez */
    torony.setAttribute("x", f1(g.tvx)); torony.setAttribute("y", f1(g.tvy)); torony.setAttribute("width", f1(g.wt)); torony.setAttribute("height", f1(g.ht));
    hajlit(0); var tip0 = csucs(g);
    var hb = hajlas(t); hajlit(hb); var tip = csucs(g);
    var C = g.kereszt, span = dist(tip0, C), rw = clamp(s * .028, 1.1, 2.2);
    var CP0 = { x: lerp(tip0.x, C.x, .5), y: Math.max(Math.min(tip0.y, C.y) - span * .22, 2 * s * .35 - (tip0.y + C.y) / 2) };   /* az ív legmagasabb pontja a dobozon belül marad */
    var nyilSz = Math.atan2(C.y - CP0.y, C.x - CP0.x) * 180 / Math.PI;
    var A = ord.a, st = { kifejezes: "ravasz", farokFazis: t * 2.4, nez: { x: 1, y: 0 }, tegez: true, kotelTekercs: t < 11.6 };
    var X = 0, Y = 0, R = 0, arnyOp = 0;
    var tengely = g.talp.x, kezTav = s * .12;
    kotel(0, null); kotel(1, null); kotel(2, null);
    nyil.setAttribute("opacity", 0); vonalak.setAttribute("opacity", 0); felk.setAttribute("opacity", 0); csillag.setAttribute("opacity", 0);
    ord.g.setAttribute("opacity", 1);

    if (t < 4.2) {
      /* ===== 1) besettenkedik ===== */
      var u = seg(t, 0, 3.4), lp = t * 6.2, lop = u < 1 ? 1 : 0;
      X = lerp(-s * .9, Math.max(tengely - s * .55, s * .3), eio(u)); Y = g.H - 27 * k - Math.max(0, Math.sin(lp)) * s * .035 * lop - s * .03;
      R = 9; arnyOp = .18;
      hely(ord, X, Y, R, k, false, 1);
      st.labE = { x: 7 + 9 * Math.cos(lp) * lop, y: 25 - 6 * Math.max(0, Math.sin(lp)) * lop };
      st.labH = { x: -5 - 9 * Math.cos(lp) * lop, y: 25 - 6 * Math.max(0, -Math.sin(lp)) * lop };
      st.kezE = { x: 15, y: -24 + 2 * Math.sin(lp) * lop }; st.kezH = { x: 9, y: -27 }; st.konyokE = 1; st.konyokH = 1;
      st.fejSzog = -4;
      if (t > 3.4) {   /* megáll, körülnéz: balra, jobbra, majd fel a toronyra */
        var n = seg(t, 3.4, 4.2);
        st.nez = n < .35 ? { x: -1, y: 0 } : n < .7 ? { x: 1, y: 0 } : { x: .3, y: -1 };
        st.fejSzog = n < .35 ? -12 : n < .7 ? 6 : -14;
        st.labE = { x: 6, y: 26 }; st.labH = { x: -6, y: 26 };
      }
      A.rajzol(st);
    } else if (t < 9.0) {
      /* ===== 2) felmászik ===== */
      var ciklus = .62, ph = (t - 4.2) / ciklus, lepes = Math.floor(ph), fr = ph - lepes;
      var also = g.H - 27 * k - s * .05, felso = tip0.y + 60 * k;
      var lepesSzam = Math.ceil(4.2 / ciklus), haladas = (lepes + eio(clamp(fr * 1.3, 0, 1))) / lepesSzam;
      Y = lerp(also, felso, clamp(haladas, 0, 1)); X = tengely - s * .2; R = 0;
      if (t >= 8.4) { var hz = eio(seg(t, 8.4, 9.0)); Y = lerp(felso, tip0.y - 27 * k + s * .02, hz); X = lerp(tengely - s * .2, tip0.x, hz); }
      hely(ord, X, Y, R, k, false, 1);
      var felj = { x: tengely, y: Y - 66 * k }, paros = lepes % 2 === 0, nyul = eio(clamp(fr * 1.6, 0, 1));
      var kE = paros ? L2({ x: tengely, y: Y - 44 * k }, felj, nyul) : { x: tengely, y: Y - 50 * k };
      var kH = paros ? { x: tengely, y: Y - 50 * k } : L2({ x: tengely, y: Y - 44 * k }, felj, nyul);
      if (t < 8.4) {
        st.kezE = lok(ord, { x: kE.x + kezTav * .3, y: kE.y }); st.kezH = lok(ord, { x: kH.x - kezTav * .1, y: kH.y });
        st.konyokE = -1; st.konyokH = 1;
        var tL = paros ? 1 - nyul : nyul;
        st.labE = { x: 9, y: 18 + 6 * tL }; st.labH = { x: 6, y: 24 - 6 * tL }; st.terdE = -1; st.terdH = -1;
        st.kifejezes = fr < .5 ? "erőlködik" : "ravasz"; st.nez = { x: .4, y: -1 }; st.fejSzog = -6;
      } else {
        var hz2 = seg(t, 8.4, 9.0);
        st.kezE = hz2 < .5 ? lok(ord, { x: tip0.x + kezTav, y: tip0.y }) : { x: 16, y: -22 };
        st.kezH = hz2 < .5 ? lok(ord, { x: tip0.x - kezTav, y: tip0.y }) : { x: -15, y: -20 };
        st.konyokE = 1; st.konyokH = -1; st.labE = { x: 3, y: 27 }; st.labH = { x: -3, y: 27 };
        st.kifejezes = hz2 < .5 ? "erőlködik" : "elégedett"; st.nez = { x: 1, y: .1 };
      }
      A.rajzol(st);
    } else if (t < 13.0) {
      /* ===== 3) íj, célzás, lövés, a nyíl röppályája ===== */
      X = tip.x; Y = tip.y - 27 * k + s * .02 + (t < 11.6 ? Math.sin(t * 7) * s * .006 : 0); R = t >= 11.6 && t < 11.8 ? -4 * Math.sin(seg(t, 11.6, 11.8) * Math.PI) : 0;
      hely(ord, X, Y, R, k, false, 1);
      var valH = vil(ord, A.VALL_J);
      var dir = Math.atan2(CP0.y - valH.y, CP0.x - valH.x) * .55 + Math.atan2(C.y - valH.y, C.x - valH.x) * .45;
      var dx = Math.cos(dir), dy = Math.sin(dir);
      var elovesz = seg(t, 9.0, 9.7), feszit = t < 11.6 ? eio(seg(t, 10.0, 11.0)) : 0;
      var remeg = t > 11.0 && t < 11.6 ? Math.sin(t * 60) * .6 : 0;
      var ijKez = { x: valH.x + dx * 30 * k, y: valH.y + dy * 30 * k };
      st.kezE = elovesz < 1 ? L2({ x: 14, y: -8 }, lok(ord, ijKez), eio(elovesz)) : lok(ord, ijKez);
      var hurPont = { x: ijKez.x - dx * (3 + feszit * 13) * k, y: ijKez.y - dy * (3 + feszit * 13) * k };
      st.kezH = t < 9.7 ? { x: -6, y: -50 } : lok(ord, hurPont);
      st.konyokE = 1; st.konyokH = 1; st.labE = { x: 7, y: 27 }; st.labH = { x: -6, y: 27 };
      st.ij = { kez: "E", lathato: t >= 9.2 && t < 12.6, szog: dir * 180 / Math.PI + remeg, feszit: feszit, nyil: t >= 9.7 && t < 11.6 };
      st.kifejezes = t < 10.0 ? "ravasz" : t < 11.6 ? "erőlködik" : t < 12.95 ? "ravasz" : "elégedett";
      st.nez = { x: dx, y: dy }; st.fejSzog = clamp(dir * 180 / Math.PI * .4, -14, 8);
      A.rajzol(st);
      if (t >= 11.6) {
        var nu = seg(t, 11.6, 12.9), nyu = 1 - Math.pow(1 - nu, 1.7);
        var S0 = { x: ijKez.x + dx * 6 * k, y: ijKez.y + dy * 6 * k };
        var CP = { x: lerp(S0.x, C.x, .5), y: Math.max(Math.min(S0.y, C.y) - span * .22, 2 * s * .35 - (S0.y + C.y) / 2) };
        var P = bez2(S0, CP, C, nyu), Pn = bez2(S0, CP, C, Math.min(1, nyu + .01));
        var sz = Math.atan2(Pn.y - P.y, Pn.x - P.x) * 180 / Math.PI;
        if (t >= 12.9) { P = C; sz = Math.atan2(C.y - CP.y, C.x - CP.x) * 180 / Math.PI + 9 * Math.exp(-(t - 12.9) * 6) * Math.sin((t - 12.9) * 55); }
        nyilHely(P, sz, s);
        var tek = vil(ord, { x: 8, y: -3 }), r = sz * Math.PI / 180;
        var farokP = { x: P.x - Math.cos(r) * 26 * s / 70, y: P.y - Math.sin(r) * 26 * s / 70 };
        kotel(0, [tek, farokP], [span * .06 * (1 - nyu * .5)], rw);
      }
    } else if (t < 14.9) {
      /* ===== 4) kötés a csúcshoz, megrántás, aláfordulás ===== */
      var kot = seg(t, 13.0, 13.9), rant = seg(t, 13.9, 14.4), al = seg(t, 14.4, 14.9);
      nyilHely(C, nyilSz, s);
      if (al <= 0) {
        X = tip.x - s * .06; Y = tip.y - 27 * k + s * .02 + (kot < 1 ? Math.sin(kot * Math.PI) * s * .18 : 0); R = kot < 1 ? 14 * Math.sin(kot * Math.PI) : -6 * Math.sin(rant * Math.PI);
        hely(ord, X, Y, R, k, false, 1);
        if (kot < 1) {
          var kor = kot * 12;
          st.kezE = lok(ord, { x: tip.x + Math.cos(kor) * kezTav, y: tip.y + s * .05 + Math.sin(kor) * kezTav * .4 });
          st.kezH = lok(ord, { x: tip.x - Math.cos(kor) * kezTav, y: tip.y + s * .08 - Math.sin(kor) * kezTav * .4 });
          st.kifejezes = "erőlködik"; st.nez = { x: .2, y: 1 };
        } else {
          st.kezE = lok(ord, L2(tip, C, .06)); st.kezH = lok(ord, L2(tip, C, .03));
          st.kifejezes = "elégedett"; st.nez = { x: 1, y: 0 };
        }
        st.konyokE = 1; st.konyokH = -1; st.labE = { x: 5, y: 27 }; st.labH = { x: -5, y: 27 };
        A.rajzol(st);
        var lazasag = kot < 1 ? span * .14 : span * (.14 - .12 * eo(rant)) + Math.sin(rant * 30) * span * .015 * (1 - rant);
        kotel(0, [tip, C], [lazasag], rw);
      } else {
        var Hm = L2(tip, C, .02); Hm.y += span * .02;
        X = lerp(tip.x - s * .06, Hm.x, eio(al)); Y = lerp(tip.y - 27 * k, Hm.y + 62 * k, eio(al)); R = lerp(0, -10, eio(al));
        hely(ord, X, Y, R, k, false, 1);
        st.kezE = lok(ord, L2(tip, C, .05)); st.kezH = lok(ord, L2(tip, C, .02));
        st.konyokE = -1; st.konyokH = 1; st.labE = { x: 8, y: 22 }; st.labH = { x: -6, y: 25 }; st.kifejezes = "ravasz";
        A.rajzol(st);
        kotel(0, [tip, Hm, C], [span * .003, span * .01], rw);
      }
    } else if (t < 20.6) {
      /* ===== 5) átkelés a kötélen, kézről kézre ===== */
      var ciklus2 = .62, ph2 = (t - 14.9) / ciklus2, lp2 = Math.floor(ph2), fr2 = ph2 - lp2;
      var N = Math.ceil((19.9 - 14.9) / ciklus2), pv = Math.min(.86, .02 + .84 * clamp((lp2 + eio(clamp(fr2 * 1.4, 0, 1))) / N, 0, 1));
      var meredek = .06 + .05 * Math.sin(Math.PI * pv);
      var Hm2 = L2(tip, C, pv); Hm2.y += span * meredek;
      var lenges = Math.sin(t * 3.1) * 9 + Math.sin(t * 7.7) * 2, dlt = .028;
      var elol = lp2 % 2 === 0, nyul2 = t < 19.9 ? eio(clamp(fr2 * 1.6, 0, 1)) : 0;
      var kotelPont = function (p) { var q = L2(tip, C, p), sag = p < pv ? p / pv : (1 - p) / (1 - pv); q.y += span * meredek * sag; return q; };
      var kE2 = kotelPont(pv + (elol ? lerp(-dlt * .3, dlt, nyul2) : dlt * .2));
      var kH2 = kotelPont(pv - (elol ? dlt * .2 : lerp(dlt, -dlt * .3, nyul2)));
      var kozep = L2(kE2, kH2, .5), Rl = lenges * Math.PI / 180;
      X = kozep.x + Math.sin(Rl) * 62 * k; Y = kozep.y + Math.cos(Rl) * 62 * k; R = lenges;
      hely(ord, X, Y, R, k, false, 1);
      st.kezE = lok(ord, kE2); st.kezH = lok(ord, kH2); st.konyokE = -1; st.konyokH = 1;
      var rug = Math.sin(t * 3.1 + .6);
      st.labE = { x: 6 + rug * 7, y: 24 }; st.labH = { x: -6 + rug * 5, y: 25 };
      st.kifejezes = t < 19.1 ? (fr2 < .45 ? "erőlködik" : "ravasz") : "rémült";
      st.nez = t < 19.1 ? { x: 1, y: -.2 } : { x: .6, y: -1 }; st.fejSzog = t < 19.1 ? 0 : -10;
      A.rajzol(st);
      kotel(0, [tip, Hm2, C], [span * .004, span * .006], rw);
      nyilHely(C, nyilSz, s);
      ord._vagas = L2(Hm2, C, .45);
    } else if (t < 22.74) {
      /* ===== 6) zuhanás ingaként, a torony meghajlik ===== */
      var Pv = L2(tip0, C, .86); Pv.y += span * .06;
      var Lr = dist(tip0, Pv), elerheto = g.H - s * 1.15 - tip0.y;
      var th0 = Math.atan2(Pv.x - tip0.x, Pv.y - tip0.y), thB = Math.max(Lr > elerheto ? Math.acos(clamp(elerheto / Lr, -1, 1)) : 0, .12);
      var zu = seg(t, 20.6, 22.62), th = lerp(th0, thB, 1 - Math.cos(zu * Math.PI / 2));
      var Ln = Lr * (1 + .06 * Math.sin(zu * Math.PI));
      var kez = { x: tip.x + Math.sin(th) * Ln, y: Math.min(tip.y + Math.cos(th) * Ln, g.H - s * 1.12) };
      var Rf = -th * 180 / Math.PI * .7, Rfr = Rf * Math.PI / 180;
      X = kez.x + Math.sin(Rfr) * 62 * k; Y = kez.y + Math.cos(Rfr) * 62 * k; R = Rf;
      hely(ord, X, Y, R, k, false, 1);
      st.kezE = lok(ord, { x: kez.x + 2 * k, y: kez.y }); st.kezH = lok(ord, { x: kez.x - 2 * k, y: kez.y + 6 * k });
      st.konyokE = -1; st.konyokH = 1;
      var kalim = Math.sin(t * 13);
      st.labE = { x: 10 + kalim * 8, y: 20 + Math.abs(kalim) * 3 }; st.labH = { x: -10 - kalim * 8, y: 20 + Math.abs(kalim) * 3 };
      st.kifejezes = "rémült"; st.nez = { x: -.4, y: 1 };
      A.rajzol(st);
      kotel(0, [tip, kez], [0], rw);
      var lc = dist(L2(Pv, C, .45), C), ps = Math.atan2(Pv.x - C.x, Pv.y - C.y) * Math.exp(-(t - 20.6) * 1.6) * Math.cos((t - 20.6) * 4.2);
      kotel(2, [C, { x: C.x + Math.sin(ps) * lc, y: C.y + Math.cos(ps) * lc }], [{ x: -Math.cos(ps) * lc * .12, y: 0 }], rw);
      nyilHely(C, nyilSz, s);
    } else if (t < 29.2) {
      /* ===== 7) csúzli: kilövés balra fel, eltűnés a távolban ===== */
      var Pv2 = L2(tip0, C, .86); Pv2.y += span * .06;
      var Lr2 = dist(tip0, Pv2), el2 = g.H - s * 1.15 - tip0.y, thB2 = Math.max(Lr2 > el2 ? Math.acos(clamp(el2 / Lr2, -1, 1)) : 0, .12);
      var P1 = { x: tip0.x + Math.sin(thB2) * Lr2, y: Math.min(tip0.y + Math.cos(thB2) * Lr2, g.H - s * 1.12) };
      var cel = { x: Math.max(s * .7, tip0.x - Math.max(g.W * .2, s * 3.2)), y: Math.max(s * .5, Math.min(tip0.y * .5, g.H * .12)) };
      var c1 = { x: tip0.x + s * .6, y: tip0.y + s * .2 };
      var c2 = { x: lerp(tip0.x, cel.x, .55), y: Math.max(s * .45, Math.min(tip0.y, cel.y) - g.H * .1) };
      var lu = seg(t, 22.74, 28.4), lt = 1 - Math.pow(1 - lu, 2.6);
      var P2 = bez3(P1, c1, c2, cel, lt);
      var kk = k * lerp(1, .06, Math.pow(lu, .85)), op = lu < .88 ? 1 : 1 - seg(lu, .88, 1);
      hely(ord, P2.x, P2.y, -(t - 22.74) * 410, kk, true, op);
      st.kezE = { x: 22, y: -44 }; st.kezH = { x: -22, y: -42 }; st.konyokE = -1; st.konyokH = 1;
      st.labE = { x: 14, y: 22 }; st.labH = { x: -14, y: 22 }; st.kifejezes = "szédült";
      A.rajzol(st);
      if (lu < .2) {
        vonalak.setAttribute("opacity", 1 - lu / .2);
        var Pb = bez3(P1, c1, c2, cel, Math.max(0, lt - .06)), irx = P2.x - Pb.x, iry = P2.y - Pb.y, il = Math.hypot(irx, iry) || 1;
        [].forEach.call(vonalak.children, function (v, i) {
          var off = (i - 1.5) * s * .12, nx = -iry / il, ny = irx / il;
          var a = { x: P2.x + nx * off - irx / il * s * .35, y: P2.y + ny * off - iry / il * s * .35 }, b = { x: a.x - irx / il * s * (.6 + i * .12), y: a.y - iry / il * s * (.6 + i * .12) };
          v.setAttribute("d", "M" + f1(a.x) + " " + f1(a.y) + " L" + f1(b.x) + " " + f1(b.y));
        });
      }
      if (lu > .86 && lu < 1) { var cs2 = seg(lu, .86, 1); csillag.setAttribute("opacity", Math.sin(cs2 * Math.PI)); csillag.setAttribute("transform", "translate(" + f1(cel.x) + " " + f1(cel.y) + ") rotate(" + f1(cs2 * 90) + ") scale(" + (s / 60 * (.4 + Math.sin(cs2 * Math.PI) * .8)).toFixed(3) + ")"); }
      var lk = Math.min(Lr2 * .55, (g.H - tip0.y) * .45), u2 = t - 22.74, fi = -.9 * Math.exp(-u2 * .9) * Math.cos(u2 * 3.4);
      var vg = { x: tip.x + Math.sin(fi) * lk, y: tip.y + Math.cos(fi) * lk };
      kotel(1, [tip, vg], [{ x: Math.cos(fi) * lk * .14 * Math.sin(u2 * 5) * Math.exp(-u2), y: 0 }], rw, 1 - seg(t, 27.5, 29.2));
      var lc2 = dist(L2(Pv2, C, .45), C), ps2 = Math.atan2(Pv2.x - C.x, Pv2.y - C.y) * Math.exp(-(t - 20.6) * 1.6) * Math.cos((t - 20.6) * 4.2);
      kotel(2, [C, { x: C.x + Math.sin(ps2) * lc2, y: C.y + Math.cos(ps2) * lc2 }], [{ x: -lc2 * .1 * Math.cos(t * 2), y: 0 }], rw, 1 - seg(t, 26.5, 28.2));
      nyilHely(C, nyilSz, s, 1 - seg(t, 26.5, 28.2));
    } else {
      ord.g.setAttribute("opacity", 0);
    }
    ord.arnyek.setAttribute("opacity", arnyOp);
    if (arnyOp) { ord.arnyek.setAttribute("cx", f1(X)); ord.arnyek.setAttribute("cy", f1(g.H - 2)); ord.arnyek.setAttribute("rx", f1(s * .2)); ord.arnyek.setAttribute("ry", f1(s * .035)); }

    /* ===== a kisangyal ===== */
    var Hh = g.hatso, ka = k * .92, csap = Math.sin(t * 17), ast = { szarny: csap, ido: t, kifejezes: "nyugodt" };
    var vagas = ord._vagas || L2(L2(tip0, C, .86), C, .45);
    var tw = g.hatsoW, hy = Hh.y + 2;
    /* takarás: a bal hátsó torony csúcsa alatt a toronytest mögött van (csak a toronytest sávját takarjuk) */
    angClipRect.setAttribute("d", "M-4000 -4000 H8000 V8000 H-4000 Z M" + f1(Hh.x - tw) + " " + f1(hy) + " H" + f1(Hh.x + tw) + " V8000 H" + f1(Hh.x - tw) + " Z");
    var AX = 0, AY = 0, AR = 0, aop = 0, atuk = false;
    var lent = { x: Hh.x, y: Hh.y + 70 * ka }, kukucs = { x: Hh.x, y: Hh.y + 22 * ka }, fent = { x: Hh.x, y: Hh.y - 26 * ka };
    var vagoHely = { x: vagas.x + 14 * ka, y: vagas.y - 24 * ka };
    if (t >= 17.8 && t < 18.6) { var q = eo(seg(t, 17.8, 18.4)); AX = Hh.x; AY = lerp(lent.y, kukucs.y, q); aop = 1; ast.szarny = -.6; }
    else if (t >= 18.6 && t < 19.3) {
      AX = Hh.x; AY = kukucs.y; aop = 1; ast.kifejezes = "meglepett"; ast.szarny = -.6; ast.fejSzog = 6;
      felk.setAttribute("opacity", seg(t, 18.6, 18.75));
      felk.setAttribute("transform", "translate(" + f1(Hh.x + 16 * ka) + " " + f1(kukucs.y - 46 * ka) + ") scale(" + (ka * (1 + .25 * Math.sin(seg(t, 18.6, 18.9) * Math.PI))).toFixed(3) + ") rotate(12)");
    } else if (t >= 19.3 && t < 19.8) {
      var q2 = eio(seg(t, 19.3, 19.8)); AX = Hh.x; AY = lerp(kukucs.y, fent.y, q2); aop = 1; ast.kifejezes = "eltökélt";
      ast.ollo = { lathato: t > 19.5, nyitas: .5, szog: -30 }; ast.kezE = { x: 15, y: -20 };
    } else if (t >= 19.8 && t < 20.35) {
      var q3 = eio(seg(t, 19.8, 20.35));
      var P3 = bez2(fent, { x: lerp(fent.x, vagoHely.x, .5), y: Math.min(fent.y, vagoHely.y) - s * .6 }, vagoHely, q3);
      AX = P3.x; AY = P3.y; AR = -12 * Math.sin(q3 * Math.PI); aop = 1; ast.kifejezes = "eltökélt"; atuk = true;
      ast.ollo = { lathato: true, nyitas: .8, szog: 95 }; ast.kezE = { x: 14, y: 4 };
    } else if (t >= 20.35 && t < 21.2) {
      AX = vagoHely.x; AY = vagoHely.y + Math.sin(t * 8) * s * .02; aop = 1; ast.kifejezes = "eltökélt"; atuk = true;
      var cs3 = seg(t, 20.35, 20.62); ast.ollo = { lathato: true, nyitas: t < 20.62 ? .9 * (1 - ei(cs3)) : .1, szog: 95 }; ast.kezE = { x: 14, y: 4 };
      if (t > 20.62) { ast.kifejezes = "meglepett"; AY -= eo(seg(t, 20.62, 21.2)) * s * .35; }
    } else if (t >= 21.2 && t < 27.8) {
      var q4 = eio(seg(t, 21.2, 22.4)), hova = { x: Hh.x + s * .1, y: fent.y - s * .15 };
      AX = lerp(vagoHely.x, hova.x, q4); AY = lerp(vagoHely.y - s * .35, hova.y, q4) + Math.sin(t * 2.6) * s * .03; aop = 1;
      atuk = t >= 23 && t < 25;
      ast.kifejezes = t < 23.1 ? "meglepett" : "boldog"; ast.fejSzog = t > 23.1 && t < 25.5 ? -8 : 0;
      if (t > 23.4 && t < 25.6) { var int2 = Math.sin((t - 23.4) * 9); ast.kezE = { x: 12 + int2 * 4, y: -46 }; }
    } else if (t >= 27.8 && t < 29.0) {
      var q5 = eio(seg(t, 27.8, 29.0)); AX = Hh.x; AY = lerp(fent.y - s * .15, lent.y, q5); aop = 1; ast.kifejezes = "boldog"; ast.szarny = lerp(csap, -.6, q5);
    }
    if (aop) { hely(ang, AX, AY, AR, ka, atuk, aop); ang.a.rajzol(ast); } else ang.g.setAttribute("opacity", 0);
    if (t < 14) ord._vagas = null;

    if (fut) raf = requestAnimationFrame(kocka);
  }

  function indit() { if (fut || !rdy) return; fut = true; raf = requestAnimationFrame(kocka); }
  function stop() { fut = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
  function init() {
    box = document.querySelector(".map-ph"); if (!box || !window.TJSzereplok) return;
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
