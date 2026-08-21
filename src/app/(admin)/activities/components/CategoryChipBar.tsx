'use client';

import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { createActivityCategory, deleteActivityCategory, reorderActivityCategories } from '@/api/activity/api';
import { activityKeys } from '@/api/activity/keys';
import type { ActivityCategoryResponse } from '@/api/activity/types';
import { ApiError } from '@/api/client';
import { Button } from '@/components/ui/button';
import { ChipCount, DashedChip } from '@/components/ui/chip';
import { Field, INPUT_CLASS } from '@/components/ui/field';
import { ConfirmModal, Modal } from '@/components/ui/modal';
import { useSortableList } from '@/hooks/useSortableList';

const EMPTY: ActivityCategoryResponse[] = [];

/**
 * 시안의 카테고리 탭 줄: padding 20·32·12 + border-bottom, 알약 padding 8·16 자간 .04em.
 * 선택된 카테고리만 primary-soft 배경 + primary-line 테두리 + primary-text 500이다.
 */
export function CategoryChipBar({
  categories,
  selectedId,
  counts,
  onSelect,
}: {
  categories: ActivityCategoryResponse[];
  selectedId: number | null;
  counts: Record<number, number | undefined>;
  onSelect: (id: number) => void;
}) {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ActivityCategoryResponse | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const reorderMutation = useMutation({
    mutationFn: reorderActivityCategories,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: activityKeys.categories() }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteActivityCategory,
    onSuccess: () => {
      setDeleteTarget(null);
      setDeleteError(null);
      queryClient.invalidateQueries({ queryKey: activityKeys.categories() });
    },
    onError: (e) => setDeleteError(e instanceof ApiError ? e.message : '삭제에 실패했습니다.'),
  });

  const { items, sensors, handleDragEnd } = useSortableList(categories.length > 0 ? categories : EMPTY, (ids) =>
    reorderMutation.mutateAsync(ids),
  );

  const selected = categories.find((category) => category.id === selectedId);

  return (
    <div className="border-line border-b px-8 pt-5 pb-3">
      <div className="flex w-full items-center gap-2">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((item) => item.id)} strategy={horizontalListSortingStrategy}>
            <div className="flex flex-wrap gap-[7px]">
              {items.map((item) => (
                <CategoryChip
                  key={item.id}
                  category={item}
                  count={counts[item.id]}
                  isSelected={item.id === selectedId}
                  onSelect={() => onSelect(item.id)}
                />
              ))}
              <DashedChip onClick={() => setIsAddOpen(true)}>+ 카테고리</DashedChip>
            </div>
          </SortableContext>
        </DndContext>
        {selected && (
          <Button
            variant="danger"
            onClick={() => {
              setDeleteError(null);
              setDeleteTarget(selected);
            }}
            className="ml-auto flex-none"
          >
            카테고리 삭제
          </Button>
        )}
      </div>

      {isAddOpen && (
        <AddCategoryModal
          onClose={() => setIsAddOpen(false)}
          onCreated={(id) => {
            setIsAddOpen(false);
            queryClient.invalidateQueries({ queryKey: activityKeys.categories() });
            onSelect(id);
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="카테고리 삭제"
          description={
            deleteError ?? `"${deleteTarget.name}" 카테고리를 삭제합니다. 활동이 남아 있으면 삭제할 수 없습니다.`
          }
          onCancel={() => {
            setDeleteTarget(null);
            setDeleteError(null);
          }}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        />
      )}
    </div>
  );
}

function CategoryChip({
  category,
  count,
  isSelected,
  onSelect,
}: {
  category: ActivityCategoryResponse;
  count: number | undefined;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: category.id });
  return (
    <span
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={onSelect}
      {...attributes}
      {...listeners}
      className={`inline-flex flex-none cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-[13px] tracking-[.04em] whitespace-nowrap transition-colors ${
        isSelected
          ? 'border-primary-line bg-primary-soft text-primary-text border font-medium'
          : 'border-line text-muted hover:border-line2 hover:text-text border'
      }`}
    >
      {category.name}
      {count !== undefined && <ChipCount>{count}</ChipCount>}
      {!category.isPublished && <ChipCount>숨김</ChipCount>}
    </span>
  );
}

function AddCategoryModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: number) => void }) {
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => createActivityCategory({ slug, name }),
    onSuccess: (created) => onCreated(created.id),
    onError: (e) => setError(e instanceof ApiError ? e.message : '생성에 실패했습니다.'),
  });

  return (
    <Modal
      title="카테고리 추가"
      onClose={onClose}
      width="440px"
      footer={
        <>
          <Button onClick={onClose} className="ml-auto px-4 py-2.5">
            취소
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (!slug.trim() || !name.trim()) {
                setError('주소와 이름을 입력해 주세요.');
                return;
              }
              setError(null);
              mutation.mutate();
            }}
            disabled={mutation.isPending}
            className="px-[18px] py-2.5"
          >
            만들기
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5 px-6 py-5">
        <Field label="주소(slug)" hint="랜딩 경로가 됩니다 · bcsdlab.com/activity/{slug}">
          <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="event" className={INPUT_CLASS} />
        </Field>
        <Field label="이름">
          <input value={name} onChange={(e) => setName(e.target.value)} className={INPUT_CLASS} />
        </Field>
        {error && <p className="text-danger m-0 text-[11px]">{error}</p>}
      </div>
    </Modal>
  );
}
