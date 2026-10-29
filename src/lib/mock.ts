import { defaultSections, emptyCheck } from "./options";
import type { ClientOption, Interview, Member } from "./types";

const client = (id: string, name: string, o: Partial<ClientOption> = {}): ClientOption => ({
  id, name, industry: "", contactName: "", phone: "", email: "", website: "", address: "", ...o,
});

/** 목업 모드 구성원. 실제 직원 이름을 쓰지 않습니다. */
export const MOCK_MEMBERS: Member[] = [
  { id: "m1", name: "김플랜", role: "super_admin", position: "대표", team: "경영지원" },
  { id: "m2", name: "박운영", role: "operator", position: "PM", team: "기획팀" },
  { id: "m3", name: "이팀원", role: "user", position: "마케터", team: "마케팅팀" },
];

const now = "2026-10-29T09:00:00.000Z";

/** 화면 확인용 예시 인터뷰. 가상의 고객사입니다. */
function seed(): Interview[] {
  return [
    {
      id: "i-example-1",
      title: "예시) 한라국수 오픈 마케팅 미팅",
      status: "organized",
      heldAt: "2026-10-27T14:00",
      place: "고객 매장",
      method: "대면",
      clientName: "예시) 한라국수",
      counterparts: [
        { id: "c1", name: "정예시", title: "대표", phone: "010-0000-0000", email: "", role: "decision", note: "결정이 빠른 편" },
        { id: "c2", name: "오샘플", title: "매니저", phone: "", email: "", role: "practical", note: "SNS 직접 운영" },
      ],
      business: {
        industry: "식당, 카페",
        model: "오프라인 매장",
        stage: "오픈 준비",
        region: "제주 신제주",
        website: "",
        channels: ["네이버 플레이스", "인스타그램"],
        description: "고기국수 전문점, 11월 중순 오픈 예정. 관광객과 동네 손님 둘 다 노림.",
      },
      needs: {
        goals: ["매장 방문 늘리기", "검색에 잘 보이기", "외국인 고객 모으기"],
        pains: "오픈 직후 리뷰가 없어서 지도 검색에서 밀릴까 걱정",
        wish: "오픈 첫 달에 플레이스 리뷰와 블로그 후기를 쌓고 싶음. 중국 관광객도 받고 싶음.",
        timeline: "1개월 안",
        budget: "100~300만 원",
        decisionBy: "11월 첫째 주",
      },
      planderItems: [
        { id: "p1", catalogId: "placeseo", tier: 0, qty: 1, note: "" },
        { id: "p2", catalogId: "receipt", tier: 0, qty: 100, note: "오픈 2주 차부터" },
        { id: "p3", catalogId: "blogexp", tier: 0, qty: 10, note: "" },
        { id: "p4", catalogId: "xhs", tier: 0, qty: 1, note: "" },
      ],
      partnerItems: [
        { id: "x1", title: "메뉴판 중국어 번역과 인쇄", field: "인쇄", partner: "", cost: 150000, status: "todo", note: "인쇄 수량 확인 필요" },
      ],
      summary: {
        oneline: "오픈 첫 달 플레이스, 리뷰, 중국 체험단 패키지. 예산 200만 원 안팎.",
        external:
          "오픈 첫 달에는 네이버 플레이스 정보 정비와 리뷰를 먼저 쌓고, 블로그 체험단으로 검색 후기를 만듭니다. 중국 관광객은 샤오홍슈 체험단으로 시작해 반응을 봅니다.",
        risks: "오픈 일정이 밀리면 체험단 일정도 같이 밀림",
        nextActions: [
          { id: "a1", text: "제안서와 예상 견적 전달", ownerId: "m3", due: "2026-10-30", done: false },
          { id: "a2", text: "메뉴판 인쇄 업체 견적 받기", ownerId: "m2", due: "2026-11-03", done: false },
        ],
        internalMemo: "가격 민감. 패키지 할인 여지 문의함.",
      },
      participantIds: ["m3"],
      internalScope: "team",
      shareEnabled: true,
      shareToken: "example-share-token",
      shareSections: { ...defaultSections(), estimate: true },
      check: { decisionMaker: true, budget: true, timeline: true, scope: false },
      clientId: null,
      projectId: null,
      convertedAt: null,
      createdBy: "m3",
      updatedBy: "m3",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "i-example-2",
      title: "예시) 바다법률사무소 상담 문의 개선",
      status: "draft",
      heldAt: "2026-10-28T10:30",
      place: "",
      method: "화상",
      clientName: "예시) 바다법률사무소",
      counterparts: [{ id: "c1", name: "한샘플", title: "사무장", phone: "", email: "sample@example.com", role: "practical", note: "" }],
      business: {
        industry: "법률, 세무 등 전문직",
        model: "B2B",
        stage: "운영 중",
        region: "서울",
        website: "https://example.com",
        channels: ["홈페이지", "네이버 블로그"],
        description: "",
      },
      needs: { goals: ["상담, 문의 늘리기"], pains: "홈페이지 문의가 월 2~3건", wish: "", timeline: "분기 안", budget: "미정", decisionBy: "" },
      planderItems: [],
      partnerItems: [],
      summary: { oneline: "", external: "", risks: "", nextActions: [], internalMemo: "대표 변호사 미팅 다시 잡아야 함" },
      participantIds: ["m2"],
      internalScope: "operators",
      shareEnabled: false,
      shareToken: null,
      shareSections: defaultSections(),
      check: emptyCheck(),
      clientId: null,
      projectId: null,
      convertedAt: null,
      createdBy: "m2",
      updatedBy: "m2",
      createdAt: now,
      updatedAt: now,
    },
  ];
}

interface MockDb {
  interviews: Interview[];
  clients: ClientOption[];
  projects: { id: string; title: string; clientId: string; status: string; category: string; startDate: string | null; endDate: string | null }[];
}

const g = globalThis as unknown as { __piMock?: MockDb };

/** 서버 프로세스 메모리에 둡니다. 개발 서버를 다시 켜면 예시 데이터로 돌아갑니다. */
export function mockDb(): MockDb {
  if (!g.__piMock) {
    g.__piMock = {
      interviews: seed(),
      clients: [
        client("cl-1", "예시) 바다법률사무소", { industry: "법률, 세무 등 전문직", contactName: "한샘플", email: "sample@example.com", website: "https://example.com", address: "서울특별시 중구" }),
        client("cl-2", "예시) 제주카페", { industry: "식당, 카페", contactName: "문예시", phone: "010-0000-0001", address: "제주특별자치도 제주시 연동" }),
        client("cl-3", "예시) 오름베이커리", { industry: "커머스", contactName: "고샘플", phone: "010-0000-0002", website: "https://example.org", address: "제주특별자치도 서귀포시" }),
      ],
      projects: [
        { id: "pj-ex-1", title: "예시) 제주카페 홈페이지 제작", clientId: "cl-2", status: "completed", category: "홈페이지 제작", startDate: "2026-05-01", endDate: "2026-06-15" },
        { id: "pj-ex-2", title: "예시) 제주카페 여름 체험단", clientId: "cl-2", status: "in_progress", category: "국내마케팅", startDate: "2026-09-01", endDate: "2026-11-30" },
      ],
    };
  }
  return g.__piMock;
}

export function mockMe(): Member {
  const id = process.env.MOCK_USER_ID || "m1";
  return MOCK_MEMBERS.find((m) => m.id === id) ?? MOCK_MEMBERS[0];
}
