'use client';

interface MembersToolbarProps {
  query: string;
  onQueryChange: (value: string) => void;
  sortAsc: boolean;
  onToggleSort: () => void;
  hasFilters: boolean;
  filterCount: number;
  onResetFilters: () => void;
  isAdmin: boolean;
  onAdd: () => void;
}

export function MembersToolbar({
  query,
  onQueryChange,
  sortAsc,
  onToggleSort,
  hasFilters,
  filterCount,
  onResetFilters,
  isAdmin,
  onAdd,
}: MembersToolbarProps) {
  return (
    <div className="mb-[18px] flex items-center gap-3">
      <div className="flex h-[42px] max-w-[420px] flex-1 items-center gap-[9px] rounded-xl border border-[rgba(0,0,0,0.12)] bg-[rgba(0,0,0,0.03)] px-3.5">
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="5" stroke="#8B93B0" strokeWidth="1.5" />
          <path d="M11 11l3.2 3.2" stroke="#8B93B0" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="이름 · 학번 · 이메일 · Github 검색"
          className="h-10 flex-1 border-none bg-transparent text-[13.5px] text-[#1B1B22] outline-none"
        />
      </div>

      <button
        onClick={onToggleSort}
        className="h-[42px] flex-none cursor-pointer rounded-xl border border-[rgba(0,0,0,0.12)] bg-[rgba(0,0,0,0.025)] px-[15px] text-[13px] whitespace-nowrap text-[#3C3C46]"
      >
        기수 {sortAsc ? '오름차순 ↑' : '내림차순 ↓'}
      </button>

      {hasFilters && (
        <button
          onClick={onResetFilters}
          className="h-[42px] flex-none cursor-pointer rounded-xl border border-[rgba(0,0,0,0.12)] bg-transparent px-[15px] text-[13px] whitespace-nowrap text-[#6C6C78]"
        >
          필터 초기화 {filterCount}
        </button>
      )}

      {isAdmin ? (
        <button
          onClick={onAdd}
          className="ml-auto h-[42px] flex-none cursor-pointer rounded-xl bg-[var(--accent)] px-5 text-[13.5px] font-bold whitespace-nowrap text-white"
        >
          + 부원 추가
        </button>
      ) : (
        <span className="ml-auto flex h-[42px] flex-none items-center rounded-xl border border-dashed border-[rgba(0,0,0,0.18)] px-4 text-[12.5px] whitespace-nowrap text-[#6C6C78]">
          일반 권한 · 본인 정보만 수정 가능
        </span>
      )}
    </div>
  );
}
