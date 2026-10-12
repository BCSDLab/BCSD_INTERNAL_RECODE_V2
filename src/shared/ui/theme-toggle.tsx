import { useSyncExternalStore } from 'react';

import { applyTheme, getStoredTheme, subscribeTheme } from '@/shared/lib/theme';
import { Button } from '@/shared/ui/button';

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, getStoredTheme, () => 'light');
  return (
    <Button onClick={() => applyTheme(theme === 'light' ? 'dark' : 'light')}>
      {theme === 'light' ? '다크' : '라이트'}
    </Button>
  );
}
