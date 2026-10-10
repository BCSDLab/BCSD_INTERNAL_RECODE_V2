# 회비·장부 API 계약

BE 설계 v3(`ledger-be-design.md`) 12절 "최종 API 계약 표"와 맞춘 FE 계약이다. 둘이 다르면 설계 12절이 맞다.
요청·응답 타입은 `src/api/dues/types.ts`, `src/api/ledger/types.ts`가 원본이다.
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

### 학기 명단 (설계 v3 4-3절 확정)

| Method | Path                                                      | 화면                       | 타입                                                                                  |
| ------ | --------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------- |
| GET    | `/v1/admin/dues/semesters/{semesterId}/roster`            | 명단 관리 모달 표          | `SemesterRosterResponse { members: RosterMemberResponse[] }`                          |
| GET    | `/v1/admin/dues/semesters/{semesterId}/roster/candidates` | 명단 관리 > 회원 추가 검색 | `RosterCandidateListResponse { members: { memberId, name, studentNumber, track }[] }` |
| POST   | `/v1/admin/dues/semesters/{semesterId}/roster`            | 회원 추가                  | `RosterAddRequest { memberId, applicable }` → `RosterMemberResponse`                  |
| PATCH  | `/v1/admin/dues/semesters/{semesterId}/roster/{memberId}` | 납부 대상 토글             | `RosterUpdateRequest { applicable }` → `RosterMemberResponse`                         |

- `RosterMemberResponse = { memberId, name, studentNumber, track, applicable }`. `applicable: false`면 이 학기 납부 비대상(월 칸 전부 `NOT_APPLICABLE`, 부과액 null).
- 후보(`candidates`)는 **명단에 없는 모든 회원**이다. 회원 상태와 회비 대상 여부(`duesRequired`)는 따지지 않는다. 검색은 FE가 클라이언트에서 한다.
- 명단에서 빼는 API(DELETE)는 없다. 잘못 들어간 회원은 `applicable: false`로 둔다.
- 오류(`ErrorResponse { message }`, 괄호 안은 서버 오류 코드)
  - 학기 공통: 400 `INVALID_SEMESTER_ID`(형식 `2026-2`가 아님), 404 `SEMESTER_NOT_FOUND`
  - POST: 400 검증, 404 `MEMBER_NOT_FOUND`, 409 `ROSTER_MEMBER_EXISTS` "이미 이 학기 명단에 있는 회원입니다."
  - PATCH: 400 검증, 404 `NOT_ROSTER_MEMBER` "이 학기 회비 명단에 없는 회원입니다.", 409 `ROSTER_MEMBER_HAS_LINKS` "연결된 입출금 내역이 있어 납부 비대상으로 바꿀 수 없습니다. 연결을 먼저 해제하세요."
- 모달은 변경을 한 건씩 차례로 보낸다. 중간에 실패하면 앞의 변경은 남고, 모달이 명단을 다시 받아 보여 준다.
- 저장 뒤 FE는 장부·회비 캐시를 통째로 다시 받는다. 마감 개념은 없어서 지난 학기를 포함해 어느 학기든 추가·정정할 수 있다.

### 회비 상태 규칙 (사용자 확정)

- `차이 = 연결된 입금 합계 − 연결된 출금 합계 − 부과액`
  - 0 → 완료(`PAID`), 음수 → 미납(`UNPAID`), 양수 → 초과납부(`OVERPAID`)
  - 부과액이 0이고 연결 내역이 없으면 면제(`EXEMPT`)
