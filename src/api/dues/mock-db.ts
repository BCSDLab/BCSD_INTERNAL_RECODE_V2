import type { Track } from '@/api/auth/types';
import type {
  ExemptionResponse,
  MemberDuesResponse,
  MonthDuesResponse,
  MonthDuesStatus,
  RefundReason,
  RefundStatus,
  SemesterDuesStatus,
  SemesterDuesSummaryResponse,
  SemesterId,
  YearMonth,
} from '@/api/dues/types';
import { INITIAL_LEDGER_ENTRIES } from '@/api/ledger/mock-seed';
import type { EvidenceResponse, LedgerCategory, LedgerEntryResponse } from '@/api/ledger/types';
import { WITHDRAWAL_EXEMPTION_REASON } from '@/components/dues/exemptions';
import type { MemberDues, MonthDues } from '@/components/dues/types';
import {
  CURRENT_SEMESTER_MEMBERS,
  getSemesterMembers,
  INITIAL_EXEMPTION_REASONS,
  INITIAL_EXEMPTIONS,
  SEMESTER_DUES_SUMMARIES,
} from './mock-seed';
import type { SeedMemberDues } from './mock-seed';

/**
 * 회비·장부 mock "서버". 백엔드가 아직 없어 api.ts가 이쪽을 부른다. 값은 메모리에만 있어 새로고침하면
 * 초기화된다. 시드는 화면 모양으로 적혀 있어 처음 한 번 DTO로 바꿔 들고, 집계는 백엔드가 할 계산
 * (예전 components/dues/derive.ts)을 그대로 흉내 낸다 — 응답 모양이 실제 API와 같아야 나중에
 * api.ts 분기만 지우면 된다.
 */

export const MOCK_MONTHLY_DUES = 10000;

const MOCK_LATENCY_MS = 120;

/** 응답은 복사본으로 돌려줘 react-query 캐시와 저장소가 서로 덮어쓰지 않게 한다. */
export function respond<T>(value: T, latency = MOCK_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), latency));
}

// ---------- 시드 → DTO 변환표 ----------

const TRACK_CODES: Record<string, Track> = {
  Backend: 'BACKEND',
  Frontend: 'FRONTEND',
  iOS: 'IOS',
  Android: 'ANDROID',
  PM: 'PM',
  Design: 'DESIGN',
  Game: 'GAME',
  'Data Analyst': 'DATA',
};

const CATEGORY_CODES: Record<string, LedgerCategory> = {
  회비: 'DUES',
  '회비 반환': 'DUES_REFUND',
  행사: 'EVENT',
  운영비: 'OPERATION',
  기타: 'ETC',
};

const REFUND_REASON_CODES: Record<string, RefundReason> = {
  '초과 납부': 'OVERPAID',
  '탈퇴 기간': 'WITHDRAWAL_PERIOD',
  '전액 면제 회원 오입금': 'EXEMPT_MEMBER_DEPOSIT',
};

const DEFAULT_MONTH_NOTES = new Set(['완료', '연결된 기록 없음', '납부 비대상']);

function trackCode(label: string): Track {
  return TRACK_CODES[label] ?? 'BACKEND';
}

function refundReasonCode(label: string | undefined): RefundReason | null {
  return label ? (REFUND_REASON_CODES[label] ?? null) : null;
}

function seedNumber(id: string) {
  return Number(id.replace(/\D/g, ''));
}

// ---------- 학기 ----------

export function parseSemesterId(semesterId: SemesterId) {
  const [yearText, termText] = semesterId.split('-');
  return { year: Number(yearText), term: (termText === '1' ? 1 : 2) as 1 | 2 };
}

export function semesterMonthsOf(semesterId: SemesterId): YearMonth[] {
  const { year, term } = parseSemesterId(semesterId);
  const monthNumbers = term === 1 ? [3, 4, 5, 6, 7, 8] : [9, 10, 11, 12, 1, 2];
  return monthNumbers.map((month) => {
    const monthYear = term === 2 && month <= 2 ? year + 1 : year;
    return `${monthYear}-${String(month).padStart(2, '0')}`;
  });
}

