'use strict';
const $ = s => document.querySelector(s);
const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ========== 데이터 연결 ========== */
const REGION_BY_ID = Object.fromEntries(REGIONS.map(r=>[r.id,r]));
const PREF_BY_ID = Object.fromEntries(PREFS.map(p=>[p.id,p]));
/* 장기 위험은 J-SHIS 공식 수치(RISK)에서 옵니다: 확률(%) → 5단계 등급, 점수 */
const tierOf = p => p<3?1:p<10?2:p<26?3:p<50?4:5;
const baseOf = p => Math.round(96 - 42*Math.min(1,Math.max(0,Math.log10(Math.max(p,1))/Math.log10(90))));
const fmtProb = p => p>=10 ? Math.round(p)+'%' : p.toFixed(1)+'%';
PREFS.forEach(p=>{ p.prob=RISK.pref[p.id].p; p.tier=tierOf(p.prob); });
REGIONS.forEach(r=>{ Object.assign(r,REGION_META[r.id]); r.prob=RISK.city[r.id].p; r.tier=tierOf(r.prob); });

/* ========== 아이콘 ========== */
const IC = {
  close:'<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  alert:'<svg viewBox="0 0 24 24"><path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.01"/></svg>',
  bed:'<svg viewBox="0 0 24 24"><path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="1.5"/></svg>',
  ticket:'<svg viewBox="0 0 24 24"><path d="M3 9a2 2 0 0 0 0 6v3h18v-3a2 2 0 0 1 0-6V6H3z"/><path d="M14 6v12" stroke-dasharray="2 2"/></svg>',
  sim:'<svg viewBox="0 0 24 24"><path d="M7 3h7l4 4v14H7z"/><rect x="10" y="11" width="5" height="6" rx="1"/></svg>',
  lock:'<svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
  plane:'<svg viewBox="0 0 24 24"><path d="M3 13l18-9-4 16-5-6-9-1z"/><path d="M12 14l9-10"/></svg>',
  shield:'<svg viewBox="0 0 24 24"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
};

/* ========== 사진 ========== */
const hue = id => { let h=0; for(const c of id) h=(h*31+c.charCodeAt(0))%360; return h; };
const imgFile = k => (k && IMGCRED[k]) ? `img/${k}.webp` : null;
const itemKey = (rid,cat,i) => IMGMAP[`${rid}-${cat}${i}`];
function img(k,alt,eager){
  const f = imgFile(k); if(!f) return '';
  return `<img src="${f}" alt="${esc(alt)}" loading="${eager?'eager':'lazy'}" decoding="async">`;
}
const rh = (rid,i=0) => ((REGION_HUE[rid]||200) + ((i*41)%100) - 40 + 360) % 360;
const vis = (k,alt,motif,h,seed,eager) => poster(motif,h,seed) + img(k,alt,eager);
document.addEventListener('error',e=>{ if(e.target && e.target.tagName==='IMG') e.target.remove(); },true);

/* ========== 진도, 시간, 지명 ========== */
const SCALE = {10:'1',20:'2',30:'3',40:'4',45:'5약',50:'5강',55:'6약',60:'6강',70:'7'};
function scaleColor(s){
  if(s>=55) return '#7f1d1d'; if(s>=45) return '#dc2626'; if(s>=40) return '#ea580c';
  if(s>=30) return '#b8860b'; if(s>=20) return '#3b6fd4'; return '#64748b';
}
const TSUNAMI = {None:'쓰나미 걱정 없음',Unknown:'쓰나미 정보 확인 중',Checking:'쓰나미 정보 확인 중',NonEffective:'해수면 소폭 변동 가능',Watch:'쓰나미 주의보',Warning:'쓰나미 경보'};
function fmtTime(s){
  const m = /(\d+)\/(\d+)\/(\d+) (\d+):(\d+)/.exec(s||''); if(!m) return s||'';
  return `${+m[2]}월 ${+m[3]}일 ${m[4]}:${m[5]}`;
}
let QUAKES = null, SOURCE = 'live';
function snapNow(){ const m=/(\d+)\/(\d+)\/(\d+) (\d+):(\d+)/.exec(SNAPSHOT.at); return Date.UTC(+m[1],+m[2]-1,+m[3],+m[4]-9,+m[5]); }
function ageHours(s){
  const m = /(\d+)\/(\d+)\/(\d+) (\d+):(\d+):?(\d+)?/.exec(s||''); if(!m) return Infinity;
  const base = SOURCE==='snapshot' && SNAPSHOT.at ? snapNow() : Date.now();
  return (base - Date.UTC(+m[1],+m[2]-1,+m[3],+m[4]-9,+m[5],+(m[6]||0)))/36e5;
}
const fromSnap = x => ({earthquake:{time:x.t,hypocenter:{name:x.n,magnitude:x.m,depth:x.d,latitude:x.la,longitude:x.lo},maxScale:x.s,domesticTsunami:x.ts},
  points:x.p.map(([k,scale])=>({pref:(k==='函館'||k==='札幌')?'北海道':k,addr:k,scale}))});
