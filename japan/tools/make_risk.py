#!/usr/bin/env python3
"""data/jshis.json(tools/jshis_fetch.py 결과)을 화면용 data/risk.js 로 변환한다.
현 값 = 대표 지점 평균, 도시 값 = 그 도시 지점 값. 단위: %(30년 내 진도 6약 이상)"""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
d = json.load(open(os.path.join(ROOT, 'data', 'jshis.json'), encoding='utf-8'))
CITY = {'sapporo':('hokkaido','삿포로'),'hakodate':('hokkaido','하코다테'),'nagasaki':('nagasaki','나가사키'),'fukuoka':('fukuoka','후쿠오카'),
 'okinawa':('okinawa','나하'),'beppu':('oita','벳푸'),'kanazawa':('ishikawa','가나자와'),'kyoto':('kyoto','교토'),'hiroshima':('hiroshima','히로시마'),
 'kobe':('hyogo','고베'),'osaka':('osaka','오사카'),'tokyo':('tokyo','도쿄'),'nagoya':('aichi','나고야')}
pref, city = {}, {}
for pid, rows in d['items'].items():
    pts = [[r['name'], round(r['i55'] * 100, 1)] for r in rows]
    pref[pid] = {'p': round(sum(p for _, p in pts) / len(pts), 1), 'pts': pts}
for cid, (pid, name) in CITY.items():
    p = next(p for n, p in pref[pid]['pts'] if n == name)
    city[cid] = {'p': p, 'pt': name}
js = ('/* 장기 지진 위험: J-SHIS(방재과학기술연구소) %s 확률론적 지진동 예측 지도, 평균 케이스·전 지진, 30년 내 진도 6약 이상 확률(%%).\n'
      '   tools/jshis_fetch.py → tools/make_risk.py 로 생성합니다. 현 값은 대표 지점 평균입니다. */\n' % d['version'])
js += 'const RISK = ' + json.dumps({'version': d['version'], 'pref': pref, 'city': city}, ensure_ascii=False, separators=(',', ':')) + ';\n'
open(os.path.join(ROOT, 'data', 'risk.js'), 'w', encoding='utf-8').write(js)
print(len(pref), 'prefectures,', len(city), 'cities')
for k, v in sorted(city.items(), key=lambda kv: kv[1]['p']): print(f"  {k:10s} {v['p']:5.1f}%  ({v['pt']})")
