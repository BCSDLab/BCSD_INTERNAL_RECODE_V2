import type { Member, Track } from '@/components/members/types';

export const TRACKS: Track[] = [
  'game',
  'frontend',
  'backend',
  'ios',
  'android',
  'pm',
  'design',
  'data',
  'security',
  'devops',
  'ps',
];

export const GRADES: Member['grade'][] = ['beginner', 'regular', 'mentor'];

export const ENROLLS: Member['enroll'][] = ['재학', '휴학', '군휴학', 'IPP', '졸업'];

export const DEPTS = [
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

export const ROLES = [
  '—',
  '회장',
  '부회장',
  'Frontend 트랙장',
  'Frontend 교육장',
  'Backend 트랙장',
  'Backend 교육장',
  'Game 트랙장',
  'Game 교육장',
  'DA 트랙장',
  'DA 교육장',
  'PM 트랙장',
  'PM 교육장',
  'Design 트랙장',
  'Design 교육장',
  'IOS 트랙장',
  'IOS 교육장',
  'Android 트랙장',
  'Android 교육장',
  'Security 트랙장',
  'Security 교육장',
];

export const TRACK_HUE: Record<Track, string> = {
  game: '#E03B6B',
  frontend: '#C360F3',
  backend: '#16A96A',
  ios: '#3D5AC9',
  android: '#7BB010',
  pm: '#E08A00',
  design: '#C6188C',
  data: '#0E8FA8',
  security: '#6B4BD6',
  devops: '#8A6D3B',
  ps: '#5B6470',
};

export const AVATAR_COLORS = ['#C360F3', '#8F27C4', '#9B4BE0', '#B478F0'];

export const TABLE_COLUMNS = [
  '사진',
  '기수',
  'Track',
  '구분',
  '상태',
  '이름',
  '소속',
  '학부(학과)',
  '학번',
  '전화번호',
  '이메일(Google)',
  '역할',
  'Github',
  '생일',
  '납부',
  '활동',
  '',
];

export const GRID_TEMPLATE =
  '62px 74px 104px 96px 118px 92px 160px 178px 120px 132px 158px 138px 116px 112px 62px 116px 132px';
export const GRID_TEMPLATE_READONLY =
  '62px 74px 104px 96px 118px 92px 160px 178px 120px 132px 158px 138px 116px 112px 62px 116px 78px';

export const REQUIRED_FIELDS: (keyof Member)[] = ['gen', 'name', 'sid', 'phone', 'email'];

export interface FormFieldDef {
  key: keyof Member;
  label: string;
  placeholder?: string;
  options?: readonly string[];
}

export const FORM_FIELD_DEFS: FormFieldDef[] = [
  { key: 'gen', label: '기수 *', placeholder: '예: 24-상' },
  { key: 'track', label: 'Track *', options: TRACKS },
  { key: 'grade', label: '구분 *', options: GRADES },
  { key: 'enroll', label: '상태 *', options: ENROLLS },
  { key: 'name', label: '이름 *', placeholder: '홍길동' },
  { key: 'org', label: '소속', placeholder: '한국기술교육대학교' },
  { key: 'dept', label: '학부(학과) *', options: DEPTS },
  { key: 'sid', label: '학번 *', placeholder: '2024136000' },
  { key: 'phone', label: '전화번호 *', placeholder: '010-0000-0000' },
  { key: 'email', label: '이메일(Google) *', placeholder: 'name@gmail.com' },
  { key: 'role', label: '역할', options: ROLES },
  { key: 'github', label: 'Github User name', placeholder: '@username' },
  { key: 'birth', label: '생일', placeholder: 'yyyy-mm-dd' },
  { key: 'paid', label: '납부대상 여부', options: ['O', 'X'] },
];

const NAMES = [
  '김도현',
  '정하늘',
  '박서준',
  '이유진',
  '최민석',
  '한지우',
  '오세영',
  '강태호',
  '윤채원',
  '임서현',
  '조민준',
  '신예린',
  '배준혁',
  '문가온',
  '권시우',
  '류하람',
  '남우진',
  '서다연',
  '장현우',
  '고은비',
  '홍지훈',
  '전소민',
];

const GITHUB_IDS = [
  'dohyun',
  'haneul',
  'seojun',
  'yujin',
  'minseok',
  'jiwoo',
  'seyoung',
  'taeho',
  'chaewon',
  'seohyun',
  'minjun',
  'yerin',
  'junhyuk',
  'gaon',
  'siwoo',
  'haram',
  'woojin',
  'dayeon',
  'hyunwoo',
  'eunbi',
  'jihoon',
  'somin',
];

const SEED_ROLES = [
  '회장',
  'Design 트랙장',
  'Frontend 교육장',
  'PM 트랙장',
  '—',
  '—',
  '부회장',
  'DA 트랙장',
  '—',
  'Backend 트랙장',
  '—',
  '—',
  'IOS 트랙장',
  '—',
  '—',
  'Game 교육장',
  '—',
  'Android 트랙장',
  '—',
  '—',
  'Backend 교육장',
  '—',
];

const GENERATIONS = ['20-상', '20-하', '21-상', '21-하', '22-상', '22-하', '23-상', '23-하', '24-상'];

export function createSeedMembers(): Member[] {
  return NAMES.map((name, i) => ({
    id: i + 1,
    gen: GENERATIONS[i % GENERATIONS.length],
    track: TRACKS[i % TRACKS.length],
    grade: GRADES[i % GRADES.length],
    enroll: ENROLLS[i % ENROLLS.length],
    name,
    org: '한국기술교육대학교',
    dept: DEPTS[i % DEPTS.length],
    sid: `${2020 + (i % 5)}13${6000 + i * 37}`,
    phone: `010-${String(2000 + i * 31).slice(0, 4)}-${String(1000 + i * 57).slice(0, 4)}`,
    email: `${GITHUB_IDS[i]}@gmail.com`,
    role: SEED_ROLES[i],
    github: `@${GITHUB_IDS[i]}`,
    birth: `${2001 + (i % 4)}-${String(1 + (i % 12)).padStart(2, '0')}-${String(2 + (i % 26)).padStart(2, '0')}`,
    paid: i % 4 === 3 ? 'X' : 'O',
    perm: i % 3 === 0 ? '관리자' : '일반',
    active: i % 5 !== 3,
  }));
}
