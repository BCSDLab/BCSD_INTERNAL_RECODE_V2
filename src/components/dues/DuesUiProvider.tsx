'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

/**
 * 장부·회비 화면 사이를 오가는 **UI 상태만** 둔다(환불 마법사 단계, 페이지 이동 뒤 띄울 토스트).
 * 서버 데이터는 여기 두지 않는다 — 전부 react-query(@/api/dues, @/api/ledger)가 가진다.
 */

export type RefundOrigin = 'dues' | 'exemptions';
export type RefundStage = 'check' | 'candidates' | 'no-candidates' | 'direct';

export interface RefundFlowState {
  memberId: string;
  semesterId: string;
  origin: RefundOrigin;
  stage: RefundStage;
}

interface DuesUiValue {
  refundFlow: RefundFlowState | null;
  startRefundFlow: (memberId: string, semesterId: string, origin: RefundOrigin) => void;
  setRefundStage: (stage: RefundStage) => void;
  cancelRefundFlow: () => void;
  pendingDuesToast: { semesterId: string; message: string } | null;
  showDuesToastOn: (semesterId: string, message: string) => void;
  clearPendingDuesToast: () => void;
}

const DuesUiContext = createContext<DuesUiValue | null>(null);

export function DuesUiProvider({ children }: { children: ReactNode }) {
  const [refundFlow, setRefundFlow] = useState<RefundFlowState | null>(null);
  const [pendingDuesToast, setPendingDuesToast] = useState<{ semesterId: string; message: string } | null>(null);

  const startRefundFlow = useCallback(
    (memberId: string, semesterId: string, origin: RefundOrigin) =>
      setRefundFlow({ memberId, semesterId, origin, stage: 'check' }),
    [],
  );
  const setRefundStage = useCallback(
    (stage: RefundStage) => setRefundFlow((current) => (current ? { ...current, stage } : null)),
    [],
  );
  const cancelRefundFlow = useCallback(() => setRefundFlow(null), []);
  const showDuesToastOn = useCallback(
    (semesterId: string, message: string) => setPendingDuesToast({ semesterId, message }),
    [],
  );
  const clearPendingDuesToast = useCallback(() => setPendingDuesToast(null), []);

  const value = useMemo<DuesUiValue>(
    () => ({
      refundFlow,
      startRefundFlow,
      setRefundStage,
      cancelRefundFlow,
      pendingDuesToast,
      showDuesToastOn,
      clearPendingDuesToast,
    }),
    [
      refundFlow,
      startRefundFlow,
      setRefundStage,
      cancelRefundFlow,
      pendingDuesToast,
      showDuesToastOn,
      clearPendingDuesToast,
    ],
  );

  return <DuesUiContext.Provider value={value}>{children}</DuesUiContext.Provider>;
}

export function useDuesUi() {
  const context = useContext(DuesUiContext);
  if (!context) throw new Error('useDuesUi must be used within DuesUiProvider');
  return context;
}