/* 같은 지진의 중복 발표를 합치고, 진도 정보가 없는 항목은 뺍니다 */
function cleanQuakes(list){
  const best = new Map();
  for(const q of list){
    const e=q.earthquake, h=e.hypocenter; if(!h||!h.name||!(e.maxScale>=10)) continue;
    const k=e.time+'|'+h.name+'|'+h.magnitude, old=best.get(k);
    if(!old || (q.points||[]).length>(old.points||[]).length) best.set(k,q);
  }
  return [...best.values()];
}
async function loadQuakes(){
  const st=$('#statusTitle'), ss=$('#statusSub'), dot=$('#statusDot');
  st.textContent='지진 정보를 불러오는 중…'; ss.textContent='잠시만 기다려 주세요.'; dot.className='dot';
  try{
    const ctrl=new AbortController(); const t=setTimeout(()=>ctrl.abort(),10000);
    const res=await fetch('https://api.p2pquake.net/v2/history?codes=551&limit=100',{signal:ctrl.signal});
    clearTimeout(t);
    if(!res.ok) throw new Error('HTTP '+res.status);
    QUAKES = cleanQuakes((await res.json()).filter(d=>d.earthquake)); SOURCE='live';
  }catch(e){
    if(SNAPSHOT.list.length){ QUAKES=cleanQuakes(SNAPSHOT.list.map(fromSnap)); SOURCE='snapshot'; }
    else { QUAKES=null; SOURCE='none'; }
  }
  computeAct(); renderQuakes(); renderRanking(); renderMapData();
}

/* ========== 안심 지수(현 단위) ========== */
let ACT = null;
const ZERO = {felt:0,strong:0,maxS:0,recentStrong:false};
function computeAct(){
  if(!QUAKES){ ACT=null; return; }
  ACT = {};
  for(const q of QUAKES){
    const age = ageHours(q.earthquake.time); if(age > 24*30) continue;
    const per = {};
    for(const pt of q.points||[]) per[pt.pref] = Math.max(per[pt.pref]||0, pt.scale||0);
    for(const [jp,s] of Object.entries(per)){
      const a = ACT[jp] || (ACT[jp]={felt:0,strong:0,maxS:0,recentStrong:false});
      if(s>=30) a.felt++; if(s>=45) a.strong++;
      if(s>=50 && age<48) a.recentStrong=true;
      a.maxS=Math.max(a.maxS,s);
    }
  }
}
const actOf = p => ACT ? (ACT[p.jp]||ZERO) : null;
const penalty = a => a ? Math.min(20, a.felt*2 + a.strong*8) : 0;
const prefScore = p => Math.max(0, baseOf(p.prob) - penalty(actOf(p)));
const scoreOf = r => { const p=PREF_BY_ID[r.pf]; return {score:Math.max(0, baseOf(r.prob) - penalty(actOf(p))), a:actOf(p)}; };
const SUF = {'都':'도','府':'부','県':'현'};
const prefName = p => p.ko + (SUF[p.jp.slice(-1)]||'');

/* 점수 → 색 (어두운 지도 배경용). 붉을수록 위험, 푸를수록 안심 */
const MAP_STOPS = [[40,'#ef3347'],[55,'#a23b4d'],[70,'#44506a'],[82,'#3b79de'],[92,'#7ab4ff']];
const RING_STOPS = [[40,'#ff4d57'],[55,'#ff8a8f'],[70,'#dbe4f4'],[82,'#7fb0ff'],[92,'#4c8dff']];
const hex = c => [1,3,5].map(i=>parseInt(c.slice(i,i+2),16));
function lerpStops(st,s){
  if(s<=st[0][0]) return st[0][1]; if(s>=st[st.length-1][0]) return st[st.length-1][1];
  for(let i=1;i<st.length;i++){
    if(s<=st[i][0]){
      const [s0,c0]=st[i-1],[s1,c1]=st[i],t=(s-s0)/(s1-s0),A=hex(c0),B=hex(c1);
      return '#'+A.map((v,k)=>Math.round(v+(B[k]-v)*t).toString(16).padStart(2,'0')).join('');
    }
  }
}
const mapColor = s => lerpStops(MAP_STOPS,s);
const ringColor = s => lerpStops(RING_STOPS,s);
function ringSvg(score){
  const r=18, c=2*Math.PI*r;
  return `<svg class="ring" viewBox="0 0 46 46" aria-label="안심 지수 ${score}"><circle class="tr" cx="23" cy="23" r="${r}"/><circle cx="23" cy="23" r="${r}" stroke="${ringColor(score)}" stroke-linecap="round" stroke-dasharray="${(c*score/100).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 23 23)"/><text x="23" y="24">${score}</text></svg>`;
}

