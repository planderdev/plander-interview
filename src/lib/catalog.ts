/**
 * 플랜더 공식 단가표 (2026 확정 단가와 중국 마케팅 단가).
 * 범위 단가는 중간값, "부터" 단가는 시작 금액을 씁니다. r 에 원래 범위를 남깁니다.
 */

export interface CatalogTier {
  tier: string;
  desc: string;
  /** 단가 (원). 별도 상담이면 0 */
  p: number;
  /** 단위 */
  u: string;
  /** 기본 수량 */
  q: number;
  /** 최소 수량 */
  min: number;
  /** 시작 금액 표기 */
  from?: boolean;
  /** 단가표의 원래 범위 */
  r?: string;
  /** 상담 후 금액 확정 */
  consult?: boolean;
  /** 진행 개월 수만큼 반복 */
  m?: boolean;
}

export interface CatalogItem {
  id: string;
  name: string;
  tiers: CatalogTier[];
}

export interface CatalogCategory {
  id: string;
  name: string;
  /** 의뢰 전환 때 웍스 프로젝트 카테고리 기본값 */
  projectCategory: string;
  items: CatalogItem[];
}

const t = (
  tier: string,
  desc: string,
  p: number,
  u: string,
  o?: Partial<Omit<CatalogTier, "tier" | "desc" | "p" | "u">>,
): CatalogTier => ({ tier, desc, p, u, q: 1, min: 1, ...o });

