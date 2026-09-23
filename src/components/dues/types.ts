export type MonthDuesStatus = 'paid' | 'exempt' | 'unpaid' | 'not-applicable';

export type SemesterDuesStatus = 'paid' | 'partial' | 'unpaid' | 'exempt' | 'overpaid';

export type RefundStatus = 'none' | 'needed' | 'partial' | 'completed';

export interface MonthDues {
  status: MonthDuesStatus;
  description: string;
}

export interface MemberDues {
  id: string;
  name: string;
  studentNumber: string;
  track: string;
  months: MonthDues[];
  status: SemesterDuesStatus;
  assessedAmount: number | null;
  paidAmount: number | null;
  unpaidAmount: number | null;
  excessAmount?: number;
  refundStatus: RefundStatus;
  refundAmount?: number;
  refundReason?: string;
  refundedAmount?: number;
}

export interface SemesterDuesSummary {
  id: string;
  shortLabel: string;
  title: string;
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
