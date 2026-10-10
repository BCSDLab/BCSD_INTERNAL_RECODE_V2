import type { ExemptionPeriod } from '@/components/dues/exemptions';
import type { MemberDues, MonthDues, MonthDuesStatus, SemesterDuesSummary } from '@/components/dues/types';

/**
 * mock 전용 시드. 화면 모양(뷰 모델)으로 적고 ./mock-db가 DTO로 바꿔 들고 있는다.
 * 현재 학기(2026-2)의 월 칸·상태·금액은 mock-db가 장부 연결과 면제로 다시 계산하므로 여기 값은 쓰이지 않는다
 * (지난 학기 시드의 바탕으로만 쓴다).
 */

/** slackId는 "이메일로 Slack 계정을 찾을 수 있는 회원"을 표시하는 시드 전용 값이다. */
export type SeedMemberDues = Omit<MemberDues, 'slackId'> & { slackId?: string };

function month(status: MonthDuesStatus, description: string): MonthDues {
  return { status, description };
}

const paid = (description = '완료') => month('paid', description);
const exempt = (description: string) => month('exempt', description);
const unpaid = (description: string) => month('unpaid', description);
const notApplicable = () => month('not-applicable', '납부 비대상');

export const SEMESTER_DUES_SUMMARIES: SemesterDuesSummary[] = [
  {
    id: '2026-2',
    shortLabel: '26년 2학기',
    title: '2026년 2학기 회비',
    monthlyAmount: 10000,
    totalMembers: 12,
    exemptMembers: 5,
    targetMembers: 7,
    completedMembers: 6,
    unpaidMembers: 4,
    totalAmount: 510000,
    paidAmount: 460000,
    unpaidAmount: 65000,
    needsReview: true,
  },
  {
    id: '2026-1',
    shortLabel: '26년 1학기',
    title: '2026년 1학기 회비',
    monthlyAmount: 10000,
    totalMembers: 10,
    exemptMembers: 1,
    targetMembers: 10,
    completedMembers: 9,
    unpaidMembers: 0,
    totalAmount: 540000,
    paidAmount: 540000,
    unpaidAmount: 0,
    needsReview: false,
  },
  {
    id: '2025-2',
    shortLabel: '25년 2학기',
    title: '2025년 2학기 회비',
    monthlyAmount: 10000,
    totalMembers: 8,
    exemptMembers: 0,
    targetMembers: 8,
    completedMembers: 7,
    unpaidMembers: 1,
    totalAmount: 480000,
    paidAmount: 470000,
    unpaidAmount: 10000,
    needsReview: false,
  },
];

export const CURRENT_SEMESTER_MEMBERS: SeedMemberDues[] = [
  {
    id: 'member-yuna',
    name: '최유나',
    studentNumber: '2022174077',
    track: 'Backend',
    slackId: 'U_DUES_YUNA',
    months: [paid('70,000원 입금 중 10,000원 배분'), paid(), paid(), paid(), paid(), paid()],
    status: 'overpaid',
    assessedAmount: 60000,
    paidAmount: 60000,
    unpaidAmount: 0,
    excessAmount: 10000,
  },
  {
    id: 'member-jihoon',
    name: '오지훈',
    studentNumber: '2024174088',
    track: 'Game',
    slackId: 'U_DUES_JIHOON',
    months: Array.from({ length: 6 }, notApplicable),
    status: 'exempt',
    assessedAmount: null,
    paidAmount: null,
    unpaidAmount: null,
  },
  {
    id: 'member-doyun',
    name: '김도윤',
    studentNumber: '2024174065',
    track: 'iOS',
    slackId: 'U_DUES_DOYUN',
    months: [paid('60,000원 일시납 배분'), paid(), paid(), paid(), paid(), paid()],
    status: 'paid',
    assessedAmount: 60000,
    paidAmount: 60000,
    unpaidAmount: 0,
  },
  {
    id: 'member-seojun',
    name: '박서준',
    studentNumber: '2023174052',
    track: 'Backend',
    slackId: 'U_DUES_SEOJUN',
    months: [paid('1차 30,000원 배분'), paid(), paid(), paid('2차 30,000원 배분'), paid(), paid()],
    status: 'paid',
    assessedAmount: 60000,
    paidAmount: 60000,
    unpaidAmount: 0,
  },
  {
    id: 'member-haneul',
    name: '이하늘',
    studentNumber: '2023174011',
    track: 'Frontend',
    slackId: 'U_DUES_HANEUL',
    months: [paid(), paid(), paid(), paid(), paid(), unpaid('부족 납부 5,000원(10,000원 중)')],
    status: 'unpaid',
    assessedAmount: 60000,
    paidAmount: 55000,
    unpaidAmount: 5000,
  },
  {
    id: 'member-hangyeol',
    name: '정한결',
    studentNumber: '2022174130',
    track: 'Frontend',
    slackId: 'U_DUES_HANGYEOL',
    months: [exempt('트랙장 2026.09~11'), exempt('트랙장'), exempt('트랙장'), paid(), paid(), paid()],
    status: 'paid',
    assessedAmount: 30000,
    paidAmount: 30000,
    unpaidAmount: 0,
  },
  {
    id: 'member-somi',
    name: '한소미',
    studentNumber: '2021174093',
    track: 'Backend',
    slackId: 'U_DUES_SOMI',
    months: [paid(), paid(), paid(), exempt('활동 중지 2026.12~계속'), exempt('활동 중지'), exempt('활동 중지')],
    status: 'overpaid',
    assessedAmount: 30000,
    paidAmount: 40000,
    unpaidAmount: 0,
    excessAmount: 10000,
  },
  {
    id: 'member-mentor',
    name: '서지훈',
    studentNumber: '2022174044',
    track: 'Design',
    slackId: 'U_DUES_MENTOR',
    months: Array.from({ length: 6 }, (_, index) => exempt(index === 0 ? '멘토 2024.09~계속' : '멘토')),
    status: 'exempt',
    assessedAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
  },
  {
    id: 'member-minjun',
    name: '김민준',
    studentNumber: '2024174007',
    track: 'Android',
    slackId: 'U_DUES_MINJUN',
    months: [paid(), paid(), paid(), paid(), unpaid('부족 납부 3,000원'), unpaid('연결된 기록 없음')],
    status: 'unpaid',
    assessedAmount: 60000,
    paidAmount: 43000,
    unpaidAmount: 20000,
  },
  {
    id: 'member-seoyeon',
    name: '이서연',
    studentNumber: '2024174101',
    track: 'PM',
    months: [paid(), paid(), paid(), paid(), paid(), unpaid('연결된 기록 없음')],
    status: 'unpaid',
    assessedAmount: 60000,
    paidAmount: 50000,
    unpaidAmount: 10000,
  },
  {
    id: 'member-jian',
    name: '박지안',
    studentNumber: '2023174090',
    track: 'Data Analyst',
    slackId: 'U_DUES_JIAN',
    months: [
      paid(),
      paid(),
      paid(),
      unpaid('연결된 기록 없음'),
      unpaid('연결된 기록 없음'),
      unpaid('연결된 기록 없음'),
    ],
    status: 'unpaid',
    assessedAmount: 60000,
    paidAmount: 30000,
    unpaidAmount: 30000,
  },
  {
    id: 'member-taeo',
    name: '강태오',
    studentNumber: '2024174210',
    track: 'Backend',
    slackId: 'U_DUES_TAEO',
    months: [exempt('부트캠프 2026.09~11'), exempt('부트캠프'), exempt('부트캠프'), paid(), paid(), paid()],
    status: 'paid',
    assessedAmount: 30000,
    paidAmount: 30000,
    unpaidAmount: 0,
  },
  {
    id: 'member-seoa',
    name: '윤서아',
    studentNumber: '2023174300',
    track: 'iOS',
    slackId: 'U_DUES_SEOA',
    months: Array.from({ length: 6 }, (_, index) => exempt(index === 0 ? '졸업 2026.09~계속' : '졸업')),
    status: 'exempt',
    assessedAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
  },
];

