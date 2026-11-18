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

/* 추가 모티프: 숙박·쇼핑·음식이 서로 다른 그림이 되도록 */
Object.assign(MOTIF,{
  train:(c,r)=>ridge(c.far,290,40,r)+`<path d="M60 400 L138 262 M240 400 L162 262" stroke="${c.near}" stroke-width="5"/>`+[0,1,2,3,4].map(k=>`<path d="M${86+k*8} ${340-k*14} H${214-k*8}" stroke="${c.near}" stroke-width="3"/>`).join('')+`<rect x="104" y="156" width="92" height="124" rx="16" fill="${c.near}"/><rect x="116" y="170" width="68" height="40" rx="8" fill="${c.hi}" opacity=".85"/><rect x="104" y="236" width="92" height="8" fill="${c.acc}"/><circle cx="122" cy="262" r="7" fill="${c.sun}"/><circle cx="178" cy="262" r="7" fill="${c.sun}"/><rect x="0" y="350" width="300" height="50" fill="${c.near}"/>`,
  hotel:(c,r)=>ridge(c.far,310,30,r)+`<rect x="84" y="96" width="132" height="254" fill="${c.near}"/><rect x="92" y="78" width="116" height="18" fill="${c.acc}"/><rect x="40" y="200" width="44" height="150" fill="${c.mid}"/><rect x="216" y="170" width="44" height="180" fill="${c.mid}"/>`+windows(c,r,84,96,132,254)+`<rect y="348" width="300" height="52" fill="${c.near}"/>`,
  ryokan:(c,r)=>ridge(c.far,300,36,r)+`<path d="M24 250 Q150 186 276 250 L264 264 Q150 214 36 264Z" fill="${c.near}"/><rect x="56" y="264" width="188" height="88" fill="${c.near}"/>`+[0,1,2,3,4].map(k=>`<rect x="${64+k*36}" y="274" width="28" height="64" fill="${c.hi}" opacity="${f1(.55+r()*.35)}"/>`).join('')+`<circle cx="44" cy="300" r="13" fill="${c.acc}"/><circle cx="262" cy="214" r="26" fill="${c.mid}"/><rect y="350" width="300" height="50" fill="${c.near}"/>`,
  resort:(c,r)=>wave(c.far,262,8,0)+wave(c.mid,300,10,1)+`<ellipse cx="150" cy="372" rx="190" ry="48" fill="${c.hi}" opacity=".55"/><path d="M96 380 Q112 260 150 168" fill="none" stroke="${c.near}" stroke-width="9" stroke-linecap="round"/>`+[[-70,10],[-40,-34],[0,-46],[40,-30],[72,12]].map(([dx,dy])=>`<path d="M150 168 Q${150+dx*0.7} ${168+dy-26} ${150+dx} ${168+dy+22}" fill="none" stroke="${c.near}" stroke-width="8" stroke-linecap="round"/>`).join('')+`<path d="M196 300 Q238 244 280 300Z" fill="${c.acc}"/><path d="M238 300 V350" stroke="${c.near}" stroke-width="3"/>`,
  arcade:(c,r)=>`<path d="M0 0 L112 140 L112 262 L0 400Z" fill="${c.near}"/><path d="M300 0 L188 140 L188 262 L300 400Z" fill="${c.near}"/><path d="M0 400 L112 262 L188 262 L300 400Z" fill="${c.mid}"/>`+[0,1,2,3,4].map(k=>`<rect x="${f1(138-k*0)}" y="${f1(150+k*20)}" width="${f1(24)}" height="6" rx="3" fill="${c.hi}" opacity="${f1(.9-k*.12)}"/>`).join('')+[0,1,2].map(k=>`<rect x="${14+k*28}" y="${190+k*18}" width="${f1(22-k*5)}" height="${f1(30-k*6)}" fill="${[c.acc,c.hi,c.sun][k]}" opacity=".85"/><rect x="${f1(264-k*20)}" y="${190+k*18}" width="${f1(22-k*5)}" height="${f1(30-k*6)}" fill="${[c.hi,c.acc,c.sun][k]}" opacity=".85"/>`).join('')+`<rect x="112" y="140" width="76" height="122" fill="${c.sky2||c.far}" opacity=".35"/>`,
  mall:(c,r)=>ridge(c.far,320,28,r)+`<rect x="34" y="150" width="232" height="200" fill="${c.near}"/><rect x="34" y="124" width="232" height="26" fill="${c.acc}"/>`+Array.from({length:4},(_,k)=>`<path d="M${34+k*58} 150 V350" stroke="${c.far}" stroke-width="2"/>`).join('')+Array.from({length:3},(_,k)=>`<path d="M34 ${200+k*50} H266" stroke="${c.far}" stroke-width="2"/>`).join('')+[[50,160],[108,210],[166,160],[224,260],[50,260]].map(([x,y])=>`<rect x="${x}" y="${y}" width="42" height="40" fill="${c.hi}" opacity="${f1(.35+r()*.5)}"/>`).join('')+`<rect y="348" width="300" height="52" fill="${c.near}"/>`,
  stall:(c,r)=>ridge(c.far,310,30,r)+[0,1,2].map(k=>{const x=18+k*92;return `<path d="M${x} 190 H${x+84} L${x+94} 226 H${x-10}Z" fill="${k%2?c.hi:c.acc}"/><path d="M${x} 190 L${x-10} 226 M${x+21} 190 L${x+17} 226 M${x+42} 190 L${x+42} 226 M${x+63} 190 L${x+67} 226 M${x+84} 190 L${x+94} 226" stroke="${c.near}" stroke-width="3" opacity=".35"/><rect x="${x-4}" y="226" width="92" height="104" fill="${c.near}"/>`+[0,1,2].map(j=>`<circle cx="${x+14+j*28}" cy="${250+(k+j)%2*10}" r="11" fill="${[c.acc,c.sun,c.hi][(j+k)%3]}"/>`).join('');}).join('')+`<rect y="330" width="300" height="70" fill="${c.near}"/>`,
  neon:(c,r)=>`<rect y="300" width="300" height="100" fill="${c.near}"/>`+[[24,90,70,120,c.acc],[104,60,60,90,c.hi],[178,110,52,150,c.sun],[240,70,50,110,c.acc]].map(([x,y,w,h,col])=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${c.near}" stroke="${col}" stroke-width="9" opacity=".25"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${c.near}" stroke="${col}" stroke-width="3"/>`+[0,1,2].map(k=>`<path d="M${x+10} ${y+22+k*Math.max(18,h/4)} H${x+w-10}" stroke="${col}" stroke-width="3" stroke-linecap="round" opacity=".9"/>`).join('')).join(''),
  gift:(c,r)=>`<rect y="318" width="300" height="82" fill="${c.near}"/>`+Array.from({length:12},(_,k)=>{const x=40+(k%4)*52+(Math.floor(k/4)%2)*12,y=120+Math.floor(k/4)*60;return `<rect x="${x}" y="${y}" width="42" height="42" rx="4" fill="${k%3?c.sun:c.hi}" opacity="${f1(.55+r()*.4)}"/>`;}).join('')+`<rect x="116" y="270" width="68" height="50" fill="${c.acc}"/><path d="M150 270 V320 M116 292 H184" stroke="${c.hi}" stroke-width="5"/>`,
  nightview:(c,r)=>`<path d="M0 214 Q70 336 150 336 Q230 336 300 214 V400H0Z" fill="${c.near}"/><path d="M0 250 Q70 350 150 350 Q230 350 300 250" fill="none" stroke="${c.far}" stroke-width="10" opacity=".6"/>`+Array.from({length:90},()=>{const t=r(),x=40+t*220,y=300+Math.sin(t*Math.PI)*34-r()*74*Math.sin(t*Math.PI)-10;return `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(1+r()*1.6)}" fill="${r()<.2?c.sun:c.hi}" opacity="${f1(.55+r()*.45)}"/>`;}).join(''),
  skytree:(c,r)=>ridge(c.far,336,30,r)+`<g fill="${c.near}"><path d="M150 16 L155 300 L145 300Z"/><path d="M150 300 L196 352 L104 352Z"/><ellipse cx="150" cy="200" rx="22" ry="9"/><ellipse cx="150" cy="150" rx="15" ry="7"/></g><rect x="148" y="8" width="4" height="16" fill="${c.near}"/><rect y="350" width="300" height="50" fill="${c.near}"/>`,
  seafood:(c,r)=>`<ellipse cx="150" cy="276" rx="128" ry="50" fill="${c.hi}"/><ellipse cx="150" cy="270" rx="104" ry="38" fill="${c.sun}" opacity=".7"/><g transform="translate(150 268)"><ellipse rx="64" ry="24" fill="${c.acc}"/><path d="M62 0 L102 -26 L94 0 L102 26Z" fill="${c.acc}"/><circle cx="-38" cy="-4" r="5" fill="${c.near}"/><path d="M-8 -22 Q10 -8 -8 22" fill="none" stroke="${c.hi}" stroke-width="3" opacity=".6"/></g><circle cx="58" cy="290" r="15" fill="${c.hi}"/><circle cx="58" cy="290" r="9" fill="${c.sun}"/>`,
  dumpling:(c,r)=>`<ellipse cx="150" cy="312" rx="118" ry="24" fill="${c.near}" opacity=".5"/><ellipse cx="150" cy="288" rx="104" ry="30" fill="${c.mid}"/><rect x="46" y="234" width="208" height="56" fill="${c.far}"/><ellipse cx="150" cy="234" rx="104" ry="30" fill="${c.sun}"/><ellipse cx="150" cy="190" rx="92" ry="26" fill="${c.mid}"/><rect x="58" y="150" width="184" height="42" fill="${c.far}"/><ellipse cx="150" cy="150" rx="92" ry="26" fill="${c.hi}"/>`+[100,150,200].map(x=>steam(x,130,c,r)).join(''),
  pot:(c,r)=>`<ellipse cx="150" cy="320" rx="130" ry="20" fill="${c.near}" opacity=".5"/><path d="M52 250 Q54 340 150 344 Q246 340 248 250Z" fill="${c.near}"/><ellipse cx="150" cy="250" rx="98" ry="20" fill="${c.acc}"/><ellipse cx="150" cy="248" rx="82" ry="13" fill="${c.sun}" opacity=".9"/><circle cx="46" cy="262" r="12" fill="none" stroke="${c.near}" stroke-width="6"/><circle cx="254" cy="262" r="12" fill="none" stroke="${c.near}" stroke-width="6"/>`+[108,150,192].map((x,i)=>`<circle cx="${x}" cy="${244+(i%2)*6}" r="${11+i%2*3}" fill="${[c.far,c.hi,c.far][i]}"/>`).join('')+[116,160,204].map(x=>steam(x,226,c,r)).join(''),
});
const MOTIF_ALIAS = {city:'skyline',station:'train',park:'trees',sea:'waves',onsen:'steam',market:'stall',shrine:'torii',noodle:'bowl',dish:'plate'};

