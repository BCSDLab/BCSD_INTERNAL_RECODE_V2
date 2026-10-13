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
  /** 가입 전 회원(계정 설정)의 링크인지. BE 배포 전 응답에는 없다 — 없으면 재설정 문구를 쓴다. */
  accountSetup?: boolean;
}

export interface InitialSetupRequest {
  phoneNumber: string;
  email: string;
  githubId: string;
  /** 비밀번호 설정 링크로 이미 정한 회원은 보내지 않는다. */
  newPassword?: string;
  newPasswordConfirm?: string;
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
