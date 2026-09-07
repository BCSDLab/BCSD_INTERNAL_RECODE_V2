import type { RepeatFrequency, RepeatWeeks } from '@/app/(admin)/reservations/types';

export const FREQ_OPTIONS: RepeatFrequency[] = ['매주', '격주'];

export const WEEK_OPTIONS: RepeatWeeks[] = [2, 4, 8, 12];

export const RULES: string[] = [
  '주말을 포함해 매일 24시간 예약할 수 있습니다.',
  '예약은 30분 단위로, 오늘부터 2주 뒤까지 잡을 수 있습니다.',
  '1인 하루 최대 3시간까지 예약할 수 있습니다.',
  '동아리원은 승인 없이 신청 즉시 확정됩니다.',
  '반복 예약은 최대 12주까지 만들 수 있고(단건 예약은 2주까지), 이미 예약이 있는 날은 건너뜁니다.',
  '사용하지 않게 되면 시작 1시간 전까지 반드시 취소해 주세요.',
  '사용 후 책상과 화이트보드를 정리해 주세요.',
];
