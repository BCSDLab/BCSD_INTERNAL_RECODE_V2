'use client';

import type { ReactNode } from 'react';

export interface FilterOption<T extends string> {
  value: T;
  label: string;
}

export function HeaderFilter({
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
  align?: 'left' | 'center' | 'right';
  children: ReactNode;
}) {
  return (
    <th
      data-dues-filter
      className={`relative px-2.5 py-2 text-[10.5px] font-bold ${
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : ''
      }`}
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
          className={`border-line bg-panel text-text absolute top-full z-50 mt-1 min-w-[220px] rounded-[10px] border p-3 text-left font-normal shadow-xl ${
            align === 'right' ? 'right-2' : align === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-2'
          }`}
        >
          {children}
        </div>
      )}
    </th>
  );
}

export function CheckboxFilter<T extends string>({
  options,
  selected,
  onChange,
}: {
  options: FilterOption<T>[];
  selected: T[];
  onChange: (values: T[]) => void;
}) {
  function toggle(value: T) {
    onChange(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  }

  return (
    <div className="flex max-h-60 flex-col gap-1 overflow-y-auto">
      <label className="hover:bg-panel2 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium">
        <input type="checkbox" checked={selected.length === 0} onChange={() => onChange([])} />
        전체
      </label>
      {options.map((option) => (
        <label
          key={option.value}
          className="hover:bg-panel2 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs"
        >
          <input type="checkbox" checked={selected.includes(option.value)} onChange={() => toggle(option.value)} />
          {option.label}
        </label>
      ))}
    </div>
  );
}
