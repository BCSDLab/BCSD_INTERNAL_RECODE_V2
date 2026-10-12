import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  createSemester,
  duesQueries,
  invalidateLedgerAndDues,
  ledgerQueries,
  type MemberDues,
  type MonthDuesStatus,
  type SemesterDuesStatus,
  type SemesterDuesSummary,
} from '@/entities/finance';
import { getApiErrorMessage } from '@/shared/api/error';
import { confirmDiscardChanges, useDraftGuard } from '@/shared/lib/router/use-draft-guard';
import { Button } from '@/shared/ui/button';
import { Field, INPUT_CLASS_COMPACT } from '@/shared/ui/field';
import { Toast } from '@/shared/ui/legacy-forms';
import { Modal } from '@/shared/ui/modal';

import { useDuesUi } from '../../model/dues-ui-provider';
import { DuesLedgerLinkModal } from './DuesLedgerLinkModal';
import { DuesSlackNotificationModal } from './DuesSlackNotificationModal';
import { MemberDuesLedgerModal } from './MemberDuesLedgerModal';
import { SemesterRosterModal } from './SemesterRosterModal';
import { CheckboxFilter, HeaderFilter, type FilterOption } from './TableHeaderFilter';

/** 직전 학기가 없을 때 생성 모달에 미리 채우는 월 회비. */
const DEFAULT_MONTHLY_DUES = 10000;

/** 서버도 같은 상한을 둔다(0을 더 친 오타 방지). */
const MAX_MONTHLY_DUES = 1_000_000;

/** 1 이상 MAX_MONTHLY_DUES 이하의 정수만 허용한다. 맞지 않으면 null. */
function parseMonthlyAmount(value: string) {
  if (!/^\d+$/.test(value.trim())) return null;
  const amount = Number(value.trim());
  return Number.isSafeInteger(amount) && amount >= 1 && amount <= MAX_MONTHLY_DUES ? amount : null;
}

function monthlyAmountError(value: string) {
  return /^\d+$/.test(value.trim()) && Number(value.trim()) > MAX_MONTHLY_DUES
    ? `월 회비는 ${MAX_MONTHLY_DUES.toLocaleString('ko-KR')}원 이하로 입력하세요.`
    : `1 이상 ${MAX_MONTHLY_DUES.toLocaleString('ko-KR')} 이하의 정수를 입력해 주세요.`;
}

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

