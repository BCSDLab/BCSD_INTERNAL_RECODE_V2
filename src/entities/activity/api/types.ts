/** Spring Data Page 응답 중 우리가 쓰는 부분만. */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
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
