'use client';

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalShellProps {
  onClose: () => void;
  children: ReactNode;
  maxWidth: number;
}

/**
 * 이 화면의 예약 상세 모달은 배지·회차 목록 등 완전히 커스텀 레이아웃이라
 * `src/components/ui/modal.tsx`의 eyebrow/title/footer 슬롯 API와 맞지 않는다.
 * 오버레이 동작(포탈, 스크롤 잠금, 클릭 닫기)만 가진 얇은 셸을 이 화면 전용으로 둔다.
 */
export function ModalShell({ onClose, children, maxWidth }: ModalShellProps) {
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  return createPortal(
    <div onClick={onClose} className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(10,8,16,.55)] p-6">
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: maxWidth }}
        className="bg-panel max-h-[calc(100%-48px)] w-full max-w-full overflow-auto rounded-2xl shadow-[0_30px_70px_rgba(27,11,40,.35)]"
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
