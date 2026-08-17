import type { ButtonHTMLAttributes } from 'react';

export function PrimaryButton({ className = '', disabled, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={`h-[50px] w-full rounded-[9px] bg-[var(--accent)] text-[15.5px] font-bold text-[#0b0d1a] transition-[filter] enabled:hover:brightness-110 disabled:opacity-50 ${className}`}
    />
  );
}
