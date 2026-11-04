import { describe, expect, it } from 'vitest';
import {
  addMonths,
  completeTask,
  createTask,
  nextDue,
  parseTask,
  reopenTask,
  updateTask,
  type Task,
} from '@/core/model';

const T = '2026-11-03';
const repeating = (due: string, repeat: Task['repeat'], extra: Partial<Task> = {}): Task => ({
  ...createTask('a', 'a', 100),
  due,
  ...(repeat ? { repeat } : {}),
  ...extra,
});

describe('addMonths', () => {
  it('keeps the day, clamps to the end of a shorter month, crosses years', () => {
    expect(addMonths('2026-01-15', 1)).toBe('2026-02-15');
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2028-01-31', 1)).toBe('2028-02-29');
    expect(addMonths('2026-12-10', 1)).toBe('2027-01-10');
    expect(addMonths('2026-03-31', -1)).toBe('2026-02-28');
  });
});

describe('nextDue', () => {
  it('daily and weekly: the first occurrence after both the due date and today', () => {
    expect(nextDue('2026-11-03', 'daily', T)).toBe('2026-11-04'); // due today
    expect(nextDue('2026-11-10', 'daily', T)).toBe('2026-11-11'); // done early: one step on
    expect(nextDue('2026-10-20', 'daily', T)).toBe('2026-11-04'); // missed for days: not seven copies
    expect(nextDue('2026-10-20', 'weekly', T)).toBe('2026-11-10');
    expect(nextDue('2026-11-03', 'weekly', T)).toBe('2026-11-10');
  });
  it('monthly: same day next month, after today', () => {
    expect(nextDue('2026-11-03', 'monthly', T)).toBe('2026-12-03');
    expect(nextDue('2026-08-15', 'monthly', T)).toBe('2026-11-15');
    expect(nextDue('2026-08-03', 'monthly', T)).toBe('2026-12-03'); // 2026-11-03 is not after today
    expect(nextDue('2026-01-31', 'monthly', '2026-01-31')).toBe('2026-02-28');
  });
  it('never returns a date that is not after today', () => {
    for (const repeat of ['daily', 'weekly', 'monthly'] as const) {
      for (const due of ['2020-02-29', '2026-10-31', '2026-11-03', '2026-11-04', '2030-01-01']) {
        const next = nextDue(due, repeat, T);
        expect(next > T).toBe(true);
        expect(next > due).toBe(true);
      }
    }
  });
});

describe('completing a repeating task', () => {
  it('moves the due date, resets the steps, and keeps it open', () => {
    const t = repeating('2026-11-03', 'weekly', {
      steps: [
        { id: 's1', title: 'أ', done: true },
        { id: 's2', title: 'ب', done: false },
      ],
    });
    const next = completeTask(t, 200, T);
    expect(next.status).toBe('open');
    expect(next.due).toBe('2026-11-10');
    expect(next.doneAt).toBeUndefined();
    expect(next.steps?.every((s) => !s.done)).toBe(true);
    expect(next.updatedAt).toBeGreaterThan(t.updatedAt);
  });
  it('completes an ordinary task, and a task with a repeat but no date, as before', () => {
    expect(completeTask(repeating('2026-11-03', undefined), 200, T).status).toBe('done');
    const noDate = { ...createTask('b', 'b', 1), repeat: 'daily' as const };
    expect(completeTask(noDate, 200, T).status).toBe('done');
  });
  it('is idempotent across devices: the same occurrence completed twice lands on the same date', () => {
    const t = repeating('2026-11-03', 'daily');
    expect(completeTask(t, 200, T).due).toBe(completeTask(t, 300, T).due);
  });
  it('reopen leaves a repeating task alone (it is never done)', () => {
    const t = repeating('2026-11-03', 'daily');
    expect(reopenTask(t, 5)).toBe(t);
  });
});

describe('updateTask with repeat', () => {
  it('sets and clears the repetition', () => {
    const t = repeating('2026-11-03', undefined);
    const on = updateTask(t, { repeat: 'weekly' }, 200);
    expect(on.repeat).toBe('weekly');
    expect(updateTask(on, { repeat: '' }, 300).repeat).toBeUndefined();
  });
  it('drops the repetition when the due date is removed', () => {
    const t = repeating('2026-11-03', 'daily');
    expect(updateTask(t, { due: '' }, 200).repeat).toBeUndefined();
  });
});

describe('parseTask with repeat', () => {
  const base = { ...createTask('a', 'a', 100), due: '2026-11-03' };
  it('accepts a known repetition with a due date', () => {
    const r = parseTask({ ...base, repeat: 'monthly' });
    expect(r.ok && r.value.repeat).toBe('monthly');
  });
  it('refuses an unknown one, or one without a date', () => {
    expect(parseTask({ ...base, repeat: 'hourly' })).toEqual({ ok: false, error: 'repeat' });
    const noDue = { ...createTask('a', 'a', 100), repeat: 'daily' };
    expect(parseTask(noDue)).toEqual({ ok: false, error: 'repeat' });
  });
});

describe('the end of the calendar', () => {
  it('never produces a year with five digits', () => {
    expect(addMonths('9999-12-15', 1)).toBe('9999-12-15');
    expect(addMonths('9999-11-30', 3)).toBe('9999-12-30');
  });
});
