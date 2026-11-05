import { exportBackup } from './backup';
import { DB_VERSION, type NawyDoDb } from './schema';
import { addSnapshot, listSnapshots, SNAPSHOT_DB_NAME, snapshotKind } from './snapshot';

const DAY_MS = 86_400_000;

/** The file without the moment it was written, so two copies of the same data compare equal. */
const withoutStamp = (json: string): string => {
  const parsed = JSON.parse(json) as Record<string, unknown>;
  delete parsed['exportedAt'];
  return JSON.stringify(parsed);
};

export type AutoSnapshotOutcome = 'saved' | 'skipped' | 'failed';

/**
 * A rolling local copy: at most one a day, only when there is data and it changed since the last
 * one, the newest seven kept. Protects against a bad import or a bug, not against the browser
 * clearing the whole site (the copies live in the same origin): that is what backup files are for.
 * Best effort; it never throws.
 */
export async function snapshotDaily(
  db: NawyDoDb,
  now: number,
  snapshotName: string = SNAPSHOT_DB_NAME,
): Promise<AutoSnapshotOutcome> {
  try {
    const last = (await listSnapshots(snapshotName)).find((s) => snapshotKind(s) === 'daily');
    if (last && now - last.createdAt < DAY_MS) return 'skipped';
    const json = await exportBackup(db, now);
    const parsed = JSON.parse(json) as { tasks?: unknown[]; lists?: unknown[] };
    if (!parsed.tasks?.length && !parsed.lists?.length) return 'skipped';
    if (last && withoutStamp(last.json) === withoutStamp(json)) return 'skipped';
    await addSnapshot(snapshotName, {
      createdAt: now,
      fromVersion: DB_VERSION,
      json,
      kind: 'daily',
    });
    return 'saved';
  } catch {
    return 'failed';
  }
}
