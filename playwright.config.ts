import { defineConfig, devices } from '@playwright/test';

/**
 * 디자인 시스템 마이그레이션(shadcn/Base UI 전환) 동안 "디자인이 그대로인지"를 스크린샷으로
 * 검증하기 위한 회귀 하네스. 백엔드 없이 tests/mocks.ts가 모든 /v1/* 요청을 가로챈다.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3100',
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm exec next start -p 3100',
    url: 'http://127.0.0.1:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  expect: {
    // 0.01(전체 픽셀의 1%)은 느슨했다 — 모달 안 제목 한 줄이 흰 배경에 흰 글자로 안 보이는
    // 실제 버그가 이 임계값 밑에 숨어 통과된 적이 있다(모달이 풀페이지 스크린샷의 작은
    // 영역이라 전체 대비 비중이 작았다). 0.001로 좁혀서 이런 국소적 회귀도 잡히게 한다.
    toHaveScreenshot: { maxDiffPixelRatio: 0.001, animations: 'disabled' },
  },
});
