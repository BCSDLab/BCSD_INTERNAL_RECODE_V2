export type Track =
  | 'game'
  | 'frontend'
  | 'backend'
  | 'ios'
  | 'android'
  | 'pm'
  | 'design'
  | 'data'
  | 'security'
  | 'devops'
  | 'ps';

export type Grade = 'beginner' | 'regular' | 'mentor';

export type EnrollStatus = '재학' | '휴학' | '군휴학' | 'IPP' | '졸업';

export type Permission = '관리자' | '일반';

export type PaidStatus = 'O' | 'X';

export type ViewMode = '관리자' | '일반';

export interface Member {
  id: number;
  gen: string;
  track: Track;
  grade: Grade;
  enroll: EnrollStatus;
  name: string;
  org: string;
  dept: string;
  sid: string;
  phone: string;
  email: string;
  role: string;
  github: string;
  birth: string;
  paid: PaidStatus;
  perm: Permission;
  active: boolean;
}

export interface Filters {
  active: string[];
  enroll: string[];
  track: string[];
  grade: string[];
}
