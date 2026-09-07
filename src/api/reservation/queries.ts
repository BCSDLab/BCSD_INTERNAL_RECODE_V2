import { queryOptions } from '@tanstack/react-query';
import {
  getDailyReservations,
  getMonthlyOccupancy,
  getMyMonthlyOccupancy,
  getMyReservations,
  getReservationDetail,
} from './api';

export const reservationKeys = {
  monthlyOccupancy: (month: string) => ['reservation-monthly-occupancy', month] as const,
  myMonthlyOccupancy: (month: string) => ['reservation-my-monthly-occupancy', month] as const,
  daily: (date: string) => ['reservation-daily', date] as const,
  myReservations: (status: 'upcoming' | 'past') => ['reservation-mine', status] as const,
  detail: (id: number) => ['reservation-detail', id] as const,
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
