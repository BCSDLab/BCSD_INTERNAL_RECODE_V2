export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'bcsd-internal-theme';

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'light';
  }
  return window.localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
  window.localStorage.setItem(STORAGE_KEY, theme);
}