/* ========== 지도 ========== */
function bboxOf(d){
  const n=d.match(/-?\d+\.?\d*/g).map(Number); let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  for(let i=0;i+1<n.length;i+=2){ x0=Math.min(x0,n[i]); x1=Math.max(x1,n[i]); y0=Math.min(y0,n[i+1]); y1=Math.max(y1,n[i+1]); }
  return {x0,y0,x1,y1};
}
function nudgeInside(el,pos,c){
  try{
    if(!el.isPointInFill) return pos;
    let p={...pos};
    for(let i=0;i<60;i++){
      if(el.isPointInFill(new DOMPoint(p.x,p.y))) return p;
      p={x:p.x+(c[0]-p.x)*0.04,y:p.y+(c[1]-p.y)*0.04};
    }
  }catch(e){}
  return pos;
}
const CITY_POS = {}; let OKI = null;
function buildMap(){
  const svg=$('#jpmap');
  svg.innerHTML='<g id="pfs">'+PREFS.map(p=>`<path class="pf" data-id="${p.id}" d="${p.d}" tabindex="0" role="button" aria-label="${esc(prefName(p))}"></path>`).join('')+'</g><rect class="inset" id="okinset"></rect><g id="qk"></g><g id="cities"></g>';
  const ob=bboxOf(PREF_BY_ID.okinawa.d), inset=svg.querySelector('#okinset');
  inset.setAttribute('x',ob.x0-6); inset.setAttribute('y',ob.y0-6); inset.setAttribute('width',ob.x1-ob.x0+12); inset.setAttribute('height',ob.y1-ob.y0+12);
  OKI={x:(ob.x0+ob.x1)/2,y:(ob.y0+ob.y1)/2};
  let html='';
  for(const r of REGIONS){
    const p=PREF_BY_ID[r.pf], el=svg.querySelector(`[data-id="${r.pf}"]`); let pos;
    if(r.ll) pos=nudgeInside(el,proj(r.ll[0],r.ll[1]),p.c);
    else{
      const big=p.d.split('M').filter(Boolean).map(s=>bboxOf('M'+s)).sort((a,b)=>(b.x1-b.x0)*(b.y1-b.y0)-(a.x1-a.x0)*(a.y1-a.y0))[0];
      const mid=[(big.x0+big.x1)/2,(big.y0+big.y1)/2]; pos=nudgeInside(el,{x:mid[0],y:mid[1]},mid);
    }
    CITY_POS[r.id]=pos;
    const L={r:[7,4,'start'],l:[-7,4,'end'],t:[0,-8,'middle'],b:[0,15,'middle']}[r.lab||'r'];
    html+=`<g class="city" data-city="${r.id}" tabindex="0" role="button" aria-label="${esc(r.name)}"><circle class="hit" cx="${pos.x.toFixed(1)}" cy="${pos.y.toFixed(1)}" r="11"/><circle class="dotc" cx="${pos.x.toFixed(1)}" cy="${pos.y.toFixed(1)}" r="2.6"/><text x="${(pos.x+L[0]).toFixed(1)}" y="${(pos.y+L[1]).toFixed(1)}" text-anchor="${L[2]}">${esc(r.name)}</text></g>`;
  }
  svg.querySelector('#cities').innerHTML=html;
  setupMapEvents(svg);
}
function renderMapData(){
  const svg=$('#jpmap'); if(!svg) return;
  for(const p of PREFS) svg.querySelector(`[data-id="${p.id}"]`).style.fill=mapColor(prefScore(p));
  let html='';
  if(QUAKES){
    for(const q of QUAKES.slice().reverse()){
      const e=q.earthquake,h=e.hypocenter; if(ageHours(e.time)>24*7) continue;
      const la=h.latitude,lo=h.longitude; if(!(la>20&&la<50&&lo>120&&lo<155)) continue;
      const pos=(la<27.5&&lo<130&&OKI)?OKI:proj(la,lo);
      const s=e.maxScale,big=s>=45,r=big?6.5:s>=30?4.2:2.4;
      html+=`<circle class="qk${big?' big':''}" cx="${pos.x.toFixed(1)}" cy="${pos.y.toFixed(1)}" r="${r}"/>`;
    }
  }
  svg.querySelector('#qk').innerHTML=html;
}
function setupMapEvents(svg){
  const tip=$('#maptip');
  const pick=e=>{ const c=e.target.closest('[data-city]'); if(c) return {city:c.dataset.city}; const t=e.target.closest('[data-id]'); return t?{pref:t.dataset.id}:null; };
  svg.addEventListener('pointermove',e=>{
    if(e.pointerType==='touch') return;
    const k=pick(e); if(!k){ tip.hidden=true; return; }
    const txt=k.city ? `${REGION_BY_ID[k.city].name} · 안심 ${scoreOf(REGION_BY_ID[k.city]).score}` : `${prefName(PREF_BY_ID[k.pref])} · 안심 ${prefScore(PREF_BY_ID[k.pref])}`;
    const wr=svg.parentElement.getBoundingClientRect();
    tip.textContent=txt; tip.hidden=false; tip.style.left=(e.clientX-wr.left)+'px'; tip.style.top=(e.clientY-wr.top)+'px';
  });
  svg.addEventListener('pointerleave',()=>{ tip.hidden=true; });
  const go=e=>{ tip.hidden=true; const k=pick(e); if(!k) return; if(k.city) openRegion(k.city); else openPref(k.pref); };
  svg.addEventListener('click',go);
  svg.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); go(e); } });
}

