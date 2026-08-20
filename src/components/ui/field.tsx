'use client';

/**
 * 시안의 입력 필드. panel2 배경 + line 테두리 + radius 10 + 14px 글자,
 * 포커스에서 primary-line 테두리 + primary-sunken 배경으로 바뀐다.
 */
export const INPUT_CLASS =
  'w-full min-w-0 rounded-[10px] border border-line bg-panel2 px-[13px] py-[11px] text-sm text-text outline-none transition-colors focus:border-primary-line focus:bg-primary-sunken';

/** 모달 안의 조금 좁은 입력(padding 10 12). */
export const INPUT_CLASS_COMPACT =
  'w-full min-w-0 rounded-[10px] border border-line bg-panel2 px-3 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary-line focus:bg-primary-sunken';

export function Field({
  label,
  hint,
  className = '',
  children,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex min-w-0 flex-col gap-[7px] ${className}`}>
      <span className="text-muted text-xs whitespace-nowrap">{label}</span>
      {children}
      {hint && <span className="text-faint text-[11px]">{hint}</span>}
    </label>
  );
}

/** 드래그 핸들 — 시안은 ⠿ 문자를 faint 색으로 쓴다. */
export function DragHandle({ className = '', ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      aria-label="드래그로 순서 변경"
      className={`text-faint flex-none cursor-grab text-[13px] select-none ${className}`}
      {...props}
    >
      ⠿
    </span>
  );
}
