export type MonthDuesStatus = 'paid' | 'exempt' | 'unpaid' | 'not-applicable';

export type SemesterDuesStatus = 'paid' | 'unpaid' | 'exempt' | 'overpaid';

export interface MonthDues {
  status: MonthDuesStatus;
  description: string;
}

export interface MemberDues {
  id: string;
  name: string;
  studentNumber: string;
  track: string;
  /** 인명부 Slack ID. 비어 있으면 Slack 알림을 보낼 수 없다. */
  slackId: string | null;
  months: MonthDues[];
  status: SemesterDuesStatus;
  assessedAmount: number | null;
  paidAmount: number | null;
  unpaidAmount: number | null;
  /** 초과납부액(차이가 양수일 때만). */
  excessAmount?: number;
}

export interface SemesterDuesSummary {
  id: string;
  shortLabel: string;
  title: string;
  /** 한 달 회비(원). */
  monthlyAmount: number;
  totalMembers: number;
  exemptMembers: number;
  targetMembers: number;
  completedMembers: number;
  unpaidMembers: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  needsReview: boolean;
}
