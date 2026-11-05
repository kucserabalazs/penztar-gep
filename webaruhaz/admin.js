"use strict";
/* GENERÁLT FÁJL – ne szerkessze! Forrás: forras-index.html (ADMIN szakasz + admin-sugo-js); készíti: build.py */
/* ================= ADMIN ================= */
/* ---- telefonos hitelesítő app (TOTP) – opcionális; élesben a szerver ellenőriz ---- */
const B32='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function b32enc(bytes){ let bits='',o=''; bytes.forEach(b=>bits+=b.toString(2).padStart(8,'0')); for(let i=0;i<bits.length;i+=5) o+=B32[parseInt(bits.slice(i,i+5).padEnd(5,'0'),2)]; return o; }
function b32dec(str){ const s=str.toUpperCase().replace(/[^A-Z2-7]/g,''); let bits=''; for(const c of s) bits+=B32.indexOf(c).toString(2).padStart(5,'0'); const out=[]; for(let i=0;i+8<=bits.length;i+=8) out.push(parseInt(bits.slice(i,i+8),2)); return new Uint8Array(out); }
async function totpAt(secret,step){ const key=await crypto.subtle.importKey('raw',b32dec(secret),{name:'HMAC',hash:'SHA-1'},false,['sign']); const msg=new ArrayBuffer(8), dv=new DataView(msg); dv.setUint32(0,Math.floor(step/4294967296)); dv.setUint32(4,step>>>0); const h=new Uint8Array(await crypto.subtle.sign('HMAC',key,msg)); const o=h[19]&15; const n=((h[o]&127)<<24)|(h[o+1]<<16)|(h[o+2]<<8)|h[o+3]; return String(n%1000000).padStart(6,'0'); }
async function totpCheck(secret,code,last=0){ code=String(code).replace(/\D/g,''); if(code.length!==6) return null; const t=Math.floor(Date.now()/30000); for(const d of [0,-1,1]){ const st=t+d; if(st>last && await totpAt(secret,st)===code) return st; } return null; }

/* ---- előnézet: a szerver belépés-kezelésének másolata a böngészőben (élesben az api.php dolgozik) ---- */
const AUTH_ACTIONS=new Set(['master-info','master-new','tasks','task-add','task-done','clients','client-save','client-del','clients-import','clients-meta','geocode','clients-export','clients-log','status','admins','code-start','set-password','login','login-resend','login2','logout','password','totp-setup','totp-enable','totp-disable','security','users','user-add','user-reset','user-del','ertesites','ertesites-mentes','ertesites-proba']);
const P_OWNERS=[{id:'kucsera-istvan',nev:'Kucsera István',tel:'+36209804748'},{id:'ifj-kucsera-istvan',nev:'Ifj. Kucsera István',tel:'+36203222669'},{id:'kucsera-balazs',nev:'Kucsera Balázs',tel:'+36205363120'}];
const PV={ sess:{} };
const maskTel=t=>{ const d=String(t).replace(/\D/g,''); return d.length>=11?`+${d.slice(0,2)} ${d.slice(2,4)} *** ${d.slice(-4)}`:'***'; };
const maskMail=e=>{ if(!e||!e.includes('@')) return ''; const [a,b]=e.split('@'); return a[0]+'•'.repeat(Math.max(2,Math.min(6,a.length-1)))+'@'+b; };
async function sha(t){ return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('ptg:'+t)))].map(x=>x.toString(16).padStart(2,'0')).join(''); }
function pUsers(){ const by={}; (LS.get('ptg-users',[])).forEach(u=>by[u.id]=u); P_OWNERS.forEach(o=>{ by[o.id]={hash:null,totp:null,...by[o.id],...o,email:`${o.id.replace(/-/g,'.')}@pelda.hu`,szerep:'tulajdonos'}; }); return by; }
function pSave(by){ LS.set('ptg-users',Object.values(by)); }
const pPub=u=>({id:u.id,nev:u.nev,tel:maskTel(u.tel),szerep:u.szerep,aktiv:!!u.hash,email:!!u.email});
function pErr(m){ throw new Error(m); }
function pSend(u,cel){ const code=String(Math.floor(Math.random()*1e6)).padStart(6,'0'); PV.sess.code={uid:u.id,cel,code,exp:Date.now()+600000,tries:0}; return code; }
function pCheck(uid,cel,kod){ const c=PV.sess.code; if(!c||c.uid!==uid||c.cel!==cel||Date.now()>c.exp||c.tries>=5) return false; c.tries++; if(String(kod).replace(/\D/g,'')===c.code){ delete PV.sess.code; return true; } return false; }
function pLog(u,how){ const l=LS.get('ptg-adminlog2',[]); l.unshift({ido:new Date().toISOString(),uid:u.id,nev:u.nev,ip:'(ez a böngésző)',mod:how,eszkoz:navigator.userAgent.slice(0,160)}); LS.set('ptg-adminlog2',l.slice(0,60)); }
function pGrant(u,how){ PV.sess={uid:u.id}; const by=pUsers(); by[u.id].utolso=new Date().toISOString(); pSave(by); pLog(u,how); return {ok:true,csrf:'elonezet',me:pPub(u)}; }
const pMe=()=>PV.sess.uid?pUsers()[PV.sess.uid]:null;
async function fakeApi(a,b){
  const by=pUsers(), me=pMe(), owner=()=>{ if(!me) pErr('Be kell jelentkezni.'); if(me.szerep!=='tulajdonos') pErr('Ezt csak a tulajdonosok végezhetik el.'); };
  switch(a){
  case 'clients': case 'client-save': case 'client-del': case 'clients-import': case 'clients-meta': case 'geocode': case 'clients-export': case 'clients-log': if(!me) pErr('Be kell jelentkezni.'); return fakeClients(a,b,me);
  case 'ertesites': { if(!me) pErr('Be kell jelentkezni.'); const d=LS.get('ptg-ertesites',{}), own=me.szerep==='tulajdonos'; return {beallitva:!!d.email,email:own?(d.email||''):'',maszk:maskMail(d.email||''),tulajdonos:own,modositva:d.ido||null,nev:d.nev||null,proba:d.proba||null}; }
  case 'ertesites-mentes': { owner(); const e=String(b.email||'').trim(); if(e&&!/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]{2,}$/.test(e)) pErr('Ez nem érvényes e-mail cím.'); LS.set('ptg-ertesites',{email:e,ido:new Date().toISOString(),nev:me.nev}); return {ok:true,maszk:maskMail(e)}; }
  case 'ertesites-proba': { owner(); const d=LS.get('ptg-ertesites',{}); if(!d.email) pErr('Előbb adja meg és mentse el az értesítési címet.'); d.proba=new Date().toISOString(); LS.set('ptg-ertesites',d); return {ok:true,elonezet:true}; }
  case 'tasks': if(!me) pErr('Be kell jelentkezni.'); return {tasks:LS.get('ptg-feladatok',[])};
  case 'task-add': { if(!me) pErr('Be kell jelentkezni.'); const sz=String(b.szoveg||'').trim(); if(!sz) pErr('Írja be a feladatot vagy az észrevételt.'); const l=LS.get('ptg-feladatok',[]); const x={id:Math.random().toString(16).slice(2,14),szoveg:sz.slice(0,4000),ido:new Date().toISOString(),uid:me.id,nev:me.nev,kesz:false}; l.unshift(x); LS.set('ptg-feladatok',l); return {ok:true,task:x}; }
  case 'task-done': { if(!me) pErr('Be kell jelentkezni.'); const l=LS.get('ptg-feladatok',[]), x=l.find(y=>y.id===b.id); if(!x) pErr('Ilyen bejegyzés nincs.'); if(b.vissza){ x.kesz=false; delete x.keszIdo; delete x.keszNev; } else { x.kesz=true; x.keszIdo=new Date().toISOString(); x.keszNev=me.nev; } LS.set('ptg-feladatok',l); return {ok:true}; }
  case 'status': return {admin:!!me,csrf:me?'elonezet':null,me:me?pPub(me):null};
  case 'admins': return Object.values(by).map(pPub);
  case 'code-start': { const u=by[b.id]; if(!u) pErr('Ismeretlen felhasználó.'); const cel=u.hash?'visszaallitas':'aktivalas'; return {ok:true,cel,devCode:pSend(u,cel)}; }
  case 'set-password': { const u=by[b.id]; if(!u) pErr('Ismeretlen felhasználó.'); const cel=u.hash?'visszaallitas':'aktivalas'; if(String(b.jelszo||'').length<10) pErr('A jelszó legalább 10 karakter legyen.'); if(!pCheck(u.id,cel,b.kod)) pErr('Hibás vagy lejárt kód. Kérjen újat, ha kell.'); u.hash=await sha(b.jelszo); pSave(by); return pGrant(u,cel==='aktivalas'?'első belépés (e-mail kód)':'új jelszó (e-mail kód)'); }
  case 'login': { const u=by[b.id]; if(!u) pErr('Ismeretlen felhasználó.'); if(!u.hash){ const e=new Error('Még nincs jelszava. Válassza az „Első belépés” lehetőséget.'); throw e; } if(await sha(b.jelszo||'')!==u.hash) pErr('Hibás jelszó.'); PV.sess.pw={uid:u.id}; return {need2fa:true,via:'email',app:!!u.totp?.enabled,devCode:pSend(u,'belepes')}; }
  case 'login-resend': { const p=PV.sess.pw; if(!p) pErr('Lejárt a belépés, adja meg újra a jelszót.'); const u=by[p.uid]; return {ok:true,devCode:pSend(u,'belepes')}; }
  case 'login2': { const p=PV.sess.pw; if(!p) pErr('Lejárt a belépés, adja meg újra a jelszót.'); const u=by[p.uid];
    if(pCheck(u.id,'belepes',b.kod)) return pGrant(u,'jelszó + e-mail kód');
    if(u.totp?.enabled){ const st=await totpCheck(u.totp.secret,b.kod,u.totp.last||0); if(st!=null){ u.totp.last=st; pSave(by); return pGrant(u,'jelszó + telefonos app'); }
      const n=String(b.kod).toUpperCase().replace(/[^A-Z0-9]/g,''); const i=(u.totp.recovery||[]).findIndex(x=>x.replace('-','')===n); if(i>=0){ u.totp.recovery.splice(i,1); pSave(by); return pGrant(u,'jelszó + tartalékkód'); } }
    { const mk=LS.get('ptg-mester',null), mn=String(b.kod).toUpperCase().replace(/[^A-Z0-9]/g,''); if(u.szerep==='tulajdonos'&&mk&&mn.length===16&&await sha(mn)===mk.hash) return pGrant(u,'jelszó + mesterkód'); }
    pErr('Hibás vagy lejárt kód. Nézze meg a legfrissebb e-mailt, vagy kérjen újat.'); }
  case 'master-info': return {van:!!LS.get('ptg-mester',null)};
  case 'master-new': { owner(); const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let c=''; crypto.getRandomValues(new Uint8Array(16)).forEach(x=>c+=A[x%32]); LS.set('ptg-mester',{hash:await sha(c),ido:new Date().toISOString(),nev:me.nev}); return {ok:true,kod:c.match(/.{4}/g).join('-')}; }
  case 'logout': PV.sess={}; return {ok:true};
  case 'password': { if(!me) pErr('Be kell jelentkezni.'); if(await sha(b.regi||'')!==me.hash) pErr('A jelenlegi jelszó nem stimmel.'); if(String(b.uj||'').length<10) pErr('A jelszó legalább 10 karakter legyen.'); by[me.id].hash=await sha(b.uj); pSave(by); return {ok:true}; }
  case 'totp-setup': { if(!me) pErr('Be kell jelentkezni.'); const sec=b32enc(crypto.getRandomValues(new Uint8Array(20))); PV.sess.pending=sec; return {secret:sec,uri:`otpauth://totp/${encodeURIComponent('Totál webáruház:'+me.nev)}?secret=${sec}&issuer=${encodeURIComponent('Totál webáruház')}&algorithm=SHA1&digits=6&period=30`}; }
  case 'totp-enable': { const sec=PV.sess.pending; const st=await totpCheck(sec,b.kod); if(st==null) pErr('A kód nem egyezik. Ellenőrizze, hogy a legfrissebb kódot írta be.'); const codes=Array.from({length:8},()=>{ const c=b32enc(crypto.getRandomValues(new Uint8Array(8))).slice(0,10); return c.slice(0,5)+'-'+c.slice(5); }); by[me.id].totp={enabled:true,secret:sec,last:st,recovery:codes,since:new Date().toISOString()}; pSave(by); return {ok:true,recovery:codes}; }
  case 'totp-disable': { if(await sha(b.jelszo||'')!==me.hash) pErr('A jelszó nem stimmel.'); by[me.id].totp=null; pSave(by); return {ok:true}; }
  case 'security': { if(!me) pErr('Be kell jelentkezni.'); let log=LS.get('ptg-adminlog2',[]); if(me.szerep!=='tulajdonos') log=log.filter(l=>l.uid===me.id); return {me:{...pPub(me),emailMask:maskMail(me.email)},totp:!!me.totp?.enabled,recoveryLeft:(me.totp?.recovery||[]).length,log:log.slice(0,30)}; }
  case 'users': owner(); return Object.values(by).map(u=>({...pPub(u),telTeljes:u.tel,emailCim:u.email,utolso:u.utolso||null,app:!!u.totp?.enabled,felvette:u.felvette||null}));
  case 'user-add': { owner(); const nev=String(b.nev||'').trim(); let tel=String(b.tel||'').replace(/\D/g,''); if(tel.startsWith('06')) tel='36'+tel.slice(2); tel='+'+tel; const email=String(b.email||'').trim();
    if(nev.length<3) pErr('Adja meg a nevet.'); if(tel.length<12) pErr('Adjon meg érvényes telefonszámot (pl. +36 30 123 4567).'); if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) pErr('Adjon meg érvényes e-mail címet: erre megy a belépési kód.');
    if(Object.values(by).some(u=>u.tel.replace(/\D/g,'')===tel.replace(/\D/g,''))) pErr('Ezzel a telefonszámmal már van hozzáférés.');
    const id=nev.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-')+'-'+Math.random().toString(16).slice(2,6); by[id]={id,nev,tel,email,szerep:'admin',hash:null,totp:null,felvette:me.nev}; pSave(by); return {ok:true,id}; }
  case 'user-reset': { owner(); if(b.id===me.id) pErr('A saját hozzáférését a Biztonság fülön módosíthatja.'); by[b.id].hash=null; by[b.id].totp=null; pSave(by); return {ok:true}; }
  case 'user-del': { owner(); if(by[b.id]?.szerep==='tulajdonos') pErr('Tulajdonost nem lehet törölni.'); delete by[b.id]; pSave(by); return {ok:true}; }
  }
  pErr('Ismeretlen művelet.');
}

/* ---- belépés: ki lép be → jelszó → e-mailben kapott kód ---- */
ADMIN.L={step:'who'};
async function pageAdmin(){
  try{ const st=await api('status'); ADMIN.in=st.admin; ADMIN.csrf=st.csrf; ADMIN.me=st.me; }catch(e){ ADMIN.in=false; }
  if(!ADMIN.in){ try{ ADMIN.L.users=await api('admins'); }catch(e){ ADMIN.L.users=[]; ADMIN.L.err=e.message; } }
  if(!ADMIN.in&&ADMIN.L.step==='who'&&!ADMIN.L.valt){ let lu=null; try{ lu=localStorage.getItem('ptg-utolso-belepo'); }catch(_){} const u=(ADMIN.L.users||[]).find(x=>x.id===lu&&x.aktiv); if(u){ ADMIN.L.uid=u.id; ADMIN.L.step='pw'; } }
  return ADMIN.in?adminHTML():loginHTML(); }
