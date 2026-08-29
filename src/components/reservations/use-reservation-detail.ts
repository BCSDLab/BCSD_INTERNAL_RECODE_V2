'use client';

import { useEffect, useState } from 'react';
import { toDetailView } from '@/components/reservations/reservation-adapter';
import { ApiError } from '@/lib/api/client';
import { getReservationDetail } from '@/lib/api/reservations';
import type { ReservationDetailResponse } from '@/lib/api/types';

export function useReservationDetail(detailId: number | null) {
  const [detail, setDetail] = useState<ReservationDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      if (detailId == null) {
        setDetail(null);
        return;
      }
      setError(null);
      getReservationDetail(detailId)
        .then((response) => {
          if (!cancelled) setDetail(response);
        })
        .catch((err) => {
          if (!cancelled) setError(err instanceof ApiError ? err.message : '예약 상세를 불러오지 못했습니다.');
        });
    });
    return () => {
      cancelled = true;
    };
  }, [detailId]);

  const detailView = detail ? toDetailView(detail, new Date()) : null;

  return { detailView, error, setError };
}
