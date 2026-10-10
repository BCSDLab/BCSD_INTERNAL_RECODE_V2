import { apiClient } from '@/api/client';
import { lookupMemberSlackIds, updateMemberSlackId as updateMemberSlackIdLive } from '@/api/member/api';
import {
  mockAddRosterMember,
  mockCreateExemption,
  mockCreateSemester,
  mockGetExemptionReasons,
  mockGetExemptions,
  mockGetRosterCandidates,
  mockGetSemesterCreatable,
  mockGetSemesterDues,
  mockGetSemesterRoster,
  mockGetSemesters,
  mockLinkSemesterEntries,
  mockLookupSlackIds,
  mockPreviewExemption,
  mockSendDuesNotifications,
  mockUpdateExemption,
  mockUpdateMemberSlackId,
  mockUpdateRosterMember,
} from './mock';
import { USE_DUES_NOTIFICATION_MOCK, USE_LEDGER_MOCK } from './mock-switch';
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
  RosterAddRequest,
  RosterCandidateListResponse,
  RosterMemberResponse,
  RosterUpdateRequest,
  SemesterCreatableResponse,
  SemesterCreateRequest,
  SemesterDuesDetailResponse,
  SemesterDuesListResponse,
  SemesterDuesSummaryResponse,
  SemesterId,
  SemesterRosterResponse,
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

// TODO(BE v2): 경로·필드 확정 필요
export function getSemesterRoster(semesterId: SemesterId) {
  if (USE_LEDGER_MOCK) return mockGetSemesterRoster(semesterId);
  return apiClient.get<SemesterRosterResponse>(`${BASE}/semesters/${semesterId}/roster`);
}

// TODO(BE v2): 경로·필드 확정 필요
export function getRosterCandidates(semesterId: SemesterId) {
  if (USE_LEDGER_MOCK) return mockGetRosterCandidates(semesterId);
  return apiClient.get<RosterCandidateListResponse>(`${BASE}/semesters/${semesterId}/roster/candidates`);
}

// TODO(BE v2): 경로·필드 확정 필요
export function addRosterMember(semesterId: SemesterId, body: RosterAddRequest) {
  if (USE_LEDGER_MOCK) return mockAddRosterMember(semesterId, body);
  return apiClient.post<RosterMemberResponse>(`${BASE}/semesters/${semesterId}/roster`, body);
}

// TODO(BE v2): 경로·필드 확정 필요
export function updateRosterMember(semesterId: SemesterId, memberId: number, body: RosterUpdateRequest) {
  if (USE_LEDGER_MOCK) return mockUpdateRosterMember(semesterId, memberId, body);
  return apiClient.patch<RosterMemberResponse>(`${BASE}/semesters/${semesterId}/roster/${memberId}`, body);
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
 * 행마다 따로 성공·실패한다(한 행이 409여도 나머지는 저장된다).
 */
export function updateMemberSlackIds(updates: { memberId: number; slackId: string | null }[]) {
  const save = USE_LEDGER_MOCK ? mockUpdateMemberSlackId : updateMemberSlackIdLive;
  return Promise.allSettled(updates.map(({ memberId, slackId }) => save(memberId, slackId)));
}

/** "자동 채우기" — 서버가 회원 이메일로 Slack을 조회하고, 찾은 값을 인명부에 바로 저장한다. */
export function lookupSlackIds(body: SlackIdLookupRequest) {
  if (USE_LEDGER_MOCK) return mockLookupSlackIds(body);
  return lookupMemberSlackIds(body.memberIds);
}

export function sendDuesNotifications(semesterId: SemesterId, body: DuesNotificationRequest) {
  if (USE_DUES_NOTIFICATION_MOCK) return mockSendDuesNotifications(semesterId, body);
  return apiClient.post<DuesNotificationResponse>(`${BASE}/semesters/${semesterId}/notifications`, body);
}
