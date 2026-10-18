import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import {
  updateMemberActive,
  memberKeys,
  memberQueries,
  type MemberDirectoryFilters,
  type MemberDirectoryItem,
  type MemberSortKey,
} from '@/entities/member';
import { useSession } from '@/entities/session';
import { getApiErrorMessage } from '@/shared/api/error';
import { PageHeader } from '@/shared/ui/page-header';

import { useMemberColumns } from '../model/columns';
import { DEFAULT_MEMBER_PAGE_SIZE, type MemberPageSize } from '../model/search';
import { AcademicStatusModal } from './components/AcademicStatusModal';
import { MemberColumnMenu } from './components/MemberColumnMenu';
import { MemberDetailDrawer } from './components/MemberDetailDrawer';
import { MemberActiveFilter, MemberFilterBar } from './components/MemberFilterBar';
import { MemberFormModal } from './components/MemberFormModal';
import { MemberPagination } from './components/MemberPagination';
import { MemberRoleModal } from './components/MemberRoleModal';
import { type MemberRowActions, MemberTable } from './components/MemberTable';
import { MemberToolbar } from './components/MemberToolbar';
import { MemberWithdrawalModal } from './components/MemberWithdrawalModal';
import { PasswordLinkModal } from './components/PasswordLinkModal';

const EMPTY_MEMBERS: MemberDirectoryItem[] = [];

/** 열려 있는 모달. 'create'만 대상 부원이 없다. */
type ModalState =
  | { kind: 'create' }
  | {
      kind: 'detail' | 'edit' | 'role' | 'academic-status' | 'withdrawal' | 'password-link';
      member: MemberDirectoryItem;
    };

