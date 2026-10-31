import Dexie from 'dexie';
import { DB_VERSION } from './schema';

// A safety copy taken once, just before the first open of a database with an older schema than
// this build declares (D-017). The v1 -> v2 upgrade only adds a store and an index, so nothing is
// rewritten; the copy is for the day an upgrade does rewrite data. Best effort: it never blocks
// or breaks the upgrade itself.

export const SNAPSHOT_DB_NAME = 'nawy-do-snapshots';
export const KEEP_SNAPSHOTS = 3;

export interface Snapshot {
  id?: number;
  createdAt: number;
  fromVersion: number;
  /** A backup file in the format of that version, restorable with `importBackup`. */
  json: string;
}

function snapshotDb(name: string) {
  const db = new Dexie(name) as Dexie & { snapshots: Dexie.Table<Snapshot, number> };
  db.version(1).stores({ snapshots: '++id, createdAt' });
  return db;
}

export type SnapshotOutcome = 'none' | 'saved' | 'failed';

export async function snapshotBeforeUpgrade(
  name: string,
  now: number,
  snapshotName: string = SNAPSHOT_DB_NAME,
): Promise<SnapshotOutcome> {
  try {
    if (!(await Dexie.exists(name))) return 'none';
    const old = new Dexie(name); // no schema declared: opens whatever is there, never upgrades
    await old.open();
    const fromVersion = old.verno;
    if (fromVersion >= DB_VERSION) {
      old.close();
      return 'none';
    }
    // Every table, by name, so a future schema that adds one is never silently left out.
    const tables: Record<string, unknown[]> = {};
    for (const table of old.tables) tables[table.name] = await table.toArray();
    old.close();

    const store = snapshotDb(snapshotName);
    const json = JSON.stringify({
      ...tables,
      app: 'nawy-do',
      schemaVersion: fromVersion,
      exportedAt: now,
    });
    await store.snapshots.add({ createdAt: now, fromVersion, json });
    const all = await store.snapshots.orderBy('createdAt').toArray();
    const extra = all.slice(0, Math.max(0, all.length - KEEP_SNAPSHOTS));
    await store.snapshots.bulkDelete(extra.map((s) => s.id as number));
    store.close();
    return 'saved';
  } catch {
    return 'failed';
  }
}

export async function listSnapshots(snapshotName: string = SNAPSHOT_DB_NAME): Promise<Snapshot[]> {
  const store = snapshotDb(snapshotName);
  try {
    return await store.snapshots.orderBy('createdAt').reverse().toArray();
  } finally {
    store.close();
  }
}
