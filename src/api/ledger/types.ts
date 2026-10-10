import type { Track } from '@/api/auth/types';
import type { SemesterId } from '@/api/dues/types';

/**
 * 장부 API 계약 초안(DTO). 화면은 components/ledger/types의 뷰 모델을 쓰고, 둘 사이 변환은
 * ./mappers가 맡는다. 잔액(balance)은 서버가 거래 시각 순으로 계산해 내려준다.
 */

export type EntryType = 'DEPOSIT' | 'WITHDRAWAL';

/** 화면 라벨: 회비 / 행사 / 운영비 / 기타. 회비 출금도 DUES다(반환 분류 없음). */
export type LedgerCategory = 'DUES' | 'EVENT' | 'OPERATION' | 'ETC';

/** DUES만 PENDING/CONFIRMED가 될 수 있고, 나머지 분류는 항상 NONE이다. */
export type LinkStatus = 'CONFIRMED' | 'PENDING' | 'NONE';

export interface EvidenceResponse {
  id: number;
  name: string;
  url: string | null;
  width: number | null;
  height: number | null;
}

export interface DuesLinkResponse {
  memberId: number;
  memberName: string;
  studentNumber: string;
  track: Track;
  semesterId: SemesterId;
  /** 연결 시점 학기 부과액. */
  requiredAmount: number;
}

export interface LedgerEntryResponse {
  id: number;
  /** 백엔드 LocalDateTime(KST) — "2026-11-16T09:10:00". */
  occurredAt: string;
  type: EntryType;
  category: LedgerCategory;
  counterparty: string;
  description: string;
  note: string;
  amount: number;
  balance: number;
  /** 가져온 파일명. 직접 입력이면 null. */
  source: string | null;
  linkStatus: LinkStatus;
  duesLink: DuesLinkResponse | null;
  evidences: EvidenceResponse[];
}

/**
 * GET /v1/admin/ledger/entries 쿼리. 다중 선택은 반복 파라미터(apiClient buildQuery 규칙).
 * from/to는 "yyyy-mm-dd" 포함 구간. 지금 화면은 전체를 받아 클라이언트에서 거르므로 아직 쓰지 않는다.
 */
export interface LedgerEntryParams {
  from?: string;
  to?: string;
  type?: EntryType[];
  category?: LedgerCategory[];
  linkStatus?: LinkStatus[];
  minAmount?: number;
  maxAmount?: number;
}

export interface LedgerEntryListResponse {
  entries: LedgerEntryResponse[];
}

/**
 * PATCH /v1/admin/ledger/entries/{id} — 상세 화면 수정.
 * 금액·시각·입출금 구분은 은행 거래 원본이라 바꾸지 않는다. 분류를 바꾸면 서버가 연결을 끊고
 * DUES면 PENDING, 아니면 NONE으로 되돌린다.
 */
export interface LedgerEntryUpdateRequest {
  counterparty: string;
  category: LedgerCategory;
  description: string;
  note: string;
  evidenceIds: number[];
}

/** PUT /v1/admin/ledger/entries/{id}/dues-link — 단건 연결(입금·출금 공통). DELETE는 연결 해제. */
export interface DuesLinkRequest {
  memberId: number;
  semesterId: SemesterId;
}

/** POST /v1/admin/ledger/evidences/presigned-url → S3 PUT → POST /v1/admin/ledger/evidences/{id}/complete. */
export interface EvidencePresignedUrlRequest {
  fileName: string;
  contentType: string;
  size: number;
}

export interface EvidencePresignedUrlResponse {
  evidenceId: number;
  uploadUrl: string;
}

// ---------- 거래내역 가져오기 (신한 .xlsx) ----------

export type ImportCategory = Extract<LedgerCategory, 'DUES' | 'ETC'>;

export interface ImportTransactionResponse {
  /** 은행 거래 지문(시각·방향·금액·은행 잔액·상대) 해시. 커밋 때 그대로 돌려보내 서버가 중복을 막고 다시 계산해 대조한다. */
  rowKey: string;
  occurredAt: string;
  type: EntryType;
  counterparty: string;
  amount: number;
  /** 은행 거래 후 잔액(엑셀 값 그대로). 장부 balance가 된다. */
  bankBalance: number;
  suggestedCategory: ImportCategory;
  /** 입금자명·금액으로 서버가 찾은 회비 대상. */
  suggestedMemberId: number | null;
}

/** POST /v1/admin/ledger/imports/preview (multipart: file) — 파싱만 하고 저장하지 않는다. 이미 장부에 있는 거래는 빠진다. */
export interface ImportPreviewResponse {
  fileName: string;
  transactions: ImportTransactionResponse[];
}

/**
 * POST /v1/admin/ledger/imports — 미리보기의 모든 거래를 반영한다(1~5,000건, 0건이면 부르지 않는다).
 * 회비 분류는 PENDING으로 들어가고 연결은 회비 화면에서 한다. 서버가 미리보기 결과를 들고 있지 않도록
 * 거래 원본 값(bankBalance 포함)을 함께 돌려보내고, 서버는 rowKey를 다시 계산해 다르면 400이다.
 */
export interface ImportCommitRequest {
  fileName: string;
  transactions: {
    rowKey: string;
    occurredAt: string;
    type: EntryType;
    counterparty: string;
    amount: number;
    bankBalance: number;
    category: ImportCategory;
    note: string;
    evidenceIds: number[];
  }[];
}

export interface ImportCommitResponse {
  createdCount: number;
  skippedDuplicateCount: number;
}
