import { expect, test, type Page } from '@playwright/test';

import { installApiMocks, memberDirectory, trackPageDetail } from './mocks';

/**
 * visual.spec.ts는 "그림이 그대로인가"만 본다. 여기는 각 Phase가 실제로 바꾸는
 * 상호작용(클릭·비활성화·모달 열고닫힘)이 shadcn/Base UI 전환 뒤에도 그대로
 * 동작하는지를 확인한다. 화면 전수 조사가 아니라, 그 Phase가 건드린 컴포넌트의
 * 핵심 동작 한두 개만 고른다.
 */

async function gotoAsAdmin(page: Page, path: string) {
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

test.describe('Modal (Base UI Dialog 전환)', () => {
  test('제목 글자색이 배경과 실제로 구분된다 — Dialog.Portal이 AdminLayout의 text-text 밖에 그려져 흰 배경에 흰 글자가 됐던 회귀', async ({
    page,
  }) => {
    await gotoAsAdmin(page, '/members');
    await page.getByRole('button', { name: '+ 부원 추가' }).click();
    const title = page.getByText('새 부원');
    await expect(title).toBeVisible();

    const color = await title.evaluate((el) => getComputedStyle(el).color);
    expect(color).not.toBe('rgb(255, 255, 255)');
  });

  test('열리면 포커스가 다이얼로그 안으로 이동한다(포커스 트랩) — 이전 구현엔 없던 동작', async ({ page }) => {
    await gotoAsAdmin(page, '/members');
    await page.getByRole('button', { name: '+ 부원 추가' }).click();
    await expect(page.getByText('새 부원')).toBeVisible();

    // DOM 순서상 첫 tabbable 요소는 헤더의 닫기 버튼이다.
    await expect(page.getByRole('button', { name: '닫기' })).toBeFocused();
  });

  test('ESC를 누르면 닫힌다 — 이전 구현(ui/modal.tsx)엔 없던 동작', async ({ page }) => {
    await gotoAsAdmin(page, '/members');
    await page.getByRole('button', { name: '+ 부원 추가' }).click();

    const dialogTitle = page.getByText('새 부원');
    await expect(dialogTitle).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialogTitle).toBeHidden();
  });

  test('오버레이(바깥) 클릭으로 닫힌다', async ({ page }) => {
    await gotoAsAdmin(page, '/members');
    await page.getByRole('button', { name: '+ 부원 추가' }).click();

    const dialogTitle = page.getByText('새 부원');
    await expect(dialogTitle).toBeVisible();
    await page.mouse.click(10, 10);
    await expect(dialogTitle).toBeHidden();
  });

  test('예약 상세 모달(modal-shell.tsx)도 ESC로 닫힌다', async ({ page }) => {
    await gotoAsAdmin(page, '/reservations');
    await page.getByText('눌러서 상세 보기 · 취소').click();

    const detailTitle = page.getByText('예약 상세');
    await expect(detailTitle).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(detailTitle).toBeHidden();
  });
});

