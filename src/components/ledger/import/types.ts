import type { Evidence, LedgerCategory } from '@/components/ledger/types';

export interface ImportDuesMatch {
  memberId: string;
  memberName: string;
  studentNumber: string;
  track: string;
  semester: string;
  requiredAmount: number;
  refundReason?: string;
  refundAmount?: number;
}

export interface ImportTransaction {
  id: string;
  occurredAt: string;
  type: 'deposit' | 'withdrawal';
  counterparty: string;
  amount: number;
  selected: boolean;
  category: Extract<LedgerCategory, '회비' | '회비 반환' | '기타'>;
  duesMatchId: string | null;
  note: string;
  evidences: Evidence[];
}

export type ImportStep = 'upload' | 'review' | 'evidence';
