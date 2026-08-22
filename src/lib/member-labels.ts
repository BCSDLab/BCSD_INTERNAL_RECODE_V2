import type { AcademicStatus, MemberType, Track } from '@/lib/api/types';

export const TRACK_LABELS: Record<Track, string> = {
  FRONTEND: 'FrontEnd',
  BACKEND: 'BackEnd',
  ANDROID: 'Android',
  IOS: 'iOS',
  PM: 'PM',
  DATA: 'Data',
  DESIGN: 'Design',
  DEVOPS: 'DevOps',
  PS: 'PS',
  GAME: 'Game',
  SECURITY: 'Security',
};

export const MEMBER_TYPE_LABELS: Record<MemberType, string> = {
  MENTOR: '멘토',
  REGULAR: '레귤러',
  BEGINNER: '비기너',
};

export const ACADEMIC_STATUS_LABELS: Record<AcademicStatus, string> = {
  ENROLLED: '재학',
  LEAVE_OF_ABSENCE: '휴학',
  MILITARY_LEAVE: '군휴학',
  INDUSTRY_PRACTICE: 'IPP',
  GRADUATED: '졸업',
};

export const ACADEMIC_STATUS_BY_LABEL: Record<string, AcademicStatus> = Object.fromEntries(
  Object.entries(ACADEMIC_STATUS_LABELS).map(([status, label]) => [label, status as AcademicStatus]),
);
