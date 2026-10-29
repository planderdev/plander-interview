# 플랜더 인터뷰 — 작업 규칙

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
