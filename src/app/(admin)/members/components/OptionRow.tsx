'use client';

/** 모달 안에서 하나를 고르는 줄(권한 · 학적 상태). 선택은 primary-soft 배경 + primary-line 테두리다. */
export function OptionRow({
  label,
  description,
  selected,
  onSelect,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex cursor-pointer flex-col gap-1 rounded-[11px] border px-3.5 py-3 text-left transition-colors ${
        selected ? 'border-primary-line bg-primary-soft' : 'border-line hover:border-line2'
      }`}
    >
      <span className={`text-[13px] font-medium ${selected ? 'text-primary-text' : 'text-text'}`}>{label}</span>
      {description && <span className="text-faint text-[11px] leading-[1.6]">{description}</span>}
    </button>
  );
}
