/* ========== 포스터 일러스트 ==========
   사진이 없거나 아직 도착하지 않은 자리에 쓰는, 코드로 그리는 일러스트입니다(저작권 문제 없음).
   지역 색조 + 모티프 + 시드로 카드마다 다른 그림이 나옵니다. 사진이 있으면 그 위에 사진이 덮입니다. */
const REGION_HUE = {fukuoka:14, sapporo:205, nagasaki:268, hakodate:226, okinawa:174, beppu:6, kanazawa:42, kyoto:342, hiroshima:196, kobe:292, osaka:24, tokyo:252, nagoya:152};
function rng(seed){ let h=1779033703^seed.length; for(let i=0;i<seed.length;i++){ h=Math.imul(h^seed.charCodeAt(i),3432918353); h=h<<13|h>>>19; } let a=h>>>0;
  return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const f1 = n => (Math.round(n*10)/10);
function ridge(fill,base,amp,r,steps=12){
  let d=`M0 400 L0 ${f1(base-r()*amp)}`; const w=300/steps;
  for(let i=1;i<=steps;i++) d+=` L${f1(i*w)} ${f1(base-r()*amp)}`;
  return `<path d="${d} L300 400Z" fill="${fill}"/>`;
}
function wave(fill,y,amp,ph){
  let d=`M0 ${y}`; for(let x=0;x<=300;x+=50) d+=` Q${x+25} ${y+(((x/50+ph)%2)?-amp:amp)} ${x+50} ${y}`;
  return `<path d="${d} V400H0Z" fill="${fill}"/>`;
}
const steam=(x,y,c,r)=>`<path d="M${x} ${y} c-12 -22 12 -34 0 -58 s12 -30 0 -50" fill="none" stroke="${c.hi}" stroke-width="6" stroke-linecap="round" opacity="${f1(.28+r()*.2)}"/>`;
function windows(c,r,x0,y0,w,h){ let s=''; for(let y=y0+8;y<y0+h-6;y+=12) for(let x=x0+5;x<x0+w-5;x+=9) if(r()<.28) s+=`<rect x="${x}" y="${y}" width="4" height="6" fill="${c.hi}" opacity=".85"/>`; return s; }

const MOTIF = {
  mountain:(c,r)=>ridge(c.far,250,80,r)+ridge(c.mid,300,60,r)+ridge(c.near,350,34,r),
  snow:(c,r)=>ridge('#e9f1fb',250,80,r)+ridge('#bfd0e6',305,55,r)+ridge(c.near,355,30,r)+Array.from({length:34},()=>`<circle cx="${f1(r()*300)}" cy="${f1(r()*330)}" r="${f1(1+r()*2.2)}" fill="#fff" opacity="${f1(.5+r()*.5)}"/>`).join(''),
  torii:(c,r)=>ridge(c.far,300,40,r)+`<g fill="${c.acc}"><rect x="96" y="186" width="14" height="170"/><rect x="190" y="186" width="14" height="170"/><path d="M68 186 Q150 164 232 186 L228 204 Q150 186 72 204Z"/><rect x="100" y="224" width="100" height="10"/></g>`+wave(c.near,352,5,0),
  castle:(c,r)=>ridge(c.far,320,36,r)+`<g fill="${c.near}"><rect x="72" y="300" width="156" height="50"/><path d="M58 302 L242 302 L226 284 L74 284Z"/><rect x="96" y="256" width="108" height="30"/><path d="M82 258 L218 258 L204 240 L96 240Z"/><rect x="120" y="214" width="60" height="26"/><path d="M106 216 L194 216 L178 196 L122 196Z"/><path d="M150 196 L150 172" stroke="${c.near}" stroke-width="3"/></g>`+windows(c,r,96,256,108,30)+`<rect y="348" width="300" height="52" fill="${c.near}"/>`,
  pagoda:(c,r)=>ridge(c.far,310,40,r)+`<g fill="${c.near}">`+[0,1,2,3,4].map(i=>{const w=108-i*16,y=330-i*46;return `<path d="M${150-w/2-14} ${y} L${150+w/2+14} ${y} L${150+w/2} ${y-14} L${150-w/2} ${y-14}Z"/><rect x="${150-w/2+10}" y="${y-30}" width="${w-20}" height="18"/>`;}).join('')+`<rect x="148" y="70" width="4" height="40"/></g><rect y="338" width="300" height="62" fill="${c.near}"/>`,
  tower:(c,r)=>ridge(c.far,330,40,r)+`<g fill="${c.near}"><path d="M150 76 L172 350 L128 350Z"/><rect x="138" y="168" width="24" height="9"/><rect x="141" y="228" width="18" height="7"/><rect x="149" y="36" width="2" height="44"/></g><g stroke="${c.hi}" stroke-width="1" opacity=".5"><path d="M138 300 L162 250 M162 300 L138 250"/></g><rect y="350" width="300" height="50" fill="${c.near}"/>`,
  skyline:(c,r)=>{ let s=ridge(c.far,300,50,r,16), x=-6; while(x<300){ const w=20+r()*18,h=70+r()*150,y=350-h; s+=`<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" fill="${c.near}"/>`+windows(c,r,x,y,w,h); x+=w+3; } return s+`<rect y="348" width="300" height="52" fill="${c.near}"/>`; },
  bridge:(c,r)=>ridge(c.far,290,40,r)+`<path d="M-10 292 Q150 196 310 292" fill="none" stroke="${c.near}" stroke-width="10"/><rect x="-10" y="288" width="320" height="8" fill="${c.near}"/>`+[40,80,120,160,200,240].map(x=>`<path d="M${x} ${f1(292-Math.sin((x+10)/320*Math.PI)*70)} V288" stroke="${c.near}" stroke-width="2"/>`).join('')+wave(c.mid,320,6,0)+wave(c.near,352,5,1),
  waves:(c,r)=>wave(c.far,250,12,0)+wave(c.mid,290,14,1)+wave(c.near,330,12,0)+`<path d="M0 360 Q75 345 150 360 T300 360 V400H0Z" fill="${c.hi}" opacity=".16"/>`,
  steam:(c,r)=>ridge(c.far,300,50,r)+`<ellipse cx="150" cy="330" rx="120" ry="26" fill="${c.near}"/><ellipse cx="150" cy="324" rx="104" ry="18" fill="${c.hi}" opacity=".5"/>`+[90,130,170,210].map(x=>steam(x,320,c,r)).join(''),
  lanterns:(c,r)=>ridge(c.far,320,36,r)+`<path d="M-10 90 Q150 130 310 90 M-10 150 Q150 190 310 150" fill="none" stroke="${c.near}" stroke-width="2"/>`+[0,1].map(row=>Array.from({length:7},(_,i)=>{const x=20+i*43+(row?20:0),y=(row?160:100)+Math.sin(x/300*Math.PI)*22;return `<g><rect x="${f1(x-1)}" y="${f1(y-8)}" width="2" height="8" fill="${c.near}"/><ellipse cx="${f1(x)}" cy="${f1(y+12)}" rx="11" ry="15" fill="${(i+row)%3?c.acc:c.hi}"/><path d="M${f1(x-9)} ${f1(y+8)}h18M${f1(x-10)} ${f1(y+14)}h20" stroke="${c.near}" stroke-width="1" opacity=".5"/></g>`;}).join('')).join('')+`<rect y="300" width="300" height="100" fill="${c.near}"/>`+windows(c,r,0,300,300,40),
  trees:(c,r)=>ridge(c.far,290,40,r)+`<ellipse cx="150" cy="352" rx="150" ry="34" fill="${c.mid}"/><ellipse cx="150" cy="352" rx="120" ry="20" fill="${c.hi}" opacity=".25"/>`+Array.from({length:6},(_,i)=>{const x=30+i*48+r()*16,h=50+r()*46;return `<rect x="${f1(x-2)}" y="${f1(320-h/2)}" width="4" height="${f1(h/2+10)}" fill="${c.near}"/><circle cx="${f1(x)}" cy="${f1(320-h)}" r="${f1(18+r()*12)}" fill="${c.near}"/>`;}).join(''),
  ferris:(c,r)=>ridge(c.far,320,36,r)+`<circle cx="150" cy="190" r="88" fill="none" stroke="${c.near}" stroke-width="4"/><circle cx="150" cy="190" r="6" fill="${c.near}"/>`+Array.from({length:12},(_,i)=>{const a=i*Math.PI/6,x=150+Math.cos(a)*88,y=190+Math.sin(a)*88;return `<path d="M150 190L${f1(x)} ${f1(y)}" stroke="${c.near}" stroke-width="1.5"/><circle cx="${f1(x)}" cy="${f1(y)}" r="7" fill="${i%2?c.acc:c.hi}"/>`;}).join('')+`<path d="M150 190 L112 350 M150 190 L188 350" stroke="${c.near}" stroke-width="5"/><rect y="348" width="300" height="52" fill="${c.near}"/>`,
  fish:(c,r)=>wave(c.far,70,8,0)+`<g fill="${c.near}"><ellipse cx="150" cy="210" rx="108" ry="34"/><path d="M252 210 L292 170 L284 210 L292 250Z"/><path d="M110 184 L150 140 L170 186Z"/></g>`+Array.from({length:18},()=>`<circle cx="${f1(70+r()*150)}" cy="${f1(196+r()*28)}" r="${f1(1.5+r()*2)}" fill="${c.hi}" opacity=".7"/>`).join('')+wave(c.mid,345,10,1),
  bamboo:(c,r)=>Array.from({length:9},(_,i)=>{const x=20+i*33+r()*10,w=10+r()*6;return `<rect x="${f1(x)}" y="0" width="${f1(w)}" height="400" fill="${i%2?c.near:c.mid}"/>`+[70,150,230,310].map(y=>`<rect x="${f1(x-1)}" y="${y+r()*12}" width="${f1(w+2)}" height="3" fill="${c.far}"/>`).join('');}).join(''),
  bowl:(c,r)=>`<ellipse cx="150" cy="300" rx="104" ry="14" fill="${c.near}" opacity=".5"/><path d="M52 232 Q150 390 248 232Z" fill="${c.acc}"/><path d="M70 262 Q150 300 230 262" fill="none" stroke="${c.hi}" stroke-width="3" opacity=".6"/><ellipse cx="150" cy="232" rx="98" ry="22" fill="${c.hi}"/><ellipse cx="150" cy="232" rx="82" ry="16" fill="${c.sun}"/>`+Array.from({length:6},(_,i)=>`<path d="M${70+i*10} 232 q20 -10 40 0 t40 0" fill="none" stroke="${c.far}" stroke-width="2.5" opacity=".6"/>`).join('')+`<circle cx="170" cy="228" r="9" fill="${c.acc}"/><path d="M210 150 L168 232 M222 152 L180 234" stroke="${c.near}" stroke-width="4" stroke-linecap="round"/>`+[110,150,190].map(x=>steam(x,200,c,r)).join(''),
  plate:(c,r)=>`<ellipse cx="150" cy="268" rx="124" ry="48" fill="${c.hi}"/><ellipse cx="150" cy="262" rx="100" ry="36" fill="${c.sun}" opacity=".8"/>`+Array.from({length:5},(_,i)=>{const x=96+i*27,y=258+(i%2?10:-4);return `<circle cx="${x}" cy="${y}" r="17" fill="${i%2?c.acc:c.far}"/><circle cx="${x-5}" cy="${y-5}" r="4" fill="${c.hi}" opacity=".6"/>`;}).join('')+[120,170].map(x=>steam(x,230,c,r)).join(''),
  sushi:(c,r)=>`<rect x="0" y="300" width="300" height="100" fill="${c.near}"/>`+[0,1].map(i=>{const x=62+i*100,y=244+i*12;return `<rect x="${x}" y="${y}" width="90" height="42" rx="18" fill="#f4efe6"/><path d="M${x-6} ${y-4} Q${x+45} ${y-30} ${x+96} ${y-4} L${x+90} ${y+16} Q${x+45} ${y+6} ${x+6} ${y+16}Z" fill="${i?c.acc:c.sun}"/>`;}).join(''),
  skewer:(c,r)=>`<rect y="320" width="300" height="80" fill="${c.near}"/>`+[70,130,190,250].map((x,i)=>`<path d="M${x} 60 L${x-8} 330" stroke="${c.sun}" stroke-width="4" stroke-linecap="round"/>`+[150,205,260].map((y,j)=>`<rect x="${x-20-(y-150)*0.07}" y="${y}" width="36" height="42" rx="14" fill="${(i+j)%2?c.acc:c.far}"/>`).join('')).join(''),
  icecream:(c,r)=>`<path d="M104 210 L196 210 L150 360Z" fill="${c.sun}"/><path d="M118 232 L182 262 M112 258 L170 290" stroke="${c.far}" stroke-width="2.5" opacity=".6"/><circle cx="150" cy="190" r="50" fill="${c.hi}"/><circle cx="128" cy="150" r="42" fill="${c.acc}"/><circle cx="176" cy="156" r="36" fill="${c.sun}"/>`,
  cake:(c,r)=>`<rect y="320" width="300" height="80" fill="${c.near}"/><rect x="60" y="240" width="180" height="80" rx="8" fill="${c.sun}"/><rect x="60" y="240" width="180" height="22" rx="8" fill="${c.far}"/>`+[100,140,180].map(x=>`<path d="M${x} 262 V320" stroke="${c.hi}" stroke-width="2" opacity=".6"/>`).join('')+steam(110,230,c,r),
  tofu:(c,r)=>`<ellipse cx="150" cy="300" rx="120" ry="28" fill="${c.near}"/>`+[[96,252],[148,262],[200,252],[122,222]].map(([x,y])=>`<rect x="${x}" y="${y}" width="52" height="46" rx="6" fill="#f6f1e7"/><rect x="${x}" y="${y}" width="52" height="12" rx="6" fill="${c.hi}"/>`).join('')+[110,160,200].map(x=>steam(x,210,c,r)).join(''),
  cup:(c,r)=>`<rect y="318" width="300" height="82" fill="${c.near}"/><path d="M72 220 Q150 360 228 220Z" fill="${c.near}"/><ellipse cx="150" cy="220" rx="78" ry="16" fill="#9fc27a"/><ellipse cx="150" cy="218" rx="62" ry="10" fill="#7ea85c"/><path d="M178 150 L158 218" stroke="${c.hi}" stroke-width="5" stroke-linecap="round"/>`+steam(130,196,c,r),
};
const MOTIF_ALIAS = {city:'skyline',station:'skyline',park:'trees',sea:'waves',onsen:'steam',market:'lanterns',shrine:'torii',noodle:'bowl',dish:'plate'};
const MOTIF_RULES = [
  [/라멘|면|소바|우동|짬뽕|카레|나베|수프/,'bowl'],[/초밥|스시/,'sushi'],[/쿠시|꼬치|야타이|튀김|도리텐|데바사키/,'skewer'],[/아이스|소프트|블루실/,'icecream'],
  [/카스텔라|만주|케이크|떡|디저트|파르페|단고/,'cake'],[/두부|유도후/,'tofu'],[/말차|차/,'cup'],[/야키|타코|덮밥|굴|규|스테이크|카츠|마부시|가이세키|메시|찜|구로|짬/,'plate'],
  [/신사|이나리|도리이|텐만구|이쓰쿠시마|메이지|아쓰타|센소지|궁/,'torii'],[/성$|성 |고료카쿠|오사카성|나고야성|슈리/,'castle'],[/기요미즈|킨카쿠|탑|아라시야마/,'pagoda'],
  [/타워|스카이트리|공중정원|스카이/,'tower'],[/수족관/,'fish'],[/해변|바다|고우리|만좌모|모모치/,'waves'],[/온천|지옥|간나와|유노카와|아리마/,'steam'],
  [/공원|정원|오호리|겐로쿠엔|슈케이엔|긴린코|호수/,'trees'],[/다리|운하|뱃놀이|야나가와/,'bridge'],[/하버랜드|유니버설|지브리|테마/,'ferris'],
  [/시장|상점|아케이드|거리|도톤보리|캐널|스스키노|가도|국제거리|가와라마치|모토마치|지하상가|오스|고린보|센터가이|모자이크|창고|쇼핑/,'lanterns'],
  [/야경|스크램블|역|난바|우메다|신주쿠|긴자|우에노|사카에|하라주쿠|아키하바라|산노미야|핫초보리|하코다테산|이나사야마|롯코산|모이와/,'skyline'],
];
const CAT_DEFAULT = {s:'mountain',t:'skyline',p:'lanterns',f:'plate',h:'skyline'};
const HERO_MOTIF = {fukuoka:'tower',sapporo:'snow',nagasaki:'skyline',hakodate:'skyline',okinawa:'waves',beppu:'steam',kanazawa:'castle',kyoto:'pagoda',hiroshima:'torii',kobe:'ferris',osaka:'castle',tokyo:'tower',nagoya:'castle'};
function motifFor(cat,title){ for(const [re,m] of MOTIF_RULES) if(re.test(title||'')) return m; return CAT_DEFAULT[cat]||'mountain'; }

/* 포스터 SVG: motif 이름, 기준 색조, 시드 */
let POSTER_N = 0;
function poster(motif,h,seed){
  const r=rng(seed), id='pg'+(POSTER_N++);
  motif = MOTIF[motif]?motif:(MOTIF_ALIAS[motif]||'mountain');
  const dusk = r()<.5;
  const c={sky1:`hsl(${h} 46% ${dusk?18:24}%)`,sky2:`hsl(${(h+26)%360} 78% ${dusk?56:64}%)`,sun:`hsl(${(h+44)%360} 96% 80%)`,far:`hsl(${(h+8)%360} 36% 34%)`,mid:`hsl(${(h+8)%360} 40% 24%)`,near:`hsl(${(h+8)%360} 44% 13%)`,hi:`hsl(${(h+48)%360} 100% 88%)`,acc:'#ee4a50'};
  const sx=f1(50+r()*200), sy=f1(90+r()*90), sr=f1(30+r()*22);
  const food=/^(bowl|plate|sushi|skewer|icecream|cake|tofu|cup)$/.test(motif);
  const sun=food?'':`<circle cx="${sx}" cy="${sy}" r="${f1(sr*2.2)}" fill="${c.sun}" opacity=".16"/><circle cx="${sx}" cy="${sy}" r="${sr}" fill="${c.sun}" opacity=".95"/>`;
  return `<svg class="art" viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.sky1}"/><stop offset="1" stop-color="${c.sky2}"/></linearGradient></defs><rect width="300" height="400" fill="url(#${id})"/>${sun}${MOTIF[motif](c,r)}</svg>`;
}
