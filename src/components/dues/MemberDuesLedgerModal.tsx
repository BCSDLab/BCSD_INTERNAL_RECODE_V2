'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ApiError } from '@/api/client';
import { invalidateLedgerAndDues } from '@/api/dues/queries';
import { unlinkLedgerEntry } from '@/api/ledger/api';
import { ledgerQueries } from '@/api/ledger/queries';
import type { MemberDues, SemesterDuesSummary } from '@/components/dues/types';
import { formatOccurredAt, formatWon } from '@/components/ledger/utils';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

/**
 * 회원 한 명의 학기 회비에 연결된 출납내역. "수정"을 누르면 행마다 "연결 해제"가 생기고,
 * 한 번 더 눌러 확인해야 해제된다. 해제된 회비 분류 내역은 장부에서 "미정"으로 돌아간다.
 */
export function MemberDuesLedgerModal({
  semester,
  member,
  onClose,
}: {
  semester: SemesterDuesSummary;
  member: MemberDues;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: ledgerEntries = [] } = useQuery(ledgerQueries.entries());
  const [isEditing, setIsEditing] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const linkedEntries = useMemo(
    () =>
      ledgerEntries
        .filter(
          (entry) =>
            entry.linkStatus === 'confirmed' &&
            entry.duesLink?.memberId === member.id &&
            entry.duesLink.semesterId === semester.id,
        )
        .sort((first, second) => second.occurredAt.localeCompare(first.occurredAt)),
    [ledgerEntries, member.id, semester.id],
  );

  const unlinkMutation = useMutation({
    mutationFn: (entryId: string) => unlinkLedgerEntry(Number(entryId)),
    onSuccess: async () => {
      setConfirmingId(null);
      await invalidateLedgerAndDues(queryClient);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : '연결을 해제하지 못했습니다.'),
  });

  function requestUnlink(entryId: string) {
    if (unlinkMutation.isPending) return;
    setError('');
    if (confirmingId === entryId) unlinkMutation.mutate(entryId);
    else setConfirmingId(entryId);
  }

  function finishEditing() {
    setIsEditing(false);
    setConfirmingId(null);
    setError('');
  }

  return (
    <Modal
      eyebrow={semester.title}
      title={`${member.name} · 연결 출납내역`}
      onClose={onClose}
      width="760px"
      footer={
        <>
          {error ? (
            <span role="alert" className="text-danger text-xs">
              {error}
            </span>
          ) : (
            isEditing && <span className="text-faint text-[11px]">“연결 해제”를 한 번 더 누르면 해제됩니다.</span>
          )}
          {isEditing ? (
            <Button variant="primary" className="ml-auto" onClick={finishEditing}>
              완료
            </Button>
          ) : (
            <>
              <Button className="ml-auto" disabled={linkedEntries.length === 0} onClick={() => setIsEditing(true)}>
                수정
              </Button>
              <Button onClick={onClose}>닫기</Button>
            </>
          )}
        </>
      }
    >
      <div className="px-6 py-5">
        {linkedEntries.length === 0 ? (
          <div className="border-dash text-muted rounded-[12px] border border-dashed px-8 py-10 text-center text-[13px]">
            이 학기 회비와 연결된 출납내역이 없습니다.
          </div>
        ) : (
          <div className="border-line overflow-hidden rounded-[12px] border">
            <table className="w-full border-collapse text-left">
              <thead className="bg-panel2 text-faint text-[11px] font-bold">
                <tr className="border-line border-b">
                  <th className="px-4 py-2.5">날짜</th>
                  <th className="px-4 py-2.5">종류</th>
                  <th className="px-4 py-2.5">이름</th>
                  <th className="px-4 py-2.5">비고</th>
                  <th className="px-4 py-2.5 text-right">금액</th>
                  {isEditing && <th className="w-[96px] px-4 py-2.5 text-center">연결</th>}
                </tr>
              </thead>
              <tbody>
                {linkedEntries.map((entry) => (
                  <tr key={entry.id} className="border-line border-b text-xs last:border-b-0">
                    <td className="text-muted px-4 py-3 whitespace-nowrap">{formatOccurredAt(entry.occurredAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="border-line2 bg-panel2 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold">
                        {entry.type === 'deposit' ? '입금' : '출금'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">{entry.counterparty || '—'}</td>
                    <td className="text-muted max-w-[220px] px-4 py-3 leading-5">
                      {entry.note || entry.description || '비고 없음'}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-bold whitespace-nowrap ${
                        entry.type === 'deposit' ? 'text-primary-text' : 'text-danger'
                      }`}
                    >
                      {entry.type === 'deposit' ? '+' : '-'}
                      {formatWon(entry.amount)}
                    </td>
                    {isEditing && (
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant={confirmingId === entry.id ? 'dangerOutline' : 'danger'}
                          disabled={unlinkMutation.isPending}
                          aria-label={`${formatOccurredAt(entry.occurredAt)} ${formatWon(entry.amount)} 연결 해제`}
                          onClick={() => requestUnlink(entry.id)}
                        >
                          {confirmingId === entry.id ? '해제 확인' : '연결 해제'}
                        </Button>
                      </td>
                    )}
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
