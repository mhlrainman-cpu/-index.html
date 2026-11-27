#!/usr/bin/env node
/* 네이버·빙 등에 색인을 즉시 요청합니다 (IndexNow 규약). 로그인이 필요 없습니다.
   구글은 IndexNow 를 지원하지 않으므로, 구글은 서치콘솔에서 따로 요청해야 합니다.

   사용법: node tools/indexnow.js            # sitemap.xml 의 모든 주소 제출
           node tools/indexnow.js <주소> ... # 지정한 주소만 제출

   준비물: data/config.js 의 indexNowKey 와, 같은 이름의 .txt 파일이 japan/ 에 공개되어 있어야 합니다.
   키 파일이 japan/ 안에 있으므로 japan/ 아래 주소만 제출할 수 있습니다. */
const fs = require('fs'), path = require('path');
const ROOT = path.dirname(__dirname);
const G = {};
const src = fs.readFileSync(path.join(ROOT, 'data/config.js'), 'utf8');
new Function('G', src + ';Object.assign(G,{CONFIG})')(G);
const { indexNowKey: KEY, siteUrl } = G.CONFIG;
const SITE = (siteUrl || '').replace(/\/$/, '');
if (!KEY || !SITE) { console.error('data/config.js 의 indexNowKey 와 siteUrl 을 먼저 채우세요.'); process.exit(1); }
const host = new URL(SITE).host;
const keyLocation = `${SITE}/${KEY}.txt`;

function urlsFromSitemap() {
  const f = path.join(ROOT, 'sitemap.xml');
  if (!fs.existsSync(f)) { console.error('sitemap.xml 이 없습니다. node tools/build_pages.js 를 먼저 실행하세요.'); process.exit(1); }
  return [...fs.readFileSync(f, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
}

(async () => {
  const urlList = process.argv.slice(2).length ? process.argv.slice(2) : urlsFromSitemap();
  const bad = urlList.filter(u => !u.startsWith(SITE + '/'));
  if (bad.length) { console.error('키 파일 위치(' + SITE + '/) 밖의 주소는 제출할 수 없습니다:\n  ' + bad.join('\n  ')); process.exit(1); }

  // 1) 키 파일이 실제로 공개되어 있는지 먼저 확인 (202 응답은 성공을 보장하지 않음)
  const probe = await fetch(keyLocation).catch(() => null);
  const body = probe && probe.ok ? (await probe.text()).trim() : null;
  if (body !== KEY) {
    console.error(`키 파일 확인 실패: ${keyLocation}\n  상태 ${probe ? probe.status : '연결 실패'}, 내용 "${body ?? ''}" (기대값 "${KEY}")`);
    console.error('  배포가 끝난 뒤 다시 실행하세요.');
    process.exit(1);
  }
  console.log(`키 파일 확인 ✓  ${keyLocation}`);

  // 2) 제출
  const payload = { host, key: KEY, keyLocation, urlList };
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });
  const text = await res.text().catch(() => '');
  console.log(`제출 ${urlList.length}건 → HTTP ${res.status} ${text.slice(0, 200)}`);
  if (res.status === 200 || res.status === 202) {
    console.log('접수되었습니다. 네이버·빙 등 참여 검색엔진에 전달됩니다.');
    console.log('반영에는 보통 수시간~수일이 걸립니다. 구글은 별도로 서치콘솔에서 요청하세요.');
  } else if (res.status === 403) {
    console.error('키가 거부되었습니다. 키 파일 내용과 위치를 확인하세요.');
  } else if (res.status === 422) {
    console.error('주소 또는 키 위치가 올바르지 않습니다.');
  } else if (res.status === 429) {
    console.error('요청이 너무 잦습니다. 시간을 두고 다시 시도하세요.');
  }
  for (const u of urlList) console.log('  ' + u);
})();
