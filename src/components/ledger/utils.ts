import type { LedgerEntry } from '@/components/ledger/types';

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
