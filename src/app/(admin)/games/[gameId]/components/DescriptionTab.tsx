'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { updateGame } from '@/api/game/api';
import { gameKeys } from '@/api/game/queries';
import type { AdminGameDetailResponse } from '@/api/game/types';
import { ApiError } from '@/api/client';
import { RichTextEditor } from '@/components/rich-text-editor';
import { SectionCard } from '@/components/ui/section-card';
import { useDebouncedSave } from '@/hooks/useDebouncedSave';

/**
 * 상세설명은 활동 본문과 같은 규약(ADR-008)으로 저장 시점에 서버가 정제한다.
 * 게임 PUT이 기본정보·설명을 한 엔드포인트로 묶어서 받으므로, 여기서도 이름·트랙 등
 * 나머지 필드는 detail의 최신 값을 그대로 실어 보낸다 — BasicInfoTab과 이 탭은
 * 동시에 마운트되지 않으므로(탭 전환 시 언마운트) 서로 덮어쓸 일이 없다.
 */
export function DescriptionTab({ gameId, detail }: { gameId: number; detail: AdminGameDetailResponse }) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState(detail.description ?? '');
  const [initializedId, setInitializedId] = useState(detail.id);
  if (detail.id !== initializedId) {
    setInitializedId(detail.id);
    setContent(detail.description ?? '');
  }

  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (description: string) =>
      updateGame(gameId, {
        name: detail.name,
        oneLiner: detail.oneLiner,
        trackId: detail.trackId,
        teamLabel: detail.teamLabel,
        description,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: gameKeys.game(gameId) }),
    onError: (e) => setError(e instanceof ApiError ? e.message : '저장에 실패했습니다.'),
  });
  const { save } = useDebouncedSave<string>((value) => mutation.mutate(value));

  return (
    <SectionCard title="상세 설명" caption="홈페이지 게임 상세에 그대로 노출됩니다">
      <RichTextEditor
        content={content}
        imagePurpose="GAME_CONTENT"
        footerNote="본문은 게임 상세 페이지에 그대로 노출됩니다"
        onChange={(html) => {
          setContent(html);
          save(html);
        }}
      />
      {error && <p className="text-danger m-0 pt-2.5 text-[11px]">{error}</p>}
    </SectionCard>
  );
}
