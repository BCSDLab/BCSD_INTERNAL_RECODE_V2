'use client';

import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { addWeek, createCurriculum, deleteCurriculum, publishCurriculum, reorderWeeks } from '@/api/curriculum/api';
import { curriculumKeys } from '@/api/curriculum/keys';
import type { CurriculumSummaryResponse, CurriculumTreeResponse, CurriculumWeekNode } from '@/api/curriculum/types';
import type { TrackPageSummaryResponse } from '@/api/track/types';
import { ApiError } from '@/api/client';
import { Button } from '@/components/ui/button';
import { DragHandle, Field, INPUT_CLASS } from '@/components/ui/field';
import { ConfirmModal, Modal } from '@/components/ui/modal';
import { Eyebrow } from '@/components/ui/section-card';
import { formatWeekLabel, parseWeekLabel } from './week-label';

/**
 * 시안의 왼쪽 레일(280px): 트랙 선택 → 주차 목록 → "+ 주차 추가" → 안내 문구.
 *
 * 시안에는 없지만 세트 선택을 추가했다 — 데이터 모델이 트랙 > 커리큘럼 세트 > 주차라서
 * 세트를 고르지 않으면 주차에 도달할 수 없다(시안 헤더의 "Frontend · 비기너"가 그 자리다).
 * 세트 수준 동작(공개 지정·복제 추가·삭제)도 여기 모았다.
 */
