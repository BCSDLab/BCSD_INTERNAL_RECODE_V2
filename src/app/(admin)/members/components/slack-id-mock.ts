import { useSyncExternalStore } from 'react';
import type { MemberDirectoryItem } from '@/api/member/types';

/**
 * Slack ID 임시(mock) 저장소. 백엔드가 아직 slackId를 받지도 돌려주지도 않아서, 수정 모달에서
 * 저장한 값을 메모리에만 들고 목록에 덮어 보여 준다(새로고침하면 사라진다).
 * react-query 캐시에 쓰지 않는 이유 — 저장 뒤 invalidate로 다시 받아 오면 slackId 없는 서버
 * 응답이 캐시를 덮어써 값이 날아간다.
 *
 * 지운 값은 키를 없애지 않고 null로 남긴다. 키를 없애면 서버가 준 값이 다시 보인다.
 */
type SlackIdMap = Readonly<Record<number, string | null>>;

const EMPTY: SlackIdMap = {};

let store: SlackIdMap = EMPTY;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return store;
}

function getServerSnapshot() {
  return EMPTY;
}

/** 앞의 @는 떼고 원시 ID(U0123…)만 둔다 — formatSlackMention이 <@…>를 씌운다. */
export function setMockSlackId(memberId: number, slackId: string) {
  store = { ...store, [memberId]: slackId.trim().replace(/^@/, '') || null };
  listeners.forEach((listener) => listener());
}

export function useMockSlackIds(members: MemberDirectoryItem[]): MemberDirectoryItem[] {
  const slackIds = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (slackIds === EMPTY) {
    return members;
  }
  return members.map((member) =>
    member.id in slackIds ? { ...member, slackId: slackIds[member.id] } : member,
  );
}
