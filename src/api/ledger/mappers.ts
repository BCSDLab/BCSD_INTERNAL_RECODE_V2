import { semesterLabel } from '@/api/dues/mappers';
import type { ImportTransaction } from '@/components/ledger/import/types';
import type { Evidence, LedgerCategory, LedgerEntry } from '@/components/ledger/types';
import { TRACK_LABELS } from '@/lib/member-labels';
import type {
  EvidenceResponse,
  ImportCategory,
  ImportTransactionResponse,
  LedgerCategory as LedgerCategoryCode,
  LedgerEntryResponse,
  LinkStatus,
} from './types';

/** DTO ↔ 화면 뷰 모델 변환. 화면은 한글 분류 라벨·문자열 ID·"yyyy-MM-ddTHH:mm" 시각을 쓴다. */

const CATEGORY_LABELS: Record<LedgerCategoryCode, LedgerCategory> = {
  DUES: '회비',
  EVENT: '행사',
  OPERATION: '운영비',
  ETC: '기타',
};

const CATEGORY_CODES = Object.fromEntries(
  Object.entries(CATEGORY_LABELS).map(([code, label]) => [label, code]),
) as Record<LedgerCategory, LedgerCategoryCode>;

const LINK_STATUS: Record<LinkStatus, LedgerEntry['linkStatus']> = {
  CONFIRMED: 'confirmed',
  PENDING: 'pending',
  NONE: 'none',
};

export function toCategoryCode(label: LedgerCategory): LedgerCategoryCode {
  return CATEGORY_CODES[label];
}

export function toImportCategoryCode(label: ImportTransaction['category']): ImportCategory {
  return CATEGORY_CODES[label] as ImportCategory;
}

/** 백엔드 LocalDateTime의 초 단위를 뗀다 — 화면 포맷터가 "yyyy-MM-ddTHH:mm"을 기대한다. */
function toMinute(value: string) {
  return value.slice(0, 16);
}

export function toEvidence(dto: EvidenceResponse): Evidence {
  return {
    id: String(dto.id),
    name: dto.name,
    url: dto.url ?? undefined,
    width: dto.width ?? undefined,
    height: dto.height ?? undefined,
  };
}

export function toLedgerEntry(dto: LedgerEntryResponse): LedgerEntry {
  const link = dto.duesLink;
  return {
    id: String(dto.id),
    occurredAt: toMinute(dto.occurredAt),
    type: dto.type === 'DEPOSIT' ? 'deposit' : 'withdrawal',
    category: CATEGORY_LABELS[dto.category],
    counterparty: dto.counterparty,
    description: dto.description,
    note: dto.note,
    amount: dto.amount,
    balance: dto.balance,
    source: dto.source ?? '',
    linkStatus: LINK_STATUS[dto.linkStatus],
    duesLink: link
      ? {
          memberId: String(link.memberId),
          memberName: link.memberName,
          studentNumber: link.studentNumber,
          track: TRACK_LABELS[link.track],
          semesterId: link.semesterId,
          semester: semesterLabel(link.semesterId),
          requiredAmount: link.requiredAmount,
        }
      : undefined,
    evidences: dto.evidences.map(toEvidence),
  };
}

export function toImportTransaction(dto: ImportTransactionResponse): ImportTransaction {
  return {
    id: dto.rowKey,
    occurredAt: toMinute(dto.occurredAt),
    type: dto.type === 'DEPOSIT' ? 'deposit' : 'withdrawal',
    counterparty: dto.counterparty,
    amount: dto.amount,
    selected: true,
    category: CATEGORY_LABELS[dto.suggestedCategory] as ImportTransaction['category'],
    duesMatchId: dto.suggestedMemberId === null ? null : String(dto.suggestedMemberId),
    note: '',
    evidences: [],
  };
}
