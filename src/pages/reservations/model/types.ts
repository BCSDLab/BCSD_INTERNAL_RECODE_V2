export type ReservationScreen = 'status' | 'mine' | 'rules';

export type RepeatFrequency = '매주' | '격주';

export type RepeatWeeks = 2 | 4 | 8 | 12;

export interface Reservation {
  id: number;
  dateKey: string;
  start: number;
  end: number;
  memberName: string | null;
  purpose: string | null;
  headcount: number;
  mine: boolean;
  repeatGroupId: number | null;
}

export interface Occurrence {
  dateKey: string;
  dateLabel: string;
  start: number;
  end: number;
}

export interface MyReservationCard {
  id: string;
  month: string;
  day: string;
  timeLabel: string;
  meta: string;
  isPast: boolean;
  onClick?: () => void;
}
