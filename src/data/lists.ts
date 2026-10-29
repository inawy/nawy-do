import {
  cleanListName,
  createList,
  liveLists,
  MAX_LISTS,
  mergeRecord,
  nextUpdatedAt,
  type ListOrderChange,
  renameList,
  restoreList,
  tombstoneList,
  type TaskList,
} from '@/core/model';
import type { NawyDoDb } from './schema';

/** Live lists in display order. */
export async function listLists(db: NawyDoDb): Promise<TaskList[]> {
  return liveLists(await db.lists.toArray());
}

/** Every list record including tombstones (export, sync). */
export const allLists = (db: NawyDoDb): Promise<TaskList[]> => db.lists.toArray();

export type AddListResult = { ok: true; list: TaskList } | { ok: false; reason: 'empty' | 'limit' };

export async function addList(
  db: NawyDoDb,
  id: string,
  name: string,
  now: number,
): Promise<AddListResult> {
  if (cleanListName(name) === '') return { ok: false, reason: 'empty' };
  return db.transaction('rw', db.lists, async (): Promise<AddListResult> => {
    const live = liveLists(await db.lists.toArray());
    if (live.length >= MAX_LISTS) return { ok: false, reason: 'limit' };
    // Strictly after every existing list so the new one is last, even within one millisecond.
    const last = live.at(-1)?.sortOrder ?? 0;
    const list = createList(id, name, Math.max(now, last + 1));
    await db.lists.add(list);
    return { ok: true, list };
  });
}

async function changeList(
  db: NawyDoDb,
  id: string,
  fn: (list: TaskList) => TaskList,
): Promise<TaskList | undefined> {
  return db.transaction('rw', db.lists, async () => {
    const current = await db.lists.get(id);
    if (!current || current.deletedAt !== undefined) return undefined;
    const next = fn(current);
    await db.lists.put(next);
    return next;
  });
}

export const renameListById = (db: NawyDoDb, id: string, name: string, now: number) =>
  changeList(db, id, (l) => renameList(l, name, now));

/** Writes a tombstone. The list's tasks are untouched: they show in the main list (D-017). */
export const removeList = (db: NawyDoDb, id: string, now: number) =>
  changeList(db, id, (l) => tombstoneList(l, now));

/** Undo of a list delete; its tasks come back to it by themselves. */
export async function restoreRemovedList(
  db: NawyDoDb,
  previous: TaskList,
  now: number,
): Promise<TaskList | undefined> {
  return db.transaction('rw', db.lists, async () => {
    const current = await db.lists.get(previous.id);
    if (!current || current.deletedAt === undefined) return undefined;
    const next = restoreList(previous, current, now);
    await db.lists.put(next);
    return next;
  });
}

/** Merge incoming list records with the record-level rule (D-006). */
export async function applyLists(db: NawyDoDb, incoming: readonly TaskList[]): Promise<number> {
  return db.transaction('rw', db.lists, async () => {
    let changed = 0;
    for (const record of incoming) {
      const existing = await db.lists.get(record.id);
      const winner = existing ? mergeRecord(existing, record) : record;
      if (winner !== existing) {
        await db.lists.put(winner);
        changed++;
      }
    }
    return changed;
  });
}

/** Writes new `sortOrder`s for live lists (one transaction). Returns how many were written. */
export async function saveListOrder(
  db: NawyDoDb,
  changes: readonly ListOrderChange[],
  now: number,
): Promise<number> {
  return db.transaction('rw', db.lists, async () => {
    let written = 0;
    for (const change of changes) {
      const current = await db.lists.get(change.id);
      if (!current || current.deletedAt !== undefined) continue;
      await db.lists.put({
        ...current,
        sortOrder: change.sortOrder,
        updatedAt: nextUpdatedAt(current.updatedAt, now),
      });
      written++;
    }
    return written;
  });
}
