import { expect, test } from '@playwright/test';

import { installApiMocks, trackPageDetail } from './mocks';

test('protected deep link waits for session restoration and survives reload', async ({ page }) => {
  await installApiMocks(page);
  await page.route('**/v1/auth/reissue', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    await route.fulfill({ json: { accessToken: 'mock-access-token', tokenType: 'Bearer', expiresIn: 3600 } });
  });
  await page.goto('/games/1');
  await expect(page.locator('aside', { hasText: 'BCSD Internal' })).toBeVisible();
  await expect(page).toHaveURL(/\/games\/1$/);
  await page.reload();
  await expect(page.locator('aside', { hasText: 'BCSD Internal' })).toBeVisible();
  await expect(page).toHaveURL(/\/games\/1$/);
});

test('unauthenticated deep link redirects to login', async ({ page }) => {
  await page.route('**/v1/**', (route) => route.fulfill({ status: 401, json: { message: 'Unauthorized' } }));
  await page.goto('/members');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('button', { name: '로그인', exact: true })).toBeVisible();
});

test('client navigation does not restore the session again', async ({ page }) => {
  await installApiMocks(page);
  let calls = 0;
  await page.route('**/v1/auth/reissue', async (route) => {
    calls++;
    await route.fulfill({ json: { accessToken: 'mock-access-token', tokenType: 'Bearer', expiresIn: 3600 } });
  });
  await page.goto('/members');
  await page.getByRole('link', { name: /게임/ }).click();
  await expect(page).toHaveURL(/\/games$/);
  await expect(page.locator('aside', { hasText: 'BCSD Internal' })).toBeVisible();
  expect(calls).toBe(1);
});

test('password reset token is preserved and sent to the API', async ({ page }) => {
  let token: string | undefined;
  await page.route('**/v1/auth/password/reset-requests/validate', async (route) => {
    token = route.request().postDataJSON().token;
    await route.fulfill({ status: 400, json: { message: '테스트 토큰' } });
  });
  await page.goto('/reset-password?token=reset-test-token');
  await expect.poll(() => token).toBe('reset-test-token');
  await expect(page).toHaveURL(/token=reset-test-token/);
});

test('expired access token is refreshed and the API request is retried', async ({ page }) => {
  await installApiMocks(page);
  let reissues = 0;
  const tokens: Array<string | undefined> = [];
  await page.route('**/v1/auth/reissue', async (route) => {
    reissues++;
    await route.fulfill({ json: { accessToken: `token-${reissues}`, tokenType: 'Bearer', expiresIn: 3600 } });
  });
  await page.route('**/v1/admin/track-pages', async (route) => {
    tokens.push(route.request().headers().authorization);
    if (tokens.length === 1) {
      await route.fulfill({ status: 401, json: { message: 'Expired' } });
    } else {
      await route.fallback();
    }
  });
  await page.goto('/members');
  await expect.poll(() => tokens.length).toBe(2);
  expect(tokens).toEqual(['Bearer token-1', 'Bearer token-2']);
  expect(reissues).toBe(2);
  await expect(page.locator('aside', { hasText: 'BCSD Internal' })).toBeVisible();
});

test('failed token refresh clears the session and redirects to login', async ({ page }) => {
  await installApiMocks(page);
  let reissues = 0;
  await page.route('**/v1/auth/reissue', async (route) => {
    reissues++;
    await route.fulfill(
      reissues === 1
        ? { json: { accessToken: 'token-1', tokenType: 'Bearer', expiresIn: 3600 } }
        : { status: 401, json: { message: 'Expired session' } },
    );
  });
  await page.route('**/v1/admin/track-pages', (route) => route.fulfill({ status: 401, json: { message: 'Expired' } }));
  await page.goto('/members');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('button', { name: '로그인', exact: true })).toBeVisible();
  expect(reissues).toBe(2);
});

