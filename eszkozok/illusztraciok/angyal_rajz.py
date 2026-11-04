#!/usr/bin/env python3
"""A dzsámis felhős jelenet szereplőinek rajza – a térkép-jelenet kisangyalával azonos, kidolgozott stílusban
(színátmenetes bőr, köntös és toll, göndör arany haj, derengő glória, háromsoros tollas szárnyak, vésett részletek).
Az angyal.py használja: REPULO_ANGYAL (kirepülő, csapkodó szárnyú), ULO_ANGYAL (felhőn ülő, fütyülő, lábát lógázó),
FELHO_RAJZ (színátmenetes, vésett árnyékolású gomolyfelhő), DEFS (színátmenetek), CSS (alakzatstílusok, animációs forgáspontok).
Helyi koordináták a szereplőknél: a csípő a (0,0), y lefelé nő, a szereplő kb. 90 egység magas."""
import math

def f1(x):
    return f"{x:.1f}".rstrip("0").rstrip(".") if abs(x - round(x)) > 1e-9 else str(int(round(x)))

def kapszula(A, B, wa, wb):
    dx, dy = B[0] - A[0], B[1] - A[1]
    l = math.hypot(dx, dy) or .001
    nx, ny = -dy / l, dx / l
    return (f"M{f1(A[0] + nx * wa)} {f1(A[1] + ny * wa)} L{f1(B[0] + nx * wb)} {f1(B[1] + ny * wb)} "
            f"A{f1(wb)} {f1(wb)} 0 0 0 {f1(B[0] - nx * wb)} {f1(B[1] - ny * wb)} "
            f"L{f1(A[0] - nx * wa)} {f1(A[1] - ny * wa)} A{f1(wa)} {f1(wa)} 0 0 0 {f1(A[0] + nx * wa)} {f1(A[1] + ny * wa)} Z")

DEFS = """
<radialGradient id="aj-abor" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#fdeedd"/><stop offset="1" stop-color="#ecc6a6"/></radialGradient>
<linearGradient id="aj-kontos" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#f3eee2"/><stop offset="1" stop-color="#d9d0bb"/></linearGradient>
<linearGradient id="aj-arany" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbe7a6"/><stop offset=".45" stop-color="#d9a945"/><stop offset="1" stop-color="#9a6b1c"/></linearGradient>
<linearGradient id="aj-toll" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e6dfcf"/></linearGradient>
<radialGradient id="aj-haj" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#fbe2a0"/><stop offset="1" stop-color="#c99a3e"/></radialGradient>
<radialGradient id="aj-glor" cx="50%" cy="50%" r="50%"><stop offset=".5" stop-color="#ffe9a8" stop-opacity="0"/><stop offset=".75" stop-color="#ffe29a" stop-opacity=".6"/><stop offset="1" stop-color="#ffe29a" stop-opacity="0"/></radialGradient>
<radialGradient id="aj-felho" cx="38%" cy="22%" r="85%"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#f7f2e7"/><stop offset="1" stop-color="#ddd1bb"/></radialGradient>
<radialGradient id="aj-pir" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ff8f7a" stop-opacity=".75"/><stop offset="1" stop-color="#ff8f7a" stop-opacity="0"/></radialGradient>
"""

CSS = """
.aj-v{stroke:currentColor;stroke-width:1.25;stroke-linejoin:round;stroke-linecap:round}
.aj-r{fill:none;stroke:currentColor;stroke-width:.7;stroke-linecap:round;stroke-linejoin:round}
.aj-f{fill:none;stroke:#b9ae95;stroke-width:.8;stroke-linecap:round}
.aj-szem{fill:none;stroke:#2a2a35;stroke-width:1.1;stroke-linecap:round}
.fv-k{fill:none;stroke:currentColor;stroke-width:6}
.fv-b{fill:url(#aj-felho)}
.fv-h{fill:none;stroke:currentColor;stroke-width:1.1;opacity:.2;stroke-linecap:round}
.fv-c{fill:none;stroke:#fff;stroke-width:3.2;stroke-linecap:round;opacity:.95}
.fv-a{fill:none;stroke:currentColor;stroke-width:1.6;opacity:.35;stroke-linecap:round}
#szb,#szj{transform-origin:0 0}
#labb{transform-origin:-5px 9px}#labj{transform-origin:5px 9px}
#ulo-szarny{transform-origin:0 -24px}#fej{transform-origin:0 -31px}
"""

