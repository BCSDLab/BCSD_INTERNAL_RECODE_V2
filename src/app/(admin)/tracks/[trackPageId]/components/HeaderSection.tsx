'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { HeaderFormValues } from '@/app/(admin)/tracks/header-form';
import { Button } from '@/components/ui/button';
import { Field, INPUT_CLASS } from '@/components/ui/field';
import { ConfirmModal } from '@/components/ui/modal';
import { SectionCard } from '@/components/ui/section-card';
import { apiFetch } from '@/lib/api/client';
import type { TrackPageDetailResponse } from '@/types/api';

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
}: {
  trackPageId: number;
  detail: TrackPageDetailResponse;
  form: HeaderFormValues;
  updateForm: (patch: Partial<HeaderFormValues>) => void;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const publishMutation = useMutation({
    mutationFn: (isPublished: boolean) =>
      apiFetch<void>(`/v1/admin/track-pages/${trackPageId}/publish`, {
        method: 'PATCH',
        body: JSON.stringify({ isPublished }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['track-page', trackPageId] });
      queryClient.invalidateQueries({ queryKey: ['track-pages'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiFetch<void>(`/v1/admin/track-pages/${trackPageId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['track-pages'] });
      router.replace('/tracks');
    },
  });

  return (
    <SectionCard
      title="Header"
      caption="트랙 페이지 상단 · 제목 영역"
      action={
        <div className="flex items-center gap-2">
          <Button onClick={() => publishMutation.mutate(!detail.isPublished)}>
            {detail.isPublished ? '트랙 숨기기' : '트랙 공개하기'}
          </Button>
          <Button variant="danger" onClick={() => setIsDeleteOpen(true)}>
            트랙 삭제
          </Button>
        </div>
      }
    >
      <Field label="트랙명" hint={`주소는 트랙명을 소문자로 변환해 자동 생성됩니다 · bcsdlab.com/track/${detail.slug}`}>
        <input
          value={form.displayName}
          onChange={(e) => updateForm({ displayName: e.target.value })}
          className={INPUT_CLASS}
        />
      </Field>

      <Field label="한 줄 소개" className="pt-3.5">
        <input
          value={form.tagline}
          maxLength={60}
          onChange={(e) => updateForm({ tagline: e.target.value })}
          className={INPUT_CLASS}
        />
      </Field>

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
