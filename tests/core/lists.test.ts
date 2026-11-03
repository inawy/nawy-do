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
  newTaskDefaults,
  planListMove,
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
  const T = '2026-11-01';
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
    expect(tasksIn(tasks, lists, 'main', T).map((t) => t.id)).toEqual(['m1', 'orphan']);
    expect(tasksIn(tasks, lists, listSelection('L1'), T).map((t) => t.id)).toEqual(['w1', 'w2']);
    expect(tasksIn(tasks, lists, 'starred', T).map((t) => t.id)).toEqual(['w2']);
    expect(tasksIn(tasks, lists, 'scheduled', T)).toHaveLength(5);
    expect(groupIn(tasks, lists, listSelection('L2'), T).open.map((t) => t.id)).toEqual(['h1']);
  });

  it('counts per list, with orphans counted in main', () => {
    expect(countsFor(tasks, lists, T)).toEqual({
      main: 2,
      today: 1,
      starred: 1,
      scheduled: 1,
      lists: { L1: 2, L2: 1 },
    });
  });
});

describe('the today view', () => {
  const T = '2026-11-01';
  const make = (id: string, due: string | undefined, done = false) => {
    const t = inList(id, undefined, due === undefined ? {} : { due });
    return done ? { ...t, status: 'done' as const } : t;
  };
  const tasks = [
    make('late', '2026-10-30'),
    make('now', T),
    make('later', '2026-11-02'),
    make('none', undefined),
    make('doneToday', T, true),
    make('doneOld', '2026-10-30', true),
  ];

  it('shows open overdue and due-today tasks, and what was done today', () => {
    expect(tasksIn(tasks, [], 'today', T).map((t) => t.id)).toEqual(['late', 'now', 'doneToday']);
  });

  it('counts only open overdue and due-today tasks', () => {
    expect(countsFor(tasks, [], T).today).toBe(2);
  });

  it('gives a new task today as its date', () => {
    expect(newTaskDefaults('today', T)).toEqual({ due: T });
  });
});

describe('planListMove', () => {
  const A = createList('A', 'أ', 100);
  const B = createList('B', 'ب', 200);
  const C = createList('C', 'ج', 300);
  const order = (lists: (typeof A)[], changes: { id: string; sortOrder: number }[]) =>
    liveLists(
      lists.map((l) => {
        const c = changes.find((x) => x.id === l.id);
        return c ? { ...l, sortOrder: c.sortOrder } : l;
      }),
    ).map((l) => l.id);

  it('swaps two neighbours and touches only them', () => {
    const changes = planListMove([A, B, C], 'B', -1);
    expect(changes).toHaveLength(2);
    expect(order([A, B, C], changes)).toEqual(['B', 'A', 'C']);
    expect(order([A, B, C], planListMove([A, B, C], 'B', 1))).toEqual(['A', 'C', 'B']);
  });

  it('does nothing at the ends or for an unknown id', () => {
    expect(planListMove([A, B], 'A', -1)).toEqual([]);
    expect(planListMove([A, B], 'B', 1)).toEqual([]);
    expect(planListMove([A, B], 'Z', 1)).toEqual([]);
  });

  it('renumbers the whole list when two share a sortOrder', () => {
    const tie = { ...B, sortOrder: 100 };
    const changes = planListMove([A, tie, C], 'B', -1);
    expect(changes).toHaveLength(3);
    expect(order([A, tie, C], changes)).toEqual(['B', 'A', 'C']);
  });
});
