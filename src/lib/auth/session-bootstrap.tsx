'use client';

import { useEffect } from 'react';
import { getMe, reissue } from '@/lib/api/auth';
import { setSession } from '@/lib/auth/session-store';

export function SessionBootstrap() {
  useEffect(() => {
    reissue()
      .then(async (token) => {
        const member = await getMe(token.accessToken);
        setSession({ accessToken: token.accessToken, member });
      })
      .catch(() => {
        setSession(null);
      });
  }, []);

  return null;
}
