import type { MemberSummary } from '@/lib/api/types';

export interface Session {
  accessToken: string;
  member: MemberSummary;
}

export type SessionStatus = 'loading' | 'ready';

type Listener = () => void;

let session: Session | null = null;
let status: SessionStatus = 'loading';
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function getSession(): Session | null {
  return session;
}

export function getSessionStatus(): SessionStatus {
  return status;
}

export function setSession(next: Session | null) {
  session = next;
  status = 'ready';
  emit();
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
