import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import {
  updateActivityCategoryHeader,
  activityKeys,
  activityQueries,
  type ActivityCategoryResponse,
} from '@/entities/activity';
import { useImageUpload } from '@/features/image-upload';
import { getApiErrorMessage } from '@/shared/api/error';
import { useDebouncedSave } from '@/shared/lib/hooks/useDebouncedSave';
import { Field, INPUT_CLASS } from '@/shared/ui/field';
import { PageHeader } from '@/shared/ui/page-header';
import { Eyebrow } from '@/shared/ui/section-card';

import { ActivityEditModal } from './ActivityEditModal';
import { ActivityTimeline } from './ActivityTimeline';
import { CategoryChipBar } from './CategoryChipBar';

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

export function ActivityCategoryEditor({
  category,
  categories,
  onSelect,
}: {
  category: ActivityCategoryResponse;
  categories: ActivityCategoryResponse[];
  onSelect: (id: number) => void;
}) {
  const queryClient = useQueryClient();
  const categoryId = category.id;
  const [editing, setEditing] = useState<{ id: number | null; year?: number } | null>(null);
  const { data: activityPage } = useQuery(activityQueries.list(categoryId));

  const [form, setForm] = useState<HeaderFormValues>(() => ({
    name: category.name,
    headline: headlineToEditable(category.headline),
    heroImageUrl: category.heroImageUrl,
  }));

  const [headerError, setHeaderError] = useState<string | null>(null);
  const headerMutation = useMutation({
    scope: { id: `activity-header-${categoryId}` },
    mutationFn: (values: HeaderFormValues) =>
      updateActivityCategoryHeader(categoryId, {
        name: values.name,
        headline: headlineToStored(values.headline),
        heroImageUrl: values.heroImageUrl,
      }),
    onSuccess: () => {
      setHeaderError(null);
      return queryClient.invalidateQueries({ queryKey: activityKeys.categories() });
    },
    onError: (e) => setHeaderError(getApiErrorMessage(e, '저장에 실패했습니다.')),
  });
  const { save: saveHeader } = useDebouncedSave<HeaderFormValues>((values) => headerMutation.mutate(values));

  function updateForm(patch: Partial<HeaderFormValues>) {
    const next = { ...form, ...patch };
    setForm(next);
    saveHeader(next);
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
        slug={`/activity/${category.slug}`}
        title={`${category.name} 활동`}
        saving={headerMutation.isPending}
      />

      <CategoryChipBar
        categories={categories}
        selectedId={category.id}
        counts={{ [categoryId]: activityPage?.totalElements }}
        onSelect={onSelect}
      />

      <div className="flex w-full flex-col gap-[18px] px-8 pt-[22px] pb-10">
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
                  <img src={form.heroImageUrl} alt="" className="h-[26px] w-11 flex-none rounded-md object-cover" />
                ) : (
                  <span className="bg-sunken h-[26px] w-11 flex-none rounded-md" />
                )}
                <span className="text-muted text-[11px] whitespace-nowrap">{isUploading ? '업로드 중…' : '교체'}</span>
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
      {editing && (
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