export function semesterLabelOf(semesterId: SemesterId) {
  const { year, term } = parseSemesterId(semesterId);
  return `${year}년 ${term}학기`;
}

// ---------- 회원 ----------

export interface MockMember {
  id: number;
  name: string;
  studentNumber: string;
  track: Track;
  /** 인명부에 저장된 Slack ID(member.slack_id). */
  slackId: string | null;
  /** 이메일로 Slack을 조회하면 나올 값 — 자동 채우기(findSlackIdByEmail) 흉내용. null이면 못 찾는다. */
  slackLookupId: string | null;
}

const memberIdByKey = new Map<string, number>();

function memberIdOf(key: string) {
  let id = memberIdByKey.get(key);
  if (id === undefined) {
    id = memberIdByKey.size + 1;
    memberIdByKey.set(key, id);
  }
  return id;
}

/** 처음부터 인명부에 Slack ID가 비어 있는 회원 — "Slack ID 입력" 흐름을 보여 주기 위한 시드. */
const MISSING_SLACK_ID_KEYS = new Set(['member-jian', 'member-seoyeon', 'member-taeo']);

/** U + 10자리 — 실제 Slack 회원 ID와 같은 형식(인명부 입력 검증을 통과한다). */
function mockSlackId(id: number) {
  return `U0DUES${String(id).padStart(5, '0')}`;
}

const members: MockMember[] = CURRENT_SEMESTER_MEMBERS.map((member) => {
  const id = memberIdOf(member.id);
  // 시드에 slackId가 없던 회원은 Slack에도 없는 것으로 친다(자동 채우기로도 못 찾음).
  const slackLookupId = member.slackId ? mockSlackId(id) : null;
  return {
    id,
    name: member.name,
    studentNumber: member.studentNumber,
    track: trackCode(member.track),
    slackId: MISSING_SLACK_ID_KEYS.has(member.id) ? null : slackLookupId,
    slackLookupId,
  };
});

export function findMember(memberId: number) {
  return members.find((member) => member.id === memberId);
}

export function listMembers() {
  return members;
}

// ---------- 학기 명단 ----------

interface RosterMonth {
  status: MonthDuesStatus;
  note: string | null;
}

interface RosterRow {
  memberId: number;
  /** false면 이 학기 납부 비대상(전 월 NOT_APPLICABLE). */
  applicable: boolean;
  baseMonths: RosterMonth[];
  /** 반환을 이미 끝낸 회원의 사유 — 시드에만 있는 값. */
  completedRefundReason: RefundReason | null;
}

interface DerivedSemester {
  monthlyAmount: number;
  roster: RosterRow[];
}

const MONTH_STATUS_CODES: Record<MonthDues['status'], MonthDuesStatus> = {
  paid: 'PAID',
  exempt: 'EXEMPT',
  unpaid: 'UNPAID',
  'not-applicable': 'NOT_APPLICABLE',
};

function monthNote(month: MonthDues) {
  return DEFAULT_MONTH_NOTES.has(month.description) ? null : month.description;
}

function rosterFromSeed(member: SeedMemberDues): RosterRow {
  return {
    memberId: memberIdOf(member.id),
    applicable: member.assessedAmount !== null,
    baseMonths: member.months.map((month) => ({
      status: MONTH_STATUS_CODES[month.status],
      note: month.status === 'exempt' ? null : monthNote(month),
    })),
    completedRefundReason: refundReasonCode(member.refundReason),
  };
}

const LIVE_SEED_SEMESTER_ID = SEMESTER_DUES_SUMMARIES[0].id;

/** 장부·면제에 따라 다시 계산되는 학기 — 시드의 현재 학기와 새로 만든 학기. */
const derivedSemesters = new Map<SemesterId, DerivedSemester>([
  [LIVE_SEED_SEMESTER_ID, { monthlyAmount: MOCK_MONTHLY_DUES, roster: CURRENT_SEMESTER_MEMBERS.map(rosterFromSeed) }],
]);

const STATUS_CODES: Record<MemberDues['status'], SemesterDuesStatus> = {
  paid: 'PAID',
  partial: 'PARTIAL',
  unpaid: 'UNPAID',
  exempt: 'EXEMPT',
  overpaid: 'OVERPAID',
};

