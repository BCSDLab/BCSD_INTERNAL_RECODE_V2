# 회비·장부 API 계약 초안

BE와 합의하기 전의 초안이다. 요청·응답 타입은 `src/api/dues/types.ts`, `src/api/ledger/types.ts`가 원본이다.
FE는 지금 mock "서버"(`src/api/dues/mock-db.ts`)로 이 계약대로 동작한다. BE가 배포되면 `NEXT_PUBLIC_LEDGER_API=live`로 바꾼다.

## FE 구조 (iOS 대응)

| 파일                                               | 역할                                             | iOS로 치면                  |
| -------------------------------------------------- | ------------------------------------------------ | --------------------------- |
| `api/{dues,ledger}/types.ts`                       | 요청·응답 DTO (이 문서의 계약)                   | `Codable` DTO               |
| `api/{dues,ledger}/api.ts`                         | 엔드포인트 함수. `USE_LEDGER_MOCK`이면 mock 호출 | Repository (Live/Mock 분기) |
| `api/{dues,ledger}/mock.ts`, `api/dues/mock-db.ts` | 메모리 저장소. 서버가 할 집계를 흉내 낸다        | MockRepository              |
| `api/{dues,ledger}/mappers.ts`                     | DTO → 화면 뷰 모델 변환                          | DTO → Entity 매퍼           |
| `api/{dues,ledger}/queries.ts`                     | react-query 키·조회                              | ViewModel의 fetch/캐시      |
| `api/dues/mock-switch.ts`                          | mock/live 스위치                                 | DI 플래그                   |
| `components/dues/DuesUiProvider.tsx`               | 페이지 이동 뒤 토스트 같은 **UI 상태만** 둔다    | 화면 상태 `@State`          |

- mock 여부는 **로그인 세션이 아니라 스위치**로 정한다. 실제 관리자로 로그인해도 없는 API를 부르지 않는다.
- `NEXT_PUBLIC_LEDGER_PREVIEW=true`(dev 전용)는 로그인 없이 `/ledger`를 여는 편의 기능일 뿐이다.

## 원칙

- 모든 경로는 `/v1/admin/...` 아래에 둔다. 관리자 전용이다.
- ID는 `number`(BE `Long`)다. 학기만 `"2026-2"` 자연키를 쓴다.
- enum은 대문자 코드로 주고받고, 한글 라벨 변환은 FE `mappers.ts`가 한다.
- **집계는 서버가 한다.** 회원별 월 상태, 부과액, 미납액, 초과납부액, 학기 요약, 장부 잔액이 모두 포함된다. 규칙은 `mock-db.ts`의 `deriveMemberDues`와 같다(아래 "회비 상태 규칙").
- 변경 API를 부르면 FE는 `invalidateLedgerAndDues`로 장부와 회비 캐시를 통째로 다시 받는다. 장부 연결과 면제 변경이 서로의 집계를 바꾸기 때문이다.

## 회비

| Method | Path                                                      | 화면                                | 타입                                                    |
| ------ | --------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------- |
| GET    | `/v1/admin/dues/semesters`                                | 학기 탭·목록                        | `SemesterDuesListResponse`                              |
| GET    | `/v1/admin/dues/semesters/creatable`                      | "+ 회비 생성" 노출 여부와 만들 학기 | `SemesterCreatableResponse`                             |
| POST   | `/v1/admin/dues/semesters`                                | 다음 학기 생성                      | `SemesterCreateRequest` → `SemesterDuesSummaryResponse` |
| GET    | `/v1/admin/dues/semesters/{semesterId}/members`           | 학기 상세 표                        | `SemesterDuesDetailResponse`                            |
| POST   | `/v1/admin/dues/semesters/{semesterId}/links`             | 입출금 내역 연결 모달               | `DuesLinkBulkRequest` → `DuesLinkBulkResponse`          |
| POST   | `/v1/admin/dues/semesters/{semesterId}/exemption-preview` | 면제 적용 전 영향 비교              | `ExemptionPreviewRequest` → `ExemptionPreviewResponse`  |
| GET    | `/v1/admin/dues/exemptions`                               | 면제 사유 화면                      | `ExemptionListResponse`                                 |
| POST   | `/v1/admin/dues/exemptions`                               | 면제 추가                           | `ExemptionUpsertRequest` → `ExemptionResponse`          |
| PUT    | `/v1/admin/dues/exemptions/{id}`                          | 면제 수정                           | `ExemptionUpsertRequest` → `ExemptionResponse`          |
| GET    | `/v1/admin/dues/exemption-reasons`                        | 사유 드롭다운                       | `ExemptionReasonListResponse`                           |
| POST   | `/v1/admin/members/slack-ids/lookup`                      | Slack ID 입력 모달의 "자동 채우기"  | `SlackIdLookupRequest` → `SlackIdLookupResponse`        |
| POST   | `/v1/admin/dues/semesters/{semesterId}/notifications`     | Slack 알림 전송                     | `DuesNotificationRequest` → `DuesNotificationResponse`  |

