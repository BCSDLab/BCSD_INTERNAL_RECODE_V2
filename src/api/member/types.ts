import type { MemberRole, MemberType, Track } from '@/api/auth/types';

export type AcademicStatus = 'ENROLLED' | 'LEAVE_OF_ABSENCE' | 'MILITARY_LEAVE' | 'INDUSTRY_PRACTICE' | 'GRADUATED';

/** 인명부 한 줄. 필드 순서는 백엔드 MemberSummaryResponse 레코드와 같게 둔다. */
export interface MemberDirectoryItem {
  id: number;
  name: string;
  generation: string;
  track: Track;
  memberType: MemberType;
  academicStatus: AcademicStatus;
  university: string;
  department: string;
  position: string | null;
  birthDate: string | null;
  duesRequired: boolean;
  studentNumber: string;
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

/**
 * 필터와 무관한 **전체** 집계다 — 백엔드 buildCounts()가 조건 없이 세므로, 필터를 걸어도
 * 이 수치는 변하지 않는다. 그래서 사이드바 칩의 숫자가 필터에 따라 흔들리지 않는다.
 */
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

/** 정렬은 Member 엔티티의 단순 컬럼만 허용한다(track은 연관 엔티티라 제외). */
export type MemberSortKey = 'generation' | 'name' | 'studentNumber';

export type SortDirection = 'asc' | 'desc';

/** 트랙·구분·학적상태는 반복 파라미터로 다중 선택, active는 단일 boolean 또는 미지정이다. */
export interface MemberDirectoryFilters {
  keyword: string;
  active: boolean | null;
  academicStatus: AcademicStatus[];
  track: Track[];
  memberType: MemberType[];
}

export interface MemberDirectoryParams extends MemberDirectoryFilters {
  page: number;
  size: number;
  sort: MemberSortKey;
  direction: SortDirection;
  /** 관리자는 /v1/admin/members, 그 외는 /v1/members/directory를 읽는다. */
  isAdmin: boolean;
}

export const EMPTY_MEMBER_FILTERS: MemberDirectoryFilters = {
  keyword: '',
  active: null,
  academicStatus: [],
  track: [],
  memberType: [],
};

/** 백엔드 @PageableDefault와 같은 값 — 기수 오름차순 8건. */
export const DEFAULT_MEMBER_PAGE_SIZE = 8;

export interface MemberCreateRequest {
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

export interface MemberCreateResponse {
  id: number;
  studentNumber: string;
}

export interface MemberProfileUpdateRequest {
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

export interface PhotoPresignedUrlResponse {
  uploadUrl: string;
  publicUrl: string;
}
