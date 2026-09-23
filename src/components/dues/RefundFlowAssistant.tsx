'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppData } from '@/components/app-data/AppDataProvider';
import { LIVE_SEMESTER_ID } from '@/components/dues/derive';
import type { LedgerEntry } from '@/components/ledger/types';
import { formatOccurredAt, formatWon } from '@/components/ledger/utils';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

export function refundOriginHref(origin: 'dues' | 'exemptions') {
  return origin === 'dues' ? '/ledger/dues' : '/ledger/exemptions';
}

export function isAutomaticRefundCandidate(entry: LedgerEntry, memberName: string, amount: number) {
  return (
    entry.type === 'withdrawal' &&
    entry.linkStatus !== 'confirmed' &&
    entry.amount === amount &&
    entry.counterparty.includes(memberName)
  );
}

export function isDirectRefundCandidate(entry: LedgerEntry, amount: number) {
  return entry.type === 'withdrawal' && entry.linkStatus !== 'confirmed' && entry.amount === amount;
}

export function RefundFlowAssistant() {
  const { refundFlow, ledgerEntries, getSemesterDuesMembers, setRefundStage, cancelRefundFlow, linkRefundEntry } =
    useAppData();
  const router = useRouter();
  const [selectedEntryId, setSelectedEntryId] = useState('');
  const member = refundFlow
    ? getSemesterDuesMembers(LIVE_SEMESTER_ID).find((item) => item.id === refundFlow.memberId)
    : undefined;
  const amount = member?.refundAmount ?? 0;
  const originDeposit = useMemo(
    () =>
      refundFlow
        ? [...ledgerEntries]
            .filter(
              (entry) =>
                entry.type === 'deposit' &&
                entry.category === '회비' &&
                entry.linkStatus === 'confirmed' &&
                entry.duesLink?.memberId === refundFlow.memberId,
            )
            .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0]
        : undefined,
    [ledgerEntries, refundFlow],
  );
  const candidates = member
    ? ledgerEntries.filter((entry) => isAutomaticRefundCandidate(entry, member.name, amount))
    : [];

  if (!refundFlow || !member || refundFlow.stage === 'direct') return null;

  function goToCandidates() {
    if (candidates.length > 0) {
      setSelectedEntryId(candidates[0].id);
      setRefundStage('candidates');
    } else {
      setRefundStage('no-candidates');
    }
  }

  if (refundFlow.stage === 'check') {
    return (
      <Modal
        title={`${member.name} 회비 반환`}
        onClose={cancelRefundFlow}
        width="520px"
        footer={
          <Button variant="primary" className="ml-auto" onClick={goToCandidates}>
            출금 내역 연결
          </Button>
        }
      >
        <div className="flex flex-col gap-3.5 px-[22px] py-5 text-[13px]">
          <div className="border-line bg-panel2 rounded-[11px] border px-3.5 py-3">
            <dl className="flex flex-col gap-2.5 text-[12.5px]">
              <div>
                <dt className="text-faint text-[11px]">학기</dt>
                <dd>2026년 2학기 회비</dd>
              </div>
              <div>
                <dt className="text-faint text-[11px]">원인 입금</dt>
                <dd className="text-primary-text font-medium">
                  {originDeposit
                    ? `${formatOccurredAt(originDeposit.occurredAt)} ${originDeposit.counterparty} ${formatWon(originDeposit.amount)}`
                    : '연결된 회비 입금 기록'}
                </dd>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-faint text-[11px]">요청 금액</dt>
                  <dd>{formatWon(member.assessedAmount ?? 0)}</dd>
                </div>
                <div>
                  <dt className="text-faint text-[11px]">
                    {member.refundReason === '탈퇴 기간' ? '탈퇴 반환' : '초과'}
                  </dt>
                  <dd className="text-danger font-semibold">{formatWon(amount)}</dd>
                </div>
              </div>
            </dl>
          </div>
        </div>
      </Modal>
    );
  }

  if (refundFlow.stage === 'candidates') {
    return (
      <Modal
        title={`${member.name} 회비 반환 · 출금 내역 연결`}
        onClose={() => setRefundStage('check')}
        width="560px"
        footer={
          <>
            <Button className="ml-auto" onClick={() => setRefundStage('check')}>
              이전
            </Button>
            <Button variant="primary" disabled={!selectedEntryId} onClick={() => linkRefundEntry(selectedEntryId)}>
              확정
            </Button>
          </>
        }
      >
        <div className="px-[22px] py-4">
          <div className="border-line overflow-hidden rounded-[11px] border">
            <div className="bg-panel2 border-line text-faint grid grid-cols-[44px_140px_1fr_100px] border-b text-[11px] font-bold">
              <div className="px-2.5 py-2">선택</div>
              <div className="px-2.5 py-2">출금 거래일</div>
              <div className="px-2.5 py-2">거래내역</div>
              <div className="px-2.5 py-2 text-right">출금액</div>
            </div>
            {candidates.map((entry) => (
              <label
                key={entry.id}
                className="hover:bg-primary-sunken border-line grid cursor-pointer grid-cols-[44px_140px_1fr_100px] items-center border-b last:border-b-0"
              >
                <div className="px-2.5 py-2">
                  <input
                    type="radio"
                    name="refund-candidate"
                    checked={selectedEntryId === entry.id}
                    onChange={() => setSelectedEntryId(entry.id)}
                  />
                </div>
                <div className="px-2.5 py-2 text-[12.5px]">{formatOccurredAt(entry.occurredAt)}</div>
                <div className="px-2.5 py-2 text-[12.5px]">
                  {entry.counterparty} · {entry.description}
                </div>
                <div className="px-2.5 py-2 text-right text-[12.5px]">{formatWon(entry.amount)}</div>
              </label>
            ))}
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={`${member.name} 회비 반환 · 출금 내역 연결`} onClose={() => setRefundStage('check')} width="520px">
      <div className="flex flex-col items-center gap-4 px-[22px] py-6 text-[13px]">
        <p>연결할 만한 출금 후보가 없습니다.</p>
        <Button
          onClick={() => {
            setRefundStage('direct');
            router.push('/ledger');
          }}
        >
          장부에서 출금 직접 선택
        </Button>
      </div>
    </Modal>
  );
}
