'use client';

import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { addMentorSlot, removeMentorSlot, reorderMentorSlots } from '@/api/home/api';
import { homeKeys, homeQueries } from '@/api/home/queries';
import type { AdminMentorSlotResponse } from '@/api/home/types';
import { ApiError } from '@/api/client';
import { MemberPickerModal } from '@/components/member-picker-modal';
import { SectionCard } from '@/components/ui/section-card';

/**
 * 트랙 멤버(MembersSection)와 같은 그리드·드래그 패턴이지만 숨김 토글이 없다 —
 * 슬롯에서 빼는 것 자체가 숨김이다(백엔드 FR-8.1). 순서 변경은 멤버 id가 아니라
 * 슬롯 자신의 id로 건다(AdminMentorSlotResponse.id).
 */
export function MentorSection() {
  const queryClient = useQueryClient();
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: slots } = useQuery(homeQueries.mentorSlots());
  const items = slots ?? [];

  function invalidate() {
    setError(null);
    queryClient.invalidateQueries({ queryKey: homeKeys.mentorSlots() });
  }
  function handleError(e: unknown) {
    setError(e instanceof ApiError ? e.message : '요청에 실패했습니다.');
  }

  // 백엔드는 한 번에 한 명만 슬롯에 추가한다 — 모달에서 여러 명을 고르면 순서대로 반복 호출한다.
  const addMutation = useMutation({
    mutationFn: async (memberIds: number[]) => {
      for (const memberId of memberIds) {
        await addMentorSlot(memberId);
      }
    },
    onSuccess: () => {
      setIsAssignOpen(false);
      invalidate();
    },
    onError: handleError,
  });
  const removeMutation = useMutation({
    mutationFn: (memberId: number) => removeMentorSlot(memberId),
    onSuccess: invalidate,
    onError: handleError,
  });
  const reorderMutation = useMutation({
    mutationFn: (ids: number[]) => reorderMentorSlots(ids),
    onSuccess: invalidate,
    onError: handleError,
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const from = items.findIndex((slot) => slot.id === active.id);
    const to = items.findIndex((slot) => slot.id === over.id);
    if (from === -1 || to === -1) {
      return;
    }
    reorderMutation.mutate(arrayMove(items, from, to).map((slot) => slot.id));
  }

  return (
    <SectionCard
      title="멘토 캐러셀"
      caption="메인에 노출할 멘토 선택 · 드래그로 순서"
      action={<span className="text-faint text-[11px] whitespace-nowrap">{items.length}명 노출</span>}
    >
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((slot) => slot.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2">
            {items.map((slot) => (
              <MentorRow key={slot.id} slot={slot} onRemove={() => removeMutation.mutate(slot.memberId)} />
            ))}
            <button
              type="button"
              onClick={() => setIsAssignOpen(true)}
              className="border-dash text-muted hover:border-primary-line hover:text-primary-text col-[1/-1] cursor-pointer rounded-[11px] border border-dashed p-2.5 text-center text-xs whitespace-nowrap transition-colors"
            >
              + 멘토 추가 · 명부 검색
            </button>
          </div>
        </SortableContext>
      </DndContext>

      {error && <p className="text-danger m-0 pt-2.5 text-[11px]">{error}</p>}

      <p className="text-faint m-0 pt-3 text-[11px] leading-[1.65]">
        이름·사진·트랙은 인명부에서 관리합니다. 이 화면은 메인 캐러셀 노출 여부와 순서만 다룹니다.
      </p>

      {isAssignOpen && (
        <MemberPickerModal
          title="멘토 추가"
          eyebrow="명부 검색"
          confirmLabel="추가"
          existingMemberIds={items.map((slot) => slot.memberId)}
          isPending={addMutation.isPending}
          error={addMutation.error instanceof ApiError ? addMutation.error.message : null}
          onClose={() => setIsAssignOpen(false)}
          onConfirm={(memberIds) => addMutation.mutate(memberIds)}
        />
      )}
    </SectionCard>
  );
}

function MentorRow({ slot, onRemove }: { slot: AdminMentorSlotResponse; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: slot.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="border-line bg-panel2 hover:border-line2 flex items-center gap-2.5 rounded-[11px] border px-[11px] py-[9px] transition-colors"
    >
      <span {...attributes} {...listeners} className="text-faint flex-none cursor-grab text-[13px] select-none">
        ⠿
      </span>
      {slot.profileImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={slot.profileImageUrl} alt="" className="h-[26px] w-[26px] flex-none rounded-full object-cover" />
      ) : (
        <span className="bg-primary h-[26px] w-[26px] flex-none rounded-full" />
      )}
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-[13px]">{slot.name}</span>
        <span className="text-faint truncate text-[11px]">{slot.trackName} · 멘토</span>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="text-faint hover:text-danger ml-auto flex-none cursor-pointer text-xs"
      >
        제외
      </button>
    </div>
  );
}