/* 항목 종류별 규칙 */
const RULES = {
  s:[[/신사|이나리|도리이|텐만구|이쓰쿠시마|메이지|아쓰타|센소지|궁/,'torii'],[/성$|성 |고료카쿠|슈리/,'castle'],[/기요미즈|킨카쿠|탑|아라시야마/,'pagoda'],[/스카이트리/,'skytree'],[/타워|공중정원/,'tower'],[/수족관/,'fish'],[/해변|바다|고우리|만좌모|모모치/,'waves'],[/온천|지옥|아리마/,'steam'],[/공원|정원|오호리|겐로쿠엔|슈케이엔|긴린코|호수/,'trees'],[/다리|운하|뱃놀이|야나가와/,'bridge'],[/하버랜드|유니버설|지브리|테마|스튜디오|하우스텐보스/,'ferris'],[/야경|스크램블|하코다테산|이나사야마|롯코산|모이와|로프웨이/,'nightview'],[/시장|도톤보리|차야가이|모토마치|이진칸|글로버|데지마|시계탑|미술관/,'lanterns']],
  t:[[/역/,'train'],[/온천|간나와|유후인|유노카와|료칸/,'ryokan'],[/리조트|해변|온나손/,'resort'],[/신주쿠|긴자|우에노|난바|우메다|산노미야|사카에|텐진|하카타|나카스|스스키노|핫초보리|고린보|시조|하마노마치|국제거리|하버랜드/,'skyline']],
  p:[[/아키하바라|신사이바시|시부야|하라주쿠|긴자/,'neon'],[/몰|플라자|팩토리|백화점|아울렛|캐널|모자이크|창고|아뮤/,'mall'],[/시장|니시키/,'stall'],[/금박|공예|기념품/,'gift'],[/아케이드|상점가|지하상가|센터가이|거리|혼도리|오모테산도|국제거리|가와라마치|오스|스지|고린보|유노쓰보|역/,'arcade']],
  f:[[/나베|찜/,'pot'],[/라멘|면|소바|우동|짬뽕|카레|수프|국$|지루/,'bowl'],[/초밥|스시/,'sushi'],[/쿠시|꼬치|야타이|튀김|도리텐|데바사키/,'skewer'],[/아이스|소프트|블루실/,'icecream'],[/카스텔라|케이크|디저트|파르페|럭키/,'cake'],[/만주|타코|교자|야키|난킨/,'dumpling'],[/두부|유도후/,'tofu'],[/말차/,'cup'],[/해산물|덮밥|굴|구로|생선/,'seafood']],
};
const CAT_DEFAULT = {s:'mountain',t:'hotel',p:'lanterns',f:'plate',h:'skyline'};
const POOLS = {
  s:['mountain','trees','bridge','nightview','waves','pagoda','castle','torii','tower','steam','lanterns','ferris'],
  t:['skyline','hotel','train','ryokan','resort','nightview','trees'],
  p:['arcade','lanterns','mall','stall','neon','gift'],
  f:['bowl','plate','seafood','skewer','dumpling','cake','sushi','cup','tofu','icecream','pot'],
};
const HERO_MOTIF = {fukuoka:'tower',sapporo:'snow',nagasaki:'lanterns',hakodate:'nightview',okinawa:'waves',beppu:'steam',kanazawa:'trees',kyoto:'pagoda',hiroshima:'torii',kobe:'ferris',osaka:'neon',tokyo:'skytree',nagoya:'castle'};
function motifFor(cat,title){ for(const [re,m] of (RULES[cat]||[])) if(re.test(title||'')) return m; return CAT_DEFAULT[cat]||'mountain'; }
/* 같은 목록 안에서는 모티프가 겹치지 않게 배정 */
function motifsFor(cat,titles){
  const used=new Set();
  return titles.map(t=>{ let m=motifFor(cat,t); if(used.has(m)) m=(POOLS[cat]||[]).find(x=>!used.has(x))||m; used.add(m); return m; });
}

