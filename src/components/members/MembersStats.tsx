interface StatPillProps {
  label: string;
  value: number;
  dotColor?: string;
  valueColor?: string;
  accent?: boolean;
}

function StatPill({ label, value, dotColor, valueColor = '#1B1B22', accent = false }: StatPillProps) {
  return (
    <div
      className="flex items-center gap-2 rounded-xl border px-[15px] py-2.5 whitespace-nowrap"
      style={{
        borderColor: accent ? 'rgba(195,96,243,0.32)' : 'rgba(0,0,0,0.1)',
        background: accent ? 'rgba(195,96,243,0.09)' : 'rgba(0,0,0,0.025)',
      }}
    >
      {dotColor && <span className="h-1.5 w-1.5 flex-none rounded-full" style={{ background: dotColor }} />}
      <span className="text-xs text-[#6C6C78]">{label}</span>
      <span className="text-[17px] font-bold" style={{ color: valueColor }}>
        {value}
      </span>
    </div>
  );
}

interface MembersStatsProps {
  total: number;
  activeCount: number;
  inactiveCount: number;
}

export function MembersStats({ total, activeCount, inactiveCount }: MembersStatsProps) {
  return (
    <div className="ml-auto flex flex-none gap-2.5">
      <StatPill label="총원" value={total} />
      <StatPill label="활동" value={activeCount} dotColor="#C360F3" valueColor="#8F27C4" accent />
      <StatPill label="비활동" value={inactiveCount} dotColor="#B4B4BE" valueColor="#6C6C78" />
    </div>
  );
}
