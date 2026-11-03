// Betűtípusok saját tárhelyre: a Google Fonts helyett (adatvédelem, gyorsabb betöltés).
// Futtatás: npm i @fontsource/montserrat@5 @fontsource/inter@5 @fontsource/vt323@5 @fontsource/courier-prime@5 && node eszkozok/betutipusok.mjs
import fs from 'node:fs'; import path from 'node:path';
const NM='node_modules/@fontsource', OUT='assets/fonts';
const KELL=[ ['montserrat',[500,600,700,800,900],['normal','italic']], ['inter',[400,500,600,700],['normal']], ['vt323',[400],['normal']], ['courier-prime',[400,700],['normal']] ];
const SUBS=['latin','latin-ext'];
fs.mkdirSync(OUT,{recursive:true}); let css='/* Saját tárhelyről kiszolgált betűtípusok (Fontsource, SIL OFL) */\n';
for(const [csal,sulyok,stilusok] of KELL) for(const st of stilusok) for(const w of sulyok) for(const sub of SUBS){
  const nev=`${csal}-${sub}-${w}-${st}.woff2`, src=path.join(NM,csal,'files',nev);
  if(!fs.existsSync(src)) continue;
  fs.copyFileSync(src,path.join(OUT,nev));
  const cssf=path.join(NM,csal,`${sub}-${w}${st==='italic'?'-italic':''}.css`);
  let ur=''; if(fs.existsSync(cssf)){ const m=fs.readFileSync(cssf,'utf8').match(/unicode-range:\s*([^;]+);/); if(m) ur=m[1]; }
  const fam={montserrat:'Montserrat',inter:'Inter',vt323:'VT323','courier-prime':'Courier Prime'}[csal];
  css+=`@font-face{font-family:'${fam}';font-style:${st};font-weight:${w};font-display:swap;src:url(${nev}) format('woff2');${ur?`unicode-range:${ur};`:''}}\n`;
}
fs.writeFileSync(path.join(OUT,'betutipusok.css'),css); console.log(css.split('\n').length-2,'@font-face');
