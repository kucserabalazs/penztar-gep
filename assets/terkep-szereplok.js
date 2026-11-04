/* ==========================================================================
   Térkép-jelenet szereplői: kisördög és kisangyal
   Részletes, a bankjegyek vésett stílusát követő vektoros rajzok csontvázzal (rig):
   a végtagok ízületekből állnak, a kéz/láb célpontra nyúl (kétcsontos IK), az arckifejezés változtatható.
   Helyi koordináták: a csípő a (0,0), y lefelé nő; a szereplő magassága kb. 100 egység.
   Használat: var o = TJSzereplok.ordog(szuloSvgCsoport, idPrefix); o.rajzol(allapot);
   ========================================================================== */
(function () {
  var NS = "http://www.w3.org/2000/svg";
  var TUS = "#24324a", TUS2 = "#3a4a63";
  function el(n, a, p) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
  function f1(x) { return (Math.round(x * 10) / 10).toString(); }
  function rad(d) { return d * Math.PI / 180; }

  /* kétcsontos IK: S váll/csípő, T cél, a,b csonthossz, haj = +1/-1 (könyök/térd iránya) */
  function ik(S, T, a, b, haj) {
    var dx = T.x - S.x, dy = T.y - S.y, d = Math.hypot(dx, dy), max = a + b - .01;
    if (d > max) { dx *= max / d; dy *= max / d; d = max; }
    if (d < Math.abs(a - b) + .01) d = Math.abs(a - b) + .01;
    var alfa = Math.atan2(dy, dx), cosb = (a * a + d * d - b * b) / (2 * a * d), beta = Math.acos(Math.max(-1, Math.min(1, cosb)));
    var ang = alfa - haj * beta, E = { x: S.x + Math.cos(ang) * a, y: S.y + Math.sin(ang) * a };
    return { E: E, H: { x: S.x + dx, y: S.y + dy } };
  }
  /* elvékonyodó végtagszakasz körvonala (kapszula) */
  function kapszula(A, B, wa, wb) {
    var dx = B.x - A.x, dy = B.y - A.y, l = Math.hypot(dx, dy) || .001, nx = -dy / l, ny = dx / l;
    return "M" + f1(A.x + nx * wa) + " " + f1(A.y + ny * wa) + " L" + f1(B.x + nx * wb) + " " + f1(B.y + ny * wb) +
      " A" + f1(wb) + " " + f1(wb) + " 0 0 0 " + f1(B.x - nx * wb) + " " + f1(B.y - ny * wb) +
      " L" + f1(A.x - nx * wa) + " " + f1(A.y - ny * wa) + " A" + f1(wa) + " " + f1(wa) + " 0 0 0 " + f1(A.x + nx * wa) + " " + f1(A.y + ny * wa) + " Z";
  }
  function vonal(pts) { var d = "M" + f1(pts[0].x) + " " + f1(pts[0].y); for (var i = 1; i < pts.length; i++) d += " L" + f1(pts[i].x) + " " + f1(pts[i].y); return d; }

  function defs(svg, P) {
    var d = svg.querySelector("defs") || el("defs", {}, svg);
    d.insertAdjacentHTML("beforeend",
      /* kisördög: mélybordó bőr, felül-balról fény */
      '<radialGradient id="' + P + 'bor" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#e2684c"/><stop offset=".55" stop-color="#b53a2a"/><stop offset="1" stop-color="#6e1d17"/></radialGradient>' +
      '<radialGradient id="' + P + 'has" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#f3b089"/><stop offset="1" stop-color="#d27354"/></radialGradient>' +
      '<linearGradient id="' + P + 'szarv" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#e9dcc0"/><stop offset=".6" stop-color="#b9a27a"/><stop offset="1" stop-color="#4a3b26"/></linearGradient>' +
      '<linearGradient id="' + P + 'fa" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b98a4e"/><stop offset=".5" stop-color="#8a5a2c"/><stop offset="1" stop-color="#5b3818"/></linearGradient>' +
      '<linearGradient id="' + P + 'tegez" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6b4422"/><stop offset=".45" stop-color="#9c6a38"/><stop offset="1" stop-color="#5a3519"/></linearGradient>' +
      /* kisangyal: bőr, köntös, arany, toll */
      '<radialGradient id="' + P + 'abor" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#fdeedd"/><stop offset="1" stop-color="#ecc6a6"/></radialGradient>' +
      '<linearGradient id="' + P + 'kontos" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#f3eee2"/><stop offset="1" stop-color="#d9d0bb"/></linearGradient>' +
      '<linearGradient id="' + P + 'arany" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbe7a6"/><stop offset=".45" stop-color="#d9a945"/><stop offset="1" stop-color="#9a6b1c"/></linearGradient>' +
      '<linearGradient id="' + P + 'toll" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e6dfcf"/></linearGradient>' +
      '<radialGradient id="' + P + 'haj" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#fbe2a0"/><stop offset="1" stop-color="#c99a3e"/></radialGradient>' +
      '<radialGradient id="' + P + 'glor" cx="50%" cy="50%" r="50%"><stop offset=".55" stop-color="#ffe9a8" stop-opacity=".0"/><stop offset=".75" stop-color="#ffe29a" stop-opacity=".55"/><stop offset="1" stop-color="#ffe29a" stop-opacity="0"/></radialGradient>' +
      '<filter id="' + P + 'arny" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx=".6" dy="1.2" stdDeviation="1" flood-color="#2b1a10" flood-opacity=".28"/></filter>');
  }

  /* ======================= KISÖRDÖG ======================= */
  function ordog(szulo, P) {
    defs(szulo.ownerSVGElement || szulo, P);
    var g = el("g", { "class": "tj-ordog", filter: "url(#" + P + "arny)" }, szulo);
    var hatul = el("g", {}, g);                 /* a test mögötti dolgok: tegez, hátsó végtagok, farok */
    var tegez = el("g", {}, hatul);
    el("path", { d: "M-2 -40 L-13 -4 C-12 -1 -8 0 -6 -2 L4 -38 Z", fill: "url(#" + P + "tegez)", stroke: TUS, "stroke-width": 1.3, "stroke-linejoin": "round" }, tegez);
    el("path", { d: "M-9 -14 L1 -12 M-11 -8 L-1 -6", stroke: "#3c2410", "stroke-width": .9, fill: "none" }, tegez);
    el("path", { d: "M-1 -40 L-2 -47 M2 -39 L2.5 -46.5 M4.5 -38 L6 -45", stroke: "#6b4a2a", "stroke-width": 1, "stroke-linecap": "round" }, tegez);
    el("path", { d: "M-2 -47 l-2.2 -3.2 l2.6 1 l2 -1.6 l-.6 3.4 Z M2.5 -46.5 l-1.8 -3.4 l2.4 1.2 l2.2 -1.2 l-.8 3.4 Z M6 -45 l-1.4 -3.6 l2.4 1.4 l2.2 -1 l-1 3.4 Z", fill: "#b53a2a", stroke: TUS, "stroke-width": .5, "stroke-linejoin": "round" }, tegez);
    var farok = el("path", { fill: "none", stroke: TUS, "stroke-width": 4.4, "stroke-linecap": "round" }, hatul);
    var farok2 = el("path", { fill: "none", stroke: "url(#" + P + "bor)", "stroke-width": 2.6, "stroke-linecap": "round" }, hatul);
    var farokVeg = el("path", { d: "M0 0 C3 -4 8 -5 11 -2 C8 -1 6 2 6 6 C3 3 1 2 0 0 Z", fill: "#7a1c16", stroke: TUS, "stroke-width": 1, "stroke-linejoin": "round" }, hatul);
    var labH = [el("path", { fill: "url(#" + P + "bor)", stroke: TUS, "stroke-width": 1.3, "stroke-linejoin": "round" }, hatul), el("path", { fill: "url(#" + P + "bor)", stroke: TUS, "stroke-width": 1.3, "stroke-linejoin": "round" }, hatul)];
    var patkoH = el("path", { fill: "#2a1a14", stroke: TUS, "stroke-width": 1 }, hatul);
    var karH = [el("path", { fill: "url(#" + P + "bor)", stroke: TUS, "stroke-width": 1.3, "stroke-linejoin": "round" }, hatul), el("path", { fill: "url(#" + P + "bor)", stroke: TUS, "stroke-width": 1.3, "stroke-linejoin": "round" }, hatul)];
    var kezH = el("circle", { r: 3.6, fill: "url(#" + P + "bor)", stroke: TUS, "stroke-width": 1.1 }, hatul);
    /* törzs */
    var torzs = el("g", {}, g);
    el("path", { d: "M-12 3 C-15 -9 -13 -25 -8 -31 C-4 -35 4 -35 8 -31 C13 -25 15 -9 12 3 C7 8 -7 8 -12 3 Z", fill: "url(#" + P + "bor)", stroke: TUS, "stroke-width": 1.5, "stroke-linejoin": "round" }, torzs);
    el("path", { d: "M-5 -24 C-8 -14 -7 -3 0 1 C7 -3 8 -14 5 -24 C2 -27 -2 -27 -5 -24 Z", fill: "url(#" + P + "has)", opacity: .9 }, torzs);
    el("path", { d: "M-3 -17 C0 -16 2 -16 4 -17 M-3 -11 C0 -10 2 -10 4 -11 M-2 -5 C0 -4 2 -4 3 -5", fill: "none", stroke: "#a3503a", "stroke-width": .8, "stroke-linecap": "round" }, torzs);
    /* vésett árnyékolás a jobb oldalon */
    el("path", { d: "M9 -26 C11 -20 12 -12 11 -4 M7 -22 C9 -17 10 -10 9 -2 M10 -28 C12 -24 13 -18 13 -12", fill: "none", stroke: "#4a120e", "stroke-width": .7, opacity: .55, "stroke-linecap": "round" }, torzs);
    var kotelTek = el("g", {}, torzs);          /* kötéltekercs a csípőn (a lövésig) */
    for (var i = 0; i < 3; i++) el("ellipse", { cx: 7 + i * .6, cy: -4 + i * 1.2, rx: 6, ry: 4, fill: "none", stroke: "#8a6230", "stroke-width": 1.8 }, kotelTek);
    el("ellipse", { cx: 8, cy: -2, rx: 6, ry: 4, fill: "none", stroke: "#c79a5a", "stroke-width": .7, "stroke-dasharray": "1.2 1.4" }, kotelTek);
    /* fej */
    var fej = el("g", {}, g);
    var szarvB = el("path", { d: "M-7 -24 C-12 -30 -14 -38 -11 -44 C-9 -38 -6 -32 -2 -27 Z", fill: "url(#" + P + "szarv)", stroke: TUS, "stroke-width": 1.1, "stroke-linejoin": "round" }, fej);
    var szarvJ = el("path", { d: "M7 -24 C12 -30 14 -38 11 -44 C9 -38 6 -32 2 -27 Z", fill: "url(#" + P + "szarv)", stroke: TUS, "stroke-width": 1.1, "stroke-linejoin": "round" }, fej);
    el("path", { d: "M-9.8 -36 l2 -1.2 M-10.6 -32 l2.4 -1 M9.8 -36 l-2 -1.2 M10.6 -32 l-2.4 -1", stroke: TUS, "stroke-width": .6 }, fej);
    el("path", { d: "M-13 -15 L-21 -21 L-14 -10 Z", fill: "url(#" + P + "bor)", stroke: TUS, "stroke-width": 1.1, "stroke-linejoin": "round" }, fej);
    el("path", { d: "M13 -15 L21 -21 L14 -10 Z", fill: "url(#" + P + "bor)", stroke: TUS, "stroke-width": 1.1, "stroke-linejoin": "round" }, fej);
    el("path", { d: "M0 -27 C9 -27 15 -21 15 -13 C15 -5 9 1 0 1 C-9 1 -15 -5 -15 -13 C-15 -21 -9 -27 0 -27 Z", fill: "url(#" + P + "bor)", stroke: TUS, "stroke-width": 1.5 }, fej);
    el("path", { d: "M-4 2 C-2 5 2 5 4 2 L0 7 Z", fill: "#5a1510", stroke: TUS, "stroke-width": .8, "stroke-linejoin": "round" }, fej);   /* kecskeszakáll */
    el("ellipse", { cx: -8, cy: -6, rx: 3, ry: 1.8, fill: "#ff8a6a", opacity: .45 }, fej);
    el("ellipse", { cx: 8, cy: -6, rx: 3, ry: 1.8, fill: "#ff8a6a", opacity: .45 }, fej);
    var szem = el("g", {}, fej);
    var szemB = el("ellipse", { cx: -5.2, cy: -13, rx: 3.6, ry: 4.2, fill: "#fffbe9", stroke: TUS, "stroke-width": .9 }, szem);
    var szemJ = el("ellipse", { cx: 5.2, cy: -13, rx: 3.6, ry: 4.2, fill: "#fffbe9", stroke: TUS, "stroke-width": .9 }, szem);
    var pupB = el("circle", { r: 1.7, fill: "#1a1a1a" }, szem), pupJ = el("circle", { r: 1.7, fill: "#1a1a1a" }, szem);
    var csilB = el("circle", { r: .6, fill: "#fff" }, szem), csilJ = el("circle", { r: .6, fill: "#fff" }, szem);
    var szemhejB = el("path", { fill: "url(#" + P + "bor)", stroke: TUS, "stroke-width": .8 }, szem);
    var szemhejJ = el("path", { fill: "url(#" + P + "bor)", stroke: TUS, "stroke-width": .8 }, szem);
    var szemoldok = el("path", { fill: "none", stroke: "#3a0d0a", "stroke-width": 1.5, "stroke-linecap": "round" }, fej);
    el("path", { d: "M-1.2 -8.5 C-.5 -7.5 .5 -7.5 1.2 -8.5", fill: "none", stroke: "#5a1510", "stroke-width": .9, "stroke-linecap": "round" }, fej);
    var szaj = el("path", { fill: "#3a0d0a", stroke: TUS, "stroke-width": 1, "stroke-linejoin": "round" }, fej);
    var agyar = el("path", { fill: "#fffbe9", stroke: TUS, "stroke-width": .5 }, fej);
    var szedul = el("path", { d: "M-8 -13 m-2.6 0 a2.6 2.6 0 1 1 2.6 2.6 a1.6 1.6 0 1 1 -1.6 -1.6 M8 -13 m-2.6 0 a2.6 2.6 0 1 1 2.6 2.6 a1.6 1.6 0 1 1 -1.6 -1.6", fill: "none", stroke: TUS, "stroke-width": .9, opacity: 0 }, fej);
    /* elülső végtagok és íj */
    var labE = [el("path", { fill: "url(#" + P + "bor)", stroke: TUS, "stroke-width": 1.3, "stroke-linejoin": "round" }, g), el("path", { fill: "url(#" + P + "bor)", stroke: TUS, "stroke-width": 1.3, "stroke-linejoin": "round" }, g)];
    var patkoE = el("path", { fill: "#2a1a14", stroke: TUS, "stroke-width": 1 }, g);
    var ij = el("g", { opacity: 0 }, g);
    var ijFa = el("path", { fill: "none", stroke: TUS, "stroke-width": 3.4, "stroke-linecap": "round" }, ij);
    var ijFa2 = el("path", { fill: "none", stroke: "url(#" + P + "fa)", "stroke-width": 2, "stroke-linecap": "round" }, ij);
    var ijHur = el("path", { fill: "none", stroke: "#efe6d0", "stroke-width": .7 }, ij);
    var ijNyil = el("g", {}, ij);
    el("line", { x1: -2, y1: 0, x2: 26, y2: 0, stroke: "#6b4a2a", "stroke-width": 1.2 }, ijNyil);
    el("path", { d: "M26 -2.6 L32 0 L26 2.6 Z", fill: "#cfd6de", stroke: TUS, "stroke-width": .6 }, ijNyil);
    el("path", { d: "M-2 0 l-4 -3 l4 1 Z M-2 0 l-4 3 l4 -1 Z", fill: "#b53a2a", stroke: TUS, "stroke-width": .4 }, ijNyil);
    var karE = [el("path", { fill: "url(#" + P + "bor)", stroke: TUS, "stroke-width": 1.3, "stroke-linejoin": "round" }, g), el("path", { fill: "url(#" + P + "bor)", stroke: TUS, "stroke-width": 1.3, "stroke-linejoin": "round" }, g)];
    var kezE = el("circle", { r: 3.8, fill: "url(#" + P + "bor)", stroke: TUS, "stroke-width": 1.1 }, g);

    var VALL_B = { x: -9, y: -28 }, VALL_J = { x: 9, y: -28 }, CSIP_B = { x: -6, y: 1 }, CSIP_J = { x: 6, y: 1 };
    var KAR1 = 17, KAR2 = 16, LAB1 = 13, LAB2 = 13, NYAK = { x: 0, y: -31 };

    /* allapot: { fejSzog, torzsSzog, kezE:{x,y}, kezH:{x,y}, labE:{x,y}, labH:{x,y}, farokFazis, kifejezes, nez:{x,y}, ij:{lathato, szog, feszit, nyil}, kotelTekercs } */
    function rajzol(a) {
      var tf = "rotate(" + f1(a.torzsSzog || 0) + ")";
      torzs.setAttribute("transform", tf); tegez.setAttribute("transform", tf);
      var fejT = { x: NYAK.x, y: NYAK.y };
      var cs = Math.cos(rad(a.torzsSzog || 0)), sn = Math.sin(rad(a.torzsSzog || 0));
      function rot(p) { return { x: p.x * cs - p.y * sn, y: p.x * sn + p.y * cs }; }
      var nyak = rot(fejT);
      fej.setAttribute("transform", "translate(" + f1(nyak.x) + " " + f1(nyak.y + 3) + ") rotate(" + f1((a.torzsSzog || 0) + (a.fejSzog || 0)) + ") translate(0 -1)");
      /* végtagok IK-val */
      var vE = rot(VALL_J), vH = rot(VALL_B), cE = CSIP_J, cH = CSIP_B;
      var kE = ik(vE, a.kezE || { x: 14, y: -6 }, KAR1, KAR2, a.konyokE || 1);
      var kH = ik(vH, a.kezH || { x: -14, y: -6 }, KAR1, KAR2, a.konyokH || -1);
      var lE = ik(cE, a.labE || { x: 6, y: 27 }, LAB1, LAB2, a.terdE || -1);
      var lH = ik(cH, a.labH || { x: -6, y: 27 }, LAB1, LAB2, a.terdH || 1);
      karE[0].setAttribute("d", kapszula(vE, kE.E, 3.6, 3)); karE[1].setAttribute("d", kapszula(kE.E, kE.H, 3, 2.6));
      karH[0].setAttribute("d", kapszula(vH, kH.E, 3.6, 3)); karH[1].setAttribute("d", kapszula(kH.E, kH.H, 3, 2.6));
      kezE.setAttribute("cx", f1(kE.H.x)); kezE.setAttribute("cy", f1(kE.H.y));
      kezH.setAttribute("cx", f1(kH.H.x)); kezH.setAttribute("cy", f1(kH.H.y));
      labE[0].setAttribute("d", kapszula(cE, lE.E, 4.4, 3.6)); labE[1].setAttribute("d", kapszula(lE.E, lE.H, 3.6, 3));
      labH[0].setAttribute("d", kapszula(cH, lH.E, 4.4, 3.6)); labH[1].setAttribute("d", kapszula(lH.E, lH.H, 3.6, 3));
      function pata(H, E) { var ang = Math.atan2(H.y - E.y, H.x - E.x) - Math.PI / 2; var c = Math.cos(ang), s = Math.sin(ang);
        var p = [[-4, 0], [4, 0], [4.4, 3.4], [-4.4, 3.4]].map(function (q) { return { x: H.x + q[0] * c - q[1] * s, y: H.y + q[0] * s + q[1] * c }; });
        return vonal(p) + " Z"; }
      patkoE.setAttribute("d", pata(lE.H, lE.E)); patkoH.setAttribute("d", pata(lH.H, lH.E));
      /* farok: hullámzó, három szakaszos */
      var fz = a.farokFazis || 0, tb = rot({ x: -9, y: -1 });
      var p1 = { x: tb.x - 10, y: tb.y + 4 + Math.sin(fz) * 4 }, p2 = { x: tb.x - 20 + Math.cos(fz * .8) * 3, y: tb.y - 4 + Math.sin(fz + 1.2) * 6 }, p3 = { x: tb.x - 22 + Math.sin(fz * .7) * 4, y: tb.y - 16 + Math.cos(fz + .5) * 4 };
      var fd = "M" + f1(tb.x) + " " + f1(tb.y) + " C" + f1(p1.x) + " " + f1(p1.y) + " " + f1(p2.x) + " " + f1(p2.y) + " " + f1(p3.x) + " " + f1(p3.y);
      farok.setAttribute("d", fd); farok2.setAttribute("d", fd);
      var vszog = Math.atan2(p3.y - p2.y, p3.x - p2.x) * 180 / Math.PI;
      farokVeg.setAttribute("transform", "translate(" + f1(p3.x) + " " + f1(p3.y) + ") rotate(" + f1(vszog - 30) + ") scale(.9)");
      /* arc */
      var k = a.kifejezes || "ravasz", nz = a.nez || { x: 1, y: 0 };
      var px = Math.max(-1.4, Math.min(1.4, nz.x * 1.4)), py = Math.max(-1.6, Math.min(1.6, nz.y * 1.6));
      var tagra = k === "rémült" ? 1.25 : 1;
      szemB.setAttribute("rx", 3.6 * tagra); szemB.setAttribute("ry", 4.2 * tagra); szemJ.setAttribute("rx", 3.6 * tagra); szemJ.setAttribute("ry", 4.2 * tagra);
      var pr = k === "rémült" ? 1.1 : 1.7;
      pupB.setAttribute("r", pr); pupJ.setAttribute("r", pr);
      pupB.setAttribute("cx", f1(-5.2 + px)); pupB.setAttribute("cy", f1(-13 + py)); pupJ.setAttribute("cx", f1(5.2 + px)); pupJ.setAttribute("cy", f1(-13 + py));
      csilB.setAttribute("cx", f1(-5.8 + px)); csilB.setAttribute("cy", f1(-13.8 + py)); csilJ.setAttribute("cx", f1(4.6 + px)); csilJ.setAttribute("cy", f1(-13.8 + py));
      var hejz = k === "alszik" ? 3.25 : k === "énekel" ? 1.9 : k === "ravasz" ? 1.2 : k === "elégedett" ? .4 : k === "erőlködik" ? .6 : k === "rémült" ? -2 : k === "szédült" ? -2 : 0;
      function hej(cx) { var y = -17.2 + hejz * 2.6; return "M" + (cx - 4) + " -17.5 C" + (cx - 3) + " -19 " + (cx + 3) + " -19 " + (cx + 4) + " -17.5 L" + (cx + 4) + " " + f1(y) + " C" + (cx + 2) + " " + f1(y + 1.2) + " " + (cx - 2) + " " + f1(y + 1.2) + " " + (cx - 4) + " " + f1(y) + " Z"; }
      szemhejB.setAttribute("d", hej(-5.2)); szemhejJ.setAttribute("d", hej(5.2));
      var szed = k === "szédült";
      szedul.setAttribute("opacity", szed ? 1 : 0);
      [pupB, pupJ, csilB, csilJ, szemhejB, szemhejJ].forEach(function (e) { e.setAttribute("opacity", szed ? 0 : 1); });
      szemoldok.setAttribute("d", k === "rémült" ? "M-9 -21 C-7 -23 -3 -23 -2 -21.5 M2 -21.5 C3 -23 7 -23 9 -21" :
        k === "erőlködik" ? "M-9 -18 L-2 -16.5 M2 -16.5 L9 -18" : k === "alszik" ? "M-9 -19 C-6 -20.2 -3.5 -20 -2 -19.2 M2 -19.2 C3.5 -20 6 -20.2 9 -19" : k === "énekel" ? "M-9 -21.5 C-7 -23.4 -4 -23.2 -2.2 -21.6 M2.2 -21.6 C4 -23.2 7 -23.4 9 -21.5" : k === "szédült" ? "M-9 -20 C-6 -21 -3 -20 -2 -19 M2 -19 C3 -20 6 -21 9 -20" : "M-9 -20 L-2 -17.2 M2 -17.2 L9 -20");
      if (k === "rémült") { szaj.setAttribute("d", "M-3 -3.5 C-3 -6.5 3 -6.5 3 -3.5 C3 -.5 -3 -.5 -3 -3.5 Z"); agyar.setAttribute("d", ""); }
      else if (k === "erőlködik") { szaj.setAttribute("d", "M-5 -4 L5 -4 L4 -2 L-4 -2 Z"); agyar.setAttribute("d", "M-4 -4 L4 -4 L3.5 -3 L-3.5 -3 Z"); }
      else if (k === "szédült") { szaj.setAttribute("d", "M-5 -3 C-3 -5 -1 -1 1 -3 C3 -5 4 -2 5 -3 L5 -2 C3 -1 -3 -1 -5 -2 Z"); agyar.setAttribute("d", ""); }
      else if (k === "énekel") { var n = .6 + 2.6 * (a.szajNyit || 0); szaj.setAttribute("d", "M-3.6 -4.6 C-3.6 " + f1(-6.6) + " 3.6 " + f1(-6.6) + " 3.6 -4.6 C3.6 " + f1(-4.2 + n * 1.4) + " -3.6 " + f1(-4.2 + n * 1.4) + " -3.6 -4.6 Z"); agyar.setAttribute("d", "M1.8 -6.1 L2.6 -4.9 L3.2 -6 Z"); }
      else if (k === "alszik") { var ny = a.szajNyit || 0; szaj.setAttribute("d", "M-2.4 -4 C-1.2 " + f1(-4.6 - ny) + " 1.2 " + f1(-4.6 - ny) + " 2.4 -4 C1.2 " + f1(-3 + ny) + " -1.2 " + f1(-3 + ny) + " -2.4 -4 Z"); agyar.setAttribute("d", ""); }
      else { szaj.setAttribute("d", "M-6 -5 C-3 -1.5 3 -1.5 7 -5.5 C5 -.2 -3 .8 -6 -5 Z"); agyar.setAttribute("d", "M3.6 -3.6 L4.6 -1.2 L5.4 -4.2 Z"); }
      /* íj */
      var ia = a.ij || {};
      ij.setAttribute("opacity", ia.lathato ? 1 : 0);
      if (ia.lathato) {
        var H = ia.kez === "E" ? kE.H : kH.H, sz = rad(ia.szog || 0), cx2 = Math.cos(sz), sx2 = Math.sin(sz);
        function R(x, y) { return { x: H.x + x * cx2 - y * sx2, y: H.y + x * sx2 + y * cx2 }; }
        var v1 = R(-3, -17), v2 = R(-3, 17), mid = R(6, 0), hz = R(-3 - (ia.feszit || 0) * 13, 0);
        var fd2 = "M" + f1(v1.x) + " " + f1(v1.y) + " Q" + f1(mid.x + (mid.x - H.x) * .6) + " " + f1(mid.y + (mid.y - H.y) * .6) + " " + f1(v2.x) + " " + f1(v2.y);
        ijFa.setAttribute("d", fd2); ijFa2.setAttribute("d", fd2);
        ijHur.setAttribute("d", vonal([v1, hz, v2]));
        ijNyil.setAttribute("opacity", ia.nyil ? 1 : 0);
        ijNyil.setAttribute("transform", "translate(" + f1(hz.x) + " " + f1(hz.y) + ") rotate(" + f1(ia.szog || 0) + ")");
      }
      kotelTek.setAttribute("opacity", a.kotelTekercs ? 1 : 0);
      tegez.setAttribute("opacity", a.tegez === false ? 0 : 1);
      return { kezE: kE.H, kezH: kH.H };
    }
    return { g: g, rajzol: rajzol, VALL_J: VALL_J, VALL_B: VALL_B, KARHOSSZ: KAR1 + KAR2, LABHOSSZ: LAB1 + LAB2 };
  }

  /* ======================= KISANGYAL ======================= */
  function angyal(szulo, P) {
    defs(szulo.ownerSVGElement || szulo, P);
    var g = el("g", { "class": "tj-angyal", filter: "url(#" + P + "arny)" }, szulo);
    var szarnyH = el("g", {}, g), szarnyEc = el("g", {}, g), szarnyE;
    function szarny(cs) {
      var w = el("g", {}, cs);
      /* három tollsor: fedőtollak, középső, evezőtollak */
      el("path", { d: "M0 0 C-10 -14 -30 -24 -50 -26 C-46 -22 -50 -18 -44 -15 C-50 -12 -46 -7 -40 -6 C-44 -2 -38 2 -32 1 C-34 5 -27 8 -22 5 C-20 10 -12 10 -9 5 C-5 6 -2 3 0 0 Z", fill: "url(#" + P + "toll)", stroke: TUS, "stroke-width": 1.2, "stroke-linejoin": "round" }, w);
      el("path", { d: "M-6 -6 C-18 -14 -32 -19 -46 -22 M-8 -3 C-20 -9 -32 -12 -42 -13 M-9 0 C-19 -3 -28 -4 -36 -3 M-8 2 C-15 2 -22 3 -27 4 M-6 3 C-10 5 -14 6 -18 6", fill: "none", stroke: TUS2, "stroke-width": .7, "stroke-linecap": "round" }, w);
      el("path", { d: "M0 0 C-6 -8 -16 -13 -26 -14 C-20 -9 -14 -4 -6 2 Z", fill: "#fffdf6", stroke: TUS, "stroke-width": .9, "stroke-linejoin": "round" }, w);
      return w;
    }
    var wH = szarny(szarnyH); szarnyE = szarny(szarnyEc);
    var labak = el("g", {}, g);
    var talpB = el("path", { d: "M-6 22 C-8 22 -10 24 -9 26 C-7 27 -4 26 -3 24 Z", fill: "url(#" + P + "abor)", stroke: TUS, "stroke-width": 1 }, labak);
    var talpJ = el("path", { d: "M4 22 C3 24 5 26 8 26 C10 25 9 22 7 22 Z", fill: "url(#" + P + "abor)", stroke: TUS, "stroke-width": 1 }, labak);
    var kontos = el("g", {}, g);
    el("path", { d: "M-8 -30 C-12 -18 -15 -2 -17 18 C-12 21 -8 18 -5 21 C-2 18 2 21 5 18 C8 21 12 18 17 19 C15 -2 12 -18 8 -30 C3 -33 -3 -33 -8 -30 Z", fill: "url(#" + P + "kontos)", stroke: TUS, "stroke-width": 1.4, "stroke-linejoin": "round" }, kontos);
    el("path", { d: "M-17 18 C-12 21 -8 18 -5 21 C-2 18 2 21 5 18 C8 21 12 18 17 19 L16.6 16 C12 15 8 18 5 15 C2 18 -2 15 -5 18 C-8 15 -12 18 -16.5 15 Z", fill: "url(#" + P + "arany)", stroke: TUS, "stroke-width": .7 }, kontos);
    el("path", { d: "M-9 -9 C-3 -7 3 -7 9 -9 L9.6 -6 C3 -4 -3 -4 -9.6 -6 Z", fill: "url(#" + P + "arany)", stroke: TUS, "stroke-width": .7 }, kontos);
    el("path", { d: "M-4 -5 C-6 4 -8 10 -10 16 M2 -4 C2 4 3 10 3 15 M7 -5 C9 3 11 9 12 15 M-6 -26 C-7 -18 -8 -12 -8 -9", fill: "none", stroke: "#b9ae95", "stroke-width": .8, "stroke-linecap": "round" }, kontos);
    el("path", { d: "M-5 -31 C-2 -28 2 -28 5 -31", fill: "none", stroke: "url(#" + P + "arany)", "stroke-width": 1.6 }, kontos);
        var karH = el("path", { fill: "url(#" + P + "kontos)", stroke: TUS, "stroke-width": 1.2, "stroke-linejoin": "round" }, g);
    var fej = el("g", {}, g);
    var glor = el("ellipse", { cx: 0, cy: -27, rx: 13, ry: 5, fill: "url(#" + P + "glor)" }, fej);
    el("circle", { cx: 0, cy: -11, r: 11, fill: "url(#" + P + "abor)", stroke: TUS, "stroke-width": 1.3 }, fej);
    /* göndör haj */
    [[-9, -16, 4.2], [-5, -20, 4.6], [0, -21.5, 4.8], [5, -20, 4.6], [9, -16, 4.2], [-10.5, -11, 3.2], [10.5, -11, 3.2]].forEach(function (c) {
      el("circle", { cx: c[0], cy: c[1], r: c[2], fill: "url(#" + P + "haj)", stroke: TUS, "stroke-width": .9 }, fej);
      el("path", { d: "M" + (c[0] - c[2] * .4) + " " + (c[1] + .4) + " a" + (c[2] * .45) + " " + (c[2] * .45) + " 0 1 1 " + (c[2] * .6) + " " + (c[2] * .3), fill: "none", stroke: "#9a6b1c", "stroke-width": .6 }, fej);
    });
    el("path", { d: "M-6 -14 C-3 -17 3 -17 6 -14 C4 -15.5 -4 -15.5 -6 -14 Z", fill: "url(#" + P + "haj)" }, fej);
    el("ellipse", { cx: -6, cy: -6.5, rx: 2.4, ry: 1.5, fill: "#ff9e8a", opacity: .55 }, fej);
    el("ellipse", { cx: 6, cy: -6.5, rx: 2.4, ry: 1.5, fill: "#ff9e8a", opacity: .55 }, fej);
    var aszem = el("g", {}, fej);
    var aszemB = el("path", { fill: "#2a2a35", stroke: TUS, "stroke-width": .8, "stroke-linecap": "round" }, aszem);
    var aszemJ = el("path", { fill: "#2a2a35", stroke: TUS, "stroke-width": .8, "stroke-linecap": "round" }, aszem);
    var aszaj = el("path", { fill: "#b8443a", stroke: TUS, "stroke-width": .8, "stroke-linecap": "round" }, fej);
    var glorGy = el("ellipse", { cx: 0, cy: -27, rx: 9, ry: 2.6, fill: "none", stroke: "url(#" + P + "arany)", "stroke-width": 2 }, fej);
    var karE = el("path", { fill: "url(#" + P + "kontos)", stroke: TUS, "stroke-width": 1.2, "stroke-linejoin": "round" }, g);
    var kezE = el("circle", { r: 3, fill: "url(#" + P + "abor)", stroke: TUS, "stroke-width": 1 }, g);
    var kezH = el("circle", { r: 3, fill: "url(#" + P + "abor)", stroke: TUS, "stroke-width": 1 }, g);
    var ollo = el("g", {}, g);
    var penge1 = el("path", { d: "M0 0 L18 -1.6 L18 .2 Z", fill: "#e8edf2", stroke: TUS, "stroke-width": .7, "stroke-linejoin": "round" }, ollo);
    var penge2 = el("path", { d: "M0 0 L18 1.6 L18 -.2 Z", fill: "#cfd8e2", stroke: TUS, "stroke-width": .7, "stroke-linejoin": "round" }, ollo);
    var fogo1 = el("ellipse", { cx: -5, cy: -3, rx: 3.4, ry: 2.6, fill: "none", stroke: "url(#" + P + "arany)", "stroke-width": 1.8 }, ollo);
    var fogo2 = el("ellipse", { cx: -5, cy: 3, rx: 3.4, ry: 2.6, fill: "none", stroke: "url(#" + P + "arany)", "stroke-width": 1.8 }, ollo);
    el("circle", { cx: 0, cy: 0, r: 1.1, fill: "url(#" + P + "arany)", stroke: TUS, "stroke-width": .4 }, ollo);

    var VALL_E = { x: 7, y: -27 }, VALL_H = { x: -7, y: -27 };
    function rajzol(a) {
      var dl = a.dolES || 0;
      g.setAttribute("data-x", 0);
      kontos.setAttribute("transform", "rotate(" + f1(dl) + ")");
      fej.setAttribute("transform", "rotate(" + f1(dl + (a.fejSzog || 0)) + " 0 -31) translate(0 -31)");
      var cs = Math.cos(rad(dl)), sn = Math.sin(rad(dl));
      function rot(p) { return { x: p.x * cs - p.y * sn, y: p.x * sn + p.y * cs }; }
      var sz = a.szarny || 0;   /* -1 … 1 : csapás fázisa */
      var nyit = 18 + sz * 34;
      var vh = rot({ x: -3, y: -24 }), ve = rot({ x: 3, y: -24 });
      szarnyH.setAttribute("transform", "translate(" + f1(vh.x) + " " + f1(vh.y) + ") rotate(" + f1(dl - nyit + 10) + ") scale(.95)");
      szarnyEc.setAttribute("transform", "translate(" + f1(ve.x) + " " + f1(ve.y) + ") scale(-1 1) rotate(" + f1(-dl - nyit) + ")");
      var vE = rot(VALL_E), vH = rot(VALL_H);
      var kE = ik(vE, a.kezE || { x: 14, y: -12 }, 9.5, 9, 1), kH = ik(vH, a.kezH || { x: -12, y: -10 }, 9.5, 9, -1);
      karE.setAttribute("d", kapszula(vE, kE.E, 3.6, 3.2) + kapszula(kE.E, kE.H, 3.2, 2.6));
      karH.setAttribute("d", kapszula(vH, kH.E, 3.6, 3.2) + kapszula(kH.E, kH.H, 3.2, 2.6));
      kezE.setAttribute("cx", f1(kE.H.x)); kezE.setAttribute("cy", f1(kE.H.y)); kezH.setAttribute("cx", f1(kH.H.x)); kezH.setAttribute("cy", f1(kH.H.y));
      labak.setAttribute("transform", "rotate(" + f1(dl * .6) + ") translate(0 " + f1(a.labLeng || 0) + ")");
      var k = a.kifejezes || "nyugodt";
      if (k === "meglepett") { aszemB.setAttribute("d", "M-5.5 -11 m-2 0 a2 2.4 0 1 0 4 0 a2 2.4 0 1 0 -4 0"); aszemJ.setAttribute("d", "M5.5 -11 m-2 0 a2 2.4 0 1 0 4 0 a2 2.4 0 1 0 -4 0"); aszaj.setAttribute("d", "M-1.6 -4.5 a1.6 2 0 1 0 3.2 0 a1.6 2 0 1 0 -3.2 0"); }
      else if (k === "eltökélt") { aszemB.setAttribute("d", "M-7.5 -12.5 L-3.5 -11.5 L-3.6 -10 L-7.4 -10.2 Z"); aszemJ.setAttribute("d", "M3.5 -11.5 L7.5 -12.5 L7.4 -10.2 L3.6 -10 Z"); aszaj.setAttribute("d", "M-2.5 -4.5 L2.5 -4.8"); }
      else if (k === "boldog") { aszemB.setAttribute("d", "M-7.5 -10.5 C-6.5 -13 -4.5 -13 -3.5 -10.5"); aszemJ.setAttribute("d", "M3.5 -10.5 C4.5 -13 6.5 -13 7.5 -10.5"); aszaj.setAttribute("d", "M-3.5 -5.5 C-2 -2.5 2 -2.5 3.5 -5.5 Z"); }
      else { aszemB.setAttribute("d", "M-5.5 -11 m-1.5 0 a1.5 1.8 0 1 0 3 0 a1.5 1.8 0 1 0 -3 0"); aszemJ.setAttribute("d", "M5.5 -11 m-1.5 0 a1.5 1.8 0 1 0 3 0 a1.5 1.8 0 1 0 -3 0"); aszaj.setAttribute("d", "M-2.4 -5 C-1 -3.6 1 -3.6 2.4 -5"); }
      aszemB.setAttribute("fill", k === "boldog" ? "none" : "#2a2a35"); aszemJ.setAttribute("fill", k === "boldog" ? "none" : "#2a2a35");
      aszemB.setAttribute("stroke-width", k === "boldog" ? 1.1 : .6); aszemJ.setAttribute("stroke-width", k === "boldog" ? 1.1 : .6);
      glor.setAttribute("opacity", .7 + .3 * Math.sin((a.ido || 0) * 3));
      /* olló */
      var o = a.ollo || {};
      ollo.setAttribute("opacity", o.lathato ? 1 : 0);
      if (o.lathato) {
        var ny = (o.nyitas || 0) * 26;
        penge1.setAttribute("transform", "rotate(" + f1(-ny) + ")"); fogo1.setAttribute("transform", "rotate(" + f1(-ny) + ")");
        penge2.setAttribute("transform", "rotate(" + f1(ny) + ")"); fogo2.setAttribute("transform", "rotate(" + f1(ny) + ")");
        ollo.setAttribute("transform", "translate(" + f1(kE.H.x) + " " + f1(kE.H.y) + ") rotate(" + f1(o.szog || 0) + ") scale(.95)");
      }
      return { kezE: kE.H, olloHegy: o.lathato ? { x: kE.H.x + Math.cos(rad(o.szog || 0)) * 16, y: kE.H.y + Math.sin(rad(o.szog || 0)) * 16 } : null };
    }
    return { g: g, rajzol: rajzol };
  }

  window.TJSzereplok = { ordog: ordog, angyal: angyal, ik: ik };
})();
