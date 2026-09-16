import type { Page } from '@playwright/test';

/**
 * 실제 백엔드(API_ORIGIN) 없이 화면을 스크린샷 찍기 위한 /v1/* 목업.
 * 모든 필터·페이지네이션 파라미터는 무시하고 고정된 데이터를 돌려준다 —
 * 이 목업의 목적은 "화면이 뜨는지"이지 도메인 로직 검증이 아니다.
 */
type RouteEntry = {
  method: string;
  pattern: RegExp;
  body: unknown;
};

const trackPages = [
  { id: 1, slug: 'frontend', displayName: '프론트엔드', isPublished: true, displayOrder: 0 },
  { id: 2, slug: 'backend', displayName: '백엔드', isPublished: true, displayOrder: 1 },
  { id: 3, slug: 'design', displayName: '디자인', isPublished: false, displayOrder: 2 },
];

const tracks = [
  { id: 1, code: 'FRONTEND', name: '프론트엔드', isActive: true, hasTrackPage: true },
  { id: 2, code: 'BACKEND', name: '백엔드', isActive: true, hasTrackPage: true },
  { id: 3, code: 'DESIGN', name: '디자인', isActive: true, hasTrackPage: true },
  { id: 4, code: 'ANDROID', name: '안드로이드', isActive: true, hasTrackPage: false },
];

const techStacks = [
  { id: 1, name: 'React', iconUrl: 'https://placehold.co/24' },
  { id: 2, name: 'Spring', iconUrl: 'https://placehold.co/24' },
];

const trackPageDetail = {
  id: 1,
  trackId: 1,
  trackCode: 'FRONTEND',
  slug: 'frontend',
  displayName: '프론트엔드',
  tagline: '화면을 만듭니다',
  isPublished: true,
  displayOrder: 0,
  studyPoints: [{ title: '컴포넌트 설계', description: '재사용 가능한 UI를 만든다', iconImageUrl: null }],
  techStacks,
  members: [
    { id: 1, memberId: 1, name: '홍길동', memberType: 'REGULAR', profileImageUrl: null, isVisible: true, displayOrder: 0 },
    { id: 2, memberId: 2, name: '김철수', memberType: 'MENTOR', profileImageUrl: null, isVisible: true, displayOrder: 1 },
  ],
};

const games = [
  { id: 1, slug: 'space-game', name: '스페이스 게임', isPublished: true, displayOrder: 0 },
  { id: 2, slug: 'puzzle', name: '퍼즐', isPublished: false, displayOrder: 1 },
];

const gameDetail = {
  id: 1,
  trackId: 1,
  trackName: '프론트엔드',
  slug: 'space-game',
  name: '스페이스 게임',
  oneLiner: '우주를 탐험하세요',
  teamLabel: '1팀',
  description: '<p>설명입니다</p>',
  thumbnailUrl: null,
  isPublished: true,
  displayOrder: 0,
  screenshots: [{ id: 1, imageUrl: 'https://placehold.co/400x225', displayOrder: 0 }],
  rating: {
    rating: 'ALL',
    classificationNumber: null,
    classificationDate: null,
    businessName: null,
    developerReportNumber: null,
    contentDescriptors: [],
  },
  members: [{ id: 1, memberId: 1, name: '홍길동', memberType: 'REGULAR', profileImageUrl: null, displayOrder: 0 }],
};

const gameBuilds = [
  {
    id: 1,
    version: '1.0.0',
    status: 'ACTIVE',
    canvasWidth: 960,
    canvasHeight: 540,
    storageBytes: 1024,
    buildFileUrl: null,
    failureReason: null,
    uploadedAt: '2026-01-01T00:00:00Z',
  },
];

const activityCategories = [
  { id: 1, slug: 'study', name: '스터디', headline: null, heroImageUrl: null, isPublished: true, displayOrder: 0 },
  { id: 2, slug: 'event', name: '행사', headline: null, heroImageUrl: null, isPublished: true, displayOrder: 1 },
];

const activityPage = {
  content: [
    { id: 1, year: 2026, month: 1, title: '신년 스터디', summary: '요약', isPublished: true, displayOrder: 0 },
    { id: 2, year: 2026, month: 2, title: '설 행사', summary: '요약', isPublished: true, displayOrder: 1 },
  ],
  totalElements: 12,
  totalPages: 6,
  number: 0,
  size: 2,
};

const curriculums = [{ id: 1, name: '2026 프론트엔드 커리큘럼', isPublished: true, displayOrder: 0 }];

const curriculumTree = {
  id: 1,
  name: '2026 프론트엔드 커리큘럼',
  isPublished: true,
  weeks: [
    {
      id: 1,
      weekFrom: 1,
      weekTo: 2,
      displayOrder: 0,
      topics: [{ id: 1, title: 'HTML/CSS', displayOrder: 0, details: ['시맨틱 마크업', '플렉스박스'] }],
    },
  ],
};

const mentorSlots = [
  { id: 1, memberId: 1, name: '홍길동', trackName: '프론트엔드', profileImageUrl: null, displayOrder: 0 },
];

const qnaItems = [{ id: 1, question: '가입 방법은?', answer: '지원서를 제출하세요', isPublished: true, displayOrder: 0 }];

