import { createFileRoute } from '@tanstack/react-router';

import { trackQueries } from '@/entities/track';
import { TrackPageEditPage as Screen } from '@/pages/tracks';

export const Route = createFileRoute('/_admin/tracks/$trackPageId')({
  // 다음 트랙의 편집 데이터를 확보한 뒤 라우트를 전환한다.
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(trackQueries.trackPage(Number(params.trackPageId))),
  // 화면 전환이 끝날 때 편집기와 이전 트랙의 지연 저장 타이머를 함께 초기화한다.
  remountDeps: ({ params }) => params.trackPageId,
  component: Screen,
});
