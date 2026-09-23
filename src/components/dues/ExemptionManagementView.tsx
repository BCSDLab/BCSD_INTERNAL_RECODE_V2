'use client';

import { useMemo, useState } from 'react';
import { useAppData } from '@/components/app-data/AppDataProvider';
import { deriveSemesterMembers, LIVE_SEMESTER_LABEL } from '@/components/dues/derive';
import type { ExemptionDraft, ExemptionPeriod } from '@/components/dues/exemptions';
import { CURRENT_SEMESTER_MEMBERS, DUES_MONTHS } from '@/components/dues/initial-data';
import type { MemberDues } from '@/components/dues/types';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

type PeriodKind = 'single' | 'closed' | 'open';
type Flow =
  | { name: 'form'; editingId: string | null; draft: ExemptionDraft; isNewReason: boolean; periodKind: PeriodKind }
  | { name: 'new-reason'; editingId: string | null; draft: ExemptionDraft }
  | { name: 'impact'; editingId: string | null; draft: ExemptionDraft }
  | { name: 'end'; editingId: string; draft: ExemptionDraft }
  | null;

const SEMESTER_MONTHS = ['2026-09', '2026-10', '2026-11', '2026-12', '2027-01', '2027-02'];

function formatMonth(value: string | null) {
  return value ? value.replace('-', '.') : '계속';
}

function won(amount: number) {
  return `${amount.toLocaleString('ko-KR')}원`;
}

function defaultDraft(): ExemptionDraft {
  return {
    memberId: CURRENT_SEMESTER_MEMBERS[0].id,
    reason: '',
    startMonth: '2026-10',
    endMonth: '2027-02',
  };
}

function periodKindOf(exemption: ExemptionPeriod): PeriodKind {
  if (exemption.endMonth === null) return 'open';
  return exemption.startMonth === exemption.endMonth ? 'single' : 'closed';
}

function replaceExemption(exemptions: ExemptionPeriod[], editingId: string | null, draft: ExemptionDraft) {
  const next: ExemptionPeriod = { ...draft, id: editingId ?? `exemption-${Date.now()}` };
  return editingId
    ? exemptions.map((exemption) => (exemption.id === editingId ? next : exemption))
    : [...exemptions, next];
}

function statusLabel(status: MemberDues['months'][number]['status']) {
  if (status === 'paid') return '완료';
  if (status === 'unpaid') return '미납';
  if (status === 'exempt') return '예외';
  return '납부 비대상';
}

function ImpactBody({ before, after }: { before: MemberDues; after: MemberDues }) {
  const changes = after.months
    .map((month, index) => ({ before: before.months[index], after: month, label: DUES_MONTHS[index] }))
    .filter((item) => item.before.status !== item.after.status || item.before.description !== item.after.description);
  const newRefund = Math.max(0, (after.refundAmount ?? 0) - (before.refundAmount ?? 0));

  return (
    <div className="flex flex-col gap-3 px-[22px] py-5 text-[13px]">
      <div className="text-sm font-bold">{LIVE_SEMESTER_LABEL}</div>
      <div className="flex flex-col gap-1.5">
        {changes.length > 0 ? (
          changes.map((change) => (
            <div key={change.label}>
              {change.label} {statusLabel(change.before.status)} →{' '}
              <span
                className={
                  change.after.status === 'unpaid' ? 'text-danger font-semibold' : 'text-primary-text font-semibold'
                }
              >
                {statusLabel(change.after.status)}
              </span>
              {change.before.status === 'paid' && change.after.status === 'exempt' && ' · 납불액 반환 대상'}
            </div>
          ))
        ) : (
          <div className="text-muted">현재 학기 회비에 반영되는 변경이 없습니다.</div>
        )}
      </div>
      <div className="border-line mt-1.5 grid grid-cols-2 gap-2 border-t pt-3 text-[12.5px]">
        <span className="text-muted">총 부과액</span>
        <span className="text-right">
          {won(before.assessedAmount ?? 0)} → <b>{won(after.assessedAmount ?? 0)}</b>
        </span>
        <span className="text-muted">총 미납액</span>
        <span className="text-right">
          {won(before.unpaidAmount ?? 0)} → <b>{won(after.unpaidAmount ?? 0)}</b>
        </span>
        <span className="text-muted">새로운 반환 필요액</span>
        <span className="text-danger text-right font-semibold">{won(newRefund)}</span>
      </div>
    </div>
  );
}

