#!/usr/bin/env python3
"""Régi magyar pénzek és pénztárgépek motívumai a weboldalhoz (SVG).
Futtatás: python3 eszkozok/motivumok/gen.py  → assets/motivumok/*.svg"""
import math,os,random
OUT=os.path.join(os.path.dirname(__file__),'..','..','assets','motivumok'); os.makedirs(OUT,exist_ok=True)
def w(n,s): open(os.path.join(OUT,n),'w').write(s)
def P(pts,close=False): return 'M'+' L'.join(f'{x:.1f} {y:.1f}' for x,y in pts)+(' Z' if close else '')

# ---------- 1) gilos (guilloche) háttérminta: bankjegyek biztonsági rácsa ----------
def gilos_tile(W=240,H=60,col='#9a7a3a',op=.16,sw=.6):
    paths=[]
    for fam in (1,-1):
        for k in range(10):
            off=k*H/10
            pts=[]
            for i in range(0,W+1,2):
                x=i; y=off+fam*7*math.sin(2*math.pi*x/120)+3*math.sin(2*math.pi*x/40+k)
                pts.append((x,y%H if False else y))
            # három függőleges eltolással, hogy a csempe varratmentes legyen
            for dy in (0,H) if k<5 else (-H,0): paths.append(P([(x,y+dy) for x,y in pts]))
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}"><g fill="none" stroke="{col}" stroke-opacity="{op}" stroke-width="{sw}">'+''.join(f'<path d="{p}"/>' for p in paths)+'</g></svg>'
w('gilos-vilagos.svg',gilos_tile())
w('gilos-sotet.svg',gilos_tile(col='#f4d58d',op=.07))

# ---------- 2) rozetta (bankjegy-vízjel), epitrochoid görbék ----------
def rozetta(R=200,col='#9a7a3a',op=.5):
    out=[]
    def rose(r0,amp,n,m,ph,steps=1800):
        pts=[]
        for i in range(steps+1):
            t=i/steps*2*math.pi
            r=r0+amp*math.sin(n*t+ph)+amp*.35*math.sin(m*t)
            pts.append((R+r*math.cos(t),R+r*math.sin(t)))
        return P(pts,True)
    for k in range(14):
        out.append(f'<path d="{rose(150-k*0.0,22,12,36,k*math.pi/14)}" stroke-width=".55"/>')
    for k in range(10):
        out.append(f'<path d="{rose(96,16,9,27,k*math.pi/10)}" stroke-width=".5"/>')
    for k in range(8):
        out.append(f'<path d="{rose(48,10,6,18,k*math.pi/8)}" stroke-width=".45"/>')
    out.append(f'<circle cx="{R}" cy="{R}" r="190" stroke-width="1.3"/><circle cx="{R}" cy="{R}" r="184" stroke-width=".6" stroke-dasharray="2 3"/><circle cx="{R}" cy="{R}" r="122" stroke-width=".8"/>')
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {2*R} {2*R}"><g fill="none" stroke="{col}" stroke-opacity="{op}">'+''.join(out)+'</g></svg>'
w('rozetta.svg',rozetta())
w('rozetta-arany.svg',rozetta(col='#f4d58d',op=.55))

# ---------- 3) bankjegyszegély-szalag (elválasztóhoz, fejlécekhez) ----------
def szalag(W=96,H=22):
    p=[]
    for fam in (1,-1):
        for k in range(3):
            pts=[(x/2,H/2+fam*(6-k*1.8)*math.sin(2*math.pi*(x/2)/48+k*.9)) for x in range(0,W*2+1)]
            p.append(f'<path d="{P(pts)}"/>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">'
            f'<rect width="{W}" height="{H}" fill="#fbf3dc"/><g fill="none" stroke="#a87a26" stroke-width=".9">'+''.join(p)+
            f'</g><path d="M0 1.2H{W}M0 {H-1.2}H{W}" stroke="#b98a32" stroke-width="1.6"/><path d="M0 3.6H{W}M0 {H-3.6}H{W}" stroke="#d9b56a" stroke-width=".6"/></svg>')
w('szalag.svg',szalag())

