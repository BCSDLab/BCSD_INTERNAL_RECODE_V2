import { apiFetch, reissueAccessToken } from './client';
import type { LoginRequest, LoginResponse, MemberDetail } from './types';

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
