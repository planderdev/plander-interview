import type { WebAnswer, WebKind, WebSpec } from "./types";

/**
 * 웹 서비스 제작 의뢰 인터뷰 질문.
 * 공통 질문은 어떤 사이트든 묻고, 유형을 고르면 그 유형의 질문이 더해집니다.
 * cost 가 붙은 질문은 답에 따라 제작 범위와 견적이 크게 달라집니다.
 */
export interface WebQuestion {
  id: string;
  q: string;
  /** 왜 묻는지, 어떻게 물으면 좋은지 */
  hint?: string;
  /** 빠르게 고르는 답. 없으면 메모만 씁니다. */
  options?: string[];
  cost?: boolean;
}

export interface WebGroup {
  id: "common" | WebKind;
  label: string;
  desc: string;
  questions: WebQuestion[];
}

export const WEB_KIND_LABEL: Record<WebKind, string> = {
  homepage: "홈페이지",
  shop: "쇼핑몰",
  booking: "예약 사이트",
  hotel: "숙박 예약",
  event: "행사와 접수",
};
export const WEB_KINDS = Object.keys(WEB_KIND_LABEL) as WebKind[];

const COMMON: WebGroup = {
  id: "common",
  label: "공통",
  desc: "어떤 사이트든 먼저 확인합니다.",
  questions: [
    { id: "purpose", q: "사이트로 가장 먼저 얻고 싶은 결과는 무엇인가요?", hint: "하나만 고르게 하면 첫 화면과 버튼 배치가 정해집니다.", options: ["문의 받기", "판매", "예약", "접수와 신청", "회사 소개와 신뢰"] },
    { id: "reference", q: "참고하는 사이트가 있나요? 좋은 점과 싫은 점은요?", hint: "주소와 함께 '이 부분이 좋다'를 구체적으로 받아 둡니다." },
    { id: "pages", q: "꼭 있어야 하는 메뉴와 페이지는 무엇인가요?", hint: "메뉴 수가 견적 단계(BASIC, Normal, PREMIUM)를 가릅니다.", cost: true },
    { id: "content", q: "글, 사진, 영상은 누가 준비하나요?", options: ["고객이 모두 제공", "일부만 제공", "플랜더가 작성", "촬영 필요"], cost: true },
    { id: "brand", q: "로고와 브랜드 가이드가 있나요?", options: ["가이드까지 있음", "로고만 있음", "없음 (브랜딩 필요)"], cost: true },
    { id: "language", q: "어떤 언어로 만드나요?", options: ["한국어", "영어", "중국어", "일본어"], cost: true },
    { id: "admin", q: "오픈 뒤 직접 고칠 부분은 어디인가요?", hint: "공지, 배너, 상품, 일정처럼 관리자 화면이 필요한 곳을 적습니다.", cost: true },
    { id: "login", q: "회원가입이나 로그인이 필요한가요?", options: ["필요 없음", "이메일", "카카오", "네이버", "휴대폰 본인인증"], cost: true },
    { id: "integrations", q: "연동할 서비스가 있나요?", options: ["카카오톡 채널", "알림톡과 문자", "지도", "결제", "애널리틱스와 광고 픽셀", "사내 시스템"], cost: true },
    { id: "domain", q: "도메인과 호스팅은 어떻게 되어 있나요?", options: ["도메인 있음", "호스팅 있음", "기존 사이트에서 옮김", "모두 없음"] },
    { id: "migration", q: "기존 사이트에서 옮길 데이터가 있나요?", hint: "회원, 게시글, 상품, 주문 내역 등. 옮길 양을 같이 묻습니다.", cost: true },
    { id: "legal", q: "이용약관과 개인정보처리방침이 준비되어 있나요?", options: ["있음", "작성 필요"] },
    { id: "deadline", q: "오픈 날짜가 정해진 이유가 있나요?", hint: "행사일, 시즌, 광고 시작일처럼 미룰 수 없는 날인지 확인합니다." },
    { id: "after", q: "오픈 뒤 운영은 어떻게 하실 건가요?", options: ["직접 운영", "유지보수만 맡김", "운영 대행"] },
    { id: "approver", q: "시안을 보고 최종 승인하는 사람은 누구인가요?", hint: "승인자가 미팅에 없었다면 시안 단계에서 뒤집힐 수 있습니다." },
  ],
};

