import { describe, expect, it } from 'vitest';
import {
  completeTask,
  createTask,
  isDeleted,
  nextUpdatedAt,
  reopenTask,
  tombstoneTask,
  updateTask,
} from '@/core/model';

describe('task model', () => {
  it('creates an open task with a trimmed title', () => {
    const t = createTask('a', '  اشتري خبز  ', 100);
    expect(t).toMatchObject({ id: 'a', title: 'اشتري خبز', status: 'open', updatedAt: 100 });
  });

  it('updatedAt is strictly increasing even with the same or an earlier clock', () => {
    expect(nextUpdatedAt(100, 100)).toBe(101);
    expect(nextUpdatedAt(100, 50)).toBe(101);
    expect(nextUpdatedAt(100, 500)).toBe(500);
  });

  it('completes and reopens', () => {
    const t = createTask('a', 'x', 100);
    const done = completeTask(t, 200);
    expect(done).toMatchObject({ status: 'done', doneAt: 200, updatedAt: 200 });
    expect(completeTask(done, 300)).toBe(done);
    const back = reopenTask(done, 300);
    expect(back.status).toBe('open');
    expect('doneAt' in back).toBe(false);
    expect(reopenTask(t, 300)).toBe(t);
  });

  it('updates fields and trims the title', () => {
    const t = updateTask(createTask('a', 'x', 100), { title: ' y ', due: '2026-11-01' }, 100);
    expect(t).toMatchObject({ title: 'y', due: '2026-11-01', updatedAt: 101 });
  });

  it('a tombstone keeps no content', () => {
    const t = updateTask(createTask('a', 'سر', 100), { notes: 'خاص' }, 110);
    const dead = tombstoneTask(t, 120);
    expect(isDeleted(dead)).toBe(true);
    expect(dead.title).toBe('');
    expect(dead.notes).toBeUndefined();
    expect(dead.deletedAt).toBe(dead.updatedAt);
  });
});