export default function MembersPage() {
  const queryClient = useQueryClient();
  const { session } = useSession();
  const isAdmin = session?.member.role === 'ADMIN';

  const search = useSearch({ from: '/_admin/members' });
  const navigate = useNavigate({ from: '/members' });
  const filters: MemberDirectoryFilters = {
    keyword: search.keyword ?? '',
    active: search.active ?? null,
    academicStatus: search.academicStatus ?? [],
    track: search.track ?? [],
    memberType: search.memberType ?? [],
  };
  const page = search.page ?? 0;
  const pageSize = search.size ?? DEFAULT_MEMBER_PAGE_SIZE;
  const sort = search.sort ?? 'generation';
  const direction = search.direction ?? 'asc';
  function setPage(nextPage: number) {
    void navigate({ search: (prev) => ({ ...prev, page: nextPage || undefined }), resetScroll: false });
  }
  function setPageSize(nextSize: MemberPageSize) {
    void navigate({
      search: (prev) => ({
        ...prev,
        size: nextSize === DEFAULT_MEMBER_PAGE_SIZE ? undefined : nextSize,
        page: undefined,
      }),
      resetScroll: false,
    });
  }
  const [modal, setModal] = useState<ModalState | null>(null);
  const { columns, toggleColumn } = useMemberColumns();

  const { data, isLoading, isFetching, isPlaceholderData } = useQuery(
    memberQueries.directory({
      ...filters,
      page,
      size: pageSize,
      sort,
      direction,
      isAdmin,
    }),
  );

  // 마지막 줄을 지워 페이지가 범위를 벗어나면 한 장 앞으로 당긴다.
  const totalPages = data?.page.totalPages ?? 0;
  useEffect(() => {
    if (data && !isPlaceholderData && page > Math.max(totalPages - 1, 0)) {
      void navigate({
        search: (prev) => ({ ...prev, page: Math.max(totalPages - 1, 0) || undefined }),
        replace: true,
        resetScroll: false,
      });
    }
  }, [data, isPlaceholderData, totalPages, page, navigate]);

  const activeMutation = useMutation({
    mutationFn: ({ memberId, active }: { memberId: number; active: boolean }) => updateMemberActive(memberId, active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: memberKeys.all() }),
  });
  const error = activeMutation.isError
    ? getApiErrorMessage(activeMutation.error, '활동 여부 변경에 실패했습니다.')
    : null;

  function changeFilters(next: MemberDirectoryFilters) {
    void navigate({
      search: (prev) => ({ ...prev, ...next, active: next.active ?? undefined, page: undefined }),
      resetScroll: false,
    });
  }

  function resetFilters() {
    void navigate({
      search: (prev) => ({ sort: prev.sort, direction: prev.direction, size: prev.size }),
      resetScroll: false,
    });
  }

  function changeSort(nextSort: MemberSortKey) {
    void navigate({
      search: (prev) => ({
        ...prev,
        sort: nextSort,
        direction: nextSort === sort && direction === 'asc' ? 'desc' : 'asc',
        page: undefined,
      }),
      resetScroll: false,
    });
  }

  const members = data?.members ?? EMPTY_MEMBERS;

  const rowActions: MemberRowActions = {
    onOpenDetail: (member) => setModal({ kind: 'detail', member }),
    onEditProfile: (member) => setModal({ kind: 'edit', member }),
    onChangeAcademicStatus: (member) => setModal({ kind: 'academic-status', member }),
    onChangeRole: (member) => setModal({ kind: 'role', member }),
    onToggleActive: (member) => activeMutation.mutate({ memberId: member.id, active: !member.active }),
    onWithdraw: (member) => setModal({ kind: 'withdrawal', member }),
    onSendPasswordLink: (member) => setModal({ kind: 'password-link', member }),
  };

  return (
    <>
      <PageHeader crumb="인명부" title="부원 명부" saving={activeMutation.isPending} />

      <div className="flex w-full flex-col gap-3 px-8 pt-5 pb-10">
        <MemberToolbar
          keyword={filters.keyword}
          onKeywordChange={(keyword) => {
            if (keyword === filters.keyword) return;
            void navigate({
              search: (prev) => ({ ...prev, keyword: keyword || undefined, page: undefined }),
              resetScroll: false,
            });
          }}
          activeFilter={
            <MemberActiveFilter
              counts={data?.counts}
              active={filters.active}
              onChange={(active) => changeFilters({ ...filters, active })}
            />
          }
          columnMenu={<MemberColumnMenu isAdmin={isAdmin} columns={columns} onToggle={toggleColumn} />}
          isAdmin={isAdmin}
          onCreate={() => setModal({ kind: 'create' })}
        />

        <div className="flex flex-wrap items-center gap-2">
          <MemberFilterBar counts={data?.counts} filters={filters} onChange={changeFilters} />
          {isFetching && !isLoading && (
            <span role="status" className="text-faint ml-auto flex-none text-[11px] whitespace-nowrap">
              불러오는 중…
            </span>
          )}
        </div>

        <section
          aria-label="부원 목록"
          aria-busy={isFetching}
          className="border-line bg-panel overflow-hidden rounded-2xl border"
        >
          <MemberTable
            members={members}
            isLoading={isLoading}
            isAdmin={isAdmin}
            columns={columns}
            currentMemberId={session?.member.id}
            sort={sort}
            direction={direction}
            onSortChange={changeSort}
            pendingMemberId={activeMutation.isPending ? activeMutation.variables.memberId : null}
            onResetFilters={resetFilters}
            actions={rowActions}
          />
          {data && (
            <MemberPagination
              page={data.page}
              pageSize={pageSize}
              disabled={isPlaceholderData}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </section>

        {error && <p className="text-danger m-0 pt-0.5 text-[11px]">{error}</p>}
      </div>

      {modal?.kind === 'detail' && (
        <MemberDetailDrawer
          member={modal.member}
          isAdmin={isAdmin}
          actions={rowActions}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.kind === 'create' && <MemberFormModal member={null} onClose={() => setModal(null)} />}
      {modal?.kind === 'edit' && <MemberFormModal member={modal.member} onClose={() => setModal(null)} />}
      {modal?.kind === 'role' && <MemberRoleModal member={modal.member} onClose={() => setModal(null)} />}
      {modal?.kind === 'academic-status' && (
        <AcademicStatusModal member={modal.member} onClose={() => setModal(null)} />
      )}
      {modal?.kind === 'withdrawal' && <MemberWithdrawalModal member={modal.member} onClose={() => setModal(null)} />}
      {modal?.kind === 'password-link' && <PasswordLinkModal member={modal.member} onClose={() => setModal(null)} />}
    </>
  );
}
