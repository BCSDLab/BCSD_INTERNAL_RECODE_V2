import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

function classes(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: 'primary' | 'outline' | 'danger' | 'ghost';
  compact?: boolean;
}

export function Button({ tone = 'outline', compact = false, className, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={classes(
        'inline-flex cursor-pointer items-center justify-center rounded-[9px] border text-[12.5px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45',
        compact ? 'h-8 px-3' : 'h-10 px-4',
        tone === 'primary' && 'border-primary bg-primary text-on-primary hover:opacity-90',
        tone === 'outline' && 'border-line2 bg-panel text-muted hover:bg-panel2',
        tone === 'danger' && 'border-danger bg-danger text-on-primary hover:opacity-90',
        tone === 'ghost' && 'border-transparent bg-transparent text-muted hover:bg-panel2',
        className,
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={classes(
        'h-10 min-w-0 rounded-[9px] border border-line2 bg-panel px-3 text-[12.5px] text-text outline-none placeholder:text-faint focus:border-primary-line focus:ring-2 focus:ring-primary-soft',
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={classes(
        'h-10 min-w-0 cursor-pointer appearance-auto rounded-[9px] border border-line2 bg-panel px-3 text-[12.5px] text-text outline-none focus:border-primary-line focus:ring-2 focus:ring-primary-soft',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

interface PanelProps {
  title: string;
  accessory?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Panel({ title, accessory, children, className }: PanelProps) {
  return (
    <section className={classes('overflow-hidden rounded-[13px] border border-line bg-panel', className)}>
      <div className="border-line flex min-h-12 items-center border-b px-4">
        <h2 className="text-text text-[13px] font-bold">{title}</h2>
        {accessory && <div className="ml-auto">{accessory}</div>}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function ModalFrame({
  title,
  subtitle,
  onClose,
  width = '600px',
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  width?: string;
  children: ReactNode;
}) {
  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#111018]/55 p-6 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="border-line bg-panel text-text max-h-[calc(100vh-48px)] w-full overflow-auto rounded-[15px] border shadow-xl"
        style={{ maxWidth: width }}
      >
        <header className="border-line bg-panel sticky top-0 z-10 flex items-center border-b px-[22px] py-4">
          <div>
            <h2 className="text-text text-[16px] font-bold">{title}</h2>
            {subtitle && <p className="text-muted mt-1 text-xs">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-muted hover:bg-panel2 ml-auto h-8 w-8 cursor-pointer rounded-lg text-lg"
          >
            ×
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

export function LinkStatusBadge({ status }: { status: 'confirmed' | 'pending' | 'none' }) {
  if (status === 'confirmed') {
    return (
      <span className="border-primary-line bg-primary-soft text-primary-text inline-flex rounded-full border px-2.5 py-[3px] text-[10.5px] font-bold">
        확정
      </span>
    );
  }

  if (status === 'pending') {
    return (
      <span className="border-line2 bg-panel text-muted inline-flex rounded-full border px-2.5 py-[3px] text-[10.5px] font-semibold">
        미정
      </span>
    );
  }

  return <span className="text-faint text-[11px]">—</span>;
}

export function Toast({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="border-line bg-panel/95 text-text pointer-events-none fixed top-6 right-6 z-[70] flex max-w-[360px] items-center gap-2.5 rounded-[11px] border px-3.5 py-3 text-[12.5px] font-medium shadow-lg backdrop-blur-[10px]"
    >
      <span
        aria-hidden="true"
        className="bg-primary-soft text-primary-text flex h-5 w-5 flex-none items-center justify-center rounded-full text-[11px] font-bold"
      >
        ✓
      </span>
      <span>{message}</span>
    </div>
  );
}
