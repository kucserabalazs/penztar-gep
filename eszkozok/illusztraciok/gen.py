import cv2,numpy as np,json,os,re
from tr import load,trace,S
OUT='out'; os.makedirs(OUT,exist_ok=True)
def mask(shape,polys):
  m=np.zeros(shape,np.uint8)
  for P in polys: cv2.fillPoly(m,[np.array([[x*S,y*S] for x,y in P],np.int32)],255)
  return m
def rect(x0,y0,x1,y1): return [(x0,y0),(x1,y0),(x1,y1),(x0,y1)]
def pathbbox(d):
  nums=[float(v) for v in re.findall(r'-?\d+\.?\d*',d)]; xs=nums[0::2]; ys=nums[1::2]
  return min(xs),min(ys),max(xs),max(ys)
def ubox(bs):
  bs=[b for b in bs if b]; return (min(b[0] for b in bs),min(b[1] for b in bs),max(b[2] for b in bs),max(b[3] for b in bs))
def orig(b,px,py): return f'{(px-b[0])/(b[2]-b[0])*100:.1f}% {(py-b[1])/(b[3]-b[1])*100:.1f}%'
SPARK='M0 -9L2 -2L9 0L2 2L0 9L-2 2L-9 0L-2 -2Z'
CFG={
 'tv-torony':{'cim':'TV-torony (Misina)','parts':[('csucs-also',[rect(452,478,572,763)],(512,763),None),('csucs-kozep',[rect(452,203,572,478)],(512,478),'csucs-also'),('csucs-felso',[rect(452,0,572,203)],(512,203),'csucs-kozep')],'spark':[]},
 'zsolnay-kut-okorfej':{'cim':'Zsolnay-kút – ökörfej','parts':[('ful-bal',[rect(370,40,605,268)],(495,268),None),('ful-jobb',[rect(605,40,850,268)],(716,268),None)],'spark':[],
   'extra':'<path id="nyelv" class="resz" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" d="M1024 845C1060 849 1090 862 1125 856S1175 826 1210 832S1262 864 1302 852S1352 824 1390 832S1440 862 1480 852S1530 824 1570 832S1620 862 1660 852S1710 826 1748 836L1794 812M1748 836L1790 868"/>','vbx':1806,'tukor':True},
 'dzsami':{'cim':'Gázi Kászim pasa dzsámija','top':95,'parts':[('jelkep',[rect(700,26,748,93)],(724,93),'kupola'),('kupola',[[(360,20),(1095,20),(1095,334),(1065,333),(912,291),(535,291),(380,331),(360,331)]],(724,300),None,'<path class="perem" fill="none" stroke="currentColor" stroke-width="3.5" d="M374 336C470 356 975 356 1071 336"/>')],'spark':[(758,40,1.4,0),(690,70,1,1.2)]},
 'szechenyi-ter':{'cim':'Széchenyi tér – Szentháromság-szobor, dzsámi, Hunyadi-lovasszobor','top':62,'parts':[('szobor',[rect(1412,0,1803,356)],(1745,356),None),('csillag',[rect(538,33,602,89)],(570,64),None),('felhold',[rect(1021,77,1049,101)],(1035,100),'kupola'),('kupola',[[(840,75),(1210,75),(1210,288),(1172,268),(1037,258),(908,264),(845,288)]],(1035,270),None,'<path class="perem" fill="none" stroke="currentColor" stroke-width="2.2" d="M852 292C910 304 1150 304 1205 292"/>')],'spark':[(1060,80,1.1,0.6),(600,40,1,2.2)]},
 'szekesegyhaz':{'cim':'Pécsi székesegyház','parts':[],'spark':[(866,22,1.3,0),(342,352,1,1.1),(683,458,.9,2.1),(1232,214,1.1,3)]},
}
CSS={
 'tv-torony':'''#csucs-also{animation:tvA 9s ease-in-out infinite}#csucs-kozep{animation:tvB 9s ease-in-out infinite}#csucs-felso{animation:tvC 9s ease-in-out infinite}
@keyframes tvA{0%,62%,100%{transform:rotate(0)}70%{transform:rotate(2.2deg)}78%{transform:rotate(-1.2deg)}85%{transform:rotate(.6deg)}92%{transform:rotate(-.2deg)}}
@keyframes tvB{0%,62%,100%{transform:rotate(0)}70%{transform:rotate(3deg)}78%{transform:rotate(-1.6deg)}85%{transform:rotate(.8deg)}92%{transform:rotate(-.3deg)}}
@keyframes tvC{0%,62%,100%{transform:rotate(0)}70%{transform:rotate(4.5deg)}78%{transform:rotate(-2.4deg)}85%{transform:rotate(1.1deg)}92%{transform:rotate(-.4deg)}}''',
 'zsolnay-kut-okorfej':'''#ful-bal{animation:fulB 7s ease-in-out infinite}#ful-jobb{animation:fulJ 7s ease-in-out infinite .15s}
@keyframes fulB{0%,74%,100%{transform:skewX(0)}79%{transform:skewX(-14deg)}84%{transform:skewX(5deg)}88%{transform:skewX(-8deg)}93%{transform:skewX(0)}}
#nyelv{transform:scaleX(0);transform-origin:0% 50%;animation-fill-mode:both!important;animation:nyelv 7s cubic-bezier(.2,.8,.3,1) infinite 2.2s}
@keyframes nyelv{0%,60%,100%{transform:scaleX(0);opacity:0}61%{opacity:1}66%{transform:scaleX(1) skewY(0)}69%{transform:scaleX(1) skewY(-4deg)}72%{transform:scaleX(1) skewY(4deg)}75%{transform:scaleX(1) skewY(-3deg)}78%{transform:scaleX(1) skewY(0)}83%{transform:scaleX(0);opacity:1}84%{opacity:0}}
@keyframes fulJ{0%,74%,100%{transform:skewX(0)}79%{transform:skewX(14deg)}84%{transform:skewX(-5deg)}88%{transform:skewX(8deg)}93%{transform:skewX(0)}}''',
 'dzsami':'''#kupola{animation:kalap 9s cubic-bezier(.35,.6,.3,1) infinite}#kupola .perem{animation:perem 9s linear infinite}#jelkep{animation:jel 8s ease-in-out infinite}
@keyframes kalap{0%,60%,100%{transform:translate(0,0) rotate(0)}66%{transform:translate(0,-70px) rotate(-7deg)}70%{transform:translate(0,-78px) rotate(-9deg)}78%{transform:translate(0,-78px) rotate(-9deg)}84%{transform:translate(0,-6px) rotate(0)}87%{transform:translate(0,-12px) rotate(1deg)}91%{transform:translate(0,0) rotate(0)}}
@keyframes jel{0%,70%,100%{transform:rotate(0)}76%{transform:rotate(-5deg)}82%{transform:rotate(4deg)}88%{transform:rotate(-2deg)}94%{transform:rotate(0)}}''',
 'szechenyi-ter':'''#szobor{animation:szobor 12s cubic-bezier(.3,.7,.4,1) infinite}#csillag{animation:csillag 10s linear infinite}#felhold{animation:jel 8s ease-in-out infinite}#kupola{animation:kalap 11s cubic-bezier(.35,.6,.3,1) infinite 3s}#kupola .perem{animation:perem 11s linear infinite 3s}
@keyframes kalap{0%,60%,100%{transform:translate(0,0) rotate(0)}66%{transform:translate(0,-42px) rotate(-7deg)}70%{transform:translate(0,-47px) rotate(-9deg)}78%{transform:translate(0,-47px) rotate(-9deg)}84%{transform:translate(0,-4px) rotate(0)}87%{transform:translate(0,-8px) rotate(1deg)}91%{transform:translate(0,0) rotate(0)}}
@keyframes szobor{0%,50%,100%{transform:translate(0,0) rotate(0)}54%{transform:translate(-50px,-60px) rotate(7deg)}59%{transform:translate(-150px,302px) rotate(0)}61%{transform:translate(-150px,309px) rotate(0)}63%{transform:translate(-150px,305px) rotate(0)}67%{transform:translate(-150px,305px) rotate(17deg)}70%{transform:translate(-150px,305px) rotate(-1deg)}73%{transform:translate(-150px,305px) rotate(13deg)}76%{transform:translate(-150px,305px) rotate(0)}79%{transform:translate(-150px,308px) rotate(0)}84%{transform:translate(-80px,-70px) rotate(-5deg)}89%{transform:translate(0,5px) rotate(1deg)}92%{transform:translate(0,0) rotate(0)}}
@keyframes csillag{0%{transform:rotate(0) scale(1)}25%{transform:rotate(90deg) scale(1.12)}50%{transform:rotate(180deg) scale(1)}75%{transform:rotate(270deg) scale(1.12)}100%{transform:rotate(360deg) scale(1)}}
@keyframes jel{0%,70%,100%{transform:rotate(0)}76%{transform:rotate(-8deg)}82%{transform:rotate(6deg)}88%{transform:rotate(-3deg)}94%{transform:rotate(0)}}''',
 'szekesegyhaz':'',
}
COMMON='''.takaro{fill:var(--ill-hatter,#fff)}.perem{opacity:0}
@keyframes perem{0%,61%,100%{opacity:0}64%,82%{opacity:1}86%{opacity:0}}
.szikra{opacity:0;transform-box:fill-box;transform-origin:50% 50%;animation:szikra 6s ease-in-out infinite}
@keyframes szikra{0%,80%,100%{opacity:0;transform:scale(.2) rotate(0)}86%{opacity:1;transform:scale(1) rotate(45deg)}92%{opacity:0;transform:scale(.3) rotate(90deg)}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}'''
lst=[]
for name,c in CFG.items():
  bw=load(name); H,W=bw.shape
  rem=bw.copy(); parts={}
  for pt in c['parts']:
    pid,polys,piv,parent=pt[:4]
    m=mask(bw.shape,polys); pb=cv2.bitwise_and(rem,m); rem=cv2.bitwise_and(rem,cv2.bitwise_not(m))
    d=trace(pb); parts[pid]=dict(d=d,piv=piv,parent=parent,box=pathbbox(d) if d else None,add=pt[4] if len(pt)>4 else '')
    if pid=='szobor':
      k=cv2.dilate(pb,np.ones((9,9),np.uint8)); ff=k.copy(); h2,w2=ff.shape; mm=np.zeros((h2+2,w2+2),np.uint8); cv2.floodFill(ff,mm,(0,0),255)
      sil=cv2.bitwise_or(k,cv2.bitwise_not(ff)); sil=cv2.erode(sil,np.ones((5,5),np.uint8))
      cs2,_=cv2.findContours(sil,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
      sd=' '.join('M'+'L'.join(f'{round(x/S,1):g} {round(y/S,1):g}' for x,y in cv2.approxPolyDP(c2,2,True)[:,0,:])+'Z' for c2 in cs2 if cv2.contourArea(c2)>400)
      parts[pid]['add']=f'<path class="takaro" d="{sd}"/>'
  based=trace(rem)
  ys,xs=np.nonzero(bw); x0,y0,x1,y1=xs.min()/S,ys.min()/S,xs.max()/S,ys.max()/S; p=6
  vb=f'{x0-p:g} {y0-p:g} {x1-x0+2*p:g} {y1-y0+2*p:g}'
  full=trace(bw)
  fp=f'<path fill="currentColor" fill-rule="evenodd" d="{full}"/>'
  if c.get('tukor'):
    vx,vy,vw,vh=[float(v) for v in vb.split()]; fp=f'<g transform="translate({2*vx+vw:g} 0) scale(-1 1)">{fp}</g>'
  open(f'{OUT}/{name}.svg','w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="{c["cim"]}">{fp}</svg>')
  # rétegek: szülő → gyerek
  def boxof(pid): return ubox([parts[pid]['box']]+[boxof(k) for k,v in parts.items() if v['parent']==pid])
  def grp(pid):
    v=parts[pid]; b=boxof(pid)
    kids=''.join(grp(k) for k,vv in parts.items() if vv['parent']==pid)
    add=v['add']; pre=add if 'takaro' in add else ''; post='' if pre else add
    return f'<g id="{pid}" class="resz" style="transform-origin:{orig(b,*v["piv"])}">{pre}<path d="{v["d"]}"/>{post}{kids}</g>'
  if c.get('vbx'): vb=f'{x0-p:g} {y0-p:g} {c["vbx"]-x0+p:g} {y1-y0+2*p:g}'
  if name=='tv-torony': vb=f'{x0-p-110:g} {y0-p:g} {x1-x0+2*p+220:g} {y1-y0+2*p:g}'
  if c.get('top'): t=c['top']; vb=f'{x0-p:g} {y0-p-t:g} {x1-x0+2*p:g} {y1-y0+2*p+t:g}'
  body=f'<path d="{based}"/>'+c.get('extra','')+''.join(grp(k) for k,v in parts.items() if v['parent'] is None)
  # a szikra transform attribútumát egy csoportba tesszük, hogy a CSS-animáció ne írja felül
  sp=''.join(f'<g transform="translate({x} {y}) scale({s})"><path class="szikra" d="{SPARK}" style="animation-delay:{dl}s"/></g>' for x,y,s,dl in c['spark'])
  style=f'<style>.resz{{transform-box:fill-box}}@media (prefers-reduced-motion:no-preference){{{CSS[name]}}}{COMMON}</style>'
  inner=body+sp
  if c.get('tukor'):
    vx,vy,vw,vh=[float(v) for v in vb.split()]; inner=f'<g transform="translate({2*vx+vw:g} 0) scale(-1 1)">{inner}</g>'
  svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="{c["cim"]} – mozgó"><title>{c["cim"]}</title>{style}<g fill="currentColor" fill-rule="evenodd">{inner}</g></svg>'
  open(f'{OUT}/{name}-mozgo.svg','w').write(svg)
  lst.append(dict(nev=name,cim=c['cim'],reszek=[k for k in parts],szikrak=len(c['spark']),vb=vb))
  print(name,os.path.getsize(f'{OUT}/{name}.svg')//1024,os.path.getsize(f'{OUT}/{name}-mozgo.svg')//1024,'KB')
json.dump(lst,open(f'{OUT}/lista.json','w'),ensure_ascii=False,indent=1)
