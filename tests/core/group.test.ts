import { describe, expect, it } from 'vitest';
import { completeTask, createTask, groupTasks, restoreTask, tombstoneTask } from '@/core/model';

describe('groupTasks', () => {
  it('puts newer open tasks first and hides tombstones', () => {
    const a = createTask('a', 'a', 100);
    const b = createTask('b', 'b', 200);
    const dead = tombstoneTask(createTask('c', 'c', 300), 400);
    expect(groupTasks([a, b, dead]).open.map((t) => t.id)).toEqual(['b', 'a']);
  });
  it('orders done tasks by completion time, newest first', () => {
    const a = completeTask(createTask('a', 'a', 100), 500);
    const b = completeTask(createTask('b', 'b', 100), 600);
    const g = groupTasks([a, b, createTask('c', 'c', 1)]);
    expect(g.done.map((t) => t.id)).toEqual(['b', 'a']);
    expect(g.open.map((t) => t.id)).toEqual(['c']);
  });
});

describe('restoreTask', () => {
  it('brings the content back, newer than the tombstone, and live again', () => {
    const t = createTask('a', 'x', 100);
    const dead = tombstoneTask(t, 200);
    const back = restoreTask(t, dead, 150);
    expect(back.title).toBe('x');
    expect(back.deletedAt).toBeUndefined();
    expect(back.updatedAt).toBeGreaterThan(dead.updatedAt);
  });
});
