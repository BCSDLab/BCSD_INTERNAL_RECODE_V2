import { searchInteger } from '@/shared/lib/router/search';

export function validateCurriculumSearch(search: Record<string, unknown>): {
  trackPageId?: number;
  curriculumId?: number;
  weekId?: number;
} {
  const trackPageId = searchInteger(search.trackPageId);
  const curriculumId = trackPageId ? searchInteger(search.curriculumId) : undefined;
  return { trackPageId, curriculumId, weekId: curriculumId ? searchInteger(search.weekId) : undefined };
}