const REFUND_STATUS_CODES: Record<MemberDues['refundStatus'], RefundStatus> = {
  none: 'NONE',
  needed: 'NEEDED',
  partial: 'PARTIAL',
  completed: 'COMPLETED',
};

function staticMemberDues(semesterId: SemesterId, member: SeedMemberDues): MemberDuesResponse {
  const months = semesterMonthsOf(semesterId);
  return {
    memberId: memberIdOf(member.id),
    name: member.name,
    studentNumber: member.studentNumber,
    track: trackCode(member.track),
    slackId: null,
    months: member.months.map((month, index) => ({
      month: months[index],
      status: MONTH_STATUS_CODES[month.status],
      exemption: null,
      note: monthNote(month),
    })),
    status: STATUS_CODES[member.status],
    assessedAmount: member.assessedAmount,
    paidAmount: member.paidAmount,
    unpaidAmount: member.unpaidAmount,
    excessAmount: member.excessAmount ?? 0,
    refundStatus: REFUND_STATUS_CODES[member.refundStatus],
    refundReason: refundReasonCode(member.refundReason),
    refundedAmount: member.refundedAmount ?? 0,
  };
}

/** 이미 마감된 지난 학기 — 집계가 고정돼 있다. */
const staticSemesters = new Map<SemesterId, { summary: SemesterDuesSummaryResponse; members: MemberDuesResponse[] }>(
  SEMESTER_DUES_SUMMARIES.slice(1).map((summary) => {
    const { year, term } = parseSemesterId(summary.id);
    return [
      summary.id,
      {
        summary: {
          id: summary.id,
          year,
          term,
          monthlyAmount: MOCK_MONTHLY_DUES,
          totalMembers: summary.totalMembers,
          exemptMembers: summary.exemptMembers,
          targetMembers: summary.targetMembers,
          completedMembers: summary.completedMembers,
          unpaidMembers: summary.unpaidMembers,
          totalAmount: summary.totalAmount,
          paidAmount: summary.paidAmount,
          unpaidAmount: summary.unpaidAmount,
          needsReview: summary.needsReview,
        },
        members: getSemesterMembers(summary.id).map((member) => staticMemberDues(summary.id, member)),
      },
    ];
  }),
);

// ---------- 장부 ----------

let nextEvidenceId = 1;
const evidenceIdByKey = new Map<string, number>();

function evidenceIdOf(key: string) {
  let id = evidenceIdByKey.get(key);
  if (id === undefined) {
    id = nextEvidenceId++;
    evidenceIdByKey.set(key, id);
  }
  return id;
}

/** 업로드는 끝났지만 아직 장부 기록에 붙지 않은 증빙까지 포함한 저장소. */
export const evidences = new Map<number, EvidenceResponse>();

export const entries: LedgerEntryResponse[] = INITIAL_LEDGER_ENTRIES.map((entry) => ({
  id: seedNumber(entry.id),
  occurredAt: `${entry.occurredAt}:00`,
  type: entry.type === 'deposit' ? 'DEPOSIT' : 'WITHDRAWAL',
  category: CATEGORY_CODES[entry.category],
  counterparty: entry.counterparty,
  description: entry.description,
  note: entry.note,
  amount: entry.amount,
  balance: entry.balance,
  source: entry.source || null,
  linkStatus: entry.linkStatus === 'confirmed' ? 'CONFIRMED' : entry.linkStatus === 'pending' ? 'PENDING' : 'NONE',
  duesLink: entry.duesLink
    ? {
        memberId: memberIdOf(entry.duesLink.memberId),
        memberName: entry.duesLink.memberName,
        studentNumber: entry.duesLink.studentNumber,
        track: trackCode(entry.duesLink.track),
        semesterId: entry.duesLink.semesterId,
        requiredAmount: entry.duesLink.requiredAmount,
        refundReason: refundReasonCode(entry.duesLink.refundReason),
        refundAmount: entry.duesLink.refundAmount ?? null,
      }
    : null,
  evidences: entry.evidences.map((evidence) => {
    const stored: EvidenceResponse = {
      id: evidenceIdOf(evidence.id),
      name: evidence.name,
      url: evidence.url ?? null,
      width: evidence.width ?? null,
      height: evidence.height ?? null,
    };
    evidences.set(stored.id, stored);
    return stored;
  }),
}));