const GROUPS: Record<WebKind, WebGroup> = {
  homepage: {
    id: "homepage",
    label: WEB_KIND_LABEL.homepage,
    desc: "회사, 기관, 병원, 전문직 소개와 문의 사이트",
    questions: [
      { id: "hp-contact", q: "문의는 어떤 방식으로 받나요? 누가 받나요?", options: ["문의 폼", "전화", "카카오톡 채널", "이메일"] },
      { id: "hp-board", q: "자주 올릴 게시판이 있나요?", options: ["공지", "뉴스와 보도", "포트폴리오와 사례", "채용", "자료실"], cost: true },
      { id: "hp-seo", q: "검색에서 찾게 하고 싶은 단어는 무엇인가요?", hint: "SEO 세팅과 페이지 구성에 바로 씁니다." },
      { id: "hp-a11y", q: "웹 접근성 인증이 필요한가요?", hint: "공공기관과 일부 협회는 필수입니다.", options: ["필요", "필요 없음", "모름"], cost: true },
      { id: "hp-measure", q: "문의가 어디서 들어왔는지 측정하고 싶나요?", options: ["필요", "필요 없음"] },
    ],
  },
  shop: {
    id: "shop",
    label: WEB_KIND_LABEL.shop,
    desc: "자사몰, 브랜드몰, 도매몰",
    questions: [
      { id: "sh-platform", q: "쓰고 싶은 쇼핑몰 플랫폼이 있나요?", options: ["카페24", "아임웹", "고도몰", "자체 개발", "모름"], cost: true },
      { id: "sh-products", q: "상품은 몇 개이고 옵션은 어떻게 되나요?", hint: "색과 사이즈 조합, 묶음 상품, 상품별 상세페이지 제작 여부를 같이 묻습니다.", cost: true },
      { id: "sh-sales", q: "어떤 방식으로 파나요?", options: ["일반 판매", "정기 구독", "예약 판매", "회원 등급별 가격", "B2B 도매가"], cost: true },
      { id: "sh-pay", q: "결제 수단과 PG 계약은 어떻게 되나요?", options: ["카드", "무통장 입금", "네이버페이", "카카오페이", "토스페이", "해외 결제", "PG 계약 전"] },
      { id: "sh-ship", q: "배송비와 배송 규칙은 어떻게 되나요?", hint: "조건부 무료, 도서산간 추가, 해외 배송, 택배사를 확인합니다." },
      { id: "sh-stock", q: "다른 채널과 재고를 함께 관리하나요?", options: ["스마트스토어", "오픈마켓", "오프라인 매장", "따로 관리"], cost: true },
      { id: "sh-benefit", q: "적립금, 쿠폰, 회원 등급을 쓰나요?", options: ["적립금", "쿠폰", "회원 등급", "쓰지 않음"] },
      { id: "sh-return", q: "교환, 반품, 환불은 어떻게 처리하나요?" },
      { id: "sh-special", q: "판매에 따로 지켜야 할 규정이 있나요?", hint: "건강기능식품 표시, 성인 인증, 의료기기 광고 심의 등", options: ["표시 광고 규정", "성인 인증", "해당 없음"] },
    ],
  },
  booking: {
    id: "booking",
    label: WEB_KIND_LABEL.booking,
    desc: "매장, 병원, 클래스, 체험 예약",
    questions: [
      { id: "bk-unit", q: "무엇을, 어떤 단위로 예약하나요?", hint: "담당자(디자이너, 의사), 공간, 프로그램 중 무엇을 고르는지 확인합니다.", options: ["시간 단위", "하루 단위", "회차 단위", "인원 단위"], cost: true },
      { id: "bk-capacity", q: "같은 시간에 몇 명까지 받나요? 휴무일은 어떻게 정하나요?" },
      { id: "bk-confirm", q: "예약은 바로 확정되나요, 승인 후 확정되나요?", options: ["바로 확정", "관리자 승인"] },
      { id: "bk-deposit", q: "예약금이나 선결제를 받나요?", options: ["받지 않음", "예약금", "전액 선결제"], cost: true },
      { id: "bk-cancel", q: "취소와 변경 규정은 어떻게 되나요?", hint: "몇 시간 전까지 무료인지, 노쇼는 어떻게 하는지 숫자로 받습니다." },
      { id: "bk-notify", q: "예약 알림은 어떻게 보내나요?", options: ["카카오 알림톡", "문자", "이메일", "전날 리마인드"], cost: true },
      { id: "bk-current", q: "지금은 예약을 어떻게 받고 있나요?", hint: "네이버 예약, 전화, 엑셀 등. 옮길지 함께 쓸지 정합니다.", options: ["네이버 예약", "전화", "엑셀과 수기", "다른 예약 서비스"] },
      { id: "bk-info", q: "예약할 때 받을 정보는 무엇인가요?", hint: "진료 정보처럼 민감한 정보는 받는 범위를 줄이고 동의 문구를 따로 둡니다." },
    ],
  },
  hotel: {
    id: "hotel",
    label: WEB_KIND_LABEL.hotel,
    desc: "호텔, 펜션, 게스트하우스 직접 예약",
    questions: [
      { id: "ht-rooms", q: "객실 타입은 몇 가지이고 객실은 몇 개인가요?", cost: true },
      { id: "ht-rate", q: "요금은 어떻게 달라지나요?", options: ["시즌별", "요일별", "인원 추가", "연박 할인", "조식과 옵션"], cost: true },
      { id: "ht-ota", q: "함께 판매하는 예약 채널이 있나요?", hint: "채널끼리 재고가 맞지 않으면 중복 예약이 납니다. 채널매니저나 PMS 연동이 필요한지 확인합니다.", options: ["야놀자", "여기어때", "네이버 예약", "아고다", "부킹닷컴", "에어비앤비"], cost: true },
      { id: "ht-system", q: "쓰고 있는 채널매니저나 PMS가 있나요?", options: ["있음", "없음", "모름"], cost: true },
      { id: "ht-pay", q: "결제는 언제 받나요?", options: ["예약 때 전액", "예약금만", "현장 결제", "해외 카드"] },
      { id: "ht-cancel", q: "취소 날짜별 환불 비율은 어떻게 되나요?", hint: "숙박업 표준 환불 규정을 쓰는지, 자체 규정인지 확인합니다." },
      { id: "ht-extra", q: "객실 말고 함께 예약받을 것이 있나요?", options: ["패키지", "부대시설", "픽업", "체험 상품"] },
      { id: "ht-photo", q: "객실 사진과 영상이 준비되어 있나요?", options: ["있음", "새로 촬영", "360도 촬영"], cost: true },
    ],
  },
  event: {
    id: "event",
    label: WEB_KIND_LABEL.event,
    desc: "대회, 행사, 교육 접수 사이트",
    questions: [
      { id: "ev-series", q: "한 번 하는 행사인가요, 반복되거나 여러 곳에서 열리나요?", hint: "도시별 시리즈나 매년 열리는 행사면 같은 틀로 행사를 추가하는 구조로 만듭니다.", options: ["한 번", "매년 반복", "여러 도시 시리즈"], cost: true },
      { id: "ev-category", q: "접수 종목과 정원, 마감 방식은 어떻게 되나요?", options: ["선착순", "추첨", "기간 마감"] },
      { id: "ev-qualify", q: "참가 자격을 확인해야 하나요?", hint: "기록 증빙, 나이 제한, 소속 확인처럼 서류를 받아 검토해야 하는지 묻습니다.", options: ["필요 없음", "증빙 제출", "관리자 검토"], cost: true },
      { id: "ev-apply", q: "신청서에 무엇을 받나요?", options: ["개인 신청", "단체와 크루 신청", "기념품 사이즈", "보호자 동의", "비상 연락처"] },
      { id: "ev-pay", q: "참가비는 어떻게 받나요? 입금 확인은 누가 하나요?", options: ["무통장 입금", "카드 결제", "무료"], cost: true },
      { id: "ev-self", q: "참가자가 직접 할 수 있어야 하는 일은 무엇인가요?", options: ["참가 확인", "정보 수정", "환불 신청", "기록 조회", "기록증 발급"], cost: true },
      { id: "ev-info", q: "안내 페이지는 무엇이 필요한가요?", options: ["행사 개요", "코스와 장소", "교통 통제", "유의사항", "환불 규정", "공지와 FAQ"] },
      { id: "ev-admin", q: "운영자는 접수 명단으로 무엇을 하나요?", options: ["엑셀 내려받기", "번호 부여", "문자 발송", "현장 체크인"], cost: true },
      { id: "ev-peak", q: "접수 시작 때 한꺼번에 몰리나요?", hint: "선착순 오픈 직후 동시 접속이 몰리면 서버 구성과 대기열을 따로 준비합니다.", options: ["몰림", "고르게 들어옴", "모름"] },
      { id: "ev-contact", q: "참가자 문의와 제휴, 협찬 문의는 어디로 받나요?", options: ["카카오톡 채널", "이메일", "전화", "문의 폼"] },
    ],
  },
};

/** 고른 유형에 맞는 질문 묶음. 공통이 먼저입니다. */
export function webGroups(kinds: WebKind[]): WebGroup[] {
  return [COMMON, ...WEB_KINDS.filter((k) => kinds.includes(k)).map((k) => GROUPS[k])];
}

export const emptyWeb = (): WebSpec => ({ kinds: [], answers: {} });

export const answered = (a: WebAnswer | undefined) => Boolean(a && (a.picks.length > 0 || a.note.trim()));

/** 내부 공유 페이지에 쓰는 한 줄 답 */
export const answerText = (a: WebAnswer | undefined) =>
  a ? [a.picks.join(", "), a.note.trim()].filter(Boolean).join(" / ") : "";
