'use client';

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  onClose: () => void;
  children: ReactNode;
  maxWidth: number;
  borderClassName?: string;
}

export function Modal({ onClose, children, maxWidth, borderClassName = 'border-[rgba(0,0,0,0.12)]' }: ModalProps) {
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(28,22,40,0.32)] backdrop-blur-[3px]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: maxWidth }}
        className={`max-h-[calc(100%-64px)] w-full max-w-full overflow-auto rounded-[20px] border bg-white shadow-[0_20px_56px_rgba(24,16,40,0.16)] ${borderClassName}`}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
