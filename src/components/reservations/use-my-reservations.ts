'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/lib/api/client';
import { getMyReservations } from '@/lib/api/reservations';
import type { MyReservationItemDto } from '@/lib/api/types';

export function useMyReservations(loggedIn: boolean) {
  const [upcomingItems, setUpcomingItems] = useState<MyReservationItemDto[]>([]);
  const [pastItems, setPastItems] = useState<MyReservationItemDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!loggedIn) {
      setUpcomingItems([]);
      setPastItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [upcoming, past] = await Promise.all([getMyReservations('upcoming'), getMyReservations('past')]);
      setUpcomingItems(upcoming.reservations);
      setPastItems(past.reservations);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '내 예약을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [loggedIn]);

  useEffect(() => {
    Promise.resolve().then(() => {
      refresh();
    });
  }, [refresh]);

  return { upcomingItems, pastItems, loading, error, refresh };
}
