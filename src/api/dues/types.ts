import type { Track } from '@/api/auth/types';

/**
 * 회비 API 계약 초안(DTO). 화면은 components/dues/types의 뷰 모델을 쓰고, 변환은 ./mappers가 맡는다.
 * 집계(상태·부과액·미납액·반환 필요액)는 지금 mock이 흉내 내는 대로 **서버가** 계산해 내려준다.
 *
 * 학기 ID는 "2026-2"처럼 `{년도}-{학기}` 자연키다. 1학기는 3~8월, 2학기는 9~다음 해 2월(6개월).
 * 월 키는 "2026-09" 형식이다.
 */

export type SemesterId = string;
export type YearMonth = string;

export type MonthDuesStatus = 'PAID' | 'EXEMPT' | 'UNPAID' | 'NOT_APPLICABLE';

export type SemesterDuesStatus = 'PAID' | 'PARTIAL' | 'UNPAID' | 'EXEMPT' | 'OVERPAID';

export type RefundStatus = 'NONE' | 'NEEDED' | 'PARTIAL' | 'COMPLETED';

/** 반환이 필요한 이유 — 초과 납부 / 탈퇴 기간 / 전액 면제 회원 오입금. */
export type RefundReason = 'OVERPAID' | 'WITHDRAWAL_PERIOD' | 'EXEMPT_MEMBER_DEPOSIT';

// ---------- 학기 ----------

/** GET /v1/admin/dues/semesters 한 줄. 최신 학기가 앞에 온다. */
export interface SemesterDuesSummaryResponse {
  id: SemesterId;
  year: number;
  term: 1 | 2;
  /** 한 달 회비. 부과액 = 면제 아닌 월 수 × monthlyAmount. */
  monthlyAmount: number;
  totalMembers: number;
  exemptMembers: number;
  targetMembers: number;
  completedMembers: number;
  unpaidMembers: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  /** 미납·부분 납부·반환 필요 회원이 한 명이라도 있으면 true. */
  needsReview: boolean;
}

export interface SemesterDuesListResponse {
  semesters: SemesterDuesSummaryResponse[];
}

/**
 * GET /v1/admin/dues/semesters/creatable — 회비 생성 가능 여부.
 * 서버가 오늘 날짜로 현재 학기를 정하고(1학기 3~8월, 2학기 9~다음 해 2월), 만들 수 있는 학기는
 * **현재 학기의 바로 다음 학기까지**로 제한한다. 만들 학기는 가장 최근 학기의 다음 학기다.
 */
export interface SemesterCreatableResponse {
  currentSemesterId: SemesterId;
  /** 다음에 만들 학기. creatable이 false여도 무엇이 막혔는지 보여 줄 수 있게 내려준다. */
  nextSemester: { year: number; term: 1 | 2 };
  creatable: boolean;
}

/** POST /v1/admin/dues/semesters — 가장 최근 학기의 다음 학기를 만든다. 생성 시점의 회비 대상 회원을 명단으로 스냅샷한다. */
export interface SemesterCreateRequest {
  year: number;
  term: 1 | 2;
  monthlyAmount: number;
}

// ---------- 학기별 회원 회비 ----------

export interface MonthExemption {
  id: number;
  reason: string;
  startMonth: YearMonth;
  endMonth: YearMonth | null;
}

export interface MonthDuesResponse {
  month: YearMonth;
  status: MonthDuesStatus;
  /** status가 EXEMPT일 때만. "멘토 2024.09~계속" 같은 문구는 FE가 만든다. */
  exemption: MonthExemption | null;
  /** 납부 배분 메모 — "70,000원 입금 중 10,000원 배분" 같은 서버 생성 문구. */
  note: string | null;
}