- **반환(환불) 개념은 없다.** 출금도 입금과 같은 흐름으로 회비에 연결하고, 연결하면 그만큼 납부액에서 빠진다.
- `needsReview`는 미납 또는 초과납부 회원이 한 명이라도 있으면 true다.
- 월 칸은 표시용이다. 순납부액을 앞 달부터 월 회비 단위로 채워 `PAID`로 보이고, 면제 월은 건너뛴다. 남은 달은 `UNPAID`다.
- 면제는 겹칠 수 있다. 한 달에 면제가 하나라도 걸리면 그 달 부과액은 0이다(몇 개가 걸려도 같다). 겹침 검증은 두지 않는다.
- 납부 비대상(`applicable: false`) 회원은 항상 `EXEMPT`이고 `assessedAmount`·`paidAmount`·`unpaidAmount`는 null, `excessAmount`는 0이다. 회비 표에서는 숨겨진다.
- **납부 비대상 회원에게는 연결할 수 없고, 연결이 있는 회원은 비대상으로 바꿀 수 없다.** 그래서 연결된 돈이 숨겨진 행으로 사라지지 않는다.
  - 비대상 회원에게 연결: 409 `ROSTER_MEMBER_NOT_APPLICABLE` "이 학기 납부 비대상 회원에게는 입출금 내역을 연결할 수 없습니다."
  - 명단에 없는 회원에게 연결: 404 `NOT_ROSTER_MEMBER` "이 학기 회비 명단에 없는 회원입니다."
  - 연결이 있는데 비대상으로 정정: 409 `ROSTER_MEMBER_HAS_LINKS`(명단 절 참고). 연결을 먼저 해제한다.
- 일괄 연결(`POST …/links`, 1~1,000건)은 하나라도 실패하면 **아무것도 연결하지 않는다**(전체 롤백). 같은 내역이 두 번 오면 400 `DUPLICATED_ENTRY_IN_REQUEST`. 없는 내역과 이미 연결된 내역은 건너뛰고 `linkedCount`에 세지 않는다.

#### 반환 제거로 바뀐 계약 (설계 v3에 반영됨)

| 위치                 | 제거                                                                                                                  | 대신                                                    |
| -------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `SemesterDuesStatus` | `PARTIAL`                                                                                                             | 부족분은 모두 `UNPAID`                                  |
| `MemberDuesResponse` | `refundStatus`, `refundReason`, `refundedAmount`                                                                      | `excessAmount`(차이가 양수일 때 그 값, 아니면 0)만 남김 |
| `api/dues/types.ts`  | `RefundStatus`, `RefundReason` 타입                                                                                   | –                                                       |
| `MonthDuesResponse`  | `exemption: MonthExemption \| null`                                                                                   | `exemptions: MonthExemption[]` (겹친 면제 전부)         |
| `DuesLinkResponse`   | `refundReason`, `refundAmount`, `requiredAmount`                                                                      | –                                                       |
| `LedgerCategory`     | `DUES_REFUND`(회비 반환)                                                                                              | 회비 출금도 `DUES`                                      |
| `ImportCategory`     | `DUES_REFUND`                                                                                                         | `DUES` \| `ETC`                                         |
| FE 화면              | 환불 마법사(`RefundFlowAssistant`), 장부 "반환 출금을 찾고 있습니다" 배너·연결 확정 모달, `DuesUiProvider.refundFlow` | 출금도 "입출금 내역 연결" 모달로 연결                   |

### 회비 생성 제한

- 서버가 오늘 날짜로 현재 학기를 정한다. 1학기는 3월부터 8월, 2학기는 9월부터 다음 해 2월까지다.
- 만들 학기는 가장 최근 학기의 다음 학기다. 그 학기가 **현재 학기의 바로 다음 학기 이내**일 때만 `creatable: true`를 준다.
- 예: 오늘이 2026-10이면 현재 학기는 2026-2다. 2027-1까지 만들 수 있고, 2027-1을 만들면 버튼이 사라진다.
- 생성 API(`POST`)도 같은 규칙으로 다시 검사한다(400 `SEMESTER_NOT_CREATABLE`, 이미 있으면 409 `SEMESTER_ALREADY_EXISTS`).
- `monthlyAmount`는 1 이상 1,000,000 이하의 정수다(0을 더 친 오타 방지). 넘으면 생성 모달이 막고, 서버도 400이다.

## 장부

