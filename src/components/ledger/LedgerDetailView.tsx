'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { duesQueries } from '@/api/dues/queries';
import { uploadEvidence as uploadEvidenceFile } from '@/api/ledger/api';
import { toEvidence } from '@/api/ledger/mappers';
import type { MemberDues } from '@/components/dues/types';
import { Button, Input, ModalFrame, Panel, Select } from '@/components/ledger/LedgerUi';
import type { Evidence, LedgerCategory, LedgerEntry } from '@/components/ledger/types';
import { LEDGER_CATEGORIES, MAX_EVIDENCE_COUNT } from '@/components/ledger/types';
import {
  EVIDENCE_ACCEPT,
  EVIDENCE_TYPE_ERROR,
  entryTypeLabel,
  formatOccurredAt,
  formatWon,
  isAllowedEvidenceFile,
} from '@/components/ledger/utils';

interface LedgerDetailViewProps {
  entry: LedgerEntry;
  onClose: () => void;
  onSave: (entry: LedgerEntry) => void;
  onOpenEvidence: (evidenceId: string) => void;
}

type PaymentStatus = '완료' | '미납' | '초과납부' | '면제' | '확인필요';

const PAYMENT_STATUS: Record<MemberDues['status'], PaymentStatus> = {
  paid: '완료',
  unpaid: '미납',
  overpaid: '초과납부',
  exempt: '면제',
};

function isDuesCategory(category: LedgerCategory) {
  return category === '회비';
}

function duesHref(semesterId: string, latestSemesterId: string | undefined) {
  return semesterId === latestSemesterId ? '/ledger/dues' : `/ledger/dues/${semesterId}`;
}

