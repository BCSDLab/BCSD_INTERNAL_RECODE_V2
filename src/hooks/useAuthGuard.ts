'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from '@/lib/auth/use-session';

/**
 * 관리 화면 레이아웃에서 호출한다. 세션 부트스트랩이 끝났는데 세션이 없으면 로그인으로
 * 보낸다. 실제 ROLE_ADMIN 검증은 서버가 요청마다 다시 하므로, 여기서는 화면 접근을 위한
 * 최소한의 라우팅만 담당한다.
 *
 * 초기 설정을 마치지 않은 계정(PENDING_SETUP)은 로그인 화면이 setPendingSetup으로
 * /initial-setup으로 보내므로(lib/auth/pending-session) 여기서 따로 다루지 않는다.
 */
export function useAuthGuard() {
  const { session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'ready' && !session) {
      router.replace('/login');
    }
  }, [status, session, router]);

  return { session, status };
}
