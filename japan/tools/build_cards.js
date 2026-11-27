#!/usr/bin/env node
/* SNS 배포용 카드 생성 (인스타그램·스레드 1080x1350, 스토리 1080x1920).
   사용법: node tools/build_cards.js
   결과:   cards/rank.png(랭킹), cards/story.png(스토리), cards/<지역>.png(지역 카드 상위 3곳) */
const fs = require('fs'), path = require('path');
const ROOT = path.dirname(__dirname);
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const G = {};
for (const f of ['data/regions.js','data/prefs.js','data/risk.js','src/poster.js'])
  new Function('G', read(f) + '\n;Object.assign(G,{' + (read(f).match(/^(?:const|function)\s+([A-Za-z_$][\w$]*)/gm)||[]).map(m=>m.split(/\s+/)[1]).join(',') + '})')(G);
const { REGIONS, REGION_META, RISK, poster, HERO_MOTIF, REGION_HUE } = G;
REGIONS.forEach(r => Object.assign(r, REGION_META[r.id], { prob: RISK.city[r.id].p }));
const tierOf = p => p < 3 ? 1 : p < 10 ? 2 : p < 26 ? 3 : p < 50 ? 4 : 5;
const TIER = { 1:'낮음', 2:'다소 낮음', 3:'보통', 4:'다소 높음', 5:'높음' };
const COL = { 1:'#2f6fe4', 2:'#4b82e0', 3:'#6b7280', 4:'#d6303b', 5:'#b91c1c' };
const fmt = p => p >= 10 ? Math.round(p) + '%' : p.toFixed(1) + '%';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ranked = [...REGIONS].sort((a, b) => a.prob - b.prob);
const f2 = fs.readFileSync(path.join(ROOT, 'fonts/Paperlogy-2ExtraLight.woff2')).toString('base64');
const f4 = fs.readFileSync(path.join(ROOT, 'fonts/Paperlogy-4Regular.woff2')).toString('base64');
const today = new Date(); const ym = `${today.getFullYear()}년 ${today.getMonth() + 1}월`;
const BASE = `@font-face{font-family:P;font-weight:200;src:url(data:font/woff2;base64,${f2}) format('woff2')}
@font-face{font-family:P;font-weight:400;src:url(data:font/woff2;base64,${f4}) format('woff2')}
*{margin:0;box-sizing:border-box}body{font-family:P,sans-serif;color:#eaf0fa;background:#0b1220;position:relative;overflow:hidden}
.art{position:absolute;inset:0;width:100%;height:100%}`;

const rankRows = (n, big) => ranked.slice(0, n).map((r, i) => `
  <div class="row">
    <span class="no">${String(i + 1).padStart(2, '0')}</span>
    <span class="nm">${esc(r.name)}<em>${esc(r.jp)}</em></span>
    <span class="pr">${fmt(r.prob)}</span>
    <span class="tg" style="background:${COL[tierOf(r.prob)]}">${esc(TIER[tierOf(r.prob)])}</span>
  </div>`).join('');