/** 연결된 회원의 학기 회비 상태를 그대로 보여 준다(차이 규칙은 서버가 계산한다). */
function paymentStatus(entry: LedgerEntry, members: MemberDues[]): PaymentStatus {
  const duesLink = entry.duesLink;
  if (!duesLink || entry.linkStatus !== 'confirmed') return '확인필요';
  const member = members.find((item) => item.id === duesLink.memberId);
  return member ? PAYMENT_STATUS[member.status] : '확인필요';
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  if (status === '확인필요') {
    return (
      <span className="border-danger bg-danger-soft text-danger inline-flex rounded-full border px-2.5 py-[3px] text-[10.5px] font-bold">
        {status}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-[3px] text-[10.5px] font-bold ${
        status === '완료' || status === '초과납부'
          ? 'border-primary-line bg-primary-soft text-primary-text'
          : 'border-line2 bg-panel2 text-muted'
      }`}
    >
      {status}
    </span>
  );
}

export function LedgerDetailView({ entry, onClose, onSave, onOpenEvidence }: LedgerDetailViewProps) {
  const linkedSemesterId = entry.duesLink?.semesterId;
  const { data: semesters } = useQuery(duesQueries.semesters());
  const { data: linkedSemester } = useQuery({
    ...duesQueries.semester(linkedSemesterId ?? ''),
    enabled: !!linkedSemesterId,
  });
  const linkedMembers = linkedSemester?.members ?? [];

  const evidenceInput = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [counterparty, setCounterparty] = useState(entry.counterparty);
  const [category, setCategory] = useState<LedgerCategory>(entry.category);
  const [description, setDescription] = useState(entry.description);
  const [note, setNote] = useState(entry.note);
  const [evidences, setEvidences] = useState<Evidence[]>(entry.evidences);
  const [error, setError] = useState('');

  const displayedEvidences = isEditing ? evidences : entry.evidences;
  const status = paymentStatus(entry, linkedMembers);

  function resetDraft() {
    setCounterparty(entry.counterparty);
    setCategory(entry.category);
    setDescription(entry.description);
    setNote(entry.note);
    setEvidences(entry.evidences);
    setError('');
  }

  function startEditing() {
    resetDraft();
    setIsEditing(true);
  }

  function cancelEditing() {
    resetDraft();
    setIsEditing(false);
  }

  function changeCategory(nextCategory: LedgerCategory) {
    setCategory(nextCategory);
    setError('');
  }

  async function uploadEvidence(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    if (!files.every(isAllowedEvidenceFile)) {
      setError(EVIDENCE_TYPE_ERROR);
      event.target.value = '';
      return;
    }

    const remainingCount = MAX_EVIDENCE_COUNT - evidences.length;
    if (remainingCount <= 0) {
      setError(`증빙은 최대 ${MAX_EVIDENCE_COUNT}개까지 첨부할 수 있습니다.`);
      event.target.value = '';
      return;
    }

    const acceptedFiles = files.slice(0, remainingCount);
    const exceededLimit = acceptedFiles.length < files.length;

    try {
      const additions: Evidence[] = (await Promise.all(acceptedFiles.map(uploadEvidenceFile))).map(toEvidence);
      setEvidences((current) => [...current, ...additions].slice(0, MAX_EVIDENCE_COUNT));
      setError(exceededLimit ? `증빙은 최대 ${MAX_EVIDENCE_COUNT}개까지만 첨부했습니다.` : '');
    } catch {
      setError('증빙 파일을 올리지 못했습니다. 다시 선택해주세요.');
    } finally {
      event.target.value = '';
    }
  }

  function save() {
    if (!counterparty.trim() || !description.trim()) {
      setError('이름과 내용을 입력해주세요.');
      return;
    }
    if (entry.type === 'withdrawal' && evidences.length === 0) {
      setError('출금 내역은 증빙을 한 개 이상 첨부해주세요.');
      return;
    }
    if (evidences.length > MAX_EVIDENCE_COUNT) {
      setError(`증빙은 최대 ${MAX_EVIDENCE_COUNT}개까지 첨부할 수 있습니다.`);
      return;
    }

    onSave({
      ...entry,
      counterparty: counterparty.trim(),
      category,
      description: description.trim(),
      note: note.trim(),
      evidences,
      linkStatus: entry.linkStatus,
      duesLink: entry.duesLink,
    });
    setIsEditing(false);
  }

  return (
    <ModalFrame
      title={entry.type === 'deposit' ? '입금 상세' : '출금 상세'}
      subtitle={`${entryTypeLabel(entry)} ${formatWon(entry.amount)} · ${formatOccurredAt(entry.occurredAt)}`}
      onClose={onClose}
      width="720px"
    >
      <div className="p-5">
        <div className="flex flex-col gap-[18px]">
          <Panel title="거래 정보">
            <dl className="grid grid-cols-[128px_1fr] items-center gap-x-4 gap-y-3 text-[12.5px]">
              <dt className="text-faint">이름</dt>
              <dd>
                {isEditing ? (
                  <Input
                    value={counterparty}
                    onChange={(event) => setCounterparty(event.target.value)}
                    className="w-full"
                  />
                ) : (
                  <span className="text-text font-medium">{entry.counterparty || '—'}</span>
                )}
              </dd>
              <dt className="text-faint">분류</dt>
              <dd>
                {isEditing ? (
                  <Select
                    value={category}
                    onChange={(event) => changeCategory(event.target.value as LedgerCategory)}
                    className="w-full"
                  >
                    {LEDGER_CATEGORIES.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </Select>
                ) : (
                  entry.category
                )}
              </dd>
              <dt className="text-faint">내용</dt>
              <dd>
                {isEditing ? (
                  <Input
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    className="w-full"
                  />
                ) : (
                  entry.description
                )}
              </dd>
              <dt className="text-faint">비고</dt>
              <dd>
                {isEditing ? (
                  <Input value={note} onChange={(event) => setNote(event.target.value)} className="w-full" />
                ) : (
                  <span className={entry.note ? '' : 'text-faint'}>{entry.note || '—'}</span>
                )}
              </dd>
              {entry.type === 'withdrawal' && (
                <>
                  <dt className="text-faint self-start pt-1.5">증빙</dt>
                  <dd>
                    {displayedEvidences.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {displayedEvidences.map((evidence) => (
                          <span
                            key={evidence.id}
                            className="border-line2 bg-panel2 text-muted inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10.5px]"
                          >
                            <button
                              type="button"
                              onClick={() => onOpenEvidence(evidence.id)}
                              className="hover:text-primary-text cursor-pointer bg-transparent"
                            >
                              {evidence.name}
                            </button>
                            {isEditing && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEvidences((current) => current.filter((item) => item.id !== evidence.id));
                                  setError('');
                                }}
                                aria-label={`${evidence.name} 삭제`}
                                className="text-faint hover:text-danger cursor-pointer bg-transparent text-sm"
                              >
                                &times;
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    ) : !isEditing ? (
                      <span className="text-danger font-semibold">미첨부</span>
                    ) : null}
                    {isEditing && (
                      <div className={displayedEvidences.length > 0 ? 'mt-2' : ''}>
                        <button
                          type="button"
                          onClick={() => evidenceInput.current?.click()}
                          disabled={evidences.length >= MAX_EVIDENCE_COUNT}
                          className="text-primary-text cursor-pointer bg-transparent text-[11.5px] font-semibold hover:underline disabled:cursor-default disabled:no-underline disabled:opacity-45"
                        >
                          증빙 추가 ({evidences.length}/{MAX_EVIDENCE_COUNT})
                        </button>
                        <input
                          ref={evidenceInput}
                          type="file"
                          accept={EVIDENCE_ACCEPT}
                          multiple
                          onChange={uploadEvidence}
                          className="hidden"
                        />
                      </div>
                    )}
                  </dd>
                </>
              )}
            </dl>
          </Panel>

          {(entry.duesLink || isDuesCategory(isEditing ? category : entry.category)) &&
            (entry.duesLink ? (
              <Link
                href={duesHref(entry.duesLink.semesterId, semesters?.[0]?.id)}
                className="border-line bg-panel2 hover:border-primary-line flex items-center gap-4 rounded-[10px] border px-4 py-3 transition-colors"
              >
                <div>
                  <div className="text-text text-[13px] font-bold">{entry.duesLink.memberName}</div>
                  <div className="text-muted mt-1 text-[11px]">
                    {entry.duesLink.track} · {entry.duesLink.studentNumber} · {entry.duesLink.semester}
                  </div>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-faint mb-1.5 text-[10px] font-semibold">납부 상태</div>
                  <StatusBadge status={status} />
                </div>
                <span aria-hidden="true" className="text-faint text-sm">
                  →
                </span>
              </Link>
            ) : (
              <div className="border-danger bg-danger-soft flex items-center justify-between rounded-[10px] border border-dashed px-4 py-3">
                <span className="text-danger text-xs font-semibold">회비 관리에서 출납기록을 연결해주세요.</span>
                <StatusBadge status="확인필요" />
              </div>
            ))}
        </div>

        {error && (
          <p role="alert" className="bg-danger-soft text-danger mt-4 rounded-lg px-3 py-2.5 text-[11.5px] font-medium">
            {error}
          </p>
        )}

        <div className="border-line mt-5 flex justify-end gap-2 border-t pt-4">
          {isEditing ? (
            <>
              <Button tone="primary" onClick={save}>
                저장
              </Button>
              <Button tone="outline" onClick={cancelEditing}>
                취소
              </Button>
            </>
          ) : (
            <>
              <Button tone="primary" onClick={startEditing}>
                수정
              </Button>
              <Button tone="outline" onClick={onClose}>
                닫기
              </Button>
            </>
          )}
        </div>
      </div>
    </ModalFrame>
  );
}
