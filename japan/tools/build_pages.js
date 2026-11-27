#!/usr/bin/env node
/* 지역별 검색 유입 페이지, 사이트맵, robots.txt, 공유 이미지(OG) 생성.
   사용법: node tools/build_pages.js            (페이지 + 사이트맵)
           node tools/build_pages.js --og       (공유 이미지까지, playwright 필요)
   결과:   r/<지역>.html, sitemap.xml, robots.txt, og/<지역>.png */
const fs = require('fs'), path = require('path');
const ROOT = path.dirname(__dirname);
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const G = {};
for (const f of ['data/config.js','data/regions.js','data/prefs.js','data/risk.js','data/ko.js','data/snapshot.js','data/affiliate.js','src/poster.js'])
  new Function('G', read(f) + '\n;Object.assign(G,{' + (read(f).match(/^(?:const|function)\s+([A-Za-z_$][\w$]*)/gm)||[]).map(m=>m.split(/\s+/)[1]).join(',') + '})')(G);
const { CONFIG, REGIONS, REGION_META, PREFS, RISK, poster, HERO_MOTIF, REGION_HUE, hotelUrl, tourUrl, flightUrl } = G;

const PREF_BY_ID = Object.fromEntries(PREFS.map(p => [p.id, p]));
REGIONS.forEach(r => Object.assign(r, REGION_META[r.id], { prob: RISK.city[r.id].p }));
const tierOf = p => p < 3 ? 1 : p < 10 ? 2 : p < 26 ? 3 : p < 50 ? 4 : 5;
const TIER_LABEL = { 1:'낮음', 2:'다소 낮음', 3:'보통', 4:'다소 높음', 5:'높음' };
const fmtProb = p => p >= 10 ? Math.round(p) + '%' : p.toFixed(1) + '%';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const SITE = (CONFIG.siteUrl || '').replace(/\/$/, '');
const abs = p => SITE ? SITE + p : '.' + p;

/* 전국 순위(낮은 확률 = 안심) */
const ranked = [...REGIONS].sort((a, b) => a.prob - b.prob);
const rankOf = id => ranked.findIndex(r => r.id === id) + 1;

function verdict(r) {
  const t = tierOf(r.prob), n = rankOf(r.id), tot = REGIONS.length;
  if (t <= 2) return `${r.name}는 일본의 주요 여행지 ${tot}곳 가운데 ${n}번째로 장기 지진 위험이 낮은 지역입니다. 일반적인 여행 일정이라면 지진을 이유로 일정을 바꿀 필요는 크지 않습니다.`;
  if (t === 3) return `${r.name}의 장기 지진 위험은 일본 안에서 보통 수준입니다(${tot}곳 중 ${n}위). 평소처럼 여행하되, 숙소의 대피 경로만 확인해 두면 충분합니다.`;
  return `${r.name}는 장기 지진 위험이 상대적으로 높은 편입니다(${tot}곳 중 ${n}위). 그렇다고 여행을 포기할 이유는 아닙니다. 일본에서도 내진 기준이 가장 엄격한 지역이며, 아래 준비만 해두면 됩니다.`;
}