/* ========== 지진 현황 ========== */
let QSHOW = 6;
function renderQuakes(){
  const list=$('#quakeList'), st=$('#statusTitle'), ss=$('#statusSub'), dot=$('#statusDot'), src=$('#srcNote'), stats=$('#stats');
  if(!QUAKES){
    st.textContent='지진 정보를 불러오지 못했습니다';
    ss.innerHTML='<a href="https://www.jma.go.jp/bosai/map.html#contents=earthquake_map" target="_blank" rel="noopener" style="color:inherit">일본 기상청에서 직접 확인하기</a>';
    list.innerHTML='<div class="empty">지진 목록을 표시할 수 없습니다.</div>'; src.textContent=''; stats.innerHTML=''; $('#moreQ').hidden=true; return;
  }
  const now=new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'});
  src.textContent = SOURCE==='live' ? `실시간 · ${now} 갱신` : `${SNAPSHOT.at} (일본시간) 저장 자료 · 실시간 연결이 막혀 있어 최근 저장 자료를 보여드립니다`;
  const tsunami=QUAKES.find(q=>ageHours(q.earthquake.time)<24&&['Watch','Warning'].includes(q.earthquake.domesticTsunami));
  const strong24=QUAKES.filter(q=>ageHours(q.earthquake.time)<24&&q.earthquake.maxScale>=45);
  const w7=QUAKES.filter(q=>ageHours(q.earthquake.time)<24*7);
  const felt7=w7.filter(q=>q.earthquake.maxScale>=30).length;
  const maxQ=w7.reduce((a,q)=>!a||q.earthquake.maxScale>a.earthquake.maxScale?q:a,null);
  stats.innerHTML=`<div><b>${w7.length}</b><small>최근 7일 발표</small></div><div><b>${felt7}</b><small>진도 3 이상</small></div><div><b>${maxQ?SCALE[maxQ.earthquake.maxScale]||'-':'-'}</b><small>최대 진도</small></div>`;
  if(tsunami){
    dot.className='dot warn'; st.textContent='쓰나미 '+(tsunami.earthquake.domesticTsunami==='Warning'?'경보':'주의보')+' 발표';
    ss.textContent=`${ko(tsunami.earthquake.hypocenter.name)} · 해안가는 즉시 높은 곳으로`;
  }else if(strong24.length){
    dot.className='dot warn'; st.textContent=`24시간 내 진도 5약 이상 ${strong24.length}건`;
    ss.textContent=ko(strong24[0].earthquake.hypocenter.name)+' · 여진에 대비하세요';
  }else{
    dot.className='dot ok'; st.textContent='최근 24시간, 큰 지진 없음'; ss.textContent='진도 5약 이상 · 쓰나미 경보 없음';
  }
  const rows=QUAKES.slice(0,QSHOW);
  list.innerHTML=rows.length?rows.map(q=>{
    const e=q.earthquake,h=e.hypocenter,s=e.maxScale;
    const mag=h.magnitude>0?'M'+Number(h.magnitude).toFixed(1):'규모 미정';
    const depth=h.depth>0?`깊이 ${h.depth}km`:(h.depth===0?'매우 얕음':'');
    return `<div class="q"><div class="shindo" style="background:${scaleColor(s)}">${esc(SCALE[s]||'-')}</div>
      <div><div class="place">${esc(ko(h.name))}<span>${esc(h.name)}</span></div><div class="meta">${esc(fmtTime(e.time))} 일본시간 · ${esc(TSUNAMI[e.domesticTsunami]||'')}</div></div>
      <div class="mag">${esc(mag)}<small>${esc(depth)}</small></div></div>`;
  }).join(''):'<div class="empty">최근 지진 기록이 없습니다.</div>';
  const more=$('#moreQ'); more.hidden=QUAKES.length<=6; more.textContent=QSHOW>6?'접기':'더 보기';
}
$('#moreQ').onclick=()=>{ QSHOW=QSHOW>6?6:14; renderQuakes(); };

