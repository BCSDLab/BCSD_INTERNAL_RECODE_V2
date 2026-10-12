import { type MemberStatus, type MemberSummary } from '@/entities/member/@x/session';
export interface LoginRequest {
  studentNumber: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  status: MemberStatus;
  member: MemberSummary;
}

export { type TokenResponse } from '@/shared/api/types';

export interface SimpleMessageResponse {
  message: string;
}

export interface ResetTokenValidationResponse {
  valid: boolean;
  studentNumberMasked: string;
}

export interface InitialSetupRequest {
  phoneNumber: string;
  email: string;
  githubId: string;
  newPassword: string;
  newPasswordConfirm: string;
}

export interface MemberContactUpdateRequest {
  phoneNumber: string | null;
  email: string;
  githubId: string | null;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
}
