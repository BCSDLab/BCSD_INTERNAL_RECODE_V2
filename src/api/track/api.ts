import { apiFetch } from '@/api/client';
import type {
  StudyPointResponse,
  TechStackResponse,
  TrackMasterResponse,
  TrackPageDetailResponse,
  TrackPageSummaryResponse,
} from './types';

export function listTracks() {
  return apiFetch<TrackMasterResponse[]>('/v1/admin/tracks');
}

export function listTrackPages() {
  return apiFetch<TrackPageSummaryResponse[]>('/v1/admin/track-pages');
}

export function getTrackPage(trackPageId: number) {
  return apiFetch<TrackPageDetailResponse>(`/v1/admin/track-pages/${trackPageId}`);
}

export function createTrackPage(body: { trackId: number; displayName: string; tagline: string }) {
  return apiFetch<TrackPageDetailResponse>('/v1/admin/track-pages', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updateTrackPageHeader(trackPageId: number, body: { displayName: string; tagline: string }) {
  return apiFetch<TrackPageDetailResponse>(`/v1/admin/track-pages/${trackPageId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export function deleteTrackPage(trackPageId: number) {
  return apiFetch<void>(`/v1/admin/track-pages/${trackPageId}`, { method: 'DELETE' });
}

export function publishTrackPage(trackPageId: number, isPublished: boolean) {
  return apiFetch<void>(`/v1/admin/track-pages/${trackPageId}/publish`, {
    method: 'PATCH',
    body: JSON.stringify({ isPublished }),
  });
}

export function reorderTrackPages(ids: number[]) {
  return apiFetch<void>('/v1/admin/track-pages/order', { method: 'PATCH', body: JSON.stringify({ ids }) });
}

export function putStudyPoints(trackPageId: number, studyPoints: StudyPointResponse[]) {
  return apiFetch<StudyPointResponse[]>(`/v1/admin/track-pages/${trackPageId}/study-points`, {
    method: 'PUT',
    body: JSON.stringify({ studyPoints }),
  });
}

export function putTechStacks(trackPageId: number, techStackIds: number[]) {
  return apiFetch<TechStackResponse[]>(`/v1/admin/track-pages/${trackPageId}/tech-stacks`, {
    method: 'PUT',
    body: JSON.stringify({ techStackIds }),
  });
}

export function reorderTrackPageMembers(trackPageId: number, ids: number[]) {
  return apiFetch<void>(`/v1/admin/track-pages/${trackPageId}/members/order`, {
    method: 'PATCH',
    body: JSON.stringify({ ids }),
  });
}

export function setTrackPageMemberVisibility(trackPageId: number, memberId: number, isVisible: boolean) {
  return apiFetch<void>(`/v1/admin/track-pages/${trackPageId}/members/${memberId}/visibility`, {
    method: 'PATCH',
    body: JSON.stringify({ isVisible }),
  });
}

export function detachTrackPageMember(trackPageId: number, memberId: number) {
  return apiFetch<void>(`/v1/admin/track-pages/${trackPageId}/members/${memberId}`, { method: 'DELETE' });
}

export function listTechStacks() {
  return apiFetch<TechStackResponse[]>('/v1/admin/tech-stacks');
}

export function createTechStack(body: { name: string; iconUrl: string }) {
  return apiFetch<TechStackResponse>('/v1/admin/tech-stacks', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