test.describe('Chip (Base UI Toggle 전환)', () => {
  test('키보드로 포커스해 Enter로 누를 수 있다 — 이전엔 <span>이라 탭도, 키보드 조작도 안 됐다', async ({ page }) => {
    await gotoAsAdmin(page, '/activities');

    // 활동 타임라인의 연도 필터 칩. '전체'가 기본 선택이라 연도 칩은 눌리지 않은 상태로 시작한다.
    const chip = page.getByRole('button', { name: /^20\d\d/ }).first();
    await expect(chip).toBeVisible();
    await expect(chip).toHaveAttribute('aria-pressed', 'false');

    await chip.focus();
    await expect(chip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(chip).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('Select (네이티브 select 대체)', () => {
  test('트리거를 클릭해 팝업에서 옵션을 고르면 표시값이 바뀐다', async ({ page }) => {
    await gotoAsAdmin(page, '/members');
    await page.getByRole('button', { name: '+ 부원 추가' }).click();
    await expect(page.getByText('새 부원')).toBeVisible();

    const trackTrigger = page.getByRole('combobox', { name: '트랙 *' });
    await expect(trackTrigger).toHaveText('FrontEnd');

    await trackTrigger.click();
    await page.getByRole('option', { name: 'BackEnd' }).click();
    await expect(trackTrigger).toHaveText('BackEnd');
  });
});

test.describe('Checkbox (네이티브 checkbox 대체)', () => {
  test('클릭하면 체크 상태가 바뀌고, 선택된 인원 수가 반영된다', async ({ page }) => {
    await gotoAsAdmin(page, '/tracks/1');
    await page.getByRole('button', { name: '+ 부원 배정 · 명부 검색' }).click();
    await page.getByRole('heading', { name: '부원 배정' }).waitFor();
    await page.getByText('이영희').waitFor();

    const checkbox = page.getByRole('checkbox');
    await expect(checkbox).toHaveAttribute('aria-checked', 'false');
    await checkbox.click();
    await expect(checkbox).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByText('1명 선택됨')).toBeVisible();
  });
});

test.describe('Tabs (games/[gameId] 탭 전환)', () => {
  test('탭을 클릭하면 패널이 바뀌고 이전 탭 내용은 언마운트된다', async ({ page }) => {
    await gotoAsAdmin(page, '/games/1');
    await expect(page.getByText('제작 트랙')).toBeVisible();

    await page.getByRole('tab', { name: '등급정보' }).click();
    await expect(page.getByText('제작 트랙')).toBeHidden();
    await expect(page.getByText('내용정보 표시')).toBeVisible();
  });
});

test.describe('RichTextEditor 툴바 (Base UI Toggle 전환)', () => {
  test('굵게 버튼을 누르면 aria-pressed가 바뀐다 — 이전엔 <button>이라 상태가 시각적으로만 있었다', async ({
    page,
  }) => {
    await gotoAsAdmin(page, '/games/1');
    await page.getByRole('tab', { name: '상세설명' }).click();
    const content = page.getByText('설명입니다');
    await content.waitFor();

    // 커서만 놓고 누르면 "다음 입력부터 굵게"라 문서가 안 바뀌어 리렌더가 안 된다 —
    // 실제로 굵게 적용되는 걸(선택 영역에 적용) 보려면 텍스트를 먼저 선택해야 한다.
    await content.click();
    await page.keyboard.press('ControlOrMeta+A');

    const boldButton = page.getByRole('button', { name: 'B', exact: true });
    await expect(boldButton).toHaveAttribute('aria-pressed', 'false');
    await boldButton.click();
    await expect(boldButton).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('Switch (활동 여부 · 공개 토글 · 모집 상태 통일)', () => {
  test('인명부 활동 스위치를 누르면 PATCH .../active가 정확한 값으로 나간다', async ({ page }) => {
    await gotoAsAdmin(page, '/members');

    let requestedActive: unknown;
    await page.route('**/v1/admin/members/*/active', async (route) => {
      requestedActive = route.request().postDataJSON().active;
      await route.fulfill({ status: 204 });
    });

    // 이름·기수 등 다른 텍스트와 안 겹치게 접근 가능한 이름(aria-checked 있는 switch)으로 찾는다.
    const switchControl = page.getByRole('switch').first();
    await expect(switchControl).toHaveAttribute('aria-checked', 'true');
    await switchControl.click();

    expect(requestedActive).toBe(false);
  });

  test('공개 토글(카드 전체가 스위치)을 누르면 상태가 바뀐다', async ({ page }) => {
    await gotoAsAdmin(page, '/home');

    const recruitSwitch = page.getByRole('switch');
    await expect(recruitSwitch).toHaveAttribute('aria-checked', 'true');
    await recruitSwitch.click();
    await expect(recruitSwitch).toHaveAttribute('aria-checked', 'false');
  });
});

test.describe('장부 거래내역 가져오기 (실제 API 계약)', () => {
  test('미리보기의 occurredAt을 초까지 그대로 커밋에 돌려보낸다', async ({ page }) => {
    // 서버는 커밋 때 rowKey를 초 단위 시각으로 다시 계산한다 — 초를 버리면 400 IMPORT_ROW_KEY_MISMATCH.
    // 공통 목업(**/v1/**) 뒤에 등록해야 이 라우트가 먼저 잡힌다.
    await installApiMocks(page);
    await page.route('**/v1/admin/ledger/entries', (route) => route.fulfill({ json: { entries: [] } }));
    await page.route('**/v1/admin/ledger/imports/preview', (route) =>
      route.fulfill({
        json: {
          fileName: 'shinhan.xlsx',
          transactions: [
            {
              rowKey: 'row-1',
              occurredAt: '2026-09-10T13:05:47',
              type: 'DEPOSIT',
              counterparty: '합성입금',
              amount: 20000,
              bankBalance: 120000,
              suggestedCategory: 'DUES',
              suggestedMemberId: null,
            },
          ],
        },
      }),
    );
    let committed: { transactions: { occurredAt: string }[] } | undefined;
    await page.route('**/v1/admin/ledger/imports', async (route) => {
      committed = route.request().postDataJSON();
      await route.fulfill({ json: { createdCount: 1, skippedDuplicateCount: 0 } });
    });

    await page.goto('/ledger');
    await page.getByRole('button', { name: '거래내역 가져오기' }).click();
    const flow = page.locator('[aria-label="신한 거래내역 가져오기"]');
    await flow.locator('input[type="file"][accept=".xlsx"]').setInputFiles({
      name: 'shinhan.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from('x'),
    });
    await flow.getByRole('button', { name: '다음' }).click();
    // 화면은 분까지만 보인다.
    await expect(flow.getByText('09.10 13:05')).toBeVisible();
    await flow.getByRole('button', { name: '다음' }).click();
    await flow.getByRole('button', { name: '저장' }).click();

    await expect.poll(() => committed?.transactions[0]?.occurredAt).toBe('2026-09-10T13:05:47');
  });
});

test.describe('장부 증빙 링크 (구글 드라이브)', () => {
  test('드라이브가 아닌 링크는 막고, 추가한 링크를 evidenceLinks로 PATCH한다', async ({ page }) => {
    const entry = {
      id: 7,
      occurredAt: '2026-09-12T18:22:59',
      type: 'WITHDRAWAL',
      category: 'OPERATION',
      counterparty: '합성가게',
      description: '비품',
      note: '',
      amount: 5000,
      balance: 150300,
      source: null,
      linkStatus: 'NONE',
      duesLink: null,
      evidences: [{ id: 1, url: 'https://drive.google.com/file/d/existing/view', label: null }],
    };
    await installApiMocks(page);
    await page.route('**/v1/admin/ledger/entries', (route) => route.fulfill({ json: { entries: [entry] } }));
    let patched: { evidenceLinks: { url: string; label?: string }[] } | undefined;
    await page.route('**/v1/admin/ledger/entries/7', async (route) => {
      patched = route.request().postDataJSON();
      await route.fulfill({ json: entry });
    });

    await page.goto('/ledger');
    await page.getByText('합성가게').first().click();
    // 이름이 없는 증빙은 "증빙 1"로 부르고 새 탭으로 연다.
    const existing = page.getByRole('link', { name: '증빙 1' });
    await expect(existing).toHaveAttribute('target', '_blank');
    await expect(existing).toHaveAttribute('rel', 'noopener noreferrer');

    await page.getByRole('button', { name: '수정', exact: true }).click();
    await page.getByLabel('증빙 링크').fill('https://example.com/receipt');
    await page.getByRole('button', { name: /^추가/ }).click();
    await expect(page.getByText('구글 드라이브 링크만 첨부할 수 있습니다.')).toBeVisible();

    await page.getByLabel('증빙 링크').fill('  https://drive.google.com/file/d/new-receipt/view  ');
    await page.getByLabel('링크 이름(선택)').fill('영수증');
    await page.getByRole('button', { name: /^추가/ }).click();
    await expect(page.getByRole('link', { name: '영수증' })).toBeVisible();
    await page.getByRole('button', { name: '저장', exact: true }).click();

    await expect
      .poll(() => patched?.evidenceLinks)
      .toEqual([
        { url: 'https://drive.google.com/file/d/existing/view' },
        { url: 'https://drive.google.com/file/d/new-receipt/view', label: '영수증' },
      ]);
  });
});

test.describe('내 정보 Slack ID (읽기 전용)', () => {
  test('응답에 slackId가 없으면 —, 있으면 그 값을 관리자 등록 정보에 보인다', async ({ page }) => {
    // BE 배포 전(필드 없음)에도 깨지지 않아야 한다 — 공통 목업의 /members/me에는 slackId가 없다.
    await gotoAsAdmin(page, '/profile');
    const section = page.getByText('관리자 등록 정보').locator('xpath=ancestor::section[1]');
    await expect(section.getByText('Slack ID')).toBeVisible();
    await expect(section.getByText('—')).toBeVisible();

    await page.route('**/v1/members/me', async (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      await route.fulfill({
        json: {
          id: 1,
          name: '홍길동',
          studentNumber: '2000123456',
          track: 'FRONTEND',
          generation: '10',
          memberType: 'REGULAR',
          university: '한밭대학교',
          role: 'ADMIN',
          email: 'a@example.com',
          phoneNumber: '01012345678',
          githubId: 'octocat',
          status: 'ACTIVE',
          slackId: 'U012ABCDEF',
        },
      });
    });
    await page.reload();
    await page.locator('aside', { hasText: 'BCSD Internal' }).waitFor();
    await expect(page.getByText('U012ABCDEF')).toBeVisible();
  });
});

test.describe('인명부 조회 전환', () => {
  for (const action of ['필터', '검색', '정렬'] as const) {
    test(`${action} 응답을 기다리는 동안 목록·집계·페이지 높이를 유지한다`, async ({ page }) => {
      await gotoAsAdmin(page, '/members');
      const list = page.getByRole('region', { name: '부원 목록' });
      await expect(list.getByRole('cell', { name: /^홍길동/ })).toBeVisible();
      const before = await list.boundingBox();
      const gate = Promise.withResolvers<void>();
      await page.route('**/v1/admin/members?**', async (route) => {
        if (new URL(route.request().url()).searchParams.get('size') === '1') return route.fallback();
        await gate.promise;
        await route.fulfill({
          json: {
            ...memberDirectory,
            members: [memberDirectory.members[1]],
            page: { ...memberDirectory.page, totalElements: 1 },
          },
        });
      });
      try {
        if (action === '필터') {
          await page
            .getByRole('group', { name: '활동 여부' })
            .getByRole('button', { name: /^활동/ })
            .click();
        } else if (action === '검색') {
          await page.getByRole('textbox', { name: '부원 검색' }).fill('김철수');
        } else {
          await list.getByRole('button', { name: /^이름/ }).click();
        }
        await expect(list).toHaveAttribute('aria-busy', 'true');
        await expect(list.getByRole('cell', { name: /^홍길동/ })).toBeVisible();
        await expect(list.getByText('조건에 맞는 부원이 없습니다.')).toHaveCount(0);
        await expect(page.getByRole('group', { name: '활동 여부' }).getByRole('button', { name: /^전체/ })).toHaveText(
          '전체3',
        );
        expect((await list.boundingBox())?.height).toBe(before?.height);
        gate.resolve();
        await expect(list).toHaveAttribute('aria-busy', 'false');
        await expect(list.getByRole('cell', { name: /^홍길동/ })).toHaveCount(0);
        await expect(list.getByRole('cell', { name: '김철수', exact: true })).toBeVisible();
      } finally {
        gate.resolve();
      }
    });
  }

  test('페이지 전환 중 목록을 유지하고 추가 페이지 이동을 막는다', async ({ page }) => {
    await installApiMocks(page);
    const gate = Promise.withResolvers<void>();
    const requestedPages: number[] = [];
    await page.route('**/v1/admin/members?**', async (route) => {
      const params = new URL(route.request().url()).searchParams;
      if (params.get('size') === '1') return route.fallback();
      const number = Number(params.get('page'));
      requestedPages.push(number);
      if (number > 0) await gate.promise;
      await route.fulfill({
        json: {
          ...memberDirectory,
          members: number === 0 ? memberDirectory.members : [memberDirectory.members[1]],
          page: { number, size: 8, totalElements: 24, totalPages: 3 },
        },
      });
    });
    await page.goto('/members');
    const list = page.getByRole('region', { name: '부원 목록' });
    await expect(list.getByRole('cell', { name: /^홍길동/ })).toBeVisible();
    try {
      await list.getByRole('button', { name: '2', exact: true }).click();
      await expect(list).toHaveAttribute('aria-busy', 'true');
      await expect(list.getByRole('button', { name: '3', exact: true })).toBeDisabled();
      await expect(list.getByRole('cell', { name: /^홍길동/ })).toBeVisible();
      gate.resolve();
      await expect(list).toHaveAttribute('aria-busy', 'false');
      await expect(list.getByRole('button', { name: '2', exact: true })).toHaveAttribute('aria-current', 'page');
      expect(requestedPages).toEqual([0, 1]);
    } finally {
      gate.resolve();
    }
  });

  test('조회가 끝난 빈 결과는 이전 목록 대신 빈 상태를 표시한다', async ({ page }) => {
    await gotoAsAdmin(page, '/members');
    await page.route('**/v1/admin/members?**', async (route) => {
      if (new URL(route.request().url()).searchParams.get('size') === '1') return route.fallback();
      await route.fulfill({
        json: { ...memberDirectory, members: [], page: { number: 0, size: 8, totalElements: 0, totalPages: 0 } },
      });
    });
    await page
      .getByRole('group', { name: '활동 여부' })
      .getByRole('button', { name: /^비활동/ })
      .click();
    const list = page.getByRole('region', { name: '부원 목록' });
    await expect(list.getByText('조건에 맞는 부원이 없습니다.')).toBeVisible();
    await expect(list.getByRole('cell', { name: /^홍길동/ })).toHaveCount(0);
  });
});

test.describe('인명부 표시 방식', () => {
  test('페이지당 인원을 고르면 size를 요청하고 URL에 남기며 첫 페이지로 돌아간다', async ({ page }) => {
    await installApiMocks(page);
    const sizes: string[] = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.pathname === '/v1/admin/members' && url.searchParams.get('size') !== '1') {
        sizes.push(url.searchParams.get('size') ?? '');
      }
    });
    await page.goto('/members?page=1');
    await expect.poll(() => sizes.at(-1)).toBe('50');

    await page.getByRole('group', { name: '페이지당 인원' }).getByRole('button', { name: '100', exact: true }).click();
    await expect.poll(() => sizes.at(-1)).toBe('100');
    const params = new URL(page.url()).searchParams;
    expect(params.get('size')).toBe('100');
    expect(params.has('page')).toBe(false);

    await page.goto('/members?size=7');
    await expect.poll(() => sizes.at(-1)).toBe('50');
  });

  test('필터 드롭다운에서 고른 값은 칩으로 보이고 칩을 눌러 해제한다', async ({ page }) => {
    await gotoAsAdmin(page, '/members');
    await page.getByRole('button', { name: '트랙', exact: true }).click();
    await page.getByRole('menuitemcheckbox', { name: /^BackEnd/ }).click();
    await expect.poll(() => new URL(page.url()).searchParams.getAll('track').join()).toContain('BACKEND');
    await page.keyboard.press('Escape');

    const chip = page.getByRole('button', { name: '트랙 BackEnd 필터 해제' });
    await expect(chip).toBeVisible();
    await chip.click();
    await expect(chip).toHaveCount(0);
    await expect.poll(() => new URL(page.url()).searchParams.has('track')).toBe(false);
  });

  test('이름을 누르면 상세 패널이 열리고 관리 동작은 패널을 닫은 뒤 모달을 연다', async ({ page }) => {
    await gotoAsAdmin(page, '/members');
    const name = memberDirectory.members[0].name;
    await page.getByRole('region', { name: '부원 목록' }).getByRole('button', { name, exact: true }).click();

    const drawer = page.getByRole('dialog', { name });
    await expect(drawer.getByText(memberDirectory.members[0].email)).toBeVisible();
    await drawer.getByRole('button', { name: '비밀번호 설정 링크' }).click();
    await expect(drawer).toBeHidden();
    await expect(page.getByRole('dialog').getByRole('button', { name: 'Slack DM 보내기' })).toBeVisible();
  });

  test('열 설정으로 켠 열은 표에 나타나고 새로고침 후에도 유지된다', async ({ page }) => {
    await gotoAsAdmin(page, '/members');
    const list = page.getByRole('region', { name: '부원 목록' });
    await expect(list.getByRole('columnheader', { name: '이메일' })).toHaveCount(0);

    await page.getByRole('button', { name: '열 설정' }).click();
    await page.getByRole('menuitemcheckbox', { name: '이메일' }).click();
    await page.keyboard.press('Escape');
    await expect(list.getByRole('columnheader', { name: '이메일' })).toBeVisible();

    await page.reload();
    await expect(list.getByRole('columnheader', { name: '이메일' })).toBeVisible();
  });
});

test.describe('편집 초안과 서버 캐시', () => {
  test('트랙 저장 응답으로 제목·탭을 갱신하고 재방문 시 저장한 초안을 복원한다', async ({ page }) => {
    await installApiMocks(page);
    await page.clock.install();
    await page.route('**/v1/admin/track-pages/1', async (route) => {
      if (route.request().method() !== 'PUT') return route.fallback();
      await route.fulfill({ json: { ...trackPageDetail, ...route.request().postDataJSON(), slug: 'new-frontend' } });
    });
    await page.route('**/v1/admin/track-pages/2', (route) =>
      route.fulfill({
        json: { ...trackPageDetail, id: 2, trackId: 2, displayName: '백엔드' },
      }),
    );
    await page.route('**/v1/admin/track-pages/1/study-points', (route) => route.fulfill({ json: [] }));
    await page.goto('/tracks/1');
    await page.getByRole('button', { name: '펼치기 ⌄' }).click();
    await page.getByRole('button', { name: '삭제', exact: true }).click();
    await expect(page.getByText('항목이 없습니다.', { exact: true })).toBeVisible();
    await page.getByLabel(/^트랙명/).fill('새 프론트');
    await page.clock.runFor(750);
    await expect(page.getByRole('heading', { name: '새 프론트 트랙' })).toBeVisible();
    await expect(page.getByRole('button', { name: '새 프론트', exact: true })).toBeVisible();
    const gate = Promise.withResolvers<void>();
    await page.route('**/v1/admin/track-pages', async (route) => {
      await gate.promise;
      await route.fallback();
    });
    await page.getByRole('button', { name: '백엔드', exact: true }).click();
    await expect(page.getByRole('heading', { name: '백엔드 트랙' })).toBeVisible();
    await page.route('**/v1/admin/track-pages/1', async (route) => {
      await gate.promise;
      await route.fulfill({ json: trackPageDetail });
    });
    try {
      await page.getByRole('button', { name: '새 프론트', exact: true }).click();
      await expect(page.getByLabel(/^트랙명/)).toHaveValue('새 프론트');
      // 헤더 응답에 오래된 학습 항목이 있어도 다른 섹션의 캐시를 덮어쓰면 안 된다.
      await expect(page.getByText('항목이 없습니다.', { exact: true })).toBeVisible();
    } finally {
      gate.resolve();
    }
  });

  test('학습 항목 수정 직후 삭제하면 대기 중인 저장이 항목을 복원하지 않는다', async ({ page }) => {
    await installApiMocks(page);
    await page.clock.install();
    const saves: unknown[] = [];
    await page.route('**/v1/admin/track-pages/1/study-points', async (route) => {
      const points = route.request().postDataJSON().studyPoints;
      saves.push(points);
      await route.fulfill({ json: points });
    });
    await page.goto('/tracks/1');
    await page.getByRole('button', { name: '펼치기 ⌄' }).click();
    await page.getByPlaceholder('제목', { exact: true }).fill('삭제할 초안');
    await page.getByRole('button', { name: '삭제', exact: true }).click();
    await expect.poll(() => saves).toEqual([[]]);
    await page.clock.runFor(1000);
    expect(saves).toEqual([[]]);
    await expect(page.getByText('항목이 없습니다.', { exact: true })).toBeVisible();
  });

  test('트랙 자동 저장은 응답을 기다린 뒤 다음 요청을 전송한다', async ({ page }) => {
    await installApiMocks(page);
    await page.clock.install();
    const gate = Promise.withResolvers<void>();
    const saves: string[] = [];
    await page.route('**/v1/admin/track-pages/1', async (route) => {
      if (route.request().method() !== 'PUT') return route.fallback();
      const body = route.request().postDataJSON();
      saves.push(body.displayName);
      if (saves.length === 1) await gate.promise;
      await route.fulfill({ json: { ...trackPageDetail, ...body } });
    });
    await page.goto('/tracks/1');
    try {
      await page.getByLabel(/^트랙명/).fill('첫 저장');
      await page.clock.runFor(750);
      await expect.poll(() => saves).toEqual(['첫 저장']);
      await page.getByLabel(/^트랙명/).fill('마지막 저장');
      await page.clock.runFor(750);
      expect(saves).toEqual(['첫 저장']);
      gate.resolve();
      await expect.poll(() => saves).toEqual(['첫 저장', '마지막 저장']);
      await expect(page.getByRole('heading', { name: '마지막 저장 트랙' })).toBeVisible();
      await expect(page.getByLabel(/^트랙명/)).toHaveValue('마지막 저장');
    } finally {
      gate.resolve();
    }
  });

  test('활동 카테고리 전환 시 이전 초안과 자동 저장을 새 편집기로 넘기지 않는다', async ({ page }) => {
    await installApiMocks(page);
    await page.clock.install();
    const saves: string[] = [];
    await page.route('**/v1/admin/activity-categories/*', async (route) => {
      if (route.request().method() !== 'PUT') return route.fallback();
      saves.push(new URL(route.request().url()).pathname);
      await route.fulfill({ status: 204 });
    });
    await page.goto('/activities');
    await expect(page.getByRole('heading', { name: '스터디 활동' })).toBeVisible();
    await page.getByLabel(/헤드라인/).fill('스터디 초안');
    await page.getByRole('button', { name: /^행사/ }).click();
    await expect(page.getByRole('heading', { name: '행사 활동' })).toBeVisible();
    await expect(page.getByLabel(/헤드라인/)).toHaveValue('');
    await page.clock.runFor(1000);
    expect(saves).toEqual([]);
    await page.getByLabel(/헤드라인/).fill('행사 소개');
    await page.clock.runFor(750);
    await expect.poll(() => saves).toEqual(['/v1/admin/activity-categories/2']);
  });
});

test('예약은 현재 화면의 쿼리만 요청하고 내 예약의 과거 목록은 선택한 뒤 요청한다', async ({ page }) => {
  await installApiMocks(page);
  const requests: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.pathname.startsWith('/v1/reservations')) requests.push(url.pathname + url.search);
  });
  await page.goto('/reservations?screen=rules');
  await expect(page.getByRole('tab', { name: '이용 규칙' })).toHaveAttribute('aria-selected', 'true');
  expect(requests).toEqual([]);
  await page.getByRole('tab', { name: '예약 현황' }).click();
  await expect.poll(() => requests.some((url) => url.includes('/daily?'))).toBe(true);
  await expect.poll(() => requests.some((url) => url.includes('/monthly-occupancy?'))).toBe(true);
  await expect.poll(() => requests.some((url) => url.includes('status=upcoming'))).toBe(true);
  expect(requests.some((url) => url.includes('/me/monthly-occupancy'))).toBe(false);
  expect(requests.some((url) => url.includes('status=past'))).toBe(false);
  await page.getByRole('tab', { name: /내 예약/ }).click();
  await expect.poll(() => requests.some((url) => url.includes('/me/monthly-occupancy'))).toBe(true);
  expect(requests.some((url) => url.includes('status=past'))).toBe(false);
  await page.getByRole('button', { name: /^지난 예약/ }).click();
  await expect.poll(() => requests.some((url) => url.includes('status=past'))).toBe(true);
});

test('모집 링크는 서버 응답 후 편집기를 열고 재조회가 편집 중인 초안을 덮어쓰지 않는다', async ({ page }) => {
  await installApiMocks(page);
  let resolveFirst!: () => void;
  const firstResponse = new Promise<void>((resolve) => {
    resolveFirst = resolve;
  });
  let count = 0;
  await page.route('**/v1/admin/recruit-link', async (route) => {
    count++;
    if (count === 1) await firstResponse;
    await route.fulfill({
      json: {
        googleFormUrl: count === 1 ? 'https://forms.gle/server' : 'https://forms.gle/remote',
        isOpen: true,
        closeDate: null,
        closedMessage: '모집 예정',
        updatedAt: '2026-10-12T00:00:00Z',
      },
    });
  });
  await page.goto('/home');
  const input = page.getByPlaceholder('https://forms.gle/…');
  await expect(page.getByText('모집 링크', { exact: true })).toBeVisible();
  await expect(input).toHaveCount(0);
  resolveFirst();
  await expect(input).toHaveValue('https://forms.gle/server');
  await input.fill('https://forms.gle/draft');
  await page.evaluate(() => {
    window.dispatchEvent(new Event('offline'));
    window.dispatchEvent(new Event('online'));
  });
  await expect.poll(() => count).toBeGreaterThan(1);
  await expect(input).toHaveValue('https://forms.gle/draft');
});

test('활동 저장은 목록 갱신이 끝날 때까지 모달을 유지한다', async ({ page }) => {
  await installApiMocks(page);
  let saved = false;
  let refreshing = false;
  let releaseRefresh!: () => void;
  const refresh = new Promise<void>((resolve) => {
    releaseRefresh = resolve;
  });
  const detail = {
    id: 1,
    categoryId: 1,
    year: 2026,
    month: 1,
    title: '신년 스터디',
    summary: '요약',
    content: '',
    externalUrl: null,
    isPublished: true,
    displayOrder: 0,
    imageUrls: [],
  };
  await page.route('**/v1/admin/activities/1', async (route) => {
    if (route.request().method() === 'PUT') saved = true;
    await route.fulfill({ json: detail });
  });
  await page.route('**/v1/admin/activities/1/images', (route) => route.fulfill({ json: {} }));
  await page.route('**/v1/admin/activities?**', async (route) => {
    if (saved) {
      refreshing = true;
      await refresh;
    }
    await route.fulfill({ json: { content: [detail], totalElements: 1, totalPages: 1, number: 0, size: 20 } });
  });
  await page.goto('/activities?categoryId=1');
  await page.getByText('신년 스터디', { exact: true }).click();
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect.poll(() => refreshing).toBe(true);
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('button', { name: '저장', exact: true })).toBeDisabled();
  releaseRefresh();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test.describe('비밀번호 설정 링크 Slack DM', () => {
  test('Slack ID가 없으면 보내기 버튼이 막히고 이유를 보인다', async ({ page }) => {
    await gotoAsAdmin(page, '/members');

    await page
      .getByRole('button', { name: /^관리 메뉴/ })
      .first()
      .click();
    await page.getByRole('menuitem', { name: '비밀번호 설정 링크' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Slack ID가 없어 보낼 수 없습니다.', { exact: false })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Slack DM 보내기' })).toBeDisabled();
  });

  test('보내기를 누르면 해당 부원의 password-link/slack로 POST하고 완료를 알린다', async ({ page }) => {
    await installApiMocks(page);
    await page.route('**/v1/admin/members?**', async (route) => {
      await route.fulfill({
        json: {
          ...memberDirectory,
          members: memberDirectory.members.map((member) => ({ ...member, slackId: `U0SLACK${member.id}` })),
        },
      });
    });
    let requestedPath: string | null = null;
    await page.route('**/v1/admin/members/*/password-link/slack', async (route) => {
      requestedPath = new URL(route.request().url()).pathname;
      await route.fulfill({ status: 204 });
    });
    await page.clock.install({ time: new Date('2026-01-01T09:00:00+09:00') });
    await page.goto('/members');
    await page.locator('aside', { hasText: 'BCSD Internal' }).waitFor();

    await page
      .getByRole('button', { name: /^관리 메뉴/ })
      .first()
      .click();
    await page.getByRole('menuitem', { name: '비밀번호 설정 링크' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Slack DM 보내기' }).click();

    await expect(dialog.getByRole('status')).toHaveText('DM을 보냈습니다.');
    expect(requestedPath).toBe(`/v1/admin/members/${memberDirectory.members[0].id}/password-link/slack`);
  });
});

test.describe('계정 없는 부원과 직장', () => {
  test('계정 없이 등록을 고르면 createAccount=false와 직장을 함께 보낸다', async ({ page }) => {
    await gotoAsAdmin(page, '/members');

    let body: Record<string, unknown> | null = null;
    await page.route('**/v1/admin/members', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.fallback();
        return;
      }
      body = route.request().postDataJSON();
      await route.fulfill({ json: { id: 99, studentNumber: '2016000000' } });
    });

    await page.getByRole('button', { name: '+ 부원 추가' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByPlaceholder('홍길동').fill('졸업생');
    await dialog.getByPlaceholder('예: 24-상').fill('미상');
    await dialog.getByPlaceholder('2024136000').fill('2016000000');
    await dialog.getByPlaceholder('name@gmail.com').fill('alumni@example.com');
    await dialog.getByPlaceholder('예: 졸업 후 재직 중인 회사').fill('카카오');
    await dialog.getByRole('combobox').filter({ hasText: '계정 만들기' }).click();
    await page.getByRole('option', { name: '계정 없이 인명부에만 등록' }).click();
    await expect(dialog.getByText('계정 없이 인명부에만 등록됩니다')).toBeVisible();

    await dialog.getByRole('button', { name: '저장' }).click();
    await expect(dialog).toBeHidden();
    expect(body).toMatchObject({ createAccount: false, company: '카카오' });
  });

  test('관리자 목록은 직장과 계정 없음 표시를 보여 준다', async ({ page }) => {
    await installApiMocks(page);
    await page.route('**/v1/admin/members?**', async (route) => {
      await route.fulfill({
        json: {
          ...memberDirectory,
          members: memberDirectory.members.map((member, index) =>
            index === 0 ? { ...member, company: '카카오', hasAccount: false } : { ...member, hasAccount: true },
          ),
        },
      });
    });
    await page.goto('/members');
    await page.locator('aside', { hasText: 'BCSD Internal' }).waitFor();

    const firstRow = page.getByRole('row').filter({ hasText: memberDirectory.members[0].name });
    await expect(firstRow.getByText('계정 없음')).toBeVisible();
    const secondRow = page.getByRole('row').filter({ hasText: memberDirectory.members[1].name });
    await expect(secondRow.getByText('계정 없음')).toHaveCount(0);

    // 직장은 기본 열이 아니라 상세 패널에서 본다.
    await firstRow.getByRole('button', { name: memberDirectory.members[0].name, exact: true }).click();
    const detail = page.getByRole('dialog');
    await expect(detail.getByText('카카오')).toBeVisible();
    await expect(detail.getByText('없음 (비밀번호 미설정)')).toBeVisible();
  });
});

test.describe('계정 설정 링크와 초기 설정', () => {
  const pendingMember = {
    id: 9,
    name: '김졸업',
    studentNumber: '2015000001',
    track: 'BACKEND',
    generation: '15-상',
    memberType: 'MENTOR',
    university: '한국기술교육대',
    role: 'MEMBER',
  };

  test('가입 전 회원의 링크면 계정 비밀번호 설정 문구로 보이고, 완료 후 연락처 입력을 안내한다', async ({ page }) => {
    await page.route('**/v1/auth/reissue', (route) => route.fulfill({ status: 401, json: { message: '인증 필요' } }));
    await page.route('**/v1/auth/password/reset-requests/validate', (route) =>
      route.fulfill({ json: { valid: true, studentNumberMasked: '2015****', accountSetup: true } }),
    );
    await page.route('**/v1/auth/password/reset', (route) => route.fulfill({ status: 204 }));

    await page.goto('/reset-password?token=setup-token');
    await expect(page.getByText('계정 비밀번호 설정')).toBeVisible();
    await page.getByLabel('새 비밀번호', { exact: true }).fill('NewPass1234');
    await page.getByLabel('새 비밀번호 확인').fill('NewPass1234');
    await page.getByRole('button', { name: '비밀번호 설정하기' }).click();

    await expect(page.getByText('비밀번호를 설정했어요')).toBeVisible();
    await expect(page.getByText('연락처를 입력하고 시작할 수 있어요')).toBeVisible();
  });

  test('링크로 비밀번호를 이미 정했으면 초기 설정에서 비밀번호를 다시 묻지 않는다', async ({ page }) => {
    let setupBody: Record<string, unknown> | undefined;
    await page.route('**/v1/auth/reissue', (route) => route.fulfill({ status: 401, json: { message: '인증 필요' } }));
    await page.route('**/v1/auth/login', (route) =>
      route.fulfill({
        json: {
          accessToken: 'setup-token',
          tokenType: 'Bearer',
          expiresIn: 600,
          status: 'PENDING_SETUP',
          member: pendingMember,
        },
      }),
    );
    await page.route('**/v1/members/me/initial-setup', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          json: {
            ...pendingMember,
            email: 'alumni@bcsd.club',
            phoneNumber: null,
            githubId: null,
            status: 'PENDING_SETUP',
            photoUrl: null,
            slackId: 'U0ABCDEFGH1',
            passwordSetupRequired: false,
          },
        });
        return;
      }
      setupBody = route.request().postDataJSON();
      await route.fulfill({
        json: {
          accessToken: 'full-token',
          tokenType: 'Bearer',
          expiresIn: 3600,
          status: 'ACTIVE',
          member: pendingMember,
        },
      });
    });

    await page.goto('/login');
    await page.getByLabel('학번').fill('2015000001');
    await page.getByLabel('비밀번호').fill('NewPass1234');
    await page.getByRole('button', { name: /로그인/ }).click();

    await expect(page.getByText('첫 로그인이시네요')).toBeVisible();
    await expect(page.getByLabel('새 비밀번호', { exact: true })).toHaveCount(0);
    await page.getByLabel('전화번호').fill('01012345678');
    await page.getByRole('button', { name: '저장하고 시작하기' }).click();

    await expect(page.getByText('설정이 완료됐어요')).toBeVisible();
    expect(setupBody).toMatchObject({ phoneNumber: '010-1234-5678', email: 'alumni@bcsd.club' });
    expect(setupBody).not.toHaveProperty('newPassword');
  });
});