const devNote=c=>c?`<div class="msg info" style="font-weight:500">Előnézet: e-mail nem megy ki, a levélben ez a kód érkezne: <b class="num" style="letter-spacing:.15em">${esc(c)}</b></div>`:'';
const codeInput=(id,lbl)=>`<label class="l">${lbl}<input class="i num" id="${id}" inputmode="numeric" autocomplete="one-time-code" maxlength="11" placeholder="123456" style="font-size:1.6rem;letter-spacing:.3em;text-align:center" required></label>`;
function loginHTML(){
  const L=ADMIN.L, u=(L.users||[]).find(x=>x.id===L.uid), box=c=>`<div class="wrap"><div class="loginbox">${c}</div></div>`;
  const back=`<button class="btn ghost sm" type="button" data-lstep="who">‹ Másik személy</button>`;
  if(L.step==='who' || !u) return box(`<span class="eyebrow">Admin belépés</span><h2 class="it-title">Ki lép be?</h2>
    ${L.err?`<div class="msg err">${esc(L.err)}</div>`:''}
    <div style="display:grid;gap:10px">${(L.users||[]).map(x=>`<button class="who" type="button" data-who="${esc(x.id)}"><span class="av">${esc(x.nev.replace(/^Ifj\.\s*/,'').split(' ').map(w=>w[0]).join('').slice(0,2))}</span><span class="wn"><b>${esc(x.nev)}</b><small class="num">${esc(x.tel)} · ${x.szerep==='tulajdonos'?'tulajdonos':'admin'}</small>${x.aktiv?'':'<span class="tag" style="justify-self:start;margin-top:4px">Első belépés</span>'}</span>${icon('chev')}</button>`).join('')}</div>
    <p class="muted" style="font-size:.84rem;display:flex;gap:8px;align-items:flex-start">${icon('shield','ic','width:18px;height:18px;color:var(--gold-d);margin-top:2px')}<span>A belépést a kiválasztott személy saját e-mail címére küldött kóddal kell megerősíteni. Új hozzáférést csak a tulajdonosok adhatnak.</span></p>`);
  const head=`<div class="whohead"><span class="av">${esc(u.nev.replace(/^Ifj\.\s*/,'').split(' ').map(w=>w[0]).join('').slice(0,2))}</span><div><b>${esc(u.nev)}</b><small class="num">${esc(u.tel)}</small></div></div>`;
  if(L.step==='pw') return box(`<span class="eyebrow">1. lépés · jelszó</span>${head}
    <form class="f" id="lf-pw"><label class="l" for="pw">Jelszó</label><div class="pwwrap"><input class="i" type="password" id="pw" autocomplete="current-password" required><button type="button" class="pweye" id="pweye" aria-label="Jelszó megmutatása (nyomva tartva)" title="Nyomja meg és tartsa lenyomva a jelszó megtekintéséhez"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg></button></div><small class="muted" style="font-size:.84rem">Tartsa lenyomva a szem ikont, ha látni szeretné a beírt jelszót.</small><div class="out" aria-live="polite"></div><button class="btn gold" type="submit">Tovább</button></form>
    <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">${back}<button class="btn ghost sm" type="button" id="forgot">Elfelejtettem a jelszót</button></div>`);
  if(L.step==='code') return box(`<span class="eyebrow">2. lépés · megerősítés</span>${head}
    <div class="msg info" style="font-weight:500;display:flex;gap:10px;align-items:flex-start">${icon('mail','ic','width:20px;height:20px;flex-shrink:0;margin-top:2px')}<span>Kódot küldtünk <b>${esc(u.nev)}</b> saját e-mail címére. Nézze meg a beérkezett leveleket (és a levélszemetet is).</span></div>${devNote(L.devCode)}
    <form class="f" id="lf-code">${codeInput('code','6 jegyű kód az e-mailből')}<div class="out" aria-live="polite"></div><button class="btn gold" type="submit">Megerősítés és belépés</button></form>
    <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">${back}<button class="btn ghost sm" type="button" id="resend">Új kód kérése</button></div>
    <div class="nincskod"><b>Nem jött meg a kód?</b><ol><li>Várjon 1–2 percet, és nézze meg a <b>Levélszemét / Spam</b> és az <b>Összes levél</b> mappát is (Gmailben a „Promóciók” fület is).</li><li>Kérjen újat a fenti <b>Új kód kérése</b> gombbal.</li><li>Vagy kérje a kódot az <b>üzlet e-mail címére</b> (info@…), és nézze meg ott:</li></ol><button class="btn line sm" type="button" id="resend-uzlet">${icon('mail')} Kód küldése az üzlet e-mail címére</button><details class="mester" style="margin-top:10px"><summary><b>Belépés mesterkóddal</b> (csak tulajdonos)</summary><form class="f" id="lf-mester" style="margin-top:8px"><input class="i num" id="mkod" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXX-XXXX-XXXX-XXXX" style="font-size:1.15rem;letter-spacing:.12em;text-align:center;text-transform:uppercase"><div class="out" aria-live="polite"></div><button class="btn navy" type="submit">Belépés mesterkóddal</button></form></details>${L.app?'<p style="margin:8px 0 0">Beírhatja a telefonos hitelesítő alkalmazás (iPhone: Jelszavak) 6 jegyű kódját, vagy egy tartalékkódot is.</p>':''}</div>`);
  if(L.step==='set'){ const akt=L.cel==='aktivalas'; return box(`<span class="eyebrow">${akt?'Első belépés':'Új jelszó'}</span>${head}
    <div class="msg info" style="font-weight:500;display:flex;gap:10px;align-items:flex-start">${icon('mail','ic','width:20px;height:20px;flex-shrink:0;margin-top:2px')}<span>Kódot küldtünk <b>${esc(u.nev)}</b> saját e-mail címére. Ezzel igazolja, hogy Ön az, majd ${akt?'adja meg a jelszavát':'adjon meg új jelszót'}.</span></div>${devNote(L.devCode)}
    <form class="f" id="lf-set">${codeInput('scode','6 jegyű kód az e-mailből')}<label class="l">${akt?'Jelszó':'Új jelszó'} <span class="o">legalább 10 karakter</span><input class="i" type="password" id="spw" autocomplete="new-password" required></label><label class="l">Jelszó még egyszer<input class="i" type="password" id="spw2" autocomplete="new-password" required></label><div class="out" aria-live="polite"></div><button class="btn gold" type="submit">${akt?'Jelszó beállítása és belépés':'Új jelszó mentése és belépés'}</button></form>${back}`); }
  return box('');
}
function bindLogin(){
  const L=ADMIN.L, go=st=>{ L.step=st; renderAdmin(); }, ok=r=>{ ADMIN.in=true; ADMIN.csrf=r.csrf; ADMIN.me=r.me; ADMIN.L={step:'who'}; ADMIN.tab='termekek'; route(); };
  const sendCode=async(out)=>{ try{ const r=await api('code-start',{body:{id:L.uid}}); Object.assign(L,{cel:r.cel,devCode:r.devCode}); go('set'); }catch(err){ if(out) out.innerHTML=`<div class="msg err">${esc(err.message)}</div>`; else toast(err.message); } };
  $$('[data-who]').forEach(b=>b.onclick=async()=>{ L.uid=b.dataset.who; try{ localStorage.setItem('ptg-utolso-belepo',L.uid); }catch(_){} const u=L.users.find(x=>x.id===L.uid); if(u.aktiv) go('pw'); else { b.disabled=true; await sendCode(); b.disabled=false; } });
  $$('[data-lstep]').forEach(b=>b.onclick=()=>{ L.devCode=null; if(b.dataset.lstep==='who') L.valt=true; go(b.dataset.lstep); });
  $('#forgot')?.addEventListener('click',()=>sendCode($('#lf-pw .out')));
  const eye=$('#pweye'); if(eye){ const pw=$('#pw'), show=e=>{ e.preventDefault(); pw.type='text'; eye.classList.add('on'); }, hide=()=>{ pw.type='password'; eye.classList.remove('on'); };
    eye.addEventListener('pointerdown',show); ['pointerup','pointerleave','pointercancel','blur'].forEach(ev=>eye.addEventListener(ev,hide)); eye.addEventListener('contextmenu',e=>e.preventDefault());
    eye.addEventListener('keydown',e=>{ if(e.key===' '||e.key==='Enter') show(e); }); eye.addEventListener('keyup',hide); }
  const fm=$('#lf-mester'); if(fm) fm.onsubmit=async e=>{ e.preventDefault(); const out=$('.out',fm), bt=$('button',fm); bt.disabled=true; try{ ok(await api('login2',{body:{kod:$('#mkod').value}})); }catch(err){ out.innerHTML=`<div class="msg err">${esc(err.message.replace('Nézze meg a legfrissebb e-mailt, vagy kérjen újat.','Ellenőrizze a mesterkódot.'))}</div>`; bt.disabled=false; } };
  $('#resend-uzlet')?.addEventListener('click',async e=>{ const b=e.currentTarget; b.disabled=true; try{ const r=await api('login-resend',{body:{hova:'uzlet'}}); L.devCode=r.devCode; toast('Kódot küldtünk az üzlet e-mail címére'); if(r.devCode) renderAdmin(); }catch(err){ toast(err.message); } b.disabled=false; });
  const fp=$('#lf-pw'); if(fp){ setTimeout(()=>$('#pw').focus(),50); fp.onsubmit=async e=>{ e.preventDefault(); const out=$('.out',fp), bt=$('button[type=submit]',fp); bt.disabled=true;
    try{ const r=await api('login',{body:{id:L.uid,jelszo:$('#pw').value}}); if(r.need2fa){ Object.assign(L,{app:r.app,devCode:r.devCode}); return go('code'); } ok(r); }catch(err){ out.innerHTML=`<div class="msg err">${esc(err.message)}</div>`; bt.disabled=false; } }; }
  const fc=$('#lf-code'); if(fc){ const c=$('#code'); setTimeout(()=>c.focus(),50);
    c.addEventListener('input',()=>{ if(/^\d{6}$/.test(c.value.replace(/\s/g,''))) fc.requestSubmit(); });
    fc.onsubmit=async e=>{ e.preventDefault(); const out=$('.out',fc), bt=$('button[type=submit]',fc); bt.disabled=true;
      try{ ok(await api('login2',{body:{kod:c.value}})); }catch(err){ out.innerHTML=`<div class="msg err">${esc(err.message)}</div>`; c.select(); bt.disabled=false; if(/Lejárt a belépés/.test(err.message)) setTimeout(()=>go('pw'),1500); } };
    $('#resend').onclick=async()=>{ try{ const r=await api('login-resend',{body:{}}); L.devCode=r.devCode; toast('Új kódot küldtünk'); if(r.devCode) renderAdmin(); }catch(err){ $('.out',fc).innerHTML=`<div class="msg err">${esc(err.message)}</div>`; } }; }
  const fs=$('#lf-set'); if(fs){ setTimeout(()=>$('#scode').focus(),50); fs.onsubmit=async e=>{ e.preventDefault(); const out=$('.out',fs), bt=$('button[type=submit]',fs);
    if($('#spw').value!==$('#spw2').value){ out.innerHTML='<div class="msg err">A két jelszó nem egyezik.</div>'; return; }
    bt.disabled=true; try{ ok(await api('set-password',{body:{id:L.uid,kod:$('#scode').value,jelszo:$('#spw').value}})); }catch(err){ out.innerHTML=`<div class="msg err">${esc(err.message)}</div>`; bt.disabled=false; } }; }
}
const MODELS=[['kompakt','Pénztárgép'],['nagy','Pénztárgép kasszafiókkal'],['kezi','Hordozható pénztárgép'],['pos','POS terminál'],['merleg','Mérleg'],['arazo','Árazógép'],['scanner','Vonalkódolvasó'],['fiok','Kasszafiók'],['nyomtato','Blokknyomtató'],['printer2','Irodai nyomtató'],['papir','Papírtekercs'],['pc','Számítógép'],['egyeb','Egyéb']];
const ADM_TABS=()=>[['attekintes','Áttekintés','home'],['termekek','Termékek','box'],['rendelesek','Rendelések','bell'],['ugyfelek','Ügyfelek','users'],['szolgaltatasok','Szerviz díjak','wrench'],['feladatok','Feladatok, észrevételek','edit'],['gyik','Gyakori kérdések','list'],['beallitasok','Cégadatok, nyitvatartás','gear'],...(ADMIN.me?.szerep==='tulajdonos'?[['felhasznalok','Felhasználók','lock']]:[]),['biztonsag','Biztonság','shield']];
const ADM_MAIN=['attekintes','termekek','rendelesek','ugyfelek'];
function adminHTML(){ const t=ADMIN.tab, tabs=ADM_TABS(), cur=tabs.find(x=>x[0]===t)||tabs[0], ini=(ADMIN.me?.nev||'?').replace(/^Ifj\.\s*/,'').split(' ').map(w=>w[0]).join('').slice(0,2);
  const badge=k=>k==='rendelesek'&&ADMIN.newOrders?`<em class="abadge">${ADMIN.newOrders}</em>`:'';
  return `<div class="adm2">
  <header class="ahead"><div class="wrap"><span class="av">${esc(ini)}</span><div class="who2"><b>${esc(ADMIN.me?.nev||'')}</b><small>${ADMIN.me?.szerep==='tulajdonos'?'Tulajdonos':'Admin'} · <span class="mode ${MODE}">${MODE==='live'?'Élő oldal':'Előnézet'}</span></small></div>
    <a class="ibtn" href="#termekek" title="Webáruház megnyitása" aria-label="Webáruház">${icon('store')}<span>Webáruház</span></a><button class="ibtn" type="button" id="logout" aria-label="Kilépés">${icon('logout')}<span>Kilépés</span></button></div></header>
  <div class="wrap abody">
    <nav class="aside" aria-label="Admin menü">${tabs.map(([k,n,ic])=>`<button type="button" class="${t===k?'on':''}" data-tab="${k}">${icon(ic)}<span>${n}</span>${badge(k)}</button>`).join('')}</nav>
    <main class="amain"><div class="atitle">${icon(cur[2])}<h2>${esc(cur[1])}</h2></div>
      <div id="admbody">${t==='termekek'?admProducts():t==='szolgaltatasok'?admServices():t==='gyik'?admFaq():t==='beallitasok'?admSettings():t==='attekintes'?admDash():'<div class="askel"><i></i><i></i><i></i></div>'}</div></main>
  </div>
  <nav class="abot" aria-label="Admin gyorsmenü">${tabs.filter(x=>ADM_MAIN.includes(x[0])).map(([k,n,ic])=>`<button type="button" class="${t===k?'on':''}" data-tab="${k}">${icon(ic)}<span>${n}</span>${badge(k)}</button>`).join('')}<button type="button" id="amore" class="${ADM_MAIN.includes(t)?'':'on'}">${icon('more')}<span>Több</span></button></nav>
  <div class="asheet" id="asheet" hidden><div class="asheet-bg" data-close></div><div class="asheet-box" role="dialog" aria-label="További menüpontok"><i class="grab"></i>${tabs.filter(x=>!ADM_MAIN.includes(x[0])).map(([k,n,ic])=>`<button type="button" class="${t===k?'on':''}" data-tab="${k}">${icon(ic)}<span>${n}</span>${icon('chev')}</button>`).join('')}<button type="button" class="cancel" data-close>Bezárás</button></div></div>
  <div class="savebar" id="savebar" ${ADMIN.dirty?'':'hidden'}><div class="wrap"><span class="sbtxt">${icon('alert')}<span>Nem mentett változások</span></span><span class="sbbtn"><button class="btn line sm" type="button" id="discard">Elvetés</button><button class="btn gold sm" type="button" id="save">${icon('check')} Mentés</button></span></div></div>
  </div>`; }
function admDash(){
  const P=DB.products, low=P.filter(p=>p.keszletDb!=null&&p.keszletDb<=1&&!p.rejtett), out=P.filter(p=>p.keszletDb===0&&!p.rejtett), hid=P.filter(p=>p.rejtett), ask=P.filter(p=>!p.ar&&!p.rejtett), noimg=P.filter(p=>!(p.kepek||[]).length||p.illusztracio), feat=P.filter(p=>p.kiemelt);
  const tile=(n,l,ic,tab,cls='')=>`<button type="button" class="kpi ${cls}" data-tab="${tab}" ${tab==='termekek'?`data-pf="${cls}"`:''}><span class="ki">${icon(ic)}</span><b class="num">${n}</b><span>${l}</span></button>`;
  const item=p=>`<button type="button" class="fixrow" data-goedit="${esc(p.id)}"><img src="${esc((p.kepek||[])[0]||'')}" alt="" onerror="this.style.visibility='hidden'"><span><b>${esc(fullName(p))}</b><small>${p.keszletDb===0?'Elfogyott':p.keszletDb!=null&&p.keszletDb<=1?'Utolsó darab':!(p.kepek||[]).length||p.illusztracio?'Nincs valódi fotó':'Ár kérésre'}</small></span>${icon('chev')}</button>`;
  const fix=[...out,...low.filter(p=>!out.includes(p)),...noimg.filter(p=>!low.includes(p))].slice(0,8);
  return `<div class="dash">
   <div class="kpis">${tile('…','új rendelés','bell','rendelesek','orders" id="kpi-orders')}${tile(low.length,'kevés készlet','alert','termekek','low')}${tile(feat.length,'kiemelt termék','star','termekek','feat')}${tile(hid.length,'rejtett termék','eye','termekek','hid')}</div>
   <div class="dgrid">
    <section class="dcard"><h3>${icon('plus')} Mit szeretne csinálni?</h3><div class="qa">
      <button type="button" class="qbtn" data-tab="termekek">${icon('tag')}<span>Árat, készletet módosítok</span></button>
      <button type="button" class="qbtn" id="qa-new">${icon('plus')}<span>Új terméket teszek fel</span></button>
      <button type="button" class="qbtn" data-tab="rendelesek">${icon('bell')}<span>Megnézem a rendeléseket</span></button>
      <button type="button" class="qbtn" data-tab="beallitasok">${icon('clock')}<span>Nyitvatartás, szabadság</span></button>
      <button type="button" class="qbtn" data-tab="ugyfelek">${icon('users')}<span>Ügyfelet keresek</span></button>
      <a class="qbtn" href="#termekek">${icon('store')}<span>Megnézem a webáruházat</span></a></div></section>
    <section class="dcard"><h3>${icon('alert')} Figyelmet igényel <small>${fix.length}</small></h3>${fix.length?`<div class="fixlist">${fix.map(item).join('')}</div>`:'<p class="muted">Minden rendben: nincs teendő.</p>'}</section>
    <section class="dcard"><h3>${icon('box')} Kínálat</h3><div class="stat2"><div><b class="num">${P.length}</b><small>termék</small></div><div><b class="num">${P.length-hid.length}</b><small>látható</small></div><div><b class="num">${ask.length}</b><small>ár kérésre</small></div><div><b class="num">${P.filter(p=>p.keszletDb!=null).reduce((a,p)=>a+(+p.keszletDb||0),0)}</b><small>db raktáron</small></div></div>
      <div class="catbars">${DB.categories.map(c=>{ const n=P.filter(p=>p.kategoria===c.id).length; return `<div><span>${esc(c.nev)}</span><i style="--w:${Math.round(n/Math.max(1,...DB.categories.map(cc=>P.filter(p=>p.kategoria===cc.id).length))*100)}%"></i><b class="num">${n}</b></div>`; }).join('')}</div></section>
   </div></div>`; }
function admProducts(){
  const PF=ADMIN.pf||'all', q=(ADMIN.pq||'').toLowerCase(), pc=ADMIN.pc||'';
  const flt=[['all','Mind'],['low','Kevés készlet'],['feat','Kiemelt'],['hid','Rejtett'],['ask','Ár kérésre'],['noimg','Fotó nélkül']];
  const cnt=k=>DB.products.filter(p=>pmatch(p,k)).length;
  return `<div class="ptools">
    <label class="psearch">${icon('search')}<input class="i" id="pq" type="search" placeholder="Keresés a termékek között" value="${esc(ADMIN.pq||'')}" autocomplete="off"></label>
    <button class="btn gold" type="button" id="newp">${icon('plus')} <span>Új termék</span></button></div>
  <div class="chips" role="tablist" aria-label="Kategória"><button type="button" class="chip ${!pc?'on':''}" data-pc="">Minden kategória <b>${DB.products.length}</b></button>${DB.categories.map(c=>`<button type="button" class="chip ${pc===c.id?'on':''}" data-pc="${c.id}">${esc(c.nev)} <b>${DB.products.filter(p=>p.kategoria===c.id).length}</b></button>`).join('')}</div>
  <div class="chips sm" aria-label="Szűrő">${flt.map(([k,l])=>`<button type="button" class="chip ${PF===k?'on':''}" data-pf="${k}">${l} <b>${cnt(k)}</b></button>`).join('')}</div>
  <p class="hint2">${icon('tag')}<span>Az árak <b>nettó</b> forintban értendők; üresen hagyva „ár kérésre”. Üres készlet = rendelésre. A változások a lenti <b>Mentés</b> gombbal kerülnek ki az oldalra.</span></p>
  <div class="pgrid" id="pgrid">${DB.products.map(p=>{ const vis=(!pc||p.kategoria===pc)&&pmatch(p,PF)&&(!q||(fullName(p)+' '+(p.alcim||'')).toLowerCase().includes(q)); const img=(p.kepek||[])[0];
    return `<article class="pc2 ${p.rejtett?'off':''}" data-cat="${esc(p.kategoria)}" data-id="${esc(p.id)}" ${vis?'':'hidden'}>
      <div class="pc2h"><span class="pth">${img?`<img src="${esc(img)}" alt="" loading="lazy">`:icon('photo')}</span><div class="pnm"><b>${esc(fullName(p))}</b><small>${esc(cat(p.kategoria)?.nev||'')} · ${p.illusztracio?'illusztráció':(p.kepek||[]).length+' fotó'}${framesOf(p).length?' · 360°':''}</small><span class="pst">${stockBadge(p)}${p.kiemelt?'<em class="bdg feat">Kiemelt</em>':''}${p.rejtett?'<em class="bdg hid">Rejtett</em>':''}${p.kategoria==='hasznalt'?'<em class="bdg used">Használt</em>':''}</span></div></div>
      <div class="pc2f">
        <label class="fld"><span>Ár (nettó)</span><span class="inw"><input class="i num" data-f="ar" data-id="${esc(p.id)}" id="ar-${esc(p.id)}" inputmode="numeric" value="${p.ar??''}" placeholder="kérésre"><i>Ft</i></span></label>
        <label class="fld"><span>Akciós ár</span><span class="inw"><input class="i num" data-f="akciosAr" data-id="${esc(p.id)}" id="ak-${esc(p.id)}" inputmode="numeric" value="${p.akciosAr??''}" placeholder="nincs"><i>Ft</i></span></label>
        <div class="fld"><span>Készlet</span><span class="step"><button type="button" data-step="-1" data-sid="${esc(p.id)}" aria-label="Kevesebb">${icon('minus')}</button><input class="i num" data-f="keszletDb" data-id="${esc(p.id)}" id="kd-${esc(p.id)}" inputmode="numeric" value="${p.keszletDb??''}" placeholder="rend." aria-label="Készlet darab"><button type="button" data-step="1" data-sid="${esc(p.id)}" aria-label="Több">${icon('plus')}</button></span></div>
      </div>
      <div class="pc2s"><label class="sw"><input type="checkbox" data-f="kiemelt" data-id="${esc(p.id)}" id="km-${esc(p.id)}" ${p.kiemelt?'checked':''}><i></i><span>Kiemelt</span></label><label class="sw"><input type="checkbox" data-f="lathato" data-id="${esc(p.id)}" id="lt-${esc(p.id)}" ${p.rejtett?'':'checked'}><i></i><span>Látható</span></label><label class="sw"><input type="checkbox" data-f="hasznalt" data-id="${esc(p.id)}" id="hu-${esc(p.id)}" ${p.kategoria==='hasznalt'?'checked':''}><i></i><span>Használt</span></label>
        <button class="btn navy sm" type="button" data-edit="${esc(p.id)}">${icon('edit')} Szerkesztés</button></div></article>`; }).join('')}</div>
  <p class="muted pempty" id="pempty" hidden>Nincs a szűrésnek megfelelő termék.</p>
  <div id="editorwrap">${ADMIN.edit?editorHTML(prod(ADMIN.edit)):''}</div>`; }
function pmatch(p,k){ switch(k){ case 'low': return p.keszletDb!=null&&p.keszletDb<=1; case 'feat': return !!p.kiemelt; case 'hid': return !!p.rejtett; case 'ask': return !p.ar; case 'noimg': return !(p.kepek||[]).length||!!p.illusztracio; default: return true; } }
function stockBadge(p){ const k=p.keszletDb; return k==null?'<em class="bdg ord">Rendelésre</em>':k===0?'<em class="bdg out">Elfogyott</em>':k===1?'<em class="bdg last">1 db</em>':k<=3?`<em class="bdg low">${k} db</em>`:`<em class="bdg ok">${k} db</em>`; }
function filterProducts(){ const PF=ADMIN.pf||'all', q=(ADMIN.pq||'').toLowerCase(), pc=ADMIN.pc||''; let n=0;
  $$('.pc2').forEach(el=>{ const p=prod(el.dataset.id); const v=!!p&&(!pc||p.kategoria===pc)&&pmatch(p,PF)&&(!q||(fullName(p)+' '+(p.alcim||'')).toLowerCase().includes(q)); el.hidden=!v; if(v) n++; });
  const e=$('#pempty'); if(e) e.hidden=n>0; }