const recruitLink = {
  googleFormUrl: 'https://forms.gle/example',
  isOpen: true,
  closeDate: null,
  closedMessage: '모집이 종료되었습니다',
  updatedAt: '2026-01-01T00:00:00Z',
};

const recruitLinkHistory = [
  { googleFormUrl: 'https://forms.gle/example', isOpen: true, changedByName: '관리자', changedAt: '2026-01-01T00:00:00Z' },
];

const memberDirectory = {
  members: [
    {
      id: 1,
      name: '홍길동',
      generation: '10',
      track: 'FRONTEND',
      memberType: 'REGULAR',
      academicStatus: 'ENROLLED',
      university: '한밭대학교',
      department: '컴퓨터공학과',
      position: null,
      birthDate: null,
      duesRequired: true,
      studentNumber: '2000123456',
      email: 'a@example.com',
      phoneNumber: '01012345678',
      githubId: 'octocat',
      photoUrl: null,
      role: 'MEMBER',
      active: true,
    },
    {
      id: 2,
      name: '김철수',
      generation: '9',
      track: 'BACKEND',
      memberType: 'MENTOR',
      academicStatus: 'ENROLLED',
      university: '한밭대학교',
      department: '컴퓨터공학과',
      position: '회장',
      birthDate: null,
      duesRequired: false,
      studentNumber: '1900123456',
      email: 'b@example.com',
      phoneNumber: null,
      githubId: null,
      photoUrl: null,
      role: 'ADMIN',
      active: true,
    },
  ],
  page: { number: 0, size: 8, totalElements: 2, totalPages: 1 },
  counts: {
    total: 2,
    active: 2,
    inactive: 0,
    byAcademicStatus: { ENROLLED: 2 },
    byTrack: { FRONTEND: 1, BACKEND: 1 },
    byMemberType: { REGULAR: 1, MENTOR: 1 },
  },
};

const dailyReservations = {
  date: '2026-01-01',
  reservations: [
    { id: 1, start: 600, end: 720, memberName: '홍길동', purpose: '스터디', headcount: 4, mine: true, groupId: null },
  ],
};

const monthlyOccupancy = {
  month: '2026-01',
  days: [{ date: '2026-01-01', reservedMinutes: 120 }],
};

const myReservations = {
  reservations: [
    { id: 1, date: '2026-01-01', start: 600, end: 720, purpose: '스터디', headcount: 4, groupId: null, repeating: false },
  ],
};

const routes: RouteEntry[] = [
  { method: 'GET', pattern: /\/v1\/members\/me$/, body: sessionMember() },
  { method: 'GET', pattern: /\/v1\/admin\/track-pages\/\d+\/curriculums$/, body: curriculums },
  { method: 'GET', pattern: /\/v1\/admin\/track-pages\/\d+$/, body: trackPageDetail },
  { method: 'GET', pattern: /\/v1\/admin\/track-pages$/, body: trackPages },
  { method: 'GET', pattern: /\/v1\/admin\/tracks$/, body: tracks },
  { method: 'GET', pattern: /\/v1\/admin\/tech-stacks$/, body: techStacks },
  { method: 'GET', pattern: /\/v1\/admin\/games\/\d+\/builds$/, body: gameBuilds },
  { method: 'GET', pattern: /\/v1\/admin\/games\/\d+$/, body: gameDetail },
  { method: 'GET', pattern: /\/v1\/admin\/games$/, body: games },
  { method: 'GET', pattern: /\/v1\/admin\/activity-categories$/, body: activityCategories },
  { method: 'GET', pattern: /\/v1\/admin\/activities$/, body: activityPage },
  { method: 'GET', pattern: /\/v1\/admin\/curriculums\/\d+$/, body: curriculumTree },
  { method: 'GET', pattern: /\/v1\/admin\/mentor-slots$/, body: mentorSlots },
  { method: 'GET', pattern: /\/v1\/admin\/qna$/, body: qnaItems },
  { method: 'GET', pattern: /\/v1\/admin\/recruit-link\/history$/, body: recruitLinkHistory },
  { method: 'GET', pattern: /\/v1\/admin\/recruit-link$/, body: recruitLink },
  { method: 'GET', pattern: /\/v1\/admin\/members$/, body: memberDirectory },
  { method: 'GET', pattern: /\/v1\/members\/directory$/, body: memberDirectory },
  { method: 'GET', pattern: /\/v1\/reservations\/daily$/, body: dailyReservations },
  { method: 'GET', pattern: /\/v1\/reservations\/monthly-occupancy$/, body: monthlyOccupancy },
  { method: 'GET', pattern: /\/v1\/reservations\/me\/monthly-occupancy$/, body: monthlyOccupancy },
  { method: 'GET', pattern: /\/v1\/reservations\/me$/, body: myReservations },
];

function sessionMember() {
  return {
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
  };
}

export async function installApiMocks(page: Page) {
  await page.route('**/v1/auth/reissue', async (route) => {
    await route.fulfill({
      json: { accessToken: 'mock-access-token', tokenType: 'Bearer', expiresIn: 3600 },
    });
  });

  await page.route('**/v1/**', async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    const entry = routes.find((r) => r.method === request.method() && r.pattern.test(pathname));
    if (!entry) {
      await route.fulfill({ status: 200, json: [] });
      return;
    }
    await route.fulfill({ json: entry.body });
  });
}
