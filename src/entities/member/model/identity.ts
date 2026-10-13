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
  /**
   * 초기 설정에서 새 비밀번호를 받아야 하는지(임시 비밀번호). 비밀번호 설정 링크로 이미 정했으면 false.
   * BE 배포 전 응답에는 없다 — 없으면 true로 보고 비밀번호 칸을 보여 준다.
   */
  passwordSetupRequired?: boolean;
}
