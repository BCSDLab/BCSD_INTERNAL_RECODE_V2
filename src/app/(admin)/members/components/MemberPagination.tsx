'use client';

import type { MemberDirectoryPageInfo } from '@/api/member/types';

/** 앞뒤로 최대 이만큼씩만 번호를 보인다. 기수가 늘어도 줄이 넘치지 않게 한다. */
const WINDOW = 2;

/** 표시할 페이지 번호(0-based)와 생략 표시를 만든다. */
function buildPages(current: number, totalPages: number): (number | 'gap')[] {
  const pages = new Set<number>([0, totalPages - 1]);
  for (let page = current - WINDOW; page <= current + WINDOW; page++) {
    if (page >= 0 && page < totalPages) {
      pages.add(page);
    }
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const result: (number | 'gap')[] = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) {
      result.push('gap');
    }
    result.push(page);
  });
  return result;
}

export function MemberPagination({
  page,
  onPageChange,
}: {
  page: MemberDirectoryPageInfo;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, page.totalPages);
  const current = Math.min(page.number, totalPages - 1);
  const from = page.totalElements === 0 ? 0 : current * page.size + 1;
  const to = Math.min((current + 1) * page.size, page.totalElements);

  return (
    <div className="border-line flex flex-wrap items-center gap-2 border-t px-[18px] py-3">
      <span className="text-faint text-xs tabular-nums">
        {page.totalElements === 0 ? '0명' : `${from}–${to} / ${page.totalElements}명`}
      </span>

      <div className="ml-auto flex flex-none items-center gap-1">
        <PageButton disabled={current <= 0} onClick={() => onPageChange(current - 1)}>
          ‹
        </PageButton>
        {buildPages(current, totalPages).map((item, index) =>
          item === 'gap' ? (
            <span key={`gap-${index}`} className="text-faint px-1 text-xs">
              …
            </span>
          ) : (
            <PageButton key={item} selected={item === current} onClick={() => onPageChange(item)}>
              {item + 1}
            </PageButton>
          ),
        )}
        <PageButton disabled={current >= totalPages - 1} onClick={() => onPageChange(current + 1)}>
          ›
        </PageButton>
      </div>
    </div>
  );
}

function PageButton({
  selected = false,
  disabled = false,
  onClick,
  children,
}: {
  selected?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-current={selected ? 'page' : undefined}
      className={`min-w-[28px] cursor-pointer rounded-[8px] border px-2 py-1 text-xs tabular-nums transition-colors disabled:cursor-default disabled:opacity-35 ${
        selected
          ? 'border-primary-line bg-primary-soft text-primary-text font-medium'
          : 'border-line text-muted hover:border-line2 hover:text-text'
      }`}
    >
      {children}
    </button>
  );
}
