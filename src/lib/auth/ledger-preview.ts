import type { Session } from '@/lib/auth/session-store';

const LEDGER_PREVIEW_ENABLED =
  process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_LEDGER_PREVIEW === 'true';

export const LEDGER_PREVIEW_SESSION: Session = {
  accessToken: 'ledger-local-preview',
  member: {
    id: 0,
    name: '장부관리자',
    studentNumber: 'LOCAL',
    track: 'IOS',
    generation: '-',
    memberType: 'REGULAR',
    university: '-',
    role: 'ADMIN',
    phoneNumber: '010-1234-5678',
    slackId: 'U_LEDGER_ADMIN',
  },
};

export function isLedgerPreviewPath(pathname: string) {
  return LEDGER_PREVIEW_ENABLED && (pathname === '/ledger' || pathname.startsWith('/ledger/'));
}