test.describe('트랙 전환', () => {
  const backend = {
    ...trackPageDetail,
    id: 2,
    trackId: 2,
    trackCode: 'BACKEND',
    slug: 'backend',
    displayName: '백엔드',
    tagline: '서버를 만듭니다',
    studyPoints: [{ title: '서버 설계', description: 'API를 만든다', iconImageUrl: null }],
  };

  test('다음 트랙을 기다리는 동안 화면을 유지하고 저장은 기존 트랙에만 보낸다', async ({ page }) => {
    await installApiMocks(page);
    await page.clock.install();
    const gate = Promise.withResolvers<void>();
    const saves: string[] = [];
    await page.route('**/v1/admin/track-pages/2', async (route) => {
      if (route.request().method() === 'PUT') saves.push(new URL(route.request().url()).pathname);
      await gate.promise;
      await route.fulfill({ json: backend });
    });
    await page.route('**/v1/admin/track-pages/1', async (route) => {
      if (route.request().method() !== 'PUT') return route.fallback();
      saves.push(new URL(route.request().url()).pathname);
      await route.fulfill({ json: { ...trackPageDetail, ...route.request().postDataJSON() } });
    });
    await page.goto('/tracks/1');
    await expect(page.getByRole('heading', { name: '프론트엔드 트랙' })).toBeVisible();
    const mainHeight = await page.locator('main').evaluate((element) => element.scrollHeight);
    try {
      await page.getByRole('button', { name: '백엔드', exact: true }).click();
      await expect(page.getByRole('status').filter({ hasText: '트랙 전환 중…' })).toHaveText('트랙 전환 중…');
      await page.clock.runFor(1500);
      await expect(page.getByRole('heading', { name: '프론트엔드 트랙' })).toBeVisible();
      await expect(page.getByText('컴포넌트 설계', { exact: true })).toBeVisible();
      await expect(page.getByText('불러오는 중…', { exact: true })).toHaveCount(0);
      expect(await page.locator('main').evaluate((element) => element.scrollHeight)).toBe(mainHeight);
      await page.getByLabel(/^트랙명/).fill('전환 중 프론트');
      await page.clock.runFor(750);
      await expect.poll(() => saves).toEqual(['/v1/admin/track-pages/1']);
      // 다음 화면 직전에 예약한 자동 저장이 새 트랙으로 전송되면 안 된다.
      await page.getByLabel(/^트랙명/).fill('전환 직전의 이전 트랙 입력');
      gate.resolve();
      await expect(page.getByRole('heading', { name: '백엔드 트랙' })).toBeVisible();
      await expect(page.getByLabel(/^트랙명/)).toHaveValue('백엔드');
      await expect(page.getByText('서버 설계', { exact: true })).toBeVisible();
      await expect(page.getByText('컴포넌트 설계', { exact: true })).toHaveCount(0);
      await page.clock.runFor(750);
      expect(saves).toEqual(['/v1/admin/track-pages/1']);
      await page.getByLabel('한 줄 소개').fill('새 백엔드 설명');
      await page.clock.runFor(750);
      await expect.poll(() => saves).toEqual(['/v1/admin/track-pages/1', '/v1/admin/track-pages/2']);
    } finally {
      gate.resolve();
    }
  });

  test('빠르게 전환하면 늦게 도착한 이전 요청이 선택한 트랙을 덮어쓰지 않는다', async ({ page }) => {
    await installApiMocks(page);
    const second = Promise.withResolvers<void>();
    const third = Promise.withResolvers<void>();
    await page.route('**/v1/admin/track-pages/2', async (route) => {
      await second.promise;
      await route.fulfill({ json: backend });
    });
    await page.route('**/v1/admin/track-pages/3', async (route) => {
      await third.promise;
      await route.fulfill({
        json: { ...backend, id: 3, trackId: 3, trackCode: 'DESIGN', slug: 'design', displayName: '디자인' },
      });
    });
    await page.goto('/tracks/1');
    await expect(page.getByRole('heading', { name: '프론트엔드 트랙' })).toBeVisible();
    try {
      await page.getByRole('button', { name: '백엔드', exact: true }).click();
      await expect(page.getByRole('status').filter({ hasText: '트랙 전환 중…' })).toHaveText('트랙 전환 중…');
      await page.getByRole('button', { name: /디자인/ }).click();
      third.resolve();
      await expect(page.getByRole('heading', { name: '디자인 트랙' })).toBeVisible();
      second.resolve();
      await expect(page).toHaveURL(/\/tracks\/3$/);
      await expect(page.getByRole('heading', { name: '디자인 트랙' })).toBeVisible();
    } finally {
      second.resolve();
      third.resolve();
    }
  });

  test('방문한 트랙으로 돌아오면 캐시를 즉시 표시하고 새 응답은 뒤에서 갱신한다', async ({ page }) => {
    await installApiMocks(page);
    await page.route('**/v1/admin/track-pages/2', (route) => route.fulfill({ json: backend }));
    await page.goto('/tracks/1');
    await expect(page.getByRole('heading', { name: '프론트엔드 트랙' })).toBeVisible();
    await page.getByRole('button', { name: '백엔드', exact: true }).click();
    await expect(page.getByRole('heading', { name: '백엔드 트랙' })).toBeVisible();
    const gate = Promise.withResolvers<void>();
    await page.route('**/v1/admin/track-pages/1', async (route) => {
      await gate.promise;
      await route.fulfill({ json: trackPageDetail });
    });
    try {
      await page.getByRole('button', { name: '프론트엔드', exact: true }).click();
      await expect(page.getByRole('heading', { name: '프론트엔드 트랙' })).toBeVisible();
      await expect(page.getByLabel(/^트랙명/)).toHaveValue('프론트엔드');
      await expect(page.getByText('컴포넌트 설계', { exact: true })).toBeVisible();
      await expect(page.getByText('불러오는 중…', { exact: true })).toHaveCount(0);
    } finally {
      gate.resolve();
    }
  });
});

test('사이드바에서 트랙에 처음 진입해도 상세 데이터가 준비될 때까지 이전 화면을 유지한다', async ({ page }) => {
  await installApiMocks(page);
  await page.clock.install();
  const requested = Promise.withResolvers<void>();
  const gate = Promise.withResolvers<void>();
  await page.route('**/v1/admin/track-pages/1', async (route) => {
    requested.resolve();
    await gate.promise;
    await route.fulfill({ json: trackPageDetail });
  });
  await page.goto('/members');
  await expect(page.getByRole('heading', { name: '부원 명부' })).toBeVisible();
  try {
    await page.getByRole('link', { name: /트랙 페이지/ }).click();
    await requested.promise;
    await page.clock.runFor(1500);
    await expect(page.getByRole('heading', { name: '부원 명부' })).toBeVisible();
    gate.resolve();
    await expect(page.getByRole('heading', { name: '프론트엔드 트랙' })).toBeVisible();
    await expect(page).toHaveURL(/\/tracks\/1$/);
  } finally {
    gate.resolve();
  }
});

test('로그인하지 않았으면 트랙 loader가 상세 데이터를 요청하기 전에 로그인으로 이동한다', async ({ page }) => {
  const detailRequests: string[] = [];
  await page.route('**/v1/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (/\/track-pages\/\d+$/.test(pathname)) detailRequests.push(pathname);
    await route.fulfill({ status: 401, json: { message: 'Unauthorized' } });
  });
  await page.goto('/tracks/1');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('button', { name: '로그인', exact: true })).toBeVisible();
  expect(detailRequests).toEqual([]);
});
