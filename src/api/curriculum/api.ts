import { apiFetch } from '@/api/client';
import type { CurriculumSummaryResponse, CurriculumTreeResponse } from './types';

interface WeekRange {
  weekFrom: number;
  weekTo: number | null;
}

export function listCurriculums(trackPageId: number) {
  return apiFetch<CurriculumSummaryResponse[]>(`/v1/admin/track-pages/${trackPageId}/curriculums`);
}

export function createCurriculum(
  trackPageId: number,
  body: { name: string | null; sourceCurriculumId: number | null },
) {
  return apiFetch<CurriculumSummaryResponse>(`/v1/admin/track-pages/${trackPageId}/curriculums`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function deleteCurriculum(curriculumId: number) {
  return apiFetch<void>(`/v1/admin/curriculums/${curriculumId}`, { method: 'DELETE' });
}

export function publishCurriculum(curriculumId: number, isPublished: boolean) {
  return apiFetch<void>(`/v1/admin/curriculums/${curriculumId}/publish`, {
    method: 'PATCH',
    body: JSON.stringify({ isPublished }),
  });
}

export function getCurriculumTree(curriculumId: number) {
  return apiFetch<CurriculumTreeResponse>(`/v1/admin/curriculums/${curriculumId}`);
}

export function reorderWeeks(curriculumId: number, ids: number[]) {
  return apiFetch<void>(`/v1/admin/curriculums/${curriculumId}/weeks/order`, {
    method: 'PATCH',
    body: JSON.stringify({ ids }),
  });
}

export function addWeek(curriculumId: number, range: WeekRange) {
  return apiFetch<{ id: number }>(`/v1/admin/curriculums/${curriculumId}/weeks`, {
    method: 'POST',
    body: JSON.stringify(range),
  });
}

export function renameWeek(weekId: number, range: WeekRange) {
  return apiFetch<void>(`/v1/admin/weeks/${weekId}`, { method: 'PUT', body: JSON.stringify(range) });
}

export function deleteWeek(weekId: number) {
  return apiFetch<void>(`/v1/admin/weeks/${weekId}`, { method: 'DELETE' });
}

export function createTopic(weekId: number, title = '새 토픽') {
  return apiFetch<void>(`/v1/admin/weeks/${weekId}/topics`, { method: 'POST', body: JSON.stringify({ title }) });
}

export function reorderTopics(weekId: number, ids: number[]) {
  return apiFetch<void>(`/v1/admin/weeks/${weekId}/topics/order`, { method: 'PATCH', body: JSON.stringify({ ids }) });
}

export function updateTopicTitle(topicId: number, title: string) {
  return apiFetch<void>(`/v1/admin/topics/${topicId}`, { method: 'PUT', body: JSON.stringify({ title }) });
}

export function updateTopicDetails(topicId: number, contents: string[]) {
  return apiFetch<void>(`/v1/admin/topics/${topicId}/details`, { method: 'PUT', body: JSON.stringify({ contents }) });
}

export function deleteTopic(topicId: number) {
  return apiFetch<void>(`/v1/admin/topics/${topicId}`, { method: 'DELETE' });
}
