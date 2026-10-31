# A webáruház index.html-jének előállítása: a forras-index.html-be beágyazza a data/products.json-t
# (tartalék adat arra az esetre, ha az api.php nem fut, pl. GitHub Pages-en).
# Használat a webaruhaz mappában:  python3 build.py
import json, os
d = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(d, 'forras-index.html'), encoding='utf-8').read()
seed = json.dumps(json.load(open(os.path.join(d, 'data', 'products.json'), encoding='utf-8')), ensure_ascii=False).replace('</', '<\\/')
out = src.replace('/*SEED*/', seed)
if not out.lstrip().startswith('<!doctype'):
    out = ('<!doctype html>\n<html lang="hu">\n<head>\n<meta charset="utf-8">\n'
           '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
           + out.replace('</style>\n', '</style>\n</head>\n<body>\n', 1) + '\n</body>\n</html>\n')
open(os.path.join(d, 'index.html'), 'w', encoding='utf-8').write(out)
print('Kész: webaruhaz/index.html')
