import { queryOptions } from '@tanstack/react-query';

import {
  getDailyReservations,
  getMonthlyOccupancy,
  getMyMonthlyOccupancy,
  getMyReservations,
  getReservationDetail,
} from './api';

const RESERVATION_KEY = ['reservations'] as const;

export const reservationKeys = {
  all: () => RESERVATION_KEY,
  monthlyOccupancy: (month: string) => [...RESERVATION_KEY, 'monthly-occupancy', month] as const,
  myMonthlyOccupancy: (month: string) => [...RESERVATION_KEY, 'my-monthly-occupancy', month] as const,
  daily: (date: string) => [...RESERVATION_KEY, 'daily', date] as const,
  myReservations: (status: 'upcoming' | 'past') => [...RESERVATION_KEY, 'mine', status] as const,
  detail: (id: number) => [...RESERVATION_KEY, 'detail', id] as const,
};

export const reservationQueries = {
  monthlyOccupancy: (month: string) =>
    queryOptions({ queryKey: reservationKeys.monthlyOccupancy(month), queryFn: () => getMonthlyOccupancy(month) }),
  myMonthlyOccupancy: (month: string) =>
    queryOptions({
      queryKey: reservationKeys.myMonthlyOccupancy(month),
      queryFn: () => getMyMonthlyOccupancy(month),
    }),
  daily: (date: string) =>
    queryOptions({ queryKey: reservationKeys.daily(date), queryFn: () => getDailyReservations(date) }),
  myReservations: (status: 'upcoming' | 'past') =>
    queryOptions({ queryKey: reservationKeys.myReservations(status), queryFn: () => getMyReservations(status) }),
  detail: (id: number) =>
    queryOptions({ queryKey: reservationKeys.detail(id), queryFn: () => getReservationDetail(id) }),
};
