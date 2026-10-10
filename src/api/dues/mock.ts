import { ApiError } from '@/api/client';
import type { LedgerEntryResponse } from '@/api/ledger/types';
import type { SlackIdLookupResult } from '@/api/member/api';
import {
  addSemester,
  editableRoster,
  entries,
  exemptionReasons,
  exemptions,
  findMember,
  issueExemptionId,
  listMembers,
  parseSemesterId,
  respond,
  semesterIds,
  semesterMembers,
  semesterRoster,
  semesterSummary,
} from './mock-db';
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
  SlackIdLookupResponse,
} from './types';

/** 회비 mock. 저장소·집계는 ./mock-db에 있고, 여기서는 엔드포인트 하나당 함수 하나로 응답을 만든다. */

function requireMembers(semesterId: SemesterId) {
  const members = semesterMembers(semesterId);
  if (!members) throw new ApiError(404, '학기 회비를 찾을 수 없습니다.');
  return members;
}

/**
 * 장부 기록 하나를 회원의 학기 회비에 연결한다. 입금·출금 모두 같은 흐름이다 —
 * 입금은 납부액에 더해지고 출금은 빠진다. 연결하면 분류는 회비가 된다.
 */
export function linkEntryToMember(entry: LedgerEntryResponse, memberId: number, semesterId: SemesterId) {
  const member = requireMembers(semesterId).find((item) => item.memberId === memberId);
  if (!member) throw new ApiError(404, '이 학기 회비 대상 회원이 아닙니다.');
  entry.category = 'DUES';
  entry.linkStatus = 'CONFIRMED';
  entry.duesLink = {
    memberId,
    memberName: member.name,
    studentNumber: member.studentNumber,
    track: member.track,
    semesterId,
    requiredAmount: member.assessedAmount ?? 0,
  };
}

export function mockGetSemesters(): Promise<SemesterDuesListResponse> {
  return respond({ semesters: semesterIds().map((id) => semesterSummary(id)!) });
}

export function mockGetSemesterDues(semesterId: SemesterId): Promise<SemesterDuesDetailResponse> {
  const semester = semesterSummary(semesterId);
  if (!semester) return Promise.reject(new ApiError(404, '학기 회비를 찾을 수 없습니다.'));
  return respond({ semester, members: requireMembers(semesterId) });
}

/** 오늘 날짜의 학기 — 1학기 3~8월, 2학기 9~다음 해 2월. */
function semesterOfDate(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 8) return { year, term: 1 as const };
  return month >= 9 ? { year, term: 2 as const } : { year: year - 1, term: 2 as const };
}

function nextOf({ year, term }: { year: number; term: 1 | 2 }) {
  return term === 1 ? { year, term: 2 as const } : { year: year + 1, term: 1 as const };
}

const semesterOrder = ({ year, term }: { year: number; term: 1 | 2 }) => year * 2 + term;

/** 백엔드가 할 판단 — 만들 학기(가장 최근 학기의 다음)가 현재 학기의 바로 다음 학기 이내인지. */
function semesterCreatable(): SemesterCreatableResponse {
  const current = semesterOfDate(new Date());
  const latestId = semesterIds()[0];
  const nextSemester = latestId ? nextOf(parseSemesterId(latestId)) : current;
  return {
    currentSemesterId: `${current.year}-${current.term}`,
    nextSemester,
    creatable: semesterOrder(nextSemester) <= semesterOrder(nextOf(current)),
  };
}

export function mockGetSemesterCreatable(): Promise<SemesterCreatableResponse> {
  return respond(semesterCreatable());
}

export function mockCreateSemester(body: SemesterCreateRequest): Promise<SemesterDuesSummaryResponse> {
  const semesterId = `${body.year}-${body.term}`;
  if (semesterSummary(semesterId)) return Promise.reject(new ApiError(409, '이미 생성된 학기 회비입니다.'));
  const { nextSemester, creatable } = semesterCreatable();
  if (!creatable || body.year !== nextSemester.year || body.term !== nextSemester.term) {
    return Promise.reject(new ApiError(400, '현재 학기의 바로 다음 학기까지만 만들 수 있습니다.'));
  }
  addSemester(semesterId, body.monthlyAmount);
  return respond(semesterSummary(semesterId)!);
}

