/**
 * 플랜더 에임(AIM) 콘솔의 마케팅 퍼널 단계. (aim.plander.io 퍼널 보드, 상품 구조 기준)
 * 고객이 브랜드를 처음 알게 되는 순간부터 재구매까지 다섯 단계로 나눕니다.
 */

export type StageKey = "aw" | "in" | "co" | "cv" | "re";

export interface Stage {
  key: StageKey;
  label: string;
  /** 퍼널 보드의 목표 지표 */
  metric: string;
  head: string;
  body: string;
}

export const STAGES: Stage[] = [
  {
    key: "aw",
    label: "인지",
    metric: "노출, 도달",
    head: "넓게, 자주, 기억에 남게",
    body: "아직 브랜드를 모르는 사람에게 닿는 단계입니다. 살 가능성이 있는 사람 전체에게 넓게 반복해서 보여 주는 편이 효과적입니다.",
  },
  {
    key: "in",
    label: "관심",
    metric: "조회, 팔로우, 유입",
    head: "검색되기 전에 발견되게",
    body: "브랜드를 한 번 본 사람이 좀 더 알아보는 단계입니다. 포털, 인스타그램, 유튜브, 커뮤니티 어디서 찾아봐도 쓸모 있는 콘텐츠가 있어야 합니다.",
  },
  {
    key: "co",
    label: "고려",
    metric: "상품 조회, 리뷰 탐색",
    head: "비교하는 순간을 증거로 채우기",
    body: "구매 전에 탐색과 평가를 여러 번 오가는 단계입니다. 후기, 체험 콘텐츠, 검색 상위 노출로 우리를 고를 근거가 보이게 합니다.",
  },
  {
    key: "cv",
    label: "전환",
    metric: "구매, CPA, ROAS",
    head: "살 준비가 된 사람을 놓치지 않기",
    body: "사려는 마음이 생긴 사람이 실제로 결제, 예약, 문의하는 단계입니다. 구매 의도가 담긴 검색을 잡고 마지막 망설임을 없앱니다.",
  },
  {
    key: "re",
    label: "재구매",
    metric: "재구매, 단골, 리뷰 축적",
    head: "고객이 다음 고객을 데려오게",
    body: "한 번 산 고객이 다시 사고 주변에 추천하게 만드는 단계입니다. 직접 운영하는 채널로 관계를 잇고, 후기가 다시 인지와 고려의 재료가 되게 합니다.",
  },
];

export const STAGE: Record<StageKey, Stage> = Object.fromEntries(STAGES.map((s) => [s.key, s])) as Record<StageKey, Stage>;
export const stageLabels = (keys: string[]) =>
  STAGES.filter((s) => keys.includes(s.key)).map((s) => s.label);

/**
 * 단가표 항목별 추천 퍼널 단계 (앞이 주 단계). 에임 상품 구조의 STAGE_FIT 을 이 앱의 항목 id 에 맞췄습니다.
 * 에임에 없는 항목(중국, 일본, 브랜딩 등)은 같은 역할의 상품을 기준으로 정했습니다.
 */
export const STAGE_FIT: Record<string, StageKey[]> = {
  // 검색광고
  powerlink: ["cv", "co"],
  brandsearch: ["cv", "re"],
  powercontent: ["co", "in"],
  googlead: ["cv", "co"],
  // 네이버 블로그
  blogops: ["in", "re"],
  blogexp: ["co", "in"],
  blogdist: ["in", "co"],
  blogtop: ["co", "in"],
  smartblock: ["co", "in"],
  blogskin: ["co", "in"],
  // 네이버 플레이스
  placeseo: ["co", "cv"],
  receipt: ["cv", "co"],
  placemgmt: ["co", "cv"],
  placetop: ["co", "cv"],
  // 카페, 지식인, 언론
  cafetop: ["in", "co"],
  momcafe: ["in", "co"],
  hotdeal: ["cv"],
  specialcafe: ["aw", "in"],
  kin: ["co", "in"],
  press: ["aw", "co"],
  // 인스타그램, 메타
  instaops: ["in", "re"],
  reels: ["aw", "in"],
  reelsexp: ["aw", "co"],
  instaexp: ["co", "aw"],
  instatop: ["in", "co"],
  metaopt: ["in", "cv"],
  metaops: ["aw", "cv"],
  // SEO, 성과 측정
  webseo: ["in", "co"],
  googleseo: ["in", "co"],
  webtop: ["co", "cv"],
  conversion: ["cv"],
  report: ["re", "cv"],
  // 쇼핑몰
  shopad: ["cv"],
  shopname: ["cv", "co"],
  shopreview: ["cv", "co"],
  shopmain: ["co", "cv"],
  shopdetail: ["cv"],
  banner: ["cv", "re"],
  eventpage: ["cv", "re"],
  // 당근, 카카오
  carrot: ["aw", "in"],
  kakao: ["aw", "re"],
  // 홈페이지
  homepage: ["cv", "co"],
  mallrenew: ["cv", "re"],
  // 브랜딩, 촬영
  leaflet: ["co", "aw"],
  package: ["cv", "co"],
  sticker: ["cv"],
  retouch: ["in", "co"],
  photo: ["in", "co"],
  placevideo: ["co", "cv"],
  productvideo: ["cv", "co"],
  // 중국
  dianping: ["co", "cv"],
  xhs: ["aw", "co"],
  chinafull: ["aw", "co"],
  cnvideo: ["co", "cv"],
  cnsub: ["co"],
  cnkiosk: ["cv"],
  // 일본
  gmap: ["co", "cv"],
  jpsns: ["aw", "co"],
  gmapreview: ["cv", "co"],
  japanfull: ["aw", "co"],
  jpdesign: ["cv"],
  jpvideo: ["aw", "in"],
  jpplatform: ["cv", "re"],
  // 에임 상품 구조 (판매가 협의)
  cafe24: ["cv", "re"],
  trafficSlot: ["co", "cv"],
  expSponsor: ["co", "in"],
  expReal: ["co", "cv"],
  snsOwn: ["in", "re"],
  boost: ["aw"],
  powerPage: ["aw", "in"],
  contentAd: ["aw", "co"],
  tiktokAd: ["aw", "in"],
  ytShorts: ["aw", "in"],
  factoryA: ["aw"],
  factoryB: ["aw", "co"],
  factoryC: ["in", "cv"],
  cafeViral: ["in", "co"],
  cafeInfil: ["aw", "in"],
  blogMass: ["aw", "in"],
  blogReal: ["co"],
  blogTopAcc: ["co", "cv"],
  clip: ["aw", "in"],
  kakaoChannel: ["re", "in"],
  alimtalkFlow: ["re"],
  storeNotify: ["re", "cv"],
  crmSegment: ["re"],
  retargetAd: ["re", "cv"],
  membership: ["re"],
  subscription: ["re", "cv"],
  reviewEvent: ["re", "co"],
  referral: ["re", "aw"],
  newsletter: ["re", "in"],
  community: ["re"],
};
