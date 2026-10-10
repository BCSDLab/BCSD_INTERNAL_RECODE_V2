import { apiClient } from '@/api/client';
import { lookupMemberSlackIds, updateMemberSlackId as updateMemberSlackIdLive } from '@/api/member/api';
import {
  mockCreateExemption,
  mockCreateSemester,
  mockGetExemptionReasons,
  mockGetExemptions,
  mockGetSemesterCreatable,
  mockGetSemesterDues,
  mockGetSemesters,
  mockLinkSemesterEntries,
  mockLookupSlackIds,
  mockPreviewExemption,
  mockSendDuesNotifications,
  mockUpdateExemption,
  mockUpdateMemberSlackId,
} from './mock';
import { USE_LEDGER_MOCK } from './mock-switch';
import type {
  DuesLinkBulkRequest,
  DuesLinkBulkResponse,
  DuesNotificationRequest,
  DuesNotificationResponse,
  ExemptionListResponse,
  ExemptionPreviewRequest,
  ExemptionPreviewResponse,
  ExemptionReasonListResponse,
  ExemptionResponse,
  ExemptionUpsertRequest,
  SemesterCreatableResponse,
  SemesterCreateRequest,
  SemesterDuesDetailResponse,
  SemesterDuesListResponse,
  SemesterDuesSummaryResponse,
  SemesterId,
  SlackIdLookupRequest,
} from './types';

const BASE = '/v1/admin/dues';

export function getSemesters() {
  if (USE_LEDGER_MOCK) return mockGetSemesters();
  return apiClient.get<SemesterDuesListResponse>(`${BASE}/semesters`);
}

export function getSemesterDues(semesterId: SemesterId) {
  if (USE_LEDGER_MOCK) return mockGetSemesterDues(semesterId);
  return apiClient.get<SemesterDuesDetailResponse>(`${BASE}/semesters/${semesterId}/members`);
}

/** "+ 회비 생성" 버튼을 보일지와, 만들 학기를 서버가 정해 준다. */
export function getSemesterCreatable() {
  if (USE_LEDGER_MOCK) return mockGetSemesterCreatable();
  return apiClient.get<SemesterCreatableResponse>(`${BASE}/semesters/creatable`);
}

export function createSemester(body: SemesterCreateRequest) {
  if (USE_LEDGER_MOCK) return mockCreateSemester(body);
  return apiClient.post<SemesterDuesSummaryResponse>(`${BASE}/semesters`, body);
}

export function linkSemesterEntries(semesterId: SemesterId, body: DuesLinkBulkRequest) {
  if (USE_LEDGER_MOCK) return mockLinkSemesterEntries(semesterId, body);
  return apiClient.post<DuesLinkBulkResponse>(`${BASE}/semesters/${semesterId}/links`, body);
}

export function getExemptions() {
  if (USE_LEDGER_MOCK) return mockGetExemptions();
  return apiClient.get<ExemptionListResponse>(`${BASE}/exemptions`);
}

export function getExemptionReasons() {
  if (USE_LEDGER_MOCK) return mockGetExemptionReasons();
  return apiClient.get<ExemptionReasonListResponse>(`${BASE}/exemption-reasons`);
}

export function createExemption(body: ExemptionUpsertRequest) {
  if (USE_LEDGER_MOCK) return mockCreateExemption(body);
  return apiClient.post<ExemptionResponse>(`${BASE}/exemptions`, body);
}

export function updateExemption(exemptionId: number, body: ExemptionUpsertRequest) {
  if (USE_LEDGER_MOCK) return mockUpdateExemption(exemptionId, body);
  return apiClient.put<ExemptionResponse>(`${BASE}/exemptions/${exemptionId}`, body);
}

export function previewExemption(semesterId: SemesterId, body: ExemptionPreviewRequest) {
  if (USE_LEDGER_MOCK) return mockPreviewExemption(semesterId, body);
  return apiClient.post<ExemptionPreviewResponse>(`${BASE}/semesters/${semesterId}/exemption-preview`, body);
}

/**
 * "Slack ID 입력" 모달의 저장. 회비 mock일 때는 회비 mock 회원(가짜 ID)에 저장하고,
 * 실제 API일 때는 인명부 API를 그대로 쓴다 — 회원 ID가 같은 체계가 되기 때문이다.
 */
export function updateMemberSlackIds(updates: { memberId: number; slackId: string | null }[]) {
  const save = USE_LEDGER_MOCK ? mockUpdateMemberSlackId : updateMemberSlackIdLive;
  return Promise.all(updates.map(({ memberId, slackId }) => save(memberId, slackId)));
}

/** "자동 채우기" — 서버가 회원 이메일로 Slack을 조회하고, 찾은 값을 인명부에 바로 저장한다. */
export function lookupSlackIds(body: SlackIdLookupRequest) {
  if (USE_LEDGER_MOCK) return mockLookupSlackIds(body);
  return lookupMemberSlackIds(body.memberIds);
}

export function sendDuesNotifications(semesterId: SemesterId, body: DuesNotificationRequest) {
  if (USE_LEDGER_MOCK) return mockSendDuesNotifications(semesterId, body);
  return apiClient.post<DuesNotificationResponse>(`${BASE}/semesters/${semesterId}/notifications`, body);
}
