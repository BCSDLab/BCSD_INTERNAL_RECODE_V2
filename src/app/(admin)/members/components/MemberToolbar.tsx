'use client';

import { Button } from '@/components/ui/button';
import { INPUT_CLASS } from '@/components/ui/field';

/**
 * 검색 + 필터 초기화 + 부원 추가. 검색어는 페이지에서 디바운스해 질의에 넣으므로
 * 여기서는 입력값만 그대로 올린다. 정렬은 표 머리(기수·이름·학번)를 눌러 바꾼다.
 */
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
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <input
        value={keyword}
        onChange={(e) => onKeywordChange(e.target.value)}
        placeholder="이름 · 학번 · 이메일 검색"
        aria-label="부원 검색"
        className={`${INPUT_CLASS} max-w-[420px] flex-1`}
      />

      {activeFilterCount > 0 && <Button onClick={onReset}>필터 초기화 {activeFilterCount}</Button>}

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
