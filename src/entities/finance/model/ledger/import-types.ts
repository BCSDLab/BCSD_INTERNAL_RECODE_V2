import { type Evidence, type LedgerCategory } from './types';

export interface ImportTransaction {
  id: string;
  /** 미리보기 응답 원본(yyyy-MM-ddTHH:mm:ss). 화면은 분까지만 보이고, 커밋에는 그대로 돌려보낸다. */
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
