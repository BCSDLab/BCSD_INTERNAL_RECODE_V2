'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Button, ModalFrame } from '@/components/ledger/LedgerUi';
import type { Evidence, LedgerEntry } from '@/components/ledger/types';
import {
  EVIDENCE_ACCEPT,
  EVIDENCE_TYPE_ERROR,
  entryTypeLabel,
  formatWon,
  isAllowedEvidenceFile,
} from '@/components/ledger/utils';

interface EvidenceViewerProps {
  entry: LedgerEntry;
  evidence: Evidence;
  onClose: () => void;
  /** 새 파일 업로드와 장부 기록 반영은 부모가 한다(업로드 API를 거쳐야 증빙 ID가 생긴다). */
  onReplace: (file: File) => void;
  onDelete: () => void;
  onDownloaded: () => void;
}

const IMAGE_EXTENSION = /\.(png|jpe?g|webp)$/i;

function isImageEvidence(evidence: Evidence) {
  return !!evidence.url && (evidence.url.startsWith('data:image') || IMAGE_EXTENSION.test(evidence.name));
}

export function EvidenceViewer({ entry, evidence, onClose, onReplace, onDelete, onDownloaded }: EvidenceViewerProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [fileError, setFileError] = useState('');

  function replaceEvidence(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!isAllowedEvidenceFile(file)) {
      setFileError(EVIDENCE_TYPE_ERROR);
      return;
    }
    setFileError('');
    onReplace(file);
  }

  function downloadEvidence() {
    const anchor = document.createElement('a');
    anchor.download = evidence.name;

    if (evidence.url) {
      anchor.href = evidence.url;
      anchor.click();
    } else {
      const placeholder = new Blob(
        [
          `${entry.counterparty}\n${entry.occurredAt}\n${entryTypeLabel(entry)} ${formatWon(entry.amount)}\n\n예시 증빙 파일입니다.`,
        ],
        { type: 'text/plain;charset=utf-8' },
      );
      const url = URL.createObjectURL(placeholder);
      anchor.href = url;
      anchor.click();
      URL.revokeObjectURL(url);
    }

    onDownloaded();
  }

  return (
    <ModalFrame
      title={entry.counterparty}
      subtitle={`${entry.occurredAt.slice(0, 10).replaceAll('-', '.')} ${entryTypeLabel(entry)} ${formatWon(entry.amount)}`}
      onClose={onClose}
      width="560px"
    >
      <div className="p-5">
        <div className="flex gap-4">
          <div className="border-line bg-sunken relative flex h-[300px] w-[220px] flex-none items-center justify-center overflow-hidden rounded-[11px] border">
            {isImageEvidence(evidence) ? (
              <Image
                src={evidence.url!}
                alt={`${evidence.name} 미리보기`}
                fill
                unoptimized
                className="object-contain"
              />
            ) : (
              <div className="bg-panel text-muted flex h-[260px] w-[174px] flex-col px-5 py-6 shadow-sm">
                <div className="text-text text-center text-[13px] font-extrabold">영 수 증</div>
                <div className="bg-line2 mx-auto mt-2 h-px w-16" />
                <div className="mt-7 flex flex-col gap-3 text-[9px]">
                  <div className="flex justify-between">
                    <span>거래처</span>
                    <span>{entry.counterparty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>거래일</span>
                    <span>{entry.occurredAt.slice(0, 10)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>내용</span>
                    <span>{entry.description.slice(0, 12)}</span>
                  </div>
                </div>
                <div className="border-line2 mt-auto border-t border-dashed pt-3 text-right text-[11px] font-bold">
                  합계 {formatWon(entry.amount)}
                </div>
                <div className="text-faint mt-5 text-center text-[8px]">BCSD INTERNAL SAMPLE</div>
              </div>
            )}
          </div>

          <dl className="min-w-0 flex-1 text-[11.5px]">
            <div className="border-line border-b py-2.5 first:pt-0">
              <dt className="text-faint text-[10px] font-bold">파일명</dt>
              <dd className="text-text mt-1 font-medium break-all">{evidence.name}</dd>
            </div>
            <div className="border-line border-b py-2.5">
              <dt className="text-faint text-[10px] font-bold">크기</dt>
              <dd className="text-muted mt-1">
                {evidence.width && evidence.height ? `${evidence.width} × ${evidence.height}` : '업로드된 증빙'}
              </dd>
            </div>
            <div className="border-line border-b py-2.5">
              <dt className="text-faint text-[10px] font-bold">연결 거래</dt>
              <dd className="text-muted mt-1 leading-5">{entry.description}</dd>
            </div>
            <div className="py-2.5">
              <dt className="text-faint text-[10px] font-bold">금액</dt>
              <dd className="text-text mt-1 text-[13px] font-bold">{formatWon(entry.amount)}</dd>
            </div>
          </dl>
        </div>

        <div className="border-line mt-5 border-t pt-4">
          {confirmingDelete ? (
            <div className="border-danger bg-danger-soft flex items-center rounded-[10px] border px-3.5 py-3">
              <div>
                <div className="text-danger text-xs font-bold">이 증빙을 삭제할까요?</div>
                <p className="text-danger mt-1 text-[10.5px]">삭제하면 현재 출금 기록이 증빙 미첨부 상태가 됩니다.</p>
              </div>
              <div className="ml-auto flex gap-1.5">
                <Button compact onClick={() => setConfirmingDelete(false)}>
                  취소
                </Button>
                <Button compact tone="danger" onClick={onDelete}>
                  삭제
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button onClick={downloadEvidence}>다운로드</Button>
              <Button onClick={() => fileInput.current?.click()}>수정</Button>
              <Button tone="danger" onClick={() => setConfirmingDelete(true)} className="ml-auto">
                삭제
              </Button>
            </div>
          )}
          {fileError && (
            <p
              role="alert"
              className="bg-danger-soft text-danger mt-3 rounded-lg px-3 py-2.5 text-[11.5px] font-medium"
            >
              {fileError}
            </p>
          )}
          <input ref={fileInput} type="file" accept={EVIDENCE_ACCEPT} onChange={replaceEvidence} className="hidden" />
        </div>
      </div>
    </ModalFrame>
  );
}
