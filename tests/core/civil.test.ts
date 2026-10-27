import { describe, expect, it } from 'vitest';
import {
  createTask,
  daysFromCivil,
  dueState,
  formatDue,
  groupScheduled,
  isCivilDate,
  updateTask,
} from '@/core/model';

describe('civil dates', () => {
  it('validates real calendar dates only', () => {
    expect(isCivilDate('2026-10-27')).toBe(true);
    expect(isCivilDate('2024-02-29')).toBe(true);
    expect(isCivilDate('2026-02-29')).toBe(false);
    expect(isCivilDate('2026-02-31')).toBe(false);
    expect(isCivilDate('2026-13-01')).toBe(false);
    expect(isCivilDate('2026-1-1')).toBe(false);
  });
  it('counts days correctly across month, year and leap boundaries', () => {
    expect(daysFromCivil('1970-01-01')).toBe(0);
    expect(daysFromCivil('2000-03-01')! - daysFromCivil('2000-02-28')!).toBe(2);
    expect(daysFromCivil('2027-01-01')! - daysFromCivil('2026-12-31')!).toBe(1);
    expect(daysFromCivil('2026-03-01')! - daysFromCivil('2026-02-28')!).toBe(1);
  });
  it('classifies and labels due dates', () => {
    const today = '2026-10-27';
    expect(dueState('2026-10-26', today)).toBe('overdue');
    expect(dueState('2026-10-27', today)).toBe('today');
    expect(dueState('2026-10-28', today)).toBe('upcoming');
    expect(formatDue('2026-10-27', today)).toBe('النهارده');
    expect(formatDue('2026-10-28', today)).toBe('بكرة');
    expect(formatDue('2026-10-26', today)).toBe('امبارح');
    expect(formatDue('2026-11-05', today)).toBe('5 نوفمبر');
    expect(formatDue('2027-01-05', today)).toBe('5 يناير 2027');
    expect(formatDue('2026-12-31', '2027-01-01')).toBe('امبارح');
  });
});

describe('updateTask rules', () => {
  const t = updateTask(createTask('a', 'x', 100), { due: '2026-11-01', notes: 'n' }, 110);
  it('ignores an empty title and an invalid date', () => {
    const u = updateTask(t, { title: '   ', due: '2026-02-31' }, 120);
    expect(u.title).toBe('x');
    expect(u.due).toBe('2026-11-01');
  });
  it('removes notes and due when cleared', () => {
    const u = updateTask(t, { notes: '', due: '' }, 120);
    expect('notes' in u).toBe(false);
    expect('due' in u).toBe(false);
  });
  it('an invalid date on a task without one adds none', () => {
    const u = updateTask(createTask('b', 'y', 1), { due: 'nope' }, 2);
    expect('due' in u).toBe(false);
  });
});

describe('groupScheduled', () => {
  it('splits open dated tasks and sorts by date', () => {
    const mk = (id: string, due?: string) => {
      const base = createTask(id, id, 1);
      return due ? { ...base, due } : base;
    };
    const g = groupScheduled(
      [
        mk('a', '2026-10-30'),
        mk('b', '2026-10-27'),
        mk('c', '2026-10-20'),
        mk('d'),
        mk('e', '2026-10-28'),
      ],
      '2026-10-27',
    );
    expect(g.overdue.map((t) => t.id)).toEqual(['c']);
    expect(g.today.map((t) => t.id)).toEqual(['b']);
    expect(g.upcoming.map((t) => t.id)).toEqual(['e', 'a']);
  });
});
