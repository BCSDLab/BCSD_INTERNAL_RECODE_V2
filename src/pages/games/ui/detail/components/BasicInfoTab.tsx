import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import {
  attachGameMembers,
  deleteGame,
  detachGameMember,
  publishGame,
  reorderGameMembers,
  updateGame,
  gameKeys,
  type AdminGameDetailResponse,
  type AdminGameMemberResponse,
} from '@/entities/game';
import { trackQueries } from '@/entities/track';
import { MemberPickerModal } from '@/features/member-picker';
import { ApiError } from '@/shared/api/client';
import { getApiErrorMessage } from '@/shared/api/error';
import { useDebouncedSave } from '@/shared/lib/hooks/useDebouncedSave';
import { Avatar } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { Field, INPUT_CLASS } from '@/shared/ui/field';
import { ConfirmModal } from '@/shared/ui/modal';
import { SectionCard } from '@/shared/ui/section-card';
import { Select } from '@/shared/ui/select';

interface FormValues {
  name: string;
  oneLiner: string;
  trackId: number | null;
  teamLabel: string;
}

function toForm(detail: AdminGameDetailResponse): FormValues {
  return {
    name: detail.name,
    oneLiner: detail.oneLiner,
    trackId: detail.trackId,
    teamLabel: detail.teamLabel ?? '',
  };
}

