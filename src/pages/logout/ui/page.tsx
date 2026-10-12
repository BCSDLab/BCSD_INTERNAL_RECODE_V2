import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

import { logout, setSession } from '@/entities/session';

export default function LogoutPage() {
  const navigate = useNavigate();

  useEffect(() => {
    logout()
      .catch(() => {})
      .finally(() => {
        setSession(null);
        navigate({ to: '/login', replace: true });
      });
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0b0d1a] text-white">
      <p className="text-[15px] text-white/70">로그아웃 중...</p>
    </div>
  );
}
