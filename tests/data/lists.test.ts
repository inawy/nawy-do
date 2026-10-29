import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { beforeEach, describe, expect, it } from 'vitest';
import { createList, MAX_LISTS, parseEnvelope, planListMove, tombstoneList } from '@/core/model';
import {
  addList,
  addTask,
  allLists,
  allRecords,
  applyLists,
  createDb,
  exportBackup,
  importBackup,
  listLists,
  listSnapshots,
  listTasks,
  purgeTombstones,
  saveListOrder,
  removeList,
  renameListById,
  restoreRemovedList,
  snapshotBeforeUpgrade,
  TOMBSTONE_TTL_MS,
  type NawyDoDb,
} from '@/data';

let db: NawyDoDb;
let n = 0;
beforeEach(() => {
  db = createDb(`lists-${n++}`);
});

describe('lists store', () => {
  it('adds lists in order, even within one millisecond', async () => {
    await addList(db, 'a', 'أ', 100);
    await addList(db, 'b', 'ب', 100);
    await addList(db, 'c', 'ج', 50); // a clock that stepped back
    expect((await listLists(db)).map((l) => l.id)).toEqual(['a', 'b', 'c']);
  });

  it('refuses an empty name and the 51st list', async () => {
    expect(await addList(db, 'x', '   ', 1)).toEqual({ ok: false, reason: 'empty' });
    for (let i = 0; i < MAX_LISTS; i++) await addList(db, `l${i}`, `n${i}`, i + 1);
    expect(await addList(db, 'extra', 'x', 999)).toEqual({ ok: false, reason: 'limit' });
  });

  it('renames, deletes with a tombstone, and undo restores', async () => {
    const added = await addList(db, 'a', 'العمل', 100);
    expect((await renameListById(db, 'a', 'شغل', 200))?.name).toBe('شغل');
    const dead = await removeList(db, 'a', 300);
    expect(dead).toMatchObject({ name: '', deletedAt: 300 });
    expect(await listLists(db)).toEqual([]);
    expect(await renameListById(db, 'a', 'x', 400)).toBeUndefined();
    const prev = added.ok ? { ...added.list, name: 'شغل' } : undefined;
    if (!prev) throw new Error('add failed');
    expect((await restoreRemovedList(db, prev, 500))?.name).toBe('شغل');
    expect(await restoreRemovedList(db, prev, 600)).toBeUndefined(); // not deleted any more
  });

  it('deleting a list leaves its tasks untouched (they show in main by rule)', async () => {
    await addList(db, 'a', 'العمل', 100);
    const t = await addTask(db, 't', 'مهمة', 110, { listId: 'a' });
    await removeList(db, 'a', 300);
    expect((await listTasks(db))[0]).toMatchObject({ id: t.id, listId: 'a' });
  });

  it('addTask takes list, star and due options', async () => {
    const t = await addTask(db, 't', 'x', 1, { listId: 'L', starred: true, due: '2026-11-01' });
    expect(t).toMatchObject({ listId: 'L', starred: true, due: '2026-11-01' });
    expect(await db.tasks.where('listId').equals('L').count()).toBe(1);
  });

  it('merging an older list copy never resurrects a deleted list', async () => {
    const a = await addList(db, 'a', 'x', 100);
    await removeList(db, 'a', 200);
    expect(await applyLists(db, a.ok ? [a.list] : [])).toBe(0);
    expect(await listLists(db)).toEqual([]);
  });

  it('purge removes only expired tombstones, lists included', async () => {
    await db.lists.bulkPut([
      tombstoneList(createList('old', 'x', 1), 10),
      tombstoneList(createList('fresh', 'y', 1), TOMBSTONE_TTL_MS),
      createList('live', 'z', 1),
    ]);
    expect(await purgeTombstones(db, TOMBSTONE_TTL_MS + 20)).toBe(1);
    expect((await allLists(db)).map((l) => l.id).sort()).toEqual(['fresh', 'live']);
  });
});

