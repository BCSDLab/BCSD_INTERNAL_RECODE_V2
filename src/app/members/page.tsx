'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AVATAR_COLORS,
  ENROLLS,
  GRADES,
  GRID_TEMPLATE,
  GRID_TEMPLATE_READONLY,
  REQUIRED_FIELDS,
  TABLE_COLUMNS,
  TRACKS,
} from '@/components/members/constants';
import { MembersHeader } from '@/components/members/MembersHeader';
import { MembersPagination } from '@/components/members/MembersPagination';
import { MembersSidebar } from '@/components/members/MembersSidebar';
import { MembersStats } from '@/components/members/MembersStats';
import { MembersTable } from '@/components/members/MembersTable';
import { MembersToolbar } from '@/components/members/MembersToolbar';
import { DeleteModal } from '@/components/members/modals/DeleteModal';
import { MemberFormModal } from '@/components/members/modals/MemberFormModal';
import { PermissionModal } from '@/components/members/modals/PermissionModal';
import { PhotoModal } from '@/components/members/modals/PhotoModal';
import { StatusModal } from '@/components/members/modals/StatusModal';
import { Toast } from '@/components/members/Toast';
import type { EnrollStatus, Filters, Member, Permission, ViewMode } from '@/components/members/types';
import { ApiError } from '@/lib/api/client';
import { permToRole, toCreateRequest, toProfileUpdateRequest, toUiMember } from '@/lib/api/member-adapter';
import {
  createMember,
  getMemberDirectory,
  updateAcademicStatus,
  updateActive,
  updateMemberProfile,
  updateRole,
  updateWithdrawal,
  uploadMemberPhoto,
} from '@/lib/api/members';
import type { AcademicStatus, MemberDirectoryCounts, MemberType, Track } from '@/lib/api/types';
import { getSession } from '@/lib/auth/session-store';
import { ACADEMIC_STATUS_BY_LABEL } from '@/lib/member-labels';

const PAGE_SIZE = 8;
const EMPTY_FILTERS: Filters = { active: [], enroll: [], track: [], grade: [] };
const NEW_MEMBER_ID = -1;

function decodeRole(token: string): 'ADMIN' | 'MEMBER' | null {
  try {
    const payload = token.split('.')[1];
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return json.role === 'ADMIN' ? 'ADMIN' : 'MEMBER';
  } catch {
    return null;
  }
}

