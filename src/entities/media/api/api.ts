import { apiClient } from '@/shared/api/client';

import { type ImageCompleteResponse, type ImagePurpose, type PresignedUrlResponse } from './types';

export function getPresignedUrl(body: {
  fileName: string;
  contentType: string;
  byteSize: number;
  purpose: ImagePurpose;
}) {
  return apiClient.post<PresignedUrlResponse>('/v1/admin/images/presigned-url', body);
}

export function completeImage(imageId: number) {
  return apiClient.post<ImageCompleteResponse>(`/v1/admin/images/${imageId}/complete`);
}
