'use client';

import type { ReservationDetailView } from '@/components/reservations/reservation-adapter';
import { formatMinutes } from '@/components/reservations/time-utils';
import { Modal } from '@/components/ui/Modal';

interface ReservationDetailModalProps {
  detail: ReservationDetailView;
  errorMessage: string | null;
  onClose: () => void;
  onCancel: () => void;
  onCancelGroup: () => void;
  onTimeChange: () => void;
}

export function ReservationDetailModal({
  detail,
  errorMessage,
  onClose,
  onCancel,
  onCancelGroup,
  onTimeChange,
}: ReservationDetailModalProps) {
  const rows: { k: string; v: string }[] = [
    { k: '일시', v: `${detail.dateLabel} ${formatMinutes(detail.start)} – ${formatMinutes(detail.end)}` },
    { k: '장소', v: '동아리방' },
    { k: '목적', v: `${detail.purpose} (${detail.headcount}명)` },
  ];
  if (detail.repeatLabel) rows.push({ k: '반복', v: detail.repeatLabel });

  return (
    <Modal onClose={onClose} maxWidth={472}>
      <div className="p-[26px] pb-6">
        <div className="flex items-center gap-2.5">
          <span className="text-lg font-bold tracking-[-0.3px] text-[#1B0B28]">예약 상세</span>
          <span
            className="rounded-full px-[10px] py-[3px] text-[11.5px] font-bold text-white"
            style={{ background: detail.cancelled ? '#94A3B0' : '#b611f5' }}
          >
            {detail.cancelled ? '취소됨' : '확정'}
          </span>
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-sm text-[#9AA6B5]"
          >
            ✕
          </button>
        </div>

        <div className="mt-[18px] flex flex-col gap-px overflow-hidden rounded-[11px] bg-[#EEF2F7]">
          {rows.map((row) => (
            <div key={row.k} className="flex gap-4 bg-white px-3.5 py-[11px]">
              <span className="w-[62px] flex-none text-xs font-semibold text-[#9AA6B5]">{row.k}</span>
              <span className="text-[13.5px] text-[#1B0B28]">{row.v}</span>
            </div>
          ))}
        </div>

        {detail.occurrences.length > 0 && (
          <div className="mt-3 max-h-[140px] overflow-y-auto rounded-[10px] border border-[#EEF2F7]">
            {detail.occurrences.map((occurrence) => (
              <div
                key={occurrence.id}
                className="flex items-center justify-between border-b border-[#F3F1F7] px-3.5 py-2 text-[12.5px] last:border-b-0"
                style={{ background: occurrence.isCurrent ? 'rgba(182,17,245,.06)' : '#fff' }}
              >
                <span style={{ color: occurrence.isCurrent ? '#b611f5' : '#4A5A6D', fontWeight: occurrence.isCurrent ? 700 : 500 }}>
                  {occurrence.dateLabel}
                  {occurrence.isCurrent ? ' (이 예약)' : ''}
                </span>
                <span style={{ color: occurrence.cancelled ? '#94A3B0' : '#8895A7' }}>{occurrence.cancelled ? '취소됨' : '확정'}</span>
              </div>
            ))}
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 rounded-r-lg border-l-[3px] border-[#B3433A] bg-[#FBF6F5] px-[15px] py-[13px] text-[12.5px] leading-[1.5] text-[#B3433A]">
            {errorMessage}
          </div>
        )}

        {!detail.cancelled && (
          <div className="mt-4 rounded-r-lg border-l-[3px] border-[#B3433A] bg-[#FBF6F5] px-[15px] py-[13px] text-[12.5px] leading-[1.5] text-[#5A4A48]">
            {detail.cancellable
              ? '취소하면 되돌릴 수 없고, 이 시간은 바로 다른 동아리원에게 열립니다.'
              : '시작 1시간 이내에는 취소할 수 없습니다. 담당자에게 문의해 주세요.'}
          </div>
        )}

        <div className="mt-[18px] flex flex-wrap gap-2.5">
          {!detail.cancelled && (
            <button
              type="button"
              disabled={!detail.cancellable}
              onClick={onCancel}
              className="rounded-[9px] px-[22px] py-[11px] text-sm font-semibold whitespace-nowrap"
              style={
                detail.cancellable
                  ? { background: '#B3433A', color: '#fff', cursor: 'pointer' }
                  : { background: '#F3ECEC', color: '#C9A9A6' }
              }
            >
              예약 취소
            </button>
          )}
          {!detail.cancelled && (
            <button
              type="button"
              disabled={!detail.cancellable}
              onClick={onTimeChange}
              className="rounded-[9px] border px-5 py-[11px] text-sm font-semibold whitespace-nowrap"
              style={
                detail.cancellable ? { borderColor: '#DDE3EC', color: '#4A5A6D', cursor: 'pointer' } : { borderColor: '#EEF2F7', color: '#C7CFDA' }
              }
            >
              시간 변경
            </button>
          )}
          {!detail.cancelled && detail.repeatGroupId && (
            <button
              type="button"
              disabled={!detail.cancellable}
              onClick={onCancelGroup}
              className="rounded-[9px] border px-5 py-[11px] text-sm font-semibold whitespace-nowrap"
              style={
                detail.cancellable ? { borderColor: '#DDE3EC', color: '#4A5A6D', cursor: 'pointer' } : { borderColor: '#EEF2F7', color: '#C7CFDA' }
              }
            >
              반복 전체 취소
            </button>
          )}
          <div className="flex-1" />
          <button type="button" onClick={onClose} className="cursor-pointer px-[18px] py-[11px] text-sm font-semibold text-[#9AA6B5]">
            닫기
          </button>
        </div>
      </div>
    </Modal>
  );
}
