import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Button, Input } from '@/components/ledger/LedgerUi';
import type { EntryType, LedgerCategory, LedgerEntry, LedgerFilters } from '@/components/ledger/types';
import { LEDGER_CATEGORIES } from '@/components/ledger/types';
import { formatLedgerDateInput, formatOccurredAt, formatWon, signedAmount } from '@/components/ledger/utils';

interface LedgerListViewProps {
  allEntries: LedgerEntry[];
  entries: LedgerEntry[];
  filters: LedgerFilters;
  onFiltersChange: (filters: LedgerFilters) => void;
  onResetFilters: () => void;
  onOpenEntry: (entryId: string) => void;
  onOpenImport: () => void;
}

type FilterKey = 'occurredAt' | 'type' | 'category' | 'counterparty' | 'description' | 'amount';

interface FilterOption<T extends string | number> {
  value: T;
  label: string;
}

const TYPE_FILTER_OPTIONS: FilterOption<EntryType>[] = [
  { value: 'deposit', label: '입금' },
  { value: 'withdrawal', label: '출금' },
];

const CATEGORY_FILTER_OPTIONS: FilterOption<LedgerCategory>[] = LEDGER_CATEGORIES.map((value) => ({
  value,
  label: value,
}));

function HeaderFilter({
  label,
  active,
  open,
  onToggle,
  align = 'left',
  children,
}: {
  label: string;
  active: boolean;
  open: boolean;
  onToggle: () => void;
  align?: 'left' | 'right';
  children: ReactNode;
}) {
  return (
    <th
      data-ledger-filter
      className={`relative px-3 py-2.5 text-[10.5px] font-bold ${align === 'right' ? 'text-right' : ''}`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={`hover:bg-panel inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 transition-colors ${
          active ? 'bg-primary-soft text-primary-text' : 'text-muted'
        }`}
      >
        {label}
        <span aria-hidden="true" className="text-[9px]">
          {open ? '▴' : '▾'}
        </span>
      </button>
      {open && (
        <div
          data-ledger-filter-menu
          className={`border-line bg-panel text-text absolute top-full z-50 mt-1 min-w-[230px] rounded-[10px] border p-3 text-left font-normal shadow-xl ${
            align === 'right' ? 'right-2' : 'left-2'
          }`}
        >
          {children}
        </div>
      )}
    </th>
  );
}

function MultiSelectFilter<T extends string | number>({
  options,
  selected,
  onChange,
  searchable = false,
}: {
  options: FilterOption<T>[];
  selected: T[];
  onChange: (selected: T[]) => void;
  searchable?: boolean;
}) {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLocaleLowerCase('ko-KR');
  const visibleOptions = options.filter((option) => option.label.toLocaleLowerCase('ko-KR').includes(normalizedQuery));

  function toggle(value: T) {
    onChange(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  }

  return (
    <div className="flex flex-col gap-2">
      {searchable && (
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="목록 검색"
          className="h-9 w-full"
          autoFocus
        />
      )}
      <label className="hover:bg-panel2 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium">
        <input type="checkbox" checked={selected.length === 0} onChange={() => onChange([])} />
        전체
      </label>
      <div className="max-h-52 overflow-y-auto">
        {visibleOptions.map((option) => (
          <label
            key={String(option.value)}
            className="hover:bg-panel2 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs"
          >
            <input type="checkbox" checked={selected.includes(option.value)} onChange={() => toggle(option.value)} />
            <span className="min-w-0 truncate">{option.label}</span>
          </label>
        ))}
        {visibleOptions.length === 0 && (
          <p className="text-faint px-2 py-3 text-center text-xs">검색 결과가 없습니다.</p>
        )}
      </div>
    </div>
  );
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
}

export function LedgerListView({
  allEntries,
  entries,
  filters,
  onFiltersChange,
  onResetFilters,
  onOpenEntry,
  onOpenImport,
}: LedgerListViewProps) {
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null);
  const counterpartyOptions = useMemo(
    () =>
      [...new Set(allEntries.map((entry) => entry.counterparty))]
        .sort((a, b) => a.localeCompare(b, 'ko-KR'))
        .map((value) => ({ value, label: value || '—' })),
    [allEntries],
  );
  const descriptionOptions = useMemo(
    () =>
      [...new Set(allEntries.map((entry) => entry.description))]
        .sort((a, b) => a.localeCompare(b, 'ko-KR'))
        .map((value) => ({ value, label: value })),
    [allEntries],
  );
  const amountOptions = useMemo(
    () =>
      [...new Set(allEntries.map((entry) => entry.amount))]
        .sort((a, b) => a - b)
        .map((value) => ({ value, label: formatWon(value) })),
    [allEntries],
  );
  const isAmountRangeInvalid =
    filters.minimumAmount !== '' &&
    filters.maximumAmount !== '' &&
    Number(filters.maximumAmount) <= Number(filters.minimumAmount);

  useEffect(() => {
    function closeFilter(event: PointerEvent) {
      if (!(event.target instanceof Element) || !event.target.closest('[data-ledger-filter]')) {
        setOpenFilter(null);
      }
    }

    function closeWithEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpenFilter(null);
    }

    document.addEventListener('pointerdown', closeFilter, true);
    document.addEventListener('keydown', closeWithEscape);
    return () => {
      document.removeEventListener('pointerdown', closeFilter, true);
      document.removeEventListener('keydown', closeWithEscape);
    };
  }, []);

  function update<K extends keyof LedgerFilters>(key: K, value: LedgerFilters[K]) {
    onFiltersChange({ ...filters, [key]: value });
  }

  function toggleFilter(key: FilterKey) {
    setOpenFilter((current) => (current === key ? null : key));
  }

  return (
    <main className="mx-auto max-w-[1480px] px-8 pt-7 pb-12">
      <div className="mb-5 flex items-start gap-4">
        <div>
          <div className="text-faint mb-1.5 text-[10.5px] font-bold tracking-[0.16em]">장부 · 회비 관리</div>
          <h1 className="text-[25px] font-extrabold tracking-[-0.02em]">장부 관리</h1>
          <p className="text-muted mt-1.5 text-xs">계좌 입·출금 내역을 한곳에서 관리합니다.</p>
        </div>
        <Button tone="primary" onClick={onOpenImport} className="ml-auto">
          거래내역 가져오기
        </Button>
      </div>

      <section className="border-line bg-panel rounded-[13px] border">
        <div className="overflow-visible">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead className="bg-panel2">
              <tr className="border-line border-b">
                <HeaderFilter
                  label="거래 일시"
                  active={filters.from !== '' || filters.to !== ''}
                  open={openFilter === 'occurredAt'}
                  onToggle={() => toggleFilter('occurredAt')}
                >
                  <div className="flex flex-col gap-3">
                    <label className="text-muted flex flex-col gap-1.5 text-[10.5px] font-bold">
                      시작일
                      <Input
                        type="text"
                        inputMode="numeric"
                        maxLength={10}
                        value={filters.from}
                        onChange={(event) => update('from', formatLedgerDateInput(event.target.value, filters.from))}
                        aria-label="시작일"
                        placeholder="YYYY-MM-DD"
                        title="2000~2099년, 월 01~12, 일 01~31"
                      />
                    </label>
                    <label className="text-muted flex flex-col gap-1.5 text-[10.5px] font-bold">
                      종료일
                      <Input
                        type="text"
                        inputMode="numeric"
                        maxLength={10}
                        value={filters.to}
                        onChange={(event) => update('to', formatLedgerDateInput(event.target.value, filters.to))}
                        aria-label="종료일"
                        placeholder="YYYY-MM-DD"
                        title="2000~2099년, 월 01~12, 일 01~31"
                      />
                    </label>
                    <Button compact tone="ghost" onClick={() => onFiltersChange({ ...filters, from: '', to: '' })}>
                      초기화
                    </Button>
                  </div>
                </HeaderFilter>
                <HeaderFilter
                  label="입출금"
                  active={filters.types.length > 0}
                  open={openFilter === 'type'}
                  onToggle={() => toggleFilter('type')}
                >
                  <MultiSelectFilter
                    options={TYPE_FILTER_OPTIONS}
                    selected={filters.types}
                    onChange={(value) => update('types', value.length === 0 ? [] : [value.at(-1)!])}
                  />
                </HeaderFilter>
                <HeaderFilter
                  label="분류"
                  active={filters.categories.length > 0}
                  open={openFilter === 'category'}
                  onToggle={() => toggleFilter('category')}
                >
                  <MultiSelectFilter
                    options={CATEGORY_FILTER_OPTIONS}
                    selected={filters.categories}
                    onChange={(value) => update('categories', value)}
                  />
                </HeaderFilter>
                <HeaderFilter
                  label="이름"
                  active={filters.counterparties.length > 0}
                  open={openFilter === 'counterparty'}
                  onToggle={() => toggleFilter('counterparty')}
                >
                  <MultiSelectFilter
                    options={counterpartyOptions}
                    selected={filters.counterparties}
                    onChange={(value) => update('counterparties', value)}
                    searchable
                  />
                </HeaderFilter>
                <HeaderFilter
                  label="비고"
                  active={filters.descriptions.length > 0}
                  open={openFilter === 'description'}
                  onToggle={() => toggleFilter('description')}
                >
                  <MultiSelectFilter
                    options={descriptionOptions}
                    selected={filters.descriptions}
                    onChange={(value) => update('descriptions', value)}
                    searchable
                  />
                </HeaderFilter>
                <HeaderFilter
                  label="금액"
                  active={filters.amounts.length > 0 || filters.minimumAmount !== '' || filters.maximumAmount !== ''}
                  open={openFilter === 'amount'}
                  onToggle={() => toggleFilter('amount')}
                  align="right"
                >
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-2">
                      <label className="text-muted flex flex-col gap-1.5 text-[10.5px] font-bold">
                        최소 금액
                        <Input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          autoComplete="off"
                          value={filters.minimumAmount}
                          onChange={(event) => update('minimumAmount', digitsOnly(event.target.value))}
                          placeholder="0"
                          aria-invalid={isAmountRangeInvalid}
                          aria-describedby={isAmountRangeInvalid ? 'amount-range-error' : undefined}
                        />
                      </label>
                      <label className="text-muted flex flex-col gap-1.5 text-[10.5px] font-bold">
                        최대 금액
                        <Input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          autoComplete="off"
                          value={filters.maximumAmount}
                          onChange={(event) => update('maximumAmount', digitsOnly(event.target.value))}
                          placeholder="0"
                          aria-invalid={isAmountRangeInvalid}
                          aria-describedby={isAmountRangeInvalid ? 'amount-range-error' : undefined}
                        />
                      </label>
                    </div>
                    {isAmountRangeInvalid && (
                      <p id="amount-range-error" role="alert" className="text-danger text-[10.5px] font-semibold">
                        범위가 잘못되었습니다.
                      </p>
                    )}
                    <div className="border-line border-t pt-2">
                      <MultiSelectFilter
                        options={amountOptions}
                        selected={filters.amounts}
                        onChange={(value) => update('amounts', value)}
                      />
                    </div>
                  </div>
                </HeaderFilter>
                <th className="text-muted px-3 py-2.5 text-right text-[10.5px] font-bold tracking-[0.04em]">잔액</th>
              </tr>
            </thead>
            <tbody>
              {entries.length > 0 ? (
                entries.map((entry) => (
                  <tr
                    key={entry.id}
                    tabIndex={0}
                    role="link"
                    onClick={() => onOpenEntry(entry.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') onOpenEntry(entry.id);
                    }}
                    className="border-line hover:bg-primary-sunken focus:bg-primary-sunken cursor-pointer border-b last:border-b-0 focus:outline-none"
                  >
                    <td className="text-primary-text px-3 py-3 text-xs font-medium whitespace-nowrap">
                      {formatOccurredAt(entry.occurredAt)}
                    </td>
                    <td className="text-text px-3 py-3 text-xs font-semibold">
                      {entry.type === 'deposit' ? '입금' : '출금'}
                    </td>
                    <td className="text-text px-3 py-3 text-xs whitespace-nowrap">{entry.category}</td>
                    <td className="text-text px-3 py-3 text-xs whitespace-nowrap">{entry.counterparty || '—'}</td>
                    <td className="text-muted max-w-[320px] truncate px-3 py-3 text-xs">{entry.description}</td>
                    <td
                      className="px-3 py-3 text-right text-xs font-bold whitespace-nowrap"
                      style={{ color: entry.type === 'deposit' ? 'var(--stock-up)' : 'var(--stock-down)' }}
                    >
                      {signedAmount(entry)}
                    </td>
                    <td className="text-muted px-3 py-3 text-right text-xs whitespace-nowrap">
                      {formatWon(entry.balance)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8">
                    <div className="border-dash mx-auto flex max-w-[430px] flex-col items-center justify-center rounded-[13px] border border-dashed px-8 py-6 text-center">
                      <strong className="text-text text-[14px]">조건에 맞는 장부 기록이 없습니다.</strong>
                      <button
                        type="button"
                        onClick={onResetFilters}
                        className="text-primary-text mt-2 cursor-pointer border-0 bg-transparent px-2 py-1 text-xs font-semibold hover:underline"
                      >
                        초기화
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-faint mt-3 text-[10.5px] leading-5">변경한 예시 데이터는 새로고침하면 초기화됩니다.</p>
    </main>
  );
}
