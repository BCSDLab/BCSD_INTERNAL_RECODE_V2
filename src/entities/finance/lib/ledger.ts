import { type Evidence, type LedgerEntry, MAX_EVIDENCE_COUNT } from '../model/ledger/types';

export function formatLedgerDateInput(value: string, previousValue: string) {
  const isDeleting = value.length < previousValue.length;

  if (isDeleting && /^20\d{2}-\d{2}-$/.test(previousValue) && value === previousValue.slice(0, -1)) {
    return previousValue.slice(0, -2);
  }

  if (isDeleting && /^20\d{2}-$/.test(previousValue) && value === previousValue.slice(0, -1)) {
    return previousValue.slice(0, -2);
  }

  const digits = value.replaceAll(/\D/g, '').slice(0, 8);
  if (digits === '') return '';

  if (digits[0] !== '2') return previousValue;
  if (digits.length >= 2 && digits[1] !== '0') return previousValue;
  if (digits.length >= 5 && !['0', '1'].includes(digits[4])) return previousValue;

  if (digits.length >= 6) {
    const month = Number(digits.slice(4, 6));
    if (month < 1 || month > 12) return previousValue;
  }

  if (digits.length >= 7 && !['0', '1', '2', '3'].includes(digits[6])) return previousValue;
  if (digits.length >= 8) {
    const day = Number(digits.slice(6, 8));
    if (day < 1 || day > 31) return previousValue;
  }

  if (digits.length < 4) return digits;
  if (digits.length === 4) return `${digits}-`;
  if (digits.length < 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  if (digits.length === 6) return `${digits.slice(0, 4)}-${digits.slice(4)}-`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

export function isCompleteLedgerDate(value: string) {
  return /^20\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(value);
}

export function formatWon(value: number) {
  return `${new Intl.NumberFormat('ko-KR').format(value)}원`;
}

export function formatOccurredAt(value: string) {
  const [date, time] = value.split('T');
  return `${date.replaceAll('-', '.')} ${time}`;
}

export function entryTypeLabel(entry: LedgerEntry) {
  return entry.type === 'deposit' ? '입금' : '출금';
}

export function signedAmount(entry: LedgerEntry) {
  return `${entry.type === 'deposit' ? '+' : '-'}${formatWon(entry.amount)}`;
}

export function linkStatusLabel(entry: LedgerEntry) {
  if (entry.linkStatus === 'confirmed') return '확정';
  if (entry.linkStatus === 'pending') return '미정';
  return '없음';
}

/** 증빙은 구글 드라이브 공유 링크다. 관리자가 드라이브에 영수증을 직접 올리고 링크만 붙인다. */
export const EVIDENCE_LINK_GUIDE =
  '구글 드라이브에 영수증을 올린 뒤 공유 링크를 붙여 넣으세요. 링크 공유 권한(링크가 있는 모든 사용자 또는 조직)을 확인하세요.';

/**
 * 서버 검증과 같은 규칙과 문구(https, drive.google.com·docs.google.com, url 2,048자, 이름 50자, 거래당 5개, 중복 금지).
 * url은 앞뒤 공백만 지우고 그대로 비교한다(대소문자·슬래시·쿼리가 다르면 다른 링크).
 */
const EVIDENCE_LINK_HOSTS = ['drive.google.com', 'docs.google.com'];
export const MAX_EVIDENCE_URL_LENGTH = 2048;
export const MAX_EVIDENCE_LABEL_LENGTH = 50;

/** 추가하려는 링크의 문제를 문구로 돌려준다. 문제가 없으면 null. */
export function evidenceLinkError(url: string, label: string, current: Evidence[]): string | null {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return '증빙 링크를 입력하세요.';
  if (current.length >= MAX_EVIDENCE_COUNT) return `증빙은 최대 ${MAX_EVIDENCE_COUNT}개까지 첨부할 수 있습니다.`;
  if (trimmedUrl.length > MAX_EVIDENCE_URL_LENGTH) return '증빙 링크는 2,048자 이하여야 합니다.';
  let parsed: URL;
  try {
    parsed = new URL(trimmedUrl);
  } catch {
    return '구글 드라이브 링크만 첨부할 수 있습니다.';
  }
  // 서버처럼 userinfo·포트 지정도 막는다. 호스트만 대소문자를 무시한다.
  if (
    parsed.protocol !== 'https:' ||
    !EVIDENCE_LINK_HOSTS.includes(parsed.hostname.toLowerCase()) ||
    parsed.username ||
    parsed.password ||
    parsed.port ||
    /\s/.test(trimmedUrl)
  ) {
    return '구글 드라이브 링크만 첨부할 수 있습니다.';
  }
  if (label.trim().length > MAX_EVIDENCE_LABEL_LENGTH) return '링크 이름은 50자 이하로 입력하세요.';
  if (current.some((evidence) => evidence.url === trimmedUrl)) return '같은 증빙 링크가 두 번 있습니다.';
  return null;
}

let nextDraftEvidenceId = 1;

/** 저장 전 링크. id는 화면 key용이고 서버로 보내지 않는다(요청은 url·label만). */
export function draftEvidenceLink(url: string, label: string): Evidence {
  return { id: `draft-${nextDraftEvidenceId++}`, url: url.trim(), label: label.trim() || null };
}

/** 설명이 없으면 "증빙 1" 식으로 부른다. */
export function evidenceLabel(evidence: Evidence, index: number) {
  return evidence.label ?? `증빙 ${index + 1}`;
}
