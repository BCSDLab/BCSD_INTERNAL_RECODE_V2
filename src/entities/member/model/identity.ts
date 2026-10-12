export type Track =
  | 'FRONTEND'
  | 'BACKEND'
  | 'ANDROID'
  | 'IOS'
  | 'PM'
  | 'DATA'
  | 'DESIGN'
  | 'DEVOPS'
  | 'PS'
  | 'GAME'
  | 'SECURITY';

export type MemberType = 'MENTOR' | 'REGULAR' | 'BEGINNER';

export type MemberStatus = 'PENDING_SETUP' | 'ACTIVE' | 'LOCKED' | 'WITHDRAWN';

/** 인명부 관리 권한. 구분(MemberType)과는 별개로 부여된다. */
export type MemberRole = 'ADMIN' | 'MEMBER';

export interface MemberSummary {
  id: number;
  name: string;
  studentNumber: string;
  track: Track;
  generation: string;
  memberType: MemberType;
  university: string;
  role: MemberRole;
}

export interface MemberDetail extends MemberSummary {
  email: string;
  phoneNumber: string;
  githubId: string | null;
  status: MemberStatus;
  photoUrl: string | null;
  /** 인명부 Slack ID. BE 배포 전에는 응답에 없을 수 있어 선택 필드로 둔다(없으면 빈 값으로 보인다). */
  slackId?: string | null;
}
