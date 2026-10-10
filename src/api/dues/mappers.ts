import type { ExemptionDraft, ExemptionPeriod } from '@/components/dues/exemptions';
import type { MemberDues, MonthDues, SemesterDuesSummary } from '@/components/dues/types';
import { TRACK_LABELS } from '@/lib/member-labels';
import type {
  ExemptionResponse,
  ExemptionUpsertRequest,
  MemberDuesResponse,
  MonthDuesResponse,
  MonthDuesStatus,
  RefundReason,
  RefundStatus,
  SemesterDuesStatus,
  SemesterDuesSummaryResponse,
  SemesterId,
} from './types';

/**
 * DTO → 화면 뷰 모델 변환(iOS로 치면 DTO → Entity 매핑). 화면 컴포넌트는 예전 mock 모양 그대로
 * 문자열 ID·소문자 상태·한글 라벨을 쓰므로, API 모양이 바뀌어도 이 파일만 고치면 된다.
 */

export const REFUND_REASON_LABELS: Record<RefundReason, string> = {
  OVERPAID: '초과 납부',
  WITHDRAWAL_PERIOD: '탈퇴 기간',
  EXEMPT_MEMBER_DEPOSIT: '전액 면제 회원 오입금',
};

const MONTH_STATUS: Record<MonthDuesStatus, MonthDues['status']> = {
  PAID: 'paid',
  EXEMPT: 'exempt',
  UNPAID: 'unpaid',
  NOT_APPLICABLE: 'not-applicable',
};

const SEMESTER_STATUS: Record<SemesterDuesStatus, MemberDues['status']> = {
  PAID: 'paid',
  PARTIAL: 'partial',
  UNPAID: 'unpaid',
  EXEMPT: 'exempt',
  OVERPAID: 'overpaid',
};

const REFUND_STATUS: Record<RefundStatus, MemberDues['refundStatus']> = {
  NONE: 'none',
  NEEDED: 'needed',
  PARTIAL: 'partial',
  COMPLETED: 'completed',
};

export function semesterLabel(semesterId: SemesterId) {
  const [year, term] = semesterId.split('-');
  return `${year}년 ${term}학기`;
}

export function toSemesterSummary(dto: SemesterDuesSummaryResponse): SemesterDuesSummary {
  return {
    id: dto.id,
    shortLabel: `${String(dto.year).slice(-2)}년 ${dto.term}학기`,
    title: `${dto.year}년 ${dto.term}학기 회비`,
    totalMembers: dto.totalMembers,
    exemptMembers: dto.exemptMembers,
    targetMembers: dto.targetMembers,
    completedMembers: dto.completedMembers,
    unpaidMembers: dto.unpaidMembers,
    totalAmount: dto.totalAmount,
    paidAmount: dto.paidAmount,
    unpaidAmount: dto.unpaidAmount,
    needsReview: dto.needsReview,
  };
}

function monthDescription(dto: MonthDuesResponse) {
  if (dto.status === 'EXEMPT') {
    const exemption = dto.exemption;
    if (!exemption) return dto.note ?? '면제';
    if (dto.month !== exemption.startMonth) return exemption.reason;
    const period = `${exemption.startMonth.replace('-', '.')}~${exemption.endMonth?.replace('-', '.') ?? '계속'}`;
    return `${exemption.reason} ${period}`;
  }
  if (dto.status === 'NOT_APPLICABLE') return '납부 비대상';
  return dto.note ?? (dto.status === 'PAID' ? '완료' : '연결된 기록 없음');
}

export function toMemberDues(dto: MemberDuesResponse): MemberDues {
  return {
    id: String(dto.memberId),
    name: dto.name,
    studentNumber: dto.studentNumber,
    track: TRACK_LABELS[dto.track],
    slackId: dto.slackId,
    months: dto.months.map((month) => ({ status: MONTH_STATUS[month.status], description: monthDescription(month) })),
    status: SEMESTER_STATUS[dto.status],
    assessedAmount: dto.assessedAmount,
    paidAmount: dto.paidAmount,
    unpaidAmount: dto.unpaidAmount,
    excessAmount: dto.excessAmount > 0 ? dto.excessAmount : undefined,
    refundStatus: REFUND_STATUS[dto.refundStatus],
    refundAmount: dto.excessAmount > 0 ? dto.excessAmount : undefined,
    refundReason: dto.refundReason ? REFUND_REASON_LABELS[dto.refundReason] : undefined,
    refundedAmount: dto.refundedAmount > 0 ? dto.refundedAmount : undefined,
  };
}

export function toExemption(dto: ExemptionResponse): ExemptionPeriod {
  return {
    id: String(dto.id),
    memberId: String(dto.memberId),
    reason: dto.reason,
    note: dto.note,
    startMonth: dto.startMonth,
    endMonth: dto.endMonth,
  };
}

export function toExemptionRequest(draft: ExemptionDraft): ExemptionUpsertRequest {
  return {
    memberId: Number(draft.memberId),
    reason: draft.reason,
    note: draft.note,
    startMonth: draft.startMonth,
    endMonth: draft.endMonth,
  };
}
