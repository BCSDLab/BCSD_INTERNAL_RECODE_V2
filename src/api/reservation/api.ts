import { apiClient } from '@/api/client';
import type {
  DailyReservationResponse,
  MonthlyOccupancyResponse,
  MyReservationResponse,
  ReservationCreateRequest,
  ReservationCreateResponse,
  ReservationDetailResponse,
} from './types';

export function getDailyReservations(date: string) {
  return apiClient.get<DailyReservationResponse>('/v1/reservations/daily', { params: { date } });
}

export function getMonthlyOccupancy(month: string) {
  return apiClient.get<MonthlyOccupancyResponse>('/v1/reservations/monthly-occupancy', { params: { month } });
}

export function getMyMonthlyOccupancy(month: string) {
  return apiClient.get<MonthlyOccupancyResponse>('/v1/reservations/me/monthly-occupancy', { params: { month } });
}

export function getMyReservations(status: 'upcoming' | 'past') {
  return apiClient.get<MyReservationResponse>('/v1/reservations/me', { params: { status } });
}

export function createReservation(body: ReservationCreateRequest) {
  return apiClient.post<ReservationCreateResponse>('/v1/reservations', body);
}

export function getReservationDetail(id: number) {
  return apiClient.get<ReservationDetailResponse>(`/v1/reservations/${id}`);
}

export function cancelReservation(id: number) {
  return apiClient.delete<void>(`/v1/reservations/${id}`);
}

export function cancelReservationGroup(groupId: number) {
  return apiClient.delete<void>(`/v1/reservations/groups/${groupId}`);
}
