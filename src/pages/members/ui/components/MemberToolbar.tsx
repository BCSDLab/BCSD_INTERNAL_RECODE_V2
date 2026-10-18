import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useDebouncedSave } from '@/shared/lib/hooks/useDebouncedSave';
import { Button } from '@/shared/ui/button';
import { INPUT_CLASS } from '@/shared/ui/field';

/**
 * 검색 · 활동 여부 · 열 설정 · 부원 추가 줄. 검색 입력 중 초안만 로컬에 두고,
 * 확정 검색어는 부모의 URL 상태로 전달한다.
 */
export function MemberToolbar({
  keyword,
  onKeywordChange,
  activeFilter,
  columnMenu,
  isAdmin,
  onCreate,
}: {
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  activeFilter: React.ReactNode;
  columnMenu: React.ReactNode;
  isAdmin: boolean;
  onCreate: () => void;
}) {
  const [draft, setDraft] = useState({ source: keyword, value: keyword });
  // URL 복원 시 입력을 맞추되 입력 노드를 재생성하지 않아 포커스를 유지한다.
  if (draft.source !== keyword) setDraft({ source: keyword, value: keyword });
  const { save, cancel } = useDebouncedSave(onKeywordChange, 300);
  useEffect(() => cancel, [keyword, cancel]);
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="relative flex max-w-[380px] min-w-[220px] flex-1">
        <Search
          size={15}
          aria-hidden="true"
          className="text-faint pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
        />
        <input
          value={draft.value}
          onChange={(e) => {
            setDraft({ source: keyword, value: e.target.value });
            save(e.target.value);
          }}
          placeholder="이름 · 학번 · 이메일 검색"
          aria-label="부원 검색"
          className={`${INPUT_CLASS} py-2 pl-9`}
        />
      </div>

      {activeFilter}

      <div className="ml-auto flex flex-none items-center gap-2">
        {columnMenu}
        {isAdmin ? (
          <Button variant="primary" onClick={onCreate}>
            + 부원 추가
          </Button>
        ) : (
          <span className="border-dash text-faint rounded-full border border-dashed px-3 py-1.5 text-[11px] whitespace-nowrap">
            일반 권한 · 조회만 가능
          </span>
        )}
      </div>
    </div>
  );
}
