import {
  DAILY_LIMIT_MINUTES,
  DAY_MINUTES,
  SINGLE_BOOKING_WINDOW_DAYS,
  addDays,
  formatDateLabel,
  formatMinutes,
  isSameDay,
  mondayIndex,
  toDateKey,
} from '@/components/reservations/time-utils';
import type { Occurrence, RepeatFrequency, Reservation } from '@/components/reservations/types';

export function hasOverlap(dayReservations: Reservation[], start: number, end: number): boolean {
  return dayReservations.some((r) => start < r.end && end > r.start);
}

export interface SlotValidation {
  valid: boolean;
  warning: string | null;
}

export function validateSlot(params: {
  date: Date;
  today: Date;
  nowMinutes: number;
  start: number;
  end: number;
  dayReservations: Reservation[];
  repeat: boolean;
}): SlotValidation {
  const { date, today, nowMinutes, start, end, dayReservations, repeat } = params;
  const isPastDay = date < today && !isSameDay(date, today);
  const isPastStart = isPastDay || (isSameDay(date, today) && start < nowMinutes);
  const blocked = hasOverlap(dayReservations, start, end);
  const myExistingMinutes = dayReservations.filter((r) => r.mine).reduce((sum, r) => sum + (r.end - r.start), 0);
  const tooLong = myExistingMinutes + (end - start) > DAILY_LIMIT_MINUTES;
  const diffDays = Math.round((date.getTime() - today.getTime()) / 86_400_000);
  const outOfWindow = !repeat && diffDays > SINGLE_BOOKING_WINDOW_DAYS;

  if (isPastStart) return { valid: false, warning: '이미 지난 시간입니다. 현재 시각 이후로 골라 주세요.' };
  if (blocked) return { valid: false, warning: '고른 시간에 이미 예약이 있습니다. 다른 시간을 골라 주세요.' };
  if (tooLong) return { valid: false, warning: '1인 하루 최대 3시간까지 예약할 수 있습니다.' };
  if (outOfWindow) return { valid: false, warning: '단건 예약은 오늘부터 2주 뒤까지만 가능합니다. 반복 일정으로 만들어 보세요.' };
  if (end <= start) return { valid: false, warning: null };
  return { valid: true, warning: null };
}

// 반복 예약 미리보기용 — 실제로 겹치는지는 이 시점엔 알 수 없다(선택한 날 외의 미래 날짜 데이터가 없음).
// 최종 겹침/한도 판정은 서버가 예약 생성 시점에 내려주는 created/skipped로 확인한다.
export function generateOccurrences(params: {
  startDate: Date;
  freq: RepeatFrequency;
  weekdays: number[];
  weeks: number;
  start: number;
  end: number;
}): Occurrence[] {
  const { startDate, freq, weekdays, weeks, start, end } = params;
  const step = freq === '격주' ? 2 : 1;
  const days = weekdays.length ? weekdays : [mondayIndex(startDate)];
  const occurrences: Occurrence[] = [];

  for (let offset = 0; offset <= weeks * 7; offset++) {
    const date = addDays(startDate, offset);
    if (!days.includes(mondayIndex(date))) continue;
    if (Math.floor(offset / 7) % step !== 0) continue;

    occurrences.push({ dateKey: toDateKey(date), dateLabel: formatDateLabel(date), start, end });
  }

  return occurrences;
}

export function repeatSummaryLabel(freq: RepeatFrequency, weeks: number, occurrences: Occurrence[]): string {
  return `${freq} · ${weeks}주간 · 총 ${occurrences.length}회 예정 (겹치는 날짜는 확정 시 자동으로 건너뜁니다)`;
}

export function formatRange(start: number, end: number): string {
  return `${formatMinutes(start)}–${formatMinutes(end)}`;
}

export interface TimelineRow {
  key: string;
  timeLabel: string;
  kind: 'free' | 'other' | 'mine';
  label: string;
  reservation: Reservation | null;
}

export function buildTimelineRows(dayReservations: Reservation[]): TimelineRow[] {
  const sorted = [...dayReservations].sort((a, b) => a.start - b.start);
  const rows: TimelineRow[] = [];
  let cursor = 0;

  const pushFree = (start: number, end: number) => {
    rows.push({ key: `free-${start}`, timeLabel: formatRange(start, end), kind: 'free', label: '비어 있음', reservation: null });
  };
  const pushBooked = (reservation: Reservation) => {
    const label = reservation.mine
      ? `내 예약 · ${reservation.purpose}`
      : reservation.memberName
        ? `${reservation.memberName} · ${reservation.purpose}`
        : '예약됨';
    rows.push({
      key: String(reservation.id),
      timeLabel: formatRange(reservation.start, reservation.end),
      kind: reservation.mine ? 'mine' : 'other',
      label,
      reservation,
    });
  };

  for (const reservation of sorted) {
    if (reservation.start > cursor) pushFree(cursor, reservation.start);
    pushBooked(reservation);
    cursor = reservation.end;
  }
  if (cursor < DAY_MINUTES) pushFree(cursor, DAY_MINUTES);

  return rows;
}
