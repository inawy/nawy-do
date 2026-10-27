import { describe, expect, it } from 'vitest';
import { createTask, mergeTask, mergeTasks, tombstoneTask, updateTask } from '@/core/model';

const base = createTask('a', 'x', 100);

describe('merge', () => {
  it('the newer updatedAt wins, in either order', () => {
    const newer = updateTask(base, { title: 'new' }, 200);
    expect(mergeTask(base, newer)).toBe(newer);
    expect(mergeTask(newer, base)).toBe(newer);
  });

  it('a tombstone beats an edit with the same updatedAt', () => {
    const edit = { ...base, title: 'edit', updatedAt: 200 };
    const dead = { ...tombstoneTask(base, 200), updatedAt: 200, deletedAt: 200 };
    expect(mergeTask(edit, dead)).toBe(dead);
    expect(mergeTask(dead, edit)).toBe(dead);
  });

  it('ties between live edits do not depend on argument order', () => {
    const x = { ...base, title: 'x', updatedAt: 200 };
    const y = { ...base, title: 'y', updatedAt: 200 };
    expect(mergeTask(x, y)).toEqual(mergeTask(y, x));
  });

  it('merges lists by id: commutative and idempotent', () => {
    const l = [base, createTask('b', 'b', 150)];
    const r = [updateTask(base, { title: 'z' }, 300), createTask('c', 'c', 160)];
    const lr = mergeTasks(l, r);
    expect(lr.map((t) => t.id).sort()).toEqual(['a', 'b', 'c']);
    expect(lr.find((t) => t.id === 'a')?.title).toBe('z');
    expect(mergeTasks(r, l)).toEqual(lr);
    expect(mergeTasks(lr, lr)).toEqual(lr);
  });

  it('a deleted task is not resurrected by an older copy', () => {
    const dead = tombstoneTask(base, 500);
    const merged = mergeTasks([dead], [base]);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.deletedAt).toBe(dead.deletedAt);
  });
});
