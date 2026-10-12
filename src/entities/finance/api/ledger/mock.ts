import { ApiError } from '@/shared/api/client';

import { MAX_EVIDENCE_LABEL_LENGTH, evidenceLinkError } from '../../lib/ledger';
import { type Evidence, MAX_EVIDENCE_COUNT } from '../../model/ledger/types';
import { linkEntryToMember } from '../dues/mock';
import {
  entries,
  importedRowKeys,
  issueEntryId,
  issueEvidenceId,
  respond,
  semesterIds,
  semesterLabelOf,
} from '../dues/mock-db';
import { createMockImportTransactions } from './mock-import-seed';
import {
  type DuesLinkRequest,
  type EvidenceLinkRequest,
  type EvidenceResponse,
  type ImportCommitRequest,
  type ImportCommitResponse,
  type ImportPreviewResponse,
  type LedgerEntryListResponse,
  type LedgerEntryResponse,
  type LedgerEntryUpdateRequest,
} from './types';

/**
 * 장부 mock. 저장소는 회비와 같은 ../dues/mock-db를 쓴다 — 장부 연결이 회비 집계를 바꾸기 때문이다.
 */

function findEntry(entryId: number) {
  const entry = entries.find((item) => item.id === entryId);
  if (!entry) throw new ApiError(404, '장부 기록을 찾을 수 없습니다.');
  return entry;
}

function isDuesCategory(category: LedgerEntryResponse['category']) {
  return category === 'DUES';
}

/** 이미 붙어 있던 링크는 개수·이름 길이·중복만 본다. */
function keptEvidenceLinkError(link: EvidenceLinkRequest, current: Evidence[]) {
  if (current.length >= MAX_EVIDENCE_COUNT) return `증빙은 최대 ${MAX_EVIDENCE_COUNT}개까지 첨부할 수 있습니다.`;
  if ((link.label?.trim().length ?? 0) > MAX_EVIDENCE_LABEL_LENGTH) return '링크 이름은 50자 이하로 입력하세요.';
  if (current.some((item) => item.url === link.url.trim())) return '같은 증빙 링크가 두 번 있습니다.';
  return null;
}

/** 서버처럼 링크 목록을 검증하고 전체 교체할 증빙을 만든다. 첫 오류 하나만 400으로 던진다. */
function toEvidenceLinks(links: EvidenceLinkRequest[], attachedUrls: string[] = []): EvidenceResponse[] {
  const accepted: EvidenceResponse[] = [];
  for (const link of links) {
    const current = accepted.map((item) => ({ id: String(item.id), url: item.url, label: item.label }));
    // 이미 그 기록에 붙어 있던 링크(예전 S3 증빙을 옮긴 주소 포함)는 드라이브 규칙 없이 남긴다. 개수·중복만 본다.
    const error = attachedUrls.includes(link.url.trim())
      ? keptEvidenceLinkError(link, current)
      : evidenceLinkError(link.url, link.label ?? '', current);
    if (error) throw new ApiError(400, error);
    accepted.push({ id: issueEvidenceId(), url: link.url.trim(), label: link.label?.trim() || null });
  }
  return accepted;
}

export function mockGetLedgerEntries(): Promise<LedgerEntryListResponse> {
  return respond({ entries });
}

export function mockUpdateLedgerEntry(entryId: number, body: LedgerEntryUpdateRequest): Promise<LedgerEntryResponse> {
  let entry: LedgerEntryResponse;
  let nextEvidences: EvidenceResponse[];
  try {
    entry = findEntry(entryId);
    nextEvidences = toEvidenceLinks(
      body.evidenceLinks,
      entry.evidences.map((item) => item.url),
    );
  } catch (error) {
    return Promise.reject(error);
  }
  const categoryChanged = entry.category !== body.category;
  Object.assign(entry, {
    counterparty: body.counterparty,
    category: body.category,
    description: body.description,
    note: body.note,
    evidences: nextEvidences,
  });
  if (!isDuesCategory(body.category)) {
    entry.linkStatus = 'NONE';
    entry.duesLink = null;
  } else if (categoryChanged) {
    entry.linkStatus = 'PENDING';
    entry.duesLink = null;
  }
  return respond(entry);
}

