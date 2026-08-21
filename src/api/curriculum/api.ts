import { apiClient } from '@/api/client';
import type { CurriculumSummaryResponse, CurriculumTreeResponse } from './types';

interface WeekRange {
  weekFrom: number;
  weekTo: number | null;
}

export function listCurriculums(trackPageId: number) {
  return apiClient.get<CurriculumSummaryResponse[]>(`/v1/admin/track-pages/${trackPageId}/curriculums`);
}

export function createCurriculum(
  trackPageId: number,
  body: { name: string | null; sourceCurriculumId: number | null },
) {
  return apiClient.post<CurriculumSummaryResponse>(`/v1/admin/track-pages/${trackPageId}/curriculums`, body);
}

export function deleteCurriculum(curriculumId: number) {
  return apiClient.delete<void>(`/v1/admin/curriculums/${curriculumId}`);
}

export function publishCurriculum(curriculumId: number, isPublished: boolean) {
  return apiClient.patch<void>(`/v1/admin/curriculums/${curriculumId}/publish`, { isPublished });
}

export function getCurriculumTree(curriculumId: number) {
  return apiClient.get<CurriculumTreeResponse>(`/v1/admin/curriculums/${curriculumId}`);
}

export function reorderWeeks(curriculumId: number, ids: number[]) {
  return apiClient.patch<void>(`/v1/admin/curriculums/${curriculumId}/weeks/order`, { ids });
}

export function addWeek(curriculumId: number, range: WeekRange) {
  return apiClient.post<{ id: number }>(`/v1/admin/curriculums/${curriculumId}/weeks`, range);
}

export function renameWeek(weekId: number, range: WeekRange) {
  return apiClient.put<void>(`/v1/admin/weeks/${weekId}`, range);
}

export function deleteWeek(weekId: number) {
  return apiClient.delete<void>(`/v1/admin/weeks/${weekId}`);
}

export function createTopic(weekId: number, title = '새 토픽') {
  return apiClient.post<void>(`/v1/admin/weeks/${weekId}/topics`, { title });
}

export function reorderTopics(weekId: number, ids: number[]) {
  return apiClient.patch<void>(`/v1/admin/weeks/${weekId}/topics/order`, { ids });
}

export function updateTopicTitle(topicId: number, title: string) {
  return apiClient.put<void>(`/v1/admin/topics/${topicId}`, { title });
}

export function updateTopicDetails(topicId: number, contents: string[]) {
  return apiClient.put<void>(`/v1/admin/topics/${topicId}/details`, { contents });
}

export function deleteTopic(topicId: number) {
  return apiClient.delete<void>(`/v1/admin/topics/${topicId}`);
}
