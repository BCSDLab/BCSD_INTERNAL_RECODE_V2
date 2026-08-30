import { apiClient } from '@/api/client';
import type {
  AdminMentorSlotResponse,
  AdminQnaResponse,
  AdminRecruitLinkResponse,
  RecruitLinkHistoryResponse,
  RecruitLinkUpdateRequest,
} from './types';

export function listMentorSlots() {
  return apiClient.get<AdminMentorSlotResponse[]>('/v1/admin/mentor-slots');
}

export function addMentorSlot(memberId: number) {
  return apiClient.post<AdminMentorSlotResponse[]>('/v1/admin/mentor-slots', { memberId });
}

export function removeMentorSlot(memberId: number) {
  return apiClient.delete<void>(`/v1/admin/mentor-slots/${memberId}`);
}

export function reorderMentorSlots(ids: number[]) {
  return apiClient.patch<void>('/v1/admin/mentor-slots/order', { ids });
}

export function listQnaItems() {
  return apiClient.get<AdminQnaResponse[]>('/v1/admin/qna');
}

export function createQnaItem(body: { question: string; answer: string }) {
  return apiClient.post<AdminQnaResponse>('/v1/admin/qna', body);
}

export function updateQnaItem(id: number, body: { question: string; answer: string }) {
  return apiClient.put<AdminQnaResponse>(`/v1/admin/qna/${id}`, body);
}

export function deleteQnaItem(id: number) {
  return apiClient.delete<void>(`/v1/admin/qna/${id}`);
}

export function publishQnaItem(id: number, isPublished: boolean) {
  return apiClient.patch<void>(`/v1/admin/qna/${id}/publish`, { isPublished });
}

export function reorderQnaItems(ids: number[]) {
  return apiClient.patch<void>('/v1/admin/qna/order', { ids });
}

export function getRecruitLink() {
  return apiClient.get<AdminRecruitLinkResponse | null>('/v1/admin/recruit-link');
}

export function updateRecruitLink(body: RecruitLinkUpdateRequest) {
  return apiClient.put<AdminRecruitLinkResponse>('/v1/admin/recruit-link', body);
}

export function getRecruitLinkHistory() {
  return apiClient.get<RecruitLinkHistoryResponse[]>('/v1/admin/recruit-link/history');
}