export default function MembersPage() {
  const session = getSession();
  const isRealAdmin = session ? decodeRole(session.accessToken) === 'ADMIN' : false;
  const meId = session?.member.id ?? -1;

  const [members, setMembers] = useState<Member[]>([]);
  const [counts, setCounts] = useState<MemberDirectoryCounts | null>(null);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<ViewMode>(isRealAdmin ? '관리자' : '일반');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const [statusId, setStatusId] = useState<number | null>(null);
  const [statusPick, setStatusPick] = useState<EnrollStatus | null>(null);
  const [permId, setPermId] = useState<number | null>(null);
  const [permPick, setPermPick] = useState<Permission | null>(null);
  const [photoId, setPhotoId] = useState<number | null>(null);
  const [delId, setDelId] = useState<number | null>(null);
  const [form, setForm] = useState<Member | null>(null);
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [undoTargetId, setUndoTargetId] = useState<number | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const isAdmin = view === '관리자';

  function flash(message: string, undoId?: number) {
    setToast(message);
    setUndoTargetId(undoId ?? null);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      setToast(null);
      setUndoTargetId(null);
    }, 4000);
  }

  const fetchDirectory = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const activeParam = filters.active.length === 1 ? filters.active[0] === '활동' : undefined;
      const academicStatusParam =
        filters.enroll.length > 0
          ? (filters.enroll.map((v) => ACADEMIC_STATUS_BY_LABEL[v]).filter(Boolean) as AcademicStatus[])
          : undefined;
      const trackParam =
        filters.track.length > 0 ? (filters.track.map((v) => v.toUpperCase()) as Track[]) : undefined;
      const memberTypeParam =
        filters.grade.length > 0 ? (filters.grade.map((v) => v.toUpperCase()) as MemberType[]) : undefined;

      const response = await getMemberDirectory(
        {
          keyword: query.trim() || undefined,
          active: activeParam,
          academicStatus: academicStatusParam,
          track: trackParam,
          memberType: memberTypeParam,
          page: page - 1,
          size: PAGE_SIZE,
          sort: `generation,${sortAsc ? 'asc' : 'desc'}`,
        },
        isAdmin,
      );

      setMembers(response.members.map(toUiMember));
      setCounts(response.counts);
      setTotalElements(response.page.totalElements);
      setTotalPages(Math.max(1, response.page.totalPages));
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : '인명부를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [query, filters, sortAsc, page, isAdmin]);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchDirectory();
    });
  }, [fetchDirectory]);

  function countAt(record: Record<string, number> | undefined, key: string): number {
    return record?.[key] ?? 0;
  }

  function toggleFilter(group: keyof Filters, value: string) {
    setFilters((prev) => {
      const current = prev[group];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...prev, [group]: next } as Filters;
    });
    setPage(1);
  }

  function resetFilters() {
    setFilters(EMPTY_FILTERS);
    setQuery('');
    setPage(1);
  }

  const hasFilters = Object.values(filters).some((a) => a.length > 0);
  const filterCount = Object.values(filters).reduce((n, a) => n + a.length, 0);

  const filterGroups = [
    {
      label: '활동 여부',
      items: (['활동', '비활동'] as const).map((v) => ({
        label: v,
        count: v === '활동' ? (counts?.active ?? 0) : (counts?.inactive ?? 0),
        active: filters.active.includes(v),
        onClick: () => toggleFilter('active', v),
      })),
    },
    {
      label: '학적 상태',
      items: ENROLLS.map((v) => ({
        label: v,
        count: countAt(counts?.byAcademicStatus, ACADEMIC_STATUS_BY_LABEL[v] ?? ''),
        active: filters.enroll.includes(v),
        onClick: () => toggleFilter('enroll', v),
      })),
    },
    {
      label: 'TRACK',
      items: TRACKS.map((v) => ({
        label: v,
        count: countAt(counts?.byTrack, v.toUpperCase()),
        active: filters.track.includes(v),
        onClick: () => toggleFilter('track', v),
      })),
    },
    {
      label: '구분',
      items: GRADES.map((v) => ({
        label: v,
        count: countAt(counts?.byMemberType, v.toUpperCase()),
        active: filters.grade.includes(v),
        onClick: () => toggleFilter('grade', v),
      })),
    },
  ];

  function openAdd() {
    setForm({
      id: NEW_MEMBER_ID,
      gen: '',
      track: 'frontend',
      grade: 'beginner',
      enroll: '재학',
      name: '',
      org: '한국기술교육대학교',
      dept: '컴퓨터공학부',
      sid: '',
      phone: '',
      email: '',
      role: '—',
      github: '',
      birth: '',
      paid: 'O',
      perm: '일반',
      active: true,
    });
    setFormError('');
  }

  async function saveForm() {
    if (!form) return;
    if (REQUIRED_FIELDS.some((k) => !form[k])) {
      setFormError('필수');
      return;
    }
    const isEdit = form.id !== NEW_MEMBER_ID;
    try {
      if (isEdit) {
        await updateMemberProfile(form.id, toProfileUpdateRequest(form));
      } else {
        const created = await createMember(toCreateRequest(form));
        await updateMemberProfile(created.id, toProfileUpdateRequest(form));
      }
      setForm(null);
      setFormError('');
      flash(`${form.name} 저장됨`);
      fetchDirectory();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : '저장에 실패했습니다.');
    }
  }

  async function applyStatus() {
    if (statusId == null || !statusPick) return;
    const target = members.find((m) => m.id === statusId);
    try {
      await updateAcademicStatus(statusId, ACADEMIC_STATUS_BY_LABEL[statusPick]);
      setStatusId(null);
      if (target) flash(`${target.name} 학적 상태 → ${statusPick}`);
      fetchDirectory();
    } catch (err) {
      flash(err instanceof ApiError ? err.message : '학적 상태 변경에 실패했습니다.');
    }
  }

  async function applyPerm() {
    if (permId == null || !permPick) return;
    const target = members.find((m) => m.id === permId);
    try {
      await updateRole(permId, permToRole(permPick));
      setPermId(null);
      if (target) flash(`${target.name} 권한 → ${permPick}`);
      fetchDirectory();
    } catch (err) {
      flash(err instanceof ApiError ? err.message : '권한 변경에 실패했습니다.');
    }
  }

  async function deactivateFromDelete() {
    if (delId == null) return;
    const target = members.find((m) => m.id === delId);
    try {
      await updateActive(delId, false);
      setDelId(null);
      if (target) flash(`${target.name} → 비활동`);
      fetchDirectory();
    } catch (err) {
      flash(err instanceof ApiError ? err.message : '처리에 실패했습니다.');
    }
  }

  async function confirmDelete() {
    if (delId == null) return;
    const target = members.find((m) => m.id === delId);
    try {
      await updateWithdrawal(delId, true);
      const closedId = delId;
      setDelId(null);
      if (target) flash(`${target.name} 탈퇴 처리됨`, closedId);
      fetchDirectory();
    } catch (err) {
      flash(err instanceof ApiError ? err.message : '삭제에 실패했습니다.');
    }
  }

  async function handlePhotoUpload(file: File) {
    if (photoId == null) return;
    const target = members.find((m) => m.id === photoId);
    try {
      await uploadMemberPhoto(photoId, file);
      setPhotoId(null);
      if (target) flash(`${target.name} 사진이 업로드되었습니다.`);
      fetchDirectory();
    } catch (err) {
      flash(err instanceof ApiError ? err.message : '사진 업로드에 실패했습니다.');
    }
  }

  function closeAll() {
    setStatusId(null);
    setPermId(null);
    setPhotoId(null);
    setDelId(null);
    setForm(null);
  }

  const statusTarget = members.find((m) => m.id === statusId) ?? null;
  const permTarget = members.find((m) => m.id === permId) ?? null;
  const photoTarget = members.find((m) => m.id === photoId) ?? null;
  const deleteTarget = members.find((m) => m.id === delId) ?? null;

  const rangeLabel =
    totalElements === 0 ? '0명' : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, totalElements)} / ${totalElements}명`;

  return (
    <div className="min-h-screen bg-[#F6F5F8] text-[#1B1B22]">
      <MembersHeader
        view={view}
        onViewChange={setView}
        meInitial={session?.member.name.slice(0, 1) ?? '?'}
        meLabel={session ? `${session.member.name} · ${isRealAdmin ? '관리자' : '일반 권한'}` : ''}
      />

      <main className="mx-auto max-w-[1780px] px-8 pt-[34px] pb-[60px]">
        <div className="mb-[22px] flex items-end gap-5">
          <div>
            <div className="mb-2 text-xs font-semibold tracking-[.16em] text-[#87878F]">MEMBER DIRECTORY</div>
            <h1 className="m-0 text-[32px] font-extrabold tracking-[-.01em]">인명부</h1>
          </div>
          <MembersStats total={counts?.total ?? 0} activeCount={counts?.active ?? 0} inactiveCount={counts?.inactive ?? 0} />
        </div>

        {loadError && (
          <div className="mb-4 rounded-xl border border-[rgba(214,58,76,0.3)] bg-[rgba(214,58,76,0.06)] px-4 py-3 text-[13px] text-[#D63A4C]">
            {loadError}
          </div>
        )}

        <MembersToolbar
          query={query}
          onQueryChange={(v) => {
            setQuery(v);
            setPage(1);
          }}
          sortAsc={sortAsc}
          onToggleSort={() => setSortAsc((v) => !v)}
          hasFilters={hasFilters}
          filterCount={filterCount}
          onResetFilters={resetFilters}
          isAdmin={isAdmin}
          onAdd={openAdd}
        />

        <div className="flex items-start gap-5">
          <MembersSidebar groups={filterGroups} />

          <section className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.09)] bg-white">
            <MembersTable
              columns={TABLE_COLUMNS}
              gridTemplate={isAdmin ? GRID_TEMPLATE : GRID_TEMPLATE_READONLY}
              tableMinWidth={isAdmin ? '1860px' : '1810px'}
              rows={members}
              isAdmin={isAdmin}
              meId={meId}
              onToggleActive={async (m) => {
                try {
                  await updateActive(m.id, !m.active);
                  flash(`${m.name} → ${m.active ? '비활동' : '활동'}`);
                  fetchDirectory();
                } catch (err) {
                  flash(err instanceof ApiError ? err.message : '활동 여부 변경에 실패했습니다.');
                }
              }}
              onOpenStatus={(m) => {
                setStatusId(m.id);
                setStatusPick(m.enroll);
              }}
              onOpenPerm={(m) => {
                setPermId(m.id);
                setPermPick(m.perm);
              }}
              onOpenPhoto={(m) => setPhotoId(m.id)}
              onEdit={(m) => {
                setForm({ ...m });
                setFormError('');
              }}
              onDelete={(m) => setDelId(m.id)}
            />

            {!loading && members.length === 0 && (
              <div className="px-5 py-[60px] text-center">
                <div className="mb-3.5 text-sm text-[#6C6C78]">조건에 맞는 부원이 없습니다.</div>
                <button
                  onClick={resetFilters}
                  className="cursor-pointer rounded-[10px] border border-[rgba(0,0,0,0.16)] px-4 py-[9px] text-[13px] text-[#3C3C46]"
                >
                  필터 초기화
                </button>
              </div>
            )}

            <MembersPagination
              rangeLabel={rangeLabel}
              page={page}
              pageCount={totalPages}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
              onSelectPage={setPage}
            />
          </section>
        </div>
      </main>

      {statusTarget && statusPick && (
        <StatusModal
          memberName={statusTarget.name}
          value={statusPick}
          onChange={setStatusPick}
          onClose={closeAll}
          onApply={applyStatus}
        />
      )}

      {permTarget && permPick && (
        <PermissionModal
          memberLabel={`${permTarget.name} (${permTarget.grade})`}
          value={permPick}
          onChange={setPermPick}
          onClose={closeAll}
          onApply={applyPerm}
        />
      )}

      {photoTarget && (
        <PhotoModal
          memberLabel={`${photoTarget.name} · ${photoTarget.gen}`}
          initial={photoTarget.name.slice(0, 1)}
          avatarColor={AVATAR_COLORS[photoTarget.id % AVATAR_COLORS.length]}
          onClose={closeAll}
          onUpload={handlePhotoUpload}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          summaryLine={`${deleteTarget.name} · ${deleteTarget.sid} · ${deleteTarget.gen}`}
          onClose={closeAll}
          onDeactivate={deactivateFromDelete}
          onConfirm={confirmDelete}
        />
      )}

      {form && (
        <MemberFormModal
          form={form}
          isEdit={form.id !== NEW_MEMBER_ID}
          formError={formError}
          onChange={(key, value) => setForm((prev) => (prev ? ({ ...prev, [key]: value } as Member) : prev))}
          onToggleActive={() => setForm((prev) => (prev ? { ...prev, active: !prev.active } : prev))}
          onClose={closeAll}
          onDelete={() => {
            setDelId(form.id);
            setForm(null);
          }}
          onSave={saveForm}
        />
      )}

      {toast && (
        <Toast
          message={toast}
          canUndo={undoTargetId != null}
          onUndo={async () => {
            if (undoTargetId != null) {
              try {
                await updateWithdrawal(undoTargetId, false);
                fetchDirectory();
              } catch {
                // best-effort undo; surfaced errors would be confusing on a toast action
              }
            }
            setToast(null);
            setUndoTargetId(null);
          }}
        />
      )}
    </div>
  );
}
