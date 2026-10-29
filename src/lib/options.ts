import type {
  Business,
  ConversionCheck,
  InternalScope,
  InterviewStatus,
  Needs,
  PartnerItem,
  Quote,
  ShareSections,
  Summary,
  UserRole,
} from "./types";
import { emptyWeb } from "./web-interview";

export const STATUS_META: Record<InterviewStatus, { label: string; tone: string }> = {
  draft: { label: "작성중", tone: "text-sub" },
  organized: { label: "정리 완료", tone: "text-prism" },
  proposed: { label: "제안중", tone: "text-warning" },
  converted: { label: "의뢰 전환", tone: "text-success" },
  dropped: { label: "보류", tone: "text-danger" },
};
export const STATUS_ORDER: InterviewStatus[] = ["draft", "organized", "proposed", "converted", "dropped"];

export const ROLE_LABEL: Record<UserRole, string> = {
  super_admin: "슈퍼운영자",
  operator: "운영자",
  user: "팀원",
};

export const SCOPE_META: Record<InternalScope, { label: string; desc: string }> = {
  team: { label: "팀 전체", desc: "웍스 계정이 있는 플랜더 구성원 모두가 봅니다." },
  operators: { label: "운영자와 참석자", desc: "운영자 이상, 작성자, 이 미팅의 플랜더 참석자만 봅니다." },
  participants: { label: "참석자만", desc: "작성자와 플랜더 참석자, 슈퍼운영자만 봅니다." },
};

export const METHODS = ["대면", "화상", "전화", "메신저"];

export const COUNTERPART_ROLE: Record<string, string> = {
  decision: "결정권자",
  practical: "실무 담당",
  reference: "참고인",
};

/** 업종: 에임 레시피 빌더의 10개 업종에 마케팅 외 의뢰(관광, 기관, IT)를 더했습니다. */
export const INDUSTRIES = [
  "로컬 매장",
  "식품과 건강",
  "뷰티와 화장품",
  "패션과 잡화",
  "생활용품",
  "반려동물",
  "이커머스 일반",
  "변호사와 세무사",
  "병원과 의료",
  "교육과 콘텐츠",
  "숙박과 관광",
  "협회와 공공기관",
  "IT 스타트업",
  "기타",
];
export const MODELS = ["오프라인 매장", "온라인 판매", "B2B", "기관과 단체", "복합"];
/** 지금 운영 중인 채널: 에임 보유 판매 채널(자사몰, 스마트스토어, 오픈마켓, 오프라인 매장)을 포함합니다. */
export const CHANNELS = [
  "오프라인 매장",
  "자사몰",
  "스마트스토어",
  "오픈마켓",
  "홈페이지",
  "네이버 플레이스",
  "네이버 블로그",
  "인스타그램",
  "유튜브",
  "카카오톡 채널",
  "광고 집행 중",
];
/** 에임 레시피 빌더의 타겟 고객 */
export const TARGETS = ["여성 중심", "남성 중심", "10~20대", "30~40대", "50대 이상", "B2B"];
/** 에임 레시피 빌더의 하고 싶은 채널 */
export const WANT_CHANNELS = [
  "인스타그램",
  "유튜브",
  "틱톡",
  "쓰레드",
  "네이버 블로그",
  "네이버 카페",
  "체험단과 리뷰",
  "순위 작업",
  "메타 광고",
  "클립과 숏폼",
];
/** 에임 레시피 빌더의 계약 기간 */
export const PERIODS = ["1개월 (테스트)", "3개월", "6개월", "12개월"];
/** 에임 레시피 빌더의 제약 조건 */
export const CONSTRAINTS = ["가격비교 작업 불가", "광고 표기(#광고) 엄수", "매체 광고비 집행 없음"];

export const GOALS = [
  "매장 방문 늘리기",
  "검색에 잘 보이기",
  "온라인 판매 늘리기",
  "상담 문의 늘리기",
  "브랜드 알리기",
  "외국인 고객 모으기",
  "홈페이지와 시스템 구축",
  "브랜딩과 디자인",
];
export const BUDGETS = ["100만 원 이하", "100~300만 원", "300~500만 원", "500~1,000만 원", "1,000만 원 이상", "미정"];
export const TIMELINES = ["바로 시작", "1개월 안", "분기 안", "미정"];

