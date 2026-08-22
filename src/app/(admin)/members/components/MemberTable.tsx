'use client';

import type { Track } from '@/api/auth/types';
import type { MemberDirectoryItem, MemberSortKey, SortDirection } from '@/api/member/types';
import { Badge } from '@/components/ui/chip';
import { formatPhoneNumber } from '@/lib/format-phone';
import {
  ACADEMIC_STATUS_LABELS,
  MEMBER_ROLE_LABELS,
  MEMBER_TYPE_LABELS,
  TRACK_LABELS,
} from '@/lib/member-labels';
import { TRACK_COLOR_KEY } from './track-colors';

const HEAD_CLASS = 'text-faint px-2.5 py-2.5 text-left text-[11px] font-semibold tracking-[.08em] whitespace-nowrap';
const CELL_CLASS = 'px-2.5 py-2.5 text-[13px] whitespace-nowrap';

export interface MemberRowActions {
  onEditProfile: (member: MemberDirectoryItem) => void;
  onChangePhoto: (member: MemberDirectoryItem) => void;
  onChangeAcademicStatus: (member: MemberDirectoryItem) => void;
  onChangeRole: (member: MemberDirectoryItem) => void;
  onToggleActive: (member: MemberDirectoryItem) => void;
  onWithdraw: (member: MemberDirectoryItem) => void;
}

/**
 * 인명부 표. 열이 18개라 항상 가로로 스크롤된다(감싼 div가 overflow-x-auto).
 * 관리자가 아니면 편집 수단을 아예 렌더하지 않는다 — 변경 API가 모두 관리자 전용이라
 * 일반 권한에는 보여 줄 의미가 없다.
 */
