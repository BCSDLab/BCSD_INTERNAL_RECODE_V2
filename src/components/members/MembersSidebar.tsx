export interface FilterChipData {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}

export interface FilterGroupData {
  label: string;
  items: FilterChipData[];
}

interface MembersSidebarProps {
  groups: FilterGroupData[];
}

export function MembersSidebar({ groups }: MembersSidebarProps) {
  return (
    <aside className="sticky top-[88px] flex w-[216px] flex-none flex-col gap-[22px] rounded-2xl border border-[rgba(0,0,0,0.09)] bg-[#FBFAFC] p-[18px]">
      {groups.map((group) => (
        <div key={group.label}>
          <div className="mb-2.5 text-[11.5px] font-bold tracking-[.1em] text-[#87878F]">{group.label}</div>
          <div className="flex flex-wrap gap-1.5">
            {group.items.map((item) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-[11px] py-[5px] text-xs font-medium whitespace-nowrap"
                style={{
                  borderColor: item.active ? 'rgba(195,96,243,0.55)' : 'rgba(0,0,0,0.1)',
                  background: item.active ? 'rgba(195,96,243,0.2)' : 'rgba(0,0,0,0.025)',
                  color: item.active ? '#8F27C4' : '#5C5C68',
                }}
              >
                <span>{item.label}</span>
                <span className="text-[10.5px] opacity-[.62]">{item.count}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
}
