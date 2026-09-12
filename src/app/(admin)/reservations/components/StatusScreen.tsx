'use client';

import { BookingForm, type BookingFormProps } from '@/app/(admin)/reservations/components/BookingForm';
import { DailyTimeline } from '@/app/(admin)/reservations/components/DailyTimeline';
import { MiniCalendar } from '@/app/(admin)/reservations/components/MiniCalendar';
import type { TimelineRow } from '@/app/(admin)/reservations/reservation-logic';

interface StatusScreenProps {
  viewMonth: Date;
  selectedDate: Date;
  today: Date;
  onSelectDate: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  ratioByDateKey: Map<string, number>;
  dateLabel: string;
  daySummary: string;
  timelineRows: TimelineRow[];
  onSelectMine: (reservationId: number) => void;
  showForm: boolean;
  showPastNote: boolean;
  loading: boolean;
  errorMessage: string | null;
  createResultMessage: string | null;
  bookingForm: BookingFormProps;
}

export function StatusScreen({
  viewMonth,
  selectedDate,
  today,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onToday,
  ratioByDateKey,
  dateLabel,
  daySummary,
  timelineRows,
  onSelectMine,
  showForm,
  showPastNote,
  loading,
  errorMessage,
  createResultMessage,
  bookingForm,
}: StatusScreenProps) {
  return (
    <div className="flex items-stretch">
      <MiniCalendar
        viewMonth={viewMonth}
        selectedDate={selectedDate}
        today={today}
        onSelectDate={onSelectDate}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        onToday={onToday}
        ratioByDateKey={ratioByDateKey}
        footer={
          <div className="text-muted flex flex-col gap-[5px] text-xs leading-[1.5]">
            <div className="flex items-center gap-[7px]">
              <span className="inline-block h-1 w-5 rounded-full bg-[#b611f5]" />그 날 예약된 비율
            </div>
            <div>단건 예약은 오늘부터 2주까지, 반복 일정은 최대 12주까지</div>
          </div>
        }
      />

      <div className="border-line bg-panel2 min-w-0 flex-1 border-l px-[26px] pt-6 pb-[26px]">
        <div className="flex items-center gap-2.5">
          <span className="text-text text-[21px] font-bold tracking-[-0.4px]">{dateLabel}</span>
          <span className="bg-sunken text-muted rounded-md px-[9px] py-[3px] text-[11.5px] font-semibold">동아리방</span>
        </div>
        <div className="text-muted my-[5px] mb-4 text-[13px]">{loading ? '불러오는 중...' : daySummary}</div>

        {errorMessage && (
          <div className="border-danger-line bg-danger-soft text-danger mb-4 rounded-lg border px-3.5 py-2.5 text-[13px]">
            {errorMessage}
          </div>
        )}
        {createResultMessage && (
          <div className="mb-4 rounded-lg border border-[#E4BBFB] bg-[rgba(182,17,245,.06)] px-3.5 py-2.5 text-[13px] text-[#8A0DBA]">
            {createResultMessage}
          </div>
        )}

        <DailyTimeline rows={timelineRows} onSelectMine={onSelectMine} />

        {showForm && <BookingForm {...bookingForm} />}

        {showPastNote && (
          <div className="border-line bg-panel text-muted mt-[18px] rounded-[11px] border border-dashed px-4 py-3.5 text-[13px]">
            지난 날짜입니다. 조회만 할 수 있습니다.
          </div>
        )}
      </div>
    </div>
  );
}