/* 포스터 SVG: 모티프, 기준 색조, 시드. 그림 스타일 4가지(석양·밤·플랫·낮), 좌우 반전과 크기 변화 */
let POSTER_N = 0;
function poster(motif,h,seed){
  const r=rng(seed), id='pg'+(POSTER_N++);
  motif = MOTIF[motif]?motif:(MOTIF_ALIAS[motif]||'mountain');
  const food=/^(bowl|plate|sushi|skewer|icecream|cake|tofu|cup|seafood|dumpling|pot)$/.test(motif);
  const v=['dusk','night','flat','day'][Math.floor(r()*4)];
  const H=x=>(h+x+360)%360;
  let c, bg, sun='';
  const sx=f1(40+r()*220), sy=f1(80+r()*100), sr=f1(28+r()*24);
  if(v==='night'){
    c={far:`hsl(${H(8)} 34% 26%)`,mid:`hsl(${H(8)} 38% 18%)`,near:`hsl(${H(8)} 44% 9%)`,hi:`hsl(${H(48)} 100% 88%)`,sun:`hsl(${H(44)} 70% 90%)`,acc:'#ee4a50',sky2:`hsl(${H(20)} 55% 30%)`};
    bg=`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${H(0)} 52% 9%)"/><stop offset="1" stop-color="${c.sky2}"/></linearGradient>`;
    sun=`<circle cx="${sx}" cy="${sy}" r="${f1(sr*.6)}" fill="${c.sun}"/>`+Array.from({length:26},()=>`<circle cx="${f1(r()*300)}" cy="${f1(r()*240)}" r="${f1(.6+r()*1.4)}" fill="#fff" opacity="${f1(.4+r()*.6)}"/>`).join('');
  }else if(v==='flat'){
    c={far:`hsl(${H(10)} 36% 46%)`,mid:`hsl(${H(10)} 40% 32%)`,near:`hsl(${H(10)} 46% 16%)`,hi:`hsl(${H(46)} 100% 90%)`,sun:`hsl(${H(40)} 92% 62%)`,acc:'#ee4a50',sky2:`hsl(${H(14)} 62% 76%)`};
    bg=`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${H(6)} 58% 80%)"/><stop offset="1" stop-color="${c.sky2}"/></linearGradient>`;
    sun=food?'':`<circle cx="${sx}" cy="${sy}" r="${f1(sr*1.7)}" fill="${c.sun}"/>`;
  }else if(v==='day'){
    c={far:`hsl(${H(10)} 32% 40%)`,mid:`hsl(${H(10)} 38% 28%)`,near:`hsl(${H(10)} 44% 14%)`,hi:`hsl(${H(46)} 100% 92%)`,sun:`hsl(${H(40)} 100% 82%)`,acc:'#ee4a50',sky2:`hsl(${H(26)} 80% 86%)`};
    bg=`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${H(-6)} 64% 62%)"/><stop offset="1" stop-color="${c.sky2}"/></linearGradient>`;
    sun=food?'':`<circle cx="${sx}" cy="${sy}" r="${f1(sr*2)}" fill="#fff" opacity=".22"/><circle cx="${sx}" cy="${sy}" r="${sr}" fill="${c.sun}"/>`;
  }else{
    c={far:`hsl(${H(8)} 36% 34%)`,mid:`hsl(${H(8)} 40% 24%)`,near:`hsl(${H(8)} 44% 13%)`,hi:`hsl(${H(48)} 100% 88%)`,sun:`hsl(${H(44)} 96% 80%)`,acc:'#ee4a50',sky2:`hsl(${H(26)} 78% 58%)`};
    bg=`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${H(0)} 46% 18%)"/><stop offset="1" stop-color="${c.sky2}"/></linearGradient>`;
    sun=food?'':`<circle cx="${sx}" cy="${sy}" r="${f1(sr*2.2)}" fill="${c.sun}" opacity=".16"/><circle cx="${sx}" cy="${sy}" r="${sr}" fill="${c.sun}" opacity=".95"/>`;
  }
  const flip=r()<.5, sc=f1(.92+r()*.18), dx=f1((r()-.5)*28);
  const tf=`translate(${flip?300+dx:dx} ${f1(400*(1-sc)/2)}) scale(${flip?-sc:sc} ${sc})`;
  return `<svg class="art" viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><defs>${bg}</defs><rect width="300" height="400" fill="url(#${id})"/>${sun}<g transform="${tf}">${MOTIF[motif](c,r)}</g></svg>`;
}