export function BasicInfoTab({
  gameId,
  detail,
  canManage,
}: {
  gameId: number;
  detail: AdminGameDetailResponse;
  canManage: boolean;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: tracks } = useQuery(trackQueries.tracks());

  const [form, setForm] = useState<FormValues>(() => toForm(detail));
  const [initializedId, setInitializedId] = useState(detail.id);
  if (detail.id !== initializedId) {
    setInitializedId(detail.id);
    setForm(toForm(detail));
  }

  const [error, setError] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: gameKeys.game(gameId) });
    queryClient.invalidateQueries({ queryKey: gameKeys.games() });
  }

  const updateMutation = useMutation({
    mutationFn: (values: FormValues) =>
      updateGame(gameId, {
        name: values.name,
        oneLiner: values.oneLiner,
        trackId: values.trackId,
        teamLabel: values.teamLabel.trim() || null,
        description: detail.description,
      }),
    onSuccess: invalidate,
    onError: (e) => setError(getApiErrorMessage(e, '저장에 실패했습니다.')),
  });
  const { save } = useDebouncedSave<FormValues>((values) => updateMutation.mutate(values));

  function updateForm(patch: Partial<FormValues>) {
    setForm((prev) => {
      const next = { ...prev, ...patch };
      save(next);
      return next;
    });
  }

  const publishMutation = useMutation({
    mutationFn: (isPublished: boolean) => publishGame(gameId, isPublished),
    onSuccess: invalidate,
    onError: (e) => setError(getApiErrorMessage(e, '공개 설정에 실패했습니다.')),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteGame(gameId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameKeys.games() });
      navigate({ to: '/games', replace: true });
    },
    onError: (e) => setError(getApiErrorMessage(e, '삭제에 실패했습니다.')),
  });

  const attachMutation = useMutation({
    mutationFn: (memberIds: number[]) => attachGameMembers(gameId, memberIds),
    onSuccess: () => {
      setIsAssignOpen(false);
      invalidate();
    },
    onError: (e) => setError(getApiErrorMessage(e, '배정에 실패했습니다.')),
  });
  const detachMutation = useMutation({
    mutationFn: (memberId: number) => detachGameMember(gameId, memberId),
    onSuccess: invalidate,
    onError: (e) => setError(getApiErrorMessage(e, '해제에 실패했습니다.')),
  });
  const reorderMutation = useMutation({
    mutationFn: (ids: number[]) => reorderGameMembers(gameId, ids),
    onSuccess: invalidate,
    onError: (e) => setError(getApiErrorMessage(e, '순서 변경에 실패했습니다.')),
  });

  function handleMemberDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const from = detail.members.findIndex((member) => member.id === active.id);
    const to = detail.members.findIndex((member) => member.id === over.id);
    if (from === -1 || to === -1) {
      return;
    }
    reorderMutation.mutate(arrayMove(detail.members, from, to).map((member) => member.id));
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionCard
        title="기본 정보"
        caption="홈페이지 게임 목록·상세 상단"
        action={
          canManage && (
            <div className="flex items-center gap-2">
              <Button onClick={() => publishMutation.mutate(!detail.isPublished)}>
                {detail.isPublished ? '숨기기' : '공개하기'}
              </Button>
              <Button variant="danger" onClick={() => setIsDeleteOpen(true)}>
                게임 삭제
              </Button>
            </div>
          )
        }
      >
        <div className="flex flex-col gap-3.5">
          <div className="flex gap-3.5">
            <Field label="게임명" className="flex-1">
              <input
                value={form.name}
                maxLength={100}
                onChange={(e) => updateForm({ name: e.target.value })}
                readOnly={!canManage}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="주소 (slug)" className="w-[200px] flex-none">
              <input
                value={`bcsdlab.com/games/${detail.slug}`}
                readOnly
                className={`${INPUT_CLASS} text-faint cursor-not-allowed`}
              />
            </Field>
          </div>

          <Field label="한 줄 설명" hint={`${form.oneLiner.length}/500자`}>
            <input
              value={form.oneLiner}
              maxLength={500}
              onChange={(e) => updateForm({ oneLiner: e.target.value })}
              readOnly={!canManage}
              className={INPUT_CLASS}
            />
          </Field>

          <div className="flex gap-3.5">
            <Field label="제작 트랙" className="flex-1">
              <Select
                value={String(form.trackId ?? '')}
                onValueChange={(v) => updateForm({ trackId: v ? Number(v) : null })}
                options={[
                  { value: '', label: '선택 안 함' },
                  ...(tracks ?? []).map((track) => ({
                    value: String(track.id),
                    label: `${track.name} (${track.code})`,
                  })),
                ]}
                disabled={!canManage}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="팀" className="flex-1">
              <input
                value={form.teamLabel}
                maxLength={30}
                onChange={(e) => updateForm({ teamLabel: e.target.value })}
                readOnly={!canManage}
                className={INPUT_CLASS}
              />
            </Field>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="참여 멤버"
        caption="인명부에서 선택 · 이름·사진·트랙은 명부가 원본입니다"
        action={<span className="text-faint text-[11px] whitespace-nowrap">{detail.members.length}명</span>}
      >
        <DndContext collisionDetection={closestCenter} onDragEnd={canManage ? handleMemberDragEnd : undefined}>
          <SortableContext items={detail.members.map((member) => member.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2">
              {detail.members.map((member) => (
                <ParticipantRow
                  key={member.id}
                  member={member}
                  canManage={canManage}
                  onRemove={() => detachMutation.mutate(member.memberId)}
                />
              ))}
              {canManage && (
                <button
                  type="button"
                  onClick={() => setIsAssignOpen(true)}
                  className="border-dash text-muted hover:border-primary-line hover:text-primary-text col-[1/-1] cursor-pointer rounded-[11px] border border-dashed p-2.5 text-center text-xs whitespace-nowrap transition-colors"
                >
                  + 멤버 · 명부 검색
                </button>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </SectionCard>

      {error && <p className="text-danger m-0 text-[11px]">{error}</p>}

      {isDeleteOpen && (
        <ConfirmModal
          title="게임 삭제"
          description={`"${detail.name}" 게임을 삭제합니다. 랜딩에서 즉시 사라집니다.`}
          onCancel={() => setIsDeleteOpen(false)}
          onConfirm={() => deleteMutation.mutate()}
        />
      )}

      {isAssignOpen && (
        <MemberPickerModal
          title="참여 멤버 추가"
          eyebrow="명부 검색"
          confirmLabel="추가"
          existingMemberIds={detail.members.map((member) => member.memberId)}
          isPending={attachMutation.isPending}
          error={attachMutation.error instanceof ApiError ? attachMutation.error.message : null}
          onClose={() => setIsAssignOpen(false)}
          onConfirm={(memberIds) => attachMutation.mutate(memberIds)}
        />
      )}
    </div>
  );
}

function ParticipantRow({
  member,
  canManage,
  onRemove,
}: {
  member: AdminGameMemberResponse;
  canManage: boolean;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: member.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="border-line bg-panel2 hover:border-line2 flex items-center gap-2.5 rounded-[11px] border px-[11px] py-[9px] transition-colors"
    >
      {canManage && (
        <span {...attributes} {...listeners} className="text-faint flex-none cursor-grab text-xs select-none">
          ⠿
        </span>
      )}
      <Avatar src={member.profileImageUrl} name={member.name} size="md" />
      <span className="truncate text-[13px]">{member.name}</span>
      {canManage && (
        <button
          type="button"
          onClick={onRemove}
          className="text-faint hover:text-danger ml-auto flex-none cursor-pointer text-xs"
        >
          ✕
        </button>
      )}
    </div>
  );
}
