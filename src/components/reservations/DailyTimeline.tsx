'use client';

import type { TimelineRow } from '@/components/reservations/reservation-logic';

interface DailyTimelineProps {
  rows: TimelineRow[];
  onSelectMine: (reservationId: number) => void;
}

const FREE_STYLE = 'flex-1 min-w-0 rounded-[9px] border border-dashed border-[#C9D4E2] bg-white px-[13px] py-[9px] text-[13.5px] text-[#8895A7]';
const OTHER_STYLE =
  'flex-1 min-w-0 rounded-[10px] bg-[#b611f5] px-[13px] py-[9px] text-[13.5px] font-medium text-white shadow-[0_6px_14px_-8px_rgba(182,17,245,.55)]';
const MINE_STYLE =
  'flex-1 min-w-0 cursor-pointer rounded-r-[9px] border-l-[3px] border-[#b611f5] bg-[#F5E4FE] px-[13px] py-[9px] text-[13.5px] font-semibold text-[#1B0B28]';

export function DailyTimeline({ rows, onSelectMine }: DailyTimelineProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {rows.map((row) => (
        <div key={row.key} className="flex items-stretch gap-3">
          <span className="w-24 flex-none pt-2.5 text-xs font-medium text-[#9AA6B5] [font-variant-numeric:tabular-nums]">
            {row.timeLabel}
          </span>
          {row.kind === 'free' && <div className={FREE_STYLE}>비어 있음</div>}
          {row.kind === 'other' && <div className={OTHER_STYLE}>{row.label}</div>}
          {row.kind === 'mine' && row.reservation && (
            <div className={MINE_STYLE} onClick={() => onSelectMine(row.reservation!.id)}>
              <span className="block">{row.label}</span>
              <span className="mt-0.5 block text-[11.5px] font-medium text-[#9B4FC2]">눌러서 상세 보기 · 취소</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