def szarny():
    """egy szárny a tövénél (0,0) – balra-fel nyúlik; három tollsor"""
    return ('<path class="aj-v" fill="url(#aj-toll)" d="M0 0 C-10 -14 -30 -24 -50 -26 C-46 -22 -50 -18 -44 -15 C-50 -12 -46 -7 -40 -6 C-44 -2 -38 2 -32 1 C-34 5 -27 8 -22 5 C-20 10 -12 10 -9 5 C-5 6 -2 3 0 0 Z"/>'
            '<path class="aj-r" style="stroke-width:.6" d="M-6 -6 C-18 -14 -32 -19 -46 -22 M-8 -3 C-20 -9 -32 -12 -42 -13 M-9 0 C-19 -3 -28 -4 -36 -3 M-8 2 C-15 2 -22 3 -27 4 M-6 3 C-10 5 -14 6 -18 6"/>'
            '<path class="aj-v" style="stroke-width:.9" fill="#fffdf6" d="M0 0 C-6 -8 -16 -13 -26 -14 C-20 -9 -14 -4 -6 2 Z"/>'
            '<path class="aj-r" style="stroke-width:.5" d="M-4 -3 C-9 -7 -15 -9 -21 -11 M-5 -1 C-10 -3 -14 -4 -18 -5"/>')

def fej(arc):
    """fej a nyaknál (0,0) – arc: 'boldog' (repülő) vagy 'futyul' (ülő)"""
    out = ['<ellipse cx="0" cy="-27" rx="13" ry="5" fill="url(#aj-glor)"/>',
           '<circle class="aj-v" cx="0" cy="-11" r="11" fill="url(#aj-abor)" style="stroke-width:1.3"/>']
    for x, y, r in [(-9, -16, 4.2), (-5, -20, 4.6), (0, -21.5, 4.8), (5, -20, 4.6), (9, -16, 4.2), (-10.5, -11, 3.2), (10.5, -11, 3.2)]:
        out.append(f'<circle class="aj-v" cx="{x}" cy="{y}" r="{r}" fill="url(#aj-haj)" style="stroke-width:.9"/>')
        out.append(f'<path fill="none" stroke="#9a6b1c" stroke-width=".6" d="M{f1(x - r * .4)} {f1(y + .4)} a{f1(r * .45)} {f1(r * .45)} 0 1 1 {f1(r * .6)} {f1(r * .3)}"/>')
    out.append('<path fill="url(#aj-haj)" d="M-6 -14 C-3 -17 3 -17 6 -14 C4 -15.5 -4 -15.5 -6 -14 Z"/>')
    if arc == "futyul":
        out += ['<ellipse cx="-6" cy="-6.5" rx="3.4" ry="2.4" fill="url(#aj-pir)"/>', '<ellipse cx="6.5" cy="-6.5" rx="3.6" ry="2.6" fill="url(#aj-pir)"/>',
                '<path class="aj-szem" d="M-7.5 -10.5 C-6.5 -12.6 -4.5 -12.6 -3.5 -10.5 M3.5 -10.5 C4.5 -12.6 6.5 -12.6 7.5 -10.5"/>',
                '<path class="aj-r" style="stroke-width:.55" d="M-8 -14 C-6.5 -15 -4.5 -15 -3 -14.2 M3 -14.2 C4.5 -15 6.5 -15 8 -14"/>',
                '<ellipse class="aj-v" cx="2.4" cy="-4.8" rx="1.7" ry="1.9" fill="#b8443a" style="stroke-width:.7"/>',
                '<ellipse cx="2.4" cy="-4.8" rx=".7" ry=".8" fill="#5a1a14"/>']
    else:
        out += ['<ellipse cx="-6" cy="-6.5" rx="3" ry="2.1" fill="url(#aj-pir)"/>', '<ellipse cx="6" cy="-6.5" rx="3" ry="2.1" fill="url(#aj-pir)"/>',
                '<path class="aj-szem" d="M-7.5 -10.5 C-6.5 -13 -4.5 -13 -3.5 -10.5 M3.5 -10.5 C4.5 -13 6.5 -13 7.5 -10.5"/>',
                '<path class="aj-v" fill="#b8443a" style="stroke-width:.7" d="M-3.5 -5.5 C-2 -2.5 2 -2.5 3.5 -5.5 Z"/>']
    out.append('<ellipse cx="0" cy="-27" rx="9" ry="2.6" fill="none" stroke="url(#aj-arany)" stroke-width="2"/>')
    out.append('<path fill="none" stroke="#fff6cf" stroke-width=".7" opacity=".9" d="M-6 -28.4 C-3 -29.4 3 -29.4 6 -28.4"/>')
    return "".join(out)

