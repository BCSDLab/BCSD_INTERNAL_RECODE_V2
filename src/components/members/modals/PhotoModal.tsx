'use client';

import { Modal } from '@/components/ui/Modal';

interface PhotoModalProps {
  memberLabel: string;
  initial: string;
  avatarColor: string;
  onClose: () => void;
}

export function PhotoModal({ memberLabel, initial, avatarColor, onClose }: PhotoModalProps) {
  return (
    <Modal onClose={onClose} maxWidth={400}>
      <div className="p-[22px]">
        <div className="mb-4 flex items-baseline gap-2.5">
          <div className="text-[17px] font-extrabold">프로필 사진</div>
          <span className="text-[11.5px] text-[#6C6C78]">{memberLabel}</span>
          <button onClick={onClose} className="ml-auto cursor-pointer border-none bg-transparent text-[15px] text-[#6C6C78]">
            ✕
          </button>
        </div>
        <div className="mb-3.5 flex items-center gap-4">
          <div
            style={{ background: avatarColor }}
            className="flex h-24 w-24 flex-none items-center justify-center rounded-full text-[30px] font-extrabold text-white"
          >
            {initial}
          </div>
          <div className="flex flex-col gap-2">
            <button className="cursor-pointer rounded-[10px] border border-[rgba(0,0,0,0.16)] bg-[rgba(0,0,0,0.03)] px-3.5 py-2 text-[12.5px] whitespace-nowrap text-[#1B1B22]">
              사진 업로드
            </button>
            <button className="cursor-pointer rounded-[10px] border border-[rgba(0,0,0,0.12)] bg-transparent px-3.5 py-2 text-[12.5px] whitespace-nowrap text-[#6C6C78]">
              기본 이미지로
            </button>
            <span className="text-[11px] leading-[1.55] text-[#87878F]">
              JPG · PNG · 5MB 이하
              <br />
              정사각 권장, 원형으로 표시
            </span>
          </div>
        </div>
        <div className="mb-[18px] rounded-[13px] border border-dashed border-[rgba(0,0,0,0.16)] py-[22px] text-center text-[12.5px] text-[#87878F]">
          이미지를 이 영역에 끌어다 놓기
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="flex-none cursor-pointer rounded-[10px] border border-[rgba(0,0,0,0.14)] px-4 py-2.5 text-[13px] whitespace-nowrap text-[#3C3C46]"
          >
            취소
          </button>
          <button
            onClick={onClose}
            className="flex-none cursor-pointer rounded-[10px] bg-[var(--accent)] px-[18px] py-2.5 text-[13px] font-bold whitespace-nowrap text-white"
          >
            저장
          </button>
        </div>
      </div>
    </Modal>
  );
}
