#!/usr/bin/env python3
"""J-SHIS(방재과학기술연구소) 확률론적 지진동 예측 지도에서 현별 대표 지점의
'30년 내 진도 6약 이상 확률'(T30_I55_PS)을 받아 data/jshis.json 으로 저장한다.
출처: 防災科学技術研究所 J-SHIS 地震ハザードステーション (Y2023, 平均ケース, 全地震)
사용법: python3 jshis_fetch.py"""
import json, os, sys, time, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
VER = 'Y2023'
URL = 'https://www.j-shis.bosai.go.jp/map/api/pshm/%s/AVR/TTL_MTTL/meshinfo.geojson?position=%s,%s&epsg=4326'
# 현 id -> 대표 지점 [(이름, 위도, 경도)]: 현청 소재지 + 주요 여행 도시
PTS = {
 'hokkaido':[('삿포로',43.06,141.35),('하코다테',41.77,140.73),('구시로',42.98,144.38),('오비히로',42.92,143.20)],
 'aomori':[('아오모리',40.82,140.74),('하치노헤',40.51,141.49)],
 'iwate':[('모리오카',39.70,141.15),('미야코',39.64,141.96)],
 'miyagi':[('센다이',38.27,140.87),('이시노마키',38.43,141.30)],
 'akita':[('아키타',39.72,140.10)],
 'yamagata':[('야마가타',38.24,140.33)],
 'fukushima':[('후쿠시마',37.75,140.47),('이와키',37.05,140.89)],
 'ibaraki':[('미토',36.34,140.45)],
 'tochigi':[('우쓰노미야',36.57,139.88),('닛코',36.75,139.60)],
 'gunma':[('마에바시',36.39,139.06)],
 'saitama':[('사이타마',35.86,139.65)],
 'chiba':[('지바',35.61,140.12)],
 'tokyo':[('도쿄',35.69,139.69)],
 'kanagawa':[('요코하마',35.45,139.64),('하코네',35.23,139.11)],
 'niigata':[('니가타',37.90,139.02)],
 'toyama':[('도야마',36.70,137.21)],
 'ishikawa':[('가나자와',36.59,136.63)],
 'fukui':[('후쿠이',36.07,136.22)],
 'yamanashi':[('고후',35.66,138.57)],
 'nagano':[('나가노',36.65,138.18),('마쓰모토',36.24,137.97)],
 'gifu':[('기후',35.42,136.76)],
 'shizuoka':[('시즈오카',34.98,138.38),('하마마쓰',34.71,137.73)],
 'aichi':[('나고야',35.18,136.91)],
 'mie':[('쓰',34.73,136.51),('이세',34.49,136.71)],
 'shiga':[('오쓰',35.00,135.87)],
 'kyoto':[('교토',35.01,135.77)],
 'osaka':[('오사카',34.69,135.50)],
 'hyogo':[('고베',34.69,135.20)],
 'nara':[('나라',34.69,135.83)],
 'wakayama':[('와카야마',34.23,135.17)],
 'tottori':[('돗토리',35.50,134.24)],
 'shimane':[('마쓰에',35.47,133.05)],
 'okayama':[('오카야마',34.66,133.93)],
 'hiroshima':[('히로시마',34.39,132.46)],
 'yamaguchi':[('야마구치',34.19,131.47)],
 'tokushima':[('도쿠시마',34.07,134.56)],
 'kagawa':[('다카마쓰',34.34,134.04)],
 'ehime':[('마쓰야마',33.84,132.77)],
 'kochi':[('고치',33.56,133.53)],
 'fukuoka':[('후쿠오카',33.59,130.40)],
 'saga':[('사가',33.25,130.30)],
 'nagasaki':[('나가사키',32.75,129.88)],
 'kumamoto':[('구마모토',32.79,130.74)],
 'oita':[('오이타',33.24,131.61),('벳푸',33.28,131.49)],
 'miyazaki':[('미야자키',31.91,131.42)],
 'kagoshima':[('가고시마',31.56,130.56)],
 'okinawa':[('나하',26.21,127.68)],
}

def get(lat, lon):
    for i in range(4):
        try:
            with urllib.request.urlopen(URL % (VER, lon, lat), timeout=30) as r:
                d = json.load(r)
            p = d['features'][0]['properties']
            return {'i55': float(p['T30_I55_PS']), 'i60': float(p['T30_I60_PS']), 'i50': float(p['T30_I50_PS']), 'mesh': d['metaData']['meshcode']}
        except Exception as e:
            time.sleep(2 + i * 2)
    return None

out = {'version': VER, 'items': {}}
for pid, pts in PTS.items():
    rows = []
    for name, lat, lon in pts:
        v = get(lat, lon); time.sleep(0.5)
        if v: rows.append(dict(name=name, lat=lat, lon=lon, **v))
        print(pid, name, None if not v else round(v['i55'] * 100, 1), flush=True)
    out['items'][pid] = rows
json.dump(out, open(os.path.join(ROOT, 'data', 'jshis.json'), 'w'), ensure_ascii=False, indent=1)
print('saved', sum(len(v) for v in out['items'].values()), 'points')
