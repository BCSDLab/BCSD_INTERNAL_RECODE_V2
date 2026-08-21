'use client';

import { AVATAR_COLORS, FORM_FIELD_DEFS, REQUIRED_FIELDS } from '@/components/members/constants';
import type { Member } from '@/components/members/types';
import { Modal } from '@/components/ui/Modal';

interface MemberFormModalProps {
  form: Member;
  isEdit: boolean;
  formError: string;
  onChange: <K extends keyof Member>(key: K, value: Member[K]) => void;
  onToggleActive: () => void;
  onClose: () => void;
  onDelete: () => void;
  onSave: () => void;
}

export function MemberFormModal({
  form,
  isEdit,
  formError,
  onChange,
  onToggleActive,
  onClose,
  onDelete,
  onSave,
}: MemberFormModalProps) {
  const initial = form.name ? form.name.slice(0, 1) : '+';
  const avatarBg = form.name ? AVATAR_COLORS[form.name.length % AVATAR_COLORS.length] : 'rgba(0,0,0,0.07)';

  return (
    <Modal onClose={onClose} maxWidth={720}>
      <div className="p-6">
        <div className="mb-[18px] flex items-baseline gap-2.5">
          <div className="text-xl font-extrabold">{isEdit ? '부원 수정' : '부원 추가'}</div>
          <span className="text-[11.5px] text-[#6C6C78]">* 필수</span>
          <button onClick={onClose} className="ml-auto cursor-pointer border-none bg-transparent text-base text-[#6C6C78]">
            ✕
          </button>
        </div>

        <div className="mb-4 flex items-center gap-4 rounded-[14px] border border-[rgba(0,0,0,0.1)] bg-[rgba(0,0,0,0.025)] px-4 py-3.5">
          <div
            style={{ background: avatarBg }}
            className="flex h-[72px] w-[72px] flex-none items-center justify-center rounded-full text-2xl font-extrabold text-white"
          >
            {initial}
          </div>
          <div className="flex flex-col gap-[7px]">
            <button
              type="button"
              className="cursor-pointer rounded-[10px] border border-[rgba(0,0,0,0.16)] bg-[rgba(0,0,0,0.03)] px-3.5 py-2 text-[12.5px] whitespace-nowrap text-[#1B1B22]"
            >
              프로필 사진 업로드
            </button>
            <span className="text-[11px] text-[#87878F]">선택 사항 · JPG · PNG · 5MB 이하</span>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-[13px]">
          {FORM_FIELD_DEFS.map((field) => {
            const value = form[field.key];
            const error =
              formError === '필수' && REQUIRED_FIELDS.includes(field.key) && !value
                ? '필수 항목입니다'
                : field.key === 'sid' && formError && formError !== '필수'
                  ? formError
                  : '';
            return (
              <div key={field.key} className="flex flex-col gap-1.5">
                <label className="text-[11.5px] text-[#6C6C78]">{field.label}</label>
                {field.options ? (
                  <select
                    value={String(value ?? '')}
                    onChange={(e) => onChange(field.key, e.target.value as Member[typeof field.key])}
                    className="h-10 rounded-[11px] border border-[rgba(0,0,0,0.13)] bg-[rgba(0,0,0,0.03)] px-2.5 text-[13px] text-[#1B1B22]"
                  >
                    {field.options.map((option) => (
                      <option key={option} value={option} className="bg-white">
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={String(value ?? '')}
                    onChange={(e) => onChange(field.key, e.target.value as Member[typeof field.key])}
                    placeholder={field.placeholder}
                    className="h-10 rounded-[11px] border border-[rgba(0,0,0,0.13)] bg-[rgba(0,0,0,0.03)] px-3 text-[13px] text-[#1B1B22]"
                  />
                )}
                {error && <span className="text-[11px] text-[#D63A4C]">{error}</span>}
              </div>
            );
          })}
        </div>

        <div className="mb-[18px] flex items-center gap-3 rounded-xl border border-[rgba(0,0,0,0.1)] bg-[rgba(0,0,0,0.025)] px-[15px] py-[13px]">
          <span className="text-[13px]">활동 여부</span>
          <button onClick={onToggleActive} className="ml-auto inline-flex cursor-pointer items-center gap-2.5 border-none bg-transparent p-0">
            <span
              className="relative inline-block h-5 w-9 flex-none rounded-full"
              style={{ background: form.active ? '#C360F3' : 'rgba(0,0,0,0.18)' }}
            >
              <span className="absolute top-0.5 h-4 w-4 rounded-full bg-white" style={{ left: form.active ? '18px' : '2px' }} />
            </span>
            <span className="text-[12.5px] whitespace-nowrap" style={{ color: form.active ? '#8F27C4' : '#6C6C78' }}>
              {form.active ? '활동으로 등록' : '비활동으로 등록'}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isEdit && (
            <button
              onClick={onDelete}
              className="flex-none cursor-pointer rounded-[10px] border border-[rgba(214,58,76,0.35)] px-4 py-2.5 text-[13px] whitespace-nowrap text-[#D63A4C]"
            >
              삭제
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-auto flex-none cursor-pointer rounded-[10px] border border-[rgba(0,0,0,0.14)] px-4 py-2.5 text-[13px] whitespace-nowrap text-[#3C3C46]"
          >
            취소
          </button>
          <button
            onClick={onSave}
            className="flex-none cursor-pointer rounded-[10px] bg-[var(--accent)] px-5 py-2.5 text-[13px] font-bold whitespace-nowrap text-white"
          >
            저장
          </button>
        </div>
      </div>
    </Modal>
  );
}
