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
  /** Why it was taken; copies from before this field existed are `upgrade`. */
  kind?: SnapshotKind;
}

export type SnapshotKind = 'upgrade' | 'daily';
export const KEEP_DAILY = 7;
export const snapshotKind = (s: Snapshot): SnapshotKind => s.kind ?? 'upgrade';

function snapshotDb(name: string) {
  const db = new Dexie(name) as Dexie & { snapshots: Dexie.Table<Snapshot, number> };
  db.version(1).stores({ snapshots: '++id, createdAt' });
  return db;
}

/** Stores a copy and keeps only the newest few of its own kind (daily copies never push out upgrade ones). */
export async function addSnapshot(snapshotName: string, entry: Snapshot): Promise<void> {
  const store = snapshotDb(snapshotName);
  try {
    await store.snapshots.add(entry);
    const kind = snapshotKind(entry);
    const keep = kind === 'daily' ? KEEP_DAILY : KEEP_SNAPSHOTS;
    const same = (await store.snapshots.orderBy('createdAt').toArray()).filter(
      (s) => snapshotKind(s) === kind,
    );
    const extra = same.slice(0, Math.max(0, same.length - keep));
    await store.snapshots.bulkDelete(extra.map((s) => s.id as number));
  } finally {
    store.close();
  }
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

    const json = JSON.stringify({
      ...tables,
      app: 'nawy-do',
      schemaVersion: fromVersion,
      exportedAt: now,
    });
    await addSnapshot(snapshotName, { createdAt: now, fromVersion, json, kind: 'upgrade' });
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
