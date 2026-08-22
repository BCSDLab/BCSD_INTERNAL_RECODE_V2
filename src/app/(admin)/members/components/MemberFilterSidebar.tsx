'use client';

import type { MemberDirectoryCounts, MemberDirectoryFilters } from '@/api/member/types';
import { Chip, ChipCount } from '@/components/ui/chip';
import { Eyebrow } from '@/components/ui/section-card';
import { ACADEMIC_STATUS_LABELS, MEMBER_TYPE_LABELS, TRACK_LABELS } from '@/lib/member-labels';
import { ACADEMIC_STATUS_OPTIONS, MEMBER_TYPE_OPTIONS, TRACK_OPTIONS, toggleValue } from './options';

/**
 * 시안의 216px 필터 패널. 트랙·구분·학적상태는 다중 선택(같은 그룹 안은 OR, 그룹 사이는 AND),
 * 활동 여부만 단일 선택이다 — 백엔드 active가 boolean 하나라 둘을 동시에 고를 수 없다.
 *
 * 칩의 숫자는 서버가 준 **전체** 집계다(필터와 무관). 그래서 필터를 걸어도 숫자가 흔들리지 않는다.
 */
export function MemberFilterSidebar({
  counts,
  filters,
  onChange,
}: {
  counts: MemberDirectoryCounts | undefined;
  filters: MemberDirectoryFilters;
  onChange: (filters: MemberDirectoryFilters) => void;
}) {
  return (
    <aside className="border-line bg-panel sticky top-[22px] flex w-[216px] flex-none flex-col gap-[18px] rounded-2xl border p-[18px]">
      <FilterGroup label="활동 여부">
        <FilterChip
          label="활동"
          count={counts?.active}
          selected={filters.active === true}
          onToggle={() => onChange({ ...filters, active: filters.active === true ? null : true })}
        />
        <FilterChip
          label="비활동"
          count={counts?.inactive}
          selected={filters.active === false}
          onToggle={() => onChange({ ...filters, active: filters.active === false ? null : false })}
        />
      </FilterGroup>

      <FilterGroup label="학적 상태">
        {ACADEMIC_STATUS_OPTIONS.map((status) => (
          <FilterChip
            key={status}
            label={ACADEMIC_STATUS_LABELS[status]}
            count={counts?.byAcademicStatus[status] ?? 0}
            selected={filters.academicStatus.includes(status)}
            onToggle={() => onChange({ ...filters, academicStatus: toggleValue(filters.academicStatus, status) })}
          />
        ))}
      </FilterGroup>

      <FilterGroup label="트랙">
        {TRACK_OPTIONS.map((track) => (
          <FilterChip
            key={track}
            label={TRACK_LABELS[track]}
            count={counts?.byTrack[track] ?? 0}
            selected={filters.track.includes(track)}
            onToggle={() => onChange({ ...filters, track: toggleValue(filters.track, track) })}
          />
        ))}
      </FilterGroup>

      <FilterGroup label="구분">
        {MEMBER_TYPE_OPTIONS.map((memberType) => (
          <FilterChip
            key={memberType}
            label={MEMBER_TYPE_LABELS[memberType]}
            count={counts?.byMemberType[memberType] ?? 0}
            selected={filters.memberType.includes(memberType)}
            onToggle={() => onChange({ ...filters, memberType: toggleValue(filters.memberType, memberType) })}
          />
        ))}
      </FilterGroup>
    </aside>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[9px]">
      <Eyebrow>{label}</Eyebrow>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function FilterChip({
  label,
  count,
  selected,
  onToggle,
}: {
  label: string;
  count: number | undefined;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <Chip
      size="xs"
      selected={selected}
      onClick={onToggle}
      aria-pressed={selected}
      role="button"
      className="cursor-pointer"
    >
      {label}
      {count !== undefined && <ChipCount>{count}</ChipCount>}
    </Chip>
  );
}