export function MemberTable({
  members,
  isLoading,
  isAdmin,
  currentMemberId,
  sort,
  direction,
  onSortChange,
  pendingMemberId,
  actions,
  onResetFilters,
}: {
  members: MemberDirectoryItem[];
  isLoading: boolean;
  isAdmin: boolean;
  currentMemberId: number | undefined;
  sort: MemberSortKey;
  direction: SortDirection;
  onSortChange: (sort: MemberSortKey) => void;
  pendingMemberId: number | null;
  actions: MemberRowActions;
  onResetFilters: () => void;
}) {
  const columnCount = isAdmin ? 18 : 17;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1720px] border-collapse">
        <thead className="bg-panel2">
          <tr className="border-line border-b">
            <th className={HEAD_CLASS}>사진</th>
            <SortableHead label="기수" sortKey="generation" sort={sort} direction={direction} onSort={onSortChange} />
            <th className={HEAD_CLASS}>트랙</th>
            <th className={HEAD_CLASS}>구분</th>
            <th className={HEAD_CLASS}>학적 상태</th>
            <SortableHead label="이름" sortKey="name" sort={sort} direction={direction} onSort={onSortChange} />
            <th className={HEAD_CLASS}>소속</th>
            <th className={HEAD_CLASS}>학부(학과)</th>
            <SortableHead
              label="학번"
              sortKey="studentNumber"
              sort={sort}
              direction={direction}
              onSort={onSortChange}
            />
            <th className={HEAD_CLASS}>전화번호</th>
            <th className={HEAD_CLASS}>이메일</th>
            <th className={HEAD_CLASS}>보직</th>
            <th className={HEAD_CLASS}>Github</th>
            <th className={HEAD_CLASS}>생일</th>
            <th className={HEAD_CLASS}>납부</th>
            <th className={HEAD_CLASS}>권한</th>
            <th className={HEAD_CLASS}>활동</th>
            {isAdmin && <th className={HEAD_CLASS} />}
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <MemberTableRow
              key={member.id}
              member={member}
              isAdmin={isAdmin}
              isSelf={member.id === currentMemberId}
              isPending={pendingMemberId === member.id}
              actions={actions}
            />
          ))}

          {members.length === 0 && (
            <tr>
              <td colSpan={columnCount} className="px-6 py-[60px] text-center">
                {isLoading ? (
                  <span className="text-faint text-[13px]">불러오는 중…</span>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-faint text-[13px]">조건에 맞는 부원이 없습니다.</span>
                    <button
                      type="button"
                      onClick={onResetFilters}
                      className="border-line2 text-muted hover:border-primary-line hover:text-primary-text cursor-pointer rounded-[9px] border px-3 py-2 text-xs transition-colors"
                    >
                      필터 초기화
                    </button>
                  </div>
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function SortableHead({
  label,
  sortKey,
  sort,
  direction,
  onSort,
}: {
  label: string;
  sortKey: MemberSortKey;
  sort: MemberSortKey;
  direction: SortDirection;
  onSort: (sort: MemberSortKey) => void;
}) {
  const isActive = sort === sortKey;
  return (
    <th className={HEAD_CLASS} aria-sort={isActive ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`hover:text-text cursor-pointer text-[11px] font-semibold tracking-[.08em] whitespace-nowrap transition-colors ${
          isActive ? 'text-primary-text' : 'text-faint'
        }`}
      >
        {label}
        <span className="pl-1 opacity-70">{isActive ? (direction === 'asc' ? '↑' : '↓') : '↕'}</span>
      </button>
    </th>
  );
}

function MemberTableRow({
  member,
  isAdmin,
  isSelf,
  isPending,
  actions,
}: {
  member: MemberDirectoryItem;
  isAdmin: boolean;
  isSelf: boolean;
  isPending: boolean;
  actions: MemberRowActions;
}) {
  return (
    <tr
      className={`border-line hover:bg-panel2 border-b transition-colors ${isSelf ? 'bg-primary-sunken' : ''} ${
        isPending ? 'opacity-60' : ''
      }`}
    >
      <td className={CELL_CLASS}>
        <MemberAvatar member={member} isAdmin={isAdmin} onChangePhoto={actions.onChangePhoto} />
      </td>
      <td className={`${CELL_CLASS} font-medium tabular-nums`}>{member.generation}</td>
      <td className={CELL_CLASS}>
        <TrackChip track={member.track} />
      </td>
      <td className={CELL_CLASS}>
        <Badge>{MEMBER_TYPE_LABELS[member.memberType]}</Badge>
      </td>
      <td className={CELL_CLASS}>
        {isAdmin ? (
          <CellButton onClick={() => actions.onChangeAcademicStatus(member)}>
            {ACADEMIC_STATUS_LABELS[member.academicStatus]} ⌄
          </CellButton>
        ) : (
          <span className="text-muted">{ACADEMIC_STATUS_LABELS[member.academicStatus]}</span>
        )}
      </td>
      <td className={`${CELL_CLASS} font-medium`}>
        <span className="flex items-center gap-1.5">
          {member.name}
          {isSelf && <TintedBadge>나</TintedBadge>}
        </span>
      </td>
      <td className={`${CELL_CLASS} text-muted max-w-[180px] truncate`}>{member.university}</td>
      <td className={`${CELL_CLASS} text-muted max-w-[180px] truncate`}>{member.department}</td>
      <td className={`${CELL_CLASS} tabular-nums`}>{member.studentNumber}</td>
      <td className={`${CELL_CLASS} text-muted tabular-nums`}>
        {member.phoneNumber ? formatPhoneNumber(member.phoneNumber) : <Empty />}
      </td>
      <td className={`${CELL_CLASS} text-muted max-w-[220px] truncate`}>{member.email}</td>
      <td className={CELL_CLASS}>{member.position ?? <Empty />}</td>
      <td className={`${CELL_CLASS} text-muted max-w-[160px] truncate`}>
        {member.githubId ? `@${member.githubId}` : <Empty />}
      </td>
      <td className={`${CELL_CLASS} text-muted tabular-nums`}>{member.birthDate ?? <Empty />}</td>
      <td className={`${CELL_CLASS} text-center font-semibold`}>
        {member.duesRequired ? <span className="text-primary-text">O</span> : <span className="text-faint">X</span>}
      </td>
      <td className={CELL_CLASS}>
        {isAdmin ? (
          <CellButton onClick={() => actions.onChangeRole(member)}>{MEMBER_ROLE_LABELS[member.role]} ⌄</CellButton>
        ) : (
          <span className="text-muted">{MEMBER_ROLE_LABELS[member.role]}</span>
        )}
      </td>
      <td className={CELL_CLASS}>
        {isAdmin ? (
          <ActiveToggle
            active={member.active}
            disabled={isPending}
            onToggle={() => actions.onToggleActive(member)}
          />
        ) : (
          <span className={member.active ? 'text-primary-text' : 'text-faint'}>
            {member.active ? '활동' : '비활동'}
          </span>
        )}
      </td>
      {isAdmin && (
        <td className={CELL_CLASS}>
          <span className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => actions.onEditProfile(member)}
              className="text-primary-text cursor-pointer text-xs hover:underline"
            >
              수정
            </button>
            <button
              type="button"
              onClick={() => actions.onWithdraw(member)}
              className="text-faint hover:text-danger cursor-pointer text-xs transition-colors"
            >
              탈퇴
            </button>
          </span>
        </td>
      )}
    </tr>
  );
}

function Empty() {
  return <span className="text-faint">—</span>;
}

/**
 * primary 색을 입힌 뱃지. ui/chip의 Badge에 색 클래스를 덧붙이면 테두리 색이 Badge 기본값과
 * 충돌해(둘 다 border-color 유틸리티라 우선순위가 생성 순서에 달림) 예측이 안 되므로 따로 둔다.
 */
function TintedBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="border-primary-line bg-primary-soft text-primary-text flex-none rounded-[5px] border px-1.5 py-0.5 text-[10px] tracking-[.08em] whitespace-nowrap">
      {children}
    </span>
  );
}

/** 트랙별 색 배지 — 시안 스크린샷에서 뽑은 색을 globals.css의 --track-{key}-* 변수로 둔다. */
function TrackChip({ track }: { track: Track }) {
  const key = TRACK_COLOR_KEY[track];
  return (
    <span
      className="inline-flex flex-none items-center rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap"
      style={{ backgroundColor: `var(--track-${key}-bg)`, color: `var(--track-${key}-text)` }}
    >
      {TRACK_LABELS[track]}
    </span>
  );
}

/** 학적 상태·권한처럼 클릭해서 바꾸는 값의 알약형 트리거 — 시안처럼 테두리 없이 채운다. */
function CellButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-panel2 text-text hover:bg-sunken cursor-pointer rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap transition-colors"
    >
      {children}
    </button>
  );
}

