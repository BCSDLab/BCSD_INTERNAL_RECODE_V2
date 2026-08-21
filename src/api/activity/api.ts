import { apiClient } from '@/api/client';
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
  return apiClient.get<ActivityCategoryResponse[]>('/v1/admin/activity-categories');
}

export function createActivityCategory(body: { slug: string; name: string }) {
  return apiClient.post<ActivityCategoryResponse>('/v1/admin/activity-categories', body);
}

export function updateActivityCategoryHeader(categoryId: number, body: ActivityCategoryHeaderInput) {
  return apiClient.put<void>(`/v1/admin/activity-categories/${categoryId}`, body);
}

export function deleteActivityCategory(categoryId: number) {
  return apiClient.delete<void>(`/v1/admin/activity-categories/${categoryId}`);
}

export function reorderActivityCategories(ids: number[]) {
  return apiClient.patch<void>('/v1/admin/activity-categories/order', { ids });
}

export function listActivities(categoryId: number, size = 200) {
  return apiClient.get<PageResponse<ActivitySummaryResponse>>('/v1/admin/activities', { params: { categoryId, size } });
}

export function getActivitiesTotal() {
  return apiClient.get<PageResponse<ActivitySummaryResponse>>('/v1/admin/activities', { params: { size: 1 } });
}

export function getActivity(activityId: number) {
  return apiClient.get<ActivityDetailResponse>(`/v1/admin/activities/${activityId}`);
}

export function createActivity(body: ActivityInput) {
  return apiClient.post<ActivityDetailResponse>('/v1/admin/activities', body);
}

export function updateActivity(activityId: number, body: ActivityInput) {
  return apiClient.put<ActivityDetailResponse>(`/v1/admin/activities/${activityId}`, body);
}

export function deleteActivity(activityId: number) {
  return apiClient.delete<void>(`/v1/admin/activities/${activityId}`);
}

export function publishActivity(activityId: number, isPublished: boolean) {
  return apiClient.patch<void>(`/v1/admin/activities/${activityId}/publish`, { isPublished });
}

export function reorderActivities(categoryId: number, year: number, month: number, ids: number[]) {
  return apiClient.patch<void>('/v1/admin/activities/order', { ids }, { params: { categoryId, year, month } });
}

export function putActivityImages(activityId: number, imageUrls: string[]) {
  return apiClient.put<void>(`/v1/admin/activities/${activityId}/images`, { imageUrls });
}
