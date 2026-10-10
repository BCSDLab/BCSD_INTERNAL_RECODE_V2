import { apiClient, apiFetch } from '@/api/client';
import { USE_LEDGER_MOCK } from '@/api/dues/mock-switch';
import {
  mockCommitImport,
  mockGetLedgerEntries,
  mockLinkLedgerEntry,
  mockPreviewImport,
  mockUnlinkLedgerEntry,
  mockUpdateLedgerEntry,
  mockUploadEvidence,
} from './mock';
import type {
  DuesLinkRequest,
  EvidencePresignedUrlResponse,
  EvidenceResponse,
  ImportCommitRequest,
  ImportCommitResponse,
  ImportPreviewResponse,
  LedgerEntryListResponse,
  LedgerEntryResponse,
  LedgerEntryUpdateRequest,
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

/**
 * presigned URL 발급 → S3 PUT → complete(useImageUpload와 같은 흐름).
 * S3 PUT은 순수 fetch다 — presigned URL에 Authorization을 붙이면 서명 검증이 깨진다.
 */
export async function uploadEvidence(file: File): Promise<EvidenceResponse> {
  if (USE_LEDGER_MOCK) return mockUploadEvidence(file);
  const presigned = await apiClient.post<EvidencePresignedUrlResponse>(`${BASE}/evidences/presigned-url`, {
    fileName: file.name,
    contentType: file.type,
    size: file.size,
  });
  const upload = await fetch(presigned.uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });
  if (!upload.ok) throw new Error('증빙 파일을 올리지 못했습니다.');
  return apiClient.post<EvidenceResponse>(`${BASE}/evidences/${presigned.evidenceId}/complete`);
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
