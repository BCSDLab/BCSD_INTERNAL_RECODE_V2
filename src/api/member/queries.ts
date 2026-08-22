import { queryOptions } from '@tanstack/react-query';
import { getMemberDirectory } from './api';
import { EMPTY_MEMBER_FILTERS, type MemberDirectoryParams } from './types';

export const memberKeys = {
  /** 변경 뒤 무효화는 이 접두사로 한다 — 필터 조합별 캐시와 뱃지용 집계를 한 번에 턴다. */
  all: () => ['members'] as const,
  directory: (params: MemberDirectoryParams) => ['members', 'directory', params] as const,
  total: (isAdmin: boolean) => ['members', 'total', isAdmin] as const,
};

/** 사이드바 뱃지용 — counts는 필터와 무관한 전체 집계라 1건만 받아 total만 읽는다. */
function totalParams(isAdmin: boolean): MemberDirectoryParams {
  return { ...EMPTY_MEMBER_FILTERS, page: 0, size: 1, sort: 'generation', direction: 'asc', isAdmin };
}

export const memberQueries = {
  directory: (params: MemberDirectoryParams) =>
    queryOptions({ queryKey: memberKeys.directory(params), queryFn: () => getMemberDirectory(params) }),
  total: (isAdmin: boolean) =>
    queryOptions({ queryKey: memberKeys.total(isAdmin), queryFn: () => getMemberDirectory(totalParams(isAdmin)) }),
};
