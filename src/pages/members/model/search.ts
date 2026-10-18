import { type MemberDirectoryFilters, type MemberSortKey, type SortDirection } from '@/entities/member';
import { searchEnum, searchEnums, searchInteger } from '@/shared/lib/router/search';

/** 페이지당 인원 선택지. URL에 size가 없으면 기본값을 쓴다. */
export const MEMBER_PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
export type MemberPageSize = (typeof MEMBER_PAGE_SIZE_OPTIONS)[number];
export const DEFAULT_MEMBER_PAGE_SIZE: MemberPageSize = 50;

function searchPageSize(value: unknown): MemberPageSize | undefined {
  const size = searchInteger(value);
  return MEMBER_PAGE_SIZE_OPTIONS.find((option) => option === size);
}

export interface MemberSearch {
  keyword?: string;
  active?: boolean;
  academicStatus?: MemberDirectoryFilters['academicStatus'];
  track?: MemberDirectoryFilters['track'];
  memberType?: MemberDirectoryFilters['memberType'];
  page?: number;
  size?: MemberPageSize;
  sort?: MemberSortKey;
  direction?: SortDirection;
}

export function validateMemberSearch(search: Record<string, unknown>): MemberSearch {
  return {
    keyword: typeof search.keyword === 'string' && search.keyword ? search.keyword : undefined,
    active:
      search.active === true || search.active === 'true'
        ? true
        : search.active === false || search.active === 'false'
          ? false
          : undefined,
    academicStatus: searchEnums(search.academicStatus, [
      'ENROLLED',
      'LEAVE_OF_ABSENCE',
      'MILITARY_LEAVE',
      'INDUSTRY_PRACTICE',
      'GRADUATED',
    ]),
    track: searchEnums(search.track, [
      'FRONTEND',
      'BACKEND',
      'ANDROID',
      'IOS',
      'PM',
      'DATA',
      'DESIGN',
      'DEVOPS',
      'PS',
      'GAME',
      'SECURITY',
    ]),
    memberType: searchEnums(search.memberType, ['MENTOR', 'REGULAR', 'BEGINNER']),
    page: searchInteger(search.page, 0) || undefined,
    size: searchPageSize(search.size),
    sort: searchEnum(search.sort, ['generation', 'name', 'studentNumber']),
    direction: searchEnum(search.direction, ['asc', 'desc']),
  };
}