export function CurriculumRail({
  trackPages,
  trackPageId,
  onSelectTrackPage,
  curriculums,
  curriculumId,
  onSelectCurriculum,
  tree,
  selectedWeekId,
  onSelectWeek,
}: {
  trackPages: TrackPageSummaryResponse[];
  trackPageId: number | '';
  onSelectTrackPage: (id: number | '') => void;
  curriculums: CurriculumSummaryResponse[];
  curriculumId: number | '';
  onSelectCurriculum: (id: number | '') => void;
  tree: CurriculumTreeResponse | undefined;
  selectedWeekId: number | null;
  onSelectWeek: (id: number | null) => void;
}) {
  const queryClient = useQueryClient();
  const [isAddWeekOpen, setIsAddWeekOpen] = useState(false);
  const [isAddSetOpen, setIsAddSetOpen] = useState(false);
  const [isDeleteSetOpen, setIsDeleteSetOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weeks = tree?.weeks ?? [];
  const selectedCurriculum = curriculums.find((set) => set.id === curriculumId);

  function invalidateTree() {
    setError(null);
    queryClient.invalidateQueries({ queryKey: curriculumKeys.tree(curriculumId) });
  }
  function invalidateSets() {
    queryClient.invalidateQueries({ queryKey: curriculumKeys.list(trackPageId) });
  }

  const reorderMutation = useMutation({
    mutationFn: (ids: number[]) => reorderWeeks(curriculumId as number, ids),
    onSuccess: invalidateTree,
    onError: (e) => setError(e instanceof ApiError ? e.message : '순서 변경에 실패했습니다.'),
  });

  const publishMutation = useMutation({
    mutationFn: (isPublished: boolean) => publishCurriculum(curriculumId as number, isPublished),
    onSuccess: () => {
      invalidateSets();
      invalidateTree();
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : '공개 설정에 실패했습니다.'),
  });

  const deleteSetMutation = useMutation({
    mutationFn: () => deleteCurriculum(curriculumId as number),
    onSuccess: () => {
      setIsDeleteSetOpen(false);
      onSelectCurriculum('');
      invalidateSets();
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : '삭제에 실패했습니다.'),
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const from = weeks.findIndex((week) => week.id === active.id);
    const to = weeks.findIndex((week) => week.id === over.id);
    if (from === -1 || to === -1) {
      return;
    }
    reorderMutation.mutate(arrayMove(weeks, from, to).map((week) => week.id));
  }

  return (
    <div className="border-line flex min-w-0 flex-col gap-4 border-r px-5 pt-[22px] pb-8">
      <Field label={<Eyebrow>트랙</Eyebrow>}>
        <select
          value={trackPageId}
          onChange={(e) => onSelectTrackPage(e.target.value ? Number(e.target.value) : '')}
          className={INPUT_CLASS}
        >
          <option value="">선택하세요</option>
          {trackPages.map((trackPage) => (
            <option key={trackPage.id} value={trackPage.id}>
              {trackPage.displayName}
            </option>
          ))}
        </select>
      </Field>

      {trackPageId !== '' && (
        <div className="flex flex-col gap-2">
          <Field label={<Eyebrow>세트</Eyebrow>}>
            <select
              value={curriculumId}
              onChange={(e) => onSelectCurriculum(e.target.value ? Number(e.target.value) : '')}
              className={INPUT_CLASS}
            >
              <option value="">선택하세요</option>
              {curriculums.map((set) => (
                <option key={set.id} value={set.id}>
                  {set.name}
                  {set.isPublished ? ' · 공개' : ''}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button variant="dashed" onClick={() => setIsAddSetOpen(true)} className="flex-1">
              + 세트 추가
            </Button>
            {selectedCurriculum && !selectedCurriculum.isPublished && (
              <Button onClick={() => publishMutation.mutate(true)}>공개로 지정</Button>
            )}
            {selectedCurriculum && (
              <Button variant="danger" onClick={() => setIsDeleteSetOpen(true)}>
                세트 삭제
              </Button>
            )}
          </div>
        </div>
      )}

      {curriculumId !== '' && (
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="flex items-center gap-2 pb-0.5">
            <Eyebrow>주차</Eyebrow>
            <span className="text-faint ml-auto flex-none text-[11px] whitespace-nowrap">드래그로 순서</span>
          </div>

          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={weeks.map((week) => week.id)} strategy={verticalListSortingStrategy}>
              {weeks.map((week) => (
                <WeekRow
                  key={week.id}
                  week={week}
                  isSelected={week.id === selectedWeekId}
                  onSelect={() => onSelectWeek(week.id)}
                />
              ))}
            </SortableContext>
          </DndContext>

          <Button variant="dashed" onClick={() => setIsAddWeekOpen(true)}>
            + 주차 추가
          </Button>

          {error && <p className="text-danger m-0 pt-1 text-[11px]">{error}</p>}

          <p className="text-faint m-0 pt-2.5 text-[11px] leading-[1.7]">
            라벨은 숫자 또는 범위(14~17) 입력. 주차를 삭제하면 하위 토픽·세부항목도 함께 삭제됩니다. 빈 주차는 랜딩에
            렌더되지 않습니다.
          </p>
        </div>
      )}

      {isAddWeekOpen && curriculumId !== '' && (
        <AddWeekModal
          curriculumId={curriculumId}
          onClose={() => setIsAddWeekOpen(false)}
          onCreated={(weekId) => {
            setIsAddWeekOpen(false);
            invalidateTree();
            onSelectWeek(weekId);
          }}
        />
      )}

      {isAddSetOpen && trackPageId !== '' && (
        <AddSetModal
          trackPageId={trackPageId}
          existing={curriculums}
          onClose={() => setIsAddSetOpen(false)}
          onCreated={(id) => {
            setIsAddSetOpen(false);
            invalidateSets();
            onSelectCurriculum(id);
          }}
        />
      )}

      {isDeleteSetOpen && selectedCurriculum && (
        <ConfirmModal
          title="세트 삭제"
          description={`"${selectedCurriculum.name}" 세트를 삭제합니다. 하위 주차·토픽·세부항목이 모두 삭제됩니다.`}
          onCancel={() => setIsDeleteSetOpen(false)}
          onConfirm={() => deleteSetMutation.mutate()}
        />
      )}
    </div>
  );
}

function WeekRow({
  week,
  isSelected,
  onSelect,
}: {
  week: CurriculumWeekNode;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: week.id });
  const isRange = week.weekTo !== null && week.weekTo !== week.weekFrom;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-[9px] rounded-[10px] px-[11px] py-[9px] text-[13px] transition-colors ${
        isSelected
          ? 'border-primary-line bg-primary-soft text-primary-text border font-medium'
          : 'border-line text-muted hover:border-line2 hover:text-text border'
      }`}
    >
      <DragHandle {...attributes} {...listeners} className={`text-xs ${isSelected ? 'opacity-70' : ''}`} />
      <button type="button" onClick={onSelect} className="flex-1 cursor-pointer text-left whitespace-nowrap">
        {formatWeekLabel(week)}
      </button>
      <span
        className={`ml-auto flex-none text-[11px] whitespace-nowrap ${
          isSelected ? 'opacity-80' : isRange ? 'text-primary-text' : 'text-faint'
        }`}
      >
        {isRange ? '범위' : `토픽 ${week.topics.length}`}
      </span>
    </div>
  );
}

function AddWeekModal({
  curriculumId,
  onClose,
  onCreated,
}: {
  curriculumId: number;
  onClose: () => void;
  onCreated: (weekId: number) => void;
}) {
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (range: { weekFrom: number; weekTo: number | null }) => addWeek(curriculumId, range),
    onSuccess: (created) => onCreated(created.id),
    onError: (e) => setError(e instanceof ApiError ? e.message : '생성에 실패했습니다.'),
  });

  function submit() {
    const range = parseWeekLabel(label);
    if (!range) {
      setError('숫자 또는 범위(14~17) 형식으로 입력해 주세요.');
      return;
    }
    setError(null);
    mutation.mutate(range);
  }

  return (
    <Modal
      title="주차 추가"
      onClose={onClose}
      width="400px"
      footer={
        <>
          <Button onClick={onClose} className="ml-auto px-4 py-2.5">
            취소
          </Button>
          <Button variant="primary" onClick={submit} disabled={mutation.isPending} className="px-[18px] py-2.5">
            추가
          </Button>
        </>
      }
    >
      <div className="px-6 py-5">
        <Field label="주차 라벨" hint="숫자(4) 또는 범위(14~17)">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="4 또는 14~17"
            className={INPUT_CLASS}
          />
        </Field>
        {error && <p className="text-danger m-0 pt-2 text-[11px]">{error}</p>}
      </div>
    </Modal>
  );
}

function AddSetModal({
  trackPageId,
  existing,
  onClose,
  onCreated,
}: {
  trackPageId: number;
  existing: CurriculumSummaryResponse[];
  onClose: () => void;
  onCreated: (id: number) => void;
}) {
  const [name, setName] = useState('');
  const [sourceId, setSourceId] = useState<number | ''>('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      createCurriculum(trackPageId, {
        name: name.trim() || null,
        sourceCurriculumId: sourceId === '' ? null : sourceId,
      }),
    onSuccess: (created) => onCreated(created.id),
    onError: (e) => setError(e instanceof ApiError ? e.message : '생성에 실패했습니다.'),
  });

  const isClone = sourceId !== '';

  return (
    <Modal
      title="세트 추가"
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
              if (!isClone && !name.trim()) {
                setError('이름을 입력해 주세요.');
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
        <Field label="다른 세트 복제 (선택)">
          <select
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value ? Number(e.target.value) : '')}
            className={INPUT_CLASS}
          >
            <option value="">복제하지 않음</option>
            {existing.map((set) => (
              <option key={set.id} value={set.id}>
                {set.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="이름" hint={isClone ? '비워두면 원본 이름을 씁니다.' : undefined}>
          <input value={name} onChange={(e) => setName(e.target.value)} className={INPUT_CLASS} />
        </Field>
        {error && <p className="text-danger m-0 text-[11px]">{error}</p>}
      </div>
    </Modal>
  );
}
