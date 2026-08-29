'use client';

import { useCallback, useEffect, useState } from 'react';
import { toOccupancyRatioMap } from '@/components/reservations/reservation-adapter';
import { toMonthKey } from '@/components/reservations/time-utils';
import { getMonthlyOccupancy, getMyMonthlyOccupancy } from '@/lib/api/reservations';

export function useMonthlyOccupancy(viewMonth: Date, loggedIn: boolean) {
  const [statusRatio, setStatusRatio] = useState<Map<string, number>>(new Map());
  const [mineRatio, setMineRatio] = useState<Map<string, number>>(new Map());

  const refresh = useCallback(async () => {
    const monthKey = toMonthKey(viewMonth);
    try {
      setStatusRatio(toOccupancyRatioMap(await getMonthlyOccupancy(monthKey)));
    } catch {
      // 캘린더 막대는 부가 정보라 실패해도 화면을 막지 않는다.
    }
    if (!loggedIn) {
      setMineRatio(new Map());
      return;
    }
    try {
      setMineRatio(toOccupancyRatioMap(await getMyMonthlyOccupancy(monthKey)));
    } catch {
      // 위와 동일
    }
  }, [viewMonth, loggedIn]);

  useEffect(() => {
    Promise.resolve().then(() => {
      refresh();
    });
  }, [refresh]);

  return { statusRatio, mineRatio, refresh };
}
