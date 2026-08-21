import { queryOptions } from '@tanstack/react-query';
import { getActivitiesTotal, getActivity, listActivities, listActivityCategories } from './api';

export const activityKeys = {
  categories: () => ['activity-categories'] as const,
  list: (categoryId: number | null) => ['activities', categoryId] as const,
  detail: (activityId: number | null) => ['activity-detail', activityId] as const,
  total: () => ['activity-total'] as const,
};

export const activityQueries = {
  categories: () => queryOptions({ queryKey: activityKeys.categories(), queryFn: listActivityCategories }),
  list: (categoryId: number | null) =>
    queryOptions({
      queryKey: activityKeys.list(categoryId),
      queryFn: () => listActivities(categoryId as number),
    }),
  detail: (activityId: number | null) =>
    queryOptions({
      queryKey: activityKeys.detail(activityId),
      queryFn: () => getActivity(activityId as number),
    }),
  total: () => queryOptions({ queryKey: activityKeys.total(), queryFn: getActivitiesTotal }),
};
