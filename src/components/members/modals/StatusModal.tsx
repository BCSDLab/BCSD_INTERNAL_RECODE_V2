'use client';

import { ENROLLS } from '@/components/members/constants';
import type { EnrollStatus } from '@/components/members/types';
import { Modal } from '@/components/ui/Modal';

interface StatusModalProps {
  memberName: string;
  value: EnrollStatus;
  onChange: (value: EnrollStatus) => void;
  onClose: () => void;
  onApply: () => void;
}

export function StatusModal({ memberName, value, onChange, onClose, onApply }: StatusModalProps) {
  return (
    <Modal onClose={onClose} maxWidth={340}>
      <div className="p-5">
        <div className="mb-1 text-[15px] font-bold">{memberName} · 학적 상태</div>
        <div className="mb-3.5 text-xs text-[#6C6C78]">활동 여부는 변경되지 않습니다.</div>
        <div className="mb-3.5 flex flex-col gap-1.5">
          {ENROLLS.map((option) => (
            <button
              key={option}
              onClick={() => onChange(option)}
              className="cursor-pointer rounded-[11px] border px-[13px] py-2.5 text-left text-[13px]"
              style={{
                borderColor: value === option ? 'rgba(195,96,243,0.55)' : 'rgba(0,0,0,0.1)',
                background: value === option ? 'rgba(195,96,243,0.18)' : 'rgba(0,0,0,0.025)',
                color: value === option ? '#8F27C4' : '#3C3C46',
              }}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="flex-none cursor-pointer rounded-[10px] border border-[rgba(0,0,0,0.14)] px-4 py-2.5 text-[13px] whitespace-nowrap text-[#3C3C46]"
          >
            취소
          </button>
          <button
            onClick={onApply}
            className="flex-none cursor-pointer rounded-[10px] bg-[var(--accent)] px-[18px] py-2.5 text-[13px] font-bold whitespace-nowrap text-white"
          >
            적용
          </button>
        </div>
      </div>
    </Modal>
  );
}
