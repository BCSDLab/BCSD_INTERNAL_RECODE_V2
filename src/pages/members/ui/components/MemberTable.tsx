import { Menu } from '@base-ui/react/menu';
import { Separator } from '@base-ui/react/separator';
import { useQuery } from '@tanstack/react-query';
import { MoreHorizontal } from 'lucide-react';

import {
  type MemberDirectoryItem,
  type MemberSortKey,
  type SortDirection,
  ACADEMIC_STATUS_LABELS,
  MEMBER_ROLE_LABELS,
  MEMBER_TYPE_LABELS,
} from '@/entities/member';
import { positionQueries } from '@/entities/position';
import { formatPhoneNumber } from '@/shared/lib/format-phone';
import { Avatar } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/chip';
import { Switch } from '@/shared/ui/switch';

import { type OptionalMemberColumn } from '../../model/columns';
import { MENU_ITEM_CLASS, MENU_POPUP_CLASS } from './menu-styles';
import { TrackChip } from './TrackChip';

const HEAD_CLASS =
  'bg-panel2 border-line sticky top-0 z-[1] border-b px-3 py-2.5 text-left text-[11px] font-semibold tracking-[.08em] whitespace-nowrap text-faint';
const CELL_CLASS = 'border-line border-b px-3 py-2 text-[13px] whitespace-nowrap';

export interface MemberRowActions {
  onOpenDetail: (member: MemberDirectoryItem) => void;
  onEditProfile: (member: MemberDirectoryItem) => void;
  onChangeAcademicStatus: (member: MemberDirectoryItem) => void;
  onChangeRole: (member: MemberDirectoryItem) => void;
  onToggleActive: (member: MemberDirectoryItem) => void;
  onWithdraw: (member: MemberDirectoryItem) => void;
  onSendPasswordLink: (member: MemberDirectoryItem) => void;
}

/** 켤 수 있는 열의 머리글과 셀. 순서는 OPTIONAL_MEMBER_COLUMNS가 정한다. */
const OPTIONAL_CELLS: Record<
  OptionalMemberColumn,
  { label: string; render: (member: MemberDirectoryItem) => React.ReactNode; className?: string }
> = {
  affiliation: {
    label: '소속 · 학과',
    className: 'text-muted max-w-[260px] truncate',
    render: (member) => `${member.university} · ${member.department}`,
  },
  company: {
    label: '직장',
    className: 'text-muted max-w-[160px] truncate',
    render: (member) => member.company || <Empty />,
  },
  phone: {
    label: '전화번호',
    className: 'text-muted tabular-nums',
    render: (member) => (member.phoneNumber ? formatPhoneNumber(member.phoneNumber) : <Empty />),
  },
  email: { label: '이메일', className: 'text-muted max-w-[220px] truncate', render: (member) => member.email },
  github: {
    label: 'Github',
    className: 'text-muted max-w-[160px] truncate',
    render: (member) => (member.githubId ? `@${member.githubId}` : <Empty />),
  },
  slack: {
    label: 'Slack ID',
    className: 'text-muted max-w-[160px] truncate',
    render: (member) => member.slackId || <Empty />,
  },
  birthDate: { label: '생일', className: 'text-muted tabular-nums', render: (member) => member.birthDate ?? <Empty /> },
  dues: {
    label: '납부',
    className: 'text-center font-semibold',
    render: (member) =>
      member.duesRequired ? <span className="text-primary-text">O</span> : <span className="text-faint">X</span>,
  },
  role: { label: '권한', className: 'text-muted', render: (member) => MEMBER_ROLE_LABELS[member.role] },
};

/**
 * 인명부 표. 사람을 찾고 상태를 훑는 데 필요한 열만 기본으로 두고, 연락처 같은 나머지는
 * 열 설정으로 켜거나 이름을 눌러 여는 상세 패널에서 본다.
 * 관리자가 아니면 편집 수단을 아예 렌더하지 않는다 — 변경 API가 모두 관리자 전용이라
 * 일반 권한에는 보여 줄 의미가 없다.
 */
