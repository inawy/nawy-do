import { DEFAULT_SORT, isSortMode, type SortMode } from '@/core/model';

// Small per-device preferences. Browser storage can be missing or throw (private mode), so every
// access is guarded and the app works without it.
const SORT_KEY = 'nawy-do:sort';

export function loadSort(): SortMode {
  try {
    const v = window.localStorage.getItem(SORT_KEY);
    return isSortMode(v) ? v : DEFAULT_SORT;
  } catch {
    return DEFAULT_SORT;
  }
}

export function saveSort(mode: SortMode): void {
  try {
    window.localStorage.setItem(SORT_KEY, mode);
  } catch {
    // Not saved: the choice still applies until the page closes.
  }
}

const EXPORT_KEY = 'nawy-do:last-export';

/** When a backup file was last taken on this device (`undefined`: never, or storage unavailable). */
export function loadLastExport(): number | undefined {
  try {
    const n = Number(window.localStorage.getItem(EXPORT_KEY));
    return Number.isFinite(n) && n > 0 ? n : undefined;
  } catch {
    return undefined;
  }
}

export function saveLastExport(at: number): void {
  try {
    window.localStorage.setItem(EXPORT_KEY, String(at));
  } catch {
    // Not saved: the reminder may come back sooner than needed, which is the safe side.
  }
}

const LANG_KEY = 'nawy-do:lang';

/** The interface language chosen on this device; Arabic until the person picks another. */
export function loadLang(): 'ar' | 'en' {
  try {
    const v = window.localStorage.getItem(LANG_KEY);
    return v === 'en' ? 'en' : 'ar';
  } catch {
    return 'ar';
  }
}

export function saveLang(lang: 'ar' | 'en'): void {
  try {
    window.localStorage.setItem(LANG_KEY, lang);
  } catch {
    // Not remembered: the next visit starts in Arabic.
  }
}