# ---------- 4) érme-generátor ----------
FONT="Georgia,'Times New Roman',serif"
FEM={'sargarez':('#fff3c4','#e8c56b','#b98a32','#6b4710','#5a3b0c'),
     'ezust':('#ffffff','#dfe5ea','#a9b4bd','#5c6670','#3f4850'),
     'rez':('#ffe0c2','#e0976a','#b0623a','#6a3018','#552612'),
     'alpakka':('#fbfbf2','#d9d7c4','#a8a58a','#5f5d48','#47452f')}
def coin(cid,fem,felirat,kozep='',nevertek='',evszam='',ikon='',r=100,koszoru=True,belso_szoveg=True,ivb=64):
    a,b,c,d,e=FEM[fem]; R=r
    g=f'''<defs><radialGradient id="{cid}m" cx="38%" cy="32%" r="80%"><stop offset="0" stop-color="{a}"/><stop offset=".35" stop-color="{b}"/><stop offset=".8" stop-color="{c}"/><stop offset="1" stop-color="{d}"/></radialGradient>
<linearGradient id="{cid}p" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{a}"/><stop offset=".5" stop-color="{c}"/><stop offset="1" stop-color="{d}"/></linearGradient>
<path id="{cid}t" d="M{R} {R+R*.74:.1f} a{R*.74:.1f} {R*.74:.1f} 0 1 1 0 -{R*1.48:.1f} a{R*.74:.1f} {R*.74:.1f} 0 1 1 0 {R*1.48:.1f}"/></defs>'''
    s=g+f'<circle cx="{R}" cy="{R}" r="{R-1}" fill="url(#{cid}p)"/>'
    # recés perem
    s+=f'<circle cx="{R}" cy="{R}" r="{R-3}" fill="none" stroke="{d}" stroke-width="3" stroke-dasharray="1.6 2.2" opacity=".55"/>'
    s+=f'<circle cx="{R}" cy="{R}" r="{R*.9:.1f}" fill="url(#{cid}m)" stroke="{e}" stroke-opacity=".5" stroke-width="1.2"/>'
    # gyöngysor
    for k in range(72):
        t=k/72*2*math.pi; s+=f'<circle cx="{R+R*.86*math.cos(t):.1f}" cy="{R+R*.86*math.sin(t):.1f}" r="{R*.016:.2f}" fill="{d}" opacity=".55"/>'
    s+=f'<circle cx="{R}" cy="{R}" r="{R*.6:.1f}" fill="none" stroke="{e}" stroke-opacity=".45" stroke-width="1"/>'
    if belso_szoveg and felirat:
        s+=(f'<text font-family="Georgia,serif" font-weight="700" font-size="{R*.13:.1f}" letter-spacing="{R*.012:.2f}" fill="{e}" fill-opacity=".85">'
            f'<textPath href="#{cid}t" startOffset="50%" text-anchor="middle">{felirat}</textPath></text>')
    if koszoru:
        for side in (-1,1):
            for k in range(7):
                t=math.radians(110+k*11) if side<0 else math.radians(70-k*11)
                x=R+R*.5*math.cos(t); y=R+R*.5*math.sin(t)
                ang=math.degrees(t)+(90 if side<0 else -90)
                s+=f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="{R*.05:.1f}" ry="{R*.022:.1f}" transform="rotate({ang:.0f} {x:.1f} {y:.1f})" fill="{d}" opacity=".6"/>'
    if ikon:
        sc=R*.62/ivb
        s+=f'<g transform="translate({R-R*.31:.1f} {R-R*.36:.1f}) scale({sc:.3f})" fill="none" stroke="{e}" stroke-width="{R*.045/sc:.2f}" stroke-linecap="round" stroke-linejoin="round" opacity=".88">{ikon}</g>'
    if nevertek:
        s+=f'<text x="{R}" y="{R+R*.12:.1f}" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="{R*.42:.1f}" fill="{e}" fill-opacity=".85">{nevertek}</text>'
    if kozep:
        s+=f'<text x="{R}" y="{R+R*.34:.1f}" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="{R*.13:.1f}" letter-spacing="{R*.01:.2f}" fill="{e}" fill-opacity=".8">{kozep}</text>'
    if evszam:
        s+=f'<text x="{R}" y="{R-R*.3:.1f}" text-anchor="middle" font-family="Georgia,serif" font-size="{R*.1:.1f}" fill="{e}" fill-opacity=".7">{evszam}</text>'
    # fényvisszaverődés
    s+=f'<ellipse cx="{R*.72:.1f}" cy="{R*.55:.1f}" rx="{R*.42:.1f}" ry="{R*.2:.1f}" transform="rotate(-35 {R*.72:.1f} {R*.55:.1f})" fill="#fff" opacity=".18"/>'
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {2*R} {2*R}">{s}</svg>'

