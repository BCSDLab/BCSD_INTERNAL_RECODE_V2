import { type Session } from './session-store';

const LEDGER_PREVIEW_ENABLED = import.meta.env.DEV && import.meta.env.VITE_LEDGER_PREVIEW === 'true';

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
  },
};

/**
 * 로그인 없이 가짜 세션으로 여는 화면(개발용 편의). 데이터를 mock으로 줄지는 세션이 아니라
 * entities/finance/api/dues/mock-switch가 정한다(기본 live). 가짜 토큰은 실제 API에서 401이므로 `VITE_LEDGER_API=mock`과 함께 쓴다.
 */
const PREVIEW_PATHS = ['/ledger'];

export function isLedgerPreviewPath(pathname: string) {
  return LEDGER_PREVIEW_ENABLED && PREVIEW_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}
