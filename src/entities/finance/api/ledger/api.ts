import { apiClient, apiFetch } from '@/shared/api/client';

import { USE_LEDGER_MOCK } from '../dues/mock-switch';
import {
  mockCommitImport,
  mockGetLedgerEntries,
  mockLinkLedgerEntry,
  mockPreviewImport,
  mockUnlinkLedgerEntry,
  mockUpdateLedgerEntry,
} from './mock';
import {
  type DuesLinkRequest,
  type ImportCommitRequest,
  type ImportCommitResponse,
  type ImportPreviewResponse,
  type LedgerEntryListResponse,
  type LedgerEntryResponse,
  type LedgerEntryUpdateRequest,
} from './types';

const BASE = '/v1/admin/ledger';

/** 화면이 헤더 필터를 클라이언트에서 거르므로 지금은 전체를 받는다. */
export function getLedgerEntries() {
  if (USE_LEDGER_MOCK) return mockGetLedgerEntries();
  return apiClient.get<LedgerEntryListResponse>(`${BASE}/entries`);
}

export function updateLedgerEntry(entryId: number, body: LedgerEntryUpdateRequest) {
  if (USE_LEDGER_MOCK) return mockUpdateLedgerEntry(entryId, body);
  return apiClient.patch<LedgerEntryResponse>(`${BASE}/entries/${entryId}`, body);
}

export function linkLedgerEntry(entryId: number, body: DuesLinkRequest) {
  if (USE_LEDGER_MOCK) return mockLinkLedgerEntry(entryId, body);
  return apiClient.put<LedgerEntryResponse>(`${BASE}/entries/${entryId}/dues-link`, body);
}

export function unlinkLedgerEntry(entryId: number) {
  if (USE_LEDGER_MOCK) return mockUnlinkLedgerEntry(entryId);
  return apiClient.delete<void>(`${BASE}/entries/${entryId}/dues-link`);
}

/** multipart(파트 이름 file). apiFetch는 FormData 본문에 Content-Type을 붙이지 않아 브라우저가 boundary를 넣는다. */
export function previewImport(file: File) {
  if (USE_LEDGER_MOCK) return mockPreviewImport(file);
  const form = new FormData();
  form.append('file', file);
  return apiFetch<ImportPreviewResponse>(`${BASE}/imports/preview`, { method: 'POST', body: form });
}

export function commitImport(body: ImportCommitRequest) {
  if (USE_LEDGER_MOCK) return mockCommitImport(body);
  return apiClient.post<ImportCommitResponse>(`${BASE}/imports`, body);
}
