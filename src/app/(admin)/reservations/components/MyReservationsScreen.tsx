'use client';

import { MiniCalendar } from '@/app/(admin)/reservations/components/MiniCalendar';
import type { MyReservationCard } from '@/app/(admin)/reservations/types';

interface MyReservationsScreenProps {
  viewMonth: Date;
  selectedDate: Date;
  today: Date;
  onSelectDate: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  ratioByDateKey: Map<string, number>;
  tab: 'upcoming' | 'past';
  onTabChange: (tab: 'upcoming' | 'past') => void;
  upcomingCards: MyReservationCard[];
  pastCards: MyReservationCard[];
  loading: boolean;
  errorMessage: string | null;
}

export function MyReservationsScreen({
  viewMonth,
  selectedDate,
  today,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  ratioByDateKey,
  tab,
  onTabChange,
  upcomingCards,
  pastCards,
  loading,
  errorMessage,
}: MyReservationsScreenProps) {
  const cards = tab === 'upcoming' ? upcomingCards : pastCards;

  return (
    <div className="flex items-stretch">
      <MiniCalendar
        viewMonth={viewMonth}
        selectedDate={selectedDate}
        today={today}
        onSelectDate={onSelectDate}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        ratioByDateKey={ratioByDateKey}
        footer={<div className="text-muted text-xs">보라색 막대 = 내 예약이 있는 날</div>}
      />

      <div className="border-line bg-panel2 min-w-0 flex-1 border-l px-[26px] pt-6 pb-[26px]">
        <div className="mb-4 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onTabChange('upcoming')}
            className="cursor-pointer rounded-[9px] px-[15px] py-2 text-[13.5px]"
            style={
              tab === 'upcoming'
                ? { background: 'var(--text)', color: 'var(--bg)', fontWeight: 700 }
                : { background: 'transparent', color: 'var(--muted)', fontWeight: 600 }
            }
          >
            다가오는 {upcomingCards.length}
          </button>
          <button
            type="button"
            onClick={() => onTabChange('past')}
            className="cursor-pointer rounded-[9px] px-[15px] py-2 text-[13.5px]"
            style={
              tab === 'past'
                ? { background: 'var(--text)', color: 'var(--bg)', fontWeight: 700 }
                : { background: 'transparent', color: 'var(--muted)', fontWeight: 600 }
            }
          >
            지난 예약 {pastCards.length}
          </button>
        </div>

        {errorMessage && (
          <div className="border-danger-line bg-danger-soft text-danger mb-4 rounded-lg border px-3.5 py-2.5 text-[13px]">
            {errorMessage}
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          {loading && <div className="text-muted py-10 text-center text-sm">불러오는 중...</div>}
          {!loading && cards.length === 0 && <div className="text-muted py-10 text-center text-sm">예약이 없습니다.</div>}
          {!loading &&
            cards.map((card) => (
            <div
              key={card.id}
              onClick={card.onClick}
              className="flex items-center gap-4 rounded-[13px] px-[18px] py-4"
              style={
                card.isPast
                  ? { background: 'var(--panel2)', border: '1px dashed var(--line)', color: 'var(--faint)' }
                  : { background: 'var(--panel)', border: '1px solid var(--line)', color: 'var(--text)', cursor: card.onClick ? 'pointer' : 'default' }
              }
            >
              <div className="w-[52px] flex-none text-center">
                <div className="text-faint text-[11.5px] font-semibold">{card.month}</div>
                <div className="text-[22px] leading-[1.1] font-bold tracking-[-0.5px]">{card.day}</div>
              </div>
              <div className="border-line min-w-0 flex-1 border-l pl-4">
                <div className="text-[14.5px] font-semibold [font-variant-numeric:tabular-nums]">{card.timeLabel}</div>
                <div className="text-muted mt-[3px] text-[12.5px]">{card.meta}</div>
              </div>
              <div
                className="text-[12.5px] font-semibold"
                style={{ color: card.isPast ? 'var(--faint)' : '#b611f5' }}
              >
                {card.isPast ? '다시 예약' : '상세'}
              </div>
            </div>
          ))}
        </div>

        <div className="text-muted mt-4 text-[12.5px]">시작 1시간 전까지 취소할 수 있습니다.</div>
      </div>
    </div>
  );
}
