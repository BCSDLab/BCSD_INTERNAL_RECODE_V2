export const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

export const DAY_MINUTES = 1440;
export const SINGLE_BOOKING_WINDOW_DAYS = 14;
export const CANCEL_CUTOFF_MINUTES = 60;
export const DAILY_LIMIT_MINUTES = 180;

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function toMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function atMidnight(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function isSameDay(a: Date, b: Date): boolean {
  return toDateKey(a) === toDateKey(b);
}

// Monday = 0 ... Sunday = 6, matching the design's 월~일 week header.
export function mondayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h < 10 ? '0' : ''}${h}:${m === 0 ? '00' : '30'}`;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}시간 ${m}분`;
  if (h) return `${h}시간`;
  return `${m}분`;
}

export function formatMonthLabel(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

export function formatDateLabel(date: Date): string {
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAY_LABELS[mondayIndex(date)]})`;
}

export interface MonthCell {
  date: Date;
  inMonth: boolean;
}

export function buildMonthCells(viewMonth: Date): MonthCell[] {
  const first = startOfMonth(viewMonth);
  const leadingDays = mondayIndex(first);
  const gridStart = addDays(first, -leadingDays);
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const totalCells = Math.ceil((leadingDays + daysInMonth) / 7) * 7;

  return Array.from({ length: totalCells }, (_, i) => {
    const date = addDays(gridStart, i);
    return { date, inMonth: date.getMonth() === viewMonth.getMonth() };
  });
}