### 회비 상태 규칙 (사용자 확정)

- `차이 = 연결된 입금 합계 − 연결된 출금 합계 − 부과액`
  - 0 → 완료(`PAID`), 음수 → 미납(`UNPAID`), 양수 → 초과납부(`OVERPAID`)
  - 부과액이 0이고 연결 내역이 없으면 면제(`EXEMPT`)
- **반환(환불) 개념은 없다.** 출금도 입금과 같은 흐름으로 회비에 연결하고, 연결하면 그만큼 납부액에서 빠진다.
- `needsReview`는 미납 또는 초과납부 회원이 한 명이라도 있으면 true다.
- 월 칸은 표시용이다. 순납부액을 앞 달부터 월 회비 단위로 채워 `PAID`로 보이고, 면제 월은 건너뛴다. 남은 달은 `UNPAID`다.
- 면제는 겹칠 수 있다. 한 달에 면제가 하나라도 걸리면 그 달 부과액은 0이다(몇 개가 걸려도 같다). 겹침 검증은 두지 않는다.

#### 반환 제거로 바뀐 계약 (BE v2와 맞출 것)

| 위치                 | 제거                                                                                                                  | 대신                                                    |
| -------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `SemesterDuesStatus` | `PARTIAL`                                                                                                             | 부족분은 모두 `UNPAID`                                  |
| `MemberDuesResponse` | `refundStatus`, `refundReason`, `refundedAmount`                                                                      | `excessAmount`(차이가 양수일 때 그 값, 아니면 0)만 남김 |
| `api/dues/types.ts`  | `RefundStatus`, `RefundReason` 타입                                                                                   | –                                                       |
| `MonthDuesResponse`  | `exemption: MonthExemption \| null`                                                                                   | `exemptions: MonthExemption[]` (겹친 면제 전부)         |
| `DuesLinkResponse`   | `refundReason`, `refundAmount`                                                                                        | –                                                       |
| `LedgerCategory`     | `DUES_REFUND`(회비 반환)                                                                                              | 회비 출금도 `DUES`                                      |
| `ImportCategory`     | `DUES_REFUND`                                                                                                         | `DUES` \| `ETC`                                         |
| FE 화면              | 환불 마법사(`RefundFlowAssistant`), 장부 "반환 출금을 찾고 있습니다" 배너·연결 확정 모달, `DuesUiProvider.refundFlow` | 출금도 "입출금 내역 연결" 모달로 연결                   |

### 회비 생성 제한

- 서버가 오늘 날짜로 현재 학기를 정한다. 1학기는 3~~8월, 2학기는 9월~~다음 해 2월이다.
- 만들 학기는 가장 최근 학기의 다음 학기다. 그 학기가 **현재 학기의 바로 다음 학기 이내**일 때만 `creatable: true`를 준다.
- 예: 오늘이 2026-10이면 현재 학기는 2026-2다. 2027-1까지 만들 수 있고, 2027-1을 만들면 버튼이 사라진다.
- 생성 API(`POST`)도 같은 규칙으로 다시 검사한다.

## 장부