export function mockLinkLedgerEntry(entryId: number, body: DuesLinkRequest): Promise<LedgerEntryResponse> {
  try {
    const entry = findEntry(entryId);
    // 명단에 없으면 404, 납부 비대상이면 409. 실패하면 기존 연결은 그대로다.
    linkEntryToMember(entry, body.memberId, body.semesterId);
    return respond(entry);
  } catch (error) {
    return Promise.reject(error);
  }
}

export function mockUnlinkLedgerEntry(entryId: number): Promise<void> {
  const entry = findEntry(entryId);
  entry.linkStatus = isDuesCategory(entry.category) ? 'PENDING' : 'NONE';
  entry.duesLink = null;
  return respond(undefined);
}

/** 신한 .xlsx를 파싱했다고 치고 시드 거래를 돌려준다. 이미 반영한 거래는 빠진다. */
export function mockPreviewImport(file: File): Promise<ImportPreviewResponse> {
  const transactions = createMockImportTransactions()
    .filter((transaction) => !importedRowKeys.has(transaction.id))
    .map((transaction) => ({
      rowKey: transaction.id,
      occurredAt: transaction.occurredAt,
      type: transaction.type === 'deposit' ? ('DEPOSIT' as const) : ('WITHDRAWAL' as const),
      counterparty: transaction.counterparty,
      amount: transaction.amount,
      bankBalance: transaction.bankBalance,
      suggestedCategory: transaction.category === '회비' ? ('DUES' as const) : ('ETC' as const),
      suggestedMemberId: null,
    }));
  return respond({ fileName: file.name, transactions }, 900);
}

export function mockCommitImport(body: ImportCommitRequest): Promise<ImportCommitResponse> {
  // 서버처럼 원본 값(초 포함 시각·금액·은행 잔액)이 미리보기와 다르면 거절한다(rowKey 재계산 흉내).
  const previewed = new Map(createMockImportTransactions().map((transaction) => [transaction.id, transaction]));
  const mismatched = body.transactions.some((transaction) => {
    const original = previewed.get(transaction.rowKey);
    return (
      !original ||
      original.occurredAt !== transaction.occurredAt ||
      original.amount !== transaction.amount ||
      original.bankBalance !== transaction.bankBalance
    );
  });
  if (mismatched) {
    return Promise.reject(new ApiError(400, '거래 정보가 미리보기 결과와 다릅니다. 파일을 다시 미리보기 하세요.'));
  }
  // 증빙 링크도 서버처럼 먼저 전부 검증한다(하나라도 틀리면 아무것도 반영하지 않는다).
  const evidenceLinksByRow = new Map<string, EvidenceResponse[]>();
  try {
    for (const transaction of body.transactions) {
      evidenceLinksByRow.set(transaction.rowKey, toEvidenceLinks(transaction.evidenceLinks));
    }
  } catch (error) {
    return Promise.reject(error);
  }
  const fresh = body.transactions.filter((transaction) => !importedRowKeys.has(transaction.rowKey));
  const semesterLabel = semesterLabelOf(semesterIds()[0]);

  for (const transaction of fresh) {
    importedRowKeys.add(transaction.rowKey);
    entries.push({
      id: issueEntryId(),
      occurredAt: transaction.occurredAt,
      type: transaction.type,
      category: transaction.category,
      counterparty: transaction.counterparty,
      description: transaction.note || (transaction.category === 'DUES' ? `${semesterLabel} 회비` : '가져온 거래내역'),
      note: transaction.note,
      amount: transaction.amount,
      // 장부 잔액은 계산하지 않고 은행 잔액을 그대로 쓴다.
      balance: transaction.bankBalance,
      source: body.fileName,
      linkStatus: isDuesCategory(transaction.category) ? 'PENDING' : 'NONE',
      duesLink: null,
      evidences: evidenceLinksByRow.get(transaction.rowKey) ?? [],
    });
  }

  return respond({ createdCount: fresh.length, skippedDuplicateCount: body.transactions.length - fresh.length }, 900);
}
