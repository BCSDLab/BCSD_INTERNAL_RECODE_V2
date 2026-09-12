'use client';

import { useEffect, useRef } from 'react';

const ITEM_HEIGHT = 42;
const SPACER_HEIGHT = 63;
const SNAP_DEBOUNCE_MS = 110;

export interface TimeWheelItem {
  value: number;
  label: string;
}

interface TimeWheelProps {
  items: TimeWheelItem[];
  selectedValue: number;
  onSelect: (value: number) => void;
  /** Wheels only auto-scroll to center when this changes (e.g. the selected day), matching
   *  the source design: picking a row or settling a scroll never yanks the wheel around. */
  centerTrigger: string;
}

export function TimeWheel({ items, selectedValue, onSelect, centerTrigger }: TimeWheelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef({ items, selectedValue, onSelect });

  useEffect(() => {
    stateRef.current = { items, selectedValue, onSelect };
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { items: currentItems, selectedValue: currentValue } = stateRef.current;
    const index = currentItems.findIndex((item) => item.value === currentValue);
    el.scrollTop = Math.max(0, index) * ITEM_HEIGHT;
  }, [centerTrigger]);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  function handleScroll(event: React.UIEvent<HTMLDivElement>) {
    const scrollTop = event.currentTarget.scrollTop;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const { items: currentItems, selectedValue: currentValue, onSelect: select } = stateRef.current;
      const index = Math.max(0, Math.min(currentItems.length - 1, Math.round(scrollTop / ITEM_HEIGHT)));
      const item = currentItems[index];
      if (item && item.value !== currentValue) select(item.value);
    }, SNAP_DEBOUNCE_MS);
  }

  return (
    <div className="relative w-[70px]">
      <div className="pointer-events-none absolute inset-x-0 top-[63px] z-10 h-[42px] border-t border-b border-[#E4BBFB] bg-[rgba(182,17,245,.06)]" />
      <div
        ref={ref}
        onScroll={handleScroll}
        className="border-line bg-panel scrollbar-none h-[168px] snap-y snap-mandatory overflow-y-auto rounded-[10px] border [&::-webkit-scrollbar]:hidden"
      >
        <div style={{ height: SPACER_HEIGHT }} />
        {items.map((item) => {
          const active = item.value === selectedValue;
          return (
            <div
              key={item.value}
              onClick={() => onSelect(item.value)}
              className="flex h-[42px] snap-center cursor-pointer items-center justify-center [font-variant-numeric:tabular-nums]"
              style={
                active
                  ? { fontSize: 17, fontWeight: 800, color: '#b611f5' }
                  : { fontSize: 14.5, fontWeight: 500, color: 'var(--muted)' }
              }
            >
              {item.label}
            </div>
          );
        })}
        <div style={{ height: SPACER_HEIGHT }} />
      </div>
    </div>
  );
}
