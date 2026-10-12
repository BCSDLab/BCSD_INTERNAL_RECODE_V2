import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';

import { activityQueries, type ActivityCategoryResponse } from '@/entities/activity';
import { PageHeader } from '@/shared/ui/page-header';

import { ActivityCategoryEditor } from './components/ActivityCategoryEditor';
import { CategoryChipBar } from './components/CategoryChipBar';

const EMPTY_CATEGORIES: ActivityCategoryResponse[] = [];

export default function ActivitiesPage() {
  const { categoryId: selectedId } = useSearch({ from: '/_admin/activities' });
  const navigate = useNavigate({ from: '/activities' });
  const setSelectedId = (categoryId: number) => {
    void navigate({ search: { categoryId }, resetScroll: false });
  };
  const { data: categories = EMPTY_CATEGORIES, isPending, isError } = useQuery(activityQueries.categories());
  // 첫 선택과 삭제 후 선택은 서버 목록에서 파생한다. 별도 동기화 상태를 두지 않는다.
  const category = categories.find((item) => item.id === selectedId) ?? categories[0];

  if (category) {
    return (
      <ActivityCategoryEditor key={category.id} category={category} categories={categories} onSelect={setSelectedId} />
    );
  }

  return (
    <>
      <PageHeader crumb="활동" title="활동" />
      <CategoryChipBar categories={categories} selectedId={null} counts={{}} onSelect={setSelectedId} />
      <div className="text-faint px-8 pt-6 pb-10 text-[13px]">
        {isPending
          ? '불러오는 중…'
          : isError
            ? '카테고리를 불러오지 못했습니다.'
            : '카테고리가 없습니다. 위의 “+ 카테고리”로 시작하세요.'}
      </div>
    </>
  );
}