/* ========== 랭킹: 사진 타일 ========== */
function renderSide(){
  const rows=REGIONS.map(r=>({r,...scoreOf(r)})).sort((x,y)=>y.score-x.score);
  const li=x=>`<button type="button" data-go="${x.r.id}"><b>${esc(x.r.name)}<small>${esc(x.r.jp)}</small></b><i>${x.score}</i></button>`;
  $('#sideLists').innerHTML=`<div class="sl good"><h4>가장 안심 · 인기 여행지 중</h4>${rows.slice(0,3).map(li).join('')}</div><div class="sl bad"><h4>주의 필요</h4>${rows.slice(-3).reverse().map(li).join('')}</div>`;
  document.querySelectorAll('#sideLists [data-go]').forEach(b=>b.onclick=()=>openRegion(b.dataset.go));
}
function renderRanking(){
  renderSide();
  const rows=REGIONS.map(r=>({r,...scoreOf(r)})).sort((x,y)=>y.score-x.score);
  $('#rankList').innerHTML=rows.map((x,i)=>{
    const tg=x.r.tags.slice(0,2).join(' · ');
    return `<button class="tile" data-id="${x.r.id}" type="button" style="--hue:${hue(x.r.id)}">
      ${vis(`${x.r.id}-hero`,x.r.name,HERO_MOTIF[x.r.id],rh(x.r.id),x.r.id+'-hero',i<2)}
      <span class="rk">${String(i+1).padStart(2,'0')}</span>${ringSvg(x.score)}
      ${x.a&&x.a.recentStrong?'<span class="al">48시간 내 강진</span>':''}
      <span class="meta"><span class="nm">${esc(x.r.name)}</span><span class="jp">${esc(x.r.jp)}</span><span class="tg">${esc(tg)}</span></span>
    </button>`;
  }).join('');
  document.querySelectorAll('#rankList .tile').forEach(el=>{ el.onclick=()=>openRegion(el.dataset.id); });
}

/* ========== 상세 화면 ========== */
let lastFocus=null;
function lockScroll(on){ document.documentElement.style.overflow=on?'hidden':''; }
function openSheet(html){
  const s=$('#sheet'); lastFocus=document.activeElement;
  s.innerHTML=html; s.scrollTop=0; s.classList.add('open'); s.setAttribute('aria-hidden','false'); lockScroll(true);
  const c=s.querySelector('.sx-close'); if(c){ c.onclick=closeSheet; c.focus({preventScroll:true}); }
  s.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>openRegion(b.dataset.go));
  s.querySelectorAll('[data-pass]').forEach(b=>b.onclick=()=>openPass(b.dataset.pass));
}
function closeSheet(){
  const s=$('#sheet'); s.classList.remove('open'); s.setAttribute('aria-hidden','true'); lockScroll(false);
  if(lastFocus&&lastFocus.focus) lastFocus.focus({preventScroll:true});
}
function recentList(p){
  if(!QUAKES) return '';
  const rows=[];
  for(const q of QUAKES){
    if(ageHours(q.earthquake.time)>24*7) continue;
    let s=0; for(const pt of q.points||[]) if(pt.pref===p.jp) s=Math.max(s,pt.scale||0);
    if(s) rows.push([q,s]);
  }
  if(!rows.length) return `<details class="more"><summary>최근 7일 이 지역에서 느껴진 지진 없음</summary></details>`;
  return `<details class="more"><summary>최근 7일 이 지역에서 느껴진 지진 ${rows.length}건</summary><ul class="plist">${rows.slice(0,8).map(([q,s])=>{
    const e=q.earthquake,h=e.hypocenter;
    return `<li><div>${esc(fmtTime(e.time))} · ${esc(ko(h.name))}</div><span>진도 ${esc(SCALE[s]||'-')} · ${h.magnitude>0?'M'+Number(h.magnitude).toFixed(1):'규모 미정'}</span></li>`;
  }).join('')}</ul></details>`;
}
function statsBox(score,prob,a){
  return `<div class="sx-stats"><div><small>안심 지수</small><b>${score}</b></div><div><small>30년 내 진도 6약+</small><b>${fmtProb(prob)}</b></div><div><small>30일 진도 3+</small><b>${a?a.felt+'회':'-'}</b></div></div>`;
}
/* 같은 현의 다른 대표 지점(공식 수치) */
function ptsBlock(pid,except){
  const pts=RISK.pref[pid].pts.filter(x=>x[0]!==except);
  if(!pts.length) return '';
  return `<details class="more"${except?'':' open'}><summary>${except?'같은 현의 다른 지점':'대표 지점별'} 30년 내 진도 6약 이상 확률</summary><ul class="plist">${pts.map(([n,v])=>`<li><div>${esc(n)}</div><span>${fmtProb(v)} · ${TIER_LABEL[tierOf(v)]}</span></li>`).join('')}</ul></details>`;
}
const credLine = k => { const c=IMGCRED[k]; return c?`<p class="credit">사진 ${esc(c.artist)} · <a href="${esc(c.page)}" target="_blank" rel="noopener">${esc(c.license)}</a></p>`:''; };