def kar(v, e, h):
    return (f'<path class="aj-v" fill="url(#aj-kontos)" style="stroke-width:1.2" d="{kapszula(v, e, 3.6, 3.2)}"/>'
            f'<path class="aj-v" fill="url(#aj-kontos)" style="stroke-width:1.2" d="{kapszula(e, h, 3.2, 2.6)}"/>'
            f'<circle class="aj-v" cx="{f1(h[0])}" cy="{f1(h[1])}" r="3" fill="url(#aj-abor)" style="stroke-width:1"/>')

def talp(x, y, tukor=1):
    return f'<path class="aj-v" fill="url(#aj-abor)" style="stroke-width:1" d="M{x} {y} c{-2 * tukor} 0 {-4 * tukor} 2 {-3 * tukor} 4 c{2 * tukor} 1 {5 * tukor} 0 {6 * tukor} -2 z"/>'

def kontos_repulo():
    return ('<path class="aj-v" fill="url(#aj-kontos)" style="stroke-width:1.4" d="M-8 -30 C-12 -18 -15 -2 -17 18 C-12 21 -8 18 -5 21 C-2 18 2 21 5 18 C8 21 12 18 17 19 C15 -2 12 -18 8 -30 C3 -33 -3 -33 -8 -30 Z"/>'
            '<path class="aj-v" fill="url(#aj-arany)" style="stroke-width:.7" d="M-17 18 C-12 21 -8 18 -5 21 C-2 18 2 21 5 18 C8 21 12 18 17 19 L16.6 16 C12 15 8 18 5 15 C2 18 -2 15 -5 18 C-8 15 -12 18 -16.5 15 Z"/>'
            '<path class="aj-v" fill="url(#aj-arany)" style="stroke-width:.7" d="M-9 -9 C-3 -7 3 -7 9 -9 L9.6 -6 C3 -4 -3 -4 -9.6 -6 Z"/>'
            '<path class="aj-f" d="M-4 -5 C-6 4 -8 10 -10 16 M2 -4 C2 4 3 10 3 15 M7 -5 C9 3 11 9 12 15 M-6 -26 C-7 -18 -8 -12 -8 -9"/>'
            '<path fill="none" stroke="url(#aj-arany)" stroke-width="1.6" d="M-5 -31 C-2 -28 2 -28 5 -31"/>')

# ---------- kirepülő angyal: elölnézet, szétterített csapkodó szárnyak, karok előre-fel ----------
REPULO_ANGYAL = (
    f'<g transform="translate(-3 -24)"><g id="szb">{szarny()}</g></g>'
    f'<g transform="translate(3 -24) scale(-1 1)"><g id="szj">{szarny()}</g></g>'
    + talp(-4, 21) + talp(4, 21, -1)
    + kontos_repulo()
    + kar((-7, -27), (-16, -22), (-20, -31))
    + f'<g transform="translate(0 -31)">{fej("boldog")}</g>'
    + kar((7, -27), (16, -22), (21, -31))
)

# ---------- felhőn ülő angyal: elölnézet, a köntös ráterül a felhőre, a lábak lógnak, csücsörítve fütyül ----------
KOTA = ('<path d="M0 0 C-5 -1 -9 3 -7 7 C-5 11 3 10 5 5 L5 -22 C10 -18 16 -16 18 -9" style="fill:none"/>'
        '<ellipse cx="-1" cy="4" rx="6.5" ry="4.6" transform="rotate(-20 -1 4)"/>')
def lab(x, irany):
    terd, boka = (x, 9), (x + irany * .6, 22)
    return (f'<path class="aj-v" fill="url(#aj-abor)" style="stroke-width:1.1" d="{kapszula(terd, boka, 3.1, 2.5)}"/>'
            + talp(boka[0] + irany * 1.4, boka[1] + 1.2, irany))
