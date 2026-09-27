'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppData } from '@/components/app-data/AppDataProvider';
import { deriveSemesterMembers, LIVE_SEMESTER_ID, LIVE_SEMESTER_LABEL } from '@/components/dues/derive';
import { monthIsInExemption } from '@/components/dues/exemptions';
import type { ExemptionDraft, ExemptionPeriod } from '@/components/dues/exemptions';
import { CURRENT_SEMESTER_MEMBERS, DUES_MONTHS } from '@/components/dues/initial-data';
import { CheckboxFilter, HeaderFilter } from '@/components/dues/TableHeaderFilter';
import type { FilterOption } from '@/components/dues/TableHeaderFilter';
import type { MemberDues } from '@/components/dues/types';
import { Toast } from '@/components/ledger/LedgerUi';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

type PeriodKind = 'single' | 'closed' | 'open';
type ViewMode = 'member' | 'period';
type Semester = { year: number; term: 1 | 2 };
type FixedRole = 'track-leader' | 'education-leader';
type ExemptionFilterKey = 'member' | 'studentNumber' | 'track' | 'reason' | 'startMonth' | 'endMonth' | 'note';
type ExemptionFilterState = Record<ExemptionFilterKey, string[]>;
type ExemptionFilterQueries = Record<ExemptionFilterKey, string>;
type Flow =
  | {
      name: 'form';
      editingId: string | null;
      draft: ExemptionDraft;
      isNewReason: boolean;
      periodKind: PeriodKind;
      isEditing: boolean;
    }
  | { name: 'new-reason'; editingId: string | null; draft: ExemptionDraft }
  | { name: 'impact'; editingId: string | null; draft: ExemptionDraft }
  | null;

const OPEN_END_FILTER_VALUE = '__open__';
const EMPTY_NOTE_FILTER_VALUE = '__empty__';

const FILTER_CONFIG: Array<{ key: ExemptionFilterKey; label: string; placeholder: string }> = [
  { key: 'member', label: '회원', placeholder: '회원 검색' },
  { key: 'studentNumber', label: '학번', placeholder: '학번 검색' },
  { key: 'track', label: '트랙', placeholder: '트랙 검색' },
  { key: 'reason', label: '면제 사유', placeholder: '면제 사유 검색' },
  { key: 'startMonth', label: '시작', placeholder: 'YYYY-MM' },
  { key: 'endMonth', label: '종료', placeholder: 'YYYY-MM' },
  { key: 'note', label: '비고', placeholder: '비고 검색' },
];

function emptyFilterState(): ExemptionFilterState {
  return {
    member: [],
    studentNumber: [],
    track: [],
    reason: [],
    startMonth: [],
    endMonth: [],
    note: [],
  };
}

function emptyFilterQueries(): ExemptionFilterQueries {
  return {
    member: '',
    studentNumber: '',
    track: '',
    reason: '',
    startMonth: '',
    endMonth: '',
    note: '',
  };
}

function uniqueFilterOptions(entries: Array<[string, string]>): FilterOption<string>[] {
  return [...new Map(entries).entries()].map(([value, label]) => ({ value, label }));
}

function formatMonth(value: string | null) {
  return value ? value.replace('-', '.') : '계속';
}

function normalizeMonthInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 6);
  return digits.length <= 4 ? digits : `${digits.slice(0, 4)}-${digits.slice(4)}`;
}

