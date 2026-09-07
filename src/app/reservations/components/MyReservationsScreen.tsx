'use client';

import { MiniCalendar } from '@/app/reservations/components/MiniCalendar';
import type { MyReservationCard } from '@/app/reservations/types';

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
        footer={<div className="text-xs text-[#8895A7]">보라색 막대 = 내 예약이 있는 날</div>}
      />

      <div className="min-w-0 flex-1 border-l border-[#E7ECF3] bg-[#FBFAFD] px-[26px] pt-6 pb-[26px]">
        <div className="mb-4 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onTabChange('upcoming')}
            className="cursor-pointer rounded-[9px] px-[15px] py-2 text-[13.5px]"
            style={
              tab === 'upcoming'
                ? { background: '#1B0B28', color: '#fff', fontWeight: 700 }
                : { background: 'transparent', color: '#8895A7', fontWeight: 600 }
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
                ? { background: '#1B0B28', color: '#fff', fontWeight: 700 }
                : { background: 'transparent', color: '#8895A7', fontWeight: 600 }
            }
          >
            지난 예약 {pastCards.length}
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-lg border border-[rgba(179,67,58,.3)] bg-[#FBF6F5] px-3.5 py-2.5 text-[13px] text-[#B3433A]">
            {errorMessage}
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          {loading && <div className="py-10 text-center text-sm text-[#94A3B0]">불러오는 중...</div>}
          {!loading && cards.length === 0 && <div className="py-10 text-center text-sm text-[#94A3B0]">예약이 없습니다.</div>}
          {!loading &&
            cards.map((card) => (
            <div
              key={card.id}
              onClick={card.onClick}
              className="flex items-center gap-4 rounded-[13px] px-[18px] py-4"
              style={
                card.isPast
                  ? { background: '#FAFBFD', border: '1px dashed #DDE3EC', color: '#94A3B0' }
                  : { background: '#fff', border: '1px solid #E1E8F1', color: '#1B0B28', cursor: card.onClick ? 'pointer' : 'default' }
              }
            >
              <div className="w-[52px] flex-none text-center">
                <div className="text-[11.5px] font-semibold text-[#9AA6B5]">{card.month}</div>
                <div className="text-[22px] leading-[1.1] font-bold tracking-[-0.5px]">{card.day}</div>
              </div>
              <div className="min-w-0 flex-1 border-l border-[#EEF2F7] pl-4">
                <div className="text-[14.5px] font-semibold [font-variant-numeric:tabular-nums]">{card.timeLabel}</div>
                <div className="mt-[3px] text-[12.5px] text-[#8895A7]">{card.meta}</div>
              </div>
              <div
                className="text-[12.5px] font-semibold"
                style={{ color: card.isPast ? '#94A3B0' : '#b611f5' }}
              >
                {card.isPast ? '다시 예약' : '상세'}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-[12.5px] text-[#8895A7]">시작 1시간 전까지 취소할 수 있습니다.</div>
      </div>
    </div>
  );
}
