import type { Metadata } from 'next';
import { LatestSemesterDuesPage } from '@/components/dues/SemesterDuesRoutes';

export const metadata: Metadata = {
  title: '학기 회비 목록 | BCSD Internal',
};

export default function SemesterDuesPage() {
  return <LatestSemesterDuesPage />;
}
