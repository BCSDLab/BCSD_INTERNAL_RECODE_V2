'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { ReservationScreen } from '@/components/reservations/types';

interface ReservationHeaderProps {
  screen: ReservationScreen;
  onScreenChange: (screen: ReservationScreen) => void;
  upcomingCount: number;
  loggedIn: boolean;
  userName: string;
  meInitial: string;
}

const NAV_ITEMS: { key: ReservationScreen; label: string }[] = [
  { key: 'status', label: '예약 현황' },
  { key: 'mine', label: '내 예약' },
  { key: 'rules', label: '이용 규칙' },
];

export function ReservationHeader({ screen, onScreenChange, upcomingCount, loggedIn, userName, meInitial }: ReservationHeaderProps) {
  return (
    <div className="flex h-16 items-center gap-6 border-b border-[#E7ECF3] bg-white px-6">
      <div className="flex items-center gap-2.5">
        <Image src="/bcsd-logo.svg" alt="BCSD" width={30} height={30} className="object-contain" />
        <span className="text-base font-extrabold tracking-[1.6px] text-[#17161A]">BCSD INTERNAL</span>
        <span className="mx-0.5 inline-block h-[13px] w-px bg-[#17161A]" />
        <span className="text-sm font-medium text-[#17161A]">동아리방 예약</span>
      </div>

      <div className="flex flex-1 items-center gap-1">
        {NAV_ITEMS.map((item) => (
          <div
            key={item.key}
            onClick={() => onScreenChange(item.key)}
            className="cursor-pointer rounded-lg px-3.5 py-2 text-[13.5px]"
            style={
              screen === item.key
                ? { background: 'rgba(182,17,245,.10)', color: '#b611f5', fontWeight: 700 }
                : { color: '#7C8A9C', fontWeight: 500 }
            }
          >
            {item.key === 'mine' ? `${item.label} ${upcomingCount}` : item.label}
          </div>
        ))}
      </div>

      {loggedIn ? (
        <div className="flex items-center gap-2 rounded-full border border-[#E1E8F1] py-1.5 pr-3 pl-2">
          <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#b611f5] text-[11px] font-bold text-white">
            {meInitial}
          </span>
          <span className="text-[13px] font-semibold text-[#2A3A4D]">{userName}</span>
          <span className="text-[10px] text-[#9AA6B5]">▾</span>
        </div>
      ) : (
        <Link href="/login" className="rounded-lg bg-[#b611f5] px-4 py-[7px] text-[13px] font-semibold text-white">
          로그인
        </Link>
      )}
    </div>
  );
}
