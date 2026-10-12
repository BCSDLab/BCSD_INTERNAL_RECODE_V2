import { type MemberDirectoryFilters, type MemberSortKey, type SortDirection } from '@/entities/member';
import { searchEnum, searchEnums, searchInteger } from '@/shared/lib/router/search';

export interface MemberSearch {
  keyword?: string;
  active?: boolean;
  academicStatus?: MemberDirectoryFilters['academicStatus'];
  track?: MemberDirectoryFilters['track'];
  memberType?: MemberDirectoryFilters['memberType'];
  page?: number;
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
    sort: searchEnum(search.sort, ['generation', 'name', 'studentNumber']),
    direction: searchEnum(search.direction, ['asc', 'desc']),
  };
}
