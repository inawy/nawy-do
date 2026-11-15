import { describe, expect, it } from 'vitest';
import { createTask, taskToIcs, updateTask } from '@/core/model';

const base = createTask('t1', 'اشتري خبز, ولبن', 1);

describe('taskToIcs', () => {
  it('has nothing for a task without a date', () => {
    expect(taskToIcs(base, 0)).toBeUndefined();
  });

  it('an all-day task rings at 09:00 and escapes text', () => {
    const t = updateTask(base, { due: '2026-11-20', notes: 'سطر\nتاني' }, 2);
    const s = taskToIcs(t, Date.UTC(2026, 10, 15, 17, 0, 0)) ?? '';
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
    const s = taskToIcs(t, 0) ?? '';
    expect(s).toContain('DTSTART:20261120T143000');
    expect(s).toContain('RRULE:FREQ=WEEKLY;INTERVAL=2');
    expect(s).toContain('TRIGGER;RELATED=START:PT0S');
  });

  it('folds long lines at 75 octets', () => {
    const t = updateTask(base, { due: '2026-11-20', title: 'ا'.repeat(200) }, 2);
    for (const line of (taskToIcs(t, 0) ?? '').split('\r\n')) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
  });
});
