/**
 * 홈페이지 콘텐츠 CMS(관리 화면) 응답 타입.
 *
 * 인증·회원 관련 타입은 여기 두지 않는다 — lib/api/types.ts에 이미 있다
 * (MemberSummary, MemberDetail, LoginResponse, TokenResponse, Track, MemberType 등).
 */

/** Spring Data Page 응답 중 우리가 쓰는 부분만. */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface TrackMasterResponse {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
  hasTrackPage: boolean;
}

export interface TrackPageSummaryResponse {
  id: number;
  slug: string;
  displayName: string;
  isPublished: boolean;
  displayOrder: number;
}

export interface StudyPointResponse {
  title: string;
  description: string;
  iconImageUrl: string | null;
}

export interface TechStackResponse {
  id: number;
  name: string;
  iconUrl: string;
}

export interface TrackPageMemberResponse {
  id: number;
  memberId: number;
  name: string;
  memberType: string;
  profileImageUrl: string | null;
  isVisible: boolean;
  displayOrder: number;
}

export interface TrackPageDetailResponse {
  id: number;
  trackId: number;
  trackCode: string;
  slug: string;
  displayName: string;
  tagline: string;
  isPublished: boolean;
  displayOrder: number;
  studyPoints: StudyPointResponse[];
  techStacks: TechStackResponse[];
  members: TrackPageMemberResponse[];
}

export interface CurriculumSummaryResponse {
  id: number;
  name: string;
  isPublished: boolean;
  displayOrder: number;
}

export interface CurriculumTopicNode {
  id: number;
  title: string;
  displayOrder: number;
  details: string[];
}

export interface CurriculumWeekNode {
  id: number;
  weekFrom: number;
  weekTo: number | null;
  displayOrder: number;
  topics: CurriculumTopicNode[];
}

export interface CurriculumTreeResponse {
  id: number;
  name: string;
  isPublished: boolean;
  weeks: CurriculumWeekNode[];
}

export interface ActivityCategoryResponse {
  id: number;
  slug: string;
  name: string;
  headline: string | null;
  heroImageUrl: string | null;
  isPublished: boolean;
  displayOrder: number;
}

export interface ActivitySummaryResponse {
  id: number;
  year: number;
  month: number;
  title: string;
  summary: string;
  isPublished: boolean;
  displayOrder: number;
}

export interface ActivityDetailResponse {
  id: number;
  categoryId: number;
  year: number;
  month: number;
  title: string;
  summary: string;
  content: string | null;
  externalUrl: string | null;
  isPublished: boolean;
  displayOrder: number;
  imageUrls: string[];
}
