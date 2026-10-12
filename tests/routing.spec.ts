import { expect, test, type Page } from '@playwright/test';

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

test.describe('URL 조회 상태', () => {
  test('인명부 URL의 필터·검색·정렬을 요청에 반영하고 새로고침·뒤로가기로 복원한다', async ({ page }) => {
    await installApiMocks(page);
    await page.goto('/members?keyword=김철수&active=false&sort=name&direction=desc');
    const input = page.getByRole('textbox', { name: '부원 검색' });
    await expect(input).toHaveValue('김철수');
    await page
      .getByRole('region', { name: '부원 목록' })
      .getByRole('button', { name: /^이름/ })
      .click();
    await expect(page).toHaveURL(/direction=asc/);
    await page.goBack();
    await expect(page).toHaveURL(/direction=desc/);
    await expect(input).toHaveValue('김철수');
    const request = page.waitForRequest((req) => {
      const url = new URL(req.url());
      return url.pathname === '/v1/admin/members' && url.searchParams.get('size') !== '1';
    });
    await page.reload();
    const params = new URL((await request).url()).searchParams;
    expect(params.get('keyword')).toBe('김철수');
    expect(params.get('active')).toBe('false');
    expect(params.get('sort')).toBe('name,desc');
    await expect(input).toHaveValue('김철수');
  });

  test('검색 확정과 URL 복원은 포커스를 유지하고 이전 입력 타이머가 뒤로가기를 덮어쓰지 않는다', async ({ page }) => {
    await installApiMocks(page);
    await page.clock.install();
    await page.goto('/members?keyword=첫검색');
    const input = page.getByRole('textbox', { name: '부원 검색' });
    await input.fill('다음검색');
    await page.clock.runFor(350);
    await expect.poll(() => new URL(page.url()).searchParams.get('keyword')).toBe('다음검색');
    await expect(input).toBeFocused();
    await input.fill('확정 전 초안');
    await page.goBack();
    await expect(input).toHaveValue('첫검색');
    await page.clock.runFor(400);
    expect(new URL(page.url()).searchParams.get('keyword')).toBe('첫검색');
  });

  test('인명부 다중 필터를 검증하고 잘못된 페이지·정렬·필터 값은 요청에서 제외한다', async ({ page }) => {
    await installApiMocks(page);
    const request = page.waitForRequest((req) => {
      const url = new URL(req.url());
      return url.pathname === '/v1/admin/members' && url.searchParams.get('size') !== '1';
    });
    await page.goto(
      '/members?page=-3&sort=unknown&direction=wrong&active=oops&track=%5B%22FRONTEND%22,%22INVALID%22,%22FRONTEND%22%5D',
    );
    const params = new URL((await request).url()).searchParams;
    expect(params.get('page')).toBe('0');
    expect(params.get('sort')).toBe('generation,asc');
    expect(params.has('active')).toBe(false);
    expect(params.getAll('track')).toEqual(['FRONTEND']);
    await expect(page.getByRole('heading', { name: '부원 명부' })).toBeVisible();
  });

  test('활동 카테고리 선택은 새로고침과 뒤로가기로 복원된다', async ({ page }) => {
    await installApiMocks(page);
    await page.goto('/activities?categoryId=2');
    await expect(page.getByRole('heading', { name: '행사 활동' })).toBeVisible();
    await page.getByRole('button', { name: /^스터디/ }).click();
    await expect(page).toHaveURL(/categoryId=1/);
    await page.goBack();
    await expect(page.getByRole('heading', { name: '행사 활동' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: '행사 활동' })).toBeVisible();
  });

  test('게임 상세 탭은 URL에서 열리고 뒤로가기로 이전 탭을 복원한다', async ({ page }) => {
    await installApiMocks(page);
    await page.goto(`/games/1?tab=${encodeURIComponent('빌드')}`);
    await expect(page.getByRole('tab', { name: '빌드', exact: true })).toHaveAttribute('aria-selected', 'true');
    await page.getByRole('tab', { name: '기본정보', exact: true }).click();
    await page.goBack();
    await expect(page.getByRole('tab', { name: '빌드', exact: true })).toHaveAttribute('aria-selected', 'true');
    await page.reload();
    await expect(page.getByRole('tab', { name: '빌드', exact: true })).toHaveAttribute('aria-selected', 'true');
  });

  test('커리큘럼 URL 선택을 복원하고 삭제된 주차는 첫 주차로 계산한다', async ({ page }) => {
    await installApiMocks(page);
    await page.goto('/curriculums?trackPageId=1&curriculumId=1&weekId=999');
    await expect(page.getByRole('heading', { name: '2026 프론트엔드 커리큘럼 커리큘럼' })).toBeVisible();
    await expect(page.getByText('HTML/CSS', { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText('HTML/CSS', { exact: true })).toBeVisible();
  });

  test('다른 트랙에 속하거나 없는 커리큘럼 ID는 상세 조회하지 않는다', async ({ page }) => {
    await installApiMocks(page);
    const trees: string[] = [];
    page.on('request', (request) => {
      if (/\/v1\/admin\/curriculums\/999/.test(request.url())) trees.push(request.url());
    });
    await page.goto('/curriculums?trackPageId=1&curriculumId=999');
    await expect(page.getByRole('combobox').nth(1)).toBeVisible();
    await expect(page.getByText('왼쪽에서 트랙과 세트를 선택하세요.')).toBeVisible();
    expect(trees).toEqual([]);
  });
});

test('테마는 다른 탭의 변경도 구독해 화면 색상과 토글 표시를 함께 갱신한다', async ({ page, context }) => {
  await installApiMocks(page);
  await page.goto('/members');
  const other = await context.newPage();
  await installApiMocks(other);
  await other.goto('/members');
  await expect(page.getByRole('button', { name: '다크', exact: true })).toBeVisible();
  await other.getByRole('button', { name: '다크', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('button', { name: '라이트', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '라이트', exact: true }).click();
  await expect(other.locator('html')).toHaveAttribute('data-theme', 'light');
  await other.close();
});

test('URL의 인명부 페이지를 새로고침해 복원하고 필터를 바꾸면 첫 페이지로 이동한다', async ({ page }) => {
  await installApiMocks(page);
  await page.clock.install();
  await page.route('**/v1/admin/members?**', async (route) => {
    const params = new URL(route.request().url()).searchParams;
    if (params.get('size') === '1') return route.fallback();
    const number = Number(params.get('page'));
    await route.fulfill({
      json: {
        members: [],
        page: { number, size: 8, totalElements: 24, totalPages: 3 },
        counts: { total: 24, active: 24, inactive: 0, byTrack: {}, byAcademicStatus: {}, byMemberType: {} },
      },
    });
  });
  await page.goto('/members?page=2');
  await expect(page.getByRole('button', { name: '‹', exact: true })).toBeEnabled();
  await page.reload();
  expect(new URL(page.url()).searchParams.get('page')).toBe('2');
  await expect(page.getByRole('button', { name: '‹', exact: true })).toBeEnabled();
  const input = page.getByRole('textbox', { name: '부원 검색' });
  await input.fill('취소할 검색');
  await input.fill('');
  await page.clock.runFor(350);
  expect(new URL(page.url()).searchParams.get('page')).toBe('2');
  await page
    .locator('aside', { hasText: '활동 여부' })
    .getByRole('button', { name: /^활동/ })
    .click();
  await expect.poll(() => new URL(page.url()).searchParams.get('page')).toBeNull();
});

const financeSemester = {
  id: '2026-2',
  year: 2026,
  term: 2,
  monthlyAmount: 10000,
  totalMembers: 1,
  exemptMembers: 0,
  targetMembers: 1,
  completedMembers: 0,
  unpaidMembers: 1,
  totalAmount: 60000,
  paidAmount: 0,
  unpaidAmount: 60000,
  needsReview: true,
};
const financeMember = {
  memberId: 7,
  name: 'URL회원',
  studentNumber: '2026000001',
  track: 'FRONTEND',
  slackId: null,
  months: ['2026-09', '2026-10', '2026-11', '2026-12', '2027-01', '2027-02'].map((month) => ({
    month,
    status: 'UNPAID',
    exemptions: [],
    note: null,
  })),
  status: 'UNPAID',
  assessedAmount: 60000,
  paidAmount: 0,
  unpaidAmount: 60000,
  excessAmount: 0,
};
const financeEntry = {
  id: 7,
  occurredAt: '2026-09-12T18:22:59',
  type: 'DEPOSIT',
  category: 'DUES',
  counterparty: 'URL회원',
  description: '회비 입금',
  note: '',
  amount: 10000,
  balance: 10000,
  source: null,
  linkStatus: 'NONE',
  duesLink: null,
  evidences: [],
};

async function installFinanceMocks(page: Page) {
  await installApiMocks(page);
  await page.route('**/v1/admin/ledger/entries', (route) => route.fulfill({ json: { entries: [financeEntry] } }));
  await page.route('**/v1/admin/dues/semesters', (route) => route.fulfill({ json: { semesters: [financeSemester] } }));
  await page.route('**/v1/admin/dues/semesters/2026-2/members', (route) =>
    route.fulfill({ json: { semester: financeSemester, members: [financeMember] } }),
  );
  await page.route('**/v1/admin/dues/semesters/creatable', (route) =>
    route.fulfill({ json: { currentSemesterId: '2026-2', nextSemester: { year: 2027, term: 1 }, creatable: false } }),
  );
  await page.route('**/v1/admin/dues/exemptions', (route) => route.fulfill({ json: { exemptions: [] } }));
  await page.route('**/v1/admin/dues/exemption-reasons', (route) => route.fulfill({ json: { reasons: ['멘토'] } }));
}

test('장부 필터와 상세 선택을 URL에서 복원하고 편집 초안 이탈을 취소할 수 있다', async ({ page }) => {
  await installFinanceMocks(page);
  const filters = encodeURIComponent(JSON.stringify({ types: ['deposit'], from: '2026-09-01' }));
  await page.goto(`/ledger?filters=${filters}&entryId=7`);
  await expect(page.getByText('입금 상세', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('입금 상세', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '수정', exact: true }).click();
  await page.getByRole('textbox').first().fill('작성 중');
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: '닫기', exact: true }).click();
  await expect(page.getByRole('textbox').first()).toHaveValue('작성 중');
  expect(JSON.parse(new URL(page.url()).searchParams.get('entryId')!)).toBe('7');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: '닫기', exact: true }).click();
  await expect(page.getByText('입금 상세', { exact: true })).toBeHidden();
  expect(new URL(page.url()).searchParams.has('entryId')).toBe(false);
  expect(JSON.parse(new URL(page.url()).searchParams.get('filters')!).types).toEqual(['deposit']);
  await page.goBack();
  await expect(page.getByText('입금 상세', { exact: true })).toBeVisible();
});

test('회비 URL의 필터·선택 회원을 복원하고 없는 회원 ID는 모달을 열지 않는다', async ({ page }) => {
  await installFinanceMocks(page);
  await page.goto('/ledger/dues/2026-2?members=%5B%22URL회원%22%5D&memberId=7');
  await expect(page.getByRole('heading', { name: 'URL회원 · 연결 출납내역' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'URL회원 · 연결 출납내역' })).toBeVisible();
  await page.keyboard.press('Escape');
  expect(new URL(page.url()).searchParams.has('memberId')).toBe(false);
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'URL회원 · 연결 출납내역' })).toBeVisible();
  await page.goto('/ledger/dues/2026-2?memberId=999');
  await expect(page.getByText('URL회원', { exact: true })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('면제 사유 보기·학기 선택을 새로고침과 뒤로가기로 복원한다', async ({ page }) => {
  await installFinanceMocks(page);
  await page.goto('/ledger/exemptions?view=period&semester=2026-1');
  await expect(page.getByRole('button', { name: '기간별 보기' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '다음 학기' }).click();
  await expect(page).toHaveURL(/semester=2026-2/);
  await page.reload();
  await expect(page.getByRole('button', { name: '기간별 보기' })).toHaveAttribute('aria-pressed', 'true');
  await page.goBack();
  await expect(page).toHaveURL(/semester=2026-1/);
});

test('예약 초안은 규칙 탭에서 유지되고 날짜 변경은 확인 후 초기화된다', async ({ page }) => {
  await installApiMocks(page);
  await page.goto('/reservations?date=2030-01-15&month=2030-01');
  const purpose = page.getByPlaceholder('예: 프론트엔드 세션');
  await purpose.fill('작성 중인 예약');
  await page.getByRole('tab', { name: '이용 규칙' }).click();
  await expect(page).toHaveURL(/screen=rules/);
  await page.goBack();
  await expect(purpose).toHaveValue('작성 중인 예약');
  // Calendar cells retain their visible day labels.
  page.once('dialog', (dialog) => dialog.dismiss());
  await page
    .locator('div[style*="cursor: pointer"]')
    .filter({ has: page.locator('span', { hasText: /^16$/ }) })
    .click();
  await expect(purpose).toHaveValue('작성 중인 예약');
  await expect(page).toHaveURL(/date=2030-01-15/);
  page.once('dialog', (dialog) => dialog.accept());
  await page
    .locator('div[style*="cursor: pointer"]')
    .filter({ has: page.locator('span', { hasText: /^16$/ }) })
    .click();
  await expect(page).toHaveURL(/date=2030-01-16/);
  await expect(purpose).toHaveValue('');
  await page.reload();
  await expect(page).toHaveURL(/date=2030-01-16/);
  await expect(page.getByText('2030년 1월', { exact: true })).toBeVisible();
});

test('예약 화면·목록 탭·상세 ID를 URL에서 복원한다', async ({ page }) => {
  await installApiMocks(page);
  await page.goto('/reservations?screen=mine&tab=past&month=2026-01&date=2026-01-01&detailId=1');
  await expect(page.getByText('예약 상세', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('예약 상세', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  expect(new URL(page.url()).searchParams.get('tab')).toBe('past');
  expect(new URL(page.url()).searchParams.has('detailId')).toBe(false);
  await page.goBack();
  await expect(page.getByText('예약 상세', { exact: true })).toBeVisible();
});

test('장부 날짜 입력 중간값은 로컬에 남고 완성된 날짜만 URL에 반영한다', async ({ page }) => {
  await installFinanceMocks(page);
  await page.goto('/ledger');
  await page.getByRole('button', { name: /^거래 일시/ }).click();
  const from = page.getByLabel('시작일', { exact: true });
  await from.fill('2026');
  await expect(from).toHaveValue('2026-');
  expect(new URL(page.url()).searchParams.has('filters')).toBe(false);
  await from.fill('20260901');
  await expect(from).toHaveValue('2026-09-01');
  await expect.poll(() => JSON.parse(new URL(page.url()).searchParams.get('filters') ?? '{}').from).toBe('2026-09-01');
  await page.reload();
  await page.getByRole('button', { name: /^거래 일시/ }).click();
  await expect(from).toHaveValue('2026-09-01');
});

test('예약 시간 변경의 목적·인원 초안은 날짜 이동 후에도 유지하며 기존 예약을 취소하지 않는다', async ({ page }) => {
  await installApiMocks(page);
  let cancellationCount = 0;
  await page.route('**/v1/reservations/1', async (route) => {
    if (route.request().method() !== 'GET') cancellationCount++;
    await route.fulfill({
      json: {
        id: 1,
        date: '2030-01-16',
        start: 600,
        end: 720,
        purpose: '옮길 예약',
        headcount: 4,
        cancelledAt: null,
        group: null,
      },
    });
  });
  await page.goto('/reservations?screen=mine&date=2030-01-15&detailId=1');
  await page.getByRole('button', { name: '시간 변경', exact: true }).click();
  await expect(page).toHaveURL(/date=2030-01-16/);
  await expect(page.getByPlaceholder('예: 프론트엔드 세션')).toHaveValue('옮길 예약');
  await page.getByRole('tab', { name: '이용 규칙' }).click();
  await page.getByRole('tab', { name: '예약 현황' }).click();
  await expect(page.getByPlaceholder('예: 프론트엔드 세션')).toHaveValue('옮길 예약');
  expect(cancellationCount).toBe(0);
});

test('빈 트랙 목록에 외부에서 트랙이 추가되면 재조회 후 index loader가 첫 트랙을 연다', async ({ page }) => {
  await installApiMocks(page);
  let added = false;
  let requests = 0;
  await page.route('**/v1/admin/track-pages', async (route) => {
    requests++;
    await route.fulfill({
      json: added ? [{ id: 1, slug: 'frontend', displayName: '프론트엔드', isPublished: true, displayOrder: 0 }] : [],
    });
  });
  await page.goto('/tracks');
  await expect(page.getByText('트랙이 없습니다.', { exact: false })).toBeVisible();
  const before = requests;
  added = true;
  await page.evaluate(() => {
    window.dispatchEvent(new Event('offline'));
    window.dispatchEvent(new Event('online'));
  });
  await expect(page).toHaveURL(/\/tracks\/1$/);
  await expect(page.getByRole('textbox', { name: /^트랙명/ })).toHaveValue(trackPageDetail.displayName);
  expect(requests - before).toBeLessThanOrEqual(3);
});
