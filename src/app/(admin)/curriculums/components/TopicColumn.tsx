'use client';

import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  createTopic,
  deleteTopic,
  deleteWeek,
  renameWeek,
  reorderTopics,
  updateTopicDetails,
  updateTopicTitle,
} from '@/api/curriculum/api';
import { curriculumKeys } from '@/api/curriculum/queries';
import type { CurriculumTopicNode, CurriculumWeekNode } from '@/api/curriculum/types';
import { ApiError } from '@/api/client';
import { Button } from '@/components/ui/button';
import { DragHandle } from '@/components/ui/field';
import { ConfirmModal } from '@/components/ui/modal';
import { PolicyCard } from '@/components/ui/section-card';
import { useDebouncedSave } from '@/hooks/useDebouncedSave';
import { formatWeekLabel, parseWeekLabel } from './week-label';

/**
 * 시안의 오른쪽 열: "주차 라벨" 입력 + 개수 + 모두 접기 / 주차 삭제 / + 토픽(primary) 툴바,
 * 그 아래 토픽 목록(접힘 13px 카드 / 펼침 primary-sunken 카드), 마지막에 정책 카드.
 */
export function TopicColumn({
  curriculumId,
  week,
  onWeekDeleted,
}: {
  curriculumId: number;
  week: CurriculumWeekNode | null;
  onWeekDeleted: () => void;
}) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<CurriculumTopicNode | null>(null);
  const [isDeleteWeekOpen, setIsDeleteWeekOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [labelDraft, setLabelDraft] = useState('');
  const [labelWeekId, setLabelWeekId] = useState<number | null>(null);

  if (week && labelWeekId !== week.id) {
    setLabelWeekId(week.id);
    setLabelDraft(formatWeekLabel(week));
  }

  function invalidate() {
    setError(null);
    queryClient.invalidateQueries({ queryKey: curriculumKeys.tree(curriculumId) });
  }
  function handleError(e: unknown) {
    setError(e instanceof ApiError ? e.message : '요청에 실패했습니다.');
  }

  const renameWeekMutation = useMutation({
    mutationFn: (range: { weekFrom: number; weekTo: number | null }) => renameWeek(week!.id, range),
    onSuccess: invalidate,
    onError: handleError,
  });
  const { save: saveLabel } = useDebouncedSave<string>((raw) => {
    const range = parseWeekLabel(raw);
    if (!range) {
      setError('주차 라벨은 숫자 또는 범위(14~17) 형식이어야 합니다.');
      return;
    }
    renameWeekMutation.mutate(range);
  });

  const deleteWeekMutation = useMutation({
    mutationFn: () => deleteWeek(week!.id),
    onSuccess: () => {
      setIsDeleteWeekOpen(false);
      invalidate();
      onWeekDeleted();
    },
    onError: handleError,
  });

  const createTopicMutation = useMutation({
    mutationFn: () => createTopic(week!.id),
    onSuccess: invalidate,
    onError: handleError,
  });

  const deleteTopicMutation = useMutation({
    mutationFn: (topicId: number) => deleteTopic(topicId),
    onSuccess: () => {
      setDeleteTarget(null);
      invalidate();
    },
    onError: handleError,
  });

  const reorderMutation = useMutation({
    mutationFn: (ids: number[]) => reorderTopics(week!.id, ids),
    onSuccess: invalidate,
    onError: handleError,
  });

  if (!week) {
    return (
      <div className="flex min-w-0 flex-col gap-4 px-8 pt-6 pb-10">
        <p className="text-faint m-0 text-[13px]">왼쪽에서 트랙 · 세트 · 주차를 선택하세요.</p>
      </div>
    );
  }

  const detailCount = week.topics.reduce((sum, topic) => sum + topic.details.length, 0);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const from = week!.topics.findIndex((topic) => topic.id === active.id);
    const to = week!.topics.findIndex((topic) => topic.id === over.id);
    if (from === -1 || to === -1) {
      return;
    }
    reorderMutation.mutate(arrayMove(week!.topics, from, to).map((topic) => topic.id));
  }

  function handleDeleteTopic(topic: CurriculumTopicNode) {
    if (topic.details.length === 0) {
      deleteTopicMutation.mutate(topic.id);
      return;
    }
    setDeleteTarget(topic);
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 px-8 pt-6 pb-10">
      <div className="flex flex-wrap items-center gap-3">
        <div className="border-line bg-panel2 flex flex-none items-center gap-[9px] rounded-[10px] border px-[13px] py-[9px]">
          <span className="text-faint text-[11px] whitespace-nowrap">주차 라벨</span>
          <input
            value={labelDraft}
            onChange={(e) => {
              setLabelDraft(e.target.value);
              saveLabel(e.target.value);
            }}
            className="text-text w-[70px] border-none bg-transparent text-sm outline-none"
          />
        </div>
        <span className="text-faint text-xs">
          토픽 {week.topics.length}개 · 세부항목 {detailCount}개
        </span>
        <Button className="ml-auto" onClick={() => setExpanded(new Set())}>
          모두 접기
        </Button>
        <Button variant="danger" onClick={() => setIsDeleteWeekOpen(true)}>
          주차 삭제
        </Button>
        <Button variant="primary" onClick={() => createTopicMutation.mutate()}>
          + 토픽
        </Button>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={week.topics.map((topic) => topic.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2.5">
            {week.topics.map((topic, index) => (
              <TopicCard
                key={topic.id}
                topic={topic}
                index={index}
                isExpanded={expanded.has(topic.id)}
                onToggle={() =>
                  setExpanded((prev) => {
                    const next = new Set(prev);
                    if (next.has(topic.id)) {
                      next.delete(topic.id);
                    } else {
                      next.add(topic.id);
                    }
                    return next;
                  })
                }
                onDelete={() => handleDeleteTopic(topic)}
                onSaved={invalidate}
              />
            ))}
            <Button
              variant="dashed"
              onClick={() => createTopicMutation.mutate()}
              className="rounded-[13px] p-[13px] text-[13px]"
            >
              + 토픽 추가
            </Button>
          </div>
        </SortableContext>
      </DndContext>

      {error && <p className="text-danger m-0 text-[11px]">{error}</p>}

      <PolicyCard className="mt-1.5">
        토픽 번호는 저장 시 자동 재부여됩니다 · 토픽과 세부항목은 텍스트만 지원합니다 (링크·첨부 없음) · 주차를 삭제하면
        하위 토픽·세부항목도 함께 삭제됩니다.
      </PolicyCard>

      {isDeleteWeekOpen && (
        <ConfirmModal
          title="주차 삭제"
          description={`${formatWeekLabel(week)}를 삭제하면 하위 토픽 ${week.topics.length}개, 세부항목 ${detailCount}개가 함께 삭제됩니다.`}
          onCancel={() => setIsDeleteWeekOpen(false)}
          onConfirm={() => deleteWeekMutation.mutate()}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="토픽 삭제"
          description={`"${deleteTarget.title}"을 삭제하면 세부항목 ${deleteTarget.details.length}개가 함께 삭제됩니다.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteTopicMutation.mutate(deleteTarget.id)}
        />
      )}
    </div>
  );
}

function TopicCard({
  topic,
  index,
  isExpanded,
  onToggle,
  onDelete,
  onSaved,
}: {
  topic: CurriculumTopicNode;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onSaved: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: topic.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const [title, setTitle] = useState(topic.title);
  const [details, setDetails] = useState(topic.details);
  const [draft, setDraft] = useState('');

  const titleMutation = useMutation({
    mutationFn: (next: string) => updateTopicTitle(topic.id, next),
    onSuccess: onSaved,
  });
  const { save: saveTitle } = useDebouncedSave<string>((next) => titleMutation.mutate(next));

  const detailsMutation = useMutation({
    mutationFn: (contents: string[]) => updateTopicDetails(topic.id, contents),
    onSuccess: onSaved,
  });

  function persistDetails(next: string[]) {
    setDetails(next);
    detailsMutation.mutate(next);
  }

  if (!isExpanded) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="border-line bg-panel hover:border-line2 flex items-center gap-3 rounded-[13px] border px-4 py-[13px] transition-colors"
      >
        <DragHandle {...attributes} {...listeners} className="text-xs" />
        <span className="border-line2 text-muted flex h-[22px] w-[22px] flex-none items-center justify-center rounded-md border text-[11px]">
          {index + 1}
        </span>
        <span className="flex-none text-sm whitespace-nowrap">{topic.title || '제목 없음'}</span>
        <span className="text-faint min-w-0 truncate text-[11px]">{details.join(' · ')}</span>
        <button
          type="button"
          onClick={onToggle}
          className="text-faint hover:text-text ml-auto flex-none cursor-pointer text-xs transition-colors"
        >
          ⌄
        </button>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border-primary-line bg-primary-sunken flex flex-col gap-3 rounded-[14px] border p-4"
    >
      <div className="flex items-center gap-3">
        <DragHandle {...attributes} {...listeners} className="text-xs" />
        <span className="border-primary-line text-primary-text flex h-[22px] w-[22px] flex-none items-center justify-center rounded-md border text-[11px]">
          {index + 1}
        </span>
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            saveTitle(e.target.value);
          }}
          className="border-primary-line text-text min-w-0 flex-1 border-0 border-b bg-transparent pb-1.5 text-[15px] font-medium outline-none"
        />
        <button
          type="button"
          onClick={onToggle}
          className="text-faint hover:text-text flex-none cursor-pointer text-xs transition-colors"
        >
          ⌃
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="text-danger flex-none cursor-pointer text-xs whitespace-nowrap hover:underline"
        >
          삭제
        </button>
      </div>

      <div className="text-faint flex items-center gap-2 text-[11px] whitespace-nowrap">
        세부 항목<span className="opacity-80">랜딩에서 한 단계 들여쓰기로 렌더</span>
      </div>

      <div className="flex flex-col gap-1.5">
        {details.map((detail, detailIndex) => (
          <div
            key={detailIndex}
            className="border-line bg-panel flex items-center gap-2.5 rounded-[10px] border px-3 py-[9px] text-[13px]"
          >
            <span className="text-faint flex-none cursor-grab text-[11px]">⠿</span>
            <input
              value={detail}
              onChange={(e) => {
                const next = [...details];
                next[detailIndex] = e.target.value;
                setDetails(next);
                detailsMutation.mutate(next);
              }}
              className="text-text min-w-0 flex-1 border-none bg-transparent text-[13px] outline-none"
            />
            <button
              type="button"
              onClick={() => persistDetails(details.filter((_, i) => i !== detailIndex))}
              className="text-faint hover:text-danger flex-none cursor-pointer"
            >
              ✕
            </button>
          </div>
        ))}

        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && draft.trim()) {
              e.preventDefault();
              persistDetails([...details, draft.trim()]);
              setDraft('');
            }
          }}
          placeholder="+ 세부 항목 · Enter로 연속 입력"
          className="border-primary-line text-primary-text placeholder:text-primary-text rounded-[10px] border border-dashed bg-transparent px-3 py-[9px] text-[13px] outline-none"
        />
      </div>
    </div>
  );
}
