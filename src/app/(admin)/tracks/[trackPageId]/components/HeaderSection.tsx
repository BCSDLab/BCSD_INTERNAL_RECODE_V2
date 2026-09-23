'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { deleteTrackPage, publishTrackPage } from '@/api/track/api';
import { trackKeys } from '@/api/track/queries';
import type { TrackPageDetailResponse } from '@/api/track/types';
import type { HeaderFormValues } from '@/app/(admin)/tracks/header-form';
import { ApiError } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Field, INPUT_CLASS } from '@/components/ui/field';
import { ConfirmModal } from '@/components/ui/modal';
import { SectionCard } from '@/components/ui/section-card';
import { useSession } from '@/lib/auth/use-session';

/**
 * 시안의 HEADER 섹션: 트랙명(+ 주소 자동 생성 안내) · 한 줄 소개 · 오른쪽 "트랙 삭제".
 *
 * 히어로 이미지·OG·meta description은 다루지 않는다 — 팀에서 빼기로 했고, 백엔드에서도
 * 컬럼 자체를 없앴다.
 *
 * 공개/숨김은 시안에 없지만 넣었다 — 없으면 트랙을 감출 방법이 사라진다.
 */
export function HeaderSection({
  trackPageId,
  detail,
  form,
  updateForm,
  canManage,
}: {
  trackPageId: number;
  detail: TrackPageDetailResponse;
  form: HeaderFormValues;
  updateForm: (patch: Partial<HeaderFormValues>) => void;
  canManage: boolean;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { session } = useSession();
  const isAdmin = session?.member.role === 'ADMIN';
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const publishMutation = useMutation({
    mutationFn: (isPublished: boolean) => publishTrackPage(trackPageId, isPublished),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: trackKeys.trackPage(trackPageId) });
      queryClient.invalidateQueries({ queryKey: trackKeys.trackPages() });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : '공개 여부 변경에 실패했습니다.'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTrackPage(trackPageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trackKeys.trackPages() });
      router.replace('/tracks');
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : '삭제에 실패했습니다.'),
  });

  return (
    <SectionCard
      title="Header"
      caption="트랙 페이지 상단 · 제목 영역"
      action={
        <div className="flex items-center gap-2">
          {canManage && (
            <Button onClick={() => publishMutation.mutate(!detail.isPublished)}>
              {detail.isPublished ? '트랙 숨기기' : '트랙 공개하기'}
            </Button>
          )}
          {isAdmin && (
            <Button variant="danger" onClick={() => setIsDeleteOpen(true)}>
              트랙 삭제
            </Button>
          )}
        </div>
      }
    >
      <Field label="트랙명" hint={`주소는 트랙명을 소문자로 변환해 자동 생성됩니다 · bcsdlab.com/track/${detail.slug}`}>
        <input
          value={form.displayName}
          onChange={(e) => updateForm({ displayName: e.target.value })}
          readOnly={!canManage}
          className={INPUT_CLASS}
        />
      </Field>

      <Field label="한 줄 소개" className="pt-3.5">
        <input
          value={form.tagline}
          maxLength={60}
          onChange={(e) => updateForm({ tagline: e.target.value })}
          readOnly={!canManage}
          className={INPUT_CLASS}
        />
      </Field>

      {error && <p className="text-danger m-0 pt-2 text-[11px]">{error}</p>}

      {isDeleteOpen && (
        <ConfirmModal
          title="트랙 페이지 삭제"
          description={`"${detail.displayName}" 트랙 페이지를 삭제합니다. 랜딩에서 즉시 사라집니다.`}
          onCancel={() => setIsDeleteOpen(false)}
          onConfirm={() => deleteMutation.mutate()}
        />
      )}
    </SectionCard>
  );
}
