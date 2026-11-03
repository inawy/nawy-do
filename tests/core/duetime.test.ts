import { describe, expect, it } from 'vitest';
import {
  createTask,
  formatTime,
  groupScheduled,
  isCivilTime,
  parseTask,
  sortOpen,
  updateTask,
  type Task,
} from '@/core/model';

const dated = (id: string, due: string, dueTime?: string): Task => ({
  ...createTask(id, id, 1),
  due,
  ...(dueTime ? { dueTime } : {}),
});

describe('time of day', () => {
  it('accepts 24 h HH:MM only', () => {
    for (const ok of ['00:00', '09:05', '12:00', '23:59']) expect(isCivilTime(ok)).toBe(true);
    for (const bad of ['24:00', '9:05', '12:60', '12:5', '', 'ab:cd', '12:00:00']) {
      expect(isCivilTime(bad)).toBe(false);
    }
  });
  it('shows a 12 h time with ص / م', () => {
    expect(formatTime('00:15')).toBe('12:15 ص');
    expect(formatTime('09:30')).toBe('9:30 ص');
    expect(formatTime('12:00')).toBe('12:00 م');
    expect(formatTime('21:30')).toBe('9:30 م');
    expect(formatTime('nope')).toBe('nope');
  });
});

describe('updateTask with dueTime', () => {
  const t = dated('a', '2026-11-03');
  it('sets, replaces and clears it; ignores an invalid one', () => {
    const on = updateTask(t, { dueTime: '09:30' }, 200);
    expect(on.dueTime).toBe('09:30');
    expect(updateTask(on, { dueTime: '25:00' }, 300).dueTime).toBe('09:30');
    expect(updateTask(t, { dueTime: '25:00' }, 300).dueTime).toBeUndefined();
    expect(updateTask(on, { dueTime: '' }, 300).dueTime).toBeUndefined();
  });
  it('is dropped with the date', () => {
    const on = updateTask(t, { dueTime: '09:30' }, 200);
    expect(updateTask(on, { due: '' }, 300).dueTime).toBeUndefined();
  });
});

describe('parseTask with dueTime', () => {
  const base = dated('a', '2026-11-03');
  it('accepts a valid time with a date; refuses a bad one or one without a date', () => {
    const r = parseTask({ ...base, dueTime: '07:45' });
    expect(r.ok && r.value.dueTime).toBe('07:45');
    expect(parseTask({ ...base, dueTime: '7:45' })).toEqual({ ok: false, error: 'dueTime' });
    expect(parseTask({ ...createTask('b', 'b', 1), dueTime: '07:45' })).toEqual({
      ok: false,
      error: 'dueTime',
    });
  });
});

describe('ordering with times', () => {
  const list = [
    dated('late', '2026-11-03', '18:00'),
    dated('allday', '2026-11-03'),
    dated('early', '2026-11-03', '08:00'),
    dated('next', '2026-11-04', '06:00'),
  ];
  it('scheduled groups: same day all-day first, then by time', () => {
    const g = groupScheduled(list, '2026-11-03');
    expect(g.today.map((t) => t.id)).toEqual(['allday', 'early', 'late']);
  });
  it('sort by date uses the time within a day', () => {
    expect(sortOpen(list, 'date').map((t) => t.id)).toEqual(['allday', 'early', 'late', 'next']);
  });
});
