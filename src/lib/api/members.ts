import { ApiError, apiFetch } from '@/lib/api/client';
import type {
  AdminMemberCreateRequest,
  AdminMemberCreateResponse,
  AdminMemberProfileUpdateRequest,
  MemberDirectoryQueryParams,
  MemberDirectoryResponse,
  MemberRole,
  PhotoPresignedUrlResponse,
} from '@/lib/api/types';

function buildQuery(params: MemberDirectoryQueryParams): string {
  const search = new URLSearchParams();
  if (params.keyword) search.set('keyword', params.keyword);
  if (params.active !== undefined) search.set('active', String(params.active));
  if (params.page !== undefined) search.set('page', String(params.page));
  if (params.size !== undefined) search.set('size', String(params.size));
  if (params.sort) search.set('sort', params.sort);
  params.academicStatus?.forEach((v) => search.append('academicStatus', v));
  params.track?.forEach((v) => search.append('track', v));
  params.memberType?.forEach((v) => search.append('memberType', v));
  return search.toString();
}

export function getMemberDirectory(
  params: MemberDirectoryQueryParams,
  isAdmin: boolean,
): Promise<MemberDirectoryResponse> {
  const basePath = isAdmin ? '/v1/admin/members' : '/v1/members/directory';
  const qs = buildQuery(params);
  return apiFetch<MemberDirectoryResponse>(`${basePath}${qs ? `?${qs}` : ''}`);
}

export function createMember(body: AdminMemberCreateRequest): Promise<AdminMemberCreateResponse> {
  return apiFetch<AdminMemberCreateResponse>('/v1/admin/members', { method: 'POST', body: JSON.stringify(body) });
}

export function updateMemberProfile(memberId: number, body: AdminMemberProfileUpdateRequest): Promise<void> {
  return apiFetch<void>(`/v1/admin/members/${memberId}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export function updateAcademicStatus(memberId: number, academicStatus: string): Promise<void> {
  return apiFetch<void>(`/v1/admin/members/${memberId}/academic-status`, {
    method: 'PATCH',
    body: JSON.stringify({ academicStatus }),
  });
}

export function updateActive(memberId: number, active: boolean): Promise<void> {
  return apiFetch<void>(`/v1/admin/members/${memberId}/active`, {
    method: 'PATCH',
    body: JSON.stringify({ active }),
  });
}

export function updateRole(memberId: number, role: MemberRole): Promise<void> {
  return apiFetch<void>(`/v1/admin/members/${memberId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export function updateWithdrawal(memberId: number, withdrawn: boolean): Promise<void> {
  return apiFetch<void>(`/v1/admin/members/${memberId}/withdrawal`, {
    method: 'PATCH',
    body: JSON.stringify({ withdrawn }),
  });
}

function issuePhotoPresignedUrl(memberId: number, file: File): Promise<PhotoPresignedUrlResponse> {
  return apiFetch<PhotoPresignedUrlResponse>(`/v1/admin/members/${memberId}/photo/presigned-url`, {
    method: 'POST',
    body: JSON.stringify({ fileName: file.name, contentType: file.type, byteSize: file.size }),
  });
}

async function putToS3(uploadUrl: string, file: File): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!response.ok) {
    throw new ApiError(response.status, 'S3 업로드에 실패했습니다.');
  }
}

function confirmPhotoUrl(memberId: number, photoUrl: string): Promise<void> {
  return apiFetch<void>(`/v1/admin/members/${memberId}/photo`, {
    method: 'PATCH',
    body: JSON.stringify({ photoUrl }),
  });
}

/**
 * 서버는 이미지 바이트를 경유하지 않는다 — presigned URL을 발급받아 브라우저가 S3에 직접
 * PUT한 뒤, 그 결과 publicUrl만 회원 프로필에 등록한다(기존 media 도메인의 이미지 업로드와
 * 동일한 방식).
 */
export async function uploadMemberPhoto(memberId: number, file: File): Promise<string> {
  const { uploadUrl, publicUrl } = await issuePhotoPresignedUrl(memberId, file);
  await putToS3(uploadUrl, file);
  await confirmPhotoUrl(memberId, publicUrl);
  return publicUrl;
}
