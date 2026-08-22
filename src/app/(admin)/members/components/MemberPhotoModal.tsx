'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ApiError } from '@/api/client';
import { uploadMemberPhoto, validateMemberPhoto } from '@/api/member/api';
import { memberKeys } from '@/api/member/queries';
import type { MemberDirectoryItem } from '@/api/member/types';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

/**
 * 사진 변경. presigned URL → S3 PUT → photoUrl 저장을 api.uploadMemberPhoto가 한 번에 하고,
 * 진행·실패 상태는 useMutation이 들고 있다(다른 관리 화면의 변경과 같은 모양).
 */
export function MemberPhotoModal({ member, onClose }: { member: MemberDirectoryItem; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [picked, setPicked] = useState<{ file: File; previewUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 미리보기 blob URL 해제만 맡는다 — 생성은 파일을 고른 순간에 한다.
  useEffect(() => {
    if (!picked) {
      return;
    }
    const { previewUrl } = picked;
    return () => URL.revokeObjectURL(previewUrl);
  }, [picked]);

  const mutation = useMutation({
    mutationFn: () => uploadMemberPhoto(member.id, (picked as { file: File }).file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.all() });
      onClose();
    },
    onError: (e) =>
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : '사진 업로드에 실패했습니다.'),
  });

  function handlePick(file: File) {
    const validationError = validateMemberPhoto(file);
    if (validationError) {
      setPicked(null);
      setError(validationError);
      return;
    }
    setError(null);
    setPicked({ file, previewUrl: URL.createObjectURL(file) });
  }

  const shownUrl = picked?.previewUrl ?? member.photoUrl;

  return (
    <Modal
      eyebrow={`${member.name} · ${member.generation}`}
      title="프로필 사진"
      onClose={onClose}
      width="400px"
      footer={
        <>
          <Button onClick={onClose} className="ml-auto px-4 py-2.5">
            취소
          </Button>
          <Button
            variant="primary"
            onClick={() => mutation.mutate()}
            disabled={!picked || mutation.isPending}
            className="px-[18px] py-2.5"
          >
            {mutation.isPending ? '업로드 중…' : '저장'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center gap-3.5 px-6 py-5">
        <span className="h-24 w-24 flex-none overflow-hidden rounded-full">
          {shownUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shownUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="bg-primary text-on-primary flex h-full w-full items-center justify-center text-2xl font-semibold">
              {member.name.slice(0, 1)}
            </span>
          )}
        </span>

        <label className="border-line2 text-muted hover:border-primary-line hover:text-primary-text cursor-pointer rounded-[9px] border px-3 py-2 text-xs whitespace-nowrap transition-colors">
          사진 선택
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const selected = e.target.files?.[0];
              if (selected) {
                handlePick(selected);
              }
            }}
          />
        </label>

        <p className="text-faint m-0 text-center text-[11px] leading-[1.65]">
          PNG · JPG · WEBP · 5MB 이하
          <br />
          정사각 권장, 원형으로 표시됩니다.
        </p>

        {error && <p className="text-danger m-0 text-[11px]">{error}</p>}
      </div>
    </Modal>
  );
}
