'use client';

import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { detachTrackPageMember, reorderTrackPageMembers, setTrackPageMemberVisibility } from '@/api/track/api';
import { trackKeys } from '@/api/track/keys';
import type { TrackPageDetailResponse, TrackPageMemberResponse } from '@/api/track/types';
import { ApiError } from '@/api/client';
import { Badge, Chip } from '@/components/ui/chip';
import { DragHandle } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { Eyebrow } from '@/components/ui/section-card';

/**
 * 시안의 "함께 할 멤버들" 섹션. h2가 아니라 11px eyebrow 라벨이고, 오른쪽에 "N명 노출".
 * 등급 필터 칩(전체/REGULAR/MENTOR…) 아래로 280px 최소폭 auto-fill 그리드다.
 * 숨김 멤버는 배경 없이 opacity .5 + 점선 "숨김" 뱃지로 보인다.
 */
export function MembersSection({ trackPageId, detail }: { trackPageId: number; detail: TrackPageDetailResponse }) {
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function invalidate() {
    setError(null);
    queryClient.invalidateQueries({ queryKey: trackKeys.trackPage(trackPageId) });
  }
  function handleError(e: unknown) {
    setError(e instanceof ApiError ? e.message : '요청에 실패했습니다.');
  }

  const reorderMutation = useMutation({
    mutationFn: (ids: number[]) => reorderTrackPageMembers(trackPageId, ids),
    onSuccess: invalidate,
    onError: handleError,
  });
  const visibilityMutation = useMutation({
    mutationFn: ({ memberId, isVisible }: { memberId: number; isVisible: boolean }) =>
      setTrackPageMemberVisibility(trackPageId, memberId, isVisible),
    onSuccess: invalidate,
    onError: handleError,
  });
  const detachMutation = useMutation({
    mutationFn: (memberId: number) => detachTrackPageMember(trackPageId, memberId),
    onSuccess: invalidate,
    onError: handleError,
  });

  const memberTypes = [...new Set(detail.members.map((member) => member.memberType))];
  const shown = typeFilter ? detail.members.filter((member) => member.memberType === typeFilter) : detail.members;
  const visibleCount = detail.members.filter((member) => member.isVisible).length;

  function handleDragEnd(event: DragEndEvent) {
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
    <section className="border-line bg-panel rounded-2xl border p-[22px]">
      <div className="flex flex-wrap items-center gap-2 pb-3">
        <Eyebrow>함께 할 멤버들</Eyebrow>
        <span className="text-faint ml-auto flex-none text-[11px] whitespace-nowrap">{visibleCount}명 노출</span>
      </div>

      <div className="flex gap-1.5 pb-3">
        <Chip size="xs" selected={typeFilter === null} onClick={() => setTypeFilter(null)} className="cursor-pointer">
          전체
        </Chip>
        {memberTypes.map((type) => (
          <Chip
            key={type}
            size="xs"
            selected={typeFilter === type}
            onClick={() => setTypeFilter(type)}
            className="cursor-pointer"
          >
            {type}
          </Chip>
        ))}
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={detail.members.map((member) => member.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-2">
            {shown.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                onToggleVisible={() =>
                  visibilityMutation.mutate({ memberId: member.memberId, isVisible: !member.isVisible })
                }
                onDetach={() => detachMutation.mutate(member.memberId)}
              />
            ))}
            <button
              type="button"
              onClick={() => setIsAssignOpen(true)}
              className="border-dash text-muted hover:border-primary-line hover:text-primary-text col-[1/-1] cursor-pointer rounded-[11px] border border-dashed p-2.5 text-center text-xs whitespace-nowrap transition-colors"
            >
              + 부원 배정 · 명부 검색
            </button>
          </div>
        </SortableContext>
      </DndContext>

      {error && <p className="text-danger m-0 pt-2.5 text-[11px]">{error}</p>}

      <p className="text-faint m-0 pt-3 text-[11px] leading-[1.65]">
        사진·등급은 부원 명부에서 관리합니다. 이 화면에서는 배정, 노출 순서, 숨김만 다룹니다.
      </p>

      {isAssignOpen && <AssignMemberModal onClose={() => setIsAssignOpen(false)} />}
    </section>
  );
}

function MemberRow({
  member,
  onToggleVisible,
  onDetach,
}: {
  member: TrackPageMemberResponse;
  onToggleVisible: () => void;
  onDetach: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: member.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`border-line flex items-center gap-2.5 rounded-[11px] border px-[11px] py-[9px] transition-colors ${
        member.isVisible ? 'bg-panel2 hover:border-line2' : 'opacity-50'
      }`}
    >
      <DragHandle {...attributes} {...listeners} className="text-xs" />
      {member.profileImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={member.profileImageUrl} alt="" className="h-[26px] w-[26px] flex-none rounded-full object-cover" />
      ) : (
        <span className={`h-[26px] w-[26px] flex-none rounded-full ${member.isVisible ? 'bg-primary' : 'bg-line2'}`} />
      )}
      <span className="truncate text-[13px]">{member.name}</span>
      <button
        type="button"
        onClick={onToggleVisible}
        title={member.isVisible ? '숨기기' : '공개하기'}
        className="flex-none cursor-pointer"
      >
        <Badge dashed={!member.isVisible}>{member.isVisible ? member.memberType : '숨김'}</Badge>
      </button>
      <button
        type="button"
        onClick={onDetach}
        className="text-faint hover:text-danger ml-auto flex-none cursor-pointer text-xs"
      >
        ✕
      </button>
    </div>
  );
}

/** 부원 검색 API가 아직 없어(명부 담당자 작업 예정) 안내만 하는 스텁이다. */
function AssignMemberModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="부원 배정" eyebrow="명부 검색" onClose={onClose} width="440px">
      <div className="px-6 py-5">
        <input
          disabled
          placeholder="이름으로 검색 (준비 중)"
          className="border-line bg-panel2 text-faint w-full rounded-[10px] border px-[13px] py-[11px] text-sm outline-none"
        />
        <p className="text-faint m-0 pt-3 text-[11px] leading-[1.65]">
          부원 검색 API 연동 대기 중입니다 — 명부 담당자의 검색 API 작업이 끝나면 이 화면에서 바로 검색·배정할 수 있게
          연결합니다.
        </p>
      </div>
    </Modal>
  );
}
