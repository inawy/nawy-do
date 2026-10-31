import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTask, tombstoneTask } from '@/core/model';
import {
  addTask,
  allRecords,
  applyRecords,
  completeTaskById,
  completeTasksByIds,
  moveTasksToList,
  createDb,
  editTask,
  exportBackup,
  importBackup,
  listLists,
  listTasks,
  purgeTombstones,
  removeTask,
  restoreRemoved,
  saveOrder,
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
    expect(r).toEqual({
      ok: true,
      value: { total: 2, changed: 2, lists: 0, listsChanged: 0 },
    });
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

describe('undo of a delete', () => {
  it('restores the task and the restore wins over the tombstone in a merge', async () => {
    const t = await addTask(db, 'a', 'x', 100);
    const dead = await removeTask(db, 'a', 200);
    const back = await restoreRemoved(db, t, 210);
    expect(back?.deletedAt).toBeUndefined();
    expect((await listTasks(db)).map((x) => x.id)).toEqual(['a']);
    if (dead) expect(await applyRecords(db, [dead])).toBe(0);
    expect(await listTasks(db)).toHaveLength(1);
  });
  it('does nothing when the task is not deleted', async () => {
    const t = await addTask(db, 'a', 'x', 100);
    expect(await restoreRemoved(db, t, 200)).toBeUndefined();
  });
});

describe('saveOrder', () => {
  it('writes new sortOrder values, bumps updatedAt, and skips missing or deleted tasks', async () => {
    await addTask(db, 'a', 'a', 100);
    await addTask(db, 'b', 'b', 200);
    await removeTask(db, 'b', 300);
    const written = await saveOrder(
      db,
      [
        { id: 'a', sortOrder: 5 },
        { id: 'b', sortOrder: 6 },
        { id: 'nope', sortOrder: 7 },
      ],
      400,
    );
    expect(written).toBe(1);
    const records = await allRecords(db);
    expect(records.find((t) => t.id === 'a')).toMatchObject({ sortOrder: 5, updatedAt: 400 });
    expect(records.find((t) => t.id === 'b')?.deletedAt).toBe(300);
  });
});

describe('selections', () => {
  it('moves picked tasks to a list and back to main, skipping deleted and unknown ones', async () => {
    await addTask(db, 'a', 'أ', 1);
    await addTask(db, 'b', 'ب', 2);
    await addTask(db, 'c', 'ج', 3);
    await removeTask(db, 'c', 4);
    expect(await moveTasksToList(db, ['a', 'b', 'c', 'zzz', 'a'], 'L1', 10)).toBe(2);
    expect((await listTasks(db)).map((t) => t.listId)).toEqual(['L1', 'L1']);
    expect(await moveTasksToList(db, ['a'], undefined, 20)).toBe(1);
    const a = (await listTasks(db)).find((t) => t.id === 'a');
    expect(a?.listId).toBeUndefined();
    expect(a?.updatedAt).toBeGreaterThanOrEqual(20);
  });

  it('completes only open picked tasks', async () => {
    await addTask(db, 'a', 'أ', 1);
    await addTask(db, 'b', 'ب', 2);
    await completeTaskById(db, 'b', 3);
    expect(await completeTasksByIds(db, ['a', 'b'], 10)).toBe(1);
    expect((await listTasks(db)).every((t) => t.status === 'done')).toBe(true);
  });
});

describe('import safety', () => {
  const file = (tasks: unknown[], lists: unknown[]) =>
    JSON.stringify({ app: 'nawy-do', schemaVersion: 2, exportedAt: 1, tasks, lists });

  it('is all-or-nothing: a failure while writing tasks leaves no lists behind', async () => {
    const list = { id: 'L', name: 'ق', sortOrder: 1, createdAt: 1, updatedAt: 1 };
    const task = { ...createTask('a', 'x', 1), listId: 'L' };
    const put = vi.spyOn(db.tasks, 'put').mockRejectedValueOnce(new Error('disk full'));
    await expect(importBackup(db, file([task], [list]))).rejects.toThrow();
    put.mockRestore();
    expect(await listLists(db)).toEqual([]);
    expect(await listTasks(db)).toEqual([]);
  });

  it('a record dated in the far future cannot freeze itself: later edits still win', async () => {
    const NOW = 1_700_000_000_000;
    const far = { ...createTask('a', 'من ملف', 1), updatedAt: 4_102_444_800_000 };
    await importBackup(db, file([far], []), { now: NOW });
    const edited = await editTask(db, 'a', { title: 'عدّلتها' }, NOW + 1000);
    expect(edited?.title).toBe('عدّلتها');
    expect((await listTasks(db))[0]?.updatedAt).toBeLessThan(NOW + 2 * 86_400_000);
  });
});