# elválasztó közepére: forint
w('erme-forint.svg',coin('f1','sargarez','MAGYAR NÉPKÖZTÁRSASÁG · 1946 ·','FORINT','1'))
w('erme-pengo.svg',coin('p1','ezust','MAGYAR KIRÁLYSÁG · 1926 ·','PENGŐ','1'))

# ---------- 5) a régi pénzek fala (sáv) ----------
def pinceset():
    random.seed(1982)
    kinds=[('ezust','MAGYAR KIRÁLYSÁG ·','PENGŐ','1','1926'),('ezust','MAGYAR KIRÁLYSÁG ·','PENGŐ','2','1929'),('ezust','MAGYAR KIRÁLYSÁG ·','PENGŐ','5','1930'),
           ('rez','MAGYAR KIRÁLYSÁG ·','FILLÉR','10','1938'),('rez','MAGYAR KIRÁLYSÁG ·','FILLÉR','20','1914'),('sargarez','MAGYAR KIRÁLYI ·','KORONA','1','1915'),
           ('sargarez','MAGYAR KÖZTÁRSASÁG ·','FORINT','2','1946'),('alpakka','MAGYAR NÉPKÖZTÁRSASÁG ·','FORINT','5','1971'),('alpakka','MAGYAR NÉPKÖZTÁRSASÁG ·','FORINT','10','1983'),
           ('sargarez','MAGYAR NÉPKÖZTÁRSASÁG ·','FORINT','20','1982'),('rez','MAGYAR NÉPKÖZTÁRSASÁG ·','FILLÉR','50','1967'),('ezust','MAGYAR KIRÁLYSÁG ·','PENGŐ','5','1938')]
    W,H=1600,170; parts=[]; x=30; i=0
    while x<W-40:
        if i%5==3:  # bankjegy
            bw,bh=150,74; y=random.randint(30,70); rot=random.uniform(-6,6); den=random.choice(['100 PENGŐ','10 FORINT','50 PENGŐ','100 FORINT','20 FORINT'])
            col=random.choice([('#e9dcc0','#7a6a48'),('#dfe6cf','#5d6a49'),('#ead8cf','#7a5146'),('#dde3ea','#4f5e70')])
            gid=f'b{i}'
            gl=''.join(f'<path d="{P([(bx,bh/2+ (9-k*2)*math.sin(bx/9+k)) for bx in range(0,bw+1,2)])}"/>' for k in range(5))
            parts.append(f'<g transform="translate({x} {y})"><g class="leng" style="animation-delay:{-random.uniform(0,6):.2f}s;animation-duration:{random.uniform(6,9):.2f}s"><path d="M{bw/2} -{y-6} V-2" stroke="#6b4710" stroke-width="1" opacity=".6"/><g transform="rotate({rot:.1f} {bw/2} {bh/2})"><rect x="2" y="4" width="{bw}" height="{bh}" rx="3" fill="#000" opacity=".18"/>'
              f'<rect width="{bw}" height="{bh}" rx="3" fill="{col[0]}" stroke="{col[1]}" stroke-width="1.4"/><rect x="5" y="5" width="{bw-10}" height="{bh-10}" rx="2" fill="none" stroke="{col[1]}" stroke-width=".7" stroke-dasharray="2 1.5"/>'
              f'<g fill="none" stroke="{col[1]}" stroke-opacity=".45" stroke-width=".6">{gl}</g><circle cx="{bw-30}" cy="{bh/2}" r="20" fill="none" stroke="{col[1]}" stroke-opacity=".6"/>'
              f'<text x="14" y="{bh/2+5}" font-family="Georgia,serif" font-weight="700" font-size="14" fill="{col[1]}">{den}</text><text x="14" y="{bh-12}" font-family="Georgia,serif" font-size="7" letter-spacing=".8" fill="{col[1]}">MAGYAR NEMZETI BANK</text>'
              f'<circle cx="{bw/2}" cy="-2" r="2.6" fill="#8a6a2a"/></g></g></g>')
            x+=bw+28
        else:
            k=kinds[i%len(kinds)]; r=random.choice([26,30,34,38,42]); y=random.randint(r+18,H-r-10)
            sv=coin(f'c{i}',k[0],k[1],k[2],k[3],k[4],r=r)
            inner=sv[sv.index('>')+1:-6]
            parts.append(f'<g transform="translate({x} {y-r})"><g class="leng" style="animation-delay:{-random.uniform(0,6):.2f}s;animation-duration:{random.uniform(5,8):.2f}s"><path d="M{r} -{y-r-6} V4" stroke="#6b4710" stroke-width="1" opacity=".6"/><circle cx="{r+3}" cy="{r+5}" r="{r}" fill="#000" opacity=".2"/>{inner}<circle cx="{r}" cy="4" r="2.4" fill="#5a3b0c"/></g></g>')
            x+=2*r+26
        i+=1
    st='<style>.leng{transform-box:fill-box;transform-origin:50% 0;animation:leng 6s ease-in-out infinite}@keyframes leng{0%,100%{transform:rotate(-1.6deg)}50%{transform:rotate(1.6deg)}}@media (prefers-reduced-motion:reduce){.leng{animation:none}}</style>'
    # minden lengő elem forgáspontja a saját szöge (a csoport origója a szögnél van: translate után 0 0 → a fenti sín)
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice">'+st+''.join(parts)+'</svg>'
w('penzfal.svg',pinceset())

