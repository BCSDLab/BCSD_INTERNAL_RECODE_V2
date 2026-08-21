'use client';

import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { putStudyPoints } from '@/api/track/api';
import type { StudyPointResponse, TrackPageDetailResponse } from '@/api/track/types';
import { ApiError } from '@/api/client';
import { Button } from '@/components/ui/button';
import { DragHandle } from '@/components/ui/field';
import { SectionCard } from '@/components/ui/section-card';
import { useDebouncedSave } from '@/hooks/useDebouncedSave';
import { useImageUpload } from '@/hooks/useImageUpload';

const MAX_STUDY_POINTS = 4;

interface Draft extends StudyPointResponse {
  key: number;
}

/**
 * 시안의 WHAT WE STUDY 섹션. 카드는 두 모양이다:
 * - 펼침: primary-line 테두리 + primary-sunken 배경, 52px 점선 아이콘 자리,
 *         밑줄만 있는 제목 입력(15px 500), 설명 textarea(13px, 높이 56), 오른쪽 아래 "삭제"
 * - 접힘: line 테두리, 38px 아이콘 사각형, 14px 제목, 오른쪽 "펼치기 ⌄"
 */
export function StudyPointsSection({ trackPageId, detail }: { trackPageId: number; detail: TrackPageDetailResponse }) {
  const [items, setItems] = useState<Draft[]>(() =>
    detail.studyPoints.map((point, index) => ({ ...point, key: index })),
  );
  const [nextKey, setNextKey] = useState(items.length);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (next: Draft[]) =>
      putStudyPoints(
        trackPageId,
        next.map(({ title, description, iconImageUrl }) => ({ title, description, iconImageUrl })),
      ),
    onError: (e) => setError(e instanceof ApiError ? e.message : '저장에 실패했습니다.'),
    onSuccess: () => setError(null),
  });
  const { save: debouncedSave } = useDebouncedSave<Draft[]>((next) => mutation.mutate(next));

  function persist(next: Draft[]) {
    setItems(next);
    mutation.mutate(next);
  }

  function updateItem(key: number, patch: Partial<StudyPointResponse>) {
    setItems((prev) => {
      const next = prev.map((item) => (item.key === key ? { ...item, ...patch } : item));
      debouncedSave(next);
      return next;
    });
  }

  function toggleExpanded(key: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function addItem() {
    if (items.length >= MAX_STUDY_POINTS) {
      return;
    }
    persist([...items, { key: nextKey, title: '', description: '', iconImageUrl: null }]);
    setExpanded((prev) => new Set(prev).add(nextKey));
    setNextKey((key) => key + 1);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const from = items.findIndex((item) => item.key === active.id);
    const to = items.findIndex((item) => item.key === over.id);
    if (from === -1 || to === -1) {
      return;
    }
    persist(arrayMove(items, from, to));
  }

  return (
    <SectionCard
      title="What we study"
      caption="랜딩에 카드로 노출"
      action={
        <Button onClick={addItem} disabled={items.length >= MAX_STUDY_POINTS}>
          + 항목
        </Button>
      }
    >
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((item) => item.key)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2.5">
            {items.map((item) => (
              <StudyPointCard
                key={item.key}
                item={item}
                isExpanded={expanded.has(item.key)}
                onToggle={() => toggleExpanded(item.key)}
                onChange={(patch) => updateItem(item.key, patch)}
                onRemove={() => persist(items.filter((other) => other.key !== item.key))}
              />
            ))}
            {items.length === 0 && <p className="text-faint m-0 text-[11px]">항목이 없습니다.</p>}
          </div>
        </SortableContext>
      </DndContext>
      {error && <p className="text-danger m-0 pt-2.5 text-[11px]">{error}</p>}
    </SectionCard>
  );
}

function StudyPointCard({
  item,
  isExpanded,
  onToggle,
  onChange,
  onRemove,
}: {
  item: Draft;
  isExpanded: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<StudyPointResponse>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.key });
  const { upload, isUploading } = useImageUpload('STUDY_ICON');
  const style = { transform: CSS.Transform.toString(transform), transition };

  async function handleIconUpload(file: File) {
    try {
      onChange({ iconImageUrl: await upload(file) });
    } catch {
      // useImageUpload가 이미 error 상태를 들고 있다.
    }
  }

  if (!isExpanded) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="border-line hover:border-line2 flex items-center gap-3.5 rounded-[14px] border px-4 py-3.5 transition-colors"
      >
        <DragHandle {...attributes} {...listeners} />
        {item.iconImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.iconImageUrl} alt="" className="h-[38px] w-[38px] flex-none rounded-[10px] object-cover" />
        ) : (
          <span className="border-line bg-panel2 h-[38px] w-[38px] flex-none rounded-[10px] border" />
        )}
        <div className="truncate text-sm">{item.title || '제목 없음'}</div>
        <button
          type="button"
          onClick={onToggle}
          className="text-faint hover:text-text ml-auto flex-none cursor-pointer text-xs whitespace-nowrap transition-colors"
        >
          펼치기 ⌄
        </button>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border-primary-line bg-primary-sunken flex gap-3.5 rounded-[14px] border p-4"
    >
      <DragHandle {...attributes} {...listeners} className="pt-[3px]" />

      <label className="border-primary-line text-primary-text flex h-[52px] w-[52px] flex-none cursor-pointer items-center justify-center rounded-xl border border-dashed text-center text-[10px] leading-[1.3]">
        {item.iconImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.iconImageUrl} alt="" className="h-full w-full rounded-xl object-cover" />
        ) : isUploading ? (
          '업로드…'
        ) : (
          <>
            아이콘
            <br />
            SVG
          </>
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleIconUpload(file);
            }
          }}
        />
      </label>

      <div className="flex min-w-0 flex-1 flex-col gap-[9px]">
        <input
          value={item.title}
          maxLength={60}
          placeholder="제목"
          onChange={(e) => onChange({ title: e.target.value })}
          className="border-primary-line text-text min-w-0 border-0 border-b bg-transparent pb-[7px] text-[15px] font-medium outline-none"
        />
        <textarea
          value={item.description}
          maxLength={200}
          placeholder="설명"
          onChange={(e) => onChange({ description: e.target.value })}
          className="border-line bg-panel text-muted h-14 min-w-0 resize-none rounded-[10px] border px-3 py-2.5 text-[13px] leading-[1.6] outline-none"
        />
        <div className="text-faint flex items-center gap-2 text-[11px]">
          <button
            type="button"
            onClick={onToggle}
            className="hover:text-text cursor-pointer whitespace-nowrap transition-colors"
          >
            접기 ⌃
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="text-danger ml-auto flex-none cursor-pointer whitespace-nowrap hover:underline"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}
