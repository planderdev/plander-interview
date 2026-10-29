import type {
  Business,
  ConversionCheck,
  InternalScope,
  InterviewStatus,
  Needs,
  PartnerItem,
  ShareSections,
  Summary,
  UserRole,
} from "./types";

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

export const INDUSTRIES = [
  "식당, 카페",
  "뷰티, 병원",
  "법률, 세무 등 전문직",
  "쇼핑몰, 제품",
  "숙박, 체험, 관광",
  "로드샵, 매장",
  "협회, 단체, 공공",
  "IT, 스타트업",
  "기타",
];
export const MODELS = ["오프라인 매장", "온라인 판매", "B2B", "기관, 단체", "복합"];
export const STAGES = ["창업 준비", "오픈 준비", "운영 중", "확장, 리뉴얼"];
export const CHANNELS = ["홈페이지", "네이버 플레이스", "네이버 블로그", "인스타그램", "유튜브", "스마트스토어", "자사몰", "광고 집행 중"];

export const GOALS = [
  "매장 방문 늘리기",
  "검색에 잘 보이기",
  "온라인 판매 늘리기",
  "상담, 문의 늘리기",
  "브랜드 알리기",
  "외국인 고객 모으기",
  "홈페이지, 시스템 구축",
  "브랜딩, 디자인",
];
export const BUDGETS = ["100만 원 이하", "100~300만 원", "300~500만 원", "500~1,000만 원", "1,000만 원 이상", "미정"];
export const TIMELINES = ["바로 시작", "1개월 안", "분기 안", "미정"];

export const PARTNER_FIELDS = ["인쇄", "촬영", "개발", "언론", "인플루언서", "현지(중국)", "현지(일본)", "법무, 세무", "기타"];
export const PARTNER_STATUS: Record<PartnerItem["status"], string> = {
  todo: "확인 전",
  requested: "견적 요청",
  confirmed: "확정",
};

export const SHARE_SECTION_LABEL: Record<keyof ShareSections, string> = {
  summary: "미팅 정리",
  business: "고객사 정보",
  needs: "원하시는 일",
  plander: "플랜더 제안 항목",
  estimate: "예상 금액",
  nextActions: "다음 단계",
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
  industry: "", model: "", stage: "", region: "", website: "", channels: [], description: "",
});
export const emptyNeeds = (): Needs => ({ goals: [], pains: "", wish: "", timeline: "", budget: "", decisionBy: "" });
export const emptySummary = (): Summary => ({ oneline: "", external: "", risks: "", nextActions: [], internalMemo: "" });
export const defaultSections = (): ShareSections => ({
  summary: true, business: false, needs: true, plander: true, estimate: false, nextActions: true,
});
export const emptyCheck = (): ConversionCheck => ({ decisionMaker: false, budget: false, timeline: false, scope: false });