# ---------- 6) antik pénztárgép vonalrajza ----------
reg='''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 330" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path d="M104 58c0-26 22-40 66-40s66 14 66 40"/><path d="M118 58c2-16 20-26 52-26s50 10 52 26" stroke-width="1.2"/><path d="M150 22c4-12 36-12 40 0" />
<rect x="112" y="58" width="116" height="30" rx="3"/><rect x="124" y="64" width="26" height="18" rx="1.5"/><rect x="157" y="64" width="26" height="18" rx="1.5"/><rect x="190" y="64" width="26" height="18" rx="1.5"/>
<path d="M131 78l6-10 6 10M164 78h12M170 68v10M197 70h12v8h-12z" stroke-width="1.2"/>
<path d="M70 88h200l18 92H52z"/><path d="M78 96h184l14 76H64z" stroke-width="1"/>
<g stroke-width="1.6"><circle cx="86" cy="104" r="6.2"/><circle cx="86" cy="104" r="3.2" stroke-width="1"/><circle cx="105" cy="104" r="6.2"/><circle cx="105" cy="104" r="3.2" stroke-width="1"/><circle cx="124" cy="104" r="6.2"/><circle cx="124" cy="104" r="3.2" stroke-width="1"/><circle cx="143" cy="104" r="6.2"/><circle cx="143" cy="104" r="3.2" stroke-width="1"/><circle cx="162" cy="104" r="6.2"/><circle cx="162" cy="104" r="3.2" stroke-width="1"/><circle cx="181" cy="104" r="6.2"/><circle cx="181" cy="104" r="3.2" stroke-width="1"/><circle cx="200" cy="104" r="6.2"/><circle cx="200" cy="104" r="3.2" stroke-width="1"/><circle cx="219" cy="104" r="6.2"/><circle cx="219" cy="104" r="3.2" stroke-width="1"/><circle cx="86" cy="119" r="6.2"/><circle cx="86" cy="119" r="3.2" stroke-width="1"/><circle cx="105" cy="119" r="6.2"/><circle cx="105" cy="119" r="3.2" stroke-width="1"/><circle cx="124" cy="119" r="6.2"/><circle cx="124" cy="119" r="3.2" stroke-width="1"/><circle cx="143" cy="119" r="6.2"/><circle cx="143" cy="119" r="3.2" stroke-width="1"/><circle cx="162" cy="119" r="6.2"/><circle cx="162" cy="119" r="3.2" stroke-width="1"/><circle cx="181" cy="119" r="6.2"/><circle cx="181" cy="119" r="3.2" stroke-width="1"/><circle cx="200" cy="119" r="6.2"/><circle cx="200" cy="119" r="3.2" stroke-width="1"/><circle cx="219" cy="119" r="6.2"/><circle cx="219" cy="119" r="3.2" stroke-width="1"/><circle cx="86" cy="134" r="6.2"/><circle cx="86" cy="134" r="3.2" stroke-width="1"/><circle cx="105" cy="134" r="6.2"/><circle cx="105" cy="134" r="3.2" stroke-width="1"/><circle cx="124" cy="134" r="6.2"/><circle cx="124" cy="134" r="3.2" stroke-width="1"/><circle cx="143" cy="134" r="6.2"/><circle cx="143" cy="134" r="3.2" stroke-width="1"/><circle cx="162" cy="134" r="6.2"/><circle cx="162" cy="134" r="3.2" stroke-width="1"/><circle cx="181" cy="134" r="6.2"/><circle cx="181" cy="134" r="3.2" stroke-width="1"/><circle cx="200" cy="134" r="6.2"/><circle cx="200" cy="134" r="3.2" stroke-width="1"/><circle cx="219" cy="134" r="6.2"/><circle cx="219" cy="134" r="3.2" stroke-width="1"/><circle cx="86" cy="149" r="6.2"/><circle cx="86" cy="149" r="3.2" stroke-width="1"/><circle cx="105" cy="149" r="6.2"/><circle cx="105" cy="149" r="3.2" stroke-width="1"/><circle cx="124" cy="149" r="6.2"/><circle cx="124" cy="149" r="3.2" stroke-width="1"/><circle cx="143" cy="149" r="6.2"/><circle cx="143" cy="149" r="3.2" stroke-width="1"/><circle cx="162" cy="149" r="6.2"/><circle cx="162" cy="149" r="3.2" stroke-width="1"/><circle cx="181" cy="149" r="6.2"/><circle cx="181" cy="149" r="3.2" stroke-width="1"/><circle cx="200" cy="149" r="6.2"/><circle cx="200" cy="149" r="3.2" stroke-width="1"/><circle cx="219" cy="149" r="6.2"/><circle cx="219" cy="149" r="3.2" stroke-width="1"/></g>
<path d="M56 180h228v40H56z"/><path d="M80 192c10-8 20 8 30 0s20 8 30 0M200 192c10-8 20 8 30 0s20 8 30 0" stroke-width="1.2"/><rect x="146" y="188" width="48" height="24" rx="3"/><path d="M156 200h28" stroke-width="1.2"/>
<path d="M44 220h252l-6 58H50z"/><path d="M60 236h220M60 262h220" stroke-width="1"/><path d="M140 249h60"/><circle cx="170" cy="249" r="5"/>
<path d="M288 132c26-4 40 12 34 32l-14 34"/><circle cx="306" cy="204" r="9"/><circle cx="306" cy="204" r="3.5"/>
<path d="M36 278h268"/><path d="M50 278c-10 6-14 16-10 26M290 278c10 6 14 16 10 26"/><path d="M40 304h20M280 304h20"/>
<path d="M64 120c-14 10-14 30 0 40M276 120c14 10 14 30 0 40" stroke-width="1.2"/></svg>'''
w('antik-penztargep.svg',reg)
print('kész:',sorted(os.listdir(OUT)))

