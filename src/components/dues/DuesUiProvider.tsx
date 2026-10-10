'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

/**
 * 장부·회비 화면 사이를 오가는 **UI 상태만** 둔다(페이지 이동 뒤 띄울 토스트).
 * 서버 데이터는 여기 두지 않는다 — 전부 react-query(@/api/dues, @/api/ledger)가 가진다.
 */

interface DuesUiValue {
  pendingDuesToast: { semesterId: string; message: string } | null;
  showDuesToastOn: (semesterId: string, message: string) => void;
  clearPendingDuesToast: () => void;
}

const DuesUiContext = createContext<DuesUiValue | null>(null);

export function DuesUiProvider({ children }: { children: ReactNode }) {
  const [pendingDuesToast, setPendingDuesToast] = useState<{ semesterId: string; message: string } | null>(null);

  const showDuesToastOn = useCallback(
    (semesterId: string, message: string) => setPendingDuesToast({ semesterId, message }),
    [],
  );
  const clearPendingDuesToast = useCallback(() => setPendingDuesToast(null), []);

  const value = useMemo<DuesUiValue>(
    () => ({ pendingDuesToast, showDuesToastOn, clearPendingDuesToast }),
    [pendingDuesToast, showDuesToastOn, clearPendingDuesToast],
  );

  return <DuesUiContext.Provider value={value}>{children}</DuesUiContext.Provider>;
}

export function useDuesUi() {
  const context = useContext(DuesUiContext);
  if (!context) throw new Error('useDuesUi must be used within DuesUiProvider');
  return context;
}
