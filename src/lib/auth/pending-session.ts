import type { MemberSummary } from '@/api/auth/types';

export interface PendingSetupSession {
  accessToken: string;
  member: MemberSummary;
}

let pendingSetup: PendingSetupSession | null = null;

export function setPendingSetup(session: PendingSetupSession) {
  pendingSetup = session;
}

export function getPendingSetup() {
  return pendingSetup;
}

export function clearPendingSetup() {
  pendingSetup = null;
}
