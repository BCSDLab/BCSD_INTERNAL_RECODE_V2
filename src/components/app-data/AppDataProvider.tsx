'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { deriveSemesterMembers, deriveSemesterSummary, LIVE_SEMESTER_ID } from '@/components/dues/derive';
import { INITIAL_EXEMPTION_REASONS, INITIAL_EXEMPTIONS } from '@/components/dues/exemptions';
import type { ExemptionPeriod } from '@/components/dues/exemptions';
import { CURRENT_SEMESTER_MEMBERS, getSemesterMembers, SEMESTER_DUES_SUMMARIES } from '@/components/dues/initial-data';
import type { MemberDues, SemesterDuesSummary } from '@/components/dues/types';
import { INITIAL_LEDGER_ENTRIES } from '@/components/ledger/initial-data';
import type { LedgerEntry } from '@/components/ledger/types';

export type RefundOrigin = 'dues' | 'exemptions';
export type RefundStage = 'check' | 'candidates' | 'no-candidates' | 'direct';

export interface RefundFlowState {
  memberId: string;
  origin: RefundOrigin;
  stage: RefundStage;
}

function freshLedgerEntries(): LedgerEntry[] {
  return INITIAL_LEDGER_ENTRIES.map((entry) => ({
    ...entry,
    duesLink: entry.duesLink ? { ...entry.duesLink } : undefined,
    evidences: entry.evidences.map((evidence) => ({ ...evidence })),
  }));
}

interface AppDataValue {
  ledgerEntries: LedgerEntry[];
  setLedgerEntries: Dispatch<SetStateAction<LedgerEntry[]>>;
  semesters: SemesterDuesSummary[];
  createNextSemester: () => SemesterDuesSummary | null;
  getSemesterDuesMembers: (semesterId: string) => MemberDues[];
  pendingDuesToast: { semesterId: string; message: string } | null;
  clearPendingDuesToast: () => void;
  exemptions: ExemptionPeriod[];
  setExemptions: Dispatch<SetStateAction<ExemptionPeriod[]>>;
  exemptionReasons: string[];
  setExemptionReasons: Dispatch<SetStateAction<string[]>>;
  refundFlow: RefundFlowState | null;
  startRefundFlow: (memberId: string, origin: RefundOrigin) => void;
  setRefundStage: (stage: RefundStage) => void;
  cancelRefundFlow: () => void;
  linkRefundEntry: (entryId: string) => void;
}

const AppDataContext = createContext<AppDataValue | null>(null);

function nextSemesterId(semesterId: string) {
  const [yearText, termText] = semesterId.split('-');
  const year = Number(yearText);
  const term = Number(termText);
  return term === 1 ? `${year}-2` : `${year + 1}-1`;
}

function semesterSummary(semesterId: string, memberCount: number): SemesterDuesSummary {
  const [yearText, termText] = semesterId.split('-');
  const year = Number(yearText);
  const term = Number(termText);
  const totalAmount = memberCount * 60000;

  return {
    id: semesterId,
    shortLabel: `${String(year).slice(-2)}년 ${term}학기`,
    title: `${year}년 ${term}학기 회비`,
    totalMembers: memberCount,
    exemptMembers: 0,
    targetMembers: memberCount,
    completedMembers: 0,
    unpaidMembers: memberCount,
    totalAmount,
    paidAmount: 0,
    unpaidAmount: totalAmount,
    needsReview: memberCount > 0,
  };
}

