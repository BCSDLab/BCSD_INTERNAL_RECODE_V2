import type { InputHTMLAttributes, Ref } from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  compact?: boolean;
  ref?: Ref<HTMLInputElement>;
}

export function TextField({ label, compact = false, className = '', ref, ...inputProps }: TextFieldProps) {
  return (
    <label className="block">
      <span className="mb-[7px] block text-[13px] font-semibold text-white/70">{label}</span>
      <input
        ref={ref}
        {...inputProps}
        className={`w-full rounded-lg border-[1.5px] border-white/12 bg-[#0d0f22] px-3.5 text-white outline-none placeholder:text-white/30 focus:border-[var(--accent)] ${
          compact ? 'h-[46px] text-[14.5px]' : 'h-12 text-[15px]'
        } ${className}`}
      />
    </label>
  );
}
