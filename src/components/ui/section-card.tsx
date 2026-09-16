'use client';

import { CARD_CLASS, CardAction, CardDescription, CardHeader, CardTitle } from './card';

/**
 * 시안의 섹션 카드: border-line / radius 16 / bg panel / padding 22.
 * 헤더는 "제목(12px 600 대문자 자간.14em muted) + 설명(11px faint) + 오른쪽 액션".
 * ui/card.tsx의 조립 블록으로 구성된다 — 이 슬롯 API(title/caption/action)가 안 맞는
 * 화면은 CardHeader/CardTitle을 직접 쓴다. 바깥 태그는 접근성 랜드마크(section)를
 * 유지하려고 Card(div)를 재사용하지 않고 CARD_CLASS만 가져다 쓴다.
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
    <section className={`${CARD_CLASS} ${className}`}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {caption && <CardDescription>{caption}</CardDescription>}
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
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
