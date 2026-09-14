'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ledger/LedgerUi';
import { IMPORT_DUES_MATCHES, createInitialImportTransactions } from '@/components/ledger/import/initial-data';
import type { ImportStep, ImportTransaction } from '@/components/ledger/import/types';
import type { Evidence } from '@/components/ledger/types';
import { formatWon } from '@/components/ledger/utils';

interface TransactionImportFlowProps {
  onCancel: () => void;
  onSave: (transactions: ImportTransaction[], fileName: string) => void;
}

const STEPS: Array<{ id: ImportStep; number: number; label: string }> = [
  { id: 'upload', number: 1, label: 'Excel 업로드' },
  { id: 'review', number: 2, label: '신규 내역' },
  { id: 'evidence', number: 3, label: '출금 증빙' },
  { id: 'confirm', number: 4, label: '최종 확인' },
];

function displayTime(value: string) {
  const [, month, day, hour, minute] = value.match(/^\d{4}-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/) ?? [];
  return month ? `${month}.${day} ${hour}:${minute}` : value;
}

function matchFor(transaction: ImportTransaction) {
  return IMPORT_DUES_MATCHES.find((match) => match.memberId === transaction.duesMatchId);
}

function ProportionalColumns({ minimums }: { minimums: readonly number[] }) {
  const total = minimums.reduce((sum, minimum) => sum + minimum, 0);

  return (
    <colgroup>
      {minimums.map((minimum, index) => (
        <col key={index} style={{ width: `${(minimum / total) * 100}%` }} />
      ))}
    </colgroup>
  );
}

