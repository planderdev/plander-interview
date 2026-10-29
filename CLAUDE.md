# 플랜더 인터뷰 작업 규칙

고객 미팅을 기록하고, 정리해서 고객과 공유하고, 의뢰(웍스 프로젝트)로 전환하는 사내 도구입니다. **이 저장소에서만 인터뷰 앱을 작업합니다.**

## 1. 저장소 경계

| 서비스 | 저장소 | 무엇 |
|---|---|---|
| 플랜더 인터뷰 | `planderdev/plander-interview` (여기) | 고객 미팅 기록, 공유, 의뢰 전환 |
| 플랜더 웍스 | `planderdev/plander-works` | 내부 업무 OS. 클라이언트, 프로젝트 원본 |
| 피트인 | `plander-pitin` | 외부 고객 포털 |

- 웍스 코드를 이 저장소에서 고치지 않습니다. 반대도 같습니다.
- 웍스 프로젝트 카테고리(`PROJECT_CATEGORIES`)가 바뀌면 `src/lib/options.ts`도 맞춥니다.

## 2. Supabase 네임스페이스

웍스와 같은 프로젝트(`hmjbbdwzwiqihqhjtspd`)를 씁니다.

- **`pi_` 접두사 = 이 앱 소유.** 자유롭게 만들고 고칩니다.
- **`pw_` = 웍스 소유.** 이 앱은 `pw_users`, `pw_clients` 읽기와 `pi_convert_interview` 함수의 의뢰 전환 쓰기(클라이언트, 프로젝트 1건씩 추가)만 합니다. `pw_` 스키마는 바꾸지 않습니다.
- `cp_`(피트인), `legacy` 스키마는 건드리지 않습니다.
- `session_replication_role = replica`를 쓰지 않습니다.
- `auth.users`는 세 앱이 같이 씁니다. 계정을 지우거나 막지 않습니다.

## 3. 권한 판단은 두 곳에 있습니다

내부 공유 범위와 고객 공유 내용은 `src/lib/access.ts`(목업 모드, 화면 표시)와 `supabase/migrations`의 `pi_can_view`, `pi_can_edit`, `pi_shared_interview`(실제 DB)가 같은 판단을 합니다. 한쪽을 고치면 다른 쪽도 같은 커밋에서 고칩니다.

고객 공유에는 상대측 연락처, 외부 협력, 내부 메모, 위험 요소, 한 줄 요약이 절대 나가지 않습니다.

## 4. 개발

- `npm run dev` → http://localhost:3200. Supabase 환경 변수가 없으면 목업 모드(예시 데이터, 메모리 저장)입니다.
- 목업 사용자: `MOCK_USER_ID=m1`(슈퍼운영자), `m2`(운영자), `m3`(팀원).
- 개발 출력은 `.next-dev`, 빌드는 `.next`로 나뉘어 있습니다.
- 이 폴더가 iCloud 안에 있으면 `node_modules`, `.next`, `.next-dev`에 `xattr -w 'com.apple.fileprovider.ignore#P' 1 <폴더>`로 동기화 제외를 걸어 둡니다.

## 5. 비밀값, 예시 데이터

- 키는 환경 변수에만 둡니다. 이 저장소는 공개 저장소입니다.
- 예시 데이터와 화면 캡처에 실제 고객사명, 견적 금액, 직원 이름을 넣지 않습니다.

## 6. 디자인 시스템

[PLANDER 디자인 시스템](https://design.plander.io/)을 따릅니다.

- 사내 화면(목록, 작성, 로그인)은 "제품 UI" 기준입니다. 다크 #050505, 라이트 #F8FAFD, 유리 면 rgba(255,255,255,.06)에 blur 24px, 반경 16px, Pretendard, 헤더는 PLANDER 워드마크와 세로선, 제품명입니다.
- 고객 공유 페이지(`/s/[token]`)는 회사 사이트 기준입니다. 종이 #F1F2F6, 잉크 #0B0B0D, 보조 글 #5C5F68, 제목 Satoshi, 본문 General Sans, 숫자 Switzer, 섹션 머리는 위 1px 선과 영문 라벨, 번호입니다.
- 프리즘 블루는 포커스, 상태 점, 진행 같은 신호로만 씁니다. 면을 프리즘으로 채우지 않고, 종이 위 글자색으로 쓰지 않습니다. 따뜻한 색은 쓰지 않습니다.
- 버튼은 알약 모양(1px 테두리, 올리면 채워짐)이고, 버튼 문구는 할 일을 그대로 적습니다. 링크 뒤에 화살표를 붙이지 않습니다.
- 로고는 워드마크 파일(`public/brand/plander-wordmark.png`)만 흑 또는 백으로 씁니다. 파비콘은 plander.io 의 검정 둥근 사각형과 흰 체크입니다.
- 법인명은 "주식회사 플랜더"로 씁니다.
