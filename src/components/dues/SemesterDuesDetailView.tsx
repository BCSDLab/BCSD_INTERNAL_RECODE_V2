'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { DUES_MONTHS, SEMESTER_DUES_SUMMARIES } from '@/components/dues/initial-data';
import type {
  MemberDues,
  MonthDuesStatus,
  RefundStatus,
  SemesterDuesStatus,
  SemesterDuesSummary,
} from '@/components/dues/types';

type FilterKey = 'name' | 'track' | 'error' | 'status';
type ErrorKind = 'surplus' | 'exact' | 'shortage' | 'not-applicable';
type ActionableRefundStatus = Extract<RefundStatus, 'needed' | 'partial'>;
type FilteredDuesStatus = Exclude<SemesterDuesStatus, 'partial'>;
type StateFilter = `dues-${FilteredDuesStatus}` | 'refund-needed';

interface FilterOption<T extends string> {
  value: T;
  label: string;
}

const STATUS_LABELS: Record<SemesterDuesStatus, string> = {
  paid: '완료',
  partial: '미납',
  unpaid: '미납',
  exempt: '면제',
  overpaid: '초과 납부',
};

const REFUND_LABELS: Record<ActionableRefundStatus, string> = {
  needed: '반환 필요',
  partial: '반환 필요',
};

const ERROR_OPTIONS: FilterOption<ErrorKind>[] = [
  { value: 'surplus', label: '초과 (+)' },
  { value: 'exact', label: '일치 (0)' },
  { value: 'shortage', label: '부족 (-)' },
  { value: 'not-applicable', label: '비대상' },
];

const STATE_OPTIONS: FilterOption<StateFilter>[] = [
  { value: 'dues-paid', label: '완료' },
  { value: 'dues-unpaid', label: '미납' },
  { value: 'dues-exempt', label: '면제' },
  { value: 'dues-overpaid', label: '초과 납부' },
  { value: 'refund-needed', label: '반환 필요' },
];

const MONTH_CLASSES: Record<MonthDuesStatus, string> = {
  paid: 'bg-success',
  exempt: 'bg-primary',
  unpaid: 'bg-danger',
  'not-applicable': 'bg-sunken border-x border-dashed border-dash',
};

function memberError(member: MemberDues) {
  if (member.assessedAmount === null || member.paidAmount === null) return null;
  return member.paidAmount - member.assessedAmount;
}

function errorKind(member: MemberDues): ErrorKind {
  const error = memberError(member);
  if (error === null) return 'not-applicable';
  if (error > 0) return 'surplus';
  if (error < 0) return 'shortage';
  return 'exact';
}

function stateKeys(member: MemberDues): StateFilter[] {
  const duesStatus = member.status === 'partial' ? 'unpaid' : member.status;
  const keys: StateFilter[] = [`dues-${duesStatus}`];
  if (member.refundStatus === 'needed' || member.refundStatus === 'partial') keys.push('refund-needed');
  return keys;
}

function formatAmount(amount: number | null) {
  return amount === null ? '—' : amount.toLocaleString('ko-KR');
}

function semesterHref(semesterId: string) {
  return semesterId === SEMESTER_DUES_SUMMARIES[0].id ? '/ledger/dues' : `/ledger/dues/${semesterId}`;
}

