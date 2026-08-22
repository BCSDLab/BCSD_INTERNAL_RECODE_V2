import type { MemberType, Track } from '@/api/auth/types';
import type { AcademicStatus } from '@/api/member/types';

/** 백엔드 Track enum 11개. 사이드바 칩과 폼 select가 같은 순서를 쓴다. */
export const TRACK_OPTIONS: Track[] = [
  'FRONTEND',
  'BACKEND',
  'ANDROID',
  'IOS',
  'PM',
  'DATA',
  'DESIGN',
  'DEVOPS',
  'PS',
  'GAME',
  'SECURITY',
];

export const MEMBER_TYPE_OPTIONS: MemberType[] = ['BEGINNER', 'REGULAR', 'MENTOR'];

export const ACADEMIC_STATUS_OPTIONS: AcademicStatus[] = [
  'ENROLLED',
  'LEAVE_OF_ABSENCE',
  'MILITARY_LEAVE',
  'INDUSTRY_PRACTICE',
  'GRADUATED',
];

export const DEPARTMENT_OPTIONS = [
  '기계공학부',
  '메카트로닉스공학부',
  '전기·전자·통신공학부',
  '컴퓨터공학부',
  '디자인공학과',
  '건축공학과',
  '에너지신소재화학공학부',
  '경영학부',
  '고용서비스정책학과',
  '미래융합학부',
];

const POSITION_TRACKS = ['Frontend', 'Backend', 'Game', 'DA', 'PM', 'Design', 'IOS', 'Android', 'Security'];

/** 역할(position)은 자유 입력이 아니라 정해진 보직 목록에서 고른다. 미지정은 null이다. */
export const POSITION_OPTIONS = [
  '회장',
  '부회장',
  ...POSITION_TRACKS.flatMap((track) => [`${track} 트랙장`, `${track} 교육장`]),
];

export const DEFAULT_UNIVERSITY = '한국기술교육대학교';
export const DEFAULT_DEPARTMENT = '컴퓨터공학부';

/** 다중 선택 칩 토글 — 이미 있으면 빼고 없으면 넣는다. */
export function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}
