export type EntryType = 'deposit' | 'withdrawal';

export type LedgerCategory = '회비' | '회비 반환' | '행사' | '운영비' | '기타';

export type LinkStatus = 'confirmed' | 'pending' | 'none';

export interface Evidence {
  id: string;
  name: string;
  width?: number;
  height?: number;
  dataUrl?: string;
}

export const MAX_EVIDENCE_COUNT = 5;

export interface DuesLink {
  memberId: string;
  memberName: string;
  studentNumber: string;
  track: string;
  semester: string;
  requiredAmount: number;
  refundReason?: string;
  refundAmount?: number;
}

export interface LedgerEntry {
  id: string;
  occurredAt: string;
  type: EntryType;
  category: LedgerCategory;
  counterparty: string;
  description: string;
  note: string;
  amount: number;
  balance: number;
  source: string;
  linkStatus: LinkStatus;
  duesLink?: DuesLink;
  evidences: Evidence[];
}

export interface LedgerFilters {
  from: string;
  to: string;
  types: EntryType[];
  categories: LedgerCategory[];
  linkStatuses: LinkStatus[];
  counterparties: string[];
  descriptions: string[];
  amounts: number[];
  minimumAmount: string;
  maximumAmount: string;
}

export type LedgerScreen = { name: 'list' } | { name: 'detail'; entryId: string };

export const LEDGER_CATEGORIES: LedgerCategory[] = ['회비', '회비 반환', '행사', '운영비', '기타'];