function imgsHTML(p,k){ return `<div class="imgs">${(p[k]||[]).map((u,i)=>`<figure><img src="${esc(u)}" alt=""><div class="ops"><button type="button" data-mv="${k}:${i}:-1" aria-label="Előre">◀</button><button type="button" data-del="${k}:${i}" aria-label="Törlés">✕</button><button type="button" data-mv="${k}:${i}:1" aria-label="Hátra">▶</button></div></figure>`).join('')}</div>`; }
function editorHTML(p){ if(!p) return ''; const opt=(v,l,c)=>`<option value="${v}" ${c===v?'selected':''}>${l}</option>`;
  return `<div class="edback" data-edclose></div><div class="editor" id="editor" role="dialog" aria-modal="true" aria-label="Termék szerkesztése"><div class="edhead"><button class="ibtn" type="button" id="closeed" aria-label="Bezárás">${icon('x')}</button><div><small>Termék szerkesztése</small><h3>${esc(fullName(p))}</h3></div><button class="btn gold sm" type="button" data-applyed>${icon('check')} Átvétel</button></div>
  <form class="f" onsubmit="return false" id="edform">
    <h4 class="edsec">Alapadatok</h4>
    <div class="row2"><label class="l">Márka<input class="i" id="e-marka" value="${esc(p.marka)}"></label><label class="l">Típus / név<input class="i" id="e-nev" value="${esc(p.nev)}"></label></div>
    <div class="row2"><label class="l">Kategória<select class="i" id="e-kat">${DB.categories.map(c=>opt(c.id,esc(c.nev),p.kategoria)).join('')}</select></label><label class="l">3D modell formája<select class="i" id="e-modell">${MODELS.map(([v,l])=>opt(v,l,p.modell)).join('')}</select></label></div>
    <label class="l">Rövid alcím<input class="i" id="e-alcim" value="${esc(p.alcim)}"></label>
    <h4 class="edsec">Ár és készlet</h4>
    <div class="row2"><label class="l">Nettó ár (Ft)<input class="i num" id="e-ar" inputmode="numeric" value="${p.ar??''}" placeholder="üres = ár kérésre"></label><label class="l">Akciós nettó ár (Ft)<input class="i num" id="e-ak" inputmode="numeric" value="${p.akciosAr??''}"></label></div>
    <div class="row2"><label class="l">Készlet (db) <span class="o">üres = rendelésre</span><input class="i num" id="e-kd" inputmode="numeric" value="${p.keszletDb??''}"></label><label class="l">Garancia<input class="i" id="e-gar" value="${esc(p.garancia||'')}"></label></div>
    <label class="check"><input type="checkbox" id="e-tol" ${p.arTol?'checked':''}> Az ár „-tól” ár (pl. használt gépeknél)</label>
    <label class="l">NAV-engedélyszám<input class="i" id="e-eng" value="${esc(p.engedely)}"></label>
    <h4 class="edsec">Szövegek</h4>
    <label class="l">Leírás<textarea class="i" id="e-leiras">${esc(p.leiras)}</textarea></label>
    <label class="l">Jellemzők <span class="o">soronként egy</span><textarea class="i" id="e-jell">${esc((p.jellemzok||[]).join('\n'))}</textarea></label>
    <label class="l">Műszaki adatok <span class="o">soronként: Megnevezés: érték</span><textarea class="i" id="e-specs">${esc((p.specs||[]).map(s=>s[0]+': '+s[1]).join('\n'))}</textarea></label>
    <label class="l">Letöltések <span class="o">soronként: Név | link (pl. kezelési útmutató PDF)</span><textarea class="i" id="e-dl" style="min-height:70px">${esc((p.letoltesek||[]).map(d=>d.nev+' | '+d.url).join('\n'))}</textarea></label>
    <label class="l">Bemutató videó linkje <span class="o">nem kötelező</span><input class="i" id="e-video" value="${esc(p.video||'')}"></label>
    <h4 class="edsec">Fotók</h4>
    <label class="check"><input type="checkbox" id="e-illu" ${p.illusztracio?'checked':''}> A mostani kép csak illusztráció (a vásárló „Illusztráció” jelölést lát)</label>
    <div class="l">Fotók <span class="o">Az első kép a borítókép. Ha a termék még illusztrációt mutat, az első valódi fotó feltöltésekor az illusztráció automatikusan lekerül. Ha 8 vagy több fotót tölt fel körbefotózva, sorrendben, abból automatikusan 360°-os forgatás lesz.</span>${imgsHTML(p,'kepek')}<input type="file" id="up-kepek" accept="image/jpeg,image/png,image/webp" multiple></div>
    <div class="l">Külön 360°-os fotósorozat <span class="o">nem kötelező; ha van, ez lesz a forgatás (24–36 kép, egyenletes lépésekben)</span>${imgsHTML(p,'spin')}<input type="file" id="up-spin" accept="image/jpeg,image/png,image/webp" multiple></div>
    <div class="out" aria-live="polite"></div>
    <div class="edfoot"><button class="btn navy" type="button" id="applyed">${icon('check')} Módosítások átvétele</button><a class="btn line" href="#t-${esc(p.id)}">${icon('eye')} Termékoldal</a><button class="btn ghost" type="button" id="delp" style="color:var(--bad)">Termék törlése</button><span id="delconfirm"></span></div></form></div>`; }
function admServices(){ return `<p class="muted" style="margin-bottom:14px">A szervizoldalon megjelenő díjak, nettó forintban. Üresen: „Ár kérésre”.</p><div class="tablewrap"><table class="ptable"><thead><tr><th>Szolgáltatás</th><th>Leírás</th><th>Díj (nettó)</th></tr></thead><tbody>${DB.services.map(s=>`<tr><td data-l="Név"><input class="i" data-s="nev" data-id="${s.id}" id="sn-${s.id}" value="${esc(s.nev)}"></td><td data-l="Leírás"><input class="i" data-s="leiras" data-id="${s.id}" id="sl-${s.id}" value="${esc(s.leiras)}"></td><td data-l="Díj"><input class="i pi num" data-s="ar" data-id="${s.id}" id="sa-${s.id}" inputmode="numeric" value="${s.ar??''}" placeholder="kérésre"></td></tr>`).join('')}</tbody></table></div>`; }
function admFaq(){ return `<p class="muted" style="margin-bottom:14px">A kategóriánkénti gyakori kérdések minden termékoldalon megjelennek. Soronként: Kérdés | Válasz</p>${DB.categories.map(c=>`<label class="l" style="margin-bottom:14px">${esc(c.nev)}<textarea class="i" data-faq="${c.id}" id="fq-${c.id}" style="min-height:90px">${esc((c.gyik||[]).map(g=>g[0]+' | '+g[1]).join('\n'))}</textarea></label>`).join('')}`; }
const DAYS=[[1,'Hétfő'],[2,'Kedd'],[3,'Szerda'],[4,'Csütörtök'],[5,'Péntek'],[6,'Szombat'],[0,'Vasárnap']];
const defHours=()=>({1:['09:00','15:00'],2:['09:00','15:00'],3:['09:00','15:00'],4:['09:00','15:00'],5:['09:00','15:00'],6:null,0:null});
function hoursText(h){ const parts=[]; let i=0; const ord=DAYS.map(d=>d[0]), nm={1:'hétfő',2:'kedd',3:'szerda',4:'csütörtök',5:'péntek',6:'szombat',0:'vasárnap'};
  while(i<ord.length){ const v=h[ord[i]]; let j=i; while(j+1<ord.length && JSON.stringify(h[ord[j+1]])===JSON.stringify(v)) j++;
    const lbl=i===j?nm[ord[i]]:nm[ord[i]]+'–'+nm[ord[j]]; parts.push(lbl+' '+(v?v[0].replace(/^0/,'')+'–'+v[1].replace(/^0/,''):'zárva')); i=j+1; }
  const t=parts.join(', '); return t.charAt(0).toUpperCase()+t.slice(1); }
const zvHU=d=>{ const m=String(d).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/); return m?`${m[1]}. ${['január','február','március','április','május','június','július','augusztus','szeptember','október','november','december'][+m[2]-1]} ${+m[3]}.`:String(d); };
function zarvaListHTML(l){ l=l||[]; const ma=new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);
  if(!l.length) return '<p class="zv-none">Jelenleg nincs beállítva szabadság vagy rendkívüli zárva tartás.</p>';
  return `<ul class="zv-list">${l.map((x,i)=>{ const p=String(x).split('..'), vege=(p[1]||p[0]).trim(), mult=vege<ma; return `<li class="${mult?'mult':''}">${icon('clock')}<span><b>${p.length>1?esc(zvHU(p[0]))+' – '+esc(zvHU(p[1])):esc(zvHU(p[0]))}</b><small>${mult?'Elmúlt – nyugodtan törölheti':p.length>1?'Ezekben a napokban zárva':'Ezen a napon zárva'}</small></span><button type="button" class="btn ghost sm" data-zvdel="${i}" aria-label="Törlés">${icon('x')} Törlés</button></li>`; }).join('')}</ul>`; }
function admSettings(){ const s=S(); const h=s.nyitva||defHours();
  return `<form class="f" onsubmit="return false" style="max-width:720px">
  <div class="editor" style="margin-top:0"><h3>Nyitvatartás</h3><p class="muted">Ebből számolja a főoldal, hogy az üzlet éppen nyitva van-e, és mikor nyit. A magyar ünnepnapokon automatikusan zárva mutatja.</p>
    <div class="tablewrap"><table class="ptable"><tbody>${DAYS.map(([d,n])=>`<tr><td><b>${n}</b></td><td data-l="Nyitva"><label class="check" style="margin:0"><input type="checkbox" data-hopen="${d}" id="ho-${d}" ${h[d]?'checked':''}> nyitva</label></td><td data-l="Nyit"><input class="i num" type="time" data-hfrom="${d}" id="hf-${d}" value="${h[d]?h[d][0]:'09:00'}" ${h[d]?'':'disabled'} style="width:120px"></td><td data-l="Zár"><input class="i num" type="time" data-hto="${d}" id="ht-${d}" value="${h[d]?h[d][1]:'15:00'}" ${h[d]?'':'disabled'} style="width:120px"></td></tr>`).join('')}</tbody></table></div>
    <div class="l" id="zarva-box"><span class="sg-lt">Szabadság, rendkívüli zárva tartás</span><div id="zarva-list">${zarvaListHTML(s.zarvaNapok)}</div>
      <div class="zv-add"><label class="zv-f"><span>Első zárva nap</span><input class="i" type="date" id="zv-tol"></label><label class="zv-f"><span>Utolsó zárva nap <small>(egy napnál üresen hagyható)</small></span><input class="i" type="date" id="zv-ig"></label><button class="btn gold" type="button" id="zv-add">${icon('plus')} Hozzáadás</button></div><div class="zv-msg" id="zv-msg" aria-live="polite"></div></div>
    <p class="muted" id="htext" style="font-size:.9rem">A weboldalon így jelenik meg: <b>${esc(s.nyitvatartas)}</b></p></div>
  ${[['cegnev','Cégnév'],['cim','Cím'],['telefon','Telefon'],['email','Nyilvános e-mail cím (csak az Impresszumban, a vásárlási feltételekben és az adatkezelési tájékoztatóban látszik)'],['alapitas','Alapítás éve'],['mobildij','Mobil adatkapcsolat díja (szöveg)'],['adoszam','Adószám'],['bank','Bank neve (utaláshoz)'],['szamlaszam','Bankszámlaszám (utaláshoz)'],['cegjegyzekszam','Cégjegyzékszám (Impresszumhoz)'],['tarhely','Tárhelyszolgáltató neve, címe, elérhetősége (Impresszumhoz)']].map(([k,l])=>`<label class="l">${l}<input class="i" data-set="${k}" id="set-${k}" value="${esc(s[k])}"></label>`).join('')}
  <label class="l">Mobilszámok <span class="o">vesszővel elválasztva</span><input class="i" data-set="mobil" id="set-mobil" value="${esc((s.mobil||[]).join(', '))}"></label><label class="l">ÁFA kulcs (%)<input class="i num" data-set="afa" id="set-afa" inputmode="numeric" value="${esc(s.afa)}" style="max-width:120px"></label></form>
  <div class="editor" id="ertesites-box" style="max-width:720px"><h3>${icon('mail')} Értesítési e-mail cím <span class="pill2">titkos</span></h3><p class="muted">Betöltés…</p></div>
  ${MODE==='preview'?`<div class="editor" style="max-width:720px"><h3>Előnézeti adatok</h3><p class="muted">Az itt mentett változások csak ebben a böngészőben vannak.</p><div><button class="btn line" type="button" id="resetprev">Alapadatok visszaállítása</button> <span id="resetconfirm"></span></div></div>`:''}`; }