function semesterMembers(): MemberDues[] {
  return CURRENT_SEMESTER_MEMBERS.map((member) => ({
    ...member,
    months: Array.from({ length: 6 }, () => ({ status: 'unpaid' as const, description: '연결된 기록 없음' })),
    status: 'unpaid',
    assessedAmount: 60000,
    paidAmount: 0,
    unpaidAmount: 60000,
    excessAmount: undefined,
    refundStatus: 'none',
    refundAmount: undefined,
    refundReason: undefined,
    refundedAmount: undefined,
  }));
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>(freshLedgerEntries);
  const [exemptions, setExemptions] = useState<ExemptionPeriod[]>(() =>
    INITIAL_EXEMPTIONS.map((item) => ({ ...item })),
  );
  const [exemptionReasons, setExemptionReasons] = useState<string[]>(() => [...INITIAL_EXEMPTION_REASONS]);
  const [refundFlow, setRefundFlow] = useState<RefundFlowState | null>(null);
  const [createdSemesters, setCreatedSemesters] = useState<SemesterDuesSummary[]>([]);
  const [createdSemesterMembers, setCreatedSemesterMembers] = useState<Record<string, MemberDues[]>>({});
  const [pendingDuesToast, setPendingDuesToast] = useState<{ semesterId: string; message: string } | null>(null);

  const liveMembers = useMemo(
    () => deriveSemesterMembers(CURRENT_SEMESTER_MEMBERS, ledgerEntries, exemptions),
    [ledgerEntries, exemptions],
  );

  const liveSummary = useMemo(() => deriveSemesterSummary(SEMESTER_DUES_SUMMARIES[0], liveMembers), [liveMembers]);

  const semesters = useMemo(
    () => [...createdSemesters, liveSummary, ...SEMESTER_DUES_SUMMARIES.slice(1)],
    [createdSemesters, liveSummary],
  );

  const createNextSemester = useCallback(() => {
    const semesterId = nextSemesterId(LIVE_SEMESTER_ID);
    if (createdSemesters.some((semester) => semester.id === semesterId)) return null;

    const members = semesterMembers();
    const summary = semesterSummary(semesterId, members.length);
    setCreatedSemesterMembers((current) => ({ ...current, [semesterId]: members }));
    setCreatedSemesters((current) => [summary, ...current]);
    setPendingDuesToast({ semesterId, message: `${summary.title}를 생성했습니다.` });
    return summary;
  }, [createdSemesters]);

  const clearPendingDuesToast = useCallback(() => setPendingDuesToast(null), []);

  const linkRefundEntry = useCallback(
    (entryId: string) => {
      if (!refundFlow) return;
      const member = liveMembers.find((item) => item.id === refundFlow.memberId);
      if (!member || !member.refundAmount) return;

      setLedgerEntries((current) =>
        current.map((entry) =>
          entry.id === entryId
            ? {
                ...entry,
                category: '회비 반환',
                linkStatus: 'confirmed',
                duesLink: {
                  memberId: member.id,
                  memberName: member.name,
                  studentNumber: member.studentNumber,
                  track: member.track,
                  semester: '2026년 2학기',
                  requiredAmount: member.assessedAmount ?? 0,
                  refundReason: member.refundReason,
                  refundAmount: member.refundAmount,
                },
              }
            : entry,
        ),
      );
      setRefundFlow(null);
    },
    [liveMembers, refundFlow],
  );

  const value = useMemo<AppDataValue>(
    () => ({
      ledgerEntries,
      setLedgerEntries,
      semesters,
      createNextSemester,
      getSemesterDuesMembers: (semesterId: string) =>
        createdSemesterMembers[semesterId] ??
        (semesterId === LIVE_SEMESTER_ID ? liveMembers : getSemesterMembers(semesterId)),
      pendingDuesToast,
      clearPendingDuesToast,
      exemptions,
      setExemptions,
      exemptionReasons,
      setExemptionReasons,
      refundFlow,
      startRefundFlow: (memberId, origin) => setRefundFlow({ memberId, origin, stage: 'check' }),
      setRefundStage: (stage) => setRefundFlow((current) => (current ? { ...current, stage } : null)),
      cancelRefundFlow: () => setRefundFlow(null),
      linkRefundEntry,
    }),
    [
      ledgerEntries,
      semesters,
      createNextSemester,
      createdSemesterMembers,
      liveMembers,
      pendingDuesToast,
      clearPendingDuesToast,
      exemptions,
      exemptionReasons,
      refundFlow,
      linkRefundEntry,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error('useAppData must be used within AppDataProvider');
  return context;
}