function openRegion(id){
  const r=REGION_BY_ID[id], p=PREF_BY_ID[r.pf], {score,a}=scoreOf(r), quiet=a&&a.recentStrong, h=hue(id), hk=`${id}-hero`;
  const mS=motifsFor('s',r.sights.map(x=>x[0])), mF=motifsFor('f',r.food.map(x=>x[0]));
  const sights=r.sights.map(([t,d,q],i)=>`<div class="pc" style="--hue:${hue(id+'s'+i)}">${vis(itemKey(id,'s',i),t,mS[i],rh(id,i),id+'-s'+i)}${quiet?'':`<a class="go" href="${tourUrl(r,q||t)}" target="_blank" rel="noopener sponsored">입장권</a>`}<div class="tx"><b>${esc(t)}</b><span>${esc(d)}</span></div></div>`).join('');
  const foods=r.food.map(([t,d],i)=>`<div class="pc sq" style="--hue:${hue(id+'f'+i)}">${vis(itemKey(id,'f',i),t,mF[i],rh(id,i+2),id+'-f'+i)}<div class="tx"><b>${esc(t)}</b><span>${esc(d)}</span></div></div>`).join('');
  const row=(cat,arr,chip)=>{ const m=motifsFor(cat,arr.map(x=>x[0])); return arr.map(([t,d],i)=>`<div class="row"><div class="th" style="--hue:${hue(id+cat+i)}">${vis(itemKey(id,cat,i),t,m[i],rh(id,i+1),id+cat+i)}</div><div><b>${esc(t)}</b><span>${esc(d)}</span></div>${chip(t)}</div>`).join(''); };
  const stay=row('t',r.stay,t=>quiet?'':`<a class="chip" href="${hotelUrl(r)}" target="_blank" rel="noopener sponsored">숙소</a>`);
  const shop=row('p',r.shop,t=>`<a class="chip" href="${mapUrl(t+' '+r.name)}" target="_blank" rel="noopener">지도</a>`);
  openSheet(`
    <div class="sx-hero" style="--hue:${h}">${vis(hk,r.name,HERO_MOTIF[id],rh(id),id+'-hero',true)}
      <button class="sx-close" type="button" aria-label="닫기">${IC.close}</button>
      <div class="sx-title"><span class="jp">${esc(r.jp)} · ${esc(r.en.toUpperCase())}</span><h2>${esc(r.name)}</h2><p>${esc(r.tags.join(' · '))}</p></div>
    </div>
    <div class="sx-body">
      ${statsBox(score,r.prob,a)}
      <p class="credit">확률 출처: 방재과학기술연구소 J-SHIS(${RISK.version}), ${esc(RISK.city[id].pt)} 지점 기준</p>
      ${quiet?`<div class="callout alert">${IC.alert}<div><b>최근 48시간 안에 이 지역에서 강한 지진이 있었습니다.</b><br>여진에 대비하고 현지 당국의 안내를 따르세요. 안전을 위해 여행 상품 안내를 잠시 중단합니다.</div></div>`:''}
      <div class="callout">${IC.shield}<div>${esc(r.note)}<br><b style="color:var(--ink)">안전 팁</b> · ${esc(r.safety)}</div></div>
      <div class="lock"><div class="bars"><i></i><i></i><i></i><i></i></div><div class="over">${IC.lock}<b>내 일정 맞춤 심층 리포트</b><span>출발일 기준 위험 점검 · 대피 가이드 · 추천 코스</span><button class="btn" type="button" data-pass="${id}">안심 플러스 알아보기</button></div></div>
      ${ptsBlock(r.pf,RISK.city[id].pt)}
      ${recentList(p)}
      <div class="sx-sec"><h3>볼거리 <small>SIGHTS</small></h3><div class="rail">${sights}</div></div>
      <div class="sx-sec"><h3>먹거리 <small>FOOD</small></h3><div class="rail">${foods}</div></div>
      <div class="sx-sec"><h3>숙박 추천 지역 <small>STAY</small></h3><div class="rows">${stay}</div></div>
      <div class="sx-sec"><h3>쇼핑 <small>SHOP</small></h3><div class="rows">${shop}</div></div>
      ${quiet?'':`<div class="cta-bar">
        <a href="${flightUrl(r)}" target="_blank" rel="noopener sponsored">${IC.plane}항공</a>
        <a href="${hotelUrl(r)}" target="_blank" rel="noopener sponsored">${IC.bed}숙소</a>
        <a href="${tourUrl(r)}" target="_blank" rel="noopener sponsored">${IC.ticket}투어</a>
        <a href="${esimUrl()}" target="_blank" rel="noopener sponsored">${IC.sim}eSIM</a>
        <a href="${INSURANCE_URL}" target="_blank" rel="noopener">${IC.shield}보험</a></div>
      <p class="adnote">일부 링크는 제휴 링크입니다. 이용자에게 추가 비용은 없습니다. 보험은 금융당국 공식 비교 사이트로 연결됩니다.</p>`}
    </div>`);
}
function openPref(id){
  const p=PREF_BY_ID[id], guides=REGIONS.filter(r=>r.pf===id);
  if(guides.length===1){ openRegion(guides[0].id); return; }
  const score=prefScore(p), a=actOf(p), quiet=a&&a.recentStrong;
  let list=guides;
  if(!guides.length) list=REGIONS.filter(r=>CITY_POS[r.id]).map(r=>({r,d:Math.hypot(CITY_POS[r.id].x-p.c[0],CITY_POS[r.id].y-p.c[1])})).sort((x,y)=>x.d-y.d).slice(0,3).map(x=>x.r);
  const tiles=list.map(r=>{ const sc=scoreOf(r).score; return `<button class="tile" data-go="${r.id}" type="button" style="--hue:${hue(r.id)}">${vis(`${r.id}-hero`,r.name,HERO_MOTIF[r.id],rh(r.id),r.id+'-hero')}${ringSvg(sc)}<span class="meta"><span class="nm">${esc(r.name)}</span><span class="jp">${esc(r.jp)}</span></span></button>`; }).join('');
  openSheet(`
    <div class="sx-hero" style="--hue:${hue(id)};min-height:260px;height:auto;padding-bottom:0;background:linear-gradient(160deg,${mapColor(score)},#0b1220 85%)">
      <button class="sx-close" type="button" aria-label="닫기">${IC.close}</button>
      <div class="sx-title" style="position:relative;left:auto;right:auto;bottom:auto;padding:100px var(--gutr) 56px var(--gut)"><span class="jp">${esc(p.jp)}</span><h2>${esc(prefName(p))}</h2></div>
    </div>
    <div class="sx-body">
      ${statsBox(score,p.prob,a)}
      <p class="credit">확률 출처: 방재과학기술연구소 J-SHIS(${RISK.version}), 현의 대표 지점 평균</p>
      ${quiet?`<div class="callout alert">${IC.alert}<div><b>최근 48시간 안에 이 지역에서 강한 지진이 있었습니다.</b><br>여진에 대비하고 현지 당국의 안내를 따르세요.</div></div>`:''}
      ${ptsBlock(id)}
      ${recentList(p)}
      <div class="sx-sec"><h3>${guides.length?'여행 안내 보기':'가까운 여행 안내 지역'} <small>${guides.length?'GUIDE':'NEARBY'}</small></h3>${guides.length?'':'<p style="color:var(--sub);font-size:14px;margin:-6px 0 14px">이 지역의 여행 안내는 준비 중입니다.</p>'}<div class="pgrid">${tiles}</div></div>
    </div>`);
}