/* titkos értesítési cím: ide mennek a megrendelések, ajánlatkérések és az „E-mail küldése” üzenetek; a weboldalon sehol nem látszik */
async function admNotify(){ const box=$('#ertesites-box'); if(!box) return; let r;
  try{ r=await api('ertesites'); }catch(e){ box.querySelector('p').outerHTML=`<div class="msg err">${esc(e.message)}</div>`; return; }
  const when=t=>t?esc(new Date(t).toLocaleString('hu-HU',{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})):'';
  const head=`<h3>${icon('mail')} Értesítési e-mail cím <span class="pill2">titkos</span></h3>
    <p class="muted">Ide érkeznek a <b>megrendelések</b>, az <b>ajánlatkérések</b>, a <b>szervizbejelentések</b> és a weboldal <b>E-mail küldése</b> gombjával írt üzenetek. A cím a weboldalon sehol nem jelenik meg, és a GitHubon sincs rajta – így a kéretlen levelek küldői nem találják meg. Ha a vásárlónak válaszol, ő ezt a címet fogja látni.</p>`;
  const state=r.beallitva?`<p class="nt-st ok">${icon('check')} Beállítva${r.tulajdonos?'':`: <b>${esc(r.maszk)}</b>`}${r.nev?` <small class="muted">· ${esc(r.nev)}, ${when(r.modositva)}</small>`:''}</p>`:`<p class="nt-st no">${icon('alert')} Még nincs beállítva – addig a fenti nyilvános címre mennek a levelek, ahol jelenleg nincs postafiók.</p>`;
  if(!r.tulajdonos){ box.innerHTML=head+state+'<p class="muted" style="font-size:.88rem">Ezt a címet csak a tulajdonosok módosíthatják.</p>'; return; }
  box.innerHTML=head+state+`<div class="nt-row"><label class="l" style="margin:0;flex:1 1 260px">E-mail cím<input class="i" type="email" id="nt-mail" autocomplete="off" inputmode="email" value="${esc(r.email)}" placeholder="pl. penztargepbolt@gmail.com"></label>
    <button class="btn gold" type="button" id="nt-save">${icon('check')} Mentés</button><button class="btn line" type="button" id="nt-test" ${r.beallitva?'':'disabled'}>${icon('mail')} Próbalevél</button></div>
    <div class="nt-msg" id="nt-msg" aria-live="polite">${r.proba?`<small class="muted">Utolsó próbalevél: ${when(r.proba)}</small>`:''}</div>`;
  const msg=(t,k)=>{ $('#nt-msg').innerHTML=`<div class="msg ${k||'ok'}">${t}</div>`; };
  $('#nt-mail').addEventListener('input',()=>{ $('#nt-test').disabled=true; });
  $('#nt-mail').addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); $('#nt-save').click(); } });
  $('#nt-save').onclick=async e=>{ const b=e.currentTarget, v=$('#nt-mail').value.trim(); b.disabled=true;
    try{ await api('ertesites-mentes',{body:{email:v}}); toast(v?'Értesítési cím mentve':'Értesítési cím törölve'); await admNotify(); if(v) msg('Mentve. Most nyomja meg a <b>Próbalevél</b> gombot, és nézze meg, megérkezik-e (a Spam mappát is).'); }
    catch(err){ msg(esc(err.message),'err'); b.disabled=false; } };
  $('#nt-test').onclick=async e=>{ const b=e.currentTarget; b.disabled=true;
    try{ const x=await api('ertesites-proba',{body:{}}); msg(x.elonezet?'Előnézetben nem megy ki levél – az élő oldalon ez a gomb valódi próbalevelet küld.':'Próbalevél elküldve. Pár percen belül meg kell érkeznie. Ha nem jön, nézze meg a <b>Levélszemét / Spam</b> mappát, és jelölje „Nem spam”-ként.'); }
    catch(err){ msg(esc(err.message),'err'); } setTimeout(()=>{ if(b.isConnected) b.disabled=false; },60000); };
}
function bindHours(){
  const s=DB.settings; const upd=()=>{ const h={}; DAYS.forEach(([d])=>{ const on=$('#ho-'+d).checked; $('#hf-'+d).disabled=$('#ht-'+d).disabled=!on; h[d]=on?[$('#hf-'+d).value||'09:00',$('#ht-'+d).value||'15:00']:null; });
    s.nyitva=h; s.nyitvatartas=hoursText(h); $('#htext').innerHTML='A weboldalon így jelenik meg: <b>'+esc(s.nyitvatartas)+'</b>'; markDirty(); };
  $$('[data-hopen],[data-hfrom],[data-hto]').forEach(x=>x.addEventListener(x.type==='checkbox'?'change':'input',upd));
  const zvRender=()=>{ $('#zarva-list').innerHTML=zarvaListHTML(s.zarvaNapok); $$('[data-zvdel]').forEach(b=>b.onclick=()=>{ s.zarvaNapok=(s.zarvaNapok||[]).filter((x,i)=>i!==+b.dataset.zvdel); zvRender(); markDirty(); }); };
  zvRender();
  $('#zv-tol')?.addEventListener('change',e=>{ const ig=$('#zv-ig'); ig.min=e.target.value; if(ig.value&&ig.value<e.target.value) ig.value=''; });
  $('#zv-add')?.addEventListener('click',()=>{ const a=$('#zv-tol').value, b=$('#zv-ig').value, m=$('#zv-msg');
    if(!a){ m.innerHTML='<div class="msg err">Válassza ki az első zárva napot.</div>'; $('#zv-tol').focus(); return; }
    if(b&&b<a){ m.innerHTML='<div class="msg err">Az utolsó nap nem lehet korábban, mint az első.</div>'; return; }
    s.zarvaNapok=[...(s.zarvaNapok||[]),(b&&b!==a)?a+'..'+b:a].sort(); $('#zv-tol').value=''; $('#zv-ig').value='';
    m.innerHTML='<div class="msg ok">Hozzáadva. Ne felejtse el megnyomni alul a <b>Mentés</b> gombot!</div>'; zvRender(); markDirty(); });
}
/* ---- Biztonság fül: telefonos megerősítés, jelszó, belépési napló ---- */
function loadQR(){ return window.QRCode?Promise.resolve():new Promise((ok,no)=>{ const sc=document.createElement('script'); sc.src='https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'; sc.onload=ok; sc.onerror=no; document.head.appendChild(sc); }); }
async function admSecurity(){
  let info; try{ info=await api('security'); }catch(e){ $('#admbody').innerHTML=`<div class="msg err">${esc(e.message)}</div>`; return; }
  const b=$('#admbody'); if(!b) return; const me=info.me||{};
  b.innerHTML=`<div style="display:grid;gap:20px;max-width:780px">
  <div class="editor" style="margin:0"><div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap"><span style="width:52px;height:52px;border-radius:14px;display:grid;place-items:center;background:#e4f5eb;color:var(--ok)">${icon('shield','ic','width:30px;height:30px')}</span><div style="flex:1;min-width:220px"><h3>Belépés megerősítése e-mailben</h3><p class="muted">Minden belépésnél a jelszó után a rendszer egy 6 jegyű kódot küld ide: <b>${esc(me.emailMask||'nincs megadva')}</b>. A kód 10 percig érvényes.</p></div></div>
    <p class="muted" style="font-size:.88rem;margin-top:10px">Telefonszám: <b class="num">${esc(me.tel||'')}</b> · ${me.szerep==='tulajdonos'?'Tulajdonos: a név, a telefonszám és az e-mail cím csak a programban módosítható.':'Az adatait a tulajdonosok módosíthatják.'}</p></div>
  <div class="editor" style="margin:0"><h3>Tartalék: telefonos hitelesítő app ${info.totp?'<span class="pill2" style="color:var(--ok);border-color:#bfe5cf;background:#e4f5eb">bekapcsolva</span>':'<span class="pill2">nem kötelező</span>'}</h3><p class="muted">${info.totp?`Ha az e-mail nem érkezik meg, a 2. lépésben a telefon Jelszavak alkalmazásának kódját is beírhatja. Tartalékkód: ${info.recoveryLeft} db maradt.`:'Ha egyszer nem érkezne meg az e-mail, a telefon hitelesítő alkalmazásának kódjával (iPhone: Beállítások › Jelszavak) is be tud lépni.'}</p>
    <div id="totpbox">${info.totp?`<form class="f" id="totpoff" style="margin-top:12px"><label class="l" style="max-width:340px">Jelszó a kikapcsoláshoz<input class="i" type="password" id="off-pw" autocomplete="current-password"></label><div class="out"></div><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn line" type="submit">Kikapcsolás</button><button class="btn line" type="button" id="totpnew">Új telefon beállítása</button></div></form>`:`<button class="btn line" type="button" id="totpstart" style="margin-top:12px">${icon('phone')} Beállítás a telefonomon</button>`}</div></div>
  ${me.szerep==='tulajdonos'?`<div class="editor" style="margin:0" id="mesterbox"><h3>Mesterkód</h3><p class="muted">Ha nem érkezik meg az e-mailes kód, a jelszó után ezzel a 16 karakteres kóddal is be lehet lépni. Csak tulajdonos használhatja. Tartsa biztonságos helyen (pl. iPhone Jelszavak app), és ne küldje el senkinek.</p><div id="mesterinfo" class="muted" style="font-size:.9rem;margin:6px 0 10px"></div><button class="btn line" type="button" id="mesteruj">${icon('shield')} Új mesterkód készítése</button><div id="mesterki"></div></div>`:''}
  <div class="editor" style="margin:0"><h3>Jelszó módosítása</h3><form class="f" id="pwf"><div class="row2"><label class="l">Jelenlegi jelszó<input class="i" type="password" id="pw-old" autocomplete="current-password"></label><label class="l">Új jelszó (min. 10 karakter)<input class="i" type="password" id="pw-new" autocomplete="new-password"></label></div><div class="out"></div><button class="btn navy" type="submit" style="justify-self:start">Jelszó módosítása</button></form></div>
  <div class="editor" style="margin:0"><h3>Utolsó belépések${me.szerep==='tulajdonos'?' (mindenki)':''}</h3>${(info.log||[]).length?`<div class="tablewrap"><table class="ptable"><thead><tr><th>Időpont</th><th>Ki</th><th>Mód</th><th>Honnan</th></tr></thead><tbody>${info.log.slice(0,15).map(l=>`<tr><td data-l="Időpont" class="num">${esc(new Date(l.ido).toLocaleString('hu-HU'))}</td><td data-l="Ki"><b>${esc(l.nev||'')}</b></td><td data-l="Mód">${esc(l.mod)}</td><td data-l="Honnan"><span class="num">${esc(l.ip)}</span><br><small class="muted">${esc(/iPhone|iPad/.test(l.eszkoz)?'iPhone / iPad':/Android/.test(l.eszkoz)?'Android telefon':/Mac/.test(l.eszkoz)?'Mac':/Windows/.test(l.eszkoz)?'Windows':'egyéb eszköz')}</small></td></tr>`).join('')}</tbody></table></div><p class="muted" style="font-size:.86rem">Ha ismeretlen belépést lát, azonnal változtasson jelszót, és szóljon a többi tulajdonosnak.</p>`:'<p class="muted">Még nincs naplózott belépés.</p>'}</div></div>`;
  if($('#mesterbox')){ api('master-info').then(r=>{ $('#mesterinfo').textContent=r.van?`Van érvényes mesterkód (készült: ${new Date(r.ido).toLocaleString('hu-HU')}, ${r.nev||''}).`:'Még nincs mesterkód.'; }).catch(()=>{});
    $('#mesteruj').onclick=async e=>{ const b=e.currentTarget; if(!b.dataset.biztos){ b.dataset.biztos='1'; b.textContent='Biztos? A régi mesterkód azonnal érvénytelen lesz – kattintson újra'; return; } b.disabled=true;
      try{ const r=await api('master-new',{body:{}}); $('#mesterki').innerHTML=`<div class="msg ok" style="margin-top:12px"><b>Az új mesterkód (csak most látható!):</b><div class="num" style="font-size:1.5rem;letter-spacing:.12em;margin:8px 0;user-select:all">${esc(r.kod)}</div>Írja fel vagy mentse el most. Ha bezárja ezt az oldalt, többé nem lehet megnézni, csak újat készíteni.</div>`; b.remove(); }catch(err){ toast(err.message); b.disabled=false; } }; }
  const pwf=$('#pwf'); pwf.onsubmit=async e=>{ e.preventDefault(); const out=$('.out',pwf); try{ await api('password',{body:{regi:$('#pw-old').value,uj:$('#pw-new').value}}); out.innerHTML='<div class="msg ok">A jelszó megváltozott.</div>'; pwf.reset(); }catch(err){ out.innerHTML=`<div class="msg err">${esc(err.message)}</div>`; } };
  $('#totpstart')?.addEventListener('click',totpSetup); $('#totpnew')?.addEventListener('click',totpSetup);
  const off=$('#totpoff'); if(off) off.onsubmit=async e=>{ e.preventDefault(); try{ await api('totp-disable',{body:{jelszo:$('#off-pw').value}}); toast('A telefonos app kikapcsolva'); admSecurity(); }catch(err){ $('.out',off).innerHTML=`<div class="msg err">${esc(err.message)}</div>`; } };
}
async function totpSetup(){
  const box=$('#totpbox'); let r; try{ r=await api('totp-setup',{body:{}}); }catch(err){ toast(err.message); return; }
  const isPhone=/iPhone|iPad|Android/.test(navigator.userAgent);
  box.innerHTML=`<div style="display:grid;gap:16px;margin-top:16px">
    <div class="msg info" style="font-weight:500"><b>1.</b> ${isPhone?'Koppintson a gombra: a telefon megnyitja a hitelesítő alkalmazást (iPhone-on a Jelszavak alkalmazást).':'Olvassa be a QR-kódot a telefon kamerájával: iPhone-on a Kamera felajánlja a „Hozzáadás a Jelszavakhoz” lehetőséget.'}</div>
    <div style="display:flex;gap:20px;flex-wrap:wrap;align-items:center"><div id="qr" style="width:212px;height:212px;padding:6px;background:#fff;border:1px solid var(--line);border-radius:12px;display:grid;place-items:center"><span class="muted" style="font-size:.8rem">QR-kód betöltése…</span></div>
      <div style="display:grid;gap:10px;flex:1;min-width:220px"><a class="btn gold" href="${esc(r.uri)}">${icon('phone')} Megnyitás a telefonon</a><div><span class="muted" style="font-size:.84rem">Vagy írja be kézzel a kulcsot:</span><div class="num" style="font-weight:700;letter-spacing:.08em;word-break:break-all;user-select:all;padding:8px 10px;background:var(--surface-2);border-radius:8px;margin-top:4px">${esc(r.secret.match(/.{1,4}/g).join(' '))}</div></div></div></div>
    <form class="f" id="totpon"><div class="msg info" style="font-weight:500"><b>2.</b> Írja be a telefonon megjelent 6 jegyű kódot.</div><label class="l">Kód a telefonról<input class="i num" id="on-code" inputmode="numeric" autocomplete="one-time-code" maxlength="7" style="font-size:1.4rem;letter-spacing:.25em;max-width:220px"></label><div class="out"></div><button class="btn navy" type="submit" style="justify-self:start">Bekapcsolás</button></form></div>`;
  loadQR().then(()=>{ const q=$('#qr'); q.innerHTML=''; new QRCode(q,{text:r.uri,width:200,height:200,correctLevel:QRCode.CorrectLevel.M}); }).catch(()=>{ $('#qr').innerHTML='<span class="muted" style="font-size:.8rem;padding:10px;text-align:center">A QR-kód nem töltődött be. Használja a gombot vagy a kulcsot.</span>'; });
  $('#totpon').onsubmit=async e=>{ e.preventDefault(); try{ const codes=(await api('totp-enable',{body:{kod:$('#on-code').value}})).recovery;
      box.innerHTML=`<div style="display:grid;gap:12px;margin-top:16px"><div class="msg ok">Kész! Ha az e-mail nem érkezne meg, a telefonos kóddal is be tud lépni.</div><div class="msg info" style="font-weight:500"><b>Tartalékkódok</b> arra az esetre, ha a telefon sincs kéznél. Mindegyik egyszer használható. Írja fel őket – <b>most látja őket utoljára</b>.</div><div class="num" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;font-weight:700;letter-spacing:.06em;user-select:all">${codes.map(c=>`<span style="padding:8px 12px;background:var(--surface-2);border-radius:8px">${esc(c)}</span>`).join('')}</div><button class="btn gold" type="button" id="recdone" style="justify-self:start">Felírtam, kész</button></div>`;
      $('#recdone').onclick=()=>admSecurity(); }catch(err){ $('#totpon .out').innerHTML=`<div class="msg err">${esc(err.message)}</div>`; } };
}
async function admUsers(){
  let list; try{ list=await api('users'); }catch(e){ $('#admbody').innerHTML=`<div class="msg err">${esc(e.message)}</div>`; return; }
  const b=$('#admbody'); if(!b) return;
  const st=u=>u.aktiv?'<span class="pill2" style="color:var(--ok);border-color:#bfe5cf;background:#e4f5eb">aktív</span>':'<span class="pill2">még nem lépett be</span>';
  b.innerHTML=`<div style="display:grid;gap:20px;max-width:900px">
  <p class="muted">A tulajdonosokat (a három beépített személy) nem lehet törölni, és adataikat csak a programban lehet módosítani. További admin hozzáférést csak tulajdonos adhat. Mindenki a saját e-mail címére kapja a belépési kódot.</p>
  <div class="tablewrap"><table class="ptable"><thead><tr><th>Név</th><th>Telefon</th><th>E-mail</th><th>Állapot</th><th>Utolsó belépés</th><th></th></tr></thead><tbody>${list.map(u=>`<tr><td class="nm"><b>${esc(u.nev)}</b><small>${u.szerep==='tulajdonos'?'tulajdonos':'admin'+(u.felvette?' · felvette: '+esc(u.felvette):'')}</small></td><td data-l="Telefon" class="num">${esc(u.telTeljes||u.tel)}</td><td data-l="E-mail">${u.emailCim?esc(u.emailCim):'<span style="color:var(--bad);font-weight:600">nincs megadva</span>'}</td><td data-l="Állapot">${st(u)}${u.app?' <span class="pill2">app</span>':''}</td><td data-l="Utolsó belépés" class="num">${u.utolso?esc(new Date(u.utolso).toLocaleString('hu-HU')):'—'}</td>
    <td>${u.id===ADMIN.me?.id?'<small class="muted">Ön</small>':`<div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn line sm" type="button" data-ureset="${esc(u.id)}">Jelszó visszaállítása</button>${u.szerep!=='tulajdonos'?`<button class="btn ghost sm" type="button" data-udel="${esc(u.id)}" style="color:var(--bad)">Törlés</button>`:''}</div><span data-uconf="${esc(u.id)}"></span>`}</td></tr>`).join('')}</tbody></table></div>
  <div class="editor" style="margin:0"><h3>Új admin hozzáférés</h3><p class="muted">A megadott személy e-mailt kap; az első belépéskor az erre a címre küldött kóddal állít be magának jelszót.</p>
    <form class="f" id="uadd"><div class="row2"><label class="l">Név<input class="i" id="ua-nev" autocomplete="off"></label><label class="l">Telefonszám<input class="i num" id="ua-tel" type="tel" placeholder="+36 30 123 4567" autocomplete="off"></label></div><label class="l">E-mail cím <span class="o">ide megy a belépési kód</span><input class="i" id="ua-email" type="email" autocomplete="off"></label><div class="out"></div><button class="btn navy" type="submit" style="justify-self:start">${icon('plus')} Hozzáférés adása</button></form></div></div>`;
  $('#uadd').onsubmit=async e=>{ e.preventDefault(); const out=$('#uadd .out'); try{ await api('user-add',{body:{nev:$('#ua-nev').value,tel:$('#ua-tel').value,email:$('#ua-email').value}}); toast('Hozzáférés megadva'); admUsers(); }catch(err){ out.innerHTML=`<div class="msg err">${esc(err.message)}</div>`; } };
  const confirmBtn=(id,label,fn)=>{ const c=$(`[data-uconf="${id}"]`); c.innerHTML=`<div style="display:flex;gap:6px;margin-top:6px"><button class="btn sm" type="button" style="background:var(--bad);color:#fff">${label}</button><button class="btn ghost sm" type="button">Mégse</button></div>`; const [y,n]=$$('button',c); y.onclick=fn; n.onclick=()=>c.innerHTML=''; };
  $$('[data-ureset]').forEach(x=>x.onclick=()=>confirmBtn(x.dataset.ureset,'Igen, visszaállítom',async()=>{ try{ await api('user-reset',{body:{id:x.dataset.ureset}}); toast('Visszaállítva: következő belépéskor e-mailes kóddal állít be új jelszót'); admUsers(); }catch(err){ toast(err.message); } }));
  $$('[data-udel]').forEach(x=>x.onclick=()=>confirmBtn(x.dataset.udel,'Igen, törlöm',async()=>{ try{ await api('user-del',{body:{id:x.dataset.udel}}); toast('Hozzáférés törölve'); admUsers(); }catch(err){ toast(err.message); } }));
}

