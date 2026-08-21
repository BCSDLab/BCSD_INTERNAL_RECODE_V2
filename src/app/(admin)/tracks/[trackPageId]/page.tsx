'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { updateTrackPageHeader } from '@/api/track/api';
import { trackQueries } from '@/api/track/queries';
import { ApiError } from '@/api/client';
import { TrackChipBar } from '@/app/(admin)/tracks/components/TrackChipBar';
import type { HeaderFormValues } from '@/app/(admin)/tracks/header-form';
import { PageHeader } from '@/components/ui/page-header';
import { useDebouncedSave } from '@/hooks/useDebouncedSave';
import { HeaderSection } from './components/HeaderSection';
import { MembersSection } from './components/MembersSection';
import { StudyPointsSection } from './components/StudyPointsSection';
import { TechStacksSection } from './components/TechStacksSection';

/**
 * 시안의 트랙 화면: 상단 칩 바로 트랙을 전환하고, 아래는 탭 없이
 * HEADER > WHAT WE STUDY > TECH STACK > 함께 할 멤버들 순서로 카드가 쌓인다.
 *
 * 헤더 필드(트랙명·한 줄 소개·히어로)는 하나의 PUT으로 전체 교체되므로 폼 상태를
 * 여기 한 곳에 두고 내려준다 — 섹션마다 따로 들고 있으면 한쪽 저장이 다른 쪽 값을
 * 낡은 값으로 덮어쓴다.
 */
export default function TrackPageEditPage() {
  const params = useParams<{ trackPageId: string }>();
  const trackPageId = Number(params.trackPageId);

  const { data: detail, isLoading } = useQuery(trackQueries.trackPage(trackPageId));

  const [form, setForm] = useState<HeaderFormValues | null>(null);
  const [initializedId, setInitializedId] = useState<number | null>(null);
  if (detail && initializedId !== detail.id) {
    setInitializedId(detail.id);
    setForm({
      displayName: detail.displayName,
      tagline: detail.tagline,
    });
  }

  const [headerError, setHeaderError] = useState<string | null>(null);
  const headerMutation = useMutation({
    mutationFn: (values: HeaderFormValues) => updateTrackPageHeader(trackPageId, values),
    onError: (e) => setHeaderError(e instanceof ApiError ? e.message : '저장에 실패했습니다.'),
    onSuccess: () => setHeaderError(null),
  });
  const { save: saveHeader } = useDebouncedSave<HeaderFormValues>((values) => headerMutation.mutate(values));

  function updateForm(patch: Partial<HeaderFormValues>) {
    setForm((prev) => {
      if (!prev) {
        return prev;
      }
      const next = { ...prev, ...patch };
      saveHeader(next);
      return next;
    });
  }

  return (
    <>
      <PageHeader
        crumb="트랙 페이지"
        slug={detail ? `/track/${detail.slug}` : undefined}
        title={detail ? `${detail.displayName} 트랙` : '트랙 페이지'}
        saving={headerMutation.isPending}
      />
      <TrackChipBar selectedId={trackPageId} />

      <div key={trackPageId} className="w-full px-8 pt-6 pb-10">
        {isLoading || !detail || !form ? (
          <p className="text-faint m-0 text-[13px]">불러오는 중…</p>
        ) : (
          <div className="flex min-w-0 flex-col gap-5">
            {headerError && <p className="text-danger m-0 text-[11px]">{headerError}</p>}
            <HeaderSection trackPageId={trackPageId} detail={detail} form={form} updateForm={updateForm} />
            <StudyPointsSection trackPageId={trackPageId} detail={detail} />
            <TechStacksSection trackPageId={trackPageId} detail={detail} />
            <MembersSection trackPageId={trackPageId} detail={detail} />
          </div>
        )}
      </div>
    </>
  );
}
