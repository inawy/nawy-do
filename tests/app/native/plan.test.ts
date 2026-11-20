import { describe, expect, it } from 'vitest';
import type { Task } from '@/core/model';
import { localTimeMs } from '@/app/clock';
import { alertId, planAlerts } from '@/app/native/plan';

const base = { status: 'open', title: 'مهمة', notes: '' } as unknown as Task;
const task = (id: string, due: string | undefined, dueTime?: string, extra: object = {}): Task =>
  ({ ...base, id, due, dueTime, ...extra }) as Task;
const now = localTimeMs('2026-11-20', '10:00');

describe('planAlerts', () => {
  it('plans open tasks with a set time, soonest first', () => {
    const r = planAlerts([task('b', '2026-11-22', '09:00'), task('a', '2026-11-20', '11:00')], now);
    expect(r.map((x) => x.taskId)).toEqual(['a', 'b']);
  });
  it('subtracts the lead time', () => {
    const r = planAlerts([task('a', '2026-11-20', '11:00', { remindBefore: 30 })], now);
    expect(r[0]?.atMs).toBe(localTimeMs('2026-11-20', '10:30'));
  });
  it('skips done, undated, timeless, past and too-far tasks', () => {
    const r = planAlerts(
      [
        task('d', '2026-11-20', '11:00', { status: 'done' }),
        task('n', undefined),
        task('t', '2026-11-20'),
        task('p', '2026-11-20', '09:00'),
        task('f', '2026-12-30', '09:00'),
      ],
      now,
    );
    expect(r).toEqual([]);
  });
  it('keeps at most 60', () => {
    const many = Array.from({ length: 80 }, (_, i) => task(`t${i}`, '2026-11-21', '09:00'));
    expect(planAlerts(many, now)).toHaveLength(60);
  });
});

describe('alertId', () => {
  it('is stable, positive and 31-bit', () => {
    const id = alertId('abc', 123456789);
    expect(id).toBe(alertId('abc', 123456789));
    expect(id).toBeGreaterThan(0);
    expect(id).toBeLessThanOrEqual(0x7fffffff);
    expect(id).not.toBe(alertId('abc', 123456790));
  });
});