function HeaderFilter({
  label,
  active,
  open,
  onToggle,
  align = 'left',
  children,
}: {
  label: string;
  active: boolean;
  open: boolean;
  onToggle: () => void;
  align?: 'left' | 'right';
  children: ReactNode;
}) {
  return (
    <th
      data-dues-filter
      className={`relative px-2.5 py-2 text-[10.5px] font-bold ${align === 'right' ? 'text-right' : ''}`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={`hover:bg-panel inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 transition-colors ${
          active ? 'bg-primary-soft text-primary-text' : 'text-muted'
        }`}
      >
        {label}
        <span aria-hidden="true" className="text-[9px]">
          {open ? '▴' : '▾'}
        </span>
      </button>
      {open && (
        <div
          className={`border-line bg-panel text-text absolute top-full z-50 mt-1 min-w-[220px] rounded-[10px] border p-3 text-left font-normal shadow-xl ${
            align === 'right' ? 'right-2' : 'left-2'
          }`}
        >
          {children}
        </div>
      )}
    </th>
  );
}

function CheckboxFilter<T extends string>({
  options,
  selected,
  onChange,
}: {
  options: FilterOption<T>[];
  selected: T[];
  onChange: (values: T[]) => void;
}) {
  function toggle(value: T) {
    onChange(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  }

  return (
    <div className="flex max-h-60 flex-col gap-1 overflow-y-auto">
      <label className="hover:bg-panel2 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium">
        <input type="checkbox" checked={selected.length === 0} onChange={() => onChange([])} />
        전체
      </label>
      {options.map((option) => (
        <label
          key={option.value}
          className="hover:bg-panel2 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs"
        >
          <input type="checkbox" checked={selected.includes(option.value)} onChange={() => toggle(option.value)} />
          {option.label}
        </label>
      ))}
    </div>
  );
}

function StatusChip({ status }: { status: SemesterDuesStatus }) {
  const tone =
    status === 'paid'
      ? 'border-success-line bg-success-soft text-text'
      : status === 'unpaid' || status === 'partial'
        ? 'border-danger-line bg-danger-soft text-danger'
        : status === 'overpaid'
          ? 'border-primary-line bg-primary-soft text-primary-text'
          : 'border-line2 bg-panel text-text';

  return (
    <span
      className={`${tone} inline-flex rounded-full border px-2.5 py-[3px] text-[10.5px] font-semibold whitespace-nowrap`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function RefundChip({ status }: { status: ActionableRefundStatus }) {
  return (
    <span className="border-danger-line bg-danger-soft text-danger inline-flex rounded-full border px-2.5 py-[3px] text-[10.5px] font-semibold whitespace-nowrap">
      {REFUND_LABELS[status]}
    </span>
  );
}

function SummaryGroup({ items, pushRight = false }: { items: Array<[string, string]>; pushRight?: boolean }) {
  return (
    <div className={`border-line bg-panel flex overflow-hidden rounded-[11px] border ${pushRight ? 'ml-auto' : ''}`}>
      {items.map(([label, value], index) => (
        <div key={label} className={`px-4 py-2.5 ${index > 0 ? 'border-line border-l' : ''}`}>
          <div className="text-faint text-[10.5px]">{label}</div>
          <div className="mt-0.5 text-[16px] font-bold">{value}</div>
        </div>
      ))}
    </div>
  );
}

export function SemesterDuesDetailView({
  semester,
  members,
}: {
  semester: SemesterDuesSummary;
  members: MemberDues[];
}) {
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null);
  const [nameQuery, setNameQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [selectedErrors, setSelectedErrors] = useState<ErrorKind[]>([]);
  const [selectedStates, setSelectedStates] = useState<StateFilter[]>([]);

  const nameOptions = useMemo(
    () => members.map((member) => ({ value: member.id, label: `${member.name} · ${member.studentNumber}` })),
    [members],
  );
  const visibleNameOptions = nameOptions.filter((option) =>
    option.label.toLocaleLowerCase('ko-KR').includes(nameQuery.trim().toLocaleLowerCase('ko-KR')),
  );
  const trackOptions = useMemo(
    () => [...new Set(members.map((member) => member.track))].sort().map((track) => ({ value: track, label: track })),
    [members],
  );
  const filteredMembers = members
    .filter(
      (member) =>
        (selectedMembers.length === 0 || selectedMembers.includes(member.id)) &&
        (selectedTracks.length === 0 || selectedTracks.includes(member.track)) &&
        (selectedErrors.length === 0 || selectedErrors.includes(errorKind(member))) &&
        (selectedStates.length === 0 || stateKeys(member).some((state) => selectedStates.includes(state))),
    )
    .sort(
      (first, second) =>
        Number(first.months.some((month) => month.status === 'not-applicable')) -
        Number(second.months.some((month) => month.status === 'not-applicable')),
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
    };
  }, []);

  function resetFilters() {
    setSelectedMembers([]);
    setSelectedTracks([]);
    setSelectedErrors([]);
    setSelectedStates([]);
    setNameQuery('');
    setOpenFilter(null);
  }

  return (
    <main className="mx-auto w-full max-w-[1480px] px-8 pt-6 pb-12">
      <div className="text-faint mb-1.5 text-[10.5px] font-bold tracking-[0.16em]">장부 · 회비 관리</div>
      <h1 className="text-[25px] font-extrabold tracking-[-0.02em]">회비 관리</h1>

      <section aria-label="학기 회비 목록" className="mt-5">
        <div className="text-muted mb-2 text-[11px] font-bold">학기별 회비</div>
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-max gap-2.5">
            {SEMESTER_DUES_SUMMARIES.map((item, index) => {
              const active = item.id === semester.id;
              return (
                <Link
                  key={item.id}
                  href={semesterHref(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`w-[236px] rounded-[12px] border p-3 transition-colors ${
                    active ? 'border-primary-line bg-primary-soft' : 'border-line bg-panel hover:border-primary-line'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <strong className={`text-[13px] ${active ? 'text-primary-text' : 'text-text'}`}>
                      {item.shortLabel}
                    </strong>
                    {index === 0 && (
                      <span className="bg-primary text-on-primary rounded-full px-2 py-0.5 text-[9.5px] font-bold">
                        최신
                      </span>
                    )}
                    {item.needsReview && (
                      <span className="border-danger-line bg-danger-soft text-danger ml-auto rounded-full border px-2 py-0.5 text-[9.5px] font-semibold">
                        확인 필요
                      </span>
                    )}
                  </div>
                  <div className="text-muted mt-2 flex gap-3 text-[10.5px]">
                    <span>납부대상 {item.targetMembers}명</span>
                    <span>완료 {item.completedMembers}명</span>
                    <span>미납 {item.unpaidMembers}명</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <div className="mt-5">
        <h2 className="text-[21px] font-extrabold tracking-[-0.02em]">{semester.title}</h2>
        <p className="text-muted mt-1 text-xs">회원별 부과액·납부액·오차와 상태를 한눈에 확인하세요.</p>
      </div>

      <div className="mt-[18px] flex flex-wrap gap-3.5">
        <SummaryGroup
          items={[
            ['전체', `${semester.totalMembers}명`],
            ['면제', `${semester.exemptMembers}명`],
            ['납부대상', `${semester.targetMembers}명`],
          ]}
        />
        <SummaryGroup
          items={[
            ['미납', `${semester.unpaidMembers}명`],
            ['완료', `${semester.completedMembers}명`],
          ]}
        />
        <SummaryGroup
          pushRight
          items={[
            ['총액', semester.totalAmount.toLocaleString('ko-KR')],
            ['납부액', semester.paidAmount.toLocaleString('ko-KR')],
            ['미납액', semester.unpaidAmount.toLocaleString('ko-KR')],
          ]}
        />
      </div>

      <section className="border-line bg-panel mt-7 rounded-[13px] border">
        <div className="overflow-visible">
          <table className="w-full min-w-[1060px] border-collapse text-left">
            <thead className="bg-panel2">
              <tr className="border-line border-b">
                <HeaderFilter
                  label="이름"
                  active={selectedMembers.length > 0}
                  open={openFilter === 'name'}
                  onToggle={() => setOpenFilter(openFilter === 'name' ? null : 'name')}
                >
                  <div className="flex flex-col gap-2">
                    <input
                      value={nameQuery}
                      onChange={(event) => setNameQuery(event.target.value)}
                      placeholder="이름·학번 검색"
                      className="border-line2 bg-panel focus:border-primary-line h-9 rounded-[8px] border px-2.5 text-xs outline-none"
                      autoFocus
                    />
                    <CheckboxFilter
                      options={visibleNameOptions}
                      selected={selectedMembers}
                      onChange={setSelectedMembers}
                    />
                    {visibleNameOptions.length === 0 && (
                      <p className="text-faint py-2 text-center text-xs">검색 결과가 없습니다.</p>
                    )}
                  </div>
                </HeaderFilter>
                <HeaderFilter
                  label="트랙"
                  active={selectedTracks.length > 0}
                  open={openFilter === 'track'}
                  onToggle={() => setOpenFilter(openFilter === 'track' ? null : 'track')}
                >
                  <CheckboxFilter options={trackOptions} selected={selectedTracks} onChange={setSelectedTracks} />
                </HeaderFilter>
                {DUES_MONTHS.map((monthLabel) => (
                  <th key={monthLabel} className="text-muted w-[48px] px-1 py-2.5 text-center text-[10.5px] font-bold">
                    {monthLabel}
                  </th>
                ))}
                <th className="text-muted w-[88px] px-2.5 py-2.5 text-right text-[10.5px] font-bold">부과액</th>
                <th className="text-muted w-[88px] px-2.5 py-2.5 text-right text-[10.5px] font-bold">납부액</th>
                <HeaderFilter
                  label="오차"
                  active={selectedErrors.length > 0}
                  open={openFilter === 'error'}
                  onToggle={() => setOpenFilter(openFilter === 'error' ? null : 'error')}
                  align="right"
                >
                  <CheckboxFilter options={ERROR_OPTIONS} selected={selectedErrors} onChange={setSelectedErrors} />
                </HeaderFilter>
                <HeaderFilter
                  label="상태"
                  active={selectedStates.length > 0}
                  open={openFilter === 'status'}
                  onToggle={() => setOpenFilter(openFilter === 'status' ? null : 'status')}
                  align="right"
                >
                  <CheckboxFilter options={STATE_OPTIONS} selected={selectedStates} onChange={setSelectedStates} />
                </HeaderFilter>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => {
                  const error = memberError(member);
                  return (
                    <tr key={member.id} className="border-line border-b last:border-b-0">
                      <td className="px-2.5 py-2 text-[12.5px] font-medium" title={member.studentNumber}>
                        {member.name}
                      </td>
                      <td className="text-muted px-2.5 py-2 text-xs">{member.track}</td>
                      {member.months.map((month, index) => (
                        <td
                          key={`${member.id}-${DUES_MONTHS[index]}`}
                          className="p-0"
                          title={`${DUES_MONTHS[index]} · ${month.description}`}
                        >
                          <span
                            role="img"
                            aria-label={`${DUES_MONTHS[index]} ${month.description}`}
                            className={`${MONTH_CLASSES[month.status]} block min-h-10 w-full border-r border-white/10`}
                          />
                        </td>
                      ))}
                      <td className="px-2.5 py-2 text-right text-xs">{formatAmount(member.assessedAmount)}</td>
                      <td className="px-2.5 py-2 text-right text-xs">{formatAmount(member.paidAmount)}</td>
                      <td
                        className={`px-2.5 py-2 text-right text-xs font-semibold ${error === null || error === 0 ? 'text-faint' : error > 0 ? 'text-primary-text' : 'text-danger'}`}
                      >
                        {error === null
                          ? '—'
                          : error > 0
                            ? `+${error.toLocaleString('ko-KR')}`
                            : error.toLocaleString('ko-KR')}
                      </td>
                      <td className="px-2.5 py-2">
                        <div className="flex flex-wrap justify-end gap-1">
                          <StatusChip status={member.status} />
                          {(member.refundStatus === 'needed' || member.refundStatus === 'partial') && (
                            <RefundChip status={member.refundStatus} />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={12} className="p-8">
                    <div className="border-dash mx-auto flex max-w-[430px] flex-col items-center justify-center rounded-[13px] border border-dashed px-8 py-6 text-center">
                      <strong className="text-text text-[14px]">조건에 맞는 장부 기록이 없습니다.</strong>
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="text-primary-text mt-2 cursor-pointer border-0 bg-transparent px-2 py-1 text-xs font-semibold hover:underline"
                      >
                        초기화
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
