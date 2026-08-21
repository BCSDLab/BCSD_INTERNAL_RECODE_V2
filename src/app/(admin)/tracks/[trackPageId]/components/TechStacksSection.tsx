'use client';

import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { createTechStack, putTechStacks } from '@/api/track/api';
import { trackKeys, trackQueries } from '@/api/track/queries';
import type { TechStackResponse, TrackPageDetailResponse } from '@/api/track/types';
import { ApiError } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Field, INPUT_CLASS } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { SectionCard } from '@/components/ui/section-card';

/**
 * 시안의 TECH STACK 섹션. 스택은 panel2 배경의 알약(16px 아이콘 + 이름 + ✕)이고,
 * 줄 끝의 "+ 스택 선택"은 점선 **primary-line** 알약이다(회색 dash가 아니다).
 * 섹션 헤더에는 액션 버튼이 없다.
 */
export function TechStacksSection({ trackPageId, detail }: { trackPageId: number; detail: TrackPageDetailResponse }) {
  const queryClient = useQueryClient();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const replaceMutation = useMutation({
    mutationFn: (techStackIds: number[]) => putTechStacks(trackPageId, techStackIds),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: trackKeys.trackPage(trackPageId) });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : '저장에 실패했습니다.'),
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const from = detail.techStacks.findIndex((stack) => stack.id === active.id);
    const to = detail.techStacks.findIndex((stack) => stack.id === over.id);
    if (from === -1 || to === -1) {
      return;
    }
    replaceMutation.mutate(arrayMove(detail.techStacks, from, to).map((stack) => stack.id));
  }

  return (
    <SectionCard title="Tech stack" caption="마스터에서 선택 · 표시 순서 드래그">
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={detail.techStacks.map((stack) => stack.id)} strategy={horizontalListSortingStrategy}>
          <div className="flex flex-wrap gap-[9px]">
            {detail.techStacks.map((stack) => (
              <TechStackPill
                key={stack.id}
                stack={stack}
                onRemove={() =>
                  replaceMutation.mutate(
                    detail.techStacks.filter((other) => other.id !== stack.id).map((other) => other.id),
                  )
                }
              />
            ))}
            <button
              type="button"
              onClick={() => setIsPickerOpen(true)}
              className="border-primary-line text-primary-text hover:bg-primary-soft inline-flex flex-none cursor-pointer items-center rounded-full border border-dashed px-[13px] py-2 text-[13px] whitespace-nowrap transition-colors"
            >
              + 스택 선택
            </button>
          </div>
        </SortableContext>
      </DndContext>
      {error && <p className="text-danger m-0 pt-2.5 text-[11px]">{error}</p>}

      {isPickerOpen && (
        <TechStackPickerModal
          selectedIds={detail.techStacks.map((stack) => stack.id)}
          onClose={() => setIsPickerOpen(false)}
          onConfirm={(ids) => {
            replaceMutation.mutate(ids);
            setIsPickerOpen(false);
          }}
        />
      )}
    </SectionCard>
  );
}

function TechStackPill({ stack, onRemove }: { stack: TechStackResponse; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: stack.id });
  return (
    <span
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="border-line bg-panel2 inline-flex flex-none items-center gap-[9px] rounded-full border px-[13px] py-2 text-[13px] whitespace-nowrap"
    >
      <span {...attributes} {...listeners} className="flex-none cursor-grab">
        {stack.iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={stack.iconUrl} alt="" className="h-4 w-4 rounded-[4px] object-cover" />
        ) : (
          <span className="bg-line2 block h-4 w-4 rounded-[4px]" />
        )}
      </span>
      {stack.name}
      <button type="button" onClick={onRemove} className="text-faint hover:text-danger cursor-pointer">
        ✕
      </button>
    </span>
  );
}

function TechStackPickerModal({
  selectedIds,
  onClose,
  onConfirm,
}: {
  selectedIds: number[];
  onClose: () => void;
  onConfirm: (ids: number[]) => void;
}) {
  const queryClient = useQueryClient();
  const { data: master } = useQuery(trackQueries.techStacks());
  const [selected, setSelected] = useState<Set<number>>(new Set(selectedIds));
  const [query, setQuery] = useState('');
  const [newName, setNewName] = useState('');
  const [newIconUrl, setNewIconUrl] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () => createTechStack({ name: newName, iconUrl: newIconUrl }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: trackKeys.techStacks() });
      setSelected((prev) => new Set(prev).add(created.id));
      setNewName('');
      setNewIconUrl('');
      setCreateError(null);
    },
    onError: (e) => setCreateError(e instanceof ApiError ? e.message : '등록에 실패했습니다.'),
  });

  const filtered = (master ?? []).filter((stack) => stack.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <Modal
      title="기술스택 선택"
      onClose={onClose}
      width="520px"
      footer={
        <>
          <Button onClick={onClose} className="ml-auto px-4 py-2.5">
            취소
          </Button>
          <Button variant="primary" onClick={() => onConfirm([...selected])} className="px-[18px] py-2.5">
            적용
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5 px-6 py-5">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="검색" className={INPUT_CLASS} />
        <ul className="m-0 flex max-h-56 list-none flex-col gap-1 overflow-y-auto p-0">
          {filtered.map((stack) => (
            <li key={stack.id}>
              <label className="hover:bg-panel2 flex cursor-pointer items-center gap-2.5 rounded-[10px] px-2 py-2 text-[13px] transition-colors">
                <input
                  type="checkbox"
                  checked={selected.has(stack.id)}
                  onChange={() =>
                    setSelected((prev) => {
                      const next = new Set(prev);
                      if (next.has(stack.id)) {
                        next.delete(stack.id);
                      } else {
                        next.add(stack.id);
                      }
                      return next;
                    })
                  }
                />
                {stack.iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={stack.iconUrl} alt="" className="h-4 w-4 rounded-[4px] object-cover" />
                ) : (
                  <span className="bg-line2 h-4 w-4 rounded-[4px]" />
                )}
                {stack.name}
              </label>
            </li>
          ))}
          {filtered.length === 0 && <li className="text-faint text-[11px]">일치하는 기술스택이 없습니다.</li>}
        </ul>

        <div className="border-line flex flex-col gap-2.5 rounded-[10px] border p-3">
          <p className="text-faint m-0 text-[11px]">목록에 없으면 새로 등록합니다.</p>
          <div className="flex gap-2">
            <Field label="이름" className="flex-1">
              <input value={newName} onChange={(e) => setNewName(e.target.value)} className={INPUT_CLASS} />
            </Field>
            <Field label="아이콘 URL" className="flex-1">
              <input value={newIconUrl} onChange={(e) => setNewIconUrl(e.target.value)} className={INPUT_CLASS} />
            </Field>
          </div>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!newName.trim() || !newIconUrl.trim() || createMutation.isPending}
            className="self-start"
          >
            등록
          </Button>
          {createError && <p className="text-danger m-0 text-[11px]">{createError}</p>}
        </div>
      </div>
    </Modal>
  );
}
