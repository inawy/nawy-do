import { parseLaunch, type Launch } from '@/core/model';

let cached: Launch | undefined;

/**
 * Reads the launch parameters once and removes them from the address bar, so a reload or a
 * restored tab never repeats a share. Safe to call twice (React StrictMode).
 */
export function takeLaunch(): Launch {
  if (!cached) {
    cached = parseLaunch(window.location.search);
    if (window.location.search !== '') {
      window.history.replaceState(window.history.state, '', window.location.pathname);
    }
  }
  return cached;
}
