'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { apiFetch } from '@/lib/api/client';
import type { TrackPageSummaryResponse } from '@/types/api';
import { TrackChipBar } from './components/TrackChipBar';

/**
 * 시안에는 트랙 "목록" 화면이 따로 없다 — 트랙 하나가 곧 한 화면이고 상단 칩으로
 * 전환한다. 그래서 /tracks는 첫 트랙으로 넘기고, 트랙이 하나도 없을 때만
 * 칩 바 + 빈 상태를 보여준다.
 *
 * 리다이렉트는 반드시 effect에서 한다. 렌더 중에 router.replace()를 호출하면
 * "Cannot update a component while rendering a different component" 에러가 난다 —
 * 라우터는 렌더 도중 건드리면 안 되는 외부 상태다.
 */
export default function TracksPage() {
  const router = useRouter();

  const { data: trackPages } = useQuery({
    queryKey: ['track-pages'],
    queryFn: () => apiFetch<TrackPageSummaryResponse[]>('/v1/admin/track-pages'),
  });

  const firstTrackPageId = trackPages?.[0]?.id;

  useEffect(() => {
    if (firstTrackPageId !== undefined) {
      router.replace(`/tracks/${firstTrackPageId}`);
    }
  }, [firstTrackPageId, router]);

  // 목록을 아직 못 받았거나, 받았는데 리다이렉트할 트랙이 있으면 빈 화면을 보인다.
  if (!trackPages || firstTrackPageId !== undefined) {
    return null;
  }

  return (
    <>
      <PageHeader crumb="트랙 페이지" title="트랙 페이지" />
      <TrackChipBar selectedId={null} />
      <div className="text-faint px-8 pt-6 pb-10 text-[13px]">
        트랙이 없습니다. 위의 &ldquo;+ 트랙 추가&rdquo;로 시작하세요.
      </div>
    </>
  );
}
