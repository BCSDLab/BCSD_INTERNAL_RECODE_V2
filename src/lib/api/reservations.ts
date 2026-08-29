import { apiFetch } from '@/lib/api/client';
import type {
  DailyReservationResponse,
  MonthlyOccupancyResponse,
  MyReservationResponse,
  ReservationCreateRequest,
  ReservationCreateResponse,
  ReservationDetailResponse,
} from '@/lib/api/types';

export function getDailyReservations(date: string): Promise<DailyReservationResponse> {
  return apiFetch<DailyReservationResponse>(`/v1/reservations/daily?date=${date}`);
}

export function getMonthlyOccupancy(month: string): Promise<MonthlyOccupancyResponse> {
  return apiFetch<MonthlyOccupancyResponse>(`/v1/reservations/monthly-occupancy?month=${month}`);
}

export function getMyMonthlyOccupancy(month: string): Promise<MonthlyOccupancyResponse> {
  return apiFetch<MonthlyOccupancyResponse>(`/v1/reservations/me/monthly-occupancy?month=${month}`);
}

export function getMyReservations(status: 'upcoming' | 'past'): Promise<MyReservationResponse> {
  return apiFetch<MyReservationResponse>(`/v1/reservations/me?status=${status}`);
}

export function createReservation(body: ReservationCreateRequest): Promise<ReservationCreateResponse> {
  return apiFetch<ReservationCreateResponse>('/v1/reservations', { method: 'POST', body: JSON.stringify(body) });
}

export function getReservationDetail(id: number): Promise<ReservationDetailResponse> {
  return apiFetch<ReservationDetailResponse>(`/v1/reservations/${id}`);
}

export function cancelReservation(id: number): Promise<void> {
  return apiFetch<void>(`/v1/reservations/${id}`, { method: 'DELETE' });
}

export function cancelReservationGroup(groupId: number): Promise<void> {
  return apiFetch<void>(`/v1/reservations/groups/${groupId}`, { method: 'DELETE' });
}
