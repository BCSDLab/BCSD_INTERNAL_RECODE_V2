import { useEffect, useState } from 'react';

import { useDebouncedSave } from '@/shared/lib/hooks/useDebouncedSave';
import { Button } from '@/shared/ui/button';
import { INPUT_CLASS } from '@/shared/ui/field';

/** 검색 입력 중 초안만 로컬에 두고, 확정 검색어는 부모의 URL 상태로 전달한다. */
export function MemberToolbar({
  keyword,
  onKeywordChange,
  activeFilterCount,
  onReset,
  isAdmin,
  onCreate,
}: {
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  activeFilterCount: number;
  onReset: () => void;
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
      <input
        value={draft.value}
        onChange={(e) => {
          setDraft({ source: keyword, value: e.target.value });
          save(e.target.value);
        }}
        placeholder="이름 · 학번 · 이메일 검색"
        aria-label="부원 검색"
        className={`${INPUT_CLASS} max-w-[420px] flex-1`}
      />

      {activeFilterCount > 0 && (
        <Button
          onClick={() => {
            cancel();
            setDraft({ source: keyword, value: '' });
            onReset();
          }}
        >
          필터 초기화 {activeFilterCount}
        </Button>
      )}

      {isAdmin ? (
        <Button variant="primary" onClick={onCreate} className="ml-auto flex-none">
          + 부원 추가
        </Button>
      ) : (
        <span className="border-dash text-faint ml-auto flex-none rounded-full border border-dashed px-3 py-1.5 text-[11px] whitespace-nowrap">
          일반 권한 · 조회만 가능
        </span>
      )}
    </div>
  );
}
