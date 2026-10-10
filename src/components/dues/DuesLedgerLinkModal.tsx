'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ApiError } from '@/api/client';
import { linkSemesterEntries } from '@/api/dues/api';
import { invalidateLedgerAndDues } from '@/api/dues/queries';
import { ledgerQueries } from '@/api/ledger/queries';
import type { MemberDues, SemesterDuesSummary } from '@/components/dues/types';
import type { LedgerEntry } from '@/components/ledger/types';
import { formatOccurredAt, signedAmount } from '@/components/ledger/utils';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

function isUnlinkedDuesEntry(entry: LedgerEntry) {
  return entry.category === '회비' && (!entry.duesLink || entry.linkStatus !== 'confirmed');
}

export function DuesLedgerLinkModal({
  semester,
  members,
  onClose,
  onLinked,
}: {
  semester: SemesterDuesSummary;
  members: MemberDues[];
  onClose: () => void;
  onLinked: (count: number) => void;
}) {
  const queryClient = useQueryClient();
  const { data: ledgerEntries = [] } = useQuery(ledgerQueries.entries());
  const candidates = useMemo(() => ledgerEntries.filter(isUnlinkedDuesEntry), [ledgerEntries]);
  const [error, setError] = useState('');
  const [selections, setSelections] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      candidates.map((entry) => [entry.id, members.find((member) => member.name === entry.counterparty)?.id ?? '']),
    ),
  );
  const selectedCount = Object.values(selections).filter(Boolean).length;

  const mutation = useMutation({
    mutationFn: () =>
      linkSemesterEntries(semester.id, {
        links: candidates.flatMap((entry) =>
          selections[entry.id] ? [{ entryId: Number(entry.id), memberId: Number(selections[entry.id]) }] : [],
        ),
      }),
    onSuccess: async ({ linkedCount }) => {
      await invalidateLedgerAndDues(queryClient);
      onLinked(linkedCount);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : '입출금 내역을 연결하지 못했습니다.'),
  });

  function save() {
    if (selectedCount === 0 || mutation.isPending) return;
    setError('');
    mutation.mutate();
  }

  return (
    <Modal
      eyebrow={semester.title}
      title="입출금 내역 연결"
      onClose={onClose}
      width="820px"
      footer={
        <>
          {error && <span className="text-danger text-xs">{error}</span>}
          <Button className="ml-auto" onClick={onClose}>
            취소
          </Button>
          <Button variant="primary" disabled={selectedCount === 0 || mutation.isPending} onClick={save}>
            저장
          </Button>
        </>
      }
    >
      <div className="px-6 py-5">
        {candidates.length === 0 ? (
          <div className="border-dash text-muted rounded-[12px] border border-dashed px-8 py-10 text-center text-[13px]">
            연결할 입출금 내역이 없습니다.
          </div>
        ) : (
          <div className="border-line overflow-hidden rounded-[12px] border">
            <table className="w-full table-fixed border-collapse text-left">
              <colgroup>
                <col className="w-[55%]" />
                <col className="w-[45%]" />
              </colgroup>
              <thead className="bg-panel2 text-faint text-[11px] font-bold">
                <tr className="border-line border-b">
                  <th className="px-4 py-2.5">입출금 내역</th>
                  <th className="px-4 py-2.5">연결한 회원</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((entry) => (
                  <tr key={entry.id} className="border-line border-b last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4">
                        <div className="min-w-0">
                          <div className="text-[12.5px] font-semibold">{entry.counterparty || '—'}</div>
                          <div className="text-faint mt-1.5 text-[10.5px]">{formatOccurredAt(entry.occurredAt)}</div>
                          <div className="text-muted mt-1 text-[11.5px] leading-5">
                            {entry.note || entry.description || '비고 없음'}
                          </div>
                        </div>
                        <strong
                          className="self-center whitespace-nowrap"
                          style={{ color: entry.type === 'deposit' ? 'var(--stock-up)' : 'var(--stock-down)' }}
                        >
                          {signedAmount(entry)}
                        </strong>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        aria-label={`${entry.counterparty || '이름 없음'} 입출금 내역에 연결할 회원`}
                        value={selections[entry.id] ?? ''}
                        onChange={(event) =>
                          setSelections((current) => ({ ...current, [entry.id]: event.target.value }))
                        }
                        className="border-line2 bg-panel text-text focus:border-primary-line h-10 w-full cursor-pointer rounded-[9px] border px-3 text-xs outline-none"
                      >
                        <option value="">회원 선택</option>
                        {members.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name} · {member.studentNumber} · {member.track}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}