ULO_ANGYAL = (
    f'<g id="ulo-szarny"><g transform="translate(-3 -24) rotate(26)"><g>{szarny()}</g></g><g transform="translate(3 -24) scale(-1 1) rotate(26)"><g>{szarny()}</g></g></g>'
    f'<g id="labb">{lab(-5, -1)}</g><g id="labj">{lab(5, 1)}</g>'
    '<path class="aj-v" fill="url(#aj-kontos)" style="stroke-width:1.4" d="M-8 -30 C-12 -20 -13 -10 -14 0 C-17 4 -17 9 -13 11 C-6 14 6 14 13 11 C17 9 17 4 14 0 C13 -10 12 -20 8 -30 C3 -33 -3 -33 -8 -30 Z"/>'
    '<path class="aj-v" fill="url(#aj-arany)" style="stroke-width:.7" d="M-13 11 C-6 14 6 14 13 11 L13.4 8.4 C6 11.4 -6 11.4 -13.4 8.4 Z"/>'
    '<path class="aj-v" fill="url(#aj-arany)" style="stroke-width:.7" d="M-9.4 -9 C-3 -7 3 -7 9.4 -9 L10 -6 C3 -4 -3 -4 -10 -6 Z"/>'
    '<path class="aj-f" d="M-5 -3 C-7 1 -8 5 -9 9 M0 -3 C0 2 0 6 0 10 M5 -3 C7 1 8 5 9 9 M-6 -26 C-7 -18 -8 -12 -8 -9 M-11 2 C-9 5 -7 7 -5 8 M11 2 C9 5 7 7 5 8"/>'
    '<path fill="none" stroke="url(#aj-arany)" stroke-width="1.6" d="M-5 -31 C-2 -28 2 -28 5 -31"/>'
    + kar((-7, -27), (-13, -15), (-15.5, -3)) + kar((7, -27), (13, -15), (15.5, -3))
    + '<g id="fej"><g transform="translate(0 -31)">' + fej("futyul")
    + "".join(f'<g transform="translate(4.6 -4.6) scale(.5)"><g class="kota" style="animation-delay:{d}s">{KOTA}</g></g>' for d in (0, .87, 1.73))
    + '</g></g>'
)

# ---------- felhő: színátmenetes gomolyok, körvonal, vésett árnyékolás alul, csillanó peremek ----------
KORO = [(-150, 10, 52), (-92, -26, 66), (-20, -46, 74), (58, -32, 66), (124, -4, 56), (172, 22, 40), (-190, 30, 36),
        (-110, 40, 46), (-30, 44, 50), (50, 42, 50), (126, 38, 44)]
def felho_rajz(azon):
    kulso = "".join(f'<circle class="fv-k" cx="{x}" cy="{y}" r="{r}"/>' for x, y, r in KORO)
    belso = "".join(f'<circle class="fv-b" cx="{x}" cy="{y}" r="{r}"/>' for x, y, r in KORO)
    klip = "".join(f'<circle cx="{x}" cy="{y}" r="{r}"/>' for x, y, r in KORO)
    # vésett, finoman hullámzó árnyékvonalak a felhő alján
    vonal = []
    for i, y in enumerate(range(28, 96, 7)):
        hossz = 1 - (96 - y) / 120
        vonal.append(f'M{-240 + i * 3} {y} C{-120} {y - 4} {-40} {y + 4} {40} {y - 2} C{110} {y - 6} {170} {y + 3} {230} {y - 1}')
    # gomolyhatárok: a felső gomolyok alsó íve (térfogat)
    iv = []
    for x, y, r in [(-92, -26, 66), (-20, -46, 74), (58, -32, 66), (124, -4, 56), (-150, 10, 52)]:
        a1, a2 = math.radians(115), math.radians(165)
        iv.append(f'M{f1(x + r * math.cos(a1) * .92)} {f1(y + r * math.sin(a1) * .92)} A{f1(r * .92)} {f1(r * .92)} 0 0 1 {f1(x + r * math.cos(a2) * .92)} {f1(y + r * math.sin(a2) * .92)}')
    # csillanások a gomolyok bal felső peremén
    cs = []
    for x, y, r in [(-92, -26, 66), (-20, -46, 74), (58, -32, 66), (124, -4, 56), (-150, 10, 52)]:
        a1, a2 = math.radians(200), math.radians(250)
        cs.append(f'M{f1(x + r * math.cos(a1) * .84)} {f1(y + r * math.sin(a1) * .84)} A{f1(r * .84)} {f1(r * .84)} 0 0 1 {f1(x + r * math.cos(a2) * .84)} {f1(y + r * math.sin(a2) * .84)}')
    return (f'<clipPath id="{azon}">{klip}</clipPath>'
            f'<g>{kulso}{belso}</g>'
            f'<g clip-path="url(#{azon})"><path class="fv-h" d="{" ".join(vonal)}"/></g>'
            f'<path class="fv-a" d="{" ".join(iv)}"/>'
            f'<path class="fv-c" d="{" ".join(cs)}"/>')
