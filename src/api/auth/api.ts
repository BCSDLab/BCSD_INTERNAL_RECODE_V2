import { validateMemberPhoto } from '@/api/member/api';
import type { PhotoPresignedUrlResponse } from '@/api/member/types';
import { apiClient, reissueAccessToken } from '@/api/client';
import type {
  InitialSetupRequest,
  LoginRequest,
  LoginResponse,
  MemberContactUpdateRequest,
  MemberDetail,
  PasswordChangeRequest,
  ResetTokenValidationResponse,
  SimpleMessageResponse,
} from './types';

export function login(body: LoginRequest) {
  return apiClient.post<LoginResponse>('/v1/auth/login', body);
}

export function reissue() {
  return reissueAccessToken();
}

export function logout() {
  return apiClient.post<void>('/v1/auth/logout', undefined, { skipAuthRetry: true });
}

export function getMe(accessToken: string) {
  return apiClient.get<MemberDetail>('/v1/members/me', { accessToken });
}

export function updateMyContact(body: MemberContactUpdateRequest) {
  return apiClient.patch<void>('/v1/members/me', body);
}

export function changeMyPassword(body: PasswordChangeRequest) {
  return apiClient.patch<void>('/v1/members/me/password', body);
}

export function requestPasswordReset(email: string) {
  return apiClient.post<SimpleMessageResponse>('/v1/auth/password/reset-requests', { email });
}

export function validateResetToken(token: string) {
  return apiClient.post<ResetTokenValidationResponse>('/v1/auth/password/reset-requests/validate', { token });
}

export function confirmPasswordReset(token: string, newPassword: string, newPasswordConfirm: string) {
  return apiClient.post<void>('/v1/auth/password/reset', { token, newPassword, newPasswordConfirm });
}

function issueMyPhotoPresignedUrl(body: { fileName: string; contentType: string; byteSize: number }) {
  return apiClient.post<PhotoPresignedUrlResponse>('/v1/members/me/photo/presigned-url', body);
}

function updateMyPhotoUrl(photoUrl: string) {
  return apiClient.patch<void>('/v1/members/me/photo', { photoUrl });
}

/**
 * presigned URL 발급 → S3 PUT → photoUrl 저장까지 한 번에 처리한다.
 * S3 PUT만 apiClient가 아니라 순수 fetch를 쓴다 — 우리 API가 아니라 서명된 URL이라
 * Authorization·credentials를 붙이면 서명 검증이 깨진다(uploadMemberPhoto와 같은 이유).
 */
export async function uploadMyPhoto(file: File): Promise<string> {
  const validationError = validateMemberPhoto(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const presigned = await issueMyPhotoPresignedUrl({
    fileName: file.name,
    contentType: file.type,
    byteSize: file.size,
  });

  const putResponse = await fetch(presigned.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!putResponse.ok) {
    throw new Error('사진 업로드에 실패했습니다.');
  }

  await updateMyPhotoUrl(presigned.publicUrl);
  return presigned.publicUrl;
}

export function getInitialSetupInfo(accessToken: string) {
  return apiClient.get<MemberDetail>('/v1/members/me/initial-setup', { accessToken });
}

export function completeInitialSetup(accessToken: string, body: InitialSetupRequest) {
  return apiClient.post<LoginResponse>('/v1/members/me/initial-setup', body, { accessToken });
}