# ---------- 7) kétfémű (bimetál) érme – a felhasználó euró-mintája alapján: arany gyűrű, ezüst mag, dombornyomott ikon ----------
def bimetal(cid,felirat,ikon='',ivb=64,r=100,fordit=False):
    R=r; ri=R*.66
    gy=('#f6e7b0','#e3c983','#c8a85e','#8f7438') if not fordit else ('#ffffff','#e3e8ef','#b9c3cf','#7d8896')
    mg=('#ffffff','#eef1f6','#c9d1dc','#8d99aa') if not fordit else ('#f6e7b0','#ead190','#c9a95e','#94773a')
    d=f'''<defs><linearGradient id="{cid}g" x1=".15" y1=".1" x2=".85" y2=".95"><stop offset="0" stop-color="{gy[0]}"/><stop offset=".45" stop-color="{gy[1]}"/><stop offset=".8" stop-color="{gy[2]}"/><stop offset="1" stop-color="{gy[3]}"/></linearGradient>
<linearGradient id="{cid}e" x1=".1" y1="0" x2=".9" y2="1"><stop offset="0" stop-color="#fff6d6"/><stop offset=".5" stop-color="{gy[3]}"/><stop offset="1" stop-color="#4f3d14"/></linearGradient>
<radialGradient id="{cid}m" cx="35%" cy="30%" r="85%"><stop offset="0" stop-color="{mg[0]}"/><stop offset=".45" stop-color="{mg[1]}"/><stop offset=".85" stop-color="{mg[2]}"/><stop offset="1" stop-color="{mg[3]}"/></radialGradient>
<path id="{cid}t" d="M{R} {R+R*.83:.1f} a{R*.83:.1f} {R*.83:.1f} 0 1 1 0 -{R*1.66:.1f} a{R*.83:.1f} {R*.83:.1f} 0 1 1 0 {R*1.66:.1f}"/></defs>'''
    s=d+f'<circle cx="{R}" cy="{R+R*.03:.1f}" r="{R-1}" fill="#000" opacity=".22"/>'
    s+=f'<circle cx="{R}" cy="{R}" r="{R-1.5}" fill="url(#{cid}e)"/><circle cx="{R}" cy="{R}" r="{R*.955:.1f}" fill="url(#{cid}g)"/>'
    s+=f'<circle cx="{R}" cy="{R}" r="{R*.955:.1f}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="{R*.012:.1f}"/>'
    if felirat:
        sh=R*.008
        T=lambda fill,op,dx: (f'<text font-family="Georgia,serif" font-weight="700" font-size="{R*.135:.1f}" letter-spacing="{R*.015:.2f}" fill="{fill}" fill-opacity="{op}" transform="translate({dx:.2f} {dx:.2f})">'
            f'<textPath href="#{cid}t" startOffset="50%" text-anchor="middle">{felirat}</textPath></text>')
        s+=T('#fff',.65,R*.008)+T('#5a4618',.92,-R*.004)
    # mag peremárnyéka
    s+=f'<circle cx="{R}" cy="{R}" r="{ri+R*.02:.1f}" fill="#000" opacity=".18"/><circle cx="{R}" cy="{R}" r="{ri:.1f}" fill="url(#{cid}m)"/>'
    s+=f'<path d="M{R-ri*.8:.1f} {R-ri*.35:.1f} A{ri:.1f} {ri:.1f} 0 0 1 {R+ri*.35:.1f} {R-ri*.85:.1f}" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="{R*.02:.1f}" stroke-linecap="round"/>'
    if ikon:
        sc=ri*1.1/ivb; ox=R-ivb*sc/2; oy=R-ivb*sc/2; sw=R*.024/sc
        g=f'fill="none" stroke-width="{sw:.2f}" stroke-linecap="round" stroke-linejoin="round"'
        s+=f'<g transform="translate({ox+R*.012:.1f} {oy+R*.014:.1f}) scale({sc:.3f})" {g} stroke="#ffffff" stroke-opacity=".9">{ikon}</g>'
        s+=f'<g transform="translate({ox:.1f} {oy:.1f}) scale({sc:.3f})" {g} stroke="#4c5b6e">{ikon}</g>'
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {2*R} {2*R}">{s}</svg>'
w('erme-bimetal.svg',bimetal('bm','TOTÁL · PÉCS · 1982 ·',ikon='<path d="M8 40h48l-3-14H11z"/><path d="M6 40h52v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z"/><path d="M22 26V14h16v12M26 18h8M26 22h8"/><path d="M15 45h6M25 45h6M35 45h6M45 45h4M15 49h34"/>'))

