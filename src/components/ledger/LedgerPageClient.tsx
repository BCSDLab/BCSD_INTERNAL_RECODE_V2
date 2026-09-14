'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { EvidenceViewer } from '@/components/ledger/EvidenceViewer';
import { INITIAL_LEDGER_ENTRIES, EMPTY_LEDGER_FILTERS } from '@/components/ledger/initial-data';
import { LedgerDetailView } from '@/components/ledger/LedgerDetailView';
import { LedgerListView } from '@/components/ledger/LedgerListView';
import { Toast } from '@/components/ledger/LedgerUi';
import { IMPORT_DUES_MATCHES } from '@/components/ledger/import/initial-data';
import { TransactionImportFlow } from '@/components/ledger/import/TransactionImportFlow';
import type { ImportTransaction } from '@/components/ledger/import/types';
import type { LedgerEntry, LedgerFilters, LedgerScreen } from '@/components/ledger/types';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { isCompleteLedgerDate } from '@/components/ledger/utils';

type EvidenceState = { entryId: string; evidenceId: string } | null;

function freshInitialEntries() {
  return INITIAL_LEDGER_ENTRIES.map((entry) => ({
    ...entry,
    duesLink: entry.duesLink ? { ...entry.duesLink } : undefined,
    evidences: entry.evidences.map((evidence) => ({ ...evidence })),
  }));
}

