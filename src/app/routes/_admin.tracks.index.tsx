import { createFileRoute, redirect } from '@tanstack/react-router';

import { trackQueries } from '@/entities/track';
import { TracksPage as Screen } from '@/pages/tracks';

export const Route = createFileRoute('/_admin/tracks/')({
  loader: async ({ context }) => {
    const tracks = await context.queryClient.fetchQuery(trackQueries.trackPages());
    if (tracks[0]) {
      throw redirect({ to: '/tracks/$trackPageId', params: { trackPageId: String(tracks[0].id) }, replace: true });
    }
  },
  component: Screen,
});