let nextEntryId = Math.max(0, ...entries.map((entry) => entry.id)) + 1;

export function issueEntryId() {
  return nextEntryId++;
}

export function issueEvidenceId() {
  return nextEvidenceId++;
}

/** 가져오기로 이미 반영한 은행 거래 지문. */
export const importedRowKeys = new Set<string>();

// ---------- 면제 ----------

let nextExemptionId = 1;

export const exemptions: ExemptionResponse[] = INITIAL_EXEMPTIONS.map((exemption) => ({
  id: nextExemptionId++,
  memberId: memberIdOf(exemption.memberId),
  reason: exemption.reason,
  note: exemption.note,
  startMonth: exemption.startMonth,
  endMonth: exemption.endMonth,
}));

export function issueExemptionId() {
  return nextExemptionId++;
}

export const exemptionReasons: string[] = [...INITIAL_EXEMPTION_REASONS];

function monthIsInExemption(month: YearMonth, exemption: Pick<ExemptionResponse, 'startMonth' | 'endMonth'>) {
  return month >= exemption.startMonth && (exemption.endMonth === null || month <= exemption.endMonth);
}

// ---------- 집계 (백엔드가 할 계산) ----------

function sumConfirmed(semesterId: SemesterId, memberId: number, match: (entry: LedgerEntryResponse) => boolean) {
  return entries
    .filter(
      (entry) =>
        match(entry) &&
        entry.linkStatus === 'CONFIRMED' &&
        entry.duesLink?.memberId === memberId &&
        entry.duesLink.semesterId === semesterId,
    )
    .reduce((total, entry) => total + entry.amount, 0);
}

function deriveMemberDues(
  semesterId: SemesterId,
  semester: DerivedSemester,
  row: RosterRow,
  exemptionList: ExemptionResponse[],
): MemberDuesResponse {
  const member = findMember(row.memberId)!;
  const months = semesterMonthsOf(semesterId);
  const base = {
    memberId: member.id,
    name: member.name,
    studentNumber: member.studentNumber,
    track: member.track,
    slackId: member.slackId,
  };

  if (!row.applicable) {
    return {
      ...base,
      months: months.map((month) => ({ month, status: 'NOT_APPLICABLE', exemption: null, note: null })),
      status: 'EXEMPT',
      assessedAmount: null,
      paidAmount: null,
      unpaidAmount: null,
      excessAmount: 0,
      refundStatus: 'NONE',
      refundReason: null,
      refundedAmount: 0,
    };
  }

  const memberExemptions = exemptionList.filter((exemption) => exemption.memberId === member.id);
  const monthDues: MonthDuesResponse[] = months.map((month, index) => {
    const exemption = memberExemptions.find((item) => monthIsInExemption(month, item));
    if (exemption) {
      const { id, reason, startMonth, endMonth } = exemption;
      return { month, status: 'EXEMPT', exemption: { id, reason, startMonth, endMonth }, note: null };
    }
    const original = row.baseMonths[index] ?? { status: 'UNPAID', note: null };
    return original.status === 'EXEMPT'
      ? { month, status: 'UNPAID', exemption: null, note: null }
      : { month, status: original.status, exemption: null, note: original.note };
  });

  const assessedAmount = monthDues.filter((month) => month.status !== 'EXEMPT').length * semester.monthlyAmount;
  const grossPaid = sumConfirmed(
    semesterId,
    member.id,
    (entry) => entry.type === 'DEPOSIT' && entry.category === 'DUES',
  );
  const refundedAmount = sumConfirmed(
    semesterId,
    member.id,
    (entry) => entry.type === 'WITHDRAWAL' && entry.category === 'DUES_REFUND',
  );

  const grossExcess = Math.max(0, grossPaid - assessedAmount);
  const remainingExcess = Math.max(0, grossExcess - refundedAmount);
  const netPaid = Math.max(0, grossPaid - refundedAmount);

  const status: SemesterDuesStatus =
    remainingExcess > 0
      ? 'OVERPAID'
      : assessedAmount === 0
        ? 'EXEMPT'
        : netPaid <= 0
          ? 'UNPAID'
          : netPaid < assessedAmount
            ? 'PARTIAL'
            : 'PAID';

  const refundStatus: RefundStatus =
    grossExcess === 0
      ? refundedAmount > 0
        ? 'COMPLETED'
        : 'NONE'
      : refundedAmount === 0
        ? 'NEEDED'
        : refundedAmount < grossExcess
          ? 'PARTIAL'
          : 'COMPLETED';

  const hasWithdrawalExemption = memberExemptions.some((exemption) => exemption.reason === WITHDRAWAL_EXEMPTION_REASON);

  return {
    ...base,
    months: monthDues,
    status,
    assessedAmount,
    paidAmount: netPaid,
    unpaidAmount: Math.max(0, assessedAmount - netPaid),
    excessAmount: remainingExcess,
    refundStatus,
    refundReason:
      remainingExcess > 0
        ? hasWithdrawalExemption
          ? 'WITHDRAWAL_PERIOD'
          : 'OVERPAID'
        : refundStatus === 'COMPLETED'
          ? row.completedRefundReason
          : null,
    refundedAmount,
  };
}

