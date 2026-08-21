import { apiFetch, reissueAccessToken } from '@/api/client';
import type {
  InitialSetupRequest,
  LoginRequest,
  LoginResponse,
  MemberDetail,
  ResetTokenValidationResponse,
  SimpleMessageResponse,
} from './types';

export function login(body: LoginRequest) {
  return apiFetch<LoginResponse>('/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function reissue() {
  return reissueAccessToken();
}

export function logout() {
  return apiFetch<void>('/v1/auth/logout', { method: 'POST', skipAuthRetry: true });
}

export function getMe(accessToken: string) {
  return apiFetch<MemberDetail>('/v1/members/me', { accessToken });
}

export function requestPasswordReset(email: string) {
  return apiFetch<SimpleMessageResponse>('/v1/auth/password/reset-requests', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function validateResetToken(token: string) {
  return apiFetch<ResetTokenValidationResponse>('/v1/auth/password/reset-requests/validate', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export function confirmPasswordReset(token: string, newPassword: string, newPasswordConfirm: string) {
  return apiFetch<void>('/v1/auth/password/reset', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword, newPasswordConfirm }),
  });
}

export function getInitialSetupInfo(accessToken: string) {
  return apiFetch<MemberDetail>('/v1/members/me/initial-setup', { accessToken });
}

export function completeInitialSetup(accessToken: string, body: InitialSetupRequest) {
  return apiFetch<LoginResponse>('/v1/members/me/initial-setup', {
    method: 'POST',
    accessToken,
    body: JSON.stringify(body),
  });
}