export const CATALOG: CatalogCategory[] = [
 {id:"search",projectCategory:"국내마케팅",name:"검색광고",items:[
  {id:"powerlink",name:"네이버 파워링크 광고",tiers:[t("진단","계정 광고진단, 문제점과 해결방안 피드백",5000,"회"),t("BASIC","2~3개 그룹 세팅, 주력 키워드 관리",150000,"식"),t("PREMIUM","4~5개 그룹 관리, 세부와 연관 키워드까지 관리",300000,"식")]},
  {id:"brandsearch",name:"네이버 브랜드 검색광고",tiers:[t("세팅","브랜드 키워드 검색 시 통합검색 상단에 브랜드 콘텐츠 노출 세팅",200000,"식"),t("운영대행","세팅과 월 최적화 운영",800000,"개월",{m:true})]},
  {id:"powercontent",name:"파워컨텐츠 광고",tiers:[t("Normal","블로그 글을 검색광고로 등록해 블로그탭 광고영역 노출 (글 작성은 별도)",300000,"식")]},
  {id:"googlead",name:"구글 검색 광고",tiers:[t("Normal","초기 세팅, 주력 키워드와 일예산 세팅",300000,"식"),t("PREMIUM","모든 타겟 키워드 추가, 전환 데이터 기반 수동 최적화",500000,"식")]}
 ]},
 {id:"blog",projectCategory:"국내마케팅",name:"네이버 블로그",items:[
  {id:"blogops",name:"블로그 운영대행",tiers:[t("Normal","광고주 블로그 계정 관리와 활성화, 월 10건",500000,"개월",{m:true})]},
  {id:"blogexp",name:"블로그 체험단",tiers:[t("Normal","일반 블로거 방문, 서브 키워드 노출 목표",30000,"명",{q:10,min:10}),t("PREMIUM","인플루언서 블로거 방문, 메인 키워드 노출 목표",50000,"명",{q:10,min:10})]},
  {id:"blogdist",name:"블로그 배포 (기자단)",tiers:[t("BASIC","브랜드명 노출 목적, 이미지 제공 필수",4000,"건",{q:50,min:50}),t("Normal","준최적화 블로그, 서브 키워드 목표. 원고와 이미지를 주지 않으면 건당 1만 원 추가",50000,"건",{q:10,min:10}),t("PREMIUM","최적화 블로그, 메인 키워드 목표. 원고와 이미지를 주지 않으면 건당 1만 원 추가",70000,"건",{q:10,min:10,from:true})]},
  {id:"blogtop",name:"블로그탭 상위노출",tiers:[t("Normal","원하는 키워드 블로그탭 1~5위, 25일 보장",700000,"키워드",{r:"50~90만 원"})]},
  {id:"smartblock",name:"스마트블록 상위노출",tiers:[t("Normal","1페이지 원하는 블록 1~3위, 건별",450000,"건",{r:"30~60만 원"}),t("PREMIUM","1페이지 원하는 블록 1~3위, 25일 유지",1050000,"건",{r:"60~150만 원"})]},
  {id:"blogskin",name:"블로그 홈페이지형 디자인",tiers:[t("기본","블로그 대문 스킨 제작과 세팅, 위젯 버튼 5개 이상",250000,"식",{r:"20~30만 원"})]}
 ]},
 {id:"place",projectCategory:"국내마케팅",name:"네이버 플레이스",items:[
  {id:"placeseo",name:"플레이스 SEO 세팅",tiers:[t("Normal","텍스트마이닝으로 플레이스 정보와 키워드 세팅",350000,"식",{r:"30~40만 원"})]},
  {id:"receipt",name:"영수증 리뷰",tiers:[t("Normal","영수증 1장으로 원하는 수량만큼 제작해 등록",5000,"건",{q:100,min:10})]},
  {id:"placemgmt",name:"플레이스 월관리",tiers:[t("Normal","매월 순위 상승 작업, 매일 순위 체크",0,"개월",{consult:true})]},
  {id:"placetop",name:"플레이스 상위노출 보장형",tiers:[t("PREMIUM","모바일 1페이지 1~5위, 25일 보장",0,"키워드",{consult:true})]}
 ]},
 {id:"cafe",projectCategory:"국내마케팅",name:"카페와 언론",items:[
  {id:"cafetop",name:"카페 인기글 상위노출",tiers:[t("Normal","인기카페탭에 원하는 원고와 이미지 노출, 25일 보장",450000,"건",{r:"30~60만 원"})]},
  {id:"momcafe",name:"맘카페 침투 마케팅",tiers:[t("Normal","맘카페 게시글 1개와 댓글 2개",25000,"건",{q:5,min:5})]},
  {id:"hotdeal",name:"핫딜 마케팅",tiers:[t("Normal","카페 핫딜게시판 게시글 1개",30000,"건",{q:5,min:5})]},
  {id:"specialcafe",name:"특수카페 업로드",tiers:[t("Normal","대형 카페 게시글 1회와 댓글 2개, 3건 묶음",70000,"묶음")]},
  {id:"kin",name:"지식인 상위노출",tiers:[t("Normal","지식인 1페이지 1~3위, 25일 보장",200000,"키워드",{from:true})]},
  {id:"press",name:"언론보도",tiers:[t("Normal","제휴 언론사로 네이버, 다음에 기사 송출. 언론사마다 금액이 다릅니다",0,"건",{consult:true})]}
 ]},
 {id:"sns",projectCategory:"국내마케팅",name:"인스타그램과 메타 광고",items:[
  {id:"instaops",name:"인스타 운영대행",tiers:[t("Normal","월 8회 게시 (정보, 홍보글 6회와 릴스 2회)",800000,"개월",{m:true,from:true})]},
  {id:"reels",name:"릴스 콘텐츠 제작 올인원",tiers:[t("Normal","기획, 촬영, 편집, 업로드까지",300000,"건",{q:4})]},
  {id:"reelsexp",name:"인스타 릴스체험단",tiers:[t("Normal","방문 또는 배송 체험 영상을 편집해 릴스 업로드, 10건 묶음",400000,"묶음")]},
  {id:"instaexp",name:"인스타 체험단",tiers:[t("Normal","업종 관련 1만 팔로워 이상, 게시물 사진 10장, 10명 묶음",300000,"묶음")]},
  {id:"instatop",name:"인스타 노출",tiers:[t("Normal","해시태그 인기게시물 1~9위 보장",500000,"키워드",{from:true})]},
  {id:"metaopt",name:"메타 광고 최적화 세팅",tiers:[t("Normal","인스타그램, 페이스북 광고 계정과 타겟 세팅",200000,"식")]},
  {id:"metaops",name:"메타 광고 운영대행",tiers:[t("Normal","광고 소재와 타겟 운영, 리타게팅. 광고비는 별도",1200000,"개월",{m:true})]}
 ]},
 {id:"seo",projectCategory:"국내마케팅",name:"SEO와 성과 측정",items:[
  {id:"webseo",name:"홈페이지 SEO 최적화 세팅",tiers:[t("Normal","검색엔진 웹마스터 도구, 애널리틱스 등록 등 기술 SEO 전반",900000,"식",{r:"80~100만 원"})]},
  {id:"googleseo",name:"구글 검색 최적화",tiers:[t("Normal","구글 검색 노출을 위한 콘텐츠와 구조 최적화",800000,"식")]},
  {id:"webtop",name:"웹사이트 상위노출",tiers:[t("Normal","웹사이트 영역 순위 상승 작업",300000,"식",{from:true}),t("보장형","웹사이트 영역 1~4위 보장 (PC, 모바일)",500000,"키워드",{from:true})]},
  {id:"conversion",name:"홈페이지 정비와 상담 전환측정 구축",tiers:[t("Normal","문의 버튼, 전화, 폼 전환을 측정하도록 세팅",1500000,"식")]},
  {id:"report",name:"상담 성과 관리와 통합 리포트",tiers:[t("Normal","채널별 성과를 모아 월간 리포트 제공",300000,"식")]}
 ]},
 {id:"shop",projectCategory:"국내마케팅",name:"쇼핑몰",items:[
  {id:"shopad",name:"네이버 쇼핑검색광고",tiers:[t("진단","쇼핑광고 계정 진단",5000,"회"),t("BASIC","기본 세팅, 노출 키워드와 입찰가 관리",100000,"식"),t("PREMIUM","소재 5가지 분류, 순위별 입찰가 관리",300000,"식")]},
  {id:"shopname",name:"쇼핑 상품명 SEO",tiers:[t("BASIC","상품명 노출에 맞는 키워드 조합",200000,"식")]},
  {id:"shopreview",name:"쇼핑몰 구매평 작업",tiers:[t("Normal","키워드 검색 유입, 찜, 리뷰 (플랫폼 상관없음)",6000,"건",{q:50,min:50})]},
  {id:"shopmain",name:"쇼핑몰 메인페이지 디자인",tiers:[t("Normal","메인페이지 디자인",300000,"페이지",{from:true})]},
  {id:"shopdetail",name:"쇼핑몰 상세페이지 디자인",tiers:[t("Normal","상세페이지 디자인",200000,"페이지",{q:2,from:true})]},
  {id:"banner",name:"배너와 팝업 이미지",tiers:[t("Normal","1000x500px 배너 또는 팝업",50000,"장",{from:true})]},
  {id:"eventpage",name:"이벤트 설명 페이지",tiers:[t("Normal","1000x1500px 간단한 이벤트 페이지",50000,"페이지",{from:true})]}
 ]},
 {id:"local",projectCategory:"국내마케팅",name:"당근마켓과 카카오",items:[
  {id:"carrot",name:"당근마켓 광고",tiers:[t("비즈니스 광고","광고 세팅, 홈페이지 등 원하는 링크로 유입",100000,"식",{from:true}),t("비즈프로필","비즈프로필 세팅과 소식 발행 광고",200000,"식",{from:true}),t("상품 판매","자사몰, 스마트스토어 카탈로그 광고 세팅",200000,"식",{from:true})]},
  {id:"kakao",name:"카카오 광고",tiers:[t("BASIC","기존 계정 최적화 (배너가 없으면 제작비 추가)",200000,"식",{from:true}),t("Normal","신규 광고 세팅, 배너 제작과 승인 작업",300000,"식",{from:true})]}
 ]},
 {id:"web",projectCategory:"홈페이지 제작",name:"홈페이지 제작",items:[
  {id:"homepage",name:"홈페이지 제작",tiers:[t("BASIC","간단한 랜딩페이지 (4단락 이하)",500000,"식",{from:true}),t("Normal","기능 코딩이 필요한 랜딩페이지 (5단락 이하)",1000000,"식",{from:true}),t("PREMIUM","메뉴가 다양한 홈페이지",1500000,"식",{from:true})]},
  {id:"mallrenew",name:"쇼핑몰 리뉴얼 제작",tiers:[t("Normal","기존 쇼핑몰 디자인과 구조 리뉴얼",1500000,"식")]}
 ]},
 {id:"brand",projectCategory:"브랜딩",name:"브랜딩과 촬영",items:[
  {id:"leaflet",name:"브랜드 리플렛 디자인",tiers:[t("Normal","브랜드 소개 리플렛 디자인",1500000,"식")]},
  {id:"package",name:"패키지 디자인",tiers:[t("Normal","박스 등 패키지 디자인",1000000,"종")]},
  {id:"sticker",name:"스티커 디자인",tiers:[t("Normal","파우치, 포장용 스티커 4종 묶음",1500000,"묶음")]},
  {id:"retouch",name:"사진 셀렉과 보정",tiers:[t("Normal","보유 사진 선별과 보정",500000,"식")]},
  {id:"photo",name:"블로그 배포용 대량촬영",tiers:[t("Normal","사진 1,000장 이상 촬영",300000,"회",{from:true})]},
  {id:"placevideo",name:"플레이스 등록용 영상촬영",tiers:[t("Normal","플레이스 첫 화면 영상 30~60초",500000,"편",{from:true})]},
  {id:"productvideo",name:"상품 영상촬영",tiers:[t("Normal","쇼핑몰 상품용 영상",300000,"편",{from:true})]},
  {id:"print",name:"제작물 인쇄",tiers:[t("Normal","리플렛, 패키지, 스티커 인쇄. 수량과 재질에 따라 다릅니다",0,"식",{consult:true})]}
 ]},
 {id:"aim-mall",projectCategory:"국내마케팅",name:"쇼핑몰 마케팅 패키지 (에임)",items:[
  {id:"cafe24",name:"카페24 쇼핑몰 구축",tiers:[t("협의", "유료 테마 포함 구축. 네이버 리뷰 연동과 상세페이지 제작까지", 0, "회", {consult:true})]},
  {id:"trafficSlot",name:"순위작업 트래픽",tiers:[t("협의", "가격비교, 스마트스토어 슬롯 트래픽으로 키워드 순위 작업", 0, "키워드/월", {consult:true})]},
  {id:"expSponsor",name:"스마트스토어 협찬 체험단",tiers:[t("협의", "물건 제공과 원고비 구성. 기획 참여 가능 여부 선택", 0, "건", {consult:true})]},
  {id:"expReal",name:"내돈내산 리얼리뷰 체험단",tiers:[t("협의", "물건 제공, 구매비, 원고비. 실구매 기반 블로그 리뷰", 0, "건", {consult:true})]}
 ]},
 {id:"aim-viral",projectCategory:"국내마케팅",name:"SNS 바이럴 (에임)",items:[
  {id:"snsOwn",name:"자체계정 세팅과 운영",tiers:[t("협의", "인스타그램, 유튜브, 틱톡, 쓰레드 가입부터 프로필 세팅, 이후 콘텐츠 공급", 0, "채널/월", {consult:true})]},
  {id:"boost",name:"부스팅",tiers:[t("협의", "업로드한 콘텐츠의 도달을 넓히는 작업", 0, "건", {consult:true})]},
  {id:"powerPage",name:"파워페이지 게재 (인스타그램)",tiers:[t("협의", "팔로워가 많은 타계정에 콘텐츠 게재", 0, "건", {consult:true})]},
  {id:"contentAd",name:"인플루언서 콘텐츠 광고 (#광고 표기)",tiers:[t("협의", "타계정 협찬 또는 내돈내산 방식 콘텐츠 광고", 0, "건", {consult:true})]},
  {id:"tiktokAd",name:"틱톡 광고 운영",tiers:[t("협의", "틱톡 광고 세팅과 운영 대행", 0, "월", {consult:true})]},
  {id:"ytShorts",name:"유튜브 쇼츠 제작",tiers:[t("협의", "숏폼 쇼츠 1편 제작", 0, "건", {consult:true})]}
 ]},
 {id:"aim-factory",projectCategory:"국내마케팅",name:"콘텐츠 공장 (에임)",items:[
  {id:"factoryA",name:"콘텐츠 공장 A (생성형 막배포)",tiers:[t("협의", "카테고리 레퍼런스 기반 생성형 콘텐츠 양산과 배포. 월 고정", 0, "월", {consult:true})]},
  {id:"factoryB",name:"콘텐츠 공장 B (인물형 막배포)",tiers:[t("협의", "인물 기반 콘텐츠 양산. 변호사, 세무사 전용", 0, "월", {consult:true})]},
  {id:"factoryC",name:"콘텐츠 공장 C (캐러셀과 메타 광고)",tiers:[t("협의", "캐러셀(카드뉴스) 제작, 2차 활용 편집, 메타 광고 운영. 월 고정", 0, "월", {consult:true})]}
 ]},
 {id:"aim-naver",projectCategory:"국내마케팅",name:"네이버 작업 (에임)",items:[
  {id:"cafeViral",name:"카페 바이럴",tiers:[t("협의", "네이버 카페 게시글 바이럴. 원고 작성과 배포 포함", 0, "건", {consult:true})]},
  {id:"cafeInfil",name:"카페 침투 막배포",tiers:[t("협의", "침투 가능 카페 목록 기반, 카테고리별 게시글과 댓글 1~2건", 0, "건", {consult:true})]},
  {id:"blogMass",name:"블로그 막배포",tiers:[t("협의", "대량 배포용 블로그 포스팅", 0, "건", {consult:true})]},
  {id:"blogReal",name:"블로그 실계정 배포",tiers:[t("협의", "실사용 계정 기반 블로그 포스팅", 0, "건", {consult:true})]},
  {id:"blogTopAcc",name:"블로그 최적화 계정 배포",tiers:[t("협의", "최적화 계정 포스팅, 상위 노출용", 0, "건", {consult:true})]},
  {id:"clip",name:"네이버 클립 배포",tiers:[t("협의", "계정 사용비, 2차 활용, 순위작업 포함", 0, "건", {consult:true})]}
 ]},
 {id:"aim-retention",projectCategory:"국내마케팅",name:"리텐션과 CRM (에임)",items:[
  {id:"kakaoChannel",name:"카카오톡 채널 운영",tiers:[t("협의", "채널 친구 모집부터 정기 메시지, 쿠폰 발송까지", 0, "월", {consult:true})]},
  {id:"alimtalkFlow",name:"알림톡 자동화",tiers:[t("협의", "구매 후 안내, 후기 요청, 재구매 알림 자동화 설계와 세팅", 0, "식", {consult:true})]},
  {id:"storeNotify",name:"스마트스토어 알림받기와 톡톡 마케팅",tiers:[t("협의", "알림받기 고객 모집, 톡톡 메시지와 재구매 쿠폰 운영", 0, "월", {consult:true})]},
  {id:"crmSegment",name:"CRM 재구매 캠페인",tiers:[t("협의", "첫 구매, 재구매, 휴면 고객으로 나눠 그룹별 캠페인 실행", 0, "월", {consult:true})]},
  {id:"retargetAd",name:"리타겟팅 광고 운영",tiers:[t("협의", "구매자, 장바구니 이탈자, 방문자 대상 리타겟팅. 매체비는 광고주 부담", 0, "월", {consult:true})]},
  {id:"membership",name:"멤버십과 적립금 설계",tiers:[t("협의", "등급, 적립금, 재구매 쿠폰 구조 설계와 자사몰 세팅", 0, "식", {consult:true})]},
  {id:"subscription",name:"정기구독 상품 구성",tiers:[t("협의", "정기배송, 묶음 상품 구성과 구독 결제 세팅", 0, "식", {consult:true})]},
  {id:"reviewEvent",name:"포토리뷰 이벤트 운영",tiers:[t("협의", "후기 이벤트 운영, 모인 후기를 상세페이지와 SNS 에 재활용", 0, "회", {consult:true})]},
  {id:"referral",name:"추천인 프로그램 설계",tiers:[t("협의", "친구 추천 보상 구조, 추천 링크와 쿠폰 발급 세팅", 0, "식", {consult:true})]},
  {id:"newsletter",name:"뉴스레터와 이메일 마케팅",tiers:[t("협의", "정기 뉴스레터와 구매 후 이메일 기획, 발송", 0, "월", {consult:true})]},
  {id:"community",name:"브랜드 커뮤니티 운영",tiers:[t("협의", "오픈채팅, 카페, 인스타그램 고객 모임 운영", 0, "월", {consult:true})]}
 ]},
 {id:"china",projectCategory:"중국마케팅",name:"중국 마케팅",items:[
  {id:"dianping",name:"따중디엔핑",tiers:[t("등록","업체 등록",200000,"건"),t("스타터 3개월","등록과 관리 3개월, CPC 충전비 3,000위안 포함",1000000,"건"),t("스타터 1년","등록과 관리 1년, CPC 충전비 5,000위안 포함",2500000,"건"),t("어드밴스 3개월","관리 3개월, CPC 3,000위안, 체험단 5팀",1500000,"건"),t("어드밴스 1년","관리 1년, CPC 5,000위안, 체험단 10팀, 기자단 10팀",3500000,"건")]},
  {id:"xhs",name:"샤오홍슈 체험단",tiers:[t("스타터","체험단 5팀",500000,"건"),t("어드밴스","체험단 5팀과 기자단 10팀",1000000,"건"),t("마스터","팔로워 1만 이상 체험단 5팀",2000000,"건")]},
  {id:"chinafull",name:"따중디엔핑 + 샤오홍슈 풀코스",tiers:[t("풀코스","관리 3개월, 체험단 5팀 이상, 기자단 10팀, 현지 직원 1:1 관리, 메뉴판과 판촉물, 가로 영상 촬영",3000000,"건")]},
  {id:"cnvideo",name:"따중디엔핑 영상 제작",tiers:[t("Normal","30~60초 영상",300000,"편",{from:true})]},
  {id:"cnsub",name:"중국어 자막 추가",tiers:[t("Normal","영상 중국어 자막",100000,"편",{from:true})]},
  {id:"cnkiosk",name:"키오스크 중국어 추가",tiers:[t("Normal","키오스크 외국어 추가 (업체 비용 별도)",50000,"건")]}
 ]},
];

export const CATALOG_ITEM: Record<string, CatalogItem & { categoryId: string; projectCategory: string }> = {};
for (const c of CATALOG) {
  for (const i of c.items) CATALOG_ITEM[i.id] = { ...i, categoryId: c.id, projectCategory: c.projectCategory };
}
