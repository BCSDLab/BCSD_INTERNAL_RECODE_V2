import { expect, test, type Page } from '@playwright/test';
import { installApiMocks } from './mocks';

/**
 * shadcn/Base UI 전환 회귀 하네스. 관리자 화면 전체를 라이트/다크로 캡처해서
 * 각 단계(Phase)가 디자인을 안 건드렸는지 픽셀 단위로 확인한다.
 *
 * (auth) 라우트(로그인/초기설정/비밀번호 재설정)는 src/components/auth/*를 쓰고
 * 이번 마이그레이션 대상(src/components/ui/*)이 아니라서 커버리지에서 뺐다.
 */
const PAGES: { name: string; path: string }[] = [
  { name: 'tracks', path: '/tracks' },
  { name: 'track-detail', path: '/tracks/1' },
  { name: 'curriculums', path: '/curriculums' },
  { name: 'activities', path: '/activities' },
  { name: 'games', path: '/games' },
  { name: 'game-detail', path: '/games/1' },
  { name: 'home', path: '/home' },
  { name: 'members', path: '/members' },
  { name: 'profile', path: '/profile' },
  { name: 'reservations', path: '/reservations' },
];

const THEMES = ['light', 'dark'] as const;

async function gotoAsAdmin(page: Page, path: string) {
  await installApiMocks(page);
  await page.clock.install({ time: new Date('2026-01-01T09:00:00+09:00') });
  await page.goto(path);
  await page.locator('aside', { hasText: 'BCSD Internal' }).waitFor();
  // react-query 목업 응답이 그려질 시간을 준다("불러오는 중…" 등 로딩 상태가 남지 않도록).
  await page.waitForTimeout(300);
}

for (const theme of THEMES) {
  test.describe(`admin pages (${theme})`, () => {
    test.use({
      colorScheme: theme === 'dark' ? 'dark' : 'light',
    });

    for (const { name, path } of PAGES) {
      test(`${name}`, async ({ page }) => {
        await page.addInitScript(
          (t) => window.localStorage.setItem('bcsd-internal-theme', t),
          theme,
        );
        await gotoAsAdmin(page, path);
        await expect(page).toHaveScreenshot(`${name}-${theme}.png`, { fullPage: true });
      });
    }
  });
}
