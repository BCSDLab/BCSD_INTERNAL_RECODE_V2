'use client';

import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { replaceGameScreenshots } from '@/api/game/api';
import { gameKeys } from '@/api/game/queries';
import type { AdminGameDetailResponse } from '@/api/game/types';
import { ApiError } from '@/api/client';
import { SectionCard } from '@/components/ui/section-card';
import { useImageUpload } from '@/hooks/useImageUpload';

/**
 * 활동 대표 사진(ActivityEditModal)과 같은 그리드 패턴이지만, 게임 스크린샷은
 * "썸네일 강조 없이 균일한 그리드"다(와이어프레임에 썸네일 배지가 없다) — 대신
 * 첫 장이 곧 game.thumbnailUrl로 동기화된다는 안내만 보인다.
 */
export function ScreenshotsTab({
  gameId,
  detail,
  canManage,
}: {
  gameId: number;
  detail: AdminGameDetailResponse;
  canManage: boolean;
}) {
  const queryClient = useQueryClient();
  const [urls, setUrls] = useState(detail.screenshots.map((s) => s.imageUrl));
  const [initializedId, setInitializedId] = useState(detail.id);
  if (detail.id !== initializedId) {
    setInitializedId(detail.id);
    setUrls(detail.screenshots.map((s) => s.imageUrl));
  }

  const [error, setError] = useState<string | null>(null);
  const { upload, isUploading } = useImageUpload('GAME');

  const replaceMutation = useMutation({
    mutationFn: (imageUrls: string[]) => replaceGameScreenshots(gameId, imageUrls),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: gameKeys.game(gameId) }),
    onError: (e) => setError(e instanceof ApiError ? e.message : '저장에 실패했습니다.'),
  });

  function commit(next: string[]) {
    setUrls(next);
    replaceMutation.mutate(next);
  }

  async function addImage(file: File) {
    try {
      const url = await upload(file);
      commit([...urls, url]);
    } catch {
      // useImageUpload가 이미 error 상태를 들고 있다.
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const from = Number(active.id);
    const to = Number(over.id);
    commit(arrayMove(urls, from, to));
  }

  return (
    <SectionCard title="스크린샷" caption={`${urls.length}장 · 첫 장이 게임 썸네일로 쓰입니다`}>
      <DndContext collisionDetection={closestCenter} onDragEnd={canManage ? handleDragEnd : undefined}>
        <SortableContext items={urls.map((_, i) => String(i))} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2.5">
            {urls.map((url, index) => (
              <ScreenshotThumb
                key={index}
                id={String(index)}
                url={url}
                isThumbnail={index === 0}
                canManage={canManage}
                onRemove={() => commit(urls.filter((_, i) => i !== index))}
              />
            ))}
            {canManage && (
              <label className="border-dash text-faint hover:border-primary-line hover:text-primary-text flex aspect-video cursor-pointer items-center justify-center rounded-[11px] border border-dashed text-xs whitespace-nowrap transition-colors">
                {isUploading ? '업로드…' : '+ 스크린샷 추가'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      addImage(file);
                    }
                  }}
                />
              </label>
            )}
          </div>
        </SortableContext>
      </DndContext>

      <p className="text-faint m-0 pt-3 text-[11px] leading-[1.6]">
        5MB 이하 png/jpg/jpeg/webp/svg만 올릴 수 있습니다.
      </p>
      {error && <p className="text-danger m-0 pt-2 text-[11px]">{error}</p>}
    </SectionCard>
  );
}

function ScreenshotThumb({
  id,
  url,
  isThumbnail,
  canManage,
  onRemove,
}: {
  id: string;
  url: string;
  isThumbnail: boolean;
  canManage: boolean;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...(canManage ? attributes : {})}
      {...(canManage ? listeners : {})}
      className={`border-line relative aspect-video overflow-hidden rounded-[11px] border ${canManage ? 'cursor-grab' : ''}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="h-full w-full object-cover" />
      {isThumbnail && (
        <span className="bg-primary-soft text-primary-text absolute bottom-1.5 left-1.5 rounded px-1.5 py-0.5 text-[10px]">
          썸네일
        </span>
      )}
      {canManage && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-1 right-1 cursor-pointer rounded-full bg-[rgba(10,8,16,.6)] px-1 text-[11px] text-white"
        >
          ✕
        </button>
      )}
    </div>
  );
}
