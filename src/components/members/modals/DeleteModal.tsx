'use client';

import { Modal } from '@/components/ui/Modal';

interface DeleteModalProps {
  summaryLine: string;
  onClose: () => void;
  onDeactivate: () => void;
  onConfirm: () => void;
}

export function DeleteModal({ summaryLine, onClose, onDeactivate, onConfirm }: DeleteModalProps) {
  return (
    <Modal onClose={onClose} maxWidth={420} borderClassName="border-[rgba(214,58,76,0.28)]">
      <div className="p-[22px]">
        <div className="mb-3.5 text-[17px] font-extrabold">부원 삭제</div>
        <div className="mb-3 rounded-xl border border-[rgba(0,0,0,0.1)] bg-[rgba(0,0,0,0.025)] px-[15px] py-[13px]">
          <div className="mb-[5px] text-[13.5px] font-bold">{summaryLine}</div>
          <div className="text-xs leading-[1.6] text-[#6C6C78]">인명부에서 완전히 삭제되며 되돌릴 수 없습니다.</div>
        </div>
        <div className="mb-[18px] rounded-xl border border-dashed border-[rgba(0,0,0,0.16)] px-3.5 py-[11px] text-xs text-[#6C6C78]">
          활동만 중단하려면{' '}
          <button onClick={onDeactivate} className="cursor-pointer border-none bg-transparent p-0 text-xs text-[#8F27C4] underline">
            비활동으로 변경
          </button>
          하세요.
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="flex-none cursor-pointer rounded-[10px] border border-[rgba(0,0,0,0.14)] px-4 py-2.5 text-[13px] whitespace-nowrap text-[#3C3C46]"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="flex-none cursor-pointer rounded-[10px] bg-[#D63A4C] px-[18px] py-2.5 text-[13px] font-bold whitespace-nowrap text-white"
          >
            삭제
          </button>
        </div>
      </div>
    </Modal>
  );
}