export function getSemesterMembers(semesterId: string): SeedMemberDues[] {
  if (semesterId === '2026-2') return CURRENT_SEMESTER_MEMBERS;

  if (semesterId === '2026-1') {
    return CURRENT_SEMESTER_MEMBERS.slice(0, 10).map((member, index) => ({
      ...member,
      months: Array.from({ length: 6 }, () => (index === 9 ? exempt('휴학') : paid())),
      status: index === 9 ? 'exempt' : 'paid',
      assessedAmount: index === 9 ? 0 : 60000,
      paidAmount: index === 9 ? 0 : 60000,
      unpaidAmount: 0,
      excessAmount: undefined,
    }));
  }

  return CURRENT_SEMESTER_MEMBERS.slice(0, 8).map((member, index) => ({
    ...member,
    months: Array.from({ length: 6 }, (_, monthIndex) =>
      index === 7 && monthIndex === 5 ? unpaid('미납 · 연결된 기록 없음') : paid(),
    ),
    status: index === 7 ? 'unpaid' : 'paid',
    assessedAmount: 60000,
    paidAmount: index === 7 ? 50000 : 60000,
    unpaidAmount: index === 7 ? 10000 : 0,
    excessAmount: undefined,
  }));
}

export const INITIAL_EXEMPTIONS: ExemptionPeriod[] = [
  {
    id: 'exemption-somi',
    memberId: 'member-somi',
    reason: '활동 중지',
    note: '',
    startMonth: '2026-12',
    endMonth: null,
  },
  {
    id: 'exemption-hangyeol',
    memberId: 'member-hangyeol',
    reason: '트랙장',
    note: 'Frontend',
    startMonth: '2026-09',
    endMonth: '2026-11',
  },
  {
    id: 'exemption-taeo',
    memberId: 'member-taeo',
    reason: '부트캠프',
    note: '소프티어',
    startMonth: '2026-09',
    endMonth: '2026-11',
  },
  // 강태오 11월은 부트캠프와 겹친다 — 겹쳐도 그 달 부과액은 한 번만 0이 된다.
  {
    id: 'exemption-taeo-job',
    memberId: 'member-taeo',
    reason: '취업',
    note: '',
    startMonth: '2026-11',
    endMonth: '2026-11',
  },
  {
    id: 'exemption-seoa',
    memberId: 'member-seoa',
    reason: '졸업',
    note: '',
    startMonth: '2026-09',
    endMonth: null,
  },
  {
    id: 'exemption-mentor',
    memberId: 'member-mentor',
    reason: '멘토',
    note: '',
    startMonth: '2024-09',
    endMonth: null,
  },
  {
    id: 'exemption-mentor-lead',
    memberId: 'member-mentor',
    reason: '팀장',
    note: '',
    startMonth: '2026-10',
    endMonth: '2026-10',
  },
];

/** 면제 사유 기본 목록. 화면에서 새 사유를 저장하면 뒤에 덧붙는다. */
export const INITIAL_EXEMPTION_REASONS = [
  '멘토',
  '회장',
  '부회장',
  '트랙장',
  '교육장',
  '팀장',
  '졸업',
  '군휴학',
  '질병휴학',
  '휴학',
  '활동 중지',
  '프로젝트 미참여',
  '부트캠프',
  '취업',
  '연락두절',
];
