import { expect, test } from '@playwright/test';

import { installApiMocks } from './mocks';

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
