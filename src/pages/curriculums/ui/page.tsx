import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';

import { curriculumQueries, type CurriculumSummaryResponse } from '@/entities/curriculum';
import { canManageTrack } from '@/entities/member';
import { useSession } from '@/entities/session';
import { trackQueries, type TrackPageSummaryResponse } from '@/entities/track';
import { PageHeader } from '@/shared/ui/page-header';

import { CurriculumRail } from './components/CurriculumRail';
import { TopicColumn } from './components/TopicColumn';

const EMPTY_TRACK_PAGES: TrackPageSummaryResponse[] = [];
const EMPTY_SETS: CurriculumSummaryResponse[] = [];

/**
 * 시안의 커리큘럼 화면. 트랙 화면과 달리 칩 바도 섹션 카드도 없고,
 * "280px 레일 + 나머지" 2단 그리드가 남은 높이를 채운다.
 */
export default function CurriculumsPage() {
  const { session } = useSession();
  const search = useSearch({ from: '/_admin/curriculums' });
  const navigate = useNavigate({ from: '/curriculums' });
  function selectWeek(weekId: number | null) {
    void navigate({ search: (prev) => ({ ...prev, weekId: weekId ?? undefined }), resetScroll: false });
  }

  const { data: trackPages } = useQuery(trackQueries.trackPages());
  const trackPage = trackPages?.find((item) => item.id === search.trackPageId);
  const trackPageId = trackPage?.id ?? '';

  const { data: trackPageDetail } = useQuery({
    ...trackQueries.trackPage(trackPageId === '' ? -1 : trackPageId),
    enabled: trackPageId !== '',
  });
  const canManage = canManageTrack(session?.member, trackPageDetail?.trackCode);

  const { data: curriculums } = useQuery({ ...curriculumQueries.list(trackPageId), enabled: trackPageId !== '' });

  const curriculum = curriculums?.find((item) => item.id === search.curriculumId);
  const curriculumId = curriculum?.id ?? '';

  const { data: tree } = useQuery({ ...curriculumQueries.tree(curriculumId), enabled: curriculumId !== '' });

  const selectedWeek = tree?.weeks.find((week) => week.id === search.weekId) ?? tree?.weeks[0] ?? null;

  return (
    <>
      <PageHeader
        crumb="커리큘럼"
        slug={trackPage && curriculum ? `${trackPage.displayName} · ${curriculum.name}` : undefined}
        title={curriculum ? `${curriculum.name} 커리큘럼` : '커리큘럼'}
      />
      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-[280px_minmax(0,1fr)]">
        <CurriculumRail
          key={`${trackPageId}:${curriculumId}`}
          trackPages={trackPages ?? EMPTY_TRACK_PAGES}
          trackPageId={trackPageId}
          onSelectTrackPage={(id) => {
            void navigate({ search: { trackPageId: id || undefined }, resetScroll: false });
          }}
          curriculums={curriculums ?? EMPTY_SETS}
          curriculumId={curriculumId}
          onSelectCurriculum={(id) => {
            void navigate({
              search: (prev) => ({ trackPageId: prev.trackPageId, curriculumId: id || undefined }),
              resetScroll: false,
            });
          }}
          tree={tree}
          selectedWeekId={selectedWeek?.id ?? null}
          onSelectWeek={selectWeek}
          canManage={canManage}
        />
        {curriculumId !== '' ? (
          <TopicColumn
            key={`${curriculumId}:${selectedWeek?.id ?? 'none'}`}
            curriculumId={curriculumId}
            week={selectedWeek}
            onWeekDeleted={() => selectWeek(null)}
            canManage={canManage}
          />
        ) : (
          <div className="text-faint px-8 pt-6 pb-10 text-[13px]">왼쪽에서 트랙과 세트를 선택하세요.</div>
        )}
      </div>
    </>
  );
}
