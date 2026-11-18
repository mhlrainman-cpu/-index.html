#!/usr/bin/env python3
"""위키백과 문서 대표 사진을 묶음 요청으로 조회하고, 커먼즈 라이선스를 확인해 내려받는다.
허용: CC0, 퍼블릭 도메인, CC BY, CC BY-SA(작가·라이선스 표기 저장). 비자유 사진(로컬 업로드)은 제외."""
import json, os, re, sys, time, io, html, urllib.parse, urllib.request, urllib.error
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from manifest2 import HERO, ITEMS, DISH
from PIL import Image, ImageOps

BASE = sys.argv[1]; OUT = os.path.join(BASE, 'img'); os.makedirs(OUT, exist_ok=True)
CACHE = os.path.join(BASE, 'cache.json')
UA = 'AnshinJapanImageFetcher/1.0 (travel info app; low-volume)'
OKLIC = re.compile(r'^(CC0|Public domain|PD|CC BY(?!-NC)(?!-ND)|CC BY-SA)', re.I)
BAD = re.compile(r'(map|logo|flag|diagram|locator|route|poster|screenshot|collage|montage|ticket|stamp|icon|symbol)', re.I)
last = [0.0]

def http(url, binary=False, gap=4.0, tries=8):
    for i in range(tries):
        w = gap - (time.time() - last[0])
        if w > 0: time.sleep(w)
        last[0] = time.time()
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=45) as r:
                d = r.read(); return d if binary else json.loads(d)
        except urllib.error.HTTPError as e:
            if e.code in (429, 503):
                ra = int(e.headers.get('Retry-After', '30') or 30); print('  throttled', ra, flush=True)
                time.sleep(max(ra, 120) + 5); last[0] = time.time(); continue
            if e.code == 404: return None
            time.sleep(3)
        except Exception as ex:
            print('  err', repr(ex)[:80], flush=True); time.sleep(4)
    return None

def strip(s): return html.unescape(re.sub(r'<[^>]+>', '', s or '')).strip()

def chunks(l, n):
    for i in range(0, len(l), n): yield l[i:i+n]

