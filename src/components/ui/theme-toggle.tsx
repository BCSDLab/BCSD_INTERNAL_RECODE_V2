'use client';

import { useState } from 'react';
import { applyTheme, getStoredTheme, type Theme } from '@/lib/theme';
import { Button } from './button';

/**
 * 시안과 동일한 outline 버튼에 라벨만 넣는다(라이트일 때 "다크", 다크일 때 "라이트").
 * 서버는 항상 light로 렌더하므로(localStorage 접근 불가) 첫 클라이언트 렌더에서 라벨이
 * 바뀔 수 있어 hydration 경고를 억제한다 — 실제 색은 <head> 부트 스크립트가 이미 맞춰 뒀다.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme());

  function toggle() {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    applyTheme(next);
  }

  return (
    <Button onClick={toggle} suppressHydrationWarning>
      {theme === 'light' ? '다크' : '라이트'}
    </Button>
  );
}