# ---------- 8) TOTÁL-érme: a felhasználó euró-mintája szerint – arany gyűrű, ezüst mag, csillagos függőleges vonalak,
#               átfutó dombornyomott TOTÁL felirat (a gyűrűn aranyra vált), a mag domborműve az adott témájú rajz ----------
def totalcoin(cid,ikon,ivb=64,r=100,szoveg='TOTÁL'):
    R=r; ri=R*.71
    S=lambda v:f'{v:.2f}'
    d=f'''<defs>
<linearGradient id="{cid}g" x1=".1" y1=".05" x2=".9" y2=".95"><stop offset="0" stop-color="#f7ebbd"/><stop offset=".35" stop-color="#ead39a"/><stop offset=".7" stop-color="#cbb07a"/><stop offset="1" stop-color="#8e7646"/></linearGradient>
<linearGradient id="{cid}e" x1=".2" y1="0" x2=".8" y2="1"><stop offset="0" stop-color="#fffbe8"/><stop offset=".45" stop-color="#a8915c"/><stop offset="1" stop-color="#3d3014"/></linearGradient>
<linearGradient id="{cid}m" x1=".15" y1=".1" x2=".95" y2=".9"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#f1f3f7"/><stop offset=".8" stop-color="#c3cbd8"/><stop offset="1" stop-color="#8f9bb0"/></linearGradient>
<pattern id="{cid}p" width="{S(R*.035)}" height="{S(R*.035)}" patternUnits="userSpaceOnUse"><rect width="{S(R*.035)}" height="{S(R*.035)}" fill="#c9ced6"/><circle cx="{S(R*.0175)}" cy="{S(R*.0175)}" r="{S(R*.009)}" fill="#6f7a88"/></pattern>
<clipPath id="{cid}c"><circle cx="{R}" cy="{R}" r="{S(ri)}"/></clipPath>
<mask id="{cid}k"><rect width="{2*R}" height="{2*R}" fill="#fff"/><circle cx="{R}" cy="{R}" r="{S(ri)}" fill="#000"/></mask>
</defs>'''
    s=d
    s+=f'<circle cx="{R}" cy="{R}" r="{S(R-1)}" fill="url(#{cid}e)"/>'
    s+=f'<circle cx="{R}" cy="{R}" r="{S(R*.95)}" fill="url(#{cid}g)"/>'
    s+=f'<circle cx="{R}" cy="{R}" r="{S(R*.95)}" fill="none" stroke="#5c4a20" stroke-opacity=".55" stroke-width="{S(R*.012)}"/>'
    s+=f'<path d="M{S(R-R*.78)} {S(R-R*.45)} A{S(R*.9)} {S(R*.9)} 0 0 1 {S(R+R*.2)} {S(R-R*.88)}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="{S(R*.03)}" stroke-linecap="round"/>'
    # mag: árnyékolt perem + ezüst
    s+=f'<circle cx="{R}" cy="{R}" r="{S(ri+R*.022)}" fill="#6d5a2c" opacity=".55"/><circle cx="{R}" cy="{R}" r="{S(ri)}" fill="url(#{cid}m)"/>'
    # euró-stílusú függőleges vonalak csillagokkal, a jobb oldalon
    lines=''; stars=''
    fs=R*.34; tx=R+R*.34; ty=R+R*.42
    for k in range(6):
        x=R+R*(.22+k*.115); h=math.sqrt(max(0,(R*.86)**2-(x-R)**2))
        y1=R-h*.86; y2=R+h*.86
        lines+=f'<path d="M{S(x)} {S(y1)}V{S(ty-fs*.95)}M{S(x)} {S(ty+fs*.22)}V{S(y2)}" />'
        for yy in (y1-R*.03,y2+R*.03):
            pts=[]
            for j in range(10):
                a=-math.pi/2+j*math.pi/5; rr=R*.042 if j%2==0 else R*.018
                pts.append((x+rr*math.cos(a),yy+rr*math.sin(a)))
            stars+=f'<path d="{P(pts,True)}"/>'
    s+=f'<g stroke="#ffffff" stroke-opacity=".85" stroke-width="{S(R*.022)}" fill="none" transform="translate({S(R*.006)} {S(R*.006)})">{lines}</g>'
    s+=f'<g stroke="#7d6a3c" stroke-opacity=".7" stroke-width="{S(R*.012)}" fill="none">{lines}</g>'
    s+=f'<g fill="#f3e2a8" stroke="#6f5a28" stroke-width="{S(R*.006)}">{stars}</g>'
    # dombormű: a téma rajza, pontozott felülettel, világos élkiemeléssel és sötét kontúrral
    if ikon:
        sc=ri*1.18/ivb; ox=R-R*.7; oy=R-R*.74
        tr=f'transform="translate({S(ox)} {S(oy)}) scale({sc:.4f})"'
        base='fill="none" stroke-linecap="round" stroke-linejoin="round"'
        sw=R*.05/sc
        s+=f'<g clip-path="url(#{cid}c)">'
        s+=f'<g {base} stroke="#ffffff" stroke-width="{S(sw*1.35)}" transform="translate({S(ox-R*.012)} {S(oy-R*.012)}) scale({sc:.4f})">{ikon}</g>'
        s+=f'<g {base} {tr} stroke="#2c3644" stroke-width="{S(sw*1.32)}">{ikon}</g>'
        s+=f'<g {base} {tr} stroke="url(#{cid}p)" stroke-width="{S(sw)}">{ikon}</g>'
        s+='</g>'
    # TOTÁL felirat: a magon ezüst-dombor, a gyűrűn aranyra vált (mint az EURO „O”-ja)
    fs=R*.34; tx=R+R*.34; ty=R+R*.42
    T=lambda fill,stroke,sw,dx,extra='':f'<text x="{S(tx+dx)}" y="{S(ty+dx)}" text-anchor="middle" font-family="Georgia,\'Times New Roman\',serif" font-style="italic" font-weight="700" font-size="{S(fs)}" letter-spacing="{S(-R*.008)}" fill="{fill}" stroke="{stroke}" stroke-width="{S(sw)}" paint-order="stroke" {extra}>{szoveg}</text>'
    s+=f'<g clip-path="url(#{cid}c)">'+T('#2b3442','#2b3442',R*.03,R*.012)+T('#ffffff','#5d6878',R*.016,0)+T('none','#ffffff',R*.006,-R*.006,'stroke-opacity=".9"')+'</g>'
    s+=f'<g mask="url(#{cid}k)">'+T('#3d3014','#3d3014',R*.03,R*.012)+T('#efd892','#7a6228',R*.016,0)+T('none','#fffbe8',R*.006,-R*.006)+'</g>'
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {2*R} {2*R}">{s}</svg>'

