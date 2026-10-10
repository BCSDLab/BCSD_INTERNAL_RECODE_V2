'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/api/client';
import { invalidateLedgerAndDues } from '@/api/dues/queries';
import { commitImport, updateLedgerEntry, uploadEvidence } from '@/api/ledger/api';
import { toCategoryCode, toEvidence, toImportCategoryCode } from '@/api/ledger/mappers';
import { ledgerQueries } from '@/api/ledger/queries';
import { useDuesUi } from '@/components/dues/DuesUiProvider';
import { EvidenceViewer } from '@/components/ledger/EvidenceViewer';
import { LedgerDetailView } from '@/components/ledger/LedgerDetailView';
import { LedgerListView } from '@/components/ledger/LedgerListView';
import { Toast } from '@/components/ledger/LedgerUi';
import { TransactionImportFlow } from '@/components/ledger/import/TransactionImportFlow';
import type { ImportTransaction } from '@/components/ledger/import/types';
import type { Evidence, LedgerEntry, LedgerFilters, LedgerScreen } from '@/components/ledger/types';
import { EMPTY_LEDGER_FILTERS } from '@/components/ledger/types';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { isCompleteLedgerDate } from '@/components/ledger/utils';
import {
  isDirectRefundCandidate,
  refundOriginHref,
  useLinkRefundEntry,
  useRefundMember,
} from '@/components/dues/RefundFlowAssistant';
import { Modal } from '@/components/ui/modal';
import { formatOccurredAt, formatWon } from '@/components/ledger/utils';

type EvidenceState = { entryId: string; evidenceId: string } | null;

const EMPTY_ENTRIES: LedgerEntry[] = [];

