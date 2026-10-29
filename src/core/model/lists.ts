import { MAX_LIST_NAME, type Task, type TaskList } from './types';
import { nextUpdatedAt } from './task';

export const cleanListName = (name: string): string => name.trim().slice(0, MAX_LIST_NAME);

export function createList(id: string, name: string, now: number): TaskList {
  return { id, name: cleanListName(name), sortOrder: now, createdAt: now, updatedAt: now };
}

/** An empty name is ignored (the old one stays). */
export function renameList(list: TaskList, name: string, now: number): TaskList {
  const clean = cleanListName(name);
  return {
    ...list,
    name: clean === '' ? list.name : clean,
    updatedAt: nextUpdatedAt(list.updatedAt, now),
  };
}

/** Deleting a list keeps no content; its tasks simply show in the main list (see `listOf`). */
export function tombstoneList(list: TaskList, now: number): TaskList {
  const t = nextUpdatedAt(list.updatedAt, now);
  return {
    id: list.id,
    name: '',
    sortOrder: list.sortOrder,
    createdAt: list.createdAt,
    updatedAt: t,
    deletedAt: t,
  };
}

/** Undo of a list delete: the previous record again, newer than the tombstone. */
export function restoreList(previous: TaskList, current: TaskList, now: number): TaskList {
  const next: TaskList = { ...previous, updatedAt: nextUpdatedAt(current.updatedAt, now) };
  delete next.deletedAt;
  return next;
}

/** Live lists in display order (oldest first). */
export function liveLists(lists: readonly TaskList[]): TaskList[] {
  return lists
    .filter((l) => l.deletedAt === undefined)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
}

/**
 * The list a task really belongs to: its `listId` if that list is alive, otherwise `undefined`
 * (the main list). This is what keeps tasks visible when their list was deleted, here or on
 * another device, and brings them back if the delete is undone.
 */
export function listOf(task: Task, lists: readonly TaskList[]): string | undefined {
  if (task.listId === undefined) return undefined;
  return lists.some((l) => l.id === task.listId && l.deletedAt === undefined)
    ? task.listId
    : undefined;
}

/** A new `sortOrder` for one list. */
export interface ListOrderChange {
  id: string;
  sortOrder: number;
}

/**
 * Moves a list one place earlier (`-1`) or later (`+1`) in the display order by swapping its
 * `sortOrder` with its neighbour's, so only two records change. When the two values are equal (a
 * tie broken by id) the whole list is renumbered instead, so the result is always exact.
 * `lists` is the live lists in display order. Pure.
 */
export function planListMove(
  lists: readonly TaskList[],
  id: string,
  delta: -1 | 1,
): ListOrderChange[] {
  const from = lists.findIndex((l) => l.id === id);
  const other = lists[from + delta];
  const me = lists[from];
  if (from === -1 || !other || !me) return [];
  if (me.sortOrder !== other.sortOrder) {
    return [
      { id: me.id, sortOrder: other.sortOrder },
      { id: other.id, sortOrder: me.sortOrder },
    ];
  }
  const next = [...lists];
  next[from] = other;
  next[from + delta] = me;
  return next.map((l, i) => ({ id: l.id, sortOrder: (i + 1) * 1000 }));
}
