/**
 * 회비·장부 API 스위치(iOS로 치면 Live/Mock Repository를 고르는 DI 플래그).
 * 백엔드가 아직 이 엔드포인트를 배포하지 않아 기본값은 mock이다. 붙일 때는 `NEXT_PUBLIC_LEDGER_API=live`.
 * 로그인 세션과 무관하게 동작해야 한다 — 실제 관리자로 로그인해도 없는 API를 부르면 404가 난다.
 */
export const USE_LEDGER_MOCK = process.env.NEXT_PUBLIC_LEDGER_API !== 'live';

/**
 * Slack 알림 발송 스위치. 회비·장부와 따로 둔다 — 회비·장부를 live로 바꿔도 발송은 실제 Slack으로
 * 나가지 않게 기본 mock이다. 실제 발송은 `NEXT_PUBLIC_DUES_NOTIFICATION_API=live`.
 */
export const USE_DUES_NOTIFICATION_MOCK = process.env.NEXT_PUBLIC_DUES_NOTIFICATION_API !== 'live';
