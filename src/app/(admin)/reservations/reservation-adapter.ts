import { formatRange } from '@/app/(admin)/reservations/reservation-logic';
import {
  CANCEL_CUTOFF_MINUTES,
  WEEKDAY_LABELS,
  formatDateLabel,
  parseDateKey,
  toDateKey,
} from '@/app/(admin)/reservations/time-utils';
import type { MyReservationCard, Reservation } from '@/app/(admin)/reservations/types';
import type {
  DailyReservationItemDto,
  JavaDayOfWeek,
  MonthlyOccupancyResponse,
  MyReservationItemDto,
  ReservationCreateRequest,
  ReservationDetailResponse,
} from '@/api/reservation/types';

const WEEKDAY_TO_JAVA: JavaDayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

export function mondayIndexToJavaDayOfWeek(index: number): JavaDayOfWeek {
  return WEEKDAY_TO_JAVA[index];
}

export function javaDayOfWeekToMondayIndex(day: JavaDayOfWeek): number {
  return WEEKDAY_TO_JAVA.indexOf(day);
}

export function javaDayOfWeekLabel(day: JavaDayOfWeek): string {
  return WEEKDAY_LABELS[javaDayOfWeekToMondayIndex(day)];
}

export function toUiReservationFromDaily(item: DailyReservationItemDto, dateKey: string): Reservation {
  return {
    id: item.id,
    dateKey,
    start: item.start,
    end: item.end,
    memberName: item.memberName,
    purpose: item.purpose,
    headcount: item.headcount,
    mine: item.mine,
    repeatGroupId: item.groupId,
  };
}

export function toMyReservationCard(item: MyReservationItemDto, isPast: boolean, onOpen: (id: number) => void): MyReservationCard {
  const date = parseDateKey(item.date);
  return {
    id: String(item.id),
    month: `${date.getMonth() + 1}월`,
    day: String(date.getDate()),
    timeLabel: formatRange(item.start, item.end),
    meta: item.repeating ? `${item.purpose} · ${item.headcount}명 · 반복 예약` : `${item.purpose} · ${item.headcount}명`,
    isPast,
    onClick: isPast ? undefined : () => onOpen(item.id),
  };
}

export function toOccupancyRatioMap(response: MonthlyOccupancyResponse): Map<string, number> {
  const map = new Map<string, number>();
  for (const day of response.days) {
    map.set(day.date, Math.round((day.reservedMinutes / 1440) * 100));
  }
  return map;
}

export function buildCreateRequest(params: {
  selectedDate: Date;
  start: number;
  end: number;
  purpose: string;
  headcount: number;
  repeat: {
    freq: '매주' | '격주';
    weekdays: number[];
    endDate: Date;
  } | null;
}): ReservationCreateRequest {
  const { selectedDate, start, end, purpose, headcount, repeat } = params;
  return {
    date: toDateKey(selectedDate),
    start,
    end,
    purpose,
    headcount,
    repeat: repeat
      ? {
          frequency: repeat.freq === '격주' ? 'BIWEEKLY' : 'WEEKLY',
          weekdays: repeat.weekdays.map(mondayIndexToJavaDayOfWeek),
          endDate: toDateKey(repeat.endDate),
        }
      : undefined,
  };
}

export interface ReservationDetailView {
  id: number;
  dateKey: string;
  dateLabel: string;
  start: number;
  end: number;
  purpose: string;
  headcount: number;
  cancelled: boolean;
  cancellable: boolean;
  repeatGroupId: number | null;
  repeatLabel: string | null;
  occurrences: { id: number; dateLabel: string; cancelled: boolean; isCurrent: boolean }[];
}

export function toDetailView(detail: ReservationDetailResponse, now: Date): ReservationDetailView {
  const date = parseDateKey(detail.date);
  const startAt = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, detail.start);
  const cancellable = !detail.cancelledAt && startAt.getTime() - now.getTime() >= CANCEL_CUTOFF_MINUTES * 60 * 1000;

  let repeatLabel: string | null = null;
  let occurrences: ReservationDetailView['occurrences'] = [];
  if (detail.group) {
    const { group } = detail;
    const weekdayLabel = group.weekdays
      .slice()
      .sort((a, b) => javaDayOfWeekToMondayIndex(a) - javaDayOfWeekToMondayIndex(b))
      .map(javaDayOfWeekLabel)
      .join('·');
    const endDate = parseDateKey(group.endDate);
    const freqLabel = group.frequency === 'BIWEEKLY' ? '격주' : '매주';
    const total = group.occurrences.length;
    const index = group.occurrences.findIndex((o) => o.id === detail.id) + 1;
    repeatLabel = `${freqLabel} ${weekdayLabel}요일 · ${endDate.getMonth() + 1}월 ${endDate.getDate()}일까지 (${total}회 중 ${index}회)`;
    occurrences = group.occurrences.map((o) => ({
      id: o.id,
      dateLabel: formatDateLabel(parseDateKey(o.date)),
      cancelled: o.cancelled,
      isCurrent: o.id === detail.id,
    }));
  }

  return {
    id: detail.id,
    dateKey: detail.date,
    dateLabel: formatDateLabel(date),
    start: detail.start,
    end: detail.end,
    purpose: detail.purpose,
    headcount: detail.headcount,
    cancelled: !!detail.cancelledAt,
    cancellable,
    repeatGroupId: detail.group?.id ?? null,
    repeatLabel,
    occurrences,
  };
}
