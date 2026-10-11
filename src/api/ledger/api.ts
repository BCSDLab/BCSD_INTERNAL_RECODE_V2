import { ApiError, apiClient, apiFetch } from '@/api/client';
import { USE_LEDGER_MOCK } from '@/api/dues/mock-switch';
import { evidenceContentType } from '@/components/ledger/utils';
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

type EvidenceUploadStage = 'presign' | 'storage' | 'complete';

/** 저장소(S3) PUT 단계의 실패. 서버 단계(presign·complete)는 ApiError로 서버 문구를 그대로 쓴다. */
export class EvidenceUploadError extends Error {
  stage: EvidenceUploadStage;
  status: number | null;

  constructor(stage: EvidenceUploadStage, status: number | null, message: string) {
    super(message);
    this.stage = stage;
    this.status = status;
  }
}

/** 원인을 좁힐 수 있게 단계와 상태만 남긴다. presigned URL(서명 쿼리)은 남기지 않는다. */
function logUploadFailure(stage: EvidenceUploadStage, detail: string) {
  console.warn(`[evidence-upload] stage=${stage} ${detail}`);
}

async function serverStep<T>(stage: EvidenceUploadStage, request: () => Promise<T>) {
  try {
    return await request();
  } catch (error) {
    logUploadFailure(stage, error instanceof ApiError ? `status=${error.status}` : 'error=network');
    throw error;
  }
}

/** 화면 문구. 원인(서버 문구·저장소 상태)을 붙여 운영에서 어디서 실패했는지 보이게 한다. */
export function describeEvidenceUploadError(error: unknown) {
  const base = '증빙 파일을 올리지 못했습니다.';
  if (error instanceof ApiError || error instanceof EvidenceUploadError) return `${base} ${error.message}`;
  return `${base} 서버에 연결하지 못했습니다(네트워크).`;
}

/**
 * presigned URL 발급 → S3 PUT → complete(useImageUpload와 같은 흐름).
 * S3 PUT은 순수 fetch다 — presigned URL에 Authorization을 붙이면 서명 검증이 깨진다.
 * 실패하면 단계를 구분해 던진다: 서버 단계는 ApiError(서버 문구), 저장소 단계는 EvidenceUploadError.
 */
export async function uploadEvidence(file: File): Promise<EvidenceResponse> {
  if (USE_LEDGER_MOCK) return mockUploadEvidence(file);
  // presign 요청과 PUT에 같은 값을 쓴다(서명에 Content-Type이 들어간다).
  const contentType = evidenceContentType(file);
  const presigned = await serverStep('presign', () =>
    apiClient.post<EvidencePresignedUrlResponse>(`${BASE}/evidences/presigned-url`, {
      fileName: file.name,
      contentType,
      size: file.size,
    }),
  );
  let upload: Response;
  try {
    upload = await fetch(presigned.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': contentType },
    });
  } catch (error) {
    // 응답 자체를 못 받았다 — 브라우저는 CORS 거부와 네트워크 오류를 구분해 주지 않는다.
    logUploadFailure('storage', `error=${error instanceof Error ? error.name : 'unknown'}`);
    throw new EvidenceUploadError('storage', null, '저장소에 연결하지 못했습니다(CORS 또는 네트워크).');
  }
  if (!upload.ok) {
    logUploadFailure('storage', `status=${upload.status}`);
    throw new EvidenceUploadError('storage', upload.status, `저장소 업로드 실패(HTTP ${upload.status})`);
  }
  return serverStep('complete', () =>
    apiClient.post<EvidenceResponse>(`${BASE}/evidences/${presigned.evidenceId}/complete`),
  );
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
