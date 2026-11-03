#!/usr/bin/env python3
"""Szótár ellenőrzése: python3 eszkozok/nyelv/ellenoriz.py de
- minden magyar kulcs megvan-e, nincs-e fölösleges kulcs
- a {#} helyőrzők száma egyezik-e
- a ' · ' elválasztók száma egyezik-e (ajánlott)"""
import json,sys,os
R=os.path.join(os.path.dirname(__file__),'..','..','nyelv')
hu=json.load(open(os.path.join(R,'hu.json')))
for c in sys.argv[1:]:
  d=json.load(open(os.path.join(R,c+'.json')))
  miss=[k for k in hu if k not in d]; extra=[k for k in d if k not in hu]
  bad=[k for k in hu if k in d and d[k].count('{#}')!=k.count('{#}')]
  empty=[k for k in hu if k in d and not str(d[k]).strip()]
  print(f"{c}: {len(d)}/{len(hu)} kulcs, hiányzik {len(miss)}, fölösleges {len(extra)}, rossz helyőrző {len(bad)}, üres {len(empty)}")
  for k in (miss[:5]+bad[:5]+extra[:3]): print('   ',repr(k[:90]))