/* ---- Feladatok, észrevételek a weboldallal kapcsolatban ---- */
async function admTasks(){
  const b=$('#admbody'); if(!b) return; let l=[];
  try{ l=(await api('tasks')).tasks||[]; }catch(e){ b.innerHTML=`<div class="msg err">${esc(e.message)}</div>`; return; }
  const nyitott=l.filter(x=>!x.kesz), kesz=l.filter(x=>x.kesz).sort((a,c)=>String(c.keszIdo||'').localeCompare(String(a.keszIdo||'')));
  const dt=s=>{ try{ return new Date(s).toLocaleString('hu-HU',{year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'}); }catch(e){ return s; } };
  const item=(x,k)=>`<li class="fk-it${k?' kesz':''}"><div class="fk-tx">${esc(x.szoveg).replace(/\n/g,'<br>')}</div><div class="fk-meta"><span>${icon('clock')} ${esc(dt(x.ido))}</span><span>${icon('users')} ${esc(x.nev||'')}</span>${k?`<span class="fk-ok">${icon('check')} Teljesítette: ${esc(x.keszNev||'')} · ${esc(dt(x.keszIdo))}</span>`:''}</div>
    <div class="fk-gombok"><button type="button" class="btn line sm fk-copy" data-fkcopy="${esc(x.id)}" aria-label="Bejegyzés másolása">${icon('file')} Másolás</button>${k?`<button type="button" class="btn ghost sm" data-fkvissza="${esc(x.id)}">Vissza a nyitottak közé</button>`:`<button type="button" class="btn gold fk-done" data-fkdone="${esc(x.id)}">${icon('check')} Teljesítve</button>`}</div></li>`;
  const ADMIN_FK=ADMIN.fk||'nyitott';
  b.innerHTML=`<div class="fk">
    <form class="fk-uj" id="fk-uj"><label class="l" for="fk-sz">Új feladat vagy észrevétel</label><textarea class="i" id="fk-sz" rows="3" maxlength="4000" placeholder="Például: a Szerviz oldalon frissíteni kell az árakat."></textarea>
      <div class="fk-ujl"><small class="muted">A dátum és az Ön neve (${esc(ADMIN.me?.nev||'')}) automatikusan hozzákerül.</small><button class="btn gold" type="submit">${icon('plus')} Elküldés</button></div><div class="out" aria-live="polite"></div></form>
    <div class="chips" role="tablist"><button type="button" class="chip ${ADMIN_FK==='nyitott'?'on':''}" data-fk="nyitott">Elvégzendő <b>${nyitott.length}</b></button><button type="button" class="chip ${ADMIN_FK==='kesz'?'on':''}" data-fk="kesz">Teljesített kérések <b>${kesz.length}</b></button></div>
    ${ADMIN_FK==='nyitott'?(nyitott.length?`<ul class="fk-l">${nyitott.map(x=>item(x,false)).join('')}</ul>`:'<p class="fk-ures">Nincs elvégzendő feladat. 🙂</p>'):(kesz.length?`<ul class="fk-l">${kesz.map(x=>item(x,true)).join('')}</ul>`:'<p class="fk-ures">Még nincs teljesített kérés.</p>')}
  </div>`;
  $('#fk-uj').onsubmit=async e=>{ e.preventDefault(); const sz=$('#fk-sz').value.trim(), out=$('#fk-uj .out'); if(!sz){ out.innerHTML='<div class="msg err">Írja be a feladatot vagy az észrevételt.</div>'; $('#fk-sz').focus(); return; }
    const btn=$('#fk-uj button[type=submit]'); btn.disabled=true; try{ await api('task-add',{body:{szoveg:sz}}); ADMIN.fk='nyitott'; toast('Elküldve'); admTasks(); }catch(err){ out.innerHTML=`<div class="msg err">${esc(err.message)}</div>`; btn.disabled=false; } };
  $$('[data-fk]',b).forEach(x=>x.onclick=()=>{ ADMIN.fk=x.dataset.fk; admTasks(); });
  $$('[data-fkcopy]',b).forEach(x=>x.onclick=async()=>{ const li=x.closest('.fk-it'), tx=li.querySelector('.fk-tx'), meta=li.querySelector('.fk-meta');
    const szoveg=tx.innerText.trim()+'\n— '+meta.innerText.replace(/\s+/g,' ').trim();
    const sel=getSelection(), r=document.createRange(); r.selectNodeContents(tx); sel.removeAllRanges(); sel.addRange(r);
    $$('.fk-it.kijelolt',b).forEach(y=>y.classList.remove('kijelolt')); li.classList.add('kijelolt');
    let ok=false; try{ await navigator.clipboard.writeText(szoveg); ok=true; }catch(e){ try{ ok=document.execCommand('copy'); }catch(_){} }
    toast(ok?'Kimásolva – beillesztheti bárhová':'Kijelölve – másolja ki (Cmd+C / hosszan nyomva Másolás)'); });
  $$('[data-fkdone]',b).forEach(x=>x.onclick=async()=>{ x.disabled=true; try{ await api('task-done',{body:{id:x.dataset.fkdone}}); toast('Áthelyezve a teljesített kérések közé'); admTasks(); }catch(err){ toast(err.message); x.disabled=false; } });
  $$('[data-fkvissza]',b).forEach(x=>x.onclick=async()=>{ try{ await api('task-done',{body:{id:x.dataset.fkvissza,vissza:true}}); toast('Visszakerült az elvégzendők közé'); admTasks(); }catch(err){ toast(err.message); } });
}
async function admOrders(){
  let list=[]; try{ list=MODE==='live'?await api('orders'):LS.get('ptg-orders3',[]); }catch(e){ $('#admbody').innerHTML=`<div class="msg err">${esc(e.message)}</div>`; return; }
  ADMIN.newOrders=list.filter(o=>o.allapot==='uj').length; updBadges();
  const names={ajanlat:['Ajánlatkérés','tag'],megrendeles:['Megrendelés','cart'],szerviz:['Szerviz','wrench'],atallas:['E-pénztárgép','shield'],uzenet:['Üzenet','mail']};
  const of=ADMIN.of||'uj', sts=[['uj','Új'],['folyamatban','Visszaigazolva'],['kesz','Kész'],['lemondva','Lemondva'],['all','Mind']];
  const shown=list.filter(o=>of==='all'||o.allapot===of);
  const b=$('#admbody'); if(!b) return;
  b.innerHTML=`<div class="chips">${sts.map(([k,l])=>`<button type="button" class="chip ${of===k?'on':''}" data-of="${k}">${l} <b>${k==='all'?list.length:list.filter(o=>o.allapot===k).length}</b></button>`).join('')}</div>
  ${shown.length?`<div class="olist">${shown.map(o=>{ const [nm,ic]=names[o.tipus]||[o.tipus,'file']; const sum=(o.tetelek||[]).reduce((a,t)=>a+(t.ar||0)*(t.db||1),0); const tel=(o.telefon||'').replace(/[^\d+]/g,'');
    return `<article class="ocard st-${esc(o.allapot)}"><header><span class="oic">${icon(ic)}</span><div><b>${esc(o.nev)}${o.ceg?` <small>· ${esc(o.ceg)}</small>`:''}</b><small>${esc(nm)} · <span class="num">${esc(new Date(o.ido).toLocaleString('hu-HU',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}))}</span> · <span class="num">#${esc(o.id)}</span></small></div></header>
      ${(o.tetelek||[]).length?`<ul class="oitems">${o.tetelek.map(t=>`<li><span><b class="num">${esc(t.db)}×</b> ${esc(t.nev)}</span><span class="num">${t.ar?ft(t.ar*(t.db||1)):'kérésre'}</span></li>`).join('')}${sum?`<li class="tot"><span>Összesen (nettó)</span><span class="num">${ft(sum)}</span></li>`:''}</ul>`:''}
      ${o.fizetes||o.osszeg?`<div class="opay">${o.fizetes?.mod==='online'?`<span class="pbadge ${esc(o.fizetes.allapot)}">${{fizetve:'Kifizetve online',fizetesre_var:'Fizetésre vár',sikertelen:'Sikertelen fizetés'}[o.fizetes.allapot]||''}</span>`:''}${o.fizmod?`<span>${esc(o.fizmod)}</span>`:''}${o.osszeg?`<b class="num">${ft(o.osszeg)}</b>`:''}</div>`:''}
      ${o.atvetel?`<p class="muted" style="margin:0">${icon(o.atvetel==='Kiszállítással'?'route':'store','ic','width:16px;height:16px;vertical-align:-3px')} ${esc(o.atvetel)}${o.szallcim?`: <b>${esc(o.szallcim)}</b>`:''}</p>`:''}
      ${o.adatlap?`<details class="oadl" ${o.allapot==='uj'?'open':''}><summary>${icon('register','ic','width:18px;height:18px')} Pénztárgép-adatlap</summary><dl>${Object.entries(o.adatlap).map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></details>`:''}
      ${o.uzenet?`<p class="omsg">${esc(o.uzenet)}</p>`:''}${o.idopont?`<p class="muted">${icon('clock','ic','width:16px;height:16px;vertical-align:-3px')} Időpont: ${esc(o.idopont)}</p>`:''}
      <div class="oact">${tel?`<a class="btn line sm" href="tel:${esc(tel)}">${icon('phone')} Hívás</a>`:''}${o.email?`<a class="btn line sm" href="mailto:${esc(o.email)}?subject=${encodeURIComponent(o.tipus==='uzenet'?'Válasz: '+(o.targy||'üzenetére')+' – Totál Pénztárgép':'Megrendelése: #'+o.id)}">${icon('mail')} E-mail</a>`:''}</div>
      <div class="oseg" role="group" aria-label="Állapot">${[['uj','Új'],['folyamatban','Visszaigazolva'],['kesz','Kész'],['lemondva','Lemondva']].map(([k,l])=>`<button type="button" class="${o.allapot===k?'on':''}" data-ost="${esc(o.id)}" data-v="${k}" aria-pressed="${o.allapot===k}" ${k==='folyamatban'&&o.tetelek?.length&&!o.visszaigazolva?'title="A vevő visszaigazoló e-mailt kap"':k==='lemondva'&&o.tetelek?.length&&!o.keszletVissza?'title="A lefoglalt darabok visszakerülnek a készletbe"':''}>${l}</button>`).join('')}${o.keszletVissza?`<small class="muted">Készlet visszatöltve: ${esc(String(o.keszletVissza).slice(0,16).replace('T',' '))}</small>`:''}${o.visszaigazolva?`<small class="muted">Visszaigazolás elküldve: ${esc(String(o.visszaigazolva).slice(0,16).replace('T',' '))}</small>`:''}</div></article>`; }).join('')}</div>`:`<div class="empty2">${icon('bell')}<b>${of==='uj'?'Nincs új rendelés':'Nincs itt semmi'}</b><span>A webáruházból érkező megrendelések, ajánlatkérések, szervizbejelentések és üzenetek itt jelennek meg.</span></div>`}`;
  $$('[data-of]').forEach(x=>x.onclick=()=>{ ADMIN.of=x.dataset.of; admOrders(); });
  $$('[data-ost]').forEach(x=>x.onclick=async()=>{ const id=x.dataset.ost, v=x.dataset.v, oo=list.find(y=>y.id===id);
    if(v==='lemondva'&&oo&&oo.allapot!=='lemondva'&&!confirm(oo.tetelek?.length&&!oo.keszletVissza?'Biztosan lemondottnak jelöli ezt a rendelést? A lefoglalt darabok visszakerülnek a készletbe.':'Biztosan lemondottnak jelöli ezt a bejegyzést?')) return;
    try{ let r=null; if(MODE==='live') r=await api('order-status',{body:{id,allapot:v}}); else { const l=LS.get('ptg-orders3',[]), o=l.find(y=>y.id===id); if(o){ if(v==='folyamatban'&&o.allapot==='uj'&&o.tetelek?.length&&!o.visszaigazolva) o.visszaigazolva=new Date().toISOString();
        if(v==='lemondva'&&o.allapot!=='lemondva'&&o.tetelek?.length&&!o.keszletVissza){ o.keszletVissza=new Date().toISOString(); (o.tetelek||[]).forEach(t=>{ const p=prod(t.id); if(p&&p.keszletDb!=null){ p.keszletDb+=t.db; if(p.keszletDb>0&&p.keszlet==='elfogyott') p.keszlet='raktaron'; } }); LS.set('ptg-data3',DB); r={keszletVissza:true}; }
        o.allapot=v; LS.set('ptg-orders3',l); } }
      if(r&&r.keszletVissza&&MODE==='live'){ try{ const j=await api('data'); if(j&&Array.isArray(j.products)&&!ADMIN.dirty){ DB=j; ALAPK=alapKeszletOf(DB); } }catch(_){} }
      toast(r&&r.visszaigazolva?'Visszaigazoló e-mail elküldve a vevőnek':r&&r.keszletVissza?'Lemondva – a lefoglalt darabok visszakerültek a készletbe':'Állapot mentve'); admOrders(); }catch(e){ toast(e.message); } });
}
function updBadges(){ $$('.aside [data-tab="rendelesek"],.abot [data-tab="rendelesek"],.qbtn[data-tab="rendelesek"]').forEach(b=>{ let e=b.querySelector('.abadge'); if(ADMIN.newOrders){ if(!e){ e=document.createElement('em'); e.className='abadge'; b.appendChild(e); } e.textContent=ADMIN.newOrders; } else e?.remove(); }); const k=$('#kpi-orders b'); if(k) k.textContent=ADMIN.newOrders||0; }
const numOrNull=v=>{ const n=parseInt(String(v).replace(/[^\d]/g,''),10); return isNaN(n)?null:n; };
function markDirty(){ ADMIN.dirty=true; const b=$('#savebar'); if(b) b.hidden=false; }
function renderAdmin(){ $('#app').innerHTML=ADMIN.in?adminHTML():loginHTML(); bindAdmin(); }
function bindAdmin(){
  bindLogin(); if(!ADMIN.in) return;
  $('#logout').onclick=async()=>{ if(ADMIN.dirty&&!$('#logout').dataset.sure){ $('#logout').dataset.sure='1'; $('#logout').textContent='Biztos? Nem mentett változás van'; return; } try{ await api('logout',{body:{}}); }catch(e){} ADMIN.in=false; ADMIN.me=null; ADMIN.L={step:'who'}; ADMIN.csrf=null; ADMIN.dirty=false; await load(); route(); };
  $$('[data-tab]').forEach(b=>b.onclick=()=>{ ADMIN.tab=b.dataset.tab; if(b.dataset.pf!==undefined) ADMIN.pf=b.dataset.pf||'all'; ADMIN.edit=null; renderAdmin(); scrollTo({top:0}); });
  const sh=$('#asheet'); $('#amore')?.addEventListener('click',()=>{ sh.hidden=false; requestAnimationFrame(()=>sh.classList.add('show')); }); $$('[data-close]',sh).forEach(x=>x.onclick=()=>{ sh.classList.remove('show'); setTimeout(()=>sh.hidden=true,220); });
  if(ADMIN.tab==='attekintes'){ (MODE==='live'?api('orders'):Promise.resolve(LS.get('ptg-orders3',[]))).then(l=>{ ADMIN.newOrders=(l||[]).filter(o=>o.allapot==='uj').length; updBadges(); }).catch(()=>{});
    $('#qa-new')?.addEventListener('click',()=>{ ADMIN.tab='termekek'; renderAdmin(); $('#newp')?.click(); });
    $$('[data-goedit]').forEach(x=>x.onclick=()=>{ ADMIN.tab='termekek'; ADMIN.edit=x.dataset.goedit; renderAdmin(); }); }
  else if(ADMIN.newOrders==null){ (MODE==='live'?api('orders'):Promise.resolve(LS.get('ptg-orders3',[]))).then(l=>{ ADMIN.newOrders=(l||[]).filter(o=>o.allapot==='uj').length; updBadges(); }).catch(()=>{}); }
  $$('[data-pc]').forEach(x=>x.onclick=()=>{ ADMIN.pc=x.dataset.pc; $$('[data-pc]').forEach(y=>y.classList.toggle('on',y===x)); filterProducts(); });
  $$('.chips [data-pf]').forEach(x=>x.onclick=()=>{ ADMIN.pf=x.dataset.pf; $$('.chips [data-pf]').forEach(y=>y.classList.toggle('on',y===x)); filterProducts(); });
  $('#pq')?.addEventListener('input',e=>{ ADMIN.pq=e.target.value; filterProducts(); });
  $$('[data-step]').forEach(x=>x.onclick=()=>{ const inp=$('#kd-'+CSS.escape(x.dataset.sid)); const v=numOrNull(inp.value); inp.value=Math.max(0,(v??0)+(+x.dataset.step)); inp.dispatchEvent(new Event('input')); });
  $$('.pc2 [data-f]').forEach(inp=>inp.addEventListener(inp.type==='checkbox'?'change':'input',()=>setTimeout(()=>{ const p=prod(inp.dataset.id), el=inp.closest('.pc2'); el.classList.toggle('off',!!p.rejtett); el.querySelector('.pst').innerHTML=stockBadge(p)+(p.kiemelt?'<em class="bdg feat">Kiemelt</em>':'')+(p.rejtett?'<em class="bdg hid">Rejtett</em>':'')+(p.kategoria==='hasznalt'?'<em class="bdg used">Használt</em>':''); el.classList.add('chg'); })));
  if(ADMIN.tab==='rendelesek') admOrders(); if(ADMIN.tab==='biztonsag') admSecurity(); if(ADMIN.tab==='felhasznalok') admUsers(); if(ADMIN.tab==='ugyfelek') admClients(); if(ADMIN.tab==='feladatok') admTasks();
  $$('[data-f]').forEach(inp=>inp.addEventListener(inp.type==='checkbox'?'change':'input',()=>{ const p=prod(inp.dataset.id), f=inp.dataset.f;
    if(f==='hasznalt'){ if(inp.checked){ if(p.kategoria!=='hasznalt') p.eredetiKat=p.kategoria; p.kategoria='hasznalt'; p.hasznalt=true; } else { p.kategoria=(p.eredetiKat&&p.eredetiKat!=='hasznalt')?p.eredetiKat:'penztargep'; p.hasznalt=false; } const el=inp.closest('.pc2'); if(el){ el.dataset.cat=p.kategoria; const sm=el.querySelector('.pnm small'); if(sm) sm.firstChild.textContent=(cat(p.kategoria)?.nev||'')+' · '; } }
    else if(f==='kiemelt') p.kiemelt=inp.checked; else if(f==='lathato') p.rejtett=!inp.checked; else if(f==='keszletDb'){ p.keszletDb=numOrNull(inp.value); p.keszlet=p.keszletDb==null?'rendelesre':(p.keszletDb>0?'raktaron':'elfogyott'); } else p[f]=numOrNull(inp.value); markDirty(); }));
  $$('[data-edit]').forEach(b=>b.onclick=()=>{ ADMIN.edit=b.dataset.edit; $('#editorwrap').innerHTML=editorHTML(prod(ADMIN.edit)); bindEditor(); });
  $('#newp')?.addEventListener('click',()=>{ const id='uj-'+Date.now().toString(36); DB.products.unshift({id,kategoria:ADMIN.pc||'penztargep',marka:'',nev:'Új termék',alcim:'',ar:null,arTol:false,akciosAr:null,keszlet:'rendelesre',keszletDb:null,kiemelt:false,engedely:'',modell:'kompakt',leiras:'',jellemzok:[],specs:[],letoltesek:[],video:'',garancia:'1 év',kepek:[],spin:[],rejtett:true}); ADMIN.edit=id; markDirty(); renderAdmin(); });
  if(ADMIN.edit) bindEditor();
  $$('[data-s]').forEach(inp=>inp.addEventListener('input',()=>{ const s=DB.services.find(x=>x.id===inp.dataset.id); s[inp.dataset.s]=inp.dataset.s==='ar'?numOrNull(inp.value):inp.value; markDirty(); }));
  $$('[data-faq]').forEach(t=>t.addEventListener('input',()=>{ cat(t.dataset.faq).gyik=t.value.split('\n').map(l=>l.split('|')).filter(x=>x[0].trim()&&x[1]).map(x=>[x[0].trim(),x.slice(1).join('|').trim()]); markDirty(); }));
  if(ADMIN.tab==='beallitasok'){ bindHours(); admNotify(); }
  $$('[data-set]').forEach(inp=>inp.addEventListener('input',()=>{ const k=inp.dataset.set; DB.settings[k]=k==='mobil'?inp.value.split(',').map(x=>x.trim()).filter(Boolean):k==='afa'?(numOrNull(inp.value)??27):inp.value; markDirty(); }));
  $('#resetprev')?.addEventListener('click',()=>{ $('#resetconfirm').innerHTML='<button class="btn sm" type="button" id="resetyes" style="background:var(--bad);color:#fff">Igen, visszaállítom</button>'; $('#resetyes').onclick=()=>{ try{localStorage.removeItem('ptg-data3')}catch(e){} DB=structuredClone(SEED); ADMIN.dirty=false; fillChrome(); toast('Visszaállítva'); renderAdmin(); }; });
  $('#save')?.addEventListener('click',async e=>{ const sv=e.currentTarget; sv.disabled=true; try{ if(MODE==='live'){ const r=await api('save',{body:{...DB,_alapKeszlet:ALAPK||undefined}});
        /* a szerver a közben leadott rendelésekkel összefésült készletet adja vissza: ezt vesszük át, és ez lesz az új kiinduló érték */
        if(r&&r.keszlet){ DB.products.forEach(p=>{ const k=r.keszlet[p.id]; if(k){ p.keszletDb=k.keszletDb; p.keszlet=k.keszlet; } }); ALAPK=alapKeszletOf(DB); }
        if(r&&r.settings) DB.settings=r.settings;
        if(r&&r.beallitasNemMentve) setTimeout(()=>toast('A cégadatokat csak tulajdonos módosíthatja – ezek változatlanok maradtak.'),1600);
        if(r&&r.keszletNemMentve) setTimeout(()=>toast('A készletszámok nem mentődtek (elavult kezelő). Töltse újra az oldalt, és írja be őket újra.'),r.beallitasNemMentve?3400:1600); }
      else if(!LS.set('ptg-data3',DB)) throw new Error('A böngésző nem engedte a mentést (túl sok vagy túl nagy kép?).'); ADMIN.dirty=false; $('#savebar').hidden=true; fillChrome(); toast('Mentve'); }catch(err){ toast(err.message); } sv.disabled=false; });
  $('#discard')?.addEventListener('click',async()=>{ await load(); ADMIN.dirty=false; ADMIN.edit=null; renderAdmin(); toast('Változások elvetve'); });
}
function bindEditor(){
  const p=prod(ADMIN.edit); if(!p) return;
  const closeEd=()=>{ ADMIN.edit=null; $('#editorwrap').innerHTML=''; document.documentElement.classList.remove('edopen'); };
  document.documentElement.classList.add('edopen');
  $('#closeed').onclick=closeEd; $$('[data-edclose]').forEach(x=>x.onclick=closeEd); $$('[data-applyed]').forEach(x=>x.onclick=()=>$('#applyed').click());
  document.onkeydown=e=>{ if(e.key==='Escape'&&ADMIN.edit) closeEd(); };
  const reEd=()=>{ $('#editorwrap').innerHTML=editorHTML(p); bindEditor(); };
  $('#applyed').onclick=()=>{ const g=id=>$('#'+id).value; const kd=numOrNull(g('e-kd'));
    Object.assign(p,{marka:g('e-marka'),nev:g('e-nev'),kategoria:g('e-kat'),modell:g('e-modell'),alcim:g('e-alcim'),ar:numOrNull(g('e-ar')),akciosAr:numOrNull(g('e-ak')),keszletDb:kd,keszlet:kd==null?'rendelesre':(kd>0?'raktaron':'elfogyott'),garancia:g('e-gar'),arTol:$('#e-tol').checked,illusztracio:$('#e-illu').checked,engedely:g('e-eng'),leiras:g('e-leiras'),
      jellemzok:g('e-jell').split('\n').map(x=>x.trim()).filter(Boolean), specs:g('e-specs').split('\n').map(l=>{ const i=l.indexOf(':'); return i>0?[l.slice(0,i).trim(),l.slice(i+1).trim()]:null; }).filter(Boolean),
      letoltesek:g('e-dl').split('\n').map(l=>l.split('|')).filter(x=>x[0].trim()&&x[1]&&x[1].trim()).map(x=>({nev:x[0].trim(),url:x.slice(1).join('|').trim()})), video:g('e-video').trim()});
    markDirty(); ADMIN.edit=null; document.documentElement.classList.remove('edopen'); renderAdmin(); toast('Átvéve. A végleges mentéshez nyomja meg a Mentés gombot.'); };
  $('#delp').onclick=()=>{ $('#delconfirm').innerHTML='<button class="btn sm" type="button" id="delyes" style="background:var(--bad);color:#fff">Igen, törlöm</button>'; $('#delyes').onclick=()=>{ DB.products=DB.products.filter(x=>x.id!==p.id); ADMIN.edit=null; document.documentElement.classList.remove('edopen'); markDirty(); renderAdmin(); }; };
  $$('[data-del]').forEach(b=>b.onclick=()=>{ const [k,i]=b.dataset.del.split(':'); p[k].splice(+i,1); markDirty(); reEd(); });
  $$('[data-mv]').forEach(b=>b.onclick=()=>{ const [k,i,d]=b.dataset.mv.split(':'); const a=p[k], j=+i+(+d); if(j<0||j>=a.length) return; [a[+i],a[j]]=[a[j],a[+i]]; markDirty(); reEd(); });
  ['kepek','spin'].forEach(k=>{ $('#up-'+k).onchange=async e=>{ const out=$('#edform .out'); const files=[...e.target.files].sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true})); out.innerHTML=`<div class="msg info">Feltöltés: 0 / ${files.length}</div>`;
    if(k==='kepek'&&p.illusztracio){ p.kepek=(p.kepek||[]).filter(u=>!String(u).includes('kepek/illusztracio/')); p.illusztracio=false; }
    try{ let n=0; for(const file of files){ let url; if(MODE==='live'){ const fd=new FormData(); fd.append('kep',file); url=(await api('upload',{body:fd})).url; } else url=await shrink(file,k==='spin'||files.length>=8?720:1100); (p[k]=p[k]||[]).push(url); out.innerHTML=`<div class="msg info">Feltöltés: ${++n} / ${files.length}</div>`; }
      markDirty(); reEd(); toast(framesOf(p).length?'Képek hozzáadva – a 360°-os nézet elkészült':'Képek hozzáadva'); }catch(err){ out.innerHTML=`<div class="msg err">${esc(err.message)}</div>`; } }; });
}
function shrink(file,max){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>{ const im=new Image(); im.onload=()=>{ const s=Math.min(1,max/Math.max(im.width,im.height)), c=document.createElement('canvas'); c.width=Math.round(im.width*s); c.height=Math.round(im.height*s); c.getContext('2d').drawImage(im,0,0,c.width,c.height); res(c.toDataURL('image/jpeg',.82)); }; im.onerror=()=>rej(new Error('Ez a fájl nem kép.')); im.src=r.result; }; r.onerror=()=>rej(new Error('A fájl nem olvasható.')); r.readAsDataURL(file); }); }


/* ================= ÜGYFELEK: távolság az üzlettől, zónák, kiszállási kör ================= */
const C={list:[],meta:null,owner:false,q:'',zone:-1,sort:'tav',view:'lista',sel:new Set(),geoRun:false};
const DEMO_CLIENTS=[['Minta Pékség (minta)','Pécs','7621','Király utca 1.',46.0768,18.2310,'Sam4s NR-300'],['Példa Trafik (minta)','Pécs','7632','Diana tér 1.',46.0629,18.2026,'Micra Jota E'],['Minta Zöldséges (minta)','Kozármisleny','7761','Fő utca 1.',46.0302,18.2905,'Sam4s NR-240'],['Példa Büfé (minta)','Orfű','7677','Széchenyi tér 1.',46.1497,18.1475,'Micra K10'],['Minta Fodrászat (minta)','Komló','7300','Városház tér 1.',46.1917,18.2618,'Sam4s NR-330'],['Példa Vegyesbolt (minta)','Siklós','7800','Felszabadulás utca 1.',45.8549,18.2985,'Montel Sento'],['Minta Kávézó (minta)','Szigetvár','7900','Zrínyi tér 1.',46.0484,17.8060,'Sam4s NR-440'],['Példa Virágbolt (minta)','Mohács','7700','Széchenyi tér 1.',45.9931,18.6831,'Sam4s NR-300']]
  .map(([nev,varos,irsz,cim,lat,lon,gep],i)=>({id:'minta'+i,nev,kapcsolattarto:'',telefon:'+36 30 000 00'+String(i).padStart(2,'0'),email:'',irsz,varos,cim,adoszam:'',gep,ap:'',felulvizsgalat:new Date(Date.now()+(i*41-60)*864e5).toISOString().slice(0,10),megjegyzes:'Kitalált mintaadat az előnézethez.',cimkek:'',lat,lon,geo:'ok'}));
