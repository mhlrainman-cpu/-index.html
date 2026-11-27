/* 운영 설정: 공개 후 아래 값을 채우면 수집·분석이 켜집니다. */
const CONFIG = {
  // 신청 수집: 구글 폼. fields 는 폼 질문별 입력 ID 입니다.
  capture: {
    url: 'https://docs.google.com/forms/d/e/1FAIpQLSfvvOwTJU_tzy169dolgq3NY0sKGpmld9LRn7PYBKQQByyIIA/formResponse',
    fields: { email: 'entry.2123631466', region: 'entry.1077490080', month: 'entry.83133083' },
  },
  gaId: '',        // Google Analytics 4 측정 ID (예: G-XXXXXXXXXX)
  verify: {
    google: 'n1us022Y4cDGRvHnTiuCPVyWg1Fd8U0-1Nbl1ON6bjU',  // 구글 서치콘솔 소유권 확인
    naver: '',                                                // 네이버 서치어드바이저 소유권 확인
  },
  indexNowKey: 'bae7065bcf637a924e307999ac85dcaa',  // 네이버·빙 색인 요청(IndexNow) 인증 키. 같은 이름의 .txt 파일이 japan/ 에 있어야 합니다
  siteUrl: 'https://mhlrainman-cpu.github.io/-index.html/japan',  // 공개 주소 (예: https://example.com)
};
