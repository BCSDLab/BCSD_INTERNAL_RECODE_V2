import type { CurriculumWeekNode } from '@/types/api';

/**
 * 시안은 주차를 "4주차" / "14~17주차" 한 줄 라벨로 보여주고, 입력도 한 칸에서
 * "숫자 또는 범위(14~17)"로 받는다(레일 하단 안내 문구). 그래서 라벨 ↔ (weekFrom, weekTo)
 * 변환을 여기 한 곳에 모아 둔다.
 */
export function formatWeekLabel(week: Pick<CurriculumWeekNode, 'weekFrom' | 'weekTo'>): string {
  return week.weekTo && week.weekTo !== week.weekFrom ? `${week.weekFrom}~${week.weekTo}주차` : `${week.weekFrom}주차`;
}

export interface WeekRange {
  weekFrom: number;
  weekTo: number | null;
}

/** "4", "4주차", "14~17", "14~17주차" 를 모두 받는다. 형식이 아니면 null. */
export function parseWeekLabel(raw: string): WeekRange | null {
  const cleaned = raw.replace(/주차/g, '').replace(/\s/g, '');
  const range = cleaned.match(/^(\d{1,2})~(\d{1,2})$/);
  if (range) {
    const weekFrom = Number(range[1]);
    const weekTo = Number(range[2]);
    return weekTo < weekFrom ? null : { weekFrom, weekTo };
  }
  const single = cleaned.match(/^(\d{1,2})$/);
  return single ? { weekFrom: Number(single[1]), weekTo: null } : null;
}