const DEF_META={bolt:{lat:46.0786,lon:18.2318,cim:'7625 Pécs, Hunyadi János utca 34.',ellenorzott:true},zonak:[{nev:'Pécs belváros',km:3,szin:'#1f9d55',dij:''},{nev:'Pécs',km:10,szin:'#2b6cb0',dij:''},{nev:'Pécs környéke',km:25,szin:'#c98e2b',dij:''},{nev:'Baranya',km:50,szin:'#dd6b20',dij:''},{nev:'Távoli',km:null,szin:'#c0352b',dij:''}]};
function fakeClients(a,b,me){
  const st=LS.get('ptg-clients-demo',null)||{clients:structuredClone(DEMO_CLIENTS),meta:structuredClone(DEF_META)}, save=()=>LS.set('ptg-clients-demo',st), own=me.szerep==='tulajdonos';
  const needOwn=()=>{ if(!own) pErr('Ezt csak a tulajdonosok végezhetik el.'); };
  switch(a){
    case 'clients': return {clients:st.clients,meta:st.meta,tulajdonos:own};
    case 'client-save': { const c=b.c||{}; if(!String(c.nev||'').trim()) pErr('Adja meg az ügyfél nevét.'); const i=st.clients.findIndex(x=>x.id===c.id); const old=i>=0?st.clients[i]:{};
      const n={...old,...c,id:old.id||Math.random().toString(16).slice(2,14)}; const addrCh=['irsz','varos','cim'].some(k=>(old[k]||'')!==(n[k]||'')); if(c.geo==='kezi'){} else if(addrCh||i<0){ n.lat=null; n.lon=null; n.geo='nincs'; }
      if(i>=0) st.clients[i]=n; else st.clients.push(n); save(); return {ok:true,c:n}; }
    case 'client-del': needOwn(); st.clients=st.clients.filter(x=>x.id!==b.id); save(); return {ok:true};
    case 'clients-import': { needOwn(); if(b.mode==='csere') st.clients=[]; let n=0; (b.rows||[]).forEach(r=>{ if(String(r.nev||'').trim()){ st.clients.push({...r,id:Math.random().toString(16).slice(2,14),lat:null,lon:null,geo:'nincs'}); n++; } }); save(); return {ok:true,db:n}; }
    case 'clients-meta': needOwn(); if(b.bolt) st.meta.bolt={...b.bolt,ellenorzott:true}; if(b.zonak) st.meta.zonak=b.zonak; save(); return {ok:true};
    case 'geocode': st.clients.forEach(c=>{ if(c.geo==='nincs') c.geo='hiba'; }); save(); return {kesz:0,hatra:0,clients:st.clients,meta:st.meta,elonezet:true};
    case 'clients-export': needOwn(); return {clients:st.clients};
    case 'clients-log': return [{ido:new Date().toISOString(),nev:me.nev,ip:'(ez a böngésző)',mit:'előnézet: a napló élesben a szerveren készül'}];
  }
}
const toRad=d=>d*Math.PI/180;
function kmFrom(c){ const b=C.meta?.bolt; if(!b||c.lat==null||c.lon==null) return null; const R=6371, dLa=toRad(c.lat-b.lat), dLo=toRad(c.lon-b.lon), x=Math.sin(dLa/2)**2+Math.cos(toRad(b.lat))*Math.cos(toRad(c.lat))*Math.sin(dLo/2)**2; return 2*R*Math.asin(Math.sqrt(x)); }
function zoneIdx(km){ const z=C.meta?.zonak||[]; if(km==null) return -1; for(let i=0;i<z.length;i++) if(z[i].km==null||km<=z[i].km) return i; return z.length-1; }
const fkm=k=>k==null?'—':(k<10?k.toFixed(1):Math.round(k)).toString().replace('.',',')+' km';
const addrOf=c=>[[c.irsz,c.varos].filter(Boolean).join(' '),c.cim].filter(Boolean).join(', ');
function revState(c){ if(!c.felulvizsgalat) return ''; const d=(new Date(c.felulvizsgalat)-new Date(new Date().toDateString()))/864e5; return d<0?'lejart':(d<=30?'kozel':''); }
async function admClients(){
  try{ const r=await api('clients'); C.list=r.clients||[]; C.meta=r.meta||DEF_META; C.owner=!!r.tulajdonos; }catch(e){ $('#admbody').innerHTML=`<div class="msg err">${esc(e.message)}</div>`; return; }
  renderClients();
  if(C.list.some(c=>(c.geo||'nincs')==='nincs')) runGeocode();
}
function clientRows(){
  const q=C.q.trim().toLowerCase();
  let l=C.list.map(c=>({c,km:kmFrom(c)})).map(x=>({...x,z:zoneIdx(x.km)}));
  if(q) l=l.filter(({c})=>[c.nev,c.kapcsolattarto,c.varos,c.cim,c.irsz,c.telefon,c.gep,c.ap,c.cimkek].join(' ').toLowerCase().includes(q));
  if(C.zone!==-1) l=l.filter(x=>C.zone===-2?x.km==null:x.z===C.zone);
  const by={tav:(a,b)=>(a.km??1e9)-(b.km??1e9),nev:(a,b)=>a.c.nev.localeCompare(b.c.nev,'hu'),varos:(a,b)=>(a.c.varos||'').localeCompare(b.c.varos||'','hu')||(a.km??1e9)-(b.km??1e9),felul:(a,b)=>(a.c.felulvizsgalat||'9999').localeCompare(b.c.felulvizsgalat||'9999')};
  return l.sort(by[C.sort]||by.tav);
}
function renderClients(){
  const b=$('#admbody'); if(!b) return; const z=C.meta.zonak, all=C.list.map(c=>zoneIdx(kmFrom(c)));
  const cnt=i=>all.filter(x=>x===i).length, noGeo=C.list.filter(c=>kmFrom(c)==null).length, rows=clientRows();
  const zl=(i)=>{ const lo=i>0?z[i-1].km:0, hi=z[i].km; return hi==null?`${lo} km felett`:`${lo}–${hi} km`; };
  b.innerHTML=`<div class="cl-wrap">
   <div class="cl-head"><div><h3>Ügyfelek <small class="muted num">${C.list.length} ügyfél</small></h3><p class="muted" style="font-size:.86rem">Távolság légvonalban az üzlettől (${esc(C.meta.bolt.cim)}), úton ennél kb. 25–40%-kal több.${MODE==='preview'?' <b>Előnézet: kitalált mintaadatok.</b>':''}</p></div>
     <div class="cl-actions">${C.owner?`<button class="btn line sm" type="button" id="cl-imp">${icon('file')} Importálás</button><button class="btn line sm" type="button" id="cl-exp">Exportálás</button><button class="btn line sm" type="button" id="cl-zon">Zónák</button><button class="btn ghost sm" type="button" id="cl-log">Napló</button>`:''}<button class="btn navy sm" type="button" id="cl-new">${icon('plus')} Új ügyfél</button></div></div>
   <div class="zchips"><button type="button" class="zc ${C.zone===-1?'on':''}" data-z="-1">Mind <b>${C.list.length}</b></button>${z.map((x,i)=>`<button type="button" class="zc ${C.zone===i?'on':''}" data-z="${i}" style="--zc:${esc(x.szin)}"><i></i>${esc(x.nev)} <small>${zl(i)}</small> <b>${cnt(i)}</b></button>`).join('')}${noGeo?`<button type="button" class="zc ${C.zone===-2?'on':''}" data-z="-2" style="--zc:#9aa6b2"><i></i>Hely nélkül <b>${noGeo}</b></button>`:''}</div>
   <div id="geoprog"></div>
   <div class="cl-tools"><label class="search-in" style="max-width:none;flex:1">${icon('search')}<input class="i" id="cl-q" type="search" placeholder="Keresés: név, település, telefon, géptípus, AP szám" value="${esc(C.q)}"></label>
     <select class="i" id="cl-sort" style="width:auto">${[['tav','Legközelebb elöl'],['nev','Név szerint'],['varos','Település szerint'],['felul','Felülvizsgálat szerint']].map(([k,v])=>`<option value="${k}" ${C.sort===k?'selected':''}>${v}</option>`).join('')}</select>
     <div class="seg"><button type="button" class="${C.view==='lista'?'on':''}" data-v="lista">Lista</button><button type="button" class="${C.view==='terkep'?'on':''}" data-v="terkep">Térkép</button></div></div>
   ${C.sel.size?`<div class="routebar">${icon('pin')}<span><b>${C.sel.size}</b> ügyfél kijelölve a kiszálláshoz</span><button class="btn gold sm" type="button" id="cl-route">Útvonal Google Térképen</button><button class="btn ghost sm" type="button" id="cl-unsel">Kijelölés törlése</button></div>`:''}
   ${C.view==='terkep'?radarHTML(rows):(rows.length?`<div class="clist">${rows.map(({c,km,z:zi})=>{ const zz=z[zi], rs=revState(c); return `<article class="ccard" style="--zc:${zz?esc(zz.szin):'#9aa6b2'}">
      <label class="csel"><input type="checkbox" data-sel="${esc(c.id)}" ${C.sel.has(c.id)?'checked':''} aria-label="Kijelölés kiszálláshoz"></label>
      <div class="cmain"><b>${esc(c.nev)}</b>${c.kapcsolattarto?`<small>${esc(c.kapcsolattarto)}</small>`:''}<span class="muted">${esc(addrOf(c))||'<i>nincs cím</i>'}</span>${c.gep||c.ap?`<small class="muted">${esc([c.gep,c.ap&&('AP: '+c.ap)].filter(Boolean).join(' · '))}</small>`:''}</div>
      <div class="cdist"><b class="num">${fkm(km)}</b><span class="zb">${zz?esc(zz.nev):'hely nélkül'}</span>${c.geo==='telepules'?'<small class="muted">település szerint</small>':c.geo==='hiba'?'<small style="color:var(--bad)">a cím nem található</small>':''}${zz&&zz.dij?`<small class="muted">kiszállás: ${esc(zz.dij)}</small>`:''}</div>
      <div class="cside">${c.felulvizsgalat?`<span class="rev ${rs}">${icon('clock','ic','width:15px;height:15px;vertical-align:-2px')} Felülvizsgálat: ${esc(c.felulvizsgalat.replace(/-/g,'.'))}.</span>`:''}</div>
      <div class="cact">${c.telefon?`<a class="btn line sm" href="tel:${esc(c.telefon.replace(/[^\d+]/g,''))}" title="${esc(c.telefon)}">${icon('phone')}<span>Hívás</span></a>`:''}${addrOf(c)?`<a class="btn line sm" href="https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(C.meta.bolt.cim)}&destination=${encodeURIComponent(addrOf(c))}&travelmode=driving" target="_blank" rel="noopener">${icon('route')}<span>Útvonal</span></a>`:''}<button class="btn navy sm" type="button" data-edit-c="${esc(c.id)}">${icon('edit')}<span>Szerkesztés</span></button></div></article>`; }).join('')}</div>`:`<div class="empty">${icon('search','ic','width:40px;height:40px;color:var(--gold-d)')}<b>${C.list.length?'Nincs a szűrésnek megfelelő ügyfél.':'Még nincs ügyfél a listában.'}</b>${!C.list.length&&C.owner?'<p class="muted">Importálja a meglévő listát Excelből vagy CSV-ből, vagy vegyen fel ügyfelet kézzel.</p>':''}</div>`)}
  </div>`;
  let t; $('#cl-q').oninput=e=>{ clearTimeout(t); t=setTimeout(()=>{ C.q=e.target.value; renderClients(); const i=$('#cl-q'); i.focus(); i.setSelectionRange(i.value.length,i.value.length); },250); };
  $('#cl-sort').onchange=e=>{ C.sort=e.target.value; renderClients(); };
  $$('[data-z]').forEach(x=>x.onclick=()=>{ C.zone=+x.dataset.z; renderClients(); });
  $$('[data-v]').forEach(x=>x.onclick=()=>{ C.view=x.dataset.v; renderClients(); });
  $$('[data-sel]').forEach(x=>x.onchange=()=>{ x.checked?C.sel.add(x.dataset.sel):C.sel.delete(x.dataset.sel); renderClients(); });
  $$('[data-edit-c]').forEach(x=>x.onclick=()=>clientForm(C.list.find(c=>c.id===x.dataset.editC)));
  $$('[data-pt]').forEach(x=>x.addEventListener('click',()=>clientForm(C.list.find(c=>c.id===x.dataset.pt))));
  $('#cl-new').onclick=()=>clientForm(null);
  $('#cl-unsel')?.addEventListener('click',()=>{ C.sel.clear(); renderClients(); });
  $('#cl-route')?.addEventListener('click',openRoute);
  $('#cl-imp')?.addEventListener('click',importForm); $('#cl-zon')?.addEventListener('click',zoneForm);
  $('#cl-exp')?.addEventListener('click',exportClients); $('#cl-log')?.addEventListener('click',showClientLog);
}
function radarHTML(rows){
  const z=C.meta.zonak, maxKm=Math.max(5,...rows.map(r=>r.km||0).filter(k=>k<200))*1.08, R=300, cx=320, cy=320, b=C.meta.bolt;
  const kx=111.32*Math.cos(toRad(b.lat)), sc=R/maxKm;
  const rings=z.filter(x=>x.km!=null&&x.km<=maxKm).map(x=>`<circle cx="${cx}" cy="${cy}" r="${x.km*sc}" fill="${x.szin}" fill-opacity=".06" stroke="${x.szin}" stroke-opacity=".7" stroke-dasharray="4 4"/><text x="${cx+4}" y="${cy-x.km*sc+14}" class="rl" fill="${x.szin}">${esc(x.nev)} · ${x.km} km</text>`).reverse().join('');
  const pts=rows.filter(r=>r.km!=null).map(({c,z:zi})=>{ const x=cx+(c.lon-b.lon)*kx*sc, y=cy-(c.lat-b.lat)*110.57*sc; const col=z[zi]?.szin||'#9aa6b2';
    return `<g class="pt" data-pt="${esc(c.id)}" tabindex="0"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${C.sel.has(c.id)?8:6}" fill="${col}" stroke="#fff" stroke-width="2"/><title>${esc(c.nev)} – ${esc(c.varos||'')} (${fkm(kmFrom(c))})</title></g>`; }).join('');
  return `<div class="radar"><svg viewBox="0 0 640 640" role="img" aria-label="Ügyfelek elhelyezkedése az üzlethez képest">${rings}<line x1="${cx}" y1="14" x2="${cx}" y2="626" class="ax"/><line x1="14" y1="${cy}" x2="626" y2="${cy}" class="ax"/><text x="${cx+6}" y="26" class="rl">É</text>${pts}<g><rect x="${cx-9}" y="${cy-9}" width="18" height="18" rx="4" fill="#082746" stroke="#f4d58d" stroke-width="2"/><text x="${cx+14}" y="${cy+4}" class="rl" fill="#082746">Üzlet</text></g></svg>
   <p class="muted" style="font-size:.84rem">Az üzlet van középen, felül az észak. A pontra kattintva megnyílik az ügyfél adatlapja. A térkép csak itt, a böngészőben készül, az ügyfelek helye nem megy ki külső szolgáltatóhoz.</p></div>`;
}
function openRoute(){
  const b=C.meta.bolt; let left=C.list.filter(c=>C.sel.has(c.id)&&addrOf(c)), cur={lat:b.lat,lon:b.lon}, ord=[];
  while(left.length){ left.sort((p,q)=>{ const d=x=>x.lat==null?1e9:Math.hypot(x.lat-cur.lat,(x.lon-cur.lon)*Math.cos(toRad(cur.lat))); return d(p)-d(q); }); const n=left.shift(); ord.push(n); if(n.lat!=null) cur=n; }
  if(!ord.length){ toast('A kijelölt ügyfeleknek nincs címe.'); return; }
  if(ord.length>10){ toast('A Google Térkép egyszerre legfeljebb 10 megállót kezel, az első 10-et nyitom meg.'); ord=ord.slice(0,10); }
  const dest=ord.pop(), wp=ord.map(addrOf).join('|');
  const url=`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(b.cim)}&destination=${encodeURIComponent(addrOf(dest))}${wp?'&waypoints='+encodeURIComponent(wp):''}&travelmode=driving`;
  window.open(url,'_blank','noopener');
}
async function runGeocode(){
  if(C.geoRun) return; C.geoRun=true;
  try{ for(let guard=0;guard<400;guard++){
      const left=C.list.filter(c=>(c.geo||'nincs')==='nincs').length; if(!left) break;
      const g=$('#geoprog'); if(g) g.innerHTML=`<div class="msg info" style="font-weight:500">Címek helyének keresése az OpenStreetMap térképen: még ${left} cím van hátra. Ez címenként kb. 1 másodperc, nyugodtan dolgozhat közben.</div>`;
      const r=await api('geocode',{body:{}}); C.list=r.clients; C.meta=r.meta; if(r.elonezet||!r.kesz) break; if(ADMIN.tab==='ugyfelek') renderClients(); }
  }catch(e){ const g=$('#geoprog'); if(g) g.innerHTML=`<div class="msg err">${esc(e.message)}</div>`; }
  C.geoRun=false; if(ADMIN.tab==='ugyfelek') renderClients();
}
function cModal(html,w=720){ const m=$('#modal'), box=$('.box',m); box.style.maxWidth=w+'px'; box.innerHTML=`<button class="icbtn x" type="button" aria-label="Bezárás">${icon('x')}</button><div style="padding:24px;display:grid;gap:14px">${html}</div>`; m.classList.add('show'); m.setAttribute('aria-hidden','false'); showOverlay(closeModal); $('.x',box).onclick=closeModal; return box; }
function clientForm(c){
  const v=k=>esc(c?.[k]??''), f=(k,l,o='')=>`<label class="l">${l}<input class="i" id="cf-${k}" value="${v(k)}" ${o}></label>`;
  const box=cModal(`<span class="eyebrow">${c?'Ügyfél szerkesztése':'Új ügyfél'}</span><h2 class="it-title" style="font-size:1.5rem">${c?esc(c.nev):'Új ügyfél'}</h2>
   <form class="f" id="cform">${f('nev','Név / cégnév','required')}<div class="row2">${f('kapcsolattarto','Kapcsolattartó')}${f('telefon','Telefon','type="tel"')}</div><div class="row2">${f('email','E-mail','type="email"')}${f('adoszam','Adószám')}</div>
    <div class="row2"><div class="row2" style="grid-template-columns:110px 1fr">${f('irsz','Irsz.','inputmode="numeric"')}${f('varos','Település')}</div>${f('cim','Utca, házszám')}</div>
    <div class="row2">${f('gep','Pénztárgép típusa')}${f('ap','AP szám')}</div><div class="row2"><label class="l">Következő éves felülvizsgálat<input class="i" type="date" id="cf-felulvizsgalat" value="${v('felulvizsgalat')}"></label>${f('cimkek','Címkék <span class="o">vesszővel</span>')}</div>
    <label class="l">Megjegyzés<textarea class="i" id="cf-megjegyzes">${v('megjegyzes')}</textarea></label>
    <details class="faq" style="margin:0"><summary>Hely kézi pontosítása</summary><p>Ha a cím alapján rossz helyre kerül, írja be a koordinátát (Google Térképen jobb klikk a helyre → az első sor). ${c&&c.lat!=null?`Most: ${c.lat}, ${c.lon}`:''}</p><div class="row2" style="padding-bottom:14px">${f('lat','Szélesség (pl. 46.0786)','inputmode="decimal"')}${f('lon','Hosszúság (pl. 18.2318)','inputmode="decimal"')}</div></details>
    <div class="out"></div><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn gold" type="submit">Mentés</button>${c&&C.owner?`<button class="btn ghost" type="button" id="cf-del" style="color:var(--bad)">Törlés</button><span id="cf-delc"></span>`:''}</div></form>`);
  if(c){ $('#cf-lat').value=''; $('#cf-lon').value=''; }
  $('#cform').onsubmit=async e=>{ e.preventDefault(); const o={id:c?.id}; ['nev','kapcsolattarto','telefon','email','adoszam','irsz','varos','cim','gep','ap','felulvizsgalat','cimkek','megjegyzes'].forEach(k=>o[k]=$('#cf-'+k).value);
    const la=$('#cf-lat').value.replace(',','.'), lo=$('#cf-lon').value.replace(',','.'); if(la&&lo){ o.lat=+la; o.lon=+lo; o.geo='kezi'; }
    try{ const r=await api('client-save',{body:{c:o}}); const i=C.list.findIndex(x=>x.id===r.c.id); if(i>=0) C.list[i]=r.c; else C.list.push(r.c); closeModal(); toast('Mentve'); renderClients(); if(r.c.geo==='nincs') runGeocode(); }catch(err){ $('#cform .out').innerHTML=`<div class="msg err">${esc(err.message)}</div>`; } };
  $('#cf-del')?.addEventListener('click',()=>{ $('#cf-delc').innerHTML='<button class="btn sm" type="button" style="background:var(--bad);color:#fff">Igen, törlöm</button>'; $('#cf-delc button').onclick=async()=>{ try{ await api('client-del',{body:{id:c.id}}); C.list=C.list.filter(x=>x.id!==c.id); C.sel.delete(c.id); closeModal(); toast('Törölve'); renderClients(); }catch(err){ toast(err.message); } }; });
}
/* ---- importálás Excelből / CSV-ből: a fájlt a böngésző olvassa be, a szerverre csak a mezők mennek ---- */
const CF_LABELS={nev:'Név / cégnév',kapcsolattarto:'Kapcsolattartó',telefon:'Telefon',email:'E-mail',irsz:'Irányítószám',varos:'Település',cim:'Utca, házszám (vagy teljes cím)',adoszam:'Adószám',gep:'Pénztárgép típusa',ap:'AP szám',felulvizsgalat:'Felülvizsgálat dátuma',megjegyzes:'Megjegyzés',cimkek:'Címkék'};
const CF_SYN={nev:['név','nev','ügyfél','ugyfel','cégnév','cegnev','cég','ceg','vállalkozás','partner','megnevezés','vevő','vevo','üzlet','bolt'],kapcsolattarto:['kapcsolattartó','kapcsolattarto','ügyintéző','kontakt','tulajdonos'],telefon:['telefon','tel','mobil','telefonszám','telszám'],email:['e-mail','email','mail'],irsz:['irsz','irányítószám','iranyitoszam','ir.sz','isz'],varos:['város','varos','település','telepules','helység','helyseg'],cim:['cím','cim','utca','házszám','telephely','szállítási cím'],adoszam:['adószám','adoszam'],gep:['pénztárgép','penztargep','gép','gep','típus','tipus','gépszám'],ap:['ap','ap szám','apszám','ap-szám'],felulvizsgalat:['felülvizsgálat','felulvizsgalat','éves','esedékes','következő'],megjegyzes:['megjegyzés','megjegyzes','info','megj'],cimkek:['címke','cimke','csoport','kategória']};
const norm=t=>String(t||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
function guessMap(head){ const m={}; head.forEach((h,i)=>{ const n=norm(h); let best=null; for(const [k,syn] of Object.entries(CF_SYN)) for(const s of syn){ const ns=norm(s); if(n===ns||n.startsWith(ns+' ')||n.endsWith(' '+ns)||(ns.length>3&&n.includes(ns))){ if(!best||ns.length>best[1]) best=[k,ns.length]; } } if(best&&m[best[0]]==null) m[best[0]]=i; }); return m; }
function parseCSV(txt){ const sep=(txt.split('\n')[0].match(/;/g)||[]).length>=(txt.split('\n')[0].match(/,/g)||[]).length?';':','; const rows=[]; let row=[],cell='',q=false;
  for(let i=0;i<txt.length;i++){ const ch=txt[i]; if(q){ if(ch==='"'){ if(txt[i+1]==='"'){ cell+='"'; i++; } else q=false; } else cell+=ch; } else if(ch==='"') q=true; else if(ch===sep){ row.push(cell); cell=''; } else if(ch==='\n'){ row.push(cell.replace(/\r$/,'')); rows.push(row); row=[]; cell=''; } else cell+=ch; }
  if(cell||row.length){ row.push(cell); rows.push(row); } return rows.filter(r=>r.some(x=>String(x).trim())); }
function loadXLSX(){ return window.XLSX?Promise.resolve():new Promise((ok,no)=>{ const sc=document.createElement('script'); sc.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; sc.onload=ok; sc.onerror=()=>no(new Error('Az Excel-olvasó nem töltődött be. Mentse a táblázatot CSV-ként, és azt töltse fel.')); document.head.appendChild(sc); }); }
async function readTable(file){
  if(/\.xlsx?$|\.ods$/i.test(file.name)){ await loadXLSX(); const wb=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:true}); const sh=wb.Sheets[wb.SheetNames[0]]; return XLSX.utils.sheet_to_json(sh,{header:1,raw:false,dateNF:'yyyy-mm-dd',defval:''}).filter(r=>r.some(x=>String(x).trim())); }
  const buf=await file.arrayBuffer(); let txt; try{ txt=new TextDecoder('utf-8',{fatal:true}).decode(buf); }catch(e){ txt=new TextDecoder('windows-1250').decode(buf); }
  return parseCSV(txt.replace(/^﻿/,''));
}
function toDate(v){ v=String(v||'').trim(); let m=v.match(/^(\d{4})[.\-\/ ]+(\d{1,2})[.\-\/ ]+(\d{1,2})/); if(m) return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`; m=v.match(/^(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})/); if(m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`; return ''; }
function rowToClient(r,map){ const g=k=>map[k]!=null&&map[k]!==''?String(r[map[k]]??'').trim():''; const c={}; Object.keys(CF_LABELS).forEach(k=>c[k]=g(k));
  if(!c.irsz&&!c.varos&&c.cim){ const m=c.cim.match(/^(\d{4})\s+([^,]+),\s*(.+)$/); if(m){ c.irsz=m[1]; c.varos=m[2].trim(); c.cim=m[3].trim(); } }
  if(c.irsz&&!c.varos){ const m=c.irsz.match(/^(\d{4})\s+(.+)$/); if(m){ c.irsz=m[1]; c.varos=m[2]; } }
  c.felulvizsgalat=toDate(c.felulvizsgalat); return c; }