export function LedgerPageClient() {
  const queryClient = useQueryClient();
  const { data: entries = EMPTY_ENTRIES, isPending, isError } = useQuery(ledgerQueries.entries());
  const { refundFlow, cancelRefundFlow } = useDuesUi();
  const linkRefund = useLinkRefundEntry();
  const router = useRouter();
  const [filters, setFilters] = useState<LedgerFilters>(EMPTY_LEDGER_FILTERS);
  const [screen, setScreen] = useState<LedgerScreen>({ name: 'list' });
  const [evidenceState, setEvidenceState] = useState<EvidenceState>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [pendingRefundEntryId, setPendingRefundEntryId] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const directRefundFlow = refundFlow?.stage === 'direct' ? refundFlow : null;
  const refundMember = useRefundMember();
  const pendingRefundEntry = entries.find((entry) => entry.id === pendingRefundEntryId);

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

  const updateMutation = useMutation({
    mutationFn: ({ entry }: { entry: LedgerEntry; message: string }) =>
      updateLedgerEntry(Number(entry.id), {
        counterparty: entry.counterparty,
        category: toCategoryCode(entry.category),
        description: entry.description,
        note: entry.note,
        evidenceIds: entry.evidences.map((item) => Number(item.id)),
      }),
    onSuccess: async (_, { message }) => {
      await invalidateLedgerAndDues(queryClient);
      flash(message);
    },
    onError: (error) => flash(error instanceof ApiError ? error.message : '장부 기록을 저장하지 못했습니다.'),
  });

  function saveEvidences(entry: LedgerEntry, evidences: Evidence[], message: string) {
    updateMutation.mutate({ entry: { ...entry, evidences }, message });
  }

  function saveEntry(nextEntry: LedgerEntry) {
    updateMutation.mutate({ entry: nextEntry, message: '장부 기록을 수정했습니다' });
    setScreen({ name: 'detail', entryId: nextEntry.id });
  }

  async function replaceEvidence(entry: LedgerEntry, target: Evidence, file: File) {
    try {
      const replacement = toEvidence(await uploadEvidence(file));
      saveEvidences(
        entry,
        entry.evidences.map((item) => (item.id === target.id ? replacement : item)),
        '증빙 파일을 교체했습니다.',
      );
      setEvidenceState({ entryId: entry.id, evidenceId: replacement.id });
    } catch {
      flash('증빙 파일을 올리지 못했습니다.');
    }
  }

  async function saveImportedTransactions(transactions: ImportTransaction[], fileName: string) {
    const result = await commitImport({
      fileName,
      transactions: transactions.map((transaction) => ({
        rowKey: transaction.id,
        occurredAt: `${transaction.occurredAt}:00`,
        type: transaction.type === 'deposit' ? 'DEPOSIT' : 'WITHDRAWAL',
        counterparty: transaction.counterparty,
        amount: transaction.amount,
        category: toImportCategoryCode(transaction.category),
        note: transaction.note,
        evidenceIds: transaction.evidences.map((item) => Number(item.id)),
      })),
    });
    await invalidateLedgerAndDues(queryClient);
    flash(`${result.createdCount}건의 거래를 장부에 반영했습니다.`);
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
          <Link
            href="/ledger/exemptions"
            className="text-muted hover:text-primary-text text-[13px] font-medium transition-colors"
          >
            면제 사유
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2.5">
          <span className="border-primary-line bg-primary-soft text-primary-text rounded-full border px-3 py-1.5 text-[11.5px] font-semibold">
            관리자
          </span>
          <ThemeToggle />
        </div>
      </header>

      {directRefundFlow && refundMember && (
        <div className="border-primary-line bg-primary-soft mx-8 mt-5 flex items-center gap-3 rounded-[11px] border px-4 py-3">
          <div>
            <div className="text-primary-text text-[13px] font-bold">
              {refundMember.name}님의 반환 출금을 찾고 있습니다.
            </div>
            <div className="text-muted mt-1 text-[11.5px]">
              반환 금액 {formatWon(refundMember.refundAmount ?? 0)} · 연결하지 않은 출금의 ‘선택’ 버튼을 누르세요.
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const href = refundOriginHref(directRefundFlow.origin);
              cancelRefundFlow();
              router.push(href);
            }}
            className="border-line2 text-muted hover:text-primary-text ml-auto cursor-pointer rounded-[9px] border px-3 py-2 text-xs"
          >
            취소하고 돌아가기
          </button>
        </div>
      )}

      {isError ? (
        <div className="text-muted px-8 py-24 text-center text-[13px]">장부를 불러오지 못했습니다.</div>
      ) : isPending ? (
        <div className="text-muted px-8 py-24 text-center text-[13px]">불러오는 중…</div>
      ) : (
        <LedgerListView
          allEntries={entries}
          entries={filteredEntries}
          filters={filters}
          onFiltersChange={setFilters}
          onResetFilters={() => setFilters(EMPTY_LEDGER_FILTERS)}
          onOpenEntry={(entryId) => setScreen({ name: 'detail', entryId })}
          onOpenImport={() => setIsImportOpen(true)}
          refundSelection={
            directRefundFlow && refundMember
              ? {
                  isEligible: (entry) => isDirectRefundCandidate(entry, refundMember.refundAmount ?? 0),
                  onSelect: setPendingRefundEntryId,
                }
              : undefined
          }
        />
      )}

      {directRefundFlow && refundMember && pendingRefundEntry && (
        <Modal
          title={`${refundMember.name} 회비 반환 · 출금 연결 확정`}
          onClose={() => setPendingRefundEntryId('')}
          width="480px"
          footer={
            <>
              <button
                type="button"
                onClick={() => setPendingRefundEntryId('')}
                className="border-line2 text-muted ml-auto cursor-pointer rounded-[9px] border px-3 py-2 text-xs"
              >
                취소
              </button>
              <button
                type="button"
                disabled={linkRefund.isPending}
                onClick={() => {
                  const href = refundOriginHref(directRefundFlow.origin);
                  linkRefund.mutate(pendingRefundEntry.id, {
                    onSuccess: () => {
                      setPendingRefundEntryId('');
                      router.push(href);
                    },
                    onError: () => flash('반환 출금을 연결하지 못했습니다.'),
                  });
                }}
                className="bg-primary text-on-primary cursor-pointer rounded-[9px] px-3.5 py-[9px] text-xs font-semibold"
              >
                연결 확정
              </button>
            </>
          }
        >
          <div className="px-6 py-5 text-[13px] leading-[1.7]">
            <b>{formatOccurredAt(pendingRefundEntry.occurredAt)}</b> {pendingRefundEntry.counterparty}{' '}
            <b>{formatWon(pendingRefundEntry.amount)}</b> 출금을 {refundMember.name}님의 회비 반환으로 연결할까요?
          </div>
        </Modal>
      )}

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
          onReplace={(file) => replaceEvidence(evidenceEntry, evidence, file)}
          onDelete={() => {
            saveEvidences(
              evidenceEntry,
              evidenceEntry.evidences.filter((item) => item.id !== evidence.id),
              '증빙을 삭제했습니다.',
            );
            setEvidenceState(null);
          }}
          onDownloaded={() => flash('증빙 다운로드를 시작했습니다.')}
        />
      )}

      {isImportOpen && (
        <TransactionImportFlow onCancel={() => setIsImportOpen(false)} onSave={saveImportedTransactions} />
      )}

      {toast && <Toast message={toast} />}
    </div>
  );
}
