'use client';

import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { createActivity, deleteActivity, publishActivity, putActivityImages, updateActivity } from '@/api/activity/api';
import { activityKeys, activityQueries } from '@/api/activity/queries';
import type { ActivityDetailResponse } from '@/api/activity/types';
import { ApiError } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Field, INPUT_CLASS_COMPACT } from '@/components/ui/field';
import { ConfirmModal, Modal } from '@/components/ui/modal';
import { Eyebrow } from '@/components/ui/section-card';
import { useImageUpload } from '@/hooks/useImageUpload';
import { RichTextEditor } from './RichTextEditor';

interface FormValues {
  yearMonth: string;
  title: string;
  summary: string;
  content: string;
  externalUrl: string;
  images: string[];
}

function toForm(detail: ActivityDetailResponse | null, defaultYear?: number): FormValues {
  return {
    yearMonth: detail
      ? `${detail.year}.${String(detail.month).padStart(2, '0')}`
      : defaultYear
        ? `${defaultYear}.`
        : '',
    title: detail?.title ?? '',
    summary: detail?.summary ?? '',
    content: detail?.content ?? '',
    externalUrl: detail?.externalUrl ?? '',
    images: detail?.imageUrls ?? [],
  };
}

function parseYearMonth(value: string): { year: number; month: number } | null {
  const match = value.trim().match(/^(\d{4})\.(\d{1,2})$/);
  if (!match) {
    return null;
  }
  const month = Number(match[2]);
  return month >= 1 && month <= 12 ? { year: Number(match[1]), month } : null;
}

/**
 * 시안의 활동 편집 모달(880px). 본문은 "minmax(0,1fr) 260px" 2단으로,
 * 왼쪽은 연월·제목·요약·본문 에디터, 오른쪽은 대표 사진 · 설정(공개 토글) · 활동 삭제다.
 * 바닥에 안내문 + 취소/저장. 본문은 자동저장하지 않고 이 저장 버튼으로만 반영된다.
 */