function faq(r) {
  const p = PREF_BY_ID[r.pf], pts = RISK.pref[r.pf].pts;
  const spread = pts.length > 1 ? `같은 ${p.ko}현 안에서도 지점에 따라 차이가 큽니다(${pts.map(([n, v]) => `${n} ${fmtProb(v)}`).join(', ')}).` : '';
  return [
    [`${r.name} 여행, 지진 때문에 취소해야 하나요?`,
     `${verdict(r)} 다만 일본 기상청이 쓰나미 경보나 난카이 해곡 지진 임시 정보를 발표한 경우에는 일정 조정을 검토하세요.`],
    [`${r.name}의 지진 위험은 수치로 얼마나 되나요?`,
     `일본 방재과학기술연구소 J-SHIS(${RISK.version})의 확률론적 지진동 예측 지도에 따르면, ${RISK.city[r.id].pt} 지점 기준 30년 내 진도 6약 이상 흔들림이 발생할 확률은 ${fmtProb(r.prob)}입니다(${TIER_LABEL[tierOf(r.prob)]} 수준). ${spread}`],
    [`${r.name}에서 지진이 나면 어떻게 해야 하나요?`,
     `흔들리는 동안에는 머리를 보호하고 탁자 아래로 피하며, 멈출 때까지 밖으로 뛰어나가지 않습니다. 멈춘 뒤 해안가에 있다면 경보를 기다리지 말고 즉시 높은 곳으로 이동합니다. ${r.safety}`],
    ['진도와 규모(M)는 무엇이 다른가요?',
     '규모는 지진 자체의 에너지 크기이고, 진도는 특정 장소에서 느껴지는 흔들림의 세기입니다. 여행자에게 중요한 것은 진도입니다. 일본 기상청 진도 4까지는 대부분 피해가 없고, 5약부터 물건이 떨어지거나 교통이 멈출 수 있습니다.'],
  ];
}