export function MemberTable({
  members,
  isLoading,
  isAdmin,
  columns,
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
  columns: OptionalMemberColumn[];
  currentMemberId: number | undefined;
  sort: MemberSortKey;
  direction: SortDirection;
  onSortChange: (sort: MemberSortKey) => void;
  pendingMemberId: number | null;
  actions: MemberRowActions;
  onResetFilters: () => void;
}) {
  // 일반 권한 응답에는 직장이 없다.
  const visibleColumns = (Object.keys(OPTIONAL_CELLS) as OptionalMemberColumn[]).filter(
    (column) => columns.includes(column) && (isAdmin || column !== 'company'),
  );
  // 기본 8열 + 켠 열 + 관리자의 관리 열.
  const columnCount = 8 + visibleColumns.length + (isAdmin ? 1 : 0);
  const { data: positions = [] } = useQuery(positionQueries.list());
  const positionLabels = new Map(positions.map((position) => [position.code, position.name]));

  return (
    // 헤더를 고정하려면 세로 스크롤도 이 상자 안에서 일어나야 한다. 화면 높이에 맞춰 자른다.
    <div className="max-h-[calc(100dvh-300px)] overflow-auto">
      <table className="w-full border-separate border-spacing-0">
        <thead>
          <tr>
            <SortableHead label="기수" sortKey="generation" sort={sort} direction={direction} onSort={onSortChange} />
            <SortableHead label="이름" sortKey="name" sort={sort} direction={direction} onSort={onSortChange} />
            <th className={HEAD_CLASS}>트랙</th>
            <th className={HEAD_CLASS}>구분</th>
            <th className={HEAD_CLASS}>학적 상태</th>
            <SortableHead
              label="학번"
              sortKey="studentNumber"
              sort={sort}
              direction={direction}
              onSort={onSortChange}
            />
            <th className={HEAD_CLASS}>보직</th>
            {visibleColumns.map((column) => (
              <th key={column} className={HEAD_CLASS}>
                {OPTIONAL_CELLS[column].label}
              </th>
            ))}
            <th className={HEAD_CLASS}>활동</th>
            {isAdmin && (
              <th className={`${HEAD_CLASS} w-11`}>
                <span className="sr-only">관리</span>
              </th>
            )}
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
              visibleColumns={visibleColumns}
              actions={actions}
              positionLabels={positionLabels}
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
  visibleColumns,
  actions,
  positionLabels,
}: {
  member: MemberDirectoryItem;
  isAdmin: boolean;
  isSelf: boolean;
  isPending: boolean;
  visibleColumns: OptionalMemberColumn[];
  actions: MemberRowActions;
  positionLabels: Map<string, string>;
}) {
  return (
    <tr
      className={`hover:bg-panel2 transition-colors ${isSelf ? 'bg-primary-sunken' : ''} ${isPending ? 'opacity-60' : ''}`}
    >
      <td className={`${CELL_CLASS} font-medium tabular-nums`}>{member.generation}</td>
      <td className={`${CELL_CLASS} font-medium`}>
        <span className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => actions.onOpenDetail(member)}
            className="group/name flex cursor-pointer items-center gap-2.5 text-left font-medium"
          >
            {/* 사진 대체 이니셜이 셀 이름("홍홍길동")에 섞이지 않게 숨긴다. */}
            <span aria-hidden="true" className="flex">
              <Avatar src={member.photoUrl} name={member.name} size="md" />
            </span>
            <span className="decoration-primary-line underline-offset-[3px] group-hover/name:underline">
              {member.name}
            </span>
          </button>
          {isSelf && <TintedBadge>나</TintedBadge>}
          {member.hasAccount === false && <Badge>계정 없음</Badge>}
        </span>
      </td>
      <td className={CELL_CLASS}>
        <TrackChip track={member.track} />
      </td>
      <td className={`${CELL_CLASS} text-muted`}>{MEMBER_TYPE_LABELS[member.memberType]}</td>
      <td className={CELL_CLASS}>
        {isAdmin ? (
          <CellButton onClick={() => actions.onChangeAcademicStatus(member)}>
            {ACADEMIC_STATUS_LABELS[member.academicStatus]}
          </CellButton>
        ) : (
          <span className="text-muted">{ACADEMIC_STATUS_LABELS[member.academicStatus]}</span>
        )}
      </td>
      <td className={`${CELL_CLASS} tabular-nums`}>{member.studentNumber}</td>
      <td className={CELL_CLASS}>
        {member.positionCodes.length > 0 ? (
          member.positionCodes.map((code) => positionLabels.get(code) ?? code).join(', ')
        ) : (
          <Empty />
        )}
      </td>
      {visibleColumns.map((column) => (
        <td key={column} className={`${CELL_CLASS} ${OPTIONAL_CELLS[column].className ?? ''}`}>
          {OPTIONAL_CELLS[column].render(member)}
        </td>
      ))}
      <td className={CELL_CLASS}>
        {isAdmin ? (
          <ActiveToggle active={member.active} disabled={isPending} onToggle={() => actions.onToggleActive(member)} />
        ) : (
          <span className={member.active ? 'text-primary-text' : 'text-faint'}>
            {member.active ? '활동' : '비활동'}
          </span>
        )}
      </td>
      {isAdmin && (
        <td className={`${CELL_CLASS} py-1 text-right`}>
          <RowMenu member={member} actions={actions} />
        </td>
      )}
    </tr>
  );
}

