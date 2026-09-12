'use client';

import { FREQ_OPTIONS, WEEK_OPTIONS } from '@/app/(admin)/reservations/constants';
import { formatRange } from '@/app/(admin)/reservations/reservation-logic';
import { WEEKDAY_LABELS } from '@/app/(admin)/reservations/time-utils';
import type { Occurrence, RepeatFrequency, RepeatWeeks } from '@/app/(admin)/reservations/types';

interface RepeatSectionProps {
  repeatOn: boolean;
  onToggle: () => void;
  freq: RepeatFrequency;
  onFreqChange: (freq: RepeatFrequency) => void;
  weekdays: number[];
  onToggleWeekday: (index: number) => void;
  weeks: RepeatWeeks;
  onWeeksChange: (weeks: RepeatWeeks) => void;
  occurrences: Occurrence[];
  summaryLabel: string;
}

export function RepeatSection({
  repeatOn,
  onToggle,
  freq,
  onFreqChange,
  weekdays,
  onToggleWeekday,
  weeks,
  onWeeksChange,
  occurrences,
  summaryLabel,
}: RepeatSectionProps) {
  return (
    <div className="border-line mt-[18px] border-t pt-4">
      <div className="flex items-center gap-[11px]">
        <div
          onClick={onToggle}
          className="relative h-[22px] w-[38px] flex-none cursor-pointer rounded-full transition-colors duration-150"
          style={{ background: repeatOn ? '#b611f5' : 'var(--sunken)' }}
        >
          <div
            className="bg-panel absolute top-[3px] h-4 w-4 rounded-full shadow-[0_1px_3px_rgba(27,11,40,.2)] transition-[left] duration-150"
            style={{ left: repeatOn ? 19 : 3 }}
          />
        </div>
        <span className="text-text text-[13.5px] font-semibold">반복 일정으로 만들기</span>
        <span className="text-faint text-xs">정기회의처럼 같은 시간에 계속 쓰는 일정</span>
      </div>

      {repeatOn && (
        <div className="mt-3.5 rounded-xl border border-[#EFE2FA] bg-[rgba(182,17,245,.04)] p-4">
          <div className="flex flex-wrap gap-[26px]">
            <div>
              <div className="text-faint mb-[7px] text-[11.5px] font-bold">주기</div>
              <div className="flex gap-1.5">
                {FREQ_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onFreqChange(option)}
                    className="cursor-pointer rounded-lg px-3.5 py-[7px] text-[12.5px]"
                    style={
                      freq === option
                        ? { background: '#b611f5', color: '#fff', fontWeight: 700 }
                        : { background: 'var(--panel)', border: '1px solid var(--line)', color: 'var(--muted)', fontWeight: 600 }
                    }
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-faint mb-[7px] text-[11.5px] font-bold">요일</div>
              <div className="flex gap-[5px]">
                {WEEKDAY_LABELS.map((label, index) => {
                  const active = weekdays.includes(index);
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => onToggleWeekday(index)}
                      className="flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-full text-[12.5px]"
                      style={
                        active
                          ? { background: '#b611f5', color: '#fff', fontWeight: 700 }
                          : { background: 'var(--panel)', border: '1px solid var(--line)', color: 'var(--muted)', fontWeight: 600 }
                      }
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="text-faint mb-[7px] text-[11.5px] font-bold">기간</div>
              <div className="flex gap-1.5">
                {WEEK_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onWeeksChange(option)}
                    className="cursor-pointer rounded-lg px-[13px] py-[7px] text-[12.5px]"
                    style={
                      weeks === option
                        ? { background: 'rgba(182,17,245,.10)', border: '1px solid #E4BBFB', color: '#b611f5', fontWeight: 700 }
                        : { background: 'var(--panel)', border: '1px solid var(--line)', color: 'var(--muted)', fontWeight: 600 }
                    }
                  >
                    {option}주
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="text-muted mt-4 mb-2 text-xs font-semibold">{summaryLabel}</div>
          <div className="border-line bg-panel max-h-40 overflow-y-auto rounded-[10px] border">
            {occurrences.map((occurrence) => (
              <div
                key={occurrence.dateKey}
                className="border-line bg-panel flex items-center gap-3 border-b px-[13px] py-[9px] last:border-b-0"
              >
                <span className="text-text w-[118px] flex-none text-[12.5px] font-semibold">{occurrence.dateLabel}</span>
                <span className="text-muted flex-1 text-[12.5px] [font-variant-numeric:tabular-nums]">
                  {formatRange(occurrence.start, occurrence.end)}
                </span>
                <span className="text-[11.5px] font-bold text-[#b611f5]">예정</span>
              </div>
            ))}
          </div>
          <div className="text-faint mt-[9px] text-[11.5px] leading-[1.5]">
            반복 일정은 최대 12주까지 만들 수 있습니다. 이미 예약이 있거나 하루 한도를 넘는 날짜는 확정 시 자동으로 건너뛰고, 만들어진
            예약은 개별로 취소할 수 있습니다.
          </div>
        </div>
      )}
    </div>
  );
}