PT='<path d="M8 40h48l-3-14H11z"/><path d="M6 40h52v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z"/><path d="M22 26V14h16v12M26 18h8M26 22h8"/><path d="M15 45h6M25 45h6M35 45h6M45 45h4M15 49h34"/>'
w('erme-total.svg',totalcoin('tt',PT))
TEMAK={
 'penztargep':PT,
 'szamtech':'<rect x="10" y="8" width="44" height="32" rx="3"/><path d="M16 14h32v20H16z"/><path d="M28 40v6M36 40v6M20 50h24"/><path d="M12 56h40"/>',
 'merleg':'<path d="M8 54h48l-5-16H13z"/><path d="M23 38l3-13h12l3 13"/><rect x="21" y="8" width="22" height="13" rx="2"/><path d="M32 21v4M26 31h12M17 46h30"/>',
 'kellek':'<ellipse cx="20" cy="30" rx="10" ry="18"/><ellipse cx="20" cy="30" rx="3.5" ry="6"/><path d="M20 12h24c6 0 10 8 10 18s-4 18-10 18H20"/><path d="M44 48v10l-4-3-4 3-4-3-4 3V48"/>',
 'szerviz':'<path d="M46 6a12 12 0 0 0-15 15L9 43a5 5 0 0 0 7 7l22-22a12 12 0 0 0 15-15l-7 7-7-2-2-7z"/><path d="M40 42l14 14"/><path d="M36 46l4-4"/>',
 'epenz':'<path d="M16 4h32v54l-5-4-5 4-5-4-5 4-5-4-5 4-2-1z"/><path d="M22 14h20M22 22h20M22 30h12"/><path d="M24 42l6 6 11-12"/>',
}
for k,v in TEMAK.items(): w(f'erme-{k}.svg',totalcoin('t'+k,v))
