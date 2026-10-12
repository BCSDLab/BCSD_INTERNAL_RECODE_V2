import { searchDate, searchEnum, searchInteger, searchMonth } from '@/shared/lib/router/search';
export function validateReservationSearch(search: Record<string, unknown>): {
  screen?: 'status' | 'mine' | 'rules';
  month?: string;
  date?: string;
  tab?: 'upcoming' | 'past';
  detailId?: number;
} {
  return {
    screen: searchEnum(search.screen, ['status', 'mine', 'rules']),
    month: searchMonth(search.month),
    date: searchDate(search.date),
    tab: searchEnum(search.tab, ['upcoming', 'past']),
    detailId: searchInteger(search.detailId),
  };
}
