import { apiClient } from '@/api/client';
import type {
  StudyPointResponse,
  TechStackResponse,
  TrackMasterResponse,
  TrackPageDetailResponse,
  TrackPageSummaryResponse,
} from './types';

export function listTracks() {
  return apiClient.get<TrackMasterResponse[]>('/v1/admin/tracks');
}

export function listTrackPages() {
  return apiClient.get<TrackPageSummaryResponse[]>('/v1/admin/track-pages');
}

export function getTrackPage(trackPageId: number) {
  return apiClient.get<TrackPageDetailResponse>(`/v1/admin/track-pages/${trackPageId}`);
}

export function createTrackPage(body: { trackId: number; displayName: string; tagline: string }) {
  return apiClient.post<TrackPageDetailResponse>('/v1/admin/track-pages', body);
}

export function updateTrackPageHeader(trackPageId: number, body: { displayName: string; tagline: string }) {
  return apiClient.put<TrackPageDetailResponse>(`/v1/admin/track-pages/${trackPageId}`, body);
}

export function deleteTrackPage(trackPageId: number) {
  return apiClient.delete<void>(`/v1/admin/track-pages/${trackPageId}`);
}

export function publishTrackPage(trackPageId: number, isPublished: boolean) {
  return apiClient.patch<void>(`/v1/admin/track-pages/${trackPageId}/publish`, { isPublished });
}

export function reorderTrackPages(ids: number[]) {
  return apiClient.patch<void>('/v1/admin/track-pages/order', { ids });
}

export function putStudyPoints(trackPageId: number, studyPoints: StudyPointResponse[]) {
  return apiClient.put<StudyPointResponse[]>(`/v1/admin/track-pages/${trackPageId}/study-points`, { studyPoints });
}

export function putTechStacks(trackPageId: number, techStackIds: number[]) {
  return apiClient.put<TechStackResponse[]>(`/v1/admin/track-pages/${trackPageId}/tech-stacks`, { techStackIds });
}

export function reorderTrackPageMembers(trackPageId: number, ids: number[]) {
  return apiClient.patch<void>(`/v1/admin/track-pages/${trackPageId}/members/order`, { ids });
}

export function setTrackPageMemberVisibility(trackPageId: number, memberId: number, isVisible: boolean) {
  return apiClient.patch<void>(`/v1/admin/track-pages/${trackPageId}/members/${memberId}/visibility`, { isVisible });
}

export function detachTrackPageMember(trackPageId: number, memberId: number) {
  return apiClient.delete<void>(`/v1/admin/track-pages/${trackPageId}/members/${memberId}`);
}

export function listTechStacks() {
  return apiClient.get<TechStackResponse[]>('/v1/admin/tech-stacks');
}

export function createTechStack(body: { name: string; iconUrl: string }) {
  return apiClient.post<TechStackResponse>('/v1/admin/tech-stacks', body);
}
