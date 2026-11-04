/* Dzsámi-jelenet elhelyezése: az „üres rész” bal szélének mérése.
   Az a tároló, amelyen  data-dzs-tartalom="<CSS-választó>"  áll, megkapja a --dzs-bal változót:
   a benne lévő tartalom (a választóval megadott elemek) jobb széle + 14 px, a tároló bal szélétől mérve.
   A CSS ebből teszi a jelenet képét pontosan a tartalom és a jobb szél közé, így a dzsámi az üres rész közepén áll.
   Átméretezésre, betűtípus-betöltésre, nyelvváltásra és új tartalomra (webáruház oldalváltás) magától frissül. */
(function () {
  if (window.__dzsHely) return; window.__dzsHely = true;
  var raf = 0;
  function frissit() {
    raf = 0;
    tvTorony();
    var tarolok = document.querySelectorAll("[data-dzs-tartalom]");
    for (var i = 0; i < tarolok.length; i++) {
      var c = tarolok[i], cr = c.getBoundingClientRect(), max = 0;
      if (!cr.width) continue;
      var el = c.querySelectorAll(c.getAttribute("data-dzs-tartalom"));
      for (var j = 0; j < el.length; j++) {
        /* a tényleges tartalom (szöveg, gomb) jobb széle számít, nem a teljes szélességű dobozé */
        var rg = document.createRange(); rg.selectNodeContents(el[j]);
        var rs = rg.getClientRects(), rr = el[j].getBoundingClientRect();
        var jobb = 0;
        for (var q = 0; q < rs.length; q++) if (rs[q].width && rs[q].height) jobb = Math.max(jobb, rs[q].right);
        if (!jobb && rr.width && rr.height) jobb = rr.right;
        if (getComputedStyle(el[j]).display.indexOf("inline") === 0 || el[j].matches("a,button")) jobb = Math.max(jobb, rr.right);
        if (jobb - cr.left > max) max = jobb - cr.left;
      }
      var v = Math.round(max + 14) + "px";
      if (c.style.getPropertyValue("--dzs-bal") !== v) c.style.setProperty("--dzs-bal", v);
    }
  }

  /* Térkép helye (főoldal)
     1) A TV-torony rögzített helyen áll: a bal oldali üres rész közepén – a doboz bal szélétől a középre
        igazított írások, illetve a székesegyház (amelyik közelebb van) bal széléig. A szöveg vízszintes
        mozgatása ezt NEM befolyásolja (az írások eredeti, középre igazított helyéből számol).
     2) Az írások együttese (változatlan formában és magasságban) vízszintesen pontosan a TV-torony jobb széle
        és a székesegyház bal széle közé kerül, középre – ha nem fér el, a dobozon belül marad. */
  function tvTorony() {
    var b = document.querySelector(".map-ph"); if (!b) return;
    var r = b.getBoundingClientRect(), W = r.width, H = r.height; if (!W || !H) return;
    var mobil = window.matchMedia("(max-width:760px)").matches;
    var ht = mobil ? .54 * H : Math.min(.86 * H, 440), wt = ht * 448.667 / 1469.33;
    var hc = mobil ? .54 * H * 1.00192 - .01 : Math.min(.86 * H, 440) * 1.00192 - 2.01, wc = hc * 1139 / 995.333;
    var szekKep = (W - wc) * (mobil ? .98 : .97);              /* a székesegyház képének bal széle */
    var gw = 0;                                                 /* az írások együttesének szélessége (a legszélesebb sor) */
    for (var i = 0; i < b.children.length; i++) if (!b.children[i].classList.contains("tj-svg")) gw = Math.max(gw, b.children[i].getBoundingClientRect().width);
    var szovegBal0 = (W - gw) / 2;                              /* az eredeti, középre igazított helyzet bal széle */
    var tvBal = Math.min(szekKep, szovegBal0) / 2 - wt / 2;     /* a toronykép bal széle (a rajz a kép közepén van) */
    var tvJobb = tvBal + wt * .74138;                           /* a torony látható jobb széle */
    var szekBal = szekKep + wc * .0224;                         /* a székesegyház látható bal széle (a rajz első vonala) */
    var cel = (tvJobb + szekBal) / 2 - gw / 2;                  /* az írások bal széle: pontosan a kettő között középen */
    /* ha a kettő között nem fér el (keskeny, magas doboz), a torony jobb széle és a doboz jobb széle között középen áll,
       így a tornyot sosem takarja */
    if (szekBal - tvJobb < gw + 24) cel = (tvJobb + W) / 2 - gw / 2;
    cel = Math.max(tvJobb + 12, Math.min(W - 12 - gw, cel));
    var v = tvBal.toFixed(1) + "px", dx = (cel - szovegBal0).toFixed(1) + "px";
    if (b.style.getPropertyValue("--tv-bal") !== v) b.style.setProperty("--tv-bal", v);
    if (b.style.getPropertyValue("--szoveg-x") !== dx) b.style.setProperty("--szoveg-x", dx);
  }
  function kesobb() { if (!raf) raf = requestAnimationFrame(frissit); }
  window.addEventListener("resize", kesobb);
  window.addEventListener("load", kesobb);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", kesobb); else kesobb();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(kesobb);
  if (window.MutationObserver) new MutationObserver(kesobb).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
})();
