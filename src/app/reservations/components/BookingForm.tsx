'use client';

import { RepeatSection } from '@/app/reservations/components/RepeatSection';
import { TimeWheel } from '@/app/reservations/components/TimeWheel';
import type { Occurrence, RepeatFrequency, RepeatWeeks } from '@/app/reservations/types';

const HOUR_ITEMS = Array.from({ length: 24 }, (_, h) => ({ value: h, label: h < 10 ? `0${h}` : `${h}` }));
const MINUTE_ITEMS = [
  { value: 0, label: '00' },
  { value: 30, label: '30' },
];

export interface BookingFormProps {
  centerTrigger: string;
  start: number;
  end: number;
  onSetStart: (value: number) => void;
  onSetEnd: (value: number) => void;
  warning: string | null;
  purpose: string;
  onPurposeChange: (value: string) => void;
  headcount: string;
  onHeadcountChange: (value: string) => void;
  repeatOn: boolean;
  onToggleRepeat: () => void;
  freq: RepeatFrequency;
  onFreqChange: (freq: RepeatFrequency) => void;
  weekdays: number[];
  onToggleWeekday: (index: number) => void;
  weeks: RepeatWeeks;
  onWeeksChange: (weeks: RepeatWeeks) => void;
  occurrences: Occurrence[];
  summaryLabel: string;
  agree: boolean;
  onToggleAgree: () => void;
  onOpenRules: () => void;
  valid: boolean;
  confirmLabel: string;
  quotaNote: string;
  onConfirm: () => void;
}

export function BookingForm({
  centerTrigger,
  start,
  end,
  onSetStart,
  onSetEnd,
  warning,
  purpose,
  onPurposeChange,
  headcount,
  onHeadcountChange,
  repeatOn,
  onToggleRepeat,
  freq,
  onFreqChange,
  weekdays,
  onToggleWeekday,
  weeks,
  onWeeksChange,
  occurrences,
  summaryLabel,
  agree,
  onToggleAgree,
  onOpenRules,
  valid,
  confirmLabel,
  quotaNote,
  onConfirm,
}: BookingFormProps) {
  return (
    <div className="mt-[22px] rounded-[15px] border border-[#EAE3F3] bg-white p-[22px] shadow-[0_1px_3px_rgba(27,11,40,.04),0_10px_26px_-14px_rgba(182,17,245,.18)]">
      <div className="mb-3.5 flex items-baseline gap-2.5">
        <span className="text-[15px] font-bold text-[#1B0B28]">이 날 예약하기</span>
        <span className="text-xs text-[#9AA6B5]">시 · 분(30분 단위)을 스크롤해서 고릅니다</span>
      </div>

      <div className="flex flex-nowrap items-end gap-3.5">
        <div>
          <div className="mb-[7px] text-xs font-semibold text-[#64748B]">시작</div>
          <div className="flex items-center gap-1.5">
            <TimeWheel items={HOUR_ITEMS} selectedValue={Math.floor(start / 60)} onSelect={(h) => onSetStart(h * 60 + (start % 60))} centerTrigger={centerTrigger} />
            <span className="text-base font-bold text-[#B6C0CE]">:</span>
            <TimeWheel
              items={MINUTE_ITEMS}
              selectedValue={start % 60}
              onSelect={(m) => onSetStart(Math.floor(start / 60) * 60 + m)}
              centerTrigger={centerTrigger}
            />
          </div>
        </div>

        <span className="pb-[70px] text-[15px] text-[#B6C0CE]">–</span>

        <div>
          <div className="mb-[7px] text-xs font-semibold text-[#64748B]">종료</div>
          <div className="flex items-center gap-1.5">
            <TimeWheel items={HOUR_ITEMS} selectedValue={Math.floor(end / 60)} onSelect={(h) => onSetEnd(h * 60 + (end % 60))} centerTrigger={centerTrigger} />
            <span className="text-base font-bold text-[#B6C0CE]">:</span>
            <TimeWheel
              items={MINUTE_ITEMS}
              selectedValue={end % 60}
              onSelect={(m) => onSetEnd(Math.floor(end / 60) * 60 + m)}
              centerTrigger={centerTrigger}
            />
          </div>
        </div>
      </div>

      {warning && (
        <div className="mt-3 rounded-r-[7px] border-l-[3px] border-[#B3433A] bg-[#FBF6F5] px-3 py-[9px] text-xs leading-[1.5] text-[#5A4A48]">
          {warning}
        </div>
      )}

      <div className="mt-4 flex gap-3">
        <div className="flex-1">
          <div className="mb-1.5 text-xs font-semibold text-[#64748B]">사용 목적</div>
          <input
            value={purpose}
            onChange={(e) => onPurposeChange(e.target.value)}
            placeholder="예: 프론트엔드 세션"
            className="w-full rounded-lg border border-[#DDE3EC] px-[11px] py-[9px] text-[13.5px] text-[#1B0B28] outline-none"
          />
        </div>
        <div className="w-24 flex-none">
          <div className="mb-1.5 text-xs font-semibold text-[#64748B]">인원</div>
          <input
            value={headcount}
            onChange={(e) => onHeadcountChange(e.target.value.replace(/[^0-9]/g, ''))}
            inputMode="numeric"
            className="w-full rounded-lg border border-[#DDE3EC] px-[11px] py-[9px] text-[13.5px] text-[#1B0B28] outline-none"
          />
        </div>
      </div>

      <RepeatSection
        repeatOn={repeatOn}
        onToggle={onToggleRepeat}
        freq={freq}
        onFreqChange={onFreqChange}
        weekdays={weekdays}
        onToggleWeekday={onToggleWeekday}
        weeks={weeks}
        onWeeksChange={onWeeksChange}
        occurrences={occurrences}
        summaryLabel={summaryLabel}
      />

      <div className="mt-4 flex items-center gap-[9px]">
        <button
          type="button"
          onClick={onToggleAgree}
          className="flex h-4 w-4 flex-none cursor-pointer items-center justify-center rounded [font-size:10px]"
          style={{
            border: '1.5px solid #b611f5',
            background: agree ? '#b611f5' : '#fff',
            color: '#fff',
          }}
        >
          {agree ? '✓' : ''}
        </button>
        <span className="text-[13px] whitespace-nowrap text-[#4A5A6D]">이용 규칙을 읽었고, 사용 후 정리하겠습니다</span>
        <button type="button" onClick={onOpenRules} className="cursor-pointer text-[12.5px] font-semibold text-[#b611f5]">
          규칙 보기
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3.5 border-t border-[#EEF2F7] pt-4">
        <button
          type="button"
          disabled={!valid || !agree}
          onClick={onConfirm}
          className="flex-none rounded-[9px] px-6 py-[11px] text-sm font-bold whitespace-nowrap"
          style={
            valid && agree
              ? { background: '#b611f5', color: '#fff', cursor: 'pointer', boxShadow: '0 2px 8px rgba(182,17,245,.32)' }
              : { background: '#E7ECF3', color: '#A6B1BF', cursor: 'default' }
          }
        >
          {confirmLabel}
        </button>
        <div className="min-w-0 flex-1 text-[12.5px] leading-[1.5] text-[#8895A7]">{quotaNote}</div>
      </div>
    </div>
  );
}
