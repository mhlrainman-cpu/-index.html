/* 운영 설정: 공개 후 아래 값을 채우면 수집·분석이 켜집니다. */
const CONFIG = {
  captureUrl: '',  // 이메일 신청을 받을 주소(구글 폼 응답 URL 또는 웹훅). 비어 있으면 '시범 운영' 안내가 표시되고 이 기기에만 저장됩니다.
  gaId: '',        // Google Analytics 4 측정 ID (예: G-XXXXXXXXXX)
  verify: {
    google: 'n1us022Y4cDGRvHnTiuCPVyWg1Fd8U0-1Nbl1ON6bjU',  // 구글 서치콘솔 소유권 확인
    naver: '',                                                // 네이버 서치어드바이저 소유권 확인
  },
  siteUrl: 'https://mhlrainman-cpu.github.io/-index.html/japan',  // 공개 주소 (예: https://example.com)
};
