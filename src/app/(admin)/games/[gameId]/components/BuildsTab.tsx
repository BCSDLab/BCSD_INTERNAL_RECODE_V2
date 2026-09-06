'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import {
  createGameBuild,
  deleteGameBuild,
  issueGameBuildUploadToken,
  uploadGameBuildFile,
} from '@/api/game/api';
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

const UPLOADABLE_STATUSES: GameBuildStatus[] = ['PENDING', 'PROCESSING', 'FAILED'];

/**
 * 빌드 버전을 등록하고, 등록된 빌드에 ZIP을 업로드한다(ADR-024). 업로드는
 * 인터널 API를 경유하지 않는다 — 토큰만 발급받고 홈페이지 서버에 직접 올린다.
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
    <SectionCard title="빌드" caption={`보관 ${builds?.length ?? 0}개`}>
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
            <BuildRow
              key={build.id}
              gameId={gameId}
              build={build}
              onDelete={() => deleteMutation.mutate(build.id)}
              onUploadStart={() => setError(null)}
              onUploaded={invalidate}
              onError={setError}
            />
          ))}
        </div>
      )}

      <p className="text-faint m-0 pt-3 text-[11px] leading-[1.6]">
        ZIP은 index.html이 압축 루트에 바로 있거나 폴더 한 단계 아래에 있어야 합니다. 업로드 후 처리 결과가
        반영될 때까지 잠시 걸릴 수 있습니다.
      </p>
      {error && <p className="text-danger m-0 pt-2 text-[11px]">{error}</p>}
    </SectionCard>
  );
}

function BuildRow({
  gameId,
  build,
  onDelete,
  onUploadStart,
  onUploaded,
  onError,
}: {
  gameId: number;
  build: AdminGameBuildResponse;
  onDelete: () => void;
  onUploadStart: () => void;
  onUploaded: () => void;
  onError: (message: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const { uploadUrl, token } = await issueGameBuildUploadToken(gameId, build.id);
      await uploadGameBuildFile(uploadUrl, token, file);
    },
    onMutate: onUploadStart,
    onSuccess: onUploaded,
    onError: (e) => onError(e instanceof ApiError ? e.message : '빌드 업로드에 실패했습니다.'),
  });

  const canUpload = UPLOADABLE_STATUSES.includes(build.status);

  return (
    <div className="border-line bg-panel2 flex flex-col gap-1.5 rounded-[10px] border px-3.5 py-2.5">
      <div className="flex items-center gap-3">
        <span className="text-[13px] font-medium">{build.version}</span>
        <span
          className={`rounded-[5px] border px-1.5 py-0.5 text-[10px] tracking-[.08em] whitespace-nowrap ${
            build.status === 'ACTIVE' ? 'border-primary-line text-primary-text' : 'border-line2 text-muted'
          }`}
        >
          {STATUS_LABELS[build.status]}
        </span>
        {build.storageBytes != null && (
          <span className="text-faint text-[11px]">{(build.storageBytes / 1024 / 1024).toFixed(1)}MB</span>
        )}
        <span className="text-faint ml-auto text-[11px]">{new Date(build.uploadedAt).toLocaleDateString('ko-KR')}</span>

        {canUpload && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) uploadMutation.mutate(file);
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
              className="text-primary-text flex-none cursor-pointer text-xs whitespace-nowrap disabled:cursor-default disabled:opacity-50"
            >
              {uploadMutation.isPending ? '업로드 중…' : 'ZIP 업로드'}
            </button>
          </>
        )}
        <button
          type="button"
          onClick={onDelete}
          className="text-faint hover:text-danger flex-none cursor-pointer text-xs"
        >
          삭제
        </button>
      </div>
      {build.status === 'FAILED' && build.failureReason && (
        <p className="text-danger m-0 text-[11px]">{build.failureReason}</p>
      )}
    </div>
  );
}
