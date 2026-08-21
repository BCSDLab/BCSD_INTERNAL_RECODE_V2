import { queryOptions } from '@tanstack/react-query';
import { getTrackPage, listTechStacks, listTrackPages, listTracks } from './api';

export const trackKeys = {
  tracks: () => ['tracks'] as const,
  trackPages: () => ['track-pages'] as const,
  trackPage: (trackPageId: number) => ['track-page', trackPageId] as const,
  techStacks: () => ['tech-stacks'] as const,
};

export const trackQueries = {
  tracks: () => queryOptions({ queryKey: trackKeys.tracks(), queryFn: listTracks }),
  trackPages: () => queryOptions({ queryKey: trackKeys.trackPages(), queryFn: listTrackPages }),
  trackPage: (trackPageId: number) =>
    queryOptions({ queryKey: trackKeys.trackPage(trackPageId), queryFn: () => getTrackPage(trackPageId) }),
  techStacks: () => queryOptions({ queryKey: trackKeys.techStacks(), queryFn: listTechStacks }),
};
