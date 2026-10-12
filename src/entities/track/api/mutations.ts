import { mutationOptions, type QueryClient } from '@tanstack/react-query';

import { putStudyPoints, updateTrackPageHeader } from './api';
import { trackKeys } from './queries';
import { type StudyPointResponse, type TrackPageDetailResponse, type TrackPageSummaryResponse } from './types';

/** 서버 응답의 변경된 필드만 반영해 다른 섹션의 캐시를 덮어쓰지 않는다. */
export const trackMutations = {
  header: (queryClient: QueryClient, trackPageId: number) =>
    mutationOptions({
      scope: { id: `track-header-${trackPageId}` },
      mutationFn: (values: { displayName: string; tagline: string }) => updateTrackPageHeader(trackPageId, values),
      onSuccess: (saved: TrackPageDetailResponse) => {
        const header = { displayName: saved.displayName, tagline: saved.tagline, slug: saved.slug };
        queryClient.setQueryData<TrackPageDetailResponse>(trackKeys.trackPage(trackPageId), (detail) =>
          detail ? { ...detail, ...header } : undefined,
        );
        queryClient.setQueryData<TrackPageSummaryResponse[]>(trackKeys.trackPages(), (pages) =>
          pages?.map((page) => (page.id === trackPageId ? { ...page, ...header } : page)),
        );
      },
    }),
  studyPoints: (queryClient: QueryClient, trackPageId: number) =>
    mutationOptions({
      scope: { id: `track-study-points-${trackPageId}` },
      mutationFn: (points: StudyPointResponse[]) =>
        putStudyPoints(
          trackPageId,
          points.map(({ title, description, iconImageUrl }) => ({ title, description, iconImageUrl })),
        ),
      onSuccess: (studyPoints: StudyPointResponse[]) => {
        queryClient.setQueryData<TrackPageDetailResponse>(trackKeys.trackPage(trackPageId), (detail) =>
          detail ? { ...detail, studyPoints } : undefined,
        );
      },
    }),
};
