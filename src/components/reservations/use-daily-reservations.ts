'use client';

import { useCallback, useEffect, useState } from 'react';
import { toUiReservationFromDaily } from '@/components/reservations/reservation-adapter';
import { toDateKey } from '@/components/reservations/time-utils';
import { ApiError } from '@/lib/api/client';
import { getDailyReservations } from '@/lib/api/reservations';
import type { DailyReservationItemDto } from '@/lib/api/types';

export function useDailyReservations(selectedDate: Date) {
  const selectedKey = toDateKey(selectedDate);
  const [items, setItems] = useState<DailyReservationItemDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getDailyReservations(selectedKey);
      setItems(response.reservations);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '예약 현황을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [selectedKey]);

  useEffect(() => {
    Promise.resolve().then(() => {
      refresh();
    });
  }, [refresh]);

  const dayReservations = items.map((item) => toUiReservationFromDaily(item, selectedKey));

  return { dayReservations, loading, error, refresh };
}
