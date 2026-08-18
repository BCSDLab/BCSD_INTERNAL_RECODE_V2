import { useSyncExternalStore } from 'react';
import { getSession, getSessionStatus, subscribe } from '@/lib/auth/session-store';

export function useSession() {
  const session = useSyncExternalStore(subscribe, getSession, () => null);
  const status = useSyncExternalStore(subscribe, getSessionStatus, () => 'loading' as const);
  return { session, status };
}
