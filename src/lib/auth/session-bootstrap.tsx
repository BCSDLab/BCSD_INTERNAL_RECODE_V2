'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { getMe, reissue } from '@/api/auth/api';
import { isLedgerPreviewPath, LEDGER_PREVIEW_SESSION } from '@/lib/auth/ledger-preview';
import { setSession } from '@/lib/auth/session-store';

export function SessionBootstrap() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/logout') {
      return;
    }

    if (isLedgerPreviewPath(pathname)) {
      setSession(LEDGER_PREVIEW_SESSION);
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
