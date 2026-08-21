'use client';

import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { reorderActivities } from '@/api/activity/api';
import { activityKeys } from '@/api/activity/queries';
import type { ActivitySummaryResponse } from '@/api/activity/types';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { DragHandle } from '@/components/ui/field';

/**
 * 시안의 활동 목록: 연도 필터 알약 줄 + "+ 활동 추가"(primary 채우기), 그 아래
 * "연도(20px 600) — 선 — N건" 헤더로 묶인 카드 목록. 같은 달 안에서만 드래그된다.
 */
export function ActivityTimeline({
  categoryId,
  activities,
  onOpenActivity,
  onCreate,
}: {
  categoryId: number;
  activities: ActivitySummaryResponse[];
  onOpenActivity: (id: number) => void;
  onCreate: (year?: number) => void;
}) {
  const [yearFilter, setYearFilter] = useState<number | null>(null);

  const years = [...new Set(activities.map((activity) => activity.year))].sort((a, b) => b - a);
  const visibleYears = yearFilter === null ? years : years.filter((year) => year === yearFilter);

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex items-center gap-2">
        <div className="flex gap-1.5">
          <Chip size="sm" selected={yearFilter === null} onClick={() => setYearFilter(null)} className="cursor-pointer">
            전체 연도
          </Chip>
          {years.map((year) => (
            <Chip
              key={year}
              size="sm"
              selected={yearFilter === year}
              onClick={() => setYearFilter(year)}
              className="cursor-pointer"
            >
              {year}
            </Chip>
          ))}
        </div>
        <span className="text-faint ml-auto flex-none text-xs whitespace-nowrap">최신순</span>
        <Button variant="primary" onClick={() => onCreate()} className="flex-none">
          + 활동 추가
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {visibleYears.map((year) => (
          <YearGroup
            key={year}
            categoryId={categoryId}
            year={year}
            activities={activities.filter((activity) => activity.year === year)}
            onOpenActivity={onOpenActivity}
            onCreate={onCreate}
          />
        ))}
        {activities.length === 0 && <p className="text-faint m-0 text-[13px]">활동이 없습니다.</p>}
      </div>
    </div>
  );
}

function YearGroup({
  categoryId,
  year,
  activities,
  onOpenActivity,
  onCreate,
}: {
  categoryId: number;
  year: number;
  activities: ActivitySummaryResponse[];
  onOpenActivity: (id: number) => void;
  onCreate: (year: number) => void;
}) {
  const months = [...new Set(activities.map((activity) => activity.month))].sort((a, b) => b - a);

  return (
    <>
      <div className="flex items-center gap-3 pt-1.5">
        <span className="flex-none text-xl font-semibold tracking-[-.02em]">{year}</span>
        <span className="bg-line h-px flex-1" />
        <span className="text-faint flex-none text-[11px] whitespace-nowrap">{activities.length}건</span>
        <button
          type="button"
          onClick={() => onCreate(year)}
          className="border-dash text-muted hover:border-primary-line hover:text-primary-text flex-none cursor-pointer rounded-lg border border-dashed px-[11px] py-[5px] text-[11px] whitespace-nowrap transition-colors"
        >
          이 연도에 추가
        </button>
      </div>
      {months.map((month) => (
        <MonthGroup
          key={month}
          categoryId={categoryId}
          year={year}
          month={month}
          activities={activities
            .filter((activity) => activity.month === month)
            .sort((a, b) => a.displayOrder - b.displayOrder)}
          onOpenActivity={onOpenActivity}
        />
      ))}
    </>
  );
}

function MonthGroup({
  categoryId,
  year,
  month,
  activities,
  onOpenActivity,
}: {
  categoryId: number;
  year: number;
  month: number;
  activities: ActivitySummaryResponse[];
  onOpenActivity: (id: number) => void;
}) {
  const queryClient = useQueryClient();

  // 시안대로 같은 달 안에서만 순서를 바꾼다 — 달마다 DndContext를 따로 둬서
  // 다른 달로는 드래그가 넘어가지 않게 한다(백엔드도 달 단위로 재부여한다).
  const reorderMutation = useMutation({
    mutationFn: (ids: number[]) => reorderActivities(categoryId, year, month, ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: activityKeys.list(categoryId) }),
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const from = activities.findIndex((activity) => activity.id === active.id);
    const to = activities.findIndex((activity) => activity.id === over.id);
    if (from === -1 || to === -1) {
      return;
    }
    reorderMutation.mutate(arrayMove(activities, from, to).map((activity) => activity.id));
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={activities.map((activity) => activity.id)} strategy={verticalListSortingStrategy}>
        {activities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} onOpen={() => onOpenActivity(activity.id)} />
        ))}
      </SortableContext>
    </DndContext>
  );
}

function ActivityCard({ activity, onOpen }: { activity: ActivitySummaryResponse; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: activity.id });
  const yearMonth = `${activity.year}.${String(activity.month).padStart(2, '0')}`;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={onOpen}
      className={`flex cursor-pointer items-center gap-3.5 rounded-2xl border px-[18px] py-[15px] transition-colors ${
        activity.isPublished ? 'border-line bg-panel hover:border-line2' : 'border-line opacity-55'
      }`}
    >
      <DragHandle {...attributes} {...listeners} />
      <span className="border-line text-muted flex-none rounded-[7px] border px-[9px] py-1 text-xs whitespace-nowrap">
        {yearMonth}
      </span>
      <span className="flex-none text-sm whitespace-nowrap">{activity.title}</span>
      <span className="text-faint min-w-0 truncate text-xs">{activity.summary}</span>
      {activity.isPublished ? (
        <span className="text-faint ml-auto flex-none text-xs whitespace-nowrap">편집</span>
      ) : (
        <span className="border-dash ml-auto flex-none rounded-md border border-dashed px-2 py-[3px] text-[11px] whitespace-nowrap">
          숨김
        </span>
      )}
    </div>
  );
}
