import type { MemberRole } from '@/api/auth/types';
import { ApiError } from '@/api/client';
import type {
  AcademicStatus,
  MemberCreateRequest,
  MemberCreateResponse,
  MemberDirectoryItem,
  MemberDirectoryParams,
  MemberDirectoryResponse,
  MemberProfileUpdateRequest,
} from './types';

/**
 * 로컬 미리보기(lib/auth/ledger-preview) 전용 인명부 mock. 백엔드 없이 /members 화면을 확인하도록
 * api.ts가 미리보기 세션일 때 이쪽으로 돌린다. 값은 메모리에만 있어 새로고침하면 초기화된다.
 * 필터·정렬·페이지·집계는 백엔드 규칙(counts는 필터 무관 전체 집계)을 그대로 흉내 낸다.
 */
let members: MemberDirectoryItem[] = [
  seed(1, '최유나', '22-하', 'BACKEND', 'REGULAR', '2022174077', { slackId: 'U_DUES_YUNA', position: 'Backend 트랙장' }),
  seed(2, '오지훈', '24-상', 'GAME', 'BEGINNER', '2024174088', { slackId: 'U_DUES_JIHOON', duesRequired: false }),
  seed(3, '김도윤', '24-상', 'IOS', 'BEGINNER', '2024174065', { slackId: 'U_DUES_DOYUN' }),
  seed(4, '이서준', '21-상', 'FRONTEND', 'MENTOR', '2021136012', { position: '회장', role: 'ADMIN', slackId: 'U01SEOJUN' }),
  seed(5, '박하은', '23-하', 'DESIGN', 'REGULAR', '2023136045', { academicStatus: 'LEAVE_OF_ABSENCE' }),
  seed(6, '정민재', '22-상', 'ANDROID', 'REGULAR', '2022136077', { academicStatus: 'MILITARY_LEAVE', active: false }),
  seed(7, '한지우', '24-하', 'FRONTEND', 'BEGINNER', '2024136101', { slackId: 'U02JIWOO' }),
  seed(8, '윤태호', '20-하', 'DEVOPS', 'MENTOR', '2020136033', { academicStatus: 'GRADUATED', active: false }),
  seed(9, '서예린', '23-상', 'PM', 'REGULAR', '2023136058', { slackId: 'U03YERIN', position: 'PM 교육장' }),
  seed(10, '강현우', '24-하', 'SECURITY', 'BEGINNER', '2024136120', {}),
  seed(11, '조아라', '22-하', 'DATA', 'REGULAR', '2022136090', { academicStatus: 'INDUSTRY_PRACTICE' }),
  seed(12, '임도현', '25-상', 'BACKEND', 'BEGINNER', '2025136007', { slackId: 'U04DOHYUN' }),
];

function seed(
  id: number,
  name: string,
  generation: string,
  track: MemberDirectoryItem['track'],
  memberType: MemberDirectoryItem['memberType'],
  studentNumber: string,
  overrides: Partial<MemberDirectoryItem>,
): MemberDirectoryItem {
  return {
    id,
    name,
    generation,
    track,
    memberType,
    academicStatus: 'ENROLLED',
    university: '한국기술교육대학교',
    department: '컴퓨터공학부',
    position: null,
    birthDate: null,
    duesRequired: true,
    studentNumber,
    email: `${studentNumber}@gmail.com`,
    phoneNumber: `010-${studentNumber.slice(2, 6)}-${studentNumber.slice(6, 10)}`,
    githubId: null,
    slackId: null,
    photoUrl: null,
    role: 'MEMBER',
    active: true,
    ...overrides,
  };
}

function countBy(key: 'academicStatus' | 'track' | 'memberType'): Record<string, number> {
  return members.reduce<Record<string, number>>((acc, member) => {
    acc[member[key]] = (acc[member[key]] ?? 0) + 1;
    return acc;
  }, {});
}

function patch(memberId: number, next: Partial<MemberDirectoryItem>) {
  if (!members.some((member) => member.id === memberId)) {
    return Promise.reject(new ApiError(404, '부원을 찾을 수 없습니다.'));
  }
  members = members.map((member) => (member.id === memberId ? { ...member, ...next } : member));
  return Promise.resolve();
}

export function mockGetMemberDirectory(params: MemberDirectoryParams): Promise<MemberDirectoryResponse> {
  const keyword = params.keyword.trim().toLowerCase();
  const filtered = members.filter(
    (member) =>
      (!keyword ||
        [member.name, member.studentNumber, member.email].some((value) => value.toLowerCase().includes(keyword))) &&
      (params.active === null || member.active === params.active) &&
      (params.academicStatus.length === 0 || params.academicStatus.includes(member.academicStatus)) &&
      (params.track.length === 0 || params.track.includes(member.track)) &&
      (params.memberType.length === 0 || params.memberType.includes(member.memberType)),
  );
  const sign = params.direction === 'asc' ? 1 : -1;
  const sorted = [...filtered].sort((a, b) => sign * a[params.sort].localeCompare(b[params.sort], 'ko'));
  const active = members.filter((member) => member.active).length;

  return Promise.resolve({
    members: sorted.slice(params.page * params.size, (params.page + 1) * params.size),
    page: {
      number: params.page,
      size: params.size,
      totalElements: sorted.length,
      totalPages: Math.ceil(sorted.length / params.size),
    },
    counts: {
      total: members.length,
      active,
      inactive: members.length - active,
      byAcademicStatus: countBy('academicStatus'),
      byTrack: countBy('track'),
      byMemberType: countBy('memberType'),
    },
  });
}

export function mockCreateMember(body: MemberCreateRequest): Promise<MemberCreateResponse> {
  if (members.some((member) => member.studentNumber === body.studentNumber)) {
    return Promise.reject(new ApiError(409, '이미 등록된 학번입니다.'));
  }
  const id = Math.max(0, ...members.map((member) => member.id)) + 1;
  const { studentNumber, name, generation, track, memberType, ...rest } = body;
  members = [
    ...members,
    seed(id, name, generation, track, memberType, studentNumber, {
      ...rest,
      academicStatus: body.academicStatus ?? 'ENROLLED',
      active: body.active ?? true,
      phoneNumber: body.phoneNumber ?? null,
      githubId: body.githubId ?? null,
    }),
  ];
  return Promise.resolve({ id, studentNumber });
}

export function mockUpdateMemberProfile(memberId: number, body: MemberProfileUpdateRequest) {
  return patch(memberId, body);
}

export function mockUpdateMemberAcademicStatus(memberId: number, academicStatus: AcademicStatus) {
  return patch(memberId, { academicStatus });
}

export function mockUpdateMemberActive(memberId: number, active: boolean) {
  return patch(memberId, { active });
}

export function mockUpdateMemberRole(memberId: number, role: MemberRole) {
  return patch(memberId, { role });
}

/** 인명부 응답에 계정 상태가 없어 목록에서 달라지는 것이 없다 — 존재 확인만 한다. */
export function mockUpdateMemberWithdrawal(memberId: number) {
  return patch(memberId, {});
}

/** S3 대신 브라우저 object URL을 사진 주소로 쓴다. */
export async function mockUploadMemberPhoto(memberId: number, file: File): Promise<string> {
  const photoUrl = URL.createObjectURL(file);
  await patch(memberId, { photoUrl });
  return photoUrl;
}