function isValidMonth(value: string | null) {
  if (!value || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return false;
  return Number(value.slice(0, 4)) > 0;
}

function won(amount: number) {
  return `${amount.toLocaleString('ko-KR')}원`;
}

function defaultDraft(): ExemptionDraft {
  return {
    memberId: CURRENT_SEMESTER_MEMBERS[0].id,
    reason: '',
    note: '',
    startMonth: '2026-10',
    endMonth: '2027-02',
  };
}

function periodKindOf(exemption: ExemptionPeriod): PeriodKind {
  if (exemption.endMonth === null) return 'open';
  return exemption.startMonth === exemption.endMonth ? 'single' : 'closed';
}

function semesterMonths({ year, term }: Semester) {
  const monthNumbers = term === 1 ? [3, 4, 5, 6, 7, 8] : [9, 10, 11, 12, 1, 2];
  return monthNumbers.map((month) => {
    const monthYear = term === 2 && month <= 2 ? year + 1 : year;
    return `${monthYear}-${String(month).padStart(2, '0')}`;
  });
}

function moveSemester(semester: Semester, direction: -1 | 1): Semester {
  if (direction === -1) {
    return semester.term === 1 ? { year: semester.year - 1, term: 2 } : { year: semester.year, term: 1 };
  }
  return semester.term === 1 ? { year: semester.year, term: 2 } : { year: semester.year + 1, term: 1 };
}

function fixedRoleOf(exemption: ExemptionPeriod): FixedRole | null {
  const reason = exemption.reason.normalize('NFC');
  if (reason.endsWith(' 트랙장'.normalize('NFC'))) return 'track-leader';
  if (reason.endsWith(' 교욱장'.normalize('NFC'))) return 'education-leader';
  return null;
}

function semesterFromId(semesterId: string): Semester {
  const [year, term] = semesterId.split('-');
  return { year: Number(year), term: term === '1' ? 1 : 2 };
}

function periodPriority(exemption: ExemptionPeriod) {
  if (exemption.endMonth === exemption.startMonth) return 0;
  if (exemption.endMonth !== null) return 1;
  return 2;
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
  const { exemptions, setExemptions, exemptionReasons, setExemptionReasons, ledgerEntries, getSemesterDuesMembers } =
    useAppData();
  const [flow, setFlow] = useState<Flow>(null);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'neutral' } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('member');
  const [semester, setSemester] = useState<Semester>(() => semesterFromId(LIVE_SEMESTER_ID));
  const [openFilter, setOpenFilter] = useState<ExemptionFilterKey | null>(null);
  const [filters, setFilters] = useState<ExemptionFilterState>(emptyFilterState);
  const [filterQueries, setFilterQueries] = useState<ExemptionFilterQueries>(emptyFilterQueries);
  const members = getSemesterDuesMembers('2026-2');
  const memberById = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);
  const memberOrder = useMemo(() => new Map(members.map((member, index) => [member.id, index])), [members]);
  const rows = useMemo(
    () =>
      [...exemptions].sort((a, b) => {
        const first = CURRENT_SEMESTER_MEMBERS.findIndex((member) => member.id === a.memberId);
        const second = CURRENT_SEMESTER_MEMBERS.findIndex((member) => member.id === b.memberId);
        return first - second || a.startMonth.localeCompare(b.startMonth);
      }),
    [exemptions],
  );
  const filterOptions = useMemo<Record<ExemptionFilterKey, FilterOption<string>[]>>(
    () => ({
      member: uniqueFilterOptions(
        rows.flatMap((exemption) => {
          const member = memberById.get(exemption.memberId);
          return member ? [[member.id, member.name] as [string, string]] : [];
        }),
      ),
      studentNumber: uniqueFilterOptions(
        rows.flatMap((exemption) => {
          const studentNumber = memberById.get(exemption.memberId)?.studentNumber;
          return studentNumber ? [[studentNumber, studentNumber] as [string, string]] : [];
        }),
      ),
      track: uniqueFilterOptions(
        rows.flatMap((exemption) => {
          const track = memberById.get(exemption.memberId)?.track;
          return track ? [[track, track] as [string, string]] : [];
        }),
      ),
      reason: uniqueFilterOptions(rows.map((exemption) => [exemption.reason, exemption.reason])),
      startMonth: uniqueFilterOptions(
        rows.map((exemption) => [exemption.startMonth, formatMonth(exemption.startMonth)]),
      ),
      endMonth: uniqueFilterOptions(
        rows.map((exemption) => [exemption.endMonth ?? OPEN_END_FILTER_VALUE, formatMonth(exemption.endMonth)]),
      ),
      note: uniqueFilterOptions(
        rows.map((exemption) => [exemption.note || EMPTY_NOTE_FILTER_VALUE, exemption.note || '비고 없음']),
      ),
    }),
    [memberById, rows],
  );
  const filteredRows = rows.filter((exemption) => {
    const member = memberById.get(exemption.memberId);
    if (!member) return false;
    const values: Record<ExemptionFilterKey, string> = {
      member: member.id,
      studentNumber: member.studentNumber,
      track: member.track,
      reason: exemption.reason,
      startMonth: exemption.startMonth,
      endMonth: exemption.endMonth ?? OPEN_END_FILTER_VALUE,
      note: exemption.note || EMPTY_NOTE_FILTER_VALUE,
    };
    return FILTER_CONFIG.every(({ key }) => filters[key].length === 0 || filters[key].includes(values[key]));
  });
  const hasActiveFilters = FILTER_CONFIG.some(({ key }) => filters[key].length > 0);
  const months = useMemo(() => semesterMonths(semester), [semester]);
  const tracks = useMemo(() => [...new Set(members.map((member) => member.track))], [members]);
  const periodRecords = useMemo(
    () =>
      exemptions
        .filter((exemption) => months.some((month) => monthIsInExemption(month, exemption)))
        .sort((a, b) => {
          const firstMember = memberById.get(a.memberId);
          const secondMember = memberById.get(b.memberId);
          const trackDifference = tracks.indexOf(firstMember?.track ?? '') - tracks.indexOf(secondMember?.track ?? '');
          return (
            trackDifference ||
            periodPriority(a) - periodPriority(b) ||
            (memberOrder.get(a.memberId) ?? Number.MAX_SAFE_INTEGER) -
              (memberOrder.get(b.memberId) ?? Number.MAX_SAFE_INTEGER) ||
            a.startMonth.localeCompare(b.startMonth)
          );
        }),
    [exemptions, memberById, memberOrder, months, tracks],
  );

  useEffect(() => {
    function closeFilter(event: PointerEvent) {
      if (!(event.target instanceof Element) || !event.target.closest('[data-dues-filter]')) setOpenFilter(null);
    }
    function closeWithEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpenFilter(null);
    }
    document.addEventListener('pointerdown', closeFilter, true);
    document.addEventListener('keydown', closeWithEscape);
    return () => {
      document.removeEventListener('pointerdown', closeFilter, true);
      document.removeEventListener('keydown', closeWithEscape);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  function flash(message: string, tone: 'success' | 'neutral' = 'success') {
    setToast({ message, tone });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }

  function setFilterValues(key: ExemptionFilterKey, values: string[]) {
    setFilters((current) => ({ ...current, [key]: values }));
  }

  function resetFilters() {
    setFilters(emptyFilterState());
    setFilterQueries(emptyFilterQueries());
    setOpenFilter(null);
  }

  function openAdd() {
    setFlow({
      name: 'form',
      editingId: null,
      draft: defaultDraft(),
      isNewReason: false,
      periodKind: 'closed',
      isEditing: true,
    });
  }

  function openDetail(exemption: ExemptionPeriod) {
    setFlow({
      name: 'form',
      editingId: exemption.id,
      draft: {
        memberId: exemption.memberId,
        reason: exemption.reason,
        note: exemption.note,
        startMonth: exemption.startMonth,
        endMonth: exemption.endMonth,
      },
      isNewReason: false,
      periodKind: periodKindOf(exemption),
      isEditing: false,
    });
  }

  function resetToDetail(editingId: string) {
    const exemption = exemptions.find((item) => item.id === editingId);
    if (exemption) openDetail(exemption);
  }

  function continueFromForm() {
    if (!flow || flow.name !== 'form' || !flow.draft.reason.trim()) return;
    const draft = { ...flow.draft, reason: flow.draft.reason.trim().normalize('NFC') };
    if (!exemptionReasons.includes(draft.reason)) setFlow({ name: 'new-reason', editingId: flow.editingId, draft });
    else if (flow.editingId) applyDraft(flow.editingId, draft);
    else setFlow({ name: 'impact', editingId: flow.editingId, draft });
  }

  function applyDraft(editingId: string | null, draft: ExemptionDraft) {
    setExemptions((current) => replaceExemption(current, editingId, draft));
    if (!exemptionReasons.includes(draft.reason)) setExemptionReasons((current) => [...current, draft.reason]);
    setFlow(null);
    flash(editingId ? '면제 사유를 수정했습니다.' : '면제 사유를 추가했습니다.');
  }

  function previewMembers(editingId: string | null, draft: ExemptionDraft) {
    return deriveSemesterMembers(
      CURRENT_SEMESTER_MEMBERS,
      ledgerEntries,
      replaceExemption(exemptions, editingId, draft),
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1480px] min-w-0 px-8 pt-6 pb-12">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div>
          <div className="text-faint mb-1.5 text-[10.5px] font-bold tracking-[0.16em]">장부 · 회비 관리</div>
          <h1 className="text-2xl font-extrabold tracking-[-0.02em]">
            {viewMode === 'member' ? '회원별 면제 사유 목록' : `${semester.year}년도 ${semester.term}학기`}
          </h1>
        </div>
        <div
          className="border-line2 bg-panel2 ml-auto flex rounded-[9px] border p-0.5"
          aria-label="면제 사유 보기 전환"
        >
          {(
            [
              ['member', '회원별 보기'],
              ['period', '기간별 보기'],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              aria-pressed={viewMode === mode}
              onClick={() => {
                setViewMode(mode);
                if (mode === 'period') setOpenFilter(null);
              }}
              className={`cursor-pointer rounded-[7px] px-3 py-2 text-xs font-semibold transition-colors ${
                viewMode === mode ? 'bg-panel text-primary-text shadow-sm' : 'text-muted hover:text-text'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <Button variant="primary" className="px-4 py-2.5" onClick={openAdd}>
          + 면제 사유 추가
        </Button>
      </div>

      {viewMode === 'period' && (
        <div className="border-line bg-panel mb-4 flex items-center justify-between rounded-[11px] border px-3 py-2.5">
          <Button aria-label="이전 학기" onClick={() => setSemester((current) => moveSemester(current, -1))}>
            ← 이전 학기
          </Button>
          <div className="text-center">
            <div className="text-sm font-bold">
              {semester.year}년도 {semester.term}학기
            </div>
            <div className="text-faint mt-1 text-[10.5px]">
              {formatMonth(months[0])} ~ {formatMonth(months[5])}
            </div>
          </div>
          <Button aria-label="다음 학기" onClick={() => setSemester((current) => moveSemester(current, 1))}>
            다음 학기 →
          </Button>
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
      ) : viewMode === 'member' ? (
        <div className="border-line bg-panel rounded-[13px] border">
          <div className="overflow-visible">
            <table className="w-full min-w-[920px] border-collapse text-left">
              <thead className="bg-panel2">
                <tr className="border-line border-b">
                  {FILTER_CONFIG.map(({ key, label, placeholder }) => {
                    const query = filterQueries[key];
                    const visibleOptions = filterOptions[key].filter((option) =>
                      `${option.label} ${option.value}`
                        .toLocaleLowerCase('ko-KR')
                        .includes(query.trim().toLocaleLowerCase('ko-KR')),
                    );
                    return (
                      <HeaderFilter
                        key={key}
                        label={label}
                        active={filters[key].length > 0}
                        open={openFilter === key}
                        onToggle={() => setOpenFilter(openFilter === key ? null : key)}
                        align={key === 'note' ? 'right' : 'left'}
                      >
                        <SearchableCheckboxFilter
                          query={query}
                          placeholder={placeholder}
                          options={visibleOptions}
                          selected={filters[key]}
                          inputMode={
                            key === 'studentNumber' || key === 'startMonth' || key === 'endMonth' ? 'numeric' : 'text'
                          }
                          pattern={
                            key === 'studentNumber'
                              ? '[0-9]*'
                              : key === 'startMonth' || key === 'endMonth'
                                ? '[0-9-]*'
                                : undefined
                          }
                          maxLength={key === 'startMonth' || key === 'endMonth' ? 7 : undefined}
                          onQueryChange={(value) =>
                            setFilterQueries((current) => ({
                              ...current,
                              [key]:
                                key === 'studentNumber'
                                  ? value.replace(/\D/g, '')
                                  : key === 'startMonth' || key === 'endMonth'
                                    ? normalizeMonthInput(value)
                                    : value,
                            }))
                          }
                          onChange={(values) => setFilterValues(key, values)}
                        />
                      </HeaderFilter>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {filteredRows.length > 0 ? (
                  filteredRows.map((exemption, index) => {
                    const member = memberById.get(exemption.memberId);
                    if (!member) return null;
                    const groupStart = index === 0 || filteredRows[index - 1].memberId !== exemption.memberId;
                    const groupEnd =
                      index === filteredRows.length - 1 || filteredRows[index + 1].memberId !== exemption.memberId;
                    return (
                      <tr
                        key={exemption.id}
                        role="button"
                        tabIndex={0}
                        aria-label={`${member.name} ${exemption.reason} 면제 사유 상세 보기`}
                        onClick={() => openDetail(exemption)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            openDetail(exemption);
                          }
                        }}
                        className={
                          groupEnd
                            ? 'border-line hover:bg-panel2 focus-visible:outline-primary cursor-pointer border-b transition-colors last:border-b-0 focus-visible:outline-2 focus-visible:outline-offset-[-2px]'
                            : 'border-line hover:bg-panel2 focus-visible:outline-primary cursor-pointer border-b border-dashed transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px]'
                        }
                      >
                        <td className="px-2.5 py-2.5 text-[12.5px] font-medium">{groupStart ? member.name : ''}</td>
                        <td className="text-muted px-2.5 py-2.5 text-xs">{groupStart ? member.studentNumber : ''}</td>
                        <td className="text-muted px-2.5 py-2.5 text-xs">{groupStart ? member.track : ''}</td>
                        <td className="px-2.5 py-2.5 text-[12.5px]">{exemption.reason}</td>
                        <td className="px-2.5 py-2.5 text-[12.5px]">{formatMonth(exemption.startMonth)}</td>
                        <td className="text-muted px-2.5 py-2.5 text-[12.5px]">{formatMonth(exemption.endMonth)}</td>
                        <td className="text-muted max-w-[260px] px-2.5 py-2.5 text-xs">{exemption.note || '—'}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8">
                      <div className="border-dash mx-auto flex max-w-[430px] flex-col items-center justify-center rounded-[13px] border border-dashed px-8 py-6 text-center">
                        <strong className="text-text text-[14px]">조건에 맞는 면제 사유 기록이 없습니다.</strong>
                        {hasActiveFilters && (
                          <button
                            type="button"
                            onClick={resetFilters}
                            className="text-primary-text mt-2 cursor-pointer border-0 bg-transparent px-2 py-1 text-xs font-semibold hover:underline"
                          >
                            초기화
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <PeriodExemptionTable
          months={months}
          tracks={tracks}
          records={periodRecords}
          memberById={memberById}
          memberOrder={memberOrder}
          onOpenDetail={openDetail}
        />
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
          onCancelEdit={() => flow.editingId && resetToDetail(flow.editingId)}
          onContinue={continueFromForm}
        />
      )}

      {flow?.name === 'new-reason' && (
        <SimpleDialog
          title="새로운 면제 사유"
          onClose={() => setFlow(null)}
          onBack={() =>
            setFlow({
              ...flow,
              name: 'form',
              isNewReason: true,
              periodKind: periodKindOf({ ...flow.draft, id: '' }),
              isEditing: true,
            })
          }
          onConfirm={() =>
            flow.editingId ? applyDraft(flow.editingId, flow.draft) : setFlow({ ...flow, name: 'impact' })
          }
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
                        isEditing: true,
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
      {toast && <Toast message={toast.message} tone={toast.tone} />}
    </main>
  );
}

function SearchableCheckboxFilter({
  query,
  placeholder,
  options,
  selected,
  inputMode,
  pattern,
  maxLength,
  onQueryChange,
  onChange,
}: {
  query: string;
  placeholder: string;
  options: FilterOption<string>[];
  selected: string[];
  inputMode: 'text' | 'numeric';
  pattern?: string;
  maxLength?: number;
  onQueryChange: (value: string) => void;
  onChange: (values: string[]) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <input
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        pattern={pattern}
        maxLength={maxLength}
        className="border-line2 bg-panel focus:border-primary-line h-9 rounded-[8px] border px-2.5 text-xs outline-none"
        autoFocus
      />
      <CheckboxFilter options={options} selected={selected} onChange={onChange} />
      {options.length === 0 && <p className="text-faint py-2 text-center text-xs">검색 결과가 없습니다.</p>}
    </div>
  );
}

function PeriodExemptionTable({
  months,
  tracks,
  records,
  memberById,
  memberOrder,
  onOpenDetail,
}: {
  months: string[];
  tracks: string[];
  records: ExemptionPeriod[];
  memberById: Map<string, MemberDues>;
  memberOrder: Map<string, number>;
  onOpenDetail: (exemption: ExemptionPeriod) => void;
}) {
  const roleRecords = (track: string, role: FixedRole) =>
    records
      .filter((record) => memberById.get(record.memberId)?.track === track && fixedRoleOf(record) === role)
      .sort(
        (a, b) =>
          (memberOrder.get(a.memberId) ?? Number.MAX_SAFE_INTEGER) -
            (memberOrder.get(b.memberId) ?? Number.MAX_SAFE_INTEGER) || a.startMonth.localeCompare(b.startMonth),
      );
  const otherRecordsByTrack = tracks
    .map((track) => ({
      track,
      records: records.filter(
        (record) => memberById.get(record.memberId)?.track === track && fixedRoleOf(record) === null,
      ),
    }))
    .filter((group) => group.records.length > 0);

  return (
    <div className="border-line bg-panel w-full max-w-full min-w-0 overflow-hidden rounded-[13px] border">
      <div className="w-full max-w-full min-w-0 overflow-x-auto overscroll-x-contain" aria-label="학기별 면제 사유 표">
        <table className="w-full min-w-[860px] table-fixed border-collapse text-left">
          <colgroup>
            <col className="w-[92px]" />
            <col className="w-[168px]" />
            {months.map((month) => (
              <col key={month} style={{ width: 'calc((100% - 260px) / 6)' }} />
            ))}
          </colgroup>
          <thead className="bg-panel2">
            <tr className="border-line border-b">
              <th className="text-faint bg-panel2 sticky left-0 z-20 px-2 py-2 text-[10.5px] font-bold">트랙</th>
              <th className="text-faint bg-panel2 sticky left-[92px] z-20 px-2 py-2 text-[10.5px] font-bold shadow-[1px_0_0_var(--line)]">
                대상 · 면제 사유
              </th>
              {months.map((month) => {
                const [year, monthNumber] = month.split('-').map(Number);
                return (
                  <th key={month} className="text-faint px-1.5 py-2 text-center text-[10.5px] font-bold">
                    {year}년도 {monthNumber}월
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {tracks.flatMap((track) =>
              (
                [
                  ['track-leader', '트랙장'],
                  ['education-leader', '교육장'],
                ] as const
              ).map(([role, label], roleIndex) => {
                const matchingRecords = roleRecords(track, role);
                return (
                  <tr
                    key={`${track}-${role}`}
                    className={roleIndex === 1 ? 'border-line border-b' : 'border-dash border-b border-dashed'}
                  >
                    {roleIndex === 0 && (
                      <th
                        rowSpan={2}
                        scope="rowgroup"
                        title={track}
                        className="border-line bg-panel sticky left-0 z-10 border-r px-2 py-1.5 text-[11px] font-bold break-words"
                      >
                        {track}
                      </th>
                    )}
                    <th
                      scope="row"
                      className="text-muted bg-panel sticky left-[92px] z-10 px-2 py-1.5 text-[11px] font-semibold shadow-[1px_0_0_var(--line)]"
                    >
                      {label}
                    </th>
                    {months.map((month) => (
                      <PeriodMonthCell
                        key={month}
                        month={month}
                        records={matchingRecords}
                        itemLabel="member"
                        memberById={memberById}
                        onOpenDetail={onOpenDetail}
                      />
                    ))}
                  </tr>
                );
              }),
            )}

            <tr className="border-line bg-panel2 border-y">
              <th colSpan={8} className="text-faint px-2 py-1.5 text-[10.5px] font-bold tracking-[0.06em]">
                기타 면제 사유
              </th>
            </tr>
            {otherRecordsByTrack.length > 0 ? (
              otherRecordsByTrack.flatMap((group) =>
                group.records.map((record) => {
                  const member = memberById.get(record.memberId);
                  if (!member) return null;
                  return (
                    <tr key={record.id} className="border-line border-b last:border-b-0">
                      <th
                        colSpan={2}
                        scope="row"
                        title={`${member.name} · ${member.track} · ${formatMonth(record.startMonth)} ~ ${formatMonth(record.endMonth)}`}
                        className="border-line bg-panel sticky left-0 z-10 border-r px-2 py-2 break-words shadow-[1px_0_0_var(--line)]"
                      >
                        <span className="text-[11px] font-semibold">{member.name}</span>
                        <span className="text-muted ml-1.5 text-[10.5px] font-normal">{member.track}</span>
                        <span className="text-faint ml-1.5 text-[10px] font-normal">
                          {formatMonth(record.startMonth)} ~ {formatMonth(record.endMonth)}
                        </span>
                      </th>
                      {months.map((month) => (
                        <PeriodMonthCell
                          key={month}
                          month={month}
                          records={[record]}
                          itemLabel="reason"
                          memberById={memberById}
                          onOpenDetail={onOpenDetail}
                        />
                      ))}
                    </tr>
                  );
                }),
              )
            ) : (
              <tr>
                <td colSpan={8} className="text-faint px-3 py-4 text-center text-[11px]">
                  이 학기에 해당하는 기타 면제 사유가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PeriodMonthCell({
  month,
  records,
  itemLabel,
  memberById,
  onOpenDetail,
}: {
  month: string;
  records: ExemptionPeriod[];
  itemLabel: 'member' | 'reason';
  memberById: Map<string, MemberDues>;
  onOpenDetail: (exemption: ExemptionPeriod) => void;
}) {
  const matchingRecords = records.filter((record) => monthIsInExemption(month, record));

  return (
    <td className="border-line overflow-hidden border-l px-1.5 py-1 align-middle">
      {matchingRecords.length > 0 ? (
        <div className="flex w-full min-w-0 flex-col gap-1">
          {matchingRecords.map((record) => {
            const member = memberById.get(record.memberId);
            if (!member) return null;
            return (
              <button
                key={record.id}
                type="button"
                title={`${member.name} · ${record.reason}`}
                aria-label={`${month} ${member.name} ${record.reason} 면제 사유 상세 보기`}
                onClick={() => onOpenDetail(record)}
                className="border-primary-line bg-primary-soft text-primary-text hover:bg-primary-sunken focus-visible:outline-primary flex w-full min-w-0 cursor-pointer items-center justify-center overflow-hidden rounded-[6px] border px-1.5 py-1 text-center text-[10.5px] font-semibold transition-colors focus-visible:outline-2"
              >
                <span className="block truncate">{itemLabel === 'member' ? member.name : record.reason}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-faint py-1 text-center text-[10.5px]">—</div>
      )}
    </td>
  );
}

function ExemptionFormModal({
  flow,
  members,
  reasons,
  onChange,
  onClose,
  onCancelEdit,
  onContinue,
}: {
  flow: Extract<NonNullable<Flow>, { name: 'form' }>;
  members: MemberDues[];
  reasons: string[];
  onChange: (flow: Flow) => void;
  onClose: () => void;
  onCancelEdit: () => void;
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
  const invalidStartMonth = !isValidMonth(flow.draft.startMonth);
  const invalidEndMonth =
    flow.periodKind === 'closed' &&
    (!isValidMonth(flow.draft.endMonth) || (flow.draft.endMonth ?? '') < flow.draft.startMonth);
  const invalid = !flow.draft.reason.trim() || invalidStartMonth || invalidEndMonth;
  const member = members.find((item) => item.id === flow.draft.memberId);
  const isReadOnly = flow.editingId !== null && !flow.isEditing;

  return (
    <Modal
      title={flow.editingId ? '면제 사유 상세' : '면제 사유 추가'}
      onClose={onClose}
      width="560px"
      footer={
        isReadOnly ? (
          <>
            <Button variant="primary" className="ml-auto" onClick={() => onChange({ ...flow, isEditing: true })}>
              수정
            </Button>
            <Button onClick={onClose}>닫기</Button>
          </>
        ) : (
          <>
            <Button variant="primary" className="ml-auto" disabled={invalid} onClick={onContinue}>
              저장
            </Button>
            <Button onClick={flow.editingId ? onCancelEdit : onClose}>취소</Button>
          </>
        )
      }
    >
      {isReadOnly ? (
        <div className="px-[22px] py-5">
          <dl className="grid grid-cols-[96px_1fr] items-center gap-x-4 gap-y-4 text-[13px]">
            <dt className="text-faint">회원</dt>
            <dd className="font-semibold">
              {member ? `${member.name} · ${member.studentNumber} · ${member.track}` : '—'}
            </dd>
            <dt className="text-faint">면제 사유</dt>
            <dd>{flow.draft.reason}</dd>
            <dt className="text-faint">기간</dt>
            <dd>
              {formatMonth(flow.draft.startMonth)}
              {flow.periodKind !== 'single' && ` ~ ${formatMonth(flow.draft.endMonth)}`}
            </dd>
            <dt className="text-faint self-start pt-0.5">비고</dt>
            <dd className={`leading-5 ${flow.draft.note ? '' : 'text-faint'}`}>{flow.draft.note || '—'}</dd>
          </dl>
        </div>
      ) : (
        <div className="flex flex-col gap-4 px-[22px] py-5">
          <label className="text-muted flex flex-col gap-2 text-[11.5px]">
            회원
            <select
              value={flow.draft.memberId}
              disabled={flow.editingId !== null}
              onChange={(event) => updateDraft({ memberId: event.target.value })}
              className="border-line bg-panel2 text-text h-[42px] rounded-[9px] border px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {members.map((memberOption) => (
                <option key={memberOption.id} value={memberOption.id}>
                  {memberOption.name} · {memberOption.studentNumber} · {memberOption.track}
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
          <label className="text-muted flex flex-col gap-2 text-[11.5px]">
            비고
            <textarea
              value={flow.draft.note}
              onChange={(event) => updateDraft({ note: event.target.value })}
              placeholder="필요한 내용을 입력하세요."
              maxLength={200}
              rows={3}
              className="border-line bg-panel2 text-text resize-none rounded-[9px] border px-3 py-2.5 text-sm"
            />
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
                type="text"
                inputMode="numeric"
                maxLength={7}
                placeholder="YYYY-MM"
                aria-label="시작 월"
                aria-invalid={invalidStartMonth}
                value={flow.draft.startMonth}
                onChange={(event) =>
                  updateDraft({
                    startMonth: normalizeMonthInput(event.target.value),
                    ...(flow.periodKind === 'single' ? { endMonth: normalizeMonthInput(event.target.value) } : {}),
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
                      type="text"
                      inputMode="numeric"
                      maxLength={7}
                      placeholder="YYYY-MM"
                      aria-label="종료 월"
                      aria-invalid={invalidEndMonth}
                      value={flow.draft.endMonth ?? ''}
                      onChange={(event) => updateDraft({ endMonth: normalizeMonthInput(event.target.value) })}
                      className="border-line bg-panel2 h-[42px] w-[150px] rounded-[9px] border px-3 text-sm"
                    />
                  )}
                </>
              )}
            </div>
            {(invalidStartMonth || invalidEndMonth) && (
              <p className="text-danger mt-2 text-[11px]">기간을 YYYY-MM 형식의 유효한 숫자로 입력하세요.</p>
            )}
          </div>
        </div>
      )}
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