describe('backup with lists', () => {
  it('exports and imports lists and tasks together, lists first', async () => {
    await addList(db, 'a', 'العمل', 100);
    await addTask(db, 't', 'مهمة', 110, { listId: 'a' });
    const file = await exportBackup(db, 999);
    const other = createDb(`lists-${n++}`);
    const r = await importBackup(other, file);
    expect(r).toEqual({ ok: true, value: { total: 1, changed: 1, lists: 1, listsChanged: 1 } });
    expect((await listLists(other)).map((l) => l.name)).toEqual(['العمل']);
    expect((await allRecords(other))[0]?.listId).toBe('a');
  });
});

describe('real upgrade from schema v1', () => {
  const v1Name = () => `upgrade-${n++}`;
  const makeV1 = async (name: string) => {
    const old = new Dexie(name);
    old.version(1).stores({ tasks: 'id, status, due, sortOrder, updatedAt' });
    await old.table('tasks').bulkAdd([
      {
        id: 'a',
        title: 'قديمة',
        status: 'open',
        starred: false,
        sortOrder: 1,
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: 'b',
        title: 'منجزة',
        status: 'done',
        starred: true,
        sortOrder: 2,
        createdAt: 1,
        updatedAt: 2,
        doneAt: 2,
      },
    ]);
    old.close();
  };

  it('keeps every task, adds the lists store and the listId index', async () => {
    const name = v1Name();
    await makeV1(name);
    const upgraded = createDb(name); // schema v2
    expect((await listTasks(upgraded)).map((t) => t.id)).toEqual(['a', 'b']);
    expect(await upgraded.lists.count()).toBe(0);
    await addList(upgraded, 'L', 'قائمة', 10);
    await upgraded.tasks.update('a', { listId: 'L' });
    expect((await upgraded.tasks.where('listId').equals('L').toArray()).map((t) => t.id)).toEqual([
      'a',
    ]);
    upgraded.close();
  });

  it('takes a restorable safety copy first, once, and only for an older database', async () => {
    const name = v1Name();
    const snaps = `snaps-${n++}`;
    expect(await snapshotBeforeUpgrade(name, 5, snaps)).toBe('none'); // no database yet
    await makeV1(name);
    expect(await snapshotBeforeUpgrade(name, 10, snaps)).toBe('saved');
    const [snap] = await listSnapshots(snaps);
    expect(snap).toMatchObject({ createdAt: 10, fromVersion: 1 });
    const restored = parseEnvelope(snap?.json ?? '');
    expect(restored.ok && restored.value.tasks.map((t) => t.id)).toEqual(['a', 'b']);
    expect(restored.ok && restored.value.lists).toEqual([]);

    const up = createDb(name); // upgrade to v2 by really opening it
    await up.tasks.count();
    up.close();
    expect(await snapshotBeforeUpgrade(name, 20, snaps)).toBe('none'); // already current
    expect(await listSnapshots(snaps)).toHaveLength(1);
  });

  it('keeps only the last three safety copies', async () => {
    const snaps = `snaps-${n++}`;
    for (let i = 1; i <= 5; i++) {
      const name = v1Name();
      await makeV1(name);
      await snapshotBeforeUpgrade(name, i, snaps);
    }
    expect((await listSnapshots(snaps)).map((s) => s.createdAt)).toEqual([5, 4, 3]);
  });
});

describe('saveListOrder', () => {
  it('reorders live lists and bumps their updatedAt', async () => {
    await addList(db, 'A', 'أ', 1000);
    await addList(db, 'B', 'ب', 2000);
    const before = await listLists(db);
    await saveListOrder(db, planListMove(before, 'B', -1), 3000);
    const after = await listLists(db);
    expect(after.map((l) => l.id)).toEqual(['B', 'A']);
    expect(after.every((l) => l.updatedAt >= 3000)).toBe(true);
  });

  it('skips a list that was deleted meanwhile', async () => {
    await addList(db, 'A', 'أ', 1000);
    await removeList(db, 'A', 2000);
    expect(await saveListOrder(db, [{ id: 'A', sortOrder: 5 }], 3000)).toBe(0);
  });
});