/** GET /v1/admin/dues/semesters/{semesterId}/members 한 줄. */
export interface MemberDuesResponse {
  memberId: number;
  name: string;
  studentNumber: string;
  track: Track;
  /** 인명부 member.slack_id. 비어 있으면 Slack 알림을 보낼 수 없다. */
  slackId: string | null;
  months: MonthDuesResponse[];
  status: SemesterDuesStatus;
  /** 이 학기 납부 비대상이면 null. */
  assessedAmount: number | null;
  /** 반환을 뺀 순납부액. */
  paidAmount: number | null;
  unpaidAmount: number | null;
  /** 아직 반환하지 않은 초과분. 0이면 반환 필요 없음. */
  excessAmount: number;
  refundStatus: RefundStatus;
  refundReason: RefundReason | null;
  refundedAmount: number;
}

export interface SemesterDuesDetailResponse {
  semester: SemesterDuesSummaryResponse;
  members: MemberDuesResponse[];
}

// ---------- 장부 ↔ 회비 연결 ----------

/** POST /v1/admin/dues/semesters/{semesterId}/links — 입출금 내역 연결 모달의 일괄 저장. */
export interface DuesLinkBulkRequest {
  links: { entryId: number; memberId: number }[];
}

export interface DuesLinkBulkResponse {
  linkedCount: number;
}

// ---------- 면제 ----------

export interface ExemptionResponse {
  id: number;
  memberId: number;
  reason: string;
  note: string;
  startMonth: YearMonth;
  /** null이면 종료 없이 계속(탈퇴·졸업·멘토 등). */
  endMonth: YearMonth | null;
}

/** POST /v1/admin/dues/exemptions, PUT /v1/admin/dues/exemptions/{id} 공통 바디. */
export interface ExemptionUpsertRequest {
  memberId: number;
  reason: string;
  note: string;
  startMonth: YearMonth;
  endMonth: YearMonth | null;
}

/** GET /v1/admin/dues/exemptions */
export interface ExemptionListResponse {
  exemptions: ExemptionResponse[];
}

/** GET /v1/admin/dues/exemption-reasons — 기본 사유 + 지금까지 쓰인 사유. 새 사유는 면제 저장 때 함께 등록된다. */
export interface ExemptionReasonListResponse {
  reasons: string[];
}

/**
 * POST /v1/admin/dues/semesters/{semesterId}/exemption-preview — 저장 전 "적용하면 이렇게 바뀝니다" 비교.
 * 집계를 서버가 하므로 before/after도 서버가 계산한다. editingId가 있으면 그 면제를 바꾼 경우다.
 */
export interface ExemptionPreviewRequest extends ExemptionUpsertRequest {
  editingId: number | null;
}

export interface ExemptionPreviewResponse {
  before: MemberDuesResponse;
  after: MemberDuesResponse;
}

// ---------- Slack 알림 ----------

/**
 * Slack 알림은 인명부에 저장된 slackId로 보낸다. 비어 있는 회원은 "Slack ID 입력" 모달에서
 * 직접 넣거나(PATCH /v1/admin/members/{id}/slack-id) 이메일로 자동 조회해 채운다.
 */
export type DuesNotificationType = 'PAYMENT' | 'UNPAID';

/**
 * POST /v1/admin/members/slack-ids/lookup — 회원 이메일로 Slack users.lookupByEmail을 호출한다
 * (BE SlackClient.findSlackIdByEmail). 찾은 값은 서버가 member.slack_id에 바로 저장한다.
 */
export interface SlackIdLookupRequest {
  memberIds: number[];
}

export interface SlackIdLookupResponse {
  /** slackId가 null이면 Slack에서 그 이메일의 계정을 찾지 못한 것이다. */
  results: { memberId: number; slackId: string | null }[];
}

/**
 * POST /v1/admin/dues/semesters/{semesterId}/notifications
 * 본문은 FE가 템플릿으로 만들되 {담당자 멘션}은 그대로 두고 보낸다 — 서버가 로그인한 관리자의
 * Slack ID로 바꾼다. 수신자도 memberId로만 보내 서버가 인명부 slackId로 해석한다.
 */
export interface DuesNotificationRequest {
  type: DuesNotificationType;
  messages: { memberId: number; message: string }[];
}

export interface DuesNotificationResponse {
  sentCount: number;
  failed: { memberId: number; reason: 'SLACK_ID_MISSING' | 'SLACK_ERROR' }[];
}
