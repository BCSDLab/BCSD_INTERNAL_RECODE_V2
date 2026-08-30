'use client';

import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createGame, publishGame, reorderGames } from '@/api/game/api';
import { gameKeys, gameQueries } from '@/api/game/queries';
import type { AdminGameSummaryResponse } from '@/api/game/types';
import { trackQueries } from '@/api/track/queries';
import { ApiError } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Field, INPUT_CLASS, INPUT_CLASS_COMPACT, DragHandle } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { PageHeader } from '@/components/ui/page-header';
import { useSortableList } from '@/hooks/useSortableList';

const EMPTY: AdminGameSummaryResponse[] = [];

/**
 * 시안(와이어프레임 1a)의 게임 목록 테이블. 요약 응답(AdminGameSummaryResponse)에는
 * 썸네일·트랙·활성 빌드가 없다 — 그 필드들은 편집 화면에서만 다룬다(T-37 설계). 그래서
 * 이 표는 이름·slug·공개 여부·순서만 보여준다. 이름으로 거르는 검색은 서버 왕복 없이
 * 클라이언트에서 한다 — 목록 전체가 어차피 한 번에 내려온다.
 */
export default function GamesPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: games, isLoading } = useQuery(gameQueries.games());

  const reorderMutation = useMutation({
    mutationFn: reorderGames,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: gameKeys.games() }),
  });
  const publishMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: number; isPublished: boolean }) => publishGame(id, isPublished),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: gameKeys.games() }),
  });

  const { items, sensors, handleDragEnd } = useSortableList(games ?? EMPTY, (ids) => reorderMutation.mutateAsync(ids));
  const shown = keyword.trim()
    ? items.filter((game) => game.name.toLowerCase().includes(keyword.trim().toLowerCase()))
    : items;

  const publishedCount = (games ?? []).filter((game) => game.isPublished).length;

  return (
    <>
      <PageHeader crumb="홈페이지 / 게임" slug="/games" title="게임" />

      <div className="w-full px-8 pt-6 pb-10">
        <div className="flex flex-wrap items-center gap-3 pb-4">
          <div className="text-faint flex items-center gap-3 text-[11px] whitespace-nowrap">
            <span>전체 {games?.length ?? 0}</span>
            <span>공개 {publishedCount}</span>
            <span>비공개 {(games?.length ?? 0) - publishedCount}</span>
          </div>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="게임명 검색"
            className={`${INPUT_CLASS_COMPACT} ml-auto w-[220px] flex-none`}
          />
          <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
            + 게임 추가
          </Button>
        </div>

        <div className="border-line bg-panel overflow-hidden rounded-2xl border">
          <div className="border-line text-faint grid grid-cols-[28px_1fr_140px_100px_72px] items-center gap-3 border-b px-4 py-2.5 text-[11px] whitespace-nowrap uppercase">
            <span />
            <span>게임명 · 주소</span>
            <span>공개</span>
            <span>순서</span>
            <span />
          </div>

          {isLoading ? (
            <p className="text-faint m-0 p-6 text-[13px]">불러오는 중…</p>
          ) : shown.length === 0 ? (
            <p className="text-faint m-0 p-6 text-[13px]">
              {keyword ? '검색 결과가 없습니다.' : '게임이 없습니다. 위의 "+ 게임 추가"로 시작하세요.'}
            </p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={shown.map((game) => game.id)} strategy={verticalListSortingStrategy}>
                {shown.map((game) => (
                  <GameRow
                    key={game.id}
                    game={game}
                    onOpen={() => router.push(`/games/${game.id}`)}
                    onTogglePublish={() => publishMutation.mutate({ id: game.id, isPublished: !game.isPublished })}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {isCreateOpen && (
        <CreateGameModal
          onClose={() => setIsCreateOpen(false)}
          onCreated={(id) => {
            setIsCreateOpen(false);
            queryClient.invalidateQueries({ queryKey: gameKeys.games() });
            router.push(`/games/${id}`);
          }}
        />
      )}
    </>
  );
}

function GameRow({
  game,
  onOpen,
  onTogglePublish,
}: {
  game: AdminGameSummaryResponse;
  onOpen: () => void;
  onTogglePublish: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: game.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="border-line hover:bg-panel2 grid grid-cols-[28px_1fr_140px_100px_72px] items-center gap-3 border-b px-4 py-3 text-[13px] transition-colors last:border-b-0"
    >
      <DragHandle {...attributes} {...listeners} />
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 cursor-pointer flex-col items-start gap-0.5 text-left"
      >
        <span className="truncate font-medium">{game.name}</span>
        <span className="text-faint truncate text-[11px]">/games/{game.slug}</span>
      </button>
      <button
        type="button"
        onClick={onTogglePublish}
        className={`flex w-fit cursor-pointer items-center gap-[7px] rounded-full border px-2.5 py-1 text-[11px] whitespace-nowrap ${
          game.isPublished ? 'border-primary-line bg-primary-soft text-primary-text' : 'border-line2 text-muted'
        }`}
      >
        {game.isPublished ? '공개' : '비공개'}
      </button>
      <span className="text-faint text-[11px]">{game.displayOrder + 1}번째</span>
      <button
        type="button"
        onClick={onOpen}
        className="text-muted hover:text-primary-text cursor-pointer text-right text-xs"
      >
        편집 ›
      </button>
    </div>
  );
}

function CreateGameModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: number) => void }) {
  const { data: tracks } = useQuery(trackQueries.tracks());
  const [name, setName] = useState('');
  const [oneLiner, setOneLiner] = useState('');
  const [trackId, setTrackId] = useState<number | ''>('');
  const [teamLabel, setTeamLabel] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      createGame({
        name,
        oneLiner,
        trackId: trackId === '' ? null : trackId,
        teamLabel: teamLabel.trim() || null,
      }),
    onSuccess: (created) => onCreated(created.id),
    onError: (mutationError) =>
      setError(mutationError instanceof ApiError ? mutationError.message : '생성에 실패했습니다.'),
  });

  function submit() {
    if (!name.trim() || !oneLiner.trim()) {
      setError('게임명과 한 줄 소개를 입력해 주세요.');
      return;
    }
    setError(null);
    mutation.mutate();
  }

  return (
    <Modal
      title="게임 추가"
      onClose={onClose}
      width="440px"
      footer={
        <>
          <Button onClick={onClose} className="ml-auto px-4 py-2.5">
            취소
          </Button>
          <Button variant="primary" onClick={submit} disabled={mutation.isPending} className="px-[18px] py-2.5">
            만들기
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5 px-6 py-5">
        <Field label="게임명">
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} className={INPUT_CLASS} />
        </Field>
        <Field label="한 줄 소개">
          <input
            value={oneLiner}
            onChange={(e) => setOneLiner(e.target.value)}
            maxLength={500}
            className={INPUT_CLASS}
          />
        </Field>
        <Field label="제작 트랙" hint="선택 사항">
          <select
            value={trackId}
            onChange={(e) => setTrackId(e.target.value ? Number(e.target.value) : '')}
            className={INPUT_CLASS}
          >
            <option value="">선택 안 함</option>
            {(tracks ?? []).map((track) => (
              <option key={track.id} value={track.id}>
                {track.name} ({track.code})
              </option>
            ))}
          </select>
        </Field>
        <Field label="팀" hint="예: 1팀 (선택 사항)">
          <input
            value={teamLabel}
            onChange={(e) => setTeamLabel(e.target.value)}
            maxLength={30}
            className={INPUT_CLASS}
          />
        </Field>
        {error && <p className="text-danger m-0 text-[11px]">{error}</p>}
      </div>
    </Modal>
  );
}
