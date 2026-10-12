import { useCallback, useState } from 'react';

import { completeImage, getPresignedUrl, type ImagePurpose } from '@/entities/media';
import { uploadFile } from '@/shared/api/upload-file';
import { validateImageFile } from '@/shared/lib/image-file';

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

      const validationError = validateImageFile(file, true);
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

        await uploadFile(presigned.uploadUrl, file, '이미지 업로드에 실패했습니다.');

        const completed = await completeImage(presigned.imageId);
        return completed.url;
      } catch (uploadError) {
        const message = uploadError instanceof Error ? uploadError.message : '이미지 업로드에 실패했습니다.';
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
