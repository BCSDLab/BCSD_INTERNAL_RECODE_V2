'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ApiError } from '@/api/client';
import { updateMemberActive } from '@/api/member/api';
import { memberKeys, memberQueries } from '@/api/member/queries';
import {
  DEFAULT_MEMBER_PAGE_SIZE,
  EMPTY_MEMBER_FILTERS,
  type MemberDirectoryFilters,
  type MemberDirectoryItem,
  type MemberSortKey,
  type SortDirection,
} from '@/api/member/types';
import { PageHeader } from '@/components/ui/page-header';
import { useSession } from '@/lib/auth/use-session';
import { AcademicStatusModal } from './components/AcademicStatusModal';
import { MemberFilterSidebar } from './components/MemberFilterSidebar';
import { MemberFormModal } from './components/MemberFormModal';
import { MemberPagination } from './components/MemberPagination';
import { MemberPhotoModal } from './components/MemberPhotoModal';
import { MemberRoleModal } from './components/MemberRoleModal';
import { MemberStats } from './components/MemberStats';
import { MemberTable } from './components/MemberTable';
import { MemberToolbar } from './components/MemberToolbar';
import { MemberWithdrawalModal } from './components/MemberWithdrawalModal';

const EMPTY_MEMBERS: MemberDirectoryItem[] = [];

/** 열려 있는 모달. 'create'만 대상 부원이 없다. */
type ModalState =
  | { kind: 'create' }
  | { kind: 'edit' | 'photo' | 'role' | 'academic-status' | 'withdrawal'; member: MemberDirectoryItem };

function countActiveFilters(filters: MemberDirectoryFilters): number {
  return (
    (filters.active === null ? 0 : 1) +
    filters.academicStatus.length +
    filters.track.length +
    filters.memberType.length
  );
}

export default function MembersPage() {
  const queryClient = useQueryClient();
  const { session } = useSession();
  const isAdmin = session?.member.role === 'ADMIN';

  const [filters, setFilters] = useState<MemberDirectoryFilters>(EMPTY_MEMBER_FILTERS);
  const [keywordInput, setKeywordInput] = useState('');
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<MemberSortKey>('generation');
  const [direction, setDirection] = useState<SortDirection>('asc');
  const [modal, setModal] = useState<ModalState | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 검색은 타자마다 요청하지 않고 멈춘 뒤에 한 번만 보낸다. 검색어가 실제로 바뀔 때만
  // 첫 장으로 되돌린다 — 그냥 되돌리면 입력 없이도 페이지 이동이 취소된다.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (keywordInput === filters.keyword) {
        return;
      }
      setFilters((prev) => ({ ...prev, keyword: keywordInput }));
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [keywordInput, filters.keyword]);

  const { data, isLoading, isFetching } = useQuery(
    memberQueries.directory({
      ...filters,
      page,
      size: DEFAULT_MEMBER_PAGE_SIZE,
      sort,
      direction,
      isAdmin,
    }),
  );

  // 마지막 줄을 지워 페이지가 범위를 벗어나면 한 장 앞으로 당긴다.
  const totalPages = data?.page.totalPages ?? 0;
  if (data && totalPages > 0 && page > totalPages - 1) {
    setPage(totalPages - 1);
  }

  const activeMutation = useMutation({
    mutationFn: ({ memberId, active }: { memberId: number; active: boolean }) => updateMemberActive(memberId, active),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: memberKeys.all() });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : '활동 여부 변경에 실패했습니다.'),
  });

  function changeFilters(next: MemberDirectoryFilters) {
    setFilters(next);
    setPage(0);
  }

  function resetFilters() {
    setKeywordInput('');
    setFilters(EMPTY_MEMBER_FILTERS);
    setPage(0);
  }

  function changeSort(nextSort: MemberSortKey) {
    if (nextSort === sort) {
      setDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(nextSort);
      setDirection('asc');
    }
    setPage(0);
  }

  const members = data?.members ?? EMPTY_MEMBERS;

  return (
    <>
      <PageHeader crumb="인명부" title="부원 명부" saving={activeMutation.isPending} />

      <div className="border-line flex flex-wrap items-center gap-2.5 border-b px-8 pt-5 pb-3">
        <MemberStats counts={data?.counts} />
        {isFetching && !isLoading && (
          <span className="text-faint ml-auto flex-none text-[11px] whitespace-nowrap">불러오는 중…</span>
        )}
      </div>

      <div className="flex w-full items-start gap-[18px] px-8 pt-[22px] pb-10">
        <MemberFilterSidebar counts={data?.counts} filters={filters} onChange={changeFilters} />

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <MemberToolbar
            keyword={keywordInput}
            onKeywordChange={setKeywordInput}
            activeFilterCount={countActiveFilters(filters)}
            onReset={resetFilters}
            isAdmin={isAdmin}
            onCreate={() => setModal({ kind: 'create' })}
          />

          <section className="border-line bg-panel overflow-hidden rounded-2xl border">
            <MemberTable
              members={members}
              isLoading={isLoading}
              isAdmin={isAdmin}
              currentMemberId={session?.member.id}
              sort={sort}
              direction={direction}
              onSortChange={changeSort}
              pendingMemberId={activeMutation.isPending ? activeMutation.variables.memberId : null}
              onResetFilters={resetFilters}
              actions={{
                onEditProfile: (member) => setModal({ kind: 'edit', member }),
                onChangePhoto: (member) => setModal({ kind: 'photo', member }),
                onChangeAcademicStatus: (member) => setModal({ kind: 'academic-status', member }),
                onChangeRole: (member) => setModal({ kind: 'role', member }),
                onToggleActive: (member) =>
                  activeMutation.mutate({ memberId: member.id, active: !member.active }),
                onWithdraw: (member) => setModal({ kind: 'withdrawal', member }),
              }}
            />
            {data && <MemberPagination page={data.page} onPageChange={setPage} />}
          </section>

          {error && <p className="text-danger m-0 pt-0.5 text-[11px]">{error}</p>}
        </div>
      </div>

      {modal?.kind === 'create' && <MemberFormModal member={null} onClose={() => setModal(null)} />}
      {modal?.kind === 'edit' && <MemberFormModal member={modal.member} onClose={() => setModal(null)} />}
      {modal?.kind === 'photo' && <MemberPhotoModal member={modal.member} onClose={() => setModal(null)} />}
      {modal?.kind === 'role' && <MemberRoleModal member={modal.member} onClose={() => setModal(null)} />}
      {modal?.kind === 'academic-status' && (
        <AcademicStatusModal member={modal.member} onClose={() => setModal(null)} />
      )}
      {modal?.kind === 'withdrawal' && <MemberWithdrawalModal member={modal.member} onClose={() => setModal(null)} />}
    </>
  );
}
