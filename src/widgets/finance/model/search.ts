import { EMPTY_LEDGER_FILTERS, type LedgerFilters } from '@/entities/finance';
import { searchDate, searchEnum, searchEnums, searchInteger, searchTexts } from '@/shared/lib/router/search';

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}
function amount(value: unknown): string {
  const parsed = searchInteger(value, 0);
  return parsed === undefined ? '' : String(parsed);
}
function id(value: unknown): string | undefined {
  const parsed = searchInteger(value);
  return parsed === undefined ? undefined : String(parsed);
}
export function validateLedgerSearch(search: Record<string, unknown>): { filters?: LedgerFilters; entryId?: string } {
  const filters = record(search.filters);
  return {
    entryId: id(search.entryId),
    filters:
      search.filters === undefined
        ? undefined
        : {
            ...EMPTY_LEDGER_FILTERS,
            from: searchDate(filters.from) ?? '',
            to: searchDate(filters.to) ?? '',
            types: searchEnums(filters.types, ['deposit', 'withdrawal']) ?? [],
            categories: searchEnums(filters.categories, ['회비', '행사', '운영비', '기타']) ?? [],
            linkStatuses: searchEnums(filters.linkStatuses, ['confirmed', 'pending', 'none']) ?? [],
            counterparties: searchTexts(filters.counterparties),
            descriptions: searchTexts(filters.descriptions),
            amounts: [
              ...new Set(
                (Array.isArray(filters.amounts) ? filters.amounts : []).flatMap((value) => {
                  const parsed = searchInteger(value, 0);
                  return parsed === undefined ? [] : [parsed];
                }),
              ),
            ],
            minimumAmount: amount(filters.minimumAmount),
            maximumAmount: amount(filters.maximumAmount),
          },
  };
}
export function validateDuesSearch(search: Record<string, unknown>): {
  memberId?: string;
  members?: string[];
  tracks?: string[];
  errors?: ('surplus' | 'exact' | 'shortage' | 'not-applicable')[];
  states?: ('dues-paid' | 'dues-unpaid' | 'dues-exempt' | 'dues-overpaid')[];
} {
  return {
    memberId: id(search.memberId),
    members: searchTexts(search.members),
    tracks: searchTexts(search.tracks),
    errors: searchEnums(search.errors, ['surplus', 'exact', 'shortage', 'not-applicable']),
    states: searchEnums(search.states, ['dues-paid', 'dues-unpaid', 'dues-exempt', 'dues-overpaid']),
  };
}
export type ExemptionFilters = Record<
  'member' | 'studentNumber' | 'track' | 'reason' | 'startMonth' | 'endMonth' | 'note',
  string[]
>;
export function validateExemptionSearch(search: Record<string, unknown>): {
  view?: 'member' | 'period';
  semester?: string;
  filters?: ExemptionFilters;
} {
  const filters = record(search.filters);
  return {
    view: searchEnum(search.view, ['member', 'period']),
    semester:
      typeof search.semester === 'string' && /^(19|[2-9]\d)\d{2}-[12]$/.test(search.semester)
        ? search.semester
        : undefined,
    filters:
      search.filters === undefined
        ? undefined
        : {
            member: searchTexts(filters.member),
            studentNumber: searchTexts(filters.studentNumber),
            track: searchTexts(filters.track),
            reason: searchTexts(filters.reason),
            startMonth: searchTexts(filters.startMonth),
            endMonth: searchTexts(filters.endMonth),
            note: searchTexts(filters.note),
          },
  };
}
