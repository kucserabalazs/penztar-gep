<?php
require __DIR__ . '/../inc/sablon.php';
ptg_fej('Melyik pénztárgépet válasszam? Pénztárgép-választási segítség | Totál Pécs',
  'Asztali, hordozható vagy rendszerbe köthető pénztárgép, esetleg érintőképernyős POS? Néhány kérdés alapján segítünk kiválasztani a vállalkozásához illő megoldást.',
  '/penztargep-valasztas/', [['Kezdőlap', '/'], ['Pénztárgép-választási segítség', '/penztargep-valasztas/']]); ?>
<h1>Melyik pénztárgép illik Önhöz?</h1>
<p class="lead">Válaszoljon három rövid kérdésre, és megmutatjuk, milyen típusú készüléket érdemes megnéznie. A végleges döntés előtt szívesen személyesen is segítünk.</p>

<form class="wiz" id="wiz" onsubmit="return false">
  <fieldset><legend>1. Hol használja a pénztárgépet?</legend><div class="opts">
    <label><input type="radio" name="hol" value="fix" checked> Üzletben, egy helyen</label>
    <label><input type="radio" name="hol" value="mobil"> Mozgóárusként, kiszállításnál, piacon</label>
    <label><input type="radio" name="hol" value="vendeg"> Vendéglátóhelyen</label></div></fieldset>
  <fieldset><legend>2. Mekkora a forgalom?</legend><div class="opts">
    <label><input type="radio" name="forg" value="kicsi" checked> Kisebb, napi néhány tucat vásárló</label>
    <label><input type="radio" name="forg" value="nagy"> Nagyobb, sok vásárló naponta</label></div></fieldset>
  <fieldset><legend>3. Mit kell még csatlakoztatni?</legend><div class="opts">
    <label><input type="radio" name="csat" value="semmi" checked> Semmit, csak nyugtát adok</label>
    <label><input type="radio" name="csat" value="tobb"> Kasszafiókot, vonalkódolvasót vagy mérleget</label></div></fieldset>
  <div class="ered" id="ered" aria-live="polite"></div>
</form>

<h2>A fő típusok röviden</h2>
<div class="kartyak">
  <div><h3>Kompakt asztali pénztárgép</h3><p>Kisebb üzleteknek és szolgáltatóknak, ahol a pulton kevés a hely.</p><p><a href="/webaruhaz/#kat-penztargep">Asztali pénztárgépek</a></p></div>
  <div><h3>Hordozható pénztárgép</h3><p>Akkumulátorral, mozgóárusításhoz, kiszállításhoz, piaci és rendezvényes árusításhoz.</p><p><a href="/webaruhaz/#kat-penztargep">Hordozható pénztárgépek</a></p></div>
  <div><h3>Rendszerbe köthető pénztárgép</h3><p>Nagyobb forgalmú üzleteknek, ahol kasszafiók, vonalkódolvasó vagy mérleg is csatlakozik a géphez.</p><p><a href="/webaruhaz/#kat-penztargep">Nagyobb pénztárgépek</a></p></div>
  <div><h3>Érintőképernyős POS-rendszer</h3><p>Vendéglátóhelyeknek és üzleteknek, amelyek érintőképernyős kasszarendszert szeretnének.</p><p><a href="/webaruhaz/#kat-pos">POS-rendszerek</a></p></div>
</div>

<h2>Mielőtt döntene</h2>
<ol class="lepesek">
  <li><b>Tisztázza a kötelezettségeit</b>Könyvelője meg tudja mondani, hogy tevékenysége pénztárgép-használatra kötelezett-e. Ettől függ, milyen eszköz jöhet szóba.</li>
  <li><b>Gondoljon a következő évekre</b>Az online pénztárgépek 2028. július 1-jéig használhatók. Ha most vásárol, érdemes ezzel is számolnia.</li>
  <li><b>Kérdezzen bátran</b>Üzletünkben a készülékeket ki is próbálhatja, és segítünk kiválasztani az Ön munkájához illőt.</li>
</ol>
<div class="cta"><a class="gomb" href="/webaruhaz/#kat-penztargep">Pénztárgépek a webáruházban</a><a class="gomb k" href="tel:+3672215652">Hívjon: 72/215-652</a></div>
<p><a href="/tudnivalok/">Pénztárgép és e-pénztárgép tudnivalók</a></p>

<script>
(function(){
  var T={
    mobil:['Hordozható pénztárgép','Akkumulátoros, hordozható online pénztárgépet ajánlunk. Egyes típusok autós tápról is működtethetők.','/webaruhaz/#kat-penztargep','Hordozható pénztárgépek'],
    vendeg:['Érintőképernyős POS-rendszer','Vendéglátóhelyre érintőképernyős POS-rendszert ajánlunk, igény szerint nyomtatóval, vonalkódolvasóval és kasszafiókkal.','/webaruhaz/#kat-pos','POS-rendszerek'],
    nagy:['Rendszerbe köthető pénztárgép','Nagyobb forgalomhoz és több csatlakoztatott eszközhöz rendszerbe köthető asztali pénztárgépet ajánlunk.','/webaruhaz/#kat-penztargep','Nagyobb pénztárgépek'],
    kicsi:['Kompakt asztali pénztárgép','Kisebb forgalomhoz kompakt, kis helyigényű asztali online pénztárgépet ajánlunk.','/webaruhaz/#kat-penztargep','Asztali pénztárgépek']
  };
  var f=document.getElementById('wiz'), out=document.getElementById('ered');
  function v(n){ var x=f.querySelector('[name='+n+']:checked'); return x?x.value:''; }
  function upd(){
    var k=v('hol')==='mobil'?'mobil':v('hol')==='vendeg'?'vendeg':(v('forg')==='nagy'||v('csat')==='tobb')?'nagy':'kicsi', r=T[k];
    out.innerHTML='<h3></h3><p></p><div class="cta"><a class="gomb" href=""></a><a class="gomb k" href="tel:+3672215652">Hívjon: 72/215-652</a></div>';
    out.querySelector('h3').innerHTML='<span>Javaslatunk:</span> <span></span>'; out.querySelector('h3 span:last-child').textContent=r[0]; out.querySelector('p').textContent=r[1];
    var a=out.querySelector('a.gomb'); a.href=r[2]; a.textContent=r[3];
  }
  f.addEventListener('change',upd); upd();
})();
</script>
<?php ptg_lab();
