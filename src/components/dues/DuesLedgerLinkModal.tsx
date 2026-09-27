'use client';

import { useMemo, useState } from 'react';
import { useAppData } from '@/components/app-data/AppDataProvider';
import type { MemberDues, SemesterDuesSummary } from '@/components/dues/types';
import type { DuesLink, LedgerEntry } from '@/components/ledger/types';
import { formatOccurredAt, signedAmount } from '@/components/ledger/utils';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

function isUnlinkedDuesEntry(entry: LedgerEntry) {
  return (
    (entry.category === '회비' || entry.category === '회비 반환') &&
    (!entry.duesLink || entry.linkStatus !== 'confirmed')
  );
}

function createDuesLink(entry: LedgerEntry, member: MemberDues, semester: SemesterDuesSummary): DuesLink {
  const isRefund = entry.category === '회비 반환';

  return {
    memberId: member.id,
    memberName: member.name,
    studentNumber: member.studentNumber,
    track: member.track,
    semester: semester.title.replace(/\s*회비$/, ''),
    requiredAmount: member.assessedAmount ?? 0,
    refundReason: isRefund ? member.refundReason : undefined,
    refundAmount: isRefund ? member.refundAmount : undefined,
  };
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
  const { ledgerEntries, setLedgerEntries } = useAppData();
  const candidates = useMemo(() => ledgerEntries.filter(isUnlinkedDuesEntry), [ledgerEntries]);
  const [selections, setSelections] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      candidates.map((entry) => [entry.id, members.find((member) => member.name === entry.counterparty)?.id ?? '']),
    ),
  );
  const selectedCount = Object.values(selections).filter(Boolean).length;

  function save() {
    if (selectedCount === 0) return;

    const memberById = new Map(members.map((member) => [member.id, member]));
    setLedgerEntries((current) =>
      current.map((entry) => {
        const memberId = selections[entry.id];
        const member = memberId ? memberById.get(memberId) : undefined;
        if (!member || !isUnlinkedDuesEntry(entry)) return entry;

        return {
          ...entry,
          linkStatus: 'confirmed',
          duesLink: createDuesLink(entry, member, semester),
        };
      }),
    );
    onLinked(selectedCount);
  }

  return (
    <Modal
      eyebrow={semester.title}
      title="입출금 내역 연결"
      onClose={onClose}
      width="820px"
      footer={
        <>
          <Button className="ml-auto" onClick={onClose}>
            취소
          </Button>
          <Button variant="primary" disabled={selectedCount === 0} onClick={save}>
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