export function mockLinkSemesterEntries(
  semesterId: SemesterId,
  body: DuesLinkBulkRequest,
): Promise<DuesLinkBulkResponse> {
  let linkedCount = 0;
  for (const link of body.links) {
    const entry = entries.find((item) => item.id === link.entryId);
    if (!entry || entry.linkStatus === 'CONFIRMED') continue;
    linkEntryToMember(entry, link.memberId, semesterId);
    linkedCount += 1;
  }
  return respond({ linkedCount });
}

// ---------- 학기 명단 ----------

function requireEditableRoster(semesterId: SemesterId) {
  if (!semesterRoster(semesterId)) throw new ApiError(404, '학기 회비를 찾을 수 없습니다.');
  const roster = editableRoster(semesterId);
  if (!roster) throw new ApiError(409, '마감된 학기의 명단은 바꿀 수 없습니다.');
  return roster;
}

function rosterMember(semesterId: SemesterId, memberId: number): RosterMemberResponse {
  return semesterRoster(semesterId)!.find((member) => member.memberId === memberId)!;
}

export function mockGetSemesterRoster(semesterId: SemesterId): Promise<SemesterRosterResponse> {
  const members = semesterRoster(semesterId);
  if (!members) return Promise.reject(new ApiError(404, '학기 회비를 찾을 수 없습니다.'));
  return respond({ members });
}

/** 명단에 없는 회원. 실제로는 인명부(회비 대상 여부와 무관한 전체 회원)에서 고른다. */
export function mockGetRosterCandidates(semesterId: SemesterId): Promise<RosterCandidateListResponse> {
  const roster = semesterRoster(semesterId);
  if (!roster) return Promise.reject(new ApiError(404, '학기 회비를 찾을 수 없습니다.'));
  const inRoster = new Set(roster.map((member) => member.memberId));
  return respond({
    members: listMembers()
      .filter((member) => !inRoster.has(member.id))
      .map(({ id, name, studentNumber, track }) => ({ memberId: id, name, studentNumber, track })),
  });
}

export function mockAddRosterMember(semesterId: SemesterId, body: RosterAddRequest): Promise<RosterMemberResponse> {
  try {
    const roster = requireEditableRoster(semesterId);
    if (!findMember(body.memberId)) throw new ApiError(404, '회원을 찾을 수 없습니다.');
    if (roster.some((row) => row.memberId === body.memberId)) throw new ApiError(409, '이미 명단에 있는 회원입니다.');
    roster.push({ memberId: body.memberId, applicable: body.applicable });
    return respond(rosterMember(semesterId, body.memberId));
  } catch (error) {
    return Promise.reject(error);
  }
}

export function mockUpdateRosterMember(
  semesterId: SemesterId,
  memberId: number,
  body: RosterUpdateRequest,
): Promise<RosterMemberResponse> {
  try {
    const row = requireEditableRoster(semesterId).find((item) => item.memberId === memberId);
    if (!row) throw new ApiError(404, '명단에 없는 회원입니다.');
    row.applicable = body.applicable;
    return respond(rosterMember(semesterId, memberId));
  } catch (error) {
    return Promise.reject(error);
  }
}

// ---------- 면제 ----------

function toExemption(id: number, body: ExemptionUpsertRequest): ExemptionResponse {
  if (!findMember(body.memberId)) throw new ApiError(404, '회원을 찾을 수 없습니다.');
  if (body.endMonth !== null && body.endMonth < body.startMonth) {
    throw new ApiError(400, '종료 월은 시작 월보다 빠를 수 없습니다.');
  }
  return { id, ...body, reason: body.reason.trim().normalize('NFC') };
}

function rememberReason(reason: string) {
  if (!exemptionReasons.includes(reason)) exemptionReasons.push(reason);
}

export function mockGetExemptions(): Promise<ExemptionListResponse> {
  return respond({ exemptions });
}

export function mockGetExemptionReasons(): Promise<ExemptionReasonListResponse> {
  return respond({ reasons: exemptionReasons });
}

