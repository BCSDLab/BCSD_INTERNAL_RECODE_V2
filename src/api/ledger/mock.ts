import { ApiError } from '@/api/client';
import {
  entries,
  evidences,
  importedRowKeys,
  issueEntryId,
  issueEvidenceId,
  respond,
  semesterIds,
  semesterLabelOf,
} from '@/api/dues/mock-db';
import { linkEntryToMember } from '@/api/dues/mock';
import type {
  DuesLinkRequest,
  EvidenceResponse,
  ImportCommitRequest,
  ImportCommitResponse,
  ImportPreviewResponse,
  LedgerEntryListResponse,
  LedgerEntryResponse,
  LedgerEntryUpdateRequest,
} from './types';
import { createMockImportTransactions } from './mock-import-seed';

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

function attachEvidences(evidenceIds: number[]) {
  return evidenceIds.flatMap((id) => {
    const evidence = evidences.get(id);
    return evidence ? [evidence] : [];
  });
}

export function mockGetLedgerEntries(): Promise<LedgerEntryListResponse> {
  return respond({ entries });
}

export function mockUpdateLedgerEntry(entryId: number, body: LedgerEntryUpdateRequest): Promise<LedgerEntryResponse> {
  const entry = findEntry(entryId);
  const categoryChanged = entry.category !== body.category;
  Object.assign(entry, {
    counterparty: body.counterparty,
    category: body.category,
    description: body.description,
    note: body.note,
    evidences: attachEvidences(body.evidenceIds),
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
  const entry = findEntry(entryId);
  linkEntryToMember(entry, body.memberId, body.semesterId);
  return respond(entry);
}

export function mockUnlinkLedgerEntry(entryId: number): Promise<void> {
  const entry = findEntry(entryId);
  entry.linkStatus = isDuesCategory(entry.category) ? 'PENDING' : 'NONE';
  entry.duesLink = null;
  return respond(undefined);
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** 실제로는 presigned URL → S3 PUT → complete. mock은 파일을 data URL로 들고 있는다. */
export async function mockUploadEvidence(file: File): Promise<EvidenceResponse> {
  const evidence: EvidenceResponse = {
    id: issueEvidenceId(),
    name: file.name,
    url: await readAsDataUrl(file),
    width: null,
    height: null,
  };
  evidences.set(evidence.id, evidence);
  return respond(evidence);
}

/** 신한 .xlsx를 파싱했다고 치고 시드 거래를 돌려준다. 이미 반영한 거래는 빠진다. */
export function mockPreviewImport(file: File): Promise<ImportPreviewResponse> {
  const transactions = createMockImportTransactions()
    .filter((transaction) => !importedRowKeys.has(transaction.id))
    .map((transaction) => ({
      rowKey: transaction.id,
      occurredAt: `${transaction.occurredAt}:00`,
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
      evidences: attachEvidences(transaction.evidenceIds),
    });
  }

  return respond({ createdCount: fresh.length, skippedDuplicateCount: body.transactions.length - fresh.length }, 900);
}
