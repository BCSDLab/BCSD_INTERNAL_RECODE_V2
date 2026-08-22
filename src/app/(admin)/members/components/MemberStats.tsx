'use client';

import type { MemberDirectoryCounts } from '@/api/member/types';

/** 총원 · 활동 · 비활동 집계 알약. 서버가 준 전체 집계라 필터와 무관하다. */
export function MemberStats({ counts }: { counts: MemberDirectoryCounts | undefined }) {
  return (
    <div className="flex flex-wrap gap-2">
      <StatPill label="총원" value={counts?.total} />
      <StatPill label="활동" value={counts?.active} accent />
      <StatPill label="비활동" value={counts?.inactive} />
    </div>
  );
}

function StatPill({ label, value, accent = false }: { label: string; value: number | undefined; accent?: boolean }) {
  return (
    <div
      className={`flex flex-none items-center gap-2 rounded-full border px-3.5 py-2 whitespace-nowrap ${
        accent ? 'border-primary-line bg-primary-soft' : 'border-line bg-panel'
      }`}
    >
      <span className={`h-1.5 w-1.5 flex-none rounded-full ${accent ? 'bg-primary' : 'bg-line2'}`} />
      <span className={`text-[11px] ${accent ? 'text-primary-text' : 'text-muted'}`}>{label}</span>
      <span className={`text-[13px] font-semibold tabular-nums ${accent ? 'text-primary-text' : 'text-text'}`}>
        {value ?? '—'}
      </span>
    </div>
  );
}
