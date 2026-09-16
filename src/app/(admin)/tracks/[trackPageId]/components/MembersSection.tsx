'use client';

import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { Track } from '@/api/auth/types';
import { memberQueries } from '@/api/member/queries';
import { EMPTY_MEMBER_FILTERS } from '@/api/member/types';
import { attachTrackPageMembers, detachTrackPageMember, reorderTrackPageMembers, setTrackPageMemberVisibility } from '@/api/track/api';
import { trackKeys } from '@/api/track/queries';
import type { TrackPageDetailResponse, TrackPageMemberResponse } from '@/api/track/types';
import { ApiError } from '@/api/client';
import { Badge, Chip } from '@/components/ui/chip';
import { DragHandle, INPUT_CLASS_COMPACT } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { Eyebrow } from '@/components/ui/section-card';
import { Button } from '@/components/ui/button';
import { TRACK_OPTIONS } from '@/app/(admin)/members/components/options';

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
        <Chip size="xs" pressed={typeFilter === null} onPressedChange={() => setTypeFilter(null)} className="cursor-pointer">
          전체
        </Chip>
        {memberTypes.map((type) => (
          <Chip
            key={type}
            size="xs"
            pressed={typeFilter === type}
            onPressedChange={() => setTypeFilter(type)}
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

      {isAssignOpen && (
        <AssignMemberModal
          trackPageId={trackPageId}
          existingMemberIds={detail.members.map((member) => member.memberId)}
          onClose={() => setIsAssignOpen(false)}
          onAssigned={() => {
            setIsAssignOpen(false);
            invalidate();
          }}
        />
      )}
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

const ASSIGN_MODAL_PAGE_SIZE = 8;

/** 명부 검색·목록 API(GET /v1/members/directory)로 후보를 찾아 골라 배정한다. */
function AssignMemberModal({
  trackPageId,
  existingMemberIds,
  onClose,
  onAssigned,
}: {
  trackPageId: number;
  existingMemberIds: number[];
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [trackFilter, setTrackFilter] = useState<Track[]>([]);
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 검색은 타자마다 요청하지 않고 멈춘 뒤에 한 번만 보낸다.
  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyword(keywordInput);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [keywordInput]);

  const { data, isLoading } = useQuery(
    memberQueries.directory({
      ...EMPTY_MEMBER_FILTERS,
      keyword,
      track: trackFilter,
      page,
      size: ASSIGN_MODAL_PAGE_SIZE,
      sort: 'name',
      direction: 'asc',
      isAdmin: true,
    }),
  );

  const existing = new Set(existingMemberIds);
  const candidates = (data?.members ?? []).filter((member) => !existing.has(member.id));
  const totalPages = data?.page.totalPages ?? 0;

  const assignMutation = useMutation({
    mutationFn: () => attachTrackPageMembers(trackPageId, selectedIds),
    onSuccess: onAssigned,
    onError: (e) => setError(e instanceof ApiError ? e.message : '배정에 실패했습니다.'),
  });

  function toggleTrack(track: Track) {
    setTrackFilter((prev) => (prev.includes(track) ? prev.filter((t) => t !== track) : [...prev, track]));
    setPage(0);
  }

  function toggleSelected(memberId: number) {
    setSelectedIds((prev) => (prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]));
  }

  return (
    <Modal
      title="부원 배정"
      eyebrow="명부 검색"
      onClose={onClose}
      width="480px"
      footer={
        <>
          <span className="text-faint mr-auto text-[11px]">{selectedIds.length}명 선택됨</span>
          <Button onClick={onClose} className="px-4 py-2.5">
            취소
          </Button>
          <Button
            variant="primary"
            onClick={() => assignMutation.mutate()}
            disabled={selectedIds.length === 0 || assignMutation.isPending}
            className="px-[18px] py-2.5"
          >
            배정
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3 px-6 py-5">
        <input
          value={keywordInput}
          onChange={(e) => setKeywordInput(e.target.value)}
          placeholder="이름으로 검색"
          className={INPUT_CLASS_COMPACT}
        />

        <div className="flex flex-wrap gap-1.5">
          <Chip
            size="xs"
            pressed={trackFilter.length === 0}
            onPressedChange={() => setTrackFilter([])}
            className="cursor-pointer"
          >
            전체
          </Chip>
          {TRACK_OPTIONS.map((track) => (
            <Chip
              key={track}
              size="xs"
              pressed={trackFilter.includes(track)}
              onPressedChange={() => toggleTrack(track)}
              className="cursor-pointer"
            >
              {track}
            </Chip>
          ))}
        </div>

        <div className="border-line flex max-h-80 flex-col gap-1 overflow-y-auto rounded-[11px] border p-1.5">
          {isLoading ? (
            <p className="text-faint m-0 p-3 text-[13px]">불러오는 중…</p>
          ) : candidates.length === 0 ? (
            <p className="text-faint m-0 p-3 text-[13px]">
              {existing.size > 0 && (data?.members.length ?? 0) > 0
                ? '검색된 부원은 이미 모두 배정되어 있습니다.'
                : '검색 결과가 없습니다.'}
            </p>
          ) : (
            candidates.map((member) => (
              <label
                key={member.id}
                className="hover:bg-panel2 flex cursor-pointer items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-[13px]"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(member.id)}
                  onChange={() => toggleSelected(member.id)}
                />
                {member.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={member.photoUrl} alt="" className="h-[22px] w-[22px] flex-none rounded-full object-cover" />
                ) : (
                  <span className="bg-line2 h-[22px] w-[22px] flex-none rounded-full" />
                )}
                <span className="truncate">{member.name}</span>
                <Badge className="ml-auto flex-none">{member.track}</Badge>
                <span className="text-faint flex-none text-[11px]">{member.memberType}</span>
              </label>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 text-[12px]">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="text-muted disabled:text-faint cursor-pointer disabled:cursor-not-allowed"
            >
              이전
            </button>
            <span className="text-faint">
              {page + 1} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="text-muted disabled:text-faint cursor-pointer disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
        )}

        {error && <p className="text-danger m-0 text-[11px]">{error}</p>}
      </div>
    </Modal>
  );
}
