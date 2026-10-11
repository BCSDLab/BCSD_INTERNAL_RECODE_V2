'use client';

import { useState } from 'react';
import { Button, Input } from '@/components/ledger/LedgerUi';
import type { Evidence } from '@/components/ledger/types';
import { MAX_EVIDENCE_COUNT } from '@/components/ledger/types';
import {
  EVIDENCE_LINK_GUIDE,
  MAX_EVIDENCE_LABEL_LENGTH,
  draftEvidenceLink,
  evidenceLabel,
  evidenceLinkError,
} from '@/components/ledger/utils';

/** 증빙 링크 목록. 링크는 새 탭으로 연다(드라이브 미리보기는 구글이 보여 준다). */
export function EvidenceLinkChips({
  evidences,
  onRemove,
}: {
  evidences: Evidence[];
  onRemove?: (evidence: Evidence) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {evidences.map((evidence, index) => {
        const label = evidenceLabel(evidence, index);
        return (
          <span
            key={evidence.id}
            className="border-line2 bg-panel2 text-muted inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-[10.5px]"
          >
            <a
              href={evidence.url}
              target="_blank"
              rel="noopener noreferrer"
              title={evidence.url}
              className="hover:text-primary-text min-w-0 truncate underline-offset-2 hover:underline"
            >
              {label}
            </a>
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(evidence)}
                aria-label={`${label} 삭제`}
                className="text-faint hover:text-danger cursor-pointer bg-transparent text-sm"
              >
                &times;
              </button>
            )}
          </span>
        );
      })}
    </div>
  );
}

/** 링크 입력칸 + 선택 이름 + 추가. 서버와 같은 규칙으로 미리 막고, 통과한 링크만 onAdd로 넘긴다. */
export function EvidenceLinkForm({ evidences, onAdd }: { evidences: Evidence[]; onAdd: (evidence: Evidence) => void }) {
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');
  const [error, setError] = useState('');
  const isFull = evidences.length >= MAX_EVIDENCE_COUNT;

  function add() {
    const message = evidenceLinkError(url, label, evidences);
    if (message) {
      setError(message);
      return;
    }
    onAdd(draftEvidenceLink(url, label));
    setUrl('');
    setLabel('');
    setError('');
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-faint text-[10.5px] leading-5">{EVIDENCE_LINK_GUIDE}</p>
      <div className="flex items-center gap-2">
        <Input
          type="url"
          inputMode="url"
          aria-label="증빙 링크"
          placeholder="https://drive.google.com/…"
          value={url}
          disabled={isFull}
          onChange={(event) => {
            setUrl(event.target.value);
            setError('');
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              add();
            }
          }}
          className="min-w-0 flex-1"
        />
        <Input
          aria-label="링크 이름(선택)"
          placeholder="이름(선택)"
          value={label}
          maxLength={MAX_EVIDENCE_LABEL_LENGTH}
          disabled={isFull}
          onChange={(event) => setLabel(event.target.value)}
          className="w-[120px]"
        />
        <Button compact onClick={add} disabled={isFull}>
          추가 ({evidences.length}/{MAX_EVIDENCE_COUNT})
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-danger text-[11px] font-semibold">
          {error}
        </p>
      )}
    </div>
  );
}
