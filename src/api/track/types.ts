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
