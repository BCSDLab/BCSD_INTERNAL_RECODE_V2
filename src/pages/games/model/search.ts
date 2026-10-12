import { searchEnum } from '@/shared/lib/router/search';

export const GAME_TABS = ['기본정보', '상세설명', '스크린샷', '등급정보', '빌드'] as const;
export function validateGameSearch(search: Record<string, unknown>): { tab?: (typeof GAME_TABS)[number] } {
  return { tab: searchEnum(search.tab, GAME_TABS) };
}
