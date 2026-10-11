import type { MemberRole } from '@/api/auth/types';
import { apiClient } from '@/api/client';
import type {
  AcademicStatus,
  MemberCreateRequest,
  MemberCreateResponse,
  MemberDirectoryParams,
  MemberDirectoryResponse,
  MemberProfileUpdateRequest,
} from './types';

const ADMIN_BASE = '/v1/admin/members';
const DIRECTORY_BASE = '/v1/members/directory';

/**
 * 목록 조회만 관리자·일반 두 경로에 모두 있다. 그 밖의 모든 변경은 /v1/admin/members 전용이다.
 * 빈 배열·빈 문자열·null은 apiClient의 buildQuery가 알아서 빼므로 조건을 보내지 않는 것과 같다.
 */
export function getMemberDirectory(params: MemberDirectoryParams) {
  return apiClient.get<MemberDirectoryResponse>(params.isAdmin ? ADMIN_BASE : DIRECTORY_BASE, {
    params: {
      keyword: params.keyword.trim() || undefined,
      active: params.active ?? undefined,
      academicStatus: params.academicStatus,
      track: params.track,
      memberType: params.memberType,
      page: params.page,
      size: params.size,
      sort: `${params.sort},${params.direction}`,
    },
  });
}

export function createMember(body: MemberCreateRequest) {
  return apiClient.post<MemberCreateResponse>(ADMIN_BASE, body);
}

export function updateMemberProfile(memberId: number, body: MemberProfileUpdateRequest) {
  return apiClient.patch<void>(`${ADMIN_BASE}/${memberId}`, body);
}

/** 프로필 PATCH(전체 덮어쓰기)와 분리된 전용 엔드포인트 — 프로필 저장이 Slack ID를 지우지 않게. */
export function updateMemberSlackId(memberId: number, slackId: string | null) {
  return apiClient.patch<void>(`${ADMIN_BASE}/${memberId}/slack-id`, { slackId });
}

export interface SlackIdLookupResult {
  memberId: number;
  slackId: string | null;
  status: 'SAVED' | 'NOT_FOUND' | 'DUPLICATED' | 'FAILED' | 'MEMBER_NOT_FOUND';
  ownerName: string | null;
}

/** 회원 이메일로 Slack ID를 찾아 저장한다. 결과는 회원마다 status로 돌아온다. */
export function lookupMemberSlackIds(memberIds: number[]) {
  return apiClient.post<{ results: SlackIdLookupResult[] }>(`${ADMIN_BASE}/slack-ids/lookup`, { memberIds });
}

export function updateMemberAcademicStatus(memberId: number, academicStatus: AcademicStatus) {
  return apiClient.patch<void>(`${ADMIN_BASE}/${memberId}/academic-status`, { academicStatus });
}

export function updateMemberActive(memberId: number, active: boolean) {
  return apiClient.patch<void>(`${ADMIN_BASE}/${memberId}/active`, { active });
}

export function updateMemberRole(memberId: number, role: MemberRole) {
  return apiClient.patch<void>(`${ADMIN_BASE}/${memberId}/role`, { role });
}

export function updateMemberWithdrawal(memberId: number, withdrawn: boolean) {
  return apiClient.patch<void>(`${ADMIN_BASE}/${memberId}/withdrawal`, { withdrawn });
}

/**
 * 프로필 사진은 공용 이미지 도메인(/v1/admin/images)이 아니라 부원 전용 엔드포인트 쌍을 쓴다.
 * 백엔드 검증(png/jpg/jpeg/webp, 5MB)과 같은 조건을 S3 PUT 전에 먼저 확인해 헛트래픽을 막는다
 * — hooks/useImageUpload와 같은 순서다. svg는 부원 사진에서 허용되지 않는다.
 */
const ALLOWED_PHOTO_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'];
const MAX_PHOTO_BYTE_SIZE = 5 * 1024 * 1024;

export function validateMemberPhoto(file: File): string | null {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !ALLOWED_PHOTO_EXTENSIONS.includes(extension)) {
    return '허용되지 않는 확장자입니다 (png, jpg, jpeg, webp만 가능).';
  }
  if (file.size > MAX_PHOTO_BYTE_SIZE) {
    return '5MB를 초과하는 파일은 올릴 수 없습니다.';
  }
  return null;
}