export function mockCreateExemption(body: ExemptionUpsertRequest): Promise<ExemptionResponse> {
  const exemption = toExemption(issueExemptionId(), body);
  exemptions.push(exemption);
  rememberReason(exemption.reason);
  return respond(exemption);
}

export function mockUpdateExemption(exemptionId: number, body: ExemptionUpsertRequest): Promise<ExemptionResponse> {
  const index = exemptions.findIndex((item) => item.id === exemptionId);
  if (index < 0) return Promise.reject(new ApiError(404, '면제 기록을 찾을 수 없습니다.'));
  const exemption = toExemption(exemptionId, body);
  exemptions[index] = exemption;
  rememberReason(exemption.reason);
  return respond(exemption);
}

export function mockPreviewExemption(
  semesterId: SemesterId,
  { editingId, ...body }: ExemptionPreviewRequest,
): Promise<ExemptionPreviewResponse> {
  const draft = toExemption(editingId ?? -1, body);
  const nextExemptions = editingId
    ? exemptions.map((item) => (item.id === editingId ? draft : item))
    : [...exemptions, draft];
  const before = requireMembers(semesterId).find((member) => member.memberId === body.memberId);
  const after = semesterMembers(semesterId, nextExemptions)?.find((member) => member.memberId === body.memberId);
  if (!before || !after) return Promise.reject(new ApiError(404, '이 학기 회비 대상 회원이 아닙니다.'));
  return respond({ before, after });
}

// ---------- Slack ----------

function slackIdOwner(slackId: string, exceptMemberId: number) {
  return listMembers().find((member) => member.id !== exceptMemberId && member.slackId === slackId);
}

/** 인명부 Slack ID 저장. 실제로는 회원 API(PATCH /v1/admin/members/{id}/slack-id)다. 다른 회원이 쓰는 ID면 409. */
export function mockUpdateMemberSlackId(memberId: number, slackId: string | null): Promise<void> {
  const member = findMember(memberId);
  if (!member) return Promise.reject(new ApiError(404, '회원을 찾을 수 없습니다.'));
  const owner = slackId ? slackIdOwner(slackId, memberId) : undefined;
  if (owner) return Promise.reject(new ApiError(409, `이미 ${owner.name} 회원이 사용 중인 Slack ID입니다.`));
  member.slackId = slackId;
  return respond(undefined);
}

/** 이메일로 Slack 계정 조회(findSlackIdByEmail) → 찾은 값은 바로 인명부에 저장한다(SAVED일 때만). */
export function mockLookupSlackIds(body: SlackIdLookupRequest): Promise<SlackIdLookupResponse> {
  const results = body.memberIds.map((memberId): SlackIdLookupResult => {
    const member = findMember(memberId);
    if (!member) return { memberId, slackId: null, status: 'MEMBER_NOT_FOUND', ownerName: null };
    if (member.slackLookupFails) return { memberId, slackId: null, status: 'FAILED', ownerName: null };
    const slackId = member.slackLookupId;
    if (!slackId) return { memberId, slackId: null, status: 'NOT_FOUND', ownerName: null };
    const owner = slackIdOwner(slackId, memberId);
    if (owner) return { memberId, slackId: null, status: 'DUPLICATED', ownerName: owner.name };
    member.slackId = slackId;
    return { memberId, slackId, status: 'SAVED', ownerName: null };
  });
  return respond({ results }, 600);
}

/**
 * 알림 발송 mock. 회비가 live여도 발송은 mock일 수 있으므로(NEXT_PUBLIC_DUES_NOTIFICATION_API),
 * mock 회원 저장소에 없는 회원은 보낸 것으로 친다.
 */
export function mockSendDuesNotifications(
  _semesterId: SemesterId,
  body: DuesNotificationRequest,
): Promise<DuesNotificationResponse> {
  const failed = body.messages
    .filter((item) => {
      const member = findMember(item.memberId);
      return member !== undefined && !member.slackId;
    })
    .map((item) => ({ memberId: item.memberId, reason: 'SLACK_ID_MISSING' as const }));
  return respond({ sentCount: body.messages.length - failed.length, failed }, 700);
}