| Method | Path                                       | 화면                                             | 타입                                                           |
| ------ | ------------------------------------------ | ------------------------------------------------ | -------------------------------------------------------------- |
| GET    | `/v1/admin/ledger/entries`                 | 장부 목록 (헤더 필터는 지금 클라이언트에서 처리) | `LedgerEntryListResponse`                                      |
| PATCH  | `/v1/admin/ledger/entries/{id}`            | 상세 수정, 증빙 교체·삭제                        | `LedgerEntryUpdateRequest` → `LedgerEntryResponse`             |
| PUT    | `/v1/admin/ledger/entries/{id}/dues-link`  | 단건 회비 연결 (입금·출금 공통)                  | `DuesLinkRequest` → `LedgerEntryResponse`                      |
| DELETE | `/v1/admin/ledger/entries/{id}/dues-link`  | 연결 해제 (화면은 아직 없음)                     | –                                                              |
| POST   | `/v1/admin/ledger/evidences/presigned-url` | 증빙 업로드 1단계                                | `EvidencePresignedUrlRequest` → `EvidencePresignedUrlResponse` |
| POST   | `/v1/admin/ledger/evidences/{id}/complete` | 증빙 업로드 완료                                 | `EvidenceResponse`                                             |
| POST   | `/v1/admin/ledger/imports/preview`         | 신한 .xlsx 분석 (multipart)                      | `ImportPreviewResponse`                                        |
| POST   | `/v1/admin/ledger/imports`                 | 선택한 거래 반영                                 | `ImportCommitRequest` → `ImportCommitResponse`                 |

- 증빙은 먼저 업로드해 ID를 받는다. 장부 기록에는 `PATCH`의 `evidenceIds`로 붙인다. 교체와 삭제도 같은 PATCH로 처리한다.
- 분류를 바꾸면 서버가 연결을 끊는다. 회비 분류(DUES)면 PENDING, 그 밖의 분류면 NONE으로 되돌린다.
- 입금·출금 모두 회비에 연결하면 분류가 DUES가 된다. 출금은 납부액에서 빠진다.

## 인명부 Slack ID — 래퍼 mock으로 먼저 연결 (FE 적용 완료)

- 인명부 화면에 Slack ID 열이 있고, 회원 수정 모달에 Slack ID 입력칸이 있다.
- 인명부 API는 실제 BE를 그대로 부른다. BE가 아직 모르는 `slackId`만 FE 래퍼 mock(`src/api/member/slack-id-mock.ts`)이 채운다.
  - 래퍼 mock은 브라우저 localStorage에 값을 저장하고, 응답에 덮어 준다.
  - 응답에 `slackId`가 **없을 때(undefined)만** 덮는다. BE가 필드를 내려주기 시작하면(null 포함) 서버 값이 그대로 쓰인다.
- **BE 요청 사항**
  - `member.slack_id` 컬럼(nullable)을 추가한다.
  - `MemberSummaryResponse`에 `slackId` 필드를 추가한다. 응답 필드 추가라 기존 클라이언트는 깨지지 않는다.
  - `PATCH /v1/admin/members/{memberId}/slack-id` `{ slackId: string | null }`를 만든다.
  - 프로필 PATCH(`AdminMemberProfileUpdateRequest`)에는 **넣지 않는다.** 이 API는 전체를 덮어쓰는 방식이라, slackId를 모르는 클라이언트가 저장할 때마다 값이 null로 지워진다.
- **부원 추가 시 자동 조회:** 추가 모달에는 Slack ID 입력칸이 없다. 저장으로 회원이 생기면 FE가 `POST /v1/admin/members/slack-ids/lookup`을 그 회원 ID로 부른다. 서버는 입력한 이메일로 Slack을 조회해 찾은 값을 저장한다. 조회가 실패해도 회원 생성은 성공으로 본다.
  - 대안: BE의 회원 생성 처리 안에서 바로 조회하면 FE 호출이 하나 줄어든다.