function importForm(){
  const box=cModal(`<span class="eyebrow">Ügyféllista importálása</span><h2 class="it-title" style="font-size:1.5rem">Excel vagy CSV fájlból</h2>
   <p class="muted">A fájlt a böngészője olvassa be, és csak a kiválasztott oszlopok kerülnek fel a szerverre, ott titkosítva tárolódnak. A címekből a rendszer kiszámolja a távolságot és a zónát.</p>
   <input type="file" id="imp-file" accept=".xlsx,.xls,.ods,.csv,.txt"><div id="imp-body"></div>`,880);
  $('#imp-file').onchange=async e=>{ const file=e.target.files[0]; if(!file) return; const out=$('#imp-body'); out.innerHTML='<p class="muted">Beolvasás…</p>';
    try{ const rows=await readTable(file); if(rows.length<2) throw new Error('A fájlban nem találtam adatsort.');
      const head=rows[0].map(String), data=rows.slice(1), map=guessMap(head);
      const sel=k=>`<select class="i" data-map="${k}"><option value="">– nincs –</option>${head.map((h,i)=>`<option value="${i}" ${map[k]===i?'selected':''}>${esc(h||('Oszlop '+(i+1)))}</option>`).join('')}</select>`;
      out.innerHTML=`<div class="msg info" style="font-weight:500">${data.length} sort találtam. Ellenőrizze, melyik oszlop mit tartalmaz (amit felismertem, előre beállítottam).</div>
       <div class="mapgrid">${Object.entries(CF_LABELS).map(([k,l])=>`<label class="l">${l}${sel(k)}</label>`).join('')}</div>
       <div id="imp-prev"></div>
       <div class="radios"><label><input type="radio" name="imp-mode" value="hozza" checked> Hozzáadás a meglévő ügyfelekhez</label><label><input type="radio" name="imp-mode" value="csere"> A teljes lista cseréje (a mostani ${C.list.length} ügyfél törlődik)</label></div>
       <div class="out"></div><button class="btn gold" type="button" id="imp-go">Importálás</button>`;
      const cur=()=>{ const m={}; $$('[data-map]',out).forEach(s=>{ if(s.value!=='') m[s.dataset.map]=+s.value; }); return m; };
      const prev=()=>{ const m=cur(), p=data.slice(0,4).map(r=>rowToClient(r,m)); $('#imp-prev').innerHTML=`<div class="tablewrap" style="margin-top:6px"><table class="ptable"><thead><tr><th>Név</th><th>Település</th><th>Cím</th><th>Telefon</th><th>Gép</th></tr></thead><tbody>${p.map(c=>`<tr><td>${esc(c.nev)}</td><td>${esc([c.irsz,c.varos].filter(Boolean).join(' '))}</td><td>${esc(c.cim)}</td><td>${esc(c.telefon)}</td><td>${esc(c.gep)}</td></tr>`).join('')}</tbody></table></div><p class="muted" style="font-size:.82rem">Az első ${p.length} sor előnézete.</p>`; };
      $$('[data-map]',out).forEach(s=>s.onchange=prev); prev();
      $('#imp-go').onclick=async()=>{ const m=cur(); if(m.nev==null){ $('.out',out).innerHTML='<div class="msg err">Jelölje ki, melyik oszlopban van az ügyfél neve.</div>'; return; }
        const mode=$('input[name=imp-mode]:checked').value; const list=data.map(r=>rowToClient(r,m)).filter(c=>c.nev);
        try{ const r=await api('clients-import',{body:{rows:list,mode}}); closeModal(); toast(`${r.db} ügyfél importálva`); await admClients(); }catch(err){ $('.out',out).innerHTML=`<div class="msg err">${esc(err.message)}</div>`; } };
    }catch(err){ out.innerHTML=`<div class="msg err">${esc(err.message)}</div>`; } };
}
function zoneForm(){
  const z=structuredClone(C.meta.zonak), b=C.meta.bolt;
  const row=(x,i)=>`<div class="zrow"><input type="color" class="zcol" value="${esc(x.szin)}" aria-label="Szín"><input class="i" value="${esc(x.nev)}" data-zn aria-label="Zóna neve"><input class="i num" value="${x.km??''}" data-zk inputmode="decimal" placeholder="nincs határ" aria-label="Felső határ km"><span class="muted">km-ig</span><input class="i" value="${esc(x.dij||'')}" data-zd placeholder="kiszállási díj (nem kötelező)" aria-label="Kiszállási díj"><button class="icbtn" type="button" data-zdel="${i}" aria-label="Zóna törlése">${icon('x')}</button></div>`;
  const box=cModal(`<span class="eyebrow">Beállítások</span><h2 class="it-title" style="font-size:1.5rem">Zónák és az üzlet helye</h2>
   <p class="muted">A zónák az üzlettől mért légvonalbeli távolság szerint sorolják be az ügyfeleket. Az utolsó zóna felső határa maradhat üresen (minden, ami ennél messzebb van).</p>
   <div id="zlist">${z.map(row).join('')}</div><button class="btn line sm" type="button" id="zadd" style="justify-self:start">${icon('plus')} Új zóna</button>
   <div class="row2"><label class="l">Üzlet címe<input class="i" id="b-cim" value="${esc(b.cim)}"></label><div class="row2"><label class="l">Szélesség<input class="i num" id="b-lat" value="${b.lat}"></label><label class="l">Hosszúság<input class="i num" id="b-lon" value="${b.lon}"></label></div></div>
   <p class="muted" style="font-size:.84rem">${b.ellenorzott?'Az üzlet helye be van állítva.':'Az üzlet helyét a rendszer az első címkereséskor magától pontosítja.'} Kézi pontosítás: Google Térképen jobb klikk az üzletre, az első sor a két szám.</p>
   <div class="out"></div><button class="btn gold" type="button" id="zsave" style="justify-self:start">Mentés</button>`,820);
  const bind=()=>{ $$('[data-zdel]',box).forEach(x=>x.onclick=()=>{ x.closest('.zrow').remove(); }); };
  bind(); $('#zadd').onclick=()=>{ $('#zlist').insertAdjacentHTML('beforeend',row({nev:'Új zóna',km:'',szin:'#6b46c1',dij:''},99)); bind(); };
  $('#zsave').onclick=async()=>{ const zonak=$$('.zrow',box).map(r=>({nev:$('[data-zn]',r).value,km:$('[data-zk]',r).value.trim()===''?null:+$('[data-zk]',r).value.replace(',','.'),szin:$('.zcol',r).value,dij:$('[data-zd]',r).value})).sort((a,b)=>(a.km??1e9)-(b.km??1e9));
    const bolt={cim:$('#b-cim').value,lat:+$('#b-lat').value.replace(',','.'),lon:+$('#b-lon').value.replace(',','.')};
    try{ await api('clients-meta',{body:{zonak,bolt}}); closeModal(); toast('Zónák mentve'); await admClients(); }catch(err){ $('.out',box).innerHTML=`<div class="msg err">${esc(err.message)}</div>`; } };
}
async function exportClients(){
  try{ const r=await api('clients-export',{body:{}}); const cols=Object.keys(CF_LABELS), q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
    const csv='﻿'+[[...cols.map(k=>CF_LABELS[k]),'Távolság (km)','Zóna'].map(q).join(';'),...r.clients.map(c=>{ const km=kmFrom(c), zi=zoneIdx(km); return [...cols.map(k=>c[k]),km==null?'':km.toFixed(1).replace('.',','),C.meta.zonak[zi]?.nev||''].map(q).join(';'); })].join('\r\n');
    const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})); a.download='ugyfelek-'+new Date().toISOString().slice(0,10)+'.csv'; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },500);
    toast('Exportálva – a fájlt tárolja biztonságos helyen'); }catch(err){ toast(err.message); }
}
async function showClientLog(){ try{ const l=await api('clients-log'); cModal(`<span class="eyebrow">Biztonság</span><h2 class="it-title" style="font-size:1.5rem">Ügyféllista napló</h2><p class="muted">Ki, mikor nyitotta meg, módosította, importálta vagy exportálta a listát.</p><div class="tablewrap"><table class="ptable"><thead><tr><th>Időpont</th><th>Ki</th><th>Mit</th></tr></thead><tbody>${l.slice(0,100).map(x=>`<tr><td class="num" data-l="Időpont">${esc(new Date(x.ido).toLocaleString('hu-HU'))}</td><td data-l="Ki"><b>${esc(x.nev)}</b><br><small class="muted num">${esc(x.ip)}</small></td><td data-l="Mit">${esc(x.mit)}</td></tr>`).join('')}</tbody></table></div>`,820); }catch(err){ toast(err.message); } }



