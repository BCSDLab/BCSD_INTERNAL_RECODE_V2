import type { Metadata } from 'next';
import { getSemesterMembers, SEMESTER_DUES_SUMMARIES } from '@/components/dues/initial-data';
import { SemesterDuesDetailView } from '@/components/dues/SemesterDuesDetailView';

export function generateStaticParams() {
  return SEMESTER_DUES_SUMMARIES.map((semester) => ({ semesterId: semester.id }));
}

export async function generateMetadata({ params }: PageProps<'/ledger/dues/[semesterId]'>): Promise<Metadata> {
  const { semesterId } = await params;
  const semester = SEMESTER_DUES_SUMMARIES.find((item) => item.id === semesterId);
  return { title: `${semester?.title ?? '학기 회비'} | BCSD Internal` };
}

export default async function SemesterDuesDetailPage({ params }: PageProps<'/ledger/dues/[semesterId]'>) {
  const { semesterId } = await params;
  const semester = SEMESTER_DUES_SUMMARIES.find((item) => item.id === semesterId) ?? SEMESTER_DUES_SUMMARIES[0];
  return <SemesterDuesDetailView semester={semester} members={getSemesterMembers(semester.id)} />;
}
