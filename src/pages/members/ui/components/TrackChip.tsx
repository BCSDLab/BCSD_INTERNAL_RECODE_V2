import { type Track, TRACK_LABELS } from '@/entities/member';

import { TRACK_COLOR_KEY } from './track-colors';

/** 트랙별 색 배지 — 시안 스크린샷에서 뽑은 색을 globals.css의 --track-{key}-* 변수로 둔다. */
export function TrackChip({ track }: { track: Track }) {
  const key = TRACK_COLOR_KEY[track];
  return (
    <span
      className="inline-flex flex-none items-center rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap"
      style={{ backgroundColor: `var(--track-${key}-bg)`, color: `var(--track-${key}-text)` }}
    >
      {TRACK_LABELS[track]}
    </span>
  );
}
