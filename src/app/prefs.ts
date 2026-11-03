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
