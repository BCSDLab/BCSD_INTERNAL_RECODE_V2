/**
 * 회비·장부 API 스위치(iOS로 치면 Live/Mock Repository를 고르는 DI 플래그).
 * 백엔드가 아직 이 엔드포인트를 배포하지 않아 기본값은 mock이다. 붙일 때는 `NEXT_PUBLIC_LEDGER_API=live`.
 * 로그인 세션과 무관하게 동작해야 한다 — 실제 관리자로 로그인해도 없는 API를 부르면 404가 난다.
 */
export const USE_LEDGER_MOCK = process.env.NEXT_PUBLIC_LEDGER_API !== 'live';
