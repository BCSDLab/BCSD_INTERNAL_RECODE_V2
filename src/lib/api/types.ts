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

export type AcademicStatus = 'ENROLLED' | 'LEAVE_OF_ABSENCE' | 'MILITARY_LEAVE' | 'INDUSTRY_PRACTICE' | 'GRADUATED';

export type MemberRole = 'ADMIN' | 'MEMBER';

export interface MemberSummary {
  id: number;
  name: string;
  studentNumber: string;
  track: Track;
  generation: string;
  memberType: MemberType;
  university: string;
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

export interface MemberDirectoryItem {
  id: number;
  studentNumber: string;
  name: string;
  track: Track;
  generation: string;
  memberType: MemberType;
  university: string;
  department: string;
  academicStatus: AcademicStatus;
  position: string | null;
  birthDate: string | null;
  duesRequired: boolean;
  email: string;
  phoneNumber: string | null;
  githubId: string | null;
  photoUrl: string | null;
  role: MemberRole;
  active: boolean;
}

export interface MemberDirectoryPageInfo {
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface MemberDirectoryCounts {
  total: number;
  active: number;
  inactive: number;
  byAcademicStatus: Record<string, number>;
  byTrack: Record<string, number>;
  byMemberType: Record<string, number>;
}

export interface MemberDirectoryResponse {
  members: MemberDirectoryItem[];
  page: MemberDirectoryPageInfo;
  counts: MemberDirectoryCounts;
}

export interface MemberDirectoryQueryParams {
  keyword?: string;
  active?: boolean;
  academicStatus?: AcademicStatus[];
  track?: Track[];
  memberType?: MemberType[];
  page?: number;
  size?: number;
  sort?: string;
}

export interface AdminMemberCreateRequest {
  name: string;
  studentNumber: string;
  track: Track;
  memberType: MemberType;
  generation: string;
  university: string;
  department: string;
  academicStatus?: AcademicStatus;
  active?: boolean;
  email: string;
  phoneNumber?: string;
  githubId?: string;
}

export interface AdminMemberProfileUpdateRequest {
  name: string;
  track: Track;
  memberType: MemberType;
  generation: string;
  university: string;
  department: string;
  position: string | null;
  birthDate: string | null;
  duesRequired: boolean;
  email: string;
  phoneNumber: string | null;
  githubId: string | null;
}

export interface PhotoPresignedUrlRequest {
  fileName: string;
  contentType: string;
  byteSize: number;
}

export interface PhotoPresignedUrlResponse {
  uploadUrl: string;
  publicUrl: string;
}

export interface AdminMemberCreateResponse {
  id: number;
  studentNumber: string;
}
