'use client';

import { useQuery } from '@tanstack/react-query';
import { duesQueries } from '@/api/dues/queries';
import { SemesterDuesEmptyView } from '@/components/dues/SemesterDuesListView';
import { SemesterDuesDetailView } from '@/components/dues/SemesterDuesDetailView';

function LoadingState({ message = '불러오는 중…' }: { message?: string }) {
  return (
    <main className="text-muted mx-auto flex min-h-[420px] w-full max-w-[1480px] items-center justify-center px-8 text-[13px]">
      {message}
    </main>
  );
}

function SemesterDues({ semesterId }: { semesterId: string }) {
  const { data, isPending, isError } = useQuery(duesQueries.semester(semesterId));
  if (isError) return <LoadingState message="학기 회비를 불러오지 못했습니다." />;
  if (isPending) return <LoadingState />;
  return <SemesterDuesDetailView semester={data.semester} members={data.members} />;
}

export function LatestSemesterDuesPage() {
  const { data: semesters, isPending, isError } = useQuery(duesQueries.semesters());
  if (isError) return <LoadingState message="학기 회비 목록을 불러오지 못했습니다." />;
  if (isPending) return <LoadingState />;
  if (semesters.length === 0) return <SemesterDuesEmptyView />;
  return <SemesterDues semesterId={semesters[0].id} />;
}

export function SemesterDuesByIdPage({ semesterId }: { semesterId: string }) {
  return <SemesterDues semesterId={semesterId} />;
}
