'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { getMe, reissue } from '@/lib/api/auth';
import { setSession } from '@/lib/auth/session-store';

export function SessionBootstrap() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/logout') {
      return;
    }

    reissue()
      .then(async (token) => {
        const member = await getMe(token.accessToken);
        setSession({ accessToken: token.accessToken, member });
      })
      .catch(() => {
        setSession(null);
      });
  }, [pathname]);

  return null;
}
