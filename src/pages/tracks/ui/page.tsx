import { useQuery } from '@tanstack/react-query';

import { trackQueries } from '@/entities/track';
import { PageHeader } from '@/shared/ui/page-header';

import { TrackChipBar } from './components/TrackChipBar';

// First-track navigation belongs to the index loader; this screen represents the empty list.
export default function TracksPage() {
  const { data: trackPages } = useQuery(trackQueries.trackPages());
  if (!trackPages || trackPages.length > 0) return null;

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
