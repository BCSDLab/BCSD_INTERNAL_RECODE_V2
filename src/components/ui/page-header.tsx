'use client';

import { ButtonLink } from './button';
import { ThemeToggle } from './theme-toggle';

const HOMEPAGE_URL = process.env.NEXT_PUBLIC_HOMEPAGE_URL ?? 'https://bcsdlab.com';

/**
 * 시안의 상단 헤더. 왼쪽은 "빵가루 / slug 칩" + 24px 제목, 오른쪽은 저장 상태 · 테마 ·
 * 랜딩 링크다. 헤더 내용이 화면마다 다르므로 레이아웃이 아니라 각 페이지가 렌더한다.
 *
 * 시안 문구는 "저장됨 · 랜딩 즉시 반영"이지만 "랜딩 즉시 반영"은 T-21(반영 웹훅)이
 * 들어와야 사실이 된다. 그때까지는 저장 상태만 표시한다 — 없는 보장을 적지 않는다.
 */
export function PageHeader({
  crumb,
  slug,
  title,
  saving = false,
}: {
  crumb: string;
  slug?: string;
  title: string;
  saving?: boolean;
}) {
  return (
    <header className="border-line border-b px-8 pt-5 pb-[18px]">
      <div className="flex w-full items-center gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="text-faint flex items-center gap-[9px] text-[11px] whitespace-nowrap">
            <span>{crumb}</span>
            {slug && (
              <>
                <span className="opacity-50">/</span>
                <span className="border-line text-muted rounded-md border px-[7px] py-0.5">{slug}</span>
              </>
            )}
          </div>
          <h1 className="m-0 truncate text-2xl font-semibold tracking-[-.02em]">{title}</h1>
        </div>
        <div className="ml-auto flex flex-none items-center gap-3">
          <div className="text-primary-text flex items-center gap-[7px] text-xs whitespace-nowrap">
            <span className="bg-primary h-1.5 w-1.5 flex-none rounded-full" />
            {saving ? '저장 중…' : '저장됨'}
          </div>
          <ThemeToggle />
          <ButtonLink href={HOMEPAGE_URL} target="_blank" rel="noreferrer" className="px-[13px]">
            랜딩에서 보기 ↗
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
