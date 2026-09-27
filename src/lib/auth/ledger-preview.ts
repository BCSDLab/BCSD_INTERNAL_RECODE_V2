import { getSession, type Session } from '@/lib/auth/session-store';

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

/** 로그인 없이 가짜 세션으로 여는 화면. /members는 api/member/mock 데이터로 그린다. */
const PREVIEW_PATHS = ['/ledger', '/members'];

export function isLedgerPreviewPath(pathname: string) {
  return LEDGER_PREVIEW_ENABLED && PREVIEW_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/** 지금 세션이 미리보기 가짜 세션인지 — 도메인 api.ts가 실제 요청 대신 mock으로 돌릴 때 쓴다. */
export function isPreviewSession() {
  return LEDGER_PREVIEW_ENABLED && getSession()?.accessToken === LEDGER_PREVIEW_SESSION.accessToken;
}
