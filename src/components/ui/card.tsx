/**
 * 순수하게 시각적인 조립 블록이다(별도 접근성 프리미티브가 필요 없다 — Base UI에도
 * Card는 없다). SectionCard가 이걸로 조립된다. 새 화면에서 SectionCard의 title/caption/
 * action 슬롯이 안 맞으면 이 블록을 직접 조합해서 쓴다.
 */
export const CARD_CLASS = 'border-line bg-panel rounded-2xl border p-[22px]';

export function Card({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`${CARD_CLASS} ${className}`} {...props} />;
}

export function CardHeader({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`flex flex-wrap items-center gap-2.5 pb-4 ${className}`} {...props} />;
}

export function CardTitle({ className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={`text-muted m-0 text-xs font-semibold tracking-[.14em] whitespace-nowrap uppercase ${className}`}
      {...props}
    />
  );
}

export function CardDescription({ className = '', ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={`text-faint text-[11px] ${className}`} {...props} />;
}

export function CardAction({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`ml-auto flex-none ${className}`} {...props} />;
}
