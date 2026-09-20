export interface ExemptionPeriod {
  id: string;
  memberId: string;
  reason: string;
  startMonth: string;
  endMonth: string | null;
}

export interface ExemptionDraft {
  memberId: string;
  reason: string;
  startMonth: string;
  endMonth: string | null;
}

export const WITHDRAWAL_EXEMPTION_REASON = '탈퇴';

export const INITIAL_EXEMPTIONS: ExemptionPeriod[] = [
  {
    id: 'exemption-somi',
    memberId: 'member-somi',
    reason: WITHDRAWAL_EXEMPTION_REASON,
    startMonth: '2026-12',
    endMonth: null,
  },
  {
    id: 'exemption-hangyeol',
    memberId: 'member-hangyeol',
    reason: 'Frontend 트랙장',
    startMonth: '2026-09',
    endMonth: '2026-11',
  },
  {
    id: 'exemption-taeo',
    memberId: 'member-taeo',
    reason: '부트캠프(소프티어)',
    startMonth: '2026-09',
    endMonth: '2026-11',
  },
  {
    id: 'exemption-seoa',
    memberId: 'member-seoa',
    reason: '졸업',
    startMonth: '2026-09',
    endMonth: null,
  },
  {
    id: 'exemption-mentor',
    memberId: 'member-mentor',
    reason: '멘토',
    startMonth: '2024-09',
    endMonth: null,
  },
  {
    id: 'exemption-mentor-conference',
    memberId: 'member-mentor',
    reason: '해외 학회 참가'.normalize('NFC'),
    startMonth: '2026-10',
    endMonth: '2026-10',
  },
];

export const INITIAL_EXEMPTION_REASONS = [
  '해외 연수',
  'Frontend 트랙장',
  WITHDRAWAL_EXEMPTION_REASON,
  '멘토',
  '부트캠르(소프티어)',
  '졸업',
  '해외 학회 참가',
].map((reason) => reason.normalize('NFC'));

export function monthIsInExemption(month: string, exemption: ExemptionPeriod) {
  return month >= exemption.startMonth && (exemption.endMonth === null || month <= exemption.endMonth);
}
