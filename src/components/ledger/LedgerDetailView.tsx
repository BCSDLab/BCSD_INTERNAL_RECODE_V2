'use client';

import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useAppData } from '@/components/app-data/AppDataProvider';
import { LIVE_SEMESTER_ID } from '@/components/dues/derive';
import type { MemberDues } from '@/components/dues/types';
import { Button, Input, ModalFrame, Panel, Select } from '@/components/ledger/LedgerUi';
import type { DuesLink, Evidence, LedgerCategory, LedgerEntry } from '@/components/ledger/types';
import { LEDGER_CATEGORIES, MAX_EVIDENCE_COUNT } from '@/components/ledger/types';
import { entryTypeLabel, formatOccurredAt, formatWon } from '@/components/ledger/utils';

interface LedgerDetailViewProps {
  entry: LedgerEntry;
  allEntries: LedgerEntry[];
  onClose: () => void;
  onSave: (entry: LedgerEntry) => void;
  onOpenEvidence: (evidenceId: string) => void;
}

type PaymentStatus = '완료' | '미납' | '확인필요';

const SEMESTER_OPTIONS = ['2026년 2학기', '2026년 1학기'];

function isDuesCategory(category: LedgerCategory) {
  return category === '회비' || category === '회비 반환';
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function toDuesLink(member: MemberDues, semester: string, kind: 'deposit' | 'refund'): DuesLink {
  return {
    memberId: member.id,
    memberName: member.name,
    studentNumber: member.studentNumber,
    track: member.track,
    semester,
    requiredAmount: member.assessedAmount ?? 0,
    refundReason: kind === 'refund' ? member.refundReason : undefined,
    refundAmount: kind === 'refund' ? member.refundAmount : undefined,
  };
}

function paymentStatus(entry: LedgerEntry, allEntries: LedgerEntry[], members: MemberDues[]): PaymentStatus {
  const duesLink = entry.duesLink;
  if (!duesLink || entry.linkStatus !== 'confirmed') return '확인필요';
  if (entry.category === '회비 반환') return '완료';

  const requiredAmount = members.find((member) => member.id === duesLink.memberId)?.assessedAmount ?? duesLink.requiredAmount;

  const paidAmount = allEntries
    .filter(
      (candidate) =>
        candidate.type === 'deposit' &&
        candidate.category === '회비' &&
        candidate.linkStatus === 'confirmed' &&
        candidate.duesLink?.memberId === duesLink.memberId &&
        candidate.duesLink?.semester === duesLink.semester,
    )
    .reduce((total, candidate) => total + candidate.amount, 0);

  if (paidAmount > requiredAmount) return '확인필요';
  return paidAmount >= requiredAmount ? '완료' : '미납';
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
        status === '완료'
          ? 'border-primary-line bg-primary-soft text-primary-text'
          : 'border-line2 bg-panel2 text-muted'
      }`}
    >
      {status}
    </span>
  );
}

export function LedgerDetailView({ entry, allEntries, onClose, onSave, onOpenEvidence }: LedgerDetailViewProps) {
  const { getSemesterDuesMembers } = useAppData();
  const liveMembers = getSemesterDuesMembers(LIVE_SEMESTER_ID);
  const depositCandidates = liveMembers.filter((member) => member.assessedAmount !== null);
  const refundCandidates = liveMembers.filter((member) => member.refundStatus === 'needed' || member.refundStatus === 'partial');

  const evidenceInput = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [counterparty, setCounterparty] = useState(entry.counterparty);
  const [category, setCategory] = useState<LedgerCategory>(entry.category);
  const [description, setDescription] = useState(entry.description);
  const [note, setNote] = useState(entry.note);
  const [evidences, setEvidences] = useState<Evidence[]>(entry.evidences);
  const initialCandidates = entry.category === '회비 반환' ? refundCandidates : depositCandidates;
  const initialLink =
    entry.duesLink ?? (initialCandidates[0] ? toDuesLink(initialCandidates[0], SEMESTER_OPTIONS[0], entry.category === '회비 반환' ? 'refund' : 'deposit') : undefined);
  const [selectedTrack, setSelectedTrack] = useState(initialLink?.track ?? '');
  const [selectedMemberId, setSelectedMemberId] = useState(initialLink?.memberId ?? '');
  const [semester, setSemester] = useState(entry.duesLink?.semester ?? SEMESTER_OPTIONS[0]);
  const [error, setError] = useState('');

  const baseCandidates = category === '회비 반환' ? refundCandidates : depositCandidates;
  const baseLinkOptions = baseCandidates.map((member) => toDuesLink(member, semester, category === '회비 반환' ? 'refund' : 'deposit'));
  const linkOptions =
    !entry.duesLink || baseLinkOptions.some((option) => option.memberId === entry.duesLink?.memberId)
      ? baseLinkOptions
      : [...baseLinkOptions, entry.duesLink];
  const trackOptions = [...new Set(linkOptions.map((option) => option.track))];
  const memberOptions = linkOptions.filter((option) => option.track === selectedTrack);
  const displayedEvidences = isEditing ? evidences : entry.evidences;
  const status = paymentStatus(entry, allEntries, liveMembers);

  function resetDraft() {
    const options = entry.category === '회비 반환' ? refundCandidates : depositCandidates;
    const currentLink = entry.duesLink ?? (options[0] ? toDuesLink(options[0], SEMESTER_OPTIONS[0], entry.category === '회비 반환' ? 'refund' : 'deposit') : undefined);
    setCounterparty(entry.counterparty);
    setCategory(entry.category);
    setDescription(entry.description);
    setNote(entry.note);
    setEvidences(entry.evidences);
    setSelectedTrack(currentLink?.track ?? '');
    setSelectedMemberId(currentLink?.memberId ?? '');
    setSemester(entry.duesLink?.semester ?? SEMESTER_OPTIONS[0]);
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
    if (!isDuesCategory(nextCategory)) return;

    const candidates = nextCategory === '회비 반환' ? refundCandidates : depositCandidates;
    const nextMember = candidates.find((member) => member.id === entry.duesLink?.memberId) ?? candidates[0];
    setSelectedTrack(nextMember?.track ?? '');
    setSelectedMemberId(nextMember?.id ?? '');
    setSemester(entry.duesLink?.semester ?? SEMESTER_OPTIONS[0]);
  }

  function changeTrack(track: string) {
    const nextMember = linkOptions.find((option) => option.track === track);
    setSelectedTrack(track);
    setSelectedMemberId(nextMember?.memberId ?? '');
  }

  async function uploadEvidence(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const remainingCount = MAX_EVIDENCE_COUNT - evidences.length;
    if (remainingCount <= 0) {
      setError(`증빙은 최대 ${MAX_EVIDENCE_COUNT}개까지 첨부할 수 있습니다.`);
      event.target.value = '';
      return;
    }

    const acceptedFiles = files.slice(0, remainingCount);
    const exceededLimit = acceptedFiles.length < files.length;

    try {
      const additions = await Promise.all(
        acceptedFiles.map(async (file, index): Promise<Evidence> => ({
          id: `evidence-${Date.now()}-${index}`,
          name: file.name,
          dataUrl: await readAsDataUrl(file),
        })),
      );
      setEvidences((current) => [...current, ...additions].slice(0, MAX_EVIDENCE_COUNT));
      setError(exceededLimit ? `증빙은 최대 ${MAX_EVIDENCE_COUNT}개까지만 첨부했습니다.` : '');
    } catch {
      setError('증빙 파일을 읽지 못했습니다. 다시 선택해주세요.');
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

    const duesTarget = isDuesCategory(category);
    const selectedLink = duesTarget ? linkOptions.find((option) => option.memberId === selectedMemberId) : undefined;
    if (duesTarget && !selectedLink) {
      setError('연결할 회비 정보를 선택해주세요.');
      return;
    }

    onSave({
      ...entry,
      counterparty: counterparty.trim(),
      category,
      description: description.trim(),
      note: note.trim(),
      evidences,
      linkStatus: duesTarget ? 'confirmed' : 'none',
      duesLink: selectedLink ? { ...selectedLink, semester } : undefined,
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
                          accept="image/*,application/pdf"
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

          {(isEditing ? isDuesCategory(category) : isDuesCategory(entry.category)) && (
            <Panel title="관련 회비">
              {isEditing ? (
                <div className="grid grid-cols-3 gap-2">
                  <label className="text-muted flex flex-col gap-1.5 text-[10.5px] font-bold">
                    트랙
                    <Select value={selectedTrack} onChange={(event) => changeTrack(event.target.value)}>
                      {trackOptions.map((track) => (
                        <option key={track}>{track}</option>
                      ))}
                    </Select>
                  </label>
                  <label className="text-muted flex flex-col gap-1.5 text-[10.5px] font-bold">
                    학번 (이름)
                    <Select value={selectedMemberId} onChange={(event) => setSelectedMemberId(event.target.value)}>
                      {memberOptions.map((option) => (
                        <option key={option.memberId} value={option.memberId}>
                          {option.studentNumber} ({option.memberName})
                        </option>
                      ))}
                    </Select>
                  </label>
                  <label className="text-muted flex flex-col gap-1.5 text-[10.5px] font-bold">
                    학기 (회비 이름)
                    <Select value={semester} onChange={(event) => setSemester(event.target.value)}>
                      {SEMESTER_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option.replace(/^20/, '')} 회비
                        </option>
                      ))}
                    </Select>
                  </label>
                </div>
              ) : entry.duesLink ? (
                <div className="border-line bg-panel2 flex items-center gap-4 rounded-[10px] border px-4 py-3">
                  <div>
                    <div className="text-text text-[13px] font-bold">{entry.duesLink.memberName}</div>
                    <div className="text-muted mt-1 text-[11px]">
                      {entry.duesLink.track} · {entry.duesLink.studentNumber} · {entry.duesLink.semester}
                    </div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-faint mb-1.5 text-[10px] font-semibold">
                      {entry.category === '회비 반환' ? '반환 상태' : '납부 상태'}
                    </div>
                    <StatusBadge status={status} />
                  </div>
                </div>
              ) : (
                <div className="border-danger bg-danger-soft flex items-center justify-between rounded-[10px] border border-dashed px-4 py-3">
                  <span className="text-danger text-xs font-semibold">연결된 회비 정보가 없습니다.</span>
                  <StatusBadge status="확인필요" />
                </div>
              )}
            </Panel>
          )}
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
