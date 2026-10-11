import type { Metadata } from 'next';
import { SemesterDuesEmptyView } from '@/components/dues/SemesterDuesListView';

export const metadata: Metadata = {
  title: '학기 회비 목록 | BCSD Internal',
};

export default function EmptySemesterDuesPage() {
  return <SemesterDuesEmptyView />;
}
