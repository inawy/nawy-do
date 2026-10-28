import type { Task } from './types';

/** A new `sortOrder` for one task. */
export interface OrderChange {
  id: string;
  sortOrder: number;
}

/** Below this gap between two neighbours there is no room for a midpoint (see D-016). */
export const MIN_GAP = 0.01;
/** Spacing used when a list is renumbered. */
export const REBALANCE_STEP = 1000;

/**
 * The list is shown newest-first, i.e. by `sortOrder` descending, so the first item has the
 * largest value. `planMove` returns the smallest set of `sortOrder` changes that puts `id` at
 * `toIndex` of the displayed list (an index in the list WITH the task moved).
 *
 * Normally that is one change (the midpoint between its new neighbours). When the neighbours are
 * too close to split, the whole list is renumbered, so the result is always exact.
 * Pure: no clock, no storage.
 */
export function planMove(displayed: readonly Task[], id: string, toIndex: number): OrderChange[] {
  const from = displayed.findIndex((t) => t.id === id);
  if (from === -1) return [];
  const target = Math.min(Math.max(toIndex, 0), displayed.length - 1);
  if (target === from) return [];

  const moved = displayed[from] as Task;
  const rest = displayed.filter((t) => t.id !== id);
  const next = [...rest.slice(0, target), moved, ...rest.slice(target)];

  const above = next[target - 1]; // larger sortOrder
  const below = next[target + 1]; // smaller sortOrder
  let value: number;
  if (above && below) value = (above.sortOrder + below.sortOrder) / 2;
  else if (above) value = above.sortOrder - REBALANCE_STEP;
  else if (below) value = below.sortOrder + REBALANCE_STEP;
  else return [];

  const fits =
    (!above || value < above.sortOrder - MIN_GAP / 2) &&
    (!below || value > below.sortOrder + MIN_GAP / 2) &&
    (!above || !below || above.sortOrder - below.sortOrder >= MIN_GAP);
  if (fits) return [{ id, sortOrder: value }];
  return rebalance(next);
}

/** Renumber a displayed list from the top: largest value first, evenly spaced. */
export function rebalance(displayed: readonly Task[]): OrderChange[] {
  const top = Math.max(...displayed.map((t) => t.sortOrder));
  const changes: OrderChange[] = [];
  displayed.forEach((t, i) => {
    const sortOrder = top - i * REBALANCE_STEP;
    if (t.sortOrder !== sortOrder) changes.push({ id: t.id, sortOrder });
  });
  return changes;
}

/** Applies changes to a list (for tests and for optimistic display). */
export function applyOrder(tasks: readonly Task[], changes: readonly OrderChange[]): Task[] {
  const byId = new Map(changes.map((c) => [c.id, c.sortOrder]));
  return tasks.map((t) => (byId.has(t.id) ? { ...t, sortOrder: byId.get(t.id) as number } : t));
}
