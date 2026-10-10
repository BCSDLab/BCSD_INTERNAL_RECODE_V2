'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ApiError } from '@/api/client';
import { createSemester } from '@/api/dues/api';
import { duesQueries, invalidateLedgerAndDues } from '@/api/dues/queries';
import { ledgerQueries } from '@/api/ledger/queries';
import { DuesLedgerLinkModal } from '@/components/dues/DuesLedgerLinkModal';
import { DuesSlackNotificationModal } from '@/components/dues/DuesSlackNotificationModal';
import { MemberDuesLedgerModal } from '@/components/dues/MemberDuesLedgerModal';
import { useDuesUi } from '@/components/dues/DuesUiProvider';
import { CheckboxFilter, HeaderFilter } from '@/components/dues/TableHeaderFilter';
import type { FilterOption } from '@/components/dues/TableHeaderFilter';
import type { MemberDues, MonthDuesStatus, SemesterDuesStatus, SemesterDuesSummary } from '@/components/dues/types';
import { Toast } from '@/components/ledger/LedgerUi';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

/** 한 달 회비. 학기마다 바뀔 수 있는지는 BE와 미정 — 정해지면 생성 모달에서 입력받는다. */
const DEFAULT_MONTHLY_DUES = 10000;

type FilterKey = 'name' | 'track' | 'error' | 'status';
type ErrorKind = 'surplus' | 'exact' | 'shortage' | 'not-applicable';
type StateFilter = `dues-${SemesterDuesStatus}`;

const STATUS_LABELS: Record<SemesterDuesStatus, string> = {
  paid: '완료',
  unpaid: '미납',
  exempt: '면제',
  overpaid: '초과납부',
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
  { value: 'dues-overpaid', label: '초과납부' },
];

