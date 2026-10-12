export interface AdminMentorSlotResponse {
  id: number;
  memberId: number;
  name: string;
  trackName: string;
  profileImageUrl: string | null;
  displayOrder: number;
}

export interface AdminQnaResponse {
  id: number;
  question: string;
  answer: string;
  isPublished: boolean;
  displayOrder: number;
}

export interface AdminRecruitLinkResponse {
  googleFormUrl: string;
  isOpen: boolean;
  closeDate: string | null;
  closedMessage: string;
  updatedAt: string;
}

export interface RecruitLinkHistoryResponse {
  googleFormUrl: string;
  isOpen: boolean;
  changedByName: string | null;
  changedAt: string;
}

export interface RecruitLinkUpdateRequest {
  googleFormUrl: string;
  isOpen: boolean;
  closeDate?: string | null;
  closedMessage: string;
}
