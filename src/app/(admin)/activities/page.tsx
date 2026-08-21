'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { listActivities, listActivityCategories, updateActivityCategoryHeader } from '@/api/activity/api';
import { activityKeys } from '@/api/activity/keys';
import type { ActivityCategoryResponse } from '@/api/activity/types';
import { ApiError } from '@/api/client';
import { Field, INPUT_CLASS } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { Eyebrow, PolicyCard } from '@/components/ui/section-card';
import { useDebouncedSave } from '@/hooks/useDebouncedSave';
import { useImageUpload } from '@/hooks/useImageUpload';
import { ActivityEditModal } from './components/ActivityEditModal';
import { ActivityTimeline } from './components/ActivityTimeline';
import { CategoryChipBar } from './components/CategoryChipBar';

const EMPTY_CATEGORIES: ActivityCategoryResponse[] = [];

interface HeaderFormValues {
  name: string;
  headline: string;
  heroImageUrl: string | null;
}

/** 시안: 에디터에서는 "/" 위치가 줄바꿈이고, 저장할 때 "\n"으로 바꿔 넣는다. */
function headlineToEditable(headline: string | null): string {
  return (headline ?? '').replaceAll('\n', ' / ');
}
function headlineToStored(editable: string): string {
  return editable.replaceAll(' / ', '\n').replaceAll('/', '\n');
}

export default function ActivitiesPage() {
  const queryClient = useQueryClient();
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [editing, setEditing] = useState<{ id: number | null; year?: number } | null>(null);

  const { data: categories } = useQuery({
    queryKey: activityKeys.categories(),
    queryFn: listActivityCategories,
  });

  if (categories && categories.length > 0 && !categories.some((category) => category.id === categoryId)) {
    setCategoryId(categories[0].id);
  }

  const category = (categories ?? EMPTY_CATEGORIES).find((item) => item.id === categoryId) ?? null;

  const { data: activityPage } = useQuery({
    queryKey: activityKeys.list(categoryId),
    queryFn: () => listActivities(categoryId as number),
    enabled: categoryId !== null,
  });

  const [form, setForm] = useState<HeaderFormValues | null>(null);
  const [initializedId, setInitializedId] = useState<number | null>(null);
  if (category && initializedId !== category.id) {
    setInitializedId(category.id);
    setForm({
      name: category.name,
      headline: headlineToEditable(category.headline),
      heroImageUrl: category.heroImageUrl,
    });
  }

  const [headerError, setHeaderError] = useState<string | null>(null);
  const headerMutation = useMutation({
    mutationFn: (values: HeaderFormValues) =>
      updateActivityCategoryHeader(categoryId as number, {
        name: values.name,
        headline: headlineToStored(values.headline),
        heroImageUrl: values.heroImageUrl,
      }),
    onSuccess: () => {
      setHeaderError(null);
      queryClient.invalidateQueries({ queryKey: activityKeys.categories() });
    },
    onError: (e) => setHeaderError(e instanceof ApiError ? e.message : '저장에 실패했습니다.'),
  });
  const { save: saveHeader } = useDebouncedSave<HeaderFormValues>((values) => headerMutation.mutate(values));

  function updateForm(patch: Partial<HeaderFormValues>) {
    setForm((prev) => {
      if (!prev) {
        return prev;
      }
      const next = { ...prev, ...patch };
      saveHeader(next);
      return next;
    });
  }

  const { upload, isUploading, error: uploadError } = useImageUpload('ACTIVITY');

  async function handleHeroUpload(file: File) {
    try {
      updateForm({ heroImageUrl: await upload(file) });
    } catch {
      // useImageUpload가 이미 error 상태를 들고 있다.
    }
  }

  const activities = activityPage?.content ?? [];

  return (
    <>
      <PageHeader
        crumb="활동"
        slug={category ? `/activity/${category.slug}` : undefined}
        title={category ? `${category.name} 활동` : '활동'}
        saving={headerMutation.isPending}
      />

      <CategoryChipBar
        categories={categories ?? EMPTY_CATEGORIES}
        selectedId={categoryId}
        counts={categoryId !== null ? { [categoryId]: activityPage?.totalElements } : {}}
        onSelect={setCategoryId}
      />

      {category && form ? (
        <div className="flex w-full flex-wrap items-start gap-[22px] px-8 pt-[22px] pb-10">
          <div className="flex min-w-0 flex-[1_1_460px] flex-col gap-[18px]">
            <section className="border-line bg-panel rounded-2xl border px-[22px] py-5">
              <Eyebrow className="pb-3.5">페이지 헤더</Eyebrow>
              <div className="flex flex-wrap items-end gap-3.5">
                <Field
                  label={
                    <>
                      헤드라인 · <span className="text-faint">/ 위치에서 줄바꿈</span>
                    </>
                  }
                  className="min-w-[260px] flex-1"
                >
                  <input
                    value={form.headline}
                    onChange={(e) => updateForm({ headline: e.target.value })}
                    className={INPUT_CLASS}
                  />
                </Field>
                <div className="flex w-[190px] flex-none flex-col gap-[7px]">
                  <span className="text-muted text-xs whitespace-nowrap">히어로 이미지</span>
                  <label className="border-line hover:border-primary-line flex cursor-pointer items-center gap-2.5 rounded-[10px] border px-2.5 py-[7px] transition-colors">
                    {form.heroImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.heroImageUrl} alt="" className="h-[26px] w-11 flex-none rounded-md object-cover" />
                    ) : (
                      <span className="bg-sunken h-[26px] w-11 flex-none rounded-md" />
                    )}
                    <span className="text-muted text-[11px] whitespace-nowrap">
                      {isUploading ? '업로드 중…' : '교체'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleHeroUpload(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
              {(headerError || uploadError) && (
                <p className="text-danger m-0 pt-2.5 text-[11px]">{headerError ?? uploadError}</p>
              )}
            </section>

            <ActivityTimeline
              categoryId={category.id}
              activities={activities}
              onOpenActivity={(id) => setEditing({ id })}
              onCreate={(year) => setEditing({ id: null, year })}
            />
          </div>

          <div className="flex max-w-[340px] min-w-0 flex-[1_1_260px] flex-col gap-[18px]">
            <PolicyCard className="rounded-2xl p-[18px]">
              연월(YYYY.MM)은 필수이며 연도 그룹은 자동 생성됩니다 · 같은 달 여러 건은 드래그 순서를 따릅니다 · 목록에는
              제목과 요약이 보입니다 · 숨김은 랜딩에서만 감추고 데이터는 보존합니다.
            </PolicyCard>
          </div>
        </div>
      ) : (
        <div className="text-faint px-8 pt-6 pb-10 text-[13px]">
          카테고리가 없습니다. 위의 &ldquo;+ 카테고리&rdquo;로 시작하세요.
        </div>
      )}

      {editing && category && (
        <ActivityEditModal
          categoryId={category.id}
          categoryName={category.name}
          activityId={editing.id}
          defaultYear={editing.year}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
