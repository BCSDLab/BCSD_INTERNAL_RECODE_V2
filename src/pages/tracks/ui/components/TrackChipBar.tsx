import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useState } from 'react';

import { useSession } from '@/entities/session';
import {
  createTrackPage,
  reorderTrackPages,
  trackKeys,
  trackQueries,
  type TrackPageSummaryResponse,
} from '@/entities/track';
import { getApiErrorMessage } from '@/shared/api/error';
import { useSortableList } from '@/shared/lib/hooks/useSortableList';
import { Button } from '@/shared/ui/button';
import { ChipCount, DashedChip } from '@/shared/ui/chip';
import { Field, INPUT_CLASS } from '@/shared/ui/field';
import { Modal } from '@/shared/ui/modal';
import { Select } from '@/shared/ui/select';

// useSortableList는 매 렌더마다 참조가 바뀌지 않는 배열을 기대한다 — `data ?? []`처럼
// 매번 새 배열 리터럴을 만들면 로딩 중(data === undefined) 매 렌더가 "서버 데이터가
// 바뀌었다"로 오인되어 무한 재렌더로 이어진다.
const EMPTY: TrackPageSummaryResponse[] = [];

/** 시안: 상단 "Tracks · 드래그로 랜딩 순서" 라벨 + 알약 칩 줄 + 점선 "+ 트랙 추가". */
export function TrackChipBar({ selectedId }: { selectedId: number | null }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { session } = useSession();
  const isAdmin = session?.member.role === 'ADMIN';
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const isTransitioning = useRouterState({
    select: (state) => state.isLoading && state.location.pathname.startsWith('/tracks/'),
  });

  const { data: trackPages } = useQuery(trackQueries.trackPages());

  const reorderMutation = useMutation({
    mutationFn: reorderTrackPages,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: trackKeys.trackPages() }),
  });

  const { items, sensors, handleDragEnd } = useSortableList(trackPages ?? EMPTY, (ids) =>
    reorderMutation.mutateAsync(ids),
  );

  return (
    <div className="border-line border-b px-8 pt-5 pb-3.5">
      <div className="flex w-full flex-wrap gap-2">
        <div className="text-faint flex w-full items-center justify-between pb-1 text-[11px] tracking-[.14em] whitespace-nowrap uppercase">
          <span>Tracks · 드래그로 랜딩 순서</span>
          {isTransitioning && (
            <span role="status" className="tracking-normal">
              트랙 전환 중…
            </span>
          )}
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={isAdmin ? handleDragEnd : undefined}
        >
          <SortableContext items={items.map((item) => item.id)} strategy={horizontalListSortingStrategy}>
            {items.map((item) => (
              <TrackChip key={item.id} item={item} isSelected={item.id === selectedId} draggable={isAdmin} />
            ))}
          </SortableContext>
        </DndContext>
        {isAdmin && <DashedChip onClick={() => setIsCreateOpen(true)}>+ 트랙 추가</DashedChip>}
      </div>

      {isCreateOpen && (
        <CreateTrackPageModal
          onClose={() => setIsCreateOpen(false)}
          onCreated={(id) => {
            setIsCreateOpen(false);
            queryClient.invalidateQueries({ queryKey: trackKeys.trackPages() });
            navigate({ to: '/tracks/$trackPageId', params: { trackPageId: String(id) } });
          }}
        />
      )}
    </div>
  );
}

function TrackChip({
  item,
  isSelected,
  draggable,
}: {
  item: TrackPageSummaryResponse;
  isSelected: boolean;
  draggable: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const navigate = useNavigate();

  return (
    <span
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={() => navigate({ to: '/tracks/$trackPageId', params: { trackPageId: String(item.id) } })}
      {...(draggable ? attributes : {})}
      {...(draggable ? listeners : {})}
      className={`inline-flex flex-none cursor-pointer items-center gap-[7px] rounded-full px-3.5 py-2 text-[13px] whitespace-nowrap transition-colors ${
        isSelected
          ? 'border-primary-line bg-primary-soft text-primary-text border font-medium'
          : 'border-line text-muted hover:border-line2 hover:text-text border'
      }`}
    >
      {item.displayName}
      {!item.isPublished && <ChipCount>숨김</ChipCount>}
    </span>
  );
}

function CreateTrackPageModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: number) => void }) {
  const { data: tracks } = useQuery(trackQueries.tracks());
  const [trackId, setTrackId] = useState<number | ''>('');
  const [displayName, setDisplayName] = useState('');
  const [tagline, setTagline] = useState('');
  const [error, setError] = useState<string | null>(null);

  const availableTracks = (tracks ?? []).filter((track) => !track.hasTrackPage);

  const mutation = useMutation({
    mutationFn: () => createTrackPage({ trackId: trackId as number, displayName, tagline }),
    onSuccess: (created) => onCreated(created.id),
    onError: (mutationError) => setError(getApiErrorMessage(mutationError, '생성에 실패했습니다.')),
  });

  function submit() {
    if (!trackId || !displayName.trim() || !tagline.trim()) {
      setError('모든 항목을 입력해 주세요.');
      return;
    }
    setError(null);
    mutation.mutate();
  }

  return (
    <Modal
      title="트랙 추가"
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
        <Field label="트랙">
          <Select
            value={String(trackId)}
            onValueChange={(v) => setTrackId(v ? Number(v) : '')}
            options={[
              { value: '', label: '선택하세요' },
              ...availableTracks.map((track) => ({ value: String(track.id), label: `${track.name} (${track.code})` })),
            ]}
            className={INPUT_CLASS}
          />
        </Field>
        <Field label="트랙명">
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={INPUT_CLASS} />
        </Field>
        <Field label="한 줄 소개">
          <input value={tagline} onChange={(e) => setTagline(e.target.value)} className={INPUT_CLASS} />
        </Field>
        {error && <p className="text-danger m-0 text-[11px]">{error}</p>}
      </div>
    </Modal>
  );
}
