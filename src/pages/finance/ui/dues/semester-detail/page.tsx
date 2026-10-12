import { useParams } from '@tanstack/react-router';

import { SemesterDuesByIdPage } from '@/widgets/finance';

export default function SemesterDuesDetailPage() {
  const { semesterId } = useParams({ from: '/_admin/ledger/dues/$semesterId' });
  return <SemesterDuesByIdPage semesterId={semesterId} />;
}
