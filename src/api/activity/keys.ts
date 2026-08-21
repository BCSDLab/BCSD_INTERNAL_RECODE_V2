export const activityKeys = {
  categories: () => ['activity-categories'] as const,
  list: (categoryId: number | null) => ['activities', categoryId] as const,
  detail: (activityId: number | null) => ['activity-detail', activityId] as const,
  total: () => ['activity-total'] as const,
};
