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
  function kesobb() { if (!raf) raf = requestAnimationFrame(frissit); }
  window.addEventListener("resize", kesobb);
  window.addEventListener("load", kesobb);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", kesobb); else kesobb();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(kesobb);
  if (window.MutationObserver) new MutationObserver(kesobb).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
})();