export const PARTNER_FIELDS = ["인쇄", "촬영", "개발", "언론", "인플루언서", "현지(중국)", "법무와 세무", "기타"];
export const PARTNER_STATUS: Record<PartnerItem["status"], string> = {
  todo: "확인 전",
  requested: "견적 요청",
  confirmed: "확정",
};

/** 고객 공유에서 고를 수 있는 항목 */
export const SHARE_KEYS = ["needs", "business", "plander", "estimate"] as const;
export const SHARE_SECTION_LABEL: Partial<Record<keyof ShareSections, string>> = {
  business: "고객사 정보",
  needs: "원하시는 일",
  plander: "플랜더 제안 항목",
  estimate: "예상 금액",
};

export const CHECK_LABEL: Record<keyof ConversionCheck, string> = {
  decisionMaker: "결정권자와 이야기했다",
  budget: "예산 범위를 들었다",
  timeline: "시작 시점을 들었다",
  scope: "할 일 범위에 공감했다",
};

/** 웍스 프로젝트 카테고리 (plander-works src/lib/constants.ts 와 같게 유지) */
export const PROJECT_CATEGORIES = [
  "홈페이지 제작",
  "IT프로덕트",
  "브랜딩",
  "컨설팅",
  "국내마케팅",
  "중국마케팅",
  "편집디자인",
];

export const emptyBusiness = (): Business => ({
  industry: "", model: "", stage: "", funnel: [], region: "", website: "", channels: [], description: "",
});
export const emptyNeeds = (): Needs => ({
  goals: [], targets: [], wantChannels: [], period: "", constraints: [],
  pains: "", wish: "", timeline: "", budget: "", decisionBy: "", web: emptyWeb(),
});
export const emptySummary = (): Summary => ({ oneline: "", external: "", risks: "", nextActions: [], internalMemo: "" });
export const defaultSections = (): ShareSections => ({
  summary: false, business: false, needs: true, plander: true, estimate: false, nextActions: false,
});
export const DEFAULT_QUOTE_NOTE =
  "세부 제작 규격과 수량, 소재와 후가공 범위는 협의 후 확정합니다. 광고 매체비는 견적에 포함하지 않습니다.";
export const emptyQuote = (): Quote => ({
  title: "", no: "", date: "", staffName: "", staffContact: "",
  recipientName: "", recipientPhone: "", recipientEmail: "", recipientAddress: "", note: "",
});
export const emptyCheck = (): ConversionCheck => ({ decisionMaker: false, budget: false, timeline: false, scope: false });

/** 예전 선택지 이름을 지금 이름으로 바꿉니다. 저장된 기록을 읽을 때 씁니다. */
const LEGACY_LABEL: Record<string, string> = {
  "로컬, 오프라인 매장": "로컬 매장",
  "식품, 건강": "식품과 건강",
  "뷰티, 화장품": "뷰티와 화장품",
  "패션, 잡화": "패션과 잡화",
  "리빙, 생활용품": "생활용품",
  "펫, 반려동물": "반려동물",
  "전문직 (변호사, 세무사)": "변호사와 세무사",
  "병원, 의료": "병원과 의료",
  "교육, 콘텐츠": "교육과 콘텐츠",
  "숙박, 체험, 관광": "숙박과 관광",
  "협회, 단체, 공공": "협회와 공공기관",
  "IT, 스타트업": "IT 스타트업",
  "기관, 단체": "기관과 단체",
  "쿠팡, 오픈마켓": "오픈마켓",
  "체험단, 리뷰": "체험단과 리뷰",
  "순위, 트래픽": "순위 작업",
  "클립, 숏폼": "클립과 숏폼",
  "상담, 문의 늘리기": "상담 문의 늘리기",
  "홈페이지, 시스템 구축": "홈페이지와 시스템 구축",
  "브랜딩, 디자인": "브랜딩과 디자인",
  "법무, 세무": "법무와 세무",
  "식당, 카페": "로컬 매장",
  "뷰티, 병원": "뷰티와 화장품",
  "법률, 세무 등 전문직": "변호사와 세무사",
  "쇼핑몰, 제품": "이커머스 일반",
  "로드샵, 매장": "로컬 매장",
};
export const relabel = (v: string) => LEGACY_LABEL[v] ?? v;
export const relabelAll = (vs: string[]) => [...new Set(vs.map(relabel))];
