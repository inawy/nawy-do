export type Theme = 'auto' | 'light' | 'dark' | 'black';
export const THEMES: readonly Theme[] = ['auto', 'light', 'dark', 'black'];
const KEY = 'nawy-do:theme';

/** The appearance chosen on this device; follow the system until the person picks one. */
export function loadTheme(): Theme {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' || v === 'black' ? v : 'auto';
  } catch {
    return 'auto';
  }
}

/** Applies and remembers a choice. index.html applies the saved one before the first paint. */
export function setTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === 'auto') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
  try {
    if (theme === 'auto') window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, theme);
  } catch {
    // Not remembered: the next visit follows the system again.
  }
}
