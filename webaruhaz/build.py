# A webáruház index.html-jének előállítása: a forras-index.html-be beágyazza a data/products.json-t
# (tartalék adat arra az esetre, ha az api.php nem fut, pl. GitHub Pages-en).
# Használat a webaruhaz mappában:  python3 build.py
import json, os
d = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(d, 'forras-index.html'), encoding='utf-8').read()
seed = json.dumps(json.load(open(os.path.join(d, 'data', 'products.json'), encoding='utf-8')), ensure_ascii=False).replace('</', '<\\/')
# Az admin modul (a látogatók számára felesleges ~140 KB) külön fájlba kerül: admin.js + admin.css,
# és csak az #admin oldal megnyitásakor töltődik be (lásd adminBetolt() a forrásban).
# A forrásban marad minden a helyén – csak a kimenet bomlik szét.
import hashlib
def kivag(s, eleje, vege, vegevel=True):
    i = s.find(eleje)
    if i < 0: return s, None
    j = s.find(vege, i + len(eleje))
    if j < 0: return s, None
    if vegevel: j += len(vege)
    return s[:i] + s[j:], s[i:j]
src, adm = kivag(src, '/* ================= ADMIN ================= */', '/* ================= útválasztás ================= */', False)
src, sugo_css = kivag(src, '<style id="admin-sugo">', '</style>')
src, sugo_js = kivag(src, '<script id="admin-sugo-js">', '</script>')
if adm:
    js = '"use strict";\n/* GENERÁLT FÁJL – ne szerkessze! Forrás: forras-index.html (ADMIN szakasz + admin-sugo-js); készíti: build.py */\n' + adm
    if sugo_js: js += '\n' + sugo_js[len('<script id="admin-sugo-js">'):-len('</script>')]
    css = '/* GENERÁLT FÁJL – ne szerkessze! Forrás: forras-index.html (admin-sugo); készíti: build.py */\n' + (sugo_css[len('<style id="admin-sugo">'):-len('</style>')] if sugo_css else '')
    ver = hashlib.sha1((js + css).encode('utf-8')).hexdigest()[:10]
    open(os.path.join(d, 'admin.js'), 'w', encoding='utf-8').write(js)
    open(os.path.join(d, 'admin.css'), 'w', encoding='utf-8').write(css)
    src = src.replace('__ADMIN_VER__', ver)
    print('Kész: webaruhaz/admin.js, admin.css (v=%s)' % ver)
else:
    print('FIGYELEM: az ADMIN szakasz jelölője nem található – az admin a főoldalban marad.')
out = src.replace('/*SEED*/', seed)
if not out.lstrip().startswith('<!doctype'):
    out = ('<!doctype html>\n<html lang="hu">\n<head>\n<meta charset="utf-8">\n'
           '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
           + out.replace('</style>\n', '</style>\n</head>\n<body>\n', 1) + '\n</body>\n</html>\n')
open(os.path.join(d, 'index.html'), 'w', encoding='utf-8').write(out)
print('Kész: webaruhaz/index.html')
