export type EntryType = 'deposit' | 'withdrawal';

export type LedgerCategory = '회비' | '행사' | '운영비' | '기타';

export type LinkStatus = 'confirmed' | 'pending' | 'none';

export interface Evidence {
  id: string;
  name: string;
  width?: number;
  height?: number;
  url?: string;
}

export const MAX_EVIDENCE_COUNT = 5;

export interface DuesLink {
  memberId: string;
  memberName: string;
  studentNumber: string;
  track: string;
  semesterId: string;
  /** "2026년 2학기" — 회비 학기 제목에서 " 회비"를 뗀 값과 같다. */
  semester: string;
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

export const LEDGER_CATEGORIES: LedgerCategory[] = ['회비', '행사', '운영비', '기타'];

export const EMPTY_LEDGER_FILTERS: LedgerFilters = {
  from: '',
  to: '',
  types: [],
  categories: [],
  linkStatuses: [],
  counterparties: [],
  descriptions: [],
  amounts: [],
  minimumAmount: '',
  maximumAmount: '',
};
