# 인터널 통합 + 밥친구 스케줄 상세 계획서

작성일: 2026-10-13 · 갱신: 2026-10-13(1·2단계 진행 반영) · 담당: 1인 · 순서: ① 검증·대조 → ② 인명부 합병·로그인 → ③ 밥친구 스케줄

> 이 문서는 저장소(`BCSDLab/B_BOT`, `BCSD_INTERNAL_API_V2`, `BCSD_INTERNAL_RECODE_V2`, `DaleStudy/schedule`)의
> 코드와 마이그레이션, 문서를 읽고 쓴 계획이다. 1·2단계는 운영 DB·Slack을 직접 확인하며 진행했고, 결과를 각 절에 반영했다.
> 멤버 개인정보(CSV, 대조 목록)는 로컬에만 두고 이 문서에는 집계만 적는다.

## 진행 현황 (2026-10-13 기준)

| 항목                     | 상태                                                                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1.1 Slack OIDC 검증      | **보류** — 삐봇 앱 협업자가 아니라 Redirect URL·스코프를 바꿀 수 없음(Owner의 자기 협업자 추가는 Business+ 전용). 로그인은 B안(일회용 링크) 채택 |
| 1.2 멤버 대조            | **완료**                                                                                                                                         |
| 1.3 결정 사항            | **완료** (아래 1.3 표)                                                                                                                           |
| 2.3-1 스키마 변경        | **완료** (API #137, V28: `password` NULL 허용, `company` 추가)                                                                                   |
| 2.3-2 데이터 이관        | **완료** (99명을 계정 없는 멤버로 추가, 57 → 156명. 실행 전 `member` 백업)                                                                       |
| 2.3-4 로그인             | **완료** (B안: 관리자 Slack DM 설정 링크, API #136 · 웹 #86 / 계정 없는 멤버 등록·직장 필드 웹 #87)                                              |
| 2.3-5 삐봇 전환          | **완료** (서비스 API #138·#139, 삐봇 #33). 봇 DB 멤버 테이블 삭제만 남음                                                                         |
| 2.3-6 문서 정리          | **완료** (삐봇 계획서 #34, 이 문서)                                                                                                              |
| 2.6 홈페이지 노출·사진   | 완료. 남은 것: 사진 동기화 첫 실행 확인 (방식이 `users.list` + `slack_id` 매칭으로 바뀜, #138)                                                   |
| 3단계 밥친구 스케줄      | 미착수                                                                                                                                           |
| 4.2 홈페이지 정비 PR 5건 | 완료 (#53~#57)                                                                                                                                   |
| 4.3 `RECRUIT_TERM` API화 | 계획만 있음 (V28은 이미 사용 → V29 이후)                                                                                                         |

## 남은 작업 (2026-10-13 기준)

우선순위 순. 담당 표시가 없으면 개발자(본인) 작업이다.

**A. 이번 전환 마무리 (이번 주)**

- [ ] 삐봇 그룹 멘션 실사용 확인: 테스트 채널에서 트랙장 + FrontEnd → 1명, 활동 + 레귤러 → 인원 확인
- [ ] PR 머지 알림 첫 동작 확인: 다음 프론트 PR 머지 때 리뷰 스레드에 답글이 달리고 `pr_thread.status`가 `merged`가 되는지
- [ ] 사진 동기화 첫 실행 확인: 일요일(10/18) 00:05 KST 스케줄러 또는 관리자 수동 호출. 응답 `total/updated/failed`, `SLACK_PROFILE_SYNC_FAILED` 로그, 사진 보유 수(현재 29/156) 비교
- [ ] (며칠 운영 후) 삐봇 DB 멤버 테이블 삭제: `pg_dump`로 `member`, `track`, `team`, `team_map`, `member_withdraw` 백업 → `006_drop_directory.sql` 추가·실행. `pr_thread`와 RAG 테이블은 유지

**B. 인터널 작은 결함 (발견, 미수정)**

- [ ] 가입 전 멤버는 링크로 비밀번호를 정한 뒤 초기 설정에서 다시 입력해야 한다
- [ ] DM 문구 "계정 설정 링크"와 도착 화면 제목 "비밀번호 재설정"이 다르다
- [ ] Slack 발송 실패(502) 직후 재시도하면 1분 제한(429)에 걸린다
- [ ] 502 문구에 `-> detail: slackError=` 원문이 노출된다
- [ ] 계정 없는 멤버를 탈퇴 후 복구하면 `ACTIVE` + 비밀번호 없음 상태가 된다
- [ ] Slack DM으로 만든 재설정 토큰은 `mail_sent_at`이 비어 있다

**C. 이관 데이터 보완 (필요해질 때)**

- [ ] 이관 99명의 기수가 `미상`이다 (가입일로 계산하면 약 절반만 맞아서 비워 둠)
- [ ] GitHub ID 8건은 형식 오류라 비웠다
- [ ] 이관자 1명은 Slack ID 결측 (같은 ID를 동명이인이 쓰고 있어 비움)
- [ ] 이관자는 모두 비활동으로 들어갔다. 실제 활동 중인 사람이 있으면 인터널에서 활동으로 바꾼다 (삐봇 "활동" 멘션에 바로 반영)

**D. 다른 저장소 (선택, 협의 필요)**

- [ ] 각 저장소 `CHECK_PR_MERGED`·공용 `pick-reviewer` 워크플로의 `curl`에 `-f` 추가 — 삐봇이 실패해도 Actions가 성공으로 보여 머지 알림 고장이 오래 숨어 있었다
- [ ] 공용 `pick-reviewer`가 이름 대신 GitHub ID도 보내면 삐봇이 `github_id`로 정확히 매칭할 수 있다 (동명이인 대비)

**E. 계획서의 기존 항목**

- [ ] 3단계 밥친구 스케줄 (11월 목표). 첫 작업은 3.5 라이선스 확인
- [ ] 4.3 `RECRUIT_TERM` API화 (마이그레이션 V29 이후 번호)
- [ ] 4.4 인터널 API PR용 테스트 CI, `TrackIntegrationTest` 격리, 전체 `./gradlew test` 1회 (이 환경은 Docker로 Testcontainers가 돈다 — 관련 클래스만 돌려 봄)
- [ ] 1.1 Slack OIDC — 삐봇 앱 협업자 권한을 받으면 재시도
- [ ] 머지된 원격 브랜치 정리(삭제는 승인 후): 홈페이지 5개(4.2), API `fix/public-display-not-account-status`, 이번 작업 브랜치(API `feat/slack-dm-password-link`, `feat/member-without-account`, `feat/service-member-read`, `feat/service-member-positions` / 웹 `feat/slack-dm-password-link`, `feat/member-without-account` / 삐봇 `feat/internal-member-source`, `docs/internal-member-source`). 저장소 4곳 모두 머지 후 자동 삭제가 꺼져 있다
- [ ] 4.1 홈페이지 프레임워크 전환 검토 (보류 유지)

**작업 환경 메모**

- 운영 서버 접근·토큰 위치 등 비밀 정보는 이 문서에 적지 않는다.
- 회사 PC: 홈페이지 `~/projects/BCSD_HOMEPAGE_RECODE`, 인터널 API `~/projects/BCSD_INTERNAL_API_V2`. JDK 21 `~/tools/jdk21`, Postgres 16 `~/tools/pg16`(포트 15432) + `IntegrationTestSupport` 임시 패치(커밋 금지)로 테스트.
- 집 PC: Docker로 Testcontainers가 돌아 `./gradlew test`를 그대로 쓴다.
- GitHub는 `ff1451` 계정으로 작업한다.

---

## 0. 배경과 목표

### 0.1 현재 상태

| 저장소                  | 스택                                                         | 비고                                                                                                                 |
| ----------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| B_BOT (삐봇)            | Nitro(TS), Postgres(+pgvector), Slack HTTP 웹훅              | (작성 당시) 멤버 230행을 옛 인터널 MySQL에서 1회 복사해 "임시 주인"으로 보유. **2026-10-13부터 인터널 API를 읽는다** |
| BCSD_INTERNAL_API_V2    | Spring Boot 4, Java 21, Postgres 16, Flyway(V1~V27)          | 멤버 57명(운영, 확인 필요). 인증·예약·회비·활동·게임·커리큘럼 등 도메인 12개                                         |
| BCSD_INTERNAL_RECODE_V2 | React + TanStack Router, pnpm                                | 운영진용 어드민(`_admin.*`). Next.js에서 이미 전환됨                                                                 |
| BCSD_HOMEPAGE_RECODE    | Next.js, 인터널 API(`/v1/tracks/{slug}`)를 빌드/요청 시 호출 | 트랙 페이지의 "함께 할 멤버들"이 인터널 응답을 그대로 그린다                                                         |
| DaleStudy/schedule      | TanStack Start, Cloudflare Workers/D1                        | 알고리즘(`src/lib/optimal-time.ts`)과 그리드 UI(`time-grid.tsx`)만 참고용                                            |

### 0.2 풀려는 문제

1. 인명부가 삐봇 DB와 인터널 DB로 **둘로 나뉘어** 있다.
2. 합병이 막힌 진짜 이유는 **"멤버 = 로그인 계정"** 구조다. 가입 메일을 받을 수 없는 사람(멘토 등)이 인명부에 들어올 수 없다.
3. 밥친구 시간 맞추기를 When2meet로 하고 있어서 **미응답자 확인, 후보 계산, 규칙 검증, 공지**를 사람이 한다.
4. **홈페이지 트랙 페이지에서 가입 전 멤버가 보이지 않는다** (2번과 같은 뿌리).
   - `TrackService.publishedMembers`가 관리자가 `visible`로 고른 멤버를 다시 `member.isActive()`로 거른다.
     이 메서드는 `status == ACTIVE`, 즉 **계정 상태**이고, 동아리 활동 여부(`clubActive`, 컬럼 `is_active`)와 다르다.
   - 프로필 사진 동기화(`SlackProfileSyncService.syncAll`)도 `findAllByStatus(ACTIVE)`만 대상으로 해서,
     가입 전 멤버는 `profile_image_url`이 비고 홈페이지에서 회색 빈 박스로 보인다.
   - 현장 증상: 비활동 멤버 둘을 iOS 트랙 페이지에 추가했더니 한 명(계정 ACTIVE)만 보이고 한 명(미가입)은 안 보였다.
   - 같은 필터가 트랙, 게임, 메인 멘토 캐러셀 세 곳에 복사되어 있다 (2.6에 전수 확인 결과).

### 0.3 목표

- 멤버 데이터의 단일 출처를 **인터널 V2**로 확정한다.
- 인명부와 로그인 계정을 분리해서, 계정이 없는 사람도 멤버로 존재할 수 있게 한다.
- 11월 밥친구부터 인터널의 스케줄 기능으로 시간을 맞춘다.

### 0.4 하지 않는 것

- 휴대폰 번호 기반 초기 비밀번호 (추측하기 쉬운 값이라 계정 탈취 위험)
- 백엔드 언어 전체 재작성, 삐봇·인터널 웹 모노레포 통합
- 인터널 내 이슈·일정 관리 기능 (GitHub, Notion과 중복)
- Notion·Drive·GitHub 권한 자동 부여 (관리자 토큰을 서버가 쥐는 일이라 별도 승인 후 재논의)

---

## 1단계. 검증과 대조

목표: 이후 모든 결정의 근거가 되는 사실을 확보한다. 코드 변경은 거의 없다.

### 1.1 Slack OIDC 검증 (약 10분)

- 삐봇 Slack 앱 설정에서 **Redirect URL을 등록**하고 `openid`, `email` 스코프를 추가한다.
  - 새 앱을 만들면 무료 워크스페이스의 **앱 10개 상한** 슬롯을 쓰므로, 기존 삐봇 앱 재사용을 우선 시도한다.
- 로컬에서 승인 URL로 로그인해 `id_token`에 아래가 오는지 확인한다.
  - 사용자 ID: `sub` 또는 `https://slack.com/user_id`
  - 워크스페이스 ID: `https://slack.com/team_id`
- **결과 (2026-10-13): 보류.** 본인이 삐봇 앱의 협업자가 아니어서 앱 설정(Redirect URL, 스코프)을 바꿀 수 없다.
  워크스페이스 Owner가 자신을 협업자로 추가하는 기능은 Business+ 이상 전용이다. → **B안(일회용 링크) 채택.**
- 판정:
  - 성공 → 2단계 로그인은 Slack OIDC로 확정
  - 실패(기존 앱에 못 붙임, 상한 초과 등) → 일회용 링크 방식으로 확정 (2.4 참고)
- 문서상 유료 플랜 요구 조건은 확인되지 않았지만 "무료에서 된다"는 명시도 없으므로, **실제 로그인 성공으로 확정**한다.

### 1.2 멤버 대조

- 입력 (모두 로컬 CSV, **커밋 금지**):
  - 인터널 `member` (비밀번호 해시 컬럼은 내보내지 않는다)
  - 삐봇 `member` (`is_deleted=false`)
- 키: `student_number` 우선, 없으면 `email`, 그다음 `slack_id`.
- 산출물 3종 목록:
  1. 양쪽에 있고 값이 같은 사람
  2. 양쪽에 있는데 값이 충돌하는 사람 (필드별 차이 표시)
  3. 한쪽에만 있는 사람
- 함께 볼 것:
  - 인터널 57명 중 활성(`is_active`) / `PENDING_SETUP` / `LOCKED` / `WITHDRAWN` 분포
  - `slack_id`가 비어 있는 사람 수 (OIDC 로그인 불가 대상)
  - 트랙 이름 불일치 (삐봇 `FrontEnd` 대 인터널 `FRONTEND`)
- 규모가 작아서(57명) 자동 병합보다 **목록을 눈으로 검수하는 편이 안전**하다.

**결과 (2026-10-13)**

- 인터널 57명: 모두 REGULAR, ADMIN 9, 계정 `ACTIVE` 32 · `PENDING_SETUP` 25, LOCKED·WITHDRAWN 0.
- 삐봇 `is_deleted=false` 148명. 2026-08-27 이후 갱신 없음 → **인터널이 최신**.
- 학번 매칭 48명 (일치 25, 충돌 23), 인터널에만 9명, 삐봇에만 100명.
  - 삐봇에만 있는 100명 중 1명은 학번이 다른 동일인이라 제외, **99명 이관**.
  - 인터널에 없는 사람은 9월에 재학 레귤러에게만 가입 메일을 보냈기 때문 (졸업생·비활동·멘토).
- `slack_id`: 인터널 57명 중 결측을 Slack `users.lookupByEmail`로 보완(54명) + 이름으로 2명 → **57/57**. 이관 99명 중 결측 1명.
- 트랙 이름은 매핑표로 해결(삐봇 `FrontEnd` → 인터널 `FRONTEND` 등).

### 1.3 결정 사항 (이 단계 종료 시 기록)

| 결정                       | 결과 (2026-10-13 확정)                                                                                                              |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 기준 데이터                | **인터널 우선.** 삐봇에만 있는 99명은 계정 없는 멤버로 보충 (기수 `미상`, 대학 `한국기술교육대`, 비활동, 회비 대상 아님, 직책 없음) |
| 상태 enum 매핑표           | 2.2 표대로. **COMPLETION(수료) → GRADUATED**                                                                                        |
| `team` 처리                | **폐기.** 현재 팀 구분이 없다. 삐봇 팀별 멘션도 제거. 트랙장 멘션은 인터널 직책(`*_LEAD`)으로 유지                                  |
| `is_fee_exempt`            | **옮기지 않음.** 인터널 회비 기능 기준으로 관리                                                                                     |
| (추가) `authority` MANAGER | **폐기.** 인터널은 MEMBER/ADMIN만                                                                                                   |
| (추가) `company`           | **인터널에 컬럼 추가** (V28, 관리자 인명부에서만 보임). 학교명·`-`는 비움                                                           |
| (추가) 공개 범위           | 일반 회원 인명부에 계정 없는 멤버도 그대로 노출 (기존 구글 시트와 같은 범위)                                                        |

### 완료 기준

- Slack OIDC 성공 여부가 기록되어 있다.
- 대조 3종 목록과 `slack_id` 결측 목록이 있다.
- 위 결정 4건이 문서에 남아 있다.

---

## 2단계. 인명부 합병 + 계정 분리 + 삐봇 전환

목표: 계정이 없어도 멤버로 존재하고, 삐봇이 인터널을 읽는 상태.

### 2.1 설계 원칙

- `member`는 **사람 기록**, 로그인은 **선택 사항**으로 분리한다.
  - 계정 없는 멤버도 인명부, 트랙, Slack ID, 밥친구 참여가 가능해야 한다.
- 현재 인터널 `member`는 `password NOT NULL`, `status` 기본값 `PENDING_SETUP`이다 (`V1__create_member.sql`).
  이를 완화하는 Flyway 마이그레이션이 필요하다.
- 비밀번호는 이관하지 않는다 (삐봇도 원래 제외).

### 2.2 필드 매핑 초안

| 삐봇                                                               | 인터널                         | 비고                                         |
| ------------------------------------------------------------------ | ------------------------------ | -------------------------------------------- |
| `status` ATTEND                                                    | `academic_status` ENROLLED     |                                              |
| OFF                                                                | LEAVE_OF_ABSENCE               |                                              |
| IPP                                                                | INDUSTRY_PRACTICE              |                                              |
| ARMY                                                               | MILITARY_LEAVE                 |                                              |
| GRADUATE                                                           | GRADUATED                      |                                              |
| COMPLETION(수료)                                                   | GRADUATED                      | 결정: GRADUATED로 흡수                       |
| `authority` NORMAL/MANAGER/ADMIN                                   | `role` MEMBER/ADMIN            | 결정: MANAGER 폐기, 이관자는 모두 MEMBER     |
| `github_name`                                                      | `github_id`                    |                                              |
| `track.name` (FrontEnd 등)                                         | `track.code` (FRONTEND 등)     | 매핑 테이블 필요, SECURITY는 인터널에만 있음 |
| `team` / `team_map`                                                | `position` / `member_position` | 결정: 팀 폐기. 트랙장은 인터널 직책 사용     |
| `is_deleted`, `is_authed`, `is_fee_exempt`, `company`, `join_date` | `company`만 추가(V28)          | 나머지는 옮기지 않음                         |
| `member_withdraw`                                                  | 대응 없음                      | 폐기 (0행)                                   |

### 2.3 작업 순서

0. **선행: 홈페이지 노출과 프로필 사진 수정 (소규모, 2.6 참고)**
   - 계정 분리 전체를 기다리지 않고 먼저 따로 낼 수 있다. 1단계 대조 결과를 기다리는 동안 해도 된다.
1. **스키마 변경 (Flyway)**
   - 계정 없는 멤버를 허용하도록 `password` nullability, 로그인 상태 표현을 정리한다.
   - 1.3에서 결정한 컬럼만 추가한다.
   - 기존 로그인 흐름(잠금, 재설정 토큰)은 그대로 둔다.
2. **데이터 이관**
   - 1.2의 "한쪽에만 있는 사람"과 "충돌" 목록을 기준으로, 검수한 결과를 SQL 또는 스크립트로 반영한다.
   - **드라이런 → 백업 → 실행** 순서. 실행 전 인터널 DB 백업을 확보한다.
   - 이관 대상 중 인터널에 없는 사람은 계정 없는 멤버로 생성한다.
3. **트랙, 직책 정리**
   - 트랙 매핑 테이블 반영, 레거시 `member.track` 문자열 컬럼 정리는 별도 판단(V8 주석에 contract 단계가 미뤄져 있음).
4. **로그인 구현** (1.1 결과에 따라 분기, 아래 2.4)
5. **삐봇 전환**
   - 삐봇 `src/utils/member.ts`의 조회 소스를 인터널 API로 교체한다.
   - 전환 기간에는 두 소스를 같이 읽어 **차이를 로그로만 남기고** 동작은 기존대로 한다.
   - 차이가 없어진 뒤 삐봇의 `member`, `track`, `team`, `team_map`을 제거한다. `pr_thread`와 RAG 테이블은 삐봇 DB에 남긴다.
   - 인터널 API에 삐봇용 읽기 엔드포인트와 서비스 토큰 인증이 필요하다 (사용자 로그인 인증과 별개).
6. **문서 정리**
   - 삐봇 `docs/계획서.md`의 "임시 주인 후 반납" 전략, Nuxt 어드민 항목, 모노레포 승격 항목을 갱신한다.

**진행 기록 (2026-10-13)**

| 순서         | 결과                                                                                                                                                                                                                                                                                   |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. 스키마    | API #137 (V28): `password` NULL 허용(= 계정 없음), `company VARCHAR(100)`. 등록 시 `createAccount=false`면 가입 메일을 보내지 않는다. 계정 없는 멤버의 셀프 비밀번호 재설정은 무시(가입하지 않은 이메일과 같은 응답) — 계정은 관리자 초대(가입 메일 재발송 또는 Slack 링크)로만 생긴다 |
| 2. 이관      | 서버에서 `member`·`member_position` 백업(`~/backups/member-20261013-pre-import.sql`) 후 단일 트랜잭션으로 99행 추가. 미리보기에서 학번·이메일·Slack ID 충돌 0                                                                                                                          |
| 3. 트랙·직책 | 트랙은 매핑표로 이관. 레거시 `member.track` 문자열 정리는 별도 판단으로 남김                                                                                                                                                                                                           |
| 4. 로그인    | B안. 관리자 인명부 "링크" 버튼 → 삐봇 DM으로 24시간 1회용 설정 링크(API #136, 웹 #86)                                                                                                                                                                                                  |
| 5. 삐봇 전환 | 인터널 `GET /v1/service/members`(서비스 토큰 `BBOT_SERVICE_TOKEN`, 별도 필터 체인, 토큰 미설정 시 전부 거부) + 직책 코드(#139). 삐봇 #33: 조회처 교체, 팀 선택 제거, 트랙장은 직책으로, PR 머지 알림 복구                                                                              |
| 6. 문서      | 삐봇 계획서 #34, 이 문서                                                                                                                                                                                                                                                               |

- **병행 읽기는 하지 않았다.** 상태값 충돌(23명)이 알려져 있어 "차이 0"이 성립하지 않는다. 대신 전환 전에 Slack ID 집합과 이름·트랙 매핑을 한 번 비교했다.
  그룹 멘션 "활동" 대상은 42명 → 30명(인터널 활동 여부 기준)이며 그대로 두기로 했다.
- 토큰은 인터널 API(GitHub Secret `BBOT_SERVICE_TOKEN`)와 삐봇(Secret `INTERNAL_SERVICE_TOKEN`, `INTERNAL_API_BASE_URL`, 배포 `.env` 생성에 포함)에 같은 값으로 등록했다.

### 2.4 로그인 방식

**A. Slack OIDC (1.1 성공 시)**

- 흐름: Slack 로그인 → `team_id`가 BCSD 워크스페이스인지 서버에서 검사 → `slack_id`로 멤버 조회 → 없거나 비활성이면 거부.
- 워크스페이스 제한은 `team` 파라미터가 아니라 **서버 검사**로 한다 (문서상 편의 기능일 뿐).
- 한계: 워크스페이스에 없는 사람(멘토 일부 등), `slack_id` 결측자는 로그인 불가.
- 관리자 계정은 **학번+비밀번호 로그인을 예비로 유지**한다.
- **현재 보류** (1.1 결과).

**B. 일회용 설정 링크 (1.1 실패 시 또는 A의 한계 보완)**

- 관리자가 멤버를 지정하면 만료 시각이 있는 일회용 링크를 만들고, Slack DM이나 직접 전달한다.
- 메일을 못 받는 사람 문제를 피한다.
- 링크는 해시 저장, 사용 후 폐기, 짧은 만료.
- **채택·구현 완료.** 기존 비밀번호 재설정 토큰을 재사용한다(24시간, 1회, 새로 보내면 이전 링크 무효, 같은 멤버 1분에 1회). Slack 발송이 실패하면 토큰을 폐기하고 502.
- 실제 멤버에게 DM은 아직 보내지 않았다 (본인 계정으로만 시험).

### 2.5 위험과 대응

| 위험                                                 | 대응                                                                    |
| ---------------------------------------------------- | ----------------------------------------------------------------------- |
| 이관 중 기존 값 덮어쓰기                             | 충돌은 자동 처리하지 않고 목록으로 검수, 실행 전 백업                   |
| 탈퇴자·비동의자의 이름과 사진이 공개 홈페이지에 노출 | 노출 필터에서 `WITHDRAWN`은 계속 제외, 노출은 관리자가 고른 `visible`만 |
| 삐봇이 인터널 장애에 묶임                            | 60초 캐시. 실패 시 그룹 멘션은 실패 안내, 알림은 멘션 없이 이름만       |
| 로그인 변경으로 기존 사용자 잠김                     | 학번+비밀번호 로그인 유지, 변경은 추가 방식으로                         |
| `slack_id` 결측                                      | 1.2 목록을 기준으로 수동 보완                                           |

### 완료 기준

- 계정 없는 멤버가 인터널에 존재하고, 인명부 화면에 보인다.
- 삐봇의 멤버 조회가 인터널을 가리킨다. (완료. 병행 읽기 대신 전환 전 1회 비교)
- 삐봇의 중복 멤버 테이블이 제거되었다. (남음 — 운영 확인 후)
- 로그인(A 또는 B)으로 계정이 없던 사람이 실제로 들어올 수 있다. (B안 구현 완료, 본인 계정으로 확인)
- 가입 전 멤버를 트랙 페이지, 게임 페이지, 멘토 캐러셀에 추가하면 홈페이지에 이름과 사진(또는 아바타)이 나온다.

### 2.6 홈페이지 노출·프로필 사진 수정 (2.3의 0번)

> **진행 상태**: 홈페이지 쪽(아바타 폴백, 3번 항목)은 #55로 **머지·배포 완료**. 인터널 API 쪽(1, 2, 5번 항목: 노출 필터, 사진 동기화 대상, `isActive()` 이름 정리)은 API #135로 **머지·배포 완료**. 이제 가입 전 멤버가 `visible`이면 홈페이지에 나온다.
> **API 쪽 진행**: `BCSD_INTERNAL_API_V2` PR #135(브랜치 `fix/public-display-not-account-status`, base `main`)를 **머지했고 운영 배포가 성공**했다(2026-10-13).
> 노출 필터 3곳을 `!isWithdrawn()`으로, 사진 동기화를 `findAllByStatusNot(WITHDRAWN)`으로 바꾸고 `isActive()`를 `isAccountActive()`로 이름 변경했다.
> 테스트는 트랙·게임·멘토 슬롯 통합 테스트 3개와 동기화 단위 테스트 1개를 추가했고, 옛 필터로 되돌리면 새 트랙·게임 테스트가
> `members.length expected:<2> but was:<0>`으로 실패함을 확인했다.
> 배포 후 확인: 홈페이지 `/`, `/track/frontend`, `/game`, `/recruit`, `/activity/event` 모두 200. 트랙별 노출 멤버 수는
> android 4, backend 3, data-analyst 2, design 5, frontend 3, game 12, ios 1, product-manager 3명이다 (배포 직후 값, 이후 비교용).
> **남은 확인**: (1) 사진 동기화는 일요일 00:05(KST) 스케줄러 또는 관리자 수동 동기화(`POST /v1/admin/members/photo/slack-sync`)로 반영된다.
> 첫 실행 뒤 `SLACK_PROFILE_SYNC_FAILED` 로그와 가입 전 멤버의 `profile_image_url`이 채워졌는지 확인한다. (2) 인증·회원 통합 테스트 7개 클래스는 로컬에서 못 돌렸으므로 Docker가 있는 환경에서 `./gradlew test`를 한 번 돌린다.

현재 동작을 확인한 위치:

| 위치                                                    | 현재                                                | 문제                                                                                                     |
| ------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `track/service/TrackService.publishedMembers` (82행)    | `visible=true` 배정 후 `.filter(member.isActive())` | `isActive()`는 계정 상태(`status == ACTIVE`). 가입 전·잠김 멤버가 빠진다                                 |
| `game/service/GameService.publishedMembers` (85행)      | 같은 필터                                           | **같은 버그.** 게임 상세의 멤버 목록에서도 가입 전 멤버가 빠진다                                         |
| `home/service/HomeService.activeMentors` (53행)         | 같은 필터                                           | **같은 버그.** 메인 화면 멘토 캐러셀에서 가입 전 멘토가 빠진다 (멘토님들이 가입을 안 한다는 대화와 직결) |
| `member/service/SlackProfileSyncService.syncAll` (30행) | `findAllByStatus(ACTIVE)`                           | 가입 전 멤버는 사진 동기화 대상이 아니다                                                                 |
| `BCSD_HOMEPAGE_RECODE` `MemberCarousel.tsx`             | `profileImageUrl`이 없으면 회색 박스                | 대체 표시 없음                                                                                           |

전수 확인 결과 (`BCSD_INTERNAL_API_V2`, `src/main` 기준):

- `member.isActive()` 호출은 main에 7곳(노출 3 + 인증 4)이고, 정의는 `Member.java` 163행이다.
  - **공개 노출 필터 3곳**: Track, Game, Home. 모두 수정 대상이다.
  - **인증·세션 4곳**: `AuthService`(69, 94행), `LoginSessionIssuer`(39행), `MemberStateJwtValidator`(41행). 계정 상태를 보는 것이 맞으므로 **수정하지 않는다.**
  - `track.isActive()`(`TrackMasterResponse`, `AdminTrackMasterService`)는 `TrackMaster`의 메서드라 무관하다.
- 계정 상태 `status`로 거르는 곳은 위 외에 `SlackProfileSyncService`의 `findAllByStatus(ACTIVE)` 하나뿐이다.
- 동아리 활동 여부(`clubActive`)를 쓰는 곳은 멤버 목록 필터, 통계, 회비 대상 쿼리다. 회비 쿼리는 이미
  `is_active = TRUE AND status <> 'WITHDRAWN'`을 쓴다 (`DuesSemesterMemberRepository`). 노출 필터도 같은 방식으로 맞추는 것이 일관적이다.
- 기존 테스트는 **WITHDRAWN 제외만** 검증한다 (`TrackIntegrationTest`, `GameIntegrationTest`, `AdminMentorSlotIntegrationTest` AC-10.9).
  PENDING_SETUP, LOCKED 멤버를 숨겨야 한다는 기대는 어디에도 없다. 테스트 제목의 "비활성"은 탈퇴를 뜻한다.
  즉 현재 필터가 PENDING_SETUP까지 숨기는 것은 **의도가 아니라 부작용일 가능성이 높다** (확정은 작성자 확인 필요).

수정 내용:

1. **노출 필터** (Track, Game, Home 세 곳): `member.isActive()`를 `!member.isWithdrawn()`으로 바꾼다.
   노출 여부는 관리자가 고른 `visible`(Game은 배정 자체)로 결정된다.
   - 기존 테스트는 WITHDRAWN 제외만 보므로 그대로 통과한다.
   - 공통 로직이 세 곳에 복사돼 있으니, 바꾸는 김에 한 메서드로 모으는 것도 검토한다 (필수는 아님).
2. **사진 동기화 대상 확대**: `WITHDRAWN`이 아닌 멤버(또는 트랙 페이지에 배정된 멤버)까지 포함한다.
   - (2026-10-13 변경, #138) `users.list`로 한 번에 받아 `slack_id`로 맞춘다. 목록 조회가 실패하면 502.
   - 원래는 `users.lookupByEmail`로 이메일 조회만 했다. 이메일이 Slack 가입 이메일과 다른 사람이 있을 수 있으므로,
     `slack_id`가 있으면 그 ID로 조회하는 경로를 우선 검토한다 (현재 코드에는 없음, 구현 시 Slack 스코프 확인).
3. **아바타 대체 표시**: 홈페이지에서 `profileImageUrl`이 `null`이면 이름 이니셜 아바타를 보여준다.
   - 전수 확인한 결과 사진을 그리는 곳은 3곳이고 모두 `profileImageUrl &&`일 때만 `<Image>`를 렌더한다 (없으면 회색 배경만 남는다).
     `src/app/track/components/MemberCarousel.tsx`, `src/components/MentorSlider.tsx`, `src/app/game/components/GameMembers.tsx`.
   - 공용 `Avatar` 컴포넌트 하나로 세 곳을 교체한다 (원형·사각 모양만 prop으로 받는다).
4. **수동 업로드는 유지**: `POST /{memberId}/photo/presigned-url`, `PATCH /{memberId}/photo`는 계정 상태와 무관하게 이미 동작한다.
   관리 화면에서 가입 전 멤버에도 쓸 수 있는지만 확인한다.
5. **이름 혼동 정리**: `Member.isActive()`를 `isAccountActive()`처럼 의미가 드러나는 이름으로 바꾼다.
   - 호출처는 위에서 전수 확인했다: main 호출 7곳(노출 3, 인증 4) + 정의 1곳, test 2곳
     (`MemberDirectoryIntegrationTest` 365행, `InitialSetupIntegrationTest` 167행).
   - 필터 수정 뒤에는 인증 4곳과 테스트 2곳만 남으므로 기계적 이름 변경이다.
   - `clubActive`의 Lombok 게터는 `isClubActive()`라서 이름이 겹치지는 않는다 (혼동은 이름의 인상 문제).

검증:

- 통합 테스트: 가입 전(`PENDING_SETUP`) + `visible=true` → 응답에 포함, `LOCKED` → 포함, `WITHDRAWN` → 제외, `visible=false` → 제외.
  Track, Game, Home(멘토) 세 곳 모두에 PENDING_SETUP 케이스를 추가한다.
  (`TrackIntegrationTest`, `GameIntegrationTest`, `AdminMentorSlotIntegrationTest` 확장)
- 사진 동기화: 가입 전 멤버에 대해 `profile_image_url`이 채워지는지, Slack 조회 실패 시 해당 멤버만 실패하고 계속 진행되는지.
- 홈페이지: 사진 없는 멤버가 깨지지 않고 아바타로 보이는지 (데스크톱·모바일).

배포 순서: 인터널 API 수정 배포 → 홈페이지 수정 배포. API만 먼저 나가도 사진이 없는 멤버는 지금처럼 빈 박스로 보일 뿐 깨지지 않는다.

---

## 3단계. 밥친구 스케줄

목표: 11월 모임부터 When2meet 대신 사용한다.

### 3.1 범위

**MVP (먼저)**

- 모임 생성: 제목, 날짜 범위, 시간 범위(오전 9시~밤 12시), 소요 시간, 응답 마감, 최소 인원
- 참여자별 토큰 링크 발급 (멤버 FK, 1인 1토큰, 만료)
- 비로그인 입력 화면: 30분 단위 드래그 그리드
- 후보 시간 상위 N개 자동 계산
- 미응답자 Slack 리마인드, 마감 시 결과 공지

**이후 (쓰면서 필요해지면)**

- 규칙 검증: 최소 4인, 최소 2개 트랙 혼합, 개인당 월 3회 상한
- 사진·영수증 제출, 참여 이력 조회 화면
- 삐봇 `/밥친구` 슬래시 명령 (처음에는 인터널 웹에서 만들고 링크를 Slack에 올려도 된다)

### 3.2 데이터 모델 (초안)

schedule 저장소의 스키마를 기반으로 Postgres에 맞춘다.

- `schedule_event`: id, title, description, duration_minutes, timezone(고정 Asia/Seoul 가능), date_start, date_end, day_start_minute, day_end_minute, response_deadline_at, min_participants, status(PENDING/CONFIRMED/CANCELLED), confirmed_start, confirmed_end, created_by(member FK), created_at
- `schedule_participant`: id, event_id FK, member_id FK, token_hash(unique), expires_at, responded_at
- `schedule_slot`: participant_id FK, start_at(timestamptz, 30분 정렬 CHECK)

기존 `reservation`의 `start_minute % 30 = 0` 제약과 같은 방식으로 정렬 제약을 둔다.
토큰은 평문 저장하지 않고 `password_reset_token`처럼 해시로 저장한다.

### 3.3 백엔드 (Spring)

- 패키지 `schedule` (controller, service, model, repository, dto). 기존 `reservation`, `activity` 구조를 따른다.
- 비로그인 엔드포인트(토큰 인증): 모임 조회, 내 응답 조회·저장.
- 로그인 엔드포인트(관리자): 모임 생성·마감·취소, 현황 조회.
- `SecurityConfig`에서 **토큰 라우트만** 비로그인 허용으로 연다 (`PublicCurriculumIntegrationTest`의 선례를 참고).
- 최적 시간 계산: `optimal-time.ts`를 Java로 옮긴다. 30분 셀 단위로 가용 인원을 세고 겹치지 않는 상위 후보를 뽑는다.
  원본의 테스트(`optimal-time.test.ts`)도 함께 옮겨서 동작을 맞춘다.
- 마감 처리: 스케줄러(기존 `SlackProfileSyncScheduler` 방식 참고)로 주기 실행.
- Slack 발송: 기존 `SlackClient`로 리마인드와 결과 공지.
- 토큰 보안: 마감 후 수정 차단, 만료, 응답 저장 시 본인 토큰인지 검증, 호출 횟수 제한.

### 3.4 프론트 (React + TanStack Router)

- 비로그인 라우트 `/schedule/$token`.
- 그리드 컴포넌트는 schedule의 `time-grid.tsx`를 참고해서 이 저장소의 FSD 구조에 맞게 새로 작성한다 (Tailwind·TanStack Start 전제 코드를 그대로 복사하지 않는다).
- 셀 키 형식을 한 곳에서 통일한다 (원본 CLAUDE.md의 `H:mm` 패딩 문제를 피하기 위해 ISO 시각 사용).
- 관리자 화면(`_admin.*`)에 모임 생성, 응답 현황, 후보 확인을 추가한다.
- 모바일에서 드래그 입력이 되는지 확인한다 (터치 이벤트).

### 3.5 라이선스 확인

DaleStudy/schedule은 외부 조직 소유다. 코드를 그대로 가져오지 않고 **알고리즘을 참고해 새로 구현**하되, 저장소 라이선스를 확인해서 문제가 없는지 본다.

### 3.6 검증

- 백엔드: 최적 시간 계산 단위 테스트, 토큰 권한 통합 테스트(만료, 타인 토큰, 마감 후 수정), Testcontainers 사용.
- 프론트: 브라우저에서 입력 → 저장 → 재진입 시 복원 확인.
- 실사용 리허설: 소수 인원으로 가짜 모임을 한 번 돌려 본 뒤, 11월 모임에 적용.

### 3.7 위험과 대응

| 위험                         | 대응                                               |
| ---------------------------- | -------------------------------------------------- |
| 입력 UX가 When2meet보다 불편 | 드래그, 모바일 터치를 최우선으로 검증              |
| 토큰 링크 유출               | 1인 1토큰, 만료, 마감 후 차단, 해시 저장           |
| 시간대 혼선                  | 서버·UI 모두 KST 고정, UTC 저장                    |
| 사용자가 안 씀               | When2meet와 병행 첫 달 운영, 후보 계산 결과와 비교 |

### 완료 기준

- 11월 밥친구 모임 1건 이상이 이 기능으로 확정된다.
- 미응답자 리마인드와 결과 공지가 Slack으로 나간다.
- 토큰 권한 테스트가 통과한다.

---

## 4. 이후 (보류 항목)

1~3이 안정된 뒤에 필요한지 다시 판단한다.

### 4.1 홈페이지 프레임워크 전환 검토 (Next.js → TanStack Start 또는 React Router v7)

> `BCSD_HOMEPAGE_RECODE`를 clone해서 읽은 내용 기준이다. 실제로 빌드·실행해 보지는 않았다.

**저장소 규모**: 페이지 9개, `src` 약 3,800줄(ts/tsx/css), 64개 파일, `'use client'` 14개. 의존성은 `next`, `react`, `swiper`, `clsx`, `adm-zip`뿐이다.

**Next 전용 기능 사용 현황 (전수)**:

| 기능                                                     | 사용량                                                            | 전환 난이도                                          |
| -------------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------- |
| `next/image`                                             | 32곳. 단 `images.unoptimized: true`라 **최적화 기능은 꺼져 있다** | 낮음. 일반 `<img>`와 크기 속성으로 대체              |
| `next/link`                                              | 약 15곳                                                           | 낮음                                                 |
| `next/dynamic`                                           | 3곳                                                               | 낮음 (`React.lazy`)                                  |
| `next/font/local`                                        | 1곳 (Pretendard)                                                  | 낮음 (`@font-face`)                                  |
| `generateMetadata` / `metadata` (OG, canonical, JSON-LD) | 트랙, 게임, 활동, 모집, 루트 레이아웃                             | 중간. SEO 검증이 필요하다                            |
| `generateStaticParams`                                   | 3곳이 있었으나 죽은 코드라 **#53에서 제거됨**                     | 해당 없음                                            |
| `notFound()`                                             | 4곳                                                               | 낮음                                                 |
| `loading.tsx`                                            | 1곳 (활동 스켈레톤)                                               | 낮음 (pending 컴포넌트)                              |
| `sitemap.ts`, `robots.ts`                                | 각 1곳                                                            | 낮음 (서버 라우트)                                   |
| Route Handler                                            | 2곳: 게임 빌드 서빙, 게임 ZIP 업로드 수신                         | **높음.** 아래 참고                                  |
| `reactCompiler: true`, `output: 'standalone'`            | 설정                                                              | 중간. Vite용 babel 플러그인, Docker 산출물 경로 변경 |

**전환이 어려운 부분: 게임 빌드 서빙/업로드 (`src/lib/gameBuild`, route 2개, 약 600줄)**

- 업로드: 어드민 브라우저가 이 서버로 **최대 약 500MB의 ZIP을 직접 PUT**하고, 서버는 스트리밍으로 임시 파일에 받아 압축 해제 후 `fs.rename`으로 교체한다.
- 서빙: 디스크 볼륨(`/data/bcsd-homepage/game-builds`)의 파일을 `Content-Encoding`과 캐시 헤더를 붙여 스트리밍한다.
- 웹 표준 `Request/Response`와 `node:fs`만 쓰므로 이식 자체는 가능하지만, **본문 크기 제한, 스트리밍 동작, CORS**가 프레임워크마다 달라서 실제 환경에서 500MB 업로드를 다시 검증해야 한다.
- 대안: 이 부분만 별도 작은 서버(예: Hono)로 분리하면 프론트 프레임워크 전환과 위험이 분리된다.

**렌더링 방식 (확인 완료, 2026-10-13)**:

- `next build` 출력에서 `/`, `/track/[track]`, `/game/[slug]`, `/activity/[category]` 등 동적 라우트가 모두 `ƒ`(요청 시 렌더)였다.
  즉 **SSR이고, 요청마다 인터널 API를 호출한다.** `generateStaticParams`는 죽은 코드였고(빌드가 API에 의존하는 부작용만 있었음) #53에서 제거했다.
- 트래픽이 적어서 이 구조는 **그대로 둔다** (결정). 짧은 캐시(예: 60초)는 트래픽이 늘거나 인터널 API 부하가 확인될 때만 검토한다.
  캐시를 두면 멤버 노출 변경이 반영되기까지 캐시 시간만큼 지연된다.

**후보 비교**:

|                                                 | 장점                                                                                                   | 단점                                                                                                                          |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| TanStack Start                                  | 인터널 웹이 이미 TanStack Router. 같은 라우팅·로더 개념을 쓴다. 참고 구현(`DaleStudy/schedule`)이 있다 | 생태계가 상대적으로 젊다. 문서·사례가 Next보다 적다                                                                           |
| React Router v7 (framework mode, 구 Remix 계열) | 안정적이고 SSR 모델이 단순하다                                                                         | 인터널 웹과 라우터가 달라진다. "Remix"라는 이름은 이후 방향이 달라진 것으로 알고 있어 **현재 상태를 확인한 뒤** 선택해야 한다 |
| Next.js 유지                                    | 변경 없음. 이미 16.x, React Compiler 사용                                                              | 프레임워크 종속(전용 API 다수). 기술 통일은 없음                                                                              |

**판단 (현 시점)**:

- 기술적으로는 가능하고 규모도 작다 (페이지 9개, 대부분 서버 컴포넌트 + 소수 클라이언트 컴포넌트).
- 그러나 **얻는 이익이 불분명하다.** 이미지 최적화는 꺼져 있어 잃을 것도 없지만, 서버 메모리나 성능이 눈에 띄게 좋아질 근거도 없다.
  이익은 주로 "인터널 웹과 라우팅·데이터 로딩 방식 통일"이다.
- 반면 홈페이지는 **모집 홍보 창구이고 SEO가 중요**하다. 메타 태그, sitemap, OG 이미지가 하나라도 깨지면 손해가 크다.
- 따라서 1~3단계 이후에 **스파이크(트랙 페이지 하나만 포팅해서 비교)** 로 판단한다.

**스파이크 계획 (보류 해제 시)**:

1. 브랜치에서 `/track/[track]` 한 페이지만 TanStack Start로 포팅한다 (데이터 로딩, 메타 태그, 404, 캐러셀).
2. 비교 항목: SSR HTML의 메타·JSON-LD 동일 여부, 빌드 시간, 컨테이너 메모리, 코드 변경량.
3. 게임 빌드 서빙/업로드는 포팅하지 않고, 분리 서버 안과 비교만 한다.
4. 결과가 이익이 없으면 Next 유지로 결론 내리고 종료한다.

- OpenAPI로 TS 클라이언트 생성 → 삐봇·인터널 웹 타입 공유
- 서버 비용: JVM 옵션 튜닝(`-Xmx`, `SerialGC`), 삐봇과 같은 호스트 통합. 절감액을 측정한 뒤에만 언어 전환을 논의
- 담당자 인수인계: 로컬 실행 가이드, 도메인 문서 보강 (Spring 가능 인원 2명)
- Notion·Drive·GitHub 권한 자동 부여: 처음엔 체크리스트와 링크로 시작, 자동화는 감사 로그와 확인 단계를 갖춘 뒤

### 4.2 홈페이지 정비 PR (2026-10-13 완료, 운영 배포·확인 끝)

저장소: `BCSDLab/BCSD_HOMEPAGE_RECODE`. 검증은 모의 API + 도커 이미지와 같은 standalone 실행 + curl/브라우저로 했고,
머지는 `develop`에 squash로 한 건씩 하며 배포(`deploy.yml`, 도커 빌드 포함)가 끝나는 것을 확인한 뒤 다음을 머지했다.

| PR  | 내용                                                                                                           | 결과                                                             |
| --- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| #53 | `generateStaticParams` 3곳 제거, 빌드 파일 추적 범위 축소                                                      | API 없이 빌드 성공(수정 전 실패), 경고 2→0, standalone 59MB→40MB |
| #54 | 주석 처리된 코드 약 150줄, 미사용 파일·devDependency(`@svgr/webpack`, `@types/adm-zip`) 정리, 푸터 연도 동적화 | `--frozen-lockfile` 통과, 푸터 2026                              |
| #55 | 사진 없는 멤버에 이니셜 아바타 (트랙·멘토·게임 3곳)                                                            | 브라우저에서 세 곳 모두 확인                                     |
| #56 | JSON-LD 이스케이프, `error.tsx`, API 호출 공통화, 업로드 시크릿 미설정 시 차단                                 | 아래 참고                                                        |
| #57 | 없는 활동 분류 404, `/track`·`/activity` 기본 경로를 API 기반 307로 전환                                       | 아래 참고                                                        |

운영 확인(머지·배포 후, 읽기 전용 요청):

- `/track`, `/activity` → 307로 `/track/frontend`, `/activity/event`
- `/activity/없는분류`, `/activity/nope/1`, `/track/nope`, `/game/nope` → 404
- `/`, `/game`, `/recruit`, sitemap, robots 정상
- 홈 JSON-LD에서 `<`가 이스케이프됨 (원문 0건)
- 운영 업로드 엔드포인트에 `local-dev-secret`으로 서명한 위조 토큰 → 401

측정으로 확인된 사실:

- **JSON-LD 주입은 실제로 실행됐다.** QnA에 `</script><script>alert(1)</script>`가 들어가면 수정 전 브라우저에서 `alert(1)`이 실행됐다.
  수정 후에는 `\u003c`로 이스케이프된다. (QnA는 관리자가 입력하는 값이라 위험도는 "관리자 계정 탈취 또는 실수" 전제.)
- **업로드 시크릿**: `GAME_BUILD_SECRET` 미설정 시 개발 기본값으로 서명한 위조 토큰이 통과(422)했다. 수정 후 401.
  운영은 `deploy.yml`이 저장소 시크릿(`GAME_BUILD_SECRET` 등록 확인)을 넘기므로 정상 운영에는 영향이 없고, 올바른 시크릿의 토큰은 통과한다.
- **`/activity/없는분류`**: 200 → 404. `loading.tsx`의 스트리밍이 시작되기 전에 레이아웃에서 404를 확정한다.
- **API 장애 시**: `/`, `/track/*`, `/recruit`은 500 + `noindex`이고 한국어 에러 화면과 재시도 버튼이 나온다(브라우저에서 확인).
  `/activity/*`는 수정 전 200(에러 화면)이었고 수정 후 500이다. 리다이렉트는 API가 실패해도 기본 슬러그로 간다.
- 슬러그 경로 주입(`/track/..%2Fhome`)은 수정 전에도 404였다. 버그가 아니었고 `encodeURIComponent`는 방어적 보강일 뿐이다.

의도적으로 제외한 것:

- `key={index}`: 서버에서 내려오는 정적 목록이라 실제 문제가 없고, 복합 키로 바꾸면 중복 키 경고 위험만 생긴다.
- `RECRUIT_TERM`: API에 값이 없어 4.3으로 분리했다.
- 모바일 대응: 모든 페이지가 `min-w-360`(1440px) 고정이다. 데스크톱 전용 설계라 별도 과제.
- 인터널 API 호출 캐시, 프레임워크 전환.

남은 정리: 머지된 원격 브랜치 5개(`chore/remove-dead-static-params`, `chore/cleanup-dead-code`, `feat/avatar-fallback`,
`fix/resilience-and-json-ld`, `fix/routing-correctness`)가 남아 있다. 저장소가 머지 후 자동 삭제를 켜지 않았다.

### 4.3 모집 학기 문구(`RECRUIT_TERM`)를 API 값으로 전환 (할 일, 미착수)

현재: 홈페이지 `src/constants/recruit.ts`에 `RECRUIT_TERM = '2026년 상반기'`가 하드코딩돼 있다.
쓰이는 곳: `src/app/recruit/page.tsx`(메타 설명), `src/app/recruit/components/TrackSection.tsx`(화면 문구).
모집 때마다 코드를 고치고 배포해야 하고, 지금처럼 값이 낡아도 알아채기 어렵다 (현재 10월인데 '2026년 상반기').

**API에는 해당 값이 없다.** `recruit_link`(`V16__create_home_widgets.sql`)는 단일 행이고 컬럼은
`google_form_url`, `is_open`, `close_date`, `closed_message`뿐이다. `/v1/home`의 `recruit`도 `googleFormUrl`, `isOpen`, `closedMessage`만 내려준다.

작업 내용:

1. **DB**: Flyway `V29__add_recruit_link_term.sql`(V28은 계정 분리에 사용됨, 작성 시점 최신 번호 다시 확인) — `recruit_link.term VARCHAR(50)` 추가.
   - 기존 행은 `NOT NULL` 기본값이 필요하다 (SQLite가 아니라 Postgres라 `ADD COLUMN ... NOT NULL DEFAULT ''` 가능). 빈 문자열이면 홈페이지가 기존 상수로 폴백한다.
   - 마이그레이션 번호는 작성 시점의 최신(현재 V27) 다음으로 확인한다.
2. **API**: `RecruitLink` 엔티티·`create/update`에 `term` 추가, `RecruitLinkResponse`(공개)와 `AdminRecruitLinkResponse`에 `term` 추가,
   `RecruitLinkUpdateRequest`에 `@Size(max = 50) String term` 추가. 이력 테이블(`recruit_link_history`)에 남길지 결정한다.
   통합 테스트(`AdminQnaAndRecruitLinkIntegrationTest`)에 term 저장·조회 케이스를 추가한다.
3. **어드민 웹**: `BCSD_INTERNAL_RECODE_V2`의 `src/pages/home/ui/components/RecruitLinkSection.tsx`에 입력 필드 추가.
4. **홈페이지**: `HomeRecruitLink`에 `term?: string` 추가, `/recruit` 페이지와 `TrackSection`이 `recruit?.term || RECRUIT_TERM`을 쓴다.
   모든 곳에서 API 값이 확인된 뒤 `RECRUIT_TERM` 상수를 제거한다.

배포 순서: API(필드 추가, 기본값 빈 문자열) → 홈페이지(폴백 포함) → 어드민 웹 → 값 입력 → 상수 제거. 응답에 필드가 추가될 뿐이라 순서가 바뀌어도 깨지지 않는다.
확인 필요: 모집 학기를 "기수"로도 표시할지, 학기 문구 외에 모집 기간(시작·마감일)도 노출할지 (현재 `close_date`는 응답에 포함되지 않는다).

### 4.4 인터널 API 테스트 환경 문제 (발견, 미착수)

2.6 작업 중 확인한 사실이다.

- **테스트가 어디서도 자동 실행되지 않는다.** `Dockerfile`이 `gradle bootJar -x test`로 빌드하고, `.github/workflows`에는 `deploy.yml`(main 푸시 시 운영 배포)뿐이다. PR용 CI가 없다.
- **테스트 간 격리 문제**: `IntegrationTestSupport`의 싱글턴 컨테이너를 공유하는데, `TrackIntegrationTest.setUp`의 `memberRepository.deleteAll()`이
  `AdminMentorSlotIntegrationTest`가 남긴 `mentor_slot` 행 때문에 외래키 위반으로 실패한다 (같은 DB에서 멘토 슬롯 테스트가 먼저 돌 때, 트랙 테스트 16개 실패 재현).
  클래스별로 DB를 초기화하면 모두 통과한다.
- 기존 7개 테스트 클래스(auth 4, member 2, 컨텍스트 1)는 각자 Testcontainers를 띄워서 Docker 없이는 못 돌린다.

제안: (1) PR용 GitHub Actions에서 `./gradlew test` 실행 (Docker가 있는 러너), (2) `TrackIntegrationTest` 등의 `setUp` 정리 순서 보완(`mentor_slot`, `game_member` 먼저 삭제), (3) 남은 클래스를 `IntegrationTestSupport`로 이전.

이 환경에서 테스트를 돌린 방법(재사용용): JDK 21(`~/tools/jdk21`) + Docker 대신 로컬 Postgres 16(`~/tools/pg16`, 포트 15432)을 쓰고,
`IntegrationTestSupport`를 **커밋하지 않는** 임시 패치로 로컬 DB에 연결한다. 클래스 묶음마다 DB를 새로 초기화한다.

## 5. 열린 질문

1. ~~인터널 57명의 구성과 `slack_id` 보유율~~ → 1.2 결과 참고
2. ~~삐봇 데이터가 지금도 갱신되는가~~ → 아니오 (2026-08-27 이후 없음)
3. ~~삐봇 앱에 Redirect URL과 `openid` 스코프를 추가할 수 있는가~~ → 현재 불가(협업자 아님). 보류
4. 멘토님들이 Slack 워크스페이스에 들어와 있는가 → 로그인 방식 A의 적용 범위 결정
5. DaleStudy/schedule의 라이선스 → 3.5
6. ~~COMPLETION(수료) 상태의 인터널 대응 값~~ → GRADUATED
7. 홈페이지에 노출할 비활동·미가입 멤버의 공개 동의 기준 (이름과 사진을 공개해도 되는 범위) → 2.6
8. 홈페이지 노출 정책: 노출 기준을 `visible`만 쓸지, `clubActive`(동아리 활동 여부)도 함께 볼지 → 2.6
