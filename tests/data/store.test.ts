import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { createTask, tombstoneTask } from '@/core/model';
import {
  addTask,
  allRecords,
  applyRecords,
  completeTaskById,
  createDb,
  editTask,
  exportBackup,
  importBackup,
  listTasks,
  purgeTombstones,
  removeTask,
  reopenTaskById,
  TOMBSTONE_TTL_MS,
  type NawyDoDb,
} from '@/data';

let db: NawyDoDb;
let n = 0;
beforeEach(() => {
  db = createDb(`test-${n++}`);
});

describe('store', () => {
  it('adds, lists in order, completes and reopens', async () => {
    await addTask(db, 'a', 'one', 100);
    await addTask(db, 'b', 'two', 200);
    expect((await listTasks(db)).map((t) => t.id)).toEqual(['a', 'b']);
    expect((await completeTaskById(db, 'a', 300))?.status).toBe('done');
    expect((await reopenTaskById(db, 'a', 400))?.status).toBe('open');
  });

  it('edits a task', async () => {
    await addTask(db, 'a', 'one', 100);
    await editTask(db, 'a', { title: 'uno', due: '2026-11-01' }, 200);
    expect((await listTasks(db))[0]).toMatchObject({ title: 'uno', due: '2026-11-01' });
  });

  it('delete writes a tombstone: hidden from the list, kept as a record without content', async () => {
    await addTask(db, 'a', 'سر', 100);
    await removeTask(db, 'a', 200);
    expect(await listTasks(db)).toEqual([]);
    const [rec] = await allRecords(db);
    expect(rec).toMatchObject({ id: 'a', title: '', deletedAt: 200 });
  });

  it('operations on a missing or deleted task do nothing', async () => {
    expect(await editTask(db, 'nope', { title: 'x' }, 1)).toBeUndefined();
    await addTask(db, 'a', 'x', 100);
    await removeTask(db, 'a', 200);
    expect(await editTask(db, 'a', { title: 'back' }, 300)).toBeUndefined();
    expect((await allRecords(db))[0]?.title).toBe('');
  });

  it('merging an older copy never resurrects a deleted task', async () => {
    const t = await addTask(db, 'a', 'x', 100);
    await removeTask(db, 'a', 200);
    expect(await applyRecords(db, [t])).toBe(0);
    expect(await listTasks(db)).toEqual([]);
  });

  it('merging a newer copy updates the record', async () => {
    const t = await addTask(db, 'a', 'x', 100);
    expect(await applyRecords(db, [{ ...t, title: 'y', updatedAt: 500 }])).toBe(1);
    expect((await listTasks(db))[0]?.title).toBe('y');
  });
});

describe('purge', () => {
  it('removes only tombstones older than the TTL', async () => {
    await addTask(db, 'live', 'x', 1);
    const old = tombstoneTask(createTask('old', 'x', 1), 10);
    const fresh = tombstoneTask(createTask('fresh', 'x', 1), TOMBSTONE_TTL_MS);
    await db.tasks.bulkPut([old, fresh]);
    const now = TOMBSTONE_TTL_MS + 20;
    expect(await purgeTombstones(db, now)).toBe(1);
    expect((await allRecords(db)).map((t) => t.id).sort()).toEqual(['fresh', 'live']);
  });
});

describe('backup', () => {
  it('exports and imports into a fresh database, tombstones included', async () => {
    await addTask(db, 'a', 'one', 100);
    await addTask(db, 'b', 'two', 100);
    await removeTask(db, 'b', 200);
    const file = await exportBackup(db, 999);

    const other = createDb(`test-${n++}`);
    const r = await importBackup(other, file);
    expect(r).toEqual({ ok: true, value: { total: 2, changed: 2 } });
    expect((await listTasks(other)).map((t) => t.id)).toEqual(['a']);
    expect((await allRecords(other)).find((t) => t.id === 'b')?.deletedAt).toBe(200);
  });

  it('a bad file changes nothing', async () => {
    await addTask(db, 'a', 'one', 100);
    const r = await importBackup(db, '{"app":"nawy-do","schemaVersion":99,"tasks":[]}');
    expect(!r.ok && r.error.code).toBe('newer-version');
    expect(await listTasks(db)).toHaveLength(1);
  });

  it('importing twice is idempotent', async () => {
    await addTask(db, 'a', 'one', 100);
    const file = await exportBackup(db, 1);
    const r = await importBackup(db, file);
    expect(r.ok && r.value.changed).toBe(0);
  });
});
