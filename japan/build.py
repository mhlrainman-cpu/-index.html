#!/usr/bin/env python3
"""안심재팬 빌드 스크립트.

  python3 build.py             # 최근 지진 저장 자료 갱신 + index.html, dist/artifact.html 생성
  python3 build.py --no-fetch  # 네트워크 없이 조립만

구성
  src/template.html   화면 뼈대. /*@INC 경로*/ 자리에 파일 내용을 끼워 넣습니다.
  src/style.css       스타일(페이퍼로지 서체 선언 포함)
  src/app.js          화면 동작
  data/*.js           지역·지도·번역·약관·제휴 ID·사진 목록, 저장된 최근 지진(snapshot.js, 자동 생성)
  img/, fonts/        사진(webp)과 서체(woff2)

결과
  index.html          GitHub Pages 등 어디서나 열리는 완성본 (img/, fonts/ 를 상대 경로로 읽음)
  dist/artifact.html  claude.ai 아티팩트용 (서체를 파일 안에 포함, 사진은 img/ 를 함께 게시)
"""
import base64, datetime, json, os, re, subprocess, sys, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
P = lambda *a: os.path.join(HERE, *a)
API = "https://api.p2pquake.net/v2/history?codes=551&limit=100"
ADDR_KEYS = ("札幌", "函館")  # 현 단위가 아니라 시 단위로도 보존하는 지역


def compact_points(points):
    """관측점 목록을 현별 최대 진도로 압축. 札幌/函館 은 주소 단위로 따로 보존."""
    best = {}
    for p in points:
        key, addr = p.get("pref", ""), p.get("addr", "")
        for k in ADDR_KEYS:
            if addr.startswith(k):
                key = k
        best[key] = max(best.get(key, 0), p.get("scale", 0))
    return [[k, v] for k, v in best.items()]


def fetch_snapshot():
    try:
        with urllib.request.urlopen(API, timeout=20) as r:
            data = json.load(r)
    except Exception:  # 프록시 환경 등에서 urllib 이 막히면 curl 로 재시도
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
            "la": h.get("latitude", -200), "lo": h.get("longitude", -200),
            "p": compact_points(q.get("points", [])),
        })
    jst = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9)))
    return {"at": jst.strftime("%Y/%m/%d %H:%M"), "list": out}


def assemble():
    tpl = open(P("src", "template.html"), encoding="utf-8").read()

    def inc(m):
        path = P(*m.group(1).split("/"))
        if not os.path.exists(path):
            if m.group(1) == "data/images.js":
                return "const IMGMAP = {}; const IMGCRED = {};"
            raise SystemExit("누락: " + m.group(1))
        return open(path, encoding="utf-8").read().rstrip()

    return re.sub(r"/\*@INC (\S+)\*/", inc, tpl)


def to_artifact(html):
    """서체를 data URI 로 포함하고, 아티팩트 래퍼가 붙일 <head> 부분을 제거한다."""
    def font(m):
        f = P(*m.group(1).split("/"))
        b64 = base64.b64encode(open(f, "rb").read()).decode()
        return "url(data:font/woff2;base64," + b64 + ")"
    html = re.sub(r"url\((fonts/[^)]+\.woff2)\)", font, html)
    head = re.search(r"(<title>.*?</style>)", html, re.S).group(1)
    body = re.search(r"<body>(.*)</body>", html, re.S).group(1)
    return head + "\n" + body


def main():
    if "--no-fetch" not in sys.argv:
        snap = fetch_snapshot()
        js = "/* 최근 지진 저장 자료: build.py 가 갱신합니다. 실시간 연결이 막힌 환경에서 사용됩니다. */\nconst SNAPSHOT = " + \
             json.dumps(snap, ensure_ascii=False, separators=(",", ":")) + ";\n"
        open(P("data", "snapshot.js"), "w", encoding="utf-8").write(js)
        print(f"snapshot: {len(snap['list'])}건, {snap['at']} JST")
    elif not os.path.exists(P("data", "snapshot.js")):
        open(P("data", "snapshot.js"), "w", encoding="utf-8").write('const SNAPSHOT = {"at":"","list":[]};\n')
    html = assemble()
    open(P("index.html"), "w", encoding="utf-8").write(html)
    os.makedirs(P("dist"), exist_ok=True)
    art = to_artifact(html)
    open(P("dist", "artifact.html"), "w", encoding="utf-8").write(art)
    print(f"index.html {len(html)//1024}KB, dist/artifact.html {len(art)//1024}KB")


if __name__ == "__main__":
    main()