def main():
    cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {}
    titles = set(sum(HERO.values(), []) + sum(DISH.values(), []))
    for cats in ITEMS.values():
        for lst in cats.values():
            for v in lst:
                if isinstance(v, list): titles |= set(v)
    titles = sorted(titles)
    # 1) 문서 대표 사진
    pages = cache.get('pages', {})
    todo = [t for t in titles if t not in pages]
    for ch in chunks(todo, 40):
        q = {'action':'query','format':'json','prop':'pageimages','piprop':'original|thumbnail|name','pithumbsize':'960','redirects':'1','titles':'|'.join(ch)}
        d = http('https://en.wikipedia.org/w/api.php?' + urllib.parse.urlencode(q))
        if not d: continue
        qq = d.get('query', {})
        alias = {}
        for n in qq.get('normalized', []): alias[n['from']] = n['to']
        red = {r['from']: r['to'] for r in qq.get('redirects', [])}
        byt = {p['title']: p for p in qq.get('pages', {}).values()}
        for t in ch:
            tt = alias.get(t, t); tt = red.get(tt, tt)
            p = byt.get(tt, {})
            pages[t] = {'page': tt, 'file': p.get('pageimage'), 'thumb': (p.get('thumbnail') or {}).get('source'),
                        'ow': (p.get('original') or {}).get('width'), 'oh': (p.get('original') or {}).get('height')}
        cache['pages'] = pages; json.dump(cache, open(CACHE, 'w'), ensure_ascii=False)
        print('pageimages', len(pages), '/', len(titles), flush=True)
    # 2) 커먼즈 라이선스
    lic = cache.get('lic', {})
    files = sorted({v['file'] for v in pages.values() if v.get('file') and v.get('thumb') and '/wikipedia/commons/' in v['thumb']} - set(lic))
    for ch in chunks(files, 40):
        q = {'action':'query','format':'json','prop':'imageinfo','iiprop':'extmetadata|mime|url|size','titles':'|'.join('File:'+f for f in ch)}
        d = http('https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode(q))
        if not d: continue
        norm = {n['to']: n['from'] for n in d.get('query', {}).get('normalized', [])}
        for pg in d.get('query', {}).get('pages', {}).values():
            ii = (pg.get('imageinfo') or [None])[0]
            name = pg['title'][5:]
            if not ii: lic[name.replace(' ', '_')] = None; continue
            md = ii.get('extmetadata', {})
            lic[name.replace(' ', '_')] = {'mime': ii['mime'], 'license': strip(md.get('LicenseShortName', {}).get('value', '')),
              'license_url': strip(md.get('LicenseUrl', {}).get('value', '')), 'artist': strip(md.get('Artist', {}).get('value', ''))[:80] or 'Unknown',
              'page': ii['descriptionurl'], 'w': ii['width'], 'h': ii['height'], 'title': pg['title']}
        cache['lic'] = lic; json.dump(cache, open(CACHE, 'w'), ensure_ascii=False)
        print('licenses', len(lic), '/', len(files), flush=True)
    # 3) 후보 평가
    def ok(t, used, hero=False):
        p = pages.get(t);
        if not p or not p.get('file') or not p.get('thumb') or '/wikipedia/commons/' not in p['thumb']: return None
        key = p['file'].replace(' ', '_'); L = lic.get(key)
        if not L or L['mime'] != 'image/jpeg' or not OKLIC.match(L['license']): return None
        if BAD.search(key) or key in used: return None
        w, h = L['w'], L['h']
        if hero:
            if w < 1400 or not (1.2 <= w / h <= 2.2): return None
        elif w < 800 or not (0.7 <= w / h <= 2.6): return None
        th = p['thumb'].split('?')[0].replace('https://thumb.wikimedia.org/', 'https://upload.wikimedia.org/')
        return dict(L, file=key, thumb=th)
    chosen = {}; used = set(); missing = []
    def assign(key, cands):
        for t in cands:
            c = ok(t, used, key.endswith('-hero'))
            if c: used.add(c['file']); chosen[key] = dict(c, wp=t); return
        missing.append(key)
    for r, c in HERO.items(): assign(f'{r}-hero', c)
    for r, cats in ITEMS.items():
        for cat, lst in cats.items():
            for i, v in enumerate(lst):
                if isinstance(v, list): assign(f'{r}-{cat}{i}', v)
    for d, c in DISH.items(): assign(f'dish-{d}', c)
    print('chosen', len(chosen), 'missing', missing, flush=True)
    json.dump({'chosen': chosen, 'missing': missing}, open(os.path.join(BASE, 'chosen.json'), 'w'), ensure_ascii=False, indent=1)
    # 4) 내려받기
    cred = json.load(open(os.path.join(BASE, 'credits.json'))) if os.path.exists(os.path.join(BASE, 'credits.json')) else {}
    def prio(k):
        if k.endswith('-hero'): return 0
        if k.startswith('dish-'): return 2
        return {'s': 1, 't': 3, 'p': 4}.get(k.split('-')[1][0], 5)
    for key, c in sorted(chosen.items(), key=lambda kv: prio(kv[0])):
        dest = os.path.join(OUT, key + '.webp')
        if os.path.exists(dest) and key in cred: continue
        data = http(c['thumb'], binary=True, gap=60)
        if not data: print('DLFAIL', key, flush=True); continue
        im = ImageOps.exif_transpose(Image.open(io.BytesIO(data))).convert('RGB')
        W = 960 if key.endswith('-hero') else 720
        if im.width > W: im = im.resize((W, round(im.height * W / im.width)), Image.LANCZOS)
        if im.width / im.height > 2.0:
            nw = int(im.height * 2.0); x = (im.width - nw) // 2; im = im.crop((x, 0, x + nw, im.height))
        im.save(dest, 'WEBP', quality=72, method=6)
        cred[key] = {k: c[k] for k in ('title', 'page', 'license', 'license_url', 'artist', 'wp')}
        json.dump(cred, open(os.path.join(BASE, 'credits.json'), 'w'), ensure_ascii=False, indent=1)
        print('OK', key, c['title'][:55], '|', c['license'], flush=True)
    print('DONE', len(cred), flush=True)

main()
