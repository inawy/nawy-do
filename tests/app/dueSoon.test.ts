import { describe, expect, it } from 'vitest';
import { createTask, updateTask } from '@/core/model';
import { localTimeMs } from '@/app/clock';
import { dueSoon } from '@/app/useDueAlerts';

const at = localTimeMs('2026-11-16', '10:00');
const task = (due: string, dueTime?: string, done = false) => {
  const t = updateTask(createTask('a', 'x', 1), { due, ...(dueTime ? { dueTime } : {}) }, 2);
  return done ? { ...t, status: 'done' as const } : t;
};

describe('dueSoon', () => {
  it('picks timed open tasks in the next 24 hours, with the wait', () => {
    const r = dueSoon([task('2026-11-16', '10:30')], at);
    expect(r).toHaveLength(1);
    expect(r[0]?.delay).toBe(30 * 60 * 1000);
  });

  it('rings a minute that has just passed right away, not older ones', () => {
    expect(dueSoon([task('2026-11-16', '09:59')], at)[0]?.delay).toBe(0);
    expect(dueSoon([task('2026-11-16', '09:00')], at)).toHaveLength(0);
  });

  it('skips tasks with no time, done ones and the far future', () => {
    expect(dueSoon([task('2026-11-16')], at)).toHaveLength(0);
    expect(dueSoon([task('2026-11-16', '11:00', true)], at)).toHaveLength(0);
    expect(dueSoon([task('2026-11-18', '11:00')], at)).toHaveLength(0);
  });
});

describe('dueSoon with a lead time', () => {
  it('rings that many minutes early', () => {
    const t = updateTask(
      createTask('a', 'x', 1),
      { due: '2026-11-16', dueTime: '10:30', remindBefore: 15 },
      2,
    );
    expect(dueSoon([t], at)[0]?.delay).toBe(15 * 60 * 1000);
  });
});
