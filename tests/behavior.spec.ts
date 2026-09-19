import { expect, test } from '@playwright/test';
import { installApiMocks } from './mocks';

/**
 * visual.spec.ts는 "그림이 그대로인가"만 본다. 여기는 각 Phase가 실제로 바꾸는
 * 상호작용(클릭·비활성화·모달 열고닫힘)이 shadcn/Base UI 전환 뒤에도 그대로
 * 동작하는지를 확인한다. 화면 전수 조사가 아니라, 그 Phase가 건드린 컴포넌트의
 * 핵심 동작 한두 개만 고른다.
 */

async function gotoAsAdmin(page: import('@playwright/test').Page, path: string) {
  await installApiMocks(page);
  await page.clock.install({ time: new Date('2026-01-01T09:00:00+09:00') });
  await page.goto(path);
  await page.locator('aside', { hasText: 'BCSD Internal' }).waitFor();
}

test.describe('Button (Base UI + cva 전환)', () => {
  test('ButtonLink는 render prop으로 실제 <a>를 그린다', async ({ page }) => {
    await gotoAsAdmin(page, '/tracks');

    const link = page.getByRole('link', { name: /랜딩에서 보기/ });
    await expect(link).toHaveAttribute('href', 'https://bcsdlab.com');
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noreferrer');
  });

  test('저장 중에는 버튼이 비활성화되어 중복 클릭이 막히고, 끝나면 모달이 닫힌다', async ({ page }) => {
    await gotoAsAdmin(page, '/members');

    let createCalls = 0;
    await page.route('**/v1/admin/members', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.fallback();
        return;
      }
      createCalls += 1;
      // mutation.isPending 구간을 눈으로 볼 수 있게 응답을 일부러 늦춘다.
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.fulfill({ json: { id: 99, studentNumber: '2026000000' } });
    });

    await page.getByRole('button', { name: '+ 부원 추가' }).click();
    const dialogTitle = page.getByText('새 부원');
    await expect(dialogTitle).toBeVisible();

    await page.getByPlaceholder('홍길동').fill('테스트회원');
    await page.getByPlaceholder('예: 24-상').fill('24');
    await page.getByPlaceholder('2024136000').fill('2026000000');
    await page.getByPlaceholder('name@gmail.com').fill('test@example.com');

    const saveButton = page.getByRole('button', { name: '저장' });
    await saveButton.click();

    await expect(saveButton).toBeDisabled();
    // 비활성화된 동안의 재클릭은 Base UI Button의 disabled 가드가 막아야 한다.
    await saveButton.click({ force: true });
    expect(createCalls).toBe(1);

    await expect(dialogTitle).toBeHidden({ timeout: 3000 });
  });
});