| Method | Path                                       | 화면                                                                              | 타입                                                           |
| ------ | ------------------------------------------ | --------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| GET    | `/v1/admin/ledger/entries`                 | 장부 목록 (헤더 필터는 지금 클라이언트에서 처리)                                  | `LedgerEntryListResponse`                                      |
| PATCH  | `/v1/admin/ledger/entries/{id}`            | 상세 수정, 증빙 교체·삭제                                                         | `LedgerEntryUpdateRequest` → `LedgerEntryResponse`             |
| PUT    | `/v1/admin/ledger/entries/{id}/dues-link`  | 단건 회비 연결 (입금·출금 공통)                                                   | `DuesLinkRequest` → `LedgerEntryResponse`                      |
| DELETE | `/v1/admin/ledger/entries/{id}/dues-link`  | 연결 해제 (회원 회비 모달 "수정" → "연결 해제"). 회비 분류면 PENDING으로 돌아간다 | –                                                              |
| POST   | `/v1/admin/ledger/evidences/presigned-url` | 증빙 업로드 1단계                                                                 | `EvidencePresignedUrlRequest` → `EvidencePresignedUrlResponse` |
| POST   | `/v1/admin/ledger/evidences/{id}/complete` | 증빙 업로드 완료                                                                  | `EvidenceResponse`                                             |
| POST   | `/v1/admin/ledger/imports/preview`         | 신한 .xlsx 분석 (multipart)                                                       | `ImportPreviewResponse`                                        |
| POST   | `/v1/admin/ledger/imports`                 | 미리보기의 모든 거래 반영                                                         | `ImportCommitRequest` → `ImportCommitResponse`                 |

- 증빙은 먼저 업로드해 ID를 받는다. 장부 기록에는 `PATCH`의 `evidenceIds`로 붙인다. 교체와 삭제도 같은 PATCH로 처리한다.
- 분류를 바꾸면 서버가 연결을 끊는다. 회비 분류(DUES)면 PENDING, 그 밖의 분류면 NONE으로 되돌린다.
- 입금·출금 모두 회비에 연결하면 분류가 DUES가 된다. 출금은 납부액에서 빠진다.
- 단건 연결(`PUT …/dues-link`) 오류: 404 `ENTRY_NOT_FOUND`·`SEMESTER_NOT_FOUND`·`NOT_ROSTER_MEMBER`, 409 `ROSTER_MEMBER_NOT_APPLICABLE`. 연결 해제(`DELETE`)는 연결이 없어도 204다.
- **증빙 형식:** png·jpg(jpeg)·webp·pdf, 확장자와 MIME 짝이 맞아야 하고 1B~10MB다. GIF·SVG·HEIC는 받지 않는다. 선택 창 accept는 `image/png,image/jpeg,image/webp,application/pdf`이고, 선택 뒤 확장자·MIME·크기를 다시 본다. 기록당 최대 5개.
- 장부 `balance`는 서버가 계산하지 않고 **은행 거래 후 잔액**(`bank_balance`)을 그대로 쓴다.

### 거래내역 가져오기

- 미리보기(`POST …/imports/preview`)는 multipart(파트 이름 `file`, `.xlsx`, 1MB 이하)다. `apiFetch`는 본문이 `FormData`면 `Content-Type`을 붙이지 않아 브라우저가 `multipart/form-data; boundary=…`를 넣는다.
- 미리보기 거래마다 `bankBalance`(은행 거래 후 잔액)가 온다. FE는 이 값을 커밋 요청에 그대로 돌려보낸다. 서버는 `(occurredAt, type, amount, bankBalance, counterparty)`로 `rowKey`를 다시 계산해 다르면 400 `IMPORT_ROW_KEY_MISMATCH`다.
- **미리보기의 모든 거래를 반영한다**(1~5,000건). 거래 선택 체크박스는 없다. 거래를 빼면 은행 잔액 흐름에 구멍이 생긴다. 새 거래가 0건이면 커밋을 부르지 않는다.
- 증빙 없는 출금은 저장을 막지 않고 경고만 띄운다. 반영 뒤 장부 상세(PATCH `evidenceIds`)에서 붙인다.

## 인명부 Slack ID (main #71에 반영됨)

- 인명부 Slack ID 열·수정 입력과 `PATCH /v1/admin/members/{memberId}/slack-id`는 main에 실제 API로 들어가 있다.
  예전 FE 래퍼 mock(`slack-id-mock.ts`)은 쓰지 않는다.
- 입력 형식은 `src/lib/slack-id.ts`가 원본이다: U 또는 W로 시작하는 영문 대문자·숫자 9~20자(`^[UW][A-Z0-9]{8,19}$`).

## Slack 알림

- **수신자는 인명부에 저장된 slackId**로 정한다. FE는 `memberId`만 보내고, 서버가 `member.slack_id`로 바꿔 보낸다.
  - 학기 회비 응답(`MemberDuesResponse.slackId`)에 인명부 값이 들어 있다. 알림 모달의 "Slack 계정 확인"은 이 값이 비어 있는 대상자 수를 보여 준다.
