'use client';

import Image from 'next/image';
import type { ViewMode } from '@/components/members/types';

interface MembersHeaderProps {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  meInitial: string;
  meLabel: string;
}

const VIEW_MODES: ViewMode[] = ['관리자', '일반'];

export function MembersHeader({ view, onViewChange, meInitial, meLabel }: MembersHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-[34px] border-b border-[rgba(0,0,0,0.09)] bg-[rgba(255,255,255,0.88)] px-8 backdrop-blur-[14px]">
      <div className="flex items-center gap-2.5">
        <Image src="/bcsd-logo.svg" alt="BCSD" width={34} height={34} className="object-contain" />
        <span className="text-[17px] font-extrabold tracking-[.14em]">BCSD INTERNAL</span>
      </div>
      <div className="ml-auto flex items-center gap-3.5">
        <div className="flex gap-1 rounded-full border border-[rgba(0,0,0,0.1)] bg-[rgba(0,0,0,0.025)] p-1">
          {VIEW_MODES.map((mode) => (
            <button
              key={mode}
              onClick={() => onViewChange(mode)}
              className="cursor-pointer rounded-full px-3.5 py-[5px] text-[12.5px] font-semibold whitespace-nowrap"
              style={{
                background: view === mode ? 'rgba(195,96,243,0.24)' : 'transparent',
                color: view === mode ? '#8F27C4' : '#6C6C78',
              }}
            >
              {mode} 화면
            </button>
          ))}
        </div>
        <div className="flex items-center gap-[9px]">
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[var(--accent)] text-xs font-bold text-white">
            {meInitial}
          </div>
          <span className="text-[13px] whitespace-nowrap text-[#3C3C46]">{meLabel}</span>
        </div>
      </div>
    </header>
  );
}