function StepBar({ step }: { step: ImportStep }) {
  return (
    <ol
      aria-label="가져오기 진행 단계"
      className="text-faint flex w-full items-center justify-center gap-2.5 px-[22px] pt-3.5 text-xs"
    >
      {STEPS.map((item, index) => {
        const isActive = item.id === step;
        return (
          <li key={item.id} className="contents">
            {index > 0 && <span aria-hidden="true" className="bg-line2 h-[1.5px] w-11" />}
            <span className={isActive ? 'text-text font-bold' : undefined} aria-current={isActive ? 'step' : undefined}>
              {isActive ? (
                <span className="bg-primary text-on-primary mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px]">
                  {item.number}
                </span>
              ) : (
                `${item.number} `
              )}
              {item.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function LoadingState({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[230px] flex-col items-center justify-center gap-3 px-6 py-12"
    >
      <span
        aria-hidden="true"
        className="border-line2 border-t-primary h-8 w-8 animate-spin rounded-full border-[3px]"
      />
      <strong className="text-sm">{message}</strong>
      <p className="text-muted text-xs">잠시만 기다려 주세요.</p>
    </div>
  );
}

function ImportHeader({ onClose }: { onClose: () => void }) {
  return (
    <header className="border-line flex items-center border-b px-[22px] py-4">
      <h2 className="text-base font-bold">신한 거래내역 가져오기</h2>
      <button
        type="button"
        onClick={onClose}
        aria-label="가져오기 취소"
        className="text-muted hover:bg-panel2 ml-auto flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-[15px]"
      >
        ×
      </button>
    </header>
  );
}

function ImportFooter({
  previousLabel,
  onPrevious,
  nextLabel,
  onNext,
  nextDisabled = false,
}: {
  previousLabel: string;
  onPrevious: () => void;
  nextLabel: string;
  onNext: () => void;
  nextDisabled?: boolean;
}) {
  return (
    <footer className="border-line flex justify-end gap-2 border-t px-[22px] py-3.5">
      <Button onClick={onPrevious}>{previousLabel}</Button>
      <Button tone="primary" onClick={onNext} disabled={nextDisabled}>
        {nextLabel}
      </Button>
    </footer>
  );
}

export function TransactionImportFlow({ onCancel, onSave }: TransactionImportFlowProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [fileName, setFileName] = useState('');
  const [transactions, setTransactions] = useState(createInitialImportTransactions);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [evidenceTarget, setEvidenceTarget] = useState<string | null>(null);
  const excelInput = useRef<HTMLInputElement>(null);
  const evidenceInput = useRef<HTMLInputElement>(null);
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (pendingTimer.current) clearTimeout(pendingTimer.current);
    },
    [],
  );

  const selectedTransactions = transactions.filter((transaction) => transaction.selected);
  const canReview =
    selectedTransactions.length > 0 &&
    selectedTransactions.every((transaction) => {
      const needsMatch = transaction.category === '회비' || transaction.category === '회비 반환';
      return !needsMatch || transaction.duesMatchId !== null;
    });
  const missingEvidenceCount = selectedTransactions.filter(
    (transaction) => transaction.type === 'withdrawal' && transaction.evidences.length === 0,
  ).length;

  function updateTransaction(id: string, update: (transaction: ImportTransaction) => ImportTransaction) {
    setTransactions((current) =>
      current.map((transaction) => (transaction.id === id ? update(transaction) : transaction)),
    );
  }

  function chooseExcel(file?: File) {
    if (!file || !file.name.toLowerCase().endsWith('.xlsx')) return;
    setFileName(file.name);
  }

  function addEvidence(file?: File) {
    if (!file || !evidenceTarget) return;
    const evidence: Evidence = { id: `import-evidence-${Date.now()}`, name: file.name };
    const reader = new FileReader();
    reader.onload = () => {
      updateTransaction(evidenceTarget, (transaction) => ({
        ...transaction,
        evidences: [...transaction.evidences, { ...evidence, dataUrl: String(reader.result) }],
      }));
    };
    reader.readAsDataURL(file);
  }

  function analyzeFile() {
    if (!fileName || isAnalyzing) return;
    setIsAnalyzing(true);
    pendingTimer.current = setTimeout(() => {
      setIsAnalyzing(false);
      setStep('review');
      pendingTimer.current = null;
    }, 900);
  }

  function saveTransactions() {
    if (isSaving) return;
    setIsSaving(true);
    pendingTimer.current = setTimeout(() => {
      onSave(selectedTransactions, fileName);
      onCancel();
      pendingTimer.current = null;
    }, 900);
  }

  function openEvidenceInNewTab(evidence: Evidence) {
    if (!evidence.dataUrl) return;
    const imageWindow = window.open('', '_blank');
    if (!imageWindow) return;

    imageWindow.opener = null;
    imageWindow.document.title = evidence.name;
    imageWindow.document.body.style.cssText =
      'margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#111018';
    const image = imageWindow.document.createElement('img');
    image.src = evidence.dataUrl;
    image.alt = evidence.name;
    image.style.cssText = 'display:block;max-width:100vw;max-height:100vh;object-fit:contain';
    imageWindow.document.body.append(image);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111018]/55 p-6 backdrop-blur-[2px]">
      <section
        role="dialog"
        aria-modal="true"
        aria-label="신한 거래내역 가져오기"
        className="border-line bg-panel text-text max-h-[calc(100vh-48px)] w-[920px] max-w-[calc(100vw-48px)] overflow-auto rounded-[15px] border shadow-xl"
      >
        <ImportHeader onClose={onCancel} />

        <StepBar step={step} />

        {isAnalyzing && <LoadingState message="거래내역을 분석하고 있습니다." />}
        {isSaving && <LoadingState message="장부에 거래내역을 저장하고 있습니다." />}

        {step === 'upload' && !isAnalyzing && (
          <>
            <div className="flex flex-col gap-4 px-[22px] py-5">
              <input
                ref={excelInput}
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={(event) => chooseExcel(event.target.files?.[0])}
              />
              {fileName ? (
                <div className="border-line flex items-center rounded-[9px] border px-3.5 py-3 text-[12.5px]">
                  <span className="min-w-0 truncate">{fileName}</span>
                  <button
                    type="button"
                    onClick={() => setFileName('')}
                    aria-label={`${fileName} 제거`}
                    className="text-faint hover:text-text ml-auto cursor-pointer px-1 text-[13px]"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    chooseExcel(event.dataTransfer.files[0]);
                  }}
                  className="border-dash text-muted flex flex-col items-center gap-2.5 rounded-[13px] border border-dashed px-9 py-9 text-center text-[12.5px]"
                >
                  <p>신한 거래내역 Excel 파일을 여기로 드래그하거나 클릭해서 선택하세요 (.xlsx)</p>
                  <Button onClick={() => excelInput.current?.click()}>파일 선택</Button>
                </div>
              )}
            </div>
            <ImportFooter
              previousLabel="취소"
              onPrevious={onCancel}
              nextLabel="다음"
              onNext={analyzeFile}
              nextDisabled={!fileName}
            />
          </>
        )}

        {step === 'review' && (
          <>
            <div className="px-[22px] pt-4 pb-5">
              <div className="border-line overflow-x-auto rounded-[13px] border">
                <table className="w-full min-w-[704px] table-fixed border-collapse text-center">
                  <ProportionalColumns minimums={[44, 82, 56, 68, 82, 96, 156, 132]} />
                  <thead className="bg-panel2 text-faint text-[11px] font-bold">
                    <tr className="border-line border-b">
                      {['추가', '거래 일시', '입출금', '거래내역', '금액', '종류', '일치하는 회비', '비고'].map(
                        (label) => (
                          <th key={label} className="p-2 text-center">
                            {label}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => {
                      const needsMatch = transaction.category === '회비' || transaction.category === '회비 반환';
                      return (
                        <tr key={transaction.id} className="border-line border-b last:border-b-0">
                          <td className="p-2 align-middle">
                            <input
                              type="checkbox"
                              checked={transaction.selected}
                              onChange={() =>
                                updateTransaction(transaction.id, (current) => ({
                                  ...current,
                                  selected: !current.selected,
                                }))
                              }
                              aria-label={`${transaction.counterparty} 거래 추가`}
                              className="accent-primary h-3.5 w-3.5"
                            />
                          </td>
                          <td className="p-2 text-xs whitespace-nowrap">{displayTime(transaction.occurredAt)}</td>
                          <td className="p-2 text-xs whitespace-nowrap">
                            {transaction.type === 'deposit' ? '입금' : '출금'}
                          </td>
                          <td className="p-2 text-xs">{transaction.counterparty}</td>
                          <td className="p-2 text-xs whitespace-nowrap">
                            {transaction.type === 'withdrawal' ? '-' : ''}
                            {formatWon(transaction.amount)}
                          </td>
                          <td className="p-2">
                            <select
                              aria-label={`${transaction.counterparty} 종류`}
                              value={transaction.category}
                              disabled={!transaction.selected}
                              onChange={(event) =>
                                updateTransaction(transaction.id, (current) => ({
                                  ...current,
                                  category: event.target.value as ImportTransaction['category'],
                                  duesMatchId:
                                    event.target.value === '기타'
                                      ? null
                                      : (current.duesMatchId ??
                                        IMPORT_DUES_MATCHES.find((match) => match.memberName === current.counterparty)
                                          ?.memberId ??
                                        null),
                                }))
                              }
                              className="border-line2 bg-panel h-7 w-full rounded-[7px] border px-1.5 text-center text-xs outline-none disabled:opacity-45"
                            >
                              <option>회비</option>
                              <option>회비 반환</option>
                              <option>기타</option>
                            </select>
                          </td>
                          <td className="p-2">
                            {needsMatch && (
                              <select
                                aria-label={`${transaction.counterparty} 연결 회원과 학기`}
                                value={transaction.duesMatchId ?? ''}
                                disabled={!transaction.selected}
                                onChange={(event) =>
                                  updateTransaction(transaction.id, (current) => ({
                                    ...current,
                                    duesMatchId: event.target.value || null,
                                  }))
                                }
                                className="border-line2 bg-panel h-7 w-full rounded-[7px] border px-2 text-center text-xs outline-none disabled:opacity-45"
                              >
                                <option value="">선택</option>
                                {IMPORT_DUES_MATCHES.map((match) => (
                                  <option key={match.memberId} value={match.memberId}>
                                    {match.memberName} {match.semester}
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td className="p-2">
                            <input
                              value={transaction.note}
                              disabled={!transaction.selected}
                              onChange={(event) =>
                                updateTransaction(transaction.id, (current) => ({
                                  ...current,
                                  note: event.target.value,
                                }))
                              }
                              aria-label={`${transaction.counterparty} 비고`}
                              className="border-line2 bg-panel h-7 w-full rounded-[7px] border px-2 text-center text-xs outline-none disabled:opacity-45"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <ImportFooter
              previousLabel="이전"
              onPrevious={() => setStep('upload')}
              nextLabel="다음"
              onNext={() => setStep('evidence')}
              nextDisabled={!canReview}
            />
          </>
        )}

        {step === 'evidence' && (
          <>
            <input
              ref={evidenceInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                addEvidence(event.target.files?.[0]);
                event.target.value = '';
              }}
            />
            <div className="px-[22px] pt-4 pb-5">
              <div className="border-line overflow-x-auto rounded-[13px] border">
                <table className="w-full min-w-[680px] table-fixed border-collapse text-center">
                  <ProportionalColumns minimums={[80, 56, 68, 80, 100, 316]} />
                  <thead className="bg-panel2 text-faint text-[11px] font-bold">
                    <tr className="border-line border-b">
                      {['거래 일시', '입출금', '거래내역', '금액', '종류', '증빙'].map((label) => (
                        <th key={label} className="p-2 text-center">
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTransactions.map((transaction) => (
                      <tr key={transaction.id} className="border-line border-b align-top last:border-b-0">
                        <td className="p-2.5 text-xs whitespace-nowrap">{displayTime(transaction.occurredAt)}</td>
                        <td className="p-2.5 text-xs">{transaction.type === 'deposit' ? '입금' : '출금'}</td>
                        <td className="p-2.5 text-xs">{transaction.counterparty}</td>
                        <td className="p-2.5 text-xs whitespace-nowrap">
                          {transaction.type === 'withdrawal' ? '-' : ''}
                          {formatWon(transaction.amount)}
                        </td>
                        <td className="p-2.5 text-xs whitespace-nowrap">{transaction.category}</td>
                        <td className="flex flex-wrap items-center gap-1.5 p-2.5 text-left">
                          {transaction.type === 'withdrawal' && (
                            <>
                              {transaction.evidences.map((evidence) => (
                                <span
                                  key={evidence.id}
                                  className="border-line2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px]"
                                >
                                  <button
                                    type="button"
                                    onClick={() => openEvidenceInNewTab(evidence)}
                                    className="cursor-pointer"
                                  >
                                    {evidence.name}
                                  </button>
                                  <button
                                    type="button"
                                    aria-label={`${evidence.name} 제거`}
                                    onClick={() =>
                                      updateTransaction(transaction.id, (current) => ({
                                        ...current,
                                        evidences: current.evidences.filter((item) => item.id !== evidence.id),
                                      }))
                                    }
                                    className="text-faint cursor-pointer"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                              <button
                                type="button"
                                onClick={() => {
                                  setEvidenceTarget(transaction.id);
                                  evidenceInput.current?.click();
                                }}
                                className="border-dash text-muted cursor-pointer rounded-full border border-dashed px-2.5 py-1 text-[11.5px]"
                              >
                                + 추가
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <ImportFooter
              previousLabel="이전"
              onPrevious={() => setStep('review')}
              nextLabel="다음"
              onNext={() => setStep('confirm')}
              nextDisabled={missingEvidenceCount > 0}
            />
          </>
        )}

        {step === 'confirm' && !isSaving && (
          <>
            <div className="px-[22px] pt-4 pb-5">
              <div className="border-line overflow-x-auto rounded-[13px] border">
                <table className="w-full min-w-[860px] table-fixed border-collapse text-center">
                  <ProportionalColumns minimums={[76, 52, 68, 80, 104, 156, 190, 150]} />
                  <thead className="bg-panel2 text-faint text-[11px] font-bold">
                    <tr className="border-line border-b">
                      {['거래 일시', '입출금', '거래내역', '금액', '종류', '일치하는 회비', '증빙', '비고'].map(
                        (label) => (
                          <th key={label} className="p-2 text-center">
                            {label}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTransactions.map((transaction) => {
                      const match = matchFor(transaction);
                      return (
                        <tr key={transaction.id} className="border-line border-b align-top last:border-b-0">
                          <td className="p-2.5 text-xs whitespace-nowrap">{displayTime(transaction.occurredAt)}</td>
                          <td className="p-2.5 text-xs">{transaction.type === 'deposit' ? '입금' : '출금'}</td>
                          <td className="p-2.5 text-xs">{transaction.counterparty}</td>
                          <td className="p-2.5 text-xs whitespace-nowrap">
                            {transaction.type === 'withdrawal' ? '-' : ''}
                            {formatWon(transaction.amount)}
                          </td>
                          <td className="p-2.5 text-xs whitespace-nowrap">{transaction.category}</td>
                          <td className={`p-2.5 text-xs ${match ? 'text-text' : 'text-faint'}`}>
                            {match ? `${match.memberName} ${match.semester}` : '-'}
                          </td>
                          <td className="overflow-hidden p-2.5 text-left">
                            {transaction.evidences.length > 0 ? (
                              <div className="flex min-w-0 flex-wrap gap-1.5">
                                {transaction.evidences.map((evidence) => (
                                  <button
                                    key={evidence.id}
                                    type="button"
                                    title={evidence.name}
                                    onClick={() => openEvidenceInNewTab(evidence)}
                                    className="border-line2 max-w-full min-w-0 cursor-pointer overflow-hidden rounded-full border px-2 py-1 text-[11px] text-ellipsis whitespace-nowrap"
                                  >
                                    {evidence.name}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <span className="text-faint text-[11.5px]">-</span>
                            )}
                          </td>
                          <td className="text-muted overflow-hidden p-2.5 text-xs [overflow-wrap:anywhere]">
                            {transaction.note}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <ImportFooter
              previousLabel="이전"
              onPrevious={() => setStep('evidence')}
              nextLabel="저장"
              onNext={saveTransactions}
            />
          </>
        )}
      </section>
    </div>
  );
}
