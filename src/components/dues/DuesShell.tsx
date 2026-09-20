'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export function DuesShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isDues = pathname.startsWith('/ledger/dues');
  const isExemptions = pathname.startsWith('/ledger/exemptions');

  return (
    <div className="bg-bg text-text min-h-screen">
      <header className="border-line bg-panel/90 sticky top-0 z-30 flex h-16 items-center border-b px-8 backdrop-blur-[14px]">
        <nav aria-label="장부 및 회비 메뉴" className="flex h-full items-center gap-7">
          <Link href="/ledger" className="text-muted hover:text-primary-text text-[13px] font-medium transition-colors">
            장부
          </Link>
          <Link
            href="/ledger/dues"
            aria-current={isDues ? 'page' : undefined}
            className={`flex h-full items-center text-[13px] transition-colors ${isDues ? 'border-primary border-b-2 font-bold' : 'text-muted hover:text-primary-text font-medium'}`}
          >
            회비
          </Link>
          <Link
            href="/ledger/exemptions"
            aria-current={isExemptions ? 'page' : undefined}
            className={`flex h-full items-center text-[13px] transition-colors ${isExemptions ? 'border-primary border-b-2 font-bold' : 'text-muted hover:text-primary-text font-medium'}`}
          >
            면제 사유
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2.5">
          <span className="border-primary-line bg-primary-soft text-primary-text rounded-full border px-3 py-1.5 text-[11.5px] font-semibold">
            관리자
          </span>
          <ThemeToggle />
        </div>
      </header>
      {children}
    </div>
  );
}