export function LedgerPageClient() {
  const [entries, setEntries] = useState<LedgerEntry[]>(freshInitialEntries);
  const [filters, setFilters] = useState<LedgerFilters>(EMPTY_LEDGER_FILTERS);
  const [screen, setScreen] = useState<LedgerScreen>({ name: 'list' });
  const [evidenceState, setEvidenceState] = useState<EvidenceState>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  function flash(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2400);
  }

  const filteredEntries = useMemo(() => {
    const enteredMinimumAmount = filters.minimumAmount === '' ? null : Number(filters.minimumAmount);
    const enteredMaximumAmount = filters.maximumAmount === '' ? null : Number(filters.maximumAmount);
    const isAmountRangeInvalid =
      enteredMinimumAmount !== null && enteredMaximumAmount !== null && enteredMaximumAmount <= enteredMinimumAmount;
    const minimumAmount = isAmountRangeInvalid ? null : enteredMinimumAmount;
    const maximumAmount = isAmountRangeInvalid ? null : enteredMaximumAmount;
    const from = isCompleteLedgerDate(filters.from) ? filters.from : '';
    const to = isCompleteLedgerDate(filters.to) ? filters.to : '';

    return entries.filter((entry) => {
      const date = entry.occurredAt.slice(0, 10);

      return (
        (!from || date >= from) &&
        (!to || date <= to) &&
        (filters.types.length === 0 || filters.types.includes(entry.type)) &&
        (filters.categories.length === 0 || filters.categories.includes(entry.category)) &&
        (filters.linkStatuses.length === 0 || filters.linkStatuses.includes(entry.linkStatus)) &&
        (filters.counterparties.length === 0 || filters.counterparties.includes(entry.counterparty)) &&
        (filters.descriptions.length === 0 || filters.descriptions.includes(entry.description)) &&
        (filters.amounts.length === 0 || filters.amounts.includes(entry.amount)) &&
        (minimumAmount === null || entry.amount >= minimumAmount) &&
        (maximumAmount === null || entry.amount <= maximumAmount)
      );
    });
  }, [entries, filters]);

  const detailEntry = screen.name === 'detail' ? entries.find((entry) => entry.id === screen.entryId) : undefined;
  const evidenceEntry = evidenceState ? entries.find((entry) => entry.id === evidenceState.entryId) : undefined;
  const evidence = evidenceEntry?.evidences.find((item) => item.id === evidenceState?.evidenceId);

  function updateEntry(entryId: string, update: (entry: LedgerEntry) => LedgerEntry) {
    setEntries((current) => current.map((entry) => (entry.id === entryId ? update(entry) : entry)));
  }

  function saveEntry(nextEntry: LedgerEntry) {
    setEntries((current) => current.map((entry) => (entry.id === nextEntry.id ? nextEntry : entry)));
    setScreen({ name: 'detail', entryId: nextEntry.id });
    flash('장부 기록을 수정했습니다');
  }

  function saveImportedTransactions(transactions: ImportTransaction[], fileName: string) {
    setEntries((current) => {
      const newTransactions = transactions.filter(
        (transaction) => !current.some((entry) => entry.id === `imported-${transaction.id}`),
      );
      if (newTransactions.length === 0) return current;

      const latestEntry = [...current].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0];
      let balance = latestEntry?.balance ?? 0;
      const importedEntries: LedgerEntry[] = newTransactions.map((transaction) => {
        balance += transaction.type === 'deposit' ? transaction.amount : -transaction.amount;
        const match = IMPORT_DUES_MATCHES.find((option) => option.memberId === transaction.duesMatchId);

        return {
          id: `imported-${transaction.id}`,
          occurredAt: transaction.occurredAt,
          type: transaction.type,
          category: transaction.category,
          counterparty: transaction.counterparty,
          description:
            transaction.note ||
            (transaction.category === '회비'
              ? '2026년 2학기 회비'
              : transaction.category === '회비 반환'
                ? '2026년 2학기 회비 반환'
                : '가져온 거래내역'),
          note: transaction.note,
          amount: transaction.amount,
          balance,
          source: fileName,
          linkStatus: match ? 'confirmed' : 'none',
          duesLink: match ? { ...match } : undefined,
          evidences: transaction.evidences.map((importedEvidence) => ({ ...importedEvidence })),
        };
      });

      return [...current, ...importedEntries];
    });
  }

  return (
    <div className="bg-bg text-text min-h-screen">
      <header className="border-line bg-panel/90 sticky top-0 z-30 flex h-16 items-center border-b px-8 backdrop-blur-[14px]">
        <nav aria-label="장부 및 회비 메뉴" className="flex h-full items-center gap-7">
          <span
            aria-current="page"
            className="border-primary flex h-full items-center border-b-2 text-[13px] font-bold"
          >
            장부
          </span>
          <Link
            href="/ledger/dues"
            className="text-muted hover:text-primary-text text-[13px] font-medium transition-colors"
          >
            회비
          </Link>
          <span aria-disabled="true" className="text-faint text-[13px] font-medium">
            면제 사유
          </span>
        </nav>
        <div className="ml-auto flex items-center gap-2.5">
          <span className="border-primary-line bg-primary-soft text-primary-text rounded-full border px-3 py-1.5 text-[11.5px] font-semibold">
            관리자
          </span>
          <ThemeToggle />
        </div>
      </header>

      <LedgerListView
        allEntries={entries}
        entries={filteredEntries}
        filters={filters}
        onFiltersChange={setFilters}
        onResetFilters={() => setFilters(EMPTY_LEDGER_FILTERS)}
        onOpenEntry={(entryId) => setScreen({ name: 'detail', entryId })}
        onOpenImport={() => setIsImportOpen(true)}
      />

      {detailEntry && (
        <LedgerDetailView
          entry={detailEntry}
          allEntries={entries}
          onClose={() => setScreen({ name: 'list' })}
          onSave={saveEntry}
          onOpenEvidence={(evidenceId) => setEvidenceState({ entryId: detailEntry.id, evidenceId })}
        />
      )}

      {evidenceState && evidenceEntry && evidence && (
        <EvidenceViewer
          entry={evidenceEntry}
          evidence={evidence}
          onClose={() => setEvidenceState(null)}
          onReplace={(replacement) => {
            updateEntry(evidenceEntry.id, (entry) => ({
              ...entry,
              evidences: entry.evidences.map((item) => (item.id === evidence.id ? replacement : item)),
            }));
            flash('증빙 파일을 교체했습니다.');
          }}
          onDelete={() => {
            updateEntry(evidenceEntry.id, (entry) => ({
              ...entry,
              evidences: entry.evidences.filter((item) => item.id !== evidence.id),
            }));
            setEvidenceState(null);
            flash('증빙을 삭제했습니다.');
          }}
          onDownloaded={() => flash('증빙 다운로드를 시작했습니다.')}
        />
      )}

      {isImportOpen && (
        <TransactionImportFlow
          onCancel={() => setIsImportOpen(false)}
          onSave={(transactions, fileName) => {
            saveImportedTransactions(transactions, fileName);
            flash(`${transactions.length}건의 거래를 장부에 반영했습니다.`);
          }}
        />
      )}

      {toast && <Toast message={toast} />}
    </div>
  );
}
