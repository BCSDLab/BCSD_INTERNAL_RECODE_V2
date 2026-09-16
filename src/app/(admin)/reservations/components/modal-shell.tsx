'use client';

import { Dialog } from '@base-ui/react/dialog';
import type { ReactNode } from 'react';

interface ModalShellProps {
  onClose: () => void;
  children: ReactNode;
  maxWidth: number;
}

/**
 * 이 화면의 예약 상세 모달은 배지·회차 목록 등 완전히 커스텀 레이아웃이라
 * `src/components/ui/modal.tsx`의 eyebrow/title/footer 슬롯 API와 맞지 않는다.
 * 오버레이 동작(포탈, 스크롤 잠금, 바깥 클릭/ESC 닫기, 포커스 트랩)만 Base UI Dialog에
 * 맡기고, 안은 그대로 호출부가 채운다.
 */
export function ModalShell({ onClose, children, maxWidth }: ModalShellProps) {
  return (
    <Dialog.Root open modal onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(10,8,16,.55)] p-6">
          <Dialog.Popup
            style={{ width: maxWidth }}
            className="bg-panel max-h-[calc(100%-48px)] w-full max-w-full overflow-auto rounded-2xl shadow-[0_30px_70px_rgba(27,11,40,.35)] outline-none"
          >
            {children}
          </Dialog.Popup>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
