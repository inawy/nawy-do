import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { TRASH_TTL_MS } from '@/core/model';
import {
  addTask,
  allRecords,
  createDb,
  deleteForever,
  listTasks,
  listTrash,
  purgeTombstones,
  removeTask,
  restoreFromTrash,
  type NawyDoDb,
} from '@/data';

let db: NawyDoDb;
let n = 0;
beforeEach(() => {
  db = createDb(`trash-${n++}`);
});

describe('trash', () => {
  it('a deleted task is listed in the trash with its content, newest first', async () => {
    await addTask(db, 'a', 'one', 100);
    await addTask(db, 'b', 'two', 100);
    await removeTask(db, 'a', 200);
    await removeTask(db, 'b', 300);
    expect(await listTasks(db)).toEqual([]);
    expect((await listTrash(db)).map((t) => t.title)).toEqual(['two', 'one']);
  });

  it('restores a task as it was, and only once', async () => {
    await addTask(db, 'a', 'one', 100);
    await removeTask(db, 'a', 200);
    expect(await restoreFromTrash(db, 'a', 300)).toMatchObject({ title: 'one' });
    expect((await listTasks(db)).map((t) => t.id)).toEqual(['a']);
    expect(await listTrash(db)).toEqual([]);
    expect(await restoreFromTrash(db, 'a', 400)).toBeUndefined();
  });

  it('delete forever keeps the tombstone but drops the content', async () => {
    await addTask(db, 'a', 'سر', 100);
    await removeTask(db, 'a', 200);
    expect(await deleteForever(db, ['a', 'nope'], 300)).toBe(1);
    expect(await listTrash(db)).toEqual([]);
    expect((await allRecords(db))[0]).toMatchObject({ id: 'a', title: '' });
    expect(await restoreFromTrash(db, 'a', 400)).toBeUndefined();
  });

  it('purge compacts trash older than the trash period, keeping its tombstone', async () => {
    await addTask(db, 'old', 'x', 1);
    await removeTask(db, 'old', 10);
    await addTask(db, 'fresh', 'y', 1);
    await removeTask(db, 'fresh', TRASH_TTL_MS);
    await purgeTombstones(db, TRASH_TTL_MS + 20);
    expect((await listTrash(db)).map((t) => t.id)).toEqual(['fresh']);
    expect((await allRecords(db)).map((t) => t.id).sort()).toEqual(['fresh', 'old']);
  });
});