/** 행 관리 메뉴. 탈퇴처럼 되돌리기 어려운 동작이 표에 늘 드러나 있지 않게 접어 둔다. */
function RowMenu({ member, actions }: { member: MemberDirectoryItem; actions: MemberRowActions }) {
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={`관리 메뉴: ${member.name}`}
        className="text-faint hover:bg-sunken hover:text-text data-popup-open:bg-sunken data-popup-open:text-text inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-[8px] transition-colors"
      >
        <MoreHorizontal size={16} aria-hidden="true" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={4} align="end" className="z-50 outline-none">
          <Menu.Popup className={MENU_POPUP_CLASS}>
            <Menu.Item className={MENU_ITEM_CLASS} onClick={() => actions.onOpenDetail(member)}>
              상세 보기
            </Menu.Item>
            <Menu.Item className={MENU_ITEM_CLASS} onClick={() => actions.onEditProfile(member)}>
              정보 수정
            </Menu.Item>
            <Menu.Item className={MENU_ITEM_CLASS} onClick={() => actions.onChangeRole(member)}>
              권한 변경
            </Menu.Item>
            <Menu.Item className={MENU_ITEM_CLASS} onClick={() => actions.onSendPasswordLink(member)}>
              비밀번호 설정 링크
            </Menu.Item>
            <Separator className="bg-line mx-1.5 my-1 h-px" />
            <Menu.Item className={`${MENU_ITEM_CLASS} text-danger`} onClick={() => actions.onWithdraw(member)}>
              탈퇴 처리
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
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

/** 학적 상태처럼 클릭해서 바꾸는 값의 알약형 트리거 — 테두리 있는 셀렉트 스타일. */
function CellButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border-line bg-panel text-text hover:bg-sunken inline-flex cursor-pointer items-center gap-1 rounded-full border px-3 py-1 text-[13px] font-normal whitespace-nowrap transition-colors"
    >
      {children}
      <span className="text-muted text-[10px] leading-none">▾</span>
    </button>
  );
}

/** 활동 여부 토글 — ActivityEditModal의 공개 토글과 같은 모양의 작은 판이다. */
function ActiveToggle({ active, disabled, onToggle }: { active: boolean; disabled: boolean; onToggle: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap">
      <Switch checked={active} onCheckedChange={onToggle} disabled={disabled} />
      <span className={`text-[11px] ${active ? 'text-primary-text' : 'text-faint'}`}>{active ? '활동' : '비활동'}</span>
    </label>
  );
}
