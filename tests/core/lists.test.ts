import { describe, expect, it } from 'vitest';
import {
  cleanListName,
  countsFor,
  createList,
  createTask,
  groupIn,
  listOf,
  liveLists,
  listSelection,
  mergeRecord,
  mergeRecords,
  renameList,
  restoreList,
  selectedListId,
  tasksIn,
  tombstoneList,
  updateTask,
  type Task,
} from '@/core/model';

const L1 = createList('L1', 'العمل', 100);
const L2 = createList('L2', 'البيت', 200);
const inList = (id: string, listId?: string, extra: Partial<Task> = {}): Task => {
  const t = { ...createTask(id, id, 1), ...extra };
  return listId ? { ...t, listId } : t;
};

describe('lists', () => {
  it('creates with a trimmed, capped name and renames (an empty name is ignored)', () => {
    expect(createList('x', '  عمل  ', 5).name).toBe('عمل');
    expect(cleanListName('a'.repeat(500))).toHaveLength(100);
    expect(renameList(L1, '  شغل ', 300)).toMatchObject({ name: 'شغل', updatedAt: 300 });
    expect(renameList(L1, '   ', 300).name).toBe('العمل');
    expect(renameList(L1, 'x', 50).updatedAt).toBe(101); // strictly increasing
  });

  it('a tombstone keeps no name and a restore wins over it', () => {
    const dead = tombstoneList(L1, 150);
    expect(dead).toMatchObject({ name: '', deletedAt: 150 });
    const back = restoreList(L1, dead, 120);
    expect(back.name).toBe('العمل');
    expect(back.deletedAt).toBeUndefined();
    expect(mergeRecord(dead, back)).toBe(back);
  });

  it('liveLists hides tombstones and orders oldest first', () => {
    expect(liveLists([L2, tombstoneList(createList('Z', 'z', 1), 9), L1]).map((l) => l.id)).toEqual(
      ['L1', 'L2'],
    );
  });

  it('merges list records like tasks: commutative, idempotent, delete wins a tie', () => {
    const renamed = renameList(L1, 'جديد', 500);
    expect(mergeRecords([L1], [renamed])).toEqual([renamed]);
    expect(mergeRecords([renamed], [L1])).toEqual([renamed]);
    const edit = { ...L1, name: 'e', updatedAt: 700 };
    const dead = { ...tombstoneList(L1, 700), updatedAt: 700, deletedAt: 700 };
    expect(mergeRecord(edit, dead)).toBe(dead);
    expect(mergeRecord(dead, edit)).toBe(dead);
  });
});

describe('which list a task is in', () => {
  it('uses listId only while that list is alive', () => {
    const t = inList('a', 'L1');
    expect(listOf(t, [L1, L2])).toBe('L1');
    expect(listOf(t, [tombstoneList(L1, 5), L2])).toBeUndefined(); // deleted → main
    expect(listOf(t, [])).toBeUndefined(); // unknown → main
    expect(listOf(inList('b'), [L1])).toBeUndefined();
  });

  it('tasks come back to their list when the delete is undone', () => {
    const t = inList('a', 'L1');
    const dead = tombstoneList(L1, 5);
    expect(listOf(t, [dead])).toBeUndefined();
    expect(listOf(t, [restoreList(L1, dead, 6)])).toBe('L1');
  });

  it('updateTask moves a task between lists and back to main', () => {
    const t = updateTask(createTask('a', 'a', 1), { listId: 'L2' }, 5);
    expect(t.listId).toBe('L2');
    expect('listId' in updateTask(t, { listId: '' }, 6)).toBe(false);
  });
});

describe('selection', () => {
  const tasks = [
    inList('m1'),
    inList('w1', 'L1'),
    inList('w2', 'L1', { starred: true }),
    inList('h1', 'L2', { due: '2026-11-01' }),
    inList('orphan', 'GONE'),
  ];
  const lists = [L1, L2];

  it('parses and builds list selections', () => {
    expect(selectedListId(listSelection('L1'))).toBe('L1');
    expect(selectedListId('main')).toBeUndefined();
    expect(selectedListId('starred')).toBeUndefined();
  });

  it('shows each list its own tasks, and main also the orphans', () => {
    expect(tasksIn(tasks, lists, 'main').map((t) => t.id)).toEqual(['m1', 'orphan']);
    expect(tasksIn(tasks, lists, listSelection('L1')).map((t) => t.id)).toEqual(['w1', 'w2']);
    expect(tasksIn(tasks, lists, 'starred').map((t) => t.id)).toEqual(['w2']);
    expect(tasksIn(tasks, lists, 'scheduled')).toHaveLength(5);
    expect(groupIn(tasks, lists, listSelection('L2')).open.map((t) => t.id)).toEqual(['h1']);
  });

  it('counts per list, with orphans counted in main', () => {
    expect(countsFor(tasks, lists)).toEqual({
      main: 2,
      starred: 1,
      scheduled: 1,
      lists: { L1: 2, L2: 1 },
    });
  });
});
