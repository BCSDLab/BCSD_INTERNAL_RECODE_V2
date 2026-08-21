import { apiFetch } from '@/api/client';
import type { ActivityCategoryResponse, ActivityDetailResponse, ActivitySummaryResponse, PageResponse } from './types';

interface ActivityCategoryHeaderInput {
  name: string;
  headline: string;
  heroImageUrl: string | null;
}

interface ActivityInput {
  categoryId: number;
  year: number;
  month: number;
  title: string;
  summary: string;
  content: string;
  externalUrl: string | null;
}

export function listActivityCategories() {
  return apiFetch<ActivityCategoryResponse[]>('/v1/admin/activity-categories');
}

export function createActivityCategory(body: { slug: string; name: string }) {
  return apiFetch<ActivityCategoryResponse>('/v1/admin/activity-categories', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updateActivityCategoryHeader(categoryId: number, body: ActivityCategoryHeaderInput) {
  return apiFetch<void>(`/v1/admin/activity-categories/${categoryId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export function deleteActivityCategory(categoryId: number) {
  return apiFetch<void>(`/v1/admin/activity-categories/${categoryId}`, { method: 'DELETE' });
}

export function reorderActivityCategories(ids: number[]) {
  return apiFetch<void>('/v1/admin/activity-categories/order', { method: 'PATCH', body: JSON.stringify({ ids }) });
}

export function listActivities(categoryId: number, size = 200) {
  return apiFetch<PageResponse<ActivitySummaryResponse>>(`/v1/admin/activities?categoryId=${categoryId}&size=${size}`);
}

export function getActivitiesTotal() {
  return apiFetch<PageResponse<ActivitySummaryResponse>>('/v1/admin/activities?size=1');
}

export function getActivity(activityId: number) {
  return apiFetch<ActivityDetailResponse>(`/v1/admin/activities/${activityId}`);
}

export function createActivity(body: ActivityInput) {
  return apiFetch<ActivityDetailResponse>('/v1/admin/activities', { method: 'POST', body: JSON.stringify(body) });
}

export function updateActivity(activityId: number, body: ActivityInput) {
  return apiFetch<ActivityDetailResponse>(`/v1/admin/activities/${activityId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export function deleteActivity(activityId: number) {
  return apiFetch<void>(`/v1/admin/activities/${activityId}`, { method: 'DELETE' });
}

export function publishActivity(activityId: number, isPublished: boolean) {
  return apiFetch<void>(`/v1/admin/activities/${activityId}/publish`, {
    method: 'PATCH',
    body: JSON.stringify({ isPublished }),
  });
}

export function reorderActivities(categoryId: number, year: number, month: number, ids: number[]) {
  return apiFetch<void>(`/v1/admin/activities/order?categoryId=${categoryId}&year=${year}&month=${month}`, {
    method: 'PATCH',
    body: JSON.stringify({ ids }),
  });
}

export function putActivityImages(activityId: number, imageUrls: string[]) {
  return apiFetch<void>(`/v1/admin/activities/${activityId}/images`, {
    method: 'PUT',
    body: JSON.stringify({ imageUrls }),
  });
}
