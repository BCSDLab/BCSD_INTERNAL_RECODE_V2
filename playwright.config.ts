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
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled' },
  },
});