- **입력 형식:** U로 시작하는 영문 대문자·숫자 11자다. 영문은 입력할 때 자동으로 대문자로 바뀐다.
- **연결 절차:** BE 배포 → FE 환경변수 `NEXT_PUBLIC_MEMBER_SLACK_API=live` → `slack-id-mock.ts` 삭제. 화면 코드는 고치지 않는다.

## Slack 알림

- **수신자는 인명부에 저장된 slackId**로 정한다. FE는 `memberId`만 보내고, 서버가 `member.slack_id`로 바꿔 보낸다.
  - 학기 회비 응답(`MemberDuesResponse.slackId`)에 인명부 값이 들어 있다. 알림 모달의 "Slack 계정 확인"은 이 값이 비어 있는 대상자 수를 보여 준다.
- 누락이 있으면 알림 모달에 **"Slack ID 입력"** 버튼이 생긴다. 누르면 누락 회원 표가 나온다.
  - **직접 입력:** 형식은 U로 시작하는 11자다. 저장하면 `PATCH /v1/admin/members/{id}/slack-id`로 인명부에 반영된다.
  - **자동 채우기:** `POST /v1/admin/members/slack-ids/lookup`을 부른다. 서버가 회원 이메일로 Slack을 조회하고(`findSlackIdByEmail`), 찾은 값을 **바로** `member.slack_id`에 저장한 뒤 결과를 돌려준다. 못 찾은 회원은 화면에 표시한다.
  - 저장하고 닫으면 회비·인명부 캐시를 다시 받는다. 그래서 알림 모달의 상태가 곧바로 갱신된다.
- **BE 변경 범위**
  - `SlackClient.findProfileImageUrlByEmail()`은 사진 URL만 돌려주고 응답의 `user.id`는 버린다. 같은 호출을 쓰는 `findSlackIdByEmail(email)`을 추가한다.
  - 위 lookup 엔드포인트와 인명부 slackId 컬럼·API를 만든다(앞 절 참고).
  - 메시지 발송은 `chat.postMessage`로 한다. 지금 봇 토큰에 발송 scope가 있는지는 확인이 필요하다. 이 문서는 아직 Slack 문서와 대조하지 않았다.
- `{담당자 멘션}` 토큰은 FE가 치환하지 않고 그대로 보낸다. 서버가 로그인한 관리자의 slackId로 `<@U…>`를 만든다.

## 미결 질문 (BE와 합의 필요)

1. **자동 채우기의 Slack 호출량**: 누락 회원 수만큼 `users.lookupByEmail`을 부른다. Slack rate limit(수치는 확인 필요) 안에 드는지 확인해야 한다.
2. **학기 명단 기준**: 학기를 만들 때 넣을 회원을 정해야 한다. 후보는 `duesRequired && active`인 회원이다. 생성 뒤 가입하거나 탈퇴한 회원을 어떻게 반영할지도 정해야 한다. mock은 생성 시점의 전체 회원을 넣는다.
3. ~~월 배분 규칙~~ → 확정: 순납부액을 앞 달부터 월 회비 단위로 채운다(표시용). 복잡한 배분은 하지 않는다.
4. **월 회비 금액**: 지금은 10,000원 고정이다. 학기마다 바뀔 수 있다면 생성 모달에서 입력받아야 한다.
5. **면제 사유 목록**: 별도 테이블로 둘지, 이미 쓰인 사유의 중복 제거 목록을 쓸지 정해야 한다. 초안은 면제를 저장할 때 새 사유를 함께 등록한다.
6. **면제 삭제**: 화면에 삭제 기능이 없어서 API도 넣지 않았다.
7. **신한 .xlsx 파싱 위치**: 초안은 서버에서 파싱한다. 거래 지문(`rowKey`)으로 중복을 막으려면 서버가 원본을 봐야 하기 때문이다. 미리보기 단계에서 회비 대상을 추천하는 값(`suggestedMemberId`)은 화면에 아직 쓰이지 않는다.
8. **업로드 multipart**: `apiFetch`가 `Content-Type: application/json`을 고정하고 있다. 실제 API를 붙일 때 `client.ts`에 FormData 분기가 필요하다.
