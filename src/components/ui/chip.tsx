'use client';

/**
 * 시안의 알약형 칩. **선택 상태는 primary로 채우지 않는다** — primary-soft(10%) 배경 +
 * primary-line 테두리 + primary-text 글자다. primary 채우기는 주 액션 버튼 전용이다.
 *
 * size: md(13px/8·14) 트랙·카테고리 칩 / sm(12px/6·12) 연도 필터 / xs(11px/5·11) 등급 필터
 */
type ChipSize = 'md' | 'sm' | 'xs';

const SIZES: Record<ChipSize, string> = {
  md: 'text-[13px] px-3.5 py-2',
  sm: 'text-xs px-3 py-1.5',
  xs: 'text-[11px] px-[11px] py-[5px]',
};

export function Chip({
  size = 'md',
  selected = false,
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { size?: ChipSize; selected?: boolean }) {
  return (
    <span
      className={`inline-flex flex-none items-center gap-[7px] rounded-full whitespace-nowrap transition-colors ${
        SIZES[size]
      } ${
        selected
          ? 'border-primary-line bg-primary-soft text-primary-text border font-medium'
          : 'border-line text-muted hover:border-line2 hover:text-text border'
      } ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

/** 칩 줄 끝의 "+ 추가" 점선 칩. */
export function DashedChip({
  size = 'md',
  className = '',
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { size?: ChipSize }) {
  return (
    <button
      type="button"
      className={`border-dash text-faint hover:border-primary-line hover:text-primary-text inline-flex flex-none cursor-pointer items-center rounded-full border border-dashed whitespace-nowrap transition-colors ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/** 칩 안의 부가 수치(트랙 18, EVENT 12). */
export function ChipCount({ children }: { children: React.ReactNode }) {
  return <span className="text-[11px] opacity-70">{children}</span>;
}

/** 등급/상태 뱃지 — 사각형에 가까운 작은 라벨(REGULAR, 숨김). */
export function Badge({
  dashed = false,
  className = '',
  children,
}: {
  dashed?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`flex-none rounded-[5px] px-1.5 py-0.5 text-[10px] tracking-[.08em] whitespace-nowrap ${
        dashed ? 'border-dash border border-dashed' : 'border-line2 text-muted border'
      } ${className}`}
    >
      {children}
    </span>
  );
}