function semesterLink(semesterId: string, latestSemesterId: string) {
  return semesterId === latestSemesterId
    ? { to: '/ledger/dues' as const }
    : { to: '/ledger/dues/$semesterId' as const, params: { semesterId } };
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: ledgerEntries = [] } = useQuery(ledgerQueries.entries());
  const { data: semesters = [semester] } = useQuery(duesQueries.semesters());
  const { pendingDuesToast, showDuesToastOn, clearPendingDuesToast } = useDuesUi();
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isSlackModalOpen, setIsSlackModalOpen] = useState(false);
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [monthlyAmountInput, setMonthlyAmountInput] = useState('');
  const createDraftDirty =
    isCreateModalOpen && monthlyAmountInput !== String(semesters[0]?.monthlyAmount ?? DEFAULT_MONTHLY_DUES);
  useDraftGuard(createDraftDirty);
  function closeCreate() {
    if (createDraftDirty && !confirmDiscardChanges()) return;
    setIsCreateModalOpen(false);
  }

  const monthlyAmount = parseMonthlyAmount(monthlyAmountInput);
  const search = useSearch({ from: '/_admin/ledger/dues' });
  const selectedMemberId = search.memberId;
  function updateSearch(patch: Partial<typeof search>) {
    void navigate({
      to: '/ledger/dues/$semesterId',
      params: { semesterId: semester.id },
      search: (prev) => ({ ...prev, ...patch }),
      resetScroll: false,
    });
  }
  const setSelectedMemberId = (memberId: string | null) => updateSearch({ memberId: memberId ?? undefined });
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
  const selectedMembers = search.members ?? [];
  const setSelectedMembers = (nextMembers: string[]) => updateSearch({ members: nextMembers });
  const selectedTracks = search.tracks ?? [];
  const setSelectedTracks = (tracks: string[]) => updateSearch({ tracks });
  const selectedErrors = search.errors ?? [];
  const setSelectedErrors = (errors: ErrorKind[]) => updateSearch({ errors });
  const selectedStates = search.states ?? [];
  const setSelectedStates = (states: StateFilter[]) => updateSearch({ states });
  const tableMembers = useMemo(
    () => members.filter((member) => member.months.some((month) => month.status !== 'not-applicable')),
    [members],
  );
  const unlinkedDuesCount = ledgerEntries.filter(
    (entry) => entry.category === '회비' && (!entry.duesLink || entry.linkStatus !== 'confirmed'),
  ).length;
  // 연결 버튼은 끄지 않는다 — 미납 0명 학기나 미래 학기에도 선납을 연결할 수 있어야 한다.
  // 연결할 내역이 없으면 모달 안에서 빈 상태를 보여 준다. 강조만 연결할 내역이 있을 때 한다.
  const hasUnlinkedDues = unlinkedDuesCount > 0;

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
    setIsLinkModalOpen(true);
  }

  const createSemesterMutation = useMutation({
    mutationFn: (amount: number) =>
      createSemester({ year: createTarget!.year, term: createTarget!.term, monthlyAmount: amount }),
    onSuccess: async (created) => {
      await invalidateLedgerAndDues(queryClient);
      const title = `${created.year}년 ${created.term}학기 회비`;
      showDuesToastOn(created.id, `${title}를 생성했습니다.`);
      setIsCreateModalOpen(false);
      navigate({ to: '/ledger/dues/$semesterId', params: { semesterId: created.id } });
    },
    onError: (error) => {
      setIsCreateModalOpen(false);
      flash(getApiErrorMessage(error, '학기 회비를 생성하지 못했습니다.'), 'neutral');
    },
  });

  function openCreateModal() {
    // 기본값은 직전(가장 최근) 학기의 월 회비다.
    setMonthlyAmountInput(String(semesters[0]?.monthlyAmount ?? DEFAULT_MONTHLY_DUES));
    setIsCreateModalOpen(true);
  }

  function createNextSemester() {
    if (createSemesterMutation.isPending || monthlyAmount === null) return;
    createSemesterMutation.mutate(monthlyAmount);
  }

  function resetFilters() {
    updateSearch({ members: undefined, tracks: undefined, errors: undefined, states: undefined });
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
                onClick={openCreateModal}
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
                  {...semesterLink(item.id, semesters[0].id)}
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
          <Button onClick={() => setIsRosterModalOpen(true)}>명단 관리</Button>
          <Button onClick={() => setIsSlackModalOpen(true)}>Slack 알림 전송</Button>
          <Button variant={hasUnlinkedDues ? 'primary' : 'outline'} onClick={openLinkModal}>
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
      {isRosterModalOpen && (
        <SemesterRosterModal
          semester={semester}
          onClose={() => setIsRosterModalOpen(false)}
          onSaved={(message) => {
            setIsRosterModalOpen(false);
            flash(message);
          }}
        />
      )}
      {isCreateModalOpen && createTarget && (
        <Modal
          title={`${createTarget.label} 회비를 생성할까요?`}
          onClose={closeCreate}
          width="440px"
          footer={
            <>
              <Button className="ml-auto" onClick={closeCreate}>
                취소
              </Button>
              <Button
                variant="primary"
                disabled={createSemesterMutation.isPending || monthlyAmount === null}
                onClick={createNextSemester}
              >
                생성
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-4 px-6 py-5">
            <p className="text-muted text-[13px] leading-[1.7]">
              현재 회원을 기준으로 {createTarget.label} 회비를 생성합니다.
            </p>
            <Field
              label="월 회비(원)"
              hint={
                monthlyAmount === null ? (
                  <span className="text-danger">{monthlyAmountError(monthlyAmountInput)}</span>
                ) : (
                  `한 학기(6개월) 최대 ${(monthlyAmount * 6).toLocaleString('ko-KR')}원 · 월 회비는 ${MAX_MONTHLY_DUES.toLocaleString('ko-KR')}원까지`
                )
              }
            >
              <input
                inputMode="numeric"
                value={monthlyAmountInput}
                onChange={(event) => setMonthlyAmountInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') createNextSemester();
                }}
                aria-invalid={monthlyAmount === null}
                className={INPUT_CLASS_COMPACT}
              />
            </Field>
          </div>
        </Modal>
      )}
      {selectedMemberId && tableMembers.some((member) => member.id === selectedMemberId) && (
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
