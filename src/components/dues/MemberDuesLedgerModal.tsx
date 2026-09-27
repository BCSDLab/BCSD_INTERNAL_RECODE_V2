'use client';

import { useMemo } from 'react';
import { useAppData } from '@/components/app-data/AppDataProvider';
import type { MemberDues, SemesterDuesSummary } from '@/components/dues/types';
import { formatOccurredAt, formatWon } from '@/components/ledger/utils';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

export function MemberDuesLedgerModal({
  semester,
  member,
  onClose,
}: {
  semester: SemesterDuesSummary;
  member: MemberDues;
  onClose: () => void;
}) {
  const { ledgerEntries } = useAppData();
  const semesterLabel = semester.title.replace(/\s*회비$/, '');
  const linkedEntries = useMemo(
    () =>
      ledgerEntries
        .filter(
          (entry) =>
            entry.linkStatus === 'confirmed' &&
            entry.duesLink?.memberId === member.id &&
            entry.duesLink.semester === semesterLabel,
        )
        .sort((first, second) => second.occurredAt.localeCompare(first.occurredAt)),
    [ledgerEntries, member.id, semesterLabel],
  );

  return (
    <Modal
      eyebrow={semester.title}
      title={`${member.name} · 연결 출납내역`}
      onClose={onClose}
      width="760px"
      footer={
        <Button className="ml-auto" onClick={onClose}>
          닫기
        </Button>
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
                </tr>
              </thead>
              <tbody>
                {linkedEntries.map((entry) => (
                  <tr key={entry.id} className="border-line border-b text-xs last:border-b-0">
                    <td className="text-muted px-4 py-3 whitespace-nowrap">{formatOccurredAt(entry.occurredAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="border-line2 bg-panel2 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold">
                        {entry.category}
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