export function ExemptionManagementView() {
  const {
    exemptions,
    setExemptions,
    exemptionReasons,
    setExemptionReasons,
    ledgerEntries,
    getSemesterDuesMembers,
    startRefundFlow,
  } = useAppData();
  const [flow, setFlow] = useState<Flow>(null);
  const [notice, setNotice] = useState('');
  const members = getSemesterDuesMembers('2026-2');
  const memberById = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);
  const rows = [...exemptions].sort((a, b) => {
    const first = CURRENT_SEMESTER_MEMBERS.findIndex((member) => member.id === a.memberId);
    const second = CURRENT_SEMESTER_MEMBERS.findIndex((member) => member.id === b.memberId);
    return first - second || a.startMonth.localeCompare(b.startMonth);
  });

  function openAdd() {
    setFlow({ name: 'form', editingId: null, draft: defaultDraft(), isNewReason: false, periodKind: 'closed' });
  }

  function openEdit(exemption: ExemptionPeriod) {
    setFlow({
      name: 'form',
      editingId: exemption.id,
      draft: {
        memberId: exemption.memberId,
        reason: exemption.reason,
        startMonth: exemption.startMonth,
        endMonth: exemption.endMonth,
      },
      isNewReason: false,
      periodKind: periodKindOf(exemption),
    });
  }

  function continueFromForm() {
    if (!flow || flow.name !== 'form' || !flow.draft.reason.trim()) return;
    const draft = { ...flow.draft, reason: flow.draft.reason.trim().normalize('NFC') };
    if (!exemptionReasons.includes(draft.reason)) setFlow({ name: 'new-reason', editingId: flow.editingId, draft });
    else setFlow({ name: 'impact', editingId: flow.editingId, draft });
  }

  function applyDraft(editingId: string | null, draft: ExemptionDraft) {
    setExemptions((current) => replaceExemption(current, editingId, draft));
    if (!exemptionReasons.includes(draft.reason)) setExemptionReasons((current) => [...current, draft.reason]);
    setFlow(null);
    setNotice(editingId ? '면제 사유를 수정했습니다.' : '면제 사유를 추가했습니다.');
  }

  function previewMembers(editingId: string | null, draft: ExemptionDraft) {
    return deriveSemesterMembers(
      CURRENT_SEMESTER_MEMBERS,
      ledgerEntries,
      replaceExemption(exemptions, editingId, draft),
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1480px] px-8 pt-6 pb-12">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div>
          <div className="text-faint mb-1.5 text-[10.5px] font-bold tracking-[0.16em]">장부 · 회비 관리</div>
          <h1 className="text-2xl font-extrabold tracking-[-0.02em]">회원별 면제 사유 목록</h1>
        </div>
        <Button variant="primary" className="ml-auto px-4 py-2.5" onClick={openAdd}>
          + 면제 사유 추가
        </Button>
      </div>

      {notice && (
        <div
          role="status"
          className="border-success-line bg-success-soft mb-4 flex items-center rounded-[10px] border px-4 py-3 text-xs"
        >
          {notice}
          <button type="button" className="text-muted ml-auto cursor-pointer" onClick={() => setNotice('')}>
            ✕
          </button>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="flex min-h-[520px] items-center justify-center">
          <div className="border-dash text-muted flex flex-col items-center gap-3.5 rounded-[13px] border border-dashed px-[60px] py-10 text-[13px]">
            등록된 회원 면제 사유가 없습니다.
            <Button variant="primary" onClick={openAdd}>
              + 면제 사유 추가
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-line bg-panel overflow-hidden rounded-[13px] border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] border-collapse text-left">
              <thead className="bg-panel2">
                <tr className="border-line border-b">
                  {['회원', '학번', '트랙', '면제 사유', '시작', '종료', '적용 학기', '반환 상태', ''].map((label) => (
                    <th key={label} className="text-faint px-2.5 py-2.5 text-[11px] font-bold">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((exemption, index) => {
                  const member = memberById.get(exemption.memberId);
                  if (!member) return null;
                  const groupStart = index === 0 || rows[index - 1].memberId !== exemption.memberId;
                  const groupEnd = index === rows.length - 1 || rows[index + 1].memberId !== exemption.memberId;
                  const overlapsSemester = SEMESTER_MONTHS.some(
                    (month) =>
                      month >= exemption.startMonth && (exemption.endMonth === null || month <= exemption.endMonth),
                  );
                  const refundNeeded = member.refundStatus === 'needed' || member.refundStatus === 'partial';
                  const refundCompleted = member.refundStatus === 'completed' && exemption.reason === '탈퇴';
                  return (
                    <tr
                      key={exemption.id}
                      className={
                        groupEnd ? 'border-line border-b last:border-b-0' : 'border-line border-b border-dashed'
                      }
                    >
                      <td className="px-2.5 py-2.5 text-[12.5px] font-medium">{groupStart ? member.name : ''}</td>
                      <td className="text-muted px-2.5 py-2.5 text-xs">{groupStart ? member.studentNumber : ''}</td>
                      <td className="text-muted px-2.5 py-2.5 text-xs">{groupStart ? member.track : ''}</td>
                      <td className="px-2.5 py-2.5 text-[12.5px]">{exemption.reason}</td>
                      <td className="px-2.5 py-2.5 text-[12.5px]">{formatMonth(exemption.startMonth)}</td>
                      <td className="text-muted px-2.5 py-2.5 text-[12.5px]">{formatMonth(exemption.endMonth)}</td>
                      <td className="text-muted px-2.5 py-2.5 text-xs">
                        {overlapsSemester ? LIVE_SEMESTER_LABEL : '이전 학기'}
                      </td>
                      <td className="px-2.5 py-2.5 text-xs">
                        {refundNeeded ? (
                          <button
                            type="button"
                            onClick={() => startRefundFlow(member.id, 'exemptions')}
                            className="border-danger-line bg-danger-soft text-danger hover:border-danger cursor-pointer rounded-full border px-2 py-1 font-semibold transition-colors"
                          >
                            반환 필요 {won(member.refundAmount ?? 0)}
                          </button>
                        ) : refundCompleted ? (
                          <span className="border-success-line bg-success-soft rounded-full border px-2 py-1 font-semibold">
                            반환 완료 {won(member.refundedAmount ?? 0)}
                          </span>
                        ) : (
                          <span className="text-faint">0원</span>
                        )}
                      </td>
                      <td className="px-2.5 py-2.5 text-right whitespace-nowrap">
                        {exemption.endMonth === null && (
                          <button
                            type="button"
                            className="text-primary-text mr-2 cursor-pointer text-xs font-semibold"
                            onClick={() =>
                              setFlow({
                                name: 'end',
                                editingId: exemption.id,
                                draft: { ...exemption, endMonth: '2027-01' },
                              })
                            }
                          >
                            기간 종료
                          </button>
                        )}
                        <button
                          type="button"
                          className="text-muted hover:text-primary-text cursor-pointer text-xs"
                          onClick={() => openEdit(exemption)}
                        >
                          수정
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-faint pt-3 text-[11px] leading-[1.7]">
        직책·학적·활동 상태만으로는 자동 면제하지 않습니다. 이 목록의 모든 기록은 관리자가 사유와 기간을 직접 등록한
        것입니다.
      </p>

      {flow?.name === 'form' && (
        <ExemptionFormModal
          flow={flow}
          members={members}
          reasons={exemptionReasons}
          onChange={setFlow}
          onClose={() => setFlow(null)}
          onContinue={continueFromForm}
        />
      )}

      {flow?.name === 'new-reason' && (
        <SimpleDialog
          title="새로운 면제 사유"
          onClose={() => setFlow(null)}
          onBack={() =>
            setFlow({ ...flow, name: 'form', isNewReason: true, periodKind: periodKindOf({ ...flow.draft, id: '' }) })
          }
          onConfirm={() => setFlow({ ...flow, name: 'impact' })}
          confirmLabel="계속"
        >
          <b>&quot;{flow.draft.reason}&quot;</b>는 새로운 면제 사유입니다.
          <br />
          면제 사유 목록에 추가하고 계속 진행할까요?
        </SimpleDialog>
      )}

      {flow?.name === 'impact' &&
        (() => {
          const before = memberById.get(flow.draft.memberId);
          const after = previewMembers(flow.editingId, flow.draft).find((member) => member.id === flow.draft.memberId);
          if (!before || !after) return null;
          return (
            <Modal
              title="면제 사유 변경"
              onClose={() => setFlow(null)}
              width="520px"
              footer={
                <>
                  <Button
                    className="ml-auto"
                    onClick={() =>
                      setFlow({
                        name: 'form',
                        editingId: flow.editingId,
                        draft: flow.draft,
                        isNewReason: !exemptionReasons.includes(flow.draft.reason),
                        periodKind: periodKindOf({ ...flow.draft, id: flow.editingId ?? '' }),
                      })
                    }
                  >
                    이전
                  </Button>
                  <Button variant="primary" onClick={() => applyDraft(flow.editingId, flow.draft)}>
                    적용
                  </Button>
                </>
              }
            >
              <ImpactBody before={before} after={after} />
            </Modal>
          );
        })()}

      {flow?.name === 'end' &&
        (() => {
          const member = memberById.get(flow.draft.memberId);
          const after = previewMembers(flow.editingId, flow.draft).find((item) => item.id === flow.draft.memberId);
          const previous = exemptions.find((item) => item.id === flow.editingId);
          if (!member || !after || !previous) return null;
          return (
            <Modal
              title="면제 사유 변경"
              onClose={() => setFlow(null)}
              width="480px"
              footer={
                <>
                  <Button className="ml-auto" onClick={() => setFlow(null)}>
                    이전
                  </Button>
                  <Button variant="primary" onClick={() => applyDraft(flow.editingId, flow.draft)}>
                    적용
                  </Button>
                </>
              }
            >
              <div className="flex flex-col gap-3 px-[22px] py-5 text-[13px]">
                <div className="text-sm font-bold">
                  {member.name} - {flow.draft.reason}
                </div>
                <label className="grid grid-cols-[60px_1fr] items-center gap-1.5 text-[12.5px]">
                  <span className="text-muted">변경 전</span>
                  <span>
                    {formatMonth(previous.startMonth)} ~ <span className="text-muted">계속</span>
                  </span>
                  <span className="text-muted">변경 후</span>
                  <span className="flex items-center gap-2">
                    {formatMonth(previous.startMonth)} ~{' '}
                    <input
                      type="month"
                      value={flow.draft.endMonth ?? ''}
                      min={flow.draft.startMonth}
                      onChange={(event) => setFlow({ ...flow, draft: { ...flow.draft, endMonth: event.target.value } })}
                      className="border-line bg-panel2 rounded-[9px] border px-2 py-1.5"
                    />
                  </span>
                </label>
                <ImpactBody before={member} after={after} />
              </div>
            </Modal>
          );
        })()}
    </main>
  );
}

function ExemptionFormModal({
  flow,
  members,
  reasons,
  onChange,
  onClose,
  onContinue,
}: {
  flow: Extract<NonNullable<Flow>, { name: 'form' }>;
  members: MemberDues[];
  reasons: string[];
  onChange: (flow: Flow) => void;
  onClose: () => void;
  onContinue: () => void;
}) {
  const updateDraft = (update: Partial<ExemptionDraft>) => onChange({ ...flow, draft: { ...flow.draft, ...update } });
  const setPeriodKind = (periodKind: PeriodKind) => {
    const endMonth =
      periodKind === 'open'
        ? null
        : periodKind === 'single'
          ? flow.draft.startMonth
          : (flow.draft.endMonth ?? flow.draft.startMonth);
    onChange({ ...flow, periodKind, draft: { ...flow.draft, endMonth } });
  };
  const invalid = !flow.draft.reason.trim() || (!!flow.draft.endMonth && flow.draft.endMonth < flow.draft.startMonth);

  return (
    <Modal
      title={flow.editingId ? '면제 사유 수정' : '면제 사유 추가'}
      onClose={onClose}
      width="560px"
      footer={
        <>
          <Button className="ml-auto" onClick={onClose}>
            취소
          </Button>
          <Button variant="primary" disabled={invalid} onClick={onContinue}>
            저장
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 px-[22px] py-5">
        <label className="text-muted flex flex-col gap-2 text-[11.5px]">
          회원
          <select
            value={flow.draft.memberId}
            onChange={(event) => updateDraft({ memberId: event.target.value })}
            className="border-line bg-panel2 text-text h-[42px] rounded-[9px] border px-3 text-sm"
          >
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} · {member.studentNumber} · {member.track}
              </option>
            ))}
          </select>
        </label>
        <label className="text-muted flex flex-col gap-2 text-[11.5px]">
          면제 사유
          <select
            value={flow.isNewReason ? '__new__' : flow.draft.reason}
            onChange={(event) =>
              event.target.value === '__new__'
                ? onChange({ ...flow, isNewReason: true, draft: { ...flow.draft, reason: '' } })
                : onChange({ ...flow, isNewReason: false, draft: { ...flow.draft, reason: event.target.value } })
            }
            className="border-line bg-panel2 text-text h-[42px] rounded-[9px] border px-3 text-sm"
          >
            <option value="" disabled>
              사유 선택
            </option>
            {reasons.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
            <option value="__new__">+ 새로운 사유 추가</option>
          </select>
          {flow.isNewReason && (
            <input
              autoFocus
              value={flow.draft.reason}
              onChange={(event) => updateDraft({ reason: event.target.value })}
              placeholder="새 면제 사유 입력"
              className="border-line bg-panel2 text-text h-[42px] rounded-[9px] border px-3 text-sm"
            />
          )}
        </label>
        <div>
          <div className="text-muted mb-2 text-[11.5px]">기간</div>
          <div className="mb-2.5 flex gap-[18px] text-[12.5px]">
            {(
              [
                ['single', '특정 월'],
                ['closed', '닫힌 기간'],
                ['open', '열린 기간'],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="flex cursor-pointer items-center gap-1.5">
                <input type="radio" checked={flow.periodKind === value} onChange={() => setPeriodKind(value)} />
                {label}
              </label>
            ))}
          </div>
          <div className="flex items-center gap-2.5">
            <input
              type="month"
              value={flow.draft.startMonth}
              onChange={(event) =>
                updateDraft({
                  startMonth: event.target.value,
                  ...(flow.periodKind === 'single' ? { endMonth: event.target.value } : {}),
                })
              }
              className="border-line bg-panel2 h-[42px] w-[150px] rounded-[9px] border px-3 text-sm"
            />
            {flow.periodKind !== 'single' && (
              <>
                <span className="text-faint">~</span>
                {flow.periodKind === 'open' ? (
                  <span className="text-muted text-sm">계속</span>
                ) : (
                  <input
                    type="month"
                    value={flow.draft.endMonth ?? ''}
                    min={flow.draft.startMonth}
                    onChange={(event) => updateDraft({ endMonth: event.target.value })}
                    className="border-line bg-panel2 h-[42px] w-[150px] rounded-[9px] border px-3 text-sm"
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function SimpleDialog({
  title,
  children,
  onClose,
  onBack,
  onConfirm,
  confirmLabel,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onBack: () => void;
  onConfirm: () => void;
  confirmLabel: string;
}) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      width="440px"
      footer={
        <>
          <Button className="ml-auto" onClick={onBack}>
            이전
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="px-[22px] py-5 text-[13px] leading-[1.7]">{children}</div>
    </Modal>
  );
}
