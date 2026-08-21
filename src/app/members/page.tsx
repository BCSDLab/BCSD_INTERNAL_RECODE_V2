'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AVATAR_COLORS,
  ENROLLS,
  GRADES,
  GRID_TEMPLATE,
  GRID_TEMPLATE_READONLY,
  REQUIRED_FIELDS,
  TABLE_COLUMNS,
  TRACKS,
  createSeedMembers,
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

const PAGE_SIZE = 8;
const EMPTY_FILTERS: Filters = { active: [], enroll: [], track: [], grade: [] };

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>(() => createSeedMembers());
  const [query, setQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<ViewMode>('관리자');
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
  const [undoSnapshot, setUndoSnapshot] = useState<Member[] | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const isAdmin = view === '관리자';
  const meId = isAdmin ? 1 : 5;

  function flash(message: string, snapshot?: Member[]) {
    setToast(message);
    setUndoSnapshot(snapshot ?? null);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      setToast(null);
      setUndoSnapshot(null);
    }, 4000);
  }

  function countMembers(predicate: (member: Member) => boolean) {
    return members.filter(predicate).length;
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

  const filteredMembers = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = members.filter((m) => {
      if (q && !(m.name + m.sid + m.email + m.github).toLowerCase().includes(q)) return false;
      if (filters.active.length && !filters.active.includes(m.active ? '활동' : '비활동')) return false;
      if (filters.enroll.length && !filters.enroll.includes(m.enroll)) return false;
      if (filters.track.length && !filters.track.includes(m.track)) return false;
      if (filters.grade.length && !filters.grade.includes(m.grade)) return false;
      return true;
    });
    return [...list].sort((a, b) => (sortAsc ? a.gen.localeCompare(b.gen) : b.gen.localeCompare(a.gen)));
  }, [members, query, filters, sortAsc]);

  const pageCount = Math.max(1, Math.ceil(filteredMembers.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageMembers = filteredMembers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const hasFilters = Object.values(filters).some((a) => a.length > 0);
  const filterCount = Object.values(filters).reduce((n, a) => n + a.length, 0);

  const filterGroups = [
    {
      label: '활동 여부',
      items: (['활동', '비활동'] as const).map((v) => ({
        label: v,
        count: countMembers((m) => (m.active ? '활동' : '비활동') === v),
        active: filters.active.includes(v),
        onClick: () => toggleFilter('active', v),
      })),
    },
    {
      label: '학적 상태',
      items: ENROLLS.map((v) => ({
        label: v,
        count: countMembers((m) => m.enroll === v),
        active: filters.enroll.includes(v),
        onClick: () => toggleFilter('enroll', v),
      })),
    },
    {
      label: 'TRACK',
      items: TRACKS.map((v) => ({
        label: v,
        count: countMembers((m) => m.track === v),
        active: filters.track.includes(v),
        onClick: () => toggleFilter('track', v),
      })),
    },
    {
      label: '구분',
      items: GRADES.map((v) => ({
        label: v,
        count: countMembers((m) => m.grade === v),
        active: filters.grade.includes(v),
        onClick: () => toggleFilter('grade', v),
      })),
    },
  ];

  function openAdd() {
    setForm({
      id: Date.now(),
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

  function saveForm() {
    if (!form) return;
    if (REQUIRED_FIELDS.some((k) => !form[k])) {
      setFormError('필수');
      return;
    }
    if (members.some((m) => m.sid === form.sid && m.id !== form.id)) {
      setFormError('이미 등록된 학번입니다');
      return;
    }
    setMembers((prev) => {
      const exists = prev.some((m) => m.id === form.id);
      return exists ? prev.map((m) => (m.id === form.id ? form : m)) : [...prev, form];
    });
    setForm(null);
    flash(`${form.name} 저장됨`);
  }

  function applyStatus() {
    if (statusId == null || !statusPick) return;
    const target = members.find((m) => m.id === statusId);
    setMembers((prev) => prev.map((m) => (m.id === statusId ? { ...m, enroll: statusPick } : m)));
    setStatusId(null);
    if (target) flash(`${target.name} 학적 상태 → ${statusPick}`);
  }

  function applyPerm() {
    if (permId == null || !permPick) return;
    const target = members.find((m) => m.id === permId);
    setMembers((prev) => prev.map((m) => (m.id === permId ? { ...m, perm: permPick } : m)));
    setPermId(null);
    if (target) flash(`${target.name} 권한 → ${permPick}`);
  }

  function deactivateFromDelete() {
    const target = members.find((m) => m.id === delId);
    setMembers((prev) => prev.map((m) => (m.id === delId ? { ...m, active: false } : m)));
    setDelId(null);
    if (target) flash(`${target.name} → 비활동`);
  }

  function confirmDelete() {
    const target = members.find((m) => m.id === delId);
    const snapshot = members;
    setMembers((prev) => prev.filter((m) => m.id !== delId));
    setDelId(null);
    if (target) flash(`${target.name} 삭제됨`, snapshot);
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

  const activeCount = countMembers((m) => m.active);
  const totalCount = members.length;

  const rangeLabel =
    filteredMembers.length === 0
      ? '0명'
      : `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filteredMembers.length)} / ${filteredMembers.length}명`;

  return (
    <div className="min-h-screen bg-[#F6F5F8] text-[#1B1B22]">
      <MembersHeader
        view={view}
        onViewChange={setView}
        meInitial={isAdmin ? '도' : '민'}
        meLabel={isAdmin ? '김도현 · 회장' : '최민석 · 일반 권한'}
      />

      <main className="mx-auto max-w-[1780px] px-8 pt-[34px] pb-[60px]">
        <div className="mb-[22px] flex items-end gap-5">
          <div>
            <div className="mb-2 text-xs font-semibold tracking-[.16em] text-[#87878F]">MEMBER DIRECTORY</div>
            <h1 className="m-0 text-[32px] font-extrabold tracking-[-.01em]">인명부</h1>
          </div>
          <MembersStats total={totalCount} activeCount={activeCount} inactiveCount={totalCount - activeCount} />
        </div>

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
              rows={pageMembers}
              isAdmin={isAdmin}
              meId={meId}
              onToggleActive={(m) => {
                setMembers((prev) => prev.map((x) => (x.id === m.id ? { ...x, active: !x.active } : x)));
                flash(`${m.name} → ${m.active ? '비활동' : '활동'}`);
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

            {filteredMembers.length === 0 && (
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
              page={currentPage}
              pageCount={pageCount}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(pageCount, p + 1))}
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
          isEdit={members.some((m) => m.id === form.id)}
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
          canUndo={!!undoSnapshot}
          onUndo={() => {
            if (undoSnapshot) setMembers(undoSnapshot);
            setToast(null);
            setUndoSnapshot(null);
          }}
        />
      )}
    </div>
  );
}
