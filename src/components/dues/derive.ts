import type { ExemptionPeriod } from '@/components/dues/exemptions';
import { monthIsInExemption, WITHDRAWAL_EXEMPTION_REASON } from '@/components/dues/exemptions';
import type { MemberDues, RefundStatus, SemesterDuesStatus, SemesterDuesSummary } from '@/components/dues/types';
import type { LedgerEntry } from '@/components/ledger/types';

export const LIVE_SEMESTER_ID = '2026-2';
export const LIVE_SEMESTER_LABEL = '2026년 2학기';

function sumConfirmed(entries: LedgerEntry[], memberId: string, match: (entry: LedgerEntry) => boolean) {
  return entries
    .filter(
      (entry) =>
        match(entry) &&
        entry.linkStatus === 'confirmed' &&
        entry.duesLink?.memberId === memberId &&
        entry.duesLink?.semester === LIVE_SEMESTER_LABEL,
    )
    .reduce((total, entry) => total + entry.amount, 0);
}

function deriveMemberDues(member: MemberDues, entries: LedgerEntry[], exemptions: ExemptionPeriod[]): MemberDues {
  if (member.assessedAmount === null) return member;

  const semesterMonths = ['2026-09', '2026-10', '2026-11', '2026-12', '2027-01', '2027-02'];
  const memberExemptions = exemptions.filter((exemption) => exemption.memberId === member.id);
  const months = semesterMonths.map((month, index) => {
    const exemption = memberExemptions.find((item) => monthIsInExemption(month, item));
    if (exemption) {
      const period = `${exemption.startMonth.replace('-', '.')}~${exemption.endMonth?.replace('-', '.') ?? '계속'}`;
      return {
        status: 'exempt' as const,
        description: month === exemption.startMonth ? `${exemption.reason} ${period}` : exemption.reason,
      };
    }

    const original = member.months[index];
    return original.status === 'exempt' ? { status: 'unpaid' as const, description: '연결된 기록 없음' } : original;
  });
  const assessedAmount = months.filter((month) => month.status !== 'exempt').length * 10000;
  const grossPaid = sumConfirmed(entries, member.id, (entry) => entry.type === 'deposit' && entry.category === '회비');
  const refundedAmount = sumConfirmed(
    entries,
    member.id,
    (entry) => entry.type === 'withdrawal' && entry.category === '회비 반환',
  );

  const grossExcess = Math.max(0, grossPaid - assessedAmount);
  const remainingExcess = Math.max(0, grossExcess - refundedAmount);
  const netPaid = Math.max(0, grossPaid - refundedAmount);

  const status: SemesterDuesStatus =
    remainingExcess > 0
      ? 'overpaid'
      : assessedAmount === 0
        ? 'exempt'
        : netPaid <= 0
          ? 'unpaid'
          : netPaid < assessedAmount
            ? 'partial'
            : 'paid';

  const refundStatus: RefundStatus =
    grossExcess === 0
      ? refundedAmount > 0
        ? 'completed'
        : 'none'
      : refundedAmount === 0
        ? 'needed'
        : refundedAmount < grossExcess
          ? 'partial'
          : 'completed';

  const hasWithdrawalExemption = memberExemptions.some(
    (exemption) => exemption.memberId === member.id && exemption.reason === WITHDRAWAL_EXEMPTION_REASON,
  );

  return {
    ...member,
    months,
    status,
    assessedAmount,
    paidAmount: netPaid,
    unpaidAmount: Math.max(0, assessedAmount - netPaid),
    excessAmount: remainingExcess > 0 ? remainingExcess : undefined,
    refundStatus,
    refundAmount: remainingExcess > 0 ? remainingExcess : undefined,
    refundReason:
      remainingExcess > 0
        ? hasWithdrawalExemption
          ? '탈퇴 기간'
          : '초과 납부'
        : refundStatus === 'completed'
          ? member.refundReason
          : undefined,
  };
}

export function deriveSemesterMembers(
  baseMembers: MemberDues[],
  entries: LedgerEntry[],
  exemptions: ExemptionPeriod[],
): MemberDues[] {
  return baseMembers.map((member) => deriveMemberDues(member, entries, exemptions));
}

export function deriveSemesterSummary(base: SemesterDuesSummary, members: MemberDues[]): SemesterDuesSummary {
  const totalMembers = members.length;
  const exemptMembers = members.filter((member) => member.status === 'exempt').length;
  const targetMembers = totalMembers - exemptMembers;
  const completedMembers = members.filter((member) => member.status === 'paid' || member.status === 'overpaid').length;
  const unpaidMembers = members.filter((member) => member.status === 'unpaid' || member.status === 'partial').length;
  const totalAmount = members.reduce((total, member) => total + (member.assessedAmount ?? 0), 0);
  const paidAmount = members.reduce(
    (total, member) => total + Math.min(member.paidAmount ?? 0, member.assessedAmount ?? 0),
    0,
  );
  const unpaidAmount = members.reduce((total, member) => total + (member.unpaidAmount ?? 0), 0);
  const needsReview = members.some(
    (member) =>
      member.refundStatus === 'needed' ||
      member.refundStatus === 'partial' ||
      member.status === 'unpaid' ||
      member.status === 'partial',
  );

  return {
    ...base,
    totalMembers,
    exemptMembers,
    targetMembers,
    completedMembers,
    unpaidMembers,
    totalAmount,
    paidAmount,
    unpaidAmount,
    needsReview,
  };
}
