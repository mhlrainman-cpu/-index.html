#!/usr/bin/env python3
"""fetch2.py 가 받은 사진(work/img)과 크레딧(work/credits.json)을 japan/img, japan/data/images.js 로 정리한다.
사용법: python3 finalize_images.py <work 폴더>"""
import json, os, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from manifest2 import ITEMS
W = sys.argv[1]
cred = json.load(open(os.path.join(W, 'credits.json')))
os.makedirs(os.path.join(ROOT, 'img'), exist_ok=True)
have = {k for k in cred if os.path.exists(os.path.join(W, 'img', k + '.webp'))}
for k in have: shutil.copy2(os.path.join(W, 'img', k + '.webp'), os.path.join(ROOT, 'img', k + '.webp'))
imgmap = {}
for r, cats in ITEMS.items():
    for cat, lst in cats.items():
        for i, v in enumerate(lst):
            key = f'{r}-{cat}{i}'
            if isinstance(v, list): tgt = key
            elif v[0] == 'dish': tgt = 'dish-' + v[1]
            else: tgt = f'{r}-{v[1]}'  # alias: 같은 지역의 다른 항목
            if tgt in have: imgmap[key] = tgt
imgcred = {k: {x: cred[k][x] for x in ('title', 'page', 'license', 'license_url', 'artist')} for k in sorted(have)}
js = '/* 사진 목록과 출처. tools/finalize_images.py 가 생성합니다. */\nconst IMGMAP = ' + json.dumps(imgmap, ensure_ascii=False, separators=(',', ':')) + ';\nconst IMGCRED = ' + json.dumps(imgcred, ensure_ascii=False, separators=(',', ':')) + ';\n'
open(os.path.join(ROOT, 'data', 'images.js'), 'w', encoding='utf-8').write(js)
print(len(have), 'images,', len(imgmap), 'item mappings')
