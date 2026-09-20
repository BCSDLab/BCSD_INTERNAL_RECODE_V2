'use client';

import { useAppData } from '@/components/app-data/AppDataProvider';
import { SemesterDuesDetailView } from '@/components/dues/SemesterDuesDetailView';

export function LatestSemesterDuesPage() {
  const { semesters, getSemesterDuesMembers } = useAppData();
  const semester = semesters[0];
  return <SemesterDuesDetailView semester={semester} members={getSemesterDuesMembers(semester.id)} />;
}

export function SemesterDuesByIdPage({ semesterId }: { semesterId: string }) {
  const { semesters, getSemesterDuesMembers } = useAppData();
  const semester = semesters.find((item) => item.id === semesterId) ?? semesters[0];
  return <SemesterDuesDetailView semester={semester} members={getSemesterDuesMembers(semester.id)} />;
}
