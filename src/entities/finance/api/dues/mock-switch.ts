/**
 * 회비·장부 API 스위치(iOS로 치면 Live/Mock Repository를 고르는 DI 플래그).
 * 백엔드가 배포돼 기본값은 실제 API(live)다. 로컬 시연용 mock "서버"는 `VITE_LEDGER_API=mock`일 때만 쓴다.
 * 로그인 세션과 무관하게 동작한다 — 운영 배포 설정에는 이 값이 없으므로 운영은 항상 live다.
 */
export const USE_LEDGER_MOCK = import.meta.env.VITE_LEDGER_API === 'mock';

/**
 * Slack 알림 발송 스위치. 회비·장부와 따로 둔다 — 회비·장부를 live로 바꿔도 발송은 실제 Slack으로
 * 나가지 않게 기본 mock이다. 실제 발송은 `VITE_DUES_NOTIFICATION_API=live`.
 */
export const USE_DUES_NOTIFICATION_MOCK = import.meta.env.VITE_DUES_NOTIFICATION_API !== 'live';
