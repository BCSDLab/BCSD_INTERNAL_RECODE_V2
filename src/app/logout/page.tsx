'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { logout } from '@/lib/api/auth';
import { setSession } from '@/lib/auth/session-store';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    logout()
      .catch(() => {})
      .finally(() => {
        setSession(null);
        router.replace('/login');
      });
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0b0d1a] text-white">
      <p className="text-[15px] text-white/70">로그아웃 중...</p>
    </div>
  );
}