const CARDS = [
  { name: 'rank', w: 1080, h: 1350, html: `<style>${BASE}
    body{width:1080px;height:1350px;padding:74px 66px;display:flex;flex-direction:column;background:radial-gradient(130% 100% at 100% 0,#1b2c66 0%,#0e1734 44%,#0b1220 100%)}
    .bd{font-size:24px;font-weight:400;letter-spacing:.3em;opacity:.6}
    h1{font-size:82px;font-weight:200;letter-spacing:-.045em;line-height:1.1;margin:18px 0 6px}
    .sub{font-size:27px;font-weight:400;opacity:.72;margin-bottom:34px}
    .row{display:flex;align-items:center;gap:22px;padding:19px 0;border-bottom:1px solid rgba(255,255,255,.09)}
    .no{font-size:30px;font-weight:200;opacity:.45;width:52px}
    .nm{flex:1;font-size:42px;font-weight:200;letter-spacing:-.035em}
    .nm em{font-style:normal;font-size:21px;font-weight:400;opacity:.45;margin-left:14px;letter-spacing:.14em}
    .pr{font-size:42px;font-weight:200;letter-spacing:-.03em}
    .tg{font-size:20px;font-weight:400;padding:9px 20px;border-radius:99px;width:146px;text-align:center}
    .ft{margin-top:auto;padding-top:26px;font-size:20px;font-weight:400;opacity:.5;line-height:1.6}
  </style><body>
    <div class="bd">안심재팬</div>
    <h1>지진 걱정 없이<br>가기 좋은 일본</h1>
    <div class="sub">${ym} · 30년 내 진도 6약 이상 흔들림 확률이 낮은 순</div>
    ${rankRows(8)}
    <div class="ft">출처 · 방재과학기술연구소(NIED) J-SHIS ${RISK.version} 확률론적 지진동 예측 지도<br>확률은 흔들림 기준이며, 안전을 보장하지 않습니다</div>
  </body>` },
  { name: 'story', w: 1080, h: 1920, html: `<style>${BASE}
    body{width:1080px;height:1920px;padding:220px 72px 180px;display:flex;flex-direction:column;background:radial-gradient(120% 80% at 0 0,#24315f 0%,#101a38 46%,#0b1220 100%)}
    .bd{font-size:26px;font-weight:400;letter-spacing:.3em;opacity:.6}
    h1{font-size:104px;font-weight:200;letter-spacing:-.05em;line-height:1.08;margin:24px 0 10px}
    .sub{font-size:32px;font-weight:400;opacity:.7;margin-bottom:56px}
    .row{display:flex;align-items:center;gap:26px;padding:26px 0;border-bottom:1px solid rgba(255,255,255,.1)}
    .no{font-size:36px;font-weight:200;opacity:.45;width:62px}
    .nm{flex:1;font-size:54px;font-weight:200;letter-spacing:-.035em}.nm em{display:none}
    .pr{font-size:54px;font-weight:200}
    .tg{font-size:24px;font-weight:400;padding:11px 24px;border-radius:99px;width:176px;text-align:center}
    .ft{margin-top:auto;font-size:26px;font-weight:400;opacity:.55;line-height:1.6}
  </style><body>
    <div class="bd">안심재팬</div><h1>이번 달<br>안심 여행지</h1>
    <div class="sub">${ym} · 일본 정부 공식 자료 기준</div>
    ${rankRows(5)}
    <div class="ft">전체 순위와 실시간 지진 지도<br>프로필 링크에서 확인하세요</div>
  </body>` },
];

for (const r of ranked.slice(0, 3)) CARDS.push({ name: r.id, w: 1080, h: 1350, html: `<style>${BASE}
  body{width:1080px;height:1350px}
  .sh{position:absolute;inset:0;background:linear-gradient(180deg,rgba(6,10,18,.84) 0%,rgba(6,10,18,.26) 38%,rgba(6,10,18,.5) 66%,rgba(6,10,18,.95) 100%)}
  .c{position:absolute;inset:0;padding:78px 68px;display:flex;flex-direction:column;justify-content:space-between}
  .bd{font-size:24px;font-weight:400;letter-spacing:.3em;opacity:.65}
  h1{font-size:118px;font-weight:200;letter-spacing:-.05em;line-height:1;margin-top:20px}
  h1 em{font-style:normal;display:block;font-size:26px;font-weight:400;opacity:.6;letter-spacing:.2em;margin-top:18px}
  .n{font-size:132px;font-weight:200;letter-spacing:-.05em;line-height:.92}
  .n small{display:block;font-size:26px;font-weight:400;opacity:.76;margin-bottom:16px;line-height:1.5;letter-spacing:0}
  .tg{display:inline-block;font-size:26px;font-weight:400;padding:14px 34px;border-radius:99px;background:${COL[tierOf(r.prob)]};margin-top:26px}
  .ft{font-size:20px;font-weight:400;opacity:.5;margin-top:26px;line-height:1.6}
</style><body>${poster(HERO_MOTIF[r.id], (REGION_HUE[r.id] || 200), r.id + '-card')}<div class="sh"></div>
  <div class="c"><div><div class="bd">안심재팬</div><h1>${esc(r.name)}<em>${esc(r.en.toUpperCase())}</em></h1></div>
  <div><div class="n"><small>30년 내 진도 6약 이상 흔들림 확률</small>${fmt(r.prob)}</div>
  <div class="tg">${esc(TIER[tierOf(r.prob)])} · 주요 여행지 ${REGIONS.length}곳 중 ${ranked.findIndex(x => x.id === r.id) + 1}위</div>
  <div class="ft">출처 · 방재과학기술연구소 J-SHIS ${RISK.version}</div></div></div></body>` });

(async () => {
  const { chromium } = require('playwright');
  const b = await chromium.launch();
  fs.mkdirSync(path.join(ROOT, 'cards'), { recursive: true });
  for (const c of CARDS) {
    const pg = await b.newPage({ viewport: { width: c.w, height: c.h }, deviceScaleFactor: 1 });
    await pg.setContent(c.html); await pg.waitForTimeout(160);
    await pg.screenshot({ path: path.join(ROOT, 'cards', c.name + '.png') });
    await pg.close();
  }
  await b.close();
  console.log('cards:', CARDS.map(c => c.name).join(', '));
})();
