import type { NawyDoDb } from './schema';

export const TOMBSTONE_TTL_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * The only place a record is really removed: tombstones older than the TTL. Until then a delete
 * must survive a merge with an older copy from a backup (D-006).
 */
export async function purgeTombstones(db: NawyDoDb, now: number): Promise<number> {
  const cutoff = now - TOMBSTONE_TTL_MS;
  const expired = (await db.tasks.toArray())
    .filter((t) => t.deletedAt !== undefined && t.deletedAt < cutoff)
    .map((t) => t.id);
  await db.tasks.bulkDelete(expired);
  return expired.length;
}
