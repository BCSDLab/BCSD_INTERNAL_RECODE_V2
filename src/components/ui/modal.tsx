'use client';

import { Button } from './button';

/**
 * 시안의 모달 셸: rgba(10,8,16,.55) 오버레이 + radius 18 / line2 테두리 / panel 배경.
 * 머리(eyebrow + 제목 + ✕) · 본문 · 바닥(안내문 + 취소/저장)으로 나뉜다.
 */
export function Modal({
  eyebrow,
  title,
  onClose,
  width = '560px',
  footer,
  children,
}: {
  eyebrow?: string;
  title: string;
  onClose: () => void;
  width?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,8,16,.55)] p-8">
      <div
        style={{ width }}
        className="border-line2 bg-panel flex max-h-full max-w-full flex-col overflow-hidden rounded-[18px] border"
      >
        <div className="border-line flex items-center gap-3 border-b px-6 py-[18px]">
          <div className="flex min-w-0 flex-col gap-1">
            {eyebrow && (
              <div className="text-faint text-[11px] tracking-[.14em] whitespace-nowrap uppercase">{eyebrow}</div>
            )}
            <div className="text-[17px] font-semibold tracking-[-.01em]">{title}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-faint hover:text-text ml-auto flex-none cursor-pointer px-2 py-1 text-[15px] transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">{children}</div>

        {footer && <div className="border-line bg-panel2 flex items-center gap-2.5 border-t px-6 py-3.5">{footer}</div>}
      </div>
    </div>
  );
}

/** 모달 바닥의 기본 구성: 왼쪽 안내문 + 취소/확인 버튼. */
export function ModalFooter({
  note,
  confirmLabel = '저장',
  confirmDisabled = false,
  onCancel,
  onConfirm,
}: {
  note?: string;
  confirmLabel?: string;
  confirmDisabled?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <>
      {note && <span className="text-faint text-[11px] whitespace-nowrap">{note}</span>}
      <Button onClick={onCancel} className="ml-auto px-4 py-2.5">
        취소
      </Button>
      <Button variant="primary" onClick={onConfirm} disabled={confirmDisabled} className="px-[18px] py-2.5">
        {confirmLabel}
      </Button>
    </>
  );
}

/** 삭제 확인 모달 — 네이티브 confirm()을 쓰지 않는다(자동화·일관성). */
export function ConfirmModal({
  title,
  description,
  confirmLabel = '삭제',
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      width="440px"
      footer={
        <>
          <Button onClick={onCancel} className="ml-auto px-4 py-2.5">
            취소
          </Button>
          <Button variant="dangerOutline" onClick={onConfirm} className="px-4 py-2.5">
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-muted m-0 px-6 py-5 text-[13px] leading-[1.7]">{description}</p>
    </Modal>
  );
}
