export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'bcsd-internal-theme';
const THEME_CHANGED = 'bcsd-theme-changed';

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  }
}

/** 모든 토글과 다른 탭이 같은 사용자 설정을 구독한다. */
export function subscribeTheme(listener: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    document.documentElement.dataset.theme = getStoredTheme();
    listener();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(THEME_CHANGED, listener);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(THEME_CHANGED, listener);
  };
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* 저장소가 차단돼도 현재 탭에는 적용한다. */
  }
  window.dispatchEvent(new Event(THEME_CHANGED));
}
