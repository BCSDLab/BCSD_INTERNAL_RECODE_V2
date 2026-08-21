'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * 텍스트 입력 필드 자동 저장용. 입력이 멈춘 뒤 delayMs가 지나면 mutationFn을 호출한다.
 * blur 시점에 즉시 저장하고 싶으면 반환된 flush를 호출한다.
 */
export function useDebouncedSave<T>(mutationFn: (value: T) => void, delayMs = 700) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingValueRef = useRef<T | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const save = useCallback(
    (value: T) => {
      pendingValueRef.current = value;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        mutationFn(value);
        pendingValueRef.current = null;
      }, delayMs);
    },
    [mutationFn, delayMs],
  );

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (pendingValueRef.current !== null) {
      mutationFn(pendingValueRef.current);
      pendingValueRef.current = null;
    }
  }, [mutationFn]);

  return { save, flush };
}