const MONTH_CLASSES: Record<MonthDuesStatus, string> = {
  paid: 'bg-[var(--dues-month-paid)]',
  exempt: 'bg-line2',
  unpaid: 'bg-[var(--dues-month-unpaid)]',
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

function stateKey(member: MemberDues): StateFilter {
  return `dues-${member.status}`;
}

function formatAmount(amount: number | null) {
  return amount === null ? '—' : amount.toLocaleString('ko-KR');
}

function semesterHref(semesterId: string, latestSemesterId: string) {
  return semesterId === latestSemesterId ? '/ledger/dues' : `/ledger/dues/${semesterId}`;
}

function semesterMonthLabels(semesterId: string) {
  const [, termText] = semesterId.split('-');
  const term = Number(termText);
  return term === 1 ? ['3월', '4월', '5월', '6월', '7월', '8월'] : ['9월', '10월', '11월', '12월', '1월', '2월'];
}

function StatusChip({ status }: { status: SemesterDuesStatus }) {
  const tone =
    status === 'paid'
      ? 'border-success-line bg-success-soft text-text'
      : status === 'unpaid'
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: ledgerEntries = [] } = useQuery(ledgerQueries.entries());
  const { data: semesters = [semester] } = useQuery(duesQueries.semesters());
  const { pendingDuesToast, showDuesToastOn, clearPendingDuesToast } = useDuesUi();
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isSlackModalOpen, setIsSlackModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'neutral' } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const monthLabels = semesterMonthLabels(semester.id);
  // 생성 가능 여부와 만들 학기는 서버가 정한다(오늘 기준 현재 학기의 바로 다음 학기까지만).
  const { data: creatable } = useQuery(duesQueries.semesterCreatable());
  const createTarget = creatable
    ? {
        ...creatable.nextSemester,
        label: `${creatable.nextSemester.year}년도 ${creatable.nextSemester.term}학기`,
      }
    : null;
  const canCreateNextSemester = creatable?.creatable ?? false;
  const [nameQuery, setNameQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [selectedErrors, setSelectedErrors] = useState<ErrorKind[]>([]);
  const [selectedStates, setSelectedStates] = useState<StateFilter[]>([]);
  const tableMembers = useMemo(
    () => members.filter((member) => member.months.some((month) => month.status !== 'not-applicable')),
    [members],
  );
  const unlinkedDuesCount = ledgerEntries.filter(
    (entry) => entry.category === '회비' && (!entry.duesLink || entry.linkStatus !== 'confirmed'),
  ).length;
  const canLinkLedgerEntries = unlinkedDuesCount > 0 && (semester.unpaidMembers > 0 || semester.needsReview);

  const nameOptions = useMemo(
    () => tableMembers.map((member) => ({ value: member.id, label: `${member.name} · ${member.studentNumber}` })),
    [tableMembers],
  );
  const visibleNameOptions = nameOptions.filter((option) =>
    option.label.toLocaleLowerCase('ko-KR').includes(nameQuery.trim().toLocaleLowerCase('ko-KR')),
  );
  const trackOptions = useMemo(
    () =>
      [...new Set(tableMembers.map((member) => member.track))].sort().map((track) => ({ value: track, label: track })),
    [tableMembers],
  );
  const filteredMembers = tableMembers
    .filter(
      (member) =>
        (selectedMembers.length === 0 || selectedMembers.includes(member.id)) &&
        (selectedTracks.length === 0 || selectedTracks.includes(member.track)) &&
        (selectedErrors.length === 0 || selectedErrors.includes(errorKind(member))) &&
        (selectedStates.length === 0 || selectedStates.includes(stateKey(member))),
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
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    if (pendingDuesToast?.semesterId !== semester.id) return;
    flash(pendingDuesToast.message);
    clearPendingDuesToast();
  }, [clearPendingDuesToast, pendingDuesToast, semester.id]);

  function flash(message: string, tone: 'success' | 'neutral' = 'success') {
    setToast({ message, tone });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }

  function openLinkModal() {
    if (!canLinkLedgerEntries) {
      flash('이 학기에 연결 가능한 입출금 내역이 없습니다.', 'neutral');
      return;
    }
    setIsLinkModalOpen(true);
  }

  const createSemesterMutation = useMutation({
    mutationFn: () =>
      createSemester({ year: createTarget!.year, term: createTarget!.term, monthlyAmount: DEFAULT_MONTHLY_DUES }),
    onSuccess: async (created) => {
      await invalidateLedgerAndDues(queryClient);
      const title = `${created.year}년 ${created.term}학기 회비`;
      showDuesToastOn(created.id, `${title}를 생성했습니다.`);
      setIsCreateModalOpen(false);
      router.push(`/ledger/dues/${created.id}`);
    },
    onError: (error) => {
      setIsCreateModalOpen(false);
      flash(error instanceof ApiError ? error.message : '학기 회비를 생성하지 못했습니다.', 'neutral');
    },
  });

  function createNextSemester() {
    if (createSemesterMutation.isPending) return;
    createSemesterMutation.mutate();
  }

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
      <section aria-label="학기 회비 목록">
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-max gap-2.5">
            {canCreateNextSemester && (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="border-line bg-panel text-muted hover:border-primary-line hover:text-primary-text flex w-[96px] cursor-pointer items-center justify-center gap-1 rounded-[12px] border px-2.5 py-3 text-[12px] font-semibold transition-colors"
              >
                <span aria-hidden="true" className="text-[16px] leading-none">
                  +
                </span>
                회비 생성
              </button>
            )}
            {semesters.map((item, index) => {
              const active = item.id === semester.id;
              return (
                <Link
                  key={item.id}
                  href={semesterHref(item.id, semesters[0].id)}
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
                    {(item.needsReview || item.unpaidMembers > 0) && (
                      <span className="border-danger-line bg-danger-soft text-danger ml-auto rounded-full border px-2 py-0.5 text-[9.5px] font-semibold">
                        확인 필요
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <div className="mt-5 flex items-start gap-4">
        <div>
          <h1 className="text-[21px] font-extrabold tracking-[-0.02em]">{semester.title}</h1>
          <p className="text-muted mt-1 text-xs">회원별 부과액·납부액·오차와 상태를 한눈에 확인하세요.</p>
        </div>
        <div className="ml-auto flex items-center gap-2.5">
          <Button onClick={() => setIsSlackModalOpen(true)}>Slack 알림 전송</Button>
          <Button
            variant={canLinkLedgerEntries ? 'primary' : 'outline'}
            aria-disabled={!canLinkLedgerEntries}
            className={
              canLinkLedgerEntries
                ? ''
                : 'border-line2 bg-panel2 text-faint hover:border-line2 hover:text-faint cursor-not-allowed'
            }
            onClick={openLinkModal}
          >
            입출금 내역 연결
          </Button>
        </div>
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
                {monthLabels.map((monthLabel) => (
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
                  align="center"
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
                    <tr
                      key={member.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`${member.name} 회비 연결 출납내역 보기`}
                      onClick={() => setSelectedMemberId(member.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedMemberId(member.id);
                        }
                      }}
                      className="border-line hover:bg-panel2 focus-visible:outline-primary cursor-pointer border-b transition-colors last:border-b-0 focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
                    >
                      <td className="px-2.5 py-2 text-[12.5px] font-medium" title={member.studentNumber}>
                        {member.name}
                      </td>
                      <td className="text-muted px-2.5 py-2 text-xs">{member.track}</td>
                      {member.months.map((month, index) => (
                        <td
                          key={`${member.id}-${monthLabels[index]}`}
                          className="p-0"
                          title={`${monthLabels[index]} · ${month.description}`}
                        >
                          <span
                            role="img"
                            aria-label={`${monthLabels[index]} ${month.description}`}
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
                        <div className="flex justify-center">
                          <StatusChip status={member.status} />
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

      {isLinkModalOpen && (
        <DuesLedgerLinkModal
          semester={semester}
          members={tableMembers}
          onClose={() => setIsLinkModalOpen(false)}
          onLinked={(count) => {
            setIsLinkModalOpen(false);
            flash(`${count}건의 입출금 내역을 ${semester.title}에 연결했습니다.`);
          }}
        />
      )}
      {isSlackModalOpen && (
        <DuesSlackNotificationModal
          semester={semester}
          members={tableMembers}
          onClose={() => setIsSlackModalOpen(false)}
          onResult={(message, tone) => flash(message, tone)}
        />
      )}
      {isCreateModalOpen && createTarget && (
        <Modal
          title={`${createTarget.label} 회비를 생성할까요?`}
          onClose={() => setIsCreateModalOpen(false)}
          width="440px"
          footer={
            <>
              <Button className="ml-auto" onClick={() => setIsCreateModalOpen(false)}>
                취소
              </Button>
              <Button variant="primary" disabled={createSemesterMutation.isPending} onClick={createNextSemester}>
                생성
              </Button>
            </>
          }
        >
          <p className="text-muted px-6 py-5 text-[13px] leading-[1.7]">
            현재 회원을 기준으로 {createTarget.label} 회비를 생성합니다.
          </p>
        </Modal>
      )}
      {selectedMemberId && (
        <MemberDuesLedgerModal
          semester={semester}
          member={tableMembers.find((member) => member.id === selectedMemberId)!}
          onClose={() => setSelectedMemberId(null)}
        />
      )}
      {toast && <Toast message={toast.message} tone={toast.tone} />}
    </main>
  );
}
