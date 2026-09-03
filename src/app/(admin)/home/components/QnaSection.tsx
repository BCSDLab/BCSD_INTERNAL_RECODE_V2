'use client';

import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { createQnaItem, deleteQnaItem, publishQnaItem, reorderQnaItems, updateQnaItem } from '@/api/home/api';
import { homeKeys, homeQueries } from '@/api/home/queries';
import type { AdminQnaResponse } from '@/api/home/types';
import { ApiError } from '@/api/client';
import { Button } from '@/components/ui/button';
import { INPUT_CLASS_COMPACT } from '@/components/ui/field';
import { SectionCard } from '@/components/ui/section-card';

/** 텍스트만 지원한다(링크·첨부 없음, FR-8.2) — 그래서 본문은 RichTextEditor가 아니라
 * 여러 줄 textarea다. */
export function QnaSection() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: items } = useQuery(homeQueries.qnaItems());
  const shown = items ?? [];

  function invalidate() {
    setError(null);
    queryClient.invalidateQueries({ queryKey: homeKeys.qnaItems() });
  }
  function handleError(e: unknown) {
    setError(e instanceof ApiError ? e.message : '요청에 실패했습니다.');
  }

  const publishMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: number; isPublished: boolean }) => publishQnaItem(id, isPublished),
    onSuccess: invalidate,
    onError: handleError,
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteQnaItem(id),
    onSuccess: invalidate,
    onError: handleError,
  });
  const reorderMutation = useMutation({
    mutationFn: (ids: number[]) => reorderQnaItems(ids),
    onSuccess: invalidate,
    onError: handleError,
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const from = shown.findIndex((item) => item.id === active.id);
    const to = shown.findIndex((item) => item.id === over.id);
    if (from === -1 || to === -1) {
      return;
    }
    reorderMutation.mutate(arrayMove(shown, from, to).map((item) => item.id));
  }

  return (
    <SectionCard
      title="Q&A"
      caption="메인 하단 아코디언 · 드래그로 순서"
      action={
        <Button variant="primary" onClick={() => setIsAdding(true)}>
          + 질문 추가
        </Button>
      }
    >
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={shown.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-1.5">
            {shown.map((item) =>
              editingId === item.id ? (
                <QnaForm
                  key={item.id}
                  initial={item}
                  onCancel={() => setEditingId(null)}
                  onSubmit={(values) =>
                    updateQnaItem(item.id, values)
                      .then(invalidate)
                      .catch(handleError)
                      .finally(() => setEditingId(null))
                  }
                />
              ) : (
                <QnaRow
                  key={item.id}
                  item={item}
                  onEdit={() => setEditingId(item.id)}
                  onDelete={() => deleteMutation.mutate(item.id)}
                  onTogglePublish={() => publishMutation.mutate({ id: item.id, isPublished: !item.isPublished })}
                />
              ),
            )}
          </div>
        </SortableContext>
      </DndContext>

      {isAdding && (
        <div className="pt-1.5">
          <QnaForm
            onCancel={() => setIsAdding(false)}
            onSubmit={(values) =>
              createQnaItem(values)
                .then(invalidate)
                .catch(handleError)
                .finally(() => setIsAdding(false))
            }
          />
        </div>
      )}

      {shown.length === 0 && !isAdding && <p className="text-faint m-0 text-[13px]">등록된 질문이 없습니다.</p>}
      {error && <p className="text-danger m-0 pt-2.5 text-[11px]">{error}</p>}
    </SectionCard>
  );
}

function QnaRow({
  item,
  onEdit,
  onDelete,
  onTogglePublish,
}: {
  item: AdminQnaResponse;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublish: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`border-line rounded-[11px] border px-3.5 py-3 transition-colors ${item.isPublished ? 'bg-panel2' : 'opacity-55'}`}
    >
      <div className="flex items-center gap-2.5">
        <span {...attributes} {...listeners} className="text-faint flex-none cursor-grab text-[13px] select-none">
          ⠿
        </span>
        <button
          type="button"
          onClick={() => setIsExpanded((v) => !v)}
          className="min-w-0 flex-1 cursor-pointer truncate text-left text-[13px]"
        >
          {item.question}
        </button>
        <span className="text-faint flex-none text-xs">{isExpanded ? '⌃' : '⌄'}</span>
        <button type="button" onClick={onEdit} className="text-muted hover:text-text flex-none cursor-pointer text-xs">
          편집
        </button>
        <button
          type="button"
          onClick={onTogglePublish}
          className="text-muted hover:text-text flex-none cursor-pointer text-xs"
        >
          {item.isPublished ? '숨김' : '공개'}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="text-faint hover:text-danger flex-none cursor-pointer text-xs"
        >
          ✕
        </button>
      </div>
      {isExpanded && (
        <p className="text-muted m-0 pt-2.5 pl-[23px] text-[13px] leading-[1.7] whitespace-pre-line">{item.answer}</p>
      )}
    </div>
  );
}

function QnaForm({
  initial,
  onCancel,
  onSubmit,
}: {
  initial?: AdminQnaResponse;
  onCancel: () => void;
  onSubmit: (values: { question: string; answer: string }) => void;
}) {
  const [question, setQuestion] = useState(initial?.question ?? '');
  const [answer, setAnswer] = useState(initial?.answer ?? '');

  return (
    <div className="border-primary-line bg-primary-sunken flex flex-col gap-2.5 rounded-[11px] border px-3.5 py-3">
      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="질문"
        maxLength={200}
        className={INPUT_CLASS_COMPACT}
      />
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="답변 (텍스트만 지원 · 링크·첨부 없음)"
        rows={3}
        className={`${INPUT_CLASS_COMPACT} resize-none`}
      />
      <div className="flex justify-end gap-2">
        <Button onClick={onCancel} className="px-3.5 py-2">
          취소
        </Button>
        <Button
          variant="primary"
          onClick={() =>
            question.trim() && answer.trim() && onSubmit({ question: question.trim(), answer: answer.trim() })
          }
          className="px-3.5 py-2"
        >
          저장
        </Button>
      </div>
    </div>
  );
}
