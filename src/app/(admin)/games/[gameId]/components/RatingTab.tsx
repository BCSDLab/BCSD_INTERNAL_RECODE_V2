'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { deleteGameRating, upsertGameRating } from '@/api/game/api';
import { gameKeys } from '@/api/game/queries';
import type { AdminGameDetailResponse, GameContentDescriptor, GameRatingLevel } from '@/api/game/types';
import { ApiError } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Field, INPUT_CLASS } from '@/components/ui/field';
import { ConfirmModal } from '@/components/ui/modal';
import { SectionCard } from '@/components/ui/section-card';

const RATING_LABELS: Record<GameRatingLevel, string> = {
  ALL: '전체이용가',
  OVER_12: '12세',
  OVER_15: '15세',
  OVER_18: '청소년이용불가',
};

const DESCRIPTOR_LABELS: Record<GameContentDescriptor, string> = {
  sexuality: '선정성',
  violence: '폭력성',
  fear: '공포',
  language: '언어',
  drugs: '약물',
  crime: '범죄',
  gambling: '사행성',
};

interface FormValues {
  rating: GameRatingLevel;
  classificationNumber: string;
  classificationDate: string;
  businessName: string;
  developerReportNumber: string;
  contentDescriptors: GameContentDescriptor[];
}

const EMPTY_FORM: FormValues = {
  rating: 'ALL',
  classificationNumber: '',
  classificationDate: '',
  businessName: '',
  developerReportNumber: '',
  contentDescriptors: [],
};

/** 등급정보는 선택 입력이다(FR-7.5) — 없으면 "+ 등급정보 추가"만 보이고, 있으면
 * 게임 상세 하단에 등급 표시로 노출된다. */
export function RatingTab({ gameId, detail }: { gameId: number; detail: AdminGameDetailResponse }) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(detail.rating !== null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [form, setForm] = useState<FormValues>(() =>
    detail.rating
      ? {
          rating: detail.rating.rating,
          classificationNumber: detail.rating.classificationNumber ?? '',
          classificationDate: detail.rating.classificationDate ?? '',
          businessName: detail.rating.businessName ?? '',
          developerReportNumber: detail.rating.developerReportNumber ?? '',
          contentDescriptors: detail.rating.contentDescriptors,
        }
      : EMPTY_FORM,
  );
  const [error, setError] = useState<string | null>(null);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: gameKeys.game(gameId) });
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      upsertGameRating(gameId, {
        rating: form.rating,
        classificationNumber: form.classificationNumber.trim() || null,
        classificationDate: form.classificationDate || null,
        businessName: form.businessName.trim() || null,
        developerReportNumber: form.developerReportNumber.trim() || null,
        contentDescriptors: form.contentDescriptors,
      }),
    onSuccess: invalidate,
    onError: (e) => setError(e instanceof ApiError ? e.message : '저장에 실패했습니다.'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteGameRating(gameId),
    onSuccess: () => {
      setIsEditing(false);
      setForm(EMPTY_FORM);
      invalidate();
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : '삭제에 실패했습니다.'),
  });

  function toggleDescriptor(key: GameContentDescriptor) {
    setForm((prev) => ({
      ...prev,
      contentDescriptors: prev.contentDescriptors.includes(key)
        ? prev.contentDescriptors.filter((d) => d !== key)
        : [...prev.contentDescriptors, key],
    }));
  }

  if (!isEditing) {
    return (
      <SectionCard title="등급정보" caption="선택 입력 · 게임 상세 하단에 등급 표시로 노출">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="border-dash text-muted hover:border-primary-line hover:text-primary-text w-full cursor-pointer rounded-[11px] border border-dashed p-3 text-center text-xs whitespace-nowrap transition-colors"
        >
          + 등급정보 추가
        </button>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="등급정보"
      caption="게임 상세 하단에 등급 표시로 노출"
      action={
        <div className="flex items-center gap-2">
          <Button variant="danger" onClick={() => setIsDeleteOpen(true)}>
            등급정보 삭제
          </Button>
          <Button variant="primary" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            저장
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3.5">
        <Field label="표시 등급">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(RATING_LABELS) as GameRatingLevel[]).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, rating: level }))}
                className={`cursor-pointer rounded-full border px-3.5 py-2 text-[13px] whitespace-nowrap transition-colors ${
                  form.rating === level
                    ? 'border-primary-line bg-primary-soft text-primary-text font-medium'
                    : 'border-line text-muted hover:border-line2'
                }`}
              >
                {RATING_LABELS[level]}
              </button>
            ))}
          </div>
        </Field>

        <div className="flex gap-3.5">
          <Field label="등급분류번호" className="flex-1">
            <input
              value={form.classificationNumber}
              onChange={(e) => setForm((prev) => ({ ...prev, classificationNumber: e.target.value }))}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="등급분류일자" className="w-[180px] flex-none">
            <input
              type="date"
              value={form.classificationDate}
              onChange={(e) => setForm((prev) => ({ ...prev, classificationDate: e.target.value }))}
              className={INPUT_CLASS}
            />
          </Field>
        </div>

        <div className="flex gap-3.5">
          <Field label="상호 (제작사)" className="flex-1">
            <input
              value={form.businessName}
              onChange={(e) => setForm((prev) => ({ ...prev, businessName: e.target.value }))}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="개발사 신고번호" className="flex-1">
            <input
              value={form.developerReportNumber}
              onChange={(e) => setForm((prev) => ({ ...prev, developerReportNumber: e.target.value }))}
              className={INPUT_CLASS}
            />
          </Field>
        </div>

        <Field label="내용정보 표시">
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(DESCRIPTOR_LABELS) as GameContentDescriptor[]).map((key) => (
              <Chip
                key={key}
                size="sm"
                pressed={form.contentDescriptors.includes(key)}
                onPressedChange={() => toggleDescriptor(key)}
              >
                {DESCRIPTOR_LABELS[key]}
              </Chip>
            ))}
          </div>
        </Field>

        {error && <p className="text-danger m-0 text-[11px]">{error}</p>}
      </div>

      {isDeleteOpen && (
        <ConfirmModal
          title="등급정보 삭제"
          description="등급정보를 삭제하면 게임 상세에서 등급 표시가 사라집니다."
          onCancel={() => setIsDeleteOpen(false)}
          onConfirm={() => deleteMutation.mutate()}
        />
      )}
    </SectionCard>
  );
}
