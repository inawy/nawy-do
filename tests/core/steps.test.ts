import { describe, expect, it } from 'vitest';
import {
  cleanSteps,
  createTask,
  MAX_STEPS,
  parseTask,
  restoreTask,
  stepProgress,
  tombstoneTask,
  updateTask,
} from '@/core/model';

const st = (id: string, title: string, done = false) => ({ id, title, done });
const base = createTask('a', 'x', 100);

describe('steps', () => {
  it('cleans titles, empty ones, duplicate ids and the count', () => {
    expect(cleanSteps([st('1', ' a '), st('2', '  '), st('1', 'dup')])).toEqual([st('1', 'a')]);
    const many = Array.from({ length: MAX_STEPS + 5 }, (_, i) => st(String(i), `s${i}`));
    expect(cleanSteps(many)).toHaveLength(MAX_STEPS);
  });
  it('updateTask sets, replaces and removes steps', () => {
    const t = updateTask(base, { steps: [st('1', 'a'), st('2', 'b', true)] }, 110);
    expect(stepProgress(t)).toEqual({ done: 1, total: 2 });
    expect(updateTask(t, { due: '2026-11-01' }, 120).steps).toHaveLength(2);
    const none = updateTask(t, { steps: [] }, 130);
    expect('steps' in none).toBe(false);
    expect(stepProgress(none)).toBeUndefined();
  });
  it('a tombstone drops the steps and a restore brings them back', () => {
    const t = updateTask(base, { steps: [st('1', 'a')] }, 110);
    const dead = tombstoneTask(t, 120);
    expect('steps' in dead).toBe(false);
    expect(restoreTask(t, dead, 130).steps).toEqual([st('1', 'a')]);
  });
  it('parseTask accepts valid steps and rejects bad ones', () => {
    const ok = parseTask({ ...base, steps: [st('1', 'a')] });
    expect(ok.ok && ok.value.steps).toEqual([st('1', 'a')]);
    for (const steps of [
      'x',
      [st('1', 'a'), st('1', 'b')],
      [{ id: '1', title: 5, done: false }],
      [{ id: '1', title: 'a' }],
      Array.from({ length: MAX_STEPS + 1 }, (_, i) => st(String(i), 'a')),
    ]) {
      const r = parseTask({ ...base, steps });
      expect(!r.ok && r.error).toBe('steps');
    }
  });
});
