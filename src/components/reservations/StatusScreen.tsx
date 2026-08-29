'use client';

import { BookingForm, type BookingFormProps } from '@/components/reservations/BookingForm';
import { DailyTimeline } from '@/components/reservations/DailyTimeline';
import { MiniCalendar } from '@/components/reservations/MiniCalendar';
import type { TimelineRow } from '@/components/reservations/reservation-logic';

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
  showLoginPrompt: boolean;
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
  showLoginPrompt,
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
          <div className="flex flex-col gap-[5px] text-xs leading-[1.5] text-[#8895A7]">
            <div className="flex items-center gap-[7px]">
              <span className="inline-block h-1 w-5 rounded-full bg-[#b611f5]" />그 날 예약된 비율
            </div>
            <div>단건 예약은 오늘부터 2주까지, 반복 일정은 최대 12주까지</div>
          </div>
        }
      />

      <div className="min-w-0 flex-1 border-l border-[#E7ECF3] bg-[#FBFAFD] px-[26px] pt-6 pb-[26px]">
        <div className="flex items-center gap-2.5">
          <span className="text-[21px] font-bold tracking-[-0.4px] text-[#1B0B28]">{dateLabel}</span>
          <span className="rounded-md bg-[#EEF2F7] px-[9px] py-[3px] text-[11.5px] font-semibold text-[#64748B]">동아리방</span>
        </div>
        <div className="my-[5px] mb-4 text-[13px] text-[#8895A7]">{loading ? '불러오는 중...' : daySummary}</div>

        {errorMessage && (
          <div className="mb-4 rounded-lg border border-[rgba(179,67,58,.3)] bg-[#FBF6F5] px-3.5 py-2.5 text-[13px] text-[#B3433A]">
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

        {showLoginPrompt && (
          <div className="mt-[18px] rounded-[13px] border border-[#E4BBFB] bg-[#FBF1FE] p-[22px] text-center">
            <div className="text-sm font-bold text-[#1B0B28]">예약하려면 로그인이 필요합니다</div>
            <div className="mt-[5px] text-[12.5px] text-[#8895A7]">예약자 이름은 로그인 후에 보입니다</div>
            <a
              href="/login"
              className="mt-3.5 inline-block rounded-lg bg-[#b611f5] px-[26px] py-[9px] text-[13.5px] font-semibold text-white"
            >
              로그인
            </a>
          </div>
        )}

        {showPastNote && (
          <div className="mt-[18px] rounded-[11px] border border-dashed border-[#DDE3EC] bg-white px-4 py-3.5 text-[13px] text-[#8895A7]">
            지난 날짜입니다. 조회만 할 수 있습니다.
          </div>
        )}
      </div>
    </div>
  );
}
