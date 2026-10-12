import { searchInteger } from '@/shared/lib/router/search';

export function validateActivitySearch(search: Record<string, unknown>): { categoryId?: number } {
  return { categoryId: searchInteger(search.categoryId) };
}
