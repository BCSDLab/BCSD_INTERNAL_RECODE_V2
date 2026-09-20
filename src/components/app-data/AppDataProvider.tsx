'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { deriveSemesterMembers, deriveSemesterSummary, LIVE_SEMESTER_ID } from '@/components/dues/derive';
import { INITIAL_EXEMPTION_REASONS, INITIAL_EXEMPTIONS } from '@/components/dues/exemptions';
import type { ExemptionPeriod } from '@/components/dues/exemptions';
import { CURRENT_SEMESTER_MEMBERS, getSemesterMembers, SEMESTER_DUES_SUMMARIES } from '@/components/dues/initial-data';
import type { MemberDues, SemesterDuesSummary } from '@/components/dues/types';
import { INITIAL_LEDGER_ENTRIES } from '@/components/ledger/initial-data';
import type { LedgerEntry } from '@/components/ledger/types';

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
  getSemesterDuesMembers: (semesterId: string) => MemberDues[];
  exemptions: ExemptionPeriod[];
  setExemptions: Dispatch<SetStateAction<ExemptionPeriod[]>>;
  exemptionReasons: string[];
  setExemptionReasons: Dispatch<SetStateAction<string[]>>;
}

const AppDataContext = createContext<AppDataValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>(freshLedgerEntries);
  const [exemptions, setExemptions] = useState<ExemptionPeriod[]>(() =>
    INITIAL_EXEMPTIONS.map((item) => ({ ...item })),
  );
  const [exemptionReasons, setExemptionReasons] = useState<string[]>(() => [...INITIAL_EXEMPTION_REASONS]);

  const liveMembers = useMemo(
    () => deriveSemesterMembers(CURRENT_SEMESTER_MEMBERS, ledgerEntries, exemptions),
    [ledgerEntries, exemptions],
  );

  const liveSummary = useMemo(() => deriveSemesterSummary(SEMESTER_DUES_SUMMARIES[0], liveMembers), [liveMembers]);

  const semesters = useMemo(() => [liveSummary, ...SEMESTER_DUES_SUMMARIES.slice(1)], [liveSummary]);

  const value = useMemo<AppDataValue>(
    () => ({
      ledgerEntries,
      setLedgerEntries,
      semesters,
      getSemesterDuesMembers: (semesterId: string) =>
        semesterId === LIVE_SEMESTER_ID ? liveMembers : getSemesterMembers(semesterId),
      exemptions,
      setExemptions,
      exemptionReasons,
      setExemptionReasons,
    }),
    [ledgerEntries, semesters, liveMembers, exemptions, exemptionReasons],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error('useAppData must be used within AppDataProvider');
  return context;
}
