'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { curriculumQueries } from '@/api/curriculum/queries';
import type { CurriculumSummaryResponse } from '@/api/curriculum/types';
import { trackQueries } from '@/api/track/queries';
import type { TrackPageSummaryResponse } from '@/api/track/types';
import { PageHeader } from '@/components/ui/page-header';
import { CurriculumRail } from './components/CurriculumRail';
import { TopicColumn } from './components/TopicColumn';

const EMPTY_TRACK_PAGES: TrackPageSummaryResponse[] = [];
const EMPTY_SETS: CurriculumSummaryResponse[] = [];

/**
 * 시안의 커리큘럼 화면. 트랙 화면과 달리 칩 바도 섹션 카드도 없고,
 * "280px 레일 + 나머지" 2단 그리드가 남은 높이를 채운다.
 */
export default function CurriculumsPage() {
  const [trackPageId, setTrackPageId] = useState<number | ''>('');
  const [curriculumId, setCurriculumId] = useState<number | ''>('');
  const [selectedWeekId, setSelectedWeekId] = useState<number | null>(null);

  const { data: trackPages } = useQuery(trackQueries.trackPages());

  const { data: curriculums } = useQuery({ ...curriculumQueries.list(trackPageId), enabled: trackPageId !== '' });

  const { data: tree } = useQuery({ ...curriculumQueries.tree(curriculumId), enabled: curriculumId !== '' });

  // 주차를 아직 안 골랐으면 첫 주차를 자동 선택한다(시안도 한 주차가 늘 열려 있다).
  if (tree && tree.weeks.length > 0 && !tree.weeks.some((week) => week.id === selectedWeekId)) {
    setSelectedWeekId(tree.weeks[0].id);
  }
  if (tree && tree.weeks.length === 0 && selectedWeekId !== null) {
    setSelectedWeekId(null);
  }

  const trackPage = (trackPages ?? EMPTY_TRACK_PAGES).find((page) => page.id === trackPageId);
  const curriculum = (curriculums ?? EMPTY_SETS).find((set) => set.id === curriculumId);
  const selectedWeek = tree?.weeks.find((week) => week.id === selectedWeekId) ?? null;

  return (
    <>
      <PageHeader
        crumb="커리큘럼"
        slug={trackPage && curriculum ? `${trackPage.displayName} · ${curriculum.name}` : undefined}
        title={curriculum ? `${curriculum.name} 커리큘럼` : '커리큘럼'}
      />
      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-[280px_minmax(0,1fr)]">
        <CurriculumRail
          trackPages={trackPages ?? EMPTY_TRACK_PAGES}
          trackPageId={trackPageId}
          onSelectTrackPage={(id) => {
            setTrackPageId(id);
            setCurriculumId('');
            setSelectedWeekId(null);
          }}
          curriculums={curriculums ?? EMPTY_SETS}
          curriculumId={curriculumId}
          onSelectCurriculum={(id) => {
            setCurriculumId(id);
            setSelectedWeekId(null);
          }}
          tree={tree}
          selectedWeekId={selectedWeekId}
          onSelectWeek={setSelectedWeekId}
        />
        {curriculumId !== '' ? (
          <TopicColumn curriculumId={curriculumId} week={selectedWeek} onWeekDeleted={() => setSelectedWeekId(null)} />
        ) : (
          <div className="text-faint px-8 pt-6 pb-10 text-[13px]">왼쪽에서 트랙과 세트를 선택하세요.</div>
        )}
      </div>
    </>
  );
}
