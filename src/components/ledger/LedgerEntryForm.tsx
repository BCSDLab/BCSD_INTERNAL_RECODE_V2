'use client';

import { useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Button, Input, ModalFrame, Select } from '@/components/ledger/LedgerUi';
import type { EntryType, Evidence, LedgerCategory, LedgerEntry } from '@/components/ledger/types';
import { LEDGER_CATEGORIES } from '@/components/ledger/types';

interface LedgerEntryFormProps {
  entry: LedgerEntry;
  currentBalance: number;
  onClose: () => void;
  onSave: (entry: LedgerEntry) => void;
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function LedgerEntryForm({ entry, currentBalance, onClose, onSave }: LedgerEntryFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<EntryType>(entry.type);
  const [occurredAt, setOccurredAt] = useState(entry.occurredAt);
  const [amount, setAmount] = useState(String(entry.amount));
  const [balance, setBalance] = useState(String(entry.balance));
  const [counterparty, setCounterparty] = useState(entry.counterparty);
  const [category, setCategory] = useState<LedgerCategory>(entry.category);
  const [description, setDescription] = useState(entry.description);
  const [note, setNote] = useState(entry.note);
  const [evidences, setEvidences] = useState<Evidence[]>(entry.evidences);
  const [error, setError] = useState('');

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    try {
      const additions = await Promise.all(
        files.map(async (file, index): Promise<Evidence> => ({
          id: `evidence-${Date.now()}-${index}`,
          name: file.name,
          dataUrl: await readAsDataUrl(file),
        })),
      );
      setEvidences((current) => [...current, ...additions]);
      setError('');
    } catch {
      setError('증빙 파일을 읽지 못했습니다. 다시 선택해주세요.');
    } finally {
      event.target.value = '';
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const parsedAmount = Number(amount.replaceAll(',', ''));
    const parsedBalance = Number(balance.replaceAll(',', ''));

    if (
      !occurredAt ||
      !Number.isFinite(parsedAmount) ||
      parsedAmount <= 0 ||
      !counterparty.trim() ||
      !description.trim()
    ) {
      setError('거래 일시, 금액, 입출금자, 내용을 모두 입력해주세요.');
      return;
    }

    if (type === 'withdrawal' && evidences.length === 0) {
      setError('출금 내역은 증빙을 한 개 이상 첨부해주세요.');
      return;
    }

    const duesTarget = category === '회비' || category === '회비 반환';
    const nextBalance =
      balance.trim() && Number.isFinite(parsedBalance)
        ? parsedBalance
        : currentBalance + (type === 'deposit' ? parsedAmount : -parsedAmount);

    onSave({
      id: entry.id,
      occurredAt,
      type,
      category,
      counterparty: counterparty.trim(),
      description: description.trim(),
      note: note.trim(),
      amount: parsedAmount,
      balance: nextBalance,
      source: entry.source,
      linkStatus: duesTarget ? (entry.category === category ? entry.linkStatus : 'pending') : 'none',
      duesLink: duesTarget && entry.category === category ? entry.duesLink : undefined,
      evidences: type === 'withdrawal' ? evidences : [],
    });
  }

  return (
    <ModalFrame title="장부 기록 수정" onClose={onClose} width="620px">
      <form onSubmit={submit}>
        <div className="flex flex-col gap-4 px-[22px] py-5">
          <fieldset>
            <legend className="text-muted mb-2 text-[11px] font-bold">입출금 구분</legend>
            <div className="flex gap-2">
              {(
                [
                  ['withdrawal', '출금'],
                  ['deposit', '입금'],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className={`flex h-10 flex-1 cursor-pointer items-center justify-center rounded-[9px] border text-[12.5px] font-semibold ${
                    type === value ? 'border-primary-line bg-primary-soft text-primary-text' : 'border-line2 text-muted'
                  }`}
                >
                  <input
                    type="radio"
                    name="entry-type"
                    value={value}
                    checked={type === value}
                    onChange={() => {
                      setType(value);
                      setError('');
                    }}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
            <p className="text-faint mt-1.5 text-[10.5px]">출금을 선택하면 증빙 첨부가 필수입니다.</p>
          </fieldset>

          <div className="grid grid-cols-[112px_1fr] items-center gap-x-3 gap-y-2.5 text-xs">
            <label htmlFor="ledger-date" className="text-muted font-medium">
              거래 일시 <span className="text-danger">*</span>
            </label>
            <Input
              id="ledger-date"
              type="datetime-local"
              value={occurredAt}
              onChange={(event) => setOccurredAt(event.target.value)}
            />

            <label htmlFor="ledger-amount" className="text-muted font-medium">
              금액 <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <Input
                id="ledger-amount"
                type="number"
                min="1"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="w-full pr-10"
                placeholder="45000"
              />
              <span className="text-faint pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs">
                원
              </span>
            </div>

            <label htmlFor="ledger-balance" className="text-muted font-medium">
              거래 후 잔액
            </label>
            <div className="relative">
              <Input
                id="ledger-balance"
                type="number"
                value={balance}
                onChange={(event) => setBalance(event.target.value)}
                className="w-full pr-10"
                placeholder="비워두면 자동 계산"
              />
              <span className="text-faint pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs">
                원
              </span>
            </div>

            <label htmlFor="ledger-counterparty" className="text-muted font-medium">
              거래내역 <span className="text-danger">*</span>
            </label>
            <Input
              id="ledger-counterparty"
              value={counterparty}
              onChange={(event) => setCounterparty(event.target.value)}
              placeholder="입출금자 또는 거래처"
            />

            <label htmlFor="ledger-category" className="text-muted font-medium">
              분류
            </label>
            <Select
              id="ledger-category"
              value={category}
              onChange={(event) => setCategory(event.target.value as LedgerCategory)}
            >
              {LEDGER_CATEGORIES.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </Select>

            <label htmlFor="ledger-description" className="text-muted font-medium">
              내용 <span className="text-danger">*</span>
            </label>
            <Input
              id="ledger-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="거래 내용"
            />

            <label htmlFor="ledger-note" className="text-muted font-medium">
              비고
            </label>
            <Input
              id="ledger-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="선택 입력"
            />
          </div>

          {type === 'withdrawal' && (
            <section>
              <div className="mb-2 flex items-center">
                <span className="text-muted text-[11px] font-bold">지출 증빙 · 한 개 이상 필수</span>
                <span className="text-faint ml-auto text-[10.5px]">이미지 또는 PDF</span>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="border-dash bg-panel2 text-muted hover:border-primary-line hover:bg-primary-sunken flex h-[104px] w-full cursor-pointer flex-col items-center justify-center rounded-[10px] border border-dashed text-xs"
              >
                <span className="text-primary-text mb-1 text-xl">+</span>
                영수증·이체확인증을 선택하세요
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                multiple
                onChange={handleFiles}
                className="hidden"
              />
              {evidences.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {evidences.map((evidence) => (
                    <span
                      key={evidence.id}
                      className="border-line2 bg-panel text-muted inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10.5px]"
                    >
                      {evidence.name}
                      <button
                        type="button"
                        onClick={() => setEvidences((items) => items.filter((item) => item.id !== evidence.id))}
                        aria-label={`${evidence.name} 삭제`}
                        className="text-faint cursor-pointer text-sm"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </section>
          )}

          {error && (
            <p
              role="alert"
              className="border-danger-soft bg-danger-soft text-danger rounded-lg border px-3 py-2.5 text-[11.5px] font-medium"
            >
              {error}
            </p>
          )}
        </div>

        <footer className="border-line flex justify-end gap-2 border-t px-[22px] py-3.5">
          <Button tone="outline" onClick={onClose}>
            취소
          </Button>
          <Button tone="primary" type="submit">
            저장
          </Button>
        </footer>
      </form>
    </ModalFrame>
  );
}
