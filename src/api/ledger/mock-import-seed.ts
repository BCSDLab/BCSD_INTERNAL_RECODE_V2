import type { ImportTransaction } from '@/components/ledger/import/types';

/** mock 전용 — 신한 .xlsx를 서버가 파싱했다고 치고 돌려줄 거래. */

export function createMockImportTransactions(): ImportTransaction[] {
  return [
    {
      id: 'import-001',
      occurredAt: '2026-11-16T09:10',
      type: 'deposit',
      counterparty: '김민준',
      amount: 40000,
      selected: true,
      category: '회비',
      duesMatchId: 'member-minjun',
      note: '',
      evidences: [],
    },
    {
      id: 'import-002',
      occurredAt: '2026-11-17T18:22',
      type: 'deposit',
      counterparty: '이서연',
      amount: 10000,
      selected: true,
      category: '회비',
      duesMatchId: 'member-seoyeon',
      note: '',
      evidences: [],
    },
    {
      id: 'import-003',
      occurredAt: '2026-11-18T08:40',
      type: 'withdrawal',
      counterparty: '박지안',
      amount: 15000,
      selected: true,
      category: '기타',
      duesMatchId: null,
      note: '',
      evidences: [],
    },
    {
      id: 'import-004',
      occurredAt: '2026-11-18T08:41',
      type: 'withdrawal',
      counterparty: '한소미',
      amount: 10000,
      selected: true,
      category: '회비 반환',
      duesMatchId: 'member-somi',
      note: '',
      evidences: [],
    },
  ];
}
