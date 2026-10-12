import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { useState } from 'react';

import { canManageTrack } from '@/entities/member';
import { useSession } from '@/entities/session';
import { trackMutations, trackQueries, type TrackPageDetailResponse } from '@/entities/track';
import { getApiErrorMessage } from '@/shared/api/error';
import { useDebouncedSave } from '@/shared/lib/hooks/useDebouncedSave';
import { PageHeader } from '@/shared/ui/page-header';

import { type HeaderFormValues } from '../../model/header-form';
import { TrackChipBar } from '../components/TrackChipBar';
import { HeaderSection } from './components/HeaderSection';
import { MembersSection } from './components/MembersSection';
import { StudyPointsSection } from './components/StudyPointsSection';
import { TechStacksSection } from './components/TechStacksSection';

/**
 * 시안의 트랙 화면: 상단 칩 바로 트랙을 전환하고, 아래는 탭 없이
 * HEADER > WHAT WE STUDY > TECH STACK > 함께 할 멤버들 순서로 카드가 쌓인다.
 *
 * 헤더 필드(트랙명·한 줄 소개)는 하나의 PUT으로 전체 교체되므로 폼 상태를
 * 여기 한 곳에 두고 내려준다 — 섹션마다 따로 들고 있으면 한쪽 저장이 다른 쪽 값을
 * 낡은 값으로 덮어쓴다.
 */
export default function TrackPageEditPage() {
  const params = useParams({ from: '/_admin/tracks/$trackPageId' });
  const trackPageId = Number(params.trackPageId);
  const { session } = useSession();

  const { data: detail } = useQuery(trackQueries.trackPage(trackPageId));
  const canManage = canManageTrack(session?.member, detail?.trackCode);

  if (!detail) {
    return <p className="text-faint px-8 py-6 text-[13px]">불러오는 중…</p>;
  }

  return <TrackEditor key={detail.id} detail={detail} canManage={canManage} />;
}

function TrackEditor({ detail, canManage }: { detail: TrackPageDetailResponse; canManage: boolean }) {
  const trackPageId = detail.id;
  const queryClient = useQueryClient();
  const [form, setForm] = useState<HeaderFormValues>(() => ({
    displayName: detail.displayName,
    tagline: detail.tagline,
  }));
  const headerMutation = useMutation(trackMutations.header(queryClient, trackPageId));
  const headerError = headerMutation.isError ? getApiErrorMessage(headerMutation.error, '저장에 실패했습니다.') : null;
  const { save: saveHeader } = useDebouncedSave<HeaderFormValues>((values) => headerMutation.mutate(values));

  function updateForm(patch: Partial<HeaderFormValues>) {
    const next = { ...form, ...patch };
    setForm(next);
    saveHeader(next);
  }

  return (
    <>
      <PageHeader
        crumb="트랙 페이지"
        slug={`/track/${detail.slug}`}
        title={`${detail.displayName} 트랙`}
        saving={headerMutation.isPending}
      />
      <TrackChipBar selectedId={trackPageId} />

      <div className="w-full px-8 pt-6 pb-10">
        <div className="flex min-w-0 flex-col gap-5">
          {headerError && <p className="text-danger m-0 text-[11px]">{headerError}</p>}
          <HeaderSection
            trackPageId={trackPageId}
            detail={detail}
            form={form}
            updateForm={updateForm}
            canManage={canManage}
          />
          <StudyPointsSection trackPageId={trackPageId} detail={detail} canManage={canManage} />
          <TechStacksSection trackPageId={trackPageId} detail={detail} canManage={canManage} />
          <MembersSection trackPageId={trackPageId} detail={detail} canManage={canManage} />
        </div>
      </div>
    </>
  );
}
