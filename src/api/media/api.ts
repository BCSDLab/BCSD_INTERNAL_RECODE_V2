import { apiFetch } from '@/api/client';
import type { ImageCompleteResponse, ImagePurpose, PresignedUrlResponse } from './types';

export function getPresignedUrl(body: {
  fileName: string;
  contentType: string;
  byteSize: number;
  purpose: ImagePurpose;
}) {
  return apiFetch<PresignedUrlResponse>('/v1/admin/images/presigned-url', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function completeImage(imageId: number) {
  return apiFetch<ImageCompleteResponse>(`/v1/admin/images/${imageId}/complete`, { method: 'POST' });
}
