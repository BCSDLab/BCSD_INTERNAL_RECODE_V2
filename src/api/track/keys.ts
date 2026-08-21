export const trackKeys = {
  tracks: () => ['tracks'] as const,
  trackPages: () => ['track-pages'] as const,
  trackPage: (trackPageId: number) => ['track-page', trackPageId] as const,
  techStacks: () => ['tech-stacks'] as const,
};