function MemberAvatar({
  member,
  isAdmin,
  onChangePhoto,
}: {
  member: MemberDirectoryItem;
  isAdmin: boolean;
  onChangePhoto: (member: MemberDirectoryItem) => void;
}) {
  const inner = member.photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={member.photoUrl} alt="" className="h-full w-full rounded-full object-cover" />
  ) : (
    <span className="bg-primary text-on-primary flex h-full w-full items-center justify-center rounded-full text-xs font-semibold">
      {member.name.slice(0, 1)}
    </span>
  );

  if (!isAdmin) {
    return <span className="block h-[34px] w-[34px] flex-none overflow-hidden rounded-full">{inner}</span>;
  }

  return (
    <button
      type="button"
      onClick={() => onChangePhoto(member)}
      title="사진 변경"
      className="hover:ring-primary-line block h-[34px] w-[34px] flex-none cursor-pointer overflow-hidden rounded-full transition-shadow hover:ring-2"
    >
      {inner}
    </button>
  );
}

/** 활동 여부 토글 — ActivityEditModal의 공개 토글과 같은 모양의 작은 판이다. */
function ActiveToggle({
  active,
  disabled,
  onToggle,
}: {
  active: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={active}
      className="flex cursor-pointer items-center gap-2 whitespace-nowrap disabled:cursor-default disabled:opacity-45"
    >
      <span className={`relative h-[18px] w-8 flex-none rounded-full ${active ? 'bg-primary' : 'bg-line2'}`}>
        <span
          className={`absolute top-0.5 h-3.5 w-3.5 rounded-full transition-all ${
            active ? 'bg-on-primary right-0.5' : 'bg-panel left-0.5'
          }`}
        />
      </span>
      <span className={`text-[11px] ${active ? 'text-primary-text' : 'text-faint'}`}>{active ? '활동' : '비활동'}</span>
    </button>
  );
}
