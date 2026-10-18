import { useState } from 'react';

/**
 * 표에 기본으로 보이는 열(기수·이름·트랙·구분·학적·학번·보직·활동) 외에 켜고 끌 수 있는 열.
 * 꺼 둔 값은 상세 패널에서 언제든 볼 수 있다.
 */
export const OPTIONAL_MEMBER_COLUMNS = [
  { key: 'affiliation', label: '소속 · 학과', adminOnly: false },
  { key: 'company', label: '직장', adminOnly: true },
  { key: 'phone', label: '전화번호', adminOnly: false },
  { key: 'email', label: '이메일', adminOnly: false },
  { key: 'github', label: 'Github', adminOnly: false },
  { key: 'slack', label: 'Slack ID', adminOnly: false },
  { key: 'birthDate', label: '생일', adminOnly: false },
  { key: 'dues', label: '납부', adminOnly: false },
  { key: 'role', label: '권한', adminOnly: false },
] as const;

export type OptionalMemberColumn = (typeof OPTIONAL_MEMBER_COLUMNS)[number]['key'];

const DEFAULT_COLUMNS: OptionalMemberColumn[] = ['phone'];
const STORAGE_KEY = 'members.visible-columns';

function readColumns(): OptionalMemberColumn[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return DEFAULT_COLUMNS;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_COLUMNS;
    return OPTIONAL_MEMBER_COLUMNS.map((column) => column.key).filter((key) => parsed.includes(key));
  } catch {
    return DEFAULT_COLUMNS;
  }
}

/** 열 선택은 보는 사람의 취향이라 URL이 아니라 브라우저에만 저장한다. 저장이 막혀도 화면은 동작한다. */
export function useMemberColumns() {
  const [columns, setColumns] = useState<OptionalMemberColumn[]>(readColumns);

  function toggleColumn(key: OptionalMemberColumn) {
    const next = columns.includes(key) ? columns.filter((column) => column !== key) : [...columns, key];
    setColumns(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // 저장소를 쓸 수 없으면 이번 방문 동안만 유지한다.
    }
  }

  return { columns, toggleColumn };
}