function page(r) {
  const p = PREF_BY_ID[r.pf], t = tierOf(r.prob), rows = faq(r);
  const title = `${r.name} 지진 위험, 여행 가도 될까 | 안심재팬`;
  const desc = `${r.name}의 30년 내 진도 6약 이상 확률은 ${fmtProb(r.prob)}(${TIER_LABEL[t]}). 일본 정부 공식 자료로 본 ${r.name} 지진 위험과 여행 전 준비, 지진 시 행동요령을 정리했습니다.`;
  const url = abs(`/r/${r.id}.html`), ogImg = abs(`/og/${r.id}.png`);
  const sights = r.sights.map(([a, b]) => `<li><b>${esc(a)}</b> ${esc(b)}</li>`).join('');
  const foods = r.food.map(([a, b]) => `<li><b>${esc(a)}</b> ${esc(b)}</li>`).join('');
  const stay = r.stay.map(([a, b]) => `<li><b>${esc(a)}</b> ${esc(b)}</li>`).join('');
  const pts = RISK.pref[r.pf].pts;
  const ld = {
    '@context': 'https://schema.org', '@graph': [
      { '@type': 'FAQPage', mainEntity: rows.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
      { '@type': 'Article', headline: title, description: desc, inLanguage: 'ko',
        author: { '@type': 'Organization', name: '안심재팬' }, publisher: { '@type': 'Organization', name: '안심재팬' },
        ...(SITE ? { mainEntityOfPage: url, image: ogImg } : {}) },
    ]
  };
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${CONFIG.verify && CONFIG.verify.google ? `<meta name="google-site-verification" content="${esc(CONFIG.verify.google)}">\n` : ''}${CONFIG.verify && CONFIG.verify.naver ? `<meta name="naver-site-verification" content="${esc(CONFIG.verify.naver)}">\n` : ''}<meta name="keywords" content="${esc(`${r.name} 지진, ${r.name} 여행 지진, ${r.name} 지진 위험, ${p.ko} 지진, 일본 여행 지진, ${r.name} 안전`)}">
${SITE ? `<link rel="canonical" href="${esc(url)}">` : ''}
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(`${r.name} 지진 위험, 여행 가도 될까`)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:locale" content="ko_KR">
${SITE ? `<meta property="og:url" content="${esc(url)}">\n<meta property="og:image" content="${esc(ogImg)}">\n<meta name="twitter:card" content="summary_large_image">` : ''}
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ccircle cx='32' cy='32' r='30' fill='%230b1220'/%3E%3Ccircle cx='32' cy='32' r='13' fill='%23e5484d'/%3E%3C/svg%3E">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<style>
@font-face{font-family:'Paperlogy';font-weight:200;font-display:swap;src:url(../fonts/Paperlogy-2ExtraLight.woff2) format('woff2')}
@font-face{font-family:'Paperlogy';font-weight:300;font-display:swap;src:url(../fonts/Paperlogy-3Light.woff2) format('woff2')}
@font-face{font-family:'Paperlogy';font-weight:400;font-display:swap;src:url(../fonts/Paperlogy-4Regular.woff2) format('woff2')}
:root{--bg:#f3f4f6;--panel:#fff;--ink:#0e1420;--sub:#667085;--faint:#98a1b0;--line:#e3e6ec;--soft:#eceff4;--accent:#e5484d;--safe:#2f6fe4;--stage:#0b1220;
--font:'Paperlogy',system-ui,-apple-system,'Segoe UI',sans-serif;--gut:max(18px,env(safe-area-inset-left,0px));--gutr:max(18px,env(safe-area-inset-right,0px))}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#080c13;--panel:#111824;--ink:#eef2f8;--sub:#98a3b5;--faint:#6b7587;--line:#1e2735;--soft:#172030;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#080c13;--panel:#111824;--ink:#eef2f8;--sub:#98a3b5;--faint:#6b7587;--line:#1e2735;--soft:#172030;color-scheme:dark}
*{box-sizing:border-box;margin:0;padding:0}html,body{background:var(--bg)}
body{font-family:var(--font);font-weight:300;color:var(--ink);line-height:1.7;-webkit-font-smoothing:antialiased;letter-spacing:-.01em}
a{color:var(--safe)}b,strong{font-weight:400}img{display:block;max-width:100%}
.wrap{max-width:760px;margin:0 auto;padding-left:var(--gut);padding-right:var(--gutr)}
header{border-bottom:1px solid var(--line)}header .wrap{display:flex;align-items:center;justify-content:space-between;height:58px}
.brand{font-size:19px;text-decoration:none;color:var(--ink)}.brand i{font-style:normal;display:inline-block;width:.46em;height:.46em;border-radius:50%;background:var(--accent);margin-left:.22em;vertical-align:.12em}
header a.app{font-size:13px;color:var(--sub);text-decoration:none}
h1{font-size:clamp(28px,6.4vw,44px);font-weight:200;letter-spacing:-.04em;line-height:1.22;margin:30px 0 14px;text-wrap:balance}
h2{font-size:clamp(21px,4.4vw,27px);font-weight:200;letter-spacing:-.035em;margin:44px 0 12px}
h3{font-size:17px;font-weight:400;margin:22px 0 6px}
p{margin:10px 0;color:var(--sub);font-weight:400}p.lead{font-size:17px;color:var(--ink);font-weight:300}
.hero{position:relative;border-radius:24px;overflow:hidden;aspect-ratio:16/9;margin-top:6px;isolation:isolate}
.hero svg{position:absolute;inset:0;width:100%;height:100%}
.gauge{background:var(--panel);border-radius:22px;padding:22px;margin:22px 0}
.gauge .n{font-size:clamp(40px,11vw,66px);font-weight:200;letter-spacing:-.04em;line-height:1}
.gauge .n small{font-size:15px;color:var(--sub);margin-left:10px;letter-spacing:0}
.gauge .lab{font-size:13px;color:var(--sub);font-weight:400}
.bar{height:10px;border-radius:99px;background:linear-gradient(90deg,#3b79de,#44506a,#a23b4d,#ef3347);margin:16px 0 6px;position:relative}
.bar i{position:absolute;top:-5px;width:4px;height:20px;border-radius:2px;background:var(--ink);box-shadow:0 0 0 3px var(--panel)}
.bar-ends{display:flex;justify-content:space-between;font-size:11px;color:var(--faint);font-weight:400}
ul{margin:10px 0 10px 2px;list-style:none}li{color:var(--sub);font-weight:400;padding:5px 0 5px 20px;position:relative}
li::before{content:"";position:absolute;left:2px;top:.92em;width:5px;height:5px;border-radius:50%;background:var(--faint)}
li b{color:var(--ink);font-weight:400}
table{width:100%;border-collapse:collapse;margin:14px 0;font-size:14px}
th,td{text-align:left;padding:10px 6px;border-bottom:1px solid var(--line);font-weight:400}
th{color:var(--faint);font-size:12px}td.r{text-align:right;color:var(--sub)}
.live{background:var(--stage);color:#eaf0fa;border-radius:22px;padding:20px;margin:22px 0}
.live h3{color:#fff;margin:0 0 4px}.live p{color:#93a0b6;font-size:13px;margin:0}
.live ol{list-style:none;margin-top:12px}
.live li{color:#cdd8ea;border-top:1px solid rgba(255,255,255,.08);padding:9px 0 9px 0;display:flex;justify-content:space-between;gap:12px;font-size:14px}
.live li::before{display:none}.live li span{color:#93a0b6;font-size:13px;white-space:nowrap}
.cta{display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));margin:18px 0}
.cta a{display:block;background:var(--panel);border-radius:16px;padding:15px 16px;text-decoration:none;color:var(--ink)}
.cta a b{display:block;font-size:15px;font-weight:400}.cta a span{font-size:12px;color:var(--sub)}
.cta a.main{background:var(--ink);color:var(--bg)}.cta a.main span{color:var(--bg);opacity:.75}
details{border-top:1px solid var(--line);padding:14px 0}details:last-of-type{border-bottom:1px solid var(--line)}
summary{cursor:pointer;font-size:16px;list-style:none;display:flex;justify-content:space-between;gap:12px}
summary::-webkit-details-marker{display:none}summary::after{content:"+";color:var(--faint)}details[open] summary::after{content:"−"}
.near{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}
.near a{font-size:13px;padding:8px 14px;border-radius:99px;border:1px solid var(--line);text-decoration:none;color:var(--ink);font-weight:400}
footer{border-top:1px solid var(--line);margin-top:48px;padding-block:28px 60px;color:var(--faint);font-size:12px}
footer p{color:var(--faint);font-size:12px;margin:4px 0}
.src{font-size:12px;color:var(--faint);font-weight:400;margin-top:6px}
</style>
</head>
<body>
<header><div class="wrap"><a class="brand" href="../index.html">안심재팬<i></i></a><a class="app" href="../index.html#map">실시간 지도 보기 →</a></div></header>
<main class="wrap">
  <h1>${esc(r.name)} 지진 위험,<br>여행 가도 될까?</h1>
  <p class="lead">${esc(verdict(r))}</p>
  <div class="hero">${poster(HERO_MOTIF[r.id], (REGION_HUE[r.id] || 200), r.id + '-seo')}</div>

  <div class="gauge">
    <div class="lab">30년 내 진도 6약 이상 흔들림 확률 · ${esc(RISK.city[r.id].pt)} 지점</div>
    <div class="n">${fmtProb(r.prob)}<small>${esc(TIER_LABEL[t])} 수준 · 주요 여행지 ${REGIONS.length}곳 중 ${rankOf(r.id)}위</small></div>
    <div class="bar"><i style="left:calc(${Math.min(100, Math.max(0, Math.log10(Math.max(r.prob,1))/Math.log10(90)*100)).toFixed(1)}% - 2px)"></i></div>
    <div class="bar-ends"><span>안심</span><span>위험 높음</span></div>
    <p class="src">출처: 방재과학기술연구소(NIED) J-SHIS 지진 하자드 스테이션 ${esc(RISK.version)} 확률론적 지진동 예측 지도(평균 케이스, 전 지진). 흔들림 기준이며 쓰나미 위험은 별도입니다.</p>
  </div>

  ${pts.length > 1 ? `<h2>${esc(p.ko)}현 안에서도 차이가 큽니다</h2>
  <p>같은 현이라도 지점에 따라 확률이 크게 다릅니다. 여행지를 고를 때는 현 단위가 아니라 도시 단위로 보셔야 합니다.</p>
  <table><thead><tr><th>지점</th><th class="r">30년 내 진도 6약 이상</th><th class="r">수준</th></tr></thead><tbody>
  ${pts.map(([n, v]) => `<tr><td>${esc(n)}</td><td class="r">${fmtProb(v)}</td><td class="r">${esc(TIER_LABEL[tierOf(v)])}</td></tr>`).join('')}
  </tbody></table>` : ''}

  <div class="live">
    <h3>지금 ${esc(r.name)} 주변 지진 상황</h3>
    <p id="liveNote">불러오는 중…</p>
    <ol id="liveList"></ol>
  </div>

  <h2>${esc(r.name)} 여행 전 이것만 확인하세요</h2>
  <ul>
    <li><b>숙소 위치</b> ${esc(r.safety)}</li>
    <li><b>여행자보험</b> 지진·자연재해 보장이 포함되는지 확인하세요. 상품마다 다릅니다.</li>
    <li><b>앱 설치</b> 일본 관광청 'Safety tips'(한국어 지진·쓰나미 경보), NHK WORLD-JAPAN</li>
    <li><b>연락처 저장</b> 일본 경찰 110 · 소방·구급 119 · 외교부 영사콜센터 +82-2-3210-0404(24시간)</li>
    <li><b>동행 서비스</b> 외교부 해외안전여행 '동행'에 일정을 등록해 두면 비상시 연락을 받을 수 있습니다.</li>
  </ul>

  <h2>지진이 났을 때</h2>
  <h3>흔들리는 동안</h3>
  <ul><li>머리를 보호하고 탁자 아래 등으로 몸을 숨깁니다.</li><li>흔들림이 멈출 때까지 밖으로 뛰어나가지 않습니다.</li><li>엘리베이터 안이라면 모든 층 버튼을 누르고 먼저 열리는 층에서 내립니다.</li></ul>
  <h3>흔들림이 멈춘 뒤</h3>
  <ul><li>바닷가라면 경보를 기다리지 말고 즉시 높은 곳으로 이동합니다.</li><li>'避難所(피난소)', '津波避難ビル(쓰나미 피난 빌딩)' 표지를 따라갑니다.</li><li>대중교통이 멈추면 무리하게 이동하지 말고 숙소나 피난소에 머뭅니다.</li></ul>

  <h2>${esc(r.name)}에서 볼 것, 먹을 것</h2>
  <p>${esc(r.note)}</p>
  <h3>볼거리</h3><ul>${sights}</ul>
  <h3>먹거리</h3><ul>${foods}</ul>
  <h3>숙박 추천 지역</h3><ul>${stay}</ul>
  <div class="cta">
    <a class="main" href="../index.html#ranking"><b>안심 지역 랭킹 전체 보기</b><span>실시간 지도와 함께</span></a>
    <a href="${esc(hotelUrl(r))}" target="_blank" rel="noopener sponsored nofollow"><b>${esc(r.name)} 숙소 찾기</b><span>추천 지역 기준</span></a>
    <a href="${esc(tourUrl(r))}" target="_blank" rel="noopener sponsored nofollow"><b>투어·입장권</b><span>현지 투어, 교통 패스</span></a>
    <a href="${esc(flightUrl(r))}" target="_blank" rel="noopener sponsored nofollow"><b>항공권 보기</b><span>서울 출발</span></a>
  </div>

  <h2>자주 묻는 질문</h2>
  ${rows.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n  ')}

  <h2>다른 지역도 확인해 보세요</h2>
  <div class="near">${ranked.filter(x => x.id !== r.id).slice(0, 6).map(x => `<a href="./${x.id}.html">${esc(x.name)} ${fmtProb(x.prob)}</a>`).join('')}</div>
</main>
<footer><div class="wrap">
  <p>안심재팬 · 더 안전하고 더 재미있는 일본여행 (베타)</p>
  <p>운영 ${esc(CONFIG.operator.name)} · 문의 <a href="mailto:${esc(CONFIG.operator.email)}">${esc(CONFIG.operator.email)}</a></p>
  <p>지진 데이터: 일본 기상청 발표(P2P지진정보 API 경유). 장기 위험: 방재과학기술연구소 J-SHIS ${esc(RISK.version)}. 이 서비스는 지진을 예보하지 않으며, 긴급 상황에서는 일본 정부와 현지 당국의 안내를 우선 따르세요.</p>
  <p>지도와 일러스트는 안심재팬이 직접 제작했습니다. 일부 링크는 제휴 링크로, 예약 시 수수료를 받을 수 있습니다. 이용자에게 추가 비용은 없습니다.</p>
</div></footer>
<script>
const PREF_JP=${JSON.stringify(PREF_BY_ID[r.pf].jp)}, SNAP=${JSON.stringify({ at: G.SNAPSHOT.at, list: G.SNAPSHOT.list.slice(0, 40) })};
const SCALE={10:'1',20:'2',30:'3',40:'4',45:'5약',50:'5강',55:'6약',60:'6강',70:'7'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
${read('data/ko.js').split('\n').slice(1).join('\n')}
function fmtTime(s){const m=/(\\d+)\\/(\\d+)\\/(\\d+) (\\d+):(\\d+)/.exec(s||'');return m?\`\${+m[2]}월 \${+m[3]}일 \${m[4]}:\${m[5]}\`:'';}
function ageH(s,base){const m=/(\\d+)\\/(\\d+)\\/(\\d+) (\\d+):(\\d+):?(\\d+)?/.exec(s||'');if(!m)return 1/0;return (base-Date.UTC(+m[1],+m[2]-1,+m[3],+m[4]-9,+m[5],+(m[6]||0)))/36e5;}
function render(list,base,live){
  const rows=[];
  for(const q of list){ if(ageH(q.t,base)>24*30) continue; let s=0; for(const [k,v] of q.p) if(k===PREF_JP||((k==='函館'||k==='札幌')&&PREF_JP==='北海道')) s=Math.max(s,v); if(s) rows.push([q,s]); }
  const note=document.getElementById('liveNote');
  const felt=rows.filter(([,s])=>s>=30).length;
  note.textContent=(live?'일본 기상청 발표 기준 · 실시간':SNAP.at+' (일본시간) 저장 자료 기준')+' · 최근 30일 이 지역에서 느껴진 지진 '+rows.length+'건'+(felt?', 그중 진도 3 이상 '+felt+'건':'');
  document.getElementById('liveList').innerHTML=rows.slice(0,5).map(([q,s])=>\`<li><div>\${esc(fmtTime(q.t))} · \${esc(ko(q.n))}</div><span>진도 \${esc(SCALE[s]||'-')} · \${q.m>0?'M'+q.m.toFixed(1):'규모 미정'}</span></li>\`).join('')||'<li><div>느껴진 지진이 없습니다.</div></li>';
}
render(SNAP.list,(()=>{const m=/(\\d+)\\/(\\d+)\\/(\\d+) (\\d+):(\\d+)/.exec(SNAP.at);return Date.UTC(+m[1],+m[2]-1,+m[3],+m[4]-9,+m[5]);})(),false);
fetch('https://api.p2pquake.net/v2/history?codes=551&limit=100').then(r=>r.ok?r.json():Promise.reject()).then(d=>{
  const list=d.filter(x=>x.earthquake&&x.earthquake.hypocenter&&x.earthquake.hypocenter.name&&x.earthquake.maxScale>=10)
    .map(x=>({t:x.earthquake.time,n:x.earthquake.hypocenter.name,m:x.earthquake.hypocenter.magnitude,p:(x.points||[]).map(pt=>[pt.pref,pt.scale])}));
  render(list,Date.now(),true);
}).catch(()=>{});
</script>
</body>
</html>`;
}

/* ---- 출력 ---- */
const outR = path.join(ROOT, 'r');
fs.mkdirSync(outR, { recursive: true });
for (const r of REGIONS) fs.writeFileSync(path.join(outR, r.id + '.html'), page(r));

const today = new Date().toISOString().slice(0, 10);
if (SITE) {
  const urls = [[SITE + '/index.html', '1.0'], ...REGIONS.map(r => [`${SITE}/r/${r.id}.html`, '0.8'])];
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(([u, p]) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>${p}</priority></url>`).join('\n') +
    `\n</urlset>\n`);
  fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
} else {
  fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\n`);
}
console.log(`pages: ${REGIONS.length} in r/`, SITE ? '+ sitemap.xml, robots.txt' : '(siteUrl 미설정: sitemap 생략)');

/* ---- 공유 이미지(OG) ---- */
if (process.argv.includes('--og')) (async () => {
  const { chromium } = require('playwright');
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  fs.mkdirSync(path.join(ROOT, 'og'), { recursive: true });
  const font = fs.readFileSync(path.join(ROOT, 'fonts/Paperlogy-2ExtraLight.woff2')).toString('base64');
  const font4 = fs.readFileSync(path.join(ROOT, 'fonts/Paperlogy-4Regular.woff2')).toString('base64');
  for (const r of REGIONS) {
    const t = tierOf(r.prob);
    await pg.setContent(`<style>
      @font-face{font-family:P;font-weight:200;src:url(data:font/woff2;base64,${font}) format('woff2')}
      @font-face{font-family:P;font-weight:400;src:url(data:font/woff2;base64,${font4}) format('woff2')}
      *{margin:0;box-sizing:border-box}body{width:1200px;height:630px;font-family:P,sans-serif;color:#fff;position:relative;overflow:hidden;background:#0b1220}
      .art{position:absolute;inset:0;width:100%;height:100%}
      .sh{position:absolute;inset:0;background:linear-gradient(100deg,rgba(6,10,18,.92) 0%,rgba(6,10,18,.72) 46%,rgba(6,10,18,.28) 100%)}
      .c{position:absolute;inset:0;padding:66px 72px;display:flex;flex-direction:column;justify-content:space-between}
      .bd{font-size:21px;font-weight:400;letter-spacing:.3em;opacity:.72}
      h1{font-size:92px;font-weight:200;letter-spacing:-.045em;line-height:1.06}
      h1 em{font-style:normal;display:block;font-size:54px;opacity:.86;margin-top:12px;letter-spacing:-.03em}
      .b{display:flex;align-items:flex-end;justify-content:space-between;gap:30px}
      .n{font-size:118px;font-weight:200;letter-spacing:-.05em;line-height:.9}
      .n small{display:block;font-size:22px;font-weight:400;opacity:.78;letter-spacing:0;margin-bottom:14px;line-height:1.5}
      .tag{font-size:25px;font-weight:400;padding:13px 30px;border-radius:99px;background:${t<=2?'#2f6fe4':t===3?'#5b6676':'#d6303b'}}
      .src{font-size:17px;opacity:.6;font-weight:400;margin-top:16px}
    </style><body>${poster(HERO_MOTIF[r.id], (REGION_HUE[r.id] || 200), r.id + '-og')}<div class="sh"></div>
    <div class="c"><div><div class="bd">안심재팬</div><h1>${esc(r.name)}<em>지진 위험, 여행 가도 될까?</em></h1></div>
    <div><div class="b"><div class="n"><small>30년 내 진도 6약 이상 확률</small>${fmtProb(r.prob)}</div><div class="tag">${esc(TIER_LABEL[t])}</div></div>
    <div class="src">출처 · 방재과학기술연구소 J-SHIS ${esc(RISK.version)}</div></div></div></body>`);
    await pg.waitForTimeout(160);
    await pg.screenshot({ path: path.join(ROOT, 'og', r.id + '.png') });
  }
  await b.close(); console.log('og:', REGIONS.length, 'images');
})();
