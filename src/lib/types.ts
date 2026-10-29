/** 웍스 계정 역할 (pw_users.role 과 같음) */
export type UserRole = "super_admin" | "operator" | "user";

export interface Member {
  id: string;
  name: string;
  role: UserRole;
  position: string;
  team: string;
}

/** 인터뷰 진행 상태 */
export type InterviewStatus = "draft" | "organized" | "proposed" | "converted" | "dropped";

/** 내부 공유 범위 */
export type InternalScope = "team" | "operators" | "participants";

/** 상대측 미팅자 */
export interface Counterpart {
  id: string;
  name: string;
  title: string;
  phone: string;
  email: string;
  /** 의사결정에서의 역할 */
  role: "decision" | "practical" | "reference";
  note: string;
}

export interface Business {
  industry: string;
  model: string;
  stage: string;
  region: string;
  website: string;
  channels: string[];
  description: string;
}

export interface Needs {
  goals: string[];
  pains: string;
  wish: string;
  timeline: string;
  budget: string;
  decisionBy: string;
}

/** 플랜더가 할 수 있는 일 (단가표 항목) */
export interface PlanderItem {
  id: string;
  /** catalog 항목 id. 직접 입력이면 "custom" */
  catalogId: string;
  tier: number;
  qty: number;
  /** 직접 입력 항목의 이름과 단가 */
  title?: string;
  price?: number;
  unit?: string;
  note: string;
}

/** 외부 협력이 필요한 일 */
export interface PartnerItem {
  id: string;
  title: string;
  field: string;
  partner: string;
  cost: number | null;
  status: "todo" | "requested" | "confirmed";
  note: string;
}

export interface NextAction {
  id: string;
  text: string;
  ownerId: string;
  due: string;
  done: boolean;
}

export interface Summary {
  /** 내부용 한 줄 요약 */
  oneline: string;
  /** 고객에게 보여 줄 정리 */
  external: string;
  risks: string;
  nextActions: NextAction[];
  /** 내부 전용 메모. 고객 공유에 절대 포함하지 않음 */
  internalMemo: string;
}

/** 고객 공유 링크에 담을 항목 */
export interface ShareSections {
  summary: boolean;
  business: boolean;
  needs: boolean;
  plander: boolean;
  estimate: boolean;
  nextActions: boolean;
}

export interface ConversionCheck {
  decisionMaker: boolean;
  budget: boolean;
  timeline: boolean;
  scope: boolean;
}

export interface Interview {
  id: string;
  title: string;
  status: InterviewStatus;
  heldAt: string;
  place: string;
  method: string;
  clientName: string;
  counterparts: Counterpart[];
  business: Business;
  needs: Needs;
  planderItems: PlanderItem[];
  partnerItems: PartnerItem[];
  summary: Summary;
  participantIds: string[];
  internalScope: InternalScope;
  shareEnabled: boolean;
  shareToken: string | null;
  shareSections: ShareSections;
  check: ConversionCheck;
  /** 의뢰 전환 결과 (웍스 클라이언트, 프로젝트) */
  clientId: string | null;
  projectId: string | null;
  convertedAt: string | null;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/** 고객 공유 페이지에 내려가는 정보. 내부 메모, 외부 협력, 연락처는 들어가지 않음 */
export interface SharedInterview {
  title: string;
  clientName: string;
  heldAt: string;
  counterpartNames: string[];
  sections: ShareSections;
  business?: Business;
  needs?: Needs;
  summary?: string;
  planderItems?: PlanderItem[];
  nextActions?: { text: string; due: string }[];
  updatedAt: string;
}

export interface ClientOption {
  id: string;
  name: string;
}
