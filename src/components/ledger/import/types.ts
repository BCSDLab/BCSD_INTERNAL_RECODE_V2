import type { Evidence, LedgerCategory } from '@/components/ledger/types';

export interface ImportTransaction {
  id: string;
  occurredAt: string;
  type: 'deposit' | 'withdrawal';
  counterparty: string;
  amount: number;
  /** 은행 거래 후 잔액. 미리보기 값을 커밋에 그대로 돌려보낸다. */
  bankBalance: number;
  category: Extract<LedgerCategory, '회비' | '기타'>;
  duesMatchId: string | null;
  note: string;
  evidences: Evidence[];
}

export type ImportStep = 'upload' | 'review' | 'evidence';
