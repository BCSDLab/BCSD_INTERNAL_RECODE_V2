export type ImagePurpose = 'TRACK_HERO' | 'STUDY_ICON' | 'TECH_ICON' | 'ACTIVITY' | 'ACTIVITY_CONTENT' | 'ETC';

export interface PresignedUrlResponse {
  imageId: number;
  uploadUrl: string;
  publicUrl: string;
}

export interface ImageCompleteResponse {
  url: string;
}
