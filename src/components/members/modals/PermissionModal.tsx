'use client';

import type { Permission } from '@/components/members/types';
import { Modal } from '@/components/ui/Modal';

interface PermissionOption {
  key: Permission;
  title: string;
  desc: string;
}

const PERMISSION_OPTIONS: PermissionOption[] = [
  { key: '일반', title: '일반 — 조회 · 수정 가능', desc: '기존 부원 정보를 수정할 수 있으나 추가 · 삭제는 할 수 없습니다.' },
  { key: '관리자', title: '관리자 — 추가 · 삭제까지 가능', desc: '부원 추가와 삭제를 포함해 인명부 전체를 관리합니다.' },
];

interface PermissionModalProps {
  memberLabel: string;
  value: Permission;
  onChange: (value: Permission) => void;
  onClose: () => void;
  onApply: () => void;
}

export function PermissionModal({ memberLabel, value, onChange, onClose, onApply }: PermissionModalProps) {
  return (
    <Modal onClose={onClose} maxWidth={380} borderClassName="border-[rgba(195,96,243,0.28)]">
      <div className="p-[22px]">
        <div className="mb-3.5 text-base font-bold">권한 · {memberLabel}</div>
        <div className="mb-3.5 flex flex-col gap-[7px]">
          {PERMISSION_OPTIONS.map((option) => (
            <button
              key={option.key}
              onClick={() => onChange(option.key)}
              className="cursor-pointer rounded-xl border px-[13px] py-[11px] text-left text-[13px]"
              style={{
                borderColor: value === option.key ? 'rgba(195,96,243,0.6)' : 'rgba(0,0,0,0.1)',
                background: value === option.key ? 'rgba(195,96,243,0.16)' : 'rgba(0,0,0,0.025)',
                color: value === option.key ? '#8F27C4' : '#3C3C46',
              }}
            >
              <span className="font-bold">{option.title}</span>
              <span className="mt-[3px] block text-[11.5px] text-[#6C6C78]">{option.desc}</span>
            </button>
          ))}
        </div>
        <div className="mb-[18px] rounded-xl border border-dashed border-[rgba(0,0,0,0.16)] px-3.5 py-[11px] text-[11.5px] leading-[1.6] text-[#6C6C78]">
          구분(beginner / regular / mentor)과 별개로 부여합니다. 회장 · 부회장만 변경할 수 있습니다.
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
