import type { ReactNode } from 'react';

interface AuthCardProps {
  children?: ReactNode;
  width?: number;
  className?: string;
}

export function AuthCard({ children, width = 420, className = '' }: AuthCardProps) {
  return (
    <div
      className={`w-full rounded-[20px] border border-white/8 bg-[#12142a] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.6)] ${className}`}
      style={{ maxWidth: width }}
    >
      {children}
    </div>
  );
}
