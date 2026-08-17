'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { logout } from '@/lib/api/auth';
import { setSession } from '@/lib/auth/session-store';
import { useSession } from '@/lib/auth/use-session';

export default function Home() {
  const router = useRouter();
  const { session, status } = useSession();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setSession(null);
      setLoggingOut(false);
      router.push('/login');
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0b0d1a] text-white">
      {status === 'loading' ? (
        <p className="text-[15px] text-white/70">불러오는 중...</p>
      ) : session ? (
        <>
          <p className="text-[15px] text-white/70">{session.member.name}님, 환영합니다.</p>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="text-[13px] font-semibold text-[var(--accent)] hover:underline disabled:opacity-50"
          >
            {loggingOut ? '로그아웃 중...' : '로그아웃'}
          </button>
        </>
      ) : (
        <>
          <p className="text-[15px] text-white/70">BCSD Internal</p>
          <Link href="/login" className="text-[13px] font-semibold text-[var(--accent)] hover:underline">
            로그인하기
          </Link>
        </>
      )}
    </div>
  );
}
