import type { Metadata } from 'next';
import { SemesterDuesByIdPage } from '@/components/dues/SemesterDuesRoutes';

export async function generateMetadata({ params }: PageProps<'/ledger/dues/[semesterId]'>): Promise<Metadata> {
  const { semesterId } = await params;
  const [year, term] = semesterId.split('-');
  return { title: `${year}년 ${term}학기 회비 | BCSD Internal` };
}

export default async function SemesterDuesDetailPage({ params }: PageProps<'/ledger/dues/[semesterId]'>) {
  const { semesterId } = await params;
  return <SemesterDuesByIdPage semesterId={semesterId} />;
}
