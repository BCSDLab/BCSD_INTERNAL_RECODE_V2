export interface AdminGameSummaryResponse {
  id: number;
  slug: string;
  name: string;
  isPublished: boolean;
  displayOrder: number;
}

export type GameRatingLevel = 'ALL' | 'OVER_12' | 'OVER_15' | 'OVER_18';

export type GameContentDescriptor = 'sexuality' | 'violence' | 'fear' | 'language' | 'drugs' | 'crime' | 'gambling';

export type GameBuildStatus = 'PENDING' | 'PROCESSING' | 'ACTIVE' | 'ARCHIVED' | 'FAILED';

export interface GameScreenshotResponse {
  id: number;
  imageUrl: string;
  displayOrder: number;
}

export interface GameRatingResponse {
  rating: GameRatingLevel;
  classificationNumber: string | null;
  classificationDate: string | null;
  businessName: string | null;
  developerReportNumber: string | null;
  contentDescriptors: GameContentDescriptor[];
}

export interface AdminGameMemberResponse {
  id: number;
  memberId: number;
  name: string;
  memberType: string;
  profileImageUrl: string | null;
  displayOrder: number;
}

export interface AdminGameBuildResponse {
  id: number;
  version: string;
  status: GameBuildStatus;
  canvasWidth: number | null;
  canvasHeight: number | null;
  storageBytes: number | null;
  buildFileUrl: string | null;
  failureReason: string | null;
  uploadedAt: string;
}

export interface GameBuildUploadTokenResponse {
  uploadUrl: string;
  token: string;
  expiresAt: string;
}

export interface AdminGameDetailResponse {
  id: number;
  trackId: number | null;
  trackName: string | null;
  slug: string;
  name: string;
  oneLiner: string;
  teamLabel: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  isPublished: boolean;
  displayOrder: number;
  screenshots: GameScreenshotResponse[];
  rating: GameRatingResponse | null;
  members: AdminGameMemberResponse[];
}

export interface GameCreateRequest {
  name: string;
  oneLiner: string;
  trackId?: number | null;
  teamLabel?: string | null;
}

export interface GameUpdateRequest {
  name: string;
  oneLiner: string;
  trackId?: number | null;
  teamLabel?: string | null;
  description?: string | null;
}

export interface GameRatingRequest {
  rating: GameRatingLevel;
  classificationNumber?: string | null;
  classificationDate?: string | null;
  businessName?: string | null;
  developerReportNumber?: string | null;
  contentDescriptors: GameContentDescriptor[];
}
