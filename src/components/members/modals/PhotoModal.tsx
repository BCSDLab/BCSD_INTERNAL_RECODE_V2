'use client';

import { useRef, useState } from 'react';
import { Modal } from '@/components/ui/Modal';

interface PhotoModalProps {
  memberLabel: string;
  initial: string;
  avatarColor: string;
  onClose: () => void;
  onUpload: (file: File) => void;
}

export function PhotoModal({ memberLabel, initial, avatarColor, onClose, onUpload }: PhotoModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function handleSave() {
    if (selectedFile) {
      onUpload(selectedFile);
    } else {
      onClose();
    }
  }

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
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt={memberLabel} className="h-24 w-24 flex-none rounded-full object-cover" />
          ) : (
            <div
              style={{ background: avatarColor }}
              className="flex h-24 w-24 flex-none items-center justify-center rounded-full text-[30px] font-extrabold text-white"
            >
              {initial}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer rounded-[10px] border border-[rgba(0,0,0,0.16)] bg-[rgba(0,0,0,0.03)] px-3.5 py-2 text-[12.5px] whitespace-nowrap text-[#1B1B22]"
            >
              사진 업로드
            </button>
            <span className="text-[11px] leading-[1.55] text-[#87878F]">
              JPG · PNG · WEBP · 5MB 이하
              <br />
              정사각 권장, 원형으로 표시
            </span>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="flex-none cursor-pointer rounded-[10px] border border-[rgba(0,0,0,0.14)] px-4 py-2.5 text-[13px] whitespace-nowrap text-[#3C3C46]"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedFile}
            className="flex-none cursor-pointer rounded-[10px] bg-[var(--accent)] px-[18px] py-2.5 text-[13px] font-bold whitespace-nowrap text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            저장
          </button>
        </div>
      </div>
    </Modal>
  );
}
