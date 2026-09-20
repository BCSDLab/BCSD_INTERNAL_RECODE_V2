import type { Metadata } from 'next';
import { SemesterDuesByIdPage } from '@/components/dues/SemesterDuesRoutes';
import { SEMESTER_DUES_SUMMARIES } from '@/components/dues/initial-data';

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
  return <SemesterDuesByIdPage semesterId={semesterId} />;
}
