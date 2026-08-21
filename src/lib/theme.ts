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

// 하이드레이션 전에 실행되어 라이트→다크 전환 시 깜빡임(FOUC)을 막는다.
export const THEME_BOOT_SCRIPT = `
try {
  var theme = window.localStorage.getItem("${STORAGE_KEY}") === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", theme);
} catch (e) {}
`;
