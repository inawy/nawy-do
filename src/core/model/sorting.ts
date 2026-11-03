import type { Task } from './types';

/** How open tasks are ordered in the main list, a list and favourites. */
export type SortMode = 'manual' | 'date' | 'title';
export const SORT_MODES: readonly SortMode[] = ['manual', 'date', 'title'];
export const DEFAULT_SORT: SortMode = 'manual';

export const SORT_LABEL: Record<SortMode, string> = {
  manual: 'ترتيب يدوي',
  date: 'ترتيب بالتاريخ',
  title: 'ترتيب أبجدي',
};

export const isSortMode = (v: unknown): v is SortMode => SORT_MODES.some((m) => m === v);

/**
 * Re-orders already-ordered open tasks. `manual` keeps the order given (the user's own, newest
 * first). Ties keep that order too, so a sort is stable and never shuffles equal items.
 */
export function sortOpen(tasks: readonly Task[], mode: SortMode): Task[] {
  if (mode === 'manual') return [...tasks];
  const index = new Map(tasks.map((t, i) => [t.id, i]));
  const rank = (t: Task): number => index.get(t.id) ?? 0;
  const byDate = (a: Task, b: Task): number =>
    a.due === b.due
      ? (a.dueTime ?? '').localeCompare(b.dueTime ?? '') // all-day before timed, same day
      : a.due === undefined
        ? 1
        : b.due === undefined
          ? -1
          : a.due < b.due
            ? -1
            : 1;
  const compare =
    mode === 'date'
      ? byDate
      : (a: Task, b: Task): number => a.title.localeCompare(b.title, 'ar', { sensitivity: 'base' });
  return [...tasks].sort((a, b) => compare(a, b) || rank(a) - rank(b));
}
