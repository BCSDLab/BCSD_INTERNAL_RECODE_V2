'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { createGameBuild, deleteGameBuild } from '@/api/game/api';
import { gameKeys, gameQueries } from '@/api/game/queries';
import type { AdminGameBuildResponse, GameBuildStatus } from '@/api/game/types';
import { ApiError } from '@/api/client';
import { Button } from '@/components/ui/button';
import { INPUT_CLASS_COMPACT } from '@/components/ui/field';
import { SectionCard } from '@/components/ui/section-card';

const STATUS_LABELS: Record<GameBuildStatus, string> = {
  PENDING: '등록 대기',
  PROCESSING: '처리 중',
  ACTIVE: '활성',
  ARCHIVED: '보관',
  FAILED: '실패',
};

/**
 * 이번 1차는 버전 메타만 다룬다(ADR-023) — 실제 ZIP 업로드·압축해제·서빙은 후속
 * 태스크(T-41)에서 홈페이지 서버 쪽 설계와 함께 붙는다. 등록 직후 상태는 항상
 * PENDING이고, 지금은 이 화면에서 상태를 다른 값으로 바꿀 방법이 없다 — 그래서
 * 진행률·업로드 트레이 같은 UI는 넣지 않는다(있는 척하면 안 된다).
 */
export function BuildsTab({ gameId }: { gameId: number }) {
  const queryClient = useQueryClient();
  const [version, setVersion] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: builds, isLoading } = useQuery(gameQueries.builds(gameId));

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: gameKeys.builds(gameId) });
  }

  const createMutation = useMutation({
    mutationFn: () => createGameBuild(gameId, version.trim()),
    onSuccess: () => {
      setVersion('');
      invalidate();
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : '등록에 실패했습니다.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (buildId: number) => deleteGameBuild(gameId, buildId),
    onSuccess: invalidate,
    onError: (e) => setError(e instanceof ApiError ? e.message : '삭제에 실패했습니다.'),
  });

  return (
    <SectionCard title="빌드" caption={`보관 ${builds?.length ?? 0}개 · 버전 메타데이터만 관리합니다`}>
      <div className="flex gap-2 pb-3.5">
        <input
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          placeholder="예: 1.2.0"
          maxLength={30}
          className={`${INPUT_CLASS_COMPACT} flex-1`}
        />
        <Button
          variant="primary"
          onClick={() => version.trim() && createMutation.mutate()}
          disabled={!version.trim() || createMutation.isPending}
        >
          + 버전 등록
        </Button>
      </div>

      {isLoading ? (
        <p className="text-faint m-0 text-[13px]">불러오는 중…</p>
      ) : !builds || builds.length === 0 ? (
        <p className="text-faint m-0 text-[13px]">등록된 빌드가 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {builds.map((build) => (
            <BuildRow key={build.id} build={build} onDelete={() => deleteMutation.mutate(build.id)} />
          ))}
        </div>
      )}

      <p className="text-faint m-0 pt-3 text-[11px] leading-[1.6]">
        실제 빌드 파일 업로드·압축 해제·서빙은 아직 지원하지 않습니다 — 여기서는 버전 등록만 합니다.
      </p>
      {error && <p className="text-danger m-0 pt-2 text-[11px]">{error}</p>}
    </SectionCard>
  );
}

function BuildRow({ build, onDelete }: { build: AdminGameBuildResponse; onDelete: () => void }) {
  return (
    <div className="border-line bg-panel2 flex items-center gap-3 rounded-[10px] border px-3.5 py-2.5">
      <span className="text-[13px] font-medium">{build.version}</span>
      <span
        className={`rounded-[5px] border px-1.5 py-0.5 text-[10px] tracking-[.08em] whitespace-nowrap ${
          build.status === 'ACTIVE' ? 'border-primary-line text-primary-text' : 'border-line2 text-muted'
        }`}
      >
        {STATUS_LABELS[build.status]}
      </span>
      <span className="text-faint ml-auto text-[11px]">{new Date(build.uploadedAt).toLocaleDateString('ko-KR')}</span>
      <button
        type="button"
        onClick={onDelete}
        className="text-faint hover:text-danger flex-none cursor-pointer text-xs"
      >
        삭제
      </button>
    </div>
  );
}
