import type { NawyDoDb } from './schema';

export const TOMBSTONE_TTL_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * The only place a record is really removed: tombstones (tasks and lists) older than the TTL.
 * Until then a delete must survive a merge with an older copy from a backup (D-006).
 */
export async function purgeTombstones(db: NawyDoDb, now: number): Promise<number> {
  const cutoff = now - TOMBSTONE_TTL_MS;
  const expired = <T extends { id: string; deletedAt?: number }>(records: T[]): string[] =>
    records.filter((r) => r.deletedAt !== undefined && r.deletedAt < cutoff).map((r) => r.id);
  const tasks = expired(await db.tasks.toArray());
  const lists = expired(await db.lists.toArray());
  await db.tasks.bulkDelete(tasks);
  await db.lists.bulkDelete(lists);
  return tasks.length + lists.length;
}
