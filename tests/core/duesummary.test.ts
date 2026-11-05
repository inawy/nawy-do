import { describe, expect, it } from 'vitest';
import { createTask, dueSummary, type Task } from '@/core/model';

const make = (id: string, patch: Partial<Task>): Task => ({ ...createTask(id, id, 1), ...patch });

describe('dueSummary', () => {
  it('counts open overdue and today tasks only', () => {
    const tasks = [
      make('late', { due: '2026-11-01' }),
      make('now', { due: '2026-11-05' }),
      make('now2', { due: '2026-11-05' }),
      make('later', { due: '2026-11-09' }),
      make('none', {}),
      make('done', { due: '2026-11-01', status: 'done' }),
      make('gone', { due: '2026-11-01', deletedAt: 9 }),
    ];
    expect(dueSummary(tasks, '2026-11-05')).toEqual({ overdue: 1, today: 2 });
  });
});
