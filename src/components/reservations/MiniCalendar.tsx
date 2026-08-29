'use client';

import type { ReactNode } from 'react';
import { WEEKDAY_LABELS, buildMonthCells, formatMonthLabel, isSameDay, toDateKey } from '@/components/reservations/time-utils';

interface MiniCalendarProps {
  viewMonth: Date;
  selectedDate: Date;
  today: Date;
  onSelectDate: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday?: () => void;
  ratioByDateKey: Map<string, number>;
  footer: ReactNode;
}

export function MiniCalendar({
  viewMonth,
  selectedDate,
  today,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onToday,
  ratioByDateKey,
  footer,
}: MiniCalendarProps) {
  const cells = buildMonthCells(viewMonth);

  return (
    <div className="w-[428px] flex-none bg-[#FBFAFD] px-6 pt-6 pb-[22px]">
      <div className="mb-3.5 flex items-center gap-2.5">
        <span className="text-[19px] font-bold tracking-[-0.3px] text-[#1B0B28]">{formatMonthLabel(viewMonth)}</span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={onPrevMonth}
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[7px] border border-[#DDE3EC] text-[13px] text-[#8895A7]"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={onNextMonth}
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[7px] border border-[#DDE3EC] text-[13px] text-[#1B0B28]"
        >
          ›
        </button>
        {onToday && (
          <button
            type="button"
            onClick={onToday}
            className="cursor-pointer rounded-[7px] border border-[#b611f5] px-[11px] py-[5px] text-xs font-semibold text-[#b611f5]"
          >
            오늘
          </button>
        )}
      </div>

      <div className="grid grid-cols-7 pb-[7px] text-center text-[11.5px] font-semibold text-[#9AA6B5]">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label}>{label}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-[11px] border border-[#E7ECF3] bg-[#E7ECF3]">
        {cells.map(({ date, inMonth }) => {
          const key = toDateKey(date);
          const past = inMonth && date < today && !isSameDay(date, today);
          const selected = inMonth && isSameDay(date, selectedDate);
          const ratio = ratioByDateKey.get(key) ?? 0;

          let background = '#fff';
          let color = '#1B0B28';
          if (!inMonth) {
            background = '#FAFBFD';
            color = '#CBD3DD';
          } else if (past) {
            color = '#B4BEC9';
          }
          if (selected) {
            background = '#b611f5';
            color = '#fff';
          }
          const barColor = selected ? 'rgba(255,255,255,.85)' : past ? '#C3CEDA' : '#b611f5';

          return (
            <div
              key={key}
              onClick={inMonth ? () => onSelectDate(date) : undefined}
              className="relative min-h-[54px] p-2"
              style={{ background, color, cursor: inMonth ? 'pointer' : 'default' }}
            >
              <span className="block text-[12.5px] leading-[1.1] font-medium">{date.getDate()}</span>
              {inMonth && ratio > 0 && (
                <div
                  className="absolute bottom-[9px] left-2 h-1 max-w-[calc(100%-16px)] rounded-full"
                  style={{ width: `${ratio}%`, background: barColor }}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-[13px]">{footer}</div>
    </div>
  );
}
