export type Track =
  | 'FRONTEND'
  | 'BACKEND'
  | 'ANDROID'
  | 'IOS'
  | 'PM'
  | 'DATA'
  | 'DESIGN'
  | 'DEVOPS'
  | 'PS'
  | 'GAME'
  | 'SECURITY';

export type MemberType = 'MENTOR' | 'REGULAR' | 'BEGINNER';

export type MemberStatus = 'PENDING_SETUP' | 'ACTIVE' | 'LOCKED' | 'WITHDRAWN';

/** 인명부 관리 권한. 구분(MemberType)과는 별개로 부여된다. */
export type MemberRole = 'ADMIN' | 'MEMBER';

export interface MemberSummary {
  id: number;
  name: string;
  studentNumber: string;
  track: Track;
  generation: string;
  memberType: MemberType;
  university: string;
  role: MemberRole;
}

export interface MemberDetail extends MemberSummary {
  email: string;
  phoneNumber: string;
  githubId: string | null;
  status: MemberStatus;
}

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

export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

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
