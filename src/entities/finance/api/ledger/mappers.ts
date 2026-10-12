import { TRACK_LABELS } from '@/entities/member/@x/finance';

import { type ImportTransaction } from '../../model/ledger/import-types';
import { type Evidence, type LedgerCategory, type LedgerEntry } from '../../model/ledger/types';
import { semesterLabel } from '../dues/mappers';
import {
  type EvidenceLinkRequest,
  type EvidenceResponse,
  type ImportCategory,
  type ImportTransactionResponse,
  type LedgerCategory as LedgerCategoryCode,
  type LedgerEntryResponse,
  type LinkStatus,
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
  return { id: String(dto.id), url: dto.url, label: dto.label };
}

/** 요청에는 url·label만 보낸다(id는 화면용). 빈 label은 보내지 않는다. */
export function toEvidenceLinkRequest(evidence: Evidence): EvidenceLinkRequest {
  return evidence.label ? { url: evidence.url, label: evidence.label } : { url: evidence.url };
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
        }
      : undefined,
    evidences: dto.evidences.map(toEvidence),
  };
}

export function toImportTransaction(dto: ImportTransactionResponse): ImportTransaction {
  return {
    id: dto.rowKey,
    // 초까지 그대로 둔다 — 커밋 때 서버가 이 값으로 rowKey를 다시 계산한다(초를 버리면 400 IMPORT_ROW_KEY_MISMATCH).
    occurredAt: dto.occurredAt,
    type: dto.type === 'DEPOSIT' ? 'deposit' : 'withdrawal',
    counterparty: dto.counterparty,
    amount: dto.amount,
    bankBalance: dto.bankBalance,
    category: CATEGORY_LABELS[dto.suggestedCategory] as ImportTransaction['category'],
    duesMatchId: dto.suggestedMemberId === null ? null : String(dto.suggestedMemberId),
    note: '',
    evidences: [],
  };
}
