export type RepeatFrequency = 'WEEKLY' | 'BIWEEKLY';

export type JavaDayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface ReservationCreateRequest {
  date: string;
  start: number;
  end: number;
  purpose: string;
  headcount: number;
  repeat?: {
    frequency: RepeatFrequency;
    weekdays: JavaDayOfWeek[];
    endDate: string;
  };
}

export interface ReservationSummaryDto {
  id: number;
  date: string;
  start: number;
  end: number;
  purpose: string;
  headcount: number;
  groupId: number | null;
}

export interface SkippedOccurrenceDto {
  date: string;
  reason: string;
}

export interface ReservationCreateResponse {
  created: ReservationSummaryDto[];
  skipped: SkippedOccurrenceDto[];
}

export interface DailyReservationItemDto {
  id: number;
  start: number;
  end: number;
  memberName: string | null;
  purpose: string | null;
  headcount: number;
  mine: boolean;
  groupId: number | null;
}

export interface DailyReservationResponse {
  date: string;
  reservations: DailyReservationItemDto[];
}

export interface MonthlyOccupancyDayDto {
  date: string;
  reservedMinutes: number;
}

export interface MonthlyOccupancyResponse {
  month: string;
  days: MonthlyOccupancyDayDto[];
}

export interface MyReservationItemDto {
  id: number;
  date: string;
  start: number;
  end: number;
  purpose: string;
  headcount: number;
  groupId: number | null;
  repeating: boolean;
}

export interface MyReservationResponse {
  reservations: MyReservationItemDto[];
}

export interface ReservationGroupOccurrenceDto {
  id: number;
  date: string;
  cancelled: boolean;
}

export interface ReservationGroupDetailDto {
  id: number;
  frequency: RepeatFrequency;
  weekdays: JavaDayOfWeek[];
  endDate: string;
  occurrences: ReservationGroupOccurrenceDto[];
}

export interface ReservationDetailResponse {
  id: number;
  date: string;
  start: number;
  end: number;
  purpose: string;
  headcount: number;
  cancelledAt: string | null;
  group: ReservationGroupDetailDto | null;
}
