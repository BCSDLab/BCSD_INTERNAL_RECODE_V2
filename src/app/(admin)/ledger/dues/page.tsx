import type { Metadata } from 'next';
import { getSemesterMembers, SEMESTER_DUES_SUMMARIES } from '@/components/dues/initial-data';
import { SemesterDuesDetailView } from '@/components/dues/SemesterDuesDetailView';

export const metadata: Metadata = {
  title: '학기 회비 목록 | BCSD Internal',
};

export default function SemesterDuesPage() {
  const latestSemester = SEMESTER_DUES_SUMMARIES[0];
  return <SemesterDuesDetailView semester={latestSemester} members={getSemesterMembers(latestSemester.id)} />;
}
