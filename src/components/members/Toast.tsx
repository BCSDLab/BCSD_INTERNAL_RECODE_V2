'use client';

interface ToastProps {
  message: string;
  canUndo: boolean;
  onUndo: () => void;
}

export function Toast({ message, canUndo, onUndo }: ToastProps) {
  return (
    <div className="fixed bottom-[30px] left-1/2 z-[70] flex -translate-x-1/2 items-center gap-3.5 rounded-[13px] border border-[rgba(0,0,0,0.14)] bg-white px-[18px] py-3 text-[13px] shadow-[0_14px_38px_rgba(24,16,40,0.16)]">
      <span>{message}</span>
      {canUndo && (
        <button onClick={onUndo} className="cursor-pointer border-none bg-transparent p-0 text-[13px] font-semibold text-[#8F27C4]">
          실행 취소
        </button>
      )}
    </div>
  );
}
