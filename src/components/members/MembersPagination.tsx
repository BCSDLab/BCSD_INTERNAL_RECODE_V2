'use client';

interface MembersPaginationProps {
  rangeLabel: string;
  page: number;
  pageCount: number;
  onPrev: () => void;
  onNext: () => void;
  onSelectPage: (page: number) => void;
}

export function MembersPagination({ rangeLabel, page, pageCount, onPrev, onNext, onSelectPage }: MembersPaginationProps) {
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);

  return (
    <div className="flex items-center gap-2.5 border-t border-[rgba(0,0,0,0.07)] px-4 py-[13px] text-[12.5px] text-[#6C6C78]">
      <span>{rangeLabel}</span>
      <span className="ml-auto flex gap-1.5">
        <button
          onClick={onPrev}
          className="h-8 min-w-8 cursor-pointer rounded-[9px] border border-[rgba(0,0,0,0.12)] bg-transparent text-[#3C3C46]"
        >
          ‹
        </button>
        {pages.map((n) => (
          <button
            key={n}
            onClick={() => onSelectPage(n)}
            className="h-8 min-w-8 cursor-pointer rounded-[9px] border font-semibold"
            style={{
              borderColor: n === page ? 'rgba(195,96,243,0.5)' : 'rgba(0,0,0,0.12)',
              background: n === page ? 'rgba(195,96,243,0.22)' : 'transparent',
              color: n === page ? '#8F27C4' : '#6C6C78',
            }}
          >
            {n}
          </button>
        ))}
        <button
          onClick={onNext}
          className="h-8 min-w-8 cursor-pointer rounded-[9px] border border-[rgba(0,0,0,0.12)] bg-transparent text-[#3C3C46]"
        >
          ›
        </button>
      </span>
    </div>
  );
}
