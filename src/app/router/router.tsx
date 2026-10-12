import { type QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';

import { trackKeys, type TrackPageSummaryResponse } from '@/entities/track';

import { routeTree } from './routeTree.gen';

export function createAppRouter(queryClient: QueryClient) {
  const router = createRouter({ routeTree, scrollRestoration: true, context: { queryClient } });
  let firstTrackId = queryClient.getQueryData<TrackPageSummaryResponse[]>(trackKeys.trackPages())?.[0]?.id;
  // A reconnect or another editor can populate an already-open empty index.
  // Re-run its loader instead of maintaining a second navigation rule in the page.
  queryClient.getQueryCache().subscribe((event) => {
    if (
      event.type !== 'updated' ||
      event.action.type !== 'success' ||
      event.query.queryKey.length !== 1 ||
      event.query.queryKey[0] !== trackKeys.trackPages()[0]
    )
      return;
    const nextId = queryClient.getQueryData<TrackPageSummaryResponse[]>(trackKeys.trackPages())?.[0]?.id;
    const changed = nextId !== firstTrackId;
    firstTrackId = nextId;
    if (
      changed &&
      nextId !== undefined &&
      router.state.status === 'idle' &&
      router.state.location.pathname.replace(/\/$/, '') === '/tracks'
    ) {
      void router.invalidate({ filter: (match) => match.routeId === '/_admin/tracks/' });
    }
  });
  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