(function(){
  if(typeof bindAdmin!=='function') return;
  var LSK='ptg-sugo-rejtve';
  function rd(){ try{ return JSON.parse(localStorage.getItem(LSK)||'{}')||{}; }catch(e){ return {}; } }
  function wr(o){ try{ localStorage.setItem(LSK,JSON.stringify(o)); }catch(e){} }
  function h(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

  /* --- menüpontok rövid leírása --- */
  var DESC={attekintes:'Mi a teendő ma?',termekek:'Ár, készlet, fotó',rendelesek:'Vásárlók üzenetei',ugyfelek:'Ügyfélnyilvántartás',szolgaltatasok:'Szerviz árai',gyik:'Kérdések a termékoldalon',feladatok:'Teendők a weboldallal',beallitasok:'Nyitvatartás, szabadság',felhasznalok:'Ki léphet be?',biztonsag:'Jelszó, belépések'};

  /* --- oldalankénti segítség --- */
  var TAB={
    attekintes:{t:'Ez a kezdőlap',p:'Egy pillantással látja, van-e új rendelés, és mi igényel figyelmet.',l:['Koppintson egy számos dobozra, és a hozzá tartozó listára jut.','A „Figyelmet igényel” részben a fogyóban lévő vagy fotó nélküli termékek vannak. Koppintson rájuk a javításhoz.','Ha elakad, nyomja meg fent a sárga <b>Súgó</b> gombot.']},
    termekek:{t:'Itt módosíthatja a termékeket',p:'Árat, készletet és láthatóságot közvetlenül a kártyán állíthat. Szöveghez és fotóhoz nyomja meg a <b>Szerkesztés</b> gombot.',l:['Keresse meg a terméket: írja be a nevét a keresőbe, vagy válasszon kategóriát.','Írja át az árat vagy a darabszámot. A <b>+</b> és <b>−</b> gombbal is állíthatja.','Végül nyomja meg alul a sárga <b>Mentés</b> gombot. Csak ezután változik meg az oldal.']},
    rendelesek:{t:'Ide érkeznek a vásárlók üzenetei',p:'Megrendelések, ajánlatkérések, szervizbejelentések és üzenetek a webáruházból.',l:['Az <b>Új</b> fülön azok vannak, amelyekkel még senki nem foglalkozott.','Hívja fel vagy írjon a vásárlónak a <b>Hívás</b> vagy az <b>E-mail</b> gombbal.','Állítsa át az állapotot: <b>Visszaigazolva</b> (a vásárló ekkor automatikusan e-mailt kap), majd <b>Kész</b>, ha átadta.']},
    ugyfelek:{t:'A cég ügyfélnyilvántartása',p:'Bizalmas adatok: csak munkához használja, és ne adja tovább.',l:['Keressen névre, településre, telefonszámra vagy AP-számra.','Az <b>Új ügyfél</b> gombbal vehet fel új ügyfelet. Egy ügyfélre koppintva módosíthatja az adatait.','Több ügyfelet kijelölve útvonalat tervezhet a Google Térképen.']},
    szolgaltatasok:{t:'A szerviz díjai',p:'Ezek az árak jelennek meg a Szerviz oldalon.',l:['Írja be a díjat nettó forintban, ÁFA nélkül.','Ha üresen hagyja, a vásárló „ár kérésre” szöveget lát.','Végül nyomja meg alul a <b>Mentés</b> gombot.']},
    feladatok:{t:'Feladatok és észrevételek',p:'Ide írhatja, mit kell javítani vagy módosítani a weboldalon. Mindenki látja, aki belép.',l:['Írja be röviden a feladatot, és nyomja meg az <b>Elküldés</b> gombot. A dátum és a neve magától hozzákerül.','Ha egy feladat elkészült, nyomja meg mellette a <b>Teljesítve</b> gombot.','A kész feladatokat a <b>Teljesített kérések</b> fülön találja.']},
    gyik:{t:'Gyakori kérdések',p:'Ezek a kérdések és válaszok a termékoldalak alján jelennek meg, kategóriánként.',l:['Minden sor egy kérdés és a rá adott válasz.','A kérdést és a választ függőleges vonal választja el. Például: <b>Mennyi a garancia? | 1 év.</b>','Végül nyomja meg alul a <b>Mentés</b> gombot.']},
    beallitasok:{t:'Nyitvatartás és cégadatok',p:'A főoldal ebből mutatja, hogy az üzlet éppen nyitva van-e.',l:['Pipálja be a nyitvatartási napokat, és írja be a nyitás és a zárás idejét.','Szabadsághoz lent válassza ki a naptárból az első és az utolsó zárva napot, és nyomja meg a <b>Hozzáadás</b> gombot.','Végül nyomja meg alul a <b>Mentés</b> gombot.']},
    felhasznalok:{t:'Ki léphet be az adminba?',p:'Itt adhat hozzáférést egy munkatársnak, vagy állíthatja vissza valaki jelszavát.',l:['Új munkatárs: írja be a nevét, a telefonszámát és az e-mail címét, majd adja meg a hozzáférést.','A munkatárs e-mailben kap egy kódot, ezzel állít be magának jelszót.','Ha valaki elfelejtette a jelszavát, nyomja meg a <b>Jelszó visszaállítása</b> gombot.']},
    biztonsag:{t:'A belépés védelme',p:'A saját jelszavát és a belépés biztonságát kezelheti itt.',l:['Jelszót itt módosíthat. Legalább 10 karakter legyen.','Javasolt bekapcsolni a telefonos kódot is, tartaléknak.','Az utolsó belépések listájában ellenőrizheti, hogy csak Önök léptek-e be.']}
  };

  /* --- „Hogyan…?” súgó --- */
  var HOW=[
    {ic:'tag',q:'Árat szeretnék módosítani',tab:'termekek',sel:'.pc2:not([hidden]) [data-f="ar"]',l:['Nyissa meg a <b>Termékek</b> oldalt.','Keresse meg a terméket a keresővel.','Írja át az <b>Ár (nettó)</b> mezőt. ÁFA nélküli árat írjon, a vásárló az ÁFÁ-val növelt árat látja.','Nyomja meg alul a sárga <b>Mentés</b> gombot.']},
    {ic:'box',q:'Készletet (darabszámot) szeretnék módosítani',tab:'termekek',sel:'.pc2:not([hidden]) .step',l:['Nyissa meg a <b>Termékek</b> oldalt.','A <b>Készlet</b> résznél a <b>+</b> és <b>−</b> gombbal állítsa be a darabszámot.','0 = elfogyott. Ha a mezőt üresen hagyja, „rendelésre” jelenik meg.','Nyomja meg a <b>Mentés</b> gombot.']},
    {ic:'star',q:'Akciót szeretnék indítani',tab:'termekek',sel:'.pc2:not([hidden]) [data-f="akciosAr"]',l:['A terméknél írja be az új, alacsonyabb árat az <b>Akciós ár</b> mezőbe.','Nyomja meg a <b>Mentés</b> gombot.','Az akció végén törölje ki az akciós árat, és mentsen újra.']},
    {ic:'eye',q:'Terméket szeretnék elrejteni vagy újra megjeleníteni',tab:'termekek',sel:'.pc2:not([hidden]) [data-f="lathato"]',l:['A terméknél kapcsolja ki a <b>Látható</b> kapcsolót. A termék nem törlődik, csak a vásárlók nem látják.','Ha újra meg akarja jeleníteni, kapcsolja vissza.','Nyomja meg a <b>Mentés</b> gombot.']},
    {ic:'plus',q:'Új terméket szeretnék feltenni',tab:'termekek',sel:'#newp',l:['A <b>Termékek</b> oldalon nyomja meg a sárga <b>+</b> (Új termék) gombot.','Töltse ki a nevet, az árat és a leírást, és töltsön fel fotót.','Nyomja meg a <b>Módosítások átvétele</b>, majd alul a <b>Mentés</b> gombot.'],tip:'Elég a legfontosabbakat kitölteni. A ritkán kellő mezők a „További beállítások” alatt vannak.'},
    {ic:'photo',q:'Fotót szeretnék feltenni vagy cserélni',tab:'termekek',sel:'.pc2:not([hidden]) [data-edit]',l:['A terméknél nyomja meg a <b>Szerkesztés</b> gombot.','A <b>Fotók</b> résznél válassza ki a képeket a telefonról vagy a gépről.','Az első kép lesz a főkép. A nyilakkal változtathat a sorrenden.','Nyomja meg a <b>Módosítások átvétele</b>, majd a <b>Mentés</b> gombot.']},
    {ic:'bell',q:'Új rendelést szeretnék kezelni',tab:'rendelesek',sel:'.chips',l:['Nyissa meg a <b>Rendelések</b> oldalt. A piros szám mutatja az új rendeléseket.','Hívja fel vagy írjon a vásárlónak.','Nyomja meg a <b>Visszaigazolva</b> gombot. A vásárló ekkor automatikusan e-mailt kap.','Átadás után nyomja meg a <b>Kész</b> gombot.']},
    {ic:'clock',q:'Szabadságot vagy ünnepi zárva tartást állítanék be',tab:'beallitasok',sel:'.zv-add',l:['Nyissa meg a <b>Cégadatok, nyitvatartás</b> oldalt.','A <b>Szabadság, rendkívüli zárva tartás</b> résznél koppintson az <b>Első zárva nap</b> mezőre, és válassza ki a napot a naptárból.','Az <b>Utolsó zárva nap</b> mezőben válassza ki, meddig tart a szabadság. Ha csak egy napról van szó, hagyja üresen.','Nyomja meg a <b>Hozzáadás</b>, majd alul a sárga <b>Mentés</b> gombot.'],tip:'A magyar ünnepnapokon az oldal magától zárva mutatja az üzletet, ezeket nem kell beírni. Szabadság után a régi bejegyzést a Törlés gombbal eltávolíthatja.'},
    {ic:'mail',q:'Hova érkeznek a vásárlók levelei és a rendelések?',tab:'beallitasok',sel:'#ertesites-box',own:true,l:['Nyissa meg a <b>Cégadatok, nyitvatartás</b> oldalt, és görgessen az aljára.','Az <b>Értesítési e-mail cím</b> mezőbe írja be, hova kéri a leveleket, majd nyomja meg a <b>Mentés</b> gombot.','Nyomja meg a <b>Próbalevél</b> gombot, és nézze meg, megérkezett-e (a Spam mappát is).'],tip:'Ez a cím a weboldalon sehol nem látszik. A látogatók az E-mail küldése gombbal írnak, a levél ide érkezik.'},
    {ic:'clock',q:'Módosítanám a nyitvatartást',tab:'beallitasok',sel:'.ptable',l:['Nyissa meg a <b>Cégadatok, nyitvatartás</b> oldalt.','Pipálja be a nyitvatartási napokat, és írja be a nyitás és a zárás idejét.','Nyomja meg a <b>Mentés</b> gombot.']},
    {ic:'wrench',q:'Szervizdíjat szeretnék módosítani',tab:'szolgaltatasok',sel:'.ptable',l:['Nyissa meg a <b>Szerviz díjak</b> oldalt.','Írja át a díjat nettó forintban.','Nyomja meg a <b>Mentés</b> gombot.']},
    {ic:'users',q:'Munkatársnak adnék belépést',tab:'felhasznalok',own:1,sel:'#uadd',l:['Nyissa meg a <b>Felhasználók</b> oldalt.','Az <b>Új admin hozzáférés</b> résznél írja be a munkatárs nevét, telefonszámát és e-mail címét.','A munkatárs e-mailt kap, és az első belépéskor beállítja a jelszavát.']},
    {ic:'alert',q:'Elrontottam valamit, mit tegyek?',l:['Ha még nem nyomta meg a <b>Mentés</b> gombot, nyomja meg alul az <b>Elvetés</b> gombot. Minden visszaáll.','Ha már mentett, írja vissza a régi értéket, és mentsen újra.','Nagyobb hiba esetén szóljon a tulajdonosnak: a weboldalról rendszeresen készül biztonsági mentés.']}
  ];

  /* --- mezők melletti magyarázatok --- */
  var TIP={
    'Ár (nettó)':'ÁFA nélküli ár forintban. A vásárló az ÁFÁ-val növelt (bruttó) árat látja. Ha üresen hagyja, „ár kérésre” jelenik meg.',
    'Akciós ár':'Ha ide alacsonyabb árat ír, a termék akciósként jelenik meg. Az akció végén törölje ki.',
    'Készlet':'Hány darab van az üzletben. <b>0</b> = elfogyott. Ha üresen hagyja, „rendelésre” jelenik meg.',
    'Kiemelt':'A kiemelt termékek előre kerülnek, és „Kiemelt termék” jelölést kapnak.',
    'Látható':'Ha kikapcsolja, a vásárlók nem látják a terméket. Nem törlődik, bármikor visszakapcsolhatja.',
    'Használt':'Bekapcsolva a termék a „Használt termékek” közé kerül.',
    'Márka':'A gyártó neve, pl. <b>Sam4s</b> vagy <b>Micra</b>.',
    'Típus / név':'A termék típusa, pl. <b>NR-330</b>. A márkával együtt ez lesz a termék neve.',
    'Kategória':'Melyik menüpont alatt jelenjen meg a termék.',
    'Rövid alcím':'Egy rövid mondat a név alatt, pl. „Hordozható, 4G-s online pénztárgép”.',
    'Nettó ár (Ft)':'ÁFA nélküli ár. Ha üresen hagyja, „ár kérésre” jelenik meg.',
    'Akciós nettó ár (Ft)':'Akció idejére írja be az alacsonyabb árat. Az akció végén törölje ki.',
    'Készlet (db)':'Hány darab van raktáron. 0 = elfogyott, üresen = rendelésre.',
    'Garancia':'Pl. <b>1 év</b> vagy <b>6 hónap</b>.',
    'NAV-engedélyszám':'Csak pénztárgépnél: a NAV forgalmazási engedély száma. Más terméknél hagyja üresen.',
    'Leírás':'Néhány mondat a termékről, a vásárlónak szólva.',
    'Jellemzők':'A legfontosabb tulajdonságok, <b>minden sorba egy</b>. Pipával jelennek meg a termékoldalon.',
    'Műszaki adatok':'Minden sorba egy adat, kettősponttal. Pl.: <b>Nyomtató: 57 mm</b>',
    'Letöltések':'Minden sorba: név | link. Pl.: <b>Kezelési útmutató | https://…/utmutato.pdf</b>',
    'Bemutató videó linkje':'Ha van YouTube-videó a termékről, ide másolja a linkjét.',
    '3D modell formája':'Ha még nincs valódi fotó, ez a forgatható ábra jelenik meg. Válassza a termékhez leginkább hasonlót.',
    'Fotók':'Az első kép lesz a főkép. A nyilakkal rendezheti, az X-szel törölheti a képeket.',
    'Szabadság, rendkívüli zárva tartás':'Ezeken a napokon a főoldal „Zárva” jelzést mutat, és kiírja, mikor nyit újra az üzlet. Az ünnepnapokat nem kell beírni.',
    'ÁFA kulcs (%)':'Általában <b>27</b>. Csak jogszabályváltozáskor kell módosítani.',
    'E-mail (ide jönnek a megrendelések)':'Erre a címre érkezik értesítés minden új rendelésről.',
    'Mobilszámok':'Több számot vesszővel válasszon el.',
    'Kód a telefonról':'A telefonos hitelesítő alkalmazásban látható 6 jegyű szám.'
  };

  /* --- buborék a kérdőjelekhez --- */
  var pop=null, popBtn=null;
  function closePop(){ if(pop){ pop.remove(); pop=null; } if(popBtn){ popBtn.setAttribute('aria-expanded','false'); popBtn=null; } }
  function openPop(btn){
    if(popBtn===btn){ closePop(); return; } closePop();
    pop=document.createElement('div'); pop.className='sg-pop'; pop.setAttribute('role','tooltip'); pop.setAttribute('data-noi18n','');
    pop.innerHTML=TIP[btn.dataset.sgk]||''; document.body.appendChild(pop); popBtn=btn; btn.setAttribute('aria-expanded','true');
    var r=btn.getBoundingClientRect(), w=pop.offsetWidth, ph=pop.offsetHeight, x=Math.max(12,Math.min(innerWidth-w-12,r.left+r.width/2-30)), y=r.bottom+10;
    if(y+ph>innerHeight-10){ y=r.top-ph-10; pop.classList.add('up'); }
    pop.style.left=x+'px'; pop.style.top=y+'px'; pop.style.setProperty('--ax',Math.max(10,Math.min(w-24,r.left+r.width/2-x-7))+'px');
  }
  document.addEventListener('click',function(e){ var b=e.target.closest&&e.target.closest('.sg-i'); if(b){ e.preventDefault(); e.stopPropagation(); openPop(b); return; } if(pop&&!e.target.closest('.sg-pop')) closePop(); },true);
  addEventListener('scroll',function(){ if(pop) closePop(); },{passive:true});
  document.addEventListener('keydown',function(e){ if(e.key==='Escape'){ closePop(); closePanel(); } });

  function firstText(el){ for(var n=el.firstChild;n;n=n.nextSibling){ if(n.nodeType===3&&n.nodeValue.trim()) return n; if(n.nodeType===1&&n.tagName==='SPAN'&&!n.className&&n.textContent.trim()&&!n.querySelector('input')) return n; } return null; }
  function addTips(root){
    root.querySelectorAll('label.l, div.l, .fld, label.sw, .editor h3, th').forEach(function(el){
      if(el.dataset.sgdone) return; el.dataset.sgdone='1';
      var tn, key;
      if(el.matches('label.sw')){ tn=el.querySelector('span'); key=tn&&tn.textContent.trim(); }
      else if(el.matches('.fld')){ tn=el.querySelector(':scope>span'); key=tn&&tn.textContent.trim(); }
      else { tn=firstText(el); key=tn&&(tn.nodeValue!=null?tn.nodeValue:tn.textContent).trim(); }
      if(!key||!TIP[key]) return;
      var b=document.createElement('button'); b.type='button'; b.className='sg-i'; b.dataset.sgk=key; b.textContent='?'; b.setAttribute('aria-label','Mit jelent: '+key); b.setAttribute('aria-expanded','false');
      if(tn.nodeType===3){ var w=document.createElement('span'); w.className='sg-lt'; tn.parentNode.insertBefore(w,tn); w.appendChild(tn); w.appendChild(b); } else tn.appendChild(b);
    });
  }

  /* --- termékszerkesztő: ritkán kellő mezők egy lenyitható részbe --- */
  function groupEditor(){
    var f=document.getElementById('edform'); if(!f||f.querySelector('.sg-adv')) return;
    var pick=['#e-modell','#e-eng','#e-dl','#e-video','#up-spin'].map(function(s){ var i=f.querySelector(s); return i&&i.closest('.l'); }).filter(Boolean);
    if(!pick.length) return;
    var d=document.createElement('details'); d.className='sg-adv'; d.innerHTML='<summary><span>További beállítások<br><small>3D ábra, NAV-engedélyszám, letöltések, videó, 360°-os fotók – ritkán kell</small></span></summary><div class="sg-advin"></div>';
    var box=d.querySelector('.sg-advin'), out=f.querySelector('.out');
    pick.forEach(function(el){ var row=el.parentElement; box.appendChild(el); if(row&&row.classList.contains('row2')&&row.children.length===1) row.style.gridTemplateColumns='1fr'; });
    f.insertBefore(d,out||null);
  }

  /* --- súgó panel --- */
  var panel=null;
  function closePanel(){ if(panel&&!panel.hidden){ panel.hidden=true; var b=document.querySelector('.sg-help'); if(b) b.focus(); } }
  function openPanel(){
    if(!panel){ panel=document.createElement('div'); panel.className='sg-panel'; panel.setAttribute('data-noi18n',''); panel.hidden=true; document.body.appendChild(panel); }
    var own=(typeof ADMIN!=='undefined')&&ADMIN.me&&ADMIN.me.szerep==='tulajdonos';
    panel.innerHTML='<div class="bg" data-sgx></div><div class="box" role="dialog" aria-modal="true" aria-labelledby="sg-h"><div class="top"><div style="flex:1"><h2 id="sg-h">Súgó</h2><small>Válassza ki, mit szeretne csinálni</small></div><button class="x" type="button" data-sgx aria-label="Súgó bezárása">×</button></div><div class="in">'
      +'<div class="alap"><b>A legfontosabb szabály:</b> amit módosít, az csak akkor kerül ki a weboldalra, ha alul megnyomja a sárga <b>Mentés</b> gombot. Ha meggondolta magát, nyomja meg az <b>Elvetés</b> gombot.</div>'
      +HOW.filter(function(x){ return !x.own||own; }).map(function(x,i){ return '<details><summary><span class="e">'+(typeof icon==='function'?icon(x.ic):'')+'</span>'+h(x.q)+'</summary><div class="lp"><ol>'+x.l.map(function(s){return '<li>'+s+'</li>';}).join('')+'</ol>'+(x.tip?'<p class="tip">'+x.tip+'</p>':'')+(x.tab?'<button class="go" type="button" data-sggo="'+i+'">Mutasd meg →</button>':'')+'</div></details>'; }).join('')
      +'<p class="end">A mezők melletti <b style="color:#f4d58d">?</b> jelre koppintva megtudja, mit kell oda írni.</p></div></div>';
    var list=HOW.filter(function(x){ return !x.own||own; });
    panel.querySelectorAll('[data-sgx]').forEach(function(x){ x.onclick=closePanel; });
    panel.querySelectorAll('details').forEach(function(d){ d.addEventListener('toggle',function(){ if(d.open) panel.querySelectorAll('details').forEach(function(o){ if(o!==d) o.open=false; }); }); });
    panel.querySelectorAll('[data-sggo]').forEach(function(b){ b.onclick=function(){ goTo(list[+b.dataset.sggo]); }; });
    panel.hidden=false; panel.querySelector('.x').focus();
  }
  function goTo(x){
    closePanel(); if(!x.tab) return;
    if(ADMIN.tab!==x.tab){ ADMIN.tab=x.tab; ADMIN.edit=null; if(x.tab==='termekek'){ ADMIN.pf='all'; } renderAdmin(); }
    var tries=0; (function seek(){ var el=x.sel&&document.querySelector('.adm2 '+x.sel); if(!el&&tries++<15){ setTimeout(seek,150); return; } if(!el) return;
      el.scrollIntoView({behavior:'smooth',block:'center'}); el.classList.remove('sg-glow'); void el.offsetWidth; el.classList.add('sg-glow'); setTimeout(function(){ el.classList.remove('sg-glow'); },3600); })();
  }

  /* --- az oldal kiegészítése minden megjelenítés után --- */
  function enhance(){
    var root=document.querySelector('.adm2'); if(!root) return;
    root.setAttribute('data-noi18n','');
    var hd=root.querySelector('.ahead .wrap');
    if(hd&&!hd.querySelector('.sg-help')){ var hb=document.createElement('button'); hb.type='button'; hb.className='ibtn sg-help'; hb.setAttribute('aria-label','Súgó'); hb.innerHTML='<b>?</b><span>Súgó</span>'; hb.onclick=openPanel; var lo=hd.querySelector('a.ibtn')||hd.querySelector('#logout'); hd.insertBefore(hb,lo); }
    root.querySelectorAll('.aside [data-tab], .asheet [data-tab]').forEach(function(b){ if(b.querySelector('.sg-d')||!DESC[b.dataset.tab]) return; var s=b.querySelector('span'); if(!s) return; var d=document.createElement('small'); d.className='sg-d'; d.textContent=DESC[b.dataset.tab]; s.appendChild(d); });
    var sb=root.querySelector('#savebar .sbtxt>span:last-child'); if(sb&&!sb.dataset.sg){ sb.dataset.sg='1'; sb.innerHTML='Van el nem mentett módosítás<small>Nyomja meg a Mentés gombot, hogy kikerüljön az oldalra.</small>'; }
    var tab=ADMIN.tab||'attekintes', main=root.querySelector('.amain'), tt=root.querySelector('.atitle'), c=TAB[tab];
    if(main&&tt&&c&&!main.querySelector('.sg-card,.sg-mini')){
      var hid=rd()[tab];
      if(hid){ var m=document.createElement('button'); m.type='button'; m.className='sg-mini'; m.innerHTML='<b>?</b>Segítség'; m.onclick=function(){ var o=rd(); delete o[tab]; wr(o); m.remove(); enhance(); }; tt.appendChild(m); }
      else { var card=document.createElement('section'); card.className='sg-card'; card.setAttribute('aria-label','Segítség ehhez az oldalhoz');
        card.innerHTML='<span class="sg-q-ic" aria-hidden="true">?</span><h3>'+c.t+'</h3><p>'+c.p+'</p><ol>'+c.l.map(function(s){return '<li>'+s+'</li>';}).join('')+'</ol><div class="sg-act"><button type="button" class="sg-btn" data-sghide>Értem, elrejtem</button><button type="button" class="sg-btn g" data-sgall>Súgó: hogyan csináljam?</button></div>';
        card.querySelector('[data-sghide]').onclick=function(){ var o=rd(); o[tab]=1; wr(o); card.remove(); enhance(); };
        card.querySelector('[data-sgall]').onclick=openPanel;
        tt.insertAdjacentElement('afterend',card); }
    }
    if(tab==='attekintes'&&main&&!main.querySelector('.sg-hello')){
      var nm=((ADMIN.me&&ADMIN.me.nev)||'').replace(/^Ifj\.\s*/,'').trim().split(/\s+/).pop()||'';
      var hr=new Date().getHours(), ksz=hr<10?'Jó reggelt':hr<18?'Jó napot':'Jó estét';
      var hl=document.createElement('div'); hl.className='sg-hello'; hl.innerHTML='<div><b>'+ksz+(nm?', '+h(nm):'')+'!</b><span>Mit szeretne csinálni? Válasszon lent egy gombot, vagy nyissa meg a Súgót.</span></div><button type="button" class="sg-btn g">? Súgó</button>';
      hl.querySelector('button').onclick=openPanel;
      tt.insertAdjacentElement('afterend',hl);
    }
    addTips(root); groupEditor();
  }

  var orig=bindAdmin;
  bindAdmin=function(){ var r=orig.apply(this,arguments); try{ enhance(); }catch(e){} return r; };
  var app=document.getElementById('app'), busy=false;
  if(app&&window.MutationObserver) new MutationObserver(function(){ if(busy) return; busy=true; requestAnimationFrame(function(){ try{ if(document.querySelector('.adm2')) enhance(); }catch(e){} busy=false; }); }).observe(app,{childList:true,subtree:true});
  addEventListener('beforeunload',function(e){ if((typeof ADMIN!=='undefined')&&ADMIN.dirty&&document.querySelector('.adm2')){ e.preventDefault(); e.returnValue=''; } });
})();
