'use client';

import { useCallback, useState } from 'react';
import { completeImage, getPresignedUrl } from '@/api/media/api';
import type { ImagePurpose } from '@/api/media/types';
import { ApiError } from '@/api/client';

const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'svg'];
const MAX_BYTE_SIZE = 5 * 1024 * 1024;

function validate(file: File): string | null {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
    return '허용되지 않는 확장자입니다 (png, jpg, jpeg, webp, svg만 가능).';
  }
  if (file.size > MAX_BYTE_SIZE) {
    return '5MB를 초과하는 파일은 올릴 수 없습니다.';
  }
  return null;
}

/**
 * presigned URL 발급 → S3 PUT → complete 등록까지 한 번에 처리한다(ADR-009).
 * 5MB·확장자 검증은 실제 업로드(S3 PUT) 전에 수행해 불필요한 트래픽을 막는다.
 *
 * S3 PUT만 apiFetch가 아니라 순수 fetch를 쓴다 — 우리 API가 아니라 presigned URL이라
 * Authorization·credentials를 붙이면 서명 검증이 깨진다.
 */
export function useImageUpload(purpose: ImagePurpose) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File): Promise<string> => {
      setError(null);

      const validationError = validate(file);
      if (validationError) {
        setError(validationError);
        throw new Error(validationError);
      }

      setIsUploading(true);
      try {
        const presigned = await getPresignedUrl({
          fileName: file.name,
          contentType: file.type,
          byteSize: file.size,
          purpose,
        });

        const putResponse = await fetch(presigned.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });
        if (!putResponse.ok) {
          throw new Error('이미지 업로드에 실패했습니다.');
        }

        const completed = await completeImage(presigned.imageId);
        return completed.url;
      } catch (uploadError) {
        const message =
          uploadError instanceof ApiError
            ? uploadError.message
            : uploadError instanceof Error
              ? uploadError.message
              : '이미지 업로드에 실패했습니다.';
        setError(message);
        throw uploadError;
      } finally {
        setIsUploading(false);
      }
    },
    [purpose],
  );

  return { upload, isUploading, error };
}
