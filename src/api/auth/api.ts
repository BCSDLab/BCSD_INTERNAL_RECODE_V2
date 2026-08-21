import { apiClient, reissueAccessToken } from '@/api/client';
import type {
  InitialSetupRequest,
  LoginRequest,
  LoginResponse,
  MemberDetail,
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

export function requestPasswordReset(email: string) {
  return apiClient.post<SimpleMessageResponse>('/v1/auth/password/reset-requests', { email });
}

export function validateResetToken(token: string) {
  return apiClient.post<ResetTokenValidationResponse>('/v1/auth/password/reset-requests/validate', { token });
}

export function confirmPasswordReset(token: string, newPassword: string, newPasswordConfirm: string) {
  return apiClient.post<void>('/v1/auth/password/reset', { token, newPassword, newPasswordConfirm });
}

export function getInitialSetupInfo(accessToken: string) {
  return apiClient.get<MemberDetail>('/v1/members/me/initial-setup', { accessToken });
}

export function completeInitialSetup(accessToken: string, body: InitialSetupRequest) {
  return apiClient.post<LoginResponse>('/v1/members/me/initial-setup', body, { accessToken });
}
