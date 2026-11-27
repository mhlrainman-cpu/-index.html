/* 제휴 ID: 가입 후 아래 값만 채우면 모든 예약 링크에 자동으로 붙습니다. */
const AFF = {
  agodaCid: '',        // 아고다 파트너스 CID
  klookAid: '',        // 클룩 제휴 AID
  tripAllianceId: '',  // 트립닷컴 얼라이언스 ID (예약 링크 연결 시 사용)
  esimUrl: '',         // eSIM 제휴 링크 (비우면 클룩 eSIM 검색으로 연결)
};
function hotelUrl(r){
  const u = new URL('https://www.agoda.com/ko-kr/search');
  u.searchParams.set('city', r.agoda || ''); u.searchParams.set('textToSearch', r.en);
  if(AFF.agodaCid) u.searchParams.set('cid', AFF.agodaCid);
  return u.toString();
}
function tourUrl(r, q){
  const u = new URL('https://www.klook.com/ko/search/result/');
  u.searchParams.set('query', q || r.en);
  if(AFF.klookAid) u.searchParams.set('aid', AFF.klookAid);
  return u.toString();
}
function esimUrl(){ return AFF.esimUrl || 'https://www.klook.com/ko/search/result/?query=%EC%9D%BC%EB%B3%B8%20eSIM' + (AFF.klookAid?'&aid='+AFF.klookAid:''); }
const INSURANCE_URL = 'https://www.e-insmarket.or.kr/'; // 보험다모아(금융감독원·보험협회 공식 비교 사이트)
function mapUrl(q){ return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q); }
/* 항공권: 서울 출발 기준. 제휴 가입 후 받은 정식 링크 형식으로 교체하세요(지금은 제휴 없는 검색 링크). */
function flightUrl(r){ return 'https://www.skyscanner.co.kr/transport/flights/sela/' + (r.iata||'tyo').toLowerCase() + '/'; }
