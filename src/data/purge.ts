import { isTrashed, tombstoneTask, TRASH_TTL_MS } from '@/core/model';
import type { NawyDoDb } from './schema';

export const TOMBSTONE_TTL_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * Compacts trashed tasks older than the trash period to content-less tombstones (the content goes,
 * the delete stays so an old backup cannot bring the task back).
 */
export async function compactTrash(db: NawyDoDb, now: number): Promise<number> {
  const cutoff = now - TRASH_TTL_MS;
  const old = (await db.tasks.toArray()).filter((t) => isTrashed(t) && (t.deletedAt ?? 0) < cutoff);
  await db.tasks.bulkPut(old.map((t) => tombstoneTask(t, now)));
  return old.length;
}

/**
 * The only place a record is really removed: tombstones (tasks and lists) older than the TTL.
 * Until then a delete must survive a merge with an older copy from a backup (D-006). Trashed
 * tasks past the trash period are compacted first.
 */
export async function purgeTombstones(db: NawyDoDb, now: number): Promise<number> {
  await compactTrash(db, now);
  const cutoff = now - TOMBSTONE_TTL_MS;
  const expired = <T extends { id: string; deletedAt?: number }>(records: T[]): string[] =>
    records.filter((r) => r.deletedAt !== undefined && r.deletedAt < cutoff).map((r) => r.id);
  const tasks = expired(await db.tasks.toArray());
  const lists = expired(await db.lists.toArray());
  await db.tasks.bulkDelete(tasks);
  await db.lists.bulkDelete(lists);
  return tasks.length + lists.length;
}