/* ========== 팝업: 약관, 사진 출처 ========== */
function openModal(html){
  const m=$('#modal'); $('#dialog').innerHTML=`<button class="x" type="button" aria-label="닫기">${IC.close}</button>`+html;
  m.classList.add('open'); m.setAttribute('aria-hidden','false'); $('#dialog').scrollTop=0; $('#dialog .x').onclick=closeModal;
}
function closeModal(){ const m=$('#modal'); m.classList.remove('open'); m.setAttribute('aria-hidden','true'); }
$('#modal').addEventListener('click',e=>{ if(e.target.id==='modal') closeModal(); });
document.addEventListener('keydown',e=>{ if(e.key!=='Escape') return; if($('#modal').classList.contains('open')) closeModal(); else if($('#sheet').classList.contains('open')) closeSheet(); });
document.querySelectorAll('[data-legal]').forEach(b=>b.onclick=()=>{ const [t,body]=LEGAL[b.dataset.legal]; openModal(`<h2>${t}</h2><p>베타 버전 · 2026년 11월</p>${body}`); });
$('#opLine').innerHTML='운영 '+esc(CONFIG.operator.name)+' · 문의 <a href="mailto:'+esc(CONFIG.operator.email)+'">'+esc(CONFIG.operator.email)+'</a>';
if(!Object.keys(IMGCRED).length) $('#creditsBtn').hidden=true;
$('#creditsBtn').onclick=()=>{
  const seen=new Set(), rows=[];
  for(const [k,c] of Object.entries(IMGCRED)){
    if(seen.has(c.title)) continue; seen.add(c.title);
    rows.push(`<li><a href="${esc(c.page)}" target="_blank" rel="noopener">${esc(c.title.replace(/^File:/,'').replace(/\.[a-z]+$/i,''))}</a><br>${esc(c.artist)} · ${esc(c.license)}</li>`);
  }
  openModal(`<h2>사진 출처</h2><p>사진은 위키미디어 커먼즈의 공개 라이선스(CC BY, CC BY-SA, CC0, 퍼블릭 도메인) 사진입니다. 크기를 줄이고 일부를 잘라 사용했습니다.</p><ul>${rows.join('')}</ul>`);
};

