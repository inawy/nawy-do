import { describe, expect, it } from 'vitest';
import {
  countsFor,
  createTask,
  groupTasks,
  listSelection,
  planMove,
  searchTasks,
  sortOpen,
  tasksIn,
  type Task,
  type TaskList,
} from '@/core/model';

// A guard against accidental O(n²): generous budgets, 5 000 tasks, 10 lists, a fifth deleted.
const N = 5000;
const lists: TaskList[] = Array.from({ length: 10 }, (_, i) => ({
  id: `l${i}`,
  name: `قائمة ${i}`,
  sortOrder: i,
  createdAt: 1,
  updatedAt: 1,
}));
const tasks: Task[] = Array.from({ length: N }, (_, i) => {
  const t = createTask(`t${i}`, `نية رقم ${i} للبحث`, 1000 + i, i);
  return {
    ...t,
    listId: `l${i % 11}`, // l10 does not exist: an orphan
    status: i % 3 === 0 ? 'done' : 'open',
    due: i % 4 === 0 ? `2026-11-${String((i % 28) + 1).padStart(2, '0')}` : undefined,
    starred: i % 7 === 0,
    deletedAt: i % 5 === 0 ? 5000 : undefined,
  } as Task;
});

const timed = (fn: () => unknown): number => {
  const start = performance.now();
  fn();
  return performance.now() - start;
};

describe(`${N} tasks`, () => {
  it('every derivation stays well under a frame budget', () => {
    const open = groupTasks(tasks).open;
    const budgets: [string, () => unknown][] = [
      ['groupTasks', () => groupTasks(tasks)],
      ['tasksIn list', () => tasksIn(tasks, lists, listSelection('l3'), '2026-11-05')],
      ['tasksIn today', () => tasksIn(tasks, lists, 'today', '2026-11-05')],
      ['countsFor', () => countsFor(tasks, lists, '2026-11-05')],
      ['sortOpen', () => sortOpen(open, 'title')],
      ['searchTasks', () => searchTasks(tasks, 'نيه رقم 49')],
      ['planMove', () => planMove(open, open[open.length - 1]?.id ?? '', 0)],
    ];
    for (const [name, fn] of budgets) {
      fn(); // warm up
      const ms = timed(fn);
      expect(ms, `${name} took ${ms.toFixed(1)} ms`).toBeLessThan(250);
    }
  });
});
