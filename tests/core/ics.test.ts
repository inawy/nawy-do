import { describe, expect, it } from 'vitest';
import { createTask, taskToIcs, updateTask } from '@/core/model';

const base = createTask('t1', 'اشتري خبز, ولبن', 1);

describe('taskToIcs', () => {
  it('has nothing for a task without a date', () => {
    expect(taskToIcs(base, 'x')).toBeUndefined();
  });

  it('an all-day task rings at 09:00 and escapes text', () => {
    const t = updateTask(base, { due: '2026-11-20', notes: 'سطر\nتاني' }, 2);
    const s = taskToIcs(t, '20261115T170000Z') ?? '';
    expect(s).toContain('DTSTART;VALUE=DATE:20261120');
    expect(s).toContain('TRIGGER;RELATED=START:PT9H');
    expect(s).toContain('DTSTAMP:20261115T170000Z');
    expect(s.replace(/\r\n /g, '')).toContain('SUMMARY:اشتري خبز\\, ولبن');
    expect(s.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });

  it('a timed repeating task carries the time and the rule', () => {
    const t = updateTask(
      base,
      { due: '2026-11-20', dueTime: '14:30', repeat: 'weekly', repeatEvery: 2 },
      2,
    );
    const s = taskToIcs(t, 'x') ?? '';
    expect(s).toContain('DTSTART:20261120T143000');
    expect(s).toContain('RRULE:FREQ=WEEKLY;INTERVAL=2');
    expect(s).toContain('TRIGGER;RELATED=START:PT0S');
  });

  it('folds long lines at 75 octets', () => {
    const t = updateTask(base, { due: '2026-11-20', title: 'ا'.repeat(200) }, 2);
    for (const line of (taskToIcs(t, 'x') ?? '').split('\r\n')) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
  });
});

describe('taskToIcs repeat end', () => {
  const t = updateTask(base, { due: '2026-11-20', repeat: 'daily' }, 2);
  it('UNTIL in the form of DTSTART, and COUNT', () => {
    expect(taskToIcs(updateTask(t, { repeatUntil: '2026-12-01' }, 3), 'x')).toContain(
      'RRULE:FREQ=DAILY;UNTIL=20261201\r\n',
    );
    const timed = updateTask(t, { dueTime: '09:00', repeatUntil: '2026-12-01' }, 3);
    expect(taskToIcs(timed, 'x')).toContain('UNTIL=20261201T235959');
    expect(taskToIcs(updateTask(t, { repeatTimes: 5 }, 3), 'x')).toContain('COUNT=5');
  });
});

describe('taskToIcs remind before', () => {
  it('rings earlier by the chosen minutes', () => {
    const t = updateTask(base, { due: '2026-11-20', dueTime: '09:00', remindBefore: 30 }, 2);
    expect(taskToIcs(t, 'x')).toContain('TRIGGER;RELATED=START:-PT30M');
  });
});
