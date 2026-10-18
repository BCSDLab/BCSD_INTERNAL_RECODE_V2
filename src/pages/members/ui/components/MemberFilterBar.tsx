import { Menu } from '@base-ui/react/menu';
import { Check, ChevronDown, X } from 'lucide-react';

import {
  type MemberDirectoryCounts,
  type MemberDirectoryFilters,
  ACADEMIC_STATUS_LABELS,
  MEMBER_TYPE_LABELS,
  TRACK_LABELS,
  ACADEMIC_STATUS_OPTIONS,
  MEMBER_TYPE_OPTIONS,
  TRACK_OPTIONS,
  toggleValue,
} from '@/entities/member';

import { MENU_CHECK_BOX_CLASS, MENU_ITEM_CLASS, MENU_POPUP_CLASS } from './menu-styles';

/**
 * 표 위 가로 필터 바. 트랙·학적 상태·구분은 드롭다운 다중 선택(같은 그룹 안은 OR, 그룹 사이는 AND)이고,
 * 고른 값은 아래 줄에 지울 수 있는 칩으로 모은다.
 *
 * 드롭다운의 숫자는 서버가 준 **전체** 집계다(필터와 무관). 그래서 필터를 걸어도 숫자가 흔들리지 않는다.
 */
type GroupKey = 'track' | 'academicStatus' | 'memberType';

interface FilterGroupDef {
  key: GroupKey;
  label: string;
  options: readonly string[];
  labels: Record<string, string>;
  counts: (counts: MemberDirectoryCounts) => Record<string, number>;
}

const GROUPS: FilterGroupDef[] = [
  { key: 'track', label: '트랙', options: TRACK_OPTIONS, labels: TRACK_LABELS, counts: (c) => c.byTrack },
  {
    key: 'academicStatus',
    label: '학적 상태',
    options: ACADEMIC_STATUS_OPTIONS,
    labels: ACADEMIC_STATUS_LABELS,
    counts: (c) => c.byAcademicStatus,
  },
  {
    key: 'memberType',
    label: '구분',
    options: MEMBER_TYPE_OPTIONS,
    labels: MEMBER_TYPE_LABELS,
    counts: (c) => c.byMemberType,
  },
];

function toggleGroupValue(filters: MemberDirectoryFilters, key: GroupKey, value: string): MemberDirectoryFilters {
  return { ...filters, [key]: toggleValue(filters[key] as string[], value) };
}

export function MemberFilterBar({
  counts,
  filters,
  onChange,
}: {
  counts: MemberDirectoryCounts | undefined;
  filters: MemberDirectoryFilters;
  onChange: (filters: MemberDirectoryFilters) => void;
}) {
  const chips = GROUPS.flatMap((group) =>
    (filters[group.key] as string[]).map((value) => ({ group, value, label: group.labels[value] })),
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {GROUPS.map((group) => (
        <FilterDropdown
          key={group.key}
          group={group}
          counts={counts}
          selected={filters[group.key] as string[]}
          onToggle={(value) => onChange(toggleGroupValue(filters, group.key, value))}
        />
      ))}

      {chips.length > 0 && (
        <>
          <span className="bg-line2 mx-1 h-5 w-px flex-none" aria-hidden="true" />
          {chips.map(({ group, value, label }) => (
            <button
              key={`${group.key}-${value}`}
              type="button"
              aria-label={`${group.label} ${label} 필터 해제`}
              onClick={() => onChange(toggleGroupValue(filters, group.key, value))}
              className="border-primary-line bg-primary-sunken text-primary-text hover:bg-primary-soft inline-flex flex-none cursor-pointer items-center gap-1.5 rounded-full border py-1 pr-1.5 pl-2.5 text-xs whitespace-nowrap transition-colors"
            >
              {group.label}: {label}
              <X size={12} aria-hidden="true" />
            </button>
          ))}
          <button
            type="button"
            onClick={() => onChange({ ...filters, track: [], academicStatus: [], memberType: [] })}
            className="text-muted hover:text-text cursor-pointer px-1.5 py-1 text-xs underline underline-offset-[3px] transition-colors"
          >
            모두 지우기
          </button>
        </>
      )}
    </div>
  );
}

function FilterDropdown({
  group,
  counts,
  selected,
  onToggle,
}: {
  group: FilterGroupDef;
  counts: MemberDirectoryCounts | undefined;
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const groupCounts = counts ? group.counts(counts) : undefined;
  return (
    <Menu.Root>
      <Menu.Trigger
        className={`inline-flex flex-none cursor-pointer items-center gap-1.5 rounded-[9px] border px-3 py-2 text-xs whitespace-nowrap transition-colors ${
          selected.length > 0
            ? 'border-primary-line bg-primary-soft text-primary-text font-medium'
            : 'border-line2 text-muted hover:border-primary-line hover:text-primary-text data-popup-open:border-primary-line data-popup-open:text-primary-text'
        }`}
      >
        {group.label}
        {selected.length > 0 && (
          <span className="bg-primary text-on-primary inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums">
            {selected.length}
          </span>
        )}
        <ChevronDown size={13} aria-hidden="true" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={6} align="start" className="z-50 outline-none">
          <Menu.Popup aria-label={`${group.label} 필터`} className={MENU_POPUP_CLASS}>
            {group.options.map((value) => (
              <Menu.CheckboxItem
                key={value}
                checked={selected.includes(value)}
                onCheckedChange={() => onToggle(value)}
                closeOnClick={false}
                className={`group ${MENU_ITEM_CLASS}`}
              >
                <span className={MENU_CHECK_BOX_CLASS} aria-hidden="true">
                  <Menu.CheckboxItemIndicator className="flex items-center justify-center">
                    <Check size={11} strokeWidth={3} />
                  </Menu.CheckboxItemIndicator>
                </span>
                <span className="flex-1">{group.labels[value]}</span>
                {groupCounts && <span className="text-faint text-xs tabular-nums">{groupCounts[value] ?? 0}</span>}
              </Menu.CheckboxItem>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

/** 활동 여부 세그먼트. 전체 집계도 함께 보여 줘 예전 총원·활동·비활동 알약 줄을 대신한다. */
export function MemberActiveFilter({
  counts,
  active,
  onChange,
}: {
  counts: MemberDirectoryCounts | undefined;
  active: boolean | null;
  onChange: (active: boolean | null) => void;
}) {
  const segments = [
    { value: null, label: '전체', count: counts?.total },
    { value: true, label: '활동', count: counts?.active },
    { value: false, label: '비활동', count: counts?.inactive },
  ];
  return (
    <div role="group" aria-label="활동 여부" className="bg-sunken flex flex-none gap-0.5 rounded-[10px] p-[3px]">
      {segments.map((segment) => {
        const selected = active === segment.value;
        return (
          <button
            key={segment.label}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(segment.value)}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-xs whitespace-nowrap transition-colors ${
              selected
                ? 'bg-panel text-text font-semibold shadow-[0_1px_2px_rgba(20,14,32,.12)]'
                : 'text-muted hover:text-text'
            }`}
          >
            {segment.label}
            <span className={`tabular-nums ${selected ? 'text-primary-text' : 'text-faint'}`}>
              {segment.count ?? '—'}
            </span>
          </button>
        );
      })}
    </div>
  );
}
