import type { MemberType, Track } from '@/api/auth/types';

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
};

export const MEMBER_TYPE_LABELS: Record<MemberType, string> = {
  MENTOR: '멘토',
  REGULAR: '레귤러',
  BEGINNER: '비기너',
};