function deriveSummary(semesterId: SemesterId, semester: DerivedSemester, list: MemberDuesResponse[]) {
  const { year, term } = parseSemesterId(semesterId);
  const exemptMembers = list.filter((member) => member.status === 'EXEMPT').length;
  const summary: SemesterDuesSummaryResponse = {
    id: semesterId,
    year,
    term,
    monthlyAmount: semester.monthlyAmount,
    totalMembers: list.length,
    exemptMembers,
    targetMembers: list.length - exemptMembers,
    completedMembers: list.filter((member) => member.status === 'PAID' || member.status === 'OVERPAID').length,
    unpaidMembers: list.filter((member) => member.status === 'UNPAID' || member.status === 'PARTIAL').length,
    totalAmount: list.reduce((total, member) => total + (member.assessedAmount ?? 0), 0),
    paidAmount: list.reduce((total, member) => total + Math.min(member.paidAmount ?? 0, member.assessedAmount ?? 0), 0),
    unpaidAmount: list.reduce((total, member) => total + (member.unpaidAmount ?? 0), 0),
    needsReview: list.some(
      (member) =>
        member.refundStatus === 'NEEDED' ||
        member.refundStatus === 'PARTIAL' ||
        member.status === 'UNPAID' ||
        member.status === 'PARTIAL',
    ),
  };
  return summary;
}

export function semesterIds(): SemesterId[] {
  return [...derivedSemesters.keys(), ...staticSemesters.keys()].sort((a, b) => b.localeCompare(a));
}

export function semesterMembers(semesterId: SemesterId, exemptionList = exemptions): MemberDuesResponse[] | null {
  const derived = derivedSemesters.get(semesterId);
  if (derived) return derived.roster.map((row) => deriveMemberDues(semesterId, derived, row, exemptionList));
  // 지난 학기 집계는 고정이지만 Slack ID는 인명부의 현재 값을 따른다.
  return (
    staticSemesters
      .get(semesterId)
      ?.members.map((member) => ({ ...member, slackId: findMember(member.memberId)?.slackId ?? null })) ?? null
  );
}

export function semesterSummary(semesterId: SemesterId): SemesterDuesSummaryResponse | null {
  const derived = derivedSemesters.get(semesterId);
  if (derived) return deriveSummary(semesterId, derived, semesterMembers(semesterId)!);
  return staticSemesters.get(semesterId)?.summary ?? null;
}

export function addSemester(semesterId: SemesterId, monthlyAmount: number) {
  derivedSemesters.set(semesterId, {
    monthlyAmount,
    roster: members.map((member) => ({
      memberId: member.id,
      applicable: true,
      baseMonths: Array.from({ length: 6 }, () => ({ status: 'UNPAID' as const, note: null })),
      completedRefundReason: null,
    })),
  });
}
