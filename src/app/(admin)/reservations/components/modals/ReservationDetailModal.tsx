'use client';

import type { ReservationDetailView } from '@/app/(admin)/reservations/reservation-adapter';
import { formatMinutes } from '@/app/(admin)/reservations/time-utils';
import { ModalShell } from '@/app/(admin)/reservations/components/modal-shell';

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
    <ModalShell onClose={onClose} maxWidth={472}>
      <div className="p-[26px] pb-6">
        <div className="flex items-center gap-2.5">
          <span className="text-text text-lg font-bold tracking-[-0.3px]">예약 상세</span>
          <span
            className="rounded-full px-[10px] py-[3px] text-[11.5px] font-bold text-white"
            style={{ background: detail.cancelled ? 'var(--faint)' : '#b611f5' }}
          >
            {detail.cancelled ? '취소됨' : '확정'}
          </span>
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            className="text-faint flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-sm"
          >
            ✕
          </button>
        </div>

        <div className="bg-line mt-[18px] flex flex-col gap-px overflow-hidden rounded-[11px]">
          {rows.map((row) => (
            <div key={row.k} className="bg-panel flex gap-4 px-3.5 py-[11px]">
              <span className="text-faint w-[62px] flex-none text-xs font-semibold">{row.k}</span>
              <span className="text-text text-[13.5px]">{row.v}</span>
            </div>
          ))}
        </div>

        {detail.occurrences.length > 0 && (
          <div className="border-line mt-3 max-h-[140px] overflow-y-auto rounded-[10px] border">
            {detail.occurrences.map((occurrence) => (
              <div
                key={occurrence.id}
                className="border-line flex items-center justify-between border-b px-3.5 py-2 text-[12.5px] last:border-b-0"
                style={{ background: occurrence.isCurrent ? 'rgba(182,17,245,.06)' : 'var(--panel)' }}
              >
                <span style={{ color: occurrence.isCurrent ? '#b611f5' : 'var(--text)', fontWeight: occurrence.isCurrent ? 700 : 500 }}>
                  {occurrence.dateLabel}
                  {occurrence.isCurrent ? ' (이 예약)' : ''}
                </span>
                <span style={{ color: occurrence.cancelled ? 'var(--faint)' : 'var(--muted)' }}>{occurrence.cancelled ? '취소됨' : '확정'}</span>
              </div>
            ))}
          </div>
        )}

        {errorMessage && (
          <div className="border-danger bg-danger-soft text-danger mt-4 rounded-r-lg border-l-[3px] px-[15px] py-[13px] text-[12.5px] leading-[1.5]">
            {errorMessage}
          </div>
        )}

        {!detail.cancelled && (
          <div className="border-danger bg-danger-soft text-text mt-4 rounded-r-lg border-l-[3px] px-[15px] py-[13px] text-[12.5px] leading-[1.5]">
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
                  ? { background: 'var(--danger)', color: 'var(--on-primary)', cursor: 'pointer' }
                  : { background: 'var(--sunken)', color: 'var(--faint)' }
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
                detail.cancellable ? { borderColor: 'var(--line)', color: 'var(--text)', cursor: 'pointer' } : { borderColor: 'var(--line)', color: 'var(--faint)' }
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
                detail.cancellable ? { borderColor: 'var(--line)', color: 'var(--text)', cursor: 'pointer' } : { borderColor: 'var(--line)', color: 'var(--faint)' }
              }
            >
              반복 전체 취소
            </button>
          )}
          <div className="flex-1" />
          <button type="button" onClick={onClose} className="text-faint cursor-pointer px-[18px] py-[11px] text-sm font-semibold">
            닫기
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