- 누락이 있으면 알림 모달에 **"Slack ID 입력"** 버튼이 생긴다. 누르면 누락 회원 표가 나온다.
  - **직접 입력:** 저장하면 `PATCH /v1/admin/members/{id}/slack-id`로 인명부에 반영된다. 행마다 따로 저장되며, 409(다른 회원이 쓰는 ID 등)로 실패한 행은 서버 메시지를 그 행에 보이고 모달을 닫지 않는다. 성공한 행은 저장된 것으로 둔다.
  - **자동 채우기:** `POST /v1/admin/members/slack-ids/lookup`을 부른다. 서버가 회원 이메일로 Slack을 조회하고(`findSlackIdByEmail`), 찾은 값을 **바로** `member.slack_id`에 저장한 뒤 결과를 돌려준다. 결과는 `status`별로 표시한다.
    - `SAVED`: 입력칸을 채운다 / `NOT_FOUND`: "Slack에서 찾지 못했습니다." / `DUPLICATED`: "이미 {ownerName} 회원이 사용 중입니다."(칸은 비워 둔다) / `FAILED`: "Slack 조회에 실패했습니다."

  - 저장하고 닫으면 회비·인명부 캐시를 다시 받는다. 그래서 알림 모달의 상태가 곧바로 갱신된다.
- **BE 변경 범위**
  - `SlackClient.findProfileImageUrlByEmail()`은 사진 URL만 돌려주고 응답의 `user.id`는 버린다. 같은 호출을 쓰는 `findSlackIdByEmail(email)`을 추가한다.
  - 위 lookup 엔드포인트와 인명부 slackId 컬럼·API를 만든다(앞 절 참고).
  - 메시지 발송은 `chat.postMessage`로 한다. 지금 봇 토큰에 발송 scope가 있는지는 확인이 필요하다. 이 문서는 아직 Slack 문서와 대조하지 않았다.
- **발송 스위치는 회비·장부와 따로 둔다:** `NEXT_PUBLIC_DUES_NOTIFICATION_API`(기본 mock). 회비·장부를 live로 바꿔도 알림 발송은 mock으로 남는다. 실제 발송은 이 값을 `live`로 바꿀 때만 나간다.
- `{담당자 멘션}` 토큰은 FE가 치환하지 않고 그대로 보낸다. 서버가 로그인한 관리자의 slackId로 `<@U…>`를 만든다.

## 미결 질문 (BE와 합의 필요)

1. **자동 채우기의 Slack 호출량**: 누락 회원 수만큼 `users.lookupByEmail`을 부른다. Slack rate limit(수치는 확인 필요) 안에 드는지 확인해야 한다.
2. ~~학기 명단 기준~~ → 확정: 학기를 만들 때 `is_active && status ≠ WITHDRAWN`인 회원을 넣고, `applicable = dues_required`다. 생성 뒤 가입·정정은 "명단 관리"로 한다(지난 학기 포함). mock은 생성 시점의 전체 회원을 대상으로 넣는다.
3. ~~월 배분 규칙~~ → 확정: 순납부액을 앞 달부터 월 회비 단위로 채운다(표시용). 복잡한 배분은 하지 않는다.
4. ~~월 회비 금액~~ → 확정: 생성 모달에서 입력받는다(기본값 직전 학기 값, 없으면 10,000원, 1 이상 1,000,000 이하의 정수).
5. ~~면제 사유 목록~~ → 확정: 별도 테이블로 두고 시드 15개로 시작한다. 면제를 저장할 때 새 사유를 함께 등록한다(이미 있으면 그대로). 목록은 시드 다음 등록 순이다.
6. **면제 삭제**: 화면에 삭제 기능이 없어서 API도 넣지 않았다.
7. ~~신한 .xlsx 파싱 위치~~ → 확정: 서버에서 파싱한다. 거래 지문(`rowKey`)으로 중복을 막으려면 서버가 원본을 봐야 하기 때문이다. 미리보기 단계에서 회비 대상을 추천하는 값(`suggestedMemberId`)은 화면에 아직 쓰이지 않는다.
8. ~~업로드 multipart~~ → 해결: `client.ts`가 `FormData` 본문에는 `Content-Type`을 붙이지 않는다(위 "거래내역 가져오기").