/* ========== 기타 ========== */
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2200); }
/* ========== 분석, 신청 수집, 안심 플러스 ========== */
function track(name,p){ try{ if(window.gtag) gtag('event',name,p||{}); }catch(e){} }
if(CONFIG.gaId){
  window.dataLayer=window.dataLayer||[]; window.gtag=function(){ dataLayer.push(arguments); };
  const g=document.createElement('script'); g.async=true; g.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(CONFIG.gaId); document.head.appendChild(g);
  gtag('js',new Date()); gtag('config',CONFIG.gaId);
}
document.addEventListener('click',e=>{ const a=e.target.closest('a[rel~="sponsored"]'); if(a) track('affiliate_click',{label:a.textContent.trim()}); });
async function submitLead(d){
  const rec={...d,ts:new Date().toISOString()};
  try{ const a=JSON.parse(localStorage.getItem('anshin_leads')||'[]'); a.push(rec); localStorage.setItem('anshin_leads',JSON.stringify(a)); }catch(e){}
  track('lead',{source:d.source,region:d.region||''});
  const C=CONFIG.capture;
  if(!C||!C.url) return false;
  /* 구글 폼은 교차 출처 응답을 돌려주지 않습니다. no-cors 로 보내면 성공 여부를 읽을 수 없으므로,
     보낸 사실만 알리고 화면에는 "접수"로 안내합니다. 실제 기록은 폼 응답 시트에서 확인하세요. */
  try{
    const body=new URLSearchParams();
    for(const [k,f] of Object.entries(C.fields||{})) if(d[k]!=null && d[k]!=='') body.append(f,d[k]);
    if(C.fields && C.fields.source && d.source) body.set(C.fields.source,d.source);
    await fetch(C.url,{method:'POST',mode:'no-cors',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:body.toString()});
    return true;
  }catch(e){ return false; }
}
const PILOT_NOTE = '<p class="note">시범 운영 중입니다. 신청 정보는 아직 서버에 저장되지 않고 이 기기에만 기록됩니다.</p>';
const CAPTURE_ON = !!(CONFIG.capture && CONFIG.capture.url);
function openPass(rid){
  track('pass_open',{region:rid||''});
  const now=new Date(), months=Array.from({length:12},(_,i)=>{ const d=new Date(now.getFullYear(),now.getMonth()+i,1); return `<option value="${d.getFullYear()}-${d.getMonth()+1}">${d.getFullYear()}년 ${d.getMonth()+1}월</option>`; }).join('');
  const regs=REGIONS.map(r=>`<option value="${r.id}"${r.id===rid?' selected':''}>${esc(r.name)}</option>`).join('');
  openModal(`<h2>안심 플러스</h2><p>$3 · 30일 · 자동 갱신 없음. 지금은 결제하지 않고, 오픈 알림만 받습니다.</p>
    <form class="lead" id="leadForm">
      <label>이메일<input type="email" id="leadEmail" required autocomplete="email" placeholder="you@example.com"></label>
      <label>가장 가고 싶은 지역<select id="leadRegion">${regs}</select></label>
      <label>출발 시기<select id="leadMonth">${months}</select></label>
      <label class="chk"><input type="checkbox" id="leadOk" required><span>개인정보(이메일, 선택한 지역·시기) 수집·이용에 동의합니다. 알림 발송 목적으로 해지 시까지 보관합니다.</span></label>
      <button class="btn" type="submit">오픈 알림 신청</button>
      ${CAPTURE_ON?'':PILOT_NOTE}
    </form>`);
  $('#leadForm').addEventListener('submit',async e=>{
    e.preventDefault();
    const sent=await submitLead({source:'pass',email:$('#leadEmail').value.trim(),region:$('#leadRegion').value,month:$('#leadMonth').value});
    $('#dialog').innerHTML=`<button class="x" type="button" aria-label="닫기">${IC.close}</button><h2>신청 완료</h2><p>${sent?'오픈하면 가장 먼저 알려드리겠습니다.':'신청을 기록했습니다.'}</p>${sent?'':PILOT_NOTE}`;
    $('#dialog .x').onclick=closeModal;
  });
}
$('#passBtn').onclick=()=>openPass();
$('#subForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const sent=await submitLead({source:'alert',email:$('#subEmail').value.trim()});
  toast(sent?'신청이 접수되었습니다. 알림 서비스가 시작되면 안내해 드릴게요.':'시범 운영 중이라 이 기기에만 기록했습니다.'); $('#subEmail').value=''; $('#subOk').checked=false;
});
$('#shareBtn').onclick=()=>{ const url=location.href.split('#')[0]; navigator.clipboard.writeText(url).then(()=>toast('링크를 복사했습니다.')).catch(()=>toast(url)); };
$('#refresh').onclick=loadQuakes;

buildMap();
renderRanking();
renderMapData();
loadQuakes();
setInterval(loadQuakes,5*60*1000);