export function ActivityEditModal({
  categoryId,
  categoryName,
  activityId,
  defaultYear,
  onClose,
}: {
  categoryId: number;
  categoryName: string;
  activityId: number | null;
  defaultYear?: number;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const isNew = activityId === null;

  const { data: detail, isLoading } = useQuery({ ...activityQueries.detail(activityId), enabled: !isNew });

  const [form, setForm] = useState<FormValues>(() => toForm(null, defaultYear));
  const [initialized, setInitialized] = useState<number | null | 'new'>(isNew ? 'new' : null);
  if (!isNew && detail && initialized !== detail.id) {
    setInitialized(detail.id);
    setForm(toForm(detail));
  }

  const [error, setError] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const { upload, isUploading } = useImageUpload('ACTIVITY');

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: activityKeys.list(categoryId) });
    queryClient.invalidateQueries({ queryKey: activityKeys.total() });
    if (!isNew) {
      queryClient.invalidateQueries({ queryKey: activityKeys.detail(activityId) });
    }
  }

  const publishMutation = useMutation({
    mutationFn: (isPublished: boolean) => publishActivity(activityId as number, isPublished),
    onSuccess: invalidate,
    onError: (e) => setError(e instanceof ApiError ? e.message : '공개 설정에 실패했습니다.'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteActivity(activityId as number),
    onSuccess: () => {
      invalidate();
      onClose();
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : '삭제에 실패했습니다.'),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const parsed = parseYearMonth(form.yearMonth);
      if (!parsed) {
        throw new Error('연월은 YYYY.MM 형식으로 입력해 주세요.');
      }
      const body = {
        categoryId,
        year: parsed.year,
        month: parsed.month,
        title: form.title,
        summary: form.summary,
        content: form.content,
        externalUrl: form.externalUrl || null,
      };
      const id = isNew ? (await createActivity(body)).id : (await updateActivity(activityId as number, body)).id;
      await putActivityImages(id, form.images);
    },
    onSuccess: () => {
      invalidate();
      onClose();
    },
    onError: (e) =>
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : '저장에 실패했습니다.'),
  });

  async function addImage(file: File) {
    try {
      const url = await upload(file);
      setForm((prev) => ({ ...prev, images: [...prev.images, url] }));
    } catch {
      // useImageUpload가 이미 error 상태를 들고 있다.
    }
  }

  function handleImageDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const from = Number(active.id);
    const to = Number(over.id);
    setForm((prev) => ({ ...prev, images: arrayMove(prev.images, from, to) }));
  }

  if (!isNew && isLoading) {
    return (
      <Modal title="불러오는 중…" onClose={onClose} width="880px">
        <p className="text-faint m-0 px-6 py-5 text-[13px]">불러오는 중…</p>
      </Modal>
    );
  }

  return (
    <Modal
      eyebrow={`${categoryName} · 활동 ${isNew ? '추가' : '편집'}`}
      title={form.title || '새 활동'}
      onClose={onClose}
      width="880px"
      footer={
        <>
          <span className="text-faint text-[11px] whitespace-nowrap">저장하면 랜딩에 반영됩니다</span>
          <Button onClick={onClose} className="ml-auto px-4 py-2.5">
            취소
          </Button>
          <Button
            variant="primary"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="px-[18px] py-2.5"
          >
            저장
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-[minmax(0,1fr)_260px]">
        <div className="border-line flex min-w-0 flex-col gap-3.5 border-r px-6 py-5">
          <div className="flex gap-3">
            <Field label="연월" className="w-[130px] flex-none">
              <input
                value={form.yearMonth}
                onChange={(e) => setForm((prev) => ({ ...prev, yearMonth: e.target.value }))}
                placeholder="2025.03"
                className={INPUT_CLASS_COMPACT}
              />
            </Field>
            <Field label="제목" className="flex-1">
              <input
                value={form.title}
                maxLength={80}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                className={INPUT_CLASS_COMPACT}
              />
            </Field>
          </div>

          <Field label="요약" hint="목록에 제목과 함께 노출됩니다">
            <input
              value={form.summary}
              maxLength={200}
              onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
              className={INPUT_CLASS_COMPACT}
            />
          </Field>

          <RichTextEditor content={form.content} onChange={(html) => setForm((prev) => ({ ...prev, content: html }))} />

          <Field label="외부 링크">
            <input
              value={form.externalUrl}
              onChange={(e) => setForm((prev) => ({ ...prev, externalUrl: e.target.value }))}
              placeholder="https://…"
              className={INPUT_CLASS_COMPACT}
            />
          </Field>

          {error && <p className="text-danger m-0 text-[11px]">{error}</p>}
        </div>

        <div className="flex min-w-0 flex-col gap-[18px] p-5">
          <div className="flex flex-col gap-[9px]">
            <Eyebrow>대표 사진</Eyebrow>
            <DndContext collisionDetection={closestCenter} onDragEnd={handleImageDragEnd}>
              <SortableContext items={form.images.map((_, i) => String(i))} strategy={rectSortingStrategy}>
                {form.images.length > 0 && (
                  <ImageThumb
                    id="0"
                    url={form.images[0]}
                    isThumbnail
                    onRemove={() => setForm((prev) => ({ ...prev, images: prev.images.slice(1) }))}
                  />
                )}
                <div className="grid grid-cols-2 gap-[7px]">
                  {form.images.slice(1).map((url, index) => (
                    <ImageThumb
                      key={index + 1}
                      id={String(index + 1)}
                      url={url}
                      onRemove={() =>
                        setForm((prev) => ({
                          ...prev,
                          images: prev.images.filter((_, i) => i !== index + 1),
                        }))
                      }
                    />
                  ))}
                  <label className="border-dash text-faint hover:border-primary-line hover:text-primary-text flex h-[52px] cursor-pointer items-center justify-center rounded-[9px] border border-dashed text-[11px] whitespace-nowrap transition-colors">
                    {isUploading ? '업로드…' : '+ 드롭'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          addImage(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </SortableContext>
            </DndContext>
            <p className="text-faint m-0 text-[11px] leading-[1.6]">
              5MB 이하 png/jpg/jpeg/webp/svg만 올릴 수 있습니다. 첫 장이 목록 썸네일입니다.
            </p>
          </div>

          {!isNew && detail && (
            <div className="flex flex-col gap-[9px]">
              <Eyebrow>설정</Eyebrow>
              <button
                type="button"
                onClick={() => publishMutation.mutate(!detail.isPublished)}
                className={`flex cursor-pointer items-center gap-[9px] rounded-[9px] border px-[11px] py-[9px] ${
                  detail.isPublished ? 'border-primary-line bg-primary-soft' : 'border-line'
                }`}
              >
                <span
                  className={`text-xs whitespace-nowrap ${detail.isPublished ? 'text-primary-text' : 'text-muted'}`}
                >
                  랜딩에 공개
                </span>
                <span
                  className={`relative ml-auto h-[18px] w-8 flex-none rounded-full ${
                    detail.isPublished ? 'bg-primary' : 'bg-line2'
                  }`}
                >
                  <span
                    className={`bg-on-primary absolute top-0.5 h-3.5 w-3.5 rounded-full transition-all ${
                      detail.isPublished ? 'right-0.5' : 'bg-panel left-0.5'
                    }`}
                  />
                </span>
              </button>
            </div>
          )}

          {!isNew && (
            <Button variant="dangerOutline" onClick={() => setIsDeleteOpen(true)} className="mt-auto w-full">
              활동 삭제
            </Button>
          )}
        </div>
      </div>

      {isDeleteOpen && (
        <ConfirmModal
          title="활동 삭제"
          description={`"${form.title}" 활동을 삭제합니다.`}
          onCancel={() => setIsDeleteOpen(false)}
          onConfirm={() => deleteMutation.mutate()}
        />
      )}
    </Modal>
  );
}

function ImageThumb({
  id,
  url,
  isThumbnail = false,
  onRemove,
}: {
  id: string;
  url: string;
  isThumbnail?: boolean;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={`relative cursor-grab overflow-hidden rounded-[11px] border ${
        isThumbnail ? 'border-primary-line h-24' : 'border-line h-[52px] rounded-[9px]'
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="h-full w-full object-cover" />
      {isThumbnail && (
        <span className="bg-primary-soft text-primary-text absolute bottom-2 left-2 rounded px-1.5 py-0.5 text-[10px]">
          목록 썸네일
        </span>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-1 right-1 cursor-pointer rounded-full bg-[rgba(10,8,16,.6)] px-1 text-[11px] text-white"
      >
        ✕
      </button>
    </div>
  );
}
