'use client';

/**
 * 시안의 섹션 카드: border-line / radius 16 / bg panel / padding 22.
 * 헤더는 "제목(12px 600 대문자 자간.14em muted) + 설명(11px faint) + 오른쪽 액션".
 */
export function SectionCard({
  title,
  caption,
  action,
  children,
  className = '',
}: {
  title: string;
  caption?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`border-line bg-panel rounded-2xl border p-[22px] ${className}`}>
      <div className="flex flex-wrap items-center gap-2.5 pb-4">
        <h2 className="text-muted m-0 text-xs font-semibold tracking-[.14em] whitespace-nowrap uppercase">{title}</h2>
        {caption && <span className="text-faint text-[11px]">{caption}</span>}
        {action && <div className="ml-auto flex-none">{action}</div>}
      </div>
      {children}
    </section>
  );
}

/** 11px 대문자 자간 라벨 — 섹션 제목보다 한 단계 약한 자리(주차, 대표 사진, 정책 등). */
export function Eyebrow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`text-faint text-[11px] tracking-[.14em] whitespace-nowrap uppercase ${className}`}>{children}</div>
  );
}

/** 시안 하단의 정책 안내 카드(panel2 배경 + primary-text 라벨). */
export function PolicyCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`border-line bg-panel2 flex flex-col gap-[7px] rounded-[14px] border px-[17px] py-[15px] ${className}`}
    >
      <div className="text-primary-text text-[11px] tracking-[.14em] whitespace-nowrap uppercase">정책</div>
      <div className="text-muted text-xs leading-[1.8]">{children}</div>
    </div>
  );
}
