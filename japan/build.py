#!/usr/bin/env python3
"""안심재팬 빌드 스크립트.

1) api.p2pquake.net 에서 최근 지진 100건을 받아 index.html 의 SNAPSHOT 에 심습니다.
   (실시간 API 에 접근할 수 없는 환경에서도 최근 자료가 보이도록 하는 백업 데이터)
2) dist/artifact.html : claude.ai 아티팩트용 (doctype/html/head 래퍼 제거본)

사용법:  python3 build.py            # 스냅샷 갱신 + dist 생성
         python3 build.py --no-fetch # 네트워크 없이 dist 만 생성
"""
import json, re, sys, os, urllib.request, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "index.html")
DIST = os.path.join(HERE, "dist")
API = "https://api.p2pquake.net/v2/history?codes=551&limit=100"

ADDR_KEYS = ("札幌", "函館")  # 현 단위가 아니라 시 단위로 매칭하는 지역

def compact_points(points):
    """관측점 목록을 현(pref)별 최대 진도로 압축. 札幌/函館 은 주소 단위로 따로 보존."""
    best = {}
    for p in points:
        key = p.get("pref", "")
        addr = p.get("addr", "")
        for k in ADDR_KEYS:
            if addr.startswith(k):
                key = k
        best[key] = max(best.get(key, 0), p.get("scale", 0))
    return [[k, v] for k, v in best.items()]

def fetch_snapshot():
    try:
        with urllib.request.urlopen(API, timeout=20) as r:
            data = json.load(r)
    except Exception:
        import subprocess  # 프록시 환경 등에서 urllib 이 막히면 curl 로 재시도
        data = json.loads(subprocess.check_output(["curl", "-sS", "-m", "20", API]))
    out = []
    for q in data:
        e = q.get("earthquake") or {}
        h = e.get("hypocenter") or {}
        if not h.get("name"):
            continue
        out.append({
            "t": e.get("time"), "n": h.get("name"), "m": h.get("magnitude", -1),
            "d": h.get("depth", -1), "s": e.get("maxScale", -1), "ts": e.get("domesticTsunami", "Unknown"),
            "p": compact_points(q.get("points", [])),
        })
    jst = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9)))
    return {"at": jst.strftime("%Y/%m/%d %H:%M"), "list": out}

def main():
    html = open(SRC, encoding="utf-8").read()
    if "--no-fetch" not in sys.argv:
        snap = fetch_snapshot()
        js = json.dumps(snap, ensure_ascii=False, separators=(",", ":"))
        html, n = re.subn(r"const SNAPSHOT = \{.*?\};//END-SNAPSHOT", "const SNAPSHOT = " + js + ";//END-SNAPSHOT", html, flags=re.S)
        assert n == 1, "SNAPSHOT 마커를 찾지 못했습니다"
        open(SRC, "w", encoding="utf-8").write(html)
        print(f"snapshot: {len(snap['list'])}건, {snap['at']} JST")
    # artifact 버전: <title> 부터 </style> 까지 + body 내부
    m = re.search(r"(<title>.*?</style>)", html, re.S)
    body = re.search(r"<body>(.*)</body>", html, re.S).group(1)
    os.makedirs(DIST, exist_ok=True)
    open(os.path.join(DIST, "artifact.html"), "w", encoding="utf-8").write(m.group(1) + "\n" + body)
    print("dist/artifact.html 생성")

if __name__ == "__main__":
    main()
