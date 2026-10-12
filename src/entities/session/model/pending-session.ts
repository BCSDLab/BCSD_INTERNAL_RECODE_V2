import { type MemberSummary } from '@/entities/member/@x/session';

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
